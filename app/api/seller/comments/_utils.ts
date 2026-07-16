import { NextRequest, NextResponse } from "next/server";

// Shared helpers for the mobile-facing seller-comments API routes.
//
// These routes are the mobile equivalent of the web dashboard's comments
// server actions. The web app reads the seller's identity from an HttpOnly
// cookie; the mobile app instead sends its MARKET token in the request header,
// and these routes forward it into the exact same permission/ownership gate
// (`services/elastic/sellerComments.ts`). The security decision still happens
// server-side against the market backend — the header token only chooses the
// identity to verify, it can never bypass the check.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-market-token, x-seller-id",
  "Cache-Control": "no-store",
};

export function preflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Extract the seller's MARKET token from the request. Prefer the standard
 * `Authorization: Bearer <token>` header; also accept `x-market-token` for
 * clients that reserve Authorization for something else.
 */
export function readMarketToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  return (req.headers.get("x-market-token") || "").trim();
}

/** 401 response used when no token is present at all. */
export function missingToken(): NextResponse {
  return NextResponse.json(
    { success: false, message: "Missing market token." },
    { status: 401, headers: CORS_HEADERS },
  );
}

/** Best-effort JSON body parse — never throws. */
export async function readJson(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

type ActionResult = { success: boolean; data?: unknown; message?: string };

/**
 * Map a server-action result to an HTTP response. The action only returns a
 * message string on failure, so the status is inferred from it (best-effort):
 * permission/ownership → 403, verify failure → 401, rate limit → 429,
 * validation → 400, everything else → 400.
 */
export function toResponse(result: ActionResult, okStatus = 200): NextResponse {
  if (result?.success) {
    return NextResponse.json(
      { success: true, data: result.data },
      { status: okStatus, headers: CORS_HEADERS },
    );
  }

  const message = result?.message || "Request failed.";
  return NextResponse.json(
    { success: false, message },
    { status: statusForMessage(message), headers: CORS_HEADERS },
  );
}

function statusForMessage(message: string): number {
  const m = message.toLowerCase();
  if (m.includes("too many requests")) return 429;
  if (m.includes("permission")) return 403;
  if (m.includes("not authorized")) return 403;
  if (m.includes("unable to verify")) return 401;
  if (m.includes("not found")) return 404;
  return 400;
}
