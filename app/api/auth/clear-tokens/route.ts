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
  COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.STORIES_REFRESH_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.COMMENTS_REFRESH_TOKEN,
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

    // Mark user metadata as needing re-auth — ONLY for the service whose token
    // was actually cleared. This used to run unconditionally, so a chat, wallet
    // or comments 401 invalidated the stories profile blob, and every
    // sub-service 401 downgraded USER_DATA to unverified — which silently
    // re-routed the market refresh exchange to the guest backend
    // (isVerifiedMarketUser reads this cookie) over an unrelated failure.
    const cleared = new Set(validTokens);
    const clearedChat =
      cleared.has(COOKIE_NAMES.CHAT_TOKEN) ||
      cleared.has(COOKIE_NAMES.CHAT_REFRESH_TOKEN);
    const clearedStories =
      cleared.has(COOKIE_NAMES.STORIES_TOKEN) ||
      cleared.has(COOKIE_NAMES.STORIES_REFRESH_TOKEN);
    const clearedComments =
      cleared.has(COOKIE_NAMES.USER_ID_HASH) ||
      cleared.has(COOKIE_NAMES.COMMENTS_REFRESH_TOKEN);

    const [userChat, userStories, userData] = await Promise.all([
      clearedChat ? getSecureCookie<any>(COOKIE_NAMES.USER_CHAT) : null,
      clearedStories ? getSecureCookie<any>(COOKIE_NAMES.USER_STORIES) : null,
      clearedComments ? getSecureCookie<any>(COOKIE_NAMES.USER_DATA) : null,
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
