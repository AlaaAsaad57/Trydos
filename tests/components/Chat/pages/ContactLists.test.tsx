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
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ contactRows: [] as any[], chatRows: [] as any[], upload: null as any }));

vi.mock("components/Chat/components/ChatItem", () => ({
  default: (p: any) => {
    h.chatRows.push(p);
    return <div data-row={`chat:${p.id}`} />;
  },
}));
vi.mock("components/Chat/components/SearchResult", () => ({
  default: (p: any) => {
    h.contactRows.push(p);
    return <div data-row={`contact:${p.SenderName}`} />;
  },
}));
// The add-contact form is a stand-in that keeps its props, so a test can call
// `onDuplicate` / `onAlreadySaved` the way the real form does.
vi.mock("components/Chat/components/ChatContactsUpload", () => ({
  default: (p: any) => {
    h.upload = p;
    return null;
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
  h.chatRows = [];
  h.upload = null;
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

describe("the contacts tab — a person who already has a chat", () => {
  // The mobile app names a chat after `channel_name` and shows the other
  // person's own picture. The contacts tab draws the chat row too, so it must
  // follow the same rule.
  it("names the chat after channel_name and shows the other person's picture", async () => {
    const named = {
      ...bilalChat,
      channel_name: "Bilal Shop",
      photo_path: "/channel.png",
      channel_members: [
        { user_id: ME, pin: 0, mute: 0, user: { name: "Me", photo_path: "/me.png" } },
        { user_id: 8, pin: 0, mute: 0, user: { name: "bilal seller id 8", photo_path: "/bilal.png" } },
      ],
    };
    await renderWithProviders(<ContactLists search="" close={vi.fn()} />, {
      store: { ...store([bilal]), data: [named] },
    });
    const row = h.chatRows.filter((p) => p.id === 40).at(-1);
    expect(row, "the contact with a chat did not draw the chat row").toBeTruthy();
    expect(row.SenderName, "the contacts tab did not use the chat's channel_name").toBe("Bilal Shop");
    expect(row.photo, "the contacts tab did not show the other person's own picture").toBe("/bilal.png");
  });
});

// The add-contact form reports the row that already has the typed number
// (`onDuplicate`). The list draws that row first, inside a steady red frame,
// for as long as the form keeps reporting it.
describe("the contacts tab — the contact the add form matched", () => {
  const rana = { id: 70, contact_user_id: "9", contact_user: { id: 9 }, name: "رنا", mobile_phone: "0933000111" };

  // An import scrolls the list to the top. jsdom has no scrollTo.
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  async function contactsTab(contacts: any[]) {
    const { container } = await renderWithProviders(<ContactLists search="" close={vi.fn()} />, {
      store: store(contacts),
    });
    const rows = () => [...container.querySelectorAll("[data-row]")].map((el) => (el as HTMLElement).dataset.row);
    const framed = () =>
      [...container.querySelectorAll(".contact-duplicate [data-row]")].map((el) => (el as HTMLElement).dataset.row);
    const report = (row: any) => act(async () => h.upload.onDuplicate(row));
    return { container, rows, framed, report };
  }

  it("draws the contact the form matched first — a contact with a chat", async () => {
    const tab = await contactsTab([samer, bilal]);
    await tab.report(bilal);
    expect(tab.rows()[0], "the matched contact with a chat was not drawn first").toBe("chat:40");
  });

  it("draws the contact the form matched first — a contact with no chat, above the import's rows", async () => {
    const tab = await contactsTab([bilal, rana, samer]);
    await act(async () => h.upload.onAlreadySaved([rana.mobile_phone]));
    await tab.report(samer);
    expect(tab.rows(), "the matched contact was not first, or the import's row lost its place after it").toEqual([
      "contact:سامر",
      "contact:رنا",
      "chat:40",
    ]);
  });

  it("frames the matched row in red, and no other row", async () => {
    const tab = await contactsTab([bilal, samer]);
    await tab.report(samer);
    expect(tab.framed(), "the frame was not on the matched row only").toEqual(["contact:سامر"]);
  });

  it("frames the matched row with its own mark, not the import's flash", async () => {
    const tab = await contactsTab([bilal, samer]);
    await tab.report(samer);
    expect(
      tab.container.querySelector(".contact-duplicate")!.className,
      "the matched row's frame is the import's flash",
    ).not.toContain("contact-already-saved");
  });

  it("removes the frame and restores the order when the match ends", async () => {
    const tab = await contactsTab([bilal, samer]);
    await tab.report(samer);
    await tab.report(null);
    expect(tab.framed(), "a row stayed framed after the match ended").toEqual([]);
    expect(tab.rows(), "the rows did not go back to their normal order").toEqual(["chat:40", "contact:سامر"]);
  });

  it("moves the frame from A to B", async () => {
    const tab = await contactsTab([samer, rana, bilal]);
    await tab.report(samer);
    await tab.report(bilal);
    expect(tab.rows()[0], "contact B was not drawn first").toBe("chat:40");
    expect(tab.framed(), "the frame did not move from A to B").toEqual(["chat:40"]);
  });

  it("after an import, the contacts already saved move to the top and flash", async () => {
    const tab = await contactsTab([bilal, samer, rana]);
    await act(async () => h.upload.onAlreadySaved([rana.mobile_phone]));
    expect(tab.rows()[0], "the contact the import found already saved was not drawn first").toBe("contact:رنا");
    const flashed = tab.container.querySelector(".contact-already-saved");
    expect(
      flashed?.querySelector("[data-row]")?.getAttribute("data-row"),
      "the contact the import found already saved did not flash",
    ).toBe("contact:رنا");

    // Review finding S-1: the manual match moves rows. The import's flashed row
    // must keep its element, or its 3 s flash plays again.
    await tab.report(samer);
    await tab.report(null);
    expect(
      tab.container.querySelector(".contact-already-saved"),
      "a manual match remounted the import's flashed row, so its flash played again",
    ).toBe(flashed);
  });
});

// How the frame looks lives in public/styles/chatcomponent.css. jsdom does not
// compute CSS stacking, so these cases read the rules themselves.
//
// The row (.chat-conversation-item) has an opaque background and z-index 4,
// and it is a flex item, so it paints above its wrapper. A frame or a tint
// drawn on the wrapper itself is hidden under the row: on a phone only the
// frame's corners showed. The frame must be a layer above the row.
describe("the contacts tab — how the matched row's frame looks", () => {
  // Comments removed, so a comment above a rule is not read as its selector.
  const css = readFileSync(path.resolve(process.cwd(), "public/styles/chatcomponent.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  /** The declarations of the rule whose selector is exactly `selector`. */
  const rule = (selector: string) =>
    css
      .split("}")
      .map((chunk) => chunk.split("{"))
      .find(([sel]) => sel.trim() === selector)?.[1] ?? "";
  /** One declaration's value in a rule, or undefined. */
  const value = (block: string, prop: string) =>
    block
      .split(";")
      .map((d) => d.split(":"))
      .find(([name]) => name.trim() === prop)
      ?.slice(1)
      .join(":")
      .trim();

  const frame = rule(".contact-duplicate::after");

  it("draws the frame as a layer above the row, not under it", () => {
    expect(frame, "there is no .contact-duplicate::after layer for the frame").not.toBe("");
    expect(value(rule(".contact-duplicate"), "position"), "the frame's layer is not placed against the row").toBe(
      "relative",
    );
    expect(value(frame, "position"), "the frame layer does not cover the row").toBe("absolute");
    const rowZ = Number(value(rule(".chat-conversation-item"), "z-index"));
    expect(Number(value(frame, "z-index")), `the frame is not above the row (row z-index ${rowZ})`).toBeGreaterThan(
      rowZ,
    );
    expect(value(frame, "pointer-events"), "the frame layer catches the taps meant for the row").toBe("none");
  });

  it("draws the frame and its tint in red", () => {
    expect(value(frame, "border") ?? "", "the frame's border is not red").toMatch(/#f85555/i);
    expect(value(frame, "background-color") ?? "", "the matched row has no red tint").toMatch(/248,\s*85,\s*85/);
  });

  it("pulses so the shopper notices the row", () => {
    const name = (value(frame, "animation") ?? "").split(/\s+/)[0];
    expect(name, "the frame has no animation").toBeTruthy();
    expect(css, `the frame's animation "${name}" has no @keyframes`).toContain(`@keyframes ${name}`);
  });
});
