// Runs once, after every spec, including after a failing run.
//
// Stopping the server means stopping the whole process tree: `next start` runs
// the server in a child of its own, so killing only the process we spawned
// leaves port 3100 held and the next run fails on the occupied-port check.
// `harness/server.ts` owns that detail.

import { stopServer } from "./harness/handle";

export default async function globalTeardown(): Promise<void> {
  // Ticket 2 (`e2e-money-path`) adds the orphan net here: any order id that was
  // registered during the run and never cancelled through the UI gets cancelled
  // directly, so a spec that died mid-checkout does not leave a live order on
  // staging. Nothing writes yet, so there is nothing to clean up.

  await stopServer();
}
