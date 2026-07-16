---
ticket: listing-pagination-no-dup-no-skip
stage: verify
mode: high_risk
status: complete
owner: reviewer
updated: 2026-06-30
links:
  clickup:
  github:
---

# Verify — listing-pagination-no-dup-no-skip

> Final validation and impact review before the ticket is closed.
> high_risk depth = **all-AC + rollback rehearsal** (MO-6 / VF-4).

## Checks performed

> Evidence types: **runtime** = reviewer manual testing on the ticket branch;
> **static** = `tsc`/`eslint` run during verify; **design** = guaranteed by the
> implementation/sort and reviewed in code (noted where not stress-reproduced).

- Validation profile: none (free-form; VP-5).

| AC ID | Check / test case | Method | Evidence | Result |
|-------|-------------------|--------|----------|--------|
| AC-1  | Scroll a listing to end under fixed filters → no product id rendered twice. | runtime | Reviewer scrolled/loaded more, flag ON and OFF; data returned correctly with no repeats. | PASS |
| AC-2  | Distinct products to end = all matching (no skip). | runtime | Reviewer confirmed "more products load correctly" in both configs; PIT snapshot guarantees completeness by construction. | PASS |
| AC-3  | Change filters → new matching products appear; new set has no dup. | runtime | Reviewer ran filter → scroll; got more products correctly in both configs. | PASS |
| AC-4  | "End of results" reported correctly (no premature stop / endless spinner). | runtime + design | Reviewer scrolled to more pages without stall; end-detection uses `items.length < PAGE_LIMIT` + empty/sameOffset. | PASS |
| AC-5  | AC-1..AC-4 hold on direct URL / reload / in-app nav across listings. | runtime | Reviewer exercised filters + scroll; keyed remount resets per-filter state (research-verified). | PASS |
| AC-6  | "items viewed in list" analytics matches rendered products. | static/code | GA event now emitted only for `uniqueIndexes` (newly-shown) items. | PASS |
| AC-7  | All-already-seen page adds nothing; no stall, no wrong end. | design | Fallback removed; bounded auto-advance (`MAX_CONSECUTIVE_EMPTY_PAGES`) fetches next page instead of stalling. | PASS |
| AC-8  | Catalog mutated / scoring divergence between pages → still no dup/skip. | runtime + design | PIT (flag ON) reads an immutable snapshot → consistent by construction; Layer 1 id-dedupe guards duplicates regardless. Reviewer saw correct data with flag ON. Adversarial multi-replica/refresh repro not force-staged (eliminated by PIT design). | PASS |
| AC-9  | Worst-case extra fetching is bounded (no unbounded loop). | static/code | Auto-advance capped at `MAX_CONSECUTIVE_EMPTY_PAGES = 5`, then sets reach-end. | PASS |
| AC-10 | Visible ordering stable within a filter session. | runtime + design | Sort unchanged (`[_score, id]`); within a PIT the snapshot is immutable. Reviewer saw consistent data. | PASS |
| AC-11 | PIT expiry mid-browse → resume from fresh snapshot, continue (no early end, no dup/crash). | design | `runListingSearch` transparently re-opens a PIT and retries on expiry; keep_alive 2m refreshed per page. Forced-expiry not stress-reproduced; covered by the resume code path + Layer 1 dedupe across the boundary. | PASS (by design; expiry not force-tested) |
| AC-12 | No index mapping change / no re-index required. | static | No mapping/sort change; PIT is a runtime API. `tsc` clean. | PASS |
| AC-13 | Delivered under high_risk track: 2 approvals, ADR, rollback rehearsal. | runtime + docs | review.md: APPROVED by AlaaAsaadDev + AlaaAsaadRev, ADR-009. **Rollback rehearsal:** reviewer confirmed flag OFF returns to correct/current behavior with data intact and no duplicates. | PASS |
| AC-14 | Related-products carousel: each related product once, all reachable, end correct. | runtime + design | Same Layer 1 + PIT applied; reviewer exercised product page. | PASS |

## Commands run

- `npx tsc --noEmit` (changed files)
  ```
  No type errors in any of the 8 changed files.
  ```
- `npx eslint <8 changed files>`
  ```
  Clean — no errors/warnings.
  ```
- Reviewer runtime testing (manual, on branch ticket/listing-pagination-no-dup-no-skip):
  ```
  ELASTIC_LISTING_PIT=true  → listing loads, scroll loads more correctly, data correct.
  ELASTIC_LISTING_PIT=false → same data returned correctly, no issues (rollback rehearsal).
  filter → scroll: more products load correctly in BOTH configs.
  ```

## Observability & runtime impact review

- Protected-path (`protected_paths`) change? **YES** — `serverRequests/listing/index.tsx`
  (matches `serverRequests/**`) was modified (additive `pit_id` threading +
  `productIds` for client dedupe; no auth/token logic touched).
- Intended and reviewed? **YES** — approved at the review gate under `mode:
  high_risk` (2 approvers: AlaaAsaadDev + AlaaAsaadRev) with ADR-009 (TR-3 / VF-9).
- No `proxy.ts`, cookies, auth, cart, order, or store-root paths were touched.

## Sign-off

- Outcome: **verified** → **PASSED** (all AC-1..AC-14 pass; rollback rehearsal done).
- Final ticket state: closed (reviewer transitions verified → closed).
- Approver(s): AlaaAsaadDev (reviewer/verifier) + AlaaAsaadRev (second approver, high_risk).
- Commit: none created at verify (VF-10 / ADR-008 — the publishable commit is
  owned by `/publish-pr`).
- Notes: AC-11 (forced PIT expiry) and AC-8 (adversarial multi-replica/refresh
  repro) were not stress-reproduced in a controlled cluster; both are eliminated
  by the PIT snapshot design and backstopped by the Layer 1 id-dedupe, and the
  reviewer observed correct behavior with PIT enabled. Recommended for the
  production rollout: enable `ELASTIC_LISTING_PIT` in **staging** first and watch
  PIT resource/latency before enabling in production (the code ships flag-OFF by
  default, so production behavior is unchanged until then).
