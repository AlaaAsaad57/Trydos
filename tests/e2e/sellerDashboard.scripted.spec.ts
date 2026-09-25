// SCRIPT-26 — the seller dashboard for a seller with a small role.
//
// The QA seller holds every permission, so the live suite only ever sees the
// dashboard say "yes". There is no second seller account with a smaller role,
// so the smaller role is faked: the permissions answer
// (`/shop/auth/permissions`) is replaced, and nothing else is. The shop, its
// products and its record are the QA shop's real data.
//
// **What this proves, and what it does not.** It proves the dashboard's own
// gating: which sections it offers, what it shows at a section the role may not
// open, and that a section the role may read but not change is read-only. It
// does NOT prove the core backend refuses the same requests — the session
// behind the fake still holds every permission. The backend's own check needs
// a real account with a small role.
//
// **A real session, so no trace.** The project default records a trace on
// failure, and a trace archives every request header — the QA seller's
// credential among them. So this file turns the trace off, the same way
// `profile.scripted.spec.ts` does.

import { expect, test } from "./fixtures";
import { gotoAbout } from "./actions/nav";
import { gotoSellerDashboard, offeredTabs } from "./actions/sellerDashboard";
import { mockBackend } from "./actions/mock";
import { ENDPOINTS, sellerWithPermissions } from "./scenarios";
import { sellerDashboard, shopInfo } from "./selectors";
import { handOnSession, openSignedInSession } from "./harness/liveSession";
import {
  NO_QA_SEED_REASON,
  QA_SELLER_SESSION_PATH,
  qaSeedRan,
  qaSellerSessionSaved,
  readQaSeedState,
} from "./harness/qaSeedState";
import type { DashboardTab } from "./selectors";

test.use({ trace: "off" });

/** The country the QA shop is seeded in. The dashboard endpoints read the
 *  country from the header, so the case must be on the same one. */
const QA_COUNTRY = "sy";

/** The small role: it may see products and read the shop's record, nothing
 *  more. */
const SMALL_ROLE = ["READ_PRODUCTS", "READ_SHOP_INFO"];

/** What that role must be offered on the home screen. `permissions` is drawn
 *  for every account. */
const OFFERED: DashboardTab[] = ["products", "shopInfo", "permissions"];

/** What that role must not be offered. Each one is checked by name. */
const WITHHELD: DashboardTab[] = [
  "boutiques",
  "locations",
  "users",
  "orders",
  "gallery",
  "stories",
  "comments",
  "excel",
];

test.beforeEach(() => {
  test.skip(!qaSeedRan() || !qaSellerSessionSaved(), NO_QA_SEED_REASON);
});

test("SCRIPT-26 a seller with a small role is offered only its sections, refused the rest, and cannot change the shop's record", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const seed = readQaSeedState();

  const context = await openSignedInSession(
    browser,
    QA_SELLER_SESSION_PATH,
    "the QA seed (setup project)",
  );
  const page = await context.newPage();

  try {
    const fakes = await mockBackend(
      page,
      sellerWithPermissions(seed.sellerId, SMALL_ROLE),
    );
    await gotoAbout(page, { country: QA_COUNTRY });

    await test.step("the home screen offers only the role's sections", async () => {
      await gotoSellerDashboard(page, { sellerId: seed.sellerId });
      expect(
        fakes.used(ENDPOINTS.sellerPermissions),
        "the dashboard never asked for the permissions, so the small role was never applied and nothing below is about it",
      ).toBe(true);

      const tiles = await offeredTabs(page);
      for (const tab of OFFERED) {
        expect(
          tiles.includes(tab),
          `the role may open "${tab}", but the home screen does not offer it`,
        ).toBe(true);
      }
      for (const tab of WITHHELD) {
        expect(
          tiles.includes(tab),
          `the role may not open "${tab}", but the home screen offers it`,
        ).toBe(false);
      }
    });

    await test.step("a direct link to a section the role may not open is refused by name", async () => {
      await gotoSellerDashboard(page, { sellerId: seed.sellerId, tab: "locations" });
      await expect(
        sellerDashboard.accessDenied(page),
        "the role holds no locations permission, but the Locations section drew no Access Denied",
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step("the shop's record is shown, but cannot be changed", async () => {
      await gotoSellerDashboard(page, { sellerId: seed.sellerId, tab: "shopInfo" });
      await expect(
        shopInfo.nameInput(page),
        "the role may read the shop's record, but the Shop Info section drew no form",
      ).toBeVisible({ timeout: 45_000 });
      await expect(
        shopInfo.nameInput(page),
        "the role holds no UPDATE_SHOP_INFO, but the shop name can be edited",
      ).toBeDisabled();
      await expect(
        shopInfo.contactInput(page),
        "the role holds no UPDATE_SHOP_INFO, but the contact can be edited",
      ).toBeDisabled();
      await expect(
        shopInfo.addressInput(page),
        "the role holds no UPDATE_SHOP_INFO, but the address can be edited",
      ).toBeDisabled();
      await expect(
        shopInfo.saveButton(page),
        "the role holds no UPDATE_SHOP_INFO, but the Shop Info section offers Save",
      ).toHaveCount(0);
    });
  } finally {
    // The page did authenticated work as the QA seller, so the jar is handed
    // on as it is now — the next reader must not open a spent credential.
    await handOnSession(context, page, QA_SELLER_SESSION_PATH).catch(
      () => undefined,
    );
    await context.close();
  }
});
