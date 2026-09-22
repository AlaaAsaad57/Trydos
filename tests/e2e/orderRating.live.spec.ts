// CMT-09 — one order walks four products, and the review it earns is written,
// changed and removed.
//
// This is the review half of the comments journey. `comments.live.spec.ts`
// covers the other half: a shopper asking the shop a question. A review is a
// different object — it carries stars, it is written from an order, and the app
// refuses to write one until the shop says the parcel arrived.
//
// ---------------------------------------------------------------------------
// Why this is one case and not eight
//
// The whole thing is a single chain of writes on shared staging. Step 4 has no
// meaning without step 3, and an order abandoned halfway is a real order on a
// real shop that nothing else will tidy. Playwright's `orders` net is
// **test-scoped**: an order registered in one case is cancelled the moment that
// case ends. Split into eight cases, the order would be cancelled before the
// admin ever saw it.
//
// So it is one case with named steps, the shape `profile.live.spec.ts` uses. A
// failure names the step and, where the step crossed one, the product that
// refused.
//
// ---------------------------------------------------------------------------
// The four products this case drives, and why each one is unavoidable
//
//   1. **the storefront** — the shopper buys the QA product and later writes
//      the review;
//   2. **the admin dashboard** — moves the order to `ready_to_shipping`, which
//      is what hands it to the fleet. Nothing in the storefront can do this;
//   3. **the fleet dashboard** — the delivery product, and the only thing that
//      can set `delivered`;
//   4. **the comments backend** — takes the review, and is watched on every
//      write because the screen hides a refusal.
//
// The storefront draws the rating stars only for a delivered order
// (`OrderItemsList.tsx`, `isDelevired`). That one line is why steps 2 and 3
// exist at all: without them there is no way to reach the rating screen, and a
// case that tried would sit waiting for a control that is never drawn.
//
// ---------------------------------------------------------------------------
// What this case leaves behind, and why that is the honest answer
//
// **A delivered order on the QA shop.** The safety net cancels an order this
// run abandoned, and that is exactly what it is for — a case that dies before
// delivery leaves nothing behind. But an order that reached `delivered` can no
// longer be cancelled by anyone, so once the fleet confirms it the order is
// released from the net on purpose rather than left for it to fail on.
//
// Everything else it writes, it removes: the review is deleted in the last
// step, by the shopper, through the screens a shopper uses.
//
// The order is placed against the **QA shop's own product**, never a real
// seller's, so no real business is ever asked to ship anything.

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  requireSignedInShopper,
} from "./actions/auth";
import {
  CASH_ON_DELIVERY_COUNTRY,
  gotoAbout,
  gotoHome,
} from "./actions/nav";
import {
  addQaProductToBag,
  chooseCashOnDelivery,
  chosenAddressTitle,
  confirmShippingAndPayment,
  describeCheckout,
  emptyTheBag,
  goToCheckout,
  hasDeliveryAddress,
  openCart,
  placeOrder,
} from "./actions/cart";
import {
  findOrderInList,
  gotoOrdersFromSettings,
  openOrderFromList,
  readOrderStatus,
} from "./actions/orders";
import { gotoSettings } from "./actions/profile";
import { newRunToken } from "./actions/story";
import {
  deleteBuyersComment,
  editBuyersComment,
  openProductFromOrder,
  rateOrderedProduct,
  starsShownOnOrder,
  waitForBuyersComment,
  buyersCommentText,
} from "./actions/productRating";
import { markOrderStatusInAdmin } from "./harness/adminOrders";
import { markOrderDeliveredInFleet } from "./harness/fleetOrders";
import { type CallRecord } from "./harness/adminSession";
import {
  envValue,
  hasAdmin,
  hasFleet,
  hasShopperA,
} from "./harness/env";
import { NO_QA_SEED_REASON, qaSeedRan } from "./harness/qaSeedState";
import { newLiveContext } from "./harness/liveSession";

/** This run's mark, carried inside the words of the review it writes.
 *
 *  The mark-in-data idiom the rest of the suite uses. It is what lets the last
 *  steps find **this run's** review on a product page that also carries real
 *  shoppers' reviews, and never act on one of theirs. */
const RUN_TOKEN = newRunToken();

