import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  setSecureCookieJSON,
  getSecureCookie,
  getTokenForServer,
  deleteSecureCookie,
} from "utils/server/tokenManager";

// Every credential and profile blob that belongs to a sub-service identity:
// chat, stories, wallet, and comments (whose token lives in USER_ID_HASH).
// Registering a brand-new guest replaces whoever was here, so none of these may
// survive — a leftover token keeps authenticating that backend as the previous
// user. `/api/auth/login` re-mints all of them when the shopper re-verifies.
const SUB_SERVICE_COOKIES = [
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
];

const REGISTER_DEVICE_URL = "/auth/register-guest";

export async function POST(request: NextRequest) {
  try {
    // Logout guard: while a logout is in progress (cookies just cleared, guard
    // armed) refuse to mint a token or write identity cookies. Otherwise a
    // request racing the logout would re-register the just-cleared user. The
    // post-logout reload clears the guard, after which fresh-guest registration
    // resumes normally.
    const guardStore = await cookies();
    if (guardStore.get(COOKIE_NAMES.LOGOUT_GUARD)?.value) {
      return NextResponse.json({ loggingOut: true }, { status: 200 });
    }

    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";
    const userDataCookie = await getSecureCookie<any>(COOKIE_NAMES.USER_DATA);
    const token = await getTokenForServer("market");

    // Bodyless per the Go contract: register-guest only creates brand-new
    // guests — no old_guest_user_id (the re-issue-by-id path no longer
    // exists), so there is also no "user does not exist" retry.
    const response = await fetch(
      process.env.GO_BACKEND_URL + REGISTER_DEVICE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          country,
          language,
          lang: language,
        },
        credentials: "omit",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      LogServerError({
        error: data,
        type: "register-device route error",
      });
      return NextResponse.json(data, { status: response.status });
    }

    // Set the guest token pair as HttpOnly cookies (single MARKET_TOKEN auth
    // cookie + rotating MARKET_REFRESH_TOKEN)
    const cookieStore = await cookies();
    if (data.data?.token) {
      // A fresh guest exists, so the previous identity is gone: clear its
      // sub-service cookies in the same response that installs the new token.
      // Gated on the token so a registration that returned 200 without one
      // never strips a session that is still working.
      await Promise.all(SUB_SERVICE_COOKIES.map(deleteSecureCookie));

      cookieStore.set({
        name: COOKIE_NAMES.MARKET_TOKEN,
        value: data.data.token,
        ...SECURE_COOKIE_OPTIONS,
      });
    }
    if (data.data?.refresh_token) {
      cookieStore.set({
        name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
        value: data.data.refresh_token,
        ...REFRESH_COOKIE_OPTIONS,
      });
    }

    // Store user data in HttpOnly cookie
    if (data.data?.user) {
      await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...data.data.user,
        story_user_id: userDataCookie?.story_user_id,
        expired_at: data.data.expires_at,
      });
    }

    // Return user data without the token
    return NextResponse.json(
      {
        ...data,
        data: {
          ...data.data,
          token: undefined, // Strip token from response
          refresh_token: undefined, // Never expose the refresh token (NFR-3)
        },
      },
      { status: 200 ,headers:{
     
      }},
    );
  } catch (error) {
    LogServerError({ error, type: "register-device route error" });
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 ,headers:{
        
      }},
    );
  }
}
