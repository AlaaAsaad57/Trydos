// WISH-06 — the same saving journey, as a signed-in shopper.
//
// ---------------------------------------------------------------------------
// Why this is a separate file from `wishlist.live.spec.ts`
//
// Not to repeat the guest cases with a session. It is here because signing in
// **changes which server answers**:
//
//   guest or unverified shopper  -> the gateway
//   signed-in verified shopper   -> the core backend
//
// `utils/server/tokenManager.ts:178-190` — a verified shopper (a valid phone in
// `User-Data`) is served entirely by the core backend, and the gateway
// allow-list that carries `/checklist` for everyone else is skipped. So the
// guest file proves the gateway and proves nothing whatever about core, which
// is the server every real signed-in shopper's checklist actually lives on.
//
// The steps are deliberately the same steps, through the same actions. The only
// difference is who is signed in, so a failure here that is absent there is a
// statement about the core backend and nothing else.
//
// It is a separate **file** rather than a case in the other one because lanes
// are chosen per file (`tests/e2e/cli.ts`). This one signs in as the shared
// account and spends a real one-time code, so it belongs in the account lane;
// the guest cases must stay in the fast lane beside it.
//
// ---------------------------------------------------------------------------
// The account is shared, and it may already have saved products
//
// Unlike a throwaway guest, this account is real and other runs and people
// touch it. So the case never assumes an empty checklist. It walks along the
// home page until it finds a product the account has **not** already saved, and
// it puts back exactly what it added. Anything else would either fail for a
// reason that is not a fault, or quietly delete something somebody saved.
//
// ---------------------------------------------------------------------------
// One case, one code
//
// Signing in spends a real one-time code against limits that are not ours, so
// this file signs in once and does everything in that one case. A second case
// would double the cost of the file for one more assertion.

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  currentAuthScreen,
  signedInSession,
} from "./actions/auth";
import { gotoAbout, gotoHome, gotoProductAtOrNull } from "./actions/nav";
import { envValue, hasShopperA } from "./harness/env";
import { newLiveContext } from "./harness/liveSession";
import { prompt } from "./selectors";
import {
  checklistFromBackend,
  checklistScreenShows,
  checklistToggleSaysSaved,
  forgetProductQuietly,
  gotoChecklist,
  openMoreOptions,
  pressChecklistToggle,
  removeFromChecklistScreen,
  savedOnBackend,
  slugOnScreen,
} from "./actions/wishlist";

/** How far along the home page the case will look for a product this account
 *  has not already saved.
 *
 *  Five, because the point is to find an unsaved product, not to survey the
 *  catalogue. An account with the first five products already saved is an
 *  account that needs tidying, and the case says so rather than walking on. */
const PRODUCTS_TO_TRY = 5;

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );
});

