"use server";

import { cookies } from "next/headers";
import { HandleAuthedFetch } from "serverRequests/HandleAuthedFetch";
import { otpRateLimit } from "serverRequests/radis";
import { SEND_OTP } from "utils/endpointConfig";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { resolveOtpIdentity } from "utils/server/otpIdentity";
import { isAllowlistedTestPhone } from "utils/server/otpAllowlist";
import { captureOtpAttempt } from "utils/server/otpTelemetry";
import { LogServerError } from "utils/serverErrorReporter";

// ---------------------------------------------------------------------------
// sendOtpAction — the ONLY way the OTP send happens.
//
// Why a Server Action instead of a client fetch through /api/proxy:
//   • The browser never sees the `/auth/phone/send_otp` endpoint, the backend
//     host, or the proxy headers — only an opaque RSC action POST. There is
//     nothing in the Network tab to copy/replay.
//   • Server Actions are same-origin enforced by Next.js (Origin vs Host, 403
//     on mismatch) — see next.config `serverActions.allowedOrigins`.
//   • The Redis rate limit (per-session cap of 2 numbers/1h, per-IP cap,
//     per-number cooldown) runs here, BEFORE the backend is ever called, so a
//     scripted "1000 random numbers" attack is rejected for free.
//   • The one exception is the test-number allowlist (`OTP_TEST_PHONES`, see
//     utils/server/otpAllowlist): those numbers skip our limiter so testers and
//     the live e2e suite are not locked out of their own accounts. The send is
//     still real, and the list is empty unless the environment sets it.
//
// The actual OTP request is then made server-to-server via HandleAuthedFetch
// (which carries the guest/market token and auto-registers a guest on 401),
// completely invisible to the client.
// ---------------------------------------------------------------------------

interface SendOtpResult {
  success: boolean;
  verificationId?: string;
  message: string;
  /** When set, the client should lock the send button for this many seconds. */
  lockSeconds?: number;
  /** True when rejected by our own rate limiter (vs. a backend/validation error). */
  blocked?: boolean;
  /** Present when blocked by our own rate limiter (not surfaced to the user). */
  reason?: string;
  /**
   * True when this number is on the test-number allowlist (`OTP_TEST_PHONES`),
   * so our limiter was skipped for it. The client mirrors the server's locks in
   * sessionStorage — this tells it not to, otherwise the browser would lock a
   * number the server never locked and the exemption would look broken.
   */
  allowlisted?: boolean;
}

const digitsOnly = (phone: string) => (phone || "").replace(/[^0-9]/g, "");

// A number outside this range is refused BEFORE the limiter is consulted, so
// rubbish can never spend anyone's allowance.
//   • 6 is the lower bound this action always had.
//   • 15 is E.164's maximum, and also the most the phone input can produce:
//     RdbPhoneInput caps an unknown country at 15 digits and a detected one at
//     its dial code + local length. So no real shopper can reach the upper
//     bound — only a caller posting to the action directly can.
// Without the upper bound an arbitrarily long run of digits went through to the
// limiter, and every distinct one became a new member of the per-session number
// set the limiter counts and stores.
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;

// fetchServerData encodes non-2xx bodies as "HTTP <status> <url>: <body>".
// Pull the backend message back out so wait/throttle text reaches the UI.
function extractMessage(raw: string | null | undefined): string {
  if (!raw) return "";
  const idx = raw.indexOf("{");
  if (idx === -1) return "";
  try {
    const parsed = JSON.parse(raw.slice(idx));
    return parsed?.message || parsed?.data?.message || "";
  } catch {
    return "";
  }
}

