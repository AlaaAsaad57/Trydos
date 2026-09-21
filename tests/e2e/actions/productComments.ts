// What a shopper does with product questions: ask, edit, react, translate,
// delete — and read the page back after a reload.
//
// ---------------------------------------------------------------------------
// Three mechanics live here, and each exists because the screen alone lies
//
// **1. Reading what the comments backend answered.** Three of the writes in
// this flow are invisible when they fail, and the translate call is completely
// invisible: `BuyersCommentMenu` swallows a refusal into `LogError` and leaves
// the text unchanged, which looks exactly like a translation that returned the
// same words. So `watchCommentCall` watches the network instead of the screen.
// Every comment call is a POST to the one address `/api/proxy`, and the request
// carries `x-proxy-url` naming the real endpoint.
//
// **2. What a message may print.** The endpoint and the status — never a
// response body, never a shopper's name or question text. This repository is
// public and on CI Playwright's `list` reporter writes assertion messages
// straight into a world-readable Actions log, where nothing redacts them. What
// is printed goes through `redact()` first.
//
// `/api/proxy` also has refusals of its own (400, 403, 503). A proxy-level
// refusal is reported as the proxy refusing, not as the comments backend
// refusing — otherwise the helper written to satisfy "name the backend" would
// be the thing breaking it.
//
// **3. The checkpoint.** Everything the shopper writes goes to the comments
// backend, which indexes into Elasticsearch afterwards. Every "it survived the
// reload" check therefore sits on a gap the app itself knows about — see the
// comment in `LikeButtton.tsx` about not re-seeding from a not-yet-indexed
// index. `checkpoint` reloads once, reads every value off that one page, and
// only reloads again if something is still missing: at most six reloads, ten
// seconds apart, and no new reload after 60 seconds. Its message says the value
// was *not readable within the bound* — a slow index and a lost write have to
// read differently.

import { expect, type Locator, type Page } from "@playwright/test";

import { redact } from "../harness/redact";
import { productComments } from "../selectors";

/** Endpoints this journey drives, as they appear in `x-proxy-url`. */
export const COMMENT_ENDPOINT = {
  create: "/public_comment/comments/create",
  update: "/update",
  remove: "/delete",
  translate: "/translate",
  like: "/public_comment/likes/like",
  unlike: "/public_comment/likes/unlike",
  productLike: "/products/like",
  productUnlike: "/products/unlike",
} as const;

/** What one watched call answered. */
export type CallOutcome = {
  /** The status the app finally saw. */
  status: number;
  /** True when `/api/proxy` refused on its own account rather than relaying an
   *  answer from the comments backend. The two must not be reported alike. */
  refusedByProxy: boolean;
  /** Ready to put in a message: already redacted, and carries no body. */
  said: string;
};

/** Watch for the proxy call carrying `endpoint`, and report what it answered.
 *
 *  **Call this BEFORE the action that triggers it.** `waitForResponse` only
 *  sees responses issued after it is armed; awaited afterwards it watches for a
 *  call that has already been and gone, then times out blaming a backend that
 *  answered perfectly.
 *
 *      const answered = watchCommentCall(page, { endpoint: ... });
 *      await someControl.click();
 *      const outcome = await answered;
 *
 *  Reads `response.request().headers()` and never `allHeaders()` — the latter
 *  carries the `Cookie` header, which is the session. No header map is ever
 *  printed. */
