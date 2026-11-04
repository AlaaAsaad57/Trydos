import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// What each chat screen action does to the real chat. The live calls to the
// chat backend are mocked: each test checks that the right call goes out with
// the right values, and that the store is told, the way the old chat UI does.

const api = vi.hoisted(() => ({
  ArchiveChannel: vi.fn(async () => true),
  CancelMessageReminder: vi.fn(async () => true),
  EditMessageApi: vi.fn(async () => true),
  MarkChannelUnread: vi.fn(async () => true),
  MuteChat: vi.fn(async () => undefined),
  PinnChat: vi.fn(async () => undefined),
  SetMessageReminder: vi.fn(async () => true),
  SetUserBlocked: vi.fn(async () => true),
  ToggleMessageTag: vi.fn(async () => true),
  deleteChat: vi.fn(async () => undefined),
}));
vi.mock("store/chat/actions", () => api);

const local = vi.hoisted(() => ({
  DeleteMessage: vi.fn(),
  openChatFromList: vi.fn(),
  showErrorNotification: vi.fn(),
}));
vi.mock("store/chat/chatUtils", () => ({ DeleteMessage: local.DeleteMessage }));
vi.mock("components/Chat/components/ChatSearchResults", () => ({ openChatFromList: local.openChatFromList }));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: local.showErrorNotification,
}));

import { runChatAction } from "components/DemoApp1/chat/chatActions";
import { useAppStore } from "store";
import type { Channel, Member, Message } from "utils/types/chat";

const ME = 7;
const PEER = 9;
const MY_MEMBER_ROW = 70;

const member = (userId: number, over: Partial<Member> = {}): Member =>
  ({ id: userId === ME ? MY_MEMBER_ROW : 90, user_id: userId, pin: 0, mute: 0, is_blocked: 0, user: { id: userId }, ...over }) as Member;

const message = (over: Partial<Message> = {}): Message =>
  ({
    id: "500",
    sender_user_id: ME,
    created_at: "2026-11-04T10:00:00",
    message_type: { name: "TextMessage" },
    message_content: { content: "Hi" },
    message_status: [{ user_id: ME, is_watched: true }],
    auth_message_status: { delete_for_all: false, is_deleted: 0 },
    ...over,
  }) as Message;

const channel = (id: string, over: Partial<Channel> = {}): Channel =>
  ({ id, channel_members: [member(ME), member(PEER)], messages: [message()], ...over }) as Channel;

const store = {
  openChat: vi.fn(),
  pinChat: vi.fn(),
  muteChat: vi.fn(),
  watchChannel: vi.fn(),
  deleteChat: vi.fn(),
};
const say = vi.fn();
const initial = useAppStore.getState();

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    ...store,
    userChat: { id: ME },
    data: [channel("1"), channel("2")],
    archivedChats: [channel("3", { is_archived: 1 })],
    activeChat: null,
  });
});
afterEach(() => {
  useAppStore.setState(initial, true);
});

