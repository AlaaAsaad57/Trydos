// A muted chat must stay quiet.
//
// Mute is stored per member, not per channel: every row in `channel_members`
// carries its own `mute`, and only the row of the signed-in user counts. See
// `muteChat` in store/chat/reducer.ts, which writes exactly that row, and
// components/Chat/pages/ChatLists.js, which reads it back for the row icon.
//
// The push payload never carries the flag, so the foreground handler has to read
// it from the chat list the store already holds. It did not, so every muted chat
// still raised a notification toast.
//
// Unread marks are NOT part of mute: `receiveChannelEvent` and `sendMessage`
// must still run, so the chat list still shows the message and its unread mark.
// That is why each test also checks the message landed in the store — a test
// that only checked "no toast" would pass if the handler had thrown early.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "store";
import { isChannelMutedForMe } from "utils/chatMute";

// The toast we are asserting about. Spied here rather than read off the screen,
// because the handler is not a component and never renders anything itself.
const showChatNotification = vi.fn();

vi.mock("store/notifications/reducer", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    showChatNotification: (...args: any[]) => showChatNotification(...args),
  };
});

// The store actions below reach the chat backend on every received message
// (`Recive`, `watchChannel`). None of that is what this test is about, and a
// real request would make the run depend on a server being up.
const fetchData = vi.fn(async (_request: any): Promise<any> => ({
  success: true,
  data: {},
}));

vi.mock("utils/fetchData", () => ({
  fetchData: (request: any) => fetchData(request),
}));

/** The signed-in chat user. */
const ME = 657;
/** The person on the other end, who sends the message. */
const THEM = 672;
/** The chat both of them are in. */
const CHANNEL_ID = "652";
/** The message already in the chat, so the new one counts as linked. */
const PREVIOUS_MESSAGE_ID = "100";
/** The message that arrives in the push. */
const NEW_MESSAGE_ID = "101";

/** One chat in the list, with the signed-in user's own mute setting. */
const buildChannel = (mute: 0 | 1) => ({
  id: CHANNEL_ID,
  channel_name: "Alaa Test123",
  photo_path: null,
  messages: [
    {
      id: PREVIOUS_MESSAGE_ID,
      created_at: "2026-09-19T10:00:00.000Z",
      sender_user_id: THEM,
      message_type: { name: "TextMessage" },
      message_status: [
        { id: 10, user_id: ME, is_received: 0, is_watched: false },
        { id: 11, user_id: THEM, is_received: 1, is_watched: true },
      ],
    },
  ],
  channel_members: [
    { id: 1, user_id: ME, mute, pin: 0, archived: 0, user: { id: ME } },
    { id: 2, user_id: THEM, mute: 0, pin: 0, archived: 0, user: { id: THEM } },
  ],
});

/** The push the service worker forwards to the tab for a new text message. */
const buildMessagePush = () => ({
  data: {
    type: "message",
    body: JSON.stringify({ type: "message" }),
    data: JSON.stringify({
      prev_message_id: PREVIOUS_MESSAGE_ID,
      message: {
        id: NEW_MESSAGE_ID,
        channel_id: CHANNEL_ID,
        created_at: "2026-09-19T10:05:00.000Z",
        sender_user_id: THEM,
        channel: { id: CHANNEL_ID, channel_name: "Alaa Test123" },
        sender_user: { id: THEM, name: "Alaa Test123" },
        message_type: { name: "TextMessage" },
        message_content: { content: "hello" },
        message_files: [],
        message_status: [],
      },
    }),
  },
});

/** Put the store in the state the app is in while the chat list is open. */
function seedStore(mute: 0 | 1) {
  const initial = useAppStore.getInitialState();
  useAppStore.setState(
    {
      ...initial,
      userChat: { id: ME },
      data: [buildChannel(mute)],
      activeChat: null,
      chatVar: false,
      country: "sy",
      language: "en",
    } as any,
    true as any,
  );
}

/** The message ids the chat holds now, so we can see the message arrived. */
const messageIdsInChat = () =>
  (useAppStore.getState() as any).data
    ?.find((chat: any) => String(chat.id) === CHANNEL_ID)
    ?.messages?.map((message: any) => String(message.id)) ?? [];

