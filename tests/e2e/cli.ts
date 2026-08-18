// The one entry point for the e2e suite.
//
//   tsx tests/e2e/cli.ts preflight   is this configured, and is it staging?
//   tsx tests/e2e/cli.ts build       build the app with the staging environment
//   tsx tests/e2e/cli.ts run         all three, in order, for local use
//
// **Why preflight is a separate command and runs before the build.** The build
// takes minutes. Finding out afterwards that the machine has no staging
// addresses wastes all of it, and — worse — would mean the target guard ran late.
// So the order is: decide whether to run at all, decide the target is safe, and
// only then spend anything. See docs/testing/E2E_TEST_DESIGN.md section 4.
//
// **"Not configured" is a clean exit, never a failure.** Someone who has never
// set up staging must still be able to run `pnpm test:e2e` and get a green,
// fast, honest "skipped". Only a target that is set *and wrong* fails.

import { spawn } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { hasBackends, hasShopperA, loadLiveEnv } from "./harness/env";
import { assertStagingTarget } from "./harness/guard";
import { redact } from "./harness/redact";
import { buildApp } from "./harness/server";

const PLAYWRIGHT_CLI = resolve(
  process.cwd(),
  "node_modules/@playwright/test/cli.js",
);

const log = (message: string): void => {
  console.log(redact(`[e2e] ${message}`));
};

/** Tell the CI step whether the rest of the job should run.
 *
 *  A no-op anywhere else, so the same command works locally unchanged. */
const setStepOutput = (key: string, value: string): void => {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  // The heredoc form, because a failure list is several lines and the `key=value`
  // form silently keeps only the first.
  appendFileSync(file, `${key}<<TRYDOS_EOF\n${value}\nTRYDOS_EOF\n`);
};

/** Decide whether to run, and prove the target is staging.
 *
 *  Returns false when nothing is configured, which means "skip everything" and
 *  not "something is wrong". Throws when an address is set and is not a known
 *  staging host — that is the one hard stop. */
const preflight = (): boolean => {
  loadLiveEnv();

  if (!hasBackends()) {
    log("BACKEND_URL / GO_BACKEND_URL are not configured.");
    log("Skipping the e2e suite. Nothing will be built and no server started.");
    setStepOutput("configured", "false");
    return false;
  }

  // Throws on any address that is set and not a known staging host.
  const target = assertStagingTarget();

  log(`target check passed for ${target.allowed.length} staging address(es).`);
  if (target.missing.length > 0) {
    log(`not configured, so out of scope this run: ${target.missing.join(", ")}`);
  }

  // A name, never a value. Which identities exist is useful to see in a log;
  // what they are is a secret. Shopper A unlocks the authenticated journeys,
  // which do not exist yet — this line is what will tell you why they skipped.
  log(
    hasShopperA()
      ? "shopper A is configured — authenticated journeys can run."
      : "shopper A is not configured — only guest journeys will run.",
  );

  setStepOutput("configured", "true");
  return true;
};

// ---------------------------------------------------------------------------
// The report, for the Telegram message.
//
// Playwright's JSON reporter writes `e2e-results.json`. Console output cannot be
// scraped reliably, so the counts and the failing test names come from there.
//
// **Everything printed goes through `redact()`.** A failure message carries
// whatever the assertion saw — a URL, a header, a response body — and this
// repository is public, so its CI logs are world-readable. The Telegram chat is
// not public, but the step that builds this text is.
// ---------------------------------------------------------------------------

const RESULTS_FILE = resolve(process.cwd(), "e2e-results.json");

/** How many failures to name. The message has a hard 4096-character limit, and
 *  a wall of names helps nobody — the run link is there for the rest. */
const MAX_NAMED_FAILURES = 4;

type PlaywrightSpec = {
  title: string;
  ok?: boolean;
  tests?: { results?: { status?: string; error?: { message?: string } }[] }[];
};

type PlaywrightSuite = {
  title?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
};

type Failure = { name: string; reason: string };

