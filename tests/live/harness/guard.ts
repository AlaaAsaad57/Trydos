// The target guard.
//
// Rule 5 of the roadmap: never point the suite at production. This is the thing
// that makes it a rule instead of a hope. `.env.development` points at staging
// today by convenience, not by guarantee — and the same variable names hold the
// real addresses on a deployment.
//
// The guard runs **before** the build, in the global setup, against the values
// the harness is about to hand to the server it starts. That ordering is the
// point: an unrecognised address stops the run before anything is built, started
// or requested, so there is no window in which a test could reach it.
//
// It is an allow-list, and an unknown host is a hard stop rather than a warning.
// A deny-list would have to predict what production is called; an allow-list only
// has to know what staging is called, which we do.

import { BACKEND_ADDRESS_KEYS, envValue, loadLiveEnv } from "./env";

/** Every host the live suite is allowed to talk to.
 *
 *  All staging. Adding one is a deliberate act: if a new backend appears and its
 *  host is not here, the guard stops the run and says so, which is the correct
 *  outcome — someone has to look at the new address and decide it is safe. */
export const ALLOWED_HOSTS: readonly string[] = [
  "trydos_develop.ramaaz.dev", // the core backend — and the admin product
  "trydosv2.ramaaz.dev", // the gateway
  "trydos_wallet_develop.ramaaz.dev",
  "trydo_story.ramaaz.dev",
  "trydoschatnest.ramaaz.dev",
  "trydos_comments_develop.ramaaz.dev",
  "recomende_elasticsearch_engin_develop.ramaaz.dev",
  "fleet_develop.ramaaz.dev", // the delivery-worker product
];

export type TargetReport = {
  /** Addresses that are set and allowed, as `KEY -> host`. */
  allowed: { key: string; host: string }[];
  /** Addresses that are not configured. Not an error — the suite skips. */
  missing: string[];
};

const allowedHostSet = new Set(ALLOWED_HOSTS.map((host) => host.toLowerCase()));

/** Check every configured backend address, or throw.
 *
 *  Throws on the first address that is set and not recognised. The message names
 *  the variable and the host — neither is a secret, and a guard that refuses to
 *  say what it refused is a guard nobody can fix. */
export const assertStagingTarget = (): TargetReport => {
  loadLiveEnv();

  const report: TargetReport = { allowed: [], missing: [] };

  for (const key of BACKEND_ADDRESS_KEYS) {
    const raw = envValue(key);

    if (!raw) {
      report.missing.push(key);
      continue;
    }

    let host: string;
    try {
      host = new URL(raw).hostname.toLowerCase();
    } catch {
      throw new Error(
        `Live target guard: ${key} is not a valid URL. Refusing to start.`,
      );
    }

    if (!allowedHostSet.has(host)) {
      throw new Error(
        [
          `Live target guard: ${key} points at "${host}", which is not a known staging host.`,
          "Refusing to build or start anything.",
          "",
          "If this host is genuinely staging, add it to ALLOWED_HOSTS in",
          "tests/live/harness/guard.ts — deliberately, having checked it.",
          "If it is production, the suite must never run against it.",
        ].join("\n"),
      );
    }

    report.allowed.push({ key, host });
  }

  return report;
};
