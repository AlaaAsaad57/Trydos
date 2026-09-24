// Runs once, after every spec, including after a failing run.
//
// Stopping the server means stopping the whole process tree: `next start` runs
// the server in a child of its own, so killing only the process we spawned
// leaves port 3100 held and the next run fails on the occupied-port check.
// `harness/server.ts` owns that detail.

import { rmSync } from "node:fs";

import { stopServer } from "./harness/handle";
import { SESSION_STATE_DIR } from "./harness/liveSession";

export default async function globalTeardown(): Promise<void> {
  // Every saved session, in one go.
  //
  // These files are cookie jars in plain text, `MARKET-TOKEN` included. They
  // used to be removed by whichever case was declared last, which quietly broke
  // the moment a case was added after it — and left a live credential on the
  // runner whenever a run died early. Removing the directory here happens after
  // every spec, including a failing run, and does not depend on any case
  // remembering to do it.
  rmSync(SESSION_STATE_DIR, { recursive: true, force: true });

  // Ticket 2 (`e2e-money-path`) adds the orphan net here: any order id that was
  // registered during the run and never cancelled through the UI gets cancelled
  // directly, so a spec that died mid-checkout does not leave a live order on
  // staging. Nothing writes yet, so there is nothing to clean up.

  await stopServer();
}
