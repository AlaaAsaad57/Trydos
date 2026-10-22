import { describe, expect, it } from "vitest";
import {
  SEED_CONTACT,
  contactOf,
  fileSize,
  gapAbove,
  initialsOf,
  isOpenable,
  orderedChats,
  previewOf,
  reduceChat,
  seedState,
  type ChatState,
  type FileMessage,
  type LocationMessage,
  type Openable,
  type TextMessage,
  type VideoMessage,
} from "components/DemoApp/demoChatModel";
import { MESSAGES } from "components/DemoApp/demoChat";

// The chat demo keeps one state for the list and the conversation
// (demoChatModel.ts). These check the rules that state follows, with no
// screen and no backend: what a sent message does to the chat and its row,
// how the row's ticks follow the message, and what the swipe cells change.

const text = (id: string, side: "in" | "out", words = "hi"): TextMessage => ({
  kind: "text",
  id,
  side,
  text: words,
  time: "10:00",
});

const chatOf = (state: ChatState, id: string) => {
  const chat = state.chats.find((c) => c.id === id);
  expect(chat, `the chat "${id}" is not in the state`).toBeDefined();
  return chat!;
};

const lastOf = (state: ChatState, id: string) => {
  const { messages } = chatOf(state, id);
  return messages[messages.length - 1];
};

describe("demo chat state — the seed", () => {
  it("opens with the file's seven rows in the file's order, the first one open", () => {
    const state = seedState();
    expect(
      orderedChats(state.chats).map((c) => c.id),
      "the rows are not in the order of Home Page – 41",
    ).toEqual(["unread", "initials", "typing", "attachments", "sent", "delivered", "read"]);
    expect(state.active, "the first row is not the open chat").toBe("unread");
    expect(chatOf(state, "unread").unread, "the first row has no unread count").toBe(1);
  });

  it("gives every chat the conversation of Home Page – 44, ending on the replied message", () => {
    const state = seedState();
    for (const chat of state.chats) {
      const last = chat.messages[chat.messages.length - 1];
      expect(
        last.kind === "text" && last.text,
        `chat "${chat.id}" does not end on the file's last message`,
      ).toBe(MESSAGES.last);
    }
  });

  it("keeps the file's gaps above the seeded messages and tightens new ones from the same side", () => {
    const { messages } = chatOf(seedState(), "unread");
    expect(gapAbove(messages, 0), "the first message lost the file's 16 px").toBe(16);
    expect(gapAbove(messages, 1), "two incoming messages are not 2 px apart").toBe(2);
    expect(gapAbove(messages, 3), "a side change is not 12 px").toBe(12);
    const more = [...messages, text("a", "in"), text("b", "in")];
    expect(gapAbove(more, more.length - 1), "a new message from the same side is not 2 px under the last").toBe(2);
  });
});