export const watchCommentCall = async (
  page: Page,
  options: { endpoint: string; timeout?: number },
): Promise<CallOutcome> => {
  // **A 401 is not a failure here, it is the first half of a refresh.**
  // `fetchData` is refresh-first for the comments service: a 401 makes the app
  // exchange that service's own token pair and send the call again. So the
  // first matching response is routinely a 401 followed by a successful retry,
  // and judging the first one reports a refused write that actually landed.
  // Measured: a run whose comments token had aged out failed here while the
  // like itself went through.
  //
  // So this waits for the first response that is **not** a 401, and remembers
  // whether it saw one — a 401 with no recovery behind it is still reported,
  // and named as what it is.
  let sawUnauthorised = false;

  const isOurs = (response: import("@playwright/test").Response): boolean => {
    const request = response.request();
    if (request.method() !== "POST" && request.method() !== "DELETE") {
      return false;
    }
    if (!response.url().includes("/api/proxy")) return false;
    // `headers()` and never `allHeaders()`: the latter carries the Cookie
    // header, which is the session.
    const proxyUrl = request.headers()["x-proxy-url"] ?? "";
    return proxyUrl.includes(options.endpoint);
  };

  const response = await page
    .waitForResponse(
      (candidate) => {
        if (!isOurs(candidate)) return false;
        if (candidate.status() === 401) {
          sawUnauthorised = true;
          return false;
        }
        return true;
      },
      // Its own budget, well inside every case budget, so a missed call reports
      // in seconds rather than eating the whole case.
      { timeout: options.timeout ?? 30_000 },
    )
    .catch(() => null);

  if (!response) {
    return {
      status: sawUnauthorised ? 401 : 0,
      refusedByProxy: false,
      said: redact(
        sawUnauthorised
          ? `the comments backend answered ${options.endpoint} with 401 and the app's token exchange did not recover it, so the call never went through`
          : `no call to ${options.endpoint} reached the comments backend within ${
              (options.timeout ?? 30_000) / 1000
            } seconds`,
      ),
    };
  }

  const status = response.status();
  // The proxy answers 503 when it cannot reach the service at all, and
  // 400/403 for its own refusals; it relays every other status untouched.
  const proxyOwnHeader =
    response.headers()["x-proxy-error"] !== undefined || status === 503;

  return {
    status,
    refusedByProxy: proxyOwnHeader,
    said: redact(
      proxyOwnHeader
        ? `the app's own proxy refused the call to ${options.endpoint} with ${status}, so the comments backend was never reached`
        : `the comments backend answered ${options.endpoint} with ${status}`,
    ),
  };
};

/** A call the journey requires to have worked. */
const requireAccepted = (outcome: CallOutcome, what: string): void => {
  expect(outcome.refusedByProxy, `${what}: ${outcome.said}`).toBe(false);
  expect(outcome.status < 400, `${what}: ${outcome.said}`).toBe(true);
};

// ---------------------------------------------------------------------------
// Asking
// ---------------------------------------------------------------------------

/** Ask a question from the **FAQ section inside the page**.
 *
 *  Returns the id the comments backend gave it, read back off the card the app
 *  drew — not out of the response — so the id the rest of the journey carries
 *  is the one the page is really showing. */
export const askInPageFaq = async (
  page: Page,
  options: { text: string },
): Promise<{ commentId: string }> => {
  // **Waits for the ask box, never for the strip.** The strip holds the
  // questions and renders with no children on a product that has none — and an
  // element with no content has zero size, which Playwright reports as hidden.
  // Waiting on it here made a product with no questions yet look like a product
  // page that never drew its FAQ section. The box is the thing this function
  // needs, and it is a sibling of the strip rather than inside it.
  const input = productComments.askInput(page);
  await expect(
    input,
    "the product page offers no box to ask a question in. Either the FAQ section never rendered, or the app does not consider this shopper signed in — it draws the box read-only for a guest and for an unverified phone",
  ).toBeVisible({ timeout: 45_000 });

  await input.fill(options.text);

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.create,
  });
  await productComments.askSend(page).click();
  requireAccepted(
    await answered,
    "asking a question from the FAQ section inside the page",
  );

  return {
    commentId: await idOfQuestionShowing(
      productComments.faqSection(page),
      options.text,
    ),
  };
};

/** Ask a question from the **extended comment area the footer opens**.
 *
 *  A different component and a different control from the one above, which is
 *  the whole reason both are covered. */
export const askInExtendedArea = async (
  page: Page,
  options: { text: string },
): Promise<{ commentId: string }> => {
  await openExtendedArea(page);

  const area = productComments.extendedArea(page);
  const input = productComments.barInput(area);
  await expect(
    input,
    "the extended comment area opened but offers no box to type a question in — the app hides it from a shopper it does not consider signed in",
  ).toBeVisible({ timeout: 30_000 });

  await input.fill(options.text);

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.create,
  });
  await productComments.barSend(area).click();
  requireAccepted(
    await answered,
    "asking a question from the extended comment area",
  );

  return {
    commentId: await idOfQuestionShowing(
      productComments.extendedList(page),
      options.text,
    ),
  };
};