describe("chat actions — the chat row", () => {
  it("open uses the old list's open (open, watched, waiting forward) with the loaded chat", async () => {
    await runChatAction({ type: "open", chat: "2" }, { say });
    expect(local.openChatFromList, "opening a chat did not open the loaded chat 2").toHaveBeenCalledWith(
      expect.objectContaining({ id: "2" }),
    );
  });

  it("leave closes the open chat in the store", async () => {
    await runChatAction({ type: "leave" }, { say });
    expect(store.openChat, "leaving the conversation did not close the open chat").toHaveBeenCalledWith(null);
  });

  it("pin tells the chat backend and the store, with my member row id", async () => {
    await runChatAction({ type: "pin", chat: "1" }, { say });
    expect(api.PinnChat, "the chat backend was not asked to pin chat 1").toHaveBeenCalledWith({
      id: "1",
      value: true,
      member_id: MY_MEMBER_ROW,
    });
    expect(store.pinChat, "the store was not told chat 1 is pinned").toHaveBeenCalledWith({
      id: "1",
      value: true,
      member_id: MY_MEMBER_ROW,
    });
  });

  it("a 4th pin is refused with the old message, and nothing is sent", async () => {
    useAppStore.setState({
      data: ["1", "2", "3", "4"].map((id) =>
        channel(id, { channel_members: [member(ME, { pin: id === "4" ? 0 : 1 }), member(PEER)] }),
      ),
    });
    await runChatAction({ type: "pin", chat: "4" }, { say });
    expect(api.PinnChat, "a 4th pin reached the chat backend").not.toHaveBeenCalled();
    expect(local.showErrorNotification, "the shopper was not told only 3 chats can be pinned").toHaveBeenCalledWith(
      "only 3 pinned chats allowed",
    );
  });

  it("unpin always works, even with 3 pinned", async () => {
    useAppStore.setState({
      data: ["1", "2", "3"].map((id) => channel(id, { channel_members: [member(ME, { pin: 1 }), member(PEER)] })),
    });
    await runChatAction({ type: "pin", chat: "1" }, { say });
    expect(api.PinnChat, "an unpin with 3 pinned did not reach the chat backend").toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", value: false }),
    );
  });

  it("mute flips my mute and tells the chat backend and the store", async () => {
    useAppStore.setState({ data: [channel("1", { channel_members: [member(ME, { mute: 1 }), member(PEER)] })] });
    await runChatAction({ type: "mute", chat: "1" }, { say });
    expect(api.MuteChat, "the chat backend was not asked to unmute chat 1").toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", value: false, member_id: MY_MEMBER_ROW }),
    );
    expect(store.muteChat, "the store was not told chat 1 is unmuted").toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", value: false }),
    );
  });

  it("unread on a read chat marks it unread on the chat backend", async () => {
    await runChatAction({ type: "unread", chat: "1" }, { say });
    expect(api.MarkChannelUnread, "a read chat was not marked unread on the chat backend").toHaveBeenCalledWith("1");
    expect(store.watchChannel, "a read chat was marked read instead").not.toHaveBeenCalled();
  });

  it("unread on an unread chat marks it read (the same call as opening it)", async () => {
    const unwatched = message({
      sender_user_id: PEER,
      message_status: [{ user_id: ME, is_watched: false } as Message["message_status"][number]],
    });
    useAppStore.setState({ data: [channel("1", { messages: [unwatched] })] });
    await runChatAction({ type: "unread", chat: "1" }, { say });
    expect(store.watchChannel, "an unread chat was not marked read").toHaveBeenCalledWith("1");
    expect(api.MarkChannelUnread, "an unread chat was marked unread again").not.toHaveBeenCalled();
  });

  it("block blocks the other person; on a blocked contact it unblocks", async () => {
    await runChatAction({ type: "block", chat: "1" }, { say });
    expect(api.SetUserBlocked, "the chat backend was not asked to block the other person of chat 1").toHaveBeenCalledWith(
      "1",
      PEER,
      true,
    );
    useAppStore.setState({ data: [channel("1", { channel_members: [member(ME), member(PEER, { is_blocked: 1 })] })] });
    await runChatAction({ type: "block", chat: "1" }, { say });
    expect(api.SetUserBlocked, "the chat backend was not asked to unblock a blocked contact").toHaveBeenLastCalledWith(
      "1",
      PEER,
      false,
    );
  });

  it("archive and unarchive go to the chat backend with the right flag", async () => {
    await runChatAction({ type: "archive", chat: "1" }, { say });
    expect(api.ArchiveChannel, "chat 1 was not archived on the chat backend").toHaveBeenCalledWith("1", true);
    await runChatAction({ type: "unarchive", chat: "3" }, { say });
    expect(api.ArchiveChannel, "archived chat 3 was not unarchived on the chat backend").toHaveBeenLastCalledWith("3", false);
  });

  it("delete chat tells the chat backend and takes it out of the store", async () => {
    await runChatAction({ type: "deleteChat", chat: "2" }, { say });
    expect(api.deleteChat, "the chat backend was not asked to delete chat 2").toHaveBeenCalledWith("2");
    expect(store.deleteChat, "the store still holds deleted chat 2").toHaveBeenCalledWith({ id: "2" });
  });

  it("an action on a chat that is not loaded sends nothing", async () => {
    await runChatAction({ type: "pin", chat: "999" }, { say });
    await runChatAction({ type: "archive", chat: "999" }, { say });
    await runChatAction({ type: "deleteChat", chat: "999" }, { say });
    expect(api.PinnChat, "a pin for an unknown chat reached the chat backend").not.toHaveBeenCalled();
    expect(api.ArchiveChannel, "an archive for an unknown chat reached the chat backend").not.toHaveBeenCalled();
    expect(api.deleteChat, "a delete for an unknown chat reached the chat backend").not.toHaveBeenCalled();
  });
});

