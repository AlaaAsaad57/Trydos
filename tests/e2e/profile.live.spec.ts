// PROF-01 and PROF-02 — the shopper's own details, and what changing them
// actually writes.
//
// Signing in is already proved to fan out to every backend
// (`auth.live.spec.ts`). This file covers the other direction: a **write**.
// `AuthService.UpdateProfile` sends one "Save" to stories, then chat, then the
// core backend, and it can finish with two of the three written and the third
// refused. Nothing on screen says so — the shopper is told once, in one
// sentence, whatever failed — so each leg is judged separately here and named
// when it is missing.
//
// ---------------------------------------------------------------------------
// Three things to know before reading a failure from this file
//
// **The wallet is not one of the legs.** Its leg is commented out in
// `services/auth.ts` and `wallet_done` stays `false`, which also makes its
// rollback inert. Three legs is correct, not an omission. If that block is ever
// re-enabled, this file gains a fourth judgement in the same change.
//
// **What "the write landed" is proved by, exactly.** By the status the backend
// answered the **settled** write with — the same fact `utils/fetchData.ts`
// judges on. Not by a `success` field: that one is stamped on client-side from
// the status and never comes from a backend at all, so reading it would prove
// nothing while putting a body carrying the account's name, phone and e-mail
// within reach of a public job log.
//
// And a reload proves something **different**, not more of the same:
// `/api/auth/me` reads cookies only, and the settings pages are rendered from
// that same cookie, so a reload shows the app's stored copy was updated — it is
// not a second opinion from a backend. The two are asserted as the separate
// things they are, and neither message claims the other.
//
// **A save that never leaves the browser is usually the form, not a backend.**
// `PersonalInfoForm` refuses to save until the account has a gender, a name of
// at least eight characters and a valid phone. PROF-02 asks about that first,
// so a missing write is never blamed on a backend that was never called.
//
// ---------------------------------------------------------------------------
// One sign-in, handed on through a saved session
//
// The same arrangement as `auth.live.spec.ts`, for the same reason: a real
// one-time code per case would spend codes against limits that are not ours,
// and a module-level variable does not survive the worker restart Playwright
// does after a failing test. PROF-01 signs in and saves the session to disk;
// PROF-02 opens it.
//
// `tests/e2e/.auth/` is gitignored, is not the directory the pipeline uploads,
// and the file is removed once the last case that needs it has run.
//
// ---------------------------------------------------------------------------
// The account is shared, and this file writes to it
//
// PROF-02 changes the shopper's name on real staging and puts it back in a
// `finally`. If it dies in between, the account is left called PROBE_NAME —
// an obvious marker rather than silent drift, which is the point of using a
// marked value rather than something plausible.
//
// Nothing here prints the account's name, phone or e-mail. Comparisons happen
// inside `actions/profile.ts` or inside the browser and come back as booleans.

import { existsSync, rmSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { attemptAuth, currentAuthScreen, signedInSession } from "./actions/auth";
import { gotoAbout } from "./actions/nav";
import {
  attemptSave,
  cardShowsAccountName,
  gotoPersonalInfo,
  gotoSettings,
  hasGenderSet,
  nameFieldIs,
  phoneFieldMatchesAccount,
  readName,
  readProfileCard,
  typeName,
} from "./actions/profile";
import { envValue, hasShopperA } from "./harness/env";
import {
  PROFILE_LEGS,
  recordProfileWrites,
  type ProfileLeg,
  type ProfileWriteRecorder,
} from "./harness/profileWrites";
import { prompt } from "./selectors";

/** Where the signed-in session waits between the two cases. */
const SIGNED_IN_STATE = "tests/e2e/.auth/profile.json";

/** The name PROF-02 saves.
 *
 *  Marked on purpose, and at least eight characters because the form refuses
 *  anything shorter. A run that dies mid-way leaves this on the account, where
 *  it reads as "a test stopped here" rather than as somebody's real name. */
const PROBE_NAME = "Trydos E2E Probe";

/** How long a leg of the save may take before it counts as never sent.
 *
 *  Generous: three backends answer in sequence and a cold staging route can
 *  spend most of a minute before the first one does. */
const LEG_ANSWER_MS = 60_000;

const forgetSavedSession = () => rmSync(SIGNED_IN_STATE, { force: true });

/** A context carrying the options the project would have given a fixture page.
 *
 *  A context built by hand inherits none of them, so each one this suite relies
 *  on is passed explicitly. */
const newLiveContext = async (
  browser: Browser,
  extra: { storageState?: string } = {},
): Promise<BrowserContext> => {
  const { use, outputDir } = test.info().project;

  const context = await browser.newContext({
    baseURL: use.baseURL,
    locale: use.locale,
    recordVideo: use.video ? { dir: outputDir } : undefined,
    ...extra,
  });
  context.setDefaultTimeout(20_000);
  context.setDefaultNavigationTimeout(45_000);
  return context;
};

const openSignedInSession = async (
  browser: Browser,
): Promise<BrowserContext> => {
  if (!existsSync(SIGNED_IN_STATE)) {
    throw new Error(
      "there is no saved signed-in session, so PROF-01 never got far enough to sign in. " +
        "Read that case's failure — this one had nothing to run against.",
    );
  }
  return newLiveContext(browser, { storageState: SIGNED_IN_STATE });
};

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );
});

