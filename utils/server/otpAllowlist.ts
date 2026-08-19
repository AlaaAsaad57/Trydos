import "server-only";

// ---------------------------------------------------------------------------
// OTP test-number allowlist
//
// WHAT IT IS
//   A short list of phone numbers that are exempt from OUR OTP rate limiter
//   (the Redis rules in `serverRequests/radis` → `otpRateLimit`): no per-IP
//   cooldown, no per-session distinct-number cap, no per-IP send cap. Nothing
//   is counted for these numbers and no counter is spent on them, so they can
//   never be locked out and can never lock a real shopper out either.
//
// WHY IT EXISTS
//   The limiter is deliberately tight (one send per IP per minute, 2 numbers
//   per session per hour, 4 sends per IP per hour). That is right for the
//   public, and wrong for the people who have to log in over and over: the
//   manual testers working through the staging checklists, and the live e2e
//   suite, which shares one IP for a whole CI run. Without an exemption they
//   spend the whole hourly budget in the first few minutes and then test
//   nothing but the refusal screen.
//
// WHAT IT DOES *NOT* DO
//   • It does not skip the send. The OTP is still requested from the backend
//     for real, so the flow under test is the real flow.
//   • It does not skip the backend's own per-number throttle. That one is not
//     ours, and it still applies.
//   • It is not a login bypass. The number still has to receive a code and the
//     code still has to be verified.
//
// HOW TO CONFIGURE IT
//   `OTP_TEST_PHONES` — a comma-separated list of numbers, in any readable
//   shape (`+963937288307`, `963 937 288 307`, `00963...` is NOT the same
//   number — see below). Everything except digits is ignored on both sides of
//   the comparison, so `+963937288307` and `+963 (937) 288-307` are the same
//   entry. A leading `+` is not part of the digits and never has to be typed.
//
//     OTP_TEST_PHONES=963937288307,963937729850
//
//   Unset or empty (the default) means the feature is OFF and every number goes
//   through the limiter — which is what production must stay on. Set it on the
//   staging deployment only. Changing it takes effect on the next deployment /
//   server start; nothing is cached across processes.
//
// SECURITY NOTE
//   The exemption is per NUMBER, not per person, per IP or per session. Someone
//   who guessed a listed number could ask for codes to that number without our
//   cooldown — they would be spamming a phone the team owns, and the backend
//   throttle still applies. That is the whole blast radius, and it is why the
//   list must hold only numbers the team controls, and must stay short.
// ---------------------------------------------------------------------------

/** Everything that is not a digit is noise — on both sides of the comparison. */
const digitsOnly = (phone: string) => (phone || "").replace(/[^0-9]/g, "");

// Parsed once per distinct value of the variable, not once per process: reading
// `process.env` is cheap but splitting a string on every send is pointless, and
// keying the cache on the raw value keeps it honest if the value ever changes
// under us (a test does exactly that).
let cachedRaw: string | null = null;
let cachedSet = new Set<string>();

function allowlist(): Set<string> {
  const raw = process.env.OTP_TEST_PHONES ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSet = new Set(
      raw
        .split(",")
        .map(digitsOnly)
        .filter(Boolean),
    );
  }
  return cachedSet;
}

/**
 * True when this number is one of the configured test numbers, and so must skip
 * our OTP rate limiter entirely.
 *
 * Accepts the number in any shape (`+963...`, spaces, brackets) — only digits
 * are compared.
 */
export function isAllowlistedTestPhone(phone: string): boolean {
  const digits = digitsOnly(phone);
  if (!digits) return false;
  return allowlist().has(digits);
}
