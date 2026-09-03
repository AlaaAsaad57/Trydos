// PROF-01 to PROF-04 — the shopper's own details, and what changing them
// actually writes.
//
//   PROF-01  the settings screens belong to the signed-in shopper
//   PROF-02  a name change
//   PROF-03  gender, e-mail and alternative phone
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
// PROF-03 found a real defect, and is the proof it is fixed
//
// It was red on its first run: a changed gender was back to the old one after a
// reload. `UpdateProfile` sent the whole change to all three backends and each
// accepted it — PROF-03 proved that much — but it then mirrored only **five**
// fields into the app's own stored copy of the profile:
//
//     const marketUpdate = { weight, tall, name, phone, image };   // before
//
// `gender`, `email` and `alternative_phone` were missing, so the stored copy
// kept the old values. Every settings screen renders from that copy, so a
// shopper who changed their gender was shown the old one the moment they came
// back — the change had saved, and the app said it had not.
//
// **PROF-04 was the control.** The size screen changes `tall` and `weight`,
// which *were* in the list, and its identical reload check passed throughout.
// Same code path, same fan-out, different outcome — which is what ruled out the
// test rather than the app.
//
// The three fields were added to that object and PROF-03 went green. If it ever
// goes red here again, read the object first.
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
// `tests/e2e/.auth/` is gitignored and is not the directory the pipeline
// uploads. The whole directory is removed in `globalTeardown`, which runs after
// every spec including a failing one — rather than by whichever case happens to
// be last, which is what it used to be and which broke the moment cases were
// added after PROF-04.
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

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  currentAuthScreen,
  signOutAndSettle,
  signedInSession,
} from "./actions/auth";
import { gotoAbout } from "./actions/nav";
import {
  alternativePhoneIs,
  attemptSave,
  attemptSizeSave,
  cardShowsAccountName,
  chooseGender,
  gotoPersonalInfo,
  addAddress,
  gotoAddresses,
  gotoPicture,
  gotoSettings,
  gotoSize,
  addressCount,
  addressIsListed,
  attemptPictureSave,
  choosePicture,
  clearChosenPicture,
  hasPicture,
  removeAddress,
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
  storedPictureFile,
  typeAlternativePhone,
  typeEmail,
  typeName,
  typeSize,
} from "./actions/profile";
import { envValue, hasMedia, hasShopperA } from "./harness/env";
import {
  SESSION_STATE,
  forgetSavedSession,
  handOnSession,
  newLiveContext,
  openSignedInSession,
  saveSession,
} from "./harness/liveSession";
import {
  PROFILE_LEGS,
  recordProfileWrites,
  type ProfileLeg,
  type ProfileWriteRecorder,
} from "./harness/profileWrites";
import {
  SIGN_IN_PROFILE_LEGS,
  recordSignInProfile,
  type LegReading,
  type SignInProfileLeg,
} from "./harness/signInProfile";
import {
  UPDATE_LEGS,
  recordUpdateAnswers,
  type UpdateReading,
} from "./harness/updateAnswer";
import { snapshotCredentials } from "./harness/session";
import { profile, prompt } from "./selectors";

/** Where the signed-in session waits between the cases in this spec. */
const SIGNED_IN_STATE = SESSION_STATE.profile;

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

/** The name PROF-08 saves, and it is different on every run.
 *
 *  Unique on purpose, which the other probe values do not need to be. PROF-08
 *  proves a value survived a sign-out by reading it back after signing in, so a
 *  fixed name left on the account by a run that died would come back correct
 *  without this run having written anything at all. A name only this run could
 *  have written is what closes that.
 *
 *  Still marked, and still at least eight characters, because the form refuses
 *  anything shorter. */
const reloginProbeName = (): string =>
  `Trydos Relogin ${Date.now().toString().slice(-6)}`;

/** The picture PROF-05 and PROF-08 upload: a 1x1 PNG, made here rather than
 *  kept as a fixture file. The name is marked, so an orphan left on the media
 *  store by a dead run can be recognised and found later. */
