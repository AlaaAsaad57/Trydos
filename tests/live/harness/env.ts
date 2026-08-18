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
// See docs/testing/LIVE_TEST_ROADMAP.md, "Identities and secrets".

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILE = resolve(process.cwd(), ".env.development");

// The server the harness builds and starts. A constant rather than a setting:
// the suite may only ever talk to a server this harness started, so there is
// nothing to configure and no way to point it somewhere else by accident. An
// earlier draft had a LIVE_BASE_URL override to skip the build; it was cut on
// purpose (see the roadmap, phase 1).
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
  "ELASTIC_BACKEND_URL",
  "NEXT_PUBLIC_CHAT_BACKEND_URL",
  "COMMENT_BACKEND_URL",
  "FLEET_BASE_URL", // a separate product, phase 19
  "ADMIN_DASHBOARD_BASE_URL", // a separate product, phase 19
] as const;

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

/** Shopper A — who is also the seller. Unlocks phase 6 onward. */
export const hasShopperA = (): boolean =>
  allSet("TEST_ACCOUNT_PHONE", "TEST_ACCOUNT_OTP");

/** Shopper B — the second identity. Chat, and buying from A's shop. */
export const hasShopperB = (): boolean =>
  allSet("TEST_ACCOUNT_PHONE_2", "TEST_ACCOUNT_OTP");

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
