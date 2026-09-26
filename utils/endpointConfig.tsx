import UPDATED_API_DATA from "migration.staging";

export const CUSTOMER_INFO_URL = "/customer/info";
export const FIREBASE_SETTINGS_URL =
  "/firebase_device_tokens/my_firebase_settings";

export const SEND_OTP = "/auth/phone/send_otp";

export const STARTER_SETTINGS = "/web/home/startingSettings";

export const PRODUCT_DELIVERY_TIMES = "/web/product/delivery_times";

// Detaches a device's FCM registration from the account. Called server-side by
// /api/auth/logout (post-response), never from the client.
export const REMOVE_FCM_TOKEN_URL = "/api/v1/firebase_tokens/remove-token";

export const GET_CONTATCS_URL = "/api/v1/users/my_contacts";
export const SEND_MESSAGE_URL = "/api/v1/messages/send";

export const SEARCH_CONTACTS_URL = "/api/v1/users/search/";
export const DELETE_CHAT_URL = "/api/v1/channels/destroy";
export const SET_CHANNEL_OPT_UTL = UPDATED_API_DATA.MOD_UPDATE_CHAT_URL;

// Chat message actions (used with fetchData `server: "chat"`).
export const EDIT_MESSAGE_URL = "/api/v1/messages/update";
export const MESSAGE_TAGS_URL = (messageId: string | number) =>
  `/api/v1/messages/${messageId}/tags`;
export const MESSAGE_REMINDERS_URL = (messageId: string | number) =>
  `/api/v1/messages/${messageId}/reminders`;
export const MY_REMINDERS_URL = "/api/v1/messages/reminders";
export const CANCEL_REMINDER_URL = (reminderId: string | number) =>
  `/api/v1/messages/reminders/${reminderId}`;
export const ARCHIVE_CHANNEL_URL = (channelId: string | number) =>
  `/api/v1/channels/${channelId}/archive`;
export const UNREAD_CHANNEL_URL = (channelId: string | number) =>
  `/api/v1/channels/${channelId}/unread`;

// Comment backend (used with fetchData `server: "comments"`).
export const CREATE_COMMENT_URL = "/public_comment/comments/create";
export const UPDATE_COMMENT_URL = (id: string) =>
  `/public_comment/comments/${id}/update`;
export const DELETE_COMMENT_URL = (id: string) =>
  `/public_comment/comments/${id}/delete`;
export const TRANSLATE_COMMENT_URL = (id: string) =>
  `/public_comment/comments/${id}/translate`;
export const LIKE_COMMENT_URL = "/public_comment/likes/like";
export const UNLIKE_COMMENT_URL = "/public_comment/likes/unlike";
// ###EDIT###
