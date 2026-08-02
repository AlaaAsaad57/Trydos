# CO-04 — Update / Remove Items

| | |
|---|---|
| **Feature ID** | CO-04 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/index.tsx` (`QuantutyInput`, `RemoveFromCartAction`), `services/cart.ts`, `store/Cart/reducer.ts` |

---

## What it is

The **in-bag quantity and remove controls** — the +/- buttons and delete action on each cart line
that let a shopper change how many of an item they want, or take it out of the bag entirely.

## Where it appears

On every line inside the **cart drawer** (CO-03), as a small stepper (− / count / +) with a delete
icon. The same controls also appear (as increment/decrement) inside the add-to-bag sheet (CO-01).

## Who uses it

Any shopper adjusting their bag before checkout.

## How it works (verified behaviour)

- **Instant (optimistic) updates.** Tapping + or − updates the on-screen number immediately, then
  saves to the server and re-fetches the cart to refresh totals.
- **Minimum is 1.** At quantity 1 the minus button is **replaced by a delete icon** — you can't
  decrement to zero; you remove instead.
- **The number can't be typed.** Quantity only changes via the +/- icons; the count field itself is
  read-only.
- **No debounce.** Each tap fires its own save request; overlapping taps are guarded only by a
  simple "busy" flag while a request is in flight. If the server rejects a change, the on-screen
  number is rolled back to the value it held before the tap.
- **Remove** takes the item out of the bag optimistically, then confirms with the server and
  refreshes the totals; if the server rejects it, the item is restored.

## Data source

| Item | Value |
|------|-------|
| Update quantity | `POST /cart/update` — `{ key: cartId, quantity }` (`cartService.UpdateCart`) |
| Remove item | `POST /cart/remove` — `{ key: itemId }` (`cartService.RemoveFromCart`) |
| Refresh after change | `getCart()` / `GetCartOreview()` → `initCart()` |
| Backend | `/cart/update` and `/cart/remove` are on the **gateway** allow-list for guests; **verified shoppers are served entirely by the core backend** |

## Technical reference

| Item | Value |
|------|-------|
| Stepper + delete | `QuantutyInput` in `components/Cart/index.tsx` (updates via `cartService.UpdateCart`) |
| Remove action | `RemoveFromCartAction` in `components/Cart/index.tsx` |
| Widget decrement | `decreaseHandler` in `components/Cart/AddToCart/Button.tsx` |
| Service | `services/cart.ts` — `UpdateCart`, `RemoveFromCart` |
| Store | `store/Cart/reducer.ts` — `updateProductQuantityInCart`, `removeFromCart`, `errRemoveFromCart` (restore-on-failure) |
| Request codes | `utils/Requests.ts` — `UPDATE_CART_ITEM` (104), `REMOVE_FROM_CART` (105) |

## Current status & maturity

**Live and stable.** The happy path (increment, decrement, remove, refresh totals) works, and the
two former code-quality issues (see below) have been fixed.

## Known gaps / notes

No dedicated gaps found.

## Related features

CO-01 (Add to cart — where items enter, and where the same +/- lives) · CO-03 (Cart drawer — hosts
these controls) · CO-05 (Saved-for-later — the "Reschedule" action sits alongside this stepper).
