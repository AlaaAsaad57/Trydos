# SL-07 — Orders & Fulfillment

| | |
|---|---|
| **Feature ID** | SL-07 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — item-level confirm / pack / cancel work; whole-order status change is disabled (commented out) and payments/shipping/tracking aren't built |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/orders.tsx`, `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Orders** tab of the seller dashboard — where a shop sees the orders it has received and moves
each item through fulfilment: confirm & start packing, mark packed, or cancel (in whole or by
quantity). Orders can be filtered by status.

## Where it appears

- Inside the seller dashboard → **Orders** tab.

## Who uses it

**Sellers / shop staff** who hold any one of the shop's order permissions (see gating note).

## How it works (verified behaviour)

- **Order list.** Received orders load as cards and page in via infinite scroll (Intersection
  Observer), driven by the backend's `has_more_pages`. Push topics (`shop_<id>_order`,
  `shop_<id>_order_detail`) trigger a refresh when new activity arrives.
- **Status filter tabs:** All · In Progress (`in_progress`) · Collected (`collected`) · Returned
  (`returned`) · Cancelled (`canceled`).
- **Per-item fulfilment actions** (on the order detail screen), driven by each item's state:
  - Not yet confirmed → **"Confirm & Start Packing"** or **"Cancel"**.
  - Confirmed, not packed → **"Packed"**.
  - Packed → a static **"Ready To Collect"** label (no further action).
  - All actions disable once the order is cancelled or the item quantity is 0.
- **Cancel** sends the item's detail ID, order ID and quantity, and locally reduces/removes that
  quantity.

## Data source

| Item | Value |
|------|-------|
| Orders list | `getSellerOrders(sellerId, page, status)` → **GET `/shop/orders`** (`?page=&status=`) |
| Confirm item | `confirmOrderDetailStatus` → **PUT `/shop/orders/details/status/confirmed`** |
| Pack item | `packOrderDetailStatus` → **PUT `/shop/orders/details/status/packed`** |
| Cancel item | `cancelOrderDetail` → **PUT `/api/v1/shop/orders/details/cancel`** (note the inconsistent `/api/v1` prefix) |
| Change whole-order status | `updateOrderStatus` → **PATCH `/shop/orders/status`** — *service exists but its UI trigger is commented out* |

All on the `market-dashboard` backend, shop-scoped by seller ID.

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/orders.tsx` (`RenderOrders`, `OrderListScreen`, `OrderDetailScreen`) |
| Store | Zustand `sellerOrders` slice (`useAppStore`) + `shouldUpdateOrders` trigger |
| Permission gate | `canViewOrders` = **any** of the 11 `PERMISSION_GROUPS.ORDERS` permissions (or `SUPER_ADMIN`) |

## Current status & maturity

Under active development. The everyday fulfilment loop — **confirm → pack → cancel** at the item
level — works and is backend-driven. Several capabilities implied by the order permission set are
**not operational**: whole-order status change is coded but its UI is commented out, and there is no
UI or service for payments, refunds, shipping assignment, or tracking.

## Known gaps / notes

- **Whole-order status change is disabled.** The service (`updateOrderStatus`), handler and the
  status dropdown all exist, but the UI block is **commented out**, so `CHANGE_ORDER_STATUS` drives
  nothing visible.
- **Defined-but-unbuilt permissions.** `READ_ORDER_PAYMENTS`, `CONFIRM_ORDER_PAYMENT`,
  `REFUND_ORDER_PAYMENT`, `ASSIGN_SHIPPING`, `UPDATE_TRACKING`, `UPDATE_ORDER_INFO`,
  `CHANGE_ORDER_STATUS_PACKAGED/CANCELED` exist in the permission set but have **no UI and no
  service** — pure placeholders.
- **No per-permission gating.** All 11 order permissions collapse to a single "has any" check, so a
  user with only `READ_ORDERS` still sees the Confirm/Pack/Cancel buttons (backend re-enforcement is
  out of scope of these files).
- Minor: `cancelOrderDetail` uses a `/api/v1/...` path where its siblings use `/shop/...`; the FCM
  topic unsubscribe on cleanup is commented out; and `page.tsx` declares order state
  (`sellerOrders`, `selectedOrderStatuses`, `orderActionLoading`) that is never passed to
  `RenderOrders` (dead duplicates).

## Related features

CO-15…CO-16 (the shopper's order history & tracking) · SL-03 (Product management) · SL-13 (Team /
user management).
