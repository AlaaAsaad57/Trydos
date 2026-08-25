// The signed-in session, shared by every spec that needs one.
//
// ---------------------------------------------------------------------------
// Why this file exists, and why it is not `harness/session.ts`
//
// These four helpers lived twice — once in `profile.live.spec.ts` and once in
// `auth.live.spec.ts` — and the two copies had already drifted. They are here so
// there is one definition.
//
// They are deliberately **not** in `harness/session.ts`, whose header states one
// rule: no credential value leaves that module, in any form. `handOnSession`
// writes the whole cookie jar to disk, `MARKET-TOKEN` included, so putting it
// there would break the invariant the next reader relies on.
//
// ---------------------------------------------------------------------------
// This one harness file depends on `actions/` and `fixtures`, on purpose
//
// `newLiveContext` needs the project's own `use` block, which comes from
// `test.info()`, and `handOnSession` needs `signedInSession` to decide whether
// the jar is still worth keeping. Every other file under `harness/` depends only
// on `@playwright/test`. This one is the exception; it is not an accident and it
// is not a layering mistake to be "fixed" — there is no cycle, because
// `actions/auth.ts` does not import `fixtures.ts`.
//
// ---------------------------------------------------------------------------
// Every helper takes the state path, and the case that owns it
//
// Three specs keep three different session files, and `PROF-04` deletes the one
// it names. A single exported constant would let one spec delete another's
// session mid-run. The owning case's id is a parameter for the same reason: the
// failure message has to blame the case that actually failed to sign in, and the
// two original copies differed in precisely that word.

import { existsSync, rmSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { test } from "../fixtures";
import { signedInSession } from "../actions/auth";

/** Where each spec's signed-in session waits between its cases.
 *
 *  Exported from here so no spec holds its own literal, and so `globalTeardown`
 *  can clear the directory without naming a file. */
export const SESSION_STATE = {
  auth: "tests/e2e/.auth/signed-in.json",
  profile: "tests/e2e/.auth/profile.json",
  profileScripted: "tests/e2e/.auth/profile-scripted.json",
} as const;

/** The directory all of them live in. Removed wholesale at teardown. */
export const SESSION_STATE_DIR = "tests/e2e/.auth";

/** Remove one saved session. */
export const forgetSavedSession = (statePath: string): void =>
  rmSync(statePath, { force: true });

/** A context carrying the options the project would have given a fixture page.
 *
 *  A context built by hand inherits none of them, so each one this suite relies
 *  on is passed explicitly.
 *
 *  **`recordVideo`.** The default is the project's own setting, and only `"on"`
 *  means "record every case" — an earlier version tested the value for
 *  truthiness, which made `"retain-on-failure"` record everything, since
 *  Playwright cannot retroactively delete a video it was never asked to keep.
 *  A caller may still ask for one explicitly: a spec that turns its trace off
 *  has no other artifact to debug from, and a failure with nothing to look at
 *  costs a whole re-run. */
export const newLiveContext = async (
  browser: Browser,
  extra: { storageState?: string; recordVideo?: boolean } = {},
): Promise<BrowserContext> => {
  const { use, outputDir } = test.info().project;
  const { recordVideo, ...contextOptions } = extra;
  const wantsVideo = recordVideo ?? use.video === "on";

  const context = await browser.newContext({
    baseURL: use.baseURL,
    locale: use.locale,
    recordVideo: wantsVideo ? { dir: outputDir } : undefined,
    ...contextOptions,
  });
  context.setDefaultTimeout(20_000);
  context.setDefaultNavigationTimeout(45_000);
  return context;
};

/** Write the session as it is **now**, so the next case inherits it.
 *
 *  Not tidiness — the fix for a real failure. A saved session is a snapshot: the
 *  moment a case does authenticated work, the app can exchange a refused
 *  credential for a fresh one and the pair on the backend moves on. The file
 *  still holds the old pair, so the next case opens a session whose credential
 *  has been superseded, the app recovers it the only way it can — as a guest —
 *  and the account's own details are simply not there any more.
 *
 *  That is exactly what happened: `PROF-03` reported "this account has no gender
 *  set" when run after `PROF-02`, and passed that same check when run without
 *  it. Nothing was wrong with the app or the account.
 *
 *  Only written when the session is still **this account**. A case that failed
 *  its way down to a guest must not hand that on as if it were a session. */
export const handOnSession = async (
  context: BrowserContext,
  page: Page,
  statePath: string,
): Promise<void> => {
  try {
    const session = await signedInSession(page);
    if (!session.phoneVerified) return;
    await saveSession(context, statePath);
  } catch {
    // Never let bookkeeping replace the failure a case is reporting.
  }
};

/** Write the cookie jar to `statePath`, creating the directory if needed. */
export const saveSession = async (
  context: BrowserContext,
  statePath: string,
): Promise<void> => {
  await mkdir(dirname(statePath), { recursive: true });
  await context.storageState({ path: statePath });
};

/** Open the session the signing-in case saved, or say plainly why there is none.
 *
 *  `owningCase` is the case that was supposed to create it. Naming it is the
 *  difference between "this run had nothing to work with" and a reader going to
 *  look for a fault in the case that is merely downstream. */
export const openSignedInSession = async (
  browser: Browser,
  statePath: string,
  owningCase: string,
  extra: { recordVideo?: boolean } = {},
): Promise<BrowserContext> => {
  if (!existsSync(statePath)) {
    throw new Error(
      `there is no saved signed-in session, so ${owningCase} never got far enough to sign in. ` +
        "Read that case's failure — this one had nothing to run against.",
    );
  }
  return newLiveContext(browser, { storageState: statePath, ...extra });
};
