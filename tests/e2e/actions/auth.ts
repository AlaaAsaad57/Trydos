// Who the visitor is, and starting out as a brand new one.
//
// The module the design document reserves for authentication verbs. It holds
// two of them today; `e2e-money-path` extends this same file with `login`,
// `attemptLogin`, `logout` and `resendOtp` rather than adding a second home for
// the same idea.
//
// The credential machinery these verbs lean on — spoiling a cookie, telling
// whether the stored pair changed, recording requests — is in
// `harness/session.ts`, because none of that is a thing a visitor does.

import {
  expect,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

import { auth, nav, prompt } from "../selectors";

import { arriveAsGuest } from "./locale";
import { howTheClientStarted } from "../harness/clientStart";
import { LIVE_ORIGIN } from "../harness/env";
import {
  credentialsChangedSince,
  credentialsHeld,
  type AuthCallRecorder,
  type BackendName,
  type CredentialSnapshot,
  type SignInOutcomeRecorder,
} from "../harness/session";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";

/** How long each part of booting is allowed to take.
 *
 *  Explicit, and every one of them shorter than the suite defaults it would
 *  otherwise inherit (45s navigation, 20s action). The reason is arithmetic:
 *  this work happens **before** a case's measured window opens, and the whole
 *  case still has to finish inside the suite's per-case timeout, which
 *  `playwright.config.ts` sets to 120 seconds. With
 *  the suite defaults inherited, a slow-but-correct staging run could spend
 *  longer than that getting to the starting line and die before the window it
 *  was there to measure. See `_specs/e2e-guest-token-lifecycle/implement.md`
 *  for the full sum. */
/** How many digits a whole international number runs to, across every country
 *  the login widget offers (`components/Login/Enhanced/ui/RdbPhoneInput.tsx`).
 *
 *  The widget wants the dial code **and** the national part in one field, and it
 *  checks the total exactly. The shortest pair it lists is the United States,
 *  1 + 10; the longest are the three-digit dial codes with a ten-digit national
 *  part, such as Iraq's 964 + 10.
 *
 *  Used only to tell a mis-set `TEST_ACCOUNT_PHONE` from a broken login screen —
 *  see `enterPhone`. */
const SHORTEST_INTERNATIONAL_NUMBER = 11;
const LONGEST_INTERNATIONAL_NUMBER = 13;

const COUNTRY_LOOKUP_MS = 10_000;
const BOOT_NAVIGATION_MS = 25_000;
const REGISTRATION_MS = 15_000;

/** Where a case starts.
 *
 *  The locale home page. A plainer page would boot the app just as well and
 *  cost less — `/about` was tried first for exactly that reason — but the cart
 *  control in the navigation bar is not clickable there, and opening the cart
 *  is the authenticated action these cases need. The home page is the surface
 *  an existing browsing case already proves the cart opens from, so it is the
 *  one that works rather than the one that is cheapest. */
const BOOT_PAGE = "";

// Countries to offer the app, so it can say which one it serves.
//
// **Not a hard-coded answer.** The app is asked and its answer is used; these
// are only the candidates put to it, the same shape the locale coverage uses
// for the opposite question. If the served markets change, the loop finds
// whichever of these still works and the cases carry on.
//
// **Why not simply take the country the app picks on its own?** Reached over
// loopback there is no country to detect, so it always answers with its default
// — and `components/Home/Init.tsx` shows the region picker on *any* address
// under that default, whatever the cookies say. The picker is a full-screen
// backdrop, so every later click in the case is swallowed by it. Booting on a
// served country is what keeps the page clickable.
const SERVED_CANDIDATES = ["iq", "sy", "lb", "tr"];

let servedCountryCache: { country: string; language: string } | null = null;

/** A country the app serves, asked once per run. */
const servedCountry = async (): Promise<{
  country: string;
  language: string;
}> => {
  if (servedCountryCache) return servedCountryCache;

  for (const iso of SERVED_CANDIDATES) {
    const arrival = await arriveAsGuest({
      path: "/",
      fromCountry: iso,
      maxHops: 1,
    });
    if (arrival.country === iso && !arrival.askedToPickCountry) {
      servedCountryCache = { country: iso, language: arrival.language };
      return servedCountryCache;
    }
  }

  throw new Error(
    `the app served none of the candidate countries (${SERVED_CANDIDATES.join(", ")})`,
  );
};

export type NewGuest = {
  /** The address the browser ended on. */
  url: string;
  /** When the registration was seen. The measured window runs from here. */
  registeredAt: number;
  /** Where the recorder stood at that moment, so a case can ask what happened
   *  **after** the registration rather than including it. */
  mark: number;
};

/** Start as a visitor the site has never seen, and return once it has
 *  registered them.
 *
 *  Four moves, and the order is the whole point:
 *
 *  1. **Ask the app which country it serves.** One request, redirect not
 *     followed — no page is rendered, no picker appears, no guest is created.
 *     The app still chooses; this suite never names a country (the locale
 *     coverage owns that rule and this reuses its helper).
 *  2. **Clear every cookie.** This is the step that makes the rest true. The
 *     app registers a guest on boot when it finds no token cookie, so anything
 *     that leaves one behind means the next navigation mounts with a credential
 *     and never registers — and a case waiting for that registration waits
 *     forever. Clearing also makes a case behave the same whether it runs alone
 *     or after twenty others.
 *  3. **Seed the country and language**, so the region popup never appears and
 *     with it goes a wait, a click and a full page reload.
 *  4. **Navigate, and wait for the registration.**
 *
 *  The recorder must already be attached when this is called — the registration
 *  it waits for is the first thing worth recording. */
export const bootAsNewGuest = async (
  page: Page,
  options: { recorder: AuthCallRecorder },
): Promise<NewGuest> => {
  // 1. Find a country the app actually serves. One request per candidate,
  //    redirect not followed — nothing is rendered and no guest is created.
  const { country, language } = await servedCountry();

  // 2. Nothing carried over. Not the credentials, not the locale, not anything
  //    a previous case left.
  const context = page.context();
  await context.clearCookies();

  // 3. The locale the app just chose, written back so it is not asked again.
  //
  //    Addressed by `url` rather than by `domain` and `path`. The server is
  //    reached at an IP address, and a cookie written with an explicit domain
  //    there is not reliably matched back — the seeding silently did nothing,
  //    the app decided the country was unknown, and the region picker covered
  //    the page with a full-screen backdrop that swallowed every later click.
  await context.addCookies(
    ["country", "lang", "language"].map((name) => ({
      name,
      value: name === "country" ? country : language,
      url: LIVE_ORIGIN,
    })),
  );

  // 4. A fresh mount with no credential is what registers the guest.
  const mark = options.recorder.mark();
  await page.goto(`/${country}-${language}${BOOT_PAGE}`, {
    waitUntil: "domcontentloaded",
    timeout: BOOT_NAVIGATION_MS,
  });

  const registered = await options.recorder.waitFor(
    "/api/auth/register-device",
    REGISTRATION_MS,
  );
  expect(
    registered,
    "the app never registered a guest — did the visit start with a credential already in place?",
  ).toBe(true);

  // Seeing the request is not the same as having the answer. The recorder
  // listens for requests being *sent*, so it reports the registration the
  // moment it leaves the browser — before the response has written a single
  // cookie. Waiting for the credentials themselves is what "registered" has to
  // mean here, and reading them a moment too early was the first thing that
  // went wrong when these cases were written.
  await expect
    .poll(async () => (await credentialsHeld(page)).length, {
      timeout: REGISTRATION_MS,
      message: "the registration was requested but no credentials arrived",
    })
    .toBe(2);

  return { url: page.url(), registeredAt: Date.now(), mark };
};

/** Who the app thinks it is talking to, once it has decided.
 *
 *  The profile is written by a request that follows the registration, so asking
 *  the instant the credentials appear can legitimately answer "nobody yet".
 *  Waiting is not the same as asserting: this is the app finishing its boot,
 *  not the behaviour under test. */
export const whoAmIWhenReady = async (
  page: Page,
  timeoutMs = 10_000,
): Promise<number | null> => {
  let id: number | null = null;
  await expect
    .poll(
      async () => {
        id = await whoAmI(page);
        return id;
      },
      { timeout: timeoutMs, message: "the app never named the current guest" },
    )
    .not.toBeNull();
  return id;
};

/** Which guest the app currently thinks it is talking to.
 *
 *  The number and nothing else. The route behind this answers with the whole
 *  profile, and for a signed-in shopper that carries a phone number and an
 *  email — which this suite may not print. Returning only the identifier means
 *  a failure message cannot carry those whoever calls it later.
 *
 *  It is also not the hashed identifier, which the masking helper treats as a
 *  secret in its own right. Same-or-different is all any case here needs. */
export const whoAmI = async (page: Page): Promise<number | null> => {
  const id = await page.evaluate(() =>
    fetch("/api/auth/me", { method: "POST", credentials: "include" })
      .then((response) => response.json())
      .then((body) => body?.user?.id ?? null)
      .catch(() => null),
  );
  return typeof id === "number" ? id : null;
};

export { COUNTRY_LOOKUP_MS };

// ---------------------------------------------------------------------------
// Scripted auth widget interactions.
//
// These live in the same module because they extend the same "who is the
// visitor" idea, and the design doc reserves this file for authentication
// verbs. They are kept separate from the guest-lifecycle helpers above so the
// latter stay focused on session boot rather than widget flow.
// ---------------------------------------------------------------------------

/** Auth screens the widget can be on, used for assertions and waits. */
export type AuthScreen =
  | "get-started"
  | "input-phone"
  | "select-method"
  | "enter-pin"
  | "welcome"
  | "input-name"
  | "not-registered"
  | "registered"
  | "closed";

export type OtpMethod = "sms" | "whatsapp";

const AUTH_SCREEN_MS = 10_000;
const SEND_OTP_MS = 20_000;

/** How long to wait for the sign-in answer itself.
 *
 *  It arrives on the same request the widget is already waiting on, so by the
 *  time a case asks, it is normally there. The wait exists so that "never seen"
 *  is a reported failure rather than a silent "nothing went wrong". */
const SIGN_IN_ANSWER_MS = 15_000;

/** How long signing out has to finish reloading **and** registering the guest
 *  that replaces the signed-out shopper. Two round trips and a full page load,
 *  so it is longer than a single request would need. */
const SIGN_OUT_SETTLE_MS = 30_000;

/** How long the cart read has to come back after the drawer opens.
 *
 *  This is the signal that proves the stored credential is still accepted
 *  upstream, so it has to allow for the app noticing a refusal, exchanging the
 *  credential and trying again before it gives up. */
const CART_ANSWER_MS = 30_000;

/** Open the login widget from the nav bar and wait for the first screen.
 *
 *  Two questions, asked separately, for the same reason `openAccountMenu` asks
 *  two: "did the widget open" and "is it on the first screen" are different
 *  faults with different causes, and one check could only ever report the
 *  second. `BUY-01` failed as `join-statement ... element(s) not found`, which
 *  names a marker rather than a fault.
 *
 *  The press is repeated up to three times because the nav control is
 *  server-rendered, so a press landing before React attaches does nothing at
 *  all. It is **never** repeated while the widget is already open: the widget
 *  covers the nav control it was opened from, so a second press is swallowed
 *  and Playwright reports a click timeout instead. */
export const openLoginWidget = async (page: Page): Promise<void> => {
  const button = auth.loginButton(page);
  await expect(button).toBeVisible();

  let screen = await currentAuthScreen(page);
  for (let attempt = 0; attempt < 3 && screen === "closed"; attempt += 1) {
    await button.click();
    await auth
      .getStartedTitle(page)
      .waitFor({ state: "visible", timeout: AUTH_SCREEN_MS })
      .catch(() => undefined);
    screen = await currentAuthScreen(page);
  }

  // First question. `"closed"` is `currentAuthScreen`'s own answer for "none of
  // the widget's screens are in the page", so this is the app's reading, not a
  // guess about one marker.
  expect(
    screen,
    "the login control was pressed three times and the widget never opened, " +
      "so no screen of it is in the page",
  ).not.toBe("closed");

  // Second question, and its own message. `null` means the widget is open on a
  // screen this suite does not recognise — worth saying, because it is what a
  // page that kept an earlier flow armed looks like.
  expect(
    screen,
    `the login widget opened on the "${screen ?? "unrecognised"}" screen ` +
      "instead of the first one, so the visitor was not asked to sign up or " +
      "log in",
  ).toBe("get-started");
};

/** Choose sign-up or login on the first screen. */
export const chooseAuthIntent = async (
  page: Page,
  options: { intent: "signup" | "login" },
): Promise<void> => {
  const locator =
    options.intent === "signup"
      ? auth.signUpButton(page)
      : auth.loginButtonOnScreen(page);
  await expect(locator).toBeVisible();
  await locator.click();
  if(options.intent!=='signup')
  await expect(auth.phoneInput(page)).toBeVisible();
};
export const AgreeTerms = async ({ page }: { page: Page }): Promise<void> => {
  const locator = auth.Terms(page);
  await expect(locator).toBeVisible();
  await locator.click();

  await expect(auth.phoneInput(page)).toBeVisible();
};
/** Enter the phone number and move to the method screen. */
export const enterPhone = async (
  page: Page,
  options: { phone: string },
): Promise<void> => {
  const input = auth.phoneInput(page);
  await expect(input).toBeVisible();
  const digits = options.phone.replace(/\D/g, "").replace(/^0+/, "");
  await input.fill(digits);

  // **The submit control is drawn only for a number the widget calls complete**,
  // and complete means an exact digit count, not a minimum:
  // `isValidPhone = digits.length === dialCode.length + maxLocal`
  // (`components/Login/Enhanced/ui/RdbPhoneInput.tsx`). Syria is 3 + 9, so
  // twelve digits — the **whole** international number, country code included
  // and no `+`. One digit short or one over and there is no control to press.
  //
  // So `TEST_ACCOUNT_PHONE` has to be one full international number. Two of
  // them separated by a comma, or the national part on its own, both land here.
  //
  // Without the reading below, that failure is "element(s) not found" against
  // `send-phone-number` — which names nothing anyone can act on and reads like
  // the login screen changed. It cost a local run to work out, and the whole
  // answer was the length of the value.
  //
  // **The number never reaches the message**, only how many digits it has.
  const submit = auth.submitPhoneButton(page);
  const ready = await submit
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (!ready) {
    const shown = ((await input.inputValue().catch(() => "")) ?? "").replace(
      /\D/g,
      "",
    );

    // Which way it is wrong, said plainly. Every country the widget offers
    // needs between eleven and thirteen digits in total, so a value outside
    // that is the setting and nothing else.
    const why =
      digits.length > LONGEST_INTERNATIONAL_NUMBER
        ? `TEST_ACCOUNT_PHONE carries ${digits.length} digits, which is more ` +
          `than any one number the widget accepts — it is holding more than ` +
          `one number. Set it to a single international number.`
        : digits.length < SHORTEST_INTERNATIONAL_NUMBER
          ? `TEST_ACCOUNT_PHONE carries ${digits.length} digits, which is too ` +
            `few for a full international number — the country code is most ` +
            `likely missing. Set it to the whole number, country code first ` +
            `and no "+".`
          : `The length is plausible for a full international number, so this ` +
            `is the login screen or the account, not the setting.`;

    expect(
      false,
      `the number was typed but the widget never drew its submit control, so ` +
        `it does not consider the number complete. It asks for an exact digit ` +
        `count — the country's dial code plus its national length, twelve for ` +
        `Syria — and the field is holding ${shown.length}. ${why}`,
    ).toBe(true);
  }

  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(
    auth.methodPhone(page),
    "the number was submitted but the widget never reached the choose-a-method screen",
  ).toBeVisible();
};

const OTP_GUARD_KEY = "otp_guard_v1";
const OTP_GUARD_FAKE_LOCK_MS = 120_000;

/** Seed a fake client-side OTP lock for the test number.
 *
 *  The PIN screen treats "no cooldown" as "code expired" and disables the
 *  input. Allow-listed staging numbers skip the real lock, so the widget
 *  immediately marks the code expired. A synthetic lock in sessionStorage
 *  keeps the input enabled for the duration of the test without touching the
 *  server. The method screen already made its decision before this is set. */
const seedOtpLock = async (page: Page, phone: string): Promise<void> => {
  const digits = phone.replace(/\D/g, "");
  await page.evaluate(
    ({ key, digits, expires }) => {
      const raw = window.sessionStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          locks: { ...(parsed?.locks ?? {}), [digits]: expires },
          numbers: parsed?.numbers ?? {},
        }),
      );
    },
    {
      key: OTP_GUARD_KEY,
      digits,
      expires: Date.now() + OTP_GUARD_FAKE_LOCK_MS,
    },
  );
};