/** Open the extended comment area from the footer, if it is not open already. */
export const openExtendedArea = async (page: Page): Promise<void> => {
  const area = productComments.extendedArea(page);
  if (await area.isVisible().catch(() => false)) return;

  const control = productComments.openExtendedArea(page);
  await expect(
    control,
    "the product footer drew no comment control, so the extended area cannot be opened",
  ).toBeVisible({ timeout: 45_000 });
  await control.click();

  await expect(
    area,
    "the footer's comment control was pressed but the extended comment area never opened",
  ).toBeVisible({ timeout: 30_000 });
};

/** Shut the extended comment area again, the way a shopper does.
 *
 *  **Anything that opens it must close it.** The area belongs to the product
 *  footer, which is fixed to the bottom of the page at `z-999999999`. Left
 *  open, it covers the in-page FAQ strip: a heart there scrolls underneath it
 *  and Playwright reports the footer "intercepts pointer events" instead of
 *  clicking the heart. Measured on `CMT-02`, which edited in the extended area
 *  and then tried to like in the strip. */
export const closeExtendedArea = async (page: Page): Promise<void> => {
  const backdrop = productComments.closeExtendedArea(page);
  if ((await backdrop.count()) === 0) return;

  await backdrop.click({ force: true }).catch(() => undefined);
  await expect(
    productComments.extendedArea(page),
    "the extended comment area was asked to close and stayed open, so it still covers the page underneath it",
  ).toBeHidden({ timeout: 20_000 });
};

/** The id of the card showing `text`, inside one widget.
 *
 *  Scoped to a container on purpose: the in-page strip and the extended area
 *  are both in the DOM while the extended area is open, so a page-wide lookup
 *  matches the same question twice and Playwright stops on a strict-mode
 *  violation. */
const idOfQuestionShowing = async (
  container: Locator,
  text: string,
): Promise<string> => {
  const card = productComments
    .anyItem(container)
    .filter({ hasText: text })
    .first();

  await expect(
    card,
    "the comments backend accepted the question but the page never showed it, so nothing downstream has an id to work with",
  ).toBeVisible({ timeout: 30_000 });

  const id = await card.getAttribute("data-comment-id");
  expect(
    id,
    "the page showed the new question but the card carries no comment id, so nothing can find it again",
  ).toBeTruthy();
  return String(id);
};

// ---------------------------------------------------------------------------
// Editing, reacting, translating, deleting
// ---------------------------------------------------------------------------

/** Open one question's three-dot menu, inside the widget named. */
const openMenu = async (
  container: Locator,
  commentId: string,
  where: string,
): Promise<Locator> => {
  const card = productComments.item(container, commentId);
  await expect(
    card,
    `${where} does not show the question ${commentId}, so its menu cannot be opened`,
  ).toBeVisible({ timeout: 30_000 });

  await productComments.menuButton(card).click();
  return card;
};

/** Change a question's text from the widget it was asked in.
 *
 *  **Judges the update call itself**, and that is not belt and braces: the app
 *  clears its global "a dialog is open" flag **only on success**, and the
 *  three-dot control is drawn only while that flag is clear. So a refused edit
 *  leaves the whole page without menus, and every later step would fail with
 *  "no menu" instead of naming the refusal. */
