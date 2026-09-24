// WISH-01 to WISH-05 — saving a product, finding it again, and removing it.
//
//   WISH-01  a new guest has nothing saved
//   WISH-02  saving a product from its page reaches the shop
//   WISH-03  the saved product is on the checklist screen
//   WISH-04  the product's own page shows it as saved when it is opened again
//   WISH-05  removing it from the checklist screen removes it at the shop
//
// ---------------------------------------------------------------------------
// This file is the guest's half of the feature, and there is another half
//
// `/checklist` is served by two different backends depending on who is asking
// (`utils/server/tokenManager.ts:178-190`):
//
//   guest or unverified shopper  -> the gateway
//   signed-in verified shopper   -> the core backend
//
// Every case here runs as a guest, so every case here exercises the **gateway**.
// The core backend — the one a real signed-in shopper reaches — is covered by
// `wishlist-signed-in.live.spec.ts`, which runs the same steps with a session.
// Neither file covers the other's backend, and a failure in one says nothing
// about the other.
//
// No message in this file hard-codes the word "gateway". Each one quotes the
// `x-market-backend` label the app's own proxy put on the answer
// (`app/api/proxy/route.ts:380-386`), so a routing change shows up in the
// failure text instead of quietly making every message wrong.
//
// ---------------------------------------------------------------------------
// One guest, one saved product, five cases in order
//
// The cases tell one story, so they share a context and run serially. A fresh
// context per case would mean a fresh guest per case, and a guest who never
// saved anything cannot be asked whether their saved product is still there.
//
// It also keeps this file's writes to staging down to **one** row on **one**
// throwaway guest — which WISH-05 removes through the screens, and which
// `afterAll` removes anyway if the run dies before it gets there.
//
// ---------------------------------------------------------------------------
// Why the screen is never the only thing asked
//
// `ChecklistView` keeps its rows in React state and splices the array as soon
// as a request resolves. So a row appearing or disappearing proves the request
// did not throw — it does not prove anything was written. Each case that
// changes something therefore asks the shop as well, and the two are separate
// assertions with separate messages, because they are separate facts.

import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { gotoFirstProduct, gotoHome } from "./actions/nav";
import { newLiveContext } from "./harness/liveSession";
import {
  checklistFromBackend,
  checklistScreenShows,
  checklistToggleSaysSaved,
  forgetProductQuietly,
  gotoChecklist,
  openMoreOptions,
  pressChecklistToggle,
  readChecklistScreen,
  removeFromChecklistScreen,
  savedOnBackend,
  slugOnScreen,
  waitForShopCredential,
} from "./actions/wishlist";

// The cases are one journey. Serial, so a later case never runs against a
// guest the earlier one failed to set up and reports a fault that is not there.
test.describe.configure({ mode: "serial" });

let context: BrowserContext;
let page: Page;

/** The product WISH-02 saves, carried through the rest of the file.
 *
 *  Held rather than looked up again, because "the product we saved" and "the
 *  first product on the home page right now" stop being the same thing the
 *  moment staging's catalogue changes mid-run. */
let productSlug = "";
let productUrl = "";
let productId: number | null = null;

test.beforeAll(async ({ browser }) => {
  context = await newLiveContext(browser);
  page = await context.newPage();
});

test.afterAll(async () => {
  // The net, not the test. WISH-05 removes the row through the screens; this
  // only matters when the run died before reaching it. Quiet on purpose —
  // cleanup that throws replaces the failure the run was reporting.
  if (productId !== null) {
    await forgetProductQuietly(page, { productId }).catch(() => undefined);
  }
  await context?.close();
});

test("WISH-01 a new guest has nothing saved", async () => {
  await gotoHome(page);

  // The app registers this guest while the page renders, and the credential
  // lands after the page is usable. Asking before it does is answered `401`,
  // which reads like the shop refusing a checklist when nothing refused
  // anything.
  await waitForShopCredential(page);

  // Asked of the shop first, so what the screen shows below can be compared
  // with something rather than simply believed.
  const shop = await checklistFromBackend(page);

  expect(
    shop.status,
    `the ${shop.backend ?? "storefront"} backend refused to list this guest's ` +
      `checklist (${shop.status})${shop.message ? `: ${shop.message}` : ""}`,
  ).toBe(200);

  expect(
    shop.slugs,
    `the ${shop.backend} backend already has products saved for a guest that ` +
      `has just been registered, so this run is not starting from nothing`,
  ).toEqual([]);

  await gotoChecklist(page);
  const screen = await readChecklistScreen(page);

  // Two different screens, so two different questions. "No rows" alone would
  // also be true of a screen that rendered neither the list nor the empty
  // panel, which is what a broken screen looks like.
  expect(
    screen.empty,
    "the checklist screen did not show its empty panel for a guest with nothing saved",
  ).toBe(true);
  expect(
    screen.rows,
    "the checklist screen listed saved products for a guest the shop says has none",
  ).toBe(0);
});

