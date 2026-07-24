import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  deleteSecureCookie,
  getSecureCookie,
  setSecureCookieJSON,
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  isVerifiedMarketUser,
} from "utils/server/tokenManager";
import { refreshMarketSession } from "utils/server/authRefresh";

const REGISTER_GUEST_URL = "/auth/register-guest";

/**
 * Handles market token expiration:
 * 0. LAST-CHANCE refresh: if a refresh cookie exists, try the Go exchange
 *    first — a race loser arriving here with the winner's valid rotated
 *    cookie renews instead of destroying the session ({renewed: true}; no
 *    nuke, no chat/stories re-auth flags, no verification downgrade). The
 *    helper itself skips verified/Laravel-routed sessions (FR-8) and the
 *    logout guard. Only a genuinely dead/absent token reaches the nuke.
 * 1. Clears stale tokens (MARKET_TOKEN, MARKET_REFRESH_TOKEN, CHAT_TOKEN,
 *    STORIES_TOKEN)
 * 2. Marks chat/stories users as needing re-auth
 * 3. Re-registers as guest via backend (bodyless — the re-issue-by-id path no
 *    longer exists), sets the fresh guest token pair in this response
 *
 * The response carries `wasVerified` — whether the session being nuked belonged
 * to a phone-verified shopper. Captured BEFORE step 1, because step 3 overwrites
 * User-Data with the fresh guest. The client uses it to prompt an immediate
 * re-verification instead of silently downgrading them to an anonymous guest.
 */
export async function POST(request: NextRequest) {
  try {
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

    // 0. Last-chance refresh before any session nuke (round-1 follow-up 2).
    if (guardStore.get(COOKIE_NAMES.MARKET_REFRESH_TOKEN)?.value) {
      const outcome = await refreshMarketSession();
      if (outcome.status === "refreshed") {
        // Renewed cookies are on this response; the session survives intact.
        return NextResponse.json(
          { renewed: true, expired: false },
          { status: 200 },
        );
      }
      // invalid / ineligible / unavailable → fall through to the nuke path.
    }

    // Snapshot the identity BEFORE the nuke — after step 1/3 the User-Data
    // cookie describes the fresh guest, so this is the last point where the
    // outgoing session's verified status can be read.
    const wasVerified = await isVerifiedMarketUser();

    // 1. Clear stale tokens (incl. the dead refresh cookie — deleted only
    // here, after the last-chance attempt above failed)
    await Promise.all([
      deleteSecureCookie(COOKIE_NAMES.MARKET_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.MARKET_REFRESH_TOKEN),
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
    // in this response (internal fetch to register-device loses Set-Cookie).
    // Bodyless per the Go contract: no old_guest_user_id (the re-issue-by-id
    // path — the old account-takeover hole — no longer exists), so there is
    // also no "user does not exist" retry.
    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";

    const response = await fetch(
      process.env.GO_BACKEND_URL + REGISTER_GUEST_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          country,
          language,
          lang: language,
        },
        credentials: "omit",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      LogServerError({ error: data, type: "auth/expire route error" });
      return NextResponse.json(
        { ...data, expired: true, wasVerified },
        { status: response.status },
      );
    }

    // 4. Set the guest token pair and USER_DATA in this response — client
    // receives the cookies, never the token values
    const cookieStore = await cookies();
    if (data.data?.token) {
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
    if (data.data?.user) {
      await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...data.data.user,
        expired_at: data.data.expires_at,
      });
    }

    return NextResponse.json(
      {
        ...data,
        data: { ...data.data, token: undefined, refresh_token: undefined },
        expired: true,
        wasVerified,
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