describe("a muted chat raises no notification", () => {
  beforeEach(() => {
    showChatNotification.mockClear();
  });

  it("shows no notification for a message in a muted chat", async () => {
    seedStore(1);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildMessagePush(),
    );

    expect(
      messageIdsInChat(),
      "the handler stopped before it stored the message, so this test could not have seen a notification either way",
    ).toContain(NEW_MESSAGE_ID);
    expect(
      showChatNotification.mock.calls.length,
      `the chat is muted for user ${ME} yet a notification toast was raised ${showChatNotification.mock.calls.length} time(s)`,
    ).toBe(0);
  });

  it("still shows a notification for a message in a chat that is not muted", async () => {
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildMessagePush(),
    );

    expect(
      messageIdsInChat(),
      "the handler stopped before it stored the message, so the missing notification below says nothing about mute",
    ).toContain(NEW_MESSAGE_ID);
    expect(
      showChatNotification.mock.calls.length,
      "an unmuted chat raised no notification toast, so the mute check is silencing everything",
    ).toBe(1);
  });
});

// A long message arrives as a "compact" push.
//
// The push has a size limit, so for a long message the chat backend sends only
// ids: no text, no sender and no channel object. The handler read
// `message.channel.id` straight away, threw, and the message never reached the
// chat list. The fix loads the full message from the chat backend by its id
// (`get_all_messages_between_two_messages`, with the same id twice) and then
// runs the normal path.
describe("a compact push for a long message", () => {
  const LONG_TEXT = "x".repeat(10000);

  /** The push exactly as the chat backend sends it for a long message. */
  const buildCompactPush = () => ({
    data: {
      type: "message",
      body: JSON.stringify({ type: "message" }),
      data: JSON.stringify({
        type: "message",
        contact_name: "Alaa",
        prev_message_id: PREVIOUS_MESSAGE_ID,
        is_private: false,
        channel_id: CHANNEL_ID,
        message_id: NEW_MESSAGE_ID,
        message: {
          id: NEW_MESSAGE_ID,
          channel_id: CHANNEL_ID,
          sender_user_id: THEM,
        },
        compact: true,
      }),
    },
  });

  /** The full message, as the chat backend returns it when asked by id. */
  const fullMessage = {
    id: NEW_MESSAGE_ID,
    channel_id: CHANNEL_ID,
    created_at: "2026-09-19T10:05:00.000Z",
    sender_user_id: THEM,
    channel: { id: CHANNEL_ID, channel_name: "Alaa Test123" },
    sender_user: { id: THEM, name: "Alaa Test123" },
    message_type: { name: "TextMessage" },
    message_content: { content: LONG_TEXT },
    message_files: [],
    message_status: [],
  };

  const MESSAGE_BY_ID_URL =
    "/api/v1/messages/get_all_messages_between_two_messages";

  /** The stored copy of the new message, or undefined when it never landed. */
  const storedNewMessage = () =>
    (useAppStore.getState() as any).data
      ?.find((chat: any) => String(chat.id) === CHANNEL_ID)
      ?.messages?.find((message: any) => String(message.id) === NEW_MESSAGE_ID);

  beforeEach(() => {
    showChatNotification.mockClear();
    fetchData.mockReset();
  });

  it("loads the full message by its id and stores it with its text", async () => {
    fetchData.mockImplementation(async (request: any) =>
      request.url === MESSAGE_BY_ID_URL
        ? { success: true, data: [fullMessage] }
        : { success: true, data: {} },
    );
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCompactPush(),
    );

    const lookup = fetchData.mock.calls.find(
      ([request]) => request.url === MESSAGE_BY_ID_URL,
    )?.[0];
    expect(
      lookup,
      "the handler never asked the chat backend for the full message, so a compact push has no text to show",
    ).toBeDefined();
    expect(
      JSON.parse(lookup.body),
      `the chat backend was asked for the wrong message: ${lookup.body}`,
    ).toEqual({
      channel_id: CHANNEL_ID,
      first_message_id: NEW_MESSAGE_ID,
      second_message_id: NEW_MESSAGE_ID,
    });
    expect(
      storedNewMessage()?.message_content?.content,
      "the long message did not reach the chat list with its full text",
    ).toBe(LONG_TEXT);
    expect(
      showChatNotification.mock.calls[0]?.[0],
      "no notification toast named the sender of the long message",
    ).toBe("Alaa Test123");
  });

  it("refreshes the chat list when the chat backend cannot return the message", async () => {
    fetchData.mockImplementation(async (request: any) =>
      request.url === MESSAGE_BY_ID_URL
        ? { success: false, message: "Server Error" }
        : { success: true, data: {} },
    );
    seedStore(0);
    const chat = (await import("services/chat")).default;
    const getChats = vi.spyOn(chat, "getChats").mockResolvedValue(undefined);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCompactPush(),
    );

    expect(
      getChats,
      "the chat backend refused the message lookup and the chat list was not reloaded, so the long message is lost until a page reload",
    ).toHaveBeenCalledWith(true);
    getChats.mockRestore();
  });
});

