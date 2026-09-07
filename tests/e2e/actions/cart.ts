// The bag, and the checkout that empties it into an order.
//
// The rules every action in this folder follows are at the top of
// `actions/nav.ts`. Three things specific to this file:
//
// **"Buy" on a product page adds nothing.** It opens a sheet
// (`setSelectedProductForCart`); the sheet's own "Add To Bag" is the control
// that calls the cart backend. A journey that presses the first and stops has an
// empty bag and no error to show for it.
//
// **Checkout is one component and two screens.** `components/cart/OrdersPage.tsx`
// draws the address and payment step, then — after "Confirm Shipping & Payment"
// re-reads the cart — the review step with the terms and "Place Order". Only the
// second posts anything. They are separate actions here for that reason.
//
// **Nothing here waits on a fixed time.** The cart is refetched after every
// change, so each action waits for the number the app itself is showing.

import { expect, type Page } from "@playwright/test";

import {
  addToCartSheet,
  cart,
  checkout,
  nav,
  product,
  profile,
} from "../selectors";
import { throughProxyInPage } from "../harness/orderCleanup";
import { gotoProductAtOrNull, leaveProductPage } from "./nav";
import { signedInSession } from "./auth";

/** How long a cart change has to come back from staging.
 *
 *  Every add, delete and quantity change is followed by a full cart refetch, and
 *  the cart route is one of the slower ones on staging. The suite's 15s default
 *  is not enough for it; this matches the navigation allowance the rest of the
 *  suite uses. */
const CART_ANSWER_MS = 45_000;

/** How long the checkout call itself has.
 *
 *  Longer again, because placing an order is not one call: the app re-reads the
 *  cart, re-reads the customer, and only then posts the checkout. */
const CHECKOUT_MS = 60_000;

/** How many lines the bag holds right now, read from the navigation badge.
 *
 *  The badge is drawn only when the bag is not empty, so "no badge" is zero
 *  rather than a missing element. It counts **lines**, not pieces — adding a
 *  variant that is already in the bag raises its quantity and leaves this
 *  number alone, which is why the journeys below start from an empty bag. */
export const bagLineCount = async (page: Page): Promise<number> => {
  const badge = nav.cartCount(page);
  if ((await badge.count()) === 0) return 0;
  const text = (await badge.first().textContent())?.trim() ?? "";
  const number = Number.parseInt(text, 10);
  return Number.isNaN(number) ? 0 : number;
};

/** Open the cart drawer and wait until it has finished reading the bag.
 *
 *  Returns how many lines are in it. Zero is a real answer — an empty bag — so
 *  the caller decides whether that is a failure. */
