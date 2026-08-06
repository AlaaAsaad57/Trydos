import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import {
  deleteSecureCookie,
  getSecureCookie,
  setSecureCookieJSON,
} from "utils/server/tokenManager";

// Whitelist of cookie names that can be cleared via this endpoint
const CLEARABLE_TOKENS = new Set([
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
]);

/**
 * Clears stale sub-service tokens and marks users as needing re-auth.
 * Called when a sub-service returns 401.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const tokensToDelete: string[] = body.tokens || [];

    // Only allow clearing known token cookies (prevent misuse)
    const validTokens = tokensToDelete.filter((name) =>
      // @ts-ignore
      CLEARABLE_TOKENS.has(name),
    );

    // Delete stale tokens
    await Promise.all(validTokens.map((name) => deleteSecureCookie(name)));

    // Mark user metadata as needing re-auth
    const [userChat, userStories, userData] = await Promise.all([
      getSecureCookie<any>(COOKIE_NAMES.USER_CHAT),
      getSecureCookie<any>(COOKIE_NAMES.USER_STORIES),
      getSecureCookie<any>(COOKIE_NAMES.USER_DATA),
    ]);

    await Promise.all([
      userChat?.id
        ? setSecureCookieJSON(COOKIE_NAMES.USER_CHAT, {
            ...userChat,
            access_token: undefined, // fully invalidate — proxy/SSR auth off token cookies now
            // need_auth: true,
          })
        : Promise.resolve(),
      userStories?.id
        ? setSecureCookieJSON(COOKIE_NAMES.USER_STORIES, {
            ...userStories,
            access_token: undefined, // fully invalidate — proxy/SSR auth off token cookies now
            need_auth: true,
          })
        : Promise.resolve(),
      userData
        ? setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
            ...userData,
            need_auth: true,
            is_phone_verified: 0,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, cleared: validTokens });
  } catch (error) {
    LogServerError({ error, type: "clear-tokens route error" });
    return NextResponse.json(
      { message: "Failed to clear tokens" },
      { status: 500 },
    );
  }
}
