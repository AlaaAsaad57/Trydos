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
import { appendFileSync } from "node:fs";
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
  appendFileSync(file, `${key}=${value}\n`);
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

    case "run":
      if (!preflight()) return 0;
      await buildApp();
      return await runPlaywright(rest);

    default:
      console.error(
        `Unknown command "${command}". Use preflight, build or run.`,
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
