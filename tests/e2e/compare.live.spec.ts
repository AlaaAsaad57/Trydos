// CMP-01 to CMP-07 — comparing two products.
//
//   CMP-01  the compare page opens with both slots empty
//   CMP-02  a product added from its page fills the first slot
//   CMP-03  a second product fills the second slot, and both are shown
//   CMP-04  a third product replaces the first, and the shopper is told
//   CMP-05  removing one frees its slot and moves the other into first place
//   CMP-06  the compare page's own search box fills a slot
//   CMP-07  the clear button empties a slot, in the cookie and in the address
//
// ---------------------------------------------------------------------------
// Compare has no account and no server state
//
// The two products being compared live in two cookies, `f_p` and `s_p`
// (`utils/functions.tsx`), which `components/global/compare.tsx` reads on mount
// and mirrors into the query string. Nothing is stored for anybody. A guest and
// a signed-in shopper behave identically, so this file is a guest file and that
// is not a gap.
//
// The product lookups the table makes do follow the app's usual routing rule —
// `/web/product/globalDetails/` is on the gateway allow-list, so a guest's
// lookups go to the gateway and a verified shopper's go to core
// (`utils/server/tokenManager.ts:178-190`). That routing is already covered by
// the specs that open product pages; repeating it here would test the same
// thing twice and say nothing more about compare.
//
// ---------------------------------------------------------------------------
// Three facts per case, never one
//
// A slot can look empty because it is empty, or because the product lookup
// failed — two different faults with one appearance. So the cases read:
//
//   the cookie    what the feature actually stores
//   the address   what a shopper would send somebody by copying the URL
//   the cell      what the table drew
//
// and assert them separately. One assertion covering all three could only ever
// say "compare did not work".
//
// ---------------------------------------------------------------------------
// One guest, seven cases in order
//
// Compare state is cookies, so the cases share a context and run serially: each
// one starts from the state the last one left, which is what a shopper does.
// Nothing is written to any backend, so there is nothing to clean up.

import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  clearCompareSlot,
  compareCellText,
  compareQuery,
  compareSlotLooksEmpty,
  compareSlotShows,
  compareSlots,
  compareToggleSaysAdded,
  forgetCompareSlots,
  gotoCompare,
  pickFirstCompareResult,
  pressCompareToggle,
  proveCompareIsInteractive,
  searchInCompare,
} from "./actions/compare";
import { gotoHome, gotoProductAtOrNull } from "./actions/nav";
import { watchNotifications } from "./actions/profile";
import { newLiveContext } from "./harness/liveSession";
import { openMoreOptions, slugOnScreen } from "./actions/wishlist";

// One story, told in order. A later case that ran on its own would be asking
// about slots nothing had filled.
test.describe.configure({ mode: "serial" });

let context: BrowserContext;
let page: Page;

/** The three products this file compares, filled in as the cases reach them. */
type Product = { name: string; slug: string; url: string };
const picked: Product[] = [];

/** Open the nth product on the home page and remember it.
 *
 *  Each product is opened from a fresh home page, because opening one as an
 *  overlay leaves the listing underneath and the next index would be counted
 *  against a page that has moved on. */
const takeProduct = async (index: number): Promise<Product> => {
  await gotoHome(page);
  const opened = await gotoProductAtOrNull(page, { index });

  expect(
    opened,
    `the home page has no product at position ${index}, so this file cannot ` +
      `find ${index + 1} different products to compare`,
  ).not.toBeNull();

  const slug = slugOnScreen(page);
  expect(
    slug,
    `the product page at position ${index} has no slug in its address, and a ` +
      `slug is what compare stores: ${page.url()}`,
  ).not.toBe("");

  const product = { name: (opened as { name: string }).name, slug, url: page.url() };
  picked[index] = product;
  return product;
};

test.beforeAll(async ({ browser }) => {
  context = await newLiveContext(browser);
  page = await context.newPage();
});

test.afterAll(async () => {
  await context?.close();
});

