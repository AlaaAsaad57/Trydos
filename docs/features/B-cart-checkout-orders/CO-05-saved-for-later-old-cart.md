# CO-05 — Saved-for-Later ("Out Of Bag")

| | |
|---|---|
| **Feature ID** | CO-05 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟡 Partial — items save & hide, but the "add again" affordance is a dead placeholder |
| **Last verified** | 2026-07-04 (against `develop`) |
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
- **Getting an item back into the bag is NOT a one-tap action here.** The card shows a *"Time
  Running Out. -30:00 | Add Again?"* label, but that text is a **hardcoded static string with no
  countdown and no click handler** — tapping the card just navigates to the product page. To
  actually re-add, the shopper opens the product and adds it again (CO-01); once re-added, the item
  disappears from the Out-Of-Bag list.

## Data source

| Item | Value |
|------|-------|
| Move to Out-Of-Bag | `POST /cart/convert_to_old` — `{ key: cartItemId }` (`cartService.ConvertToOldCart`) |
| Load list | `GET /old-cart/get_old_cart` — `getOldCart()` (sorted newest first) |
| Hide / Hide All | `POST /old-cart/hide` — `{ id }` (or empty to clear all) — `home.hideOldCart` |
| Backend | `/old-cart/get_old_cart` & `/old-cart/hide` → **Go backend**; `/cart/convert_to_old` → **legacy backend** (not on the Go allow-list) |

## Technical reference

| Item | Value |
|------|-------|
| Out-Of-Bag list | `components/Cart/OldCartContainer.tsx` (header "Out Of Bag!") |
| "Reschedule" action | `ConvertToOldCart` in `components/Cart/index.tsx` (`QuantutyInput`) |
| Service (move) | `services/cart.ts` — `ConvertToOldCart` |
| Service (hide) | `services/home.ts` — `hideOldCart` |
| Store | `store/Cart/reducer.ts` — `storeOldCart`, `hideOldCart` |
| Dedup vs. active cart | `areProductsEqual` (`utils/functions.tsx`) |
| Request codes | `utils/Requests.ts` — `CONVERT_TO_OLD_CART` (89), `OLD_CART_REQUEST` (27), `HIDE_OLD_CART` (74) |

## Current status & maturity

**Partial.** The core of a saved-for-later list works — items can be moved aside, they persist
server-side, they de-duplicate against the active cart, and they can be hidden individually or all
at once. But the **re-add ("Add Again?") affordance is not built**: the visible button is a static
label with a fake `-30:00` timer and no handler, so bringing an item back requires re-navigating to
the product page and adding it fresh.

## Known gaps / notes

- ⚠️ **"Add Again?" is a dead placeholder.** The `-30:00` countdown and "Add Again?" text are
  **hardcoded strings** with no live timer and no re-add handler. Either wire up a real one-tap
  re-add (and a real timer, if intended) or remove the misleading label.(need decision)


- **Dead code:** `ConvertToOldCart` builds an unused URL-encoded body and returns nothing; the
  store is updated by the caller instead.

## Related features

CO-03 (Cart drawer — hosts the Out-Of-Bag list) · CO-04 (Update / remove — the "Reschedule" button
sits alongside the stepper) · CO-01 (Add to cart — the current way to bring an item back) · SD-31
(Wishlist — the true "save for later across the app", distinct from this in-cart list).
