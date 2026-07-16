# CO-16 — Order Details & Tracking

| | |
|---|---|
| **Feature ID** | CO-16 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/settings/orders/[id]/page.tsx`, `components/setting/orders/OrderDetailsWrapper.tsx`, `components/settings/cards/OrderStatusCartsIcon.tsx`, `services/order.ts` |

---

## What it is

The **single-order screen** — the items in an order, its delivery-status progress, expected delivery
date, invoice summary, and the hub from which every order action (cancel, change, report, hide, rate,
return, chat) is launched.

## Where it appears

At **`/{country-language}/settings/orders/{order_group_id}`**, optionally with `?order_id=…` (to
pre-select a pack) and `?order_chat_id=…` (to auto-open the delivery chat). Reached by tapping any
card in Order History (CO-15) or from an order notification.

## Who uses it

Any signed-in shopper viewing one of their orders.

## How it works (verified behaviour)

- **Multi-pack orders.** An order group can contain several **packs**; pack-selector tabs switch
  between them (defaulting to the pack in `order_id`, else the first).
- **Delivery-status progress.** The "tracking" is a **4-step progress indicator** — *Pending →
  Preparing → Shipped → Delivered* — that buckets the backend's ~19 fine-grained statuses into those
  four nodes and highlights the current one. Cancelled / failed orders show a cancel icon instead of
  steps. (It is a **status progression, not a timestamped event log** — see gaps.)
- **Expected delivery date** is computed **client-side** from the items' shipping days plus a
  settings-driven shipping duration, added to the order date; hidden for cancelled orders.
- **Per-item detail.** Each product shows its image, variant (colour/size), quantity, per-item status
  icon, price/offer price, and any returned-quantity badge.
- **Actions surface here.** Delivered orders show a rate/review affordance (CO-23); the options menus
  expose cancel/change/report/hide (CO-17–CO-22); returns (CO-26–CO-28) render inline; a delivery
  chat (CO-24) opens for `out_for_delivery` / `out_for_return`.
- **Not-found handling.** A failed fetch or an empty/foreign order id renders an *"Order Not Found"*
  state with a "Go to My Orders" button.

## Data source

| Item | Value |
|------|-------|
| Order details | `GET /customer/order/getOrdersByOrderGroupID?order_group_id={id}` (`Order.getOrderDetails`) |
| Ratings (if delivered) | `POST /api/products/comments/order_rating` (`server: "local"` → Elasticsearch) |
| Return details (if any) | `GET /customer/order/return_requests/order_details_by_group?order_group_id=…` |
| Delivery chat | `POST /api/v1/channels/orderChatParticipant/get-recipient` (`server: "chat"`) |
| Backend | Order + return reads → **legacy backend**; ratings → local route / Elasticsearch; chat → chat backend |

## Technical reference

| Item | Value |
|------|-------|
| Route (server) | `app/(client)/[lang]/settings/orders/[id]/page.tsx` |
| Main component | `components/setting/orders/OrderDetailsWrapper.tsx` (inline `OrderExpandedDetails`, `ProductCard`, `OrderNotFoundState`) |
| Progress steps | `components/settings/cards/OrderStatusCartsIcon.tsx` (buckets ~19 statuses into 4 nodes) |
| Expected delivery | `components/settings/cards/OrderExpectedDeliveryCard.tsx` (client-side date math) |
| Service | `services/order.ts` — `getOrderDetails` (`GETORDERBYORDERGROUPID_REQUEST`, code 27) |
| Store | No dedicated order slice — detail data is local state; store supplies `shouldUpdateOrders`, `currency`, `settings`, `user`, chat |

## Current status & maturity

**Live and stable.** The details screen loads real order data, renders the status progression and
expected date, and hosts every order action.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-15 (Order history — entry point) · CO-25 (Order invoice view — rendered here) · CO-17–CO-24 (all
launched from this screen) · CO-26–CO-28 (returns render inline here).
