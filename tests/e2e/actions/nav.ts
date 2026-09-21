// Getting around the storefront.
//
// The rules every action in this folder follows (see
// docs/testing/E2E_TEST_DESIGN.md section 7):
//
//   1. `page` first, then one options object. Never positional booleans.
//   2. An action asserts its own success, so a spec does not repeat "expect this
//      to be visible" after every step.
//   3. An action returns what the spec needs, so nothing reads the DOM twice.
//   4. An action never takes a raw selector. That would put locators back in
//      specs, which is what `selectors.ts` exists to prevent.
//   5. A case that can fail is a separate `attempt*` function returning an
//      outcome, not a flag on the happy one.

import { expect, type Page } from "@playwright/test";

import { LIVE_ORIGIN } from "../harness/env";

/** How long a product page gets to draw its title after the address changes.
 *
 *  The suite's default is 15s, and that is not enough. Measured on this
 *  repository against staging, opening the first product of a run takes about
 *  12s end to end — the route renders server-side and waits on the catalogue
 *  search before it has a title to draw. Three seconds of headroom is not a
 *  budget, and it showed: `guest.live.spec.ts:70` failed on exactly this step
 *  in 4 of 16 CI runs while passing 3 of 3 locally, because the CI runner is
 *  slower than the machine the 15s was never chosen on.
 *
 *  Set to match the navigation allowance in the same helpers, so the whole
 *  "open a product" journey has one budget instead of a generous first half and
 *  a tight second half. Still far below the 120s per-test limit, so a product
 *  page that genuinely never renders is still reported as a failure. */
const PRODUCT_RENDER_MS = 45_000;

/** How long the country picker gets to draw its list, per attempt.
 *
 *  Half of what the single attempt used to get, because there are two now: the
 *  first mount and one reload. The total is unchanged, and a lost `getCountries`
 *  is answered by asking again rather than by waiting longer — see
 *  `chooseRegionIfAsked`. */
const COUNTRY_LIST_MS = 22_000;
import {
  home,
  listing,
  nav,
  product,
  region,
  search,
  staticPage,
} from "../selectors";

/** Can the country picker appear at all on the address the page is on?
 *
 *  `shouldShowBluredInfo` (`components/Home/Init.tsx:66-71`) is the app's own
 *  rule, and it reads nothing but the address: the picker is drawn when the
 *  locale prefix is `gb-` — the global bucket, "we do not know where you are" —
 *  or when the address carries `no-country` or `changed-country`. `proxy.ts`
 *  adds `no-country` in one place only, its last fallback (`:653`), which is
 *  reached when neither a saved cookie nor a geo header gave a country.
 *
 *  So on any other address there is nothing to wait for, and this is worth
 *  asking because most navigations in this suite are exactly that. `seedLocale`
 *  saves a valid country and language before `gotoAbout` and `gotoStaticPage`,
 *  and `gotoUnderLocale` (`actions/profile.ts`) opens a path that already
 *  carries its prefix. In both cases the proxy answers with a served page and
 *  no marker, so the picker cannot be drawn.
 *
 *  Measured before this check existed, on CI run 34956076865: all five
 *  `staticPages.live` cases took 10.3s each — a `domcontentloaded` goto to a
 *  static page plus two visibility reads, so about ten of those seconds were
 *  the wait below timing out against a picker that was never coming. Around
 *  fifty navigations in the suite paid the same toll.
 *
 *  `gotoHome` is the case this must not break. It opens `/` with no cookie
 *  seeded, so the proxy really does land it on the `no-country` fallback and
 *  the picker really is drawn — this returns true there and the full wait
 *  runs. */
const canAskForCountry = (page: Page): boolean => {
  const url = new URL(page.url());
  const prefix = url.pathname.split("/")[1] ?? "";

  return (
    prefix.startsWith("gb-") ||
    url.searchParams.has("no-country") ||
    url.searchParams.has("changed-country")
  );
};

