// SCRIPT-06 to SCRIPT-12 — the profile save's failure branches.
//
//   SCRIPT-06  one real sign-in, saved for the six cases below
//   SCRIPT-07  AC-1  one backend refuses: the others are put back, told once
//   SCRIPT-08  AC-2  no chat record: that leg is skipped, and that is not a failure
//   SCRIPT-09  AC-3  the picture upload is refused: told, and nothing is saved
//   SCRIPT-10  AC-5  the credential is refused mid-save: renewed, and the save completes
//   SCRIPT-11  AC-6  renewal fails too: asked to sign in again
//   SCRIPT-12  AC-4  changing the number asks for a confirmation first
//
// ---------------------------------------------------------------------------
// Why these are faked, when `profile.live.spec.ts` is not
//
// Staging accepts everything it is asked. It will not refuse one leg of a save
// on demand, and it will not refuse a credential half way through one — so the
// branches that put the shopper's data back, or renew a credential and carry on,
// have never run anywhere. Two defects were already found in that code by
// reading it. These cases make it observable instead.
//
// ---------------------------------------------------------------------------
// This spec runs CLOSED, and that is the thing to understand before reading it
//
// Every other faking spec in this suite runs **open**: a call nobody named goes
// through to the real backend. That is right for `auth.scripted.spec.ts`, which
// is a guest and changes nothing. It is wrong here, because these cases are
// signed in as the shared account, and a call nobody named is then a real write
// that nobody finds out about.
//
// So `closeUnnamedCalls` refuses anything this file did not ask for, records it,
// and the case asserts at the end that nothing was refused. A route none of us
// thought about stops the case and names itself, rather than reaching staging.
//
// **It sees only what the browser sends.** The one-time code is sent by a server
// action and a page render happens in Node — neither is visible to any of this.
// That is a limit of the technique, not an oversight.
//
// ---------------------------------------------------------------------------
// Every case signs in for itself, and no session is ever shared
//
// `profile.live.spec.ts` hands its session from case to case. This file must not:
// several of these cases damage their own session on purpose — that is the whole
// point of SCRIPT-11 — and none of them may pass that damage on.
//
// An earlier arrangement had one sign-in saved to disk and re-opened by the
// others. It was measured and it does not work: nothing then renews the saved
// session, because these cases also fake `/api/auth/refresh`, so the app cannot
// renew the real credential either. The stored snapshot aged out mid-run and
// every case after the third opened as a guest. Signing in per case is the
// arrangement that keeps the constraint and still works.
//
// **It costs a real one-time code per case, against a limit that is not ours.**
// That is the price of the constraint, and it is why the identities alternate
// below — six sign-ins on one number inside one run would be throttled by the
// per-number cooldown, and a throttled case fails for a reason that has nothing
// to do with what it tests. `auth.scripted.spec.ts` does the same, for the same
// reason.
//
// `/api/auth/refresh` is still faked wherever a `401` is induced: renewal is
// server-side and single use, so a real exchange would rotate the pair this case
// is holding.

import type { Browser } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  selectOtpMethod,
  signedInSession,
  submitOtp,
} from "./actions/auth";
import { gotoAbout } from "./actions/nav";
import {
  attemptPictureSave,
  choosePicture,
  gotoPersonalInfo,
  gotoPicture,
  typeName,
  typePhone,
  watchNotifications,
  attemptSave,
} from "./actions/profile";
import { closeUnnamedCalls, mockBackend, mockBackendSequence } from "./actions/mock";
import { credentialRefusedMidSave, scenarios, ENDPOINTS } from "./scenarios";
import { envValue, hasShopperA } from "./harness/env";
import { newLiveContext } from "./harness/liveSession";
import { auth, prompt } from "./selectors";
import { PROFILE_LEGS, recordProfileWrites } from "./harness/profileWrites";


/** Which identity a case signs in as.
 *
 *  **Strictly** alternated, and that is measured rather than tidy: with the
 *  identities grouped, the last two cases both signed in as Shopper A back to
 *  back and the second was refused with "Failed to send verification code" — the
 *  per-number cooldown, not a fault in the case. Alternating puts roughly two
 *  cases between one identity's sign-ins.
 *
 *  `SCRIPT-12` must be Shopper A, because it types Shopper B's number into the
 *  change-number overlay — the number has to be somebody else's for that to be a
 *  change at all. Everything else alternates around that.
 *
 *  Order no longer carries any other meaning: each case signs in for itself and
 *  shares nothing, so none of them depends on running before or after another. */
