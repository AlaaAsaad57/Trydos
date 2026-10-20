import type { NextRequest } from "next/server";
import { fixedWindowRateLimit } from "serverRequests/radis";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { hashKey, normalizeIp } from "utils/server/otpIdentity";

// The guard in front of a route that spends money on every call (image search
// → Gemini, voice search → AssemblyAI). `proxy.ts` never runs on `/api`, so
// each of these routes must protect itself. Three checks, in this order:
//
// 1. A session cookie must be present. Every shopper has one (guest or signed
//    in), so this only turns away a bare script with no session.
// 2. The upload must be under the route's cap, so a huge body is refused
//    before it is read or sent on.
// 3. A fixed number of calls per address per window. The shared limiter FAILS
//    OPEN when Redis is missing (`ttl === 0`); a paid call must not run
//    uncapped, so that case answers "busy" here — the same rule the seller
//    AI autofill route uses.
//
// The messages are English keys that the browser passes through
// `translateFunction`, so each one is in the three translation files.

export const PAID_CALL_MESSAGES = {
  noSession: "Please reload the page and try again",
  tooLarge: "The file is too large",
  tooMany: "Too many requests. Please try again in a moment.",
  busy: "The AI service is busy right now. Please try again in a moment.",
} as const;

export type PaidCallRefusal = {
  status: 401 | 413 | 429 | 503;
  message: string;
};

type PaidCallOptions = {
  /** Short route name; it becomes part of the limiter key. */
  name: string;
  /** The upload to check, or null when the call carries none. */
  file: File | null | undefined;
  maxBytes: number;
  limit: number;
  windowSeconds: number;
};

/** The caller's address as the edge reports it. Shared with the guest
 *  registration route, which keys its own limit on it. */
export const clientIp = (req: NextRequest) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  req.headers.get("cf-connecting-ip") ||
  "";

/** Null when the call may go ahead, else the refusal to answer with. */
export async function guardPaidCall(
  req: NextRequest,
  { name, file, maxBytes, limit, windowSeconds }: PaidCallOptions,
): Promise<PaidCallRefusal | null> {
  if (!req.cookies.get(COOKIE_NAMES.MARKET_TOKEN)?.value) {
    return { status: 401, message: PAID_CALL_MESSAGES.noSession };
  }

  if (file && file.size > maxBytes) {
    return { status: 413, message: PAID_CALL_MESSAGES.tooLarge };
  }

  // Hashed, never the raw address (same rule as the OTP limiter keys).
  const rl = await fixedWindowRateLimit(
    `paid:${name}:rl:${hashKey(normalizeIp(clientIp(req)))}`,
    limit,
    windowSeconds,
  );
  if (rl.ttl === 0) return { status: 503, message: PAID_CALL_MESSAGES.busy };
  if (!rl.allowed) return { status: 429, message: PAID_CALL_MESSAGES.tooMany };

  return null;
}
