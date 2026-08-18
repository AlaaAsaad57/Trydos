// Runs once, before any spec.
//
// Order matters more than anything else here. The target guard runs **first**,
// before a server exists, so an unrecognised backend address stops the run while
// there is still nothing that could reach it. The build has already happened by
// now — `tests/e2e/cli.ts` did it, after its own preflight — so this file only
// starts what was built.
//
// Running the guard again is on purpose. It costs nothing, and it means the rule
// still holds for someone who runs `playwright test` directly instead of through
// `pnpm test:e2e`.

import { hasBackends, loadLiveEnv } from "./harness/env";
import { assertStagingTarget } from "./harness/guard";
import { setStopServer } from "./harness/handle";
import { redact } from "./harness/redact";
import { startServer } from "./harness/server";

const log = (message: string): void => {
  console.log(redact(`[e2e] ${message}`));
};

export default async function globalSetup(): Promise<void> {
  loadLiveEnv();

  if (!hasBackends()) {
    // Not a failure. Every spec skips itself on the same condition, so the run
    // is green and fast, and nothing was built either.
    log("no staging addresses configured — starting no server; specs will skip.");
    return;
  }

  assertStagingTarget();

  setStopServer(await startServer());

  // Ticket 2 (`e2e-money-path`) logs shopper A in here, once, and saves
  // `storageState` for the authenticated specs to load. That is what keeps the
  // suite to one login per run, which matters because the OTP send is rate
  // limited for real. Until then every spec runs as a guest.
}
