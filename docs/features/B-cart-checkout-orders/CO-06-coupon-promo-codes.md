# CO-06 — Coupon & Promo Codes

| | |
|---|---|
| **Feature ID** | CO-06 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/couponElement.tsx`, `components/Cart/PaymentMethod.tsx`, `components/Cart/PlaceOrderWidget.tsx`, `store/Cart/reducer.ts` |

---

## What it is

The **discount-code entry** — a collapsible "I Have a Discount Coupon" field at checkout where a
shopper types a promo code, which is validated by the backend and, if valid, applied as a discount
to the order total.

## Where it appears

At **checkout**, inside the order widgets — specifically the **payment-method step** and the
**place-order widget** (both panes of the cart slide-over, CO-03 → CO-07+). It's collapsed by
default behind an "I Have a Discount Coupon" row.

## Who uses it

Any shopper with a promo code, at the point of paying.

## How it works (verified behaviour)

- **Enter and apply.** The shopper expands the row, types a code into "Coupon No", and taps
  **Apply**.
- **Backend validates it.** The code is sent to the backend; if the response says it's invalid, an
  inline **red error message** (the backend's message) appears under the field.
- **On success**, the cart is **re-fetched and the totals rebuilt** (subtotal / total / discount
  come from the server, not computed locally), and the Apply button shows the discount amount, e.g.
  `- 5.00 {currency}`. The discount line then shows in the order summary.
- **One coupon at a time.** Once a coupon is applied, the input is hidden and re-applying is blocked
  — there's no in-widget "remove / change coupon" button (clearing happens via the outer checkout
  reset flow).
- **Auto-apply.** If a coupon code was previously stashed in the browser (`coupon-number`), it's
  auto-filled and auto-applied on mount; the stored key is then cleared.
- **Analytics:** `COUPON_APPLY_ATTEMPT`, `COUPON_APPLY_SUCCEEDED` (with discount value), and
  `COUPON_APPLY_FAILED` are tracked.

## Data source

| Item | Value |
|------|-------|
| Apply coupon | `GET /coupon/apply?code={code}` — via `fetchData` (`reqTitle: APPLY_COUPON_REQUEST`) |
| Validity | `response.success` + `response.data.status` (truthy = valid) |
| Discount value | `response.data.discount` → stored as `coupon` / drives `coupon_discount` |
| Totals after apply | Refreshed by a follow-up `getCart()` → `initCart()` (server-computed) |
| Backend | **Core backend** — `/coupon/apply` is **not** on the gateway allow-list, so guests and verified shoppers alike are served by the core backend |

## Technical reference

| Item | Value |
|------|-------|
| Coupon field | `components/Cart/couponElement.tsx` (`CouponElement`, `applyCoupon`) |
| Mount points | `components/Cart/PaymentMethod.tsx`, `components/Cart/PlaceOrderWidget.tsx` |
| Store | `store/Cart/reducer.ts` — `coupon_discount`, `orderData.coupon_number` / `orderData.coupon`, `setCouponDiscount`, `setOrderData`, `initCart` |
| Summary line | `coupon_discount` rendered in `PlaceOrderWidget.tsx` |
| Analytics | `COUPON_APPLY_ATTEMPT` / `COUPON_APPLY_SUCCEEDED` / `COUPON_APPLY_FAILED` |
| Persistence | `localStorage["coupon-number"]` (auto-apply on mount, cleared after) |

## Current status & maturity

**Live and stable.** Validation and the discount amount are fully backend-driven — no hardcoded or
placeholder coupon values. Valid codes apply and reflect in the order total; invalid codes show the
backend's error inline.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-03 (Cart drawer) · CO-10 / CO-11 (Payment method selection / Place order — where the field
lives) · CO-14 (Order confirmation & invoice — where the applied discount shows) · SD-33 (Redeem /
"luck" rewards — a separate product-level discount mechanism).
