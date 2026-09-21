// CMT-01 to CMT-08 — questions, shop answers and reactions, end to end.
//
//   CMT-01  the shopper likes the product and asks from both places
//   CMT-02  both questions are edited, liked, and survive a reload; translate
//   CMT-03  the seller finds the product card and sees the shopper's like
//   CMT-04  the seller answers both questions
//   CMT-05  both answers reach the shopper, who likes them; Edit is now gone
//   CMT-06  a reload keeps every question, edit, answer and like
//   CMT-07  every like is removed, and a reload keeps them off
//   CMT-08  both questions are deleted, the product is unliked, and it sticks
//
// ---------------------------------------------------------------------------
// Serial, and why that is not a preference
//
// Every case after the first reads ids the first one created. Without serial
// mode a failed CMT-01 leaves seven cases each burning up to 240 seconds to
// report a failure they inherited, on a lane that runs one worker at a time.
//
// ---------------------------------------------------------------------------
// Two identities, and only one of them signs in
//
// **The shopper** signs in once, in CMT-01, and keeps `SESSION_STATE.comments`.
// **The seller never signs in**: the QA seed already did, and the cases open
// the jar it saved. A second sign-in on that account would spend a real
// one-time code against limits that are not ours.
//
// Every case that touches the seller's jar hands it back in its `finally` —
// including the teardown, which deletes a reply and is authenticated work like
// any other. A saved jar is a snapshot: the moment a case does authenticated
// work the app can exchange the credential, and a jar handed on stale is the
// "nine cases showing Access Denied" failure `sellerDashboard.live.spec.ts`
// documents. **This file sorts before that one in the same lane**, so a jar it
// poisons is the jar that file opens.
//
// ---------------------------------------------------------------------------
// What this run writes, and what removes it
//
// Two questions, two shop answers, several reactions and one product like — all
// on the **QA product**, which no search, listing or sitemap shows. Every one is
// registered at the moment it is created and removed by `afterAll`, which is a
// no-op once CMT-08 has done the work itself.
//
// What a failure cannot undo: if the run dies between the answer and the
// teardown, and the seller's jar is unusable, the answer stays on the QA
// product. That is the same trade this suite already accepts for a location it
// cannot delete.
//
// ---------------------------------------------------------------------------
// The reload checks, and the gap they sit on
//
// Everything the shopper writes goes to the comments backend, which indexes
// into Elasticsearch afterwards. So "it survived the reload" is a bounded wait,
// not an assertion on the next frame — see `checkpoint` in
// `actions/productComments.ts`. A message that says "not readable within 60
// seconds" is a slow index; a value that is there and wrong is a lost write.

