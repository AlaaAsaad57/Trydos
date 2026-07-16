# SD-22 — Product Labels & View Counts

| | |
|---|---|
| **Feature ID** | SD-22 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductFeaturesWrapper.tsx`, `components/products/ProductLabelsAnimated.tsx`, `components/products/ProductViews.tsx`, `serverRequests/product.tsx` |

---

## What it is

Two small trust/marketing signals on products: **promotional labels** (short tags like a
seller's highlights) and a **view count** (how many times a product has been viewed).

## Where it appears

- **Labels:** on the product page as a scrollable row of feature tags, and — as an *animated,
  rotating* badge — on **product cards** in listings, related-product strips and colour cards.
- **View count:** in the product page's "general properties" row and inside the specs modal
  (SD-27), shown only when the product has at least one view.

## Who uses it

Every shopper — passive trust/marketing signals.

## How it works (verified behaviour)

- **Labels come from the product** (`label_names`) and are shown as short text tags.
- **Two label presentations exist.** On the **product page** the labels are a plain horizontal
  scroll row (not animated). The **rotating/animated** label badge is used on **product cards**
  (a vertically-cycling badge that pauses on each label, looping seamlessly).
- **View count** is read-only on this app — it displays a number the backend maintains. If a
  product has no view document yet, it reads as 0 (and the small `ProductViews` component
  defaults to "1" if no value is passed).

## Data source

| Item | Value |
|------|-------|
| Labels | `product.label_names` (Elasticsearch `custom_products.label_names`) |
| View count | `GetProductGeneralData({ id })` → Elasticsearch `views_index` (`product_views_develop`), field `view_count` → mapped to `total_views` |

## Technical reference

| Item | Value |
|------|-------|
| Product-page labels | `components/Server/product/ProductFeaturesWrapper.tsx` → `ProductFeatures.tsx` (horizontal scroll) |
| Rotating badge (cards) | `components/products/ProductLabelsAnimated.tsx` (CSS `@keyframes`, duration = labelCount × 2s) |
| View count | `components/products/ProductViews.tsx` (eye icon + number; default `"1"`) |
| View fetch | `getProductViewsQuery()` in `serverRequests/product.tsx` (ES `client.get`, 404 → 0) |

## Current status & maturity

**Live.** Labels display and view counts read correctly.

## Known gaps / notes

No dedicated gaps found.

## Related features

SD-19 (Product page) · SD-14 (Listing cards where the rotating badge appears) · SD-27 (Specs
modal that also shows views).
