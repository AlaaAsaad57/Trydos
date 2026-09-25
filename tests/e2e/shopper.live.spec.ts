// BUY-01 to BUY-05 — the money path, against real staging.
//
//   BUY-01  a shopper buys something and then cancels it
//   BUY-02  a visitor with no verified phone is stopped before any order exists
//   BUY-03  the bag's money figures, and choosing another delivery address
//   BUY-04  changing and removing a line in the bag
//   BUY-05  a guest's bag survives sign-in
//
// BUY-01 is the only one that places a real order. BUY-03, BUY-04 and BUY-05
// stop well before the checkout posts anything: BUY-03 never chooses a payment
// method, and BUY-04 and BUY-05 never leave the bag.
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
// BUY-01: one one-time code, one sign-in, one order placed, and that order
// cancelled. It also empties the account's bag first, on purpose — see below.
// Nothing else is written and nothing is left live.
//
// BUY-05: two one-time codes, two sign-ins and one sign-out, one line added as a
// guest and removed again after sign-in. It empties the account's bag before
// the guest part and, when it fails half-way, in its teardown.
//
// **The teardowns empty the whole bag of the shared shopper, not only their own
// line.** That account belongs to this suite. Do not use it for testing by hand
// while the suite may run — a run will empty the bag under you.
//
// **The bag is emptied before anything is added.** The account is shared, so a
// run inherits whatever the last one left in it. A journey that adds one product
// to a bag already holding two cannot say afterwards which product it ordered,
// cannot read the bag count as proof its own add worked, and would order two
// strangers' products every night.
//
// ---------------------------------------------------------------------------
// Where it shops, and why it has to be Syria
//
// **The shop offers cash on delivery in Syria only.** Every other payment takes
// real money or a real card, so cash on delivery is the only one this journey
// may use, and that fixes the country. In `iq`, `tr` or `lb` the cart answer
// carries no `cash_on_delivery` in `available_payment_method`, no cash row is
// drawn, and the journey stops at the payment step with nothing wrong in this
// repository. So BUY-01 seeds `sy` before its first navigation
// (`CASH_ON_DELIVERY_COUNTRY` in `actions/nav.ts`) rather than taking the `iq`
// the rest of the suite uses.
//
// It also fixes the money: prices, the bag total and the order are all in the
// Syrian currency, and the delivery address the journey adds is a Syrian one,
// because the region picker only offers the current country's regions.
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
//
// **The account's own address is never printed either.** BUY-03 has to know
// which address was the account's default before it started, so it can put that
// one back. It holds the **id**, never the text, and every message it writes
// names an id or the probe it created itself.
//
// ---------------------------------------------------------------------------
// Four one-time codes per run
//
// BUY-01 signs in and hands its session on. BUY-03 signs in for itself and hands
// its session on, so BUY-04 never inherits a credential the backend has since
// rotated — the fault `handOnSession` was written for. BUY-02 sits between them
// and is harmless: it builds its own context with no session and writes nothing.
//
// BUY-05 signs in **twice**, in a context of its own, and uses no saved
// session. The first sign-in is only there to empty the shared account's bag;
// without it, a line an earlier run left behind would make "the guest's line is
// still there" pass when the merge had lost it. The second sign-in is the one
// under test.
//
// So a run spends four codes: BUY-01, BUY-03 and two by BUY-05. The shop
// rate-limits them per phone number, so do not add a sign-in here without
// counting it.
//
// ---------------------------------------------------------------------------
// What BUY-03 writes, and what puts it back
//
// BUY-03 creates one address through the API, makes it the account's default,
// edits its title, and then undoes all of it in a `test.afterEach`. The teardown
// runs through the API and not through the screens, because the case has already
// closed its browser context by the time it runs — there is nothing left to
// click.
//
// The address it creates carries `ADDRESS_PROBE_MARKER` and this run's own tag,
// so an address stranded by a killed run is recognisable and cannot be confused
// with one this run made. BUY-01 refuses to place an order onto a stranded one.

