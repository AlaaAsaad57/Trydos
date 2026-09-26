// The chat list and its search (components/Chat/pages/ChatLists.jsx).
//
// A search shows two groups: existing chats whose other member's user name
// matches, and contacts whose contact name matches. A contact whose user
// already has a chat must lead to that chat. When it led to a new, empty
// placeholder chat instead, the first message went into the real chat on the
// backend while the screen showed a separate chat with one message.
//
// ChatItem and SearchResult are stand-ins that record their props, so a test
// can see which rows were drawn and press them. The file was ChatLists.js; the
// test build cannot read JSX in a .js file, so it is .jsx now.
import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({
  chatRows: [] as any[],
  contactRows: [] as any[],
}));

vi.mock("components/Chat/components/ChatItem", () => ({
  default: (p: any) => {
    h.chatRows.push(p);
    return <div data-testid={`ChatItem-${p.id}`} />;
  },
}));
vi.mock("components/Chat/components/SearchResult", () => ({
  default: (p: any) => {
    h.contactRows.push(p);
    return <div data-testid="SearchResult" />;
  },
}));
vi.mock("components/Chat/components/GetMoreChats", () => ({ default: () => null }));
// ChatLists also asks for the archived chats and my reminders on mount.
vi.mock("store/chat/actions", () => ({
  GetLastSeen: vi.fn(),
  GetArchivedChats: vi.fn(),
  GetMyReminders: vi.fn(),
}));

import ChatLists from "components/Chat/pages/ChatLists";

const ME = 1;
const BILAL = 8;

/** The chat with Bilal, named after his user name, not his contact name. */
const bilalChat = {
  id: 40,
  messages: [],
  channel_members: [
    { user_id: ME, pin: 0, mute: 0, user: { name: "Me" } },
    { user_id: BILAL, pin: 0, mute: 0, user: { name: "bilal seller id 8" } },
  ],
};

/** The same person saved in the phone contacts. The contact search sends
 *  `contact_user_id` as a string, and `id` is the contact record, not the user. */
const bilalContact = { id: 55, contact_user_id: String(BILAL), name: "بلال" };

async function mount(search: string, chatSearchResults: any[]) {
  const openChat = vi.fn();
  await renderWithProviders(<ChatLists search={search} />, {
    store: {
      userChat: { id: ME },
      data: [bilalChat],
      chat_loading: false,
      pinnedChats: [],
      chatSearchResults,
      activeChat: null,
      forwarded_message: null,
      openChat,
      watchChannel: vi.fn(),
    },
  });
  return { openChat };
}

beforeEach(() => {
  h.chatRows = [];
  h.contactRows = [];
});

describe("ChatLists search — a contact who already has a chat", () => {
  it("shows the existing chat, not a new one, when only the contact name matches", async () => {
    const { openChat } = await mount("بلال", [bilalContact]);

    expect(
      h.contactRows.map((p) => p.SenderName),
      "the contact was offered as a new chat, although a chat with the same user exists",
    ).not.toContain("بلال");

    const row = h.chatRows.find((p) => p.id === bilalChat.id);
    expect(row, "the existing chat with the contact's user was not shown").toBeTruthy();

    await act(async () => row.handleClickChat());
    expect(openChat.mock.calls[0]?.[0]?.id, "pressing the result did not open the existing chat").toBe(bilalChat.id);
  });

  it("shows the chat once when both its user name and the contact name match", async () => {
    await mount("bilal", [{ ...bilalContact, name: "bilal" }]);

    expect(
      h.contactRows.map((p) => p.SenderName),
      "the contact was offered as a new chat, although a chat with the same user exists",
    ).not.toContain("bilal");
    // Read from the page, not from the recorded props: a stand-in renders more
    // than once, and both lists number their rows from 0.
    expect(screen.getAllByTestId(`ChatItem-${bilalChat.id}`), "the chat with Bilal was drawn more than once").toHaveLength(1);
  });

  it("still offers a new chat for a contact who has no chat yet", async () => {
    await mount("سامر", [{ id: 56, contact_user_id: "9", name: "سامر" }]);

    expect(
      h.contactRows.map((p) => p.SenderName),
      "a contact with no chat was not offered as a new chat",
    ).toContain("سامر");
  });
});