/** Choose how the OTP should be sent.
 *
 *  The real send happens here through a server action. The action is not
 *  intercepted; the timeout has to cover a slow staging response. */
export const selectOtpMethod = async (
  page: Page,
  options: { method: OtpMethod; phone: string },
): Promise<void> => {
  const locator =
    options.method === "whatsapp"
      ? auth.whatsappMethod(page)
      : auth.smsMethod(page);
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.click();

  // The server action can fail and leave an error on this screen. Fail fast
  // with that message rather than waiting the full PIN-screen timeout.
  const pinVisible = await auth
    .otpInput(page)
    .waitFor({ state: "visible", timeout: SEND_OTP_MS })
    .then(() => true)
    .catch(() => false);

  if (!pinVisible) {
    const cooldown = await auth
      .otpCooldown(page)
      .textContent()
      .catch(() => null);
    const error = await auth
      .sendOtpError(page)
      .textContent()
      .catch(() => null);
    throw new Error(
      cooldown?.trim() ??
        error?.trim() ??
        "the PIN screen did not appear after sending the OTP",
    );
  }
};

export async function sendOtpWithRetry(
  page: Page,
  options: { method: OtpMethod; phone: string },
  maxAttempts = 5
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await selectOtpMethod(page, options);
      return; // success
    } catch (error: any) {
      // Try to extract a numeric cooldown from the error message
      const match = error.message?.match(/\d+/);
      if (match) {
        const seconds = parseInt(match[0], 10);
        console.log(`Cooldown detected, waiting ${seconds + 1} seconds...`);
        // wait for cooldown + 1s (using a Promise-based delay)
        await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000));
        // retry
        continue;
      }
      // Non‑cooldown error – rethrow
      throw error;
    }
  }
  throw new Error('Exceeded maximum retry attempts');
}
/** Type the OTP and submit it.
 *
 *  The hidden input fires `onComplete` once six digits are entered, which
 *  triggers the verify request. Allow-listed test numbers skip the real server
 *  lock, so the widget thinks the code is expired and disables the input. We
 *  seed a short client-side lock here, after the send succeeded and just before
 *  we need the input to be enabled. */