/** Walk the nested suites and collect every spec that did not pass. */
const collectFailures = (
  suites: PlaywrightSuite[] = [],
  trail: string[] = [],
): Failure[] =>
  suites.flatMap((suite) => {
    const here = suite.title ? [...trail, suite.title] : trail;

    const failedHere = (suite.specs ?? [])
      .filter((spec) => spec.ok === false)
      .map((spec) => {
        const message = (spec.tests ?? [])
          .flatMap((test) => test.results ?? [])
          .find((result) => result.error?.message)?.error?.message;

        return {
          name: [...here, spec.title].join(" › "),
          reason: summariseError(message ?? "no error message recorded"),
        };
      });

    return [...failedHere, ...collectFailures(suite.suites, here)];
  });

/** The part of an error worth putting in a chat message.
 *
 *  Playwright errors run to dozens of lines of call log, and the opening line
 *  alone is often not enough: a timeout says everything in itself, but an
 *  assertion opens with `expect(received).toBe(expected)` and keeps the actual
 *  answer two lines further down. So take the opening line plus whichever of
 *  the Expected / Received / Timeout lines follow it.
 *
 *  Colour codes are stripped because Telegram renders them as literal escape
 *  characters. */
const DETAIL_LINE = /^(Expected|Received|Timeout|Locator)\b/;

const summariseError = (message: string): string => {
  const lines = message
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const opening = lines[0] ?? "no error message recorded";
  const details = lines
    .slice(1)
    .filter((line) => DETAIL_LINE.test(line))
    .slice(0, 2);

  const clip = (line: string): string =>
    line.length > 120 ? `${line.slice(0, 120)}\u2026` : line;

  return [opening, ...details].map(clip).join("\n      ");
};

/** Read the run's results and write the two values the notifier wants. */
const report = (): void => {
  let raw: string;
  try {
    raw = readFileSync(RESULTS_FILE, "utf8");
  } catch {
    // No file means the run never got as far as producing one — the build
    // failed, or preflight skipped everything. Say so rather than inventing
    // numbers.
    log("no e2e-results.json — the suite did not run.");
    setStepOutput("totals", "");
    setStepOutput("failures", "");
    return;
  }

  const results = JSON.parse(raw) as {
    stats?: {
      expected?: number;
      unexpected?: number;
      flaky?: number;
      skipped?: number;
    };
    suites?: PlaywrightSuite[];
  };

  const stats = results.stats ?? {};
  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;

  const totals = [
    `e2e ${passed} passed`,
    failed ? `${failed} failed` : "",
    flaky ? `${flaky} flaky` : "",
    skipped ? `${skipped} skipped` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const failures = collectFailures(results.suites);
  const shown = failures.slice(0, MAX_NAMED_FAILURES).map(
    // Two lines each: what broke, then why. The indent is what makes a list of
    // four readable on a phone.
    (failure) => `  • ${failure.name}\n      ${failure.reason}`,
  );

  if (failures.length > shown.length) {
    shown.push(`  … and ${failures.length - shown.length} more`);
  }

  setStepOutput("totals", redact(totals));
  setStepOutput("failures", redact(shown.join("\n")));

  log(totals);
};

/** Hand the rest of the arguments to Playwright and adopt its exit code. */
const runPlaywright = (args: string[]): Promise<number> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [PLAYWRIGHT_CLI, "test", ...args],
      { cwd: process.cwd(), env: process.env, stdio: "inherit" },
    );

    child.on("error", reject);
    child.on("exit", (code) => resolvePromise(code ?? 1));
  });

const main = async (): Promise<number> => {
  const [command = "run", ...rest] = process.argv.slice(2);

  switch (command) {
    case "preflight":
      preflight();
      return 0;

    case "build":
      if (!preflight()) return 0;
      await buildApp();
      return 0;

    // Reads the last run's results. Never fails a job: a broken report must not
    // turn a green suite red.
    case "report":
      report();
      return 0;

    case "run":
      if (!preflight()) return 0;
      await buildApp();
      return await runPlaywright(rest);

    default:
      console.error(
        `Unknown command "${command}". Use preflight, build, run or report.`,
      );
      return 1;
  }
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    // Redacted, because this repository is public and every CI log is
    // world-readable. A guard message names a variable and a host, neither of
    // which is a secret — but the same path reports other failures too.
    console.error(redact(error));
    process.exitCode = 1;
  });
