# Checkout and payment — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Cash on delivery and the RDB payment work end to end in the code; but every order carries a fake note, the terms cannot be opened, and card and crypto are not proven.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
From the bag drawer the shopper taps "Confirm & Continue". A guest or a shopper with no verified phone first confirms the phone with a one-time code inside the button.
The checkout screen (`components/Cart/OrdersPage.tsx`) has two steps. Step 1: shipping address and payment method, then "Confirm Shipping & Payment". Step 2: summary, terms tick, then "Place Order".
Payment methods are cash on delivery, RDB wallet (QR / app payment), credit card and crypto. The backend decides which ones show.
After a good order the shopper sees the success screen with the order number.

"market" below means the market backend behind `/api/proxy`: the **gateway** for guests and the **core** backend for verified shoppers. "elastic" is the search backend (`server: "elastic"`), also behind `/api/proxy`.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Verified shopper taps "Confirm & Continue" → the bag and the customer profile are read again, availability is checked, and the checkout slides in. | market `/cart/cart_shipping`, customer info | `components/Cart/OrderButton.tsx:179-233` | `tests/components/Cart/OrderButton.test.tsx`; e2e BUY-01 |
| W-2 | Guest, or shopper with no verified phone, taps "Confirm & Continue" → the phone + one-time-code panel opens inside the button. After a good code, the checkout opens. | auth (shared sign-in flow) | `OrderButton.tsx:609-660`, `components/Login/Enhanced/InlineVerifyPanel.tsx` | `OrderButton.test.tsx`; e2e BUY-02 |
| W-3 | A line is unavailable, inactive or not sold in this country → "Please Review Your Cart Some Products Not Available"; the shopper stays in the bag. The check runs again at both checkout buttons. | market `/cart/cart_shipping` | `OrderButton.tsx:195-221`, `OrdersPage.tsx:863-880`, `components/Cart/PlaceOrderButtons.tsx:114-131` | `OrdersPage.test.tsx`, `PlaceOrderButtons.test.tsx`; e2e SCRIPT-16, SCRIPT-17 |
| W-4 | Checkout opens → it loads the wallet balance, the saved addresses, the provinces and the country list. The country list is kept for the session. | core `/customer/address/list`; elastic `/api/addresses/get-provinces-by-iso`; wallet | `components/Cart/ShippingAddressContainer.tsx:23-46`, `services/order.ts:202-234, 390-411` | `tests/components/Cart/ShippingAddressContainer.test.tsx`, `tests/services/orderClass.test.ts` |
| W-5 | The default address (`is_default: 1`) shows on the checkout. With none, the box says "No Address Selected"; with no address at all, it offers "Add New Shipping Address". | core | `ShippingAddressContainer.tsx:454-555` | `ShippingAddressContainer.test.tsx`; e2e BUY-01 |
| W-6 | Shopper opens "Show Address List" and taps another address → `POST /customer/address/set-default`, then the totals are re-priced for that address. The list keeps its order. | core `/customer/address/set-default`, `/cart/cart_overview` | `components/Cart/AddressListContainer.tsx:73-84`, `services/order.ts:235-264` | `tests/components/Cart/AddressListContainer.test.tsx`, `orderClass.test.ts`; e2e BUY-03 |
| W-7 | Shopper adds an address → the form checks title, details, region, recipient name and phone; a missing field shakes, also when the field is undefined. `POST /customer/address/add`, then the list is read again from the backend (no local copy, no duplicate). | core `/customer/address/add` | `components/Cart/AddAddressForm.tsx:46-85, 646-695`, `services/order.ts:265-318` | `tests/components/Cart/AddAddressForm.test.tsx` (guards fixed BUG-2, BUG-3); e2e PROF-07 (from settings) |
| W-8 | Shopper edits an address with the pencil → the form opens filled, also when the backend sent no location. `POST /customer/address/update`. | core `/customer/address/update` | `AddressListContainer.tsx:260-275`, `AddAddressForm.tsx:673-683`, `services/order.ts:319-364` | `AddAddressForm.test.tsx`, `AddressListContainer.test.tsx`; e2e BUY-03 ("editing the probe shows the new title") |
| W-9 | Shopper deletes an address → a "Delete Below Address?" box shows the address → "Yes Delete" → `POST /customer/address/delete`. | core `/customer/address/delete` | `OrdersPage.tsx:520-756`, `services/order.ts:365-389` | `OrdersPage.test.tsx`, `orderClass.test.ts`; e2e PROF-07 (from settings) |
| W-10 | A shopper whose name is a guest placeholder must type a user name in the address form. The name is saved with the address. | core (profile update) | `OrdersPage.tsx` (`userName` prop), `AddAddressForm.tsx:51-56, 696-698` | `AddAddressForm.test.tsx` |
| W-11 | Region select: the shopper picks a province from the list, or types (400 ms debounce) → `POST /api/addresses/get-address-by-text`. Picking a result fills province, city, town, street and building, and centres the map. | elastic `/api/addresses/get-address-by-text` | `components/Cart/SelectRegion.tsx:130-272` | `tests/components/Cart/SelectRegion.test.tsx` |
| W-12 | The map box opens and loads the country border (`/api/addresses/CountryBoundaryByIso/:iso`). With no border, the map still opens. "Cancel" clears the pin. | elastic | `components/Cart/Map.tsx:22-52, 172-190` | `tests/components/Cart/Map.test.tsx` |
| W-13 | Payment list shows only the methods the backend lists in `available_payment_method` (`cash_on_delivery`, `rdb`, `crypto`, `card`). Unknown names are hidden. A second tap on the chosen method un-chooses it. | market (bag answer) | `components/Cart/PaymentMethod.tsx:32-140, 269-351` | `tests/components/Cart/PaymentMethod.test.tsx` |
| W-14 | Cash on delivery row shows its delivery cost (`cod_cost`); the totals then use the cash total (`total_cash`). | market | `PaymentMethod.tsx:371-426`, `OrdersPage.tsx` (`getTotalPrice`) | `PaymentMethod.test.tsx`, `PlaceOrderWidget.test.tsx` |
| W-15 | "Confirm Shipping & Payment" with no default address or no payment → the missing box shakes, "Please Select an Address" shows, nothing is sent. | none | `OrdersPage.tsx:787-836` | `OrdersPage.test.tsx` |
| W-16 | "Confirm Shipping & Payment" with both → bag and availability checked again → step 2 shows the bag items, the default address, the chosen payment and the coupon discount. | market | `OrdersPage.tsx:838-882`, `components/Cart/PlaceOrderWidget.tsx` | `OrdersPage.test.tsx`, `PlaceOrderWidget.test.tsx`; e2e BUY-01 |
| W-17 | Shopper ticks "I read and agree to the policies and terms" → `GET /customer/approve-policies`. A shopper who agreed before (`is_approve_policies`) sees the tick already set. "Place Order" stays grey and shakes the row until the tick is set. | core `/customer/approve-policies` | `PlaceOrderButtons.tsx:43-79`, `services/home.ts:160-162` | `PlaceOrderButtons.test.tsx` |
| W-18 | Place Order with cash on delivery → bag checked again → `POST /customer/order/checkout/cash_on_delivery?address_id=…` → success screen with "The Purchase Was Completed Successfully" and the order number. The purchase is reported to analytics once. | core `/customer/order/checkout/cash_on_delivery` | `OrdersPage.tsx:145-180`, `services/order.ts:61-118`, `components/Cart/OrderSuccess.tsx` | `tests/services/orderClass.test.ts`, `OrdersPage.test.tsx`, `OrderSuccess.test.tsx`; e2e BUY-01, ORD-01, SCRIPT-14 |
| W-19 | The backend refuses the order → its message shows as a red notice, no success screen, the button stops loading. | core | `services/order.ts:92-118`, `utils/fetchData.ts:770-776` | `orderClass.test.ts`; e2e SCRIPT-15 |
| W-20 | The bag becomes empty between the two steps → the shopper goes back to the bag. | market | `OrdersPage.tsx:859-862`, `PlaceOrderButtons.tsx:108-113` | `OrdersPage.test.tsx`, `PlaceOrderButtons.test.tsx`; e2e SCRIPT-18 |
| W-21 | The access token expires during checkout → the session is renewed and the order completes. | core | `utils/fetchData.ts` (401 path) | e2e SCRIPT-20 |
| W-22 | RDB: Place Order with "RDB Wallet" → payment screen → `POST /customer/order/checkout/rdb` with the default address. The screen shows the amount and currency exactly as sent, the QR, the short code (copy button), a countdown, and an "open the RDB app" link on phones. It asks `GET /customer/order/rdb-request/:ref` every 4 s. | core `/customer/order/checkout/rdb`, `/customer/order/rdb-request/:ref` | `components/Cart/RdbPaymentModal.tsx:162-341, 531-590`, `services/rdbPayment.ts:48-106` | `tests/components/Cart/RdbPaymentModal.test.tsx`, `tests/services/rdbPayment.test.ts` |
| W-23 | RDB paid → the orders for the bag are loaded → success screen with the order number and the RDB receipt number. Expired, cancelled or failed → the screen says so. A 409 "already pending" opens the existing request instead of a second one. | core `/customer/order/getOrdersByCartGroupID` | `RdbPaymentModal.tsx:99-152, 295-331` | `RdbPaymentModal.test.tsx`, `OrderSuccess.test.tsx` |
| W-24 | RDB cancel → `POST /customer/order/rdb-request/:ref/cancel`. If the money already landed (409), the screen shows the paid result instead. No connection → the QR is blurred and buttons wait; the screen asks again when the connection returns. | core | `RdbPaymentModal.tsx:242-266, 366-396` | `RdbPaymentModal.test.tsx` |
| W-25 | Shopper leaves a pending RDB payment and later changes the bag → "You have a payment in progress" with "Continue payment" (reopens the same request) and "Cancel payment". The sheet asks the backend every 4 s and unlocks the bag when the request ends. | core | `components/Cart/RdbPaymentLockedSheet.tsx`, `app/(client)/[lang]/layout.tsx:264` | `tests/components/Cart/RdbPaymentLockedSheet.test.tsx` |
| W-26 | Success screen → "Done / Back To HomePage" clears the order state and the local bag and goes home. | none | `PlaceOrderButtons.tsx:275-317` | `PlaceOrderButtons.test.tsx` |
| W-27 | The checkout sends **no prices** to the backend. Only `address_id` and the payment method go in the request; the backend prices the order. | core | `services/order.ts:72-83`, `services/rdbPayment.ts:55-62` | `orderClass.test.ts`, `rdbPayment.test.ts` |

