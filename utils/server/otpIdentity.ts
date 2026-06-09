import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

// ---------------------------------------------------------------------------
// OTP identity — the SINGLE source of truth for how a request maps to the
// `sid` (session) and `ip` rate-limit keys. Both the send-OTP action and the
// debug stats action import this so they derive identical Redis keys.
// ---------------------------------------------------------------------------

/** SHA-256 → 32 hex chars. Never store a raw token/IP in a Redis key. */
export const hashKey = (value: string) =>
  crypto.createHash("sha256").update(value || "anon").digest("hex").slice(0, 32);

/** Expand an IPv6 address (handling `::` compression) to 8 hextets. */
function expandIpv6(addr: string): string[] {
  if (addr.includes("::")) {
    const [head, tail] = addr.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const missing = 8 - (headParts.length + tailParts.length);
    return [
      ...headParts,
      ...Array(Math.max(0, missing)).fill("0"),
      ...tailParts,
    ];
  }
  return addr.split(":");
}

/**
 * Collapse an address to a stable rate-limit identity.
 *
 * IPv6 temporary/privacy addresses rotate their host suffix on every new
 * connection, so hashing the FULL address makes each browser session (e.g. a
 * fresh incognito window) look like a brand-new IP — defeating the per-IP cap.
 * We therefore key IPv6 on its /64 network prefix (the part that stays put per
 * subscriber). IPv4 (and IPv4-mapped IPv6) is returned unchanged.
 */
export function normalizeIp(raw: string | null | undefined): string {
  const ip = (raw || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split("%")[0]; // drop zone id
  if (!ip) return "0.0.0.0";

  // IPv4-mapped IPv6 (e.g. ::ffff:203.0.113.7) → use the embedded IPv4.
  if (ip.includes(".")) {
    return ip.substring(ip.lastIndexOf(":") + 1) || ip;
  }

  if (ip.includes(":")) {
    const hextets = expandIpv6(ip).map(
      (h) => (h || "0").replace(/^0+/, "").toLowerCase() || "0",
    );
    return `${hextets.slice(0, 4).join(":")}::/64`;
  }

  return ip;
}

export interface OtpIdentity {
  /** Hashed session key source (token or "anon"). */
  sid: string;
  /** Hashed, normalized IP key. */
  ip: string;
  /** Raw IP as seen on the request headers (debug only). */
  rawIp: string;
  /** Normalized IP before hashing (debug only). */
  normalizedIp: string;
  hasMarketToken: boolean;
  hasDeviceToken: boolean;
}

/** Resolve the sid/ip identity for the current request (cookies + headers). */
export async function resolveOtpIdentity(): Promise<OtpIdentity> {
  const [cookieStore, hdrs] = await Promise.all([cookies(), headers()]);

  const marketToken = cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value;
  const deviceToken = cookieStore.get(COOKIE_NAMES.DEVICE_TOKEN)?.value;
  const sidSource = marketToken ?? deviceToken ?? "anon";

  const rawIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") ||
    "0.0.0.0";
  const normalizedIp = normalizeIp(rawIp);

  return {
    sid: hashKey(sidSource),
    ip: hashKey(normalizedIp),
    rawIp,
    normalizedIp,
    hasMarketToken: Boolean(marketToken),
    hasDeviceToken: Boolean(deviceToken),
  };
}
