// What a shopper does after a parcel arrives: rate the product, then find that
// rating on the product page and change or remove it.
//
// This is the **review** half of comments. `productComments.ts` is the question
// half — a shopper asking the shop something. The two look alike on screen and
// share a backend, but they are different objects: a review carries stars and
// is written from an order, a question carries neither and is written from the
// product page. This file only ever touches reviews.
//
// ---------------------------------------------------------------------------
// Three things the screen will not tell you
//
// **1. The stars are drawn only for a delivered order.** `OrderItemsList`
// renders them behind `isDelevired`, which is `order_status.value ===
// "delivered"` and the line not returned. On any other status there is nothing
// to press — not a slow render, an answer. So `openRatingSheet` reports that
// case by name instead of waiting for a control that is never coming.
//
// **2. The review appears on the product page only after it is indexed.** The
// Buyers Comment section is server-rendered from the comments backend, which
// indexes into Elasticsearch after the write returns. So "it is not there" and
// "it is not there yet" are different answers, and `waitForBuyersComment`
// reloads, bounded, before it says either.
//
// **3. A refused write is invisible.** `ProductBuyersCommentList` only changes
// the screen once the server confirms, and swallows a refusal into `LogError`.
// A review that failed to save looks exactly like one that saved and did not
// re-render. So every write here watches the network through
// `watchCommentCall`, the same way the question journey does.
//
// Nothing in this file prints a shopper's name, a review's text or a response
// body. What reaches a message is the endpoint and the status.

import { expect, type Locator, type Page } from "@playwright/test";

import {
  COMMENT_ENDPOINT,
  requireAccepted,
  watchCommentCall,
  type CallOutcome,
} from "./productComments";

/** How long a storefront screen has to come back from staging. */
const SCREEN_MS = 45_000;

/** The bound on waiting for the comments index. Six reloads, ten seconds
 *  apart — the same shape `checkpoint` in `productComments.ts` uses, and for
 *  the same reason: a slow index and a lost write have to read differently. */
const INDEX_RELOADS = 6;
const INDEX_GAP_MS = 10_000;

// ---------------------------------------------------------------------------
// The order page
// ---------------------------------------------------------------------------

/** The read-only stars on one delivered line of the order. Pressing them is
 *  what opens the rating sheet. */
const starsOnOrder = (page: Page): Locator =>
  page.locator(".rating-star-container");

/** The sheet the order page opens for writing a review.
 *
 *  Told apart from every other dialog by the comment box it owns: the rating
 *  sheet and the edit sheet are the only two that carry `#comment-input`, and
 *  they never appear on the same screen. */
const ratingSheet = (page: Page): Locator =>
  page.locator('[role="dialog"]:has(#comment-input)').first();

/** One star in whichever sheet is open, counting from 1.
 *
 *  The row is taken first and its children second. `RatingStars` is not the
 *  only row of that shape in the sheet — the image uploader draws one too — and
 *  asking for the children of every match at once would count across both. */
const star = (page: Page, which: number): Locator =>
  ratingSheet(page)
    .locator("div.flex.flex-row.gap-1")
    .first()
    .locator("> div")
    .nth(which - 1);

/** Open the rating sheet for the first line of this order.
 *
 *  The order page must already be open. A missing control is reported as the
 *  order not being delivered, because that is the only reason the app leaves it
 *  out. */
export const openRatingSheet = async (page: Page): Promise<void> => {
  const stars = starsOnOrder(page).first();

  const shown = await stars
    .waitFor({ state: "visible", timeout: SCREEN_MS })
    .then(() => true)
    .catch(() => false);

  expect(
    shown,
    "this order page offers nothing to rate. The app draws the stars only for an order the shop has marked delivered and a line that was not returned, so either the delivery never landed or this line came back",
  ).toBe(true);

  await stars.click();

  await expect(
    ratingSheet(page),
    "pressing the stars on the order did not open the rating sheet, so there is nowhere to write a review",
  ).toBeVisible({ timeout: SCREEN_MS });
};

/** Write a review in the open sheet and send it.
 *
 *  `endpoint` says which call to watch: a first review is a create, and a
 *  second pass over the same line is an update. The app decides by whether it
 *  already holds a rating id, so the caller says which it expects and the
 *  watcher proves it. */
