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

import { addToCartSheet, cart, checkout, nav, product } from "../selectors";
import { gotoProductAtOrNull, leaveProductPage } from "./nav";

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
  const drawer = cart.drawer(page);
  for (let press = 0; press < 3; press += 1) {
    await button.click();
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
): Promise<{ reached: boolean }> => {
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

  return { reached };
};

/** Choose cash on delivery.
 *
 *  Answers whether the shop offered it at all. The list of methods comes from
 *  the cart answer's `available_payment_method`, so "not offered" is the backend
 *  speaking about this country and this bag — a fact worth reporting by name,
 *  not a slow render to wait out. */
export const chooseCashOnDelivery = async (
  page: Page,
): Promise<{ offered: boolean }> => {
  const cod = checkout.cashOnDelivery(page);

  const offered = await cod
    .waitFor({ state: "visible", timeout: CART_ANSWER_MS })
    .then(() => true)
    .catch(() => false);

  if (!offered) return { offered: false };

  await cod.click();
  return { offered: true };
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

/** Move from the address and payment step to the review step.
 *
 *  The button re-reads the bag and the customer first, and refuses in four
 *  named ways: no default address, no payment method chosen, a phone that is not
 *  verified, or a bag holding something that is no longer available. All four
 *  leave the screen where it is, so this reports whether it moved rather than
 *  claiming it did. */
export const confirmShippingAndPayment = async (
  page: Page,
): Promise<{ reached: boolean }> => {
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

  return { reached };
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
export const placeOrder = async (
  page: Page,
): Promise<{ panelShown: boolean; orderGroupId: string | null }> => {
  const agree = checkout.agreeToTerms(page);
  await expect(
    agree,
    "the review step drew no terms row, so the order can never be placed",
  ).toBeVisible();
  await agree.click();

  await expect(
    agree,
    "the terms row never came back ticked, so Place Order would be refused in " +
      "silence — the shop did not answer the policy call",
  ).toHaveAttribute("data-agreed", "true", { timeout: CHECKOUT_MS });

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