export const submitOtp = async (
  page: Page,
  options: { otp: string; phone: string },
): Promise<void> => {
  const input = auth.otpInput(page);
  await expect(input).toBeVisible();
  await seedOtpLock(page, options.phone);
  await expect(input).toBeEnabled({ timeout: AUTH_SCREEN_MS });
  await input.fill(options.otp);
};

/** Read the currently visible auth screen, if any. */
export const currentAuthScreen = async (
  page: Page,
): Promise<AuthScreen | null> => {
  const pairs: Array<[AuthScreen, Locator]> = [
    ["get-started", auth.getStartedTitle(page)],
    ["input-phone", auth.phoneInput(page)],
    // The number, not the Edit button beside it. Edit is omitted whenever the
    // account already owns the number — the re-verify path — and reading the
    // screen by it reported "no auth screen" for a screen that was plainly up.
    ["select-method", auth.methodPhone(page)],
    ["enter-pin", auth.otpInput(page)],
    ["welcome", auth.welcomeTitle(page)],
    ["input-name", auth.nameInput(page)],
    ["not-registered", auth.notRegisteredMessage(page)],
    ["registered", auth.AlreadyRegistered(page)],
  ];

  for (const [name, locator] of pairs) {
    if (await locator.isVisible().catch(() => false)) return name;
  }

  // The widget closes on success; if none of the screens are visible, treat it
  // as closed rather than unknown.
  const widgetOpen = await auth
    .getStartedTitle(page)
    .locator("..")
    .locator("..")
    .isVisible()
    .catch(() => true);
  return widgetOpen ? null : "closed";
};

