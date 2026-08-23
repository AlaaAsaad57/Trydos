// AUTH-01 to AUTH-03 — what a real sign-in writes, that it survives a reload,
// and that signing out takes it away again.
//
// ---------------------------------------------------------------------------
// One sign-in for the whole file, handed on through a saved session
//
// Every sign-in here is real traffic against staging: a real one-time code and
// a real sign-in that fans out to five backends. Three cases that each signed in
// would be three codes per run against limits that are not ours. So AUTH-01
// signs in once and saves the session; the two cases after it open that session
// instead of signing in again.
//
// **Why a file and not a shared variable.** Playwright discards the worker
// process after a failing test and starts a new one for the next, so anything
// held in a module-level variable is gone the moment a case goes red — and this
// file's first case is *expected* to be red for as long as one backend is
// broken. A variable would therefore hide the reload and sign-out coverage
// behind an unrelated outage, which is the exact silent gap this file exists to
// close. A file on disk survives the restart.
//
// This is not `describe.serial` either, for the same reason: serial mode skips
// the rest of the group after a failure.
//
// **The saved session holds a real credential.** `tests/e2e/.auth/` is
// gitignored for precisely this, it is not the directory the pipeline uploads,
// and the file is deleted when the run finishes.
//
// **Each case stands on its own** given that session — it reads what it needs
// after opening it, and compares against its own earlier reading. Nothing is
// carried between cases in memory.
//
// **AUTH-03 must stay last.** It signs the saved session out.
// ---------------------------------------------------------------------------

import { existsSync, rmSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import type { Browser, BrowserContext } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  currentAuthScreen,
  openCartAndProveBackendAnswered,
  proveSignInLanded,
  signInCookiesHeld,
  signOutAndSettle,
  signedInSession,
} from "./actions/auth";
import { gotoAbout, gotoHome } from "./actions/nav";
import { envValue } from "./harness/env";
import { prompt } from "./selectors";
import {
  ACCESS_COOKIE,
  recordSignInOutcome,
  REFRESH_COOKIE,
  snapshotCredentials,
} from "./harness/session";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

/** Where the signed-in session waits between cases. Gitignored, never uploaded,
 *  removed when the run ends. */
const SIGNED_IN_STATE = "tests/e2e/.auth/signed-in.json";

/** The parts of the session each backend writes.
 *
 *  Read from the app's own cookie names, so a part added later is covered
 *  without editing this list. `DEVICE-TOKEN` is deliberately here: the app never
 *  writes it, so it may be checked for absence — never for presence. */
const PER_BACKEND_SESSION = [
  COOKIE_NAMES.CHAT_TOKEN,
  COOKIE_NAMES.CHAT_REFRESH_TOKEN,
  COOKIE_NAMES.STORIES_TOKEN,
  COOKIE_NAMES.STORIES_REFRESH_TOKEN,
  COOKIE_NAMES.WALLET_TOKEN,
  COOKIE_NAMES.WALLET_USER,
  COOKIE_NAMES.USER_ID_HASH,
  COOKIE_NAMES.USER_CHAT,
  COOKIE_NAMES.USER_STORIES,
  COOKIE_NAMES.DEVICE_TOKEN,
];

/** The three the app hands a guest as well, so they come back after signing out.
 *  Judged by having **changed**, never by being gone. */
const SHARED_WITH_GUESTS = [
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  COOKIE_NAMES.USER_DATA,
];

/** A context with the options the project would have given a fixture page.
 *
 *  A context built by hand inherits none of them, so every one this suite relies
 *  on is passed explicitly: the address to resolve relative paths against, the
 *  language, the recording, and the two timeouts. */
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

/** Open the session AUTH-01 saved, or say plainly why there is none. */
const openSignedInSession = async (
  browser: Browser,
): Promise<BrowserContext> => {
  if (!existsSync(SIGNED_IN_STATE)) {
    throw new Error(
      "there is no saved signed-in session, so AUTH-01 never got far enough to sign in. " +
        "Read that case's failure — this one had nothing to run against.",
    );
  }
  return newLiveContext(browser, { storageState: SIGNED_IN_STATE });
};

/** Remove the saved session.
 *
 *  **Not in `afterAll`.** Playwright tears a worker down after a test fails and
 *  starts a fresh one for the next test, so `afterAll` runs *between* these
 *  cases rather than at the end of them — it would delete the session the moment
 *  AUTH-01 went red, which is the one run where the later cases most need it.
 *  Cleared at the start of the run instead, and again once the last case that
 *  needs it has finished. */
const forgetSavedSession = () => rmSync(SIGNED_IN_STATE, { force: true });

