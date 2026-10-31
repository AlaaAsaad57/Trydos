// The "Calls" tab while it is still loading.
//
// CallList starts with `loading` true, so the skeleton is the first thing the
// tab ever renders. If the skeleton throws, nobody ever sees the call log —
// not a wrong label, no list at all.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";

// The list asks the chat backend for calls as soon as it mounts. This test is
// about the first paint, not the request, so the call is stubbed out.
vi.mock("services/chat", () => ({
  CALLS_PAGE_SIZE: 20,
  default: { getCalls: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock("store/chat/actions", () => ({ DeleteMessageApi: vi.fn() }));
// The "load older calls" sentinel. The stand-in hands its `onChange` to the
// test, so a case can say "the end of the list came into view".
const io = vi.hoisted(() => ({ onChange: null as null | ((inView: boolean) => void) }));
vi.mock("react-intersection-observer", () => ({
  InView: ({ onChange, children }: any) => {
    io.onChange = onChange;
    return <div data-testid="older-calls">{children}</div>;
  },
}));
// jsdom has no IntersectionObserver; the "load more calls" sentinel asks for one.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

import CallList from "components/Chat/pages/CallList";
import chat from "services/chat";
import { DeleteMessageApi } from "store/chat/actions";
import { useAppStore } from "store";

import { renderWithProviders } from "../../render";

describe("CallList — the Calls tab", () => {
  it("renders its loading skeleton without throwing", async () => {
    await expect(
      renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } }),
      "the Calls tab threw while painting its loading skeleton, so the call log never appears",
    ).resolves.toBeTruthy();

    expect(
      document.querySelectorAll(".call-conversation-item").length > 0,
      "the loading skeleton painted no placeholder rows",
    ).toBe(true);
  });
});

describe("CallList — the name and picture of a call row", () => {
  // The mobile app names a chat after `channel_name` and shows the other
  // person's own picture. A call row must show the same name and picture as
  // the chat it belongs to.
  it("shows the other person's own picture, taken from the chat in the list", async () => {
    await renderWithProviders(<CallList />, {
      store: {
        userChat: { id: 657 },
        calls: [
          {
            id: 900,
            channel_id: 40,
            created_at: "2026-09-26T10:00:00.000Z",
            duration_in_seconds: 12,
            sender_user_id: 672,
            message_type: { name: "VoiceCall" },
            channel: { id: 40, channel_name: "Bilal Shop", photo_path: "/channel.png" },
          },
        ],
        data: [
          {
            id: 40,
            channel_name: "Bilal Shop",
            messages: [],
            channel_members: [
              { user_id: 657, user: { name: "Me", photo_path: "/me.png" } },
              { user_id: 672, user: { name: "bilal seller id 8", photo_path: "/bilal.png" } },
            ],
          },
        ],
      },
    });

    const name = await screen.findByText("Bilal Shop");
    expect(name, "the call row did not use the chat's channel_name").toBeInTheDocument();
    const img = name.closest(".call-conversation-item")?.querySelector('img[alt="user-photo"]');
    const src = decodeURIComponent(img?.getAttribute("src") ?? "");
    expect(src, `the call row showed "${src}" instead of the other person's own picture`).toContain("/bilal.png");
  });
});

/** One call record, shaped like an entry of /api/v1/channels/my_calls. */
const call = (id: number, created_at: string, extra: Record<string, any> = {}) => ({
  id: String(id),
  channel_id: 40,
  created_at,
  duration_in_seconds: 12,
  sender_user_id: 657,
  message_type: { name: "VoiceCall" },
  channel: { id: 40, channel_name: "Bilal Shop" },
  auth_message_status: { is_deleted: 0 },
  ...extra,
});

/** The row that shows `text`, or null. */
const rowOf = (text: string) => screen.queryByText(text)?.closest(".call-conversation-item") ?? null;

describe("CallList — deleted calls", () => {
  // Deleting a call for yourself does not take it out of my_calls: the chat
  // backend keeps sending it, with auth_message_status.is_deleted 1. On
  // staging, 19 of Shopper A's 20 calls came back that way and the log drew
  // every one of them as a live call.
  it("shows a call the chat backend marks deleted as a deleted call, with no bin", async () => {
    await renderWithProviders(<CallList />, {
      store: {
        userChat: { id: 657 },
        calls: [
          call(900, "2026-09-26T10:00:00.000Z", { auth_message_status: { is_deleted: 1 } }),
          call(901, "2026-09-25T10:00:00.000Z"),
        ],
      },
    });

    await screen.findByText("Outgoing Voice Call");
    const deleted = rowOf("Deleted Call");
    expect(deleted, "a call with auth_message_status.is_deleted 1 was not shown as a deleted call").toBeTruthy();
    expect(
      deleted!.textContent,
      "the deleted call still says which way it went, as if it were a live call",
    ).not.toContain("Outgoing Voice Call");
    expect(deleted!.querySelector(".options-icon"), "the deleted call still offers its delete bin").toBeNull();
    expect(rowOf("Outgoing Voice Call"), "the call that is not deleted lost its normal label").not.toBeNull();
  });

  // A shopper deletes a call to hide who they talked to and when. The row stays
  // (the chat backend always sends it back), so the row itself must not say it.
  it("a deleted call shows no name, no picture and no date", async () => {
    await renderWithProviders(<CallList />, {
      store: {
        userChat: { id: 657 },
        calls: [
          call(900, "2026-09-26T10:00:00.000Z", {
            channel: { id: 40, channel_name: "Bilal Shop", photo_path: "/channel.png" },
            auth_message_status: { is_deleted: 1 },
          }),
        ],
        data: [
          {
            id: 40,
            channel_name: "Bilal Shop",
            messages: [],
            channel_members: [
              { user_id: 657, user: { name: "Me", photo_path: "/me.png" } },
              { user_id: 672, user: { name: "bilal seller id 8", photo_path: "/bilal.png" } },
            ],
          },
        ],
      },
    });

    const row = (await screen.findByText("Deleted Call")).closest(".call-conversation-item")!;
    expect(row.textContent, "the deleted call still shows who the call was with").not.toContain("Bilal Shop");
    expect(row.querySelector("img"), "the deleted call still shows a picture of who the call was with").toBeNull();
    expect(row.querySelector(".date-clock"), "the deleted call still shows when the call took place").toBeNull();
  });

  it("the bin marks the call deleted and keeps it in the log", async () => {
    await renderWithProviders(<CallList />, {
      store: { userChat: { id: 657 }, calls: [call(900, "2026-09-26T10:00:00.000Z")] },
    });

    const row = (await screen.findByText("Outgoing Voice Call")).closest(".call-conversation-item")!;
    fireEvent.click(row.querySelector(".options-icon")!);

    expect(DeleteMessageApi, "the bin did not ask the chat backend to delete the call for this user").toHaveBeenCalledWith(
      "900",
      false,
    );
    expect(rowOf("Deleted Call"), "after the bin the call left the log, instead of staying as a deleted call").not.toBeNull();
    const stored = (useAppStore.getState() as any).calls.find((c: any) => String(c.id) === "900");
    expect(stored?.auth_message_status?.is_deleted, "the store does not hold the call as deleted").toBe(1);
  });
});

describe("CallList — loading older calls", () => {
  const twenty = (from: number) =>
    Array.from({ length: 20 }, (_, i) => call(from - i, new Date(Date.UTC(2026, 8, 20, 0, 0, 0) + (from - i) * 1000).toISOString()));

  it("asks for the calls older than the oldest one shown", async () => {
    const shown = twenty(500);
    vi.mocked(chat.getCalls).mockResolvedValue(shown as any);
    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 }, calls: shown } });
    await screen.findByTestId("older-calls");

    vi.mocked(chat.getCalls).mockClear();
    vi.mocked(chat.getCalls).mockResolvedValue(twenty(480) as any);
    await act(async () => io.onChange!(true));

    expect(vi.mocked(chat.getCalls), "reaching the end of the log did not ask for the calls before the oldest one").toHaveBeenCalledWith(
      "481",
    );
    expect(screen.queryByTestId("older-calls"), "a full page of new calls stopped the log from loading more").not.toBeNull();
  });

  // The chat backend answered the same 20 calls to every "older" request, and
  // the list asked again on every scroll to the end (8 requests in one run on
  // staging). A page that brings nothing new means there is nothing older.
  it("stops asking once a page brings no new call", async () => {
    const shown = twenty(500);
    vi.mocked(chat.getCalls).mockResolvedValue(shown as any);
    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 }, calls: shown } });
    await screen.findByTestId("older-calls");

    await act(async () => io.onChange!(true));

    expect(
      screen.queryByTestId("older-calls"),
      "a page with no new call left the 'load older calls' trigger in place, so the list asks for the same page again on every scroll",
    ).toBeNull();
  });

  it("stops asking after a short page, which is the last one", async () => {
    const shown = twenty(500);
    vi.mocked(chat.getCalls).mockResolvedValue(shown as any);
    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 }, calls: shown } });
    await screen.findByTestId("older-calls");

    vi.mocked(chat.getCalls).mockResolvedValue([call(10, "2026-01-01T00:00:00.000Z")] as any);
    await act(async () => io.onChange!(true));

    expect(screen.queryByTestId("older-calls"), "after the last, short page the list still asks for older calls").toBeNull();
  });
});

