// Searching inside one conversation.
//
// WHAT THE CHAT BACKEND ACTUALLY ANSWERS
// `POST /api/v1/channels/channelSearch` on the chat backend answers
// `{ messages_ids, offset }`, and `messages_ids` is **newest first**. Measured
// against staging on 2026-09-20, channel 538, query "gggg":
//
//   "messages_ids": [339277, 339276, 339275, 339274, 339262]
//   "offset": "339262"
//
// Message ids grow over time, so index 0 is the match closest to the bottom of
// the conversation and the last index is the oldest one. Every rule below
// follows from that one fact:
//
//   1. the first jump lands on the NEWEST match — the one nearest where the
//      reader already is, not the oldest one far up the history
//   2. the up arrow walks towards older matches, the down arrow back towards
//      newer ones, and each one turns itself off at its own end of the list
//   3. no matches turns BOTH arrows off
//   4. clearing the box clears the results and stops the spinner
//   5. a slower earlier request never overwrites a newer one, and it is
//      cancelled rather than left running
//   6. the jump waits for the message to be on the page. A match outside the
//      loaded window is fetched first, and only then scrolled to and highlighted
//   7. the range fetch is anchored on the OLDEST message already loaded. The
//      store keeps `activeChat.messages` in no particular order — pagination
//      puts older messages at the front of the same array — so the last array
//      entry is not the oldest message and cannot be used as the anchor.
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { renderWithProviders, screen, waitFor, fireEvent } from "../../render";

// Registered before the component import below resolves, so the component never
// reaches a real request. `vi.hoisted` is what makes the spies exist that early.
const { fetchDataSpy, rangeFetchSpy } = vi.hoisted(() => ({
  fetchDataSpy: vi.fn(),
  rangeFetchSpy: vi.fn(),
}));

vi.mock("utils/fetchData", () => ({
  fetchData: fetchDataSpy,
}));

vi.mock("store/chat/actions", () => ({
  getMessagesBetweenTwoMessages: rangeFetchSpy,
}));

import ChatSearch from "components/Chat/components/ChatSearch";
import { useAppStore } from "store";

/** The conversation the search runs inside. */
const CHANNEL_ID = "538";

/** Three matches for "gggg", in the order the backend really returns them. */
const NEWEST_MATCH = 339277;
const MIDDLE_MATCH = 339275;
const OLDEST_MATCH = 339262;
const MATCHES = [NEWEST_MATCH, MIDDLE_MATCH, OLDEST_MATCH];

/** The class a row wears while it is the match the reader is standing on. */
const HIT_CLASS = "chat-search-hit";

/** Every id the component scrolled to, in order, newest call last. */
let scrolled: string[] = [];

const chatWith = (ids: (number | string)[]) => ({
  id: CHANNEL_ID,
  messages: ids.map((id) => ({
    id: String(id),
    created_at: new Date(2026, 0, 1).toISOString(),
  })),
});

/** An answer from `channelSearch`, in the backend's own envelope. */
const searchAnswer = (ids: number[]) => ({
  success: true,
  data: { messages_ids: ids, offset: ids.length ? String(ids[ids.length - 1]) : null },
});

/**
 * The rows the conversation paints, read straight from the store.
 *
 * The real list lives in ConversationContainer. What matters to the search is
 * only that a row carries `id="main-container-<message id>"` and that a row
 * appears as soon as the store has the message — which is what makes the
 * "fetch, then jump" case in rule 6 above testable.
 */
function MessageRows() {
  const activeChat = useAppStore((state: any) => state.activeChat);
  return (
    <div>
      {(activeChat?.messages ?? []).map((message: any) => (
        <div key={message.id} id={`main-container-${message.id}`}>
          <div className="message-hold">{message.id}</div>
        </div>
      ))}
    </div>
  );
}

async function renderSearch(loadedIds: (number | string)[]) {
  return renderWithProviders(
    <>
      <MessageRows />
      <ChatSearch close={vi.fn()} />
    </>,
    { store: { activeChat: chatWith(loadedIds) } },
  );
}

const queryBox = () => screen.getByPlaceholderText("Search") as HTMLInputElement;

/** The two arrows, in the order they sit in the bar: newer first, older second. */
const arrow = (name: "newer" | "older") => {
  const button = document.querySelector(
    `[data-pw="chat-search-${name}"]`,
  ) as HTMLButtonElement | null;
  if (!button) throw new Error(`the ${name} arrow is not in the search bar`);
  return button;
};
const downArrow = () => arrow("newer");
const upArrow = () => arrow("older");

const type = (value: string) =>
  fireEvent.change(queryBox(), { target: { value } });

/** The row the reader is standing on right now, by the highlight it wears. */
const highlightedId = () => {
  const el = document.querySelector(`.${HIT_CLASS}`);
  return el ? el.id.replace("main-container-", "") : null;
};

