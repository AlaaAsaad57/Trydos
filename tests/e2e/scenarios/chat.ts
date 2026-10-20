// Faked chat answers, for `chat.scripted.spec.ts`.
//
// **Nobody signs in.** The app learns who its chat user is from
// `/api/auth/me` (`services/home.ts` `CheckLogin` → `loginSuccessChat`), and
// the market profile from `/customer/info`. Both are faked here, so a case
// costs no one-time code and no real chat account is ever read or written.
//
// **Shapes are copied from real answers**, measured on staging on 2026-09-27
// (`my_channels`, `messages/send`). Two details the app depends on:
//
// * `ChatMessage.tsx` decides "sent by me" with `sender_user_id ===
//   getUserChat().id` — strict equality, so the two carry the same type here as
//   on the wire (numbers).
// * `isNew` counts a message unread only when `is_watched === false` and
//   `delete_for_all === false` — booleans, not 0/1.
//
// Every value is obviously fake. Ids start at 900 000 so none can be mistaken
// for a real row.

import type { Page } from "@playwright/test";

import type { MockMap, MockResponse } from "../actions/mock";

/** The chat backend's answer envelope. */
const answer = (data: unknown, status = 200): MockResponse => ({
  status,
  body: {
    isSuccessful: status < 400,
    hasContent: true,
    code: status,
    message: status < 400 ? "Data Got!" : "faked failure",
    detailed_error: null,
    data,
  },
});

/** A chat user, as the chat backend describes one. */
export type Person = {
  id: number;
  name: string;
  mobile_phone: string;
  photo_path: null;
  username: null;
};

export const ME: Person = {
  id: 900_001,
  name: "Trydos E2E Chat Probe",
  mobile_phone: "963900000001",
  photo_path: null,
  username: null,
};

/** People the probe shopper chats with. */
export const PEOPLE: Record<"rana" | "sami" | "lina" | "omar" | "dana", Person> = {
  rana: { id: 900_101, name: "Probe Rana", mobile_phone: "963900000101", photo_path: null, username: null },
  sami: { id: 900_102, name: "Probe Sami", mobile_phone: "963900000102", photo_path: null, username: null },
  lina: { id: 900_103, name: "Probe Lina", mobile_phone: "963900000103", photo_path: null, username: null },
  omar: { id: 900_104, name: "Probe Omar", mobile_phone: "963900000104", photo_path: null, username: null },
  dana: { id: 900_105, name: "Probe Dana", mobile_phone: "963900000105", photo_path: null, username: null },
};

/** A minute-by-minute clock, so message order is by time and never a tie. */
const at = (minutesAgo: number): string =>
  new Date(Date.UTC(2026, 8, 20, 12, 0) - minutesAgo * 60_000).toISOString();

/** One text message. `read` is whether the receiver has read it. */
export const textMessage = (options: {
  id: number;
  channelId: number;
  from: Person;
  to: Person;
  text: string;
  minutesAgo: number;
  read?: boolean;
}): Record<string, unknown> => {
  const read = options.read ?? true;
  const status = (userId: number) => ({
    id: options.id * 10 + (userId === options.from.id ? 1 : 2),
    user_id: userId,
    is_sent: true,
    is_received: 1,
    is_watched: userId === options.from.id ? true : read,
    is_deleted: 0,
    delete_for_all: false,
    message_deleted_at: null,
    watched_at: read ? at(options.minutesAgo) : null,
    received_at: at(options.minutesAgo),
    created_at: at(options.minutesAgo),
  });
  return {
    id: String(options.id),
    sender_user_id: options.from.id,
    sender_mobile_phone: options.from.mobile_phone,
    receiver_user_id: options.to.id,
    channel_id: String(options.channelId),
    message_description: "",
    extra_fields: null,
    parent_message_id: null,
    is_forward: 0,
    call_status: null,
    created_at: at(options.minutesAgo),
    updated_at: at(options.minutesAgo),
    is_edited: 0,
    duration_in_seconds: null,
    message_content: {
      message_id: String(options.id),
      content: options.text,
      is_locked_by_admin_for_delete: 0,
      is_locked_by_admin_for_update: 0,
    },
    message_type: { name: "TextMessage", event_name: "TextMessage", created_at: null },
    deleted_by_user_id: null,
    sender_user: options.from,
    auth_message_status: status(ME.id),
    message_status: [status(ME.id), status(options.from.id === ME.id ? options.to.id : options.from.id)],
    message_files: [],
    parent_message: null,
    tags: [],
    reminder: null,
  };
};

/** One direct chat between the probe shopper and `with`.
 *
 *  `messages` newest first, as the chat backend sends them. */
export const channel = (options: {
  id: number;
  with: Person;
  messages?: Record<string, unknown>[];
  pin?: 0 | 1;
  mute?: 0 | 1;
  blocked?: boolean;
  archived?: boolean;
}): Record<string, unknown> => {
  const member = (person: Person, offset: number) => ({
    id: options.id * 10 + offset,
    user_id: person.id,
    is_allowed_to_chat: true,
    is_admin: 0,
    mute: person.id === ME.id ? (options.mute ?? 0) : 0,
    archived: person.id === ME.id && options.archived ? 1 : 0,
    pin: person.id === ME.id ? (options.pin ?? 0) : 0,
    is_blocked: options.blocked ? 1 : 0,
    user: { ...person, created_at: at(10_000), contact_user: null },
    created_at: at(10_000),
  });
  return {
    id: String(options.id),
    channel_name: null,
    order_chat_participant_id: null,
    is_archived: options.archived ? 1 : 0,
    total_unread_message_count: 0,
    created_at: at(10_000),
    updated_at: at(0),
    channel_type: null,
    channel_members: [member(ME, 1), member(options.with, 2)],
    messages: options.messages ?? [],
  };
};

