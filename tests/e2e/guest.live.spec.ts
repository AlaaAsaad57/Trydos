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
import {
  gotoFirstProduct,
  gotoHome,
  leaveProductPage,
  openProductFromLastBoutique,
  readScrollPosition,
  readScrollRestoration,
  scrollHomeToLastBoutique,
  searchFor,
  openCart,
} from "./actions/nav";
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

  // GUEST-42. A product opened from deep in the home page is an intercepted
  // route: it renders in the same document as the home page, which is merely
  // `display:none` underneath it (`components/ModalRoute/`). Because the two
  // share one window scroll, the home page's own position is saved and put back
  // by hand — nothing in the browser or the router does it for them.
  //
  // Every step below can break on its own, so each is asked about on its own.
  // "Coming back was wrong" on its own would not say whether the shopper never
  // scrolled, the product never opened, or the position was simply lost.
  test("the home page comes back where it was after a product opens and closes", async ({
    page,
  }) => {
    await gotoHome(page);
    const homePath = new URL(page.url()).pathname;

    let parked = 0;
    await test.step("the shopper reaches the last boutique on the home page", async () => {
      const reached = await scrollHomeToLastBoutique(page);
      parked = reached.scrollY;

      // A screen-and-a-bit down. Below that the case would pass whatever the
      // app did, because "the top" and "where it was" would be the same place.
      expect(
        parked,
        `the home page only scrolled ${parked}px, which is too little for coming back to mean anything`,
      ).toBeGreaterThan(400);
    });

    await test.step("a product from that boutique opens at its own top", async () => {
      await openProductFromLastBoutique(page);

      const opened = await readScrollPosition(page);
      expect(
        opened,
        `the product opened ${opened}px down instead of at its top, so it inherited the home page's scroll`,
      ).toBeLessThan(100);
    });

    await test.step("closing it returns to the home page", async () => {
      await leaveProductPage(page);

      expect(
        new URL(page.url()).pathname,
        "the back arrow landed somewhere other than the home page",
      ).toBe(homePath);
    });

    await test.step("the browser gets its own scroll restoration back", async () => {
      // The app takes this over for the overlay journey, because the browser
      // would otherwise put the home page back at the top — the position it
      // recorded, taken while the page body was hidden. It is per history entry
      // and it has to be given back: left on "manual", every ordinary Back in
      // the app stops restoring where the visitor was.
      await expect
        .poll(async () => await readScrollRestoration(page), { timeout: 10_000 })
        .toBe("auto");
    });

    await test.step("the home page is back where the shopper left it", async () => {
      // Polled, not read once: the position is put back after the page body is
      // shown again, which is a later frame than the address changing.
      await expect
        .poll(async () => await readScrollPosition(page), { timeout: 15_000 })
        .toBeGreaterThan(parked - 150);

      const returned = await readScrollPosition(page);
      expect(
        Math.abs(returned - parked),
        `the home page came back at ${returned}px after being left at ${parked}px`,
      ).toBeLessThanOrEqual(150);
    });
  });

  test("the cart drawer opens for a guest", async ({ page }) => {
    await gotoHome(page);
    await openCart(page);

    // Open is the whole assertion. Whether it is empty depends on what this
    // browser profile did earlier, and a guest cart is not this test's subject.
    await expect(cart.drawer(page)).toBeVisible();
  });
});