export async function sendOtpAction(input: {
  phone: string;
  isWhatsapp: number | string;
}): Promise<SendOtpResult> {
  try {
    const digits = digitsOnly(input.phone);
    if (
      digits.length < MIN_PHONE_DIGITS ||
      digits.length > MAX_PHONE_DIGITS
    ) {
      // The same refusal either way: to the person typing, a number that is too
      // long is just as invalid as one that is too short. Reusing the existing
      // message also means no new user-visible string to translate.
      return { success: false, message: "Invalid Phone Number" };
    }
    const phone = `+${digits}`;

    // Session + IP identity (shared with the debug stats action so the keys
    // match exactly). The session key is derived from the durable VISIT-ID
    // cookie (minted here on first use, never cleared), so a forced token/
    // user-id rotation can't reset the per-session OTP counter. `ensureUserId`
    // still registers a guest so the backend OTP call has a token.
    // IPv6 is normalized to its /64 prefix here.
    const identity = await resolveOtpIdentity({ ensureUserId: true });
    const { sid, ip } = identity;

    // // TEMP DEBUG: confirm the resolved IP identity is stable across sessions.
    // // Remove once the per-IP cap is verified on staging.
    // console.log(
    //   `[OTP][send] rawIp=${identity.rawIp} normalizedIp=${identity.normalizedIp} ipKey=${ip} sidKey=${sid} visitId=${identity.visitId} mintedVisitId=${identity.mintedVisitId} userId=${identity.userId} registeredGuest=${identity.registeredGuest} phone=${phone}`,
    // );

    // ── Rate limit BEFORE touching the backend ──
    // A configured test number (utils/server/otpAllowlist) skips the limiter
    // completely: nothing is checked for it and — just as important — nothing is
    // counted, so a whole day of test logins can't consume the shared per-IP
    // budget that real shoppers on that address depend on. The send itself is
    // still real; only OUR three rules are stepped over.
    const isTestPhone = isAllowlistedTestPhone(phone);
    const limit = isTestPhone
      ? { allowed: true, reason: "test_phone", lockSeconds: 0 }
      : await otpRateLimit({ sid, ip, phone });

    // No client-side lock for a test number either — see `allowlisted` above.
    const cooldownSeconds = isTestPhone
      ? 0
      : Number(process.env.OTP_COOLDOWN_SECONDS ?? 60);

    if (!limit.allowed) {
      // Record the blocked attempt with the real IP (the value to blocklist) —
      // these are the abusive senders the client `send_otp` event can't surface.
      captureOtpAttempt({
        outcome: "blocked",
        reason: limit.reason,
        rawIp: identity.rawIp,
        normalizedIp: identity.normalizedIp,
        sid,
        isWhatsapp: input.isWhatsapp,
      });
      const wait = limit.lockSeconds || 60;
      // The countdown itself comes from the structured `lockSeconds` field
      // below (services/auth.ts feeds it straight into `lockNumber()` /
      // `utils/otpLocks`) — this message is shown as-is, not parsed for a
      // "seconds before trying again" pattern.
      const message =
        limit.reason === "cooldown"
          ? `Please wait ${wait} seconds before trying again`
          : `Too many verification requests. Please wait ${wait} seconds before trying again`;
      return {
        success: false,
        blocked: true,
        reason: limit.reason,
        lockSeconds: wait,
        message,
      };
    }

    const cookieStore = await cookies();
    const local = cookieStore.get(COOKIE_NAMES.LOCAL)?.value || "gb-en";

    const res = await HandleAuthedFetch({
      url: `${process.env.BACKEND_URL}${SEND_OTP}`,
      method: "POST",
      local,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, is_via_whatsapp: input.isWhatsapp }),
    });

    const data = res?.data;
    const verificationId = data?.data?.verificationId ?? data?.verificationId;
    const message = data?.message || extractMessage(res?.error) || "";

    if (verificationId) {
      captureOtpAttempt({
        outcome: "sent",
        reason: limit.reason,
        rawIp: identity.rawIp,
        normalizedIp: identity.normalizedIp,
        sid,
        isWhatsapp: input.isWhatsapp,
      });
      return {
        success: true,
        verificationId,
        message,
        lockSeconds: cooldownSeconds,
        ...(isTestPhone ? { allowlisted: true } : {}),
      };
    }

    // No verificationId → either an invalid number or a backend throttle
    // ("...seconds before trying again"). Surface the backend message as-is.
    captureOtpAttempt({
      outcome: "failed",
      reason: message ? "backend_rejected" : "no_verification_id",
      rawIp: identity.rawIp,
      normalizedIp: identity.normalizedIp,
      sid,
      isWhatsapp: input.isWhatsapp,
    });
    return {
      success: false,
      message: message || "Failed to send verification code",
      lockSeconds: cooldownSeconds,
      ...(isTestPhone ? { allowlisted: true } : {}),
    };
  } catch (error) {
    LogServerError({ error, scenario: "sendOtpAction" });
    return { success: false, message: "Failed to send verification code" };
  }
}
