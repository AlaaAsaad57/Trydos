# CO-11 — Place Order / Checkout

| | |
|---|---|
| **Feature ID** | CO-11 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/PlaceOrderButtons.tsx`, `components/Cart/OrdersPage.tsx`, `components/Cart/PlaceOrderWidget.tsx`, `services/order.ts` |

---

## What it is

The **final "Place Order" action** — the shopper agrees to the policies and submits the order, which
sends it to the backend for payment/fulfilment and shows the success screen (CO-14).

## Where it appears

At the bottom of the checkout review screen (the place-order pane of the cart slide-over), as the
**"Place Order"** button with a policies/terms agreement checkbox.

## Who uses it

Any shopper completing a purchase.

## How it works (verified behaviour)

- **Pre-submit validation.** The shopper must tick the **policies agreement** (which also records
  consent server-side). On submit, the cart is **re-fetched and re-validated**: it blocks if the
  phone is unverified (CO-09), if the cart is empty, or if any item is unavailable / country-
  restricted / inactive. An earlier gate also requires a default address and a selected payment
  method before reaching this screen.
- **What's submitted.** The checkout POST carries the **default address id**, the **payment method**
  (as a path segment), and a `pay_by_wallet` flag. Items and any applied coupon are **not** re-sent —
  the backend derives them from the shopper's cart group.
- **Success is an in-place overlay, not a redirect.** On success the store flips `orderData.success`
  and the **order-placed screen renders inline** (CO-14) showing the order number; it fires the GA
  `purchase` event and the order-completed funnel. The "Done" button links back to the home page and
  clears the cart.
- **Card/crypto branch.** If the checkout response returns a hosted-payment `url`, the flow instead
  opens the external gateway (CO-12) rather than showing success immediately.
- **Wallet branch.** Wallet payments (method id 1) are handled by a separate wallet modal (CO-13),
  not this checkout POST.

## Data source

| Item | Value |
|------|-------|
| Place order | `POST /customer/order/checkout/{payment_method}?order_note=…&address_id=…&pay_by_wallet=…` — `order.PlaceOrder` |
| Policies consent | `POST /customer/approve-policies` — `setAgree` |
| Re-validate cart | `GET /cart/cart_shipping` — `getCart` |
| Backend | Checkout & policies → **core backend** (not on the gateway allow-list). The cart read follows the market routing rule: gateway for guests, core backend for verified shoppers |

## Technical reference

| Item | Value |
|------|-------|
| Button / agree / validate | `components/Cart/PlaceOrderButtons.tsx` (`Validate`, `isValid`, `VerifyCart`) |
| Submit path | `OrdersPage.setOrderSuccess` → `services/order.ts` `PlaceOrder` |
| Review summary | `components/Cart/PlaceOrderWidget.tsx` |
| Store | `store/Cart/reducer.ts` — `orderData`, `setOrderSuccess`, `setOrderData`, `setOrderLoading` |
| Analytics | GA `purchase`, funnel `ORDER_COMPLETED` / `ORDER_PLACE_FAILED` |

## Current status & maturity

**Live and stable.** The submit path validates thoroughly (consent, phone, stock, address, payment)
and branches correctly to success, external gateway, or wallet.

## Known gaps / notes


- **Errors are swallowed** (logged, funnel event, no rethrow), so a failed placement stops quietly
  and returns to the first step.

## Related features

CO-09 (Mobile confirmation — a submit gate) · CO-10 (Payment method) · CO-12 (External gateway) ·
CO-13 (Pay with wallet) · CO-14 (Order confirmation & invoice) · CO-06 (Coupon — applied earlier to
the cart).
