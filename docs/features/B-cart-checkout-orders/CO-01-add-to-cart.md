# CO-01 — Add to Cart (with variants)

| | |
|---|---|
| **Feature ID** | CO-01 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/AddToCart/AddToCartComponent.tsx`, `components/Cart/AddToCart/Button.tsx`, `services/cart.ts`, `store/Cart/reducer.ts` |

---

## What it is

The **"Add to bag" flow** — a full-screen bottom sheet that opens when a shopper decides to buy an
item, letting them pick the **colour** and **size** before it drops into the cart. It's the single
front door to the cart from anywhere a product appears.

## Where it appears

Anywhere a product has an add-to-bag button: the **product page** (SD-19), **product cards** in
listings and search (SD-14). Tapping the button opens the
variant-picker sheet over the current screen.

## Who uses it

Any shopper, including guests — no login step is required to add an item to the bag.

## How it works (verified behaviour)

- **Opening the sheet.** Tapping any add-to-bag button sets one product as "selected for add to
  cart" in the app state; the picker (`AddToCartComponent`) is mounted globally from
  `CartProvider`, so it can open over any page.
- **Choosing a variant.** Colour is picked from colour chips, size from size chips. Sensible
  **defaults are pre-selected** from (in order) the URL's `?color`/`?size`, a colour passed in by
  the opener, and otherwise the first **in-stock** variant. The exact variant is matched by colour
  name + normalised size.
- **Adding = quantity 1.** The "Add To Bag" button always adds **one** unit. If that variant is
  **already in the bag**, tapping again **increments** it (through the update path, CO-04); a
  minus/remove control lets you decrement. There is **no pre-add quantity stepper** — you reach the
  quantity you want by tapping add / the +/- controls.
- **Validation.** If a product has colours and none is chosen, the colour selector **shakes** and
  the add is blocked; the same applies to size. Adding is also blocked once the item hits its
  `max_allowed_qty` (a value of `0` is treated as "no limit").
- **Out of stock.** If the selected variant has zero stock (or the product is inactive / not sold
  in the shopper's country), the Add button is **replaced by the "Notify me when available"**
  button (CO-02).

## Data source

| Item | Value |
|------|-------|
| Add to cart | `POST /cart/add` — `cartService.AddToCart` |
| Request body | `{ product_id, id, image (filename only), quantity, product_variation_id, is_luck }` |
| Success shape | `data.status === 1` + `data.id_cart` (used as the local cart line id) |
| Backend | **Go backend** (`NEXT_PUBLIC_GO_BACKEND_URL`) — `/cart/add` is on the Go allow-list, market token injected server-side |

## Technical reference

| Item | Value |
|------|-------|
| Variant sheet | `components/Cart/AddToCart/AddToCartComponent.tsx` (mounted from `components/Cart/CartProvider.tsx`) |
| Colour / size / CTA | `ColorSelect.tsx`, `SizeSelect.tsx`, `AddToCart/Button.tsx` |
| Openers | `AddToCartButton.tsx`, `ProductButtonWrapper.tsx`, `ProductCartHeader.tsx`, `ListingPage/Product.tsx`, `NotificationItem.tsx` |
| Service | `services/cart.ts` — `AddToCart` (add), `UpdateCart` (increment existing) |
| Store | `store/Cart/reducer.ts` — `setSelectedProductForCart`, `addProductToCart`, `enableAddToCartOption` |
| Request codes | `utils/Requests.ts` — `ADD_TO_CART` (103), `ADD_TO_CART_WIDGET` (102) |
| Default selection | `resolveDefaultSelection` / `findVariantForSelection` in `AddToCartComponent.tsx` |

## Current status & maturity

**Live and stable.** Variant selection and add-to-bag work end to end across product pages, cards
and notifications, with proper colour/size validation and out-of-stock fallback.

## Known gaps / notes


- **Dead code (harmless):** `services/cart.ts` builds a URL-encoded `formBody` that is never sent
  (the request uses JSON instead), and the local store mirror hard-codes `quantity: 1`. No user
  impact, but worth cleaning up.

## Related features

CO-02 (Notify me when available — the out-of-stock fallback) · CO-03 (Cart drawer — where the
added item lands) · CO-04 (Update / remove items) · SD-21 (Colour / variant selection on the
product page) · SD-19 (Product page).
