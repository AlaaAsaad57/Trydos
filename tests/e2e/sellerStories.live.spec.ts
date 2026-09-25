// SST — a seller's story, its product, and where it may be seen.
//
// One story, followed from the seller dashboard to the home stories feed, to
// the product page, and back to be deleted.
//
// ---------------------------------------------------------------------------
// Serial, and one context held open
//
// Every case after `SST-02` works on the story `SST-02` uploaded, so the file
// runs serially: without that, a failed upload makes five more cases fail with
// messages about a story that was never created, each re-searching the same
// empty feed.
//
// **One seller context, opened once and held.** The saved jar is a snapshot,
// and the credential rotates the moment a case does authenticated work — so a
// context that re-opens the jar mid-file opens a pair the backend has already
// replaced, the app recovers it the only way it can (as a guest), and the
// dashboard is simply not there. A context that stays alive never opens a spent
// jar at all. See `harness/liveSession.ts > handOnSession`.
//
// ---------------------------------------------------------------------------
// The two feeds are not the same feed, and the difference decides the answers
//
//   seller-stories   what this seller wrote      -> does the row exist?
//   users_stories    what a shopper's bar shows  -> can anyone see it?
//
// A seller story is written by `add-seller-story` and listed by
// `seller-stories`; the home bar reads `users_stories`. **Whether one feeds the
// other is an open question** (`OQ-1` in the ticket) and this file is what
// answers it. So:
//
//   * existence and removal are judged on the **seller's** list, which is
//     correct whichever way `OQ-1` turns out;
//   * visibility is judged on the **home feed** and then on the rendered bar.
//
// If the story never reaches the home feed, `SST-03` goes red and names the
// stories backend. That is the correct outcome, not a bug in this file: a
// backend fault stays red and says whose it is.
//
// ---------------------------------------------------------------------------
// Nothing is written before the account is known to be able to remove it
//
// `SST-01` reads both permissions from the section's own root before anything
// is uploaded. A story this suite cannot delete is a row left on a shared
// environment for good, and unlike a seller location a story *can* be deleted —
// so there is no excuse for leaving one.

