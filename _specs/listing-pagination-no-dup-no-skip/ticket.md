---
ticket: listing-pagination-no-dup-no-skip
title: "Fix: Listing pagination shows duplicate products and can skip products (filters/featured/flashDeals)"
mode: high_risk
state: spec-complete
status: active
owner: ai_agent
created_at: 2026-06-30
updated_at: 2026-06-30
links:
  clickup:
  github:
---

# Ticket Record — listing-pagination-no-dup-no-skip

> **This file is the single canonical owner of the ticket's workflow state.**
> Commands read `state` from here and write transitions back here. Stage
> artifacts (`intake.md` … `verify.md`) never own workflow state; their local
> `status` describes only their own progress. See
> [ADR-003](../../.claude/docs/adr/ADR-003-ticket-state-ownership.md).

## Why high_risk

The plan modifies `serverRequests/listing/index.tsx`, which matches the
`serverRequests/**` entry in `project-config.yaml > protected_paths`. Per **MO-3 /
GU-2** any change touching a protected path must run in `mode: high_risk`:
2 approvals at `/review`, a mandatory **ADR** (PIT adoption), and an
`all-ac+rollback` verification depth (rollback rehearsal) at `/verify`.

## State history (required)

```yaml
- state: draft
  event: ticket-created
  by: ai_agent
  timestamp: 2026-06-30
- state: ready-for-research
  event: research-started
  by: ai_agent
  timestamp: 2026-06-30
- state: research-complete
  event: research-validated
  by: ai_agent
  timestamp: 2026-06-30
- state: spec-complete
  event: spec-validated
  by: ai_agent
  timestamp: 2026-06-30
- state: spec-complete
  event: open-questions-resolved
  by: ai_agent
  timestamp: 2026-06-30
```

> OQ-1 and OQ-2 resolved during plan refinement (no state transition): OQ-1 →
> resume-from-fresh-snapshot on expiry (safest); OQ-2 → related-products carousel
> now in scope. Updated `spec.md` (FR-7, AC-14, Resolved Decisions) and `plan.md`.

> Authored as a review-ready package (research → spec → plan). The canonical
> state is `spec-complete`: research, spec, and plan artifacts exist and the
> ticket is ready for the `/review` gate. **No branch created, no source files
> changed** — `/implement` is the only stage that branches (GU-4), and it has
> not run.

## Next step

`/review` (reviewer role, not the author). Because this is `high_risk`, review
requires **2 approvals** and an **ADR reference** (RV-5 / RV-6) recorded before
`/implement` may create the `ticket/listing-pagination-no-dup-no-skip` branch.
