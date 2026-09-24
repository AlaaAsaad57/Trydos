// The live suite's environment.
//
// Everything here is read from the untracked `.env.development`, which is where
// the real staging addresses and the test identities live. Two rules govern this
// file and neither is negotiable:
//
//   1. **Unset means skip, never fail.** Someone who has configured nothing must
//      still get a clean `pnpm test:live`. So nothing in here throws on a
//      missing value — it reports "not configured" and the caller skips.
//   2. **A value already in the environment wins.** CI supplies the same names
//      as repository secrets, and a file that happens to exist in the checkout
//      must never overwrite them.
//
// See docs/testing/E2E_TEST_DESIGN.md, "Identities and secrets".

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), ".env.development");

// The server the harness builds and starts. A constant rather than a setting:
// the suite may only ever talk to a server this harness started, so there is
// nothing to configure and no way to point it somewhere else by accident. An
// earlier draft had a LIVE_BASE_URL override to skip the build; it was cut on
// purpose.
export const LIVE_HOST = "127.0.0.1";
export const LIVE_PORT = 3100;
export const LIVE_ORIGIN = `http://${LIVE_HOST}:${LIVE_PORT}`;

// Every backend address the running app resolves, so the guard can check all of
// them. Checking only the storefront pair would let the suite prove the front
// door points at staging while the wallet points somewhere else.
//
// `GO_BACKEND_URL` is read under the name it has today. CLAUDE.md's
// stack-agnostic rule wants it renamed to `GATEWAY_BACKEND_URL`, and that rename
// is still pending across the app — renaming it here alone would just stop the
// harness reading the value the app uses. Rename both together or neither.
export const BACKEND_ADDRESS_KEYS = [
  "BACKEND_URL", // the core backend
  "GO_BACKEND_URL", // the gateway (rename pending)
  "WALLET_BACKEND_URL",
  "STORIES_BACKEND_URL",
  "ELASTIC_BACKEND_URL", // the recommendation engine
  // The search index itself, and it was missing from this list until the run
  // that made `health.ts` necessary: preflight reported "7 staging addresses
  // checked" while the one address that took the suite down was never looked at.
  "ELASTICSEARCH_NODE",
  "NEXT_PUBLIC_CHAT_BACKEND_URL",
  "COMMENT_BACKEND_URL",
  "FLEET_BASE_URL", // a separate product, phase 19
  "ADMIN_DASHBOARD_BASE_URL", // a separate product, phase 19
  // The media store. Two keys, and today both resolve to the same host — the
  // first is where the browser uploads, the second is where it reads a picture
  // back. Both are checked because a run that uploads to staging and reads from
  // somewhere else would still be pointing at somewhere else.
  "NEXT_PUBLIC_MEDIA_SERVER_BASE_URL",
  "NEXT_PUBLIC_BASE_MEDIA_URL",
] as const;

/** The media keys, which the guard additionally requires to be `https:`.
 *
 *  Every other address here is reached by the server; these two are reached by
 *  the browser, and one of them carries an API key in a header. A plain-text
 *  hop is not acceptable for either. */
export const HTTPS_ONLY_KEYS: readonly string[] = [
  "NEXT_PUBLIC_MEDIA_SERVER_BASE_URL",
  "NEXT_PUBLIC_BASE_MEDIA_URL",
];

/** Parse one `.env` file.
 *
 *  Deliberately small. Every line in this project's file is blank, a comment, or
 *  `KEY=value`, so there is no multi-line-value case to handle — a quoted value
 *  that would need one (the Firebase PEM) is written on a single line with `\n`
 *  escapes, exactly as a double-quoted dotenv value is meant to be. If a future
 *  value ever spans real lines, this parser will drop it silently rather than
 *  corrupt it, and the guard below will say the address is missing. */
const parseEnvFile = (raw: string): Record<string, string> => {
  const values: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equals = trimmed.indexOf("=");
    if (equals < 1) continue;

    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();

    // A quoted value keeps its spaces and any "=" inside it. Double quotes also
    // expand "\n", which is the only way a PEM key survives on one line — the
    // same rule dotenv and Next's own loader follow.
    const quoted =
      value.length > 1 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));

    if (quoted) {
      const quote = value[0];
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, "\n");
    }

    values[key] = value;
  }

  return values;
};

let loaded = false;

/** Load `.env.development` into `process.env`, once per process.
 *
 *  Called by every entry point (the global setup and each helper), because a
 *  vitest worker is its own process and does not inherit what the setup loaded. */
