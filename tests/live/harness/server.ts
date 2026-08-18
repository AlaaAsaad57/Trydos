// Building and running the app under test.
//
// The suite drives a **real production server**: `next build`, then `next start`
// on a fixed loopback port. Nothing about the request path is simulated except
// the browser — the proxy runs, the route handlers run, the token injection runs,
// and the request leaves for the real staging backend.
//
// Two things are deliberate and neither is a convenience:
//
//   * **The staging addresses are passed explicitly in the child's environment.**
//     `next start` runs in production mode, where Next loads `.env.production`
//     and never `.env.development` — and on a deployment `.env.production` holds
//     the real addresses. Values already in the environment win over a file, so
//     passing them is what makes the target certain rather than likely.
//   * **Every run builds.** There is no reuse-an-existing-server option, so the
//     suite can only ever talk to a server this file started and configured.
//     Which is also why an already-occupied port is a hard error below: something
//     is listening that we did not build, and we do not know what it is.

import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

import { LIVE_HOST, LIVE_ORIGIN, LIVE_PORT, loadLiveEnv } from "./env";
import { redact } from "./redact";

// Next's own entry point, run through the current Node rather than through a
// package-manager shim. `pnpm exec next` would need a shell on Windows and a
// package manager that matches the lockfile; this needs neither.
const NEXT_BIN = resolve(process.cwd(), "node_modules/next/dist/bin/next");

const BUILD_TIMEOUT_MS = 15 * 60 * 1000;
const START_TIMEOUT_MS = 3 * 60 * 1000;
const READY_POLL_INTERVAL_MS = 500;

const log = (message: string): void => {
  console.log(redact(`[live] ${message}`));
};

/** The environment the built server runs with.
 *
 *  Whatever this process holds — which includes everything `loadLiveEnv()` read
 *  out of `.env.development` — plus the two values that must not be inherited
 *  from the test runner. */
const childEnv = (): NodeJS.ProcessEnv => {
  loadLiveEnv();

  return {
    ...process.env,
    // vitest sets this to "test". A build that inherits it is not a production
    // build, and `next start` refuses to serve one.
    NODE_ENV: "production",
    PORT: String(LIVE_PORT),
  };
};

/** Is anything answering on the port already? */
const portIsBusy = async (): Promise<boolean> => {
  try {
    await fetch(LIVE_ORIGIN, {
      redirect: "manual",
      signal: AbortSignal.timeout(2000),
    });
    return true;
  } catch {
    return false;
  }
};

/** Run one Next command to completion, or throw. */
const runNext = (args: string[], timeoutMs: number): Promise<void> =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], {
      cwd: process.cwd(),
      env: childEnv(),
      // Inherited: a build takes minutes and a silent one looks like a hang.
      stdio: "inherit",
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new Error(`next ${args.join(" ")} did not finish in ${timeoutMs}ms`),
      );
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(`next ${args.join(" ")} exited with code ${code}`));
    });
  });

/** Wait until the server answers anything at all.
 *
 *  Any HTTP response counts, including a redirect or a 500. The question here is
 *  "is it listening", not "is it healthy" — a failing page is a test's finding,
 *  not a reason to abandon the run. */
const waitUntilAnswering = async (child: ChildProcess): Promise<void> => {
  const deadline = Date.now() + START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `The server exited with code ${child.exitCode} before it answered.`,
      );
    }

    try {
      await fetch(LIVE_ORIGIN, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, READY_POLL_INTERVAL_MS));
    }
  }

  throw new Error(`The server did not answer within ${START_TIMEOUT_MS}ms.`);
};

/** Stop a child and everything it spawned.
 *
 *  `next start` runs the server in a child of its own, so killing only the
 *  process we spawned leaves the port held and the next run fails on the
 *  occupied-port check. On Windows the whole tree has to go through taskkill;
 *  elsewhere a process group signal does it. */
const stopTree = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null || child.pid === undefined) return;

  const exited = new Promise<void>((resolvePromise) => {
    child.once("exit", () => resolvePromise());
  });

  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    child.kill("SIGTERM");
  }

  const gaveUp = new Promise<"timeout">((resolvePromise) =>
    setTimeout(() => resolvePromise("timeout"), 10_000),
  );

  const outcome = await Promise.race([exited, gaveUp]);
  if (outcome === "timeout") child.kill("SIGKILL");
};

/** Build the app, start it, and return the function that stops it. */
export const startLiveServer = async (): Promise<() => Promise<void>> => {
  if (await portIsBusy()) {
    throw new Error(
      [
        `Something is already listening on ${LIVE_ORIGIN}.`,
        "The live suite only ever runs against a server it built and started",
        "itself, so it will not adopt this one. Stop it and run again.",
      ].join("\n"),
    );
  }

  log("building the app (this is the slow part) …");
  await runNext(["build"], BUILD_TIMEOUT_MS);

  log(`starting the server on ${LIVE_ORIGIN} …`);
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", "-H", LIVE_HOST, "-p", String(LIVE_PORT)],
    { cwd: process.cwd(), env: childEnv(), stdio: "inherit" },
  );

  try {
    await waitUntilAnswering(child);
  } catch (error) {
    await stopTree(child);
    throw error;
  }

  log("the server is answering.");

  return async () => {
    log("stopping the server …");
    await stopTree(child);
  };
};