test("CMP-01 the compare page opens with both slots empty", async () => {
  await gotoHome(page);

  // Compare state survives in cookies, so anything a previous run left in this
  // profile would be read as this run's doing.
  await forgetCompareSlots(page);

  await gotoCompare(page);

  const slots = await compareSlots(page);
  expect(
    [slots[1], slots[2]],
    "the compare cookies already hold products on a first visit, so this run is not starting from nothing",
  ).toEqual([null, null]);

  // An empty compare page looks identical before and after it hydrates, so
  // without this the two checks below would pass for a page whose client code
  // never ran.
  await proveCompareIsInteractive(page);

  expect(
    await compareSlotLooksEmpty(page, { slot: 1 }),
    "the compare page shows a product in the first slot although no product has been added to it",
  ).toBe(true);
  expect(
    await compareSlotLooksEmpty(page, { slot: 2 }),
    "the compare page shows a product in the second slot although no product has been added to it",
  ).toBe(true);
});

test("CMP-02 a product added from its page fills the first slot", async () => {
  const first = await takeProduct(0);

  await openMoreOptions(page);

  expect(
    await compareToggleSaysAdded(page),
    "the product page already shows this product as being compared, so pressing the button would remove it instead of adding it",
  ).toBe(false);

  const pressed = await pressCompareToggle(page);
  expect(
    pressed.nowAdded,
    "the compare button did not turn on after it was pressed, so the app itself does not believe the product was added",
  ).toBe(true);

  const slots = await compareSlots(page);
  expect(
    slots[1],
    "the first compare slot does not hold the product that was added to it",
  ).toBe(first.slug);
  expect(
    slots[2],
    "the second compare slot was filled by adding one product, so the two slots are not being filled in order",
  ).toBeNull();

  await gotoCompare(page);

  expect(
    compareQuery(page)[1],
    "the compare page did not put the first slot's product into the address, so a shopper who copies the address sends an empty comparison",
  ).toBe(first.slug);

  expect(
    await compareSlotShows(page, { slot: 1, slug: first.slug }),
    `the compare table's first slot does not show the product that was added ` +
      `to it — it shows "${await compareCellText(page, { field: "name", slot: 1 })}"`,
  ).toBe(true);
});

test("CMP-03 a second product fills the second slot, and both are shown", async () => {
  const first = picked[0];
  const second = await takeProduct(1);

  await openMoreOptions(page);
  await pressCompareToggle(page);

  const slots = await compareSlots(page);
  expect(
    slots[2],
    "the second compare slot does not hold the second product that was added",
  ).toBe(second.slug);
  expect(
    slots[1],
    "adding a second product moved the first one out of its slot, although both slots were free",
  ).toBe(first.slug);

  await gotoCompare(page);

  // Each slot on its own. "The table is wrong" would not say which of the two
  // products failed to load, and only one of them can be at fault.
  expect(
    await compareSlotShows(page, { slot: 1, slug: first.slug }),
    "the compare table's first slot no longer shows the first product once a second one is being compared",
  ).toBe(true);
  expect(
    await compareSlotShows(page, { slot: 2, slug: second.slug }),
    "the compare table's second slot does not show the second product",
  ).toBe(true);

  // A row other than the name, because the name is the one thing the page could
  // show from the search option alone. A price is proof the product was
  // actually fetched.
  expect(
    (await compareCellText(page, { field: "price", slot: 2 })).length,
    "the compare table shows the second product's name but no price, so its details were never fetched",
  ).toBeGreaterThan(0);
});

test("CMP-04 a third product replaces the first, and the shopper is told", async () => {
  const second = picked[1];
  const third = await takeProduct(2);

  await openMoreOptions(page);

  // Counted rather than read: the message is translated, so matching its words
  // would tie this case to English. What matters is that the shopper was told
  // something at the moment their first product was silently dropped.
  //
  // Counted against what was already on screen, not against zero. A notice left
  // over from an earlier step would otherwise satisfy this case on its own,
  // which is the quiet pass this whole file is written to avoid.
  const peakNotices = await watchNotifications(page);
  const noticesBefore = await peakNotices();

  await pressCompareToggle(page);

  const slots = await compareSlots(page);
  expect(
    slots[1],
    "adding a third product did not replace the first slot, so the shopper's third choice was dropped instead",
  ).toBe(third.slug);
  expect(
    slots[2],
    "adding a third product replaced the second slot as well, so the shopper lost a product they did not need to",
  ).toBe(second.slug);

  expect(
    await peakNotices(),
    "nothing new was shown to the shopper when their first compared product was replaced, so a product disappeared with no explanation",
  ).toBeGreaterThan(noticesBefore);
});

