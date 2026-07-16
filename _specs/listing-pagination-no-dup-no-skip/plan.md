---
ticket: listing-pagination-no-dup-no-skip
stage: plan
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Plan — listing-pagination-no-dup-no-skip

> Decide the approach before changing code. **Plan only — no implementation
> here.** No branch is created and no source file is changed by `/plan` (PL-9).

## Approach

Two complementary layers, **neither touches the Elasticsearch mapping or sort**:

1. **Layer 1 — make the client dedupe a hard guarantee (deterministic, zero ES
   risk).** The list already dedupes by id but has a fallback that appends a whole
   already-seen page, plus brittle end-detection. Close that hole and add a
   bounded auto-advance so the scroll never stalls. This alone makes a duplicate
   **impossible to render** regardless of what the search backend returns. It
   stays component-local, so the existing `parsedFilters`-keyed remount keeps
   resetting it per filter set (no cross-filter skips).

2. **Layer 3 — Elasticsearch Point-in-Time (PIT) snapshot for the session
   (eliminates skips *and* duplicates at the source).** Open a PIT on the initial
   listing query and thread its id through every "load more". All pages of one
   filter session then read a single immutable snapshot, so `search_after` over
   the existing `[_score, id]` cursor is guaranteed no-duplicate, no-skip by
   Elasticsearch itself — `_score` can no longer drift between pages. PIT is a
   **runtime** snapshot API: no mapping change, no sort change. It resets per
   filter set naturally via the keyed remount (a new filter session opens a new
   PIT).

Why this over alternatives: a stable `preference` seed (the lighter "Layer 2")
reduces but does not eliminate skips (a refresh on the chosen shard still shifts
scores), so it cannot meet the strict "no skip" goal on its own — PIT supersedes
it. Dropping `_score` from the sort would change the shopper-visible ordering
(violates C-2) and may need a stored ranking field (violates C-1). PIT keeps both
ordering and mapping unchanged, so it is the only option that satisfies the goal
within the constraints. Layer 1 is kept as defense-in-depth even with PIT.

PIT is delivered **behind a runtime flag** so it can be disabled instantly
without a revert; Layer 1 is safe and beneficial on its own when the flag is off.

Both layers are applied to the **two** infinite-scroll surfaces that share the
same cursor mechanism and the same defects (OQ-2): the **main listing**
(`ProductInfiniteScroll` — filters/featured/flashDeals/boutique) and the
**related-products carousel** (`RelatedProductsInfiniteScroll` on the product
page). The related carousel uses a manual "Show More" button rather than
auto-scroll, so its Layer 1 work is the dedupe-guarantee + end-detection fix (the
auto-advance is only needed where an in-view sentinel can stall).

> **Architectural decision:** adopting Elasticsearch PIT for listing pagination is
> a significant, hard-to-reverse choice and this is a `high_risk` ticket → a new
> **ADR** (`.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md`)
> MUST be authored and referenced in `review.md` at the `/review` APPROVED gate
> (RV-6). This plan is its input; the ADR is created at the review gate, not here.

## Steps

1. **Client guarantee (Layer 1)** in **both** infinite-scroll components
   (`ProductInfiniteScroll` and `RelatedProductsInfiniteScroll`):
   1. Dedupe on each item's **own** product id (not the parallel analytics array),
      so dedupe never depends on the analytics list staying aligned.
   2. **Remove the "append the whole page" fallback** — when a page yields zero
      *new* ids, append nothing.
   3. **Bounded auto-advance** — if a page added zero new items but the cursor
      advanced and the end was not reached, fetch the next page automatically so
      the bottom sentinel does not stay in view and stall; cap consecutive
      all-duplicate fetches (e.g. 5) then stop (AC-9).
   4. **Robust end-detection** — declare end on `items.length === 0`, on an
      unchanged cursor, or on a short page (`items.length < limit`); do not rely on
      comparing the (snapshot-frozen, but historically drifting) `[_score, id]`
      cursor alone.
   5. Keep `seenIds`/offset/products **component-local** (never lift into the
      Zustand `store/listing` slice) so the keyed remount keeps resetting them per
      filter set.
2. **Open a PIT (Layer 3)** in the initial listing query path: when starting a
   fresh filter session, open a PIT (with a keep-alive), run the existing query
   with the PIT, and return the `pit_id` alongside `products`, `offset`,
   `recommended_offset`.
3. **Thread the `pit_id` SSR → client:** initial server fetch → page content →
   list container → list → infinite-scroll component as a prop, seeded into state
   on mount (resets on the keyed remount).
4. **Use the PIT on every "load more":** the infinite-scroll component sends the
   current `pit_id` to the load-more server action, which forwards it to the
   search call as `search_after` **within** the PIT; each response returns the
   (possibly rotated) `pit_id`, which the client stores for the next page.
5. **PIT lifecycle & expiry (OQ-1 decided — safest):** refresh keep-alive on each
   call and size it generously so expiry is rare; best-effort close the PIT on
   unmount/filter change. On a PIT-expired error, **transparently re-open a fresh
   PIT and resume from the last cursor, then continue** — do **not** end the list
   early. The render-time id-dedupe (Layer 1) still guarantees no duplicate across
   the re-open boundary, so continuing preserves completeness; ending early was
   rejected because it would skip the remaining matching products (AC-11).
6. **Runtime flag:** gate PIT behind a config/env flag; flag **off** ⇒ exact
   current stateless `search_after` behavior, with Layer 1 still active.
7. **ADR:** author the PIT ADR at the `/review` gate and reference it in
   `review.md` (RV-6); record the second approval (RV-5).

## Files to change

