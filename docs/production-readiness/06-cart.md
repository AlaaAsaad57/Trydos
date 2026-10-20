# Cart — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Adding, changing and removing items, the bag drawer, the totals, the coupon and the "Out Of Bag" list all work; the "luck" price is protected only in the browser, and one bug gives the luck price after the timer ends.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
The shopper taps a product's bag button. A bottom sheet opens (`components/Cart/AddToCart/*`), and the shopper picks a colour and size and adds the item.
The bag drawer opens from the header bag icon or from `?cart=true` in the URL (`CartProvider` → `StepSlider` → `components/Cart/index.tsx`).
In the drawer the shopper changes quantities, removes lines, moves lines to "Out Of Bag" (the old cart), applies a coupon and goes on to checkout.
"Luck" products show a 50-second countdown with a lower price (`store/luck`, `utils/luck`, cookie `redemed_ids`).

"market" below means the market backend behind `/api/proxy`: the **gateway** for guests and the **core** backend for verified shoppers. `/api/proxy` names the one it used in the `x-market-backend` header.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Shopper taps a product's bag button → the sheet opens, loads the full product and the bag, and shows a loading state until both arrive. | market (product read, `/cart/cart_shipping`) | `components/Cart/CartProvider.tsx:217-229`, `components/Cart/AddToCart/AddToCartComponent.tsx:299-376` | `tests/components/Cart/AddToCart/AddToCartComponent.test.tsx`; e2e BUY-01 |
| W-2 | The sheet picks a default colour and size: the URL's `?color` / `?size`, then the search-filter sizes, then the first one in stock. | none (local) | `AddToCartComponent.tsx:61-243` (`resolveDefaultSelection`) | `AddToCartComponent.test.tsx` |
| W-3 | Shopper changes colour → image, price, "Last N" and "Sale" labels follow the chosen colour. | none (local) | `components/Cart/AddToCart/ColorSelect.tsx`, `AddToCartComponent.tsx:620-649` | `tests/components/Cart/AddToCart/ColorSelect.test.tsx`, `AddToCartComponent.test.tsx` |
| W-4 | Shopper changes size → a sold-out size is red, a size the shopper waits for has a bell, "Last N" shows when 10 or fewer are left. | none (local) | `components/Cart/AddToCart/SizeSelect.tsx` | `tests/components/Cart/AddToCart/SizeSelect.test.tsx` |
| W-5 | Shopper taps "Add To Bag" with no colour or size picked → the missing picker shakes and turns red; nothing is sent. | none | `components/Cart/AddToCart/Button.tsx:118-145` | `tests/components/Cart/AddToCart/Button.test.tsx` |
| W-6 | Shopper adds a new item → `POST /cart/add` → the line is stored, the header number goes up, the button says "Added To Your Bag", and the bag is read again. | market `/cart/add` | `Button.tsx:271-336`, `services/cart.ts:10-84` | `Button.test.tsx`, `tests/services/cart.test.ts`; e2e BUY-01, BUY-04, BUY-05 |
| W-7 | Shopper adds an item that is already in the bag → `POST /cart/update` with quantity + 1. | market `/cart/update` | `Button.tsx:217-270`, `services/cart.ts:95-163` | `Button.test.tsx`, `cart.test.ts` |
| W-8 | The line reaches the seller's limit or the flash-deal limit (the lower one wins) → "Max Allowed Quantity Reached"; no request is sent. | none | `AddToCartComponent.tsx:439-450`, `Button.tsx:118-122` | `AddToCartComponent.test.tsx`, `Button.test.tsx` |
| W-9 | Shopper taps minus in the sheet → quantity − 1, or the line is removed at 1. A refused removal is not reported as done. | market `/cart/update`, `/cart/remove` | `Button.tsx:350-428` | `Button.test.tsx`, `tests/components/Cart/AddToCart/NotifyButton.test.tsx` |
| W-10 | The backend refuses an add → the shopper sees the backend's message, the error goes to Sentry, and the stock is read again. | market | `Button.tsx:338-348`, `utils/fetchData.ts:770-775` | `Button.test.tsx` ("logs and reloads the stock when the core backend refuses the add") |
| W-11 | A sold-out, inactive or country-restricted product → the sheet shows "Notify me" instead of "Add To Bag". | none | `AddToCartComponent.tsx:595-611` | `AddToCartComponent.test.tsx` |
| W-12 | In the bag, plus is refused for stock → a "Do You Want Us To Notify You When It Is Available?" box opens. "Notify Me" asks the browser for push permission, needs a device token, and shows "subscribed" only when the backend agreed. | market `/firebase_device_tokens/subscribe_topic` | `components/Cart/NotifyWhenAvailableModal.tsx:84-117`, `services/home.ts:574-592` | `tests/components/Cart/QuantutyInput.test.tsx` |
| W-13 | Header bag icon shows the number of bag lines. The bag is read at page start, so the number is right before the drawer opens. Tapping the icon opens the drawer. | market `/cart/cart_shipping` | `components/Home/UserNavTopSection.tsx:164-180`, `components/products/ProductCartHeader.tsx`, `services/home.ts:66-70` | no unit test; e2e BUY-01 ("the bag starts empty", "the bag holds what was added") |
| W-14 | `?cart=true` in the URL opens the drawer; opening the drawer writes `?cart=true`; the phone or browser back button closes it. | none | `CartProvider.tsx:85-164`, `CartProvider.tsx:295` | `tests/components/Cart/CartProvider.test.tsx` |
| W-15 | Drawer lists each line: image, brand, name, colour, size, pieces, shipping days, price, old price and "Saved N%". A line that is unavailable, inactive or not sold in this country says so. | market `/cart/cart_shipping` | `components/Cart/index.tsx:77-110`, `components/Cart/CartItem.tsx:196-210` | `tests/components/Cart/CartItem.test.tsx` |
| W-16 | Reading the bag fails → "Cart Loading Error" with "Try Again", which reads it again. | market `/cart/cart_shipping` | `utils/functions.tsx:268-276`, `components/Cart/CartErrorComponent.tsx`, `index.tsx:325-329` | `tests/components/CartErrorComponent.test.tsx` |
| W-17 | Empty bag → "Cart is Empty" screen; the bottom button says "Back To HomePage" and closes the drawer. | none | `components/Cart/EmptyCart.tsx`, `components/Cart/OrderButton.tsx:614-616, 665-676` | `tests/components/EmptyCart.test.tsx`, `OrderButton.test.tsx` |
| W-18 | Plus / minus on a line → `POST /cart/update`. The number changes at once and goes back if the backend refuses. Plus is capped by the seller limit, the flash-deal limit and the stock left. | market `/cart/update` | `index.tsx:510-541, 575-676` | `QuantutyInput.test.tsx`; e2e BUY-04 |
| W-19 | Shopper deletes a line → `POST /cart/remove`, then the totals are read again. A refused delete puts the line back. | market `/cart/remove`, `/cart/cart_overview` | `index.tsx:135-143`, `services/cart.ts:164-201`, `store/Cart/reducer.ts:457-465` | `cart.test.ts`, `QuantutyInput.test.tsx`; e2e BUY-04, BUY-05 |
| W-20 | Totals panel (swipe or tap to open): items, normal price, total discount %, shipping ("Shipping Is Completely Free…" when 0), and the payable total. Every number comes from the backend. | market `/cart/cart_shipping`, `/cart/cart_overview` | `OrderButton.tsx:316-590`, `utils/functions.tsx:290-307` | `tests/components/Cart/OrderButton.test.tsx`, `OrderMarquee.test.tsx`; e2e BUY-03 |
| W-21 | Shopper taps "Reschedule" on a line → `POST /cart/convert_to_old`. The line leaves the bag only when the backend says it moved. | market `/cart/convert_to_old` | `index.tsx:677-701`, `services/cart.ts:202-233` | `QuantutyInput.test.tsx`, `cart.test.ts` |
| W-22 | "Out Of Bag!" list under the bag → `GET /old-cart/get_old_cart`, newest first, without items already back in the bag, with a live 30-minute countdown. | market `/old-cart/get_old_cart` | `components/Cart/OldCartContainer.tsx:19-138`, `utils/functions.tsx:202-250` | `tests/components/Cart/OldCartContainer.test.tsx` |
| W-23 | Shopper taps "Add Again?" on an Out Of Bag item → `POST /cart/add`, then both lists are read again. | market `/cart/add` | `OldCartContainer.tsx:141-171` | `OldCartContainer.test.tsx` |
| W-24 | Shopper taps "Hide" on one Out Of Bag item, or "Hide All" → the item(s) leave the list and `POST /old-cart/hide` is sent. | market `/old-cart/hide` | `OldCartContainer.tsx:294-300, 538-546`, `services/home.ts:647-673` | `OldCartContainer.test.tsx` |
| W-25 | Shopper types a coupon and taps "Apply" → `GET /coupon/apply?code=…`. Accepted: the discount shows on the button and the bag is read again. Refused: the backend's message shows under the box and the total stays the same. | market `/coupon/apply` | `components/Cart/couponElement.tsx:58-107` | `tests/components/Cart/couponElement.test.tsx`; e2e BUY-07, SCRIPT-21 |
| W-26 | Shopper opens a shared link with `?coupon=CODE` → the code is saved, removed from the URL, and applied by itself when the checkout opens. | market `/coupon/apply` | `CartProvider.tsx:166-186`, `couponElement.tsx:108-114` | `CartProvider.test.tsx`, `couponElement.test.tsx`; e2e SCRIPT-22 |
| W-27 | Luck countdown: a luck product starts a 50-second window the first time it is seen. The window pauses when the tab is hidden, the card is off screen or a page is loading, and it continues after a reload. | none (browser `localStorage` key `luck_timers`) | `hooks/useLuckTimer.ts`, `store/luck/reducer.ts`, `utils/luck/index.ts:149-205` | `tests/hooks/useLuckTimer.test.ts`, `tests/store/luckReducer.test.ts`, `tests/utils/luckIndex.test.ts` |
| W-28 | While the window runs, the sheet and the bag show the luck price in orange. Adding the item sends `is_luck: true`, and the product is written to the `redemed_ids` cookie, so the offer ends. | market `/cart/add` | `AddToCartComponent.tsx:736-747, 840-856`, `Button.tsx:294-299`, `components/Cart/index.tsx:472-476` | `Button.test.tsx` ("adds the chosen variant of a luck product at the luck price"), `AddToCartComponent.test.tsx`, `tests/components/Cart/AddToCart/PricesRow.test.tsx` |
| W-29 | A product this browser already redeemed shows no luck badge, also on cached pages. An inline script hides the badge before first paint; React hides it again after load. | none (cookie `redemed_ids`) | `utils/luck/redeemedScript.ts`, `utils/luck/index.ts:218-224` | `tests/components/Home/RedeemedLuckScript.test.tsx`, `luckIndex.test.ts` |
| W-30 | An RDB payment is pending and the shopper changes the bag → the backend answers 409. The shopper sees "You have a payment in progress" with "Continue payment" / "Cancel payment" instead of an error. | core `/cart/*`, `/old-cart/hide` | `services/cart.ts:49-54` (same in each write), `services/rdbPayment.ts:145-152`, `components/Cart/RdbPaymentLockedSheet.tsx` | `cart.test.ts`, `tests/components/Cart/RdbPaymentLockedSheet.test.tsx` |
| W-31 | A guest's bag stays after the guest signs in. | gateway → core | `services/home.ts:66-70` | e2e BUY-05 |
| W-32 | Shopper taps "Confirm & Continue" with a line that is unavailable, not sold in this country or inactive → "Please Review Your Cart Some Products Not Available"; the checkout does not open. | market `/cart/cart_shipping` | `OrderButton.tsx:179-233` | `OrderButton.test.tsx`; e2e SCRIPT-16, SCRIPT-17 |

