import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import {
  refreshMarketSession,
  refreshChatSession,
  refreshStoriesSession,
  refreshCommentsSession,
} from "utils/server/authRefresh";

/**
 * Internal refresh endpoint (market: Go + Laravel auth contracts; chat: chat
 * backend refresh contract).
 *
 * Single caller (refresh is REACTIVE-ONLY):
 * - `fetchData`'s 401 handler POSTs the failed request's `{url, server}`.
 *   Every market 401 is eligible regardless of which backend served it —
 *   which backend performs the exchange is decided inside
 *   `refreshMarketSession` by user type (verified → Laravel, guest → Go),
 *   so there is no client-side routing duplication and no backend-tag header.
 * - A bodyless call (the retired proactive path) is always a no-op: local
 *   token expiry (JWT exp / expired_at) is never used to trigger an exchange.
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
      // redirected to, or logged. Market traffic carries the MARKET-TOKEN pair,
      // so it is refreshable whichever backend served the failed request. Chat,
      // stories and comments each carry their own token pair and are refreshable
      // here; wallet keeps its existing need_auth flow.
      const serverAllowed =
        server === "market" ||
        server === "market-dashboard" ||
        server === "chat" ||
        server === "stories" ||
        server === "comments";
      if (!serverAllowed) {
        return NextResponse.json({ eligible: false }, { status: 200 });
      }
    } else {
      // Bodyless call (the retired proactive path): refresh is REACTIVE-ONLY.
      // Local token expiry (JWT exp / expired_at) is deliberately ignored —
      // the pair is exchanged exclusively after a real 401. Always a no-op.
      return NextResponse.json({ refreshed: false }, { status: 200 });
    }

    const outcome =
      server === "chat"
        ? await refreshChatSession()
        : server === "stories"
          ? await refreshStoriesSession()
          : server === "comments"
            ? await refreshCommentsSession()
            : await refreshMarketSession();
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