export const openCart = async (page: Page): Promise<{ lines: number }> => {
  const button = nav.cartButton(page);
  await expect(button, "the navigation bar has no cart control").toBeVisible();

  // Pressed more than once, on purpose, and this is not covering up flakiness.
  //
  // The navigation bar is server-rendered, so the control is on screen and
  // clickable well before React has attached its handler. A single press is a
  // race against hydration that this suite loses often enough to matter — and it
  // loses it *silently*: the click succeeds, nothing happens, and the failure
  // 45 seconds later says the cart never opened.
  //
  // Opening the cart is idempotent (`enableCart(true)`), so pressing again costs
  // nothing. The loop still ends in a real assertion, so a cart that genuinely
  // never opens is still a failure.
  //
  // **Each press has its own short budget, and a press that cannot land is
  // caught.** Adding to the bag pops a success toast, and the toast is drawn
  // over the navigation — Playwright then refuses the click with "subtree
  // intercepts pointer events" and waits out the full action timeout. Before
  // this, that timeout escaped the loop and ended the whole action, so a case
  // failed on a toast that had already gone by the time the message was
  // written. A live run failed exactly that way. Now a blocked press is one
  // wasted attempt, and the next one lands after the toast has cleared.
  const drawer = cart.drawer(page);
  for (let press = 0; press < 3; press += 1) {
    const landed = await button
      .click({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!landed) continue;

    const opened = await drawer
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (opened) break;
  }

  await expect(
    drawer,
    "pressing the cart control did not open the cart",
  ).toBeVisible({ timeout: CART_ANSWER_MS });

  // The drawer opens before the cart read comes back, so the lines appear a
  // moment later. Wait for the read to settle rather than counting an empty
  // drawer and calling the bag empty.
  await cart
    .lines(page)
    .first()
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .catch(() => undefined);

  return { lines: await cart.lines(page).count() };
};

/** Close the cart drawer with the control a shopper presses. */
export const closeCart = async (page: Page): Promise<void> => {
  await page.getByTestId("CartBackIcon").click();
  await expect(
    cart.drawer(page),
    "the cart's own back arrow did not close it",
  ).toBeHidden({ timeout: CART_ANSWER_MS });
};

/** Take every line out of the bag, and prove it is empty.
 *
 *  The account is shared, so a run inherits whatever the last one left. A
 *  journey that adds one product to a bag that already held two cannot say
 *  afterwards which product it ordered, and cannot read the bag count as a
 *  signal that its own add worked.
 *
 *  Deleting takes no confirmation (`components/cart/index.tsx`), so this is one
 *  click per line — but each is followed by a cart refetch, so it waits for the
 *  count to fall rather than clicking straight through. */
export const emptyTheBag = async (page: Page): Promise<void> => {
  const opened = await openCart(page);

  let remaining = opened.lines;
  for (let line = remaining; line > 0; line -= 1) {
    await page.getByTestId("DeleteIcon_CartPage").first().click();
    await expect
      .poll(async () => await cart.lines(page).count(), {
        timeout: CART_ANSWER_MS,
        message:
          "removing a line from the bag never came back — is the cart backend answering?",
      })
      .toBeLessThan(remaining);
    remaining = await cart.lines(page).count();
  }

  expect(remaining, "the bag still holds lines after every one was removed").toBe(
    0,
  );

  await closeCart(page);

  await expect
    .poll(async () => await bagLineCount(page), {
      timeout: CART_ANSWER_MS,
      message: "the navigation still shows a bag count after the bag was emptied",
    })
    .toBe(0);
};

/** Close the add-to-bag sheet.
 *
 *  It is a bottom sheet and closes on Escape (`components/global/BottomSheet.tsx`).
 *  Left open it covers the navigation, so the next click in the journey lands on
 *  it instead of where it was aimed. */
const closeAddToBagSheet = async (page: Page): Promise<void> => {
  await page.keyboard.press("Escape");
  await expect(
    addToCartSheet.card(page),
    "the add-to-bag sheet stayed open after Escape, so it covers everything below it",
  ).toBeHidden({ timeout: CART_ANSWER_MS });
};

/** Listen for the shop's own answer to "put this in the bag".
 *
 *  The app never shows one. `services/cart.ts > AddToCart` returns `false` on a
 *  refusal and reports it to Sentry; `AddToCartButton`'s click handler catches
 *  that and calls `console.log`. Nothing reaches the screen. So a bag that does
 *  not grow looks identical whether the core backend refused the item, answered
 *  nothing, or the press never landed — and the failure could only ever say "the
 *  bag did not grow", which is what the testing rules exist to prevent.
 *
 *  This reads the call itself. `/cart/add` goes through `/api/proxy`, which
 *  carries the real address in the `x-proxy-url` header (`utils/fetchData.ts`),
 *  so the request is recognised by that and the answer is kept for the message.
 *
 *  Returns a reader, not a value: the call has not happened yet when this is
 *  installed. */
const watchCartAdd = (
  page: Page,
): { said: () => string; stop: () => void } => {
  let last = "";

  const onResponse = (response: import("@playwright/test").Response): void => {
    const request = response.request();
    if (!request.url().includes("/api/proxy")) return;
    const target = request.headers()["x-proxy-url"] ?? "";
    if (!target.includes("/cart/add") && !target.includes("/cart/update")) return;

    const status = response.status();
    void response
      .text()
      .then((body) => {
        // Trimmed, because a cart answer carries the whole bag back and the
        // useful part — success and message — is at the front of it.
        last = `${target} answered ${status}: ${body.slice(0, 400)}`;
      })
      .catch(() => {
        last = `${target} answered ${status} and its body could not be read`;
      });
  };

  page.on("response", onResponse);

  return {
    said: () => (last === "" ? "the core backend was never asked" : last),
    stop: () => page.off("response", onResponse),
  };
};

/** Try to put the product this page is showing into the bag.
 *
 *  **Not every product in a real shop can be bought**, and that was found the
 *  hard way: the first product of a live run offered two colours, both sold out,
 *  and the sheet drew "Notify Me When Variant Is Available" where the button
 *  should be. So this walks the choices instead of taking the first of each.
 *
 *  **"Add To Bag" being on screen is the app's own answer to "can this be
 *  bought".** `shouldShowNotifyButton()` in `AddToCartComponent` swaps the two
 *  controls on exactly that question — the chosen variant's quantity, whether
 *  the product is active, whether this country may receive it. So the loop below
 *  asks the app rather than reading stock numbers itself.
 *
 *  Returns `addable: false` rather than failing. A sold-out product is a fact
 *  about the shop, not a fault, and the caller decides — the buy journey moves
 *  on to the next product, and only gives up after several.
 *
 *  **Waits on the bag, not on the button.** The button's own label changes
 *  through `translateFunction`, so reading it would tie this to English. The
 *  navigation badge is the number the app itself put on screen after the cart
 *  came back. */
export const addOpenProductToBag = async (
  page: Page,
): Promise<{ addable: boolean; name: string; lines: number }> => {
  const before = await bagLineCount(page);
  const name = (await product.name(page).textContent())?.trim() ?? "";

  const cartCall = watchCartAdd(page);

  const buy = product.addToCart(page);
  await expect(
    buy,
    "the product page drew no Buy control, so nothing here can add to a bag",
  ).toBeVisible();
  await buy.click();

  // The card is drawn on every state of the sheet — sold out or not — so it is
  // what "the sheet opened" is read from. The Add To Bag button is not: on a
  // sold-out variant it does not exist at all.
  await expect(
    addToCartSheet.card(page),
    "pressing Buy did not open the add-to-bag sheet",
  ).toBeVisible({ timeout: CART_ANSWER_MS });

  // Nothing below may happen while the sheet is still reading the product.
  // The button ignores a press in that window without a word, and the read
  // overwrites the chosen colour and size when it lands. Waiting here is what
  // makes the rest of this function mean what it says.
  await expect(
    addToCartSheet.sheet(page),
    "the add-to-bag sheet never finished reading the product, so every press on " +
      "it is ignored — the product read did not come back from the core backend",
  ).toHaveAttribute("data-loading", "false", { timeout: CART_ANSWER_MS });

  const addToBag = addToCartSheet.addToBag(page);
  const colours = addToCartSheet.colour(page);
  const sizes = addToCartSheet.size(page);

  // A product may offer neither, either or both. `?? 1` is "there is nothing to
  // choose here", which is a normal product, not a missing element.
  const colourCount = Math.max(await colours.count(), 1);

  for (let colour = 0; colour < colourCount; colour += 1) {
    if ((await colours.count()) > colour) await colours.nth(colour).click();

    // Re-counted inside the loop: the sizes a product offers depend on the
    // colour, so a count taken once would go stale on the second colour.
    const sizeCount = Math.max(await sizes.count(), 1);

    for (let size = 0; size < sizeCount; size += 1) {
      if ((await sizes.count()) > size) await sizes.nth(size).click();

      const buyable = await addToBag
        .waitFor({ state: "visible", timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (!buyable) continue;

      await addToBag.click();

      const grew = await expect
        .poll(async () => await bagLineCount(page), { timeout: CART_ANSWER_MS })
        .toBeGreaterThan(before)
        .then(() => true)
        .catch(() => false);

      if (grew) {
        cartCall.stop();
        await closeAddToBagSheet(page);
        return { addable: true, name, lines: await bagLineCount(page) };
      }

      // The button was there and the bag did not grow. That is not "sold out" —
      // it is the cart backend refusing or never answering — so it is reported
      // as a failure here rather than quietly tried again on the next colour.
      const said = cartCall.said();
      cartCall.stop();
      await closeAddToBagSheet(page);
      throw new Error(
        `"${name}" offered an Add To Bag button, the press was accepted, and the ` +
          `bag did not grow — the core backend said: ${said}`,
      );
    }
  }

  cartCall.stop();
  await closeAddToBagSheet(page);
  return { addable: false, name, lines: before };
};

/** Put the first product that can actually be bought into the bag.
 *
 *  Walks along the listing on screen, opening products in turn until one of them
 *  can be added. A real shopper does the same thing when the first thing they
 *  like is sold out.
 *
 *  Bounded on purpose. A shop where none of the first several products can be
 *  bought is a finding worth failing on — the caller gets `bought: null` and can
 *  say so, naming how many it looked at. */
export const addFirstBuyableProduct = async (
  page: Page,
  options: { maxProducts?: number } = {},
): Promise<{ bought: string | null; looked: number }> => {
  const limit = options.maxProducts ?? 6;

  for (let index = 0; index < limit; index += 1) {
    const opened = await gotoProductAtOrNull(page, { index });
    if (!opened) return { bought: null, looked: index };

    const added = await addOpenProductToBag(page);
    if (added.addable) return { bought: added.name, looked: index + 1 };

    // Sold out. Back to the listing the shopper came from — through the page's
    // own back arrow, because opened as an overlay the browser's Back and this
    // control are the same thing and opened as a page they are not.
    await leaveProductPage(page);
  }

  return { bought: null, looked: limit };
};

/** Leave the bag for the checkout screen.
 *
 *  "Confirm & Continue" does **not** place anything. For a visitor the app does
 *  not consider phone-verified it opens a verify panel in place instead of
 *  moving on (`components/cart/OrderButton.tsx`), so this reports which of the
 *  two happened rather than waiting out a screen that is never coming. */
export const goToCheckout = async (
  page: Page,
): Promise<{ reached: boolean; who: string }> => {
  const confirm = cart.confirmOrder(page);
  await expect(
    confirm,
    "the cart drew no Confirm & Continue control",
  ).toBeVisible();
  await confirm.click();

  const reached = await checkout
    .confirmShippingAndPayment(page)
    .waitFor({ state: "visible", timeout: CHECKOUT_MS })
    .then(() => true)
    .catch(() => false);

  if (reached) return { reached: true, who: "" };

  // **Ask the app who it thinks the shopper is.**
  //
  // The verify panel opens for a visitor the app does not consider
  // phone-verified — and a signed-in shopper can become one **mid-run**
  // without anything on screen saying so. On a refused credential the app
  // registers a fresh guest and rewrites `USER-DATA` with it
  // (`serverRequests/HandleAuthedFetch.ts:139-175`). The gate then behaves
  // perfectly correctly, and the failure looks like a broken button.
  //
  // Only the id and the flag are read. Never a phone number, and never a token.
  const session = await signedInSession(page).catch(() => null);

  const who =
    session === null
      ? "the app could not say who the shopper is at all"
      : session.accountId === null
        ? "the app holds no account at this point — the session is a guest's, " +
          "so the phone gate is right to stop it and the fault is upstream: " +
          "whatever replaced the signed-in session"
        : session.phoneVerified
          ? `the app still holds account ${session.accountId} and reports the ` +
            "phone as verified, so the gate refused a shopper it should have " +
            "let through — this one is the app's own fault"
          : `the app holds account ${session.accountId} but does not report ` +
            "the phone as verified, so the gate is behaving correctly for the " +
            "session it currently has";

  return { reached: false, who };
};

/** Choose cash on delivery.
 *
 *  Answers whether the shop offered it at all. The list of methods comes from
 *  the cart answer's `available_payment_method`, so "not offered" is the backend
 *  speaking about this country and this bag — a fact worth reporting by name,
 *  not a slow render to wait out. */
export const chooseCashOnDelivery = async (
  page: Page,
): Promise<{ offered: boolean; chosen: boolean; note: string }> => {
  const cod = checkout.cashOnDelivery(page).first();

  const offered = await cod
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);

  if (!offered) {
    return {
      offered: false,
      chosen: false,
      note: "the shop drew no cash-on-delivery row for this country and bag",
    };
  }

  // **The row is a switch, exactly like the terms row is.**
  // `handleCODPayment` clears the payment when cash is already the chosen one
  // (`components/Cart/PaymentMethod.tsx:73-76`), so an unchecked press turns
  // the choice **off** — and the checkout then refuses to go on, silently,
  // saying nothing about why. A live run failed that way: the case pressed a
  // row that was already selected, and the next step reported "no payment
  // method is chosen".
  //
  // `active` is `orderData.payment` holding the cash entry (`:300-302`), and
  // the row draws its border only while `active && !disabled` (`:416-418`), so
  // the border is the app's own answer to "is cash chosen".
  const isChosen = async (): Promise<boolean> =>
    ((await cod.getAttribute("style").catch(() => null)) ?? "").includes(
      "border",
    );

  if (await isChosen()) {
    return {
      offered: true,
      chosen: true,
      note: "cash on delivery was already the chosen method, so it was left alone",
    };
  }

  // **A press is dropped in silence while the checkout is still loading.**
  // The row's handler is `if (!orderLoading) handleCODPayment()`
  // (`components/Cart/PaymentMethod.tsx:304-308`), and `orderLoading` is true
  // while the screen reads the customer and the address list on mount. The
  // click lands, Playwright reports success, and the app does nothing — a live
  // run pressed once inside that window and the checkout then refused to go on.
  //
  // So it is pressed again until it takes. **The state is read before every
  // press**, never after a fixed wait, because the row is a switch: pressing a
  // row that is already chosen would clear it.
  let presses = 0;
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline && presses < 5) {
    if (await isChosen()) {
      return {
        offered: true,
        chosen: true,
        note: `cash on delivery was chosen after ${presses} press(es)`,
      };
    }

    await cod.click({ timeout: 10_000 }).catch(() => undefined);
    presses += 1;

    // Long enough for the state to land — `handleCODPayment` sets the store
    // directly and calls no backend, so this is a render, not a request.
    const settleBy = Date.now() + 4_000;
    while (Date.now() < settleBy && !(await isChosen())) {
      await page.waitForTimeout(200).catch(() => undefined);
    }
  }

  if (await isChosen()) {
    return {
      offered: true,
      chosen: true,
      note: `cash on delivery was chosen after ${presses} press(es)`,
    };
  }

  return {
    offered: true,
    chosen: false,
    note:
      `the cash-on-delivery row was pressed ${presses} times and never became ` +
      "the chosen method. It is not the disabled case — a disabled row carries " +
      "`pointer-events-none` and the press would have failed instead of being " +
      "accepted. The remaining reading is that the screen stayed busy: the row " +
      "ignores every press while `orderLoading` is true",
  };
};

/** Is there already a delivery address on the checkout screen?
 *
 *  The checkout refuses to go on without one, and it has to be the account's
 *  **default** — `OrderButtons.isValid()` looks for `is_default === 1` and
 *  nothing else. */
export const hasDeliveryAddress = async (page: Page): Promise<boolean> =>
  await checkout
    .chosenAddress(page)
    .first()
    .isVisible()
    .catch(() => false);

/** Why the checkout refused to move on, read from the screen.
 *
 *  **The button refuses in silence.** `Validate()` shakes a row and may show a
 *  notice, then `isValid()` decides, and a `false` simply leaves the screen
 *  where it is (`components/Cart/OrdersPage.tsx:895-905`). Nothing on screen
 *  says which condition failed, so a case that only reports "it did not move"
 *  turns a five-second answer into an afternoon of guessing.
 *
 *  `isValid()` (`:793-806`) has exactly **three** conditions. Not four — an
 *  unverified phone is not one of them; that gate is in the bag, on
 *  `Confirm & Continue`, one screen earlier. The three are:
 *
 *  1. an address with `is_default === 1`;
 *  2. `orderData.payment.length > 0` — a payment method chosen;
 *  3. `totalBalance() >= getTotalPrice()`.
 *
 *  Each is read from what the app itself drew:
 *
 *  1. `regular-addresses` prints `defaultAddress?.address`, where
 *     `defaultAddress` is that same `is_default === 1` filter
 *     (`ShippingAddressContainer.tsx:688`). No default, no text.
 *  2. The cash-on-delivery row carries an inline border **only** while it is the
 *     chosen one (`PaymentMethod.tsx:416-418`).
 *  3. The button's own label draws `getTotalPrice()`
 *     (`OrdersPage.tsx:925-931`). `RoundPrice` turns a value that is not a
 *     number into `0` (`utils/functions.tsx:184-186`), so a `0` here beside a
 *     bag that has lines is the cart money never having arrived.
 *
 *  When all three look satisfied the answer names the fourth possibility, which
 *  no single element can show: condition 3 compares a **stored** number with a
 *  **current** one. The payment row saves `total_cash` at the moment it is
 *  pressed (`PaymentMethod.tsx:93-99`), and the bag can be re-priced after
 *  that. A price that has gone up since the press fails the check while every
 *  part of the screen still looks right. */
const whyCheckoutRefused = async (page: Page): Promise<string> => {
  const refusals: string[] = [];

  const title =
    (await checkout
      .addressTitle(page)
      .first()
      .textContent()
      .catch(() => ""))?.trim() ?? "";
  if (title === "") {
    refusals.push(
      "the account has no address marked as the default, so the checkout has " +
        "nowhere to deliver to",
    );
  }

  const codStyle =
    (await checkout
      .cashOnDelivery(page)
      .first()
      .getAttribute("style")
      .catch(() => null)) ?? "";
  if (!codStyle.includes("border")) {
    refusals.push(
      "no payment method is chosen — the cash-on-delivery row is not drawn as " +
        "the selected one",
    );
  }

  const label =
    (await checkout
      .confirmTotal(page)
      .first()
      .textContent()
      .catch(() => ""))?.trim() ?? "";
  const price = /(\d[\d,]*(\.\d+)?)\s*\D*$/.exec(label);
  const amount = price === null ? null : Number(price[1].replace(/,/g, ""));
  if (amount === 0) {
    refusals.push(
      `the checkout is about to charge 0 ("${label}"), so the balance check ` +
        "cannot pass — the cart money never came back from the core backend",
    );
  }

  if (refusals.length === 0) {
    return (
      "all three conditions the checkout applies look satisfied on screen, so " +
      "the refusal is the balance comparison itself: the payment row saved the " +
      "total at the moment it was pressed, and the bag has been re-priced " +
      `since. The button is showing "${label}"`
    );
  }

  return refusals.join("; ");
};

/** Move from the address and payment step to the review step.
 *
 *  The button re-reads the bag and the customer first, and refuses in silence
 *  when any of the three conditions in `whyCheckoutRefused` is unmet. So this
 *  reports whether the screen moved **and**, when it did not, which condition
 *  is the reason — the caller puts that in its failure message. */
export const confirmShippingAndPayment = async (
  page: Page,
): Promise<{ reached: boolean; refusal: string }> => {
  const confirm = checkout.confirmShippingAndPayment(page);
  await expect(
    confirm,
    "the checkout screen drew no Confirm Shipping & Payment control",
  ).toBeVisible();
  await confirm.click();

  const reached = await checkout
    .placeOrder(page)
    .waitFor({ state: "visible", timeout: CHECKOUT_MS })
    .then(() => true)
    .catch(() => false);

  if (reached) return { reached: true, refusal: "" };

  return { reached: false, refusal: await whyCheckoutRefused(page) };
};

/** Agree to the terms and place the order.
 *
 *  Placing is refused until the terms row is ticked, and the refusal is silent —
 *  the button shakes and nothing is posted. So the row is ticked here rather
 *  than left to the case.
 *
 *  **Ticking is not instant, and pressing too early looks exactly like a bug in
 *  the app.** The row posts `/customer/approve-policies` and only sets the flag
 *  when that answer comes back. Press Place Order in that window and the app
 *  shakes the row and posts nothing — so the case fails with "no order came
 *  back" while the app behaved correctly. The row carries `data-agreed`, which
 *  is the flag itself, so this waits for the app's own state rather than for a
 *  moment that looked long enough.
 *
 *  Returns both facts separately, because they need different next moves:
 *  `panelShown: false` is a checkout that was refused or never posted, while a
 *  panel with no number is a partial success — the order exists and there is
 *  nothing to find it by. */
/** Tick the terms row — and **only** if it is not ticked already.
 *
 *  **The row is a switch, and the shop remembers the answer.** Its handler is
 *  `setAgree(!orderData.agree)` (`components/Cart/PlaceOrderButtons.tsx:187`),
 *  so one press turns it on and the next turns it off. And `orderData.agree`
 *  does not start empty for a returning shopper: the customer read sets it from
 *  the account's stored `is_approve_policies` (`services/home.ts:149`). A
 *  shopper approves the policies once, and every later order arrives with the
 *  box already ticked.
 *
 *  So a press that is not checked first **unticks** it. That is a real failure
 *  this suite had: the case pressed an already-ticked row, waited for
 *  `data-agreed="true"`, watched it read `"false"` 123 times, and then blamed
 *  the shop for "not answering the policy call". The shop had answered. The test
 *  had turned the box off.
 *
 *  Two more details this has to survive:
 *
 *  - **The state arrives late.** `agree` starts `false` in the store
 *    (`store/Cart/reducer.ts:90`) and only becomes `true` when the customer read
 *    lands. So a short wait comes first — pressing during that window is the
 *    same mistake one moment earlier.
 *  - **Turning it on is not instant.** `setAgree(true)` posts
 *    `/customer/approve-policies` and sets the flag when that answers
 *    (`PlaceOrderButtons.tsx:56-78`). Press Place Order in that gap and the app
 *    shakes the row and posts nothing. */
const agreeToTermsIfNeeded = async (
  page: Page,
): Promise<{ agreed: boolean; pressed: number }> => {
  const row = checkout.agreeToTerms(page);
  await expect(
    row,
    "the review step drew no terms row, so the order can never be placed",
  ).toBeVisible({ timeout: CHECKOUT_MS });

  const isTicked = async (): Promise<boolean> =>
    (await row.getAttribute("data-agreed").catch(() => null)) === "true";

  // Give the customer read its moment to land. An account that approved before
  // arrives ticked, and this is where that becomes visible.
  const settleBy = Date.now() + 5_000;
  while (Date.now() < settleBy) {
    if (await isTicked()) return { agreed: true, pressed: 0 };
    await page.waitForTimeout(250).catch(() => undefined);
  }

  // Still not ticked, so this account really has not approved yet. Press it —
  // and press it only while it reads `false`, never blindly.
  let pressed = 0;
  while (pressed < 3) {
    if (await isTicked()) return { agreed: true, pressed };

    await row.click();
    pressed += 1;

    const answerBy = Date.now() + 20_000;
    while (Date.now() < answerBy) {
      if (await isTicked()) return { agreed: true, pressed };
      await page.waitForTimeout(250).catch(() => undefined);
    }
  }

  return { agreed: await isTicked(), pressed };
};

export const placeOrder = async (
  page: Page,
): Promise<{ panelShown: boolean; orderGroupId: string | null }> => {
  const terms = await agreeToTermsIfNeeded(page);

  expect(
    terms.agreed,
    `the terms row is still not ticked after ${terms.pressed} presses, so ` +
      "Place Order would be refused in silence. The row only ticks once " +
      "/customer/approve-policies answers, so the shop did not answer it",
  ).toBe(true);

  await checkout.placeOrder(page).click();

  const panelShown = await checkout
    .successPanel(page)
    .waitFor({ state: "visible", timeout: CHECKOUT_MS })
    .then(() => true)
    .catch(() => false);

  if (!panelShown) return { panelShown: false, orderGroupId: null };

  const text =
    (await checkout.orderNumber(page).first().textContent())?.trim() ?? "";

  return { panelShown: true, orderGroupId: text === "" ? null : text };
};

// ─── The live steps `BUY-03` and `BUY-04` are built from ─────────────────────
//
// Everything below reads or changes the bag on real staging. Three habits run
// through all of it, and each one is here because of a way an earlier draft
// could have gone green while the shop was broken.
//
// **A figure is read only once the app has drawn it.** `cartPage-container` is
// on screen before the cart answer lands, and the totals row draws nothing at
// all until the bag has lines (`components/Cart/OrderButton.tsx:267`). So a read
// taken on "the drawer is open" gets an empty string — and an empty string read
// as a number is `0`, which is a figure staging really does send.
//
// **A number on screen is compared with the number the backend sent in the same
// run**, never with a literal. `watchCartMoney` keeps the backend's own answer
// for exactly that.
//
// **Every wait names its own budget.** A handed-on context defaults to a 20 s
// action timeout (`tests/e2e/harness/liveSession.ts`) and `expect` to 15 s
// (`playwright.config.ts`), so an unqualified wait dies before the cart route
// has answered.

/** Which of the two cart answers a set of money numbers came from.
 *
 *  They are different calls and they arrive at different moments, so a read has
 *  to say which one it is checking against:
 *
 *  - `shipping` — `GET /cart/cart_shipping`. The bag's own read. It runs when
 *    the drawer mounts (`components/Cart/index.tsx:79-84`) and again after every
 *    quantity change, and its answer goes through `initCart`.
 *  - `overview` — `GET /cart/cart_overview`. The re-price. It runs right after
 *    the core backend accepts a new default address
 *    (`services/order.ts:241`) and after a line is removed
 *    (`components/Cart/index.tsx:137-142`), and its answer goes through
 *    `setCartPreview`. */
export type CartMoneyTarget = "shipping" | "overview";

/** One answer from one of those two calls. A `null` field means the answer
 *  arrived but did not carry that number — which is a finding, not a zero. */
export interface CartMoneyAnswer {
  /** How many answers of this kind had arrived when this one did. Starts at 1,
   *  and is what `waitForAnswer` counts, so a caller can wait for a **new**
   *  answer instead of accepting the one that was already there. */
  seq: number;
  status: number;
  total: number | null;
  shipping: number | null;
  discount: number | null;
  subTotal: number | null;
  /** The answer in words, short enough for a failure message. */
  said: string;
}

export interface CartMoneyWatch {
  /** How many answers of this kind have arrived so far. */
  seen: (which: CartMoneyTarget) => number;
  /** The most recent one, or `null` when none has come. */
  last: (which: CartMoneyTarget) => CartMoneyAnswer | null;
  /** The most recent one in words. Safe in a message: it carries the status and
   *  the four money numbers, never the answer body. */
  said: (which: CartMoneyTarget) => string;
  /** Wait for an answer **after** the one numbered `after`. Returns it, or
   *  `null` when none came inside the budget — it never throws, because "the
   *  shop did not re-price" is a finding the caller has to word itself. */
  waitForAnswer: (
    which: CartMoneyTarget,
    options: { after: number; timeout?: number },
  ) => Promise<CartMoneyAnswer | null>;
  stop: () => void;
}

/** Take the money numbers off the shop's own cart answers as they arrive.
 *
 *  **Passive on purpose.** It only listens; it presses nothing and fails at
 *  nothing. That matters because it is installed *before* the step it watches —
 *  `SetDefault` fires the re-price as soon as the backend accepts, so a watcher
 *  installed after the tap can miss the answer it exists to read
 *  (`services/order.ts:241`).
 *
 *  Both calls leave through `POST /api/proxy` with the real address in the
 *  `x-proxy-url` header (`utils/fetchData.ts`), which is how they are told
 *  apart — the same match `watchCartAdd` above uses.
 *
 *  **Stop it in a `finally`.** A listener left attached outlives its step and
 *  keeps reading bodies on a page the case has moved on from. */
export const watchCartMoney = (page: Page): CartMoneyWatch => {
  const answers: Record<CartMoneyTarget, CartMoneyAnswer | null> = {
    shipping: null,
    overview: null,
  };
  const counts: Record<CartMoneyTarget, number> = { shipping: 0, overview: 0 };

  const numberOrNull = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const onResponse = (response: import("@playwright/test").Response): void => {
    const request = response.request();
    if (!request.url().includes("/api/proxy")) return;

    const target = request.headers()["x-proxy-url"] ?? "";
    const which: CartMoneyTarget | null = target.includes("/cart/cart_shipping")
      ? "shipping"
      : target.includes("/cart/cart_overview")
        ? "overview"
        : null;
    if (which === null) return;

    const status = response.status();

    void response
      .text()
      .then((body) => {
        // `data` is where both calls put their money: `initCart` and
        // `setCartPreview` are each handed `response.data` and spread it whole
        // into the store (`store/Cart/reducer.ts:367`, `:394`).
        let money: Record<string, unknown> = {};
        try {
          const parsed = JSON.parse(body) as { data?: Record<string, unknown> };
          money = parsed?.data ?? {};
        } catch {
          money = {};
        }

        counts[which] += 1;
        const answer: CartMoneyAnswer = {
          seq: counts[which],
          status,
          total: numberOrNull(money.total),
          shipping: numberOrNull(money.total_shipping_cost),
          discount: numberOrNull(money.total_discount),
          subTotal: numberOrNull(money.sub_total),
          said: "",
        };
        answer.said =
          `${target} answered ${status} with total=${answer.total}, ` +
          `shipping=${answer.shipping}, discount=${answer.discount}, ` +
          `sub_total=${answer.subTotal}`;
        answers[which] = answer;
      })
      .catch(() => {
        counts[which] += 1;
        answers[which] = {
          seq: counts[which],
          status,
          total: null,
          shipping: null,
          discount: null,
          subTotal: null,
          said: `${target} answered ${status} and its body could not be read`,
        };
      });
  };

  page.on("response", onResponse);

  return {
    seen: (which) => counts[which],
    last: (which) => answers[which],
    said: (which) =>
      answers[which]?.said ??
      `the core backend never answered ${
        which === "shipping" ? "/cart/cart_shipping" : "/cart/cart_overview"
      }`,
    waitForAnswer: async (which, options) => {
      const budget = options.timeout ?? CART_ANSWER_MS;
      const deadline = Date.now() + budget;
      while (Date.now() < deadline) {
        const answer = answers[which];
        if (answer !== null && answer.seq > options.after) return answer;
        await page.waitForTimeout(200).catch(() => undefined);
      }
      const answer = answers[which];
      return answer !== null && answer.seq > options.after ? answer : null;
    },
    stop: () => page.off("response", onResponse),
  };
};

/** Read one money figure off the screen as a number.
 *
 *  Two things it refuses to do. It never reads an element that is not there
 *  yet, and it never reads one whose text is still empty — both give `0`, and
 *  `0` is a figure staging really sends, so an early read would agree with a
 *  backend that sent nothing.
 *
 *  The text carries more than the number: the shipping row draws `+ 12 IQD` and
 *  the totals row draws the currency symbol beside the figure. So the first
 *  number in the text is taken and the thousands separators are dropped. */
const readMoneyFigure = async (
  locator: import("@playwright/test").Locator,
  what: string,
): Promise<{ text: string; amount: number | null }> => {
  const figure = locator.first();

  await expect(
    figure,
    `${what} was never drawn — the totals row is drawn only once the bag has ` +
      `lines, so either the cart read did not come back or the bag is empty`,
  ).toBeVisible({ timeout: CART_ANSWER_MS });

  await expect
    .poll(async () => ((await figure.textContent()) ?? "").trim(), {
      timeout: CART_ANSWER_MS,
      message:
        `${what} stayed empty. An empty figure reads as 0, and 0 is a number ` +
        `staging really sends, so it is refused here rather than compared`,
    })
    .not.toBe("");

  const text = ((await figure.textContent()) ?? "").trim();
  const match = /-?\d[\d,]*(\.\d+)?/.exec(text);
  const amount = match === null ? null : Number(match[0].replace(/,/g, ""));

  return { text, amount: amount !== null && Number.isFinite(amount) ? amount : null };
};

/** What the shop charges in, and how it turns a backend number into a screen
 *  one.
 *
 *  **The backend answers in dollars; the screen shows the shopper's own
 *  currency.** So the two numbers are never equal, and comparing them directly
 *  is wrong. A live run made that plain: the bag drew `450` where
 *  `/cart/cart_shipping` had sent `4.5`. Nothing was broken — the rate was
 *  `100`. */
export interface ShopCurrency {
  exchangeRate: number;
  decimalDigits: number;
  symbol: string;
}

/** Ask the shop which currency this country is priced in.
 *
 *  The same call the app makes — `GET /mobile/home/currency`
 *  (`utils/tinyUtils.tsx:110-133`) — so the rate used to check the screen is
 *  the rate the screen was drawn with, read in the same run. Never a literal:
 *  a rate written into the test would go stale the day the shop changes it,
 *  and would agree with a wrong screen in the meantime. */
export const readShopCurrency = async (
  page: Page,
  options: { country: string; language: string },
): Promise<ShopCurrency | null> => {
  const answer = await throughProxyInPage(page, {
    target: "/mobile/home/currency",
    method: "GET",
    country: options.country,
    language: options.language,
  });

  const body = answer.json as
    | { data?: { currency?: Record<string, unknown> } & Record<string, unknown> }
    | null;

  // The route nests the fields under `data.currency`; the older one returned
  // them flat. `getCurrency` unwraps both the same way, so this does too.
  const currency = (body?.data?.currency ?? body?.data) as
    | Record<string, unknown>
    | undefined;
  if (!currency) return null;

  const exchangeRate = Number(currency.exchange_rate);
  const decimalDigits = Number(currency.decimal_digits);

  return {
    exchangeRate: Number.isFinite(exchangeRate) ? exchangeRate : 1,
    decimalDigits: Number.isFinite(decimalDigits) ? decimalDigits : 0,
    symbol: String(currency.symbol ?? ""),
  };
};

/** `toFixedUp` from `utils/functions.tsx:152-169`, copied exactly.
 *
 *  Copied rather than imported on purpose. The check has to fail when the app's
 *  arithmetic changes; importing the app's own helper would make both sides
 *  move together and the check could never catch a wrong formula. */
const roundUpTo = (decimalDigits: number, value: number): number => {
  const factor = 10 ** decimalDigits;
  const multiplied = Number((value * factor).toFixed(12));
  return Math.ceil(multiplied) / factor;
};

/** `preciseMultiply` from `utils/functions.tsx:133-151`, copied exactly, and
 *  for the same reason as above. */
const preciseMultiply = (a: number, b: number): number => {
  const aStr = a.toString();
  const bStr = b.toString();
  const aDecimals = (aStr.split(".")[1] || "").length;
  const bDecimals = (bStr.split(".")[1] || "").length;
  const intA = Number(aStr.replace(".", ""));
  const intB = Number(bStr.replace(".", ""));
  return (intA * intB) / 10 ** (aDecimals + bDecimals);
};

/** The figure the bag **should** draw for a number the backend sent.
 *
 *  `RoundPrice({ num, returnNumber: true, points })`
 *  (`utils/functions.tsx:170-202`) does two things in order: round the number
 *  **up** to the currency's decimal places, then multiply by the exchange rate.
 *  This repeats both, so the check compares a figure against a figure. */
export const expectedFigureFor = (
  sent: number,
  currency: ShopCurrency,
): number =>
  preciseMultiply(
    roundUpTo(currency.decimalDigits, sent),
    currency.exchangeRate,
  );

/** Does the figure on screen match the number the backend sent?
 *
 *  Both sides are converted the same way, so this is an equality check, not a
 *  tolerance. The small allowance is for binary floating point only — `0.1 +
 *  0.2` is not `0.3` in any language — and is far too tight to hide a wrong
 *  field: the "Normal Price" and the payable total differ by the whole
 *  discount, which is a real amount of money. */
export const matchesSentAmount = (
  drawn: number | null,
  sent: number | null,
  currency: ShopCurrency | null,
): boolean => {
  if (drawn === null || sent === null || currency === null) return false;
  return Math.abs(drawn - expectedFigureFor(sent, currency)) < 0.005;
};

/** Read the money the bag is showing.
 *
 *  The payable total sits **outside** the collapsed block
 *  (`components/Cart/OrderButton.tsx:572`) and needs no click. The "Normal
 *  Price" and the shipping sit inside it (`:325`), and `expanded` starts
 *  `false` (`:41`) — so they are read only when `expand` is asked for.
 *
 *  `total-expanded` is a **toggle**, so it is pressed only when the breakdown is
 *  not already open. Pressing it twice hides what the caller asked for. */
export const readCartMoney = async (
  page: Page,
  options: { expand?: boolean } = {},
): Promise<{
  payableTotal: number | null;
  payableText: string;
  normalPrice: number | null;
  shipping: number | null;
  shippingText: string;
}> => {
  const payable = await readMoneyFigure(
    cart.payableTotal(page),
    "the payable total in the bag",
  );

  if (options.expand !== true) {
    return {
      payableTotal: payable.amount,
      payableText: payable.text,
      normalPrice: null,
      shipping: null,
      shippingText: "",
    };
  }

  const alreadyOpen = await cart
    .normalPrice(page)
    .first()
    .isVisible()
    .catch(() => false);

  if (!alreadyOpen) {
    const toggle = cart.totalsToggle(page);
    await expect(
      toggle,
      "the bag drew no totals row, so the breakdown cannot be opened",
    ).toBeVisible({ timeout: CART_ANSWER_MS });
    await toggle.click();
  }

  const normal = await readMoneyFigure(
    cart.normalPrice(page),
    "the Normal Price figure in the bag",
  );
  const shipping = await readMoneyFigure(
    cart.shipping(page),
    "the shipping figure in the bag",
  );

  return {
    payableTotal: payable.amount,
    payableText: payable.text,
    normalPrice: normal.amount,
    shipping: shipping.amount,
    shippingText: shipping.text,
  };
};

/** Open the saved-address list on the checkout screen.
 *
 *  The opener opens only for an account that already has an address saved —
 *  `addresses-viewer` calls `openAddressList(true)` inside
 *  `if (addressLists?.length > 0)`
 *  (`components/Cart/ShippingAddressContainer.tsx:469-476`). So "the sheet did
 *  not open" is the account holding nothing as often as it is a fault, and this
 *  reports which rather than failing on a wait. */
export const openAddressList = async (
  page: Page,
): Promise<{ opened: boolean; rows: number }> => {
  const opener = checkout.addressesViewer(page);
  await expect(opener, "the checkout drew no address block at all").toBeVisible({
    timeout: CART_ANSWER_MS,
  });

  // Pressed more than once, for the same reason `openCart` is: the checkout is
  // server-rendered, so this block is on screen and clickable before React has
  // attached `onClick` (`ShippingAddressContainer.tsx:468-475`). A single press
  // is a race against hydration, and losing it is silent — the click lands,
  // nothing opens, and the failure 45 seconds later says the list never opened.
  // A live run lost it exactly that way.
  //
  // Opening is idempotent — the handler only ever calls `openAddressList(true)`
  // — so a second press costs nothing, and the answer below is still real.
  const sheet = checkout.addressSheet(page);
  let opened = false;
  for (let press = 0; press < 3 && !opened; press += 1) {
    const landed = await opener
      .click({ timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!landed) continue;

    opened = await sheet
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
  }

  if (!opened) return { opened: false, rows: 0 };

  return {
    opened: true,
    rows: await checkout.addressSheet(page).getByTestId("Address").count(),
  };
};

/** Which address the checkout is showing right now, by its title.
 *
 *  The **title**, not the region string. `Address-Added-Last` carries the
 *  region, which two addresses in one city share, so it cannot tell them apart
 *  (`components/Cart/ShippingAddressContainer.tsx:688`, `:699`). */
export const chosenAddressTitle = async (page: Page): Promise<string> => {
  const title = checkout.addressTitle(page).first();
  if ((await title.count()) === 0) return "";
  return ((await title.textContent()) ?? "").trim();
};

/** Tap one saved address in the sheet, found by the title it shows.
 *
 *  **This is the screen's answer, and only the screen's.** The row's handler
 *  calls `order.SetDefault`, `updateAddress` and `setDefaultAddress` together
 *  (`components/Cart/AddressListContainer.tsx:80-82`), and `SetDefault`
 *  swallows a refusal — it logs it and carries on
 *  (`services/order.ts:243-248`). So the title on the checkout changes whether
 *  or not the core backend stored anything. Reading the list back from the
 *  backend is a separate step, and that step is `AC-2`.
 *
 *  Install a `watchCartMoney` **before** calling this when the re-price matters:
 *  `GetCartOreview()` runs the moment the backend accepts. */
export const chooseAddressNamed = async (
  page: Page,
  title: string,
): Promise<{ tapped: boolean; showing: string }> => {
  const row = checkout.addressSheetRow(page, title).first();

  const found = await row
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!found) return { tapped: false, showing: await chosenAddressTitle(page) };

  await row.click();

  await expect(
    checkout.addressSheet(page),
    "tapping a saved address left the address sheet open, so it covers the " +
      "checkout below it",
  ).toBeHidden({ timeout: CART_ANSWER_MS });

  await expect
    .poll(async () => await chosenAddressTitle(page), {
      timeout: CART_ANSWER_MS,
      message:
        "the checkout does not show the tapped address as the delivery " +
        "address after it was tapped",
    })
    .toContain(title);

  return { tapped: true, showing: await chosenAddressTitle(page) };
};

/** Which field the address form is complaining about.
 *
 *  **The form refuses in silence, but it does point at the problem.**
 *  `validate()` (`components/Cart/AddAddressForm.tsx:619-639`) adds the class
 *  `shake-anim` to the first field that is not filled, and takes it off again
 *  after 1300 ms. So this looks straight after the press, and names the field
 *  by the marker class the app itself chose.
 *
 *  Without this a refused Save is indistinguishable from a backend that never
 *  answered, and the failure would blame the shop for the form's own rule. */
const readInput = async (page: Page, marker: string): Promise<string> =>
  (
    (await page
      .getByTestId(marker)
      .first()
      .inputValue()
      .catch(() => "")) ?? ""
  ).trim();

const whyTheFormRefused = async (page: Page): Promise<string> => {
  const fields: Record<string, string> = {
    "username-border": "the account holder's name",
    "details-border": "the detail line",
    "title-border": "the address title",
    "region-border": "the region — it comes from the picker, not a text field",
    "name-border": "the contact person's name",
    "phone-border": "the contact phone",
  };

  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    for (const [marker, what] of Object.entries(fields)) {
      const shaking = page.locator(`.${marker}.shake-anim`);
      if ((await shaking.count()) > 0) {
        return `the form refused the save and pointed at ${what}`;
      }
    }
    await page.waitForTimeout(100).catch(() => undefined);
  }

  // Nothing shook. Read the fields the form insists on and say which of them
  // it is holding as empty.
  //
  // **Emptiness only, never the value.** These fields carry a person's name and
  // phone number, and neither may reach a message or a kept artifact.
  const required: Array<[string, () => Promise<string>]> = [
    ["the address title", async () => await readInput(page, "add-address-input")],
    [
      "the detail line",
      async () =>
        (
          await page
            .getByTestId("Detailed-Address-field")
            .locator("textarea, input")
            .first()
            .inputValue()
            .catch(() => "")
        ).trim(),
    ],
    ["the contact name", async () => await readInput(page, "recipient-name-input")],
    ["the contact phone", async () => await readInput(page, "Contact-Phone-input")],
    [
      // The region is not a text field. The form prints it, and prints nothing
      // at all when it is missing (`AddAddressForm.tsx:309-311`) — so an empty
      // reading here is language-independent, unlike matching its placeholder.
      "the region, which comes from the picker and cannot be typed",
      async () =>
        (
          (await profile
            .selectRegionButton(page)
            .locator("div")
            .last()
            .textContent()
            .catch(() => "")) ?? ""
        ).trim(),
    ],
  ];

  const empty: string[] = [];
  for (const [what, read] of required) {
    if ((await read()) === "") empty.push(what);
  }

  if (empty.length > 0) {
    return (
      `the form refused the save and is holding these empty: ${empty.join(", ")}. ` +
      "It shook nothing because `validate()` only shakes on `length === 0`, and " +
      "a value that is missing rather than empty is `undefined`"
    );
  }

  // **Silence here does not mean the shop is at fault**, and saying so would
  // repeat the mistake this whole helper exists to stop.
  //
  // `validate()` tests each field with `?.length === 0`. A value that is
  // **missing** rather than empty gives `undefined`, and `undefined === 0` is
  // false — so nothing is shaken. Meanwhile `isValid()` still refuses, because
  // its own checks return early on the same field. A form that neither closes
  // nor shakes is therefore most likely one whose address is missing a field
  // outright, not a backend that went quiet.
  return (
    "the form neither closed nor pointed at a field. That is what happens when " +
    "a value is missing rather than empty: `validate()` only shakes on " +
    "`length === 0`, and `undefined` is not `0`, while `isValid()` still " +
    "refuses. Check the contact name, the contact phone and the region on this " +
    "address. A backend that never answered is the less likely reading"
  );
};

