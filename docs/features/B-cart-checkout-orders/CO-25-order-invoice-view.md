# CO-25 — Order Invoice View

| | |
|---|---|
| **Feature ID** | CO-25 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live|
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderInvoice.tsx`, `components/settings/cards/OrderInvoiceCard.tsx`, `components/setting/orders/OrderDetailsWrapper.tsx` |

---

## What it is

The **history-reached invoice** — the invoice summary a shopper sees on a placed order (item count,
grand total, payment method, and a per-item price breakdown). It is distinct from the post-checkout
"order placed" invoice (CO-14); this one is reached later, from Order History.

## Where it appears

- As a **compact invoice line on each order card** in Order History (CO-15) — item count + total.
- As an **"Order Invoice" card** on the order detail page (CO-16), plus a fuller per-item breakdown in
  the expanded order view.

There is **no standalone invoice route or modal** — the invoice is always part of the order card /
detail screen.

## Who uses it

Any signed-in shopper reviewing what an order cost.

## How it works (verified behaviour)

- **List-card summary** shows the **item count** (`details.length`) and the **grand total**
  (`order_amount`) with the currency symbol.
- **Detail invoice card** shows the label *"Order Invoice"*, the **total amount**, and a
  **payment-method icon** driven by `payment_method` (cash-on-delivery → wallet icon, trydos-wallet →
  wallet icon, crypto → crypto icon; anything else → **no icon**).
- **Expanded breakdown** lists each product with its struck-through price, bold offer price, currency,
  colour/size, pieces and quantity, per-item status, a returned-quantity badge, and a *"Back to your
  wallet"* refund badge for cancelled items (unless the order was cash-on-delivery).
- **No separate invoice fetch** — every figure comes from the same order payload used by the details
  page (CO-16); the list-card figures come from the order-list call (CO-15).

## Data source

| Item | Value |
|------|-------|
| Detail invoice figures | Same order payload as CO-16 — `GET /customer/order/getOrdersByOrderGroupID?order_group_id=…` |
| List-card figures | Order-list payload — `GET /customer/order/list` (CO-15) |
| Currency | From the store (`currency.symbol`, `currency.exchange_rate`) |
| Backend | **Core backend** |

## Technical reference

| Item | Value |
|------|-------|
| List-card summary | `components/setting/orders/OrderInvoice.tsx` (count + `order_amount`) |
| Detail invoice card | `components/settings/cards/OrderInvoiceCard.tsx` (total + `PaymentsIcon`) |
| Expanded breakdown | `OrderExpandedDetails` / `ProductCard` in `components/setting/orders/OrderDetailsWrapper.tsx` |
| Payment mapping | `cash_on_delivery` / `trydos_wallet` → wallet · `crypto` → crypto · else → none |
| Store | `currency` (symbol + exchange rate); amounts held in local order data |

## Current status & maturity

**Partial.** It renders the essentials — items, total and payment method — and works, but it is a
**summary rather than a true itemized invoice**, and a currency-conversion inconsistency means the
displayed total isn't always computed the same way.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-14 (Order confirmation & invoice — the post-checkout version) · CO-16 (Order details — hosts this)
· CO-15 (Order history — shows the compact summary) · CO-06 (Coupon — applied at checkout but not
broken out here) · CO-13 (Pay with wallet — reflected by the payment icon).
