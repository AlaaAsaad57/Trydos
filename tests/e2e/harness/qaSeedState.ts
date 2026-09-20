// What the QA seed leaves behind, and where.
//
// **This file exists because Playwright refuses to let one test file import
// another.** `qaSeed.ts` is a test file — it is the whole of the `setup`
// project — so `qaLock.live.spec.ts` cannot import these two paths and this type
// from it. Putting them here gives both sides one definition instead of two
// copies that quietly drift apart.
//
// Nothing here runs anything. Two path constants, one type, and one reader.

import { existsSync, readFileSync } from "node:fs";

/** Where the seed records what it found or built. */
export const QA_SEED_STATE_PATH = "tests/e2e/.auth/qa-seed.json";

/** Where the seed records every call it made. Method and URL only — never a
 *  header and never a body. */
export const CALL_RECORD_PATH = "tests/e2e/.auth/qa-seed-calls.json";

/** One write the seed made.
 *
 *  Declared once, in `sellerDashboard.ts`, and re-exported here so a spec can
 *  read the record without importing the module that makes the calls. */
export type { CallRecord } from "./sellerDashboard";

export type QaSeedState = {
  ranAt: string;
  /** `built` on a brand-new environment, `found` on every later run. */
  outcome: "built" | "found";
  sellerId: string;
  shopSlug: string;
  boutiqueId: string | number;
  locationId: string | number;
  productId: string | number;
  productSlug: string;
  /** True when this run drove the admin approve screens. The case that checks
   *  the seed stayed inside its own data only asks for the row-identity proof
   *  when it did — demanding it every time would go permanently red after the
   *  first run on an environment, when there is nothing left to approve. */
  approvedByThisRun: boolean;
};

/** Read what the seed left, or say plainly that it never finished.
 *
 *  Naming the seed is the difference between "this run had nothing to work
 *  with" and a reader looking for a fault in a case that is merely downstream. */
export const readQaSeedState = (): QaSeedState => {
  if (!existsSync(QA_SEED_STATE_PATH)) {
    throw new Error(
      "the QA seed left no record, so it never finished. Read the setup project's failure — this case had nothing to run against.",
    );
  }
  return JSON.parse(readFileSync(QA_SEED_STATE_PATH, "utf8")) as QaSeedState;
};