const IDENTITY = {
  a: () => ({
    phone: envValue("TEST_ACCOUNT_PHONE"),
    otp: envValue("TEST_ACCOUNT_OTP"),
  }),
  b: () => ({
    phone: envValue("TEST_ACCOUNT_PHONE_2"),
    otp: envValue("TEST_ACCOUNT_OTP"),
  }),
} as const;

/** 180 seconds.
 *
 *  Every case now performs a real sign-in of its own — a one-time-code send, a
 *  PIN screen and two real page loads, where one cold staging route may take the
 *  whole 45 seconds `navigationTimeout` allows, and `sendOtpWithRetry` may sleep
 *  a server cooldown on top. A case killed by its own budget reports "Test
 *  timeout exceeded" and names no step, which is exactly what a failure here must
 *  never do. */
test.describe.configure({ timeout: 180_000 });

/** No trace. The scripted project records one on failure, on the written
 *  premise that it holds no real session — and this file does. A trace is the
 *  request headers, so it is the credential in a file. Video stays on, because
 *  otherwise a red case leaves nothing at all to look at. */
test.use({ trace: "off" });

/** A name unique to this run.
 *
 *  `AC-5` needs the second write to a leg to be told apart from a rollback, and
 *  the only thing that separates them is which value the body carried. If the
 *  account already happened to hold the probe name — a crashed earlier run
 *  leaves exactly that — the forward write and the rollback would be identical
 *  and the check would pass having seen nothing.
 *
 *  Eight characters minimum: the form refuses anything shorter. */
const RUN_PROBE_NAME = `Trydos Probe ${process.pid.toString().padStart(5, "0")}`;

/** A fresh context, signed in as its own identity. Nothing is saved and nothing
 *  is inherited — see the note above. */
/** The confirmation this case's fake hands back.
 *
 *  Its own invention, so comparing against it puts nothing real anywhere — the
 *  account's own confirmation is never minted, read or asserted on. */
const CONFIRMATION_PROBE = "e2e-probe-confirmation";

const openCase = async (
  browser: Browser,
  who: keyof typeof IDENTITY = "a",
) => {
  // A case that alternates onto the second identity needs it configured. Said
  // here rather than per case, so adding a case cannot forget it.
  test.skip(
    who === "b" && envValue("TEST_ACCOUNT_PHONE_2") === "",
    "TEST_ACCOUNT_PHONE_2 is not configured — see tests/e2e/README.md.",
  );

  const context = await newLiveContext(browser, { recordVideo: true });
  const page = await context.newPage();

  // Needed before any locale-scoped path can be built: the country-and-language
  // prefix is read out of the current address, and a freshly opened context is
  // at `about:blank`. Which country this run landed on is the backend's answer,
  // not ours — the same reason `profile.live.spec.ts` opens this way.
  await gotoAbout(page);

  const { phone, otp } = IDENTITY[who]();
  await attemptAuth(page, { intent: "login", phone, method: "whatsapp", otp });
  await page.keyboard.press("Escape").catch(() => {});

  // Said here, once, so a sign-in that did not take fails as itself rather than
  // as whatever screen assertion happens to come next — a case that opens as a
  // guest would otherwise report "this screen did not render" about a screen
  // that rendered perfectly.
  const session = await signedInSession(page);
  expect(
    session.phoneVerified,
    "this case did not end up signed in, so everything below it is a guest's view — read the sign-in, not the screen",
  ).toBe(true);

  return { context, page };
};

/** Every case ends this way: nothing the browser tried was refused by the guard.
 *
 *  Named routes only — the guard keeps paths, never full addresses, because a
 *  faked verify's address carries the live one-time code in its query string. */
const expectNothingUnnamed = (
  guard: { blocked: () => string[] },
  step: string,
): void => {
  expect(
    guard.blocked(),
    `${step} made calls this case never named, so they would have reached staging: ${guard
      .blocked()
      .join(", ")}`,
  ).toEqual([]);
};

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );
});

