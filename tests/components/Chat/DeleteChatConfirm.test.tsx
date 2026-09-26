// Deleting a conversation asks first.
//
// Two places delete a chat, and both used to do it on the first tap: the swipe
// menu in the chat list (ChatOptions) and "Delete Chat" in the info panel
// (ChatInfo). One mis-tap threw the conversation away, and the backend call
// behind it — POST /api/v1/channels/destroy on the chat backend — has no undo.
//
// Both now open the shared ConfirmModal first, through createPortal into
// document.body. The portal is not decoration. The chat row is moved with a CSS
// transform while it is swiped open, and a `position: fixed` child of a
// transformed element is placed against that element instead of the viewport.
// Rendered in place, the confirm window would be trapped inside the row.
//
// What these tests hold to, in each of the two places:
//   1. the first tap calls the chat backend not at all, and removes no row
//   2. the confirm window is on the page, and it is a child of document.body
//   3. Cancel closes it and still deletes nothing
//   4. only Confirm calls the chat backend and drops the row from the store
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { act, renderWithProviders, screen, userEvent, waitFor } from "../../render";

/**
 * The top layer a browser will honour.
 *
 * CSS clamps z-index to a 32-bit signed integer. The chat window asks for
 * 9999999999999 and ConfirmModal for 999999999999999 — both past the limit, so
 * both come out as this number and tie. The confirm window has to claim it in its
 * own layer at the end of <body>, or it is only on top by accident of DOM order.
 */
const TOP_LAYER = "2147483647";

/** The portal layer the confirm window was put in — a direct child of <body>. */
const confirmLayer = () =>
  Array.from(document.body.children).find((child) =>
    child.querySelector('[role="dialog"]'),
  ) as HTMLElement | undefined;

// Registered before the component imports below resolve, so neither component
// ever reaches the real request. `vi.hoisted` is what makes the spy exist that
// early — a plain `const` above `vi.mock` is still undefined when the factory
// runs.
const { destroyChannelRequest } = vi.hoisted(() => ({
  destroyChannelRequest: vi.fn(),
}));

vi.mock("store/chat/actions", () => ({
  deleteChat: destroyChannelRequest,
  MuteChat: vi.fn(),
  PinnChat: vi.fn(),
  MarkChannelUnread: vi.fn(),
  ArchiveChannel: vi.fn(),
  GetTaggedMessages: vi.fn(),
  MESSAGE_TAGS: ["urgent", "important", "todo", "done"],
}));

// The media grid is stood in for, not exercised. components/Chat/components/
// MediaContainer.js holds JSX in a `.js` file: Next compiles that, the test
// runner does not, so importing ChatInfo for real fails to parse before a single
// test runs. Nothing here looks at the grid, so a stand-in costs no coverage.
vi.mock("components/Chat/components/MediaContainer", () => ({
  default: () => null,
}));