test("CMP-05 removing one frees its slot and moves the other into first place", async () => {
  const second = picked[1];
  const third = picked[2];

  // Back to the third product's own page, which is where its compare button is.
  await page.goto(third.url, { waitUntil: "domcontentloaded" });
  await openMoreOptions(page);

  expect(
    await compareToggleSaysAdded(page),
    "the product page does not show this product as being compared, although it is in the first compare slot",
  ).toBe(true);

  const pressed = await pressCompareToggle(page);
  expect(
    pressed.nowAdded,
    "the compare button did not turn off after it was pressed on a product that was being compared",
  ).toBe(false);

  const slots = await compareSlots(page);

  // The moving part. `removeFromCompare` does not just empty slot one — it
  // moves slot two into it, so the remaining product is always in first place.
  // A page that left a hole would show the surviving product in the second
  // column with an empty first one.
  expect(
    slots[1],
    "removing the product in the first slot left the slot empty instead of moving the second product into it",
  ).toBe(second.slug);
  expect(
    slots[2],
    "the second slot still holds a product after it was moved into the first slot, so the same product is now in both",
  ).toBeNull();

  await gotoCompare(page);

  expect(
    await compareSlotShows(page, { slot: 1, slug: second.slug }),
    "the compare table's first slot does not show the product that was moved into it",
  ).toBe(true);
  expect(
    await compareSlotLooksEmpty(page, { slot: 2 }),
    "the compare table still shows a product in the second slot after it was emptied",
  ).toBe(true);
});

test("CMP-06 the compare page's own search box fills a slot", async () => {
  const first = picked[0];

  await gotoCompare(page);

  // The term is taken from a product this run already opened, not written down
  // here. A fixed word would make this case a statement about what staging
  // happens to stock.
  const term = first.name.split(/\s+/)[0] ?? first.name;

  const found = await searchInCompare(page, { slot: 2, term });

  // Named as the search backend's, because it is. Nothing in this repository
  // decides what a search returns.
  expect(
    found.results,
    `the catalogue search behind the compare page returned nothing for a word ` +
      `taken from a product it is currently selling, so the search backend ` +
      `answered with no results`,
  ).toBeGreaterThan(0);

  const chosen = await pickFirstCompareResult(page, { slot: 2 });

  expect(
    (await compareSlots(page))[2],
    "picking a search result on the compare page did not put anything in the second slot",
  ).not.toBeNull();

  expect(
    compareQuery(page)[2],
    "picking a search result filled the slot but did not put it in the address, so the comparison cannot be shared",
  ).not.toBeNull();

  expect(
    await compareSlotShows(page, { slot: 2, slug: chosen.slug }),
    `the compare table's second slot does not show the product that was picked ` +
      `from the search — it shows "${await compareCellText(page, { field: "name", slot: 2 })}"`,
  ).toBe(true);
});

test("CMP-07 the clear button empties a slot, in the cookie and in the address", async () => {
  const stillFirst = (await compareSlots(page))[1];

  await clearCompareSlot(page, { slot: 2 });

  expect(
    (await compareSlots(page))[2],
    "the second compare slot still holds a product after its clear button was pressed",
  ).toBeNull();

  expect(
    (await compareSlots(page))[1],
    "clearing the second slot also emptied the first one, so the shopper lost a product they did not clear",
  ).toBe(stillFirst);

  expect(
    compareQuery(page)[2],
    "the cleared product is gone from the cookie but still in the address, so reloading the page would bring it back",
  ).toBeNull();

  expect(
    await compareSlotLooksEmpty(page, { slot: 2 }),
    "the compare table still shows a product in the second slot after it was cleared",
  ).toBe(true);
});
