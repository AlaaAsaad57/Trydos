---
ticket: listing-pagination-no-dup-no-skip
stage: review
mode: high_risk
status: complete
owner: reviewer
updated: 2026-06-30
links:
  clickup:
  github:
---

# Review — listing-pagination-no-dup-no-skip

> Review gate. The reviewer evaluates the spec and plan before any implementation.

## Review Scope

Reviewed `ticket.md`, `research.md`, `spec.md`, and `plan.md` for the
duplicate/skip listing-pagination fix, plus the referenced `ADR-009`
(Elasticsearch PIT). Confirmed the plan satisfies PL-1..PL-5 (Approach, Steps,
Files to change, Validation strategy, Rollback, Out of scope) and that each
acceptance criterion (AC-1..AC-14) maps to a requirement and to a validation step.

## Plan Summary

Fix intermittent duplicate and skipped products in both infinite-scroll surfaces
(main listing + related-products carousel) using two layers that change neither
the Elasticsearch mapping nor the sort: (1) a hardened, component-local client
id-dedupe with bounded auto-advance and robust end-detection — a deterministic
"no duplicate rendered" guarantee; and (2) an Elasticsearch Point-in-Time (PIT)
snapshot opened per filter session and threaded SSR→client, so every page reads
one immutable snapshot — making `search_after` over the existing `[_score, id]`
cursor guaranteed no-duplicate and no-skip. On PIT expiry the list resumes from a
fresh snapshot and continues (never ends early). Shipped behind a runtime flag for
instant rollback.

## Risks

- Pagination becomes **stateful** (`pit_id` threaded through SSR → client → server
  action) and touches the protected path `serverRequests/**` — hence high_risk.
- PIT **lifecycle/TTL** management; mitigated by the resume-and-continue expiry
  decision and self-expiring snapshots.
- Slightly higher Elasticsearch resource use while PITs are open.
- No automated tests in the repo → correctness proven by the reproducible manual
  procedure + rollback rehearsal at `/verify`.

## Assumptions

- The deployed Elasticsearch version supports PIT (`_pit` open/close) and
  `search_after` within a PIT.
- The runtime flag can be toggled without redeploy (env/config), making "flag off"
  a safe steady state with the client dedupe still active.
- The `parsedFilters`-keyed remount continues to be the per-filter reset boundary
  (the plan keeps dedupe state component-local — never lifted into the store).

## Open Questions

- None blocking. OQ-1 (expiry → resume-and-continue) and OQ-2 (related carousel in
  scope) were resolved during plan refinement and are recorded in `spec.md` /
  `plan.md`. Exact PIT keep-alive duration is an implementation tuning detail to
  confirm at `/implement`.

## Decision

`APPROVED`

- Rationale: PIT is the safer, more professional approach than relying on the
  current cross-request `search_after` over `_score`, which can drift between two
  page requests (replica divergence / refresh between requests) and cause the
  observed duplicates and silent skips. PIT reads an immutable snapshot so pages
  are consistent by construction, with no mapping or sort change, and the runtime
  flag plus client-dedupe defense-in-depth keep rollback safe. The plan is
  complete (PL-1..PL-5), fully traceable to AC-1..AC-14, and scopes both affected
  surfaces.

## Approvals

> `standard` requires 1 approver. `high_risk` requires 2.

- Approver 1 (reviewer): AlaaAsaadDev
- Approver 2 (high_risk only): AlaaAsaadRev

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: ADR-009 — Elasticsearch PIT for listing pagination (accepted at this gate;
  `.claude/docs/adr/ADR-009-elasticsearch-pit-listing-pagination.md`).

## Required Follow-up Actions

- At `/implement`: confirm exact "Files to change" wiring for the related-products
  surface (`ProductPageContent.tsx`, `app/api/related-products/[id]/route.ts`),
  keep all dedupe/offset state component-local, and keep PIT behind the runtime
  flag. Flip ADR-009 status `proposed → accepted` as a doc-housekeeping follow-up.
- At `/verify` (high_risk depth `all-ac+rollback`): map every AC to a result,
  perform the rollback rehearsal (flag off → current behavior, dedupe still
  guarding), and record the protected-path impact statement (VF-9/TR-3).
