// PROF-01 to PROF-04 — the shopper's own details, and what changing them
// actually writes.
//
//   PROF-01  the settings screens belong to the signed-in shopper
//   PROF-02  a name change
//   PROF-03  gender, e-mail and alternative phone  — RED, see the finding below
//   PROF-04  the size screen
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
// PROF-03 is red on purpose, and must stay red
//
// It reports that a changed gender is back to the old one after a reload. That
// is a confirmed application defect, not a flaky test:
//
// `UpdateProfile` sends the whole change to all three backends — that part
// works, and PROF-03 proves each leg accepted it — but it then mirrors only
// **five** fields into the app's own stored copy of the profile:
//
//     const marketUpdate = { weight, tall, name, phone, image };   // services/auth.ts
//
// `gender`, `email` and `alternative_phone` are not in that list, so the stored
// copy keeps the old values. Every settings screen renders from that copy, so a
// shopper who changes their gender, e-mail or alternative phone is shown the
// old value the moment they come back — the change did save, and the app says
// it did not.
//
// **PROF-04 is the control.** The size screen changes `tall` and `weight`,
// which *are* in the list, and its identical reload check passes. Same code
// path, same fan-out, different outcome — which is what rules out the test.
//
// Turning this green would delete the only thing reporting the defect. It stays
// red until the mirror is fixed. See `docs/testing/AUTH_CLOSEOUT_PLAN.md`.
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
  alternativePhoneIs,
  attemptSave,
  attemptSizeSave,
  cardShowsAccountName,
  chooseGender,
  gotoPersonalInfo,
  gotoSettings,
  gotoSize,
  hasGenderSet,
  nameFieldIs,
  otherGenderThan,
  phoneFieldMatchesAccount,
  readAlternativePhone,
  readEmail,
  readGender,
  readName,
  readProfileCard,
  readSize,
  sizeIs,
  typeAlternativePhone,
  typeEmail,
  typeName,
  typeSize,
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

/** The other marked values these cases save.
 *
 *  `example.com` is reserved for exactly this and reaches nobody. The
 *  alternative phone is a placeholder that nothing ever dials — it is a second
 *  contact number on a test account, not a number the suite uses. Both are
 *  obvious markers, so a run that dies mid-way leaves something that reads as
 *  "a test stopped here".  */
const PROBE_EMAIL = "trydos.e2e.probe@example.com";
const PROBE_ALT_PHONE = "963900000001";

/** A height and weight inside the form's own limits (110-250cm, 40-180kg). */
const PROBE_SIZE = { height: "177", weight: "77" };
const PROBE_SIZE_ALT = { height: "178", weight: "78" };

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

/** Write the session back as it is **now**, so the next case inherits it.
 *
 *  This is not tidiness, it is the fix for a real failure. Every case opens the
 *  same file, and a saved session is a **snapshot**: the moment a case does
 *  authenticated work, the app can exchange a refused credential for a fresh
 *  one and the pair on the backend moves on. The file still holds the old pair,
 *  so the next case opens a session whose credential has been superseded, the
 *  app recovers it the only way it can — as a guest — and the account's own
 *  details are simply not there any more.
 *
 *  That is exactly what happened: PROF-03 reported "this account has no gender
 *  set" when run after PROF-02, and passed that same check when run without it.
 *  Nothing was wrong with the app or the account.
 *
 *  Only written when the session is still **this account**. A case that failed
 *  its way down to a guest must not hand that on as if it were a session.  */
const handOnSession = async (
  context: BrowserContext,
  page: Page,
): Promise<void> => {
  try {
    const session = await signedInSession(page);
    if (!session.phoneVerified) return;
    await context.storageState({ path: SIGNED_IN_STATE });
  } catch {
    // Never let bookkeeping replace the failure a case is reporting.
  }
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

  // Written again, because both steps above happened after the first snapshot
  // and may have moved the credential on. See `handOnSession`.
  await handOnSession(context, page);
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
    const writes = recordProfileWrites(page);

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
    await handOnSession(context, page);
    await context.close();
  }
});