import { expect, test } from "./fixtures";
import {
  chooseStoryFile,
  closeStoryForm,
  deleteSellerStory,
  describeSellerUpload,
  findSellerStoryByLink,
  openStoriesSection,
  openStoryForm,
  oversizePhoto,
  readSellerStories,
  sellerAccountId,
  svgFile,
  typeStoryLink,
  uploadSellerStory,
  waitForStoriesList,
} from "./actions/sellerStories";
import { messagesShown, recordNotifications } from "./harness/notifications";
import { gotoSellerDashboard } from "./actions/sellerDashboard";
import { chooseRegionIfAsked, gotoAbout, gotoHome, seedLocale } from "./actions/nav";
import { signedInSession } from "./actions/auth";
import { gotoQaProduct } from "./actions/qaProduct";
import { product, storyActions } from "./selectors";
import {
  advanceToStory,
  newRunToken,
  qaStoryLink,
  readStoryFeedPage,
  showingStoryId,
  storyPhoto,
} from "./actions/story";
import { handOnSession, newLiveContext, openSignedInSession } from "./harness/liveSession";
import {
  NO_QA_SEED_REASON,
  QA_SELLER_SESSION_PATH,
  qaSeedRan,
  qaSellerSessionSaved,
  readQaSeedState,
} from "./harness/qaSeedState";
import { hasQaStoryViewers, NO_QA_STORY_VIEWERS_REASON } from "./harness/env";
import type { BrowserContext, Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

/** This run's own mark. Every story this file writes carries it, so the sweep
 *  can find what this run left and nothing anyone else left. */
const RUN_TOKEN = newRunToken();

/** The country the QA seed builds in. Declared here the same way
 *  `qaLock.live.spec.ts` declares it — the seed keeps its own copy private, and
 *  a spec importing a setup project's internals would tie the two together for
 *  one string. */
const QA_COUNTRY = "sy";

/** The link that makes the story test data. The **host** is what the app's
 *  filter reads, so this is what keeps the story off a real customer's bar. */
const STORY_LINK = qaStoryLink(RUN_TOKEN, "photo");

/** How many pages of the home feed to read before giving up. Three, because
 *  the story may not be on the first page — and a bound, because "page until
 *  found" has none and turns a clear failure into a timeout. */
const FEED_PAGES = 3;

let context: BrowserContext;
let page: Page;
let seed: ReturnType<typeof readQaSeedState>;
let accountId = 0;
/** Set by `SST-02`, read by everything after it and by the sweep. */
let uploadedStoryId: string | number | null = null;
/** The product address the stories backend kept. Read in `SST-02` and reported
 *  in failure messages. It is **not** compared against the storefront's slug:
 *  the two ids differ by design and both addresses serve the same product — see
 *  `SST-08`. */
let savedProductSlug = "";
/** The author's ring id this run's story sits under, taken from the feed in
 *  `SST-03`. The bar is addressed by it, so the case opens **its own** ring and
 *  never a stranger's. */
let storyGroupId = "";
/** Where the viewer's product button actually pointed. Read in `SST-05`, and
 *  opened by `SST-08` to prove the button reaches the product. */
let productButtonHref = "";

test.beforeAll(async ({ browser }) => {
  context = await openSignedInSession(
    browser,
    QA_SELLER_SESSION_PATH,
    "the QA seed",
  );
  page = await context.newPage();
  // **A storefront page first, before anything asks for the dashboard.** The
  // dashboard is addressed relative to the country-and-language prefix the app
  // puts in the URL, and a fresh context has no prefix yet — `gotoSellerDashboard`
  // refuses with "open a storefront page first" rather than guessing one. The
  // static page is used, not the home page, so a search outage cannot blank the
  // document on the way in.
  await gotoAbout(page, { country: QA_COUNTRY });
});

test.afterAll(async () => {
  // Hand the jar back **before** the sweep, and from whatever the last case to
  // run actually left. Tying this to one case would mean a failure earlier in
  // the file skipped it, and the sweep would then open a jar this file had
  // already superseded — reporting a clean environment over a live row.
  if (page && context) {
    await handOnSession(context, page, QA_SELLER_SESSION_PATH).catch(
      () => undefined,
    );
  }
  await context?.close().catch(() => undefined);
});

test.beforeEach(() => {
  test.skip(!qaSeedRan() || !qaSellerSessionSaved(), NO_QA_SEED_REASON);
  test.skip(!hasQaStoryViewers(), NO_QA_STORY_VIEWERS_REASON);
});

// ---------------------------------------------------------------------------

test("SST-01 the seller opens their Stories section and may both add and delete", async () => {
  test.setTimeout(180_000);

  seed = readQaSeedState();

  await gotoSellerDashboard(page, { sellerId: seed.sellerId });

  const may = await openStoriesSection(page);
  await waitForStoriesList(page);

  // **Both, before anything is written.** `canCreate` alone would let this file
  // upload a story it then cannot remove.
  expect(
    may.canCreate,
    "the QA seller may not create a story (CREATE_STORY is missing), so this journey has nothing to upload. That is a permission on the seed's account, not a fault in the dashboard",
  ).toBe(true);

  expect(
    may.canDelete,
    "the QA seller may not delete a story (DELETE_STORY is missing). This journey refuses to upload one it could not take back — a story it cannot remove would stay on this environment for good",
  ).toBe(true);

  const id = await sellerAccountId(page);
  expect(
    id,
    "the app reports no account for this session, so the saved seller jar opened as a guest. Every seller-list read below is addressed by that account id and would silently match nothing",
  ).not.toBeNull();
  accountId = id as number;
});

test("SST-02 a story uploads with its test-data link and the seed's product, and the backend keeps both", async () => {
  test.setTimeout(240_000);

  const attempt = await uploadSellerStory(page, {
    photo: storyPhoto(),
    link: STORY_LINK,
    productId: seed.productId,
  });

  expect(
    attempt.save.sent && attempt.save.status < 400,
    `the story was not saved. ${describeSellerUpload(attempt)}`,
  ).toBe(true);

  // Read it back from the seller's own list — the only list that is correct
  // whichever way OQ-1 turns out.
  const list = await readSellerStories(page, {
    sellerId: seed.sellerId,
    userId: accountId,
    country: QA_COUNTRY,
  });

  expect(
    list.status,
    `the stories backend refused the seller's own story list (${list.status})${
      list.message ? `: ${list.message}` : ""
    }`,
  ).toBe(200);

  const mine = findSellerStoryByLink(list.rows, STORY_LINK);
  expect(
    mine,
    "the stories backend does not list the story that was just uploaded, so the form reported success without a row being written",
  ).not.toBeNull();

  expect(
    String(mine?.productId ?? ""),
    "the story was saved but carries no product id, so the attachment made in the form never reached the stories backend at all",
  ).toBe(String(seed.productId));

  // The slug that came back is kept so a later failure can name it. It is not
  // asserted against the storefront's slug anywhere: the dashboard and the
  // storefront number a product differently, and both addresses open the same
  // product. `SST-08` checks the button opens the product, which is the thing
  // a shopper can feel. The **identity** is asserted just above, by product id.
  savedProductSlug = mine?.productSlug ?? "";

  uploadedStoryId = mine?.id ?? null;
  expect(
    uploadedStoryId,
    "the stories backend listed the story with no usable id, so nothing below can ask about this one story on its own",
  ).not.toBeNull();
});

test("SST-03 the story is in the home feed and on the allow-listed viewer's bar, within three pages", async () => {
  test.setTimeout(240_000);

  // --- Step one: the backend. This is the OQ-1 answer, and only this read can
  // tell "the backend never filed it" from "a filter hid it". It goes through
  // the proxy and is deliberately unfiltered.
  let found: { page: number } | null = null;
  const pagesRead: number[] = [];

  for (let n = 1; n <= FEED_PAGES && !found; n += 1) {
    pagesRead.push(n);
    const groups = await readStoryFeedPage(page, n, { country: QA_COUNTRY });
    if (groups.length === 0) break;

    for (const group of groups as any[]) {
      const owns = (group?.stories ?? []).some(
        (story: any) => String(story?.link ?? "") === STORY_LINK,
      );
      if (owns) {
        found = { page: n };
        storyGroupId = String(group?.id ?? "");
        break;
      }
    }
  }

  expect(
    found,
    `the story this run uploaded is not in the home stories feed after ${pagesRead.length} page(s). ` +
      `The stories backend accepted it into the seller's own list (SST-02 proved that) but does not serve it ` +
      `from users_stories, so a seller's story never reaches a shopper's bar. This is a stories backend fault`,
  ).not.toBeNull();
});

test("SST-04 a guest never sees the story on the home bar", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  // **This case exists because the one that was supposed to cover it cannot.**
  // `stories.live.spec.ts::STORY-03b` proves absence by collecting every `<a>`
  // href on the guest home page and filtering for the story link. No home page
  // anchor ever carries a story link — the bar tile is a `div` and the only
  // `<a href={link}>` lives inside the opened viewer — so that filter returns
  // empty whether the guest can see the ring or not. It passes for the wrong
  // reason. Recorded as `BUG-2`.
  //
  // A **fresh guest context**, because both test phones are on the QA viewer
  // allow-list by derivation, so the only viewer that is not allow-listed is
  // somebody signed in as nobody. Running this in the shared seller context
  // would also drop the session the cases after it need.
  const guestContext = await newLiveContext(browser, { recordVideo: false });
  const guestPage = await guestContext.newPage();

  try {
    await gotoHome(guestPage);

    const tiles = guestPage.locator('[data-pw="story-element"]');

    // **Content first, absence second.** A bar that drew nothing at all would
    // pass an absence check while proving nothing — the story would be
    // "hidden" only because the whole feed was empty.
    await expect
      .poll(async () => await tiles.count(), {
        timeout: 60_000,
        message:
          "a signed-out visitor's home page drew no stories bar at all, so this case cannot tell a hidden story from an empty feed. That is a stories backend fault, not a filter fault",
      })
      .toBeGreaterThan(0);

    expect(
      await guestPage
        .locator(`[data-pw="story-element"][data-id="${storyGroupId}"]`)
        .count(),
      "a signed-out visitor's home page shows the ring holding this run's test story, so test content is on a real customer's screen",
    ).toBe(0);
  } finally {
    await guestContext.close().catch(() => undefined);
  }
});