const submitSheet = async (
  page: Page,
  options: { stars: number; comment: string; endpoint: string },
): Promise<CallOutcome> => {
  const sheet = ratingSheet(page);

  await star(page, options.stars).click();

  const box = sheet.locator("#comment-input").first();
  await box.fill(options.comment);

  // The submit is disabled until there are both stars and words, and stays
  // disabled when nothing changed. A disabled button reports as "the app
  // refused the review before sending it", which is a different fault from the
  // backend refusing it, so the two are checked apart.
  const send = sheet.locator("button", { hasText: /Rating/ }).last();

  await expect(
    send,
    "the rating sheet will not send this review. It needs both a star count and some words, and it stays shut while nothing has changed",
  ).toBeEnabled({ timeout: SCREEN_MS });

  const answered = watchCommentCall(page, { endpoint: options.endpoint });
  await send.click();
  return await answered;
};

/** Rate one delivered line, and prove the comments backend took it.
 *
 *  Leaves the order page as it was: the app closes the sheet and re-reads the
 *  order itself once the write lands. */
export const rateOrderedProduct = async (
  page: Page,
  options: { stars: number; comment: string },
): Promise<void> => {
  await openRatingSheet(page);

  const outcome = await submitSheet(page, {
    stars: options.stars,
    comment: options.comment,
    endpoint: COMMENT_ENDPOINT.create,
  });

  await requireAccepted(page, outcome, "the review was not saved");

  await expect(
    ratingSheet(page),
    "the comments backend accepted the review but the rating sheet is still on screen, so the app did not finish the write it reported as done",
  ).toBeHidden({ timeout: SCREEN_MS });
};

/** How many stars the order page now shows for its first line.
 *
 *  Counted from the icons the app fills, because that is the only place the
 *  order page states it. `RatingStars` fills a star by giving its path the
 *  theme colour and leaves the rest `transparent`, so the filled ones are the
 *  rating.
 *
 *  Two different answers, and they must not be confused:
 *
 *    `0`   the page has drawn its stars and none of them is filled;
 *    `-1`  the page has not drawn them yet.
 *
 *  **The order page fetches itself after the route renders** and shows skeleton
 *  blocks until that answers. Counting during it finds no stars at all, and an
 *  earlier version returned `0` for that — which reads as "the shop lost the
 *  rating" when the truth is "the screen is still loading". The wait here is
 *  short because every caller polls. */
export const starsShownOnOrder = async (page: Page): Promise<number> => {
  const container = starsOnOrder(page).first();

  const drawn = await container
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (!drawn) return -1;

  return await container
    .locator('svg path:not([fill="transparent"])')
    .count()
    .catch(() => 0);
};

/** Open the product page from the order, the way a shopper does.
 *
 *  By the link on the order, never by building the address: a line that does
 *  not link to the product it was bought from is a real fault, and a case that
 *  navigates by hand can never see it. */