/** Change one saved address's title, starting from the sheet.
 *
 *  Not `profile.addAddress`: that one starts on a blank form and would create a
 *  second address (`tests/e2e/actions/profile.ts:649`). The edit path is its own
 *  thing — the row's pencil calls `startUpdateAddress(address)` and then
 *  `slideNext()` (`components/Cart/AddressListContainer.tsx:265-275`), which
 *  opens the same form already filled with that address.
 *
 *  Saving posts an **update**, because the form holds an id
 *  (`components/Cart/AddAddressForm.tsx:648-654`), and the form slides back on
 *  its own only when that update came back. So a form that stays open is the
 *  core backend refusing, and it is reported rather than waited out. */
export const editAddressTitleFromSheet = async (
  page: Page,
  options: { current: string; next: string },
): Promise<{ saved: boolean; refusal: string }> => {
  const row = checkout.addressSheetRow(page, options.current).first();

  const found = await row
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!found) {
    return {
      saved: false,
      refusal: "the address sheet holds no row with that title",
    };
  }

  await checkout.editAddressOnRow(row).click();

  const form = page.getByTestId("add-address-form");
  const opened = await form
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    return {
      saved: false,
      refusal: "pressing the edit control never opened the address form",
    };
  }

  const titleField = page.getByTestId("add-address-input");
  await expect(
    titleField,
    "the edit form opened with no address-title field to change",
  ).toBeVisible({ timeout: CART_ANSWER_MS });
  await titleField.fill(options.next);

  // **Save does nothing at all unless every field the form wants is filled.**
  // `isValid()` (`components/Cart/AddAddressForm.tsx:45-83`) needs a contact
  // name, a phone longer than five characters, a detail line, a title and a
  // region — and when one is missing the button simply does not act.
  //
  // An address created through the API does not always come back with all of
  // them, so the two contact fields are filled here when the form left them
  // empty. Never overwritten: an address that already carries them keeps what
  // the account holds. This is the same rule `profile.addAddress` follows
  // (`tests/e2e/actions/profile.ts:713-723`).
  // Filled unconditionally, not only when empty. This address belongs to the
  // case — it created it moments ago — so there is nothing of the account's to
  // overwrite, and "only when empty" left a real gap: `startUpdateAddress`
  // rebuilds `contact_person_name` from `contact_info.name`
  // (`store/Cart/reducer.ts:243-256`), so a backend that returns the contact
  // under a different key leaves the form holding `undefined` while the input
  // still shows something. Typing here sets **both** keys at once
  // (`AddAddressForm.tsx:479-487`), which is what the form's own rule wants.
  for (const [field, value] of [
    [profile.addressRecipientField(page), "Trydos E2E Probe"],
    [profile.addressPhoneField(page), "963900000002"],
  ] as const) {
    if ((await field.count()) === 0) continue;
    await field.fill(value).catch(() => undefined);
  }

  await page.getByTestId("AddSaveButton").click();

  // The form closes itself from the update's own callback, so this waits for
  // the app's answer rather than for a moment that looked long enough.
  const saved = await form
    .waitFor({ state: "hidden", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);

  return { saved, refusal: saved ? "" : await whyTheFormRefused(page) };
};