export const editQuestion = async (
  page: Page,
  options: {
    container: Locator;
    commentId: string;
    text: string;
    where: string;
  },
): Promise<void> => {
  const card = await openMenu(
    options.container,
    options.commentId,
    options.where,
  );

  const edit = productComments.editItem(card);
  await expect(
    edit,
    `${options.where} offers no Edit on question ${options.commentId}. The app removes it once the shop has answered, so this question already has a reply`,
  ).toBeVisible({ timeout: 20_000 });
  await edit.click();

  const box = productComments.editInput(page);
  await expect(
    box,
    `the Edit control in ${options.where} was pressed but no edit box appeared — it is drawn by the in-page list, so an overlay above it would hide it`,
  ).toBeVisible({ timeout: 20_000 });

  await box.fill(options.text);

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.update,
  });
  await productComments.editSubmit(page).click();
  requireAccepted(await answered, `editing the question in ${options.where}`);

  await expect(
    productComments.itemText(productComments.item(options.container, options.commentId)),
    `the comments backend took the edit but ${options.where} still shows the old text`,
  ).toHaveText(options.text, { timeout: 30_000 });
};

/** Is this heart on, and how many does it carry? Read from attributes, never
 *  from the drawn icon or the formatted number. */
export const readHeart = async (
  container: Locator,
  commentId: string,
  targetType: "comment" | "seller_reply",
): Promise<{ liked: boolean; likes: number }> => {
  const heart = productComments.heart(container, commentId, targetType);
  const liked = (await heart.getAttribute("data-liked")) === "true";
  const likes = Number((await heart.getAttribute("data-likes")) ?? "0");
  return { liked, likes };
};

/** Turn one heart on or off, and prove the count moved with it.
 *
 *  The count is checked as **movement against what it was a moment ago**, never
 *  against a fixed number: a real catalogue changes under a suite, and an
 *  absolute count turns an ordinary change into a red run. */
export const setHeart = async (
  page: Page,
  options: {
    container: Locator;
    commentId: string;
    targetType: "comment" | "seller_reply";
    on: boolean;
    where: string;
  },
): Promise<void> => {
  const heart = productComments.heart(
    options.container,
    options.commentId,
    options.targetType,
  );
  const what =
    options.targetType === "comment" ? "question" : "the shop's answer to";

  await expect(
    heart,
    `${options.where} shows no heart for ${what} ${options.commentId}`,
  ).toBeVisible({ timeout: 30_000 });

  const before = await readHeart(
    options.container,
    options.commentId,
    options.targetType,
  );
  expect(
    before.liked,
    `${options.where}: the heart on ${what} ${options.commentId} is already ${
      options.on ? "on" : "off"
    }, so pressing it would prove the opposite of what this step means`,
  ).toBe(!options.on);

  const answered = watchCommentCall(page, {
    endpoint: options.on ? COMMENT_ENDPOINT.like : COMMENT_ENDPOINT.unlike,
  });
  await heart.click();
  requireAccepted(
    await answered,
    `${options.on ? "liking" : "unliking"} ${what} ${options.commentId} in ${
      options.where
    }`,
  );

  await expect(
    heart,
    `the comments backend accepted the ${
      options.on ? "like" : "unlike"
    } but ${options.where} still draws the heart on ${what} ${
      options.commentId
    } as ${options.on ? "off" : "on"}`,
  ).toHaveAttribute("data-liked", options.on ? "true" : "false", {
    timeout: 20_000,
  });

  const after = await readHeart(
    options.container,
    options.commentId,
    options.targetType,
  );
  expect(
    after.likes,
    `the heart on ${what} ${options.commentId} turned ${
      options.on ? "on" : "off"
    } but its count went from ${before.likes} to ${after.likes} instead of moving by one`,
  ).toBe(options.on ? before.likes + 1 : before.likes - 1);
};

/** Ask the app to translate one question, and report only what the backend
 *  answered.
 *
 *  Deliberately **not** judged from the screen. A service that echoed its input
 *  would leave the text unchanged and satisfy any on-screen check, and a
 *  refusal is swallowed into `LogError` and leaves the text unchanged too — so
 *  the screen cannot tell the two apart and the network can. */
export const translateQuestion = async (
  page: Page,
  options: { container: Locator; commentId: string; where: string },
): Promise<CallOutcome> => {
  const card = await openMenu(
    options.container,
    options.commentId,
    options.where,
  );

  const translate = productComments.translateItem(card);
  await expect(
    translate,
    `${options.where} offers no Translate on question ${options.commentId}`,
  ).toBeVisible({ timeout: 20_000 });

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.translate,
  });
  await translate.click();
  return answered;
};