/** Deal with the "Select Your Region" popup, if it is showing.
 *
 *  **It is showing far less often than this comment used to claim.** The old
 *  wording said "more or less always", and that was true only of a navigation
 *  that seeds no country: the app reads the country from a geo header, the
 *  server is reached over loopback, so there is no header, so the proxy sends
 *  the visitor to `?no-country=true` and asks. `gotoHome` is that navigation.
 *  Every other entry point here saves a country first, and on those the popup
 *  cannot be drawn at all — see `canAskForCountry` above, which is why this no
 *  longer waits ten seconds to find that out.
 *
 *  When it does show it is a real modal — `fixed inset-0` with a backdrop — and
 *  it swallows every click until a country is chosen, which is why an unrelated
 *  test would otherwise fail on its first click with a confusing "element
 *  intercepts pointer events".
 *
 *  Which country: the first one offered. The list is whatever the backend
 *  says is available (Iraq, Lebanon, Syria, Türkiye at the time of writing) and
 *  hard-coding one would make every journey fail the day that list changes.
 *
 *  Returns whether it had to do anything, so a spec about the popup itself can
 *  assert on it rather than guess. */
export const chooseRegionIfAsked = async (
  page: Page,
): Promise<{ chosen: boolean; iso?: string }> => {
  const backdrop = region.backdrop(page);
  const popup = region.popup(page);

  // Asked before anything is waited for. The picker is a function of the
  // address (see `canAskForCountry`), so an address that cannot ask is settled
  // now rather than after the timeout below has run out. The wait itself is
  // left at its full length for the address that *can* ask — a picker that is
  // genuinely coming still gets every second it had.
  if (!canAskForCountry(page)) return { chosen: false };

  // Two waits, and splitting them fixed a real failure.
  //
  // The **backdrop** is up as soon as the app knows it has no country, so a
  // short wait is right for it: on a page that is not going to ask, this is
  // pure waiting.
  //
  // The **list** arrives later. The component spends a moment on a "Preparing
  // your experience" screen while it fetches the countries, and
  // `Change-Url-Container` does not exist until that answer lands. The single
  // 10-second wait this used to be gave up during that fetch and returned "no
  // popup" — leaving a full-screen backdrop over the page, so the next click in
  // the case landed on it and failed with "intercepts pointer events" somewhere
  // unrelated. Once the backdrop is known to be there, the list is worth waiting
  // properly for.
  const showing = await backdrop
    .waitFor({ state: "visible", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!showing) return { chosen: false };

  // The list, with **one reload if it does not come**.
  //
  // `Change-Url-Container` does not exist until `getCountries`
  // (`components/settings/PersonalInfoCountries.tsx`) answers, and that is a
  // gateway call made once, on mount, with no retry of its own. When it is lost
  // the component sits on its "Preparing your experience" screen for ever: the
  // page is up, the backdrop covers it, and nothing will ever arrive. Waiting
  // longer cannot help, because there is no second request to wait for.
  //
  // A reload is the whole fix: it mounts the component again and asks again.
  // Safe here by construction — this runs immediately after a navigation, so
  // there is no work in the page to lose.
  //
  // Seen locally on 2026-09-21: `QA-01` spent its whole 45 seconds on a popup
  // whose list was never coming, on the first home-page visit of the run.
  const listed = await popup
    .waitFor({ state: "visible", timeout: COUNTRY_LIST_MS })
    .then(() => true)
    .catch(() => false);

  if (!listed) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await backdrop.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    await expect(
      popup,
      "the country popup is covering the page and never offered a country to " +
        "pick, and it was asked twice. The list is a gateway call — " +
        "`getCountries` in `components/settings/PersonalInfoCountries.tsx` — " +
        "made once on mount with no retry, so a popup stuck on its loading " +
        "screen means that call did not answer. The popup itself is fine",
    ).toBeVisible({ timeout: COUNTRY_LIST_MS });
  }

  const first = region.anyCountry(page).first();
  await expect(first).toBeVisible();

  // Which country this is, so we can wait for the URL that proves we arrived.
  const iso = ((await first.getAttribute("data-pw")) ?? "")
    .replace("personal-info-countries-", "")
    .toLowerCase();

  await first.click();

  // Wait for the navigation to actually land, and this wait is the whole point
  // of the function.
  //
  // `changeCountry` (components/settings/PersonalInfoCountries.tsx) sets the
  // country cookie **immediately**, then awaits a starter-settings round trip to
  // staging, and only then assigns `window.location.href`. So there is a window,
  // as long as that request takes, where the cookie already says the new country
  // while the page still lists the old one's products. Click a card in that
  // window and the server resolves an old-country slug against the new country,
  // answers `productNotFound`, and redirects to `?message=product_not_found`.
  //
  // A person never sees this — they cannot click faster than the round trip. A
  // test hits it every single time. Waiting for the URL closes the window.
  //
  // `domcontentloaded`, not the `waitUntil: "load"` default: `load` waits for
  // every last resource — analytics, fonts, CDN media, and any storefront fetch
  // still retrying against staging — and on a runner that outlives the timeout.
  // The URL is what this wait is about, and it is settled once the document
  // parses. `page.goto` below already says the same thing for the same reason.
  await page.waitForURL(new RegExp(`/${iso}-`), {
    timeout: 45_000,
    waitUntil: "domcontentloaded",
  });
  // The **backdrop**, not the list. The list can go while the backdrop stays —
  // the component falls back to its loading screen inside the same overlay — and
  // it is the backdrop that swallows clicks, so that is what has to be gone
  // before this returns.
  await expect(
    backdrop,
    "the country popup's backdrop is still covering the page after a country was chosen",
  ).toBeHidden({ timeout: 30_000 });

  return { chosen: true, iso };
};