/** Go back from the checkout to the bag.
 *
 *  `AC-8`, `AC-9` and `AC-10` all read their figures in the **bag**, because
 *  `OrderButton` is mounted only in the drawer
 *  (`components/Cart/index.tsx:447`). The checkout draws no payable total, so
 *  without this control those three cannot be carried out at all.
 *
 *  Going back **remounts the drawer**, and the drawer reads the bag again on
 *  mount (`components/Cart/index.tsx:79-84`) — only one slide is mounted at a
 *  time (`components/global/SlideNavigation.tsx`). So the figures read after
 *  this come from a fresh `/cart/cart_shipping`, not from what was on screen
 *  before the checkout. */
export const returnToBag = async (page: Page): Promise<{ reached: boolean }> => {
  const back = checkout.backToBag(page);
  await expect(
    back,
    "the checkout drew no back control, so there is no way back to the bag",
  ).toBeVisible({ timeout: CART_ANSWER_MS });
  await back.click();

  const reached = await cart
    .drawer(page)
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);
  if (!reached) return { reached: false };

  // The drawer is drawn before its read comes back. Wait for a line, so the
  // figures read next come off a bag the app has really loaded.
  await cart
    .lines(page)
    .first()
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .catch(() => undefined);

  return { reached: true };
};

/** The name the **bag** shows for one of its lines.
 *
 *  Read this before naming a line, and never reuse the title the product page
 *  showed. The two are different strings, and a live run proved it: the product
 *  page drew `"Solara | Electronics & Technology | Black"` while the bag drew
 *  the cart row's own `name` field, so `lineNamed` matched nothing and the case
 *  failed saying the bag held no such line.
 *
 *  The bag also **cuts the name at 50 characters** and adds an ellipsis
 *  (`components/Cart/CartItem.tsx:79-80`), which is a second reason the product
 *  page's title cannot be used: `hasText` looks for the whole string.
 *
 *  `index` is which line to read, in the order the bag draws them. */
