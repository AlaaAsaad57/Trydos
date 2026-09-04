// BUY-01 to BUY-02 — the money path, against real staging.
//
//   BUY-01  a shopper buys something and then cancels it
//   BUY-02  a visitor with no verified phone is stopped before any order exists
//
// This is `docs/testing/E2E_TEST_DESIGN.md` AC-5 and AC-6, and it is the last
// acceptance criterion of that design that had no spec.
//
// ---------------------------------------------------------------------------
// One test, many steps — and why it is not four tests
//
// BUY-01 places a **real** order on a shared shop and then cancels it. Split
// across four tests, the order would exist at the end of the second one with
// three tests still to run, and the safety net below — which runs when a test
// ends — would cancel it before the test that is supposed to cancel it ever
// starts. So the whole journey is one test, and `test.step()` is what makes the
// failure name the part that broke, exactly as the testing rules require
// (`CLAUDE.md`, rule 8). `profile.live.spec.ts` is the model.
//
// ---------------------------------------------------------------------------
// What this run costs staging, and what it leaves behind
//
// One one-time code, one sign-in, one order placed, and that order cancelled.
// It also empties the account's bag first, on purpose — see below. Nothing else
// is written and nothing is left live.
//
// **The bag is emptied before anything is added.** The account is shared, so a
// run inherits whatever the last one left in it. A journey that adds one product
// to a bag already holding two cannot say afterwards which product it ordered,
// cannot read the bag count as proof its own add worked, and would order two
// strangers' products every night.
//
// ---------------------------------------------------------------------------
// The safety net, and why a green run must never use it
//
// The `orders` fixture holds the order id from the moment it is on screen. If
// this test dies anywhere after that — a refused cancel, a timeout, a crash —
// the fixture cancels the order directly when the test ends
// (`harness/orderCleanup.ts`). Playwright retries are off, so there is no second
// attempt that would place a second order.
//
// A healthy run releases the order after cancelling it through the screens, so
// the net catches nothing. The last step asserts exactly that: a net that has to
// catch something every run is a journey that is quietly not finishing, and
// nothing else would ever say so.
//
// ---------------------------------------------------------------------------
// Two ids, and only one of them is ever on screen
//
// The success panel and the order list show the **group** id. The cancel call
// takes a **pack** id, and one group can hold several packs — one per seller. So
// every screen here is driven by the group id, and the only place a pack id is
// needed is the safety net, which asks the backend for them.
//
// ---------------------------------------------------------------------------
// Nothing here prints an account detail
//
// The order number is printed, and that is deliberate: it is what a reader needs
// to go and look at the order. The account's name, phone and e-mail never leave
// the browser — no step reads them.

import { expect, test } from "./fixtures";
import { attemptAuth, currentAuthScreen } from "./actions/auth";
import { gotoAbout, gotoHome, gotoFirstProduct } from "./actions/nav";
import {
  addOpenProductToBag,
  chooseCashOnDelivery,
  confirmShippingAndPayment,
  emptyTheBag,
  goToCheckout,
  hasDeliveryAddress,
  openCart,
  placeOrder,
} from "./actions/cart";
import {
  attemptCancelOrder,
  findOrderInList,
  gotoOrdersFromSettings,
  openOrderFromList,
  readOrderStatus,
} from "./actions/orders";
import { addAddress, gotoSettings } from "./actions/profile";
import { envValue, hasShopperA } from "./harness/env";
import { newLiveContext } from "./harness/liveSession";
import { checkout } from "./selectors";

/** The address BUY-01 adds when the account has none.
 *
 *  Marked, so an address left on a shared account by a run that died mid-way
 *  reads as "a test stopped here" rather than as somebody's home. Normally
 *  nothing is added at all: the account keeps its address between runs, and this
 *  is the branch that stops a missing address turning into a confusing failure
 *  three steps later. */
const PROBE_ADDRESS = {
  address: "Trydos E2E Buy Probe",
  detail: "Trydos E2E probe address, please delete",
  recipient: "Trydos E2E Probe",
  phone: "963900000001",
};

