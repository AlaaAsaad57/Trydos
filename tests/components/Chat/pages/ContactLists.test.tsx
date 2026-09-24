// The contacts tab (components/Chat/pages/ContactLists.jsx), and how its search
// compares with the chats tab (components/Chat/pages/ChatLists.jsx).
//
// Both tabs sit under the same search box, so the same text must draw the same
// rows in both. They did not: the chats tab matched a chat by the other user's
// name only and a contact by its name only, while the contacts tab matched a
// contact by name or phone. Contacts that point at the same phone were drawn
// once each.
//
// ChatItem and SearchResult are stand-ins that mark each row as `chat:<id>` or
// `contact:<name>`, so a test reads the rows in order from the page. Both files
// were .js; the test build cannot read JSX in a .js file, so they are .jsx now.
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ contactRows: [] as any[] }));

vi.mock("components/Chat/components/ChatItem", () => ({
  default: (p: any) => <div data-row={`chat:${p.id}`} />,
}));
vi.mock("components/Chat/components/SearchResult", () => ({
  default: (p: any) => {
    h.contactRows.push(p);
    return <div data-row={`contact:${p.SenderName}`} />;
  },
}));
vi.mock("components/Chat/components/ChatContactsUpload", () => ({ default: () => null }));
vi.mock("components/Chat/components/GetMoreChats", () => ({ default: () => null }));
vi.mock("store/chat/actions", () => ({ GetLastSeen: vi.fn() }));

import ChatLists from "components/Chat/pages/ChatLists";
import ContactLists from "components/Chat/pages/ContactLists";

const ME = 1;

/** The chat with Bilal, named after his user name, not his contact name. */
const bilalChat = {
  id: 40,
  messages: [],
  channel_members: [
    { user_id: ME, pin: 0, mute: 0, user: { name: "Me" } },
    { user_id: 8, pin: 0, mute: 0, user: { name: "bilal seller id 8", mobile_phone: "+963999111222" } },
  ],
};

/** Bilal saved in the phone contacts. */
const bilal = { id: 55, contact_user_id: "8", contact_user: { id: 8 }, name: "بلال", mobile_phone: "0999111222" };

/** One person with no account, saved twice in two phone formats. */
const samer = { id: 60, contact_user_id: null, name: "سامر", mobile_phone: "+963 944 555 666" };
const samerAgain = { id: 61, contact_user_id: null, name: "سامر", mobile_phone: "0944555666" };

const store = (contacts: any[], spies: Record<string, any> = {}) => ({
  userChat: { id: ME },
  data: [bilalChat],
  chat_loading: false,
  pinnedChats: [],
  // The contact search on the server returns the shopper's own contacts.
  chatSearchResults: contacts,
  contacts,
  activeChat: null,
  forwarded_message: null,
  openChat: vi.fn(),
  watchChannel: vi.fn(),
  ...spies,
});

/** The rows one tab draws for a search, in order. */
async function rowsOf(tab: "chats" | "contacts", search: string, contacts: any[]) {
  const ui = tab === "chats" ? <ChatLists search={search} /> : <ContactLists search={search} close={vi.fn()} />;
  const { container, unmount } = await renderWithProviders(ui, { store: store(contacts) });
  const rows = [...container.querySelectorAll("[data-row]")].map((el) => (el as HTMLElement).dataset.row);
  unmount();
  return rows;
}

beforeEach(() => {
  document.body.innerHTML = "";
  h.contactRows = [];
});

describe("chat search — the same rows in the chats tab and the contacts tab", () => {
  for (const [what, search] of [
    ["the contact name", "بلال"],
    ["the user name", "bilal"],
    ["the contact's phone", "0999"],
    ["a person with no account", "سامر"],
  ]) {
    it(`draws the same rows in both tabs when searching by ${what}`, async () => {
      const contacts = [bilal, samer];
      const chats = await rowsOf("chats", search, contacts);
      const contactsTab = await rowsOf("contacts", search, contacts);
      expect(contactsTab, `searching "${search}" drew ${JSON.stringify(chats)} in the chats tab`).toEqual(chats);
    });
  }

  it("finds the chat with Bilal by the phone saved in the contacts", async () => {
    expect(await rowsOf("chats", "0999", [bilal]), "the chats tab did not find the chat by the contact's phone").toEqual(["chat:40"]);
  });
});

describe("chat search — one row per person", () => {
  it("shows a person saved twice with the same phone once in the contacts tab", async () => {
    expect(await rowsOf("contacts", "", [samer, samerAgain]), "the same phone in two formats was drawn twice").toEqual([
      "contact:سامر",
    ]);
  });

  it("shows a person saved twice with the same phone once in a search", async () => {
    expect(await rowsOf("chats", "سامر", [samer, samerAgain]), "the same phone in two formats was offered twice").toEqual([
      "contact:سامر",
    ]);
  });

  it("shows the chat once when two contacts point at the same user", async () => {
    const bilalAgain = { ...bilal, id: 56, name: "Bilal shop", mobile_phone: "+963999111222" };
    expect(await rowsOf("contacts", "", [bilal, bilalAgain]), "one user saved twice drew the chat twice").toEqual(["chat:40"]);
  });
});

describe("the contacts tab — opening a person with no chat yet", () => {
  // SearchResult builds a `ch-<user id>` placeholder for a person with an
  // account and no chat. The backend has no channel by that id, so marking it
  // watched only fails. The contacts tab used to do that on every such click.
  it("opens the placeholder chat without marking it watched on the chat backend", async () => {
    const openChat = vi.fn();
    const watchChannel = vi.fn();
    const close = vi.fn();
    const rana = { id: 70, contact_user_id: "9", contact_user: { id: 9 }, name: "رنا", mobile_phone: "0933000111" };
    await renderWithProviders(<ContactLists search="" close={close} />, {
      store: store([rana], { openChat, watchChannel }),
    });
    const row = h.contactRows.find((p) => p.SenderName === "رنا");
    expect(row, "the contact with no chat was not drawn").toBeTruthy();

    await act(async () => row.handleClickChat({ id: "ch-9", channel_members: [] }));

    expect(openChat.mock.calls[0]?.[0]?.id, "the placeholder chat was not opened").toBe("ch-9");
    expect(watchChannel, "a placeholder chat was marked watched on the chat backend").not.toHaveBeenCalled();
  });
});
