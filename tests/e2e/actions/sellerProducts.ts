// The seller dashboard's products section: find one card, and read its counts.
//
// ---------------------------------------------------------------------------
// Why the walk is here but the decision is not
//
// This file clicks and reads. **Where to go next** is decided by
// `harness/gridWalk.ts`, a pure function with its own unit test — because the
// QA shop has one product, so the live grid is always one page and a walk
// written only here would never execute a step of itself. See that file's
// header, and `tests/harness/gridWalk.test.ts`.
//
// **There is no pagination control on a one-page grid.** The app draws it only
// when `last_page > 1`. That is read as one page, never as a missing element.
//
// ---------------------------------------------------------------------------
// Re-reading the counts means reloading the document, not re-opening the tab
//
// The grid asks for its per-product social counts **once per mount** and
// remembers which ids it has asked for in a ref; `changeTab` uses
// `router.replace`, which does not remount the page. The page's own comment
// says the state "survives a tab switch". So re-opening the Products tab
// re-reads nothing, and a checkpoint that did that would wait out its whole
// bound against a cached value.

import { expect, type Locator, type Page } from "@playwright/test";

import {
  nextWalkStep,
  pageCount,
  walkedSentence,
} from "../harness/gridWalk";
import { sellerProducts } from "../selectors";
import {
  dashboardLocale,
  gotoSellerDashboard,
  refuseIfSessionExpired,
} from "./sellerDashboard";
import { rowsOf, SELLER_SERVICE, sellerCall } from "../harness/sellerDashboard";

/** How far a count re-read may go. Four re-reads, fifteen seconds apart.
 *
 *  Shorter than the product page's six: every re-read here is a document load
 *  plus a fresh batch against the seller's own read limiter (60 reads per 60
 *  seconds, per shop and session), shared with the comments list. */
const COUNT_RELOADS = 4;
const COUNT_GAP_MS = 15_000;

/** What the paging control says, or one page when it is not drawn. */
const pagingState = async (
  page: Page,
): Promise<{ current: number; last: number }> => {
  const status = sellerProducts.paginationStatus(page);
  if ((await status.count()) === 0) return { current: 1, last: 1 };

  const current = Number((await status.getAttribute("data-current")) ?? "1");
  const last = pageCount(
    Number((await status.getAttribute("data-last")) ?? "1"),
  );
  return { current: Number.isFinite(current) ? current : 1, last };
};

/** Find one product's card, walking the grid page by page.
 *
 *  Returns the card and how far the walk went, so a caller can say "found on
 *  page 3 of 7" rather than only that it was found. A failure says the same
 *  thing, which is what tells "the product is not in this shop" apart from "the
 *  grid stopped paging". */
export const findProductCard = async (
  page: Page,
  options: { productId: string | number },
): Promise<{ card: Locator; walked: number; of: number }> => {
  await expect(
    sellerProducts.anyCard(page).first(),
    "the products section drew no product card at all, so its list never answered — this is not about the product being looked for",
  ).toBeVisible({ timeout: 45_000 });

  for (let guard = 0; guard <= 50; guard += 1) {
    const { current, last } = await pagingState(page);
    const card = sellerProducts.card(page, options.productId);
    const foundHere = (await card.count()) > 0;

    const step = nextWalkStep({ current, last, foundHere });

    if (step.action === "found") {
      return { card, walked: step.page, of: step.of };
    }

    if (step.action === "exhausted") {
      expect(
        `${walkedSentence(step.walked, step.of)} without finding product ${options.productId}`,
        `the QA product is not in this shop's product grid. The walk went to the end: ${walkedSentence(step.walked, step.of)}`,
      ).toBe("");
    }

    const next = sellerProducts.paginationNext(page);
    await expect(
      next,
      `the grid says it has ${step.of} pages and the walk is on page ${current}, but there is no Next control to press`,
    ).toBeVisible({ timeout: 20_000 });
    await next.click();

    await expect
      .poll(async () => (await pagingState(page)).current, {
        message: `pressing Next on page ${current} of ${step.of} did not move the grid on`,
        timeout: 30_000,
      })
      .toBeGreaterThan(current);
  }

  throw new Error(
    "the product grid kept reporting more pages than it has; the walk was stopped after 50 steps",
  );
};

/** One count on a card, as a number — or `null` when it has not arrived.
 *
 *  The two are different things and the card draws both as a dash. The counts
 *  are gated by `READ_COMMENTS`, so "not arrived" can mean the account is not
 *  permitted them at all. */
