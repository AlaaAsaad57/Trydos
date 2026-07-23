import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  deleteSecureCookie,
  getSecureCookie,
  setSecureCookieJSON,
  SECURE_COOKIE_OPTIONS,
} from "utils/server/tokenManager";

const REGISTER_GUEST_URL = "/auth/register-guest";

/**
 * Handles market token expiration:
 * 1. Clears stale tokens (MARKET_TOKEN, CHAT_TOKEN, STORIES_TOKEN)
 * 2. Marks chat/stories users as needing re-auth
 * 3. Re-registers as guest via backend, sets the fresh guest MARKET_TOKEN cookie in this response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const oldUserId = body.old_user_id ?? null;

    // Logout guard: if a logout just cleared the cookies, do NOT re-register a
    // guest or write any token/identity cookie — that would resurrect the
    // session. The logout already cleared everything; just acknowledge.
    const guardStore = await cookies();
    if (guardStore.get(COOKIE_NAMES.LOGOUT_GUARD)?.value) {
      return NextResponse.json(
        { expired: true, loggingOut: true },
        { status: 200 },
      );
    }

    // 1. Clear stale tokens
    await Promise.all([
      deleteSecureCookie(COOKIE_NAMES.MARKET_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.CHAT_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.STORIES_TOKEN),
    ]);

    // 2. Mark chat/stories users as needing re-auth
    const [userChat, userStories, userData] = await Promise.all([
      getSecureCookie<any>(COOKIE_NAMES.USER_CHAT),
      getSecureCookie<any>(COOKIE_NAMES.USER_STORIES),
      getSecureCookie<any>(COOKIE_NAMES.USER_DATA),
    ]);

    await Promise.all([
      userChat?.id
        ? setSecureCookieJSON(COOKIE_NAMES.USER_CHAT, {
            ...userChat,
            need_auth: true,
          })
        : Promise.resolve(),
      userStories?.id
        ? setSecureCookieJSON(COOKIE_NAMES.USER_STORIES, {
            ...userStories,
            need_auth: true,
          })
        : Promise.resolve(),
      userData
        ? setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
            ...userData,
            is_phone_verified: 0,
            is_verified: false,
          })
        : Promise.resolve(),
    ]);

    // 3. Re-register as guest — call backend directly so we can set cookies
    // in this response (internal fetch to register-device loses Set-Cookie)
    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";
    const oldGuestUserId = oldUserId || userData?.id || null;

    let response = await fetch(
      process.env.BACKEND_URL /* TEMP TEST: was GO_BACKEND_URL — revert after testing */ + REGISTER_GUEST_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          country,
          language,
          lang: language,
        },
        body: JSON.stringify({ old_guest_user_id: oldGuestUserId }),
        credentials: "omit",
      },
    );

    let data = await response.json();

    if (data.message === "The user does not exist." && oldGuestUserId) {
      response = await fetch(
        process.env.BACKEND_URL /* TEMP TEST: was GO_BACKEND_URL — revert after testing */ + REGISTER_GUEST_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            country,
            language,
            lang: language,
          },
          body: JSON.stringify({ old_guest_user_id: null }),
          credentials: "omit",
        },
      );
      data = await response.json();
    }

    if (!response.ok) {
      LogServerError({ error: data, type: "auth/expire route error" });
      return NextResponse.json(
        { ...data, expired: true },
        { status: response.status },
      );
    }

    // 4. Set the guest MARKET_TOKEN and USER_DATA in this response — client receives them
    const cookieStore = await cookies();
    if (data.data?.token) {
      cookieStore.set({
        name: COOKIE_NAMES.MARKET_TOKEN,
        value: data.data.token,
        ...SECURE_COOKIE_OPTIONS,
      });
    }
    if (data.data?.user) {
      await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...data.data.user,
        expired_at: data.data.expires_at,
      });
    }

    return NextResponse.json(
      {
        ...data,
        data: { ...data.data, token: undefined },
        expired: true,
      },
      { status: 200 },
    );
  } catch (error) {
    LogServerError({ error, type: "auth/expire route error" });
    return NextResponse.json(
      { message: "Expire handling failed" },
      { status: 500 },
    );
  }
}
