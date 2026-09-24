export const VERIFY_OTP_ENDPOINT = "/auth/phone/verify_otp_from_guest";
// Go refresh-token exchange (base URL already carries /api/v1). Single-use
// rotation: the presented refresh token is revoked on success — always replace
// BOTH stored tokens with the returned pair.
export const REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token";
// Chat refresh-token exchange (base URL does NOT carry /api/v1, unlike GO_BACKEND_URL).
// Single-use rotation: the presented refresh token is revoked on success — always replace
// BOTH stored cookies with the returned pair.
export const CHAT_REFRESH_TOKEN_ENDPOINT = "/api/v1/auth/refresh-token";
// Stories refresh-token exchange (same backend contract as chat: single-use
// rotation, same path, same response envelope).
export const STORIES_REFRESH_TOKEN_ENDPOINT = "/api/v1/auth/refresh-token";
// Comments refresh-token exchange. Same single-use rotation contract as chat and
// stories, but its own path on the comments host (COMMENT_BACKEND_URL, which is
// a bare host with no /api/v1 prefix).
export const COMMENTS_REFRESH_TOKEN_ENDPOINT =
  "/public_comment/auth/refresh-token";
export const LOG_IN_COMMENTS_ENDPOINT = "/public_comment/auth/exchange_token";
export const LOG_IN_CHAT_ENDPOINT = "/api/v1/users/login";
export const LOG_IN_STORIES_ENDPOINT = "/api/v1/users/login";
export const LOG_IN_WALLET_ENDPOINT = "/auth/phone/login-with-id-token";
