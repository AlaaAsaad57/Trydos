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
vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(async () => ({ success: true, data: {} })),
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
