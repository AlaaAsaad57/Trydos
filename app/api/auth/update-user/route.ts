import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  setSecureCookie,
  setSecureCookieJSON,
  getSecureCookie,
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

      // Keep the dedicated token cookie (CHAT_TOKEN/STORIES_TOKEN) in sync with
      // the fresh access_token from re-auth, so the proxy stays authenticated.
      const tokenCookie = TOKEN_COOKIE_FOR[update.name];
      if (tokenCookie && merged?.access_token) {
        await setSecureCookie(tokenCookie, merged.access_token);
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
