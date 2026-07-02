# Listing Sort — Design

- **Date:** 2026-07-01
- **Status:** Approved (brainstorming) → ready for plan
- **Scope:** Wire the existing (inert) sort icon on the product listing pages to a working, Elasticsearch-backed sort control.

## Problem

The listing pages already render a sort icon, but it does nothing:

- `components/Listing/FiltersPageContent.tsx:197` — a bare `<img src="/icons/sortIcon.svg">` with no handler and a copy-paste `data-cy="closeSearchInput"` artifact. The same dead icon is duplicated on the `featured` and `flashDeals` pages.

Sort is currently **hardcoded** in `services/elastic/elasticSearch.ts:321`:

```ts
sort: [{ _score: { order: "desc" } }, { id: { order: "asc" } }]
```

There is no user-facing sort anywhere. Listing fetches flow **UI → Next.js server action (`serverRequests/listing`) → `getProductsAndFiltersFromElastic` → Elasticsearch** directly (no REST endpoint), plus a parallel mobile-facing route `app/api/products/searchInCatalog/route.ts`.

## Goal

Let users sort a product listing by: **Newest / Oldest**, **Price low / high**, and **A-Z / Z-A**, driven by a `?sort=` query param, with no change to default (relevance) behavior and no backend/index changes.

## Decisions (locked during brainstorming)

1. **Sort options (v1):** Newest/Oldest, Price low/high, A-Z/Z-A. **Excluded:** has-offer-first (no indexed boolean; would need a `_script` sort or a new backend field).
2. **Price precision:** root `offered_price` (base offer price). Per-country `country_offer_prices` overrides are **not** applied to sort — accepted trade-off; a few country-override products may sort slightly off.
3. **UI mechanism:** `?sort=` query param (orthogonal to the path-based filters), SSR-rendered, shareable.
4. **A-Z localization:** all four locales (ar/en/tr/ku), byte-order via `custom_products.name.keyword` filtered by active locale. True locale collation is **deferred** (see A-Z section).
5. **Mobile parity:** `searchInCatalog` route **included** — parse `sort` and pass it through.

## Sort keys & mapping

A single `?sort=` param. Every clause **always appends `{ id: { order: "asc" } }`** as the final tie-breaker — required for `search_after` cursor stability (ADR-009). `missing: "_last"` keeps docs lacking the sort field at the end.

| `?sort=` value | Elasticsearch sort array |
|---|---|
| *(omitted)* → **relevance** (default) | `[{ _score: { order: "desc" } }, { id: { order: "asc" } }]` — **identical to today** |
| `newest` | `[{ created_at: { order: "desc", missing: "_last" } }, { id: { order: "asc" } }]` |
| `oldest` | `[{ created_at: { order: "asc", missing: "_last" } }, { id: { order: "asc" } }]` |
| `price_asc` | `[{ offered_price: { order: "asc", missing: "_last" } }, { id: { order: "asc" } }]` |
| `price_desc` | `[{ offered_price: { order: "desc", missing: "_last" } }, { id: { order: "asc" } }]` |
| `name_asc` | `[{ "custom_products.name.keyword": { order: "asc", missing: "_last", nested: { path: "custom_products", filter: { term: { "custom_products.language_code": <locale> } } } } }, { id: { order: "asc" } }]` |
| `name_desc` | same as `name_asc` with `order: "desc"` |

Unknown / absent values fall back to **relevance**, so stale or malformed URLs degrade gracefully.

## Architecture

### 1. Core: one pure `buildSortClause`

New function `buildSortClause(sortKey: string | undefined, languageCode: string)` in `services/elastic/helpers.ts`:

- Maps a sort key → ES sort array (per the table above).
- **Always appends `{ id: { order: "asc" } }`** as the last element.
- Returns the relevance default for `undefined` / unknown keys.

`services/elastic/elasticSearch.ts`:

- Add `sort?: string` to the `SearchParams` interface (near line 38) and destructure it in `getProductsAndFiltersFromElastic` (near line 221).
- Replace the hardcoded array at line 321 with `buildSortClause(sort, language_code)`.

This is the **only** change to the ES query itself.

### 2. Threading the param (plumbing)

