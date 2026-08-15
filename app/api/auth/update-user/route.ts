import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  setSecureCookie,
  setSecureCookieJSON,
  getSecureCookie,
  REFRESH_COOKIE_OPTIONS,
} from "utils/server/tokenManager";

// Whitelist of cookie names that can be updated
const UPDATABLE_COOKIES = new Set([
  COOKIE_NAMES.USER_DATA,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
]);

// User cookies whose re-auth payload carries a fresh service access_token that
// must also refresh the dedicated (48h) token cookie the proxy authenticates
// with — so chat/stories auth follows the token cookie, not the nested value.
const TOKEN_COOKIE_FOR: Record<string, string> = {
  [COOKIE_NAMES.USER_CHAT]: COOKIE_NAMES.CHAT_TOKEN,
  [COOKIE_NAMES.USER_STORIES]: COOKIE_NAMES.STORIES_TOKEN,
};

// The same re-auth payload also carries a fresh single-use refresh_token. It
// must be stored with the access token: syncing only the access token left the
// refresh cookie holding the previous — now revoked — value, so the next 401
// exchange failed with `invalid` and the user was prompted again instead of
// being renewed silently.
const REFRESH_COOKIE_FOR: Record<string, string> = {
  [COOKIE_NAMES.USER_CHAT]: COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  [COOKIE_NAMES.USER_STORIES]: COOKIE_NAMES.STORIES_REFRESH_TOKEN,
};

/**
 * Updates user metadata stored in HttpOnly cookies.
 * Used when services/auth.ts modifies user data (e.g., name, profile updates).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: Array<{ name: string; value: unknown }> = body.updates || [];

    const results: string[] = [];

    for (const update of updates) {
      // @ts-ignore
      if (!UPDATABLE_COOKIES.has(update.name)) continue;

      if (update.value === null) {
        // Merge is not possible — skip
        continue;
      }

      // Merge with existing cookie data
      const existing = await getSecureCookie<any>(update.name);
      const merged = existing
        ? {
            ...existing,
            ...(typeof update.value === "object" ? update.value : {}),
          }
        : update.value;

      await setSecureCookieJSON(update.name, merged);

      // Keep the dedicated token cookies (CHAT/STORIES access + refresh) in
      // sync with the fresh pair from re-auth, so the proxy stays
      // authenticated and the pair never drifts apart. The refresh token keeps
      // its own 30d rotating TTL, not the 48h access-token one.
      //
      // Both are read from the INCOMING payload, never from `merged`: the
      // stored blob still holds whatever pair was written at login, while the
      // cookies are rotated (and the blob is not) on every /api/auth/refresh
      // exchange. A name-only update merged over that stale blob would push the
      // revoked login-time tokens back over the freshly rotated ones — undoing
      // the rotation the 401 recovery just performed.
      const incoming: any =
        update.value && typeof update.value === "object" ? update.value : {};

      const tokenCookie = TOKEN_COOKIE_FOR[update.name];
      if (tokenCookie && incoming.access_token) {
        await setSecureCookie(tokenCookie, incoming.access_token);
      }

      const refreshCookie = REFRESH_COOKIE_FOR[update.name];
      if (refreshCookie && incoming.refresh_token) {
        await setSecureCookie(
          refreshCookie,
          incoming.refresh_token,
          REFRESH_COOKIE_OPTIONS,
        );
      }

      results.push(update.name);
    }

    return NextResponse.json({ success: true, updated: results });
  } catch (error) {
    LogServerError({ error, type: "update-user route error" });
    return NextResponse.json(
      { message: "Failed to update user data" },
      { status: 500 },
    );
  }
}