// The block / unblock requests, the copy toasts and Sentry, for the info-panel
// cases at the end of this file.
const info = vi.hoisted(() => ({
  fetchData: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("utils/fetchData", () => ({ fetchData: (...a: any[]) => info.fetchData(...a) }));
vi.mock("@/store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => info.showSuccess(...a),
  showErrorNotification: (...a: any[]) => info.showError(...a),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => info.logError(...a),
}));

import * as chatActions from "store/chat/actions";
import ChatInfo from "components/Chat/components/ChatInfo";
import ChatOptions from "components/Chat/components/ChatOptions";

/** The conversation under test, and one more so "it deleted everything" shows up. */
const DOOMED_CHAT = 11;
const OTHER_CHAT = 22;

/** Two rows in the chat list, the shape store/chat/reducer.ts filters on. */
const chatList = () => [
  { id: DOOMED_CHAT, name: "Alaa Test123" },
  { id: OTHER_CHAT, name: "Somebody Else" },
];

/** The ids still in the list, so a message can say which rows survived. */
const idsInStore = (store: any) =>
  (store.getState().data ?? []).map((chat: any) => String(chat.id));

beforeEach(() => {
  destroyChannelRequest.mockClear();
});

describe("ChatOptions — the swipe menu in the chat list", () => {
  async function renderSwipeMenu() {
    const closeRow = vi.fn();
    const rendered = await renderWithProviders(
      <ChatOptions
        id={DOOMED_CHAT}
        unread={false}
        pinned={false}
        muted={false}
        member_id={5}
        closeRow={closeRow}
      />,
      { store: { data: chatList() } },
    );
    return { ...rendered, closeRow };
  }

  /** The "Delete" tile in the swipe menu. */
  const deleteTile = (container: HTMLElement) =>
    container.querySelector(".chat-option.chat-4") as HTMLElement;

  it("does not call the chat backend on the first tap", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));

    expect(
      destroyChannelRequest,
      "tapping Delete in the swipe menu sent the destroy request to the chat backend straight away; it must wait for the confirm window",
    ).not.toHaveBeenCalled();
  });

  it("keeps the conversation in the list until it is confirmed", async () => {
    const { container, store } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));

    expect(
      idsInStore(store),
      `the first tap already removed the row from the chat list; the list now holds [${idsInStore(store)}]`,
    ).toContain(String(DOOMED_CHAT));
  });

  it("asks the shopper before deleting", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));

    expect(
      screen.getByText("Are You Sure You Want To Delete This Chat?"),
      "no confirm question was shown after tapping Delete in the swipe menu",
    ).toBeInTheDocument();
  });

  it("puts the confirm window on document.body, not inside the swiped row", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    const dialog = screen.getByRole("dialog");

    expect(
      container.contains(dialog),
      "the confirm window rendered inside the chat row; the row is moved with a CSS transform while it is swiped, so a fixed child of it is placed against the row and not the viewport",
    ).toBe(false);
  });

  it("claims the top layer so the chat window cannot cover it", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    const layer = confirmLayer();

    expect(
      layer?.style.zIndex,
      `the confirm window's layer asked for z-index "${layer?.style.zIndex}"; the chat window clamps to ${TOP_LAYER}, so anything less leaves the chat painting over the confirm window`,
    ).toBe(TOP_LAYER);
  });

  it("closes the confirm window on Cancel", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    await userEvent.click(screen.getByText("Cancel"));

    expect(
      screen.queryByRole("dialog"),
      "Cancel left the confirm window on the page",
    ).not.toBeInTheDocument();
  });

  it("deletes nothing when the shopper cancels", async () => {
    const { container, store } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    await userEvent.click(screen.getByText("Cancel"));

    expect(
      destroyChannelRequest,
      "Cancel still sent the destroy request to the chat backend",
    ).not.toHaveBeenCalled();
    expect(
      idsInStore(store),
      `Cancel still removed the row; the chat list now holds [${idsInStore(store)}]`,
    ).toContain(String(DOOMED_CHAT));
  });

  it("asks the chat backend to destroy the right conversation on Confirm", async () => {
    const { container } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    await userEvent.click(screen.getByText("Confirm"));

    expect(
      destroyChannelRequest,
      `Confirm did not ask the chat backend to destroy conversation ${DOOMED_CHAT}; it was called with ${JSON.stringify(destroyChannelRequest.mock.calls)}`,
    ).toHaveBeenCalledWith(DOOMED_CHAT);
  });

  it("drops only the confirmed conversation from the chat list", async () => {
    const { container, store } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    await userEvent.click(screen.getByText("Confirm"));

    expect(
      idsInStore(store),
      `the confirmed conversation is still in the chat list, which holds [${idsInStore(store)}]`,
    ).not.toContain(String(DOOMED_CHAT));
    expect(
      idsInStore(store),
      `deleting one conversation also removed the others; the chat list now holds [${idsInStore(store)}]`,
    ).toContain(String(OTHER_CHAT));
  });

  it("closes the swiped row once the delete is confirmed", async () => {
    const { container, closeRow } = await renderSwipeMenu();

    await userEvent.click(deleteTile(container));
    await userEvent.click(screen.getByText("Confirm"));

    expect(
      closeRow,
      "the swiped row stayed open after the delete was confirmed",
    ).toHaveBeenCalled();
  });
});

