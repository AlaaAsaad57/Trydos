export const VERIFY_OTP_ENDPOINT = "/auth/phone/verify_otp_from_guest";
// Go refresh-token exchange (base URL already carries /api/v1). Single-use
// rotation: the presented refresh token is revoked on success — always replace
// BOTH stored tokens with the returned pair.
export const REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token";
// Chat refresh-token exchange (base URL does NOT carry /api/v1, unlike GO_BACKEND_URL).
// Single-use rotation: the presented refresh token is revoked on success — always replace
// BOTH stored cookies with the returned pair.
export const CHAT_REFRESH_TOKEN_ENDPOINT = "/api/v1/auth/refresh-token";
export const LOG_IN_COMMENTS_ENDPOINT = "/public_comment/auth/exchange_token";
export const LOG_IN_CHAT_ENDPOINT = "/api/v1/users/login";
export const LOG_IN_STORIES_ENDPOINT = "/api/v1/users/login";
export const LOG_IN_WALLET_ENDPOINT = "/auth/phone/login-with-id-token";
