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
import { listing, nav, product, region, search, staticPage } from "../selectors";

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