describe("ChatInfo — Delete Chat in the conversation info panel", () => {
  async function renderInfoPanel() {
    const cancel = vi.fn();
    const rendered = await renderWithProviders(
      <ChatInfo
        activeChat={{
          id: DOOMED_CHAT,
          name: "Alaa Test123",
          channel_members: [],
          message_counts: [],
        }}
        cancel={cancel}
        callLoading={false}
        makeAudioCall={() => {}}
        makeVideoCall={() => {}}
        enableSearch={() => {}}
      />,
      { store: { data: chatList() } },
    );
    return { ...rendered, cancel };
  }

  /** The red "Delete Chat" row at the bottom of the panel. */
  const deleteRow = (container: HTMLElement) =>
    container.querySelector(".chat-user-option.delete-option") as HTMLElement;

  it("does not call the chat backend on the first tap", async () => {
    const { container } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));

    expect(
      destroyChannelRequest,
      "tapping Delete Chat in the info panel sent the destroy request to the chat backend straight away; it must wait for the confirm window",
    ).not.toHaveBeenCalled();
  });

  it("keeps the panel open and the conversation in the list until it is confirmed", async () => {
    const { container, store, cancel } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));

    expect(
      cancel,
      "the info panel closed itself on the first tap, so the confirm window has nothing behind it",
    ).not.toHaveBeenCalled();
    expect(
      idsInStore(store),
      `the first tap already removed the row from the chat list; the list now holds [${idsInStore(store)}]`,
    ).toContain(String(DOOMED_CHAT));
  });

  it("asks the shopper before deleting", async () => {
    const { container } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));

    expect(
      screen.getByText("Are You Sure You Want To Delete This Chat?"),
      "no confirm question was shown after tapping Delete Chat in the info panel",
    ).toBeInTheDocument();
  });

  it("puts the confirm window on document.body, not inside the panel", async () => {
    const { container } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));
    const dialog = screen.getByRole("dialog");

    expect(
      container.contains(dialog),
      "the confirm window rendered inside the info panel, so the panel's own stacking and scrolling decide whether it can be seen",
    ).toBe(false);
  });

  it("claims the top layer so the chat window cannot cover it", async () => {
    const { container } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));
    const layer = confirmLayer();

    expect(
      layer?.style.zIndex,
      `the confirm window's layer asked for z-index "${layer?.style.zIndex}"; the chat window clamps to ${TOP_LAYER}, so anything less leaves the chat painting over the confirm window`,
    ).toBe(TOP_LAYER);
  });

  it("deletes nothing when the shopper cancels", async () => {
    const { container, store } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));
    await userEvent.click(screen.getByText("Cancel"));

    expect(
      destroyChannelRequest,
      "Cancel still sent the destroy request to the chat backend",
    ).not.toHaveBeenCalled();
    expect(
      idsInStore(store),
      `Cancel still removed the row; the chat list now holds [${idsInStore(store)}]`,
    ).toContain(String(DOOMED_CHAT));
  });

  it("asks the chat backend to destroy the right conversation on Confirm", async () => {
    const { container } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));
    await userEvent.click(screen.getByText("Confirm"));

    expect(
      destroyChannelRequest,
      `Confirm did not ask the chat backend to destroy conversation ${DOOMED_CHAT}; it was called with ${JSON.stringify(destroyChannelRequest.mock.calls)}`,
    ).toHaveBeenCalledWith(DOOMED_CHAT);
  });

  it("closes the info panel once the delete is confirmed", async () => {
    const { container, cancel } = await renderInfoPanel();

    await userEvent.click(deleteRow(container));
    await userEvent.click(screen.getByText("Confirm"));

    expect(
      cancel,
      "the info panel stayed open over an empty conversation after the delete was confirmed",
    ).toHaveBeenCalled();
  });

  // Found while writing the tests above, in the same file they change.
  //
  // The panel slides in from the right with a 300 ms timer that writes
  // `ref.current.style.right`. The timer was never cleared and `ref.current` was
  // not checked, so closing the panel inside those 300 ms left a timer holding a
  // node React had already detached: it fired, read `.style` off null and threw
  // out of a timer, where no React error boundary can catch it.
  //
  // Confirming a delete closes the panel, so the flow these tests cover is one of
  // the ways to hit it.
  it("does not throw when the panel is closed before it finished sliding in", async () => {
    vi.useFakeTimers();
    try {
      const { unmount } = await renderWithProviders(
        <ChatInfo
          activeChat={{
            id: DOOMED_CHAT,
            name: "Alaa Test123",
            channel_members: [],
            message_counts: [],
          }}
          cancel={() => {}}
          callLoading={false}
          makeAudioCall={() => {}}
          makeVideoCall={() => {}}
          enableSearch={() => {}}
        />,
        { store: { data: chatList() } },
      );

      unmount();

      expect(
        () => vi.advanceTimersByTime(300),
        "the slide-in timer kept running after the panel closed and read .style off a detached node; it throws out of a timer, so no error boundary catches it and the page is left broken",
      ).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// The rest of the two components this file already covers: ChatOptions' other
// tiles, and everything in the ChatInfo panel besides Delete.
// ---------------------------------------------------------------------------

describe("ChatOptions — the other swipe tiles", () => {
  async function renderTiles(props: Record<string, any> = {}) {
    const closeRow = vi.fn();
    const spies = { watchChannel: vi.fn(), pinChat: vi.fn(), muteChat: vi.fn() };
    const rendered = await renderWithProviders(
      <ChatOptions
        id={DOOMED_CHAT}
        unread={false}
        pinned={false}
        muted={false}
        member_id={5}
        closeRow={closeRow}
        {...props}
      />,
      { store: { data: chatList(), ...spies } },
    );
    const tile = (n: number) => rendered.container.querySelector(`.chat-option.chat-${n}`) as HTMLElement;
    return { ...rendered, closeRow, spies, tile };
  }

  it("marks the chat unread, pins it, mutes it and archives it on the chat backend", async () => {
    const { tile, spies, closeRow } = await renderTiles();
    await userEvent.click(tile(1));
    expect(chatActions.MarkChannelUnread, "the unread mark was not sent to the chat backend").toHaveBeenCalledWith(DOOMED_CHAT);
    await userEvent.click(tile(2));
    expect(chatActions.PinnChat, "the pin was not sent to the chat backend").toHaveBeenCalledWith({ id: DOOMED_CHAT, value: true, member_id: 5 });
    expect(spies.pinChat, "the pin was not stored").toHaveBeenCalledWith({ id: DOOMED_CHAT, value: true, member_id: 5 });
    await userEvent.click(tile(3));
    expect(chatActions.MuteChat, "the mute was not sent to the chat backend").toHaveBeenCalledWith({ id: DOOMED_CHAT, value: true, member_id: 5 });
    expect(spies.muteChat, "the mute was not stored").toHaveBeenCalledWith({ id: DOOMED_CHAT, value: true, member_id: 5 });
    await userEvent.click(tile(5));
    expect(chatActions.ArchiveChannel, "the archive was not sent to the chat backend").toHaveBeenCalledWith(DOOMED_CHAT, true);
    expect(closeRow, "each tile did not close the row").toHaveBeenCalledTimes(4);
  });

  it("marks an unread chat read, and unarchives an archived chat", async () => {
    const { tile, spies } = await renderTiles({ unread: true, archived: true });
    expect(screen.getByText("Unarchive"), "an archived chat did not offer Unarchive").toBeInTheDocument();
    await userEvent.click(tile(1));
    expect(spies.watchChannel, "Read did not mark the chat read the way opening it does").toHaveBeenCalledWith(DOOMED_CHAT);
    await userEvent.click(tile(5));
    expect(chatActions.ArchiveChannel, "Unarchive was not sent to the chat backend").toHaveBeenCalledWith(DOOMED_CHAT, false);
  });

  it("offers Read, Unpin and Unmute on a chat in those states", async () => {
    await renderTiles({ unread: true, pinned: true, muted: true });
    expect(screen.getByText("Read"), "an unread chat did not offer Read").toBeInTheDocument();
    expect(screen.getByText("Unpin"), "a pinned chat did not offer Unpin").toBeInTheDocument();
    expect(screen.getByText("Unmute"), "a muted chat did not offer Unmute").toBeInTheDocument();
  });

  it("works without a row to close", async () => {
    const rendered = await renderWithProviders(
      <ChatOptions id={1} unread={false} pinned={false} muted={false} member_id={5} closeRow={undefined as any} />,
      { store: { watchChannel: vi.fn(), pinChat: vi.fn(), muteChat: vi.fn() } },
    );
    await userEvent.click(rendered.container.querySelector(".chat-option.chat-5") as HTMLElement);
    await userEvent.click(rendered.container.querySelector(".chat-option.chat-1") as HTMLElement);
    expect(rendered.container.querySelector(".chat-options-container"), "the tiles broke with no row to close").not.toBeNull();
  });
});

describe("ChatInfo — the rest of the info panel", () => {
  const ME = 1;
  const other = (user: Record<string, any> = {}, extra: Record<string, any> = {}) => ({
    user_id: 2,
    user: { id: 2, name: "Other Person", username: "other", mobile_phone: "p-0", ...user },
    ...extra,
  });

  async function renderPanel(chat: Record<string, any> = {}, props: Record<string, any> = {}) {
    const handlers = {
      cancel: vi.fn(),
      makeAudioCall: vi.fn(),
      makeVideoCall: vi.fn(),
      enableSearch: vi.fn(),
    };
    const updateChannelBlockStatus = vi.fn();
    const rendered = await renderWithProviders(
      <ChatInfo
        activeChat={{ id: DOOMED_CHAT, channel_members: [{ user_id: ME }, other()], ...chat }}
        callLoading={false}
        {...handlers}
        {...props}
      />,
      { store: { data: chatList(), userChat: { id: ME }, updateChannelBlockStatus } },
    );
    return { ...rendered, ...handlers, updateChannelBlockStatus };
  }

  beforeEach(() => {
    info.fetchData.mockReset();
    info.fetchData.mockResolvedValue({ success: true });
    info.showSuccess.mockClear();
    info.showError.mockClear();
    info.logError.mockClear();
  });

  it("shows the other person's name, phone and initials, and copies the phone", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await renderPanel();
    expect(document.querySelector(".chat-info-user-name")?.textContent, "the name was not shown").toBe("Other Person");
    expect(document.querySelector(".text-avatar")?.textContent, "the initials were not shown").toBe("OP");
    await userEvent.click(screen.getByText("p-0"));
    expect(writeText, "the phone was not copied").toHaveBeenCalledWith("p-0");
    expect(info.showSuccess, "the copy was not confirmed").toHaveBeenCalledWith("The Number Was Copied Successfully");
  });

  it("says when the phone could not be copied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(async () => { throw new Error("denied"); }) },
      configurable: true,
    });
    await renderPanel();
    await userEvent.click(screen.getByText("p-0"));
    expect(info.showError, "a failed copy was not shown").toHaveBeenCalledWith("Number Copy Failed");
  });

  it("falls back to the username, and shows a photo when there is one", async () => {
    await renderPanel({ channel_members: [{ user_id: ME }, other({ name: "", username: "other-user" })] });
    expect(document.querySelector(".chat-info-user-name")?.textContent, "the username was not used").toBe("other-user");
    await renderPanel({ channel_members: [{ user_id: ME }, other({ photo_path: "/p.png" })] });
    expect(document.querySelectorAll(".text-avatar").length, "a member with a photo still got initials").toBe(1);
  });

  it("calls, video-calls and searches from the panel", async () => {
    const p = await renderPanel({}, { callLoading: "voice" });
    await userEvent.click(screen.getByText("Call"));
    await userEvent.click(screen.getByText("Video"));
    await userEvent.click(screen.getByText("Search"));
    expect(p.makeAudioCall, "the call did not start").toHaveBeenCalled();
    expect(p.makeVideoCall, "the video call did not start").toHaveBeenCalled();
    expect(p.enableSearch, "the search did not open").toHaveBeenCalled();
    expect(p.cancel, "the panel did not close after starting a call").toHaveBeenCalledTimes(2);
    expect(screen.getByText("Call").previousElementSibling!.className, "the calling button was not dimmed").toContain("opacity-40");
  });

  it("shows the media counts and a spinner until they arrive", async () => {
    await renderPanel({
      message_counts: {
        image_messages_count: 3,
        video_messages_count: 4,
        file_messages_count: 5,
        image_messages: [{ message_files: [{ file_path: "https://example.com/i.png" }] }],
      },
    });
    const counts = Array.from(document.querySelectorAll(".chat-user-files-info-content-item")).map((el) => el.textContent?.trim());
    expect(counts, "the media counts were not shown").toEqual(["3", "4", "5"]);
    expect(screen.getByAltText("Image"), "the image strip was not shown").toBeInTheDocument();
    expect(
      screen.getByAltText("Image").closest(".horizntal-scroll"),
      "the image strip is not in the shared horizontal scroll row, so a mouse cannot drag it",
    ).not.toBeNull();
    expect(
      screen.queryByText("Save To Gallery"),
      "the 'Save To Gallery' row is back, but a web page cannot save to the phone gallery",
    ).toBeNull();
    await userEvent.click(screen.getByText("Media & Files"));
    expect(document.querySelector(".chat-user-files-container"), "the media view did not replace the panel").toBeNull();
  });

  it("slides out and closes on the back arrow", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const p = await renderPanel();
      const panel = document.querySelector(".chat-user-info-container") as HTMLElement;
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(panel.style.right, "the panel did not slide in").toBe("0px");
      (document.querySelector(".arrow-icon") as HTMLElement).click();
      expect(panel.style.right, "the panel did not slide out").toBe("-430px");
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(p.cancel, "the panel did not close after sliding out").toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("blocks and unblocks the other person on the chat backend", async () => {
    const p = await renderPanel();
    await userEvent.click(screen.getByText("Block"));
    expect(info.fetchData.mock.calls[0]?.[0]?.url, "the block did not go to the chat backend").toBe("/api/v1/users/block/2");
    expect(p.updateChannelBlockStatus, "the block was not stored").toHaveBeenCalledWith({ channelId: DOOMED_CHAT, userId: 2, isBlocked: true });
    await userEvent.click(await screen.findByText("UnBlock"));
    expect(info.fetchData.mock.calls[1]?.[0]?.url, "the unblock did not go to the chat backend").toBe("/api/v1/users/unblock/2");
    expect(await screen.findByText("Block"), "the button did not go back to Block").toBeInTheDocument();
  });

  it("starts as UnBlock for a blocked member and ignores a tap while busy", async () => {
    let finish: any;
    info.fetchData.mockImplementation(() => new Promise((r) => (finish = r)));
    await renderPanel({ channel_members: [{ user_id: ME }, other({}, { is_blocked: 1 })] });
    await userEvent.click(screen.getByText("UnBlock"));
    const busy = document.querySelectorAll(".chat-user-option")[1] as HTMLElement;
    await userEvent.click(busy);
    expect(info.fetchData, "a second tap sent a second request").toHaveBeenCalledTimes(1);
    await act(async () => finish({ success: true }));
  });

  it("logs a refused block or unblock and keeps the state", async () => {
    info.fetchData.mockResolvedValue({ success: false });
    await renderPanel();
    await userEvent.click(screen.getByText("Block"));
    expect(await screen.findByText("Block"), "a refused block changed the button").toBeInTheDocument();
    expect(info.logError.mock.calls[0]?.[0]?.error?.message, "the refused block was not logged").toBe("Block request failed");
    await renderPanel({ channel_members: [{ user_id: ME }, other({}, { is_blocked: 1 })] });
    await userEvent.click(screen.getAllByText("UnBlock")[0]);
    await waitFor(() =>
      expect(info.logError.mock.calls[1]?.[0]?.error?.message, "the refused unblock was not logged").toBe("Unblock request failed"),
    );
  });

  it("does nothing without another member to block", async () => {
    await renderPanel({ channel_members: [{ user_id: ME }, { user_id: 2, user: { name: "No Id" } }] });
    await userEvent.click(screen.getByText("Block"));
    expect(info.fetchData, "a block was sent with no user id").not.toHaveBeenCalled();
    await renderPanel({ channel_members: [{ user_id: ME }, { user_id: 2, is_blocked: 1, user: { name: "No Id" } }] });
    await userEvent.click(screen.getByText("UnBlock"));
    expect(info.fetchData, "an unblock was sent with no user id").not.toHaveBeenCalled();
  });

  it("stores no block state for a chat with no id", async () => {
    const p = await renderPanel({ id: undefined });
    await userEvent.click(screen.getByText("Block"));
    await screen.findByText("UnBlock");
    expect(p.updateChannelBlockStatus, "a block was stored for a chat with no id").not.toHaveBeenCalled();
  });
});