describe("demo chat state — sending", () => {
  it("adds the message with one tick, puts a TODAY pill before it, and the row previews it", () => {
    const state = reduceChat(seedState(), {
      type: "send",
      chat: "sent",
      message: text("m1", "out", "Hello there"),
    });
    const last = lastOf(state, "sent");
    expect(last.id, "the sent message is not the last one").toBe("m1");
    expect(isOpenable(last) && last.status, "a just-sent message does not show one tick").toBe("sent");
    const { messages } = chatOf(state, "sent");
    const before = messages[messages.length - 2];
    expect(before.kind === "day" && before.label, "today's first message got no TODAY pill").toBe("TODAY");
    const row = chatOf(state, "sent");
    expect(row.preview, "the row does not preview the sent words").toBe("Hello there");
    expect(row.time, "the row does not show the message's time").toBe("10:00");
    expect(row.mark, "the row's ticks do not show the message was sent").toBe("sent");
  });

  it("moves the chat that got a message to the top of the list", () => {
    const state = reduceChat(seedState(), {
      type: "send",
      chat: "read",
      message: text("m1", "out"),
    });
    expect(orderedChats(state.chats)[0].id, "the chat with the newest message is not first").toBe("read");
  });

  it("puts one TODAY pill, not one per message", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: text("m1", "out") });
    state = reduceChat(state, { type: "send", chat: "sent", message: text("m2", "out") });
    const pills = chatOf(state, "sent").messages.filter((m) => m.kind === "day" && m.label === "TODAY");
    expect(pills.map((p) => p.id), "a second message added a second TODAY pill").toHaveLength(1);
  });

  it("marks the answered message and keeps the quote on the reply", () => {
    const reply: TextMessage = { ...text("r1", "out", "yes"), replyTo: { id: "in1", text: MESSAGES.in1 } };
    const state = reduceChat(seedState(), { type: "send", chat: "unread", message: reply, replyTo: "in1" });
    const answered = chatOf(state, "unread").messages.find((m) => m.id === "in1");
    expect(answered?.kind === "text" && answered.repliedTo, "the answered message has no reply mark").toBe(true);
    const last = lastOf(state, "unread");
    expect(last.kind === "text" && last.replyTo?.text, "the reply lost its quote").toBe(MESSAGES.in1);
  });

  it("moves the ticks of the message and of the row: sent, delivered, read", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: text("m1", "out") });
    state = reduceChat(state, { type: "status", chat: "sent", id: "m1", status: "delivered" });
    expect((lastOf(state, "sent") as Openable).status, "the message did not become delivered").toBe("delivered");
    expect(chatOf(state, "sent").mark, "the row's ticks did not follow to delivered").toBe("delivered");
    state = reduceChat(state, { type: "status", chat: "sent", id: "m1", status: "read" });
    expect(chatOf(state, "sent").mark, "the row's ticks did not follow to read").toBe("read");
  });

  it("counts a message that comes in as unread only while the chat is not on the screen", () => {
    const away = reduceChat(seedState(), { type: "receive", chat: "sent", message: text("r", "in") });
    expect(chatOf(away, "sent").unread, "a message that came in while away was not counted").toBe(1);
    expect(chatOf(away, "sent").mark, "the row still shows my ticks after the contact wrote").toBeUndefined();
    let open = reduceChat(seedState(), { type: "open", chat: "sent" });
    open = reduceChat(open, { type: "receive", chat: "sent", message: text("r", "in") });
    expect(chatOf(open, "sent").unread, "a message that came in while reading was counted unread").toBe(0);
  });

  it("opening a chat clears its unread count and makes it the open row", () => {
    const state = reduceChat(seedState(), { type: "open", chat: "typing" });
    expect(state.active, "the opened chat is not the active row").toBe("typing");
    expect(state.viewing, "the opened chat is not the one on the screen").toBe("typing");
    const back = reduceChat(reduceChat(state, { type: "open", chat: "unread" }), { type: "leave" });
    expect(chatOf(back, "unread").unread, "opening the first row did not clear its unread count").toBe(0);
    expect(back.viewing, "leaving did not clear the chat on the screen").toBeNull();
  });
});

describe("demo chat state — the message menu", () => {
  it("deletes a message and lets the row preview the one before it", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: text("m1", "out", "first") });
    state = reduceChat(state, { type: "send", chat: "sent", message: text("m2", "out", "second") });
    state = reduceChat(state, { type: "deleteMessage", chat: "sent", id: "m2" });
    expect(chatOf(state, "sent").messages.some((m) => m.id === "m2"), "the deleted message is still there").toBe(false);
    expect(chatOf(state, "sent").preview, "the row still previews the deleted message").toBe("first");
  });

  it("edits only a text I sent, marks it edited, and leaves the contact's words alone", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: text("m1", "out", "typo") });
    state = reduceChat(state, { type: "editMessage", chat: "sent", id: "m1", text: "fixed" });
    const mine = lastOf(state, "sent");
    expect(mine.kind === "text" && mine.text, "the edit did not change the words").toBe("fixed");
    expect(mine.kind === "text" && mine.edited, "the edited message is not marked edited").toBe(true);
    expect(chatOf(state, "sent").preview, "the row does not preview the edited words").toBe("fixed");
    const theirs = reduceChat(state, { type: "editMessage", chat: "sent", id: "in1", text: "nope" });
    expect(theirs, "a message that came in was edited").toBe(state);
  });

  it("forwards a copy of a message into another chat, marked Forwarded, with fresh ticks", () => {
    const state = reduceChat(seedState(), {
      type: "forward",
      from: "unread",
      id: "in2",
      to: "read",
      as: { id: "f1", time: "11:11" },
    });
    const copy = lastOf(state, "read");
    expect(copy.id, "the forwarded copy is not the last message of the other chat").toBe("f1");
    expect(copy.kind === "text" && copy.text, "the copy does not carry the words").toBe(MESSAGES.in2);
    expect(copy.kind === "text" && copy.forwarded, "the copy is not marked Forwarded").toBe(true);
    expect(copy.kind === "text" && copy.side, "the copy is not on my side").toBe("out");
    expect(chatOf(state, "unread").messages.some((m) => m.id === "in2"), "forwarding removed the original").toBe(true);
  });
});

