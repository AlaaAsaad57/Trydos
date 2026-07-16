# SD-05 — Boutiques / Offers List

| | |
|---|---|
| **Feature ID** | SD-05 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-03 (against `develop`) |
| **Source of truth** | `components/ServerWrapper/BoutiquesListWrapper.tsx`, `components/Server/OfferListServer.tsx`, `components/ServerWrapper/BoutiqueWrapper.tsx` |

---

## What it is

The "shop by boutique" section at the bottom of the homepage: a vertical list of **boutiques**
(seller storefronts), each shown as a banner with a quick strip of its products, with a
personalized **"Recommended products"** row mixed in and endless scrolling for more boutiques.

## Where it appears

- The bottom section of the homepage (`/{lang}`), below the search/categories, stories,
  featured and flash-deal sections.

## Who uses it

Every shopper. It promotes individual seller storefronts and drives discovery of both
boutiques and their products.

## How it works (verified behaviour)

### Each boutique card
A boutique renders as a white card containing:
- **A banner slider** — the boutique's banner images in an auto-playing carousel (loops
  every 3 seconds), with the **boutique name** (uppercase) and its **description** overlaid
  at the bottom. Tapping the banner opens the boutique's storefront listing at
  `/{lang}/filters/boutiques/<slug>`.
- **A product/category strip** below the banner — a horizontal scroll of the boutique's
  top items. Each tile links either directly to a **product** (`/{lang}/products/<slug>`)
  or to a **category within that boutique**
  (`/{lang}/filters/boutiques/<slug>/categories/<slug>`). Highly-viewed items get a
  "trending" marker.

### The list as a whole
- **Initial load:** the first **10** boutiques for the shopper's country and language.
  If a homepage category filter is active (`?mainCategory=`), only boutiques in that
  category are shown.
- **Recommended products injected:** after the **2nd** boutique, a personalized
  "Recommended products" strip is inserted — **but only when no category filter is active**.
  It loads up to **7** items tailored to the signed-in user (by their stored user id) and is
  itself horizontally scrollable with its own load-more. If the user has no recommendations,
  the strip is hidden.
- **Infinite scroll:** as the shopper scrolls, more boutiques load automatically using a
  cursor (the search index's `searchAfter` value), respecting the active category filter.

## Data source

| Where | How |
|-------|-----|
| Boutiques | `GetHomeBoutiques({ language, country, category })` in `serverRequests/home.tsx` → `ElasticsearchReader.getBoutiques({ country, language, limit: 10, category, searchAfter })`. |
| More boutiques (scroll) | `GetNextBoutiques(...)` — same reader with the returned `searchAfter` cursor. |
| Recommended products | `GetRecommedndedProducts({ country, language, limit: 7, userId })`. |
| JSON API | `GET /api/home/boutiques` (query: `limit`, `offset`, `category_slugs`; served with `no-store` cache headers). |

All data comes from the **product search index (Elasticsearch)**.

## Technical reference

| Item | Value |
|------|-------|
| Section wrapper | `components/ServerWrapper/BoutiquesListWrapper.tsx` |
| List renderer | `components/Server/OfferListServer.tsx` |
| Boutique card | `components/ServerWrapper/BoutiqueWrapper.tsx` |
| Banner carousel | `components/Home/OfferWidgets/BoutiqueElement.tsx` (`BoutiqueSliderWrapper`, Embla + autoplay 3s) |
| Recommended strip | `RecomendedProductWrapper` (in `BoutiquesListWrapper.tsx`) + `components/Server/RecomendedProducts` |
| Infinite scroll | `components/global/InfinteScroll` (uses `searchAfter` as the offset) |
| Boutique limit | 10 per page |
| Recommended limit | 7, personalized by `USER_DATA` cookie id, only when no `mainCategory` |
| Recommended injection point | after boutique index 1 (the 2nd boutique) |
| Streaming skeleton | `OfferListSkeleton` |

## Current status & maturity

**Live and stable.**

## Known gaps / notes


- A boutique banner description is rendered as HTML (with a basic guard that skips any
  description containing `script`). Worth noting for content-safety review of seller-supplied
  descriptions.

## Related features

SD-01 (Homepage feed) · SD-02 (Category filter narrows this list) · SD-17 (Boutique
storefront page) · SD-18 (Seller/boutique profile) · SD-06 (Personalized recommendations) ·
SD-33 (Product card).
