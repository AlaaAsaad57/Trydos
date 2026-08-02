import UPDATED_API_DATA from "migration.staging";

export const LOG_IN_STORIES = "/api/v1/users/login";
export const REGISTER_DEVICE_URL = "/auth/register-guest";
export const CUSTOMER_INFO_URL = "/customer/info";
export const FIREBASE_SETTINGS_URL =
  "/firebase_device_tokens/my_firebase_settings";

export const SEND_OTP = "/auth/phone/send_otp";

export const STARTER_SETTINGS = "/web/home/startingSettings";

export const PRODUCT_DELIVERY_TIMES = "/web/product/delivery_times";

export const LOG_IN_CHAT = "/api/v1/users/login";
// Detaches a device's FCM registration from the account. Called server-side by
// /api/auth/logout (post-response), never from the client.
export const REMOVE_FCM_TOKEN_URL = "/api/v1/firebase_tokens/remove-token";

export const GET_CONTATCS_URL = "/api/v1/users/my_contacts";
export const SEND_MESSAGE_URL = "/api/v1/messages/send";

export const SEARCH_CONTACTS_URL = "/api/v1/users/search/";
export const DELETE_CHAT_URL = "/api/v1/channels/destroy";
export const SET_CHANNEL_OPT_UTL = UPDATED_API_DATA.MOD_UPDATE_CHAT_URL;

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
