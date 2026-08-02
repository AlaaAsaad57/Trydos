# SD-19 — Product Detail Page

| | |
|---|---|
| **Feature ID** | SD-19 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Product/ProductPageContent.tsx`, `app/(client)/[lang]/products/[productId]/page.tsx`, `serverRequests/product.tsx` |

---

## What it is

The full **product page** — everything a shopper sees about one product: photos and video, name
and brand, description, specifications, colour and size options, delivery estimate, shipping and
return badges, buyer reviews, questions, related products, and a sticky add-to-cart bar.

## Where it appears

- Full page at `/{lang}/products/<slug>`.
- Also as an **overlay** on top of a listing, without a full navigation (the quick-view modal,
  SD-18) — both render the exact same page.

## Who uses it

Every shopper deciding on a product.

## How it works (verified behaviour)

- **One shared page for both the full route and the overlay.** The full URL adds SEO metadata
  (cached in Redis) and a "product not found" redirect on failure; the overlay skips those.
- **Streamed in pieces.** The page kicks off its data fetches up front and streams each section
  in as it's ready (React Suspense with skeletons), so the shopper sees the product quickly
  while reviews, related items, etc. fill in.
- **Locale from the URL.** The `{lang}` segment is a combined `country-language` (e.g. `sy-en`);
  the page splits it to know the country and language, and flips to RTL for Arabic/Kurdish.
- **Colour drives the gallery.** The chosen colour (`?color=`) re-keys the photo gallery so the
  images update to that colour (see SD-21).
- **Sticky add-to-cart footer.** A footer (rendered into the page via a portal) shows the price
  row and the action bar: Add to Cart, Like/wishlist, Comment, Share and a More menu (SD-30).
  Adding to cart doesn't navigate — it drops the product into the store and the cart sheet opens
  in response.
- **Structured data.** The footer also emits product JSON-LD (with real rating/review counts
  when present) for search engines (see PF-15).

## Data source

| Item | Value |
|------|-------|
| Core product | `GetGlobalProduct({ slug, language, country })` — Redis cache → `/web/product/globalDetails/<slug>` (gateway for guests, core backend for verified shoppers) |
| Price / stock / sizes | `GetProductPriceQtyDetails(...)` — Redis cache → `/web/product/qtyPriceDetails/<slug>` |
| Shipping settings | `GetStarttingSetting(...)` → `/web/home/startingSettings` (gateway for guests, core backend for verified shoppers) |
| SEO metadata | `GetProductMeta` (full route only), cached in Redis |

## Technical reference

| Item | Value |
|------|-------|
| Page component | `components/Product/ProductPageContent.tsx` (async server component) |
| Full / overlay routes | `app/(client)/[lang]/products/[productId]/page.tsx` · `app/(client)/[lang]/@modal/(.)products/[productId]/page.tsx` |
| Header / back | `components/products/ProductBackButton.tsx` (+ cart header) |
| Sticky footer | `components/Product/ProductFooter.tsx` → `ProductFooterClient.tsx` (portal into `document.body`) |
| Add to cart | `components/products/AddToCartButton.tsx` (writes `selectedProductForCart` to the store) |
| Runtime | `runtime = "nodejs"`, `dynamic = "force-dynamic"` |
| Composed sections | SD-20…SD-30 (gallery, variants, delivery, reviews, FAQ, related, more) |

## Current status & maturity

**Live and stable**, and the most feature-dense screen in the app — heavily composed from ~10
independently-streamed sub-sections.

## Known gaps / notes

- `GetProductPriceQtyDetails` swallows errors and resolves to `undefined` on failure (unlike the
  core product fetch, which re-throws); every consumer must null-guard the price/size data (they
  do). A price/stock backend hiccup therefore degrades quietly rather than erroring.

## Related features

SD-18 (Quick-view overlay — same page) · SD-20 (Gallery) · SD-21 (Variants) · SD-22 (Labels &
views) · SD-23 (Delivery/shipping/returns) · SD-25 (Reviews) · SD-26 (Q&A) · SD-27 (Specs) ·
SD-28 (Share) · SD-29 (Related) · SD-30 (More menu) · CO-01 (Add to cart).