/** Open the storefront home page and wait for it to be usable.
 *
 *  "Usable" is the logo being visible and nothing modal covering it — not `load`
 *  firing. This is a streamed React app, so the document finishes long before
 *  the page is worth clicking.
 *
 *  Goes to `/` rather than a fixed locale path on purpose: the app decides the
 *  country and language, and a journey that hard-codes `/gb-en` is asserting the
 *  redirect rather than using it.
 *
 *  ---------------------------------------------------------------------------
 *  **Do not "save a country first" to skip the picker. It was tried, and it
 *  broke nine cases.**
 *
 *  The idea was sound on paper: opening `/` with nothing saved sends the visitor
 *  to `/gb-en?no-country=true`, the picker is drawn, and every call here pays
 *  for a backdrop wait, a country list, a click, a starter-settings round trip
 *  and a full page reload — three of them gateway calls. Seeding `iq` removes
 *  all five.
 *
 *  It also moves the home page this suite renders from `/gb-en` to `/iq-en`, and
 *  that is what broke. On CI runs 35626155490 and 35632583274 the account lane
 *  then produced **fifteen** of these, where the two runs before my change had
 *  none at all:
 *
 *      ⨯ unhandledRejection: Error: Filling a cache during prerender timed out…
 *          at getCachedCurrency (…/app-page-turbo.runtime.prod.js)
 *
 *  `serverRequests/cached/currency.ts` wraps the gateway currency call in
 *  `"use cache"`. When that fill does not finish in time the whole route bails
 *  out with `NEXT_STATIC_GEN_BAILOUT` and **no document is produced**, so
 *  `page.goto` times out with nothing to say. Nine cases failed that way, the
 *  same nine in both runs: AUTH-02, CMT-01, PROF-07, QA-01, QA-02, QA-02b,
 *  QA-06, QA-09a, QA-09b.
 *
 *  Only the account lane was hit; the solo lane renders `/iq-en` all day. So
 *  there is a real fragility in the app here and it deserves its own ticket —
 *  but it is not this suite's to expose by changing where it browses. */
export const gotoHome = async (page: Page): Promise<void> => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);
  await expect(nav.logo(page)).toBeVisible();
};

/** The country the suite shops in unless a case asks for another one.
 *
 *  The fallback list the app uses is [tr, iq, lb, sy]; any of them works, and
 *  `iq` is the one the rest of the suite assumes. */
export const DEFAULT_TEST_COUNTRY = "iq";

/** The only country the shop offers cash on delivery in.
 *
 *  **A rule about the shop, not about this suite.** Cash on delivery is the one
 *  payment these tests are allowed to use — every other method takes real money
 *  or a real card — so any case that pays has to shop in Syria. In `iq`, `tr` or
 *  `lb` the cart answer comes back with no `cash_on_delivery` in
 *  `available_payment_method`, `components/Cart/PaymentMethod.tsx` draws no
 *  cash-on-delivery row, and the journey fails at the payment step with nothing
 *  wrong in this repository.
 *
 *  Seen on 2026-09-05: BUY-01 ran in `iq` and failed with "the shop offered no
 *  cash-on-delivery method for this country and this bag". */