test("WISH-02 saving a product from its page reaches the shop", async () => {
  await gotoHome(page);

  const opened = await gotoFirstProduct(page);
  productUrl = opened.url;
  productSlug = slugOnScreen(page);

  expect(
    productSlug,
    `the product page address carries no slug, so nothing can match the saved ` +
      `row back to this product: ${opened.url}`,
  ).not.toBe("");

  await openMoreOptions(page);

  // The toggle is a toggle. Pressing it on an already-saved product removes it,
  // so a case that means "save" has to know which way it was pointing first.
  expect(
    await checklistToggleSaysSaved(page),
    "the product page already shows this product as saved, so pressing the toggle would remove it instead of saving it",
  ).toBe(false);

  const pressed = await pressChecklistToggle(page);

  expect(
    pressed.nowSaved,
    "the checklist toggle did not turn on after it was pressed, so the app itself does not believe the product was saved",
  ).toBe(true);

  const shop = await checklistFromBackend(page);

  expect(
    shop.status,
    `the ${shop.backend ?? "storefront"} backend refused to list the checklist ` +
      `after the product was saved (${shop.status})${shop.message ? `: ${shop.message}` : ""}`,
  ).toBe(200);

  expect(
    shop.slugs,
    `the ${shop.backend} backend does not list the product that was just saved, ` +
      `so the toggle turned green without anything being written`,
  ).toContain(productSlug);

  // The id the shop keeps for this row. Needed by WISH-04, which asks the
  // single-product question the product page itself asks, and by the cleanup
  // net. It cannot be read off the page — the number at the end of a slug is
  // not the product id.
  productId = shop.ids[shop.slugs.indexOf(productSlug)] ?? null;

  expect(
    productId,
    `the ${shop.backend} backend listed the saved product with no usable id, ` +
      `so nothing can ask about this one product on its own`,
  ).not.toBeNull();
});

test("WISH-03 the saved product is on the checklist screen", async () => {
  await gotoChecklist(page);

  const screen = await readChecklistScreen(page);

  expect(
    screen.empty,
    "the checklist screen says this guest has nothing saved, although a product was saved for them",
  ).toBe(false);

  expect(
    await checklistScreenShows(page, { slug: productSlug }),
    "the checklist screen does not list the product that was saved, so the screen and the shop disagree",
  ).toBe(true);
});

test("WISH-04 the product's own page shows it as saved when it is opened again", async () => {
  // A fresh load of the product page, not a step back through the app. The
  // toggle decides its state by asking the shop on mount, and that is the
  // question this case is about.
  await page.goto(productUrl, { waitUntil: "domcontentloaded" });
  await openMoreOptions(page);

  const shop = await savedOnBackend(page, { productId: productId as number });

  expect(
    shop.status,
    `the ${shop.backend ?? "storefront"} backend refused the question the ` +
      `product page asks about one saved product (${shop.status})`,
  ).toBe(200);

  expect(
    shop.saved,
    `the ${shop.backend} backend says this product is not saved, although the ` +
      `checklist screen listed it`,
  ).toBe(true);

  // The app's own claim, asked separately. These come apart when the product
  // page renders before its answer arrives, and a shopper then sees an
  // unsaved-looking toggle for a product they saved.
  await expect
    .poll(() => checklistToggleSaysSaved(page), {
      message:
        "the product page does not show this product as saved, although the shop says it is",
      timeout: 30_000,
    })
    .toBe(true);
});

test("WISH-05 removing it from the checklist screen removes it at the shop", async () => {
  await gotoChecklist(page);

  await removeFromChecklistScreen(page, { slug: productSlug });

  const shop = await checklistFromBackend(page);

  expect(
    shop.status,
    `the ${shop.backend ?? "storefront"} backend refused to list the checklist ` +
      `after the product was removed (${shop.status})${shop.message ? `: ${shop.message}` : ""}`,
  ).toBe(200);

  expect(
    shop.slugs,
    `the ${shop.backend} backend still lists the product after its row was ` +
      `removed from the screen, so the row went from the screen only`,
  ).not.toContain(productSlug);

  // Removed at the shop, so the net has nothing left to do.
  productId = null;

  // A fresh load, because everything above could be true of a screen that only
  // spliced its own array.
  await gotoChecklist(page);
  const screen = await readChecklistScreen(page);

  expect(
    screen.empty,
    "the checklist screen does not show its empty panel after the only saved product was removed",
  ).toBe(true);
});
