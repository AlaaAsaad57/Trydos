# CO-20 — Change Item Variant

| | |
|---|---|
| **Feature ID** | CO-20 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderItemOptions.tsx`, `components/Orders/ChangeOrderItem.tsx`, `components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **swap the colour or size of an item they already ordered** (before it's delivered),
choosing from the product's in-stock variants.

## Where it appears

On the order detail page (CO-16), from the **per-item options sheet** — **"Change Product Request"**,
which opens tabs for **Change Color**, **Change Size** and Change Qty (Change Qty routes to the
cancel-item flow, CO-18).

## Who uses it

Any shopper who ordered the wrong colour/size and wants to correct it in flight.

## How it works (verified behaviour)

- **Eligibility.** The "Change Product Request" row hides if the item is already `delivered`, if the
  parent order's `can_change_variant` flag is false, or if the item quantity is zero.
- **Live variant data.** The screen fetches the product's current variations, colours, sizes and
  stock; options that lack stock for the ordered quantity are **disabled**.
- **Confirm.** Picking a new colour/size and confirming (agreement checkbox + an actual change
  required) sends the swap and refreshes the order; an `ORDER_ITEM_CHANGE_REQUESTED` analytics event
  fires.
- **What the swap sends:** the chosen `color`, `size`, the item's `order_detail_id`, and the new
  image filename. The backend identifies the target variant from `order_detail_id` + colour/size.

## Data source

| Item | Value |
|------|-------|
| Change variant | `POST /customer/order/change-item-variant` — body `{ color, size, order_detail_id, image }` (`changeOrderItemVariant`) |
| Live variant/stock | `GET /web/product/qtyPriceDetails/{slug}` + `GET /web/product/globalDetails/{slug}` |
| Eligibility | `!delivered && can_change_variant && qty > 0` |
| Backend | **Core backend** |

## Technical reference

| Item | Value |
|------|-------|
| Menu row | `components/setting/orders/OrderItemOptions.tsx` (`ShouldShowCahngeColor`) |
| Change screen | `components/Orders/ChangeOrderItem.tsx` (Color / Size / Qty tabs) |
| Confirmation | `components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.tsx` (`ModifyOrderItemModal`) |
| Service | `services/order.ts` — `changeOrderItemVariant` (`CHANGE_ORDER_VARIANT`, code 122) |
| Store | None — local state; refreshes via `getOrderDetails()` |
| Analytics | `ORDER_ITEM_CHANGE_REQUESTED` |

## Current status & maturity

**Live.** Colour/size swaps work against the backend, with real stock gating on the options. The
confirm copy now correctly describes a colour/size change, and the dead `product_variant_id` payload
has been removed.

## Known gaps / notes

- **Dead link.** The "Change Color/Size Terms" link is a placeholder `href="#"` (tracked in the
  README known-issues list).

## Related features

CO-18 (Cancel a single item — shares the "Change Product Request" screen via the Change Qty tab) ·
SD-21 (Colour / variant selection at browse time) · CO-16 (Order details — hosts the menu) · CO-19
(Change delivery address — the other in-flight order change).