export const CASH_ON_DELIVERY_COUNTRY = "sy";

/** Save a known-served country and language before the first navigation.
 *
 *  Without this the country picker opens over the page and swallows every
 *  click.
 *
 *  Exported for `actions/qaProduct.ts`, which opens the QA product by address
 *  rather than through any of the entry points here and would otherwise need
 *  its own copy of these three cookies. This repository already has helpers
 *  that exist twice and have drifted apart; one more would be one too many.
 *  Still not for a spec: a spec that needs a country needs an action. */
export const seedLocale = async (
  page: Page,
  country: string = DEFAULT_TEST_COUNTRY,
): Promise<void> => {
  await page.context().addCookies([
    { name: "country", value: country, url: LIVE_ORIGIN },
    { name: "lang", value: "en", url: LIVE_ORIGIN },
    { name: "language", value: "en", url: LIVE_ORIGIN },
  ]);
};

/** Wait until a closed popup has given its history entry back.
 *
 *  **Why this exists: a popup that has gone from the screen can still cancel
 *  the next `page.goto`.**
 *
 *  Every popup in this app -- the cart, the login widget, the search overlay,
 *  stories -- mounts `components/global/ParamsUpdater.tsx`, which pushes a
 *  synthetic `{ isPopup: true }` history entry and puts its own key in the
 *  query (`?cart=true`). Closing the popup unmounts that component, and its
 *  cleanup does **not** run straight away: it defers on `setTimeout(..., 0)`
 *  and then calls `window.history.back()` to take the entry off again.
 *
 *  So there is a gap. The drawer is already hidden and the line count already
 *  reads zero, while the entry is still on the stack. A `page.goto` started
 *  inside that gap is a navigation in flight when the deferred `history.back()`
 *  fires, and the history step cancels it. Chromium reports that as
 *  `net::ERR_ABORTED`, on an address that is perfectly fine.
 *
 *  Measured locally against the dev server, closing the cart and navigating at
 *  once: **3 aborts in 18 runs** without this wait, **0 in 18** with it. Every
 *  one of those three was a run where `history.state.isPopup` still read true
 *  after the drawer had gone, and no run that saw the entry already given back
 *  ever aborted -- which is the mechanism above, and not a guess about it.
 *
 *  On CI it is far more frequent -- `BUY-01`, `BUY-03` and `BUY-04` all failed
 *  this way on run 35500435758, every one of them right after `emptyTheBag`,
 *  while `BUY-02` (the one BUY case that never opens the bag first) passed on
 *  the same product address in the same run.
 *
 *  **This is not the shopper's path.** When a shopper clicks a link the app
 *  sets `isNavigating`, and `ParamsUpdater` then leaves history alone on
 *  purpose. Nothing sets that flag for a `page.goto`, so the guard the app
 *  already has cannot help this suite. Hence a wait here rather than a change
 *  to the app.
 *
 *  Fails loudly rather than quietly timing out: an entry that is never given
 *  back means the next navigation in the journey is unsafe, and the caller
 *  should hear which popup did it. */
export const waitForPopupHistorySettled = async (
  page: Page,
  options: { popup: string },
): Promise<void> => {
  await page
    .waitForFunction(
      () => (window.history.state as { isPopup?: boolean })?.isPopup !== true,
      undefined,
      { timeout: POPUP_HISTORY_MS },
    )
    .catch(() => {
      throw new Error(
        `the ${options.popup} closed on screen but never gave its history ` +
          `entry back, so the next navigation would be cancelled. The address ` +
          `still reads ${page.url()}`,
      );
    });
};

/** How long a closed popup gets to take its own history entry off the stack.
 *
 *  The cleanup runs on a `setTimeout(..., 0)`, so this is only ever waiting out
 *  one task plus the history step. Generous on purpose: a slow CI runner under
 *  load is the case this has to cover, and a popup that genuinely never lets go
 *  still ends in the error above rather than in silence. */