import type { Browser, BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { attemptAuth, currentAuthScreen } from "./actions/auth";
import { gotoAbout } from "./actions/nav";
import { newRunToken } from "./actions/story";
import { gotoQaProduct } from "./actions/qaProduct";
import {
  askInExtendedArea,
  askInPageFaq,
  checkpoint,
  closeExtendedArea,
  deleteQuestion,
  editQuestion,
  openExtendedArea,
  productLiked,
  readPageState,
  setHeart,
  setProductHeart,
  translateQuestion,
} from "./actions/productComments";
import {
  answerQuestion,
  openCommentsSection,
  removeAnswer,
} from "./actions/sellerComments";
import {
  findProductCard,
  openProductsSection,
  waitForReactionCount,
} from "./actions/sellerProducts";
import { envValue, hasShopperA } from "./harness/env";
import {
  NO_QA_SEED_REASON,
  QA_SELLER_SESSION_PATH,
  qaSeedRan,
  qaSellerSessionSaved,
  readQaSeedState,
} from "./harness/qaSeedState";
import {
  forgetSavedSession,
  handOnSession,
  newLiveContext,
  openSignedInSession,
  saveSession,
  SESSION_STATE,
} from "./harness/liveSession";
import { productComments } from "./selectors";

test.describe.configure({ mode: "serial" });

/** The country the QA seed used. These endpoints read the country from the
 *  **header**, so a case on another one looks as if the two disagree. */
const QA_COUNTRY = "sy";

/** This run's mark, carried inside the text of every question it writes.
 *
 *  The mark-in-data idiom the QA shop slug and the QA story link already use.
 *  It is what lets the seller half prove a card is its own before writing to
 *  it — a numeric id carries no QA mark, and the shop's list also holds real
 *  shoppers' questions. */
const RUN_TOKEN = newRunToken();

const questionText = (place: string): string =>
  `trydos qa ${RUN_TOKEN} question from the ${place}`;

const editedText = (place: string): string =>
  `trydos qa ${RUN_TOKEN} edited question from the ${place}`;

const answerText = (place: string): string =>
  `trydos qa ${RUN_TOKEN} shop answer for the ${place} question`;

/** What CMT-01 created, read by everything after it. */
const asked: { inPage: string | null; inExtended: string | null } = {
  inPage: null,
  inExtended: null,
};

/** True once CMT-08 has removed each thing, so the teardown does not repeat it. */
const removed = { questions: false, productLike: false };

/** The case that creates the ids. Named in every "nothing to run against"
 *  message, so a reader is never sent looking for a fault downstream. */
const ID_OWNER = "CMT-01";

test.beforeEach(() => {
  test.skip(!hasShopperA(), "needs TEST_ACCOUNT_PHONE and TEST_ACCOUNT_OTP.");
  test.skip(!qaSeedRan(), NO_QA_SEED_REASON);
});

/** The two ids, or a failure naming the case that should have made them. */
const idsFromCmt01 = (): { inPage: string; inExtended: string } => {
  expect(
    asked.inPage && asked.inExtended,
    `${ID_OWNER} never created both questions, so this case has nothing to run against. Read that case's failure rather than this one.`,
  ).toBeTruthy();
  return {
    inPage: String(asked.inPage),
    inExtended: String(asked.inExtended),
  };
};

/** Open the shopper's saved session on the QA product. */
const openShopperOnProduct = async (
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await openSignedInSession(
    browser,
    SESSION_STATE.comments,
    ID_OWNER,
  );
  const page = await context.newPage();
  await gotoQaProduct(page, { country: QA_COUNTRY });
  return { context, page };
};

const closeShopperPage = async (
  context: BrowserContext,
  page: Page,
): Promise<void> => {
  await handOnSession(context, page, SESSION_STATE.comments);
  await context.close();
};

/** Open the QA seller's saved session and land on a storefront page first —
 *  the locale prefix only exists once the app has chosen a country, and every
 *  dashboard address is built from it. */
const openSellerPage = async (
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await openSignedInSession(
    browser,
    QA_SELLER_SESSION_PATH,
    "the QA seed (setup project)",
  );
  const page = await context.newPage();
  await gotoAbout(page, { country: QA_COUNTRY });
  return { context, page };
};

const closeSellerPage = async (
  context: BrowserContext,
  page: Page,
): Promise<void> => {
  await handOnSession(context, page, QA_SELLER_SESSION_PATH);
  await context.close();
};

// ---------------------------------------------------------------------------
// CMT-01 — the shopper arrives, likes the product, and asks from both places
// ---------------------------------------------------------------------------

test("CMT-01 the shopper likes the product and asks a question from both places", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  // Never inherit a session an earlier run saved: it holds a credential the
  // backend has moved on from.
  forgetSavedSession(SESSION_STATE.comments);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  try {
    await test.step("the shopper signs in", async () => {
      await gotoAbout(page, { country: QA_COUNTRY });

      await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      const screen = (await currentAuthScreen(page)) ?? "closed";
      expect(
        screen,
        `the sign-in ended on the "${screen}" screen, so nothing below is a signed-in shopper's`,
      ).toMatch(/^(welcome|closed)$/);

      await page.keyboard.press("Escape").catch(() => {});
    });

    await test.step("the shopper opens the QA product", async () => {
      const opened = await gotoQaProduct(page, { country: QA_COUNTRY });
      expect(
        opened.name,
        "the QA product page opened but showed no name, so the rest of this journey has no product to work on",
      ).not.toBe("");
    });

    await test.step("the comments backend accepted the product like", async () => {
      // A run that died after liking would leave it on. Start from a known
      // state rather than assuming one.
      if (await productLiked(page)) {
        await setProductHeart(page, { on: false });
      }
      await setProductHeart(page, { on: true });
    });

    await test.step("a question asked in the page FAQ section", async () => {
      const { commentId } = await askInPageFaq(page, {
        text: questionText("page FAQ section"),
      });
      asked.inPage = commentId;
    });

    await test.step("a question asked in the extended area", async () => {
      const { commentId } = await askInExtendedArea(page, {
        text: questionText("extended area"),
      });
      asked.inExtended = commentId;

      expect(
        asked.inExtended === asked.inPage,
        "both places returned the same question id, so one of the two asks did not create anything of its own",
      ).toBe(false);
    });
  } finally {
    await saveSession(context, SESSION_STATE.comments).catch(() => undefined);
    await closeShopperPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// CMT-02 — editing, liking, and the first checkpoint
// ---------------------------------------------------------------------------

test("CMT-02 both questions are edited and liked, and the edits survive a reload", async ({
  browser,
}) => {
  test.setTimeout(240_000);

  const ids = idsFromCmt01();
  const { context, page } = await openShopperOnProduct(browser);

  try {
    await test.step("the page question is edited", async () => {
      await editQuestion(page, {
        container: productComments.faqSection(page),
        commentId: ids.inPage,
        text: editedText("page FAQ section"),
        where: "the in-page FAQ section",
      });
    });

    await test.step("the extended-area question is edited", async () => {
      // The edit dialog is drawn by the in-page list while the extended area is
      // an overlay above it. If a shopper cannot reach it from here, that is a
      // real defect and this step says so rather than working around it by
      // closing the overlay first.
      await openExtendedArea(page);
      await editQuestion(page, {
        container: productComments.extendedList(page),
        commentId: ids.inExtended,
        text: editedText("extended area"),
        where: "the extended comment area",
      });
      // Shut it again before anything touches the page underneath: the footer
      // it belongs to is fixed and above everything, so an open area swallows
      // every click meant for the in-page strip.
      await closeExtendedArea(page);
    });

    await test.step("each question is liked", async () => {
      const section = productComments.faqSection(page);
      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        await setHeart(page, {
          container: section,
          commentId: id,
          targetType: "comment",
          on: true,
          where: `the in-page FAQ section (the ${place} question)`,
        });
      }
    });

    await test.step("a reload still shows both edits and both likes", async () => {
      const state = await checkpoint(page, {
        commentIds: [ids.inPage, ids.inExtended],
        what: "the two edits and the two question likes",
        unmet: (read) => {
          const missing: string[] = [];
          for (const [place, id] of [
            ["page FAQ section", ids.inPage],
            ["extended area", ids.inExtended],
          ] as const) {
            const question = read.questions[id];
            if (!question) {
              missing.push(`the ${place} question (${id}) is not on the page`);
              continue;
            }
            if (!question.text.includes(RUN_TOKEN)) {
              missing.push(`the ${place} question (${id}) lost this run's mark`);
            }
            if (!question.text.includes("edited")) {
              missing.push(`the ${place} question (${id}) shows its old text`);
            }
            if (!question.liked) {
              missing.push(`the ${place} question (${id}) reads as not liked`);
            }
          }
          return missing;
        },
      });

      expect(
        state.questions[ids.inPage]?.text,
        "after the reload the page-FAQ question does not show its edited text",
      ).toContain("edited");
      expect(
        state.questions[ids.inExtended]?.text,
        "after the reload the extended-area question does not show its edited text",
      ).toContain("edited");
      expect(
        state.questions[ids.inPage]?.liked,
        "after the reload the like on the page-FAQ question is gone",
      ).toBe(true);
      expect(
        state.questions[ids.inExtended]?.liked,
        "after the reload the like on the extended-area question is gone",
      ).toBe(true);
    });

    await test.step("the comments backend answered the translate call", async () => {
      // Judged on what the backend answered, never on the text changing: a
      // service that echoed its input would satisfy an on-screen check, and a
      // refusal is swallowed into LogError and also leaves the text unchanged.
      const outcome = await translateQuestion(page, {
        container: productComments.faqSection(page),
        commentId: ids.inPage,
        where: "the in-page FAQ section",
      });

      expect(
        outcome.refusedByProxy,
        `asking for a translation: ${outcome.said}`,
      ).toBe(false);
      expect(
        outcome.status < 400,
        `asking for a translation: ${outcome.said}`,
      ).toBe(true);
    });
  } finally {
    await closeShopperPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// CMT-03 / CMT-04 — the seller's side
// ---------------------------------------------------------------------------

test("CMT-03 the seller finds the product card and sees the shopper's like", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  test.skip(
    !qaSellerSessionSaved(),
    "the QA seed left no signed-in seller session, so it skipped or stopped before it signed in. Read the setup project's own line — it names the setting that is missing.",
  );

  idsFromCmt01();
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await test.step("the seller opens their product list", async () => {
      await openProductsSection(page, { sellerId: seed.sellerId });
    });

    await test.step("the QA product card is found, walking the pages", async () => {
      const found = await findProductCard(page, { productId: seed.productId });
      expect(
        found.walked <= found.of,
        `the walk claims to have looked at ${found.walked} pages out of ${found.of}, which cannot be right`,
      ).toBe(true);
    });

    await test.step("the card's reaction count holds the shopper's like", async () => {
      const seen = await waitForReactionCount(page, {
        sellerId: seed.sellerId,
        productId: seed.productId,
        atLeast: 1,
      });
      expect(
        seen.reactions,
        "the product card's reaction count answered, but not with the shopper's like on this product",
      ).toBeGreaterThanOrEqual(1);
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

test("CMT-04 the seller answers both questions", async ({ browser }) => {
  test.setTimeout(240_000);
  test.skip(
    !qaSellerSessionSaved(),
    "the QA seed left no signed-in seller session, so it skipped or stopped before it signed in. Read the setup project's own line — it names the setting that is missing.",
  );

  const ids = idsFromCmt01();
  const seed = readQaSeedState();
  const { context, page } = await openSellerPage(browser);

  try {
    await test.step("the seller is offered the comments section", async () => {
      await openCommentsSection(page, { sellerId: seed.sellerId });
    });

    await test.step("the first question is answered", async () => {
      await answerQuestion(page, {
        sellerId: seed.sellerId,
        commentId: ids.inPage,
        runToken: RUN_TOKEN,
        text: answerText("page FAQ section"),
      });
    });

    await test.step("the second question is answered", async () => {
      await answerQuestion(page, {
        sellerId: seed.sellerId,
        commentId: ids.inExtended,
        runToken: RUN_TOKEN,
        text: answerText("extended area"),
      });
    });
  } finally {
    await closeSellerPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// CMT-05 to CMT-08 — the shopper comes back
// ---------------------------------------------------------------------------

test("CMT-05 both answers reach the shopper, who likes them", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const ids = idsFromCmt01();
  const { context, page } = await openShopperOnProduct(browser);

  try {
    await test.step("both answers are on the product page", async () => {
      const state = await checkpoint(page, {
        commentIds: [ids.inPage, ids.inExtended],
        what: "the shop's two answers",
        unmet: (read) => {
          const missing: string[] = [];
          for (const [place, id] of [
            ["page FAQ section", ids.inPage],
            ["extended area", ids.inExtended],
          ] as const) {
            const question = read.questions[id];
            if (!question) {
              missing.push(`the ${place} question (${id}) is not on the page`);
            } else if (!question.hasReply) {
              missing.push(
                `the ${place} question (${id}) still shows no shop answer`,
              );
            }
          }
          return missing;
        },
      });

      expect(
        state.questions[ids.inPage]?.replyText,
        "the shop's answer to the page-FAQ question is not the one the seller wrote",
      ).toContain(RUN_TOKEN);
      expect(
        state.questions[ids.inExtended]?.replyText,
        "the shop's answer to the extended-area question is not the one the seller wrote",
      ).toContain(RUN_TOKEN);
    });

    await test.step("each answer is liked", async () => {
      const section = productComments.faqSection(page);
      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        await setHeart(page, {
          container: section,
          commentId: id,
          targetType: "seller_reply",
          on: true,
          where: `the in-page FAQ section (the answer to the ${place} question)`,
        });
      }
    });

    await test.step("an answered question offers no Edit", async () => {
      const section = productComments.faqSection(page);
      const card = productComments.item(section, ids.inPage);
      await productComments.menuButton(card).click();

      await expect(
        productComments.translateItem(card),
        "the question's menu did not open, so what it offers cannot be read",
      ).toBeVisible({ timeout: 20_000 });

      await expect(
        productComments.editItem(card),
        "the shop has answered this question, so the app should no longer offer the shopper an Edit control on it",
      ).toHaveCount(0);

      await page.keyboard.press("Escape").catch(() => {});
    });
  } finally {
    await closeShopperPage(context, page);
  }
});

test("CMT-06 a reload keeps every question, edit, answer and like", async ({
  browser,
}) => {
  test.setTimeout(240_000);

  const ids = idsFromCmt01();
  const { context, page } = await openShopperOnProduct(browser);

  try {
    const state = await test.step(
      "everything written so far is read back after a reload",
      async () =>
        checkpoint(page, {
          commentIds: [ids.inPage, ids.inExtended],
          what: "both questions, both answers and all four likes",
          unmet: (read) => {
            const missing: string[] = [];
            if (!read.productLiked) missing.push("the product reads as unliked");
            for (const [place, id] of [
              ["page FAQ section", ids.inPage],
              ["extended area", ids.inExtended],
            ] as const) {
              const question = read.questions[id];
              if (!question) {
                missing.push(`the ${place} question (${id}) is not on the page`);
                continue;
              }
              if (!question.text.includes("edited")) {
                missing.push(`the ${place} question (${id}) shows its old text`);
              }
              if (!question.liked) {
                missing.push(`the ${place} question (${id}) reads as not liked`);
              }
              if (!question.hasReply) {
                missing.push(`the ${place} question (${id}) shows no answer`);
              }
              if (!question.replyLiked) {
                missing.push(
                  `the answer to the ${place} question (${id}) reads as not liked`,
                );
              }
            }
            return missing;
          },
        }),
    );

    // One named assertion per value, off the one page the checkpoint read.
    await test.step("the product is still liked", async () => {
      expect(
        state.productLiked,
        "after the reload the product heart reads as not liked",
      ).toBe(true);
    });

    for (const [place, id] of [
      ["page FAQ section", ids.inPage],
      ["extended area", ids.inExtended],
    ] as const) {
      await test.step(`the ${place} question survived in full`, async () => {
        const question = state.questions[id];
        expect(
          question,
          `after the reload the ${place} question (${id}) is not on the page at all`,
        ).not.toBeNull();
        expect(
          question?.text,
          `after the reload the ${place} question (${id}) does not show its edited text`,
        ).toContain("edited");
        expect(
          question?.liked,
          `after the reload the like on the ${place} question (${id}) is gone`,
        ).toBe(true);
        expect(
          question?.hasReply,
          `after the reload the ${place} question (${id}) shows no shop answer`,
        ).toBe(true);
        expect(
          question?.replyLiked,
          `after the reload the like on the answer to the ${place} question (${id}) is gone`,
        ).toBe(true);
      });
    }
  } finally {
    await closeShopperPage(context, page);
  }
});

test("CMT-07 every like is removed, and a reload keeps them off", async ({
  browser,
}) => {
  test.setTimeout(240_000);

  const ids = idsFromCmt01();
  const { context, page } = await openShopperOnProduct(browser);

  try {
    await test.step("every like is removed", async () => {
      const section = productComments.faqSection(page);
      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        await setHeart(page, {
          container: section,
          commentId: id,
          targetType: "comment",
          on: false,
          where: `the in-page FAQ section (the ${place} question)`,
        });
        await setHeart(page, {
          container: section,
          commentId: id,
          targetType: "seller_reply",
          on: false,
          where: `the in-page FAQ section (the answer to the ${place} question)`,
        });
      }
    });

    await test.step("a reload keeps every like off", async () => {
      const state = await checkpoint(page, {
        commentIds: [ids.inPage, ids.inExtended],
        what: "all four likes staying off",
        unmet: (read) => {
          const missing: string[] = [];
          for (const [place, id] of [
            ["page FAQ section", ids.inPage],
            ["extended area", ids.inExtended],
          ] as const) {
            const question = read.questions[id];
            if (!question) {
              missing.push(`the ${place} question (${id}) is not on the page`);
              continue;
            }
            if (question.liked) {
              missing.push(
                `the ${place} question (${id}) is liked again after the unlike`,
              );
            }
            if (question.replyLiked) {
              missing.push(
                `the answer to the ${place} question (${id}) is liked again after the unlike`,
              );
            }
          }
          return missing;
        },
      });

      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        expect(
          state.questions[id]?.liked,
          `after the reload the ${place} question (${id}) is liked again, so the unlike did not stick`,
        ).toBe(false);
        expect(
          state.questions[id]?.replyLiked,
          `after the reload the answer to the ${place} question (${id}) is liked again, so the unlike did not stick`,
        ).toBe(false);
      }
    });
  } finally {
    await closeShopperPage(context, page);
  }
});

test("CMT-08 both questions are deleted and the product unliked, and it sticks", async ({
  browser,
}) => {
  test.setTimeout(240_000);

  const ids = idsFromCmt01();
  const { context, page } = await openShopperOnProduct(browser);

  try {
    await test.step("each question is deleted", async () => {
      const section = productComments.faqSection(page);
      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        await deleteQuestion(page, {
          container: section,
          commentId: id,
          where: `the in-page FAQ section (the ${place} question)`,
        });
      }
      removed.questions = true;
    });

    await test.step("the product like is removed", async () => {
      await setProductHeart(page, { on: false });
      removed.productLike = true;
    });

    await test.step("a reload keeps the deletes and the unlike", async () => {
      const state = await checkpoint(page, {
        commentIds: [ids.inPage, ids.inExtended],
        what: "both deletes and the product unlike",
        unmet: (read) => {
          const missing: string[] = [];
          if (read.productLiked) {
            missing.push("the product is liked again after the unlike");
          }
          for (const [place, id] of [
            ["page FAQ section", ids.inPage],
            ["extended area", ids.inExtended],
          ] as const) {
            if (read.questions[id]) {
              missing.push(
                `the ${place} question (${id}) is back on the page after being deleted`,
              );
            }
          }
          return missing;
        },
      });

      expect(
        state.productLiked,
        "after the reload the product is liked again, so removing the like did not stick",
      ).toBe(false);
      for (const [place, id] of [
        ["page FAQ section", ids.inPage],
        ["extended area", ids.inExtended],
      ] as const) {
        expect(
          state.questions[id],
          `after the reload the ${place} question (${id}) is back on the page, so the delete did not stick`,
        ).toBeNull();
      }
    });
  } finally {
    await closeShopperPage(context, page);
  }
});

// ---------------------------------------------------------------------------
// Teardown — two identities, two removal paths, and quiet throughout
// ---------------------------------------------------------------------------

test.afterAll(async ({ browser }) => {
  test.setTimeout(240_000);

  // The guards live in `beforeEach`, which never runs for a skipped file — so
  // this hook still would. Without these two lines it would open sessions a
  // skipped run never created.
  if (!hasShopperA() || !qaSeedRan()) return;

  const ids = [asked.inPage, asked.inExtended].filter(Boolean) as string[];

  // **Not `return` when there are no ids.** `CMT-01` likes the product BEFORE
  // it asks anything, so a run that dies between those two points has created
  // something and recorded no id for it. An earlier version returned here and
  // left the QA product liked by the shopper account.
  if (ids.length === 0 && removed.productLike) return;

  // The shop's answers first: only the seller can remove one, and only while
  // the question still exists. Nothing to do when no question was ever asked.
  if (ids.length > 0 && qaSellerSessionSaved() && !removed.questions) {
    const seller = await openSellerPage(browser).catch(() => null);
    if (seller) {
      try {
        const seed = readQaSeedState();
        await openCommentsSection(seller.page, { sellerId: seed.sellerId });
        for (const id of ids) {
          await removeAnswer(seller.page, {
            sellerId: seed.sellerId,
            commentId: id,
            runToken: RUN_TOKEN,
          });
        }
      } catch {
        // Quiet on purpose: a clean-up that throws replaces the failure the run
        // was reporting. An answer left behind sits on the QA product, which no
        // shopper sees.
      } finally {
        await closeSellerPage(seller.context, seller.page);
      }
    }
  }

  // Then the shopper's own: the questions, and the product like.
  if (removed.questions && removed.productLike) return;

  const shopper = await openShopperOnProduct(browser).catch(() => null);
  if (!shopper) return;

  try {
    const section = productComments.faqSection(shopper.page);
    if (!removed.questions && ids.length > 0) {
      const state = await readPageState(shopper.page, { commentIds: ids });
      for (const id of ids) {
        if (!state.questions[id]) continue;
        await deleteQuestion(shopper.page, {
          container: section,
          commentId: id,
          where: "the in-page FAQ section (clean-up)",
        }).catch(() => undefined);
      }
    }
    if (!removed.productLike && (await productLiked(shopper.page))) {
      await setProductHeart(shopper.page, { on: false }).catch(() => undefined);
    }
  } catch {
    // Same reason as above.
  } finally {
    await closeShopperPage(shopper.context, shopper.page);
  }
});
