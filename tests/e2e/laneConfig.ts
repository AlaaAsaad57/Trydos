// The lane tables, the flag parser, and the tag rule — with **no import-time
// work at all**.
//
// This file exists for one reason. All of this used to live in `tests/e2e/cli.ts`,
// and `cli.ts` calls `main()` at module scope with the command defaulting to
// `"run"`. So a unit test that imported `cli.ts` to check a lane list would run
// preflight, a full `next build`, and the whole Playwright suite against staging
// — inside `pnpm test:run`, on every pull request.
//
// Nothing under `tests/` may import `cli.ts`. It imports this instead, and this
// file:
//
//   - runs no command, starts no process, reads no environment variable;
//   - touches the disk only inside `laneSpecs()`, when something calls it;
//   - exports plain data and pure functions.
//
// `cli.ts` is now a thin caller of what is here.

import { readdirSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Lanes
//
//   account  one account, one code budget, real writes     → one worker, always
//   solo     no account, no code, nothing real written     → several workers
//
// **A file listed in neither lane is a file that never runs**, and a test that
// never runs reports nothing at all — the worst outcome this suite has. So the
// lists are checked against the folder on every use (`laneSpecs`) and a spec in
// neither, or in both, stops the command instead of being skipped quietly.
//
// Adding a spec: leave it out and the guard tells you, naming the file. When in
// doubt put it in `account` — that lane is always correct, only slower.
// ---------------------------------------------------------------------------

/** Signs in as the shared account, spends a one-time code, or writes for real.
 *  Never parallelised. */
export const ACCOUNT_LANE = [
  "auth.live.spec.ts",
  "auth.scripted.spec.ts",
  "profile.live.spec.ts",
  "profile.scripted.spec.ts",
  "session-recovery.live.spec.ts",
  "shopper.live.spec.ts",
  // Signs in as the shared account and spends a real code, for one reason: a
  // verified shopper's checklist is served by core, and the guest file beside
  // it can only ever reach the gateway.
  "wishlist-signed-in.live.spec.ts",
  // The QA lock. In this lane because the seed it depends on signs in as
  // Shopper B and writes real rows to the environment — a seller, a shop, a
  // location and a product. It must never run beside a second copy of itself.
  "qaLock.live.spec.ts",
];

/** No account, no code, nothing real written. Safe to run several at once. */
export const SOLO_LANE = [
  "checkout.scripted.spec.ts",
  "guest.live.spec.ts",
  "locale.live.spec.ts",
  "login-design-parity.scripted.spec.ts",
  "session.live.spec.ts",
  "staticPages.live.spec.ts",
  // Compare writes nothing anywhere — its whole state is two cookies.
  "compare.live.spec.ts",
  // A throwaway guest saves one product and removes it again. It does write to
  // staging, but not to the shared account and not to anything a second worker
  // could collide with: each run registers its own guest.
  "wishlist.live.spec.ts",
];

/** How many workers a lane may use.
 *
 *  The solo lane gets 2, not 4, and the number is deliberate. Two of these
 *  files still reach real staging — `guest.live` searches the real catalogue
 *  and `session.live` registers real guests — so every extra worker multiplies
 *  the load on a backend that is already the flakiest part of this suite. */
export const LANE_WORKERS: Record<string, number> = { account: 1, solo: 2 };

/** The environment variable that carries the lane name into Playwright.
 *
 *  The seed reads it to decide whether to run. Both lane jobs start the same
 *  Playwright config, and a setup project cannot be excluded by a positional
 *  file filter or by `--project` — measured, both — so the lane name is the
 *  only thing that tells the seed which job it is in. */
export const LANE_ENV_VAR = "E2E_LANE";

/** The tag the QA-safety cases carry, and the seed's own setup test.
 *
 *  It is on the seed title too. `--grep` **does** filter a setup project out,
 *  measured; a grep the seed does not match kills the whole run with "No tests
 *  found". */
export const PROD_SAFE_TAG = "@prod-safe";

/** The spec files in a lane, checked against what is actually on disk.
 *
 *  Throws rather than returns, because every way this can be wrong ends in
 *  tests that silently do not run. Reads the folder — the one function here
 *  that touches anything. */
export const laneSpecs = (lane: string): string[] => {
  const lists: Record<string, string[]> = {
    account: ACCOUNT_LANE,
    solo: SOLO_LANE,
  };

  const wanted = lists[lane];
  if (!wanted) {
    throw new Error(
      `Unknown lane "${lane}". Use ${Object.keys(lists).join(" or ")}.`,
    );
  }

  const onDisk = readdirSync(resolve(process.cwd(), "tests/e2e"))
    .filter((name) => name.endsWith(".spec.ts"))
    .sort();

  const assigned = [...ACCOUNT_LANE, ...SOLO_LANE];

  const unassigned = onDisk.filter((name) => !assigned.includes(name));
  if (unassigned.length > 0) {
    throw new Error(
      `These spec files are in no lane, so a lane run would skip them ` +
        `silently: ${unassigned.join(", ")}. Add each one to ACCOUNT_LANE or ` +
        `SOLO_LANE in tests/e2e/laneConfig.ts. If you are unsure, ACCOUNT_LANE ` +
        `is the safe choice.`,
    );
  }

  const twice = ACCOUNT_LANE.filter((name) => SOLO_LANE.includes(name));
  if (twice.length > 0) {
    throw new Error(
      `These spec files are in both lanes, so they would run twice and the ` +
        `two runs would fight over the account: ${twice.join(", ")}.`,
    );
  }

  const missing = assigned.filter((name) => !onDisk.includes(name));
  if (missing.length > 0) {
    throw new Error(
      `These spec files are in a lane but not on disk, so the lane no longer ` +
        `runs what it claims to: ${missing.join(", ")}. Remove them from ` +
        `tests/e2e/laneConfig.ts.`,
    );
  }

  return wanted;
};

/** Turn `--lane=solo` into the arguments Playwright needs for it.
 *
 *  The file names go to Playwright as positional filters, which it reads as
 *  **patterns** against the whole path, not as literal names. So every dot
 *  becomes `[.]` — a character class matching one real dot. Left alone, `.`
 *  matches any character, and a lane's pattern could then catch a file from the
 *  other lane. Written as a class rather than a backslash escape because the
 *  backslash has to survive this file, the shell and Playwright's own parsing,
 *  and it did not: the first version of this line shipped `"\."`, which
 *  TypeScript reads as plain `"."`, so it escaped nothing. */
export const laneArgs = (lane: string): string[] => [
  `--workers=${LANE_WORKERS[lane]}`,
  ...laneSpecs(lane).map((name) => name.replace(/[.]/g, "[.]")),
];

/** Which cases may run against this target — and the answer is narrow by
 *  default.
 *
 *  Returns `undefined` for an address the target guard recognises as staging:
 *  no grep, the whole suite runs. Returns the `@prod-safe` tag for **anything
 *  else** — an unknown host, a value that will not parse, an empty string — so
 *  only the cases that are safe against data they do not own can run.
 *
 *  That is the fail-closed direction, and it is what makes the unknown case the
 *  narrow one rather than the wide one.
 *
 *  **What this does not protect against**, said plainly: the only way to point
 *  the suite at production is to add that host to `ALLOWED_HOSTS` in
 *  `harness/guard.ts`. From that moment `isAllowedHost` calls it known and this
 *  function drops the grep. The guard's list is a *staging* list today because
 *  there is no production environment. The day one exists, this needs a second
 *  list of its own — see the ticket's residual risks.
 *
 *  Pure: the allow-list check is passed in, so a unit test can drive both
 *  branches without touching the environment. */
export const qaGrepFor = (
  target: string,
  isAllowedHost: (host: string) => boolean,
): string | undefined => {
  const raw = (target ?? "").trim();
  if (!raw) return PROD_SAFE_TAG;

  let host: string;
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
      ? raw
      : `https://${raw}`;
    host = new URL(withScheme).hostname.toLowerCase();
  } catch {
    return PROD_SAFE_TAG;
  }

  if (!host) return PROD_SAFE_TAG;

  return isAllowedHost(host) ? undefined : PROD_SAFE_TAG;
};

/** Pull out the flags the CLI owns before Playwright sees them.
 *
 *  Returns `lane` as well as the arguments, because the run command has to put
 *  the lane name into the child process environment — that is how the seed
 *  knows which lane job it is in. */
export const parseRunFlags = (
  args: string[],
): { skipBuild: boolean; lane: string | undefined; playwrightArgs: string[] } => {
  const skipBuild = args.includes("--skip-build");
  const lane = args
    .find((arg) => arg.startsWith("--lane="))
    ?.slice("--lane=".length);
  const ours = (arg: string): boolean =>
    arg === "--skip-build" || arg.startsWith("--lane=");

  return {
    skipBuild,
    lane,
    // The lane's own arguments go first, so anything typed on the command line
    // after them still wins — `--workers` especially, which is how you try a
    // lane at a different width without editing the table.
    playwrightArgs: [
      ...(lane ? laneArgs(lane) : []),
      ...args.filter((arg) => !ours(arg)),
    ],
  };
};