const POPUP_HISTORY_MS = 10_000;

/** Open a plain page that does not depend on Elasticsearch or the home listing.
 *
 *  Auth specs use this so a staging search outage does not hide the auth
 *  widget, which lives in the nav bar on every page. */
export const gotoAbout = async (
  page: Page,
  options: { country?: string } = {},
): Promise<void> => {
  await seedLocale(page, options.country);

  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);
  await expect(nav.logo(page)).toBeVisible();
};

/** Type a term into the storefront search and wait for results.
 *
 *  Returns how many result links came back. Zero is a legitimate answer for a
 *  term staging has nothing for — the caller decides whether that is a failure,
 *  because that judgement belongs to the spec and not here. */
export const searchFor = async (
  page: Page,
  options: { term: string },
): Promise<{ results: number }> => {
  // Search opens rather than sitting there ready. The input is in the DOM from
  // the start but renders `disabled`; clicking the icon is what sets
  // `searchEnabled` (components/Home/Search/SearchIcon.tsx). Going straight for
  // the input waits forever on "element is not enabled".
  const icon = search.icon(page);
  await expect(icon).toBeVisible();

  const input = search.input(page);
  await expect(input).toBeVisible();

  // **Clicked until it opens, not clicked once.**
  //
  // The icon's `onClick` is the only thing that sets `searchEnabled`, and it is
  // React's handler — so a click that lands before the page has hydrated does
  // nothing at all, and the input stays `disabled` for ever. A single click then
  // fails thirty seconds later with `Received: disabled`, which reads like a
  // broken search box and is really a click that arrived too early.
  //
  // It went unnoticed while `gotoHome` walked through the country picker,
  // because choosing a country reloads the whole page and the reload left plenty
  // of time to hydrate. Seeding the country removed the reload and the race came
  // out at once — measured on a local solo run on 2026-09-21.
  //
  // Two seconds between tries, and the same thirty-second budget as before: a
  // search box that genuinely never opens is still reported.
  await expect
    .poll(
      async () => {
        if (await input.isEnabled().catch(() => false)) return true;
        await icon.click().catch(() => undefined);
        return await input.isEnabled().catch(() => false);
      },
      {
        timeout: 30_000,
        intervals: [500, 1_000, 2_000, 2_000, 2_000],
        message:
          "the search box never became usable. Clicking the icon is what " +
          "enables it (`searchEnabled` in " +
          "`components/Home/Search/SearchIcon.tsx`), so an input that stays " +
          "disabled means the click never reached React",
      },
    )
    .toBe(true);

  await input.fill(options.term);

  // The result list is debounced and fetched, so the first link appearing is the
  // signal. A term with no matches never produces one, hence the tolerated
  // timeout rather than an assertion.
  const firstResult = search.resultLink(page).first();
  await firstResult
    .waitFor({ state: "visible", timeout: 20_000 })
    .catch(() => undefined);

  return { results: await search.resultLink(page).count() };
};

/** Open a product page from whatever listing is currently on screen.
 *
 *  Returns the product's name and the URL it landed on, which is what a spec
 *  wants to assert or carry into the next step. */
export const gotoFirstProduct = async (
  page: Page,
): Promise<{ name: string; url: string }> => await gotoProductAt(page, { index: 0 });

/** Open the nth product from whatever listing is currently on screen.
 *
 *  Counted from 0. A journey that has to find a product it can actually buy
 *  needs more than the first one — not every product in a real shop is in stock
 *  — and this is how it walks along the row.
 *
 *  Returns `null` when the listing has no card at that position, so a caller can
 *  say "I looked at every product on this page" rather than time out. */
export const gotoProductAtOrNull = async (
  page: Page,
  options: { index: number },
): Promise<{ name: string; url: string } | null> => {
  const link = listing.cardLink(page).nth(options.index);
  if ((await link.count()) === 0) return null;
  return await gotoProductAt(page, options);
};