/** Wait for the widget to land on a specific screen. */
export const waitForAuthScreen = async (
  page: Page,
  options: { screen: AuthScreen; timeout?: number },
): Promise<void> => {
  const deadline = Date.now() + (options.timeout ?? AUTH_SCREEN_MS);

  while (Date.now() < deadline) {
    const screen = await currentAuthScreen(page);
    if (screen === options.screen) return;
    await page.waitForTimeout(250);
  }

  const actual = await currentAuthScreen(page);
  throw new Error(
    `expected auth screen "${options.screen}" but was "${actual ?? "unknown"}"`,
  );
};

/** Read any visible OTP verify error without leaking the phone number. */
export const visibleVerifyError = async (
  page: Page,
): Promise<string | null> => {
  const text = await auth
    .verifyOtpError(page)
    .textContent()
    .catch(() => null);
  return text?.trim() ?? null;
};

/** Outcome of a complete auth attempt. */
export type AuthOutcome = {
  screen: AuthScreen;
  /** A visible error on the PIN screen, if any. */
  error: string | null;
};

/** Drive the whole widget flow from open to final screen.
 *
 *  Returns the screen the widget landed on and any verify error. */
export const attemptAuth = async (
  page: Page,
  options: {
    intent: "signup" | "login";
    phone: string;
    method: OtpMethod;
    otp: string;
  },
): Promise<AuthOutcome> => {
  await openLoginWidget(page);
  await chooseAuthIntent(page, { intent: options.intent });
  if (options.intent === "signup") await AgreeTerms({ page });
  await enterPhone(page, { phone: options.phone });
  await sendOtpWithRetry(page, { method: options.method, phone: options.phone });
  await submitOtp(page, { otp: options.otp, phone: options.phone });

  // After submit the widget may transition quickly (success) or stay on the
  // PIN screen (wrong code / rate limit / server error). Poll for a stable
  // screen instead of asserting immediately.
  const deadline = Date.now() + AUTH_SCREEN_MS;
  let lastScreen: AuthScreen | null = null;

  while (Date.now() < deadline) {
    const screen = await currentAuthScreen(page);
    if (screen === lastScreen && screen !== null) {
      return { screen, error: await visibleVerifyError(page) };
    }
    lastScreen = screen;
    await page.waitForTimeout(250);
  }

  const screen = (await currentAuthScreen(page)) ?? "closed";
  const error = await visibleVerifyError(page);
  return { screen, error };
};

// ---------------------------------------------------------------------------
// What a real sign-in leaves behind, judged one backend at a time.
// ---------------------------------------------------------------------------

/** What the app currently believes about the visitor.
 *
 *  Reduced **inside the page**, deliberately. `/api/auth/me` answers with the
 *  whole stored profile, which for a signed-in shopper carries their phone and
 *  e-mail; reducing in the browser means those never cross into the test
 *  process, where an assertion message would publish them. `whoAmI` above does
 *  the same thing for the same reason.
 *
 *  Booleans and one number. Nothing here is a name, a phone, or a token. */
