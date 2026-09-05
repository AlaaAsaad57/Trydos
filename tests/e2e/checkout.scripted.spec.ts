// SCRIPT-14 to SCRIPT-20 — the money path's refusals.
//
//   SCRIPT-14  the control: the journey still works against faked answers
//   SCRIPT-15  the shop refuses the order
//   SCRIPT-16  a line in the bag is no longer available
//   SCRIPT-17  a line in the bag cannot be shipped to this country
//   SCRIPT-18  the bag empties between the two checkout steps
//   SCRIPT-20  the credential is refused mid-checkout, renewed, and the order
//              completes
//
// **There is no SCRIPT-19, and the gap is on purpose.** It covered a phone that
// stops being verified between the two checkout steps. A shopper on this app
// verifies once and only once, so the state it drove never occurs; the case was
// removed rather than kept as coverage of something that cannot happen. The id
// is left unused so the numbering keeps meaning the same thing it did before —
// the same reason SCRIPT-06 is missing.
//
// `shopper.live.spec.ts` walks the buy journey that works, on real staging, and
// clears up after itself. It cannot walk any of these: a working shop accepts
// what it is asked, does not sell out a product mid-checkout, and does not
// refuse a credential halfway through. Every one of them is a real branch in the
// app with its own message and its own recovery, and none of them had ever run
// anywhere.
//
// ---------------------------------------------------------------------------
// Nobody signs in here, and nothing real is written
//
// `userProfile` — which is what the cart's phone gate reads — is filled from
// `/customer/info` and from nowhere else (`services/home.ts`). So a faked answer
// is how the app itself learns who it is talking to, and a real sign-in would
// only spend a one-time code per case against limits that are not ours while
// proving nothing these cases are about.
//
// The bag, the saved addresses and the checkout itself are faked for the same
// reason: the screen is built from four answers, and letting any one of them
// reach staging would put a real read — or a real order — behind a case that is
// pretending.
//
// **This is why no case here places a real order.** SCRIPT-14 "places" one and
// the order number it reads back is a constant no shop ever issued, which is
// also how it proves it read the faked answer rather than a real one.
//
// ---------------------------------------------------------------------------
// They run closed
//
// A call this spec did not name is refused and recorded rather than passed
// through, and every case asserts at the end that nothing was refused. Without
// it, a call nobody thought about reaches real staging and nobody finds out —
// and on this path the call nobody thought about could be a checkout.
//
// The guest registration these cases cause is not visible to that guard and
// cannot be: it happens in the Node process while the page is being rendered,
// not in the browser. One throwaway guest per case, the same cost
// `session.live.spec.ts` already pays.
//
// ---------------------------------------------------------------------------
// Why a refusal is judged on the screen **and** on what the shopper was told
//
// Every branch below ends with the order not placed, so "no success panel" is
// true for all of them and distinguishes none of them. Two of them are also
// *silent* by design in the app — the screen simply does not move — so the
// message is the only thing separating "the app handled this" from "the button
// is dead". The messages are recorded from before the first navigation
// (`harness/notifications.ts`) because the app removes each one after five
// seconds, and no wording is ever asserted: every message goes through
// `translateFunction`, so matching a sentence would tie the case to English.

import { expect, test } from "./fixtures";
import {
  chooseCashOnDelivery,
  confirmShippingAndPayment,
  goToCheckout,
  openCart,
  placeOrder,
} from "./actions/cart";
import { gotoHome } from "./actions/nav";
import {
  closeUnnamedCalls,
  mockBackend,
  mockBackendSequence,
  type MockMap,
} from "./actions/mock";
import { newLiveContext } from "./harness/liveSession";
import { messagesShown, recordNotifications } from "./harness/notifications";
import {
  bagEmptiedSince,
  credentialRefusedMidCheckout,
  ENDPOINTS,
  FAKE_ORDER_GROUP_ID,
  scenarios,
} from "./scenarios";
import { checkout } from "./selectors";

/** A page with the fakes in place, the guard on, and the messages recorded.
 *
 *  Order matters and is the same in every case:
 *
 *    1. **The guard first.** It is a `context` route, and a `page` route beats a
 *       `context` route by level whatever the registration order — so the fakes
 *       registered next still run in front of it. Registering it last would not
 *       change that; registering it first keeps the reading order the same as
 *       the running order.
 *    2. **The recorder before the first navigation**, or the first message is
 *       missed.
 *    3. **The fakes before the first navigation too**, because `/customer/info`
 *       and the bag are read while the page boots. */
