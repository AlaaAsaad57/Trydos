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

import { expect, type Page } from "@playwright/test";

import { arriveAsGuest } from "./locale";
import { LIVE_ORIGIN } from "../harness/env";
import { credentialsHeld, type AuthCallRecorder } from "../harness/session";

/** How long each part of booting is allowed to take.
 *
 *  Explicit, and every one of them shorter than the suite defaults it would
 *  otherwise inherit (45s navigation, 20s action). The reason is arithmetic:
 *  this work happens **before** a case's measured window opens, and the whole
 *  case still has to finish inside the suite's 90-second per-case timeout. With
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
const servedCountry = async (): Promise<{ country: string; language: string }> => {
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