test("SST-05 the opened story offers a button to its product", async () => {
  test.setTimeout(240_000);

  await gotoHome(page);

  const ring = page.locator(
    `[data-pw="story-element"][data-id="${storyGroupId}"]`,
  );
  await expect(
    ring,
    "this run's story is in the feed, but its author's ring is not on the bar for the account that uploaded it — so the bar and the feed disagree",
  ).toBeVisible({ timeout: 60_000 });
  await ring.click();

  // **Move to this run's own story, then read only that one's bar.**
  //
  // The ring holds every story its author has, and the viewer mounts several
  // panes at once — so `story-actions` matches once per mounted story. Reading
  // them together is meaningless: one bar belongs to a story with no product,
  // another to a pane that is paused. Only the pane carrying `data-story-id` is
  // the one the app would act on.
  const onOurs = await advanceToStory(page, uploadedStoryId as string | number);
  expect(
    onOurs,
    `the viewer never reached this run's story (${uploadedStoryId}); it stopped on ${await showingStoryId(page)}, so every reading below would be about a story this case did not upload`,
  ).toBe(true);

  const holder = page.locator(`[data-story-id="${uploadedStoryId}"]`);
  const bar = holder.locator('[data-pw="story-actions"]');
  await expect(
    bar,
    "the story opened but drew no actions bar, although it carries both a link and a product",
  ).toBeVisible({ timeout: 30_000 });

  // **The flag, not the button.** The button is also gated on the viewer not
  // being paused, so its absence alone cannot tell "this story has no product"
  // from "the viewer is paused".
  expect(
    await bar.getAttribute("data-has-product"),
    "the opened story reports no attached product, although the stories backend lists one against it",
  ).toBe("true");

  const link = holder.locator('[data-pw="story-product-link"]');
  await expect(
    link,
    "the story has a product but the viewer never drew the button that leads to it",
  ).toBeVisible({ timeout: 30_000 });

  productButtonHref = (await link.getAttribute("href")) ?? "";
  expect(
    productButtonHref,
    "the product button carries no address at all",
  ).not.toBe("");
});

