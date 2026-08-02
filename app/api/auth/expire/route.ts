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
 *    nuke — every sub-service credential survives, no verification downgrade,
 *    which is why steps 1-2 only ever see a truly dead session). The
 *    helper itself skips verified/Laravel-routed sessions (FR-8) and the
 *    logout guard. Only a genuinely dead/absent token reaches the nuke.
 * 1. Clears the whole dead session: the market token pair AND every
 *    sub-service credential and profile blob — chat, stories, wallet, comments
 *    (the comments token lives in USER_ID_HASH). Reaching this point means the
 *    session is genuinely dead (step 0 above already renewed anything that
 *    could still be saved), and step 3 turns this browser into a brand-new
 *    guest — so nothing from the old shopper may survive. Leaving the wallet
 *    (`rdb_at`) or comments token behind let the fresh guest keep calling those
 *    two backends as the previous user.
 * 2. Downgrades User-Data to unverified. This matters for the early return
 *    below: if register-guest fails, step 4 never runs, and without the
 *    downgrade the dead session would still look phone-verified (which also
 *    decides market routing).
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

    // 1. Clear the dead session — the market token pair (incl. the refresh
    // cookie, deleted only here, after the last-chance attempt above failed)
    // and every sub-service credential + profile blob. The shopper becomes a
    // brand-new guest in step 3, so chat, stories, wallet and comments must all
    // start from nothing; a leftover token there would still authenticate as
    // the old user. Re-verifying goes through /api/auth/login, which logs the
    // four sub-services back in and re-mints all of these.
    await Promise.all([
      deleteSecureCookie(COOKIE_NAMES.MARKET_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.MARKET_REFRESH_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.CHAT_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.STORIES_TOKEN),
      deleteSecureCookie(COOKIE_NAMES.WALLET_TOKEN),
      // The comments backend's token — stored under this deliberately opaque
      // cookie name (see COOKIE_NAMES.USER_ID_HASH).
      deleteSecureCookie(COOKIE_NAMES.USER_ID_HASH),
      deleteSecureCookie(COOKIE_NAMES.USER_CHAT),
      deleteSecureCookie(COOKIE_NAMES.USER_STORIES),
      deleteSecureCookie(COOKIE_NAMES.WALLET_USER),
    ]);

    // 2. Downgrade User-Data to unverified. Step 4 replaces it with the fresh
    // guest, but only when register-guest succeeds — on the failure return
    // below this write is the only thing stopping a dead session from still
    // reading as phone-verified.
    const userData = await getSecureCookie<any>(COOKIE_NAMES.USER_DATA);
    if (userData) {
      await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
        ...userData,
        is_phone_verified: 0,
        is_verified: false,
      });
    }

    // 3. Re-register as guest — call backend directly so we can set cookies
    // in this response (internal fetch to register-device loses Set-Cookie).
    // Bodyless per the Go contract: no old_guest_user_id (the re-issue-by-id
    // path — the old account-takeover hole — no longer exists), so there is
    // also no "user does not exist" retry.
    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";
    // TODO GO
    const response = await fetch(
      process.env.BACKEND_URL + REGISTER_GUEST_URL,
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
