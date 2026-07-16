---
ticket: report-story
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Review — report-story

> Review gate. The reviewer evaluates the spec and plan before any implementation.

## Review Scope

Reviewed `spec.md` (14 acceptance criteria AC-1..AC-14) and `plan.md` (approach,
6 steps, 6 files to change, validation strategy, rollback, out of scope) against
the ticket goal and `research.md`. Author: `ai_agent`; reviewer: human (distinct
actor — separation of duties satisfied, RA-3).

## Plan Summary

Add a design-conformant `ReportStoryModal` and wire it into the existing
owner-gated report affordance in `StoryHolder`, replacing the placeholder
`ConfirmModal` branch and the no-op handler. Make `StoryService.reportStory`
functional (real stories endpoint, reuse the existing `REPORT_STORY` request
identity, propagate errors instead of swallowing them). Reasons modeled as
`{ value, labelKey }` pairs so stable language-independent values are sent while
localized labels are shown. i18n added for ar/tr/ku; English from literal keys.

## Risks

- Backend contract (endpoint path, field names, reason machine-values, details
  max length) is assumed, not yet confirmed (OQ-1/OQ-2). Isolated to one service
  function + the reasons model, so a late correction is low-cost.
- Changing `reportStory` to throw must be matched by a caller that catches and
  shows the error — the plan assigns this to the modal (AC-8/NFR-2). Verify no
  other caller of `reportStory` relies on the old swallow-and-return-null.
- Design primary-token (indigo `#5b3fe0`) and submit-intent color are decided in
  spec but flagged NEW vs code tokens (OQ-4); acceptable for a standard ticket.

## Assumptions

- `POST /api/v1/stories/report_story` with `{ story_id, reasons, content }` is the
  available backend contract (documented assumption; confirm at implement).
- `REQUESTS_DATA.REPORT_STORY` (already defined) is the correct request identity.
- Backend owns duplicate-report dedup; client allows resubmission (OQ-3 default).

## Open Questions

- OQ-1..OQ-4 from `spec.md` remain to confirm with backend/design; none blocks
  the specified UI behaviour or the approved approach.

## Decision

`APPROVED`

- Rationale: The plan is complete (PL-1..PL-5) and every step/file is traceable
  to specific requirements and acceptance criteria (FR/AC mapping is explicit).
  Scope is tight and correct — the genuine fix (functional, error-propagating
  report flow conforming to the design language) is addressed, the unrelated
  `Navbar.tsx` work is explicitly excluded, and `ConfirmModal`/`Requests.ts`/
  `fetchData.ts` are correctly left untouched. Rollback is a clean working-tree
  restore (no commit at implement, no migration, no protected path). The
  remaining open questions are backend/design confirmations that are isolated to
  one service function and can be resolved during implementation without
  reworking the approach. No protected runtime path is involved, so `standard`
  mode and a single approval are appropriate.

## Approvals

> `standard` requires 1 approver. `high_risk` requires 2.

- Approver 1 (reviewer): human reviewer (AlaaAsaadDev)
- Approver 2 (high_risk only): n/a

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: none (standard mode; no protected path)

## Required Follow-up Actions

- none (approved as-is). During `/implement`, confirm the backend contract
  (OQ-1/OQ-2) and verify no other caller of `reportStory` depends on the previous
  error-swallowing behaviour; document any deviation in `implement.md`.