test("PROF-03 gender, e-mail and alternative phone save together", async ({
  browser,
}) => {
  // Two saves fanning out to three staging backends each, plus a reload.
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser);
  const page = await context.newPage();

  await gotoAbout(page);
  await gotoPersonalInfo(page);

  // Read before anything is changed, so the `finally` has something to put
  // back. Held in variables and never asserted on — see `actions/profile.ts`.
  const originalGender = await readGender(page);
  const originalEmail = await readEmail(page);
  const originalAlternativePhone = await readAlternativePhone(page);

  await test.step("the account carries the fields this case changes", async () => {
    // Asked first, and each says what to do about it. The form refuses every
    // save without a gender, and a field this case cannot put back would be
    // drift on a shared account rather than a test.
    expect(
      originalGender,
      "this account has no gender set, so the form refuses every save and no backend is ever called. " +
        "Set one once on the test account, or treat a mandatory gender as a finding in its own right.",
    ).toBeGreaterThanOrEqual(0);
    // There is deliberately no "the account must already have an e-mail" check
    // here. This account has none, and that is a normal state for a shopper who
    // signed up by phone — so the case sets one and clears it again, which is
    // the same reversible pair as adding and removing a picture. If clearing an
    // e-mail turns out to be impossible, the restore below says so rather than
    // this refusing to run.
  });

  const newGender = otherGenderThan(originalGender);
  let changed = false;

  try {
    const writes = recordProfileWrites(page);

    await test.step("the shopper changes all three and saves", async () => {
      await chooseGender(page, { index: newGender });
      await typeEmail(page, { email: PROBE_EMAIL });
      await typeAlternativePhone(page, { phone: PROBE_ALT_PHONE });

      const outcome = await attemptSave(page);
      changed = true;

      expect(
        outcome.saved,
        outcome.refusedWith
          ? `the form refused the save: "${outcome.refusedWith}" — no backend was called`
          : "the save never completed: the form neither reported a problem nor moved on",
      ).toBe(true);
    });

    for (const leg of PROFILE_LEGS) {
      await test.step(`the ${leg} backend took the change`, async () => {
        await proveLegLanded(writes, leg);
      });
    }

    // One assertion per field, not one for "the profile saved". Three fields go
    // out in one body and a backend may keep some and drop others — a single
    // check could only ever say "something did not stick".
    await test.step("the new gender is still there after a reload", async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await gotoPersonalInfo(page);

      expect(
        await readGender(page),
        `the gender went back to ${originalGender} after a reload, so the change was not kept`,
      ).toBe(newGender);
    });

    await test.step("the new e-mail is still there after a reload", async () => {
      expect(
        (await readEmail(page)) === PROBE_EMAIL,
        "the e-mail is not the one that was just saved, so the change was not kept",
      ).toBe(true);
    });

    await test.step("the new alternative phone is still there after a reload", async () => {
      expect(
        await alternativePhoneIs(page, { phone: PROBE_ALT_PHONE }),
        "the alternative phone is not the one that was just saved, so the change was not kept",
      ).toBe(true);
    });
  } finally {
    if (changed) {
      const restored = await restoreProfileFields(page, {
        gender: originalGender,
        email: originalEmail,
        alternativePhone: originalAlternativePhone,
      });
      expect
        .soft(
          restored,
          "the shared test account still carries this case's gender, e-mail and alternative phone — " +
            "putting the originals back failed, so the next run starts from the wrong values",
        )
        .toBe(true);
    }
    await handOnSession(context, page);
    await context.close();
  }
});