export const openProductFromOrder = async (page: Page): Promise<void> => {
  const link = page.locator('a[href*="/products/"]').first();

  await expect(
    link,
    "the order page shows no link to the product that was bought, so a shopper cannot reach it from their order",
  ).toBeVisible({ timeout: SCREEN_MS });

  await link.click();

  await expect(
    page,
    "pressing the product on the order did not open that product's page",
  ).toHaveURL(/\/products\//, { timeout: SCREEN_MS });
};

// ---------------------------------------------------------------------------
// The Buyers Comment section on the product page
// ---------------------------------------------------------------------------

/** One review on the product page, found by its own words.
 *
 *  The card carries `id="comment-<id>"` and its text `id="comment-<id>-text"`
 *  (`BuyerCommentItem.tsx`), so the id is read back off the card rather than
 *  guessed — every later step acts on that id. */
export const findBuyersComment = async (
  page: Page,
  options: { text: string },
): Promise<{ id: string } | null> => {
  const card = page
    .locator(".comment-item")
    .filter({ hasText: options.text })
    .first();

  if (!(await card.isVisible().catch(() => false))) return null;

  const id = (await card.getAttribute("id")) ?? "";
  const found = id.match(/^comment-(.+)$/);
  return found ? { id: found[1] } : null;
};

/** Wait for a review to reach the product page, reloading a bounded number of
 *  times.
 *
 *  The section is server-rendered and is left out entirely while the product
 *  has no reviews, so an absent section and an absent review look the same from
 *  the outside. Both are covered by the one message. */
export const waitForBuyersComment = async (
  page: Page,
  options: { text: string },
): Promise<{ id: string }> => {
  let found = await findBuyersComment(page, { text: options.text });

  for (let round = 0; round < INDEX_RELOADS && !found; round += 1) {
    await page.waitForTimeout(INDEX_GAP_MS);
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
    found = await findBuyersComment(page, { text: options.text });
  }

  expect(
    found,
    `the review this run wrote is not in the product's Buyers Comment section after ${INDEX_RELOADS} reloads over ${Math.round(
      (INDEX_RELOADS * INDEX_GAP_MS) / 1000,
    )} seconds. The comments backend accepted it, so either it was never indexed for this product or the section does not show the writer their own review`,
  ).not.toBeNull();

  return found as { id: string };
};

/** The words one review is showing right now. */
export const buyersCommentText = async (
  page: Page,
  options: { id: string },
): Promise<string> =>
  (
    (await page
      .locator(`#comment-${options.id}-text`)
      .first()
      .textContent()
      .catch(() => "")) ?? ""
  ).trim();

/** Open one review's three-dot menu. */
const openCommentMenu = async (
  page: Page,
  options: { id: string },
): Promise<Locator> => {
  const card = page.locator(`#comment-${options.id}`).first();

  await expect(
    card,
    "the review this run wrote is no longer on the product page, so its menu cannot be opened",
  ).toBeVisible({ timeout: SCREEN_MS });

  const trigger = card
    .locator('[data-pw="success-comment-options"], [data-pw="comment-options"]')
    .first();

  await expect(
    trigger,
    "the review has no options control, so a shopper cannot change or remove their own review from here",
  ).toBeVisible({ timeout: SCREEN_MS });

  await trigger.click();
  return card;
};

/** Change the words of one review, and prove the backend took the change.
 *
 *  **Edit is offered only while the shop has not replied.** `BuyersCommentMenu`
 *  draws it behind `isOwner && !comment.has_reply`, so a missing Edit is the
 *  app saying the review is answered — reported by name rather than waited
 *  out. */
export const editBuyersComment = async (
  page: Page,
  options: { id: string; stars: number; newText: string },
): Promise<void> => {
  const card = await openCommentMenu(page, { id: options.id });

  const edit = card.locator('[data-pw="comment-edit"]').first();

  const offered = await edit
    .waitFor({ state: "visible", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);

  expect(
    offered,
    "the review's menu offers no Edit. The app hides it once the shop has replied to the review, and for anyone who is not its writer — so either the shop answered it, or the app does not think this shopper wrote it",
  ).toBe(true);

  await edit.click();

  await expect(
    ratingSheet(page),
    "pressing Edit did not open the review sheet, so there is nothing to change",
  ).toBeVisible({ timeout: SCREEN_MS });

  const outcome = await submitSheet(page, {
    stars: options.stars,
    comment: options.newText,
    endpoint: COMMENT_ENDPOINT.update,
  });

  await requireAccepted(page, outcome, "the review's new words were not saved");
};

/** Remove one review through the confirmation the app shows a shopper. */
export const deleteBuyersComment = async (
  page: Page,
  options: { id: string },
): Promise<void> => {
  const card = await openCommentMenu(page, { id: options.id });

  const remove = card.locator('[data-pw="comment-delete"]').first();

  await expect(
    remove,
    "the review's menu offers no Delete, so the app does not think this shopper wrote it",
  ).toBeVisible({ timeout: 10_000 });

  await remove.click();

  // Its own screen, and only this one sends. A run that stopped at the menu
  // would have removed nothing while looking like it had.
  const confirm = page.locator('[aria-label="Confirm delete"]').first();

  await expect(
    confirm,
    "pressing Delete did not open the confirmation, and nothing is removed until that is pressed",
  ).toBeVisible({ timeout: SCREEN_MS });

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.remove,
  });
  await confirm.click();
  const outcome = await answered;

  await requireAccepted(page, outcome, "the review was not removed");

  await expect(
    page.locator(`#comment-${options.id}`),
    "the comments backend accepted the removal but the review is still drawn on the product page, so the app kept showing something the shop no longer holds",
  ).toBeHidden({ timeout: SCREEN_MS });
};