test("SST-06 the product page lists the story in its product story section", async () => {
  test.setTimeout(180_000);

  // Reached by the product's **own** address, not by pressing the button.
  // Whether the button's address opens the product is `SST-08`'s question, and
  // this case is about whether a product page shows a story attached to it — it
  // must not fail for a reason that belongs to another case.
  await gotoQaProduct(page, { country: QA_COUNTRY, slug: seed.productSlug });

  const card = page.locator(
    `[data-pw="Story"][data-id="${storyGroupId}"]`,
  );
  const section = page.getByTestId("StoriesIcon");

  const drew = await section.isVisible({ timeout: 45_000 }).catch(() => false);
  expect(
    drew,
    "the product page draws no product story section at all, although a story is attached to this product. The section is hidden when the product has no stories, so this says the product page's own story reader returned nothing",
  ).toBe(true);

  await expect(
    card,
    "the product story section is drawn but does not hold this run's story, so the product page and the stories backend disagree about what is attached to this product",
  ).toBeVisible({ timeout: 45_000 });
});

test("SST-07 the story is deleted from the dashboard, and the seller list no longer holds it", async () => {
  test.setTimeout(240_000);

  // **Ask the app who it thinks this is, before touching the dashboard.**
  //
  // By this point the context has been on the home page, inside the story
  // viewer and on a product page — all as the seller. If the dashboard then
  // says the session expired, there are two very different explanations and
  // the failure must not guess between them:
  //
  //   * the session really is gone  -> the credential died, and the message
  //     should send the reader to the session;
  //   * the session is alive        -> the dashboard is refusing a shopper who
  //     is still signed in, which is the dashboard's fault.
  //
  // `/api/auth/me` settles it, so the reading is taken here and reported.
  const stillSeller = await signedInSession(page);
  expect(
    stillSeller.phoneVerified,
    "after browsing the storefront as the seller, the app no longer treats this visitor as signed in. The session was lost somewhere between the dashboard and the product page — not by this case, which has done nothing but read",
  ).toBe(true);

  await gotoSellerDashboard(page, { sellerId: seed.sellerId });
  await openStoriesSection(page);
  await waitForStoriesList(page);

  // **Prove the list holds it before proving it does not.** Without this the
  // case is worthless: a list addressed wrongly, or one that simply answers
  // nothing, would report a successful delete over a row that is still there.
  const before = await readSellerStories(page, {
    sellerId: seed.sellerId,
    userId: accountId,
    country: QA_COUNTRY,
  });
  expect(
    findSellerStoryByLink(before.rows, STORY_LINK),
    "the seller's own list does not hold this run's story before the delete, so this case cannot tell a successful removal from a list that was never answering",
  ).not.toBeNull();

  await deleteSellerStory(page, { storyId: uploadedStoryId as string | number });

  const after = await readSellerStories(page, {
    sellerId: seed.sellerId,
    userId: accountId,
    country: QA_COUNTRY,
  });
  expect(
    after.status,
    `the stories backend refused the seller's own story list after the delete (${after.status})${
      after.message ? `: ${after.message}` : ""
    }`,
  ).toBe(200);

  expect(
    findSellerStoryByLink(after.rows, STORY_LINK),
    "the story left the dashboard screen but the stories backend still holds it, so the row went from the screen only",
  ).toBeNull();

  // Removed at the shop, so the sweep below has nothing left to do.
  uploadedStoryId = null;
});

