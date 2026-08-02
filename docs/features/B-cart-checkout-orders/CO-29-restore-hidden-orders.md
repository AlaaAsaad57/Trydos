# CO-29 — Restore Hidden Orders / Products

| | |
|---|---|
| **Feature ID** | CO-29 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrdersView.tsx`, `components/setting/orders/OrdersOptionsMenu.tsx`, `components/setting/orders/HiddenOrdersWidget.tsx`, `components/Orders/HiddenOrderItem.tsx`, `services/orders.ts`, `services/order.ts` |

---

## What it is

The **un-hide counterpart to [CO-22](CO-22-hide-order-item.md)**. CO-22 let a shopper hide a whole
order pack or a single product, but that was a one-way door — there was no way to bring them back.
CO-29 adds a **Hidden Orders** view where every hidden pack and every hidden product can be restored
to the visible history.

## Where it appears

On the customer **Order history** screen (CO-15). The back bar now shows a **three-dots (⋮)** button
that opens a small bottom sheet with one action, **"Hidden Orders."** Choosing it swaps the list —
in place, **same URL, no navigation** — for the Hidden Orders view. The Hidden Orders back arrow
returns to the normal list the same way.

## Who uses it

Any shopper who hid an order or product (CO-22) and wants it back.

## How it works (verified behaviour)

- **Same-URL swap.** `OrdersView` holds a `list | hidden` toggle. The ⋮ sheet flips it to `hidden`;
  the Hidden view's back arrow flips it to `list`. No route change, so the browser URL stays
  `/settings/orders`.
- **One fetch, no pagination.** `getHiddenOrders` returns a **flat** `data: OrderInterface[]` (unlike
  `/order/list`, which is a paginated `{ orders, total }` envelope), so the view loads it in a single
  request — there is no infinite scroll.
- **Two levels, driven by `is_hidden` flags.** The response carries `is_hidden` on each order and each
  detail:
  - **Fully-hidden pack** (`order.is_hidden === true`) → the card is rendered at 40 % opacity with a
    single central **eye**; restoring un-hides the whole pack.
  - **Otherwise-visible pack with hidden products** → the card looks completely normal, but each
    hidden product tile is dimmed with its own **eye**; restoring un-hides just that product.
- **Cards look identical to the real order card.** `HiddenOrderItem` reuses the exact sub-components
  of the live card (`OrderItemTime` / `OrderItemId` / `OrderStatus` / `OrderInvoice` / the product
  slider). The only differences are the dimming, the eye affordances, and that the card is **not a
  link** (its only actions are restore).
- **Grouping.** Multiple packs sharing an `order_group_id` collapse into one card. Its eye restores
  every constituent pack; the card is treated as fully hidden only when **all** its packs are hidden.
- **Confirmation dialog.** Each eye opens a confirm modal ("Restore This Order" / "Restore This
  Product") before it runs. Not optimistic — the handler awaits the request, then refetches the
  hidden list, so a restored card leaves the view only once the server confirms.
- **Intro banner (once).** An Add-Address-style info banner explains the view. It is dismissible and,
  once dismissed, stays gone (persisted in `localStorage`).
- **Analytics:** `HIDDEN_ORDERS_OPENED`, `ORDER_RESTORED`, `ORDER_ITEM_RESTORED`.

## Data source

| Item | Value |
|------|-------|
| List hidden | `GET /customer/order/getHiddenOrders` → flat `data: OrderInterface[]` (`fetchHiddenOrders`) |
| Restore pack | `PATCH /customer/order/{order_id}/visibility` — `{ is_hidden: false }` (`HideOrder`, flag off) |
| Restore product | `PATCH /customer/order/detail/{detail_id}/visibility` — `{ is_hidden: false }` (`HideOrderDetail`, flag off) |
| Backend | **Core backend** |

## Technical reference

| Item | Value |
|------|-------|
| Screen container | `components/setting/orders/OrdersView.tsx` (list ⇄ hidden toggle, back bar) |
| ⋮ sheet | `components/setting/orders/OrdersOptionsMenu.tsx` |
| Hidden list | `components/setting/orders/HiddenOrdersWidget.tsx` (fetch, group, info banner, states) |
| Hidden card | `components/Orders/HiddenOrderItem.tsx` (order- & product-level restore + confirm) |
| Product tiles | `components/setting/orders/OrderProductSlider.tsx` (optional `hiddenDetailIds` / `onRestoreProduct`) |
| Services | `services/orders.ts` — `fetchHiddenOrders` (code 187); `services/order.ts` — `HideOrder` / `HideOrderDetail` accept `is_hidden` (default `true`) |
| Confirm | `components/global/ConfirmModal` |
| Analytics | `HIDDEN_ORDERS_OPENED` / `ORDER_RESTORED` / `ORDER_ITEM_RESTORED` (`utils/orderFunnel.ts`) |

## Current status & maturity

**Live.** Restore works at both pack and product level, with a confirm step, a suggest-once intro
banner, and a same-URL back-and-forth that never leaves the orders route.

## Known gaps / notes

- **Depends on backend `is_hidden` flags.** The two-level UI relies on `getHiddenOrders` returning
  `is_hidden` on each order and each detail. Without those flags the view can still list and
  restore, but it cannot distinguish a fully-hidden pack from a pack that merely contains a hidden
  product, nor mark which tile is the hidden one — so those flags are the contract this feature is
  built against.

## Related features

CO-22 (Hide order / item — the action this reverses) · CO-15 (Order history — hosts the ⋮ entry
point) · CO-16 (Order details — the other place hiding happens).
