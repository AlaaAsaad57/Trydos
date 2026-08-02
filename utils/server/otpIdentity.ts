import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { COOKIE_NAMES, getCookieServer } from "utils/cookies/cookie-manager";
import {
  SECURE_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  setSecureCookieJSON,
} from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

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
  /** Hashed session key — derived from the durable visit id. */
  sid: string;
  /** Hashed, normalized IP key. */
  ip: string;
  /** Raw IP as seen on the request headers (debug only). */
  rawIp: string;
  /** Normalized IP before hashing (debug only). */
  normalizedIp: string;
  /** Resolved user-data id the session key is derived from (debug only). */
  userId: string | null;
  hasUserId: boolean;
  /** True when a guest had to be registered to obtain a user id. */
  registeredGuest: boolean;
  hasMarketToken: boolean;
  /** The durable visit id the session key is derived from (debug only). */
  visitId: string;
  /** True when this request had to mint a fresh visit id. */
  mintedVisitId: boolean;
}

const REGISTER_GUEST_URL = "/auth/register-guest";

/**
 * Resolve the durable visit id — the STABLE source for the OTP session key.
 *
 * Read the `VISIT-ID` cookie; if absent, mint a fresh UUID and persist it as a
 * long-lived HttpOnly cookie. NOTHING in the app ever deletes or rotates this
 * cookie (not logout, not guest re-register, not token refresh), so the
 * per-session OTP counter survives the token/user-id churn that previously let
 * an attacker reset the cap. The per-IP cap remains the backstop for someone who
 * manually clears all their cookies.
 *
 * The cookie write is best effort — it only persists in a Server Action / Route
 * Handler. In a pure render it can't be written, but the OTP flow always runs
 * inside the send-OTP server action, so the id is persisted there on first use.
 */
async function resolveVisitId(): Promise<{ visitId: string; minted: boolean }> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAMES.VISIT_ID)?.value;
  if (existing) return { visitId: existing, minted: false };

  const fresh = crypto.randomUUID();
  try {
    cookieStore.set({
      name: COOKIE_NAMES.VISIT_ID,
      value: fresh,
      ...SECURE_COOKIE_OPTIONS,
      // Durable OTP rate-limit key: must NEVER follow the 48h token TTL — it is
      // designed to survive token rotation/logout so the otp:sid counter can't
      // be reset. Pin to 1 year regardless of TOKEN_COOKIE_MAX_AGE.
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // Pure render context — can't persist the cookie here. The id still keys
    // this request; the server action persists it on the next send.
  }
  return { visitId: fresh, minted: true };
}

/** Read the stable user id from the `User-Data` cookie, or null if absent. */
async function readUserId(): Promise<string | null> {
  const user = await getCookieServer<{ id?: number | string }>(
    COOKIE_NAMES.USER_DATA,
  );
  const id = user?.id;
  return id !== undefined && id !== null && id !== "" ? String(id) : null;
}

/**
 * Register a guest to obtain a durable user id when none exists yet (rare — a
 * user id is normally present after the very first request). Persists the fresh
 * `MARKET-TOKEN` / `User-Data` cookies (best effort; only succeeds in a Server
 * Action / Route Handler) and returns the new user id, or null on failure.
 */
async function registerGuestForOtp(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const local = cookieStore.get(COOKIE_NAMES.LOCAL)?.value || "gb-en";
    const [country, language] = local.split("-");
    const existing = await getCookieServer<any>(COOKIE_NAMES.USER_DATA);
    const token = cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value;

    // Bodyless per the Go contract: register-guest only creates brand-new
    // guests — no old_guest_user_id, no "user does not exist" retry.
    const res = await fetch(process.env.BACKEND_URL + REGISTER_GUEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        country: country || "gb",
        language: language || "en",
        lang: language || "en",
      },
      credentials: "omit",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      LogServerError({ error: data, type: "otp register-guest failed" });
      return null;
    }

    try {
      if (data?.data?.token) {
        cookieStore.set({
          name: COOKIE_NAMES.MARKET_TOKEN,
          value: data.data.token,
          ...SECURE_COOKIE_OPTIONS,
        });
      }
      if (data?.data?.refresh_token) {
        cookieStore.set({
          name: COOKIE_NAMES.MARKET_REFRESH_TOKEN,
          value: data.data.refresh_token,
          ...REFRESH_COOKIE_OPTIONS,
        });
      }
      if (data?.data?.user) {
        await setSecureCookieJSON(COOKIE_NAMES.USER_DATA, {
          ...data.data.user,
          story_user_id: existing?.story_user_id,
          expired_at: data.data.expires_at,
        });
      }
    } catch {
      // Cookie write not allowed in this context (pure render) — the id still
      // resolves for this request, it just won't be persisted.
    }

    const id = data?.data?.user?.id;
    return id !== undefined && id !== null ? String(id) : null;
  } catch (error) {
    LogServerError({ error, type: "otp register-guest failed" });
    return null;
  }
}

/**
 * Resolve the sid/ip identity for the current request (cookies + headers).
 *
 * The session key (`sid`) is derived from the durable VISIT-ID cookie, not the
 * auth token OR the user-data id. Both of those rotate within a single session
 * (a guest re-register on 401 mints a fresh `MARKET-TOKEN`; the brand-new-guest
 * retry path mints a fresh user id), which would reset the per-session OTP
 * counter and hand an attacker a free way to bypass the cap. The visit id is
 * minted once and never cleared by any code path, so it can't be rotated away.
 *
 * Pass `{ ensureUserId: true }` (the send-OTP path) to register a guest when no
 * user id exists yet, so the backend OTP call always has a usable token.
 */
export async function resolveOtpIdentity(
  options: { ensureUserId?: boolean } = {},
): Promise<OtpIdentity> {
  const [cookieStore, hdrs] = await Promise.all([cookies(), headers()]);

  const { visitId, minted: mintedVisitId } = await resolveVisitId();

  let userId = await readUserId();
  let registeredGuest = false;
  if (!userId && options.ensureUserId) {
    userId = await registerGuestForOtp();
    registeredGuest = Boolean(userId);
  }

  const marketToken = cookieStore.get(COOKIE_NAMES.MARKET_TOKEN)?.value;

  const rawIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") ||
    "0.0.0.0";
  const normalizedIp = normalizeIp(rawIp);

  return {
    sid: hashKey(visitId),
    ip: hashKey(normalizedIp),
    rawIp,
    normalizedIp,
    userId,
    hasUserId: Boolean(userId),
    registeredGuest,
    hasMarketToken: Boolean(marketToken),
    visitId,
    mintedVisitId,
  };
}
