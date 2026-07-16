# SD-21 — Colour / Variant Selection

| | |
|---|---|
| **Feature ID** | SD-21 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductColorsWrapper.tsx`, `components/Server/product/ProductSizesWrapper.tsx`, `components/Server/product/SizeItemWrapper.tsx` |

---

## What it is

The controls to pick a product's **colour** and **size** before adding it to the cart.

## Where it appears

On the product page (SD-19), below the description.

## Who uses it

Every shopper choosing a variant of a product.

## How it works (verified behaviour)

- **Colour swatches** appear only when a product has **2 or more** colours. Each swatch is that
  colour's thumbnail; a "trending colour" gets a small badge. The active colour has a purple
  frame, others a grey frame.
- **Choosing a colour reloads the page for that colour.** Each non-selected swatch is a link to
  `/{lang}/products/<slug>?color=<colour>`; selecting it re-renders the page and, crucially,
  **re-keys the photo gallery** so the images switch to that colour (see SD-20).
- **Sizes** appear only when the product has sizes. They show as tappable chips with a
  "{N} Sizes Available" count.
- **Choosing a size updates the URL** (`?size=<size>`) in place. The size feeds the FAQ section
  and the product's structured data, but does **not** change the gallery.

## Data source

| Item | Value |
|------|-------|
| Colours | `product.sync_color_images` (from `GetGlobalProduct`) |
| Sizes | `productData.sizes` (from `GetProductPriceQtyDetails`) |
| Applied via | `?color=` (full navigation) and `?size=` (in-place) URL params |

## Technical reference

| Item | Value |
|------|-------|
| Colour swatches | `components/Server/product/ProductColorsWrapper.tsx` (shown only if `colors.length > 1`) |
| Size chips | `components/Server/product/ProductSizesWrapper.tsx` → `SizeItemWrapper.tsx` |
| Colour select | `NextLink` → `?color=<color_option>` (re-keys gallery) |
| Size select | `router.push` with `?size=<key>` |
| Active styles | colour: purple `#513AAF` frame · size: `bg-[#F4F4F4]` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-20 (Gallery that follows the colour) · SD-27 (Size guide / size-fit) ·
CO-01 (Add to cart with the chosen variant).