## ⚠️ Works, with limits
- **L-1** Orders always go to the **default** address. `address_id` comes from the row with `is_default: 1` (`services/order.ts:69`, `RdbPaymentModal.tsx:294`). If no saved address is the default, the shopper must open the list and tap one.
- **L-2** Choosing an address and deleting one change the screen at once and do not wait for the backend (`AddressListContainer.tsx:80-82`, `OrdersPage.tsx:730-731`). If the backend refuses, the screen is wrong until the next reload. The re-price runs only when the backend agrees.
- **L-3** Editing an address closes the form and shows the new text even when the backend refuses. `UpdateAddressList` calls `callback()` before it checks the answer (`services/order.ts:351`), and the form then calls `updateAddress` anyway (`AddAddressForm.tsx:682`). The backend's error notice still shows.
- **L-4** The terms tick is set even when `/customer/approve-policies` fails; the failure is only logged (`PlaceOrderButtons.tsx:59-76`). Removing the tick does not tell the backend. The unit test expects this.
- **L-5** The phone checks at `OrdersPage.tsx:849` and `PlaceOrderButtons.tsx:99` read the profile saved when the screen drew, not the profile just read. A verified phone never becomes unverified again, so in practice these two checks never stop anyone. The real gate is W-2.
- **L-6** The "balance" check uses a copy of the total taken when the payment was tapped (`PaymentMethod.tsx:55, 80, 106, 135`). If the shopper changes the address after choosing a payment and the total goes up, "Confirm Shipping & Payment" shows "Your Balance Not meet purchase value". Choosing the payment again fixes it. For RDB, card and crypto the "balance" is the total itself, so no real balance is checked here.
- **L-7** The RDB wallet row shows the balance from the wallet service. When the wallet session has expired (401), the row shows 0 and no prompt appears, because `WALLET_REAUTH_ON_401 = false` (`services/wallet/reauthFlag.ts`, `services/order.ts:159-174`). Paying still works: the RDB payment goes through the core backend, not the wallet session.
- **L-8** After an RDB payment, the success screen needs `cart[0].cart_group_id` (`RdbPaymentModal.tsx:100`). If the bag in memory is empty (for example, the payment was reopened from the lock sheet after a reload), the screen closes on "paid" but no success screen appears. The order still exists.
- **L-9** Region search errors are silent: the list stays empty, with no message (`SelectRegion.tsx:146-152`).
- **L-10** Cash on delivery shows only where the backend lists it. On staging that is Syria (`sy`) only.
- **L-11** Card and crypto: the browser side is complete. `PlaceOrder` posts to `/customer/order/checkout/card` or `/crypto`; when the answer has a `url`, the page opens in a frame (`components/Cart/ModalIframe.tsx`). Closing the frame ("X" or a `close-iframe` message) reads the orders of the bag and shows success if any exist, **whatever the payment state**. No test and no backend proof shows a real gateway behind it (see M-8).

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | Every cash-on-delivery, card and crypto order sends the fixed text `order_note=order note`. There is no note field in the UI. RDB orders send an empty note. The unit test `tests/services/orderClass.test.ts:116` expects this text. | Sellers and couriers may see "order note" on every order. | `services/order.ts:78` | Frontend | Yes — junk text on every real order. Send an empty note, or build a note field. |
| M-3 | **Fixed 2026-10-20.** "policies" and "terms" were plain text. Now they open `/[lang]/privacy-policy` and `/[lang]/terms-of-service` in a new tab, and a tap on a link does not tick the box. | — | `components/Cart/PlaceOrderButtons.tsx` | Frontend | No — `tests/components/Cart/PlaceOrderButtons.test.tsx` green. Product still replaces the page text (file 18 M-1) |
| M-4 | **Checked 2026-10-20.** The owner tested the map pin on a real phone. | — | `components/Cart/MapElement.tsx` | Frontend | No — closed |
| M-5 | **Code fixed 2026-10-20:** the key is read from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only; the literal and the fallback are gone. The old key is still in git history, so Ops must rotate it, lock it to the site's domains, and set the new value in Vercel. With the value empty the map does not load; the address still saves (the pin is optional). | Nothing visible. | `components/Cart/MapElement.tsx`, `utils/mapsConfig.ts` | Ops | Yes — rotate, restrict and set the value. |
| M-6 | If reading the customer profile fails at "Confirm & Continue", the code reads `is_phone_verified` of `undefined`. | A red notice "Cannot read properties of undefined (reading 'is_phone_verified')" in English, and the phone panel opens for a shopper who may be verified. | `components/Cart/OrderButton.tsx:190-193, 222-232` | Frontend | No |
| M-7 | The payment frame accepts a `close-iframe` message from **any** window; it does not check the sender's origin. Also `openPayIframe` is never set back to `false`, so a second try with the same URL does not open the frame. | Rare: the frame can close early; a retry can show no frame. | `components/Cart/ModalIframe.tsx:63, 92`; `store/Cart/reducer.ts:184-188` | Frontend | No |
| M-8 | Card and crypto have no proof of a real payment gateway. No browser test pays by card or crypto, and the frame shows success when orders exist even if nothing was paid (L-11). | Unknown until tested on staging. | `services/order.ts:96-104`, `components/Cart/ModalIframe.tsx:60-130` | Backend | Yes, if the backend offers `card` or `crypto` at launch. If not, the backend must leave them out of `available_payment_method`. |
| M-9 | On the success screen, "Order Invoice" and "My Account / My Orders" are plain text, not links. | The shopper cannot open the invoice or the orders from here. | `components/Cart/OrderSuccess.tsx:129, 202` | Frontend | No |

