// Listing pages a guest reaches from the home page: a category, the featured
// products, and the flash deals.
//
// Read-only and guest-only: nothing is signed in, nothing is written. That is
// why the file sits in the solo lane.
//
// **Featured and flash deals ask the index first.** A listing with no cards can
// be a broken page or an empty catalogue, and only the index can tell which. So
// each case asks the app's own route that runs the same query as the page (see
// `actions/listing.ts`). A good answer with no products skips the case, and says
// so; any other answer fails it. Staging had no flash deal at all on
// 2026-09-24, so GUEST-49 skips there until one is added.

import { expect, test } from "./fixtures";
import {
  askIndexFor,
  categoriesInBar,
  categoryLeadsTo,
  gotoFlaggedListing,
  listedSlugs,
  tapCategory,
  type FlaggedListing,
} from "./actions/listing";
import { DEFAULT_TEST_COUNTRY, gotoHome, localePrefix } from "./actions/nav";

test("GUEST-47 a category in the bar opens its own page, marked open, and leads back home", async ({
  page,
}) => {
  await gotoHome(page);
  const prefix = localePrefix(page);
  const slugs = await categoriesInBar(page);
  // The second entry when there is one, so "the open category moves to the
  // front" is a real move and not the entry that was first already.
  const slug = slugs[1] ?? slugs[0];
  expect(slug, "the category bar holds no entry with a slug").toBeTruthy();

  await test.step(`tapping "${slug}" opens its category page`, async () => {
    const tap = await tapCategory(page, {
      slug,
      expectPath: `/${prefix}/categories/${slug}`,
    });
    expect(
      tap.markedOpen,
      `the category page opened, but the "${slug}" entry is not marked as the open one`,
    ).toBe(true);
    expect(
      tap.firstInBar,
      `the open category "${slug}" did not move to the front of the bar`,
    ).toBe(slug);
  });

  await test.step(`the open "${slug}" entry now leads back to the home page`, async () => {
    // Read rather than tapped — see `categoryLeadsTo` for why.
    expect(
      await categoryLeadsTo(page, { slug }),
      `the open category "${slug}" does not lead back to the home page, so a second tap cannot close it`,
    ).toBe(`/${prefix}`);
  });
});

const FLAGGED: Array<{ id: string; listing: FlaggedListing; name: string }> = [
  { id: "GUEST-48", listing: "featured", name: "featured" },
  { id: "GUEST-49", listing: "flash-deals", name: "flash-deal" },
];

for (const { id, listing, name } of FLAGGED) {
  test(`${id} the ${name} page shows products the index holds for it`, async ({
    page,
  }) => {
    const country = DEFAULT_TEST_COUNTRY;

    const index = await askIndexFor(page, { listing, country });
    expect(
      index.status,
      `the route that runs the ${name} query answered ${index.status}, so this case cannot tell an empty catalogue from a broken one`,
    ).toBe(200);
    expect(
      index.productsWithoutSlug,
      `the index returned ${index.productsWithoutSlug} ${name} product(s) with no slug, which no card can link to`,
    ).toBe(0);
    test.skip(
      index.slugs.length === 0,
      `staging holds no ${name} product for "${country}" today — the index answered 200 with none`,
    );

    await gotoFlaggedListing(page, { listing, country });
    const shown = await listedSlugs(page);

    // Every card must be one of the products the index returned for this
    // listing. A card from outside it means the page ran a different query —
    // the wrong flag, or none.
    const strangers = [...new Set(shown.filter((slug) => !index.slugs.includes(slug)))];
    expect(
      strangers,
      `the ${name} page shows products the ${name} query did not return: ${strangers.slice(0, 5).join(", ")}`,
    ).toEqual([]);
  });
}