describe("demo chat state — video, file and location messages", () => {
  const video: VideoMessage = { kind: "video", id: "v1", side: "out", src: "blob:v", seconds: 12, time: "10:00" };
  const file: FileMessage = { kind: "file", id: "f1", side: "out", src: "blob:f", name: "report.pdf", bytes: 2_516_582, mime: "application/pdf", time: "10:00" };
  const location: LocationMessage = { kind: "location", id: "l1", side: "out", lat: 33.5138, lng: 36.2765, accuracy: 20, time: "10:00" };
  const words = { photo: "Photo", voice: "voice message", video: "Video", file: "File", location: "Location" };

  it("the three kinds can be sent, answered and forwarded like a photo", () => {
    for (const m of [video, file, location])
      expect(isOpenable(m), `a ${m.kind} message is not openable`).toBe(true);
  });

  it("a sent video, file or location gets one tick and the row previews it by its kind", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: video }, words);
    expect((lastOf(state, "sent") as Openable).status, "the sent video has no tick").toBe("sent");
    expect(chatOf(state, "sent").preview, "the row does not say Video").toBe("Video");
    state = reduceChat(state, { type: "send", chat: "sent", message: file }, words);
    expect(chatOf(state, "sent").preview, "the row does not name the file").toBe("File: report.pdf");
    state = reduceChat(state, { type: "send", chat: "sent", message: location }, words);
    expect(chatOf(state, "sent").preview, "the row does not say Location").toBe("Location");
  });

  it("forwarding a location copies its point into the other chat, on my side", () => {
    let state = reduceChat(seedState(), { type: "send", chat: "sent", message: location }, words);
    state = reduceChat(state, { type: "forward", from: "sent", id: "l1", to: "read", as: { id: "l2", time: "11:00" } }, words);
    const copy = lastOf(state, "read");
    expect(copy.kind === "location" && copy.lat, "the copy lost the latitude").toBe(33.5138);
    expect(copy.kind === "location" && copy.lng, "the copy lost the longitude").toBe(36.2765);
    expect(copy.kind === "location" && copy.side, "the copy is not on my side").toBe("out");
    expect(copy.kind === "location" && copy.status, "the copy has no fresh tick").toBe("sent");
  });

  it("a received file is previewed with its name, and a video that came in is not mine", () => {
    const state = reduceChat(seedState(), { type: "receive", chat: "sent", message: { ...file, side: "in" } }, words);
    expect(chatOf(state, "sent").preview, "the row does not name the received file").toBe("File: report.pdf");
    expect(chatOf(state, "sent").mark, "the row shows my ticks on a file that came in").toBeUndefined();
    expect(previewOf({ ...video, side: "in" }, words), "a video that came in is not previewed as Video").toBe("Video");
  });

  it("prints a file's size the way the card shows it", () => {
    expect(fileSize(512), "bytes are not printed as B").toBe("512 B");
    expect(fileSize(812 * 1024), "kilobytes are not rounded to KB").toBe("812 KB");
    expect(fileSize(2_516_582), "megabytes under 10 lose their decimal").toBe("2.4 MB");
    expect(fileSize(48 * 1024 * 1024), "megabytes over 10 are not whole").toBe("48 MB");
  });
});

describe("demo chat state — the contact's switches", () => {
  it("Block flips the contact to blocked and back", () => {
    let state = reduceChat(seedState(), { type: "block", chat: "unread" });
    expect(chatOf(state, "unread").blocked, "Block did not block the contact").toBe(true);
    expect(chatOf(state, "sent").blocked, "Block reached another chat").toBeFalsy();
    state = reduceChat(state, { type: "block", chat: "unread" });
    expect(chatOf(state, "unread").blocked, "UnBlock did not unblock the contact").toBe(false);
  });

  it("the call switch flips calls off and on again", () => {
    let state = reduceChat(seedState(), { type: "calls", chat: "unread" });
    expect(chatOf(state, "unread").callsDisabled, "Desible Call did not turn calls off").toBe(true);
    state = reduceChat(state, { type: "calls", chat: "unread" });
    expect(chatOf(state, "unread").callsDisabled, "Enable Call did not turn calls on").toBe(false);
  });

  it("a switch on a chat that is not there changes nothing", () => {
    const state = seedState();
    expect(reduceChat(state, { type: "block", chat: "nobody" }), "Block on a missing chat changed the state").toStrictEqual(state);
    expect(reduceChat(state, { type: "calls", chat: "nobody" }), "the call switch on a missing chat changed the state").toStrictEqual(state);
  });
});

