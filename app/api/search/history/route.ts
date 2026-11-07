import { NextRequest, NextResponse } from "next/server";
import {
  CORS_HEADERS,
  missingToken,
  preflight,
  readJson,
  readMarketToken,
  toResponse,
} from "app/api/seller/comments/_utils";
import { fixedWindowRateLimit } from "serverRequests/radis";
import {
  listSearchHistory,
  logSearchHistoryWord,
  removeSearchHistory,
  verifySearchHistoryUser,
} from "services/elastic/searchHistory";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { LogServerError } from "utils/serverErrorReporter";

// The caller's own search history, on every device.
//
//   GET    /api/search/history                -> { data: { terms: string[] } }
//   POST   /api/search/history  { term, products_count } -> log a settled word
//   DELETE /api/search/history  { term }      -> remove one word
//   DELETE /api/search/history  { all: true } -> remove every word
//
// The mobile app sends its MARKET token in the Authorization header. The web
// app sends nothing: its token is in the HttpOnly MARKET-TOKEN cookie.
//
// 401 means the token has expired. This route never refreshes it: the caller
// refreshes and sends the same call again (see services/elastic/searchHistory).
// 503 means the check could not run, and the token may still be good.

const LIMITS = {
  read: { limit: 60, windowSeconds: 60 },
  write: { limit: 20, windowSeconds: 60 },
  log: { limit: 30, windowSeconds: 60 },
};

/** `search_term.keyword` keeps nothing longer, so the history could not show it. */
const LONGEST_TERM = 256;

type RouteResult = Parameters<typeof toResponse>[0];

function failure(status: number, message: string): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status, headers: CORS_HEADERS },
  );
}

/** Verify the caller, apply the limit, then run `action` for that user only. */
async function forVerifiedUser(
  req: NextRequest,
  kind: keyof typeof LIMITS,
  action: (userId: number) => Promise<RouteResult>,
): Promise<NextResponse> {
  const token =
    readMarketToken(req) ||
    req.cookies.get(COOKIE_NAMES.MARKET_TOKEN)?.value ||
    "";
  if (!token) return missingToken();

  const identity = await verifySearchHistoryUser(token);
  if (identity.status === "expired") return failure(401, "Token expired.");
  if (identity.status === "unavailable") {
    return failure(503, "Search history is not available.");
  }

  // After the check, so the bucket belongs to a verified user. Fails open if
  // Redis is down.
  const { limit, windowSeconds } = LIMITS[kind];
  const rate = await fixedWindowRateLimit(
    `search:history:rl:${kind}:${identity.userId}`,
    limit,
    windowSeconds,
  );
  if (!rate.allowed) {
    return toResponse({
      success: false,
      message: `Too many requests. Try again in ${rate.ttl}s.`,
    });
  }

  try {
    return toResponse(await action(identity.userId));
  } catch (error) {
    LogServerError({
      scenario: `search history ${kind} failed in Elasticsearch`,
      error: error instanceof Error ? error.message : String(error),
    });
    return failure(503, "Search history is not available.");
  }
}

export function GET(req: NextRequest) {
  return forVerifiedUser(req, "read", async (userId) => ({
    success: true,
    data: { terms: await listSearchHistory(userId) },
  }));
}

export function POST(req: NextRequest) {
  return forVerifiedUser(req, "log", async (userId) => {
    const body = await readJson(req);
    const term = typeof body?.term === "string" ? body.term.trim() : "";
    if (!term || term.length > LONGEST_TERM) {
      return { success: false, message: "Send a term of 1 to 256 characters." };
    }

    await logSearchHistoryWord(userId, term, Number(body?.products_count) || 0);
    return { success: true };
  });
}

export function DELETE(req: NextRequest) {
  return forVerifiedUser(req, "write", async (userId) => {
    const body = await readJson(req);
    const term = typeof body?.term === "string" ? body.term.trim() : "";
    if (!term && body?.all !== true) {
      return { success: false, message: "Send a term, or all: true." };
    }

    await removeSearchHistory(userId, term || undefined);
    return { success: true };
  });
}

export function OPTIONS() {
  return preflight();
}
