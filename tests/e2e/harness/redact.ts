// Keeping secrets out of the output.
//
// This is a security control, not housekeeping. The repository is public, so
// every CI run log is world-readable: a phone number or a password that reaches
// a failure message is published, not merely untidy. Every assertion message and
// every log line a live test produces goes through `redact()`.
//
// Two kinds of secret have to be covered, and they arrive by different routes:
//
//   * **Configured values** — the phones, the OTP, the fleet and admin logins.
//     Known up front, read from the environment.
//   * **Minted values** — the JWTs and refresh tokens the backends hand out at
//     run time. Never in the environment, so they are matched by shape.

import { envValue, loadLiveEnv } from "./env";

// Configured values that must never be printed. The label that replaces each one
// names the variable, which is what a reader actually needs ("the admin password
// appeared here"), and tells them nothing they could use.
const SECRET_KEYS: readonly string[] = [
  "TEST_ACCOUNT_PHONE",
  "TEST_ACCOUNT_PHONE_2",
  "TEST_ACCOUNT_OTP",
  "FLEET_EMAIL",
  "FLEET_PASSWORD",
  "ADMIN_DASHBOARD_EMAIL",
  "ADMIN_DASHBOARD_PASSWORD",
  // Not identities, but they are in the same file and a stack trace can carry
  // them just as easily.
  "REDIS_PASS",
  "OTP_KEY_SALT",
  "ELASTICSEARCH_PASSWORD",
  "WALLET_SECRET_KEY",
];

// Deliberately NOT in the list above, and both for the same reason — masking a
// value that is not secret makes `containsSecret()` lie:
//
//   * usernames (REDIS_USERNAME, ELASTICSEARCH_USERNAME) are not credentials, and
//     a value like "default" would match ordinary words in any response body,
//     reporting a secret leak where there is none;
//   * anything under NEXT_PUBLIC_ is compiled into the browser bundle by design,
//     so it is already public and masking it would only hide it from us.

// A value this short is not a secret worth masking, and masking it would eat
// half of every message. The shortest real value here is a 6-digit OTP.
const MIN_SECRET_LENGTH = 5;

// A JWT, matched by shape because it is minted at run time and never configured.
// Base64url header starting "eyJ", then at least a payload segment.
const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g;

// The token cookies, masked by name as well as by shape. A refresh token is
// opaque rather than a JWT on some of these backends, so the shape rule above
// would not catch it — but its cookie name is fixed and known.
const TOKEN_COOKIE_PATTERN =
  /\b(MARKET-TOKEN|MARKET-REFRESH-TOKEN|CHAT-TOKEN|CHAT-REFRESH-TOKEN|STORIES-TOKEN|STORIES-REFRESH-TOKEN|COMMENTS-REFRESH-TOKEN|DEVICE-TOKEN|rdb_at|USER_ID_HASH|VISIT-ID)=([^;,\s"]+)/g;

// The confirmation a phone change carries.
//
// Masked by field name rather than by shape: it is minted at run time, so it is
// not a configured value `SECRET_KEYS` could name, and it is not always a JWT,
// so the shape rule above does not always reach it. The profile save carries it
// in its body as `id_token`.
//
// The real control is that no case reads its value at all — a case asserts it is
// present and non-empty, never what it says. This is the second line, for the
// day somebody prints a body while debugging.
const CONFIRMATION_TOKEN_PATTERN =
  /("?id_token"?\s*[:=]\s*"?)([^",;&\s}]{5,})/g;

// An Authorization header, whatever scheme it carries.
const BEARER_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;

const escapeForRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The configured secrets, longest first.
 *
 *  Longest first matters: if a password happens to contain a phone number (it
 *  does — the admin password is a phone number), replacing the shorter value
 *  first would leave the longer one half-masked and still readable. */
const configuredSecrets = (): { value: string; label: string }[] => {
  loadLiveEnv();

  return SECRET_KEYS.map((key) => ({ key, value: envValue(key) }))
    .filter(({ value }) => value.length >= MIN_SECRET_LENGTH)
    .sort((a, b) => b.value.length - a.value.length)
    .map(({ key, value }) => ({ value, label: `[redacted:${key}]` }));
};

const stringify = (input: unknown): string => {
  if (typeof input === "string") return input;
  if (input instanceof Error) return `${input.name}: ${input.message}`;
  try {
    return JSON.stringify(input) ?? String(input);
  } catch {
    // Circular, or something JSON cannot hold. String() still tells the reader
    // what kind of thing it was, and cannot itself throw here.
    return String(input);
  }
};

/** Mask every secret in a value, and return it as a string.
 *
 *  Use this on anything that reaches the output: an assertion message, a log
 *  line, a response body being reported on failure. */
export const redact = (input: unknown): string => {
  let text = stringify(input);

  for (const { value, label } of configuredSecrets()) {
    text = text.replace(new RegExp(escapeForRegExp(value), "g"), label);
  }

  text = text.replace(TOKEN_COOKIE_PATTERN, "$1=[redacted:token]");
  text = text.replace(JWT_PATTERN, "[redacted:jwt]");
  text = text.replace(BEARER_PATTERN, "$1 [redacted:token]");
  text = text.replace(CONFIRMATION_TOKEN_PATTERN, "$1[redacted:confirmation]");

  return text;
};

/** Does this value still carry a secret?
 *
 *  The inverse check, for a test that wants to assert an output is clean — for
 *  example that a response body does not contain the token it just minted. */
export const containsSecret = (input: unknown): boolean => {
  const text = stringify(input);

  for (const { value } of configuredSecrets()) {
    if (text.includes(value)) return true;
  }

  // Fresh RegExp objects: the module-level ones carry the /g flag, so a shared
  // instance would remember lastIndex between calls and start skipping matches.
  return (
    new RegExp(JWT_PATTERN.source).test(text) ||
    new RegExp(TOKEN_COOKIE_PATTERN.source).test(text) ||
    new RegExp(BEARER_PATTERN.source, "i").test(text) ||
    new RegExp(CONFIRMATION_TOKEN_PATTERN.source).test(text)
  );
};