export type SignedInSession = {
  /** Who the app says the visitor is. `null` when it can name nobody. */
  accountId: number | null;
  /** The one field that separates a signed-in shopper from a guest.
   *
   *  A plain guest also gets a stored profile — `/api/auth/register-device`
   *  writes one — so "there is a profile" proves nothing at all. This flag is
   *  what the app itself checks (`services/home.ts`). */
  phoneVerified: boolean;
  /** Did each backend's part of the sign-in land? */
  chat: boolean;
  stories: boolean;
  wallet: boolean;
};

const NOTHING_READ: SignedInSession = {
  accountId: null,
  phoneVerified: false,
  chat: false,
  stories: false,
  wallet: false,
};

/** Ask the app what it believes, and bring back only booleans and an id. */
export const signedInSession = async (
  page: Page,
): Promise<SignedInSession> => {
  const reduced = await page.evaluate(() =>
    fetch("/api/auth/me", { method: "POST", credentials: "include" })
      .then((response) => response.json())
      .then((body) => ({
        accountId: typeof body?.user?.id === "number" ? body.user.id : null,
        phoneVerified: body?.user?.is_phone_verified === 1,
        chat: Boolean(body?.chatUser),
        stories: Boolean(body?.storiesUser),
        wallet: Boolean(body?.walletUser),
      }))
      // Caught in the browser so no parser message — which quotes the input it
      // choked on — can reach the Node failure line.
      .catch(() => null),
  );

  return reduced ?? NOTHING_READ;
};

/** Which of the sign-in's own cookies the browser currently holds.
 *
 *  Names only, sorted. Never the records: an assertion that receives a cookie
 *  record prints its value into a public job log. */
export const signInCookiesHeld = async (page: Page): Promise<string[]> => {
  const jar = await page.context().cookies();
  return jar.map((cookie) => cookie.name).sort();
};

/** Is the storefront credential kept out of reach of page scripts? */
export const storefrontTokenIsHttpOnly = async (
  page: Page,
): Promise<boolean> => {
  const jar = await page.context().cookies();
  const record = jar.find((cookie) => cookie.name === COOKIE_NAMES.MARKET_TOKEN);
  // The boolean, never the record.
  return record?.httpOnly === true;
};

/** Prove a completed sign-in landed, one backend at a time.
 *
 *  Five backends answer a sign-in and each writes its own part of the session,
 *  so a shopper can be signed in to the storefront and not to the wallet with
 *  nothing on screen to say so. Every backend is therefore judged separately and
 *  **named** when its part is missing.
 *
 *  The judgements are made on values already in hand, so nothing here retries
 *  and nothing waits. They are `soft` so that one dead backend does not hide the
 *  other four — all five are reported in a single run, and the case still fails.
 *
 *  Where the app itself said which sub-service failed, that label is quoted, so
 *  the failure, the server log and Sentry all name the same backend. */
export const proveSignInLanded = async (
  page: Page,
  outcome: SignInOutcomeRecorder,
  session: SignedInSession,
): Promise<void> => {
  // Fail closed. Never having seen the sign-in answer is a failure to report,
  // not "nothing went wrong". Soft, like the judgements below, so that it
  // reports alongside them rather than hiding them.
  const answered = await outcome.waitForOutcome(SIGN_IN_ANSWER_MS);
  expect
    .soft(
      answered,
      "the sign-in answer was never seen, so no backend can be named — treat every judgement below as unproven",
    )
    .toBe(true);

  const held = await signInCookiesHeld(page);

  /** "…did not land" plus the app's own word for it, when it gave one. */
  const missing = (backend: BackendName, part: string): string =>
    outcome.named(backend)
      ? `${part} did not land (the app reported ${backend})`
      : `${part} did not land (the app reported no failure for it)`;

  // The storefront itself. Phone-verified, not "there is a profile" — a guest
  // has a profile too.
  expect
    .soft(session.phoneVerified, missing("COMMENTS", "the storefront sign-in"))
    .toBe(true);

  expect.soft(session.chat, missing("CHAT", "the chat sign-in")).toBe(true);
  expect
    .soft(session.stories, missing("STORIES", "the stories sign-in"))
    .toBe(true);
  expect.soft(session.wallet, missing("WALLET", "the wallet sign-in")).toBe(true);

  // Comments has no field in the app's answer, so it is read from the token it
  // leaves behind. Held **now**, by name — a token that was written and then
  // cleared must not read as "it landed".
  expect
    .soft(
      held.includes(COOKIE_NAMES.USER_ID_HASH),
      missing("COMMENTS", "the comments sign-in"),
    )
    .toBe(true);
};

// ---------------------------------------------------------------------------
// Proving a session still works after a reload.
// ---------------------------------------------------------------------------

/** Where the browser sends everything bound for a backend.
 *
 *  Client code never calls a backend directly; it posts here and the server
 *  attaches the credential (`utils/fetchData.ts`). So this is the one address a
 *  case can watch to see whether the stored credential is still accepted. */
const BACKEND_PROXY_PATH = "/api/proxy";

/** The cart read the drawer performs when it opens (`utils/functions.tsx`). */
const CART_READ_MARKER = "cart_shipping";

/** Do an ordinary authenticated thing, and prove the backend accepted it.
 *
 *  **Why this and not the absence of something.** A signed-in account whose
 *  credential is refused is *not* re-registered as a guest — the server returns
 *  the refusal untouched and the app asks the shopper to sign in again
 *  (`serverRequests/HandleAuthedFetch.ts`). So "no re-registration happened" is
 *  equally true of a working session and a dead one, and proves neither. Nor is
 *  it enough to look at what the app has stored: the stored profile is still
 *  there after the credential stops being accepted, which is exactly the failure
 *  worth catching.
 *
 *  What separates the two is whether a backend still answers. Opening the cart
 *  makes the app fetch it through the proxy above, so a successful answer to
 *  that fetch means the credential was accepted upstream — after a renewal, if
 *  one was needed. A renewal is a pass: the shopper stayed signed in, which is
 *  what the criterion is about.
 *
 *  Waiting for that answer is also what makes the checks that follow honest. The
 *  "sign in again" prompt is raised two round trips after the first refusal, so
 *  a case that looks for it the moment the cart is clicked always finds nothing.
 *  By the time this returns, the app has had its answer and has done whatever it
 *  was going to do. */