/** Delete one question, through the confirmation the app shows a shopper. */
export const deleteQuestion = async (
  page: Page,
  options: { container: Locator; commentId: string; where: string },
): Promise<void> => {
  const card = await openMenu(
    options.container,
    options.commentId,
    options.where,
  );

  const remove = productComments.deleteItem(card);
  await expect(
    remove,
    `${options.where} offers no Delete on question ${options.commentId}, so this shopper is not its author`,
  ).toBeVisible({ timeout: 20_000 });
  await remove.click();

  const confirm = productComments.deleteConfirm(page);
  await expect(
    confirm,
    `Delete was pressed on question ${options.commentId} but no confirmation appeared`,
  ).toBeVisible({ timeout: 20_000 });

  const answered = watchCommentCall(page, {
    endpoint: COMMENT_ENDPOINT.remove,
  });
  await confirm.click();
  requireAccepted(
    await answered,
    `deleting question ${options.commentId} from ${options.where}`,
  );

  await expect(
    productComments.item(options.container, options.commentId),
    `the comments backend accepted the delete but ${options.where} still shows question ${options.commentId}`,
  ).toHaveCount(0, { timeout: 30_000 });
};

// ---------------------------------------------------------------------------
// The product's own heart
// ---------------------------------------------------------------------------

/** Is the product heart on? The filled icon is drawn only when it is.
 *
 *  **Waits for the footer before reading.** `gotoQaProduct` returns as soon as
 *  the product *name* is on screen, and the footer mounts after that — so a
 *  read taken straight away finds no filled icon and answers "not liked" about
 *  a product that is liked. Measured: a run skipped its own reset on that
 *  answer and then refused to like a heart that was already on.
 *
 *  The two icons are drawn by one component in one render, so once the heart
 *  control is on screen the state is settled. */
export const productLiked = async (page: Page): Promise<boolean> => {
  await productComments
    .productHeart(page)
    .waitFor({ state: "visible", timeout: 45_000 })
    .catch(() => undefined);

  return productComments
    .productHeartFilled(page)
    .isVisible()
    .catch(() => false);
};

/** Turn the product heart on or off. */
export const setProductHeart = async (
  page: Page,
  options: { on: boolean },
): Promise<void> => {
  const heart = productComments.productHeart(page);
  await expect(
    heart,
    "the product page drew no heart in its footer, so the product cannot be liked",
  ).toBeVisible({ timeout: 45_000 });

  expect(
    await productLiked(page),
    `the product heart is already ${
      options.on ? "on" : "off"
    }, so pressing it would prove the opposite of what this step means`,
  ).toBe(!options.on);

  const answered = watchCommentCall(page, {
    endpoint: options.on
      ? COMMENT_ENDPOINT.productLike
      : COMMENT_ENDPOINT.productUnlike,
  });
  await heart.click();
  requireAccepted(
    await answered,
    options.on ? "liking the product" : "removing the like from the product",
  );

  await expect
    .poll(() => productLiked(page), {
      message: `the comments backend accepted the ${
        options.on ? "like" : "unlike"
      } but the footer still draws the product heart as ${
        options.on ? "off" : "on"
      }`,
      timeout: 20_000,
    })
    .toBe(options.on);
};

// ---------------------------------------------------------------------------
// The checkpoint — reload, then read everything off one page
// ---------------------------------------------------------------------------

/** What one question looks like after a reload. `null` means it is not on the
 *  page at all — which is the right answer after a delete. */
export type QuestionState = {
  text: string;
  liked: boolean;
  likes: number;
  hasReply: boolean;
  replyText: string;
  replyLiked: boolean;
} | null;

export type PageState = {
  productLiked: boolean;
  questions: Record<string, QuestionState>;
};

/** Read the whole journey's state off the page as it stands now.
 *
 *  Reads the **in-page FAQ strip**. After a reload both questions come back
 *  from the server list, so the strip carries them whichever widget asked them
 *  — and reading one widget costs one comment-list fetch instead of two. When a
 *  question is genuinely not in the strip the extended area is opened and
 *  checked too, so "missing" is never reported off a single widget. */