test("PROF-01 the settings screens show the signed-in shopper, not a guest", async ({
  browser,
}) => {
  // Anything left by an earlier run is not this run's session.
  forgetSavedSession();

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  // The static page, not the home page: the auth widget is in the layout, so it
  // is here too, and a search outage cannot blank the page and hide it.
  await gotoAbout(page);

  await attemptAuth(page, {
    intent: "login",
    phone: envValue("TEST_ACCOUNT_PHONE"),
    method: "whatsapp",
    otp: envValue("TEST_ACCOUNT_OTP"),
  });

  const screen = (await currentAuthScreen(page)) ?? "closed";
  expect(screen, `the sign-in ended on the "${screen}" screen`).toMatch(
    /^(welcome|closed)$/,
  );

  // Leave the widget shut: its phone field and the "sign in again" prompt share
  // one marker, so a widget left open would make later readings ambiguous.
  await page.keyboard.press("Escape").catch(() => {});
  await expect(prompt.phoneEntry(page)).toBeHidden();

  // Hand the session on **before** anything is judged, so everything below is
  // free to fail without taking PROF-02 with it.
  await mkdir(dirname(SIGNED_IN_STATE), { recursive: true });
  await context.storageState({ path: SIGNED_IN_STATE });

  const session = await signedInSession(page);
  expect(
    session.phoneVerified,
    "the app does not treat this visitor as a signed-in shopper, so the screens below are a guest's",
  ).toBe(true);

  await test.step("the settings card is the shopper's own", async () => {
    await gotoSettings(page);
    const card = await readProfileCard(page);

    // The card's link is rendered only for a visitor with a usable phone on
    // record, so finding it is the signal — there is nothing else to read.
    expect
      .soft(
        card.shown,
        "the settings page shows no profile card for a signed-in shopper, so it is treating them as a guest",
      )
      .toBe(true);

    // Not "a name is displayed": a card showing a guest placeholder, or the
    // previous account, also displays a name.
    expect
      .soft(
        await cardShowsAccountName(page),
        "the card does not show the name the app holds for this account",
      )
      .toBe(true);

    expect
      .soft(
        card.verified,
        "the card does not mark this account as verified, although it signed in with a real code",
      )
      .toBe(true);
    expect
      .soft(
        card.unverified,
        "the card invites this account to verify a number it has already verified",
      )
      .toBe(false);
  });

  await test.step("the personal-info form is filled from the account", async () => {
    await gotoPersonalInfo(page);

    // Content, not presence. A form that renders empty fields for a signed-in
    // shopper loses their details the moment they save.
    expect
      .soft(
        (await readName(page)).length > 0,
        "the name field is empty for a signed-in shopper, so saving would clear their name",
      )
      .toBe(true);
    expect
      .soft(
        await phoneFieldMatchesAccount(page),
        "the phone field does not hold the number the app has for this account",
      )
      .toBe(true);
  });

  await context.close();
});