beforeEach(() => {
  scrolled = [];
  fetchDataSpy.mockReset();
  rangeFetchSpy.mockReset();
  // jsdom has no layout, so it implements none of this. Recording the calls is
  // how a test can tell "it jumped to the right message" from "it jumped to the
  // wrong one" — both are silent otherwise.
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.id.replace("main-container-", ""));
  } as any;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("searching messages inside a conversation", () => {
  it("jumps to the newest match first, not the oldest one", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer(MATCHES));
    await renderSearch(MATCHES);

    type("gggg");

    await waitFor(() =>
      expect(
        useAppStore.getState().searchChat.messages,
        "the matches the chat backend answered with were never stored",
      ).toEqual(MATCHES),
    );
    expect(
      String(useAppStore.getState().searchChat.activeMessage),
      `the search settled on match ${useAppStore.getState().searchChat.activeMessage}. ` +
        `The chat backend answers newest first (${MATCHES.join(", ")}), so the ` +
        `match to stand on is ${NEWEST_MATCH}, the first entry`,
    ).toBe(String(NEWEST_MATCH));
    await waitFor(() =>
      expect(
        highlightedId(),
        "after a search the reader is put on a match, but no row is highlighted",
      ).not.toBeNull(),
    );
    expect(
      highlightedId(),
      `the chat backend answers newest first (${MATCHES.join(", ")}), so the ` +
        `first jump belongs on ${NEWEST_MATCH} — the match nearest the bottom ` +
        `of the conversation. It landed on ${highlightedId()} instead, which ` +
        "drags the reader to the far end of the history",
    ).toBe(String(NEWEST_MATCH));
    expect(
      scrolled[scrolled.length - 1],
      "the newest match was highlighted but never scrolled into view",
    ).toBe(String(NEWEST_MATCH));
  });

  it("turns the down arrow off while standing on the newest match", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer(MATCHES));
    await renderSearch(MATCHES);

    type("gggg");
    await waitFor(() =>
      expect(highlightedId(), "no match was reached").toBe(String(NEWEST_MATCH)),
    );

    expect(
      downArrow().disabled,
      "the reader is on the newest match, so there is nothing further down " +
        "the conversation to go to, yet the down arrow still offers it",
    ).toBe(true);
    expect(
      upArrow().disabled,
      "two older matches are left, so the up arrow must stay usable",
    ).toBe(false);
  });

  it("walks up to older matches and back down to newer ones", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer(MATCHES));
    await renderSearch(MATCHES);

    type("gggg");
    await waitFor(() =>
      expect(highlightedId(), "no match was reached").toBe(String(NEWEST_MATCH)),
    );

    fireEvent.click(upArrow());
    await waitFor(() =>
      expect(
        highlightedId(),
        "the up arrow must move one step towards older messages, to " +
          `${MIDDLE_MATCH}`,
      ).toBe(String(MIDDLE_MATCH)),
    );

    fireEvent.click(upArrow());
    await waitFor(() =>
      expect(
        highlightedId(),
        `the second press of the up arrow must reach the oldest match ${OLDEST_MATCH}`,
      ).toBe(String(OLDEST_MATCH)),
    );
    expect(
      upArrow().disabled,
      "the reader is on the oldest match, so the up arrow has nowhere left " +
        "to go and must be off",
    ).toBe(true);
    expect(
      downArrow().disabled,
      "two newer matches are behind the reader, so the down arrow must be on",
    ).toBe(false);

    fireEvent.click(downArrow());
    await waitFor(() =>
      expect(
        highlightedId(),
        "the down arrow must walk back towards newer messages, to " +
          `${MIDDLE_MATCH}`,
      ).toBe(String(MIDDLE_MATCH)),
    );
  });

  it("turns both arrows off when nothing matches", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer([]));
    await renderSearch(MATCHES);

    type("nothinghere");

    await waitFor(() =>
      expect(
        fetchDataSpy,
        "the query never reached the chat backend",
      ).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(
        upArrow().disabled,
        "the chat backend answered with no matches, so there is nothing to " +
          "step through, yet the up arrow still offers a jump",
      ).toBe(true),
    );
    expect(
      downArrow().disabled,
      "the chat backend answered with no matches, yet the down arrow still " +
        "offers a jump",
    ).toBe(true);
    expect(
      highlightedId(),
      "nothing matched, so no row may be left highlighted",
    ).toBeNull();
  });

  it("clears the results and stops the spinner when the box is emptied", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer(MATCHES));
    await renderSearch(MATCHES);

    type("gggg");
    await waitFor(() =>
      expect(highlightedId(), "no match was reached").toBe(String(NEWEST_MATCH)),
    );

    const callsAfterSearch = fetchDataSpy.mock.calls.length;
    type("");

    await waitFor(() =>
      expect(
        useAppStore.getState().searchChat.messages,
        "the box is empty but the previous matches are still held, so the " +
          "arrows keep stepping through results for a query that is gone",
      ).toEqual([]),
    );
    expect(
      useAppStore.getState().searchChat.loading,
      "the box was emptied and the spinner is still turning — the search bar " +
        "looks stuck waiting for a request that was never sent",
    ).toBe(false);
    expect(
      upArrow().disabled && downArrow().disabled,
      "the box is empty, so both arrows must be off",
    ).toBe(true);
    expect(
      highlightedId(),
      "the box is empty but a row is still highlighted as a match",
    ).toBeNull();
    expect(
      fetchDataSpy.mock.calls.length,
      "emptying the box asked the chat backend for the empty query",
    ).toBe(callsAfterSearch);
  });

  it("cancels the earlier request and ignores its answer when typing continues", async () => {
    let settleFirst: (value: any) => void = () => {};
    fetchDataSpy
      .mockImplementationOnce(
        () => new Promise((resolve) => (settleFirst = resolve)),
      )
      .mockResolvedValueOnce(searchAnswer([MIDDLE_MATCH]));

    await renderSearch(MATCHES);

    type("gg");
    await waitFor(() =>
      expect(
        fetchDataSpy.mock.calls.length,
        "the first query never reached the chat backend",
      ).toBe(1),
    );

    type("gggg");
    await waitFor(() =>
      expect(
        fetchDataSpy.mock.calls.length,
        "the second query never reached the chat backend",
      ).toBe(2),
    );

    expect(
      fetchDataSpy.mock.calls[0][0].signal?.aborted,
      "the first request is still running after the reader typed more. It " +
        "was never given an abort signal, or the signal was never fired, so " +
        "the chat backend keeps working on a query nobody is waiting for",
    ).toBe(true);

    // The stale answer lands last, and carries a different match on purpose.
    settleFirst(searchAnswer([OLDEST_MATCH]));

    await waitFor(() =>
      expect(highlightedId(), "the second query reached no match").toBe(
        String(MIDDLE_MATCH),
      ),
    );
    expect(
      highlightedId(),
      `the answer to the abandoned query "gg" overwrote the answer to "gggg" ` +
        "— the reader ends up on a match for text they already deleted",
    ).toBe(String(MIDDLE_MATCH));
  });

  it("fetches a match outside the loaded window, then jumps to it", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer([OLDEST_MATCH]));
    // Stands in for store/chat/actions.getMessagesBetweenTwoMessages, which
    // puts the fetched range into the store through `setPageData`. The row for
    // the match only exists on the page after that lands.
    rangeFetchSpy.mockImplementation(async () => {
      const state: any = useAppStore.getState();
      useAppStore.setState({
        activeChat: {
          ...state.activeChat,
          messages: [
            { id: String(OLDEST_MATCH), created_at: new Date().toISOString() },
            ...state.activeChat.messages,
          ],
        },
      } as any);
    });

    await renderSearch([NEWEST_MATCH]);

    type("gggg");

    await waitFor(() =>
      expect(
        rangeFetchSpy,
        `the match ${OLDEST_MATCH} is not loaded, so the chat backend has to ` +
          "be asked for the messages between it and the loaded window — it " +
          "never was",
      ).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(
        scrolled,
        `the fetched match ${OLDEST_MATCH} was never scrolled into view. The ` +
          "jump ran before the fetched messages were painted, so there was no " +
          "row to scroll to",
      ).toContain(String(OLDEST_MATCH)),
    );
    expect(
      highlightedId(),
      `the fetched match ${OLDEST_MATCH} was scrolled to but not highlighted`,
    ).toBe(String(OLDEST_MATCH));
  });

  it("anchors the range fetch on the oldest loaded message", async () => {
    fetchDataSpy.mockResolvedValue(searchAnswer([300000]));
    rangeFetchSpy.mockResolvedValue(undefined);

    // The order the store really keeps: pagination puts older messages at the
    // FRONT of the array, so the last entry is not the oldest message.
    await renderSearch([339100, 339900, 339500]);

    type("gggg");

    await waitFor(() =>
      expect(rangeFetchSpy, "the range was never asked for").toHaveBeenCalled(),
    );
    const call = rangeFetchSpy.mock.calls[0][0];
    expect(
      call.first,
      `the range fetch was anchored on ${call.first}. The oldest message on ` +
        "screen is 339100, and anchoring anywhere newer leaves a hole in the " +
        "conversation between the anchor and the match",
    ).toBe(339100);
    expect(
      call.second,
      "the range fetch did not ask for the match itself",
    ).toBe(300000);
    expect(
      String(call.channel_id),
      "the range fetch named the wrong conversation",
    ).toBe(CHANNEL_ID);
  });
});
