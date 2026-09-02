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
import {
  home,
  listing,
  nav,
  product,
  region,
  search,
  staticPage,
} from "../selectors";

/** Deal with the "Select Your Region" popup, if it is showing.
 *
 *  It is showing more or less always in this suite. The app works the country
 *  out from a geo header, the server is reached over loopback, so there is no
 *  header, so it redirects to `?no-country=true` and asks. The popup is a real
 *  modal — `fixed inset-0` with a backdrop — and it swallows every click until a
 *  country is chosen, which is why an unrelated test would otherwise fail on its
 *  first click with a confusing "element intercepts pointer events".
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
  const popup = region.popup(page);

  // Short wait, not the default: on a page that has no popup this is pure
  // waiting, and the popup is rendered as soon as the country is known to be
  // missing rather than after a fetch.
  const showing = await popup
    .waitFor({ state: "visible", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  if (!showing) return { chosen: false };

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
  await expect(popup).toBeHidden({ timeout: 30_000 });

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
 *  redirect rather than using it. */
export const gotoHome = async (page: Page): Promise<void> => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);
  await expect(nav.logo(page)).toBeVisible();
};

/** Save a known-served country and language before the first navigation.
 *
 *  Without this the country picker opens over the page and swallows every
 *  click. The fallback list the app uses is [tr, iq, lb, sy]; any of them
 *  works, and `iq` is the one the rest of the suite assumes.
 *
 *  Private on purpose: a spec that needs it needs an action, not the cookies. */
const seedLocale = async (page: Page): Promise<void> => {
  await page.context().addCookies([
    { name: "country", value: "iq", url: LIVE_ORIGIN },
    { name: "lang", value: "en", url: LIVE_ORIGIN },
    { name: "language", value: "en", url: LIVE_ORIGIN },
  ]);
};

/** Open a plain page that does not depend on Elasticsearch or the home listing.
 *
 *  Auth specs use this so a staging search outage does not hide the auth
 *  widget, which lives in the nav bar on every page. */
export const gotoAbout = async (page: Page): Promise<void> => {
  await seedLocale(page);

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
  await icon.click();

  const input = search.input(page);
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled({ timeout: 30_000 });

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
): Promise<{ name: string; url: string }> => {
  // Only the real product-card hook.
  //
  // An earlier version fell back to any `a[href*="/products/"]`, which looked
  // safer and was not: category tiles use the same path shape
  // (`/products/Bodysuits-253`), so the fallback happily clicked a category and
  // the app bounced it to `?message=product_not_found`. A locator that matches
  // the wrong thing is worse than one that matches nothing, because it fails
  // somewhere else and blames the app.
  const link = listing.cardLink(page).first();

  await expect(
    link,
    "no product card on this page — is this a listing surface?",
  ).toBeVisible();
  await link.click();

  // `toHaveURL` rather than `waitForURL`: when it fails it says which URL it got
  // instead of only that it timed out, and "the click went somewhere else" is
  // the failure this is most likely to hit.
  await expect(page).toHaveURL(/\/products\//, { timeout: 45_000 });

  const name = product.name(page);
  await expect(name).toBeVisible();

  return {
    name: (await name.textContent())?.trim() ?? "",
    url: page.url(),
  };
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
  ).toBeVisible();

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

/** Open the cart drawer and confirm it is showing. */
export const openCart = async (page: Page): Promise<void> => {
  const button = nav.cartButton(page);
  await expect(button).toBeVisible();
  await button.click();
};