describe("ChatLists — unread, archived and reminders", () => {
  /** A message from Bilal, and whether I have seen it. */
  const fromBilal = (id: number, watched: boolean) => ({
    id,
    created_at: "2026-09-20T10:00:00.000Z",
    sender_user_id: BILAL,
    message_type: { name: "TextMessage" },
    message_status: [{ user_id: ME, is_watched: watched }],
    auth_message_status: { delete_for_all: false },
  });

  async function mountList(store: Record<string, any>) {
    await renderWithProviders(<ChatLists search="" />, {
      store: {
        userChat: { id: ME },
        chat_loading: false,
        pinnedChats: [],
        chatSearchResults: [],
        activeChat: null,
        archivedChats: [],
        reminders: [],
        ...store,
      },
    });
  }

  it("draws a chat I have read as read, so its swipe option offers Unread", async () => {
    await mountList({ data: [{ ...bilalChat, messages: [fromBilal(1, true)] }] });
    const row = h.chatRows.find((p) => p.id === bilalChat.id);
    expect(row?.unread, "a chat with every message read was drawn as unread").toBe(false);
    expect(row?.newMessage, "a read chat showed an unread count").toBe(0);
  });

  it("draws a chat I marked unread as unread, with a count of 1", async () => {
    await mountList({
      data: [{ ...bilalChat, messages: [fromBilal(1, true)], marked_unread: true }],
    });
    const row = h.chatRows.find((p) => p.id === bilalChat.id);
    expect(row?.unread, "a chat marked unread was drawn as read").toBe(true);
    expect(row?.newMessage, "a chat marked unread showed no unread count").toBe(1);
  });

  it("keeps an archived chat out of the list and opens it from the Archived folder", async () => {
    const actions = await import("store/chat/actions");
    const archived = { ...bilalChat, id: 41, messages: [], is_archived: 1 };
    await mountList({ data: [bilalChat, archived], archivedChats: [archived] });

    expect(actions.GetArchivedChats, "the archived chats were not asked for").toHaveBeenCalled();
    expect(actions.GetMyReminders, "my reminders were not asked for").toHaveBeenCalled();
    expect(
      h.chatRows.some((p) => p.id === 41),
      "an archived chat was drawn in the main list",
    ).toBe(false);
    expect(
      screen.queryByText("Reminders"),
      "the Reminders folder showed with no reminder",
    ).toBeNull();

    h.chatRows = [];
    await act(async () => screen.getByText("Archived").click());
    expect(
      h.chatRows.find((p) => p.id === 41)?.archived,
      "the Archived folder did not list the archived chat with its Unarchive option",
    ).toBe(true);
  });

  it("shows the Reminders folder while I have a reminder", async () => {
    await mountList({
      data: [bilalChat],
      reminders: [
        {
          id: "r-1",
          remind_at: "2030-01-01T09:00:00.000Z",
          created_at: "2026-09-26T09:00:00.000Z",
          message_id: "5",
          message: { id: "5", channel_id: "40", message_type: "TextMessage", content: "call the shop", sender_user: { id: BILAL, name: "Bilal", photo_path: null }, created_at: null },
        },
        {
          // The chat backend sends an empty text for some text messages.
          id: "r-2",
          remind_at: "2030-01-02T09:00:00.000Z",
          created_at: "2026-09-26T09:00:00.000Z",
          message_id: "6",
          message: { id: "6", channel_id: "40", message_type: "TextMessage", content: "", sender_user: { id: BILAL, name: "Bilal", photo_path: null }, created_at: null },
        },
      ],
    });
    await act(async () => screen.getByText("Reminders").click());
    expect(
      screen.getByText("call the shop"),
      "the Reminders folder did not list the reminded message",
    ).toBeInTheDocument();
    expect(
      screen.getByText("message"),
      "a reminder whose text came back empty showed a blank line instead of the word message",
    ).toBeInTheDocument();
  });
});