> Confirmed at `/implement`; the "Files to change" list is the authoritative scope
> (IM-2/IM-4 — no unrelated file may be modified).

**Main listing surface:**

- `components/ListingPage/ProductInfiniteScroll.tsx` — Layer 1 (dedupe-by-item-id,
  remove fallback, bounded auto-advance, robust end-detection); thread + store
  `pit_id`; handle PIT-expiry resume. Keep all state component-local.
- `components/Listing/FiltersPageContent.tsx` — capture `pit_id` from the initial
  fetch and pass it down.
- `components/Server/ProductListConainer.tsx`, `components/Server/ProductList.tsx`
  — pass the `pit_id` prop through to the infinite-scroll component.

**Related-products carousel surface (OQ-2):**

- `components/Product/RelatedProductsInfiniteScroll.tsx` — Layer 1 (dedupe-by-id,
  remove the same `: response.items` fallback at lines 95-98, robust end-detection
  at lines 77-82); thread + store `pit_id`; handle PIT-expiry resume. (Manual
  "Show More" — no auto-advance sentinel to stall.)
- `components/Server/product/RelatedProductsSection.tsx` — capture `pit_id` from
  the initial related-products fetch and pass it through.
- `components/Product/ProductPageContent.tsx` — pass `pit_id` to the related
  section if the snapshot is opened at the product-page SSR. *(Confirm exact
  wiring at implement.)*
- `app/api/related-products/[id]/route.ts` — if this route is an active entry for
  related-products paging, thread `pit_id` here too. *(Confirm at implement.)*

**Shared backend / cross-cutting:**

- `services/elastic/elasticSearch.ts` — `getProductsAndFiltersFromElastic` **and**
  `getRelatedProducts`: open PIT + run the query within the PIT when enabled;
  return `pit_id`; unchanged sort/mapping. (Not a protected path.)
- `serverRequests/listing/index.tsx` — **PROTECTED PATH (`serverRequests/**`).**
  Both `GetProducts` and `GetRelatedProducts` accept and forward `pit_id` and
  return the rotated `pit_id`. Modified only at the approved `/implement`
  (GU-2/IM-5); protected-path impact stated at `/verify` (VF-9).
- `services/elastic/elasticsearch-reader.service.ts` *(only if PIT open/close
  helpers live here)* — add open/close PIT helpers. *(Confirm at implement;
  include only if used.)*
- A small server action/route to **close a PIT** on unmount *(optional,
  best-effort; if added, it is a non-protected internal route)*.
- `.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md` — **new
  ADR** (authored at `/review`, high_risk requirement).
- Config for the runtime flag (env reference; no protected config edited — **not**
  `next.config.ts`).

## Validation strategy

- Validation profile: none (no `validation_profiles` entry in
  `project-config.yaml`; free-form per VP-5). Repo has **no automated tests**
  (CLAUDE.md) — validation is manual, reproducible, and type/lint-checked.
- **Build/lint:** `pnpm build` and `pnpm lint` pass.
- **AC-1/AC-2 (no dup / no skip):** scroll a relevance-ranked listing (with
  `search_text`) to the end; assert each product id renders exactly once and the
  distinct rendered count equals `total_size`.
- **AC-3/AC-5 (filter flow):** land → load more → change filter → load more, on
  `/filters`, `/featured`, `/flashDeals`, and a boutique page; assert fresh set,
  no carryover, no dup. Repeat for direct URL, reload, and in-app navigation.
- **AC-4/AC-7 (end + all-duplicate page):** force an all-already-seen page; assert
  it adds nothing and the list neither stalls nor ends early.
- **AC-8 (instability):** reproduce on a multi-replica index and/or trigger a
  refresh between page loads; assert no dup/skip with PIT on. Capture the same run
  with PIT off to demonstrate the regression the fix removes.
- **AC-9 (bounded):** confirm the consecutive-all-duplicate cap stops fetching.
- **AC-11 (expiry):** force PIT expiry mid-scroll; confirm the list **resumes from
  a fresh snapshot and continues** (does not end early), with no dup/crash (OQ-1).
- **AC-14 (related carousel):** on a product page, repeatedly tap "Show More" on
  the related-products carousel to the end; assert each related product renders
  once, all are reachable, and end is reported correctly. Repeat the all-duplicate
  page case.
- **AC-6 (analytics):** confirm `view_item_list` matches rendered products.
- **AC-13 / high_risk depth (`all-ac+rollback`):** every AC mapped in
  `verify.md`; perform a **rollback rehearsal** (flip the flag off and confirm the
  listing returns to current behavior with Layer 1 still guarding duplicates);
  record the protected-path impact statement (VF-9/TR-3).

## Rollback

- **Primary:** the PIT runtime flag — set it **off** to instantly revert to the
  current stateless `search_after` path. Layer 1 remains active and continues to
  prevent rendered duplicates, so "flag off" is a safe steady state, not a broken
  one.
- **Staged delivery:** Layer 1 is independent and can ship/stay even if PIT is
  disabled; PIT can be enabled gradually behind the flag.
- **Full revert:** revert the implementation commit on the
  `ticket/listing-pagination-no-dup-no-skip` branch (PR not merged) — no schema or
  data migration is involved, so revert is clean.
- PIT snapshots self-expire via keep-alive TTL, so a disabled/aborted rollout
  leaves no lingering server state.

## Out of scope

- Any change to relevance ranking, sort order, index mapping, or re-index (C-1/C-2).
- The currency/`NaN` price fix (already shipped on `develop`).
- A stable-`preference`-only approach (insufficient for "no skip"; superseded by
  PIT and intentionally not pursued).