export const bagLineName = async (
  page: Page,
  index = 0,
): Promise<string> => {
  const line = cart.lines(page).nth(index);
  await expect(
    line,
    `the bag draws no line at position ${index + 1}, so there is nothing to name`,
  ).toBeVisible({ timeout: CART_ANSWER_MS });

  const name = cart.lineName(line).first();
  await expect
    .poll(async () => ((await name.textContent()) ?? "").trim(), {
      timeout: CART_ANSWER_MS,
      message:
        `the line at position ${index + 1} shows no product name, so nothing ` +
        `below could name the product it is acting on`,
    })
    .not.toBe("");

  return ((await name.textContent()) ?? "").trim();
};

/** Ask for one more, or one fewer, of a named line.
 *
 *  **The quantity on screen is optimistic.** Both handlers call `setInputValue`
 *  before they call anything (`components/Cart/index.tsx:566`, `:588`), so the
 *  new number is drawn while the request is still in the air and stays drawn if
 *  the core backend refuses. Reading it straight after the press therefore
 *  agrees with a backend that said no.
 *
 *  So this waits for the bag re-read that follows the change (`:570-574` for
 *  minus, `:615-619` for plus) and reads the quantity after it. The watcher is
 *  built here and stopped in a `finally`, so it never outlives the press.
 *
 *  The quantity is read with `inputValue()`, not `textContent()`:
 *  `QuantityInCart` is a disabled `<input>` (`:804`), and an input's text
 *  content is always empty.
 *
 *  `minus` at quantity 1 is neither a failure nor a missing element: the delete
 *  control takes its place (`:780`). It is reported as `pressed: false`. */