test("PROF-02 a name change reaches every backend that keeps a copy", async ({
  browser,
}) => {
  // Two saves, each fanning out to three staging backends in sequence, plus a
  // reload between them. The project default is not enough for that.
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser);
  const page = await context.newPage();

  // Needed before any locale-scoped path can be built: which country this run
  // landed on is the backend's answer, not ours.
  await gotoAbout(page);
  await gotoPersonalInfo(page);

  await test.step("the form will accept a save at all", async () => {
    // Asked first and on purpose. The form refuses every save until a gender is
    // set, and a refused save never calls a backend — so without this, a
    // missing write below would be blamed on a backend that was never asked.
    expect(
      await hasGenderSet(page),
      "this account has no gender set, so the form refuses every save and no backend is ever called. " +
        "Set one once on the test account, or treat a mandatory gender as a finding in its own right.",
    ).toBe(true);
  });

  const originalName = await readName(page);
  expect(
    originalName.length > 0,
    "the form opened with an empty name, so there is nothing to change and nothing to put back",
  ).toBe(true);

  let changed = false;

  try {
    const writes = recordProfileWrites(page, { marker: PROBE_NAME });

    await test.step("the shopper changes their name and saves", async () => {
      await typeName(page, { name: PROBE_NAME });

      const outcome = await attemptSave(page);
      changed = true;

      expect(
        outcome.saved,
        outcome.refusedWith
          ? `the form refused the save: "${outcome.refusedWith}" — no backend was called`
          : "the save never completed: the form neither reported a problem nor moved on",
      ).toBe(true);
    });

    // One judgement per backend, each naming the backend it is about, all three
    // reported in one run. Soft so a single dead backend does not hide the
    // other two — the case still fails.
    for (const leg of PROFILE_LEGS) {
      await test.step(`the ${leg} backend took the change`, async () => {
        await proveLegLanded(writes, leg);
      });
    }

    await test.step("the change is still there after a reload", async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await gotoPersonalInfo(page);

      // The app's stored copy, not a second opinion from a backend: this page
      // is rendered from the same profile cookie the save wrote. It is here to
      // catch a save that appeared to work and left nothing behind.
      expect(
        await nameFieldIs(page, { name: PROBE_NAME }),
        "the saved name is gone after a reload, so the app kept nothing of the change it reported as done",
      ).toBe(true);
    });
  } finally {
    if (changed) {
      // Soft: when the case has already failed, this must report the drift it
      // could not undo without replacing the failure that caused it.
      const restored = await restoreName(page, originalName);
      expect
        .soft(
          restored,
          `the shared test account is still called "${PROBE_NAME}" — putting the original name back failed, ` +
            "so the next run starts from the wrong value",
        )
        .toBe(true);
    }
    await context.close();
    // The last case that needs it has finished. A real credential does not sit
    // on disk afterwards.
    forgetSavedSession();
  }
});

/** Judge one leg of the fan-out, and say what that backend answered.
 *
 *  Four separate outcomes, because whoever reads the failure needs a different
 *  answer to each: never asked, asked and refused, asked and then put back, or
 *  fine. Soft, so one dead backend does not hide the other two — the case still
 *  fails. */
const proveLegLanded = async (
  writes: ProfileWriteRecorder,
  leg: ProfileLeg,
): Promise<void> => {
  const asked = await writes.waitForWrite(leg, LEG_ANSWER_MS);

  // Fail closed: a leg never seen is a failure to report, never "nothing went
  // wrong".
  expect
    .soft(
      asked,
      `the ${leg} backend was never asked to store the new name, so its copy still has the old one`,
    )
    .toBe(true);
  if (!asked) return;

  const outcome = writes.outcome(leg);

  // The settled answer. An earlier `401` here is the app exchanging a refused
  // credential and sending the same write again, which is the recovery working
  // — so it is reported as context, not as the verdict.
  const retried =
    outcome.attempts > 1
      ? ` (it took ${outcome.attempts} attempts, so the credential was refused and exchanged mid-save)`
      : "";

  expect
    .soft(
      outcome.accepted,
      `the ${leg} backend refused the profile update (status ${outcome.status})${retried}`,
    )
    .toBe(true);

  // A write carrying the OLD value only ever comes from the rollback in
  // `UpdateProfile`'s catch. This leg was written and then put back, which
  // means a later leg failed — a partial success, and a failure whatever this
  // leg's own answer said.
  expect
    .soft(
      outcome.rolledBack,
      `the ${leg} backend was written and then rolled back to the old name, so a later leg failed and this change did not stick`,
    )
    .toBe(false);
};

/** Put the account's name back. Reports whether it worked; never throws. */
const restoreName = async (
  page: Page,
  originalName: string,
): Promise<boolean> => {
  try {
    await gotoPersonalInfo(page);
    if (await nameFieldIs(page, { name: originalName })) return true;

    await typeName(page, { name: originalName });
    const outcome = await attemptSave(page);
    return outcome.saved;
  } catch {
    // Swallowed on purpose: this runs in a `finally`, so a throw here would
    // replace whatever the case was actually failing on. The caller reports the
    // `false` instead.
    return false;
  }
};
