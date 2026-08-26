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
import { attemptAuth, currentAuthScreen, signedInSession } from "./actions/auth";
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
    await choosePicture(page, {
      name: "trydos-e2e-probe-picture.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
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