const PROBE_PICTURE = {
  name: "trydos-e2e-probe-picture.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

/** The address PROF-07 adds. Marked, so a run that dies mid-way leaves
 *  something that reads as "a test stopped here". */
const PROBE_ADDRESS_TITLE = "Trydos E2E Probe";
const PROBE_ADDRESS_DETAIL = "Trydos E2E probe address, please delete";

/** How long a leg of the save may take before it counts as never sent.
 *
 *  Generous: three backends answer in sequence and a cold staging route can
 *  spend most of a minute before the first one does. */
const LEG_ANSWER_MS = 60_000;

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
  forgetSavedSession(SIGNED_IN_STATE);

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
  await saveSession(context, SIGNED_IN_STATE);

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
  await handOnSession(context, page, SIGNED_IN_STATE);
  await context.close();
});

test("PROF-02 a name change reaches every backend that keeps a copy", async ({
  browser,
}) => {
  // Two saves, each fanning out to three staging backends in sequence, plus a
  // reload between them. The project default is not enough for that.
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
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
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

test("PROF-03 gender, e-mail and alternative phone save together", async ({
  browser,
}) => {
  // Two saves fanning out to three staging backends each, plus a reload.
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
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
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

test("PROF-04 the size screen saves a height and a weight", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
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
    // This case saves twice, so the credential can have been exchanged since
    // PROF-03 handed the session on. The cases below open this same file.
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
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

// ---------------------------------------------------------------------------
// PROF-05 to PROF-07 — the two screens the earlier profile work left out.
//
// These run after PROF-04, which is why that case now hands its session on
// instead of deleting it. The file itself is removed by `globalTeardown`.

test("PROF-05 a chosen picture is the account's, and removing it removes it", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  test.skip(
    !hasMedia(),
    "the media store is not configured — see tests/e2e/README.md.",
  );

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
  const page = await context.newPage();
  let chose = false;

  try {
    // The country-and-language prefix is read off the address, and a fresh
    // context is at about:blank — same reason PROF-02 opens this way.
    await gotoAbout(page);
    await gotoPicture(page);
    const hadOneBefore = await hasPicture(page);

    // A tiny image the case makes itself, with a marked name so an orphan left
    // on the media store by a dead run can be recognised and found later.
    await choosePicture(page, PROBE_PICTURE);
    chose = true;

    const saved = await attemptPictureSave(page);
    expect(
      saved.saved,
      `the media backend did not take the picture${saved.refusedWith ? ` (${saved.refusedWith})` : ""}`,
    ).toBe(true);

    // A reload proves the app's stored copy was updated, which is a different
    // thing from the backend having accepted it.
    await gotoPicture(page);
    expect(
      await hasPicture(page),
      "the account has no picture after a reload, so the upload was accepted but not kept",
    ).toBe(true);

    await clearChosenPicture(page);
    const removed = await attemptPictureSave(page);
    expect(
      removed.saved,
      `removing the picture was refused${removed.refusedWith ? ` (${removed.refusedWith})` : ""}`,
    ).toBe(true);

    await gotoPicture(page);
    expect(
      await hasPicture(page),
      "the picture is still there after a reload, so removing it did not take",
    ).toBe(false);

    // Left as found. The account had no picture before this case unless it did.
    expect(
      hadOneBefore,
      "this account already had a picture before the case ran, so it has been left without one — restore it by hand",
    ).toBe(false);
  } finally {
    if (chose) {
      // Best effort: whatever state the assertions left, do not leave a probe
      // picture on the shared account.
      await gotoPicture(page)
        .then(async () => {
          if (await hasPicture(page)) {
            await clearChosenPicture(page);
            await attemptPictureSave(page);
          }
        })
        .catch(() => {});
    }
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

test("PROF-06 the profile card leads to the picture screen", async ({
  browser,
}) => {
  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
  const page = await context.newPage();

  try {
    await gotoAbout(page);
    await gotoSettings(page);
    const card = await readProfileCard(page);
    expect(
      card.shown,
      "the settings card is not rendered, so there is no route to the picture screen from it",
    ).toBe(true);

    // Found by address rather than by accessible name: the card's links carry
    // no accessible name, because the label is declared and never rendered.
    // That is a real defect in 22 places and is this ticket's out of scope —
    // matching the address costs nothing and does not paper over it.
    const link = page.locator('a[href*="/settings/profile/picture"]').first();
    await expect(
      link,
      "the profile card offers no link to the picture screen",
    ).toBeVisible();

    await link.click();
    // The photo menu, not Save: Save is a back-bar span the screen fills only
    // once there is a change to save, so it is hidden on arrival.
    await expect(
      profile.changePhotoMenu(page),
      "following the card's picture link did not reach the picture screen",
    ).toBeVisible({ timeout: 30_000 });
  } finally {
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

test("PROF-07 an address the shopper adds is listed, and can be removed", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
  const page = await context.newPage();
  let created = false;

  try {
    await gotoAbout(page);
    await gotoAddresses(page);
    const before = await addressCount(page);

    const offered = await addAddress(page, {
      address: PROBE_ADDRESS_TITLE,
      detail: PROBE_ADDRESS_DETAIL,
      recipient: PROBE_NAME,
      phone: PROBE_ALT_PHONE,
    });
    created = true;
    expect(
      offered,
      "the address form never offered a region, so it could not have saved anything",
    ).toBe(true);

    await gotoAddresses(page);
    expect(
      await addressCount(page),
      "the address list did not grow, so the address was not added",
    ).toBeGreaterThan(before);

    // Content, not presence: an address listed without the details that were
    // entered is a partial success, and a partial success is a failure.
    expect(
      await addressIsListed(page, PROBE_ADDRESS_DETAIL),
      "the address is listed without the details that were entered",
    ).toBe(true);
  } finally {
    if (created) {
      const gone = await removeAddress(page, PROBE_ADDRESS_DETAIL).catch(
        () => false,
      );
      expect
        .soft(
          gone,
          "the shared test account still carries this case's address — removing it failed",
        )
        .toBe(true);
    }
    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// PROF-08 — the check the cases above cannot make, and the defect it found.
//
// Every case above proves two things about a save: each backend answered the
// write with a status that means "taken", and the value is still on screen
// after a reload. Neither of those is the backend's own copy.
//
//   * The status says the write was **accepted**. It does not say it was
//     **kept**, and it does not say *where* it was kept.
//   * The reload reads `/api/auth/me`, which reads cookies, and the settings
//     screens render from the same cookie the save wrote. So the reload shows
//     the app's own copy of its own request body. That is a real check — it
//     caught the missing `gender` / `email` / `alternative_phone` mirror — but
//     it is a check of the app, not of a backend.
//
// Signing out throws every cookie away. Signing back in fills them again from
// what three backends answer with, so the sign-in answer is the first reading
// in this file that no part of the app supplied.
//
// ---------------------------------------------------------------------------
// What it found: the save and the sign-in are not the same record
//
// **This case is red on stories and chat, and that is the point of it.**
//
// The core backend is fine. It answers a fresh sign-in with this run's name and
// this run's picture, every time.
//
// Stories and chat both accept the save at `200` and echo the new name and the
// new `photo_path` straight back — so nothing is lost on the way in. Then the
// sign-in answers from a **different row**:
//
//     leg      the save reached      the sign-in answered from
//     stories  id 454, new name      id 455, name null
//     chat     id 652, new name      id 657, the account's OLD name
//
// Chat's line is the one that rules out a wrong test. Row 657 carries a real
// name, and it is the account's older one — not null, and not the new name the
// login request itself handed chat. It is a stored record. It is simply not the
// record the save wrote.
//
// **The two legs fail differently, and the row numbers are what say so.**
//
//   * **chat** is stable across runs: every save reaches 652 and every sign-in
//     answers from 657. Two rows exist for this one account, and the write and
//     the read resolve to different ones, the same way every time.
//   * **stories** moves. Two consecutive runs gave 452/453 and then 454/455 —
//     consecutive numbers, two new rows per run, and exactly two sign-ins per
//     run (PROF-01's and this case's). That is what a **new row per sign-in**
//     looks like. Under that reading a stories profile cannot survive a
//     sign-in at all: the save updates the row the last sign-in made, and the
//     next sign-in makes another.
//
// So a shopper renames themselves, signs out, signs back in, and chat is
// holding their old name and no picture. Whether the cause is the storefront
// addressing those backends by the **core** user id (`this.UserID()` in
// `services/auth.ts`, used as the chat row id in `PUT /api/v1/users/:id`) or
// the backends keeping more than one row per account is a question for whoever
// owns them — this case cannot see their data model, and it does not guess. It
// reports both row numbers, which is what turns the question into a short one.
//
// **It stays red until that is fixed.** Loosening it, skipping it or retrying
// it would hide a live defect; a red check that names two row numbers is worth
// more than a green one that asks nothing.
//
// ---------------------------------------------------------------------------
// Reading the failure
//
// Two recorders, and each answers half of it:
//
//   * `harness/updateAnswer.ts` — the row the save reached, and what it holds.
//     Its steps **pass**, and that is the point of them: they say the write is
//     not where the fault is.
//   * `harness/signInProfile.ts` — the row a fresh sign-in answers from. Its
//     steps are the red ones.
//
// Neither prints a value out of a body. The failure carries two row numbers and
// the names of the fields the answer held, which is what a reader needs and is
// safe in a public job log.
//
// ---------------------------------------------------------------------------
// One extra sign-in, and where it leaves the account
//
// This case is last, and it costs the file one more real sign-in. It changes
// the account's name and adds a picture, then puts the name back and removes
// the picture in a `finally` — the same arrangement as PROF-02 and PROF-05, for
// the same reason. It hands its new session on, so nothing after it inherits
// the credential the sign-out invalidated.
//
// The name it saves is different on every run. A fixed one left behind by a run
// that died would read back correct without this run having written it.

test("PROF-08 the backends' own copy carries the change after signing out and in", async ({
  browser,
}) => {
  // Two saves, a sign-out that reloads and registers a guest, a full sign-in
  // across five backends, then two restores. Nothing else in this file is this
  // long — the first run took 3.2 minutes and failed before the restores.
  test.setTimeout(420_000);

  const context = await openSignedInSession(browser, SIGNED_IN_STATE, "PROF-01");
  const page = await context.newPage();

  const probeName = reloginProbeName();

  /** Is the picture judged this run?
   *
   *  Decided twice: the media store has to be configured at all, and the
   *  account has to start **without** a picture — this case removes the one it
   *  adds, so an account that came with one would be left without it.
   *
   *  Skipped rather than failed, deliberately. An account that already carries
   *  a picture is PROF-05's finding and PROF-05 reports it; failing here as
   *  well would say the same thing twice and would throw away the name proof,
   *  which has nothing to do with pictures. */
  let judgePicture = hasMedia();
  if (!judgePicture) {
    test.info().annotations.push({
      type: "note",
      description:
        "the media store is not configured, so this run judged the NAME only. " +
        "The picture is the field all three backends can be judged on " +
        "independently — see tests/e2e/README.md.",
    });
  }

  let changedName = false;
  let addedPicture = false;
  let originalName = "";
  /** The file the media store gave this run's picture, read back from the app
   *  after the upload. Held and never asserted on — see `actions/profile.ts`. */
  let pictureFile: string | null = null;

  try {
    await gotoAbout(page);
    await gotoPersonalInfo(page);

    originalName = await readName(page);
    expect(
      originalName.length > 0,
      "the form opened with an empty name, so there is nothing to change and nothing to put back",
    ).toBe(true);

    // Attached before the save: these two backends answer the **update** with
    // the row they now hold, and that answer is the only reading of their copy
    // this suite can get. Their sign-in answer carries those fields blank —
    // see the note in `harness/updateAnswer.ts`.
    const updates = recordUpdateAnswers(page, { name: probeName });

    await test.step("the shopper changes their name and saves", async () => {
      await typeName(page, { name: probeName });
      const outcome = await attemptSave(page);
      changedName = true;

      expect(
        outcome.saved,
        outcome.refusedWith
          ? `the form refused the save: "${outcome.refusedWith}" — no backend was called`
          : "the save never completed: the form neither reported a problem nor moved on",
      ).toBe(true);
    });

    if (judgePicture) {
      await gotoPicture(page);
      if (await hasPicture(page)) {
        judgePicture = false;
        test.info().annotations.push({
          type: "note",
          description:
            "this account already carried a picture, so this run judged the NAME only. " +
            "Adding and then removing one would have left the account without the picture it " +
            "came with. PROF-05 reports that account state — read its failure.",
        });
      }
    }

    if (judgePicture) {
      await test.step("the shopper adds a picture and saves", async () => {
        await choosePicture(page, PROBE_PICTURE);
        addedPicture = true;

        const saved = await attemptPictureSave(page);
        expect(
          saved.saved,
          `the media backend did not take the picture${saved.refusedWith ? ` (${saved.refusedWith})` : ""}`,
        ).toBe(true);

        pictureFile = await storedPictureFile(page);
        expect(
          pictureFile !== null,
          "the app holds no picture file for this account after the upload it reported as done, " +
            "so there is nothing for the sign-in below to be compared against",
        ).toBe(true);
      });
    }

    // The write side, judged before the sign-out — and these steps **pass**.
    //
    // They are here to say where the fault is not. Stories and chat answer the
    // update with the row they wrote it into, carrying the new name and the new
    // picture, so nothing is lost on the way in. Without this, the red steps
    // below would read as "the save to stories failed", which is the wrong
    // half of the flow and the wrong team.
    for (const leg of UPDATE_LEGS) {
      await test.step(`the ${leg} backend stored the change`, async () => {
        const heard = await updates.waitForAnswer(leg, LEG_ANSWER_MS);
        expect(
          heard,
          `the ${leg} backend never answered the save, so there is no record of what it stored`,
        ).toBe(true);

        const wrote = updates.reading(leg);
        expect
          .soft(
            wrote.status !== null && wrote.status < 400,
            `the ${leg} backend refused the save (status ${wrote.status})`,
          )
          .toBe(true);
        expect
          .soft(
            wrote.name,
            `the ${leg} backend answered the save with a name that is not the one just sent, so it stored something else`,
          )
          .toBe("matches");

        if (judgePicture) {
          expect
            .soft(
              wrote.picture,
              `the ${leg} backend answered the save with no picture, although the account had none before and one was just uploaded`,
            )
            .toBe("matches");
        }
      });
    }

    // The static page, and before the sign-out rather than after it: signing
    // out reloads wherever the browser is standing, and a settings page for a
    // visitor who is no longer signed in is not the page to read the account
    // menu from.
    await gotoAbout(page);

    // Attached **before** the sign-in, because the answer it reads goes past
    // once and is never asked for again.
    const signIn = recordSignInProfile(page, {
      name: probeName,
      picture: judgePicture ? pictureFile : null,
    });

    await test.step("the shopper signs out and signs in again", async () => {
      const signedIn = await snapshotCredentials(page);
      await signOutAndSettle(page, { signedIn });

      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      // **The screen is not the judgement here, and that is not a shortcut.**
      //
      // `attemptAuth` returns the first screen that reads the same twice in a
      // row, a quarter of a second apart. The PIN screen reads the same twice
      // for as long as the verification is still travelling — and this one
      // travels to five backends on a second sign-in, which is the slowest
      // sign-in the suite performs. So a **healthy** sign-in comes back from
      // `attemptAuth` as "enter-pin", which is what the first run of this case
      // reported: it failed on the screen while the restore that ran
      // afterwards, which needs a live credential, worked perfectly.
      //
      // The answer the app received is the fact this case is about, and it is
      // already listening for it. Fail closed: an answer never read is a
      // failure to report, never "nothing went wrong" — every judgement below
      // would otherwise read "not read" and say nothing.
      const answered = await signIn.waitForSignIn(SIGN_IN_ANSWER_MS);
      expect(
        answered,
        outcome.error
          ? `signing in again failed: "${outcome.error}" — no backend answered with a profile`
          : `no sign-in answer arrived, and the widget was left on the "${outcome.screen}" screen — ` +
              "nothing below is a reading of any backend's copy",
      ).toBe(true);

      // Leave the widget shut, like PROF-01: its phone field and the "sign in
      // again" prompt share one marker, so a widget left open makes the
      // restores below ambiguous. After the answer, never before — Escape on a
      // widget that is still verifying cancels the thing being measured.
      await page.keyboard.press("Escape").catch(() => {});
      await expect(prompt.phoneEntry(page)).toBeHidden();

      // Polled for the same reason: the answer lands before the app has
      // finished writing what it carried, and a single read here is a read of
      // whichever moment it happened to catch.
      await expect
        .poll(async () => (await signedInSession(page)).phoneVerified, {
          timeout: SIGN_IN_SETTLE_MS,
          message:
            "the app does not treat this visitor as a signed-in shopper after signing in again",
        })
        .toBe(true);
    });

    /** What the save's own answer said, for the two legs that give one.
     *
     *  `null` for the core backend: it is not asked twice, because its sign-in
     *  answer already carries this run's values. */
    const wroteTo = (leg: SignInProfileLeg): UpdateReading | null =>
      leg === "core" ? null : updates.reading(leg);

    // The read side. One judgement per backend per field, each naming both.
    // Soft, so one backend that answers from the wrong row does not hide what
    // the other two did — the case still fails.
    for (const leg of SIGN_IN_PROFILE_LEGS) {
      await test.step(`the ${leg} backend still holds the new name`, async () => {
        const reading = signIn.reading(leg);
        expect
          .soft(reading.name, storedValueFailure(reading, leg, "name", wroteTo(leg)))
          .toBe("matches");
      });
    }

    if (judgePicture) {
      for (const leg of SIGN_IN_PROFILE_LEGS) {
        await test.step(`the ${leg} backend still holds the new picture`, async () => {
          const reading = signIn.reading(leg);
          expect
            .soft(
              reading.picture,
              storedValueFailure(reading, leg, "picture", wroteTo(leg)),
            )
            .toBe("matches");
        });
      }
    }
  } finally {
    if (changedName) {
      // Soft, like the other restores in this file: when the case has already
      // failed, the drift it could not undo must be reported alongside that
      // failure rather than replacing it.
      const restored = await restoreName(page, originalName);
      expect
        .soft(
          restored,
          `the shared test account is still called "${probeName}" — putting the original name back failed, ` +
            "so the next run starts from the wrong value",
        )
        .toBe(true);
    }

    if (addedPicture) {
      const removed = await gotoPicture(page)
        .then(async () => {
          if (!(await hasPicture(page))) return true;
          await clearChosenPicture(page);
          return (await attemptPictureSave(page)).saved;
        })
        .catch(() => false);
      expect
        .soft(
          removed,
          "the shared test account still carries this case's picture — removing it failed, " +
            "so PROF-05 will next report an account that already had one",
        )
        .toBe(true);
    }

    await handOnSession(context, page, SIGNED_IN_STATE);
    await context.close();
  }
});

/** How long the sign-in answer may take to arrive and be read.
 *
 *  Generous, because this covers the sign-in itself: one OTP verification at
 *  the core backend, then chat, stories, comments and the wallet in parallel,
 *  on cold staging routes. It is not a wait on a screen — see the note where it
 *  is used. */
const SIGN_IN_ANSWER_MS = 90_000;

/** How long the app may take to store what that answer carried.
 *
 *  The answer arrives first and the cookies it fills follow, so a session read
 *  the instant the answer lands is a read of a half-written session. */
const SIGN_IN_SETTLE_MS = 30_000;

/** Say what this backend answered with, in words that name the fault.
 *
 *  Five different failures, and a reader needs a different next move for each.
 *  The one worth reading twice is `absent`: the backend did not lose the value,
 *  it does not answer a sign-in with that field at all. So the fault is in this
 *  case, or the backend changed the shape of its answer — and the field names
 *  it *did* send are what says which. */
const storedValueFailure = (
  reading: LegReading,
  leg: SignInProfileLeg,
  field: "name" | "picture",
  wrote: UpdateReading | null,
): string => {
  const sent = reading.keys.length > 0 ? reading.keys.join(", ") : "nothing";

  // The half a sign-in answer can never show. When the save reached one row and
  // the sign-in answered from another, say both numbers — that is the fault,
  // and every other wording sends the reader hunting for lost data instead.
  const rows =
    wrote?.row && reading.row && wrote.row !== reading.row
      ? ` The save reached row ${wrote.row} and this answer came from row ${reading.row}, so the write and the read are not the same record.`
      : "";

  switch (reading[field]) {
    case "differs":
      return `the ${leg} backend answered the new sign-in with a different ${field} than the one just saved, so it did not keep the change.${rows}`;
    case "empty":
      return `the ${leg} backend answered the new sign-in with an empty ${field}, so the change is not in the record it answered from.${rows}`;
    case "absent":
      return `the ${leg} backend's sign-in answer carries no ${field} field at all, so this case cannot read its copy from here. It answered with: ${sent}`;
    case "no user":
      return `the ${leg} backend answered the new sign-in with no user, so its ${field} could not be read — read that backend's sign-in failure first`;
    case "not read":
      return `nothing was recorded for the ${leg} backend's ${field}, so this judgement is unproven — treat it as a gap in the test, not as a passing backend`;
    default:
      return `the ${leg} backend's stored ${field} was judged "${reading[field]}"`;
  }
};