// The chat backend always sends deleted calls back in my_calls. A page can be
// all deleted calls, and then the shopper sees a screen of "Deleted Call" rows
// and nothing else. The list goes on to the next page before it stops loading.
describe("CallList — pages that hold only deleted calls", () => {
  const deletedPage = (from: number) =>
    Array.from({ length: 20 }, (_, i) =>
      call(from - i, new Date(Date.UTC(2026, 8, 20, 0, 0, 0) + (from - i) * 1000).toISOString(), {
        auth_message_status: { is_deleted: 1 },
      }),
    );
  const livePage = (from: number) =>
    Array.from({ length: 20 }, (_, i) => call(from - i, new Date(Date.UTC(2026, 8, 20, 0, 0, 0) + (from - i) * 1000).toISOString()));

  /** A promise the test resolves by hand, to look at the list while a page is on its way. */
  const deferred = <T,>() => {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  };

  /** Stands in for chat.getCalls: puts the page in the store, as the real one does. */
  const answer = (pages: Record<string, any[] | Promise<any[]>>) =>
    vi.mocked(chat.getCalls).mockImplementation(async (id?: number | string) => {
      const page = await pages[String(id ?? "first")];
      useAppStore.getState().setCalls(page);
      return page as any;
    });

  it("when the newest page is all deleted calls, it loads the older page before it stops loading", async () => {
    const older = deferred<any[]>();
    answer({ first: deletedPage(500), "481": older.promise });
    vi.mocked(chat.getCalls).mockClear();

    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } });

    await waitFor(() =>
      expect(
        vi.mocked(chat.getCalls),
        "a newest page of only deleted calls did not make the list ask for the calls before it",
      ).toHaveBeenCalledWith("481"),
    );
    expect(
      screen.queryByText("Deleted Call"),
      "the list stopped loading and showed the deleted calls before the older page came back",
    ).toBeNull();

    await act(async () => older.resolve([call(300, "2026-01-01T00:00:00.000Z")]));

    expect(await screen.findByText("Outgoing Voice Call"), "the live call from the older page is not in the log").toBeInTheDocument();
  });

  it("when an older page is all deleted calls, it asks for the next one too", async () => {
    const next = deferred<any[]>();
    answer({ first: livePage(500), "481": deletedPage(480), "461": next.promise });

    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } });
    await screen.findByTestId("older-calls");
    vi.mocked(chat.getCalls).mockClear();

    await act(async () => io.onChange!(true));

    expect(
      vi.mocked(chat.getCalls),
      "an older page of only deleted calls did not make the list ask for the page after it",
    ).toHaveBeenCalledWith("461");
    expect(
      screen.queryByTestId("older-calls"),
      "the 'load older calls' trigger came back while the list was still paging, so a scroll would ask twice",
    ).toBeNull();

    await act(async () => next.resolve([call(300, "2026-01-01T00:00:00.000Z")]));

    expect(
      vi.mocked(chat.getCalls),
      "the list asked for more pages after it had found a live call",
    ).not.toHaveBeenCalledWith("300");
  });

  it("stops when there is nothing older, even if every call is deleted", async () => {
    answer({ first: deletedPage(500), "481": deletedPage(480).slice(0, 5) });
    vi.mocked(chat.getCalls).mockClear();

    await renderWithProviders(<CallList />, { store: { userChat: { id: 657 } } });

    expect((await screen.findAllByText("Deleted Call")).length > 0, "the log never showed the deleted calls").toBe(true);
    expect(
      vi.mocked(chat.getCalls),
      "the list went on asking after the short page, which is the last one",
    ).not.toHaveBeenCalledWith("476");
    expect(screen.queryByTestId("older-calls"), "after the last page the list still asks for older calls").toBeNull();
  });
});
