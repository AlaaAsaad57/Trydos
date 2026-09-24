// The chat slice (store/chat/reducer.ts): what each action does to the state.
//
// The slice is a plain function of `set` and `get`, so these tests drive it
// through a small stand-in store instead of the whole combined store. The chat
// backend calls it makes (`Recive`, `watchChannel`) and the signed-in chat user
// are replaced, so nothing here touches the network.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { recive, watchChannelAction, chatUser, showError } = vi.hoisted(() => ({
  recive: vi.fn(),
  watchChannelAction: vi.fn(),
  chatUser: { current: { id: 1 } as any },
  showError: vi.fn(),
}));

vi.mock("store/chat/actions", () => ({
  Recive: (...a: any[]) => recive(...a),
  watchChannel: (...a: any[]) => watchChannelAction(...a),
  getMediaReducer: (media: string, data: any) => ({ [media]: data }),
}));

vi.mock("utils/functions", () => ({
  getUserChat: () => chatUser.current,
  translateFunction: (key: string) => key,
}));

vi.mock("@/store/notifications/reducer", () => ({
  showErrorNotification: (...a: any[]) => showError(...a),
}));

import { useChatStore } from "store/chat/reducer";

/** A stand-in store: `set` merges like zustand does, `get` reads it back. */
function makeStore(initial: Record<string, any> = {}) {
  let state: any;
  const set = (patch: any) => {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state = { ...useChatStore(set, get), ...initial };
  return { get: () => state };
}

const ME = 1;
const THEM = 2;

function status(user_id: number, extra: Record<string, any> = {}) {
  return { user_id, is_watched: false, is_received: 0, watched_at: null, received_at: null, ...extra };
}

function msg(id: any, extra: Record<string, any> = {}) {
  return {
    id,
    sender_user_id: ME,
    message_type: { name: "TextMessage" },
    message_status: [status(ME), status(THEM)],
    ...extra,
  };
}

function channel(id: any, extra: Record<string, any> = {}) {
  return {
    id,
    messages: [msg(`${id}-m1`)],
    channel_members: [
      { user_id: ME, mute: 0, pin: 0 },
      { user_id: THEM, mute: 0, pin: 0 },
    ],
    ...extra,
  };
}

beforeEach(() => {
  chatUser.current = { id: ME };
  recive.mockClear();
  watchChannelAction.mockClear();
  showError.mockClear();
});

describe("chat slice — simple setters", () => {
  it("stores what each plain setter is given", () => {
    const s = makeStore();
    const a = s.get();
    a.setServerTime("t");
    a.setCallLoading(true);
    a.setCallLoadingState(true);
    a.setLastNotificationDate("d");
    a.setContacts([{ id: 1 }]);
    a.setChatSearchResults([{ id: 2 }]);
    a.setForwardMessage({ id: 3 });
    a.setNotificationModal(true);
    a.setNotificationPermission(true);
    a.setUserAnswerCall();
    a.setMain("chat");
    a.setNameModal(true);
    a.setFirebaseToken("fb");
    a.setChatLoading();
    a.setQouted({ q: 1 });
    a.setMessagesPage(55);
    a.showNotificationIndicator([{ order_id: 1 }]);
    a.setReplyMessage({ r: 1 });
    a.setChatSearchValue("hey");
    a.setChatSearchId({ id: 9 });
    a.setChatSearchLoading(true);
    a.setRefs();
    const st = s.get();
    expect(st.Server_time, "server time was not stored").toBe("t");
    expect(st.callLoading, "call loading was not stored").toBe(true);
    expect(st.call_loading, "call list loading flag was not stored").toBe(true);
    expect(st.lastNotification, "last notification date was not stored").toBe("d");
    expect(st.contacts, "contacts were not stored").toEqual([{ id: 1 }]);
    expect(st.chatSearchResults, "chat search results were not stored").toEqual([{ id: 2 }]);
    expect(st.forwarded_message, "the forwarded message was not stored").toEqual({ id: 3 });
    expect(st.isNotificationModal, "the notification modal flag was not stored").toBe(true);
    expect(st.NotificationPremission, "the notification permission was not stored").toBe(true);
    expect(st.isCallIncoming, "answering did not clear the incoming flag").toBe(false);
    expect(st.main, "setMain did not store the view").toBe("chat");
    expect(st.nameModal, "the name modal flag was not stored").toBe(true);
    expect(st.fbToken, "the push token was not stored").toBe("fb");
    expect(st.chat_loading, "setChatLoading did not raise the flag").toBe(true);
    expect(st.qouted, "the quoted message was not stored").toEqual({ q: 1 });
    expect(st.fetch, "setMessagesPage did not stop fetching").toBe(false);
    expect(st.mid, "setMessagesPage did not store the message id").toBe(55);
    expect(st.showNotificaionCircle, "the notification circles were not stored").toEqual([{ order_id: 1 }]);
    expect(st.replyMessage, "the reply message was not stored").toEqual({ r: 1 });
    expect(st.searchChat.searchValue, "the search value was not stored").toBe("hey");
    expect(st.searchChat.activeMessage, "the active search hit was not stored").toEqual({ id: 9 });
    expect(st.searchChat.loading, "the search loading flag was not stored").toBe(true);
    expect(st.refs && st.ref, "setRefs did not flip both refresh flags").toBe(true);
    a.setChatDone();
    expect(s.get().chat_loading, "setChatDone did not clear the flag").toBe(false);
  });

  it("stores a new call client and track list only when they changed", () => {
    const s = makeStore();
    const client = { c: 1 };
    s.get().storeClient(client);
    s.get().storeClient(client);
    expect(s.get().client, "the call client was not stored").toBe(client);
    const tracks = [{ t: 1 }];
    s.get().storeTrack(tracks);
    s.get().storeTrack(tracks);
    expect(s.get().tracks, "the call tracks were not stored").toBe(tracks);
  });

  it("search results jump to the newest hit, and an empty answer resets the offset", () => {
    const s = makeStore();
    s.get().setChatSearchRequest({ messages: [5, 4], offset: 4 });
    expect(s.get().searchChat.activeMessage, "the first jump was not the newest hit").toBe(5);
    expect(s.get().searchChat.offset, "the offset was not stored as a string").toBe("4");
    s.get().setChatSearchRequest(undefined);
    expect(s.get().searchChat.activeMessage, "an empty answer left an old hit active").toBeNull();
    expect(s.get().searchChat.offset, "an empty answer did not reset the offset").toBe("0");
  });
});

describe("chat slice — opening the chat window", () => {
  it("closing resets the active chat and view", () => {
    const s = makeStore({ chatVar: true, activeChat: channel(1), main: "chat" });
    s.get().setChatOpen(false);
    expect(s.get().activeChat, "closing kept an active chat").toBeNull();
    expect(s.get().main, "closing did not go back to the main view").toBe("main");
  });

  it("opens only when the shopper has a profile name, else asks for a name", () => {
    const named = makeStore({ userProfile: { name: "A" } });
    named.get().setChatOpen(true);
    expect(named.get().chatVar, "a shopper with a name could not open the chat").toBe(true);
    const unnamed = makeStore({ userProfile: { name: "" } });
    unnamed.get().setChatOpen(true);
    expect(unnamed.get().chatVar, "a shopper with no name opened the chat").toBe(false);
    expect(unnamed.get().nameModal, "a shopper with no name was not asked for one").toBe(true);
  });
});

describe("chat slice — calls", () => {
  it("setCalls adds only calls not already listed", () => {
    const s = makeStore({ calls: [{ id: 1 }] });
    s.get().setCalls([{ id: 1 }, { id: 2 }]);
    expect(s.get().calls.map((c: any) => c.id), "setCalls did not add the new call once").toEqual([1, 2]);
    expect(s.get().call_loading, "setCalls did not stop the loading flag").toBe(false);
  });

  it("endCall tears the call down for the active call id and for -1", () => {
    const client = { leave: vi.fn(), removeAllListeners: vi.fn() };
    const track = { close: vi.fn(), stop: vi.fn() };
    const s = makeStore({ MessageActiveCall: 7, client, tracks: [track], call: "x", callInProgress: true });
    s.get().endCall(8);
    expect(s.get().call, "ending a different call cleared this one").toBe("x");
    s.get().endCall(7);
    expect(client.leave, "the call client did not leave the call").toHaveBeenCalled();
    expect(track.stop, "the call tracks were not stopped").toHaveBeenCalled();
    expect(s.get().call, "the call was not cleared").toBeNull();
    const none = makeStore({ MessageActiveCall: null, call: "y", tracks: [] });
    none.get().endCall(-1);
    expect(none.get().call, "endCall(-1) did not force the call to end").toBeNull();
  });

  it("storeDuration writes the duration on the matching message of the active chat", () => {
    const empty = makeStore();
    empty.get().storeDuration("x", 3);
    expect(empty.get().activeChat, "storeDuration made an active chat from nothing").toBeNull();
    const ch = channel(1);
    const s = makeStore({ data: [ch], activeChat: ch });
    s.get().storeDuration("1-m1", 42);
    expect(s.get().activeChat.messages[0].duration_in_seconds, "the duration was not stored").toBe(42);
  });

  it("an active chat that is not in the list is still updated", () => {
    const active = channel(9);
    const s = makeStore({ data: [], activeChat: active });
    s.get().storeDuration("9-m1", 5);
    expect(s.get().activeChat.messages[0].duration_in_seconds, "the active chat outside the list was not updated").toBe(5);
  });

  it.each([
    ["setVideoCall", "vid-outgoing", "VideoCall"],
    ["setAudioCall", "aud-outgoing", "VoiceCall"],
  ])("%s starts an outgoing call in the active chat or a new one", (action, callName, typeName) => {
    const ch = channel(1);
    const s = makeStore({ data: [ch], activeChat: ch });
    s.get()[action]("agora", { id: 70, channel: { id: 1 } });
    expect(s.get().call, "the outgoing call was not started").toBe(callName);
    expect(s.get().AgoraToken, "the call token was not stored").toBe("agora");
    expect(s.get().activeChat.messages.at(-1).message_type.name, "the call message was not added").toBe(typeName);
    expect(s.get().data[0].messages.at(-1).id, "the listed chat did not get the call message").toBe(70);

    const fresh = makeStore({ data: [channel(2)], activeChat: null });
    fresh.get()[action]("t", { id: 71, channel: { id: 3, name: "new" } });
    expect(fresh.get().data[0].id, "a call to a new chat did not put it first in the list").toBe(3);
    expect(fresh.get().activeChat.messages.map((m: any) => m.id), "a call to a new chat did not open it with the call message").toEqual([71]);
  });

  it("editCall replaces a known call and prepends a new one", () => {
    const s = makeStore({ calls: [{ id: 1, v: "a" }] });
    s.get().editCall({ id: 1, v: "b" });
    expect(s.get().calls, "editCall did not replace the call").toEqual([{ id: 1, v: "b" }]);
    s.get().editCall({ id: 2 });
    expect(s.get().calls[0].id, "editCall did not prepend the new call").toBe(2);
  });

  it("refuseCall clears the incoming call only for the active call id", () => {
    const s = makeStore({ MessageActiveCall: 5, isCallIncoming: true, call: "x" });
    s.get().refuseCall(6);
    expect(s.get().isCallIncoming, "refusing another call cleared this one").toBe(true);
    s.get().refuseCall(5);
    expect(s.get().isCallIncoming, "refusing the call did not clear it").toBe(false);
    expect(s.get().call, "refusing did not reset the call").toBe(false);
  });

  it("answerCall opens the caller's chat, or builds one from the caller", () => {
    const ch = channel(4);
    const s = makeStore({ data: [ch], callerChannel: { id: 4 }, incomeCallType: "audio", caller: null });
    s.get().answerCall("tok");
    expect(s.get().call, "an audio call was not answered as audio").toBe("aud-incoming");
    expect(s.get().activeChat, "the listed caller chat was not opened").toBe(ch);

    const s2 = makeStore({
      data: [channel(99)],
      callerChannel: null,
      incomeCallType: "video",
      caller: { channel_name: "C", mobile_phone: "p", photo_path: "x" },
    });
    s2.get().answerCall("tok");
    expect(s2.get().call, "a video call was not answered as video").toBe("vid-incoming");
    expect(s2.get().data[0].channel_name, "the caller's chat was not built from the caller").toBe("C");
    expect(s2.get().data[1].id, "the listed chat was lost when the caller's chat was added").toBe(99);
  });

  it("incoming voice and video calls record the caller and the type", () => {
    const s = makeStore();
    const p = { message_id: 3, caller: { channel_name: "x" }, callerChannel: { id: 1 } };
    s.get().setIncomingVoiceCall(p);
    expect(s.get().incomeCallType, "a voice call was not typed audio").toBe("audio");
    s.get().setIncomingCall(p);
    expect(s.get().incomeCallType, "a video call was not typed video").toBe("video");
    expect(s.get().MessageActiveCall, "the incoming call id was not stored").toBe(3);
  });

  it("setCall finds the chat by pusher channel, or clears", () => {
    const ch = channel(1, { pusher_channel_name: "p1" });
    const s = makeStore({ data: [ch] });
    s.get().setCall({ channel: "p1" });
    expect(s.get().call, "setCall did not find the chat by its pusher name").toBe(ch);
    s.get().setCall({ channel: "nope" });
    expect(s.get().call, "an unknown pusher name did not clear the call").toBeNull();
    s.get().setCall(null);
    expect(s.get().call, "no payload did not clear the call").toBeNull();
  });

  it("deleteCall removes the call by id", () => {
    const s = makeStore({ calls: [{ id: 1 }, { id: 2 }] });
    s.get().deleteCall(1);
    expect(s.get().calls, "the call was not removed").toEqual([{ id: 2 }]);
  });
});

describe("chat slice — message flow", () => {
  it("sendNewMessage moves the channel to the top and merges the active chat", () => {
    const s = makeStore({ data: [channel(1), channel(2)], activeChat: channel(2) });
    s.get().sendNewMessage({ channel: { mid: 2, id: 2, name: "x" } });
    expect(s.get().data[0].name, "the new message's channel was not put first").toBe("x");
    expect(s.get().activeChat.name, "the active chat did not get the new channel data").toBe("x");
    const s2 = makeStore({ data: [], activeChat: null });
    s2.get().sendNewMessage({ channel: { mid: 5, id: 5 } });
    expect(s2.get().activeChat, "a message to another chat opened it").toBeNull();
  });

  it("setIsTyping stores the typing state and keeps the old date when none is given", () => {
    const s = makeStore({ data: [channel(1, { activeDate: "old" })] });
    s.get().setIsTyping({ id: 1, desc: "typing" });
    expect(s.get().data[0].status, "the typing status was not stored").toBe("typing");
    expect(s.get().data[0].activeDate, "the last active date was lost").toBe("old");
    s.get().setIsTyping({ id: 1, desc: "", date: "new" });
    expect(s.get().data[0].activeDate, "the new active date was not stored").toBe("new");
  });

  it("watchChannelEvent marks the other reader's statuses as watched", () => {
    const ch = channel(1, {
      messages: [
        msg("a"),
        msg("b", { message_status: [status(THEM, { watched_at: "kept" })] }),
        msg("c", { message_type: { name: "VoiceCall" } }),
      ],
    });
    const s = makeStore({ data: [ch], newChats: [{ id: "1" }, { id: "2" }] });
    s.get().watchChannelEvent(0 as any);
    expect(s.get().data[0], "an empty payload changed the state").toBe(ch);
    s.get().watchChannelEvent(1);
    const [a, b, c] = s.get().data[0].messages;
    expect(a.message_status[1].is_watched, "the other reader was not marked as watched").toBe(true);
    expect(typeof a.message_status[1].watched_at, "no watched time was filled in").toBe("string");
    expect(a.message_status[0].is_watched, "my own status was marked by the other reader's event").toBe(false);
    expect(b.message_status[0].watched_at, "an existing watched time was replaced").toBe("kept");
    expect(c.message_status[1].is_watched, "a call message was marked watched").toBe(false);
    expect(s.get().newChats.map((x: any) => x.id), "the watched chat stayed in new chats").toEqual(["2"]);
  });

  it("watchChannel tells the chat backend, and marks my statuses watched", () => {
    const s = makeStore({ data: [channel(1)], newChats: [{ id: 1 }] });
    s.get().watchChannel(1);
    expect(watchChannelAction, "the chat backend was not told the channel was watched").toHaveBeenCalledWith(1);
    expect(s.get().data[0].messages[0].message_status[0].is_watched, "my status was not marked watched").toBe(true);
    expect(s.get().newChats, "the chat stayed in new chats").toEqual([]);

    s.get().watchChannel("2");
    expect(watchChannelAction, "a numeric string id was not sent").toHaveBeenCalledWith("2");

    const unknown = makeStore({ data: [channel(1)], newChats: [{ id: 3 }, { id: 4 }] });
    const listBefore = unknown.get().data;
    unknown.get().watchChannel(3);
    expect(unknown.get().data, "watching an unlisted chat changed the list").toBe(listBefore);
    expect(unknown.get().newChats, "the watched unlisted chat stayed in new chats").toEqual([{ id: 4 }]);

    const draft = makeStore({ data: [], activeChat: channel("ch1"), newChats: [{ id: "ch1" }] });
    draft.get().watchChannel("ch1");
    expect(watchChannelAction, "a draft 'ch' id was sent to the chat backend").not.toHaveBeenCalledWith("ch1");
    expect(draft.get().activeChat.messages[0].message_status[0].is_watched, "the draft chat was not marked watched").toBe(true);
  });

  it("receiveChannelEvent tells the chat backend and marks the other reader received", () => {
    const s = makeStore({ data: [channel(1)] });
    s.get().receiveChannelEvent(0 as any);
    expect(recive, "an empty payload was sent").not.toHaveBeenCalled();
    s.get().receiveChannelEvent(1);
    expect(recive, "the chat backend was not told the message was received").toHaveBeenCalledWith(1);
    expect(s.get().data[0].messages[0].message_status[1].is_received, "the other reader was not marked received").toBe(1);
    s.get().receiveChannelEvent("ch1");
    expect(recive, "a draft 'ch' id was sent to the chat backend").not.toHaveBeenCalledWith("ch1");
  });

  it("openChat by id picks the listed chat, else uses the payload", () => {
    const ch = channel(1, { name: "listed" });
    const s = makeStore({ data: [ch], newChats: [{ id: 1 }] });
    s.get().openChat({ id: 1 });
    expect(s.get().activeChat, "the listed chat was not opened").toBe(ch);
    expect(s.get().newChats, "the opened chat stayed in new chats").toEqual([]);
    s.get().openChat({ id: 99 });
    expect(s.get().activeChat, "an unlisted chat was not opened from the payload").toEqual({ id: 99 });
    s.get().openChat({ id: "ch5" });
    expect(s.get().first, "a draft chat did not reset paging").toBe(true);
    expect(s.get().activeChat.id, "the draft chat was not opened").toBe("ch5");
  });

  it("sendMessage to a new public chat prepends it", () => {
    const act = channel("ch1", { messages: [] });
    const s = makeStore({ data: [], activeChat: act });
    s.get().sendMessage({ act, isNew: true, message: { id: 1 } });
    expect(s.get().data[0].messages, "the new chat was not listed with the message").toEqual([{ id: 1 }]);
    expect(s.get().activeChat.messages, "the active new chat did not get the message").toEqual([{ id: 1 }]);
    const other = makeStore({ data: [], activeChat: channel(5) });
    other.get().sendMessage({ act, isNew: true, message: { id: 1 } });
    expect(other.get().activeChat.id, "sending to a new chat replaced a different active chat").toBe(5);
  });

  it("sendMessage to a new private chat only updates the active chat", () => {
    const act = channel("ch1", { messages: [] });
    const s = makeStore({ data: [], activeChat: act });
    s.get().sendMessage({ act, isNew: true, isPrivate: true, message: { id: 1 } });
    expect(s.get().activeChat.messages, "the private chat did not get the message").toEqual([{ id: 1 }]);
    expect(s.get().data, "a private chat was added to the list").toEqual([]);
    const other = makeStore({ data: [], activeChat: null });
    other.get().sendMessage({ act, isNew: true, isPrivate: true, message: { id: 1 } });
    expect(other.get().activeChat, "a private message opened a chat").toBeNull();
  });

  it("sendMessage to an existing private chat appends only when it is active", () => {
    const act = channel(3);
    const s = makeStore({ activeChat: null });
    s.get().sendMessage({ act, isPrivate: true, message: { id: 1 } });
    expect(s.get().activeChat, "a private message with no active chat changed it").toBeNull();
    const s2 = makeStore({ activeChat: act });
    s2.get().sendMessage({ act, isPrivate: true, message: { id: "n" } });
    expect(s2.get().activeChat.messages.at(-1).id, "the private message was not appended").toBe("n");
  });

  it("sendMessage to an existing chat appends once and moves it to the top", () => {
    const s = makeStore({ data: [channel(1), channel(2)], activeChat: channel(2) });
    s.get().sendMessage({ act: { id: 2 }, message: { id: "new" } });
    expect(s.get().data[0].id, "the chat was not moved to the top").toBe(2);
    expect(s.get().data[0].messages.at(-1).id, "the message was not appended").toBe("new");
    s.get().sendMessage({ act: { id: 2 }, message: { id: "new" } });
    expect(s.get().data[0].messages.filter((m: any) => m.id === "new").length, "the same message was appended twice").toBe(1);
    const missing = makeStore({ data: [channel(1)], activeChat: null });
    const before = missing.get().data;
    missing.get().sendMessage({ act: { id: 7 }, message: { id: "x" } });
    expect(missing.get().data, "a message to an unlisted chat changed the list").toBe(before);
  });

  it("sendRealMessage swaps the pending copy for the real one in a private chat", () => {
    const s = makeStore({
      activeChat: { id: "ch1", messages: [{ mid: "m1", id: "m1", message_status: ["s"] }] },
    });
    s.get().sendRealMessage({ isPrivate: true, mid: "m1", id: 50, channel_id: 9 });
    expect(s.get().activeChat.id, "the private chat did not take the real channel id").toBe(9);
    expect(s.get().activeChat.messages[0].id, "the pending copy was not replaced").toBe(50);
    expect(s.get().activeChat.messages[0].message_status, "the pending status was lost").toEqual(["s"]);
    const none = makeStore({ activeChat: null });
    none.get().sendRealMessage({ isPrivate: true, mid: "m", id: 1, channel_id: 2 });
    expect(none.get().activeChat.messages, "a private answer with no chat did not start empty").toEqual([]);
  });

  it("sendRealMessage appends a received message and lists the chat as new", () => {
    const s = makeStore({ data: [channel(1), channel(2)], activeChat: channel(1), newChats: [] });
    s.get().sendRealMessage({ cid: 2, recive: true, sender_user_id: THEM, id: 77, mid: "z" });
    expect(s.get().data[0].id, "the chat with the new message was not moved to the top").toBe(2);
    expect(s.get().data[0].messages.at(-1).id, "the received message was not appended").toBe(77);
    expect(s.get().newChats.map((c: any) => c.id), "the other chat was not marked as new").toEqual([2]);
    s.get().sendRealMessage({ cid: 2, recive: true, sender_user_id: THEM, id: 77, mid: "z" });
    expect(s.get().data[0].messages.filter((m: any) => m.id === 77).length, "the same message was appended twice").toBe(1);

    const noActive = makeStore({ data: [channel(3)], activeChat: null, newChats: [] });
    noActive.get().sendRealMessage({ cid: 3, recive: true, sender_user_id: THEM, id: 1, mid: "q" });
    expect(noActive.get().newChats.map((c: any) => c.id), "with no chat open the chat was not marked new").toEqual([3]);

    const unknown = makeStore({ data: [channel(3)], activeChat: null, newChats: [] });
    const before = unknown.get().data;
    unknown.get().sendRealMessage({ cid: 8, recive: true, sender_user_id: THEM, id: 1, mid: "q" });
    expect(unknown.get().data, "an answer for an unlisted chat changed the list").toBe(before);
    expect(unknown.get().newChats, "an unlisted chat was marked new").toEqual([]);
  });

  it("sendRealMessage for my own sent message swaps the copy and takes the channel id", () => {
    const ch = channel("ch1", { messages: [{ mid: "m", id: "m", message_status: [] }] });
    const s = makeStore({ data: [ch], activeChat: ch, newChats: [] });
    s.get().sendRealMessage({ cid: "ch1", channel_id: 10, mid: "m", id: 5, sender_user_id: ME });
    expect(s.get().data[0].id, "the listed chat did not take the real channel id").toBe(10);
    expect(s.get().data[0].messages[0].id, "the pending copy was not replaced").toBe(5);
  });
});

describe("chat slice — loading chats and pages", () => {
  it("setChats merges pages, puts pinned chats first once, and finds new unread chats", () => {
    const pinned = channel(1);
    const known = channel(2);
    const s = makeStore({ data: [pinned, known], activeChat: { id: 2 } });
    const unread = channel(3, {
      messages: [msg("u", { message_status: [status(ME, { is_watched: false })] })],
    });
    const read = channel(4, {
      messages: [msg("r", { message_status: [status(ME, { is_watched: true })] })],
    });
    s.get().setChats([channel(2, { name: "fresh" }), unread, read], [channel(1)]);
    expect(s.get().data.map((c: any) => c.id), "the pinned chat was not first, or listed twice").toEqual([1, 2, 3, 4]);
    expect(s.get().activeChat.name, "the active chat was not refreshed from the page").toBe("fresh");
    expect(s.get().newChats.map((c: any) => c.id), "only the unread, unknown chat should be new").toEqual([3]);
    expect(s.get().chatUsers, "the other member of each chat was not listed").toEqual([THEM, THEM, THEM]);
  });

  it("setChats keeps an active chat not on the page and clears when none is open", () => {
    const s = makeStore({ data: [], activeChat: { id: 50 } });
    s.get().setChats([channel(1)], []);
    expect(s.get().activeChat, "an active chat not on this page was dropped").toEqual({ id: 50 });
    const n = makeStore({ data: [], activeChat: null });
    n.get().setChats([channel(1)], []);
    expect(n.get().activeChat, "no open chat did not stay empty").toBeNull();
  });

  it("setPageData prepends older messages without duplicates", () => {
    const s = makeStore({ data: [channel(1)], activeChat: channel(1), mid: 9 });
    s.get().setPageData({ ch: 1, mes: [{ id: "old" }, { id: "1-m1" }] });
    expect(s.get().data[0].messages.map((m: any) => m.id), "older messages were not prepended once").toEqual(["old", "1-m1"]);
    expect(s.get().mid, "a non-empty page reset the paging id").toBe(9);
    s.get().setPageData({ ch: 1, mes: [] });
    expect(s.get().mid, "an empty page did not stop paging").toBeNull();
  });

  it("setPageData for an unlisted chat updates the active chat only", () => {
    const s = makeStore({ data: [], activeChat: channel(5), mid: 3 });
    s.get().setPageData({ ch: 5, mes: [{ id: "o" }] });
    expect(s.get().activeChat.messages[0].id, "the active chat did not get the older page").toBe("o");
    s.get().setPageData({ ch: 5, mes: [] });
    expect(s.get().mid, "an empty page did not stop paging").toBeNull();
    const none = makeStore({ data: [], activeChat: null, fetch: false });
    none.get().setPageData({ ch: 5, mes: [] });
    expect(none.get().fetch, "a page with no chat to put it in changed the state").toBe(false);
  });
});

describe("chat slice — chat settings", () => {
  it("muteChat sets my mute flag on the chat", () => {
    const s = makeStore({ data: [channel(1)] });
    s.get().muteChat({ id: 1, value: true });
    expect(s.get().data[0].channel_members[0].mute, "the chat was not muted for me").toBe(1);
    expect(s.get().data[0].channel_members[1].mute, "the other member was muted").toBe(0);
    s.get().muteChat({ id: 1, value: false });
    expect(s.get().data[0].channel_members[0].mute, "the chat was not unmuted").toBe(0);
  });

  it("pinChat pins my membership, and refuses a fourth pin with a toast", () => {
    const s = makeStore({ data: [channel(1), channel(2)], pinnedChats: [] });
    s.get().pinChat({ id: 1, value: true });
    const pinned = s.get().data.find((c: any) => c.id === 1);
    expect(pinned.channel_members[0].pin, "the chat was not pinned for me").toBe(1);
    s.get().pinChat({ id: 1, value: false });
    expect(s.get().data.find((c: any) => c.id === 1).channel_members[0].pin, "the chat was not unpinned").toBe(0);
    const before = s.get().data;
    s.get().pinChat({ id: 99, value: true });
    expect(s.get().data, "pinning an unknown chat changed the list").toBe(before);
    const full = makeStore({ data: [channel(1)], pinnedChats: [1, 2, 3] });
    full.get().pinChat({ id: 1, value: true });
    expect(showError, "the shopper was not told only 3 chats can be pinned").toHaveBeenCalledWith("only 3 pinned chats allowed");
  });

  it("updateChannelBlockStatus flags the member in the list, the active chat and new chats", () => {
    const s = makeStore({
      data: [channel(1)],
      activeChat: channel(1),
      newChats: [channel(1), channel(2), null, { id: 1 }],
    });
    s.get().updateChannelBlockStatus({ channelId: undefined as any, userId: 2, isBlocked: true });
    expect(s.get().data[0].channel_members[1].is_blocked, "a block with no channel id changed state").toBeUndefined();
    s.get().updateChannelBlockStatus({ channelId: 1, userId: THEM, isBlocked: true });
    expect(s.get().data[0].channel_members[1].is_blocked, "the listed chat did not flag the block").toBe(1);
    expect(s.get().activeChat.channel_members[1].is_blocked, "the active chat did not flag the block").toBe(1);
    expect(s.get().newChats[0].channel_members[1].is_blocked, "the new chat did not flag the block").toBe(1);
    expect(s.get().newChats[1].channel_members[1].is_blocked, "another chat was flagged").toBeUndefined();
    s.get().updateChannelBlockStatus({ channelId: 1, userId: THEM, isBlocked: false });
    expect(s.get().data[0].channel_members[1].is_blocked, "unblocking did not clear the flag").toBe(0);
  });

  it("setUnreadChat, editChatInfo and editChatInfoMedia update the chat", () => {
    const s = makeStore({ data: [channel(1, { message_counts: { a: 1 } }), channel(2)] });
    s.get().setUnreadChat({ id: 1, value: true });
    expect(s.get().data[0].unread, "the chat was not marked unread").toBe(true);
    expect(s.get().data[1].unread, "another chat was marked unread").toBeUndefined();
    s.get().editChatInfoMedia({ id: 1, media: "images", data: 4 });
    expect(s.get().data[0].message_counts, "the media count was not merged").toEqual({ a: 1, images: 4 });
    s.get().editChatInfo({ id: 1, data: { z: 2 } });
    expect(s.get().data[0].message_counts, "the counts were not replaced").toEqual({ z: 2 });
  });

  it("deleteChat drops the chat and closes it", () => {
    const s = makeStore({ data: [channel(1), channel(2)], activeChat: channel(1), main: "chat" });
    s.get().deleteChat({ id: "1" });
    expect(s.get().data.map((c: any) => c.id), "the chat was not removed").toEqual([2]);
    expect(s.get().activeChat, "the deleted chat stayed open").toBeNull();
  });
});

describe("chat slice — deleting messages", () => {
  it("deleteMessage marks the message and empties replies that quote it", () => {
    const ch = channel(1, {
      messages: [
        { id: 5, auth_message_status: { is_deleted: 0 } },
        { id: 6, parent_message: { id: 5, message_content: { content: "hi" } } },
        { id: 7 },
      ],
    });
    const s = makeStore({ data: [ch] });
    s.get().deleteMessage({ ch_id: 1, msg_id: 5 });
    const [a, b, c] = s.get().data[0].messages;
    expect(a.auth_message_status.is_deleted, "the message was not marked deleted").toBe(1);
    expect(b.parent_message.message_content.content, "the quoted text was not emptied").toBe("");
    expect(b.parent_message.auth_message_status.is_deleted, "the quote was not marked deleted").toBe(1);
    expect(c, "an unrelated message changed").toEqual({ id: 7 });
  });

  it("deleteMessage for an unlisted chat updates the active chat, or nothing", () => {
    const s = makeStore({ data: [], activeChat: { id: 9, messages: [{ id: 1 }] } });
    s.get().deleteMessage({ ch_id: 9, msg_id: 1 });
    expect(s.get().activeChat.messages[0].auth_message_status.is_deleted, "the active chat message was not deleted").toBe(1);
    const none = makeStore({ data: [], activeChat: null });
    none.get().deleteMessage({ ch_id: 9, msg_id: 1 });
    expect(none.get().activeChat, "deleting with no chat made one").toBeNull();
  });

  it("deleteErrorMessage drops the failed pending copy", () => {
    const ch = channel(1, { messages: [{ mid: "a" }, { mid: "b" }] });
    const s = makeStore({ data: [ch] });
    s.get().deleteErrorMessage({ ch_id: 1, msg_id: "a" });
    expect(s.get().data[0].messages, "the failed copy was not removed").toEqual([{ mid: "b" }]);
    const act = makeStore({ data: [], activeChat: { id: 4, messages: [{ mid: "a" }] } });
    act.get().deleteErrorMessage({ ch_id: 4, msg_id: "a" });
    expect(act.get().activeChat.messages, "the failed copy stayed in the active chat").toEqual([]);
    const other = makeStore({ data: [], activeChat: { id: 5, messages: [{ mid: "a" }] } });
    other.get().deleteErrorMessage({ ch_id: 4, msg_id: "a" });
    expect(other.get().activeChat.messages, "a different chat lost a message").toEqual([{ mid: "a" }]);
  });
});
