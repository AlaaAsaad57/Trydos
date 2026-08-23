// The one entry point for the e2e suite.
//
//   tsx tests/e2e/cli.ts preflight   is this configured, is it staging, is it up?
//   tsx tests/e2e/cli.ts health      is staging up? — on its own, for after a run
//   tsx tests/e2e/cli.ts build       build the app with the staging environment
//   tsx tests/e2e/cli.ts run [--skip-build]
//                                    all three, in order, for local use.
//                                    --skip-build reuses an existing .next output.
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
import { probeStaging } from "./harness/health";
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
/** Is staging serving? Reports it, records it for CI, and answers.
 *
 *  Used twice in a run and for different reasons. Before the build, so a known
 *  outage does not cost minutes of build time. After a failure, so a red suite
 *  can be told apart from a staging outage that happened to start after
 *  preflight passed — which is exactly what happened on 2026-08-18, where
 *  preflight was clean and Elasticsearch went down ninety seconds later.
 *
 *  `staging` is a separate step output from `configured` on purpose. "Nobody set
 *  this up" and "it is set up and it is down" are different situations and only
 *  one of them is worth telling anyone about. */
const checkStaging = async (): Promise<boolean> => {
  const health = await probeStaging();

  if (health.skipped) {
    log("no search backend configured, so nothing to health-check.");
    setStepOutput("staging", "up");
    return true;
  }

  if (!health.up) {
    log(`staging is not serving: ${health.reason}`);
    log("This is a backend outage, not a code failure. The suite will skip.");
    setStepOutput("staging", "down");
    return false;
  }

  log("staging health check passed.");
  setStepOutput("staging", "up");
  return true;
};

