import "server-only";
import crypto from "crypto";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Request guard — enforces that protected route handlers (the /api/proxy
// gateway) are only callable from our own site.
//
// Two complementary layers:
//   1. Same-origin check  — the request's Origin/Referer host must match a host
//      we serve from. A real browser cannot forge the Origin header (it's a
//      forbidden header) and cannot attach the custom `x-guard` header on a
//      cross-site request without a CORS preflight we never grant. This blocks
//      every browser-based cross-site / CSRF replay.
//   2. HMAC guard token   — a short-lived signed token minted by /api/guard.
//      Verifying it is a single HMAC compute (microseconds — no meaningful
//      latency), and it proves the caller obtained a token our server issued,
//      raising the bar for non-browser scripts that try to spoof the Origin.
//
// The HMAC layer FAILS OPEN when `PROXY_GUARD_SECRET` is unset so that a
// missing env var on a deploy can never take the whole app offline; the
// same-origin layer always runs. Set the secret in every environment to turn
// the HMAC layer on.
// ---------------------------------------------------------------------------

const SECRET = process.env.PROXY_GUARD_SECRET || "";
const DEFAULT_TTL_SECONDS = 30 * 60; // 30 minutes

const hostOf = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
};

/** Build the set of hosts we consider "ours" for this request. */
function allowedHosts(request: NextRequest): Set<string> {
  const hosts = new Set<string>();
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (host) hosts.add(host.toLowerCase());
  if (forwardedHost) hosts.add(forwardedHost.toLowerCase());
  const siteHost = hostOf(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteHost) hosts.add(siteHost);
  return hosts;
}

/**
 * True when the request originates from one of our own hosts. POST requests
 * (all /api/proxy traffic) always carry an Origin header in browsers, so for
 * those a missing Origin/Referer is treated as untrusted (default).
 *
 * `allowMissing` is for same-origin GETs (e.g. /api/guard) where the browser
 * may omit both Origin and Referer under a strict referrer policy; a present
 * but mismatched origin is still rejected.
 */
export function isSameOrigin(
  request: NextRequest,
  options: { allowMissing?: boolean } = {},
): boolean {
  const originHost =
    hostOf(request.headers.get("origin")) ??
    hostOf(request.headers.get("referer"));
  if (!originHost) return Boolean(options.allowMissing);
  return allowedHosts(request).has(originHost);
}

/** Mint a signed `${exp}.${sig}` token. Returns null when no secret is set. */
export function signGuardToken(ttlSeconds: number = DEFAULT_TTL_SECONDS): {
  token: string | null;
  exp: number;
} {
  const exp = Date.now() + ttlSeconds * 1000;
  if (!SECRET) return { token: null, exp };
  const payload = String(exp);
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return { token: `${payload}.${sig}`, exp };
}

/** Verify a guard token. Fails open (returns true) when no secret is set. */
export function verifyGuardToken(token: string | null | undefined): boolean {
  if (!SECRET) return true; // HMAC layer disabled — rely on same-origin only
  if (!token) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return true;
}

export const GUARD_TTL_SECONDS = DEFAULT_TTL_SECONDS;
