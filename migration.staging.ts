let stagingEnv = {
  MOD_CHAT_URL: "/api/v2/channels/my_channels",
  MOD_MEDIA_CHAT_URL: "/api/v2/channels/__/media",
  MOD_UPDATE_CHAT_URL: "/api/v1/channel_members/update",
  MOD_END_CALL: "/api/v1/end_call",
  MOD_CONTACTS_METHOD: "GET",
  MOD_CHAT_METHOD: "POST",
  MOD_DATE_TIME_METHOD: "GET",
};

let NEW_CHATEnv = {
  MOD_CHAT_URL: "/api/v1/channels/my_channels",
  MOD_MEDIA_CHAT_URL: "/api/v1/channels/__/media",
  MOD_UPDATE_CHAT_URL: "/api/v1/channels/update",
  MOD_END_CALL: "/api/v1/messages/end_call",
  MOD_CONTACTS_METHOD: "POST",
  MOD_CHAT_METHOD: "POST",
  MOD_DATE_TIME_METHOD: "POST",
};
// let UPDATED_API_DATA = stagingEnv;
let UPDATED_API_DATA = NEW_CHATEnv;
export default UPDATED_API_DATA;
