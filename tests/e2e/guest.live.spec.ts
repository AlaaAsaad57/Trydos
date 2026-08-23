// The guest journey, against real staging.
//
// Nothing here logs in and nothing here writes. It is the cheapest useful thing
// this suite can do, and it already covers ground no API-level test can reach:
// whether the app actually renders, hydrates and navigates in a browser.
//
// Assertions stay loose on purpose — a shape, a status, a count being non-zero.
// Pinning an exact product name or price would turn an ordinary catalogue change
// on staging into a red suite, which teaches everyone to ignore it.

import { expect, test } from "./fixtures";
import { gotoFirstProduct, gotoHome, openCart, searchFor } from "./actions/nav";
import { cart, listing, nav } from "./selectors";

test.describe("a guest browsing the storefront", () => {
  test("the root path redirects to a country-and-language path", async ({
    page,
  }) => {
    // `domcontentloaded`, not the default `load`. `load` waits for every last
    // resource — analytics, fonts, media from the CDN — and on a CI runner
    // talking to staging that regularly outlives the navigation timeout. This
    // test is about the redirect, which has already happened by the time the
    // document parses.
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // The shape, not one exact value: the country comes from detection and the
    // default can change without this journey being broken. `/gb-en/` — country
    // first, then language.
    //
    // The query string has to be allowed. Reached over loopback there is no geo
    // header, so the app cannot work out the country and lands on
    // `/gb-en?no-country=true` — a real redirect, and the popup that follows is
    // what `chooseRegionIfAsked` deals with.
    await expect(page).toHaveURL(/\/[a-z]{2}-[a-z]{2}(\/|\?|$)/);
  });

  test("the home page renders and stays up", async ({ page }) => {
    // An uncaught exception is the signal worth failing on. Console noise is
    // not: third-party scripts on staging log errors that say nothing about our
    // code, and failing on those would teach everyone to ignore this test.
    const crashes: string[] = [];
    page.on("pageerror", (error) => crashes.push(error.message));

    await gotoHome(page);

    await expect(nav.cartButton(page)).toBeVisible();
    expect(crashes, "the page threw while rendering").toEqual([]);
  });

  test("search finds products", async ({ page }) => {
    await gotoHome(page);

    // A term broad enough that any catalogue has something for it. A specific
    // one would make this test a statement about staging's stock.
    const { results } = await searchFor(page, { term: "a" });

    expect(results, "search returned nothing at all").toBeGreaterThan(0);
  });

  test("a listing leads to a product page", async ({ page }) => {
    await gotoHome(page);

    // The home page is a listing surface in its own right, so this needs no
    // separate navigation step.
    await expect(listing.cardLink(page).first()).toBeVisible();

    const opened = await gotoFirstProduct(page);

    expect(opened.url).toContain("/products/");
    expect(opened.name.length, "the product page has no title").toBeGreaterThan(
      0,
    );
  });

  test("the cart drawer opens for a guest", async ({ page }) => {
    await gotoHome(page);
    await openCart(page);

    // Open is the whole assertion. Whether it is empty depends on what this
    // browser profile did earlier, and a guest cart is not this test's subject.
    await expect(cart.drawer(page)).toBeVisible();
  });
});