export const readPageState = async (
  page: Page,
  options: { commentIds: string[] },
): Promise<PageState> => {
  // Waits for the **footer**, not for the FAQ strip. The strip is empty — and
  // therefore zero-sized, and therefore "hidden" — whenever the product has no
  // questions, which is exactly the state the last checkpoint of the journey
  // reads after both have been deleted. The footer is on every product page
  // whatever the questions are doing.
  await expect(
    productComments.productHeart(page),
    "the product page came back from a reload without its footer, so it did not finish loading and nothing on it can be read",
  ).toBeVisible({ timeout: 45_000 });

  const section = productComments.faqSection(page);

  const questions: Record<string, QuestionState> = {};
  let openedExtended = false;

  for (const commentId of options.commentIds) {
    let container = section;
    let card = productComments.item(container, commentId);

    if ((await card.count()) === 0) {
      // Not in the strip. Look in the extended area before calling it gone.
      if (!openedExtended) {
        await openExtendedArea(page).catch(() => undefined);
        openedExtended = true;
      }
      container = productComments.extendedList(page);
      card = productComments.item(container, commentId);
    }

    if ((await card.count()) === 0) {
      questions[commentId] = null;
      continue;
    }

    const reply = productComments.reply(container, commentId);
    const hasReply = (await card.getAttribute("data-has-reply")) === "true";
    const heart = await readHeart(container, commentId, "comment");

    questions[commentId] = {
      text: (await productComments.itemText(card).textContent())?.trim() ?? "",
      liked: heart.liked,
      likes: heart.likes,
      hasReply,
      replyText: hasReply
        ? ((await productComments.replyText(reply).textContent()) ?? "").trim()
        : "",
      replyLiked: hasReply
        ? (await readHeart(container, commentId, "seller_reply")).liked
        : false,
    };
  }

  // Put the page back as it was found. This function may have opened the
  // extended area to look for a question, and leaving it open would cover the
  // in-page strip for whatever the caller does next.
  if (openedExtended) await closeExtendedArea(page);

  return { productLiked: await productLiked(page), questions };
};

/** The bound. Six reloads, ten seconds apart — no new reload past 60 seconds.
 *
 *  Both halves are needed. Seconds alone leave the rate set by how fast staging
 *  answers, which on a four-second page load is fifteen reloads per checkpoint
 *  and sixty across the journey. */
const CHECKPOINT_RELOADS = 6;
const CHECKPOINT_GAP_MS = 10_000;
const CHECKPOINT_BOUND_MS = 60_000;

/** Reload, re-read, and wait — bounded — until everything named holds.
 *
 *  `unmet` returns a list of the things that are still not true, in plain
 *  words. On the last attempt those words become the failure, prefixed with the
 *  fact that they were **not readable within the bound** — so a slow index and
 *  a lost write read differently. */
export const checkpoint = async (
  page: Page,
  options: {
    commentIds: string[];
    what: string;
    unmet: (state: PageState) => string[];
  },
): Promise<PageState> => {
  const startedAt = Date.now();
  let state: PageState | null = null;
  let outstanding: string[] = [];

  for (let attempt = 1; attempt <= CHECKPOINT_RELOADS; attempt += 1) {
    await page.reload({ waitUntil: "domcontentloaded" });
    state = await readPageState(page, { commentIds: options.commentIds });
    outstanding = options.unmet(state);
    if (outstanding.length === 0) return state;

    const spent = Date.now() - startedAt;
    if (spent + CHECKPOINT_GAP_MS >= CHECKPOINT_BOUND_MS) break;
    await page.waitForTimeout(CHECKPOINT_GAP_MS);
  }

  expect(
    outstanding.join("; "),
    `${options.what}: not readable within ${
      CHECKPOINT_BOUND_MS / 1000
    } seconds after reloading the product page. Everything here is written by the comments backend and indexed into Elasticsearch afterwards, so this is either a write that never landed or an index that is slower than the bound. Still not true:`,
  ).toBe("");

  return state as PageState;
};
