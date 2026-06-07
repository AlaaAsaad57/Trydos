import { NextRequest, NextResponse } from "next/server";
import {
  isSameOrigin,
  signGuardToken,
  GUARD_TTL_SECONDS,
} from "utils/server/requestGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mints a short-lived HMAC guard token for the client to attach (as the
// `x-guard` header) on subsequent /api/proxy calls. Same-origin only — a
// cross-site caller cannot obtain a token here. When PROXY_GUARD_SECRET is
// unset the token is null and the proxy's HMAC check is a no-op (fail-open).
export async function GET(request: NextRequest) {
  if (!isSameOrigin(request, { allowMissing: true })) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { token, exp } = signGuardToken(GUARD_TTL_SECONDS);
  return NextResponse.json(
    { token, exp },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