describe("chat actions — one message", () => {
  it("delete removes the message for me only", async () => {
    await runChatAction({ type: "deleteMessage", chat: "1", id: "500" }, { say });
    expect(local.DeleteMessage, "message 500 was not deleted for me only").toHaveBeenCalledWith("1", "500", false);
  });

  it("edit sends the trimmed new words of my own message", async () => {
    await runChatAction({ type: "editMessage", chat: "1", id: "500", text: "  New words " }, { say });
    expect(api.EditMessageApi, "my edit did not reach the chat backend with the trimmed words").toHaveBeenCalledWith(
      "1",
      "500",
      "New words",
    );
  });

  it("edit of the other person's message sends nothing", async () => {
    useAppStore.setState({ data: [channel("1", { messages: [message({ sender_user_id: PEER })] })] });
    await runChatAction({ type: "editMessage", chat: "1", id: "500", text: "Hijack" }, { say });
    expect(api.EditMessageApi, "an edit of the other person's message reached the chat backend").not.toHaveBeenCalled();
  });

  it("a new label takes my old label off first, then puts the new one on (one per message)", async () => {
    useAppStore.setState({
      data: [channel("1", { messages: [message({ tags: [{ tag: "orders", count: 1, user_ids: [ME] }] })] })],
    });
    await runChatAction({ type: "category", chat: "1", id: "500", category: "payment" }, { say });
    expect(api.ToggleMessageTag.mock.calls, "the old label was not taken off before the new one went on").toEqual([
      ["1", "500", "orders"],
      ["1", "500", "payment"],
    ]);
  });

  it("the same label again sends nothing; null takes my label off", async () => {
    useAppStore.setState({
      data: [channel("1", { messages: [message({ tags: [{ tag: "orders", count: 1, user_ids: [ME] }] })] })],
    });
    await runChatAction({ type: "category", chat: "1", id: "500", category: "orders" }, { say });
    expect(api.ToggleMessageTag, "choosing the label the message has sent a toggle").not.toHaveBeenCalled();
    await runChatAction({ type: "category", chat: "1", id: "500", category: null }, { say });
    expect(api.ToggleMessageTag, "taking the label off did not toggle 'orders' off").toHaveBeenCalledWith("1", "500", "orders");
  });

  it("the other person's label is not mine: a new label only puts mine on", async () => {
    useAppStore.setState({
      data: [channel("1", { messages: [message({ tags: [{ tag: "orders", count: 1, user_ids: [PEER] }] })] })],
    });
    await runChatAction({ type: "category", chat: "1", id: "500", category: "payment" }, { say });
    expect(api.ToggleMessageTag.mock.calls, "the other person's label was toggled").toEqual([["1", "500", "payment"]]);
  });

  it("a reminder is set at the chosen time, and cancelled by its reminder id", async () => {
    const at = new Date("2026-11-05T09:00:00").getTime();
    await runChatAction({ type: "remind", chat: "1", id: "500", at }, { say });
    expect(api.SetMessageReminder, "the reminder did not reach the chat backend at the chosen time").toHaveBeenCalledWith(
      "1",
      "500",
      new Date(at),
    );
    useAppStore.setState({
      data: [channel("1", { messages: [message({ reminder: { id: "r9", remind_at: "", created_at: "" } })] })],
    });
    await runChatAction({ type: "remind", chat: "1", id: "500", at: null }, { say });
    expect(api.CancelMessageReminder, "the reminder was not cancelled by its id r9").toHaveBeenCalledWith("1", "500", "r9");
  });

  it("the open chat's messages are found too (older pages live only there)", async () => {
    useAppStore.setState({ activeChat: channel("1", { messages: [message({ id: "42" })] }) });
    await runChatAction({ type: "deleteMessage", chat: "1", id: "42" }, { say });
    expect(local.DeleteMessage, "a message loaded only in the open chat was not found").toHaveBeenCalledWith("1", "42", false);
  });
});

describe("chat actions — no chat backend yet (A-8)", () => {
  it("a reaction and the call switch say 'Soon available' and send nothing", async () => {
    await runChatAction({ type: "react", chat: "1", id: "500", emoji: "👍" }, { say });
    expect(say, "a reaction did not say 'Soon available'").toHaveBeenCalledWith(expect.stringMatching(/^soon available$/i));
    say.mockClear();
    await runChatAction({ type: "calls", chat: "1" }, { say });
    expect(say, "the call switch did not say 'Soon available'").toHaveBeenCalledWith(expect.stringMatching(/^soon available$/i));
  });
});
