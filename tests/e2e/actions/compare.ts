// What a shopper does on the compare page, and on the compare toggle that feeds
// it.
//
// Follows the rules in `nav.ts`: `page` first then one options object, an action
// asserts its own success, an action returns what the spec needs, and no spec
// ever sees a raw selector.
//
// ---------------------------------------------------------------------------
// Compare is two slots and two cookies. That is the whole feature.
//
// `utils/functions.tsx` keeps the two products being compared in two cookies,
// `f_p` and `s_p`, each holding a product slug. `components/global/compare.tsx`
// reads them on mount and mirrors them into the query string with
// `history.replaceState`. There is no server state and no account — a guest and
// a signed-in shopper behave identically, which is why the spec is a guest one.
//
// Three rules fall out of that, and every action here is shaped by them:
//
//   * **`f_p` is not "the first one you added".** It is slot one. Removing the
//     product in slot one *moves* the product from slot two into it
//     (`removeFromCompare`), so the slugs do not stay where they were put.
//   * **A third product replaces slot one**, silently as far as the cookies are
//     concerned — the shopper is told in a notification, and nothing else
//     records it.
//   * **An empty slot renders `-`, not nothing.** Every row is always drawn for
//     both slots. So emptiness is read from the text, never from
//     `toBeHidden` — which would pass happily on a cell that is on screen and
//     says `-`.
//
// ---------------------------------------------------------------------------
// The cookies are the truth, and the page is the claim
//
// The table is filled by fetching each slug from the shop. A cell can therefore
// be empty because the slot is empty, or because the product lookup failed —
// two different faults with one appearance. So the actions report the cookies
// and the cells separately, and the specs assert them as separate facts.

import { expect, type Page } from "@playwright/test";

import { compare, moreOptions } from "../selectors";
import { chooseRegionIfAsked, localePrefix } from "./nav";

/** The cookie names the compare feature stores its two slugs in.
 *
 *  Indexed by slot so no action has to remember which name is which, and so a
 *  message can say "slot 1" — the thing a shopper sees — while reading `f_p`. */
const SLOT_COOKIE = { 1: "f_p", 2: "s_p" } as const;

/** How long the compare table gets to fill its cells.
 *
 *  Each slot is two calls to the shop — global details and live price — made in
 *  parallel per slot but not across slots, so a cold staging route can be slow
 *  twice over. */
const COMPARE_FILL_MS = 60_000;

/** Which slug is in each slot, according to the browser's cookies.
 *
 *  `null` means the slot is empty. This is the feature's actual state; the
 *  table is a rendering of it. */
export const compareSlots = async (
  page: Page,
): Promise<{ 1: string | null; 2: string | null }> => {
  const jar = await page.context().cookies();
  const read = (name: string): string | null => {
    const found = jar.find((cookie) => cookie.name === name);
    return found?.value ? decodeURIComponent(found.value) : null;
  };
  return { 1: read(SLOT_COOKIE[1]), 2: read(SLOT_COOKIE[2]) };
};

/** Which slug is in each slot, according to the address bar.
 *
 *  A separate reading from `compareSlots` on purpose. The compare page writes
 *  the cookies into the query with `history.replaceState`, so the two agreeing
 *  is a real thing to check — a shopper who copies the address and sends it to
 *  somebody else gets whatever is in the query, not whatever is in their own
 *  cookies. */
export const compareQuery = (
  page: Page,
): { 1: string | null; 2: string | null } => {
  const query = new URL(page.url()).searchParams;
  return { 1: query.get("f_p"), 2: query.get("s_p") };
};

/** Empty both slots before a case starts.
 *
 *  Compare state survives in cookies, so a context reused between cases — or a
 *  case that died half way — would otherwise hand the next one a slot it did
 *  not fill. Clearing is quiet and asserts nothing: it is setup, and setup that
 *  fails loudly hides the failure the case is actually about. */
