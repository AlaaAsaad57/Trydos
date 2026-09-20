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

/** The seed's own signed-in session, handed on to the specs downstream of it.
 *
 *  **This is here to stop a second sign-in.** The seed already signs in as
 *  Shopper B — the QA seller — before it writes anything. A dashboard spec that
 *  signed in again would send a second one-time code for the same account, and
 *  those sends are counted against limits that are not ours (`OTP_SESSION_MAX`,
 *  `OTP_COOLDOWN_SECONDS`). So the seed saves its cookie jar and the specs open
 *  it instead.
 *
 *  Declared **here** rather than in `SESSION_STATE` (`harness/liveSession.ts`)
 *  on purpose: that module imports `fixtures.ts`, and `qaSeed.ts` is a setup
 *  project that must not pull the spec fixtures — including their `beforeEach`
 *  — into its own file scope. This file imports nothing from Playwright, so
 *  both sides can share the literal safely.
 *
 *  It lives under `tests/e2e/.auth/`, so `globalTeardown` removes it with every
 *  other cookie jar at the end of the run. It is plain text and carries
 *  `MARKET-TOKEN`; it must never be read, printed or attached to a report. */
export const QA_SELLER_SESSION_PATH = "tests/e2e/.auth/qa-seller.json";

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

/** Is the QA seller's saved session on disk?
 *
 *  A dashboard case asks this before it starts. `false` means the seed skipped
 *  or died before it signed in — read the setup project's own line, which names
 *  the setting that is missing. */
export const qaSellerSessionSaved = (): boolean =>
  existsSync(QA_SELLER_SESSION_PATH);

/** Did the seed leave a record on this environment?
 *
 *  A case that needs the QA product asks this **before** it starts, and skips
 *  when the answer is no. That is the whole contract between the setup project
 *  and the cases downstream of it: the seed skips when a setting is missing, so
 *  a case that buys must skip too. It must never fall back to a real seller's
 *  product — that is the one thing this feature exists to stop. */
export const qaSeedRan = (): boolean => existsSync(QA_SEED_STATE_PATH);

/** Why such a case cannot run. One sentence, shared, so every caller sends the
 *  reader to the same place: the setup project's own skip line, which names the
 *  setting that is missing. */
export const NO_QA_SEED_REASON =
  "the QA seed did not run, so this environment has no QA product to buy. " +
  "Read the setup project's skip line — it names the setting that is missing. " +
  "These cases never fall back to a real seller's product.";

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
