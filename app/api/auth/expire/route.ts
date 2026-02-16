import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  deleteSecureCookie,
  getSecureCookie,
  setSecureCookieJSON,
} from "utils/server/tokenManager";

/**
 * Handles market token expiration:
 * 1. Re-registers as a guest via /api/auth/register-device (internal redirect)
 * 2. Clears stale tokens (MARKET_TOKEN, CHAT_TOKEN, STORIES_TOKEN)
 * 3. Marks chat/stories users as needing re-auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const oldUserId = body.old_user_id ?? null;

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

    // 3. Re-register as guest
    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";

    const registerRes = await fetch(
      new URL("/api/auth/register-device", request.url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-country": country,
          "x-language": language,
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          old_guest_user_id: oldUserId || userData?.id || null,
        }),
      },
    );

    const registerData = await registerRes.json();

    return NextResponse.json(
      {
        ...registerData,
        expired: true,
      },
      { status: registerRes.status },
    );
  } catch (error) {
    LogServerError({ error, type: "auth/expire route error" });
    return NextResponse.json(
      { message: "Expire handling failed" },
      { status: 500 },
    );
  }
}
