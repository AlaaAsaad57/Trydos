// Listing pages a guest reaches from the home page: a category, the featured
// products, and the flash deals.
//
// Follows the rules in `nav.ts`: `page` first then one options object, an action
// asserts its own success, an action returns what the spec needs, and no spec
// ever sees a raw selector or builds an address.
//
// ---------------------------------------------------------------------------
// Asking the index before judging the page
//
// The featured and flash-deal pages are server-rendered from Elasticsearch. A
// page with no cards can mean two very different things: the app is broken, or
// the catalogue simply has nothing of that kind today. Staging, for one, has no
// flash deal at all (2026-09-24).
//
// So a case asks the index first, through the app's own route that runs **the
// same query** as the page:
//
//   featured page    → /api/products/featured          (featured: true)
//   flash-deal page  → /api/products/searchInCatalog?flash-deal=true
//                                                      (flashdeal: true)
//
// Both reach `getProductsAndFiltersFromElastic` with the same filter the page
// passes, and both hide QA data the same way. A good `200` with no products is a
// real "nothing to show" and the case may skip. Any other answer is a failure —
// a broken route must never turn into a quiet skip.
// ---------------------------------------------------------------------------

import { expect, type Page } from "@playwright/test";

import { LIVE_ORIGIN } from "../harness/env";
import { listing } from "../selectors";
import { seedLocale } from "./nav";

/** The two listing pages that are built from a flag on the product. */
export type FlaggedListing = "featured" | "flash-deals";

/** What the index holds for one listing, asked the same way the page asks. */
export type IndexAnswer = {
  /** The HTTP status of the route. */
  status: number;
  /** The slug of every product in the answer, in the order the index gave. */
  slugs: string[];
  /** A product came back with no slug, so no card could link to it. */
  productsWithoutSlug: number;
};

/** The route that runs the same query as each page. */
const INDEX_ROUTE: Record<FlaggedListing, string> = {
  featured: "/api/products/featured?limit=50",
  "flash-deals": "/api/products/searchInCatalog?flash-deal=true&limit=50",
};

/** The page each listing lives on, under the locale prefix. */
const PAGE_PATH: Record<FlaggedListing, string> = {
  featured: "/featured",
  "flash-deals": "/flashDeals",
};

/** Ask the index what a listing page should show, for one country.
 *
 *  From Node, not the page: the route needs no credential, and the question is
 *  about the catalogue, not about this visitor. */
export const askIndexFor = async (
  page: Page,
  options: { listing: FlaggedListing; country: string; language?: string },
): Promise<IndexAnswer> => {
  const response = await page.request.get(
    `${LIVE_ORIGIN}${INDEX_ROUTE[options.listing]}`,
    {
      headers: {
        country: options.country,
        language: options.language ?? "en",
      },
      // The first query of a run can be slow: it waited over 20 seconds on a
      // local run, while the same query a minute later took under one.
      timeout: 60_000,
    },
  );

  const body = (await response.json().catch(() => null)) as {
    data?: { products?: Array<{ slug?: unknown }> };
  } | null;
  const products = body?.data?.products ?? [];
  const slugs = products
    .map((product) => (typeof product?.slug === "string" ? product.slug : ""))
    .filter(Boolean);

  return {
    status: response.status(),
    slugs,
    productsWithoutSlug: products.length - slugs.length,
  };
};

/** Open a flagged listing page by its address, in one country, and wait for
 *  the first real product card.
 *
 *  Opened by address and not from the home page's "see all": the home page
 *  builds every section from the search backend, and the case is about the
 *  listing page, not about the row that links to it. The country is saved
 *  first so the region picker never opens over the page. */
export const gotoFlaggedListing = async (
  page: Page,
  options: { listing: FlaggedListing; country: string },
): Promise<void> => {
  await seedLocale(page, options.country);
  await page.goto(`/${options.country}-en${PAGE_PATH[options.listing]}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    listing.cardLink(page).first(),
    `the ${options.listing} page drew no product card, although the index holds products for it`,
  ).toBeVisible({ timeout: 30_000 });
};

/** The product slug behind every real card on the page, in screen order.
 *
 *  Read from the card's own link, `/{locale}/products/{slug}?color=…`. */
export const listedSlugs = async (page: Page): Promise<string[]> =>
  (
    await listing
      .cardLink(page)
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      )
  )
    .map((href) => /\/products\/([^/?#]+)/.exec(href)?.[1] ?? "")
    .map((slug) => decodeURIComponent(slug))
    .filter(Boolean);

/** The slugs in the home page's category bar, in the order they are drawn. */
export const categoriesInBar = async (page: Page): Promise<string[]> => {
  await expect(
    listing.categoryLinks(page).first(),
    "the home page drew no category bar",
  ).toBeVisible();
  return (
    await listing
      .categoryLinks(page)
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("data-id") ?? ""),
      )
  ).filter(Boolean);
};

/** Where a tap on a category-bar entry ended, and what the bar said then. */
export type CategoryTap = {
  /** The path after the tap, e.g. `/iq-en/categories/women`. */
  path: string;
  /** The tapped entry carries the "open" mark. */
  markedOpen: boolean;
  /** The first entry in the bar after the tap. The open one moves to the
   *  front. */
  firstInBar: string;
};

/** Tap one entry in the category bar and wait for the address to follow.
 *
 *  Tapping a closed entry opens `/categories/{slug}`; tapping the open one goes
 *  back to the plain home page. `expectPath` is which of the two is expected, so
 *  the wait is on the change itself. */
export const tapCategory = async (
  page: Page,
  options: { slug: string; expectPath: string },
): Promise<CategoryTap> => {
  const entry = listing.categoryLink(page, options.slug);
  await expect(
    entry,
    `the category bar has no entry for "${options.slug}"`,
  ).toBeVisible();

  const opening = options.expectPath.includes("/categories/");

  await entry.click();
  // `commit`, not the default `load`: the address is what this waits for. The
  // page below the bar streams its rows from the search backend, and on a slow
  // search it never reaches `load` inside the budget — measured, while the
  // address and the bar had long since changed.
  await page.waitForURL((url) => url.pathname === options.expectPath, {
    timeout: 30_000,
    waitUntil: "commit",
  });

  // The bar is server-rendered for the new address, so the mark is waited for
  // rather than read at once: straight after the address changes, the bar on
  // screen can still be the old one.
  const after = listing.categoryLink(page, options.slug);
  await expect(
    after,
    `the category bar lost the "${options.slug}" entry after the tap`,
  ).toBeVisible({ timeout: 30_000 });
  const markedOpen = await expect
    .poll(async () => (await listing.activeCategoryMark(after).count()) > 0, {
      timeout: 30_000,
    })
    .toBe(opening)
    .then(() => opening)
    .catch(() => !opening);

  return {
    path: new URL(page.url()).pathname,
    markedOpen,
    firstInBar: (await categoriesInBar(page))[0] ?? "",
  };
};

/** Where one visible entry in the category bar leads, as a path.
 *
 *  Read, not tapped. The open category moves to the front of the bar, where the
 *  nav bar's search box sits over the middle of it: a browser test's tap there
 *  lands on the search box (measured on 2026-09-25). Reading the link keeps the
 *  case about the bar, not about that overlap. */
export const categoryLeadsTo = async (
  page: Page,
  options: { slug: string },
): Promise<string> => {
  const entry = listing.categoryLink(page, options.slug);
  await expect(
    entry,
    `the category bar has no visible entry for "${options.slug}"`,
  ).toBeVisible();
  return new URL((await entry.getAttribute("href")) ?? "", LIVE_ORIGIN).pathname;
};
