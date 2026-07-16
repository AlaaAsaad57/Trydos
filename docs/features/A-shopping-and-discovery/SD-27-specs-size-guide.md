# SD-27 — Specs & Size Guide

| | |
|---|---|
| **Feature ID** | SD-27 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟡 Partial — specs live; no real measurement-table size guide |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Server/product/ProductGeneralPropertiesWrapper.tsx`, `components/products/GeneralPropertiesModal.tsx`, `components/Server/product/ProductSizesWrapper.tsx` |

---

## What it is

The product's **at-a-glance quality/spec row** and the **detail modal** behind it: overall
rating, buyer-rate count, views, a "Good Quality" mark, a recommend count, the country of origin
("Made in …"), a star-distribution chart, and a size-fit breakdown.

## Where it appears

On the product page (SD-19): a scrollable "general properties" row near the top; tapping it opens
a bottom-sheet with the full breakdown.

## Who uses it

Shoppers assessing quality, rating spread and fit before buying.

## How it works (verified behaviour)

- **Properties row** shows: rating stars, number of buyer ratings, view count (SD-22),
  "Good Quality Product", "Recommend It By N Buyer", and a "Made in {country}" flag.
- **Tapping the row opens a detail sheet** with:
  - a "Buyers Product Rate" summary and a **star-distribution** chart (5★…1★),
  - the product's **view count**,
  - a **size-fit** breakdown (True / Small / Large percentages),
  - a **recommend vs. don't-recommend** bar.

## Data source

| Item | Value |
|------|-------|
| Ratings / quality / recommend / size-fit | `GetProductGeneralData({ id })` → Elasticsearch general doc (`final_rating`, `rating_stats`, `recommendation_stats`, `size_analysis`) |
| Views | Elasticsearch `views_index` (see SD-22) |
| Origin country | `GlobalData.origin_country_iso` → "Made in …" + flag |

## Technical reference

| Item | Value |
|------|-------|
| Properties row | `ProductGeneralPropertiesWrapper.tsx` → `ProductGeneralProperties.tsx` |
| Detail sheet | `components/products/GeneralPropertiesModal.tsx` (`BottomSheet` height 90, opened via store `is_general_properties`) |
| Sizes list | `components/Server/product/ProductSizesWrapper.tsx` (see SD-21) |
| Size-fit chart | `components/Server/product/ProductSizeReviews.tsx` (True/Small/Large %) |

## Current status & maturity

**Partial.** The specs side — rating, quality, views and size-fit — is live and renders from
real Elasticsearch data. The **"size guide" is not delivered**: there is no measurement/size-
conversion chart, and the size-system toggles are decorative.

## Known gaps / notes

- **There is no true "size chart / measurements" guide.** The size area shows the available sizes
  plus a size-fit percentage chart; the "IN / CM" toggles and `Standard/EU/IN/US/UK` chips are
  **decorative** (no conversion behind them). If a measurement-table guide is expected, it does
  not exist yet.


## Related features

SD-19 (Product page) · SD-21 (Size selection) · SD-22 (Views) · SD-25 (Reviews / size-fit source).