test("SCRIPT-07 one backend refuses a save, and the shopper is told once", async ({
  browser,
}) => {
  const { context, page } = await openCase(browser, "b");

  try {
    await gotoPersonalInfo(page);

    const guard = await closeUnnamedCalls(context);
    const fake = await mockBackend(page, scenarios.save.coreRefuses);
    const writes = recordProfileWrites(page);
    const peakNotices = await watchNotifications(page);

    await typeName(page, { name: RUN_PROBE_NAME });
    const outcome = await attemptSave(page);

    expect(
      fake.used(ENDPOINTS.saveCore),
      "the core leg was never asked, so this case proved nothing about a refusal",
    ).toBe(true);

    expect(
      outcome.saved,
      "the save was reported as successful even though the core backend refused it",
    ).toBe(false);

    for (const leg of PROFILE_LEGS) {
      expect(
        writes.outcome(leg).asked,
        `the ${leg} backend was never asked to store the change, so there was nothing to put back`,
      ).toBe(true);
    }

    // Told **once**, which is the half of AC-1 that is easy to lose: three
    // backends were written and one refused, and a shopper must not be told
    // three times about one save.
    const told = await peakNotices();
    expect(
      told,
      `the shopper saw ${told} messages at once about one refused save, and should see one`,
    ).toBe(1);

    expectNothingUnnamed(guard, "the refused save");
  } finally {
    await context.close();
  }
});

test("SCRIPT-08 an absent chat record is skipped, and is not reported as a failure", async ({
  browser,
}) => {
  const { context, page } = await openCase(browser, "a");

  try {
    // The account's own answer, taken before anything is faked. Handing back a
    // synthetic one would write a synthetic identity to the real account; an
    // empty one would make the app register a fresh guest.
    const realMe = await page
      .evaluate(() =>
        fetch("/api/auth/me", { method: "POST" }).then((r) => r.json()),
      )
      .catch(() => null);

    expect(
      realMe,
      "the account's own profile answer could not be read, so this case cannot fake an absent chat record without inventing an identity",
    ).not.toBeNull();

    const withoutChat = { ...(realMe as Record<string, unknown>) };
    if (withoutChat.chatUser !== undefined) withoutChat.chatUser = null;

    const guard = await closeUnnamedCalls(context);
    const fake = await mockBackend(page, scenarios.save.noChatRecord(withoutChat));

    await gotoPersonalInfo(page);
    const writes = recordProfileWrites(page);

    await typeName(page, { name: RUN_PROBE_NAME });
    const outcome = await attemptSave(page);

    expect(
      fake.used(ENDPOINTS.authMe),
      "the profile answer was never faked, so the chat record was never actually absent",
    ).toBe(true);

    expect(
      outcome.saved,
      "the save did not complete, even though only the chat record was missing",
    ).toBe(true);

    // Once the core write is recorded, chat's turn has provably passed — the
    // legs are written stories, then chat, then core. No waiting needed.
    expect(
      writes.outcome("core").asked,
      "the core backend was never asked, so nothing can be concluded about chat's turn",
    ).toBe(true);
    expect(
      writes.outcome("chat").asked,
      "the chat backend was written to even though this account has no chat record",
    ).toBe(false);

    expectNothingUnnamed(guard, "the save with no chat record");
  } finally {
    await context.close();
  }
});