/** The paths the chat layer asks, as they appear in `x-proxy-url`. */
export const CHAT_PATHS = {
  channels: "/api/v1/channels/my_channels",
  contacts: "/api/v1/users/my_contacts",
  calls: "/api/v1/channels/my_calls",
  dateTime: "/api/v1/channels/get_date_time",
  reminders: "/api/v1/messages/reminders",
  send: "/api/v1/messages/send",
  edit: "/api/v1/messages/update",
  channelUpdate: "/api/v1/channels/update",
  channelSearch: "/api/v1/channels/channelSearch",
  messagesOfChannel: "/api/v1/messages/messages_of_channel/",
  between: "/api/v1/messages/get_all_messages_between_two_messages",
  received: "/received",
  watched: "/watched",
  media: "/media",
  ticket: "/api/ticket",
} as const;

/** The app's own auth routes, which a chat shopper's page boots through. */
export const AUTH_PATHS = {
  me: "/api/auth/me",
  registerDevice: "/api/auth/register-device",
  refresh: "/api/auth/refresh",
  clearTokens: "/api/auth/clear-tokens",
  updateUser: "/api/auth/update-user",
  customerInfo: "/customer/info",
} as const;

/** Who `/api/auth/me` says the shopper is. `chatUser: null` is a verified
 *  shopper with no chat account yet. */
export const whoAmI = (options: { chatUser?: Person | null } = {}): MockResponse => ({
  status: 200,
  body: {
    user: {
      id: 999_001,
      name: ME.name,
      phone: ME.mobile_phone,
      is_phone_verified: 1,
    },
    chatUser: options.chatUser === undefined ? ME : options.chatUser,
    storiesUser: { id: 900_501, name: ME.name },
    walletUser: null,
    hasMarketToken: true,
  },
});

/** Everything a chat shopper's page asks while it boots and opens the chat,
 *  answered as "nothing special": the list is `channels`, and every folder
 *  and side list is empty. A case changes one thing. */
export const chatShopper = (options: {
  channels?: Record<string, unknown>[];
  pinned?: Record<string, unknown>[];
  archived?: Record<string, unknown>[];
  chatUser?: Person | null;
} = {}): MockMap => ({
  [AUTH_PATHS.me]: whoAmI({ chatUser: options.chatUser }),
  // A guest registration that registers nobody: no `user` in the answer, so
  // the faked shopper stays the shopper (see `checkoutWorks` in index.ts).
  [AUTH_PATHS.registerDevice]: {
    status: 200,
    body: { isSuccessful: true, success: true, data: {} },
  },
  [AUTH_PATHS.updateUser]: { status: 200, body: { success: true } },
  [AUTH_PATHS.customerInfo]: {
    status: 200,
    body: {
      isSuccessful: true,
      success: true,
      data: {
        customer_info: {
          id: 999_001,
          name: ME.name,
          phone: ME.mobile_phone,
          email: "trydos.e2e.chat.probe@example.com",
          is_phone_verified: 1,
          is_approve_policies: 1,
        },
      },
    },
  },
  "/cart/cart_shipping": answer({ cart: [], count_of_products: 0 }),
  [CHAT_PATHS.channels]: answer({
    channels: options.channels ?? [],
    pinned_channels: options.pinned ?? [],
    missed_fcm_token: false,
  }),
  [CHAT_PATHS.contacts]: answer([]),
  [CHAT_PATHS.calls]: answer([]),
  [CHAT_PATHS.dateTime]: answer({ date_time: at(0) }),
  [CHAT_PATHS.reminders]: answer([]),
  [CHAT_PATHS.received]: answer({}),
  [CHAT_PATHS.watched]: answer({}),
  [CHAT_PATHS.media]: answer({ message_counts: {} }),
  // A chat whose messages do not fill the screen asks for the page before
  // them the moment it opens. None, unless a case says otherwise.
  [CHAT_PATHS.messagesOfChannel]: answer([]),
});

/** Answer the Archived folder with `channels`.
 *
 *  The folder asks the same endpoint as the chat list and differs only in the
 *  body (`archived: true`, `GetArchivedChats`). `mockBackend` matches by path,
 *  so without this the folder would get the main list back — and the main
 *  list hides every chat the folder holds, so every row would vanish.
 *
 *  Register it **after** `mockBackend`: between two page routes the last one
 *  registered is tried first, and this one falls back for everything else. */
export const fakeArchivedFolder = async (
  page: Page,
  channels: Record<string, unknown>[],
): Promise<void> => {
  await page.route("**/api/proxy", async (route) => {
    const request = route.request();
    const url = decodeURI(request.headers()["x-proxy-url"] ?? "");
    let sent: any = null;
    try {
      sent = JSON.parse(request.postData() ?? "null");
    } catch {
      sent = null;
    }
    if (url.includes(CHAT_PATHS.channels) && sent?.archived === true) {
      const reply = answer({ channels, pinned_channels: [], missed_fcm_token: false });
      await route.fulfill({
        status: reply.status,
        contentType: "application/json",
        body: JSON.stringify(reply.body),
      });
      return;
    }
    await route.fallback();
  });
};

export { answer as chatAnswer };