const gotoProductAt = async (
  page: Page,
  options: { index: number },
): Promise<{ name: string; url: string }> => {
  // Only the real product-card hook.
  //
  // An earlier version fell back to any `a[href*="/products/"]`, which looked
  // safer and was not: category tiles use the same path shape
  // (`/products/Bodysuits-253`), so the fallback happily clicked a category and
  // the app bounced it to `?message=product_not_found`. A locator that matches
  // the wrong thing is worse than one that matches nothing, because it fails
  // somewhere else and blames the app.
  const link = listing.cardLink(page).nth(options.index);

  await expect(
    link,
    `no product card at position ${options.index} on this page — is this a listing surface?`,
  ).toBeVisible();
  await link.click();

  // `toHaveURL` rather than `waitForURL`: when it fails it says which URL it got
  // instead of only that it timed out, and "the click went somewhere else" is
  // the failure this is most likely to hit.
  await expect(page).toHaveURL(/\/products\//, { timeout: 45_000 });

  // **Two faults, two messages.** The old single `toBeVisible` covered both with
  // words that only described the first, and the second is the one staging
  // actually serves.
  //
  // An element with no text has no size, so it is "hidden" — and a product the
  // shop sent with **no name** renders this element present and blank.
  // `getProductText` (`components/Server/product/ProductNameAndBrand.tsx`)
  // joins the product name with its category names, and
  // `[undefined].join(" | ")` is the empty string. So "no title was ever drawn
  // on it" was reported for a page that rendered perfectly — sizes, reviews,
  // guarantees and all — carrying a catalogue record with nothing to name it.
  //
  // Polled rather than asserted straight away, because the page streams: the
  // element can be attached and still empty for a moment before the name lands.
  const name = product.name(page);
  const deadline = Date.now() + PRODUCT_RENDER_MS;
  let attached = false;
  let text = "";

  while (Date.now() < deadline) {
    attached = (await name.count()) > 0;
    if (attached) {
      text = (await name.textContent().catch(() => null))?.trim() ?? "";
      if (text !== "") break;
    }
    await page.waitForTimeout(250);
  }

  expect(
    attached,
    `the address changed to a product page and it never drew a title element ` +
      `at all, so the page itself did not render: ${page.url()}`,
  ).toBe(true);

  // Named as the backend's, because it is. Nothing in this repository can make
  // a product have a name, so this failure must not read like a page that broke
  // — it has to send the reader to the catalogue.
  expect(
    text,
    `the shop sent a product with no name, so the product page drew an empty ` +
      `title: ${page.url()}. The title element is on the page and blank — the ` +
      `product answer carries no \`name\` and no categories, which ` +
      `\`getProductText\` joins to the empty string. The page is fine; the ` +
      `catalogue record is not, so this is the core backend's to fix.`,
  ).not.toBe("");

  return { name: text, url: page.url() };
};

/** The country-and-language prefix the app chose for this run — `"iq-en"`.
 *
 *  Never hard-coded: reached over loopback there is no geo header, so which
 *  country a run lands on is the backend's answer and not ours. Read it off the
 *  address after any navigation.
 *
 *  Returns `""` when the address carries no prefix, which means no storefront
 *  page has been opened yet. Callers say so themselves, because "you have not
 *  navigated" and "the app dropped the prefix" are different faults and only
 *  the caller knows which one it was expecting.
 *
 *  Lives here rather than in one of the feature action files because three of
 *  them need it — settings, the checklist and compare — and three copies of a
 *  regular expression is how they drift apart. */
export const localePrefix = (page: Page): string => {
  const first = new URL(page.url()).pathname.split("/")[1] ?? "";
  // "iq-en" — country first, then language.
  return /^[a-z]{2}-[a-z]{2}$/.test(first) ? first : "";
};

/** The country and language the app is currently serving, split apart.
 *
 *  Both are needed whenever a case asks a backend a question through
 *  `/api/proxy`, which takes them as separate values. */
export const localeParts = (
  page: Page,
): { country: string; language: string } => {
  const [country = "", language = ""] = localePrefix(page).split("-");
  return { country, language };
};

/** Where the window is, in pixels from the top of the document. */
export const readScrollPosition = (page: Page): Promise<number> =>
  page.evaluate(() => window.scrollY);

/** Who answers for the scroll position when the browser goes back or forward.
 *
 *  `"auto"` is the browser itself and is the default. The app switches it to
 *  `"manual"` for one journey only — an intercepted overlay, whose base page the
 *  browser would otherwise put back at the top — and has to hand it straight
 *  back. Left on `"manual"`, every ordinary Back in the app quietly stops
 *  restoring where the visitor was, and nothing looks broken until someone
 *  notices they keep losing their place. */
export const readScrollRestoration = (page: Page): Promise<string> =>
  page.evaluate(() => history.scrollRestoration);

/** Scroll the home page down to its last boutique and stop there.
 *
 *  The boutique list is an infinite scroll (`components/global/InfinteScroll`),
 *  so "the last one" is not a fixed place: reaching the bottom loads more and
 *  the document grows underneath. This loads pages until the count stops
 *  changing, then parks on the last card — a deep position that stays put,
 *  which is what a journey about coming back to a place needs.
 *
 *  Returns where the window ended up and how many boutiques are on the page. */
export const scrollHomeToLastBoutique = async (
  page: Page,
  options: { maxRounds?: number } = {},
): Promise<{ scrollY: number; boutiques: number }> => {
  const cards = home.boutiqueCard(page);

  await expect(
    cards.first(),
    "the home page listed no boutiques at all — is the search backend serving?",
  ).toBeVisible();

  // Scroll, count, repeat until a round adds nothing. `expect.poll` rather than
  // a sleep so a slow staging answer waits and a fast one does not.
  let seen = 0;
  const rounds = options.maxRounds ?? 12;
  for (let round = 0; round < rounds; round++) {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    const grew = await expect
      .poll(async () => await cards.count(), { timeout: 8_000 })
      .toBeGreaterThan(seen)
      .then(() => true)
      .catch(() => false);
    if (!grew) break;
    seen = await cards.count();
  }

  const last = cards.last();
  await last.scrollIntoViewIfNeeded();

  const scrollY = await readScrollPosition(page);
  expect(
    scrollY,
    "the home page did not scroll at all, so nothing here can be about coming back to a place",
  ).toBeGreaterThan(0);

  return { scrollY, boutiques: await cards.count() };
};

/** Open a product from the strip under the last boutique on the home page.
 *
 *  This is the journey a shopper takes from deep in the home page, and it is
 *  not the same one as `gotoFirstProduct`: that one clicks a product card in a
 *  row near the top, so it never leaves the first screen. */
export const openProductFromLastBoutique = async (
  page: Page,
): Promise<{ url: string }> => {
  const link = home.boutiqueProductLink(page).last();

  await expect(
    link,
    "no boutique strip on the home page held a product tile",
  ).toBeVisible();
  await link.scrollIntoViewIfNeeded();
  await link.click();

  await expect(page, "the tile did not open a product page").toHaveURL(
    /\/products\//,
    { timeout: 45_000 },
  );
  await expect(
    product.name(page),
    "the product page opened with no title on it",
  ).toBeVisible({ timeout: PRODUCT_RENDER_MS });

  return { url: page.url() };
};

/** Press the product page's own back arrow and wait until it is gone. */
export const leaveProductPage = async (page: Page): Promise<void> => {
  const back = product.backButton(page);

  await expect(back, "the product page drew no back arrow").toBeVisible();
  await back.click();

  await expect(
    page,
    "the back arrow did not leave the product page",
  ).not.toHaveURL(/\/products\//, { timeout: 45_000 });
};

/** Open a static "trust" page (About, Contact, Privacy, Terms) and wait for
 *  its title to render.
 *
 *  The slug is given without a locale, the way a visitor arriving from an app
 *  store or a bookmark has it. It returns the visible title so a spec can name
 *  the page that actually loaded rather than settle for "something rendered". */
export const gotoStaticPage = async (
  page: Page,
  options: { slug: string },
): Promise<{ title: string }> => {
  await seedLocale(page);

  await page.goto(`/${options.slug}`, { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);

  const titleLocator = staticPage.title(page);
  await expect(titleLocator).toBeVisible();

  return {
    title: (await titleLocator.textContent())?.trim() ?? "",
  };
};

// `openCart` used to live here and does not any more. It is in `actions/cart.ts`
// with the rest of the bag, and it now waits for the cart read to settle instead
// of returning the moment the control is pressed — this copy asserted nothing
// despite what its comment claimed.
