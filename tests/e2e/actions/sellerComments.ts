// The seller dashboard's comments section: find a question, answer it, read the
// answer back — and remove that answer again at the end.
//
// ---------------------------------------------------------------------------
// Every write here is bound to a card this run can prove is its own
//
// The server binds a reply to the **shop**, which stops another shop's comment
// being touched. It does not stop this shop's own list: the QA shop holds any
// real question a real shopper ever asked it, and a numeric id carries no QA
// mark. Worse, the reply write is create-OR-edit — answering a card that
// already holds a genuine answer **overwrites that text with no copy kept**.
//
// So `answerQuestion` refuses unless all three hold:
//
//   1. the card's `data-comment-id` is one this run created;
//   2. the card's text carries **this run's token** — the mark-in-data idiom
//      the QA shop slug and the QA story link already use;
//   3. the card shows no answer yet.
//
// The third is the cheap one that closes the unrecoverable case: every card
// this journey owns is unanswered at the moment it replies.
//
// **A card's text is read, never printed.** On every card but ours it belongs
// to a real customer, and this repository's CI log is world-readable.
//
// ---------------------------------------------------------------------------
// Re-reading means re-opening the section
//
// Unlike the product grid, `CommentsTab` is conditionally mounted and refetches
// on `[subTab, sellerId]`, so closing and re-opening the section really does
// ask again. Capped at four, fifteen seconds apart — each one spends a token of
// the seller's read limiter, shared with the grid's own batch.

import { expect, type Locator, type Page } from "@playwright/test";

import { sellerComments } from "../selectors";
import {
  currentTab,
  gotoSellerDashboard,
  openTab,
  refuseIfSessionExpired,
} from "./sellerDashboard";
import { sellerDashboard } from "../selectors";

const REOPEN_ATTEMPTS = 4;
const REOPEN_GAP_MS = 15_000;

/** Open the comments section, and say plainly when the account may not.
 *
 *  A refused permission and a screen that never loaded look identical from the
 *  outside, so the two are separated here by name. */
export const openCommentsSection = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  await gotoSellerDashboard(page, { sellerId: options.sellerId });

  await openTab(page, "comments");
  await refuseIfSessionExpired(page, "opening the comments section");

  const denied = sellerDashboard.accessDenied(page);
  const anyCard = sellerComments.anyCard(page).first();

  await expect(
    denied.or(anyCard),
    "the comments section opened but drew neither a comment nor a refusal, so its read never answered — the shop's own comments come from Elasticsearch behind a permission check against the core backend",
  ).toBeVisible({ timeout: 45_000 });

  await expect(
    denied,
    "this account is not permitted to read the shop's comments (READ_COMMENTS), so the section refused rather than failing to load",
  ).toBeHidden();
};

/** Close the section and open it again, so the list is fetched afresh. */
const reopenSection = async (
  page: Page,
  options: { sellerId: string | number },
): Promise<void> => {
  await gotoSellerDashboard(page, { sellerId: options.sellerId });
  await openTab(page, "comments");
  expect(
    await currentTab(page),
    "re-opening the comments section landed on a different section",
  ).toBe("comments");
};

/** One question's card, waited for — bounded — while the list catches up.
 *
 *  A question written on the storefront reaches this list through
 *  Elasticsearch, so "not there yet" is a real and temporary state. */
export const findQuestionCard = async (
  page: Page,
  options: { sellerId: string | number; commentId: string },
): Promise<Locator> => {
  for (let attempt = 1; attempt <= REOPEN_ATTEMPTS; attempt += 1) {
    const card = sellerComments.card(page, options.commentId);
    if ((await card.count()) > 0) return card;

    if (attempt < REOPEN_ATTEMPTS) {
      await page.waitForTimeout(REOPEN_GAP_MS);
      await reopenSection(page, { sellerId: options.sellerId });
    }
  }

  expect(
    await sellerComments.anyCard(page).count(),
    `the shop's comment list never showed question ${options.commentId} within ${
      (REOPEN_ATTEMPTS * REOPEN_GAP_MS) / 1000
    } seconds. The list is newest-first and this question was written minutes ago, so it should be on the first page — unless the comments backend never indexed it, or the list answered nothing at all`,
  ).toBe(-1);

  throw new Error("unreachable");
};

/** Prove a card belongs to this run, and refuse the write otherwise.
 *
 *  Returns nothing on success; fails by name on every way it can be wrong. */