export const forgetCompareSlots = async (page: Page): Promise<void> => {
  // By name, never the whole jar. Clearing everything would also throw away the
  // visitor's credential and their saved country — and losing the country puts
  // the region picker over the page, whose backdrop then swallows every click
  // in the case with a message about pointer events.
  await page.context().clearCookies({ name: SLOT_COOKIE[1] });
  await page.context().clearCookies({ name: SLOT_COOKIE[2] });
};

// ---------------------------------------------------------------------------
// The compare toggle on a product page
// ---------------------------------------------------------------------------

/** Does the product page's compare toggle say this product is being compared?
 *
 *  Read from the green background the component paints. Unlike the checklist
 *  toggle beside it, this one never asks a backend anything — it reads the two
 *  cookies. So this is a reading of the app's own bookkeeping, and
 *  `compareSlots` is the reading of what is actually stored. */
export const compareToggleSaysAdded = async (page: Page): Promise<boolean> => {
  const classes =
    (await moreOptions.compareToggle(page).getAttribute("class")) ?? "";
  return classes.includes("bg-green-300");
};

/** Press "Add To Compare" / "Added To Compare".
 *
 *  A toggle: pressing it on a product already being compared removes it. There
 *  is nothing to wait for — no request is made — so this returns as soon as the
 *  cookies have been written, which the component does synchronously.
 *
 *  Returns both readings, before and after, so a spec can say which direction it
 *  meant rather than assuming the button did what its label promised. */
export const pressCompareToggle = async (
  page: Page,
): Promise<{ wasAdded: boolean; nowAdded: boolean }> => {
  const wasAdded = await compareToggleSaysAdded(page);

  await moreOptions.compareToggle(page).click();

  // The component re-reads the cookies on its own `compare-changed` event, so
  // the label follows in the same tick. Waited for by polling the class rather
  // than by a sleep, so a slow machine does not decide the answer.
  await expect
    .poll(
      () => compareToggleSaysAdded(page),
      {
        message:
          "the compare button on the product page did not change state after it was pressed",
      },
    )
    .toBe(!wasAdded);

  return { wasAdded, nowAdded: await compareToggleSaysAdded(page) };
};

// ---------------------------------------------------------------------------
// The compare page
// ---------------------------------------------------------------------------

/** Open the compare page and wait until it has actually filled its slots.
 *
 *  ---------------------------------------------------------------------------
 *  **Never wait on the loading cells alone. They are at zero before the work
 *  starts, and that cost a wrong failure once already.**
 *
 *  Measured against a local production build on 2026-09-19, opening `/compare`
 *  with one slug in a cookie:
 *
 *      at ~0ms      f_p in the address: no    loading cells: 0   name cell: "-"
 *      at ~1000ms   f_p in the address: no    loading cells: 7   name cell: ""
 *      at ~3000ms   f_p in the address: yes   loading cells: 0   name cell: the product
 *
 *  The first line is the un-hydrated page, and it is indistinguishable from the
 *  finished one if the only question asked is "are any cells loading". An
 *  earlier version of this helper asked exactly that, returned at 0ms, and
 *  CMP-02 reported that the compare page never put the product in the address —
 *  about a page that puts it there three seconds later, every time.
 *
 *  ---------------------------------------------------------------------------
 *  So the wait is on the page's own statement instead
 *
 *  For every slot that holds a slug, the page mirrors that slug into the query
 *  string once its lookup has finished (`handleProductSelect` ->
 *  `history.replaceState`). That cannot happen before hydration and cannot
 *  happen before the shop has answered, so it is the one signal that means what
 *  this helper needs it to mean. */
