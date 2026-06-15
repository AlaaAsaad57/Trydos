import "server-only";
import { after } from "next/server";

// ---------------------------------------------------------------------------
// Server-side OTP telemetry → PostHog (`otp_send_attempt`).
//
// WHY this exists (and isn't a client GAevent):
//   The client `send_otp` event CANNOT carry the IP — PostHog geo-enriches at
//   ingestion and then DISCARDS the raw IP, so `properties.$ip` is always null
//   on client events. An IP blocklist is therefore impossible from the client
//   stream. The raw IP only exists server-side, in `resolveOtpIdentity()`.
//
//   This also captures the cases the client never sees: a scripted attacker
//   hitting the `sendOtpAction` RSC endpoint directly fires NO browser event,
//   and our Redis limiter blocks happen server-side. `otp_send_attempt` is the
//   single authoritative record of every send that reaches the server, with the
//   outcome (sent / blocked / failed) and the real IP attached as an explicit
//   property (which the ingestion IP-discard does NOT touch).
//
// Guard rails mirror the client wrapper (utils/posthog.ts): production-only,
// never throws into the OTP flow, and fire-and-forget so it never adds latency
// to the send (runs in `after()`, post-response, within the same invocation).
//
// Sent straight to the PostHog capture API (not the /ingest reverse proxy — that
// proxy only exists to dodge browser ad-blockers, irrelevant server-to-server).
// ---------------------------------------------------------------------------

const POSTHOG_CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/";

export type OtpAttemptOutcome = "sent" | "blocked" | "failed";

export interface OtpAttemptTelemetry {
  /** What happened to this send attempt. */
  outcome: OtpAttemptOutcome;
  /** Limiter reason when blocked (cooldown / session_cap / ip_cap), else the ok/error reason. */
  reason: string;
  /** Raw client IP as seen on the request headers — the value to blocklist. */
  rawIp: string;
  /** Normalized IP (IPv6 → /64) — the value the Redis rate limiter keys on. */
  normalizedIp: string;
  /** Hashed session key (durable VISIT-ID) — used as the PostHog distinct_id. */
  sid: string;
  /** sms / whatsapp. */
  isWhatsapp: number | string;
}

/**
 * Record one OTP send attempt in PostHog. Best-effort: no-op outside production,
 * swallows every error, and runs after the response is flushed so it never slows
 * the OTP send. Call it from the server action for every outcome branch.
 */
export function captureOtpAttempt(t: OtpAttemptTelemetry): void {
  try {
    if (process.env.NODE_ENV !== "production") return;
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey) return;

    // Defer to after the response is sent (same invocation stays warm on Vercel).
    after(async () => {
      try {
        await fetch(POSTHOG_CAPTURE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Short timeout so a slow ingest never holds the function open.
          signal: AbortSignal.timeout(2000),
          body: JSON.stringify({
            api_key: apiKey,
            event: "otp_send_attempt",
            // Group abuse by the durable, hashed session key (no PII, stable
            // across the token/user-id churn the rate limiter already defends).
            distinct_id: t.sid,
            properties: {
              outcome: t.outcome,
              block_reason: t.reason,
              // The real attacker IP — explicit props survive ingestion's
              // raw-IP discard, unlike the auto `$ip`.
              ip: t.rawIp,
              normalized_ip: t.normalizedIp,
              is_whatsapp: Number(t.isWhatsapp) === 1,
              source: "server_action",
              // Don't materialise a person profile (cost; mirrors the client's
              // `identified_only`) and don't geo-resolve the SERVER's IP.
              $process_person_profile: false,
              $geoip_disable: true,
            },
          }),
        });
      } catch {
        // Analytics must never break the OTP flow.
      }
    });
  } catch {
    // `after()` outside a request scope, or anything else — silently ignore.
  }
}