// ---------------------------------------------------------------------------
// SST-08 — the product button opens the product
// ---------------------------------------------------------------------------

test("SST-08 the story's product button opens the story's product", async () => {
  test.setTimeout(120_000);

  // **What this case asks, and what it deliberately does not ask.**
  //
  // It asks the only question a shopper can feel: press the button on the
  // story, and does the product open? So it opens the address the viewer's
  // button actually carried (`SST-05`) and reads the page that comes back.
  //
  // It does **not** compare the two slugs. The seller dashboard numbers a
  // product by its own id and the storefront numbers it by its translation
  // row's id, so the two strings differ — this run saw
  // `Trydos-QA-product-4895` against `Trydos-QA-product-4899`. Measured
  // against both backends on 2026-09-22, **both addresses answer 200 and both
  // serve the same product**, so the difference costs a shopper nothing:
  //
  //     gateway  /web/product/product-meta/Trydos-QA-product-4899 -> 200
  //     gateway  /web/product/product-meta/Trydos-QA-product-4895 -> 200
  //     core     both -> 200, same name and same boutique
  //
  // This case used to assert the two strings were equal and reported the
  // difference as a backend fault. That was wrong, and it stayed red for
  // months over a product page that opens perfectly. **Do not put the string
  // comparison back.** If the button ever stops opening the product, this case
  // goes red for that — which is the thing that matters.
  //
  // The product's *identity* is already proven, and not here: `SST-02` asserts
  // the stories backend saved this story against `seed.productId`.

  expect(
    productButtonHref,
    "SST-05 never read an address off the product button, so this case has nothing to open — read that case's failure first",
  ).not.toBe("");

  // The seed's own address first, so the name this case compares against is
  // read from this environment rather than written into the test.
  const byOwnAddress = await gotoQaProduct(page, {
    country: QA_COUNTRY,
    slug: seed.productSlug,
  });

  await seedLocale(page, QA_COUNTRY);
  await page.goto(productButtonHref, { waitUntil: "domcontentloaded" });
  await chooseRegionIfAsked(page);

  await expect(
    page,
    `the story's product button pointed at "${productButtonHref}" and that address did not open a product page, so pressing the button on a story leads nowhere`,
  ).toHaveURL(/\/products\//, { timeout: 45_000 });

  const nameOnButtonPage = product.name(page);
  await expect(
    nameOnButtonPage,
    `the story's product button opened "${productButtonHref}" but the page showed no product name, so the address resolves to a page the shop cannot fill`,
  ).toBeVisible({ timeout: 45_000 });

  expect(
    (await nameOnButtonPage.textContent())?.trim() ?? "",
    `the story's product button opened a product page, but a different product: the button's address "${productButtonHref}" shows one name and the product the seed attached (${seed.productSlug}) shows "${byOwnAddress.name}"`,
  ).toBe(byOwnAddress.name);
});

// ---------------------------------------------------------------------------
// SST-09 — the form's own checks
//
// Nothing is uploaded and nothing is written: every file and link here is
// refused by the form before any backend is asked, and the form is closed with
// Cancel. It is last so that a failure here can never stop the journey above;
// the file is serial, so it runs only when that journey passed.
// ---------------------------------------------------------------------------

test("SST-09 the story form refuses an SVG, a file over 10 MB, and a link that is not one", async () => {
  test.setTimeout(180_000);

  seed = seed ?? readQaSeedState();
  // Before the navigation: the app removes each message after five seconds,
  // so it is recorded as it appears.
  await recordNotifications(page);

  await gotoSellerDashboard(page, { sellerId: seed.sellerId });
  const may = await openStoriesSection(page);
  await waitForStoriesList(page);
  expect(
    may.canCreate,
    "the QA seller may not create a story (CREATE_STORY is missing), so the form cannot be opened",
  ).toBe(true);

  await openStoryForm(page);

  try {
    await test.step("an SVG is refused, and the shopper is told", async () => {
      const told = (await messagesShown(page)).length;
      const choice = await chooseStoryFile(page, svgFile());
      expect(choice.cropOpened, "an SVG was taken into the crop step").toBe(false);
      expect(choice.previewShown, "an SVG was accepted as the story's media").toBe(
        false,
      );
      expect(
        choice.shareEnabled,
        "Share can be pressed with an SVG as the only file",
      ).toBe(false);
      await expect
        .poll(async () => (await messagesShown(page)).length, {
          message: "the SVG was refused without a word to the seller",
          timeout: 10_000,
        })
        .toBeGreaterThan(told);
    });

    await test.step("a file over 10 MB is refused, and the shopper is told", async () => {
      const told = (await messagesShown(page)).length;
      const choice = await chooseStoryFile(page, oversizePhoto());
      expect(
        choice.cropOpened,
        "a photo over 10 MB was taken into the crop step",
      ).toBe(false);
      expect(
        choice.previewShown,
        "a photo over 10 MB was accepted as the story's media",
      ).toBe(false);
      await expect
        .poll(async () => (await messagesShown(page)).length, {
          message: "the photo over 10 MB was refused without a word to the seller",
          timeout: 10_000,
        })
        .toBeGreaterThan(told);
    });

    await test.step("a link that is not one is refused, and a real one clears it", async () => {
      const bad = await typeStoryLink(page, "not a link");
      expect(
        bad.errorShown,
        "the form took \"not a link\" as a link and showed no error",
      ).toBe(true);
      expect(bad.shareEnabled, "Share can be pressed with a refused link").toBe(false);

      // No scheme on purpose: the form adds `https://` itself when it saves.
      const good = await typeStoryLink(page, "example.com/trydos-e2e");
      expect(
        good.errorShown,
        "the form still shows a link error after a real address was typed",
      ).toBe(false);
    });
  } finally {
    await closeStoryForm(page);
  }
});
