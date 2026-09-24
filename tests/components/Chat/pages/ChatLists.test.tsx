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
vi.mock("store/chat/actions", () => ({ GetLastSeen: vi.fn() }));

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
