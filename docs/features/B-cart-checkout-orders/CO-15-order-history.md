# CO-15 — Order History

| | |
|---|---|
| **Feature ID** | CO-15 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/settings/orders/page.tsx`, `components/setting/orders/OrdersListWrapper.tsx`, `components/Orders/OrderItem.tsx`, `services/orders.ts` |

---

## What it is

The shopper's **list of past and current orders** under Account settings — one card per order, with a
status-tab filter across the top and infinite scroll for older orders.

## Where it appears

At **`/{country-language}/settings/orders`**, reached from the settings home via the **"Orders"** link
card (which also shows the shopper's total order count). The link is **login-gated** — a signed-out
shopper is sent to the login modal instead.

## Who uses it

Any signed-in shopper reviewing their orders.

## How it works (verified behaviour)

- **Status tabs.** A hardcoded **"All"** tab (selected by default, sends no status filter) is followed
  by status tabs whose labels/values come from the **backend** starting-settings
  (`order_group_statuses`) — they are not hardcoded in the app.
- **Infinite scroll.** Orders load **10 per page** via an intersection-observer sentinel; the list
  keeps loading until the server returns fewer than a full page. Changing the tab (or a global refresh
  signal) resets to page 1.
- **Grouping.** Rows sharing the same `order_group_id` are merged into a single card (amounts summed,
  items flattened), and duplicates are de-duped across pages by `order_group_id`.
- **Each card** shows the order time, order id, status, a small **invoice summary** (item count +
  total — see CO-25) and a product-image slider; tapping it opens the order's detail page (CO-16).
- **Empty / end states:** *"No orders found for this status."* and *"No more orders."*
- **Analytics:** `ORDER_HISTORY_VIEWED` (first page per filter) and `ORDER_HISTORY_FILTERED` (on tab
  change).

## Data source

| Item | Value |
|------|-------|
| Order list | `GET /customer/order/list?offset={page}&limit={pageSize}[&order_group_status={status}]` (`services/orders.ts` → `fetchOrders`) |
| Status tabs | Server action `getOrderStatues` → `GET /web/home/startingSettings` (`order_group_statuses`) |
| Order count | `GET /customer/order/list` with `pageSize:1` (settings landing prefetch) → `store.totalOrders` |
| Backend | Order list → **core backend** (not on the gateway allow-list). The status list (`/web/home/startingSettings`) is allow-listed, so guests read it from the gateway and verified shoppers from the core backend |

## Technical reference

| Item | Value |
|------|-------|
| Route (server) | `app/(client)/[lang]/settings/orders/page.tsx` (fetches statuses, renders list) |
| List controller | `components/setting/orders/OrdersListWrapper.tsx` (`PAGE_LIMIT = 10`, tabs, grouping) |
| Order card | `components/Orders/OrderItem.tsx` (links to `/settings/orders/{order_group_id}`) |
| Link card | `components/setting/orders/index.tsx` (`OrdersLinkCard`, login-gated) |
| Store | `totalOrders` (`store/auth/reducer.tsx`); `shouldUpdateOrders` refresh signal (`store/Cart/reducer.ts`) — the order array itself is local state |
| Request code | `utils/Requests.ts` — order list (14) |

## Current status & maturity

**Live and stable.** Listing, status filtering, grouping and infinite scroll all work against the
live backend.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-16 (Order details & tracking — opened from a card) · CO-25 (Order invoice view — the per-card
summary) · CO-17..CO-24 (order actions reached from a card's detail page) · AC-17 (Account / settings
home — where the Orders link lives).
