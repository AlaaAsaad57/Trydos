# CO-18 — Cancel a Single Item

| | |
|---|---|
| **Feature ID** | CO-18 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟡 Partial  -- same as CO-17|
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderItemOptions.tsx`, `components/setting/orders/CancelOrderItemWrapper.tsx`, `components/Orders/ChangeOrderItem.tsx`, `components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **cancel one product within an order** — either the whole item, or just **reduce its
quantity** — before it ships.

## Where it appears

On the order detail page (CO-16), from the **per-item options sheet**: **"Cancel This Product"** (full
cancel) and, under **"Change Product Request" → Change Qty**, a quantity-reduction tab.

## Who uses it

Any shopper wanting to drop or reduce one line of an order.

## How it works (verified behaviour)

- **Full-item cancel.** The "Cancel This Product" row shows when the parent order is cancellable
  (`can_cancele_order`) and the item's quantity is above zero. A **reason must be selected** (hardcoded
  list) to enable the "Cancel Request" button; confirming cancels the **entire** item quantity.
- **Quantity reduction.** The "Change Qty" tab lets the shopper decrement the quantity (it **cannot
  exceed** the current quantity — an error shows otherwise); confirming cancels only the difference
  (`current − chosen`).
- **Both converge** on the same confirmation window and the same cancel-item endpoint, which sends the
  quantity to remove. An `ORDER_ITEM_CANCELLED` analytics event fires.

## Data source

| Item | Value |
|------|-------|
| Cancel item / reduce qty | `POST /customer/order/cancel-item` — body `{ order_id, detail_id, qty }` (`Order.CancelOrderItem`) |
| Eligibility | `parentOrder.can_cancele_order && orderItem.qty > 0` |
| Backend | **Core backend** |

## Technical reference

| Item | Value |
|------|-------|
| Menu rows | `components/setting/orders/OrderItemOptions.tsx` (`canCancelProduct`) |
| Full-cancel reason picker | `components/setting/orders/CancelOrderItemWrapper.tsx` (hardcoded reasons) |
| Qty-reduce widget | `components/Orders/ChangeOrderItem.tsx` (`ChangeQtyWidget`, clamps to current qty) |
| Confirmation | `components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx` |
| Service | `services/order.ts` — `CancelOrderItem` (`CANCEL_ORDER_ITEM`, code 63; maps `item_id` → `detail_id`) |
| Store | None — local state; refreshes via `getOrderDetails()` |
| Analytics | `ORDER_ITEM_CANCELLED` |

## Current status & maturity

**Live.** Both full-item cancel and partial quantity reduction work against the backend, with correct
quantity math.

## Known gaps / notes

- ⚠️ **The cancel reason is never sent to the backend** — like CO-17, reasons only gate the button and
  feed analytics; the confirmation window doesn't even receive them.


## Related features

CO-17 (Cancel whole order — the order-level counterpart) · CO-20 (Change item variant — shares the
"Change Product Request" screen) · CO-16 (Order details — hosts the menu) · CO-26 (Create a return —
the post-delivery counterpart).