export const openCartAndProveBackendAnswered = async (
  page: Page,
): Promise<void> => {
  /** Is this the cart read?
   *
   *  The endpoint travels in a header, not the body — a `GET` through the proxy
   *  sends no body at all (`utils/fetchData.ts`), so there is nothing to match
   *  on there. The header carries the endpoint and the locale; the credential is
   *  attached on the server and is not among them. */
  const isCartRead = (response: Response): boolean => {
    let pathname: string;
    try {
      pathname = new URL(response.url()).pathname;
    } catch {
      return false;
    }
    if (pathname !== BACKEND_PROXY_PATH) return false;
    return (response.request().headers()["x-proxy-url"] ?? "").includes(
      CART_READ_MARKER,
    );
  };

  // Statuses only — numbers, never an address or a header value. Collected
  // rather than awaited once, because a refused credential is renewed and the
  // read is tried again: the first answer can legitimately be a refusal on a
  // session that then carries on working, and that is a pass.
  const answers: number[] = [];
  const collect = (response: Response) => {
    if (isCartRead(response)) answers.push(response.status());
  };
  page.on("response", collect);

  try {
    const button = nav.cartButton(page);
    await expect(button).toBeVisible();
    await button.click();

    await expect
      .poll(() => answers.includes(200), {
        timeout: CART_ANSWER_MS,
        message:
          "opening the cart never produced an answer from a backend, so the stored " +
          "credential is not being accepted. Answers seen: " +
          `[${answers.join(", ")}] (empty means the app never asked)`,
      })
      .toBe(true);
  } finally {
    page.off("response", collect);
  }
};

// ---------------------------------------------------------------------------
// Signing out.
// ---------------------------------------------------------------------------

/** How long the sign-out item has to appear once the menu is open.
 *
 *  The menu reads the store, and the store is filled by a client fetch that
 *  runs after the page is interactive — so this has to allow for that fetch
 *  noticing a refused credential, exchanging it and trying again. */
const SIGN_OUT_ITEM_MS = 20_000;

/** How much longer it is waited for **after** the budget above has run out.
 *
 *  Spent only on a run that is already failing, so it costs a healthy suite
 *  nothing. It exists to turn "it never came" into "it came at 23 seconds",
 *  which are two different findings with two different fixes. */
const SIGN_OUT_ITEM_LATE_MS = 25_000;

/** Why the open account menu offered no sign-out.
 *
 *  `shouldShowLogout` (`components/Home/Menu.tsx`) hides the item unless the
 *  **store** holds a user whose phone is neither empty nor `"0"`. Three quite
 *  different faults end there, and each needs the opposite action from the
 *  other two:
 *
 *    1. **The session was replaced.** On a credential the gateway will not
 *       renew, `/api/auth/expire` mints a fresh guest and rewrites `User-Data`
 *       (`app/api/auth/expire/route.ts`). `getCustomerInfo` then syncs that
 *       guest, and `updateUserInfo` **assigns** rather than merges
 *       (`store/auth/reducer.tsx`), so the shopper's phone is gone. The app is
 *       behaving as designed and the finding is the renewal, not the menu.
 *    2. **The store never got the profile.** Cookies still name a
 *       phone-verified shopper, so the session is alive and only the client
 *       copy is missing. That is a front-end fault, in this repository.
 *    3. **The account has no usable phone.** Then the menu is right to hide
 *       the item, and the case is asking for something the account cannot do.
 *
 *  Told apart by the app's own answer, read at the moment of the failure —
 *  never by guessing. `/api/auth/me` returns the `User-Data` cookie with the
 *  tokens stripped, which is the same copy the sync writes.
 *
 *  **The phone is never printed**, here or anywhere: only whether the app would
 *  call it usable, by the same rule the menu applies. Job logs and artifacts in
 *  this repository are public. */
/** What the app's two start-up calls answer, read by doing them again.
 *
 *  **Only ever called once a case has already failed**, because it reloads the
 *  page and a reload throws away whatever was on screen. That is the trade:
 *  the fault it explains is a store that never filled, and the only moment the
 *  filling can be watched is a page start — which by then is long gone.
 *
 *  Why these two calls and no others. `getClientData` (`services/home.ts`) is
 *  the only thing that fills the store's user on a normal page load, and it
 *  does them in one chain:
 *
 *    1. `GET /web/home/startingSettings`, and it **throws on a failure**.
 *    2. `getCustomerInfo` -> `GET /customer/info` -> `updateUserInfo`.
 *
 *  Step 2 is inside the same `try` as step 1, after it and awaiting it. So a
 *  settings read that fails takes the profile read down with it and the store
 *  keeps no user at all — with nothing on screen to say so. Naming which of the
 *  two answered is therefore the whole finding, and "the client copy is
 *  missing" without it is not.
 *
 *  Both leave through `POST /api/proxy` with the real address in `x-proxy-url`
 *  (`utils/fetchData.ts`), which is how they are recognised.
 *
 *  **Statuses only, never a body.** These answers carry the shopper's name and
 *  phone, and this repository's job logs are public. */