export const loadLiveEnv = (): void => {
  if (loaded) return;
  loaded = true;

  let raw: string;
  try {
    raw = readFileSync(ENV_FILE, "utf8");
  } catch {
    // No file is not an error. On CI there is no file — the same names arrive as
    // repository secrets — and on a fresh checkout there is neither, which must
    // still produce a clean skipped run rather than a red one.
    return;
  }

  for (const [key, value] of Object.entries(parseEnvFile(raw))) {
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
};

/** One environment value, trimmed. `""` when it is unset. */
export const envValue = (key: string): string => {
  loadLiveEnv();
  return (process.env[key] ?? "").trim();
};

const allSet = (...keys: string[]): boolean =>
  keys.every((key) => envValue(key) !== "");

/** The two storefront addresses. Without them nothing in the suite can run. */
export const hasBackends = (): boolean =>
  allSet("BACKEND_URL", "GO_BACKEND_URL");

/** Shopper A — the main shopper identity. Unlocks phase 6 onward.
 *
 *  It used to say "who is also the seller". That was true of the staging
 *  account and is not a rule: on a new environment nobody is a seller until the
 *  QA seed makes one, and the identity it makes a seller is **Shopper B**. */
export const hasShopperA = (): boolean =>
  allSet("TEST_ACCOUNT_PHONE", "TEST_ACCOUNT_OTP");

/** Shopper B — the second identity, and the one the QA seed turns into a
 *  seller. Chat, and buying from the QA shop.
 *
 *  **This is enough to reach the PIN screen, not to get past it.** The scripted
 *  specs that use Shopper B fake every backend answer, so they never needed a
 *  code that works. Anything that really signs in as Shopper B needs
 *  `hasShopperBCode()` below as well. */
export const hasShopperB = (): boolean =>
  allSet("TEST_ACCOUNT_PHONE_2", "TEST_ACCOUNT_OTP");

/** Shopper B's **own** one-time code.
 *
 *  Measured against staging on 2026-09-19: signing in as Shopper B with
 *  `TEST_ACCOUNT_OTP` — which is Shopper A's allow-listed code — is refused by
 *  the **core** backend with `422 invalid_code` on
 *  `/auth/phone/verify_otp_from_guest`. The two accounts do not share a code,
 *  and until this variable held one, nothing in this suite had ever really
 *  signed in as Shopper B.
 *
 *  Falls back to the shared code when set, so an environment where the two
 *  accounts genuinely do share one needs no second variable. */
export const shopperBOtp = (): string =>
  envValue("TEST_ACCOUNT_OTP_2") || envValue("TEST_ACCOUNT_OTP");

/** Is a code configured that can actually sign Shopper B in?
 *
 *  Deliberately asks for `TEST_ACCOUNT_OTP_2` by name. Falling back silently to
 *  the shared code would turn a missing setting into a red run that blames the
 *  core backend for refusing a code it was right to refuse. */
export const hasShopperBCode = (): boolean =>
  envValue("TEST_ACCOUNT_OTP_2") !== "";

/** Either configured test phone, plus the shared OTP. Used by scripted auth
 *  specs that only need to reach the PIN screen and do not require both
 *  identities. */
export const hasTestAccountPhones = (): boolean =>
  hasShopperA() || hasShopperB();

/** The media store. Needed by the cases that upload a profile picture and read
 *  it back.
 *
 *  All three, because the app throws "Media server upload is not configured"
 *  unless the first two are set (`services/auth.ts`), and the picture is read
 *  back through the third. Gating on fewer would make a half-configured
 *  environment **fail** where it should skip. */
export const hasMedia = (): boolean =>
  allSet(
    "NEXT_PUBLIC_MEDIA_SERVER_BASE_URL",
    "NEXT_PUBLIC_MEDIA_API_KEY",
    "NEXT_PUBLIC_BASE_MEDIA_URL",
  );

/** The delivery worker. A separate product with its own login. */
export const hasFleet = (): boolean =>
  allSet("FLEET_BASE_URL", "FLEET_EMAIL", "FLEET_PASSWORD");

/** The admin. A separate product with its own login. */
export const hasAdmin = (): boolean =>
  allSet(
    "ADMIN_DASHBOARD_BASE_URL",
    "ADMIN_DASHBOARD_EMAIL",
    "ADMIN_DASHBOARD_PASSWORD",
  );

/** QA mode — the secret that lets a request see QA data.
 *
 *  Gated on length as well as presence, and the number matches
 *  `utils/server/qaMode.ts`: below 32 characters the app treats the secret as
 *  unset, so a suite that ran anyway would fail later with a message about the
 *  search index that names the wrong cause.
 *
 *  **This must never be set in the deployed staging app.** It belongs in the
 *  environment the harness builds and starts, which is the only place a test
 *  can reach it. */
export const hasQaMode = (): boolean =>
  envValue("QA_VIEW_SECRET").length >= 32;

/** Can the suite see its own test stories?
 *
 *  A test story is hidden from every reader of the feed. The app reads
 *  `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` to decide who still sees one, and
 *  `harness/server.ts` fills that in from the test phones when it builds the
 *  app — so there is nothing to configure, and this is true whenever a test
 *  account is configured at all.
 *
 *  Kept as its own gate anyway, because the two are not the same question and
 *  a reader of a skip line should not have to know they are usually equal. */
export const hasQaStoryViewers = (): boolean =>
  envValue("NEXT_PUBLIC_QA_STORY_VIEWER_PHONES") !== "" || hasShopperA();

/** Why the stories cases cannot run. */
export const NO_QA_STORY_VIEWERS_REASON =
  "no test account phone is configured, so the app cannot be told who may see " +
  "a test story — and a test story is hidden from this suite exactly as it is " +
  "hidden from a customer. Set TEST_ACCOUNT_PHONE; the harness does the rest.";

/** Everything the QA seed needs before it may write anything.
 *
 *  Shopper B signs in and becomes the seller; the admin approves the seller and
 *  the boutique; the media store takes the product image, which the product
 *  needs before it can be activated. Missing any one of them is a clean skip,
 *  never a failure — a fresh checkout with no secrets must still run green. */
export const hasQaSeed = (): boolean =>
  hasShopperB() &&
  hasShopperBCode() &&
  hasAdmin() &&
  hasMedia() &&
  hasQaMode();