const preflight = async (): Promise<boolean> => {
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

  // Last, and only once the target is known to be staging. Probing an address
  // before proving it is one would mean reaching out to a host the guard has not
  // cleared yet.
  return await checkStaging();
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
//
// **The reason a test failed goes in the attached tree and nowhere else.** The
// message names the tests that broke and stops there. A Playwright error is
// several lines each — the assertion, what it expected, what it got — which is
// what pushes a message past Telegram's 4096-character limit, and it reads far
// better under the test it belongs to than in a list on its own.
// ---------------------------------------------------------------------------

const RESULTS_FILE = resolve(process.cwd(), "e2e-results.json");

/** How many failures to name. The message has a hard 4096-character limit, and
 *  a wall of names helps nobody — the run link is there for the rest. */
const MAX_NAMED_FAILURES = 4;

const PASS = "✅";
const FAIL = "❌";
const SKIP = "⏭️";
const FLAKY = "⚠️";

type PlaywrightSpec = {
  title: string;
  ok?: boolean;
  tests?: {
    status?: string;
    results?: { status?: string; error?: { message?: string } }[];
  }[];
};

type PlaywrightSuite = {
  title?: string;
  file?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
};

/** Walk the nested suites and collect the full title of every spec that did not
 *  pass. Names only — the reason belongs to the tree. */
const collectFailureNames = (
  suites: PlaywrightSuite[] = [],
  trail: string[] = [],
): string[] =>
  suites.flatMap((suite) => {
    const here = suite.title ? [...trail, suite.title] : trail;

    const failedHere = (suite.specs ?? [])
      .filter((spec) => spec.ok === false)
      .map((spec) => [...here, spec.title].join(" › "));

    return [...failedHere, ...collectFailureNames(suite.suites, here)];
  });

/** The first error a spec recorded, across its retries. */
const specError = (spec: PlaywrightSpec): string =>
  (spec.tests ?? [])
    .flatMap((test) => test.results ?? [])
    .find((result) => result.error?.message)?.error?.message ??
  "no error message recorded";

/** The part of an error worth writing beside a crossed-out test.
 *
 *  Playwright errors run to dozens of lines of call log, and the opening line
 *  alone is often not enough: a timeout says everything in itself, but an
 *  assertion opens with `expect(received).toBe(expected)` and keeps the actual
 *  answer two lines further down. So take the opening line plus whichever of
 *  the Expected / Received / Timeout lines follow it.
 *
 *  Colour codes are stripped because they would otherwise arrive as literal
 *  escape characters in the attached file. */
const DETAIL_LINE = /^(Expected|Received|Timeout|Locator)\b/;

/** Returns lines rather than one string: the caller indents each of them to sit
 *  under the test it belongs to. */
const summariseError = (message: string): string[] => {
  const lines = message
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const opening = lines[0] ?? "no error message recorded";
  // Four, not two. A failed `toBeVisible` prints Locator, Expected and
  // Received, and two of the three is the pair that answers nothing. The file
  // has the room the message did not.
  const details = lines
    .slice(1)
    .filter((line) => DETAIL_LINE.test(line))
    .slice(0, 4);

  // Wider than the message ever allowed, because the file has room for it: an
  // `Expected` line carrying a URL is useless cut off at 120.
  const clip = (line: string): string =>
    line.length > 160 ? `${line.slice(0, 160)}\u2026` : line;

  return [opening, ...details].map(clip);
};

// ---------------------------------------------------------------------------
// The rollup and the tree.
//
// The same two shapes the unit reporter produces (scripts/unit-report.mjs), so
// one Telegram message reads the same whichever suite sent it: a per-file line
// in the message, and the full describe/test list as an attached file.
//
// The suites in the JSON nest the way the code does — a top-level suite is a
// spec file, every suite inside it is a `describe`, and a "spec" is one `test`.
// ---------------------------------------------------------------------------

/** Every test in a suite and everything below it. */
const allSpecs = (suite: PlaywrightSuite): PlaywrightSpec[] => [
  ...(suite.specs ?? []),
  ...(suite.suites ?? []).flatMap(allSpecs),
];

/** One mark per test, from the run's own verdict.
 *
 *  Flaky gets its own mark rather than a tick. It passed, so it must not fail
 *  the run — but a test that only passed on the retry is exactly the thing worth
 *  seeing before it becomes a nightly that fails once a week. */
const specIcon = (spec: PlaywrightSpec): string => {
  const statuses = (spec.tests ?? []).map((test) => test.status);

  if (statuses.length > 0 && statuses.every((s) => s === "skipped")) return SKIP;
  if (spec.ok === false) return FAIL;
  if (statuses.includes("flaky")) return FLAKY;
  return PASS;
};

/** One line per spec file, ticked or crossed, with its count. */
const buildRollup = (files: PlaywrightSuite[]): string =>
  files
    .map((file) => {
      const specs = allSpecs(file);
      const failed = specs.filter((spec) => spec.ok === false).length;
      // The path as the reporter gives it. Shortening it would save a few
      // characters and cost the one thing the line is for — knowing which file.
      const name = file.file ?? file.title ?? "(unknown file)";

      return `${failed ? FAIL : PASS} ${name} · ${specs.length}${
        failed ? ` (${failed} failed)` : ""
      }`;
    })
    .join("\n");

/** One test, and — when it broke — why, on the lines under it.
 *
 *  This is the only place a reason is written. Keeping it here rather than in
 *  the message is the whole point: the file has room, and a reason read next to
 *  its own test needs no explaining. */
const specLines = (spec: PlaywrightSpec, pad: string): string[] => {
  const head = `${pad}${specIcon(spec)} ${spec.title}`;
  if (spec.ok !== false) return [head];

  return [
    head,
    ...summariseError(specError(spec)).map(
      (line, index) => `${pad}   ${index === 0 ? "↳ " : "  "}${line}`,
    ),
  ];
};

/** The describes and the tests below a suite, indented by nesting depth. */
const treeLines = (suites: PlaywrightSuite[], depth: number): string[] =>
  suites.flatMap((suite) => {
    const pad = "  ".repeat(depth);
    const inner = suite.title ? depth + 1 : depth;

    return [
      ...(suite.title ? [`${pad}${suite.title}`] : []),
      ...(suite.specs ?? []).flatMap((spec) =>
        specLines(spec, "  ".repeat(inner)),
      ),
      ...treeLines(suite.suites ?? [], inner),
    ];
  });

/** Every describe and every test, for the attached file. */
const buildTree = (files: PlaywrightSuite[], totals: string): string => {
  const head = [
    "Trydos — browser journeys (e2e)",
    [process.env.GITHUB_REF_NAME, (process.env.GITHUB_SHA ?? "").slice(0, 7)]
      .filter(Boolean)
      .join(" · "),
    totals,
    `${files.length} file(s), ${files.reduce((n, f) => n + allSpecs(f).length, 0)} test(s)`,
    "",
    `${PASS} passed    ${FAIL} failed    ${FLAKY} flaky    ${SKIP} skipped`,
  ];

  const body = files.flatMap((file) => {
    const specs = allSpecs(file);
    const failed = specs.filter((spec) => spec.ok === false).length;
    const name = file.file ?? file.title ?? "(unknown file)";

    return [
      "",
      "─".repeat(60),
      `${failed ? FAIL : PASS} ${name} — ${specs.length} test(s)${
        failed ? ` — ${failed} failed` : ""
      }`,
      "─".repeat(60),
      ...(file.specs ?? []).flatMap((spec) => specLines(spec, "")),
      ...treeLines(file.suites ?? [], 0),
    ];
  });

  return [...head, ...body, ""].join("\n");
};

/** Read the run's results and write the values the notifier wants. */
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
    setStepOutput("rollup", "");
    setStepOutput("tree", "");
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

  const failures = collectFailureNames(results.suites);
  // The names, and nothing else. Why each one broke is in the attached tree —
  // see the note at the top of this section.
  const shown = failures
    .slice(0, MAX_NAMED_FAILURES)
    .map((name) => `  • ${name}`);

  if (failures.length > shown.length) {
    shown.push(`  … and ${failures.length - shown.length} more`);
  }

  const files = results.suites ?? [];

  setStepOutput("totals", redact(totals));
  setStepOutput("failures", redact(shown.join("\n")));
  // Redacted like everything else here. A test title is written by us and holds
  // no secret, but this is the one place the rule must not have an exception —
  // the day a title interpolates a phone number, redact() is what catches it.
  setStepOutput("rollup", redact(buildRollup(files)));
  setStepOutput("tree", redact(buildTree(files, totals)));

  log(totals);
};

/** Pull out flags the CLI owns before Playwright sees them. */
const parseRunFlags = (args: string[]): { skipBuild: boolean; playwrightArgs: string[] } => {
  const skipBuild = args.includes("--skip-build");
  return {
    skipBuild,
    playwrightArgs: args.filter((arg) => arg !== "--skip-build"),
  };
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
      await preflight();
      return 0;

    // The same probe on its own, for the step that runs after a failed suite.
    // Never fails the job — its answer is a step output, and deciding what that
    // answer means is the workflow's business, not this command's.
    case "health":
      await checkStaging();
      return 0;

    case "build":
      if (!(await preflight())) return 0;
      await buildApp();
      return 0;

    // Reads the last run's results. Never fails a job: a broken report must not
    // turn a green suite red.
    case "report":
      report();
      return 0;

    case "run": {
      const { skipBuild, playwrightArgs } = parseRunFlags(rest);
      if (!(await preflight())) return 0;
      if (!skipBuild) await buildApp();
      return await runPlaywright(playwrightArgs);
    }

    default:
      console.error(
        `Unknown command "${command}". Use preflight, health, build, run or report.`,
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