const whatTheBootCallsSaid = async (page: Page): Promise<string> => {
  const calls: Record<string, string> = {
    "/web/home/startingSettings": "was never sent",
    "/customer/info": "was never sent",
  };

  // **When**, not only whether. A store that fills at 23 seconds and a store
  // that never fills produce the same empty menu at 20, and they are a test
  // budget and an application fault respectively. The elapsed figure is the
  // only thing that separates them.
  let startedAt = Date.now();
  const since = (): string => `${Date.now() - startedAt}ms after the reload`;

  const onRequest = (request: import("@playwright/test").Request): void => {
    if (!request.url().includes("/api/proxy")) return;
    const target = request.headers()["x-proxy-url"] ?? "";
    for (const path of Object.keys(calls)) {
      if (target.includes(path) && calls[path] === "was never sent") {
        calls[path] = `was sent ${since()} and never answered`;
      }
    }
  };

  const onResponse = (response: import("@playwright/test").Response): void => {
    const request = response.request();
    if (!request.url().includes("/api/proxy")) return;
    const target = request.headers()["x-proxy-url"] ?? "";
    const path = Object.keys(calls).find((known) => target.includes(known));
    if (path === undefined) return;

    const status = response.status();
    const answeredAt = since();
    void response
      .text()
      .then((body) => {
        // `success` is the flag `getClientData` and `getCustomerInfo` both
        // branch on, and a `200` carrying `success: false` is exactly the case
        // that makes them throw. The status alone would call that one healthy.
        let success: unknown;
        try {
          success = (JSON.parse(body) as { success?: unknown }).success;
        } catch {
          success = "a body that is not JSON";
        }
        calls[path] = `answered ${status} with success=${String(success)}, ${answeredAt}`;
      })
      .catch(() => {
        calls[path] = `answered ${status} ${answeredAt}, and its body could not be read`;
      });
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  try {
    startedAt = Date.now();
    await page.reload({ waitUntil: "domcontentloaded" });
    // The chain is started on a timer after mount and the first call carries a
    // ten-second in-app wait of its own (`WaitForCondition`), so a short wait
    // here would report "never sent" for a call that was merely slow.
    await page.waitForTimeout(20_000);
  } catch {
    // A reload that fails is itself worth saying, and the readings below are
    // still the truth about what did and did not go out.
  } finally {
    page.off("request", onRequest);
    page.off("response", onResponse);
  }

  return Object.entries(calls)
    .map(([path, said]) => `${path} ${said}`)
    .join("; ");
};

const whySignOutIsMissing = async (page: Page): Promise<string> => {
  const said = await page.evaluate(() =>
    fetch("/api/auth/me", { method: "POST", credentials: "include" })
      .then((response) => response.json())
      .then((body) => ({
        accountId: typeof body?.user?.id === "number" ? body.user.id : null,
        phoneVerified: body?.user?.is_phone_verified === 1,
        phoneUsable:
          Boolean(body?.user?.phone) && String(body.user.phone) !== "0",
      }))
      // Caught in the browser so no parser message — which quotes the input it
      // choked on — can reach the Node failure line.
      .catch(() => null),
  );

  // The app's own marker for "this session died and I am asking them back in".
  // `ExpiredUser` arms it for a shopper who *was* verified, so it separates a
  // replaced session from one that was never signed in.
  const askedToSignInAgain = await prompt
    .sessionExpired(page)
    .isVisible()
    .catch(() => false);

  const opened = "the account menu opened but never offered sign-out";

  if (said === null) {
    return (
      `${opened}, and the app's own answer about who is signed in could not ` +
      `be read, so nothing here can say which fault this is`
    );
  }

  const who = said.accountId === null ? "no account" : `account ${said.accountId}`;

  if (!said.phoneVerified) {
    return (
      `${opened} — and the app is right: it no longer holds a phone-verified ` +
      `shopper, it holds ${who}. The session was replaced while this case was ` +
      `running. /api/auth/expire mints a guest when the credential cannot be ` +
      `renewed, so the finding is the renewal, not the menu. The app ` +
      `${askedToSignInAgain ? "is" : "is not"} showing the "please sign in ` +
      `again" prompt, which it arms only for a session that was verified.`
    );
  }

  if (!said.phoneUsable) {
    return (
      `${opened}, and the menu is right to hide it: the cookies name ${who} ` +
      `as phone-verified, but the account carries no usable phone, so ` +
      `shouldShowLogout can never be true for it. That is the account this ` +
      `case signs in as, not the session and not the menu.`
    );
  }

  // The session is alive and the client copy is missing. Which of the two
  // start-up calls failed is the finding, and it cannot be guessed — so the
  // page is started again and both are watched. This costs about half a minute
  // and it is spent only on a case that has already failed.
  const boot = await whatTheBootCallsSaid(page);

  return (
    `${opened}, yet the cookies still name ${who} as a phone-verified shopper ` +
    `with a usable phone — so the session is alive and only the client copy is ` +
    `missing. The store is filled by getCustomerInfo -> updateUserInfo ` +
    `(services/home.ts), and it did not arrive in ${SIGN_OUT_ITEM_MS}ms. ` +
    `${howTheClientStarted(page)}. ` +
    `Starting the page again, the two calls that fill it said: ${boot}. ` +
    `getClientData runs them in one chain and throws on the first, so a ` +
    `settings read that did not answer is the reason the profile read never ` +
    `went out. This one is a fault in this repository.`
  );
};

/** Open the account menu from the navigation bar.
 *
 *  The trigger carries the same marker whether or not the account has a picture,
 *  and the branch shown to a visitor who is not signed in carries it too — so
 *  the marker being there proves nothing about being signed in. What proves it
 *  is the sign-out item inside, which the app only offers to an account with a
 *  usable phone. */
export const openAccountMenu = async (page: Page): Promise<void> => {
  const trigger = auth.accountMenuTrigger(page);
  await expect(trigger).toHaveCount(1);

  const signOut = auth.signOutItem(page);
  const anyItem = auth.accountMenuAnyItem(page);

  // Opening the menu and finding sign-out in it are **two questions**, and the
  // first version of this asked them as one. That is what made `AUTH-03` fail
  // with a bare "Timeout 20000ms exceeded" naming nothing.
  //
  // First question: is the menu open? Pressed up to three times, because the
  // trigger is server-rendered and a press landing before React attaches does
  // nothing at all. **Never pressed while it is already open** — an open menu
  // lays a full-screen click-catcher over the page (the `setMenuOpen(false)`
  // div in `components/Home/Menu.tsx`), so the second press is swallowed by
  // that catcher and Playwright reports a click timeout instead of anything a
  // reader can act on. Settings answers this question because the menu renders
  // it whoever is looking.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await anyItem.isVisible().catch(() => false)) break;

    await trigger.click();
    await anyItem
      .waitFor({ state: "visible", timeout: 5_000 })
      .catch(() => undefined);
  }

  await expect(
    anyItem,
    "the account menu never opened — three presses on the trigger drew nothing",
  ).toBeVisible();

  // Second question: does it offer sign-out? A different thing entirely. The
  // menu decides that from the store's own user (`shouldShowLogout`, same
  // file), and the store is filled by a client fetch after the page is already
  // interactive. So a menu that is open with no sign-out in it may just be
  // ahead of that fetch — which is exactly what `AUTH-03` hit, on a page whose
  // cookies said signed-in and whose header still read "Hello ,".
  const waitingSince = Date.now();
  const offered = await signOut
    .waitFor({ state: "visible", timeout: SIGN_OUT_ITEM_MS })
    .then(() => true)
    .catch(() => false);
  if (offered) return;

  // **Missing at the budget is not the same as missing.** A store that fills at
  // twenty-three seconds and a store that never fills leave the same empty menu
  // at twenty, and they are two different findings: one is this budget, the
  // other is the app. So the wait is carried on once, and the answer goes in the
  // message. Only on the failing path — a healthy run has already returned.
  const lateBy = await signOut
    .waitFor({ state: "visible", timeout: SIGN_OUT_ITEM_LATE_MS })
    .then(() => Date.now() - waitingSince)
    .catch(() => null);

  if (lateBy !== null) {
    expect(
      false,
      `the account menu offered sign-out after ${lateBy}ms, which is inside ` +
        `the ${SIGN_OUT_ITEM_MS + SIGN_OUT_ITEM_LATE_MS}ms this waits in total ` +
        `but outside the ${SIGN_OUT_ITEM_MS}ms first budget. Nothing is broken ` +
        `in the app: the item arrives with the store's user, and the store is ` +
        `filled by getCustomerInfo (services/home.ts) over two round trips to ` +
        `staging. This budget is the thing to change, and this message is the ` +
        `measurement to change it by.`,
    ).toBe(true);
  }

  // **Close it and open it again.** One question, and it separates the two
  // findings that are left.
  //
  // The item is drawn from `shouldShowLogout` (`components/Home/Menu.tsx`),
  // which reads the store through `auth.getUser()` — a `getState()` call, not a
  // subscription. The menu is mounted when it is opened and unmounted when it
  // is closed (`{menuOpen && <Menu …/>}`, `UserNavTopSection.tsx`). So:
  //
  //   * it appears on a second opening — the store had the shopper all along
  //     and the **mounted** menu never re-read it. Nothing will fix that for a
  //     shopper except closing the menu, which no shopper knows to do.
  //   * it is still missing — the store really is empty, and the reading below
  //     says which call failed to fill it.
  const reopened = await (async () => {
    await page.keyboard.press("Escape").catch(() => undefined);
    await anyItem.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
    await trigger.click().catch(() => undefined);
    return await signOut
      .waitFor({ state: "visible", timeout: SIGN_OUT_ITEM_MS })
      .then(() => true)
      .catch(() => false);
  })();

  if (reopened) {
    expect(
      false,
      `the account menu offered no sign-out while it was open, and offered it ` +
        `as soon as it was closed and opened again. So the store held the ` +
        `shopper the whole time and the mounted menu never re-read it: ` +
        `shouldShowLogout calls auth.getUser(), which is a getState() read and ` +
        `not a subscription (components/Home/Menu.tsx). A shopper who opens ` +
        `the menu before the profile lands is left with no way to sign out.`,
    ).toBe(true);
  }

  // Only now, and only because it is missing, ask the app who it thinks it is.
  // The previous version of this asserted the answer instead of reading it: it
  // said "so it is treating this visitor as a guest" for a state it had never
  // looked at. Three different faults produce a menu with no sign-out in it,
  // and they need three different actions — so the reading below is what goes
  // in the message.
  expect(offered, await whySignOutIsMissing(page)).toBe(true);
};