const REVIEW_TEXT = `trydos qa ${RUN_TOKEN} review from the order`;
const EDITED_REVIEW_TEXT = `trydos qa ${RUN_TOKEN} edited review from the order`;

/** The stars the review carries, and what it is changed to.
 *
 *  Two different numbers, because the edit has to prove it changed something —
 *  the app keeps its save control shut while nothing has. */
const FIRST_STARS = 5;
const EDITED_STARS = 4;

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );

  // The only product this case may buy is the seed's. No seed record means no
  // QA product, and the honest answer is to skip — not to buy something a real
  // seller owns and ask them to ship it.
  test.skip(!qaSeedRan(), NO_QA_SEED_REASON);

  // The two dashboards. Without either one the order can never reach
  // `delivered`, and without `delivered` there is nothing to rate. A missing
  // setting is a skip, never a red case: a fresh checkout with no secrets must
  // still run green.
  test.skip(
    !hasAdmin(),
    "ADMIN_DASHBOARD_BASE_URL, ADMIN_DASHBOARD_EMAIL or ADMIN_DASHBOARD_PASSWORD is not configured. Without the admin dashboard no order can be marked ready to ship, so nothing here can reach a rating.",
  );
  test.skip(
    !hasFleet(),
    "FLEET_BASE_URL, FLEET_EMAIL or FLEET_PASSWORD is not configured. The fleet is the only product that can mark an order delivered, and the storefront draws the rating stars for a delivered order only.",
  );
});

