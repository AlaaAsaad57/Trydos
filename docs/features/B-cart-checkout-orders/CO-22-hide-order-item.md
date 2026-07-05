# CO-22 — Hide Order / Item

| | |
|---|---|
| **Feature ID** | CO-22 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderItemOptions.tsx`, `components/setting/orders/OrderOptionsMenu.tsx`, `services/order.ts` |

---

## What it is

Lets a shopper **remove an order pack or a single item from their visible order history** — a tidy-up
action, distinct from cancelling.

## Where it appears

On the order detail page (CO-16): **"Hide This Product"** in the per-item options sheet, and **"Hide
This Pack"** in the order options menu.

## Who uses it

Any shopper who wants to declutter their order history.

## How it works (verified behaviour)

- **Two levels, two endpoints.** Hide a single item, or hide the whole pack — each hits its own
  visibility endpoint. Both are always available (no status gate).
- **Confirmation dialog.** Each action opens a delete-style confirm modal before it runs.
- **Not optimistic.** The handler awaits the request, then either navigates away or refetches — the
  item isn't removed locally until the server confirms.
- **Last-item special case.** Hiding the only remaining product empties the order; the confirm message
  warns that *"hiding it will hide the whole order,"* and the screen returns to the orders list.
  Hiding a pack always leaves the detail page for the list.
- **Analytics:** `ORDER_ITEM_HIDDEN` / `ORDER_PACK_HIDDEN`.

## Data source

| Item | Value |
|------|-------|
| Hide item | `PATCH /customer/order/detail/{detail_id}/visibility` — `{ is_hidden: true }` (`HideOrderDetail`) |
| Hide pack | `PATCH /customer/order/{order_id}/visibility` — `{ is_hidden: true }` (`HideOrder`) |
| Backend | **Legacy backend** |

## Technical reference

| Item | Value |
|------|-------|
| Item hide | `components/setting/orders/OrderItemOptions.tsx` (`handleHideProduct`) |
| Pack hide | `components/setting/orders/OrderOptionsMenu.tsx` (`handleHideOrder`) |
| Confirm | `components/global/ConfirmModal` (`type="Delete"`) |
| Services | `services/order.ts` — `HideOrderDetail` (code 185), `HideOrder` (code 184) — both **do** re-throw on error |
| Store | None for the mutation; navigation via `router.replace` |
| Analytics | `ORDER_ITEM_HIDDEN` / `ORDER_PACK_HIDDEN` |

## Current status & maturity

**Live.** Hiding at both item and pack level works, with a sensible last-item warning and proper
navigation.

## Known gaps / notes

- **Irreversible from the UI.** Both calls hardcode `{ is_hidden: true }` and there is **no un-hide /
  restore path anywhere** — a hidden order can't be brought back by the shopper.


## Related features

CO-15 (Order history — where hidden orders no longer appear) · CO-16 (Order details — hosts the
menus) · CO-17 / CO-18 (Cancel — a different, order-changing action) · CO-05 (Saved-for-later "Hide"
— a similarly named but cart-side action).
