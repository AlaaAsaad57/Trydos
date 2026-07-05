# CO-14 — Order Confirmation & Invoice

| | |
|---|---|
| **Feature ID** | CO-14 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/OrderSuccess.tsx`, `components/Cart/PlaceOrderWidget.tsx`, `components/Cart/PlaceOrderButtons.tsx`, `store/Cart/reducer.ts` |

---

## What it is

The **"order placed" success screen** shown immediately after checkout — a confirmation with the
order number and an **invoice summary** of what was bought, where it ships, and how it was paid.

## Where it appears

Inline inside the checkout slide-over right after a successful order — **not a separate URL/page**.
(The later, history-reached invoice view is a different feature, CO-25.)

## Who uses it

Any shopper who has just completed checkout.

## How it works (verified behaviour)

- **Success banner:** a success icon, *"The Purchase Was Completed Successfully"*, **"Your Order
  Number"** with the order-group id, and an "Order Invoice" heading. An informational note tells the
  shopper they can track the order under **My Account → My Orders** (text only — not a button/link).
- **Invoice summary** below the banner:
  - **Shopping bag** — items with images, quantities and colour/size, taken from the checkout
    response (falling back to the cart).
  - **Address** — the default delivery address, region, phone and contact name.
  - **Payment** — the method(s) used (COD / wallet / card / crypto) plus a **discount-coupon line**
    when a coupon was applied.
- **Single action:** a **"Done / Back To HomePage"** button that clears the order state, **empties
  the cart**, and returns to the home page. There is no "view order" button — tracking is via the
  informational note.
- **Where the data comes from:** the order details are held in the store from the checkout response
  (standard flow) or set after the wallet order converts (wallet flow) — the success screen does
  **not** re-fetch by order id.
- **Analytics fired here:** a GA `screen_view`, the GA **`purchase`** event (transaction id = order
  group, value, shipping, currency, coupon, items), a `coupon_used` event when a coupon was applied,
  and the `ORDER_COMPLETED` funnel step.

## Data source

| Item | Value |
|------|-------|
| Order data | From the checkout response held in `orderData.data` (standard) or after wallet conversion — **no id-based re-fetch** |
| Wallet path | Polls `GET /customer/order/getOrdersByCartGroupID` until converted, then sets success |
| Store | `store/Cart/reducer.ts` — `orderData` (`data`, `payment`, `coupon`, `success`), `currency`, `total_shipping_cost`, `addressLists`, `cart` |
| Backend | Order lookup (wallet path) → legacy backend |

## Technical reference

| Item | Value |
|------|-------|
| Success banner | `components/Cart/OrderSuccess.tsx` (fires GA `purchase` in a `success`-gated effect) |
| Invoice body | `components/Cart/PlaceOrderWidget.tsx` (`OrderCartItem`, `AddressOrder`, `PaymentOrder`) |
| Done button | `components/Cart/PlaceOrderButtons.tsx` (links to `/{lang}`, clears cart + orderData) |
| Payment ids | 0 = COD · 1 = Wallet · 2 = Card · 3 = Crypto |
| Analytics | GA `purchase` / `order_success_screen` / `coupon_used`; funnel `ORDER_COMPLETED` |

## Current status & maturity

**Live and stable.** The confirmation and invoice render correctly for COD, card, crypto and wallet
orders, and the purchase analytics fire here.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-11 (Place order — produces this screen) · CO-13 (Wallet payment — its own path to this screen) ·
CO-06 (Coupon — shown on the invoice) · CO-25 (Order invoice view — the later, history-reached
version) · CO-16 (Order details & tracking — where the note points).