## ⚠️ Works, with limits
- **L-1** The header number counts bag **lines**, not pieces. Two of the same shirt in one line show "1" (`UserNavTopSection.tsx:177` uses `localCart.length`).
- **L-2** An applied coupon cannot be removed or changed in the UI. After a success, `applyCoupon` returns at once (`couponElement.tsx:60`), and the input is hidden.
- **L-3** "Hide" and "Hide All" in Out Of Bag clear the list on screen first. The code does not wait for the backend and does not read its answer (`OldCartContainer.tsx:298-299, 544-545`). If the backend refuses, the items come back the next time the drawer opens. "Hide All" sends an empty body `{}`.
- **L-4** The 30-minute Out Of Bag countdown exists only on screen. "Add Again?" stays clickable after it ends; the backend decides.
- **L-5** The bag and Out Of Bag reads wait up to **5 minutes** for a user id (`utils/functions.tsx:206-213, 256-263`). If guest registration fails, the drawer shows its skeleton for that long.
- **L-6** A failed add of a luck product still ends the luck window. `expireLuck` runs before the success check (`Button.tsx:299`).
- **L-7** A refused delete puts the line back at the **end** of the list, not in its old place (`store/Cart/reducer.ts:457-465`).
- **L-8** The bag learns about a pending RDB payment only when a bag write is refused. After a reload, the lock sheet shows again only on the next refused write.
- **L-9** Coupon errors show the backend's text as it arrives. If the backend sends English only, Arabic, Turkish and Kurdish shoppers see English.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | The sheet saves `is_luck` once, when it opens. When the 50-second window ends with the sheet still open, the price on screen goes back to normal. But "Add To Bag" still sends `is_luck: true` and stores the luck price for the line. | The shopper sees the normal price but may get the luck price. | `components/Cart/AddToCart/Button.tsx:294-297`; `AddToCartComponent.tsx:280-283` | Frontend | Yes — the bag can charge a price the screen did not show. |
| M-2 | The luck offer is limited only in the browser. The window is a `localStorage` timer. The "already redeemed" list is a cookie that keeps only 5 products (`NEXT_PUBLIC_MAX_ARRAY_LENGTH`, default 5). `/cart/add` takes `is_luck` from the browser. A private window, another phone, cleared cookies, a 6th redeemed product, or a direct API call brings the luck price back. | The same shopper can buy at the luck price many times. | `utils/luck/index.ts:3-11, 132-140`; `services/cart.ts:24-31` | Backend | Yes — until the backend confirms that it limits luck per shopper and per time. |
| M-3 | "Notify me" in the add-to-cart sheet marks the item as "notified" **before** the backend answers. It ignores the backend answer and does not check that the browser has a push token. The unit test `AddToCartComponent.test.tsx:586-594` expects this: it passes with no token. (The bag's own notify box, W-12, does this correctly.) | A bell that says "you will be told", when nothing was saved. No notice ever comes. | `components/Cart/AddToCart/AddToCartComponent.tsx:963-985` | Frontend | No |
| M-4 | The totals panel has a "Gift — First Shopping" row that always shows "- 0". | A gift line with no gift. | `components/Cart/OrderButton.tsx:452-465` | Product / Frontend | No |
| M-5 | The share icon in the drawer header has no action. | Tapping it does nothing. | `components/Cart/index.tsx:318` | Frontend | No |
| M-6 | Hiding one Out Of Bag item recalculates the other rows from `price_of_variant` and `discount` (`store/Cart/reducer.ts:363-376`). The first load reads `unit_price` and `offer_price` (`:351-361`). If the backend does not send the first two fields, the other rows lose their price. The unit test `tests/store/cartReducer.test.ts:1064-1080` expects `offer_price: 0` in this case. | After one "Hide", other rows may show price 0 and "Saved 100%" until the drawer reloads. | `store/Cart/reducer.ts:363-376` | Frontend | No |

## 🔒 Must do before launch
- [ ] M-1: read the live luck state (`luckActive`) when adding, not the flag saved when the sheet opened. Prove it with a unit test that is red first.
- [ ] M-2: get written confirmation that the core backend and the gateway limit the luck price per shopper and per time window, and do not trust `is_luck` from the browser.

## ❓ Needs confirmation from the backend team
- `/cart/add` gets `is_luck` from the browser. Does the backend check it? How does it know that the 50-second window ended, and that this shopper did not redeem the product before (for example on another device)?
- Is the seller's maximum quantity, and the flash-deal limit, also checked on the backend for `/cart/add` and `/cart/update`? A shopper can skip the browser check.
- `/old-cart/hide` with body `{}`: does it hide every item? "Hide All" depends on it.
- Which price fields do Out Of Bag items carry: `unit_price` / `offer_price`, or `price_of_variant` / `discount`? (M-6)
- Is there an endpoint to remove an applied coupon? The UI has no way to do it.
- Are `/coupon/apply` messages translated for `ar`, `tr` and `ku`?
- Is the 30-minute Out Of Bag window a backend rule? What does "Add Again" do after it ends?
- Do the core backend and the gateway send the same bag fields (`check_availability`, `is_country_restricted`, `is_active`, `cod_cost`, the totals)?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/components/Cart/AddToCart/AddToCartComponent.test.tsx`, `Button.test.tsx`, `Card.test.tsx`, `ColorSelect.test.tsx`, `SizeSelect.test.tsx`, `PricesRow.test.tsx`, `ExtraInfoArea.test.tsx`, `NotifyButton.test.tsx`, `CartContentOfProduct.test.tsx`, `FlashDealBannerCart.test.tsx`, `ProductFeatures.test.tsx`, `PropertiesMarquee.test.tsx`
- `tests/components/Cart/CartProvider.test.tsx`, `CartItem.test.tsx`, `QuantutyInput.test.tsx`, `OrderButton.test.tsx`, `OrderMarquee.test.tsx`, `OldCartContainer.test.tsx`, `couponElement.test.tsx`, `RdbPaymentLockedSheet.test.tsx`
- `tests/components/CartErrorComponent.test.tsx`, `tests/components/EmptyCart.test.tsx`, `tests/components/skeleton/CartSkeleton.test.tsx`
- `tests/services/cart.test.ts`, `tests/store/cartReducer.test.ts`, `tests/store/luckReducer.test.ts`, `tests/utils/luckIndex.test.ts`, `tests/hooks/useLuckTimer.test.ts`, `tests/components/Home/RedeemedLuckScript.test.tsx`

**Browser (Playwright):**
- `tests/e2e/shopper.live.spec.ts`: BUY-01 (add, bag, checkout), BUY-03 (bag money comes from the shop), BUY-04 (plus, remove), BUY-05 (guest bag survives sign-in), BUY-07 (unknown coupon refused). These cases skip when the test account or the QA seed is missing.
- `tests/e2e/checkout.scripted.spec.ts`: SCRIPT-16 and SCRIPT-17 (an unavailable line blocks checkout), SCRIPT-21 (coupon accepted), SCRIPT-22 (coupon from a shared link).

**Expected-failure markers:** none in these files (no `it.fails`, no `test.fail`, no `BUG-n` marker).

**Tests that expect the wrong behaviour today:** `AddToCartComponent.test.tsx:586-594` (M-3) and `tests/store/cartReducer.test.ts:1064-1080` (M-6). Both must change when those bugs are fixed.

**Important cases with NO test:**
- Luck after the timer ends with the sheet open (M-1): no test.
- Luck on the live site: no browser test adds a luck product.
- Out Of Bag (Reschedule, Add Again, Hide) and both notify-me flows: unit tests only, no browser test.
- The header bag number: no unit test.
