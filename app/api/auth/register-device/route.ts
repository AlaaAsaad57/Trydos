import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";
import { logRequest, startTimer } from "reqLogger";
import { fixedWindowRateLimit } from "serverRequests/radis";
import { hashKey, normalizeIp } from "utils/server/otpIdentity";
import { clientIp } from "utils/server/paidRouteGuard";
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
  COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.STORIES_REFRESH_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.COMMENTS_REFRESH_TOKEN,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.WALLET_USER,
];

const REGISTER_DEVICE_URL = "/auth/register-guest";

// A1-17: every POST here creates a brand-new guest on the gateway, so a script
// could mint guests without end. This many per address per window is far above
// what one browser needs (one guest per session, plus the rare lost session).
// `proxy.ts` never runs on `/api`, so the limit lives in the route; the
// Firewall rule is a second layer, not the only one.
const RATE_LIMIT = 30;
const RATE_WINDOW_SECONDS = 600;

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

    // Hashed, never the raw address (same rule as the OTP limiter keys). This
    // limit FAILS OPEN when Redis is missing (`ttl === 0`): a guest must always
    // be registerable, or nobody can browse at all. That is the opposite of
    // the paid routes, which must never run uncapped.
    const rl = await fixedWindowRateLimit(
      `register-device:rl:${hashKey(normalizeIp(clientIp(request)))}`,
      RATE_LIMIT,
      RATE_WINDOW_SECONDS,
    );
    if (rl.ttl !== 0 && !rl.allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again in a moment." },
        { status: 429 },
      );
    }

    const country = request.headers.get("x-country")?.trim() || "sy";
    const language = request.headers.get("x-language")?.trim() || "en";
    const userDataCookie = await getSecureCookie<any>(COOKIE_NAMES.USER_DATA);
    const token = await getTokenForServer("market");

    // Bodyless per the Go contract: register-guest only creates brand-new
    // guests — no old_guest_user_id (the re-issue-by-id path no longer
    // exists), so there is also no "user does not exist" retry.
    const elapsed = startTimer();
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
    await logRequest({
      server: "market",
      url: REGISTER_DEVICE_URL,
      method: "POST",
      status: response.status,
      durationMs: elapsed(),
      backend: "gateway",
      responseBody: data,
      userId: data?.data?.user?.id,
      userName: data?.data?.user?.name,
    });

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
