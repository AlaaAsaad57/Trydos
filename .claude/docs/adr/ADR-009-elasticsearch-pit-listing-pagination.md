# ADR 009: Elasticsearch Point-in-Time (PIT) for listing pagination

- **Status:** proposed
- **Date:** 2026-06-30
- **Ticket:** listing-pagination-no-dup-no-skip
- **Deciders:** reviewer (TBD — gate, not the author), ai_agent (author)

## Context

The product listing (filters / featured / flashDeals / boutique) and the
product-page related-products carousel both paginate Elasticsearch results with
`search_after` over a `[_score, id]` cursor:

- Sort: `services/elastic/elasticSearch.ts:233` — `[{ _score: desc }, { id: asc }]`.
- Cursor produced/consumed: `elasticSearch.ts:261`/`:476`,
  `serverRequests/listing/index.tsx:138` (`search_after: offset`).
- The query sets **no PIT, no `preference`, no `dfs_query_then_fetch`**
  (`elasticSearch.ts:221-249`).

Each page is an **independent** request. The `id` tiebreaker only makes a *single*
response deterministic; it does not make pagination stable, because the **primary**
sort key `_score` (BM25) must be byte-identical between the request that produced
the cursor (page N) and the request that consumes it (page N+1). It frequently is
not:

- With multiple replicas, consecutive requests can hit **different shard copies**
  whose local term/doc-frequency stats differ → a boundary document's `_score`
  drifts (e.g. `5.2001` vs `5.1999`).
- A refresh / segment-merge / catalog write **between** two page requests changes
  scoring on the same shard.

Drift **up** → a boundary document reappears on the next page (**duplicate**);
drift **down** → a boundary document is jumped (**skip**). This is the canonical
cause of intermittent `search_after` duplicates and matches the reported
"sometimes, not always" behavior. A client-side id-dedupe partly masks duplicates
today, but it cannot recover a **skip** (a row Elasticsearch never returned), and
a fallback path even renders whole duplicate pages
(`components/ListingPage/ProductInfiniteScroll.tsx:144-147`; identical defect in
`components/Product/RelatedProductsInfiniteScroll.tsx:95-98`).

**Hard constraints (from the ticket spec):**

- **C-1 — no index mapping change and no re-index.**
- **C-2 — no change to the shopper-visible relevance ordering / sort.**
- The fix must operate within the existing runtime (storefront SSR + server
  "load more" + Elasticsearch); no new infrastructure.

A decision is needed because the only options that fully meet "no duplicate **and**
no skip" differ in blast radius and reversibility, and one of them
(`serverRequests/**`) is a protected runtime path — making this a `high_risk`
change that requires a recorded decision (RV-6).

## Decision

Adopt **Elasticsearch Point-in-Time (PIT)** as the consistency mechanism for
listing pagination, combined with a hardened client dedupe as defense-in-depth:

1. **Open a PIT per "browsing session"** (one fixed filter set) on the initial
   listing query, run the existing query **within** that PIT, and return its
   `pit_id` alongside `products` / `offset`.
2. **Thread the `pit_id` SSR → client** and pass it on every subsequent "load
   more" request, so **all pages of one session read a single immutable snapshot**.
   Within a PIT the segments are frozen, so `_score` is stable across pages and
   `search_after` over the unchanged `[_score, id]` cursor is **guaranteed
   no-duplicate, no-skip by Elasticsearch itself**. Sort and mapping are unchanged
   (honours C-1 and C-2).
3. **Reset per filter set** via the existing `JSON.stringify(parsedFilters)`-keyed
   remount of the scroll component: a new filter session opens a fresh PIT; old
   client dedupe state is discarded with the unmount.
4. **On PIT expiry, transparently re-open a fresh PIT and resume from the last
   cursor and continue — never end early** (ticket decision OQ-1, "safest"). The
   client id-dedupe still guarantees no duplicate across the re-open boundary, so
   continuing preserves completeness; ending early would hide remaining matching
   products (a skip). Keep-alive is sized generously and refreshed on each page so
   expiry is rare.
5. **Keep a hardened client id-dedupe** (dedupe by each item's own `product_id`,
   remove the "append whole already-seen page" fallback, bounded auto-advance,
   robust end-detection) as **defense-in-depth** — correctness must not depend on
   PIT alone.
6. **Ship behind a runtime flag.** Flag **off** ⇒ exact current stateless
   `search_after` behavior, with the client dedupe still active. This makes "flag
   off" a safe steady state and the primary rollback.
7. **Apply to both surfaces** that share the mechanism: the main listing
   (`ProductInfiniteScroll`) and the related-products carousel
   (`RelatedProductsInfiniteScroll`).

## Consequences

**Positive**

- Deterministic **no-duplicate and no-skip** within a session — the actual ticket
  goal — without touching index mapping or shopper-visible ordering.
- Stable in-session ordering even while the catalog changes underneath (the
  snapshot is immutable).
- Instant, low-risk rollback via the runtime flag; the client-dedupe layer is
  independently safe, enabling staged rollout.
- One mechanism covers both paginated surfaces.

**Negative / costs**

- **Pagination becomes stateful:** a `pit_id` must be threaded SSR → client →
  server action and rotated per response. This adds a field to the contract across
  several components and touches a **protected path** (`serverRequests/**`,
  `GetProducts` / `GetRelatedProducts`), so it is `high_risk` (2 approvals,
  rollback rehearsal at `/verify`).
- **PIT lifecycle management:** keep-alive TTL, best-effort close on
  unmount/filter change, and expiry handling (mitigated by the resume-and-continue
  decision; snapshots self-expire so an aborted rollout leaves no lingering state).
- Slightly higher Elasticsearch resource use while PITs are open (bounded by TTL
  and the number of concurrent browsing sessions).
- No automated tests in the repo (per CLAUDE.md) → correctness is proven by a
  reproducible manual procedure + rollback rehearsal, not CI.

## Alternatives considered

- **Stable `preference` seed only** (route all pages of a session to the same
  shard copies). Cheapest (one request param, stateless), reduces replica-driven
  drift — but a refresh/merge on that shard between requests still shifts scores,
  so it **cannot guarantee no-skip**. Rejected as insufficient for the goal;
  superseded by PIT (which subsumes it).
- **Drop `_score` from the sort** (paginate on a deterministic stored field +
  `id`). Would make `search_after` stable without a snapshot, but **changes the
  shopper-visible relevance ordering** (violates C-2) and generally needs a stored
  ranking field / mapping work (violates C-1). Rejected.
- **Client dedupe alone** (no backend change). Eliminates rendered *duplicates*
  deterministically and is retained as defense-in-depth, but **cannot recover
  skips** (a document ES never returned can never be rendered). Insufficient on
  its own.
- **Scroll/scroll-id API.** Designed for deep export, not user-facing
  forward/back pagination; heavier and discouraged in favor of PIT + `search_after`
  by Elasticsearch. Rejected.

## References

- Ticket: `_specs/listing-pagination-no-dup-no-skip/` (`research.md`, `spec.md`,
  `plan.md`).
- Related: [ADR-003](./ADR-003-ticket-state-ownership.md) (ticket state ownership;
  this ADR is referenced from `ticket.md` per that model).
