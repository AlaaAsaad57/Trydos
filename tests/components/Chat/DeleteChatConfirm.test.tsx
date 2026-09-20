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

import { renderWithProviders, screen, userEvent } from "../../render";

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
}));

// The media grid is stood in for, not exercised. components/Chat/components/
// MediaContainer.js holds JSX in a `.js` file: Next compiles that, the test
// runner does not, so importing ChatInfo for real fails to parse before a single
// test runs. Nothing here looks at the grid, so a stand-in costs no coverage.
vi.mock("components/Chat/components/MediaContainer", () => ({
  default: () => null,
}));

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
      screen.getByText("Are you sure you want to delete this chat?"),
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
      screen.getByText("Are you sure you want to delete this chat?"),
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
});