test("PROF-04 the size screen saves a height and a weight", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser);
  const page = await context.newPage();

  await gotoAbout(page);
  await gotoSize(page);

  const originalSize = await readSize(page);

  // There is deliberately no "the account must already carry a size" check.
  //
  // The size form makes both fields required, so **a size cannot be cleared**
  // once set — unlike a name, a gender or an e-mail, there is no way back to
  // "none". An account that starts with no size therefore gains one the first
  // time this runs, and every run after that restores what it found. The drift
  // is one-time and then stable, which is worth saying out loud rather than
  // refusing to run over.
  const createdASize =
    originalSize.height.length === 0 || originalSize.weight.length === 0;
  if (createdASize) {
    test
      .info()
      .annotations.push({
        type: "note",
        description:
          "this account had no height or weight, so this run created them. " +
          "The size form makes both required, so there is no way to clear them again — " +
          "later runs will restore whatever this one leaves.",
      });
  }

  // Never save the value that is already there: a save that changes nothing
  // proves nothing, and would pass whether or not the write worked.
  const probe =
    originalSize.height === PROBE_SIZE.height ? PROBE_SIZE_ALT : PROBE_SIZE;

  let changed = false;

  try {
    const writes = recordProfileWrites(page);

    await test.step("the shopper changes their size and saves", async () => {
      await typeSize(page, probe);

      const outcome = await attemptSizeSave(page);
      changed = true;

      expect(
        outcome.saved,
        outcome.refusedWith
          ? `the size form refused the save: "${outcome.refusedWith}" — no backend was called`
          : "the save never completed: the size form neither reported a problem nor moved on",
      ).toBe(true);
    });

    // The size screen calls the same `UpdateProfile`, so it fans out the same
    // way — with the name and phone unchanged. A backend that quietly drops the
    // size while accepting the rest is exactly what this is watching for.
    for (const leg of PROFILE_LEGS) {
      await test.step(`the ${leg} backend took the change`, async () => {
        await proveLegLanded(writes, leg);
      });
    }

    await test.step("the new size is still there after a reload", async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      await gotoSize(page);

      expect(
        await sizeIs(page, probe),
        `the size is not ${probe.height}cm and ${probe.weight}kg after a reload, so the change was not kept`,
      ).toBe(true);
    });
  } finally {
    // Nothing to put back when there was nothing there: the form will not take
    // an empty height or weight, so trying would fail for a reason that is not
    // a fault. The annotation above is what records that.
    if (changed && !createdASize) {
      const restored = await restoreSize(page, originalSize);
      expect
        .soft(
          restored,
          "the shared test account still carries this case's height and weight — putting the originals back failed",
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

};

// A rollback is not looked for here, and does not need to be.
// `UpdateProfile`'s catch rethrows after putting the finished legs back, so
// `updateUserProfile` never navigates when a rollback happened — which means
// the save-completed assertion in each case above already covers it. Forcing a
// leg to fail, and proving the others really are put back, is what the scripted
// spec is for; staging will not refuse on request.

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

/** Put the other personal-info fields back. Reports whether it worked. */
const restoreProfileFields = async (
  page: Page,
  original: { gender: number; email: string; alternativePhone: string },
): Promise<boolean> => {
  try {
    await gotoPersonalInfo(page);
    await chooseGender(page, { index: original.gender });
    await typeEmail(page, { email: original.email });
    await typeAlternativePhone(page, { phone: original.alternativePhone });
    const outcome = await attemptSave(page);
    return outcome.saved;
  } catch {
    // Swallowed for the same reason as `restoreName` above: this runs in a
    // `finally`, and a throw here would replace the real failure.
    return false;
  }
};

/** Put the height and weight back. Reports whether it worked. */
const restoreSize = async (
  page: Page,
  original: { height: string; weight: string },
): Promise<boolean> => {
  try {
    await gotoSize(page);
    if (await sizeIs(page, original)) return true;

    await typeSize(page, original);
    const outcome = await attemptSizeSave(page);
    return outcome.saved;
  } catch {
    return false;
  }
};
