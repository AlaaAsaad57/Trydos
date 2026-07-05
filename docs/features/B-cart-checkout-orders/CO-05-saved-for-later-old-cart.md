# CO-05 — Saved-for-Later ("Out Of Bag")

| | |
|---|---|
| **Feature ID** | CO-05 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-05 (against `develop`) |
| **Source of truth** | `components/Cart/OldCartContainer.tsx`, `components/Cart/index.tsx`, `services/cart.ts`, `services/home.ts`, `store/Cart/reducer.ts` |

---

## What it is

A **secondary "Out Of Bag" list** shown below the main cart, holding items a shopper has set aside
from the active bag but hasn't removed for good. It's the app's version of "saved for later" — the
items are kept server-side so they persist between sessions.

## Where it appears

At the **bottom of the cart drawer** (CO-03), under a **"Out Of Bag!"** header. Items get there via
a **"Reschedule"** button on each active cart line (next to the quantity stepper).

## Who uses it

Any shopper who wants to park an item without losing it — e.g. deciding on it later.

## How it works (verified behaviour)

- **Moving an item aside.** The "Reschedule" button on an active cart line sends the item to the
  Out-Of-Bag list, removes it from the active bag, and refreshes the list.
- **The list is server-persisted** and loads on open, newest first. Any Out-Of-Bag entry that's
  **already back in the active cart is hidden** from the list (matched by product + size/colour), so
  the two lists don't show duplicates.
- **Items render greyed out** (dimmed image) with a **read-only** quantity control — you can't edit
  quantity from here.
- **Removing.** Each item has a **"Hide"** action; there's also a **"Hide All"** to clear the whole
  Out-Of-Bag list. Both are optimistic and confirmed with the server.
- **One-tap "Add Again".** Each card shows a live *"Time Running Out. -MM:SS | Add Again?"* label
  whose countdown is derived from the item's `created_at` over a **30-minute window**. While the
  window is open the counter ticks down each second; once it elapses the counter is hidden but
  **"Add Again?" stays clickable**. Tapping "Add Again?" re-adds the item to the active cart
  (`/cart/add`) and refreshes both the cart and the Out-Of-Bag list — so the re-added item then
  disappears from Out-Of-Bag (it's now in the active cart). The tap is isolated from the card's
  product link, so it re-adds rather than navigating.

## Data source

| Item | Value |
|------|-------|
| Move to Out-Of-Bag | `POST /cart/convert_to_old` — `{ key: cartItemId }` (`cartService.ConvertToOldCart`) |
| Load list | `GET /old-cart/get_old_cart` — `getOldCart()` (sorted newest first, by `created_at`) |
| Add Again (re-add) | `POST /cart/add` (`cartService.AddToCart`), then `getCart()` + `getOldCart()` refresh |
| Hide / Hide All | `POST /old-cart/hide` — `{ id }` (or empty to clear all) — `home.hideOldCart` |
| Backend | `/old-cart/get_old_cart` & `/old-cart/hide` → **Go backend**; `/cart/convert_to_old` → **legacy backend** (not on the Go allow-list) |

## Technical reference

| Item | Value |
|------|-------|
| Out-Of-Bag list | `components/Cart/OldCartContainer.tsx` (header "Out Of Bag!") |
| Countdown + re-add label | `OldCartAddAgainLabel` in `components/Cart/OldCartContainer.tsx` (30-min window from `created_at`) |
| Add-Again handler | `handleAddAgain` in `components/Cart/OldCartContainer.tsx` → `cartService.AddToCart` |
| "Reschedule" action | `ConvertToOldCart` in `components/Cart/index.tsx` (`QuantutyInput`) |
| Service (move) | `services/cart.ts` — `ConvertToOldCart` |
| Service (re-add) | `services/cart.ts` — `AddToCart` |
| Service (hide) | `services/home.ts` — `hideOldCart` |
| Store | `store/Cart/reducer.ts` — `storeOldCart`, `hideOldCart`, `initCart` |
| Dedup vs. active cart | `areProductsEqual` (`utils/functions.tsx`) |
| Analytics | `old_cart_item_re_added` (`ORDER_EVENTS`, `utils/orderFunnel.ts`; see `docs/posthog-events.md`) |
| Request codes | `utils/Requests.ts` — `CONVERT_TO_OLD_CART` (89), `OLD_CART_REQUEST` (27), `HIDE_OLD_CART` (74) |

## Current status & maturity

**Live.** The full saved-for-later loop works — items can be moved aside, they persist server-side,
they de-duplicate against the active cart, they can be hidden individually or all at once, and the
**"Add Again?" affordance is now real**: a live 30-minute countdown derived from `created_at`, after
which the counter hides while "Add Again?" stays a one-tap re-add that adds the item back and
refreshes both lists.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-03 (Cart drawer — hosts the Out-Of-Bag list) · CO-04 (Update / remove — the "Reschedule" button
sits alongside the stepper) · CO-01 (Add to cart — the current way to bring an item back) · SD-31
(Wishlist — the true "save for later across the app", distinct from this in-cart list).
