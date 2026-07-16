# CO-03 — Cart Drawer

| | |
|---|---|
| **Feature ID** | CO-03 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/CartProvider.tsx`, `components/Cart/index.tsx`, `components/Cart/CartItem.tsx`, `components/Cart/OrderButton.tsx`, `store/Cart/reducer.ts` |

---

## What it is

The **shopping bag itself** — a slide-over panel listing every item the shopper has added, with
per-item details, running totals, and a button through to checkout. It's the hub that all the other
cart actions live inside.

## Where it appears

It opens as a **full-screen slide-over** (not a narrow side panel) on top of whatever the shopper
is doing. It's launched from the **cart/bag button in the product header**, from a **notification**,
or by the **`?cart` URL parameter**; closing removes that parameter (so the browser back button
closes it).

## Who uses it

Any shopper — guest or logged-in — reviewing what they've added before buying.

## How it works (verified behaviour)

- **Two-pane slide-over.** Pane 1 is the bag (`CartContainer`); sliding forward reveals pane 2, the
  checkout flow (`OrdersPage`, CO-07 onward). Opening scales the page behind it and locks
  background scrolling.
- **Loads on open.** When the bag opens it fetches the current cart and rebuilds the totals.
- **Each line item shows:** product image, brand icon, name (truncated to ~50 chars), the chosen
  **colour** and **size**, a pieces count, the shipping-days estimate, an out-of-stock badge when
  relevant, and a "hurry up" urgency banner.
- **Totals sheet** (`OrderButton`): an expandable summary showing item count, normal price, total
  discount %, gift, shipping, and the final total (struck-through original vs. offer price). The
  displayed grand total switches to the **cash total** when Cash-on-Delivery is the selected payment
  method. All prices are formatted in the shopper's currency (symbol, decimals, exchange rate).
- **Error state.** If the cart/shipping fetch fails, the item list is replaced by an error panel
  with a **Retry** button.

## Data source

| Item | Value |
|------|-------|
| Main cart + shipping | `GET /cart/cart_shipping` — `getCart()` (`utils/functions.tsx`) → `initCart()` |
| Totals preview | `GET /cart/cart_overview` — `GetCartOreview()` |
| Response shape | `CartApiInterface` (totals + `cart: CartItemInterface[]`) — `utils/types/cart.tsx` |
| Backend | `/cart/cart_shipping` → **Go backend**; `/cart/cart_overview` → **legacy backend** (not on the Go allow-list) |

## Technical reference

| Item | Value |
|------|-------|
| Host / slide-over | `components/Cart/CartProvider.tsx` (`StepSlider` / `SlideWidget`, fixed full-screen `.cart-provider`) |
| Bag pane | `components/Cart/index.tsx` (`CartContainer`) |
| Line item | `components/Cart/CartItem.tsx` |
| Totals footer | `components/Cart/OrderButton.tsx` (`getTotaPriceToShow`, `getDiscount`) |
| Open / close | store `enableCart` + `openCart()` (`store/Cart/reducer.ts`); `?cart` param via `SearchParamUpdater` |
| Price formatter | `RoundPrice` (`utils/functions.tsx`) |
| Request codes | `utils/Requests.ts` — cart reads via `getCart` / `GetCartOreview` |

## Current status & maturity

**Live and stable.** The bag renders items, variants, totals and shipping, handles empty/error
states, and flows straight into checkout.

## Known gaps / notes

- **"Gift / First Shopping" row is hardcoded to `- 0`** in the totals sheet — a placeholder line
  that never reflects a real gift/discount value.


## Related features

CO-01 (Add to cart — fills the bag) · CO-04 (Update / remove items — inline controls) · CO-05
(Saved-for-later — the "Out Of Bag" list below the cart) · CO-06 (Coupon codes) · CO-07+ (Checkout
— pane 2 of the same slide-over).