import { expect, test } from "./fixtures";
import {
  attemptAuth,
  requireSignedInShopper,
  signedInSession,
  signOutAndSettle,
} from "./actions/auth";
import { CASH_ON_DELIVERY_COUNTRY, gotoAbout, gotoHome } from "./actions/nav";
import {
  addQaProductToBag,
  bagLineName,
  bagLineNames,
  bagLineQuantity,
  type CartMoneyAnswer,
  changeLineQuantity,
  closeCart,
  chooseAddressNamed,
  chooseCashOnDelivery,
  chosenAddressTitle,
  describeCheckout,
  confirmShippingAndPayment,
  editAddressTitleFromSheet,
  emptyTheBag,
  goToCheckout,
  hasDeliveryAddress,
  lineCanHoldMore,
  expectedFigureFor,
  matchesSentAmount,
  openAddressList,
  openCart,
  placeOrder,
  applyCouponCode,
  readCartMoney,
  readCheckoutTotal,
  readShopCurrency,
  removeLineNamed,
  returnToBag,
  waitForGoodRead,
  watchCartMoney,
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
import { NO_QA_SEED_REASON, qaSeedRan } from "./harness/qaSeedState";
import {
  forgetSavedSession,
  handOnSession,
  newLiveContext,
  openSignedInSession,
  SESSION_STATE,
} from "./harness/liveSession";
import { throughProxyInPage } from "./harness/orderCleanup";
import { redact } from "./harness/redact";
import { waitForRenewalSettled } from "./harness/renewalGate";
import { snapshotCredentials } from "./harness/session";
import { cart, checkout } from "./selectors";

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

/** The mark BUY-03 puts on the address it creates.
 *
 *  Deliberately **not** the same words as `PROBE_ADDRESS.address` above. That
 *  one is an address BUY-01 adds for itself and then really does deliver an
 *  order to, so a guard that refused every "Trydos E2E …" address would refuse
 *  BUY-01's own normal path. This mark names the other thing: an address that
 *  exists only to be tapped and must never receive an order. */
const ADDRESS_PROBE_MARKER = "Trydos E2E Address Probe";

/** This run's own tag, so two runs cannot make the same address title.
 *
 *  It matters when a run is killed. The teardown covers a failed assertion, not
 *  a `SIGKILL`, so an address can be stranded — and a stranded one has to be
 *  told apart from the one the current run is working with. */
const RUN_TAG = Date.now().toString(36);

/** The address BUY-03 creates, taps, and takes away again.
 *
 *  Sixteen fields, because that is what `AddAddressList` sends
 *  (`services/order.ts:254-270`) and a short body is refused by the core
 *  backend. The region parts are what the app's own form sends when the picker
 *  filled nothing in. */
const addressProbeBody = (
  title: string,
): Record<string, string | number | null> => ({
  latitude: null,
  longitude: null,
  address: title,
  address_detail: "Trydos E2E probe address, please delete",
  country: "Syria",
  iso: CASH_ON_DELIVERY_COUNTRY,
  city: "Not Entered",
  province: "Not Entered",
  town: "Not Entered",
  street: "Not Entered",
  building: "Not Entered",
  zip: "123123",
  contact_person_name: "Trydos E2E Probe",
  phone: "963900000002",
  alternative_phone: "",
});

/** One saved address, as the core backend returns it. */
type SavedAddress = { id: number; address: string; is_default: number };

/** Read the account's saved addresses straight from the core backend.
 *
 *  The point of asking again rather than reading the copy the browser holds:
 *  the app writes its own local copy whether or not the backend accepted the
 *  change (`services/order.ts:243-248`), so the browser's list agrees with a
 *  refusal. `AC-2` is this read, and only this read. */
const readSavedAddresses = async (
  page: import("@playwright/test").Page,
): Promise<{ status: number; addresses: SavedAddress[]; said: string }> => {
  const answer = await throughProxyInPage(page, {
    target: "/customer/address/list",
    method: "GET",
    country: CASH_ON_DELIVERY_COUNTRY,
    language: "en",
  });

  const body = answer.json as
    | { message?: string; data?: SavedAddress[] }
    | null;

  return {
    status: answer.status,
    addresses: body?.data ?? [],
    // The backend's own words, so a failure quotes what the shop said rather
    // than only the number it said it with. Never a token: this endpoint
    // answers addresses, and only the message field is taken.
    said: `/customer/address/list answered ${answer.status}${
      body?.message ? `: ${body.message}` : ""
    }`,
  };
};

test.beforeEach(() => {
  test.skip(
    !hasShopperA(),
    "TEST_ACCOUNT_PHONE or TEST_ACCOUNT_OTP is not configured — see tests/e2e/README.md.",
  );

  // **Every case in this file fills a bag, and the only product any of them may
  // fill it with is the seed's.** No seed record means no QA product, and the
  // honest answer is to skip and say so — not to buy something a real seller
  // owns, and not to fail as though the QA product were broken.
  //
  // This is the downstream half of the setup project's contract. The seed skips
  // rather than fails when a setting is missing, precisely so the rest of the
  // lane keeps running; without this line that kindness turned into four red
  // cases blaming a product address.
  test.skip(!qaSeedRan(), NO_QA_SEED_REASON);
});

test("BUY-01 a shopper buys something with cash on delivery and then cancels it", async ({
  browser,
  orders,
}) => {
  // The whole money path in one test: a sign-in that fans out to five backends,
  // a cart read after every change, a checkout, an order list and a cancel. The
  // project default is nowhere near enough.
  test.setTimeout(15 * 60 * 1000);

  // Thrown away before this case signs in, the way every case that owns a
  // session does (`auth.live.spec.ts:99`, `profile.live.spec.ts:238`). A file
  // left by an earlier run holds a credential the backend has moved on from, so
  // BUY-03 must never open one this run did not write.
  forgetSavedSession(SESSION_STATE.shopper);

  const context = await newLiveContext(browser);
  const page = await context.newPage();

  let orderGroupId: string | null = null;

  try {
    await test.step("the shopper signs in", async () => {
      // The static page, not the home page: the auth widget is in the layout, so
      // it is here too, and a search outage cannot blank the page and hide it.
      //
      // Syria, not the country the rest of the suite uses: the shop offers cash
      // on delivery there and nowhere else, and cash on delivery is the only
      // payment this journey may use. See CASH_ON_DELIVERY_COUNTRY.
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      // **Asked of the app, not read off the widget.** One refused leg of the
      // sign-in fan-out leaves the widget on the PIN screen for a shopper who
      // is signed in -- see `requireSignedInShopper`. This journey buys
      // something; AUTH-01 is the case that judges every leg.
      await requireSignedInShopper(page, {
        outcome,
        who: "the shopper who places this order",
      });

      // Leave the widget shut: its phone field and the "sign in again" prompt
      // share one marker, so a widget left open makes later readings ambiguous.
      await page.keyboard.press("Escape").catch(() => {});
    });

    await test.step("the bag starts empty", async () => {
      await gotoHome(page);
      await emptyTheBag(page);
    });

    let bought = "";

    await test.step("the QA product goes into the bag", async () => {
      // **The QA product, not a stranger's.** This case places a REAL order.
      // It used to walk the storefront and buy whatever it found first, which
      // meant a real seller got a real order from this suite every night. Now
      // it buys the product this suite created and owns, and nobody else is
      // touched.
      const added = await addQaProductToBag(page, {
        country: CASH_ON_DELIVERY_COUNTRY,
      });

      bought = added.bought;
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
        "Confirm & Continue did not reach the checkout screen. It opens the " +
          `verify panel instead of moving on, and: ${reached.who}`,
      ).toBe(true);
    });

    await test.step("the order has a delivery address", async () => {
      // Refuse a probe address before anything is ordered to it.
      //
      // BUY-03 makes an address of its own the account's default and puts the
      // old one back when it finishes. A killed run never gets to put it back —
      // the teardown covers a failed assertion, not a process that was stopped.
      // Without this, the next run would place a real order, with a real seller
      // shipping it, to an address nobody lives at.
      //
      // Read by title, because that is the only field the checkout shows.
      const showing = await chosenAddressTitle(page);
      expect(
        showing.includes(ADDRESS_PROBE_MARKER),
        "the account's default delivery address is a test probe left behind by " +
          "a run that was killed, so this case refuses to order to it. Remove " +
          `the address marked "${ADDRESS_PROBE_MARKER}" from the account and ` +
          "make a real address the default again",
      ).toBe(false);

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
        `the shop offered no cash-on-delivery method in "${CASH_ON_DELIVERY_COUNTRY}" ` +
          "for this bag, so the only payment this suite may use is unavailable — " +
          "either the run is shopping in the wrong country, or the shop stopped " +
          "offering cash on delivery there",
      ).toBe(true);

      // Offered is not the same as chosen, and the checkout needs it chosen.
      expect(
        cod.chosen,
        `cash on delivery is offered but is not the chosen payment method, so ` +
          `the checkout will refuse to go on without saying why. ${cod.note}`,
      ).toBe(true);
    });

    await test.step("the shipping and payment are confirmed", async () => {
      const reached = await confirmShippingAndPayment(page);
      expect(
        reached.reached,
        "Confirm Shipping & Payment did not reach the review step, and the " +
          `reason is: ${reached.refusal}`,
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

      // **Two checks, because these are two different faults.** "No order
      // number" used to cover both, and on 2026-09-20 it reported a checkout
      // the shop never answered as though the answer had been empty.
      expect(
        placed.panelShown,
        `the checkout never reached the success panel, and ${describeCheckout(
          placed.attempt,
        )}`,
      ).toBe(true);

      expect(
        placed.orderGroupId,
        "the success panel appeared but carried no order number, so the order " +
          "exists and nothing here can name it — and nothing can cancel it " +
          `either. ${describeCheckout(placed.attempt)}`,
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
    // Handed on **before** the context closes — a closed context has no cookie
    // jar to write. BUY-03 opens this file, and only this run's copy of it.
    await handOnSession(context, page, SESSION_STATE.shopper);
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

    // The QA product. Nothing is ordered in this case -- it stops at the phone
    // gate -- but the bag is real, and filling it from the QA shop keeps this
    // case off a real seller's product like the other three.
    await addQaProductToBag(page, { country: CASH_ON_DELIVERY_COUNTRY });

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

    // Not "the checkout did not open" on its own. A dead button looks exactly
    // like a working gate from the outside, and this is the difference: the app
    // has to ask for a phone rather than simply do nothing.
    await expect(
      cart.verifyPanel(page),
      "the checkout did not open, and neither did the verify panel — so the " +
        "shopper was given no way forward and no reason why",
    ).toBeVisible({ timeout: 45_000 });
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// BUY-03 — the bag's money figures, and choosing another delivery address
//
// Its own `test.describe`, because the teardown below belongs to this case and
// to nothing else in this file. A `test.afterEach` written at the top level
// would also run after BUY-01, BUY-02 and BUY-04, which create no address and
// have nothing for it to put back.
//
// **It never chooses a payment method.** With a method whose id is `0` in the
// store the payable figure silently becomes `total_cash` instead of `total`
// (`components/Cart/OrderButton.tsx:60-66`), and `total` is the field `AC-9`
// compares against. Not choosing one is therefore part of the check, not an
// omission.

test.describe("BUY-03 the bag's money, and choosing another address", () => {
  /** What the case created and changed, so the teardown can undo it.
   *
   *  Ids, never text. The address that was default before this case ran belongs
   *  to the account, and its title never reaches a message or a report. */
  let probeId: number | null = null;
  let probeTitle = "";
  let originalDefaultId: number | null = null;

  /** Who the app said the shopper was when the case started.
   *
   *  Kept so a later step can ask again. The app replaces a refused credential
   *  with a **fresh guest** and rewrites `USER-DATA` with it
   *  (`serverRequests/HandleAuthedFetch.ts:139-175`), and a guest reads as a
   *  perfectly healthy session: the address list answers `200`, it is simply
   *  somebody else's list. Comparing the id is what tells the two apart. */
  let startedAsAccountId: number | null = null;

  /** The browser context and its page, still open, handed to the teardown.
   *
   *  **The teardown needs the page, not a cookie jar.** Every call it makes is
   *  an authenticated one, and an authenticated call has to be made from inside
   *  the browser — see `throughProxyInPage`
   *  (`tests/e2e/harness/orderCleanup.ts:76-97`). Two live runs proved it: a
   *  Node-side request context answered `401 Unauthorized` on
   *  `/customer/address/list` while the page beside it was drawing the
   *  shopper's own name on screen.
   *
   *  So the case does **not** close its own context. This hook makes its calls
   *  through the page, hands the session on, and closes the context last. */
  let openSession: {
    context: import("@playwright/test").BrowserContext;
    page: import("@playwright/test").Page;
  } | null = null;

  test.afterEach(async ({}, testInfo) => {
    if (openSession === null) return;

    const { context, page } = openSession;
    const created = probeId;
    const original = originalDefaultId;

    // Cleared first, so a second case in this describe can never inherit them.
    probeId = null;
    originalDefaultId = null;
    openSession = null;

    try {
      if (created === null && original === null) return;

      let restored = false;

      if (original !== null) {
        const putBack = await throughProxyInPage(page, {
          target: "/customer/address/set-default",
          method: "POST",
          body: { address_id: original },
          country: CASH_ON_DELIVERY_COUNTRY,
          language: "en",
        });

        // Asked again, not assumed. `SetDefault` swallows a refusal, so the only
        // way to know the account is back as it was is to read the list.
        const after = await readSavedAddresses(page);
        restored =
          after.addresses.find((entry) => entry.id === original)?.is_default ===
          1;

        const putBackSaid =
          (putBack.json as { message?: string } | null)?.message ?? "nothing";

        expect(
          restored,
          `the address that was the account's default before this case (id ` +
            `${original}) is not the default again, so the account has been ` +
            `left changed. The set-default call answered ${putBack.status} ` +
            `and said: ${putBackSaid}. Reading the list back then said: ` +
            `${after.said}. The probe address is deliberately left in place — ` +
            `removing it while it is the default would leave the account with ` +
            `no default at all`,
        ).toBe(true);
      }

      // Only now, and never while it is the default. An address that is still
      // the account's default must not be deleted: the next order would have
      // nowhere to go.
      if (created !== null && restored) {
        await throughProxyInPage(page, {
          target: `/customer/address/delete?address_id=${created}`,
          method: "POST",
          country: CASH_ON_DELIVERY_COUNTRY,
          language: "en",
        });

        const final = await readSavedAddresses(page);
        const stillThere = final.addresses.some((entry) => entry.id === created);

        if (stillThere) {
          testInfo.annotations.push({
            type: "stranded address",
            description:
              `address ${created}, marked "${ADDRESS_PROBE_MARKER}", could not ` +
              "be deleted and is still on the account",
          });
        }

        expect(
          stillThere,
          `the probe address (id ${created}) is still on the account after it ` +
            "was deleted, so the core backend refused the delete",
        ).toBe(false);
      }

      if (created !== null && !restored) {
        testInfo.annotations.push({
          type: "stranded address",
          description:
            `address ${created}, marked "${ADDRESS_PROBE_MARKER}", was left on ` +
            "the account because the previous default could not be restored",
        });
      }
    } finally {
      // The bag, before the session is handed on.
      //
      // This case fills one from the storefront and never emptied it. BUY-04
      // opens the same session and begins by asserting the bag holds exactly
      // one line, so a BUY-03 that ended early handed its line over and BUY-04
      // failed with "the bag was opened after adding ... and holds 2 lines" —
      // blaming the shop for a line this case left. Seen on CI run 34938617683.
      //
      // `emptyTheBag` through the screens, the same way BUY-04's own teardown
      // does it: it opens the bag itself, so it works from wherever the case
      // happened to die.
      //
      // **Never allowed to fail the case.** It asserts internally, and an
      // unreachable bag would otherwise replace whatever the case itself was
      // reporting. A bag left behind is said out loud instead, so the next
      // reader knows why BUY-04 might open dirty.
      try {
        await emptyTheBag(page);
      } catch (error) {
        testInfo.annotations.push({
          type: "bag left behind",
          description:
            `the bag could not be emptied, so BUY-04 may open with a line this ` +
            `case left: ${String(error)}`,
        });
      }

      // The session is handed on here rather than in the case, because the case
      // no longer closes its own context — this hook does.
      await handOnSession(context, page, SESSION_STATE.shopper);
      await context.close();
    }
  });

  test("BUY-03 the bag shows the money the shop sent, and another address re-prices it", async ({
    browser,
  }) => {
    // A sign-in read, a bag filled from the storefront, a checkout, two address
    // calls and several cart re-reads. The project default is nowhere near it.
    test.setTimeout(15 * 60 * 1000);

    probeTitle = `${ADDRESS_PROBE_MARKER} ${RUN_TAG}`;
    const editedTitle = `${probeTitle} edited`;

    const context = await newLiveContext(browser);
    const page = await context.newPage();

    // Handed to the teardown, which closes it. The teardown needs this exact
    // context — see `openSession` above for why a copied cookie jar cannot work
    // here.
    openSession = { context, page };

    await test.step("the shopper signs in", async () => {
      // Syria, for the same reason BUY-01 shops there: the probe address is a
      // Syrian one, and `startUpdateAddress` overwrites a saved address's
      // country with the one in the URL.
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      // **Asked of the app, not read off the widget.** See the same note in
      // BUY-01 above, and `requireSignedInShopper`.
      await requireSignedInShopper(page, {
        outcome,
        who: "the shopper whose bag this case prices",
      });

      await page.keyboard.press("Escape").catch(() => {});
      await gotoHome(page);

      const session = await signedInSession(page);
      expect(
        session.accountId,
        "the session is not a signed-in shopper",
      ).not.toBeNull();

      startedAsAccountId = session.accountId;

      // Names only, never values. A missing storefront credential and a
      // refused one look identical from the API answer alone, and this tells
      // them apart before the first call is made.
      const held = (await context.cookies()).map((cookie) => cookie.name);
      expect(
        held,
        "the browser holds no storefront credential after opening the app, " +
          "so every call below would be a guest's. Only cookie **names** are " +
          "read here — never their values",
      ).toContain("MARKET-TOKEN");
    });

    await test.step("the account already has a default address", async () => {
      const saved = await readSavedAddresses(page);
      expect(
        saved.status,
        "reading the account's saved addresses was refused, so nothing below " +
          "can know which address to put back. A 401 here does NOT mean the " +
          "browser has no credential — the step above proved it holds " +
          "MARKET-TOKEN. It means the credential it holds is not this " +
          "shopper's any more. The likeliest cause is the app's own recovery: " +
          "on a 401 with no usable refresh cookie it registers a fresh GUEST " +
          "and overwrites MARKET-TOKEN and USER-DATA " +
          "(serverRequests/HandleAuthedFetch.ts:139-175), and a guest owns no " +
          "addresses. Read BUY-01's failure first — if it also lost its bag or " +
          "its checkout mid-journey, the session did not survive the run and " +
          `this case never had one. ${saved.said}`,
      ).toBe(200);

      let current = saved.addresses.find((entry) => entry.is_default === 1);
      if (!current && saved.addresses.length > 0) {
        await throughProxyInPage(page, {
          target: "/customer/address/set-default",
          method: "POST",
          body: { address_id: saved.addresses[0].id },
          country: CASH_ON_DELIVERY_COUNTRY,
          language: "en",
        });
        const reRead = await readSavedAddresses(page);
        current =
          reRead.addresses.find((entry) => entry.is_default === 1) ??
          reRead.addresses[0];
      }
      if (!current) {
        await throughProxyInPage(page, {
          target: "/customer/address/add",
          method: "POST",
          body: {
            ...addressProbeBody("Test Base Address"),
            is_default: 1,
          },
          country: CASH_ON_DELIVERY_COUNTRY,
          language: "en",
        });
        const reRead = await readSavedAddresses(page);
        current =
          reRead.addresses.find((entry) => entry.is_default === 1) ??
          reRead.addresses[0];
      }

      expect(
        current?.id,
        "the account has no default delivery address, so there is no other " +
          "address for this case to move away from and nothing to restore " +
          "afterwards",
      ).toBeDefined();

      originalDefaultId = current!.id;
    });

    await test.step("a probe address is created through the API", async () => {
      const answer = await throughProxyInPage(page, {
        target: "/customer/address/add",
        method: "POST",
        body: addressProbeBody(probeTitle),
        country: CASH_ON_DELIVERY_COUNTRY,
        language: "en",
      });

      expect(
        answer.status,
        `creating the probe address answered ${answer.status} — the core ` +
          "backend refused it, so there is no second address to tap",
      ).toBe(200);

      const body = answer.json as
        | { success?: boolean; message?: string; data?: { id?: number } }
        | null;

      expect(
        body?.data?.id,
        "creating the probe address came back with no id, so nothing below " +
          `can name it. The core backend said: ${body?.message ?? "nothing"}`,
      ).toBeDefined();

      probeId = body!.data!.id!;

      // **Creating an address makes it the account's default.** The core
      // backend does that on its own — a live run created the probe, never
      // tapped it, and the checkout was already showing it as the delivery
      // address. That would empty `AC-1` of meaning: tapping an address that is
      // already the chosen one proves nothing.
      //
      // So the original is put back straight away, and the case starts where a
      // shopper would: on their own address, with the probe merely available.
      const list = await readSavedAddresses(page);
      const probeIsDefault =
        list.addresses.find((entry) => entry.id === probeId)?.is_default === 1;

      if (probeIsDefault) {
        const restored = await throughProxyInPage(page, {
          target: "/customer/address/set-default",
          method: "POST",
          body: { address_id: originalDefaultId },
          country: CASH_ON_DELIVERY_COUNTRY,
          language: "en",
        });

        const after = await readSavedAddresses(page);
        expect(
          after.addresses.find((entry) => entry.id === originalDefaultId)
            ?.is_default,
          `creating the probe made it the account's default, and putting the ` +
            `original (id ${originalDefaultId}) back did not work — so this ` +
            `case cannot start from another address. The set-default call ` +
            `answered ${restored.status}. ${after.said}`,
        ).toBe(1);
      }
    });

    await test.step("the bag starts empty and then holds one product", async () => {
      // Already on the storefront in Syria — the session step above opened it.
      await emptyTheBag(page);

      await addQaProductToBag(page, { country: CASH_ON_DELIVERY_COUNTRY });
    });

    // The rate the screen was drawn with, read in the same run.
    //
    // The backend answers in dollars and the bag shows the shopper's own
    // currency, so the two numbers are never equal. A live run drew `450`
    // against a sent `4.5` — the rate was 100, and nothing was wrong.
    const currency = await readShopCurrency(page, {
      country: CASH_ON_DELIVERY_COUNTRY,
      language: "en",
    });
    expect(
      currency,
      "the shop did not say which currency this country is priced in, so no " +
        "figure on screen can be checked against the number the backend sent",
    ).not.toBeNull();

    const firstBag = watchCartMoney(page);
    try {
      await test.step("the bag's shipping is the shipping the shop sent", async () => {
        await openCart(page);

        const answer = await firstBag.waitForAnswer("shipping", { after: 0 });
        expect(
          answer,
          "opening the bag never brought back /cart/cart_shipping, so there " +
            "is no figure from the core backend to compare the screen against",
        ).not.toBeNull();

        const money = await readCartMoney(page, { expand: true });

        expect(
          matchesSentAmount(money.shipping, answer!.shipping, currency),
          `the bag draws ${money.shipping} as the shipping. The core backend ` +
            `sent ${answer!.shipping}, which at a rate of ` +
            `${currency!.exchangeRate} should be drawn as ` +
            `${expectedFigureFor(answer!.shipping ?? 0, currency!)}. ` +
            `${answer!.said}`,
        ).toBe(true);
      });

      await test.step("the bag's payable total is the total the shop sent", async () => {
        const answer = firstBag.last("shipping");
        const money = await readCartMoney(page, { expand: true });

        expect(
          matchesSentAmount(money.payableTotal, answer?.total ?? null, currency),
          `the bag draws ${money.payableTotal} as the payable total. The core ` +
            `backend sent ${answer?.total}, which at a rate of ` +
            `${currency!.exchangeRate} should be drawn as ` +
            `${expectedFigureFor(answer?.total ?? 0, currency!)}. ` +
            `${firstBag.said("shipping")}`,
        ).toBe(true);
      });
    } finally {
      firstBag.stop();
    }

    await test.step("the bag leads to the checkout screen", async () => {
      const reached = await goToCheckout(page);
      expect(
        reached.reached,
        "Confirm & Continue did not reach the checkout screen, so there is " +
          "no address list to open",
      ).toBe(true);
    });

    const addressChange = watchCartMoney(page);
    try {
      await test.step("the checkout starts on some other address", async () => {
        const showing = await chosenAddressTitle(page);
        expect(
          showing.includes(probeTitle),
          "the checkout already shows the probe address as the delivery " +
            "address, so tapping it would prove nothing — a run was killed " +
            "before it could put the account back",
        ).toBe(false);
      });

      // Counted **before** the tap. `SetDefault` fires the re-price the moment
      // the backend accepts (`services/order.ts:241`), so the step that checks
      // for it has to know which answers were already there.
      let overviewBeforeTap = 0;

      // What the core backend said about the tap. Held out here because the
      // step that judges it is the next one, and `SetDefault` shows a refusal
      // nowhere on screen.
      let tapSaid = "the tap was never attempted";

      await test.step("tapping the probe makes the checkout show it", async () => {
        overviewBeforeTap = addressChange.seen("overview");
        const opened = await openAddressList(page);
        expect(
          opened.opened,
          "the checkout did not open its saved-address list, so the probe " +
            "cannot be tapped",
        ).toBe(true);
        expect(
          opened.rows,
          `the address list opened with ${opened.rows} rows, so there is no ` +
            "second address to move to",
        ).toBeGreaterThan(1);

        const tapped = await chooseAddressNamed(page, probeTitle);
        tapSaid = tapped.said;
        expect(
          tapped.tapped,
          "the probe address this case created is not in the checkout's " +
            "address list, although the core backend accepted it",
        ).toBe(true);
      });

      await test.step("the core backend stored the tap", async () => {
        // The screen alone cannot say this. `SetDefault` writes the app's own
        // copy and logs a refusal without showing it, so the checkout shows
        // the tapped address either way. This asks the backend.
        const saved = await readSavedAddresses(page);
        const stored = saved.addresses.find((entry) => entry.id === probeId);

        // **Ask who the app thinks it is before blaming the backend.**
        //
        // A list that answers `200` without the address this case created has
        // two readings, and they need opposite actions: the shop lost the
        // address, or the app is no longer this shopper. The second is real —
        // on a refused credential the app registers a fresh guest and rewrites
        // `USER-DATA` with it, and a guest's address list is a healthy `200`
        // that simply holds somebody else's addresses.
        const now = await signedInSession(page);
        const sameShopper = now.accountId === startedAsAccountId;

        expect(
          stored,
          `the probe address (id ${probeId}) is not in the account's saved ` +
            `addresses after it was tapped. ${
              sameShopper
                ? "The app is still the same shopper it started as, so the " +
                  "core backend really did not return the address this case " +
                  "created."
                : "**The app is not the same shopper any more** — it started " +
                  "as one account and is now another, so this list is not the " +
                  "account's. The app swaps a refused credential for a fresh " +
                  "guest, which answers 200 with an empty list. Nothing here " +
                  "is wrong with the addresses; the session did not survive."
            } ${saved.said}`,
        ).toBeDefined();
        // The tap's own answer, so this says **which** of the two happened:
        // the call was refused, or it was never sent. `SetDefault` swallows a
        // refusal, so without this the same failure covered both.
        expect(
          stored?.is_default,
          `the probe address (id ${probeId}) was tapped on the checkout but ` +
            `the core backend still does not hold it as the account's ` +
            `default. The tap itself: ${tapSaid}`,
        ).toBe(1);
      });

      await test.step("the shop re-priced the bag for the new address", async () => {
        // **Waited for, not read.** The tap returns as soon as the sheet closes
        // and the title changes, and the re-price is still in the air at that
        // moment. A live run read it straight away, found nothing, and reported
        // that the shop had not re-priced at all — while it was re-pricing.
        const reprice = await addressChange.waitForAnswer("overview", {
          after: overviewBeforeTap,
        });

        expect(
          reprice,
          "choosing another address never brought back /cart/cart_overview, " +
            "so the shop did not re-price the bag for it. `SetDefault` calls " +
            "the re-read straight after the backend accepts, and the step " +
            "above proved it accepted — so the re-read itself did not happen",
        ).not.toBeNull();
      });

      await test.step("the figures back in the bag come from that re-price", async () => {
        const seenBefore = addressChange.seen("shipping");

        const back = await returnToBag(page);
        expect(
          back.reached,
          "the checkout's back control did not return to the bag, so the " +
            "money figures cannot be read again — they are drawn in the bag " +
            "only",
        ).toBe(true);

        const answer = await addressChange.waitForAnswer("shipping", {
          after: seenBefore,
        });
        expect(
          answer,
          "returning to the bag never brought back a fresh " +
            "/cart/cart_shipping, so the figures on screen are the ones from " +
            "before the address changed",
        ).not.toBeNull();

        const money = await readCartMoney(page, { expand: true });

        expect(
          matchesSentAmount(money.shipping, answer!.shipping, currency),
          `after the address changed the bag draws ${money.shipping} as the ` +
            `shipping. The core backend sent ${answer!.shipping}, which should ` +
            `be drawn as ${expectedFigureFor(answer!.shipping ?? 0, currency!)}. ` +
            `${answer!.said}`,
        ).toBe(true);
        expect(
          matchesSentAmount(money.payableTotal, answer!.total, currency),
          `after the address changed the bag draws ${money.payableTotal} as ` +
            `the payable total. The core backend sent ${answer!.total}, which ` +
            `should be drawn as ${expectedFigureFor(answer!.total ?? 0, currency!)}. ` +
            `${answer!.said}`,
        ).toBe(true);
      });
    } finally {
      addressChange.stop();
    }

    await test.step("editing the probe shows the new title on the checkout", async () => {
      const reached = await goToCheckout(page);
      expect(
        reached.reached,
        "the bag did not lead back to the checkout, so the address list " +
          "cannot be opened to edit anything",
      ).toBe(true);

      const opened = await openAddressList(page);
      expect(
        opened.opened,
        "the checkout did not open its saved-address list, so the probe " +
          "cannot be edited",
      ).toBe(true);

      const edited = await editAddressTitleFromSheet(page, {
        current: probeTitle,
        next: editedTitle,
      });
      expect(
        edited.saved,
        `the edit form did not close after Save. ${edited.refusal}`,
      ).toBe(true);

      // Read on a freshly drawn checkout, not on the one the form slid back
      // to. The checkout reads the title out of the list the app holds, and a
      // fresh mount is what proves the new text survives a redraw.
      const backToBag = await returnToBag(page);
      expect(
        backToBag.reached,
        "the checkout did not return to the bag after the edit was saved",
      ).toBe(true);

      const again = await goToCheckout(page);
      expect(
        again.reached,
        "the bag did not lead back to the checkout after the edit was saved",
      ).toBe(true);

      expect(
        await chosenAddressTitle(page),
        "the checkout does not show the edited title as the delivery address",
      ).toContain(editedTitle);
    });

    await test.step("the core backend stored the edit", async () => {
      // The screen is not enough here either. `UpdateAddressList` calls its
      // callback before it looks at the answer and writes the app's own copy
      // whatever came back (`services/order.ts:336-339`,
      // `components/Cart/AddAddressForm.tsx:648-655`), so the checkout shows
      // the new title even when the update was refused.
      const saved = await readSavedAddresses(page);
      const stored = saved.addresses.find((entry) => entry.id === probeId);

      expect(
        stored?.address,
        `the probe address (id ${probeId}) still carries its old title in the ` +
          "core backend, so the edit was shown on screen and never saved",
      ).toContain(editedTitle);
    });
    // No `finally` that closes the context: the `test.afterEach` above needs it
    // open, and it is the one that hands the session on and closes it. A
    // failure inside the block above still reaches that hook.
  });
});

// ---------------------------------------------------------------------------
// BUY-04 — changing and removing a line in the bag
//
// Its own `test.describe` for the same reason BUY-03 has one: the teardown that
// empties the bag belongs to this case alone.
//
// It never leaves the bag, so nothing here can place an order.

test.describe("BUY-04 changing and removing a line in the bag", () => {
  /** The page the case worked on, kept so the teardown can empty the bag.
   *
   *  Emptying is done through the screens rather than the API, because the bag
   *  is what `AC-16` is about and the screens are where a refused removal shows
   *  itself. The context is closed by the teardown, not by the case. */
  let openBag: {
    context: import("@playwright/test").BrowserContext;
    page: import("@playwright/test").Page;
  } | null = null;

  test.afterEach(async () => {
    if (openBag === null) return;

    const { context, page } = openBag;
    openBag = null;

    try {
      // `emptyTheBag` proves it, rather than clicking and hoping: it waits for
      // the count to fall after each removal and then checks the navigation
      // badge is gone. A refused removal fails here instead of being left for
      // the next case to inherit.
      await emptyTheBag(page);
    } finally {
      await handOnSession(context, page, SESSION_STATE.shopper);
      await context.close();
    }
  });

  test("BUY-04 plus raises a line to two, and removing it takes it out of the bag", async ({
    browser,
  }) => {
    test.setTimeout(10 * 60 * 1000);

    const context = await openSignedInSession(
      browser,
      SESSION_STATE.shopper,
      "BUY-01",
    );
    const page = await context.newPage();
    openBag = { context, page };

    // The name the **bag** shows for its line — not the one the product page
    // showed. A live run proved the two differ: the product page drew
    // "Solara | Electronics & Technology | Black" and the bag drew the cart
    // row's own `name`, so every step below looked for a line that did not
    // exist. See `bagLineName`.
    let lineName = "";

    await test.step("the bag holds one line that can be raised to two", async () => {
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });
      await gotoHome(page);
      await emptyTheBag(page);

      // **The QA product, which this suite owns.**
      //
      // This step used to walk up to six storefront products looking for one
      // whose line could be raised to two, because a real seller can cap a
      // product at a single piece per order and a capped line looks addable
      // right up until the plus control refuses. The case failed on 2026-09-15,
      // 09-17 and 09-18 and passed twice in between -- purely on which products
      // the storefront happened to show -- and the message blamed the cart
      // backend for never answering, a backend that had never been asked.
      //
      // The QA product's stock and per-order limit belong to the seed, so there
      // is nothing to search for. If its line cannot be raised now, that is a
      // real fault and the message below says which of the two it is.
      await addQaProductToBag(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const opened = await openCart(page);
      expect(
        opened.lines,
        `the bag was opened after adding the QA product and holds ` +
          `${opened.lines} lines, so the line this case changes cannot be named`,
      ).toBe(1);

      lineName = await bagLineName(page);

      expect(
        await lineCanHoldMore(page, lineName),
        `the QA product's bag line is capped at one piece, so it cannot be ` +
          "raised to two. Either its stock has fallen to 1, or a per-order " +
          "limit was set on it in the seller dashboard. Both are about this " +
          "suite's own product, not about the catalogue",
      ).toBe(true);
    });

    await test.step("plus raises the line to two, and the shop agrees", async () => {
      // The quantity is read only after the bag has been read again. The app
      // draws the new number before it asks anything, so a reading taken any
      // earlier agrees with a core backend that refused the change.
      const changed = await changeLineQuantity(page, {
        name: lineName,
        direction: "plus",
      });

      expect(
        changed.pressed,
        `the line "${lineName}" drew no plus control, so its quantity cannot ` +
          `be raised. ${changed.said}`,
      ).toBe(true);
      expect(
        changed.quantity,
        `the line "${lineName}" does not hold 2 after plus was pressed once. ` +
          `${changed.said}`,
      ).toBe(2);
    });

    await test.step("removing the line takes that product out of the bag", async () => {
      const removed = await removeLineNamed(page, lineName);

      expect(
        removed.removed,
        `"${lineName}" is still in the bag after it was removed. ${removed.said}`,
      ).toBe(true);
      expect(
        removed.linesLeft,
        `the bag still holds ${removed.linesLeft} lines after its only line was ` +
          `removed. ${removed.said}`,
      ).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// BUY-07 — a coupon the shop never issued is refused, and nothing changes
//
// Staging has no coupon this suite owns, so the case that a *good* coupon is
// taken is scripted (`checkout.scripted.spec.ts`, SCRIPT-21 and SCRIPT-22).
// The refusal needs no data at all: any code the shop never issued will do, and
// the core backend's answer to it is real.
//
// Runs on the session BUY-04 handed on, so it spends no one-time code. Its own
// `test.describe`, for the same reason BUY-04 has one: the bag is emptied in a
// teardown that belongs to this case alone.
// ---------------------------------------------------------------------------

/** A code no shop issued. Marked and unique per run, so it can never match a
 *  real coupon by accident. */
const UNKNOWN_COUPON = `TRYDOSQANOSUCH${Date.now()}`;

test.describe("BUY-07 a coupon the shop never issued", () => {
  let openBag: {
    context: import("@playwright/test").BrowserContext;
    page: import("@playwright/test").Page;
  } | null = null;

  test.afterEach(async () => {
    if (openBag === null) return;

    const { context, page } = openBag;
    openBag = null;

    try {
      // The checkout covers the navigation bar, so the bag is emptied from a
      // fresh page. The page finishes any renewal first — a navigation cancels
      // an exchange in flight (`harness/renewalGate.ts`).
      await waitForRenewalSettled(page);
      await gotoHome(page);
      await emptyTheBag(page);
    } finally {
      await handOnSession(context, page, SESSION_STATE.shopper);
      await context.close();
    }
  });

  test("BUY-07 an unknown coupon code is refused, the shopper is told, and the total does not change", async ({
    browser,
  }) => {
    test.setTimeout(6 * 60 * 1000);

    const context = await openSignedInSession(
      browser,
      SESSION_STATE.shopper,
      "BUY-01",
    );
    const page = await context.newPage();
    openBag = { context, page };

    await test.step("the shopper reaches the checkout with one line in the bag", async () => {
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });
      await gotoHome(page);
      await emptyTheBag(page);
      await addQaProductToBag(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const opened = await openCart(page);
      expect(
        opened.lines,
        `the bag holds ${opened.lines} lines after adding only the QA product`,
      ).toBe(1);

      const entered = await goToCheckout(page);
      expect(
        entered.reached,
        `the cart did not open the checkout screen. ${entered.who}`,
      ).toBe(true);
    });

    const totalBefore = await readCheckoutTotal(page);
    expect(
      totalBefore,
      "the checkout drew no total, so this case cannot tell whether the coupon changed it",
    ).not.toBe("");

    const { answer, box } = await test.step(
      "an unknown code is typed and applied",
      async () => applyCouponCode(page, { code: UNKNOWN_COUPON }),
    );

    await test.step("the core backend refused the code", async () => {
      expect(
        answer.status,
        `the core backend never answered the coupon request. ${answer.said}`,
      ).not.toBe(0);
      expect(
        answer.sentCode,
        "the coupon request did not carry the code the shopper typed",
      ).toBe(UNKNOWN_COUPON);
      expect(
        answer.accepted,
        `the core backend ACCEPTED a coupon code no shop ever issued (${answer.status}: ${answer.said})`,
      ).toBe(false);
    });

    await test.step("the shopper is told, and the coupon is not applied", async () => {
      expect(
        box.shownError,
        `the core backend refused the code (${answer.status}: ${answer.said}), but the coupon box showed the shopper no reason`,
      ).not.toBe("");
      expect(
        box.applied,
        "the coupon box shows a refused coupon as applied",
      ).toBe(false);
      expect(
        box.fieldShown,
        "the coupon field went away after a refusal, so the shopper cannot try another code",
      ).toBe(true);
    });

    await test.step("the total the checkout will charge did not change", async () => {
      expect(
        await readCheckoutTotal(page),
        "the checkout total changed after a coupon was refused",
      ).toBe(totalBefore);
    });
  });
});

// ---------------------------------------------------------------------------
// BUY-05 — a guest's bag survives sign-in
//
// A shopper often fills the bag as a guest and signs in only at checkout. At
// sign-in the app sends the guest's token to the core backend with the code
// (`app/api/auth/login/route.ts`), and core moves the guest's bag into the
// account. Nothing in this repository moves a line; this case watches core do
// it, and names the backend at every step that crosses one.
//
// Its own `test.describe`, for the same reason BUY-03 and BUY-04 have one: the
// teardown belongs to this case alone.
//
// Three things it refuses to trust:
//
//   * **The drawer's order bar alone.** It shows once the drawer's read has
//     finished, and a failed read finishes too — as an empty bag with no error
//     panel. So every "the bag holds / does not hold" reading below is taken
//     only after the drawer's own read is proven a good one from core.
//   * **The first answer.** On a signed-in page the access token lives for a
//     minute, so a `401` followed by a good retry is the normal path. The
//     answer judged is the first one that is not a `401`.
//   * **The product page's title.** The bag draws the cart row's own name, cut
//     at 50 characters, so the line is named by what the bag shows.

/** How long one proven bag read may take, `401` retries included. */
const GOOD_READ_MS = 90_000;

/** How long the drawer has to draw its order bar once the read is back. */
const ORDER_BAR_MS = 45_000;

/** The backend label in words, for a message. `""` is the proxy's own failure
 *  path, which sets no label — said so, never guessed. */
const backendNamed = (label: string): string =>
  label === ""
    ? "an answer with no backend label (a proxy failure, or no market answer)"
    : `the ${label} backend`;

/** Open the drawer and prove its **own** bag read came back good from core.
 *
 *  The mark is taken just before the drawer opens, so the home page's own
 *  read cannot stand in for the drawer's. Then, once the order bar is drawn,
 *  it waits until every bag read the browser sent has been answered, so the
 *  answer judged is the last one — the drawer's — and not whichever landed
 *  first. That answer must be `200`, carry `isSuccessful: true` in its body,
 *  and come from core. The backends send `isSuccessful`; the `success` the
 *  app reads is made in the browser from the status alone (`utils/fetchData.ts`),
 *  so it cannot tell a refused read from a good one.
 *
 *  `when` goes into every message, so a failure says which reading it was. */
const openBagAndProveCoreRead = async (
  page: import("@playwright/test").Page,
  when: string,
): Promise<CartMoneyAnswer> => {
  const watch = watchCartMoney(page);
  try {
    const mark = watch.seen("shipping");
    const sentAtMark = watch.sent("shipping");

    await openCart(page);

    const read = await waitForGoodRead(watch, "shipping", {
      after: mark,
      sentAtMark,
      deadline: Date.now() + GOOD_READ_MS,
    });
    expect(
      read.answer,
      read.sentSinceMark === 0
        ? `${when}: the drawer opened and the browser never asked for the bag — ` +
            "that is this app (getCart waits for a user id first), not the backend"
        : read.refused > 0
          ? `${when}: the bag read was answered 401 ${read.refused} time(s) and ` +
            `no other answer came within ${GOOD_READ_MS / 1000} s — the renewal ` +
            "never produced a good retry"
          : `${when}: the bag read was sent and no answer came back within ` +
            `${GOOD_READ_MS / 1000} s`,
    ).not.toBeNull();

    await expect(
      cart.orderBar(page),
      `${when}: the drawer never finished its own bag read — its order bar ` +
        "never appeared",
    ).toBeVisible({ timeout: ORDER_BAR_MS });

    await expect
      .poll(async () => watch.seen("shipping") >= watch.sent("shipping"), {
        timeout: GOOD_READ_MS,
        message:
          `${when}: a bag read was still unanswered after the drawer drew its ` +
          `order bar. ${watch.said("shipping")}`,
      })
      .toBe(true);

    const last = watch.last("shipping");
    expect(last, `${when}: no bag answer was kept to judge`).not.toBeNull();
    const answer = last as CartMoneyAnswer;

    expect(
      answer.status,
      `${when}: the drawer's bag read did not answer 200. ${answer.said}`,
    ).toBe(200);
    expect(
      answer.isSuccessful,
      `${when}: the drawer's bag read answered 200 but its body did not say ` +
        `isSuccessful=true, so the bag it drew is not a good read. ${answer.said}`,
    ).toBe(true);
    expect(
      answer.backend,
      `${when}: the drawer's bag read was answered by ` +
        `${backendNamed(answer.backend)}, not core — a signed-in shopper's bag ` +
        `is core's. ${answer.said}`,
    ).toBe("core");

    return answer;
  } finally {
    watch.stop();
  }
};

test.describe("BUY-05 a guest's bag survives sign-in", () => {
  /** The context the case works in. Kept apart from the flag below, so the
   *  teardown closes it on a pass and on every failure. */
  let opened: {
    context: import("@playwright/test").BrowserContext;
    page: import("@playwright/test").Page;
  } | null = null;

  /** The name of the line the case put in a bag, from the moment it is there
   *  until its removal is proven. Set means "the teardown has a line to deal
   *  with". */
  let lineInBag: string | null = null;

  /** The shopper's account id, from the first sign-in. The teardown compares
   *  against it and never prints it. */
  let shopperId: number | null = null;

  test.afterEach(async ({}, testInfo) => {
    if (opened === null) return;

    const { context, page } = opened;
    opened = null;
    const line = lineInBag;
    lineInBag = null;

    try {
      if (line === null) return;

      // **Signed in means the same shopper with a verified phone.** A guest
      // has an id too, so an id alone proves nothing.
      const session = await signedInSession(page).catch(() => null);
      const signedIn =
        session !== null &&
        session.phoneVerified &&
        shopperId !== null &&
        session.accountId === shopperId;

      if (!signedIn) {
        // The case failed while the line was in a throwaway guest's bag, or
        // the second code was refused and nothing was merged. No other case
        // reads a guest's bag, and a third code is not spent to find out.
        testInfo.annotations.push({
          type: "bag left behind",
          description:
            `"${line}" was left in a guest's bag that no other case uses, or ` +
            "the sign-in was refused and nothing reached the shopper's bag. " +
            "If it did reach it, the next BUY-01 or BUY-04 empties it first.",
        });
        return;
      }

      // The case may have died late, with little of its own time left.
      testInfo.setTimeout(testInfo.timeout + 2 * 60 * 1000);

      // **Never allowed to fail the case.** It asserts internally, and a failure
      // here would replace whatever the case itself was reporting.
      try {
        await emptyTheBag(page);
      } catch (error) {
        testInfo.annotations.push({
          type: "bag left behind",
          description: redact(
            `the shopper's bag may still hold "${line}"; the next BUY-01 or ` +
              `BUY-04 empties it first. Emptying it failed: ${String(error)}`,
          ),
        });
      }
    } finally {
      await context.close();
    }
  });

  test("BUY-05 a guest's bag survives sign-in, and the line can then be removed", async ({
    browser,
  }) => {
    // Two sign-ins, a sign-out, a guest add, two proven bag reads and a reload.
    // Fifteen minutes is a limit, not a sum of every worst-case wait.
    test.setTimeout(15 * 60 * 1000);

    const context = await newLiveContext(browser);
    const page = await context.newPage();
    opened = { context, page };

    await test.step("the shopper signs in to clear the bag", async () => {
      // The static page, as BUY-01 does: the auth widget is in the layout, and
      // a search outage cannot blank this page and hide it. Syria, so the whole
      // case shops in the one country the QA product is opened in.
      await gotoAbout(page, { country: CASH_ON_DELIVERY_COUNTRY });

      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      const session = await requireSignedInShopper(page, {
        outcome,
        who: "the shopper whose bag BUY-05 empties first",
      });
      expect(
        session.accountId,
        "the app says the shopper is signed in but names no account, so the " +
          "second sign-in cannot be checked against this one",
      ).not.toBeNull();
      shopperId = session.accountId;

      // A widget left open covers the navigation. A failed sign-in leg leaves
      // it on the PIN screen, so it is closed and the page is left for a fresh
      // one — after any renewal in flight has landed.
      await page.keyboard.press("Escape").catch(() => {});
      await waitForRenewalSettled(page);
      await gotoHome(page);
    });

    await test.step("the account's bag starts empty", async () => {
      // `emptyTheBag` judges each removal after core re-priced the bag, and
      // quotes core when a removal is put back.
      await emptyTheBag(page);
    });

    await test.step("signing out leaves a guest", async () => {
      await waitForRenewalSettled(page);
      const signedIn = await snapshotCredentials(page);
      await signOutAndSettle(page, { signedIn });

      const visitor = await signedInSession(page);
      // Asked first: a failed read answers "no id, not verified", which the two
      // checks below would take for a guest.
      expect(
        visitor.accountId,
        "the app named no visitor after sign-out — /api/auth/me gave no user, " +
          "so a guest cannot be told apart from a failed read",
      ).not.toBeNull();
      expect(
        visitor.phoneVerified,
        "after sign-out the app still reports a verified phone, so the visitor " +
          "is still the shopper and not a guest",
      ).toBe(false);
      expect(
        visitor.accountId === shopperId,
        "after sign-out the app still names the shopper's own account, so no " +
          "new guest was made",
      ).toBe(false);
    });

    let lineName = "";
    let guestQuantity: number | null = null;

    await test.step("the guest puts the QA product in the bag, and the gateway takes it", async () => {
      const added = await addQaProductToBag(page, {
        country: CASH_ON_DELIVERY_COUNTRY,
      });
      // From here on a line exists, so the teardown has something to deal with.
      lineInBag = added.bought;

      expect(
        added.backend,
        `the guest's add was answered by ${backendNamed(added.backend)}, not ` +
          "the gateway — a guest's bag is the gateway's",
      ).toBe("gateway");

      await openCart(page);
      // The bag's own name for the line, never the product page's title.
      lineName = await bagLineName(page);
      lineInBag = lineName;

      guestQuantity = await bagLineQuantity(page, lineName);
      expect(
        guestQuantity,
        `the guest's line "${lineName}" draws no quantity, so there is nothing ` +
          "to compare after sign-in",
      ).not.toBeNull();
      expect(
        guestQuantity ?? 0,
        `the guest's line "${lineName}" holds ${guestQuantity}, not at least one`,
      ).toBeGreaterThanOrEqual(1);

      await closeCart(page);
    });

    await test.step("the guest signs in from the navigation", async () => {
      const outcome = await attemptAuth(page, {
        intent: "login",
        phone: envValue("TEST_ACCOUNT_PHONE"),
        method: "whatsapp",
        otp: envValue("TEST_ACCOUNT_OTP"),
      });

      // **Asked of the app, not read off the widget.** One refused leg of the
      // sign-in fan-out leaves the widget on the PIN screen for a shopper who
      // is signed in; AUTH-01 is the case that judges every leg.
      const session = await requireSignedInShopper(page, {
        outcome,
        who: "the guest who signs in with a line in the bag",
      });
      expect(
        session.accountId === shopperId,
        "the guest signed in as a different account from the shopper whose bag " +
          "was emptied, so the bag read below is not that account's",
      ).toBe(true);

      await page.keyboard.press("Escape").catch(() => {});
      await waitForRenewalSettled(page);
      await gotoHome(page);
    });

    await test.step("core answers the bag after sign-in", async () => {
      await openBagAndProveCoreRead(page, "after sign-in");
    });

    await test.step("the guest's line is still in the bag, with the same quantity", async () => {
      const names = await bagLineNames(page);
      expect(
        names.includes(lineName),
        `the guest's line "${lineName}" is not in the bag after sign-in, so the ` +
          `merge lost it. The bag holds: ${
            names.length > 0 ? names.map((name) => `"${name}"`).join(", ") : "nothing"
          }`,
      ).toBe(true);

      const quantity = await bagLineQuantity(page, lineName);
      expect(
        quantity,
        `the line "${lineName}" held ${guestQuantity} as a guest and ` +
          `${quantity ?? "no quantity"} after sign-in`,
      ).toBe(guestQuantity);
    });

    await test.step("the bag holds nothing else", async () => {
      const others = (await bagLineNames(page)).filter((name) => name !== lineName);
      expect(
        others,
        `after sign-in the bag holds lines besides "${lineName}": ${others
          .map((name) => `"${name}"`)
          .join(", ")}`,
      ).toEqual([]);
    });

    await test.step("removing the line takes it out, and it stays out after a reload", async () => {
      const removed = await removeLineNamed(page, lineName);
      expect(
        removed.removed,
        `"${lineName}" is still in the bag after it was removed. ${removed.said}`,
      ).toBe(true);
      await closeCart(page);

      await waitForRenewalSettled(page);
      await page.reload({ waitUntil: "load" });

      // Only a drawer whose own good read is proven can say a line is absent.
      const read = await openBagAndProveCoreRead(page, "after the reload");
      await expect(
        cart.lineNamed(page, lineName),
        `"${lineName}" is back in the bag after a reload, so core did not keep ` +
          `the removal. ${read.said}`,
      ).toHaveCount(0);

      lineInBag = null;
    });
  });
});
