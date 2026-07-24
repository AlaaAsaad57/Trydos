import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import {
  refreshMarketSession,
  isMarketAccessTokenExpired,
} from "utils/server/authRefresh";

/**
 * Internal refresh endpoint (Go + Laravel auth contracts).
 *
 * Two callers:
 * - Reactive: `fetchData`'s 401 handler POSTs the failed request's
 *   `{url, server}`. Every market 401 is eligible regardless of which backend
 *   served it — which backend performs the exchange is decided inside
 *   `refreshMarketSession` by user type (verified → Laravel, guest → Go),
 *   so there is no client-side routing duplication and no backend-tag header.
 * - Proactive: `CheckLogin()` calls with no body on app load; while the
 *   access token is still valid this is a fast local no-op.
 *
 * Success sets the rotated cookies on this response and returns
 * `{refreshed: true}` — NO token material ever appears in the body (AC-2).
 * Any failure (no cookie / invalid / unavailable) returns 401 so the client
 * falls through to the existing expiry flow.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Logout guard: never mint or rotate credentials mid-logout (AC-15).
    if (cookieStore.get(COOKIE_NAMES.LOGOUT_GUARD)?.value) {
      return NextResponse.json(
        { refreshed: false, loggingOut: true },
        { status: 200 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const failedUrl: string | undefined =
      typeof body?.url === "string" ? body.url : undefined;
    const server: string | undefined =
      typeof body?.server === "string" ? body.server : undefined;

    if (failedUrl !== undefined || server !== undefined) {
      // Reactive call — the untrusted `{url, server}` is never fetched,
      // redirected to, or logged. Only the service matters now: market traffic
      // carries the MARKET-TOKEN pair, so it is refreshable whichever backend
      // served the failed request. chat/stories/comments/wallet keep their own
      // need_auth flow and are not refreshable here.
      const serverAllowed = server === "market" || server === "market-dashboard";
      if (!serverAllowed) {
        return NextResponse.json({ eligible: false }, { status: 200 });
      }
    } else {
      // Proactive on-load call: cheap no-op while the access token is valid
      // (local JWT-exp check — no upstream request).
      const token = cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value;
      if (token && !isMarketAccessTokenExpired(token)) {
        return NextResponse.json({ refreshed: false }, { status: 200 });
      }
    }

    const outcome = await refreshMarketSession();
    switch (outcome.status) {
      case "refreshed":
        // Cookies were set on this response by the helper; body stays
        // token-free (AC-2 / NFR-3).
        return NextResponse.json({ refreshed: true }, { status: 200 });
      case "ineligible":
        // Logout in progress — never mint or rotate credentials mid-logout.
        return NextResponse.json({ eligible: false }, { status: 200 });
      default:
        // no-token | invalid | unavailable → client falls through to the
        // existing expiry flow (bodyless register-guest via /api/auth/expire).
        return NextResponse.json({ refreshed: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ refreshed: false }, { status: 401 });
  }
}