/** What the app calls an order nobody has acted on yet, and a cancelled one.
 *
 *  Machine values from `order_group_status.value`, which is what the app itself
 *  branches on — never the label beside it, which the backend has already
 *  translated. Both spellings of the cancelled value are accepted because the
 *  two backends do not agree on one, and a journey about cancelling must not
 *  fail over a doubled letter. */
const CANCELLED_VALUES = ["cancelled", "canceled"];

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );
});

test("BUY-01 a shopper buys something with cash on delivery and then cancels it", async ({
  browser,
  orders,
}) => {
  // The whole money path in one test: a sign-in that fans out to five backends,
  // a cart read after every change, a checkout, an order list and a cancel. The
  // project default is nowhere near enough.
  test.setTimeout(15 * 60 * 1000);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  let orderGroupId: string | null = null;

  try {
    await test.step("the shopper signs in", async () => {
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
      expect(
        screen,
        `the sign-in ended on the "${screen}" screen, so nothing below is a signed-in shopper's`,
      ).toMatch(/^(welcome|closed)$/);

      // Leave the widget shut: its phone field and the "sign in again" prompt
      // share one marker, so a widget left open makes later readings ambiguous.
      await page.keyboard.press("Escape").catch(() => {});
    });

    await test.step("the bag starts empty", async () => {
      await gotoHome(page);
      await emptyTheBag(page);
    });

    let bought = "";

    await test.step("a product from the storefront goes into the bag", async () => {
      const opened = await gotoFirstProduct(page);
      expect(
        opened.name,
        "the product page has no title, so there is nothing identifiable to buy",
      ).not.toBe("");

      const added = await addOpenProductToBag(page);
      bought = added.name;

      expect(
        added.lines,
        `"${added.name}" reported as added, but the bag still shows ${added.lines} lines`,
      ).toBe(1);
    });

    await test.step("the bag holds what was added", async () => {
      const opened = await openCart(page);

      // Content, not presence: a bag that shows a line but no product is a
      // partial success, and a partial success is a failure.
      expect(
        opened.lines,
        `the bag was opened after adding "${bought}" and holds ${opened.lines} lines`,
      ).toBe(1);
    });

    await test.step("the bag leads to the checkout screen", async () => {
      const reached = await goToCheckout(page);
      expect(
        reached.reached,
        "Confirm & Continue did not reach the checkout screen — for a shopper " +
          "the app does not treat as phone-verified it opens the verify panel instead",
      ).toBe(true);
    });

    await test.step("the order has a delivery address", async () => {
      if (await hasDeliveryAddress(page)) return;

      // The account has none — normally because another case removed the last
      // one. Add one the way a shopper does, from this same screen.
      const saved = await addAddress(page, PROBE_ADDRESS);
      expect(
        saved,
        "the account had no delivery address and the add-address form could not " +
          "be completed, so the checkout can never go on",
      ).toBe(true);

      await expect(
        checkout.chosenAddress(page).first(),
        "an address was saved but the checkout screen still shows none on the order",
      ).toBeVisible({ timeout: 45_000 });
    });

    await test.step("cash on delivery is offered and chosen", async () => {
      const cod = await chooseCashOnDelivery(page);
      expect(
        cod.offered,
        "the shop offered no cash-on-delivery method for this country and this " +
          "bag, so the only payment this suite may use is unavailable",
      ).toBe(true);
    });

    await test.step("the shipping and payment are confirmed", async () => {
      const reached = await confirmShippingAndPayment(page);
      expect(
        reached.reached,
        "Confirm Shipping & Payment did not reach the review step — the app " +
          "refuses it when there is no default address, no payment method, an " +
          "unverified phone, or a bag holding something no longer available",
      ).toBe(true);
    });

    await test.step("the order is placed and carries a number", async () => {
      const placed = await placeOrder(page);

      // Registered before it is judged. An assertion that failed first would
      // leave a live order on staging that nothing knows about.
      if (placed.orderGroupId) {
        orderGroupId = placed.orderGroupId;
        await orders.register({ groupId: placed.orderGroupId, context, page });
      }

      expect(
        placed.orderGroupId,
        "the checkout did not come back with an order number, so either it was " +
          "refused or it succeeded with nothing to identify the order by",
      ).not.toBeNull();
    });

    await test.step("the order is in the shopper's own list", async () => {
      await checkout.done(page).click();
      await gotoSettings(page);
      await gotoOrdersFromSettings(page);

      const found = await findOrderInList(page, { groupId: orderGroupId! });
      expect(
        found.listed,
        `order ${orderGroupId} was placed but is not in the shopper's order list`,
      ).toBe(true);

      // Not "a status is displayed": a row that shows an order with no state is
      // a partial success, and there would be nothing to compare against after
      // the cancel.
      expect(
        found.status,
        `order ${orderGroupId} is listed with no state on it at all`,
      ).not.toBeNull();
      expect(
        CANCELLED_VALUES,
        `order ${orderGroupId} is already "${found.status}" before anything cancelled it`,
      ).not.toContain(found.status);
    });

    await test.step("the order can be opened", async () => {
      await openOrderFromList(page, { groupId: orderGroupId! });

      const status = await readOrderStatus(page);
      expect(
        status,
        `order ${orderGroupId} opened but its own page shows no state`,
      ).not.toBeNull();
    });

    // Kept once the id is cleared below, so the last step can still name the
    // order it is asking about.
    const cancelled = orderGroupId!;

    await test.step("cancelling it through the screens is offered and works", async () => {
      const attempt = await attemptCancelOrder(page);

      expect(
        attempt.offered,
        `order ${cancelled} does not offer cancelling — the backend answered ` +
          "can_cancele_order false for an order placed moments ago",
      ).toBe(true);
      expect(
        attempt.confirmationShown,
        `order ${cancelled} took a cancel reason but never opened the ` +
          "confirmation, so nothing was ever posted",
      ).toBe(true);

      expect(
        CANCELLED_VALUES,
        `order ${cancelled} still reads "${attempt.statusAfter}" after the ` +
          "cancel was confirmed",
      ).toContain(attempt.statusAfter);

      // Cancelled through the screens, so the safety net has nothing to do.
      orders.release(cancelled);
      orderGroupId = null;
    });

    await test.step("the list agrees the order is cancelled", async () => {
      // A second opinion, and a different one: the page above renders the order
      // it re-read for itself, while the list is a fresh read of every order the
      // shopper has. The two disagreeing is a real failure — it means the cancel
      // was accepted for the screen that asked and stored somewhere else.
      await gotoSettings(page);
      await gotoOrdersFromSettings(page);

      const found = await findOrderInList(page, { groupId: cancelled });
      expect(
        found.listed,
        `order ${cancelled} disappeared from the shopper's list after it was cancelled`,
      ).toBe(true);
      expect(
        CANCELLED_VALUES,
        `the order list still reads "${found.status}" for order ${cancelled}, ` +
          "although its own page reported it cancelled",
      ).toContain(found.status);
    });
  } finally {
    await context.close();
  }

  // A green run cancels its own order, so the net catches nothing. Anything here
  // means the journey did not finish and an order had to be cleared behind it.
  const swept = orders.swept();
  expect(
    swept.map((entry) => entry.groupId),
    "an order had to be cancelled by the safety net, so this journey did not " +
      "finish through the screens",
  ).toEqual([]);
});

test("BUY-02 a visitor with no verified phone is stopped before any order exists", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  try {
    await gotoHome(page);

    const opened = await gotoFirstProduct(page);
    expect(
      opened.name,
      "the product page has no title, so there is nothing to put in a bag",
    ).not.toBe("");

    await addOpenProductToBag(page);
    await openCart(page);

    // Pressing Confirm & Continue as a visitor with no verified phone opens the
    // verify panel in place (`components/cart/OrderButton.tsx`) instead of
    // moving on. This is the gate that keeps a guest out of checkout.
    const reached = await goToCheckout(page);
    expect(
      reached.reached,
      "a visitor with no verified phone reached the checkout screen — the " +
        "phone gate in the cart is not holding",
    ).toBe(false);
  } finally {
    await context.close();
  }
});