const openScriptedShopper = async (
  browser: Parameters<typeof newLiveContext>[0],
  map: MockMap,
) => {
  const context = await newLiveContext(browser);
  const guard = await closeUnnamedCalls(context);

  const page = await context.newPage();
  await recordNotifications(page);
  const fakes = await mockBackend(page, map);

  return { context, page, guard, fakes };
};

/** Walk from the home page to the review step, where "Place Order" lives.
 *
 *  Everything before the review step is the same in every case here, so a case
 *  that is about the review step should not re-tell it. A case that is about an
 *  earlier step drives the earlier actions itself instead of calling this. */
const reachTheReviewStep = async (page: Parameters<typeof openCart>[0]) => {
  await gotoHome(page);

  const bag = await openCart(page);
  expect(
    bag.lines,
    "the faked bag did not reach the cart screen, so nothing below is about checkout",
  ).toBe(1);

  const entered = await goToCheckout(page);
  expect(
    entered.reached,
    "the cart did not open the checkout screen for the faked verified shopper",
  ).toBe(true);

  const cod = await chooseCashOnDelivery(page);
  expect(
    cod.offered,
    "the faked bag offers cash on delivery, but the checkout screen drew no such choice",
  ).toBe(true);

  return await confirmShippingAndPayment(page);
};

test("SCRIPT-14 the whole faked journey still places an order", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard, fakes } = await openScriptedShopper(
    browser,
    scenarios.checkout.works,
  );

  try {
    const review = await reachTheReviewStep(page);
    expect(
      review.reached,
      "Confirm Shipping & Payment did not reach the review step, although every " +
        "answer it reads was faked as working",
    ).toBe(true);

    const placed = await placeOrder(page);

    expect(
      placed.panelShown,
      "the checkout was accepted and the app never showed the purchase-complete panel",
    ).toBe(true);

    // The number is a constant no shop ever issued. Reading it back is what
    // proves the case saw its own faked answer rather than a real order that
    // happened to be there — and it is what makes the branches below meaningful,
    // because they are this case with one answer changed.
    expect(
      placed.orderGroupId,
      "the purchase-complete panel was shown with no order number on it, so there " +
        "would be nothing to find the order by",
    ).toBe(FAKE_ORDER_GROUP_ID);

    expect(
      fakes.used(ENDPOINTS.checkoutCashOnDelivery),
      "the checkout fake never matched, so this order may have gone to real staging",
    ).toBe(true);
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});

test("SCRIPT-15 a refused order is not reported as placed, and the shopper is told", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard, fakes } = await openScriptedShopper(
    browser,
    scenarios.checkout.refused,
  );

  try {
    const review = await reachTheReviewStep(page);
    expect(
      review.reached,
      "the case never reached the review step, so the refusal it is about never happened",
    ).toBe(true);

    const placed = await placeOrder(page);

    expect(
      fakes.used(ENDPOINTS.checkoutCashOnDelivery),
      "the checkout was never called, so nothing refused it and this case proves nothing",
    ).toBe(true);

    expect(
      placed.panelShown,
      "the shop refused the order and the app still showed the purchase-complete panel",
    ).toBe(false);

    expect(
      placed.orderGroupId,
      `the shop refused the order, but the app reported order ` +
        `"${placed.orderGroupId}"`,
    ).toBeNull();

    const said = await messagesShown(page);
    expect(
      said.length,
      "the shop refused the order and the app said nothing at all — from the " +
        "shopper's side the Place Order button simply did nothing",
    ).toBeGreaterThan(0);
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});

test("SCRIPT-16 a bag holding something unavailable never reaches the checkout", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard, fakes } = await openScriptedShopper(
    browser,
    scenarios.checkout.bagWentUnavailable,
  );

  try {
    await gotoHome(page);

    const bag = await openCart(page);
    expect(
      bag.lines,
      "the faked bag did not reach the cart screen, so nothing below is about checkout",
    ).toBe(1);

    // The gate is in the **cart**, not in the checkout screen. `GoToOrders`
    // re-reads the bag before it moves anywhere and refuses when any line
    // answers `check_availability: false`, `is_country_restricted: true` or
    // `is_active: false` (`components/cart/OrderButton.tsx`). A version of this
    // case that pressed on to the review step and asserted there would have been
    // asserting one screen after the app had already stopped.
    const entered = await goToCheckout(page);
    expect(
      entered.reached,
      "a bag holding a line the shop answers `check_availability: false` opened " +
        "the checkout screen, so the only thing between it and a placed order is " +
        "two presses",
    ).toBe(false);

    expect(
      fakes.used(ENDPOINTS.checkoutCashOnDelivery),
      "the checkout was called for a bag the shop said was not available",
    ).toBe(false);

    const said = await messagesShown(page);
    expect(
      said.length,
      "the bag holds something unavailable and the shopper was told nothing — " +
        "from their side Confirm & Continue simply did nothing",
    ).toBeGreaterThan(0);
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});

