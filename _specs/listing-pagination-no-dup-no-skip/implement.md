---
ticket: listing-pagination-no-dup-no-skip
stage: implement
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Implement — listing-pagination-no-dup-no-skip

> Record of what was actually built, following `plan.md` (and ADR-009).

## Changes made

**Layer 1 — client dedupe guarantee (deterministic, no ES dependency):**

- `components/ListingPage/ProductInfiniteScroll.tsx` — dedupe now keys on each
  item's own `product_id` (new `response.productIds`, falling back to the
  analytics array only if absent); **removed** the `: response.items`
  whole-page fallback so an all-already-seen page appends nothing; added a
  **bounded auto-advance** (`MAX_CONSECUTIVE_EMPTY_PAGES = 5`) so a full-but-all-
  duplicate page fetches the next page instead of stalling the in-view sentinel;
  **robust end-detection** (`items.length === 0 || sameOffset || items.length <
  PAGE_LIMIT`), appending any new items on a short final page before ending;
  analytics emitted only for newly-shown items. State kept component-local
  (resets on the `parsedFilters`-keyed remount).
- `components/Product/RelatedProductsInfiniteScroll.tsx` — same Layer 1 hardening
  (dedupe by `productIds`, removed fallback, robust end-detection, bounded
  auto-advance with `PAGE_LIMIT = 3`).

**Layer 3 — Elasticsearch PIT snapshot pagination (behind a default-off flag):**

- `services/elastic/elasticSearch.ts` — added a runtime flag
  (`ELASTIC_LISTING_PIT`, default off) and helpers `openListingPit()` +
  `runListingSearch()` (transparent re-open & retry on PIT expiry — OQ-1
  resume-and-continue). `getProductsAndFiltersFromElastic` and
  `getRelatedProducts` accept `pit_id`/`usePit`, run the product search inside a
  PIT (`pit` replaces `index`) when enabled, and return the rotated `pit_id`.
  Sort/mapping unchanged. Added `pit_id` to `SearchResult` and the params.
- `serverRequests/listing/index.tsx` **(protected path — `serverRequests/**`)** —
  `GetProducts` and `GetRelatedProducts` accept `pit_id`, pass `usePit: true` +
  `pit_id` down, and return the rotated `pit_id`. `GetProducts` now also returns
  a `productIds` array (parallel to `items`) for robust client dedupe.
- `components/Listing/FiltersPageContent.tsx` — initial listing fetch passes
  `usePit: true` (opens the session PIT; `pit_id` rides inside `filtersData`).
- `components/Server/ProductListConainer.tsx` — passes `pit_id={filtersData?.pit_id}`
  to `ProductListServer`.
- `components/Server/ProductList.tsx` — threads the `pit_id` prop to
  `ProductsInfiniteScroll`.
- `components/Server/product/RelatedProductsSection.tsx` — captures
  `response.pit_id` and passes it to `RelatedProductsInfiniteScroll`.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008). The 8 files below are
> uncommitted working-tree edits on branch `ticket/listing-pagination-no-dup-no-skip`.
> The single publishable commit is created later by `/publish-pr`.

- `services/elastic/elasticSearch.ts`
- `serverRequests/listing/index.tsx`  *(protected path; high_risk — approved)*
- `components/Listing/FiltersPageContent.tsx`
- `components/Server/ProductListConainer.tsx`
- `components/Server/ProductList.tsx`
- `components/ListingPage/ProductInfiniteScroll.tsx`
- `components/Server/product/RelatedProductsSection.tsx`
- `components/Product/RelatedProductsInfiniteScroll.tsx`

## Deviations from plan

- **`components/Product/ProductPageContent.tsx` — NOT changed.** The plan listed
  it "confirm exact wiring at implement." Confirmed unnecessary:
  `RelatedProductsSection` itself calls `GetRelatedProducts` for the initial
  fetch, so the `pit_id` is captured there directly — `ProductPageContent` is not
  in the data path.
- **`app/api/related-products/[id]/route.ts` — NOT changed.** Listed as "confirm
  at implement." The carousel paginates via the `GetRelatedProducts` server
  action (imported in `RelatedProductsInfiniteScroll`), not this route, so it is
  not on the pagination path. Left untouched (avoids scope creep — IM-4).
- **`services/elastic/elasticsearch-reader.service.ts` — NOT changed.** PIT
  open/close helpers were placed inline in `elasticSearch.ts` (the only product
  search site), so the reader service did not need changes.
- **PIT open/close close-on-unmount route — NOT added.** PIT snapshots self-expire
  via `keep_alive`; an explicit best-effort close route was deemed unnecessary for
  v1 and omitted to keep the change minimal. Snapshots expire on their own (no
  lingering server state). Can be added later if PIT resource use warrants it.
- Net effect: implemented **8** of the listed files; the other listed entries were
  conditional ("confirm at implement") and confirmed not required. No file outside
  the approved "Files to change" list was modified.

## Validation run during implementation

- `npx tsc --noEmit` — **PASS**: zero type errors across all 8 changed files.
- `npx eslint <8 changed files>` — **PASS**: no errors/warnings.
- `@elastic/elasticsearch` is **v8.19.1**; `client.openPointInTime` /
  `client.closePointInTime` confirmed present (PIT supported).
- **Not run (deferred to `/verify`, high_risk `all-ac+rollback`):** runtime AC
  validation (manual scroll-to-end dup/skip checks, filter-change flow, related
  carousel, PIT-expiry resume, the multi-replica/refresh reproduction) and the
  **rollback rehearsal** (`ELASTIC_LISTING_PIT` off → current behavior with Layer
  1 still guarding). Requires a running app + Elasticsearch, which this stage does
  not have. The PIT path ships **flag-off by default**, so production behavior is
  unchanged until enabled in staging.

## Protected-path note (for /verify VF-9 / TR-3)

`serverRequests/listing/index.tsx` (matches `serverRequests/**`) **was** modified
— intended and approved at the review gate under `mode: high_risk` (2 approvers,
ADR-009). Changes are additive (`pit_id` threading + `productIds`); no auth/token
logic touched.