// The incoming-call bar reads mute off the chat it was handed, `callerChannel`.
// So the handler has to hand it the real chat from the list. When it cannot
// find the chat it builds a stand-in instead, and that stand-in has `mute: 0`
// written into it — which reads as "not muted" and rings.
//
// Finding the chat is the whole point of these tests. The id to look it up by
// is the one the handler already trusts on the next lines,
// `data.message.channel.id`, not the one nested inside the call payload.
describe("a muted chat does not ring", () => {
  /** The call push the backend sends for a voice call. */
  const buildCallPush = () => ({
    data: {
      type: "VoiceCallEvent",
      body: JSON.stringify({ type: "call" }),
      data: JSON.stringify({
        user_id: THEM,
        user: { id: THEM, name: "Alaa Test123", photo_path: null },
        // Two levels deep, because the app posts its own `payload` object and
        // the backend wraps it in another one. store/chat/callActions.ts sends
        // the inner object; public/firebase-messaging-sw.js reads it back as
        // `parsed.payload.payload`.
        payload: {
          payload: {
            user_id: THEM,
            type: "audio",
            channelId: CHANNEL_ID,
            callerName: "Alaa Test123",
            callerPhoto: null,
          },
        },
        message: {
          id: "101",
          channel_id: CHANNEL_ID,
          created_at: "2026-09-19T10:05:00.000Z",
          sender_user_id: THEM,
          channel: {
            id: CHANNEL_ID,
            channel_name: "Alaa Test123",
            photo_path: null,
          },
          sender_user: { id: THEM, name: "Alaa Test123" },
          message_type: { name: "VoiceCall" },
          message_content: { content: "" },
          message_files: [],
          message_status: [],
        },
      }),
    },
  });

  /** What the call bar will read: the chat the handler put in the store. */
  const callerChannelInStore = () =>
    (useAppStore.getState() as any).callerChannel;

  it("hands the call bar the muted chat, not a stand-in that rings", async () => {
    seedStore(1);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCallPush(),
    );

    expect(
      (useAppStore.getState() as any).isCallIncoming,
      "no incoming call was raised at all, so this test cannot tell a silent call from a missing one",
    ).toBe(true);
    expect(
      isChannelMutedForMe(callerChannelInStore(), ME),
      `the call bar was handed a chat that reads as not muted for user ${ME}, so /default.mp3 rings; its members are ${JSON.stringify(
        callerChannelInStore()?.channel_members?.map((member: any) => ({
          user_id: member.user_id,
          mute: member.mute,
        })),
      )}`,
    ).toBe(true);
  });

  it("still rings when the chat is not muted", async () => {
    seedStore(0);
    const { foregroundNotificationHandler } = await import(
      "utils/NotificationHandler"
    );

    await foregroundNotificationHandler.handleNotification(
      () => {},
      buildCallPush(),
    );

    expect(
      (useAppStore.getState() as any).isCallIncoming,
      "no incoming call was raised at all, so the check below says nothing about mute",
    ).toBe(true);
    expect(
      isChannelMutedForMe(callerChannelInStore(), ME),
      "an unmuted chat was handed to the call bar as muted, so no call would ever ring",
    ).toBe(false);
  });
});