export const changeLineQuantity = async (
  page: Page,
  options: { name: string; direction: "plus" | "minus" },
): Promise<{ pressed: boolean; quantity: number | null; said: string }> => {
  const line = cart.lineNamed(page, options.name).first();
  await expect(line, `the bag holds no line called "${options.name}"`).toBeVisible(
    { timeout: CART_ANSWER_MS },
  );

  const quantityField = cart.quantity(line);
  const before = Number.parseInt(await quantityField.inputValue(), 10);
  const wanted = options.direction === "plus" ? before + 1 : before - 1;

  const control =
    options.direction === "plus" ? cart.plus(line) : cart.minus(line);
  if ((await control.count()) === 0) {
    return {
      pressed: false,
      quantity: Number.isNaN(before) ? null : before,
      said:
        `the line "${options.name}" draws no ${options.direction} control at ` +
        `quantity ${before}`,
    };
  }

  // What the cart backend said about the change itself, kept for the message.
  //
  // `/cart/cart_shipping` only says what the bag holds afterwards; it cannot say
  // **why** a change was refused. `/cart/update` can — a live run raised the
  // quantity of a product with one piece in stock, the bag came back unchanged,
  // and the only thing on screen was the old number.
  let updateSaid = "the cart backend was never asked to change the quantity";
  const onUpdate = (response: import("@playwright/test").Response): void => {
    const target = response.request().headers()["x-proxy-url"] ?? "";
    if (!response.request().url().includes("/api/proxy")) return;
    if (!target.includes("/cart/update")) return;
    const status = response.status();
    void response
      .text()
      .then((body) => {
        updateSaid = `${target} answered ${status}: ${body.slice(0, 300)}`;
      })
      .catch(() => {
        updateSaid = `${target} answered ${status} and its body could not be read`;
      });
  };
  page.on("response", onUpdate);

  const money = watchCartMoney(page);
  try {
    const seenBefore = money.seen("shipping");
    await control.click();

    const answer = await money.waitForAnswer("shipping", {
      after: seenBefore,
      timeout: CART_ANSWER_MS,
    });

    if (answer === null) {
      return {
        pressed: true,
        quantity: null,
        said:
          `pressing ${options.direction} on "${options.name}" never brought the ` +
          `bag back — the core backend did not answer /cart/cart_shipping`,
      };
    }

    // Read only now. Anything read before this point is the optimistic value.
    await expect
      .poll(async () => Number.parseInt(await quantityField.inputValue(), 10), {
        timeout: CART_ANSWER_MS,
        message:
          `"${options.name}" does not show quantity ${wanted} after the bag ` +
          `was read again. The app draws the new number before it asks, so a ` +
          `value that went back to ${before} means the cart backend refused ` +
          `the change — most often because the product has only ${before} in ` +
          `stock. The plus control is drawn whatever the stock is: ` +
          `shouldDisablePlus always returns false, and the check against ` +
          `available_quantity beside it is commented out ` +
          `(components/Cart/index.tsx:623-633). The change call said: ` +
          `${updateSaid}. The bag then said: ${answer.said}`,
      })
      .toBe(wanted);

    const after = Number.parseInt(await quantityField.inputValue(), 10);
    return {
      pressed: true,
      quantity: Number.isNaN(after) ? null : after,
      said: answer.said,
    };
  } finally {
    money.stop();
    page.off("response", onUpdate);
  }
};

