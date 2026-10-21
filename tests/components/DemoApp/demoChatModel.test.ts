import { describe, expect, it } from "vitest";
import {
  gapAbove,
  isOpenable,
  orderedChats,
  reduceChat,
  seedState,
  type ChatState,
  type Openable,
  type TextMessage,
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