## 🔒 Must do before launch
- [ ] M-1: stop sending `order_note=order note` (send an empty note or a real one). Update the test at `orderClass.test.ts:116`.
- [x] M-3: make "policies" and "terms" open the real pages. (done 2026-10-20)
- [x] M-4: map pin tested on a real phone (done 2026-10-20).
- [ ] M-5: Ops rotates the Google Maps key, restricts it by domain, and sets `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel. (The key is out of the code since 2026-10-20; proof: `tests/utils/mapsConfig.test.ts` and the env case in `tests/components/Cart/MapElement.test.tsx`, seen red first.)
- [ ] M-8: confirm a real card and crypto gateway on staging, or have the backend hide both methods.

## ❓ Needs confirmation from the backend team
- Does `/customer/order/checkout/*` check that `address_id` belongs to this shopper, and that the bag is still available and correctly priced at that moment?
- Is `order_note` shown to sellers, couriers or on invoices? (M-1)
- Are `latitude` and `longitude` required for delivery? Today `null` is sent when the shopper sets no pin.
- Card and crypto: which provider is behind `/customer/order/checkout/card` and `/crypto`? Does its page allow being shown in a frame, and does it post `close-iframe` when done? Are orders created **before** payment? What does `getOrdersByCartGroupID` answer for an unpaid order? (M-8, L-11)
- Which countries list `cash_on_delivery` in `available_payment_method`? Staging shows it only for `sy`.
- `/customer/approve-policies` is a `GET` that changes state. Does the checkout itself refuse an order when policies were not approved?
- RDB: after "paid", does the core backend empty the bag and keep `cart_group_id` readable, so the success screen can load the orders? (L-8)
- When a shopper saves the first address, does it become the default by itself?
- Does a refused set-default, update or delete answer with an error status, so the browser can trust `success`? (L-2, L-3)

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/components/Cart/OrderButton.test.tsx`, `OrdersPage.test.tsx`, `ShippingAddressContainer.test.tsx`, `AddressListContainer.test.tsx`, `AddAddressForm.test.tsx`, `SelectRegion.test.tsx`, `Map.test.tsx`, `MapElement.test.tsx`, `PaymentMethod.test.tsx`, `PlaceOrderButtons.test.tsx`, `PlaceOrderWidget.test.tsx`, `OrderSuccess.test.tsx`, `ModalIframe.test.tsx`, `RdbPaymentModal.test.tsx`, `RdbPaymentLockedSheet.test.tsx`
- `tests/services/orderClass.test.ts`, `tests/services/rdbPayment.test.ts`, `tests/services/walletReauthFlag.test.ts`, `tests/store/cartReducer.test.ts`, `tests/utils/orderFunnel.test.ts`, `tests/utils/mapsConfig.test.ts`

**Browser (Playwright):**
- `tests/e2e/shopper.live.spec.ts`: BUY-01 (cash on delivery order, then cancel), BUY-02 (no verified phone, no order), BUY-03 (address change re-prices; address edit), BUY-07 (coupon refused), ORD-01 (cash on delivery order to the account's address). These cases skip when the test account or the QA seed is missing. Cash on delivery cases need the `sy` country.
- `tests/e2e/profile.live.spec.ts`: PROF-07 (add and remove an address, from settings).
- `tests/e2e/checkout.scripted.spec.ts`: SCRIPT-14 (whole faked journey places an order), SCRIPT-15 (refused order), SCRIPT-16, SCRIPT-17 (unavailable lines), SCRIPT-18 (bag empties), SCRIPT-20 (token renewed mid-checkout), SCRIPT-21, SCRIPT-22 (coupons).

**Expected-failure markers:** none (no `it.fails`, no `test.fail`). `AddAddressForm.test.tsx` and `AddressListContainer.test.tsx` mention BUG-1, BUG-2 and BUG-3; these are green guards for bugs already fixed, not open bugs.

**Tests that expect the wrong behaviour today:** `orderClass.test.ts:116` (the "order note" text, M-1).

**Important cases with NO test:**
- RDB payment on the live site: unit tests only. No browser test pays by RDB.
- Card and crypto against a real gateway: no test at all.
- The map pin in a real browser: no automated test. It was checked by hand on a real phone on 2026-10-20.
- Checkout opened by a guest who then signs in with the code, ending in a placed order: BUY-02 checks the stop only, not the order after the code.
- Policies and terms content: no test (there is no link to test).