test("SCRIPT-17 a bag holding something this country cannot receive never reaches the checkout", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard, fakes } = await openScriptedShopper(
    browser,
    scenarios.checkout.bagRestrictedByCountry,
  );

  try {
    await gotoHome(page);
    await openCart(page);

    // A different field and a different cause from SCRIPT-16, judged by the same
    // guard in the app. Both are covered rather than one standing in for the
    // other: they are separate reasons a shopper is stopped, and a change that
    // dropped one of the three conditions would leave the other case green.
    const entered = await goToCheckout(page);
    expect(
      entered.reached,
      "a bag holding a line the shop answers `is_country_restricted: true` " +
        "opened the checkout screen",
    ).toBe(false);

    expect(
      fakes.used(ENDPOINTS.checkoutCashOnDelivery),
      "the checkout was called for a bag holding something this country cannot receive",
    ).toBe(false);
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});

test("SCRIPT-18 a bag that empties between the two checkout steps sends the shopper back", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard, fakes } = await openScriptedShopper(
    browser,
    scenarios.checkout.works,
  );

  try {
    await gotoHome(page);
    await openCart(page);

    const entered = await goToCheckout(page);
    expect(
      entered.reached,
      "the cart did not open the checkout screen for the faked verified shopper",
    ).toBe(true);

    const cod = await chooseCashOnDelivery(page);
    expect(
      cod.offered,
      "the faked bag offers cash on delivery, but the checkout screen drew no such choice",
    ).toBe(true);

    // Emptied **here**, after the payment method is chosen and before the bag is
    // re-read. Anything earlier changes a different screen: an empty bag has a
    // total of zero, and a zero total disables the cash-on-delivery choice — so
    // the case would fail on a control it was never about.
    await mockBackend(page, bagEmptiedSince);

    const review = await confirmShippingAndPayment(page);
    expect(
      review.reached,
      "the bag emptied between the two checkout steps and the app still reached " +
        "the review step, where Place Order would post a checkout for nothing",
    ).toBe(false);

    expect(
      fakes.used(ENDPOINTS.checkoutCashOnDelivery),
      "a checkout was posted for an empty bag",
    ).toBe(false);

    await expect(
      checkout.placeOrder(page),
      "an empty bag still shows a Place Order control",
    ).toBeHidden();
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});

test("SCRIPT-20 a credential refused mid-checkout is renewed and the order completes", async ({
  browser,
}) => {
  test.setTimeout(5 * 60 * 1000);

  const { context, page, guard } = await openScriptedShopper(
    browser,
    scenarios.checkout.works,
  );

  // The checkout answers `401` once and then accepts. Between the two the app
  // renews the credential through `/api/auth/refresh`, which the map answers.
  // A single-answer map cannot express this: the same endpoint has to behave
  // differently the second time, and that difference *is* the branch.
  const order = await mockBackendSequence(
    page,
    ENDPOINTS.checkoutCashOnDelivery,
    credentialRefusedMidCheckout,
  );

  try {
    const review = await reachTheReviewStep(page);
    expect(
      review.reached,
      "the case never reached the review step, so the refusal it is about never happened",
    ).toBe(true);

    const placed = await placeOrder(page);

    // Both answers consumed is what "it was retried" means here. Counting is the
    // only thing that separates a retry from a checkout that was never refused
    // at all — one consumed answer would mean the app took the `401` and stopped.
    expect(
      order.consumed(),
      `the checkout was called ${order.consumed()} time(s): a refused credential ` +
        "was never exchanged and the order was never tried again",
    ).toBe(order.total());

    expect(
      placed.panelShown,
      "the credential was renewed and the second attempt accepted, but the app " +
        "never showed the purchase-complete panel",
    ).toBe(true);

    expect(
      placed.orderGroupId,
      "the order placed after the credential was renewed carries no number",
    ).toBe(FAKE_ORDER_GROUP_ID);
  } finally {
    expect(
      guard.blocked(),
      "this case reached calls it never named, and each one went nowhere",
    ).toEqual([]);
    await context.close();
  }
});