/** Take one named line out of the bag.
 *
 *  Removing is optimistic too, and it can be **undone**: the row is dropped from
 *  the store first, and `services/cart.ts > RemoveFromCart` puts it back when
 *  the core backend refuses. A check that looks straight after the click sees
 *  the row gone either way.
 *
 *  So this waits for the re-price that follows every removal (`GetCartOreview()`,
 *  `components/Cart/index.tsx:137-142`) and only then asks whether the line is
 *  really gone — which is after the undo would have put it back. */
export const removeLineNamed = async (
  page: Page,
  name: string,
): Promise<{ removed: boolean; linesLeft: number; said: string }> => {
  const line = cart.lineNamed(page, name).first();
  await expect(line, `the bag holds no line called "${name}"`).toBeVisible({
    timeout: CART_ANSWER_MS,
  });

  const money = watchCartMoney(page);
  try {
    const seenBefore = money.seen("overview");
    await cart.deleteLine(line).click();

    const answer = await money.waitForAnswer("overview", {
      after: seenBefore,
      timeout: CART_ANSWER_MS,
    });

    await expect
      .poll(async () => await cart.lineNamed(page, name).count(), {
        timeout: CART_ANSWER_MS,
        message:
          `"${name}" is still in the bag after it was removed — the removal was ` +
          `refused and put back. The core backend said: ${
            answer?.said ?? money.said("overview")
          }`,
      })
      .toBe(0);

    return {
      removed: true,
      linesLeft: await cart.lines(page).count(),
      said: answer?.said ?? money.said("overview"),
    };
  } finally {
    money.stop();
  }
};