test("SCRIPT-09 a refused picture upload is reported, and saves nothing", async ({
  browser,
}) => {
  const { context, page } = await openCase(browser, "b");

  try {
    await gotoPicture(page);

    const guard = await closeUnnamedCalls(context);
    const fake = await mockBackend(page, scenarios.save.uploadRefused);
    const writes = recordProfileWrites(page);

    // A tiny image the case makes itself, so nothing is read from the account
    // or from the repository.
    await choosePicture(page, {
      name: "trydos-e2e-probe.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });

    const outcome = await attemptPictureSave(page, { timeoutMs: 15_000 });

    expect(
      fake.used(ENDPOINTS.mediaUpload),
      "the upload was never attempted, so this case proved nothing about a refused one",
    ).toBe(true);

    expect(
      outcome.saved,
      "the picture screen reported the save as done even though the upload was refused",
    ).toBe(false);

    expect(
      outcome.refusedWith,
      "the shopper was not told the upload failed",
    ).not.toBeNull();

    for (const leg of PROFILE_LEGS) {
      expect(
        writes.outcome(leg).asked,
        `the ${leg} backend was sent a profile change even though the upload it depended on was refused`,
      ).toBe(false);
    }

    expectNothingUnnamed(guard, "the refused upload");
  } finally {
    await context.close();
  }
});

test("SCRIPT-10 a credential refused mid-save is renewed, and the save completes", async ({
  browser,
}) => {
  const { context, page } = await openCase(browser, "a");

  try {
    await gotoPersonalInfo(page);

    const guard = await closeUnnamedCalls(context);
    // Map first, sequence second: the last registered is tried first and falls
    // back to the map for everything it does not answer. Measured, not assumed
    // — see the spike recorded with this ticket.
    const fake = await mockBackend(page, scenarios.save.coreRefuses);
    const sequence = await mockBackendSequence(
      page,
      ENDPOINTS.saveCore,
      credentialRefusedMidSave,
    );
    const writes = recordProfileWrites(page, { expected: RUN_PROBE_NAME });

    await typeName(page, { name: RUN_PROBE_NAME });
    const outcome = await attemptSave(page);

    expect(
      sequence.consumed(),
      "the core leg never answered twice, so the credential was never refused mid-save",
    ).toBe(sequence.total());

    expect(
      outcome.saved,
      "the save did not complete after the credential was renewed",
    ).toBe(true);

    const core = writes.outcome("core");
    expect(
      core.attempts,
      "the core backend was written to only once, so nothing was retried",
    ).toBeGreaterThan(1);

    // The one fact that separates a retry from a rollback: a rollback carries
    // the value the account had **before**, a retry carries the new one.
    expect(
      core.carriedExpected,
      "the second write to the core backend carried the old value, so it was a rollback and not the retry this case claims",
    ).toBe(true);

    expect(fake.usedKeys().length, "no fake was used at all").toBeGreaterThan(0);
    expectNothingUnnamed(guard, "the save with a refused credential");
  } finally {
    await context.close();
  }
});

test("SCRIPT-11 when renewal also fails, the shopper is asked to sign in again", async ({
  browser,
}) => {
  const { context, page } = await openCase(browser, "b");

  try {
    await gotoPersonalInfo(page);

    const guard = await closeUnnamedCalls(context);
    const fake = await mockBackend(page, scenarios.save.renewalAlsoFails);

    await typeName(page, { name: RUN_PROBE_NAME });
    await attemptSave(page, { timeoutMs: 20_000 });

    expect(
      fake.used(ENDPOINTS.refresh),
      "the app never tried to renew the credential, so this case proved nothing about renewal failing",
    ).toBe(true);

    // The app does not open the OTP widget here, and asserting that it does was
    // asserting a guess. On a failed renewal `ExpiredUser` arms the
    // **session-expired prompt** instead (`services/auth.ts`, `setShouldAuthinticated("expired")`),
    // which offers the shopper the choice between signing back into their real
    // account and carrying on as the fresh guest. That prompt is the app asking.
    await expect(
      prompt.sessionExpired(page),
      "the shopper was not offered the session-expired prompt after the credential could not be renewed",
    ).toBeVisible({ timeout: 30_000 });

    expectNothingUnnamed(guard, "the save with a failed renewal");
  } finally {
    // Deliberately NOT handed on: this case ends its own session on purpose.
    await context.close();
  }
});

test("SCRIPT-12 changing the number asks for a confirmation before it saves", async ({
  browser,
}) => {
  test.skip(
    envValue("TEST_ACCOUNT_PHONE_2") === "",
    "TEST_ACCOUNT_PHONE_2 is not configured — see tests/e2e/README.md.",
  );

  const { context, page } = await openCase(browser);

  try {
    await gotoPersonalInfo(page);

    const guard = await closeUnnamedCalls(context);
    const fake = await mockBackend(
      page,
      scenarios.save.phoneChangeAccepted(CONFIRMATION_PROBE),
    );
    const writes = recordProfileWrites(page, {
      expected: CONFIRMATION_PROBE,
    });

    // The second configured identity, never an invented number: the code that
    // follows is a real send, and it must reach a number this project owns.
    const newNumber = envValue("TEST_ACCOUNT_PHONE_2");
    const took = await typePhone(page, { phone: newNumber });
    expect(
      took,
      "the phone field would not take the new number, so nothing was ever asked to change",
    ).toBe(true);
    const outcome = await attemptSave(page, { timeoutMs: 20_000 });

    // Asked first: the form refuses a save outright when the account has no
    // gender, too short a name or an invalid number, and a refused save never
    // reaches the confirmation step at all. Without this the case would blame a
    // missing overlay on the app when the form had already said why.
    expect(
      outcome.refusedWith,
      `the form refused the save before any confirmation could be asked for ("${outcome.refusedWith}")`,
    ).toBeNull();

    // The save must not have happened yet — that is the whole criterion.
    for (const leg of PROFILE_LEGS) {
      expect(
        writes.outcome(leg).asked,
        `the ${leg} backend was sent the new number before the shopper confirmed it`,
      ).toBe(false);
    }

    // Asserted on the method choice, and the reason is worth keeping.
    //
    // The confirmation overlay starts at the **method** step, because the number
    // is already known and locked (`usePhoneVerifyFlow`: `phoneLocked &&
    // initialPhone` starts at `select-method`). And a locked screen deliberately
    // does **not** render the "edit phone number" control — which is the very
    // marker `currentAuthScreen` uses to recognise that screen, so it reports
    // "closed" for an overlay that is plainly open.
    //
    // The method buttons are always rendered, so they are what "the shopper was
    // asked" is read from here.
    await expect(
      auth.whatsappMethod(page).or(auth.smsMethod(page)).first(),
      "the shopper was not asked to confirm the new number — the confirmation overlay never offered a way to receive the code",
    ).toBeVisible({ timeout: 30_000 });

    // Then finish it, because the criterion is not only that the shopper is
    // asked — it is that **the save which follows carries the confirmation**.
    // The send is real and cannot be faked (C-2); everything after it is faked,
    // so any six digits are accepted and no real code is verified.
    await test.step("the confirmation offers a way to receive the code", async () => {
      await selectOtpMethod(page, { method: "whatsapp", phone: newNumber });
    });

    await test.step("the confirmation asks for the code", async () => {
      // Asserted on its own so a flow that never leaves the method step says
      // that, rather than failing later as "the confirmation was never
      // verified" — which would send the reader to look at the verify call.
      await expect(
        auth.otpInput(page),
        "the confirmation never reached the code screen after a method was chosen",
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step("the code is accepted and the save follows", async () => {
      await submitOtp(page, { otp: "000000", phone: newNumber });

      // The code screen's own verdict, read before anything downstream is
      // judged. It separates "the verify ran and was refused" from "the verify
      // never ran at all" — two failures that look identical from the outside
      // and send a reader to completely different places.
      const refused = await page
        .getByTestId("verify-otp-error")
        .first()
        .isVisible({ timeout: 15_000 })
        .catch(() => false);
      expect(
        refused,
        "the code screen reported the code as wrong, so the confirmation was verified and refused rather than never attempted",
      ).toBe(false);
    });

    expect(
      fake.used(ENDPOINTS.verifyPhone),
      `the confirmation was never verified, so no save could have carried one — fakes that did match: [${fake.usedKeys().join(", ")}]; calls the guard refused: [${guard.blocked().join(", ")}]`,
    ).toBe(true);

    // Waited for, not read immediately. A verified code does not save straight
    // away: `usePhoneVerifyFlow` lets the screen's "valid" state land before it
    // calls back (a deliberate 600ms), and the save begins after that. Reading
    // the recorder the instant the code was accepted asks the question before
    // the app has had a chance to answer it.
    const sent = await writes.waitForWrite("core", 30_000);
    expect(
      sent,
      "the save never followed the confirmation, so nothing carried it",
    ).toBe(true);

    // Present and non-empty, never the value. The comparison happens inside the
    // recorder and only a boolean comes back — and the value compared is this
    // case's own fake, not anything the account holds.
    const core = writes.outcome("core");
    expect(
      core.carriedExpected,
      "the save that followed the confirmation did not carry it",
    ).toBe(true);

    expectNothingUnnamed(guard, "the change-number flow");
  } finally {
    // Never handed on. This case's context has been through a phone change, and
    // the app mirrors that into its own cookies whatever the backends answered.
    await context.close();
  }
});
