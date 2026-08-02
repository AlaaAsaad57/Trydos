# SD-15 — Filter Panel

| | |
|---|---|
| **Feature ID** | SD-15 |
| **Domain** | A · Shopping & Product Discovery |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/ListingPage/filterComponents/FiltersWindow/index.tsx`, `components/Server/FilterList.tsx`, `components/ListingPage/FilterItem.tsx`, `services/elastic/elasticSearch.ts`, `utils/server/index.tsx` |

---

## What it is

The controls that let a shopper **narrow a listing** down to what they want — by category,
brand, boutique, colour, size and price range. It comes in two parts: a quick chip rail shown
directly under the page header, and a full-screen filter panel opened from the filter icon.

## Where it appears

On every listing page (SD-14): the filters/category/boutique/search pages, the Featured page
and the Flash-Deals page.

- **Inline chip rail** — a horizontal row of category / brand / colour / size chips plus an
  "active filters" bar, always visible under the header.
- **Full-screen filter panel** — opened by the filter icon in the bar; a full-height overlay
  with all filter groups and a price slider.

## Who uses it

Shoppers refining a broad listing (e.g. "shoes" → pick a brand, a size and a price range).

## How it works (verified behaviour)

- **Filter groups:** categories, brands, boutiques, colours, sizes and a **price range**.
- **Live counts while choosing.** Inside the panel, changing a selection re-queries the
  catalogue (debounced ~0.4s) to update the option counts and the total number of matching
  products **before** the shopper commits — so they can see how many results a choice yields.
- **Commit to apply.** Selections are staged; the shopper taps **Search** to apply them and
  load the filtered listing. There is also a reset/clear.
- **Filters live in the URL as a clean path** (not messy `?query=` parameters). They are
  encoded as ordered path segments — e.g. a brand + colour becomes
  `/{lang}/filters/brands/<brand>/colors/<hex>` — so a filtered listing is a shareable,
  bookmarkable link. The server decodes those segments back into the query.
- **Facets come from the search engine.** The available options and their counts are
  Elasticsearch **aggregations**, so they reflect the real catalogue for the current context
  (country, boutique, category…).
- **More options load on demand.** Each group shows the first 10 options; the rest load as the
  shopper scrolls within the group.
- **One responsive layout** — the same components serve mobile and desktop (mobile-first
  full-screen panel), and flip direction automatically for Arabic / Kurdish (RTL). The category
  rail's stacked sub-category circles now mirror properly in Arabic and Kurdish: they tuck behind
  their parent category instead of hanging detached on the wrong side.

## Data source

| Item | Value |
|------|-------|
| Facets / counts | Elasticsearch `aggs` in `getProductsAndFiltersFromElastic()` (`buildAggregations`) |
| Live re-count | `GetFilters` server action (`serverRequests/listing/index.tsx`, `noProducts: true` → facets only) |
| Filter matching | nested ES queries on `custom_categories`, `custom_brands`, `custom_boutiques`, `text_colors`, `available_size` |
| URL encode / decode | `getSearchPageUrl` / `buildParamsFromFilters` (build) · `parseFiltersFromParams` (`utils/server/index.tsx`, decode) |

## Technical reference

| Item | Value |
|------|-------|
| Full-screen panel | `components/ListingPage/filterComponents/FiltersWindow/index.tsx` (`FiltersWindowUI`) |
| Open/close toggle | `components/filterPage/FilterBoutiquePageButton.tsx` + `filterEnabled` flag in `store/listing/reducer.ts` |
| Inline chip rail | `components/Server/FilterListContainer.tsx` → `components/Server/FilterList.tsx` |
| Initial facet seed | `components/Server/FilterWidgetServer.tsx` |
| Price slider | `PriceSliderComponent` / `PriceShape` (`SmoothPolygon` price curve) |
| Options per group | first **10**, then load-more on scroll |
| Live-recount debounce | ~400 ms |
| URL form | ordered path segments: `boutiques, categories, brands, colors, sizes, prices, search, tags_names` |

## Current status & maturity

**Live and stable.** The price-range facet is the newest, most sophisticated part (a
two-phase, country-aware aggregation that splits the price range into 5 equal-count bands).

## Known gaps / notes

No dedicated gaps found.


## Related features

SD-14 (Listing page it filters) · SD-12 (In-search filtering, the overlay equivalent) ·
SD-16 (Sort) · SD-17 (Boutique storefront).