export const readStat = async (
  card: Locator,
  stat: string,
): Promise<number | null> => {
  const value = await sellerProducts.stat(card, stat).getAttribute("data-value");
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Wait, on **this** page load, for one count to arrive.
 *
 *  **The counts are fetched after the card is drawn**, by an effect that calls
 *  a server action. So reading the attribute the moment the card appears always
 *  finds it empty. An earlier version did exactly that, waited fifteen seconds
 *  without reading, and then *reloaded* — throwing away the very answer that
 *  had arrived during the wait. It never once observed a populated count.
 *
 *  Answers `null` when nothing arrived inside `within`, which is the caller's
 *  signal to reload and try again. */
const awaitStat = async (
  card: Locator,
  stat: string,
  within: number,
): Promise<number | null> => {
  const deadline = Date.now() + within;
  for (;;) {
    const value = await readStat(card, stat).catch(() => null);
    if (value !== null) return value;
    if (Date.now() >= deadline) return null;
    await card.page().waitForTimeout(500);
  }
};

/** Wait — bounded — for a product card's reaction count to reach `atLeast`.
 *
 *  Reloads the document between looks, because re-opening the tab re-reads
 *  nothing (see this file's header). Reports "the counts never answered"
 *  separately from "the count is there and it is too low": the first is a
 *  permission or a dead read, the second is a like that did not land. */
export const waitForReactionCount = async (
  page: Page,
  options: {
    sellerId: string | number;
    productId: string | number;
    atLeast: number;
  },
): Promise<{ card: Locator; walked: number; of: number; reactions: number }> => {
  let answered: number | null = null;
  let found: { card: Locator; walked: number; of: number } | null = null;

  for (let attempt = 1; attempt <= COUNT_RELOADS; attempt += 1) {
    if (attempt > 1) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await refuseIfSessionExpired(page, "re-reading the product grid");
    }

    found = await findProductCard(page, { productId: options.productId });

    // Waits **on this page load** for the effect to answer, rather than reading
    // once and reloading over the top of the answer.
    answered = await awaitStat(found.card, "heart", COUNT_GAP_MS);

    if (answered !== null && answered >= options.atLeast) {
      return { ...found, reactions: answered };
    }
  }

  expect(
    answered,
    `the product card's counts never answered within ${
      (COUNT_RELOADS * COUNT_GAP_MS) / 1000
    } seconds, so the card shows a dash rather than a number. That is the counts not arriving — READ_COMMENTS refused, the read failed, or the seller's own read limiter (60 reads per 60 seconds) turned this away — and it is a different thing from the like being missing`,
  ).not.toBeNull();

  expect(
    answered,
    `the product card's reaction count answered ${answered}, but the shopper's like on this product should have taken it to at least ${options.atLeast}. The like is written by the comments backend and read back from the product interactions index, so this is either a like that never landed or an index slower than the bound`,
  ).toBeGreaterThanOrEqual(options.atLeast);

  return {
    ...(found as { card: Locator; walked: number; of: number }),
    reactions: answered as number,
  };
};

/** What one product card draws, read off its own hooks. */
export type ProductCardOnScreen = {
  /** `data-status`, the product status the card was drawn from. */
  status: string | null;
  /** The badge's own words — "Active" or "Inactive" in the page language. */
  statusText: string;
  /** The price line, e.g. `1000.00 SYP`. Empty when no price is drawn. */
  priceText: string;
  /** `data-stock`, or null when the card draws no stock badge. */
  stock: string | null;
  /** Where the card leads. */
  href: string;
};

export const readProductCard = async (
  card: Locator,
): Promise<ProductCardOnScreen> => {
  const text = async (locator: Locator): Promise<string> =>
    (await locator.count()) > 0
      ? ((await locator.first().textContent()) ?? "").replace(/\s+/g, " ").trim()
      : "";
  const status = sellerProducts.status(card);
  const stock = sellerProducts.stock(card);
  return {
    status:
      (await status.count()) > 0 ? await status.getAttribute("data-status") : null,
    statusText: await text(status),
    priceText: await text(sellerProducts.price(card)),
    stock:
      (await stock.count()) > 0 ? await stock.getAttribute("data-stock") : null,
    href: (await card.getAttribute("href")) ?? "",
  };
};

/** The product as the core backend lists it for this shop.
 *
 *  Read through the app's own proxy — the same list the grid is drawn from. The
 *  case checks that the card shows what the backend sent. */
export type ShopProductRow = {
  status: number | null;
  unitPrice: number | null;
  currentStock: number | null;
};

export const readShopProduct = async (
  page: Page,
  options: { sellerId: string | number; productId: string | number },
): Promise<ShopProductRow> => {
  const result = await sellerCall(page, {
    service: SELLER_SERVICE.dashboard,
    url: "/shop/products",
    method: "GET",
    sellerId: String(options.sellerId),
    country: dashboardLocale(page).country,
    note: "read the shop's product list",
  });
  expect(
    result.ok,
    `the core backend refused the shop's product list (GET /shop/products answered ${result.status}${result.message ? `: ${result.message}` : ""})`,
  ).toBe(true);

  const row = rowsOf(result.data).find(
    (candidate) =>
      String(candidate?.product_id ?? candidate?.id) === String(options.productId),
  );
  expect(
    row,
    `the core backend's product list for this shop does not hold product ${options.productId}`,
  ).toBeTruthy();

  const numberOrNull = (value: unknown): number | null =>
    value === undefined || value === null || value === "" ? null : Number(value);
  return {
    status: numberOrNull(row?.status),
    unitPrice: numberOrNull(row?.unit_price),
    currentStock: numberOrNull(row?.current_stock),
  };
};

/** Open the dashboard straight into the products section. */
export const openProductsSection = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  await gotoSellerDashboard(page, {
    sellerId: options.sellerId,
    tab: "products",
  });
};