test("WISH-06 a signed-in shopper saves and removes a product", async ({
  browser,
}) => {
  // A sign-in, a walk along the home page, and a full save-and-remove round
  // trip against a backend that can be cold. The project default is not enough.
  test.setTimeout(180_000);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  /** Put back whatever this case added, whatever happens to it. */
  let addedProductId: number | null = null;

  try {
    // The static page, not the home page: the auth widget is in the layout, so
    // it is here too, and a search outage cannot blank the page and hide it.
    await gotoAbout(page);

    await attemptAuth(page, {
      intent: "login",
      phone: envValue("TEST_ACCOUNT_PHONE"),
      method: "whatsapp",
      otp: envValue("TEST_ACCOUNT_OTP"),
    });

    const screen = (await currentAuthScreen(page)) ?? "closed";
    expect(screen, `the sign-in ended on the "${screen}" screen`).toMatch(
      /^(welcome|closed)$/,
    );

    // Leave the widget shut: its phone field and the "sign in again" prompt
    // share one marker, so a widget left open makes later readings ambiguous.
    await page.keyboard.press("Escape").catch(() => {});
    await expect(prompt.phoneEntry(page)).toBeHidden();

    // The whole point of this file. Without a verified session the requests
    // below go to the gateway, and the case would silently repeat the guest
    // file against the wrong server while reporting the right words.
    const session = await signedInSession(page);
    expect(
      session.phoneVerified,
      "the app does not treat this visitor as a signed-in shopper, so the checklist below is a guest's and is served by the gateway, not core",
    ).toBe(true);

    let productSlug = "";

    const before = await checklistFromBackend(page);

    expect(
      before.status,
      `the ${before.backend ?? "storefront"} backend refused to list this ` +
        `account's checklist (${before.status})` +
        `${before.message ? `: ${before.message}` : ""}`,
    ).toBe(200);

    // Reading the routing decision rather than trusting it. If this says
    // "gateway", the sign-in did not change the backend and every message
    // below would be naming the wrong server.
    expect(
      before.backend,
      `a signed-in shopper's checklist was answered by "${before.backend}", ` +
        `but a verified account is meant to be served by core ` +
        `(utils/server/tokenManager.ts:178-190)`,
    ).toBe("core");

    await test.step("find a product this account has not already saved", async () => {
      await gotoHome(page);

      for (let index = 0; index < PRODUCTS_TO_TRY; index += 1) {
        await gotoHome(page);
        const opened = await gotoProductAtOrNull(page, { index });
        if (!opened) break;

        const slug = slugOnScreen(page);
        if (slug === "" || before.slugs.includes(slug)) continue;

        productSlug = slug;
        return;
      }

      expect(
        productSlug,
        `none of the first ${PRODUCTS_TO_TRY} products on the home page is ` +
          `free to use — this account has them all saved already, so its ` +
          `checklist needs tidying before this case can run`,
      ).not.toBe("");
    });

    await test.step("the core backend takes the save", async () => {
      await openMoreOptions(page);

      expect(
        await checklistToggleSaysSaved(page),
        "the product page shows this product as already saved, although the shop's list did not have it",
      ).toBe(false);

      const pressed = await pressChecklistToggle(page);
      expect(
        pressed.nowSaved,
        "the checklist toggle did not turn on after it was pressed, so the app itself does not believe the product was saved",
      ).toBe(true);

      const after = await checklistFromBackend(page);

      expect(
        after.status,
        `the ${after.backend ?? "storefront"} backend refused to list the ` +
          `checklist after the save (${after.status})` +
          `${after.message ? `: ${after.message}` : ""}`,
      ).toBe(200);

      expect(
        after.slugs,
        `the ${after.backend} backend does not list the product that was just ` +
          `saved, so the toggle turned green without anything being written`,
      ).toContain(productSlug);

      addedProductId = after.ids[after.slugs.indexOf(productSlug)] ?? null;

      expect(
        addedProductId,
        `the ${after.backend} backend listed the saved product with no usable ` +
          `id, so nothing can ask about this one product on its own`,
      ).not.toBeNull();

      const single = await savedOnBackend(page, {
        productId: addedProductId as number,
      });
      expect(
        single.saved,
        `the ${single.backend} backend lists the product on the checklist but ` +
          `answers "not saved" when asked about it on its own, so the list and ` +
          `the single-product check disagree`,
      ).toBe(true);
    });

    await test.step("the checklist screen shows it", async () => {
      await gotoChecklist(page);

      expect(
        await checklistScreenShows(page, { slug: productSlug }),
        "the checklist screen does not list the product that was saved, so the screen and the shop disagree",
      ).toBe(true);
    });

    await test.step("the core backend takes the removal", async () => {
      await removeFromChecklistScreen(page, { slug: productSlug });

      const after = await checklistFromBackend(page);

      expect(
        after.status,
        `the ${after.backend ?? "storefront"} backend refused to list the ` +
          `checklist after the removal (${after.status})` +
          `${after.message ? `: ${after.message}` : ""}`,
      ).toBe(200);

      expect(
        after.slugs,
        `the ${after.backend} backend still lists the product after its row ` +
          `was removed from the screen, so the row went from the screen only`,
      ).not.toContain(productSlug);

      // Removed at the shop, so the net below has nothing left to do.
      addedProductId = null;
    });
  } finally {
    if (addedProductId !== null) {
      await forgetProductQuietly(page, {
        productId: addedProductId,
      }).catch(() => undefined);
    }
    await context.close();
  }
});