- **`components/Listing/FiltersPageContent.tsx`** (+ the `featured` and `flashDeals` page copies): read `sort` from the page's `searchParams`, pass it into the initial `getProductsAndFiltersFromElastic` call and down to `ProductListConainer`.
- **`serverRequests/listing/index.tsx`**: add `sort` to `GetProducts` (and `GetFilters`, for facet consistency) signatures and forward it into `getProductsAndFiltersFromElastic`.
- **`components/Server/ProductListConainer.tsx` → `components/Server/ProductList.tsx` → `components/ListingPage/ProductInfiniteScroll.tsx`**: pass `sort` down; include it in the `GetProducts(...)` load-more call.

### 3. Pagination reset (the one real risk)

Listing uses `search_after` cursor + PIT snapshots (ADR-009); the cursor *is* the sort tuple. Changing the sort invalidates the cursor and PIT.

**Mitigation:** remount `ProductInfiniteScroll` when `sort` changes by adding `sort` to its React `key` (alongside the existing filter key). A remount resets `offset` / `seenIds` / `pit_id` / `isReachEnd` cleanly — no manual reset effect, no dup/skip. This is the crux; everything else is mechanical.

### 4. UI control

Wire the dead `<img src="/icons/sortIcon.svg">` (`FiltersPageContent.tsx:197` and the featured/flashDeals copies):

- Wrap in a button opening a lightweight **popover / bottom-sheet** listing the 7 options (local `useState` for open/close — **no store change needed**).
- On select: navigate with `useRouter().push()` to the current path with an updated `?sort=` (preserve existing query keys), read current value via `useSearchParams`. SSR re-renders; the remount key handles pagination reset.
- Show the active option (checkmark) from `useSearchParams`.
- Fix the copy-paste artifact: `data-cy="closeSearchInput"` → `data-cy="sort_control"`.

### 5. Mobile parity — `searchInCatalog`

`app/api/products/searchInCatalog/route.ts`: parse a `sort` query param and pass it into `getProductsAndFiltersFromElastic`, so the mobile API sorts identically.

## A-Z localization detail

Names live in a nested `custom_products[]` array, one row per language keyed by `language_code`. The A-Z sort filters that nested array by the active locale, so the correct localized name is always the sort key for all four locales (ar/en/tr/ku).

Ordering is **byte-order** (`.keyword`, raw UTF-8), not locale collation:

- **ar** — reads roughly alphabetical (Arabic Unicode block is largely contiguous); imperfect on hamza/alef/diacritics.
- **en** — ASCII order: uppercase sorts before lowercase.
- **tr / ku** — Latin special letters (`ı İ ş ğ ç ê î û`) sort after plain ASCII, out of true alphabetical position.

The index defines only `arabic` and `english` analyzers; there are no `tr`/`ku` collations, and `.keyword` is locale-agnostic.

**Deferred (future backend ticket):** true per-locale collation via `icu_collation_keyword` sub-fields — requires the ICU plugin, a mapping change, and a full reindex. Out of scope for this frontend feature.

## Risk & rollback

- **Risk: Low.** The default (relevance) path is byte-for-byte unchanged; new behavior activates only with an explicit `?sort=`. No backend or index changes.
- **Rollback:** remove the `?sort=` UI wiring. `buildSortClause` returns the relevance default for absent/unknown keys, so any stale URL degrades gracefully.
- **Effort: ~Medium**, dominated by threading the param through ~6 files and building the popover; the ES logic is small.

## Out of scope

- Has-offer-first sorting.
- Country-accurate price sorting (per-country `country_offer_prices` overrides in the sort key).
- True locale collation for A-Z (ICU / reindex).

## Files touched (summary)

- `services/elastic/helpers.ts` — new `buildSortClause`.
- `services/elastic/elasticSearch.ts` — `SearchParams.sort`, use `buildSortClause`.
- `serverRequests/listing/index.tsx` — `sort` in `GetProducts` / `GetFilters`.
- `components/Server/ProductListConainer.tsx`, `components/Server/ProductList.tsx` — pass `sort`.
- `components/ListingPage/ProductInfiniteScroll.tsx` — `sort` in load-more + remount key.
- `components/Listing/FiltersPageContent.tsx` (+ `featured`/`flashDeals` page copies) — read `searchParams.sort`, wire the sort control, fix `data-cy`.
- New sort popover/bottom-sheet component.
- `app/api/products/searchInCatalog/route.ts` — parse and forward `sort`.
