// The target guard.
//
// Never point the suite at production. This is the thing that makes it a rule
// instead of a hope. `.env.development` points at staging today by convenience,
// not by guarantee — and the same variable names hold the real addresses on a
// deployment.
//
// The guard runs in **preflight**, before the build, against the values the
// harness is about to hand to the server it starts. That ordering is the point:
// an unrecognised address stops the run before anything is built, started or
// requested, so there is no window in which a test could reach it. Playwright's
// global setup runs it a second time, which costs nothing and means the guard
// still holds for someone who runs `playwright test` directly.
//
// It is an allow-list, and an unknown host is a hard stop rather than a warning.
// A deny-list would have to predict what production is called; an allow-list only
// has to know what staging is called, which we do.

import {
  BACKEND_ADDRESS_KEYS,
  HTTPS_ONLY_KEYS,
  envValue,
  loadLiveEnv,
} from "./env";

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
  // The search index, reached by address rather than by name because that is
  // how it is deployed today. Written out here so the guard covers it like
  // every other backend — it is already in this repository's public CI logs,
  // which print it on every Elasticsearch error, so listing it publishes
  // nothing new. It should get a staging hostname and a firewall; until it
  // does, this entry is what keeps the suite from silently pointing elsewhere.
  "13.233.30.40",
  // The media store, reached by the **browser** rather than the server — both
  // the upload host and the read-back host resolve here today.
  //
  // It carries no `_develop` in its name, and it has no staging twin, because
  // there is no production environment yet: this is the only media store there
  // is. That is why it is safe to list, and it is also the thing to re-check
  // when a production environment appears — the guard compares hostnames only,
  // so it could not tell a twin apart from this one.
  "media_server.ramaaz.dev",
  // The same media store read from the other side. Uploads go to the host above
  // and pictures are **read back** from this one, so a machine can quite
  // correctly have `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` on one and
  // `NEXT_PUBLIC_BASE_MEDIA_URL` on the other — and until this line existed,
  // that machine could not run the suite at all. The guard stopped on
  // "media.ramaaz.dev is not a known staging host" before it built anything.
  //
  // Listed after checking, not on the strength of the name: `next.config.ts`
  // carries it in `images.domains` beside the upload host, the CSP allows it
  // under `img-src` (`docs/security/csp-decision.md`), and
  // `docs/architecture-and-deployment.md` names it as the media host. It has no
  // `_develop` twin for the same reason the upload host has none — there is no
  // production environment yet — so it goes on the same re-check list as the
  // line above on the day one appears.
  "media.ramaaz.dev",
];

export type TargetReport = {
  /** Addresses that are set and allowed, as `KEY -> host`. */
  allowed: { key: string; host: string }[];
  /** Addresses that are not configured. Not an error — the suite skips. */
  missing: string[];
};

const allowedHostSet = new Set(ALLOWED_HOSTS.map((host) => host.toLowerCase()));

/** Is this host one the live suite is allowed to talk to?
 *
 *  Pure: it takes the host and reads nothing else — no environment, no file, no
 *  process state. That matters for two callers. `qaGrepFor` in `laneConfig.ts`
 *  asks it to decide which cases may run, and a unit test asks it directly
 *  (`AC-22`), which it can only do because importing this module loads nothing:
 *  `loadLiveEnv` is lazy, so `.env.development` never reaches the shared Vitest
 *  worker.
 *
 *  `assertStagingTarget` below asks the same question through this function, so
 *  the list and the comparison rule have one owner rather than two. */
export const isAllowedHost = (host: string): boolean =>
  allowedHostSet.has((host ?? "").trim().toLowerCase());

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
    let scheme: string;
    try {
      const parsed = new URL(raw);
      host = parsed.hostname.toLowerCase();
      scheme = parsed.protocol.toLowerCase();
    } catch {
      throw new Error(
        `Live target guard: ${key} is not a valid URL. Refusing to start.`,
      );
    }

    // The browser-reached addresses must be https. One of them carries an API
    // key in a request header, and the guard checks the hostname only — so
    // without this, a value that merely swapped the scheme would pass.
    if (HTTPS_ONLY_KEYS.includes(key) && scheme !== "https:") {
      throw new Error(
        [
          `Live target guard: ${key} is "${scheme}//" and must be "https:".`,
          "The browser reaches this address directly, and one of these carries",
          "an API key in a header. Refusing to build or start anything.",
        ].join("\n"),
      );
    }

    if (!isAllowedHost(host)) {
      throw new Error(
        [
          `Live target guard: ${key} points at "${host}", which is not a known staging host.`,
          "Refusing to build or start anything.",
          "",
          "If this host is genuinely staging, add it to ALLOWED_HOSTS in",
          "tests/e2e/harness/guard.ts — deliberately, having checked it.",
          "If it is production, the suite must never run against it.",
        ].join("\n"),
      );
    }

    report.allowed.push({ key, host });
  }

  return report;
};
