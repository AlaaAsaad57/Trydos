// The live suite's global setup: guard, build, start, and tear down.
//
// Order matters more than anything else in this file. The target guard runs
// **first**, before the build and before the server exists, so an unrecognised
// backend address stops the run while there is still nothing that could reach it.
//
// It also decides whether to build at all. With no staging addresses configured
// there is nothing to test, every test file skips itself, and paying for a
// production build to run zero tests would be absurd — so the setup returns
// immediately and `pnpm test:live` finishes clean and skipped. That is the
// "unset means skip, never fail" rule, applied to the most expensive step.

import {
  hasAdmin,
  hasBackends,
  hasFleet,
  hasShopperA,
  hasShopperB,
  loadLiveEnv,
} from "./env";
import { assertStagingTarget } from "./guard";
import { redact } from "./redact";
import { startLiveServer } from "./server";

const log = (message: string): void => {
  console.log(redact(`[live] ${message}`));
};

export default async function setup(): Promise<() => Promise<void>> {
  loadLiveEnv();

  if (!hasBackends()) {
    log(
      "BACKEND_URL / GO_BACKEND_URL are not configured — skipping the whole live suite.",
    );
    log("Nothing was built and no server was started.");
    return async () => {};
  }

  // Throws on any address that is set and not a known staging host.
  const target = assertStagingTarget();

  log(`target check passed for ${target.allowed.length} staging address(es).`);
  if (target.missing.length > 0) {
    log(`not configured, so out of scope this run: ${target.missing.join(", ")}`);
  }

  // Names only. Which identities exist is useful; their values are never printed.
  const identities = [
    hasShopperA() && "shopper A (also the seller)",
    hasShopperB() && "shopper B",
    hasFleet() && "fleet",
    hasAdmin() && "admin",
  ].filter(Boolean) as string[];

  log(
    identities.length > 0
      ? `identities configured: ${identities.join(", ")}`
      : "no identities configured — only guest-level tests will run.",
  );

  return await startLiveServer();
}