test("AUTH-01 a real sign-in lands on every backend it writes for", async ({
  browser,
}) => {
  // Anything left by an earlier run is not this run's session.
  forgetSavedSession();

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  // Attached before anything is typed: the answer it reads arrives on the
  // sign-in request itself.
  const outcome = recordSignInOutcome(page);

  // The static page, not the home page. The auth widget is in the layout, so it
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

  // Leave the widget shut. Its phone field and the "sign in again" prompt share
  // one marker, so a widget left open makes AUTH-02 red for the wrong reason.
  await page.keyboard.press("Escape").catch(() => {});
  await expect(prompt.phoneEntry(page)).toBeHidden();

  // Hand the session on **before** anything is judged.
  //
  // The two cases below need a signed-in browser, not a verdict about one. Saved
  // here, everything after this point is free to fail without taking them with
  // it.
  await mkdir(dirname(SIGNED_IN_STATE), { recursive: true });
  await context.storageState({ path: SIGNED_IN_STATE });

  const session = await signedInSession(page);

  // AC-6, AC-7, AC-8 — one judgement per backend, each naming the backend it is
  // about, all five reported in one run.
  await proveSignInLanded(page, outcome, session);

  // AC-1 — the stored profile carries an identity for the account that signed
  // in. The id itself, never the profile it came from.
  expect
    .soft(
      typeof session.accountId,
      "the stored profile carries no identity for the account that signed in",
    )
    .toBe("number");

  // AC-2 — the storefront credential is kept away from page scripts. The
  // boolean, never the cookie record.
  const jar = await context.cookies();
  const storefront = jar.find((cookie) => cookie.name === ACCESS_COOKIE);
  expect
    .soft(
      storefront?.httpOnly,
      "the storefront credential is readable by page scripts",
    )
    .toBe(true);

  // Closing is what flushes the recording.
  await context.close();
});

test("AUTH-02 a signed-in session still works after a full page reload", async ({
  browser,
}) => {
  const context = await openSignedInSession(browser);
  const page = await context.newPage();

  // The home page, because the cart control is not clickable on the static one
  // and opening the cart is the authenticated thing this case does. That ties
  // this case to the search backend: if it is down the page cannot render at
  // all, and `pnpm e2e:health` is what tells those two apart.
  await gotoHome(page);
  const before = await signedInSession(page);

  await page.reload({ waitUntil: "domcontentloaded" });

  // AC-4 — the proof. A backend answered an ordinary authenticated request
  // after the reload, which a refused credential could not have produced. This
  // also waits long enough for the app to have raised the "sign in again"
  // prompt if it were going to, which is what stops the two checks below from
  // passing instantly on a dead session.
  await openCartAndProveBackendAnswered(page);

  await expect(
    prompt.sessionExpired(page),
    "the app asked the shopper to sign in again, so the session did not survive",
  ).toBeHidden();

  const after = await signedInSession(page);
  expect(
    after.accountId,
    "the app names a different account after the reload",
  ).toBe(before.accountId);
  expect(
    after.phoneVerified,
    "the app no longer treats the visitor as a signed-in shopper after the reload",
  ).toBe(true);

  await context.close();
});

test("AUTH-03 signing out takes the whole session away", async ({ browser }) => {
  const context = await openSignedInSession(browser);
  const page = await context.newPage();

  // The static page: signing out reloads, and reloading the home page would put
  // this case behind the search backend for no reason.
  await gotoAbout(page);

  const before = await signedInSession(page);
  expect(
    before.phoneVerified,
    "the saved session is not signed in, so there is nothing to sign out of",
  ).toBe(true);

  const signedIn = await snapshotCredentials(page);
  await signOutAndSettle(page, { signedIn });

  const held = await signInCookiesHeld(page);

  // AC-3 — every backend's own part of the session is gone, and the guest that
  // replaced the shopper put none of it back. Names only: an assertion that
  // receives a cookie record prints its value.
  const leftBehind = PER_BACKEND_SESSION.filter((name) => held.includes(name));
  expect(leftBehind.sort(), "signing out left part of the session behind").toEqual(
    [],
  );

  // AC-3b — the three a guest gets too are back, and that is correct. What must
  // not be true is that they still belong to the shopper who signed out. That
  // they changed was already proved by the wait above, which is what "settled"
  // means here.
  for (const name of SHARED_WITH_GUESTS) {
    expect(
      held.includes(name),
      `${name} is missing after signing out, so the visitor is not even a guest`,
    ).toBe(true);
  }

  // AC-3c — whoever the app names now, it is not the account that signed out,
  // and it is not a verified shopper.
  const after = await signedInSession(page);
  expect(
    after.phoneVerified,
    "the app still treats the visitor as a signed-in shopper after signing out",
  ).toBe(false);
  expect(
    after.accountId === before.accountId,
    "the app still names the account that signed out",
  ).toBe(false);

  await context.close();

  // The last case that needs it has finished, and the session it held has just
  // been signed out anyway. A real credential does not sit on disk afterwards.
  forgetSavedSession();
});