export const gotoCompare = async (page: Page): Promise<void> => {
  const prefix = localePrefix(page);
  expect(
    prefix,
    "no country-and-language prefix in the address yet — open a storefront page before the compare page",
  ).not.toBe("");

  await page.goto(`/${prefix}/compare`, { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);

  await expect(
    compare.page(page),
    "the compare page did not render",
  ).toBeVisible();

  // What the page is being asked to show. Read from the cookies, because those
  // are what it reads on mount.
  const stored = await compareSlots(page);

  for (const slot of [1, 2] as const) {
    if (stored[slot] === null) continue;

    await expect
      .poll(() => compareQuery(page)[slot], {
        timeout: COMPARE_FILL_MS,
        message:
          `slot ${slot} holds a product but the compare page never put it in ` +
          `the address, so its lookup either failed or never answered — the ` +
          `page drops the slot and clears the cookie when the shop cannot find ` +
          `the slug`,
      })
      .toBe(stored[slot]);
  }

  // Only now is this the finished state rather than the state before the work
  // began.
  await expect(
    compare.cellLoading(page),
    "the compare page is still loading a product into one of its slots",
  ).toHaveCount(0, { timeout: COMPARE_FILL_MS });
};

/** Prove the compare page is alive, for a case where nothing is being compared.
 *
 *  An empty compare page looks the same before and after it hydrates: every
 *  cell says `-` either way, and with no slug in a cookie there is no lookup
 *  and no address to rewrite. So a case about an empty page has **no signal at
 *  all** — it would report "both slots are empty" for a page whose client code
 *  never ran, which is the silent pass this suite is written to avoid.
 *
 *  Focusing a search box is the cheapest thing that only a hydrated page can
 *  do: the dropdown is opened by `handleFocus`, in the browser, and it makes no
 *  request when the box has never had a product in it. The box is then left as
 *  it was found. */
export const proveCompareIsInteractive = async (page: Page): Promise<void> => {
  const input = compare.searchInput(page, 1);
  await expect(
    input,
    "the compare page has no search box, so it did not render",
  ).toBeVisible();

  await input.click();

  await expect(
    compare.searchOptions(page, 1),
    "the compare page's search box did not open when it was focused, so the page never became interactive and its empty table says nothing",
  ).toBeVisible({ timeout: 20_000 });

  // Put it back: click away, and wait for the dropdown to shut, so nothing the
  // caller does next lands on a panel this helper left open.
  await compare.table(page).click({ position: { x: 5, y: 5 } });
  await expect(
    compare.searchOptions(page, 1),
    "the compare page's search dropdown stayed open after clicking away from it",
  ).toBeHidden({ timeout: 20_000 });
};

/** The text in one slot's cell on one row.
 *
 *  `field` is the row — `name`, `price`, `image`, `colors`, `sizes`,
 *  `offer_price`, `details`. Named rather than numbered so adding a row to the
 *  table cannot quietly move what a case reads. */
export const compareCellText = async (
  page: Page,
  options: { field: string; slot: 1 | 2 },
): Promise<string> => {
  const row = compare.row(page, options.field);
  await expect(
    row,
    `the compare table has no "${options.field}" row`,
  ).toHaveCount(1);

  const text = await compare.cell(row, options.slot).innerText();
  return text.trim();
};

/** Is a slot empty, as the compare page shows it?
 *
 *  An empty slot renders `-` in every row, so that dash is the signal. Read
 *  from the name row, which is the one row a product always has something in. */
export const compareSlotLooksEmpty = async (
  page: Page,
  options: { slot: 1 | 2 },
): Promise<boolean> => {
  const text = await compareCellText(page, {
    field: "name",
    slot: options.slot,
  });
  return text === "" || text === "-";
};

/** Which product is this slot showing, by slug?
 *
 *  Read from the address of the link in the name cell, never from the words in
 *  it. The product page's own title comes from `getProductText`, which joins
 *  the product name with its category names — so "Polished Checked Dress |
 *  Dresses" there is "Polished Checked Dress" here: one product, two strings.
 *  A case comparing those two failed on a table that was showing exactly the
 *  right product, and reported that the table was wrong.
 *
 *  `null` when the slot is empty, because an empty slot renders `-` and has no
 *  link in it at all. */
export const compareSlotSlug = async (
  page: Page,
  options: { slot: 1 | 2 },
): Promise<string | null> => {
  const link = compare.nameLink(page, options.slot);
  if ((await link.count()) === 0) return null;

  const href = (await link.getAttribute("href")) ?? "";
  const after = href.split("/products/")[1];
  return after ? (after.split(/[?#]/)[0] ?? null) : null;
};

/** Is this slot showing this product? */
export const compareSlotShows = async (
  page: Page,
  options: { slot: 1 | 2; slug: string },
): Promise<boolean> =>
  (await compareSlotSlug(page, { slot: options.slot })) === options.slug;

/** Type into a slot's search box and wait for the dropdown to answer.
 *
 *  Returns how many results came back. Zero is a legitimate answer for a term
 *  the catalogue has nothing for, so the caller decides whether that is a
 *  failure — the same rule `searchFor` in `nav.ts` follows.
 *
 *  The box debounces for 500ms and then fetches, and while it is fetching it
 *  shows the same element it shows for "no options found". So this waits for
 *  either a result or that element to settle, rather than reading the dropdown
 *  the moment a key lands. */
export const searchInCompare = async (
  page: Page,
  options: { slot: 1 | 2; term: string },
): Promise<{ results: number }> => {
  const input = compare.searchInput(page, options.slot);
  await expect(
    input,
    `the compare page has no search box for slot ${options.slot}`,
  ).toBeVisible();

  // Focus first: the component opens its dropdown on focus, and a `fill` that
  // does not focus leaves the dropdown shut with results behind it.
  await input.click();
  await input.fill(options.term);

  const firstResult = compare.searchOption(page, options.slot).first();
  await firstResult
    .waitFor({ state: "visible", timeout: 30_000 })
    .catch(() => undefined);

  return { results: await compare.searchOption(page, options.slot).count() };
};

/** Pick the first result in a slot's dropdown, and wait for the slot to fill.
 *
 *  Returns the **slug** the slot ended up holding, read from the cookie the
 *  page wrote. The dropdown option shows only a name, and a name does not
 *  identify a product here — the product page's own title joins the name with
 *  its category names, so the same product carries two different strings.
 *
 *  The wait is on that cookie appearing, not on the loading cells going quiet:
 *  the cells are at zero before the lookup starts, which is the trap written up
 *  on `gotoCompare` above. */
export const pickFirstCompareResult = async (
  page: Page,
  options: { slot: 1 | 2 },
): Promise<{ slug: string }> => {
  const option = compare.searchOption(page, options.slot).first();
  await expect(
    option,
    `the compare search for slot ${options.slot} offered nothing to pick`,
  ).toBeVisible();

  await option.click();

  await expect
    .poll(() => compareSlots(page).then((slots) => slots[options.slot]), {
      timeout: COMPARE_FILL_MS,
      message:
        `slot ${options.slot} is still empty after a search result was picked ` +
        `for it, so either the pick never registered or the shop could not ` +
        `find the product behind it`,
    })
    .not.toBeNull();

  await expect(
    compare.cellLoading(page),
    `slot ${options.slot} is still loading the product that was picked for it`,
  ).toHaveCount(0, { timeout: COMPARE_FILL_MS });

  return { slug: (await compareSlots(page))[options.slot] as string };
};

/** Press the X on a slot's search box, which is how a shopper empties a slot
 *  from the compare page itself.
 *
 *  Waits for the cookie to go rather than for the cell to change: the cookie is
 *  what the feature stores, and a cell that already said `-` would make a
 *  cell-based wait pass without anything having happened. */
export const clearCompareSlot = async (
  page: Page,
  options: { slot: 1 | 2 },
): Promise<void> => {
  const clear = compare.searchClear(page, options.slot);
  await expect(
    clear,
    `slot ${options.slot} has no clear button, so its search box is already empty`,
  ).toBeVisible();

  await clear.click();

  await expect
    .poll(() => compareSlots(page).then((slots) => slots[options.slot]), {
      message: `slot ${options.slot} still holds a product after its clear button was pressed`,
      timeout: 20_000,
    })
    .toBe(null);
};