/** Sign out, and wait until the visitor is a guest again.
 *
 *  Signing out ends by reloading the page, and the app then registers a fresh
 *  guest — so there are two settling steps, not one, and reading the cookie jar
 *  between them describes a state no shopper is ever left in.
 *
 *  **What this waits for is the guest landing, not a request being sent.** A
 *  request is recorded the moment it leaves the browser, while the cookies it
 *  replaces arrive on the answer; a wait keyed on the request therefore returns
 *  while the jar is still empty, and an empty jar makes every "it is gone" check
 *  pass for the wrong reason. The condition below can only become true once the
 *  replacement pair has actually been written:
 *
 *    * both credentials are **held** again, and
 *    * both **differ** from the ones the signed-in shopper had.
 *
 *  Held alone would be true before the sign-out; changed alone is satisfied by
 *  the deletion itself, because the comparison counts absent as different. Only
 *  the pair of them means "a new guest is here". */
export const signOutAndSettle = async (
  page: Page,
  options: { signedIn: CredentialSnapshot },
): Promise<void> => {
  await openAccountMenu(page);
  await auth.signOutItem(page).click();

  await expect
    .poll(
      async () => {
        const changed = await credentialsChangedSince(page, options.signedIn);
        const held = await credentialsHeld(page);
        return changed.access && changed.refresh && held.length === 2;
      },
      {
        timeout: SIGN_OUT_SETTLE_MS,
        message:
          "signing out never settled: the replacement guest's credentials never arrived. " +
          "If the reload redirected instead of rendering, the sign-out guard is still set and " +
          "the app registers no guest at all — that is the guard, not the sign-out.",
      },
    )
    .toBe(true);
};