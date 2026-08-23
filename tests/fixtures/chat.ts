// Builders for a chat message and its sender.
//
// Where the shapes come from (C-5): the `Message`, `User` and `MessageStatus`
// interfaces in utils/types/chat/index.ts. The types come in through
// `import type`, which the compiler removes, so no production module is loaded
// here.
//
// The sender's phone is all zeroes and every id says "test" — nothing belongs
// to a real person or a real conversation.
import type { Message, MessageStatus, User } from "utils/types/chat";

/** The person who sent or received a message. */
export function buildChatUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Test User",
    username: "test-user",
    mobile_phone: "+10000000000",
    photo_path: "/user/test-user.png",
    created_at: "2030-01-01T00:00:00.000Z",
    contact_user: null,
    ...overrides,
  };
}

/** One reader's view of a message: sent, received, watched, deleted. */
export function buildMessageStatus(
  overrides: Partial<MessageStatus> = {},
): MessageStatus {
  return {
    id: 1,
    user_id: 2,
    is_sent: true,
    is_received: 1,
    is_watched: false,
    is_deleted: 0,
    delete_for_all: false,
    message_deleted_at: null,
    watched_at: null,
    received_at: "2030-01-01T00:00:00.000Z",
    created_at: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * One chat message. `message_content` uses the object form
 * (`MessageContent`), which is what a plain text message carries.
 */
export function buildChatMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "test-message-1",
    mid: "test-message-1",
    sender_user_id: 1,
    sender_mobile_phone: "+10000000000",
    receiver_user_id: 2,
    channel_id: "test-channel-1",
    message_description: "Test message",
    extra_fields: null,
    parent_message_id: "",
    is_forward: 0,
    call_status: null,
    created_at: "2030-01-01T00:00:00.000Z",
    duration_in_seconds: null,
    message_content: {
      message_id: "test-message-1",
      content: "Test message",
      is_locked_by_admin_for_delete: 0,
      is_locked_by_admin_for_update: 0,
    },
    message_type: {
      name: "text",
      event_name: "message",
      created_at: null,
    },
    deleted_by_user_id: null,
    sender_user: buildChatUser(),
    message_status: [buildMessageStatus()],
    parent_message: null,
    message_files: [],
    ...overrides,
  };
}