test("CMT-09 a delivered order earns a review, which is written, changed and removed", async ({
  browser,
  orders,
}) => {
  // Four products, a real purchase, and two hand-overs between backends that
  // each take their own time. The project default is nowhere near enough.
  test.setTimeout(30 * 60 * 1000);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  /** Every write this case made outside the storefront. Reported at the end so
   *  the run can say it stayed inside its own data. */
  const record: CallRecord[] = [];

  let orderGroupId: string | null = null;
  let adminOrderId: string | null = null;
  let reviewId: string | null = null;

  try {
    // ---- the storefront: buying -------------------------------------------

    await test.step("the shopper signs in", async () => {
      // The static page, not the home page: the auth widget is in the layout,
      // so it is here too, and a search outage cannot blank the page and hide
      // it. Syria, because the shop offers cash on delivery there and nowhere
      // else, and cash on delivery is the only payment this suite may use.
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      // Asked of the app, not read off the widget: one refused leg of the
      // sign-in fan-out leaves the widget on the PIN screen for a shopper who
      // is signed in. AUTH-01 is the case that judges every leg.
      await requireSignedInShopper(page, {
        outcome,
        who: "the shopper who places this order and writes the review",
      });

      await page.keyboard.press("Escape").catch(() => {});
    });

    await test.step("the bag holds the QA product and nothing else", async () => {
      await gotoHome(page);
      await emptyTheBag(page);

      await addQaProductToBag(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const opened = await openCart(page);

      // Content, not presence: a bag showing a line but no product is a partial
      // success, and a partial success is a failure.
      expect(
        opened.lines,
        `the bag was filled with the QA product and holds ${opened.lines} lines, so this case cannot be sure what it is about to buy`,
      ).toBe(1);
    });

    await test.step("the bag leads to the checkout screen", async () => {
      const reached = await goToCheckout(page);
      expect(
        reached.reached,
        "Confirm & Continue did not reach the checkout screen. It opens the " +
          `verify panel instead of moving on, and: ${reached.who}`,
      ).toBe(true);
    });

    await test.step("the order has a delivery address", async () => {
      // **Waited for, not read once.** The checkout fetches the address list
      // after the screen has already drawn, and until it answers the panel says
      // "No Address Selected" beside its own spinner. A single read here is a
      // race, and it lost one: the first run of this case reported an account
      // with twenty addresses as having none.
      //
      // Bounded, because "the account really has no address" has to stay an
      // answer this step can give.
      const present = await expect
        .poll(async () => await hasDeliveryAddress(page), {
          timeout: 45_000,
          intervals: [1_000, 2_000, 3_000, 5_000, 5_000],
        })
        .toBe(true)
        .then(() => true)
        .catch(() => false);

      // Deliberately not adding one. `BUY-01` owns the probe-address
      // bookkeeping — making one, refusing to order onto a stranded one and
      // putting the real one back. A second case inventing addresses on the
      // same shared account is how a run ends up ordering to nowhere.
      expect(
        present,
        `the account has no delivery address, so this order cannot be shipped and the journey cannot reach a delivery. The address this checkout shows is "${await chosenAddressTitle(
          page,
        )}" — give the account a real default address and run again`,
      ).toBe(true);
    });

    await test.step("cash on delivery is offered and chosen", async () => {
      const cod = await chooseCashOnDelivery(page);

      expect(
        cod.offered,
        `the shop offered no cash-on-delivery method in "${CASH_ON_DELIVERY_COUNTRY}" ` +
          "for this bag, so the only payment this suite may use is unavailable",
      ).toBe(true);

      // Offered is not chosen, and the checkout needs it chosen.
      expect(
        cod.chosen,
        `cash on delivery is offered but is not the chosen payment method, so the checkout will refuse to go on without saying why. ${cod.note}`,
      ).toBe(true);
    });

    await test.step("the shipping and payment are confirmed", async () => {
      const reached = await confirmShippingAndPayment(page);
      expect(
        reached.reached,
        `Confirm Shipping & Payment did not reach the review step, and the reason is: ${reached.refusal}`,
      ).toBe(true);
    });

    await test.step("the order is placed and carries a number", async () => {
      const placed = await placeOrder(page);

      // Registered before it is judged. An assertion that failed first would
      // leave a live order on staging that nothing knows about.
      if (placed.orderGroupId) {
        orderGroupId = placed.orderGroupId;
        await orders.register({
          groupId: placed.orderGroupId,
          context,
          page,
        });
      }

      expect(
        placed.panelShown,
        `the checkout never reached the success panel, and ${describeCheckout(
          placed.attempt,
        )}`,
      ).toBe(true);

      expect(
        placed.orderGroupId,
        "the success panel appeared but carried no order number, so the order exists and nothing here can name it",
      ).toBeTruthy();
    });

    // ---- the admin dashboard ----------------------------------------------

    await test.step("the admin marks this run's own order ready to ship", async () => {
      // `markOrderStatusInAdmin` proves the order is this run's before it
      // changes anything: it opens the order's own page and compares the group
      // id printed there with the one the checkout returned. A row it cannot
      // identify is refused, never changed.
      const order = await markOrderStatusInAdmin(browser, {
        groupId: String(orderGroupId),
        status: "ready_to_shipping",
        record,
      });

      adminOrderId = order.orderId;

      expect(
        adminOrderId,
        `the admin dashboard moved the order for group ${orderGroupId} but gave no order id back, and the fleet searches by that id`,
      ).toBeTruthy();
    });

    // ---- the fleet dashboard ----------------------------------------------

    await test.step("the fleet receives the delivery and marks it delivered", async () => {
      // The order reaches the fleet only because the admin moved it. That
      // hand-over is a backend step this repository has no view of, so the
      // helper waits for it, bounded, and names the fleet if it never arrives.
      const journey = await markOrderDeliveredInFleet(browser, {
        orderId: String(adminOrderId),
        record,
      });

      expect(
        journey.status,
        `the fleet was asked to deliver order ${adminOrderId} and its list now shows "${journey.status}"`,
      ).toBe("delivered");
    });

    // ---- back to the storefront -------------------------------------------

    await test.step("the shopper's own order page shows it delivered", async () => {
      await gotoSettings(page);
      await gotoOrdersFromSettings(page);

      const found = await findOrderInList(page, {
        groupId: String(orderGroupId),
      });

      expect(
        found.listed,
        `order ${orderGroupId} was placed by this shopper but is not in their own order list, so the shopper cannot reach the order the fleet just delivered`,
      ).toBe(true);

      await openOrderFromList(page, { groupId: String(orderGroupId) });

      // **Read after a reload, and bounded.** The fleet wrote the status to its
      // own product; the storefront reads it from the core backend, and the two
      // are joined by a hand-over that takes its own time. A single read here
      // reports a slow hand-over as a delivery that never happened.
      const reached = await expect
        .poll(
          async () => {
            await page
              .reload({ waitUntil: "domcontentloaded" })
              .catch(() => undefined);
            return await readOrderStatus(page);
          },
          {
            timeout: 180_000,
            intervals: [10_000, 10_000, 15_000, 15_000, 30_000],
          },
        )
        .toBe("delivered")
        .then(() => true)
        .catch(() => false);

      expect(
        reached,
        `the fleet marked order ${adminOrderId} delivered, but the shopper's own order page still shows "${await readOrderStatus(
          page,
        )}" three minutes later. The core backend has not taken the fleet's change, so the shopper can never rate what they were sent`,
      ).toBe(true);

      // Released on purpose. A delivered order cannot be cancelled by anyone,
      // so leaving it registered would make the safety net report a failure for
      // work it was never able to do.
      orders.release(String(orderGroupId));
    });

    await test.step("the shopper rates the product they were sent", async () => {
      await rateOrderedProduct(page, {
        stars: FIRST_STARS,
        comment: REVIEW_TEXT,
      });
    });

    await test.step("the order page shows the stars the shopper gave", async () => {
      // **No reload here, on purpose.** The app re-reads the order by itself
      // once a rating lands (`router.refresh()` and `getOrderDetails()` in
      // `RatingOrderItem`), so there is nothing to force. A reload would restart
      // the client-side fetch and the read would race the skeleton — which is
      // what it did on the first run, reporting 0 stars for a rating the shop
      // had accepted.
      const held = await expect
        .poll(async () => await starsShownOnOrder(page), {
          timeout: 90_000,
          intervals: [2_000, 3_000, 5_000, 5_000, 10_000, 10_000],
        })
        .toBe(FIRST_STARS)
        .then(() => true)
        .catch(() => false);

      if (!held) {
        const drawn = await starsShownOnOrder(page);

        expect(
          held,
          drawn === -1
            ? "the review was accepted, but the shopper's order page never finished drawing the order, so the rating cannot be read back from it at all"
            : `the review was accepted with ${FIRST_STARS} stars, but the shopper's order page draws ${drawn} of them. The order page reads the rating back from the comments backend, so the two disagree about what was written`,
        ).toBe(true);
      }
    });

    // ---- the product page -------------------------------------------------

    await test.step("the product page is reached from the order", async () => {
      await openProductFromOrder(page);
    });

    await test.step("the review is in the product's Buyers Comment section", async () => {
      const found = await waitForBuyersComment(page, { text: REVIEW_TEXT });
      reviewId = found.id;

      // Content, not presence. A card that is drawn but carries none of the
      // shopper's words is a partial success, and a partial success is a
      // failure.
      const shown = await buyersCommentText(page, { id: reviewId });
      expect(
        shown.includes(RUN_TOKEN),
        "the product page draws this run's review card, but the words inside it are not the ones that were written",
      ).toBe(true);
    });

    await test.step("the shopper changes the words of their own review", async () => {
      await editBuyersComment(page, {
        id: String(reviewId),
        stars: EDITED_STARS,
        newText: EDITED_REVIEW_TEXT,
      });

      const shown = await expect
        .poll(
          async () => await buyersCommentText(page, { id: String(reviewId) }),
          { timeout: 30_000, intervals: [2_000, 3_000, 5_000, 10_000] },
        )
        .toContain("edited review")
        .then(() => true)
        .catch(() => false);

      expect(
        shown,
        "the comments backend took the change, but the review on the product page still shows the words it had before. The app changes the card only once the server confirms, so the two disagree about what is stored",
      ).toBe(true);
    });

    await test.step("the shopper removes their own review", async () => {
      await deleteBuyersComment(page, { id: String(reviewId) });
    });

    await test.step("the removal survives a reload", async () => {
      // The app hides a removed review straight away by remembering it was
      // removed. Only a reload asks the shop, and a write that never landed
      // comes back here.
      await page.reload({ waitUntil: "domcontentloaded" });

      const stillThere = await page
        .locator(`#comment-${reviewId}`)
        .first()
        .isVisible()
        .catch(() => false);

      expect(
        stillThere,
        `the review was removed and the comments backend accepted it, but after a reload the product page is showing it again. The removal did not last`,
      ).toBe(false);
    });

    // Said out loud rather than left implied: this case changed two orders on
    // two other products, and both were this run's own.
    expect(
      record.length,
      "this case reached the end without recording a single change on the admin or the fleet, which means one of those legs did nothing and the order was already where it needed to be",
    ).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