describe("demo chat state — contacts and new chats", () => {
  const sara = { id: "sara", name: "Sara Haddad", phone: "+963 944 000 111", initials: initialsOf("Sara Haddad") };

  it("opens with the file's contact and the caller, and every seeded chat is with the contact", () => {
    const state = seedState();
    expect(state.contacts.map((c) => c.id), "the seed does not list the file's two people").toEqual([SEED_CONTACT, "grant"]);
    for (const chat of state.chats)
      expect(contactOf(state, chat).id, `chat "${chat.id}" is not with the file's contact`).toBe(SEED_CONTACT);
  });

  it("makes initials from the first two words", () => {
    expect(initialsOf("Sara Haddad"), "two words did not give two letters").toBe("SH");
    expect(initialsOf("  madonna "), "one word did not give one letter, upper-case").toBe("M");
    expect(initialsOf("Ali Hassan Khan"), "a third word leaked into the initials").toBe("AH");
  });

  it("adds a contact once: the same phone a second time changes nothing", () => {
    let state = reduceChat(seedState(), { type: "addContact", contact: sara });
    expect(state.contacts.some((c) => c.id === "sara"), "the contact was not added").toBe(true);
    const again = reduceChat(state, { type: "addContact", contact: { ...sara, id: "sara2", phone: "+963944000111" } });
    expect(again.contacts.map((c) => c.id), "the same phone was added a second time").toEqual(state.contacts.map((c) => c.id));
    state = reduceChat(state, { type: "addContact", contact: { ...sara, id: "blank", name: "  ", phone: "+1" } });
    expect(state.contacts.some((c) => c.id === "blank"), "a contact with no name was added").toBe(false);
  });

  it("a new chat with a new contact is an empty chat at the top, open on the screen", () => {
    let state = reduceChat(seedState(), { type: "addContact", contact: sara });
    state = reduceChat(state, { type: "newChat", contact: "sara", as: { id: "c-sara", time: "09:00" } });
    const chat = chatOf(state, "c-sara");
    expect(chat.contact, "the new chat is not with the new contact").toBe("sara");
    expect(chat.messages, "the new chat is not empty").toEqual([]);
    expect(chat.preview, "the new chat's row would show the file's sample preview").toBe("");
    expect(orderedChats(state.chats)[0].id, "the new chat is not first in the list").toBe("c-sara");
    expect(state.active, "the new chat is not the active row").toBe("c-sara");
    expect(state.viewing, "the new chat is not the one on the screen").toBe("c-sara");
  });

  it("a new chat with someone who already has one opens that chat instead of making another", () => {
    const before = seedState();
    const state = reduceChat(before, { type: "newChat", contact: SEED_CONTACT, as: { id: "extra", time: "09:00" } });
    expect(state.chats.map((c) => c.id), "a second chat was made for the same contact").toEqual(before.chats.map((c) => c.id));
    expect(state.viewing, "the contact's chat was not opened").toBe(orderedChats(before.chats)[0].id);
  });

  it("a new chat with an unknown contact changes nothing", () => {
    const state = seedState();
    expect(reduceChat(state, { type: "newChat", contact: "nobody", as: { id: "x", time: "09:00" } }), "an unknown contact got a chat").toStrictEqual(state);
  });

  it("the first message in a new chat gets its TODAY pill and fills the row", () => {
    let state = reduceChat(seedState(), { type: "addContact", contact: sara });
    state = reduceChat(state, { type: "newChat", contact: "sara", as: { id: "c-sara", time: "09:00" } });
    state = reduceChat(state, { type: "send", chat: "c-sara", message: text("m1", "out", "Hi Sara") });
    const { messages } = chatOf(state, "c-sara");
    expect(messages[0].kind === "day" && messages[0].label, "the first message has no TODAY pill before it").toBe("TODAY");
    expect(chatOf(state, "c-sara").preview, "the row does not preview the first message").toBe("Hi Sara");
  });
});

describe("demo chat state — the swipe cells", () => {
  it("pins a chat to the top of the list and unpins it again", () => {
    let state = reduceChat(seedState(), { type: "pin", chat: "read" });
    expect(orderedChats(state.chats)[0].id, "the pinned chat is not first").toBe("read");
    expect(chatOf(state, "read").pinned, "the chat is not marked pinned").toBe(true);
    state = reduceChat(state, { type: "pin", chat: "read" });
    expect(orderedChats(state.chats)[0].id, "unpinning did not put the list back").toBe("unread");
  });

  it("toggles unread, toggles mute, and archive or delete take the row out", () => {
    let state = reduceChat(seedState(), { type: "unread", chat: "sent" });
    expect(chatOf(state, "sent").unread, "Unread did not mark the chat unread").toBe(1);
    state = reduceChat(state, { type: "unread", chat: "sent" });
    expect(chatOf(state, "sent").unread, "Unread a second time did not clear it").toBe(0);
    state = reduceChat(state, { type: "mute", chat: "sent" });
    expect(chatOf(state, "sent").muted, "Mute did not mute the chat").toBe(true);
    state = reduceChat(state, { type: "archive", chat: "sent" });
    expect(state.chats.some((c) => c.id === "sent"), "the archived chat is still in the list").toBe(false);
    state = reduceChat(state, { type: "deleteChat", chat: "unread" });
    expect(state.chats.some((c) => c.id === "unread"), "the deleted chat is still in the list").toBe(false);
    expect(state.active, "deleting the open chat left no other chat open").toBe("initials");
  });
});
