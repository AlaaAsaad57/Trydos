---
ticket: price-filter-elastic-aggregations
stage: verify
mode: high_risk
status: complete
owner: ai_agent
updated: 2026-06-30
links:
  clickup:
  github:
---

# Verify — price-filter-elastic-aggregations

> Final validation and impact review before the ticket is closed.

## Checks performed

> Behavioral ACs verified manually by the reviewer on the running app
> (`/sy-en/filters`, country SY, `LISTING_PRICE_AGG_ENABLED=true`,
> `LISTING_PRICE_AGG_DEBUG=true`), cross-checked against the `[price-agg]` debug
> output. Code-correctness covered by the `full-build` profile.

- Validation profile: `full-build`

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1  | Slider min/max = global country-aware offer-price bounds over all matching docs (debug `merged` min 0.05 / max 50000 across the catalog, not the page) | manual + `tsc` | 0 | bounds from `price_facet` stats, not page-scan | pass |
| AC-2  | Total reflects all matching products (`total_size` = hits.total) | manual | — | unchanged correct total | pass |
| AC-3  | Every card maps to ≥1 product; no empty cards (`min_doc_count:1`) | manual | — | cards each populated | pass |
| AC-4  | Cards are balanced (equal-count, interpolated) on skewed data | manual | — | ~5 balanced cards after interpolation rework | pass |
| AC-5  | Filter price = country-aware offer price; flash/luck excluded | manual + code | — | `offered_price` / `country_offer_prices.offer_price` only | pass |
| AC-6  | Card click / slider returns exactly the in-range products | manual | — | selection consistent with results | pass |
| AC-7  | (Original: self-excluding, widenable slider) | — | — | **SUPERSEDED** — see note below | accepted (superseded) |
| AC-8  | Distribution curve reflects full set at finer granularity | manual | — | 200-bucket histogram feeds curve | pass |
| AC-9  | Country-correct pricing (SY) incl. nested overrides | manual | — | debug `country_stats` present + merged | pass |
| AC-10 | No per-doc scripting at scale; no facet regression | `tsc` + `lint` + `build` | 0 | indexed-only aggs; other facets unchanged | pass (see note) |
| AC-11 | Currency/decimals correct; no double conversion | manual | — | base units + `RoundPrice` display | pass |
| AC-12 | Pagination/snapshot unchanged | code | — | `GetProducts` (`noFilters:true`) path untouched | pass |
| AC-13 | Edge cases render without NaN/empty-card/crash | manual | — | single-price + empty handled | pass |

**AC-7 supersession (reviewer-accepted).** During testing the product owner
reversed AC-7's self-excluding/widenable behavior to **re-scoping**: the slider
bounds, curve, and cards now reflect the current selection, and widening is via
the **price-only reset** button (returns to the active-filters range). The
re-scoping behavior was verified working. The original AC-7 criterion is
intentionally not met; it is superseded by this decision.
**Follow-up (required):** reconcile `spec.md` AC-7 and ADR-010 (Decision §3,
self-exclusion) to the re-scoping behavior — recorded for a spec note / appendable
follow-up ADR (ADRs are append-only).

**AC-10 note.** Verified by design (all-indexed aggregations, zero per-document
scripts; the only multi-pass cost is two cheap `size:0` aggregation requests) plus
the green `full-build` profile. A live ~100k load test was not performed; the
script-free indexed design is the performance guarantee.

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  exit 0 — no type errors (no errors in any changed file)
  ```
- `pnpm lint`
  ```
  ✖ 24 problems (0 errors, 24 warnings) — 0 errors; warnings pre-existing, none in changed files
  ```
- `pnpm build`
  ```
  exit 0 — production build succeeded; all routes compiled
  ```
- **Rollback rehearsal (high_risk):** reviewer set `LISTING_PRICE_AGG_ENABLED`
  off and confirmed the listing returns to the prior page-scan behavior with no
  errors. Flag-off is the primary, deploy-free rollback.

## Observability & runtime impact review

- **Protected-path impact: NO.** The ticket's changed files —
  `services/elastic/helpers.ts`, `services/elastic/elasticSearch.ts`,
  `components/ListingPage/filterComponents/FiltersWindow/index.tsx` — are **not**
  in `protected_paths`. `serverRequests/**` (protected) was **not** modified
  (pass-through preserved). No `observability/` configs changed (the repo has no
  observability stack).
- **Out-of-ticket working-tree changes (must be excluded from delivery).** Two
  unrelated files carry concurrent edits made outside this ticket and outside
  `/verify`'s actions: `components/settings/BecomeSellerModal.tsx` and
  `components/skeleton/listing.tsx`. They are **not** part of this ticket and were
  not modified by validation (read-only; VP-2/VF-7 hold for this gate). At
  `/publish-pr`, staging must be confined to the ticket's three source files +
  `_specs/<slug>/` (GU-3/PB-9) — these two files must NOT be staged.

## Sign-off

- Outcome: verified — PASSED
- Final ticket state: closed
- Approver(s): Alaa (reviewer), AlaaDev (second approver — high_risk)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: All acceptance criteria pass; AC-7 accepted as superseded by the
  product-owner re-scoping decision (spec/ADR reconciliation flagged as a
  required follow-up). High_risk depth satisfied: every AC verified + live
  rollback rehearsal. Two distinct approvers recorded (RV-5/VF sign-off).
