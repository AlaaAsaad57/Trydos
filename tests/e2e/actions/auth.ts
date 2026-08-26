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

import { auth, nav } from "../selectors";

import { arriveAsGuest } from "./locale";
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

/** Open the login widget from the nav bar and wait for the first screen. */
export const openLoginWidget = async (page: Page): Promise<void> => {
  const button = auth.loginButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect(auth.getStartedTitle(page)).toBeVisible();
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
  const submit = auth.submitPhoneButton(page);
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
  await trigger.click();
  await expect(auth.signOutItem(page)).toBeVisible();
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