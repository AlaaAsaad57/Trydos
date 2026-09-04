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
  await button.click();

  await expect(
    cart.drawer(page),
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

/** Add the product this page is showing to the bag.
 *
 *  Opens the sheet, takes the first colour and the first size the product offers
 *  — a product with neither is normal and is not treated as a fault — presses
 *  "Add To Bag", and waits for the bag to grow.
 *
 *  **Waits on the bag, not on the button.** The button's own label changes
 *  through `translateFunction`, so reading it would tie this to English. The
 *  navigation badge is the number the app itself put on screen after the cart
 *  came back.
 *
 *  Returns the product's name, so the case can say what it bought. */
export const addOpenProductToBag = async (
  page: Page,
): Promise<{ name: string; lines: number }> => {
  const before = await bagLineCount(page);

  const name = (await product.name(page).textContent())?.trim() ?? "";

  const buy = product.addToCart(page);
  await expect(
    buy,
    "the product page drew no Buy control, so nothing here can add to a bag",
  ).toBeVisible();
  await buy.click();

  const addToBag = addToCartSheet.addToBag(page);
  await expect(
    addToBag,
    "pressing Buy did not open the add-to-bag sheet",
  ).toBeVisible({ timeout: CART_ANSWER_MS });

  // Colour and size are refused silently by the sheet when the product has them
  // and none is picked — it shakes the row and returns. Absent is normal.
  const colour = addToCartSheet.colour(page).first();
  if (await colour.isVisible().catch(() => false)) await colour.click();

  const size = addToCartSheet.size(page).first();
  if (await size.isVisible().catch(() => false)) await size.click();

  await addToBag.click();

  await expect
    .poll(async () => await bagLineCount(page), {
      timeout: CART_ANSWER_MS,
      message:
        `"${name}" was never added to the bag — the sheet accepted the press ` +
        "but the cart backend never came back with a bigger bag",
    })
    .toBeGreaterThan(before);

  // The sheet is a bottom sheet and closes on Escape
  // (`components/global/BottomSheet.tsx`). Left open it covers the navigation,
  // and the next click in the journey lands on it.
  await page.keyboard.press("Escape");
  await expect(
    addToBag,
    "the add-to-bag sheet stayed open after Escape, so it covers everything below it",
  ).toBeHidden({ timeout: CART_ANSWER_MS });

  return { name, lines: await bagLineCount(page) };
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
 *  Returns the order number the success panel shows, or `null` when no panel
 *  ever appeared. `null` is the honest answer for a refused checkout, and the
 *  case decides what it means: a live journey calls it a failure, a scripted one
 *  is asking for exactly that. */
export const placeOrder = async (
  page: Page,
): Promise<{ orderGroupId: string | null }> => {
  const agree = checkout.agreeToTerms(page);
  await expect(
    agree,
    "the review step drew no terms row, so the order can never be placed",
  ).toBeVisible();
  await agree.click();

  await checkout.placeOrder(page).click();

  const arrived = await checkout
    .successPanel(page)
    .waitFor({ state: "visible", timeout: CHECKOUT_MS })
    .then(() => true)
    .catch(() => false);

  if (!arrived) return { orderGroupId: null };

  const number = checkout.orderNumber(page).first();
  const text = (await number.textContent())?.trim() ?? "";

  // A panel with no number on it is a partial success, and a partial success is
  // a failure — there would be nothing to find the order by, or to cancel.
  return { orderGroupId: text === "" ? null : text };
};