export const requireOurCard = async (
  card: Locator,
  options: { commentId: string; runToken: string },
): Promise<void> => {
  const id = await card.getAttribute("data-comment-id");
  expect(
    id,
    `the card being answered carries no comment id, so this run cannot prove it is the question it created (${options.commentId})`,
  ).toBe(options.commentId);

  // Read, never printed: on every card but ours this is a real customer's
  // question, and the CI log for this repository is public.
  const text = (await sellerComments.cardText(card).textContent()) ?? "";
  expect(
    text.includes(options.runToken),
    `the card for question ${options.commentId} does not carry this run's mark, so this run refused to write to a question it cannot prove is its own. Either the comments backend changed the question's text on the way in, or this is somebody else's question`,
  ).toBe(true);

  const hasReply = (await card.getAttribute("data-has-reply")) === "true";
  expect(
    hasReply,
    `question ${options.commentId} already shows an answer. The reply write is create-or-edit, so answering it again would overwrite that answer with no copy kept — this run refused`,
  ).toBe(false);
};

/** Answer one question from the dashboard, and read the answer back.
 *
 *  Every check above runs first. A card that cannot be proved is not written
 *  to. */
export const answerQuestion = async (
  page: Page,
  options: {
    sellerId: string | number;
    commentId: string;
    runToken: string;
    text: string;
  },
): Promise<void> => {
  const card = await findQuestionCard(page, {
    sellerId: options.sellerId,
    commentId: options.commentId,
  });
  await requireOurCard(card, {
    commentId: options.commentId,
    runToken: options.runToken,
  });

  const reply = sellerComments.replyButton(card);
  await expect(
    reply,
    `the dashboard offers no Reply on question ${options.commentId}, so this account lacks REPLY_COMMENT`,
  ).toBeVisible({ timeout: 20_000 });
  await reply.click();

  const modal = sellerComments.replyModal(page);
  await expect(
    modal,
    `Reply was pressed on question ${options.commentId} but the reply form never opened`,
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    modal,
    `the reply form opened against a different question than ${options.commentId}`,
  ).toHaveAttribute("data-comment-id", options.commentId);

  await sellerComments.replyInput(page).fill(options.text);
  await sellerComments.replySubmit(page).click();

  await expect(
    modal,
    `the reply to question ${options.commentId} was submitted but the form stayed open, which is what the dashboard does when the write was refused`,
  ).toBeHidden({ timeout: 30_000 });

  await expect(
    sellerComments.replyText(sellerComments.card(page, options.commentId)),
    `the reply form closed but the dashboard does not show the new answer against question ${options.commentId}`,
  ).toHaveText(options.text, { timeout: 30_000 });
};

/** Remove the shop's answer from one question — teardown only.
 *
 *  **Behind a browser confirm dialog**, which Playwright dismisses by default;
 *  without the handler below the control does nothing at all and the teardown
 *  would report success while the answer stayed on the product.
 *
 *  The same ownership check runs first, and a card that cannot be proved is
 *  **skipped rather than failed**: a teardown that throws replaces the failure
 *  the run was actually reporting. Returns whether it removed anything. */
export const removeAnswer = async (
  page: Page,
  options: { sellerId: string | number; commentId: string; runToken: string },
): Promise<boolean> => {
  try {
    const card = sellerComments.card(page, options.commentId);
    if ((await card.count()) === 0) return false;

    const id = await card.getAttribute("data-comment-id");
    const text = (await sellerComments.cardText(card).textContent()) ?? "";
    const hasReply = (await card.getAttribute("data-has-reply")) === "true";
    if (id !== options.commentId) return false;
    if (!text.includes(options.runToken)) return false;
    if (!hasReply) return false;

    const remove = sellerComments.deleteReplyButton(card);
    if ((await remove.count()) === 0) return false;

    // Accept the app's own confirm. Registered before the click, and once:
    // Playwright dismisses a dialog by default, which makes the handler return
    // early and the whole delete a no-op.
    page.once("dialog", (dialog) => {
      dialog.accept().catch(() => undefined);
    });
    await remove.click();

    await expect(card).toHaveAttribute("data-has-reply", "false", {
      timeout: 30_000,
    });
    return true;
  } catch {
    // Quiet on purpose — see the note above.
    return false;
  }
};
