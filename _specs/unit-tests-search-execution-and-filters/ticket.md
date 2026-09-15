---
ticket: unit-tests-search-execution-and-filters
title: Unit tests — search execution, pagination, and filter application
workflow:
  type: development
  version: 2
  current_stage: verify
  capabilities: []
status: completed
owner: developer
created_at: 2026-09-15
updated_at: 2026-09-15
links:
  clickup: ""
  github: ""
---

# Ticket Record — unit-tests-search-execution-and-filters


> **Keep the front matter free of commentary.** The runtime parses it with a
> standard-library YAML subset reader — it does drop a trailing ` # ...` comment
> correctly, but this file is machine-owned and every field is documented in the
> reference table below. Annotate there, not in the front matter.

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`
> (ADR-018). Stage artifacts (`intake.md` … `verify.md`) never own workflow
> state; their local `status` describes only their own progress. See ADR-003
> (ticket state ownership) in the `wf` plugin's `docs/adr/`.
>
> **Do not hand-edit `workflow.current_stage`, `status`, or `active_blocker_id`
> outside a transition.** They are written only by the step that records an outcome,
> following `rules/lifecycle-protocol.md` §H and §J — one edit, plus one appended
> history entry. Editing them any other way leaves a ticket whose state and history
> disagree, and since 3.0.0 nothing prevents that (ADR-023).

## Field reference

| Field | Required | Purpose | Allowed values |
|-------|----------|---------|----------------|
| `ticket` | yes | Canonical id/slug; ties artifacts + branch together. | slug `^[A-Za-z0-9][A-Za-z0-9._-]*$` |
| `title` | yes | Human-readable summary. | free text |
| `workflow.type` | yes | Which workflow this item runs. Chosen once at `/wf:start`; never changes. | `development` \| `study` \| `research` \| `hotfix` |
| `workflow.version` | yes | Ticket schema version. New tickets are `2`; legacy tickets keep `1` and are normalized in memory, never rewritten on disk (ADR-016). | `1` \| `2` |
| `workflow.current_stage` | yes | **Authoritative** lifecycle position: the stage currently active or due to execute next. There are no pseudo-stages — completion and cancellation live in `status`. | any stage id from the ticket's `workflows/<type>/workflow.yaml` |
| `workflow.capabilities` | no | Owner-selected capabilities engaged for **this work item**. A tag here does nothing unless a stage of this workflow also declares it and `capabilities/<tag>/` exists; an empty list is the default and reproduces pre-v4 behaviour exactly. It selects **no stage and no transition** — a capability changes how a stage works, never which stage runs next. | list of capability ids, e.g. `[tdd]` |
| `status` | yes | Orthogonal health and terminal status. | `active` \| `blocked` \| `completed` \| `cancelled` |
| `active_blocker_id` | when blocked | Identity of the blocker halting progress. Set with `status: blocked`; cleared on resume. A resume must present a `ResolutionSignal` carrying this exact id. | e.g. `BLK-ACCESS-01` |
| `owner` | yes | Accountable owner. | `em` \| `developer` \| `ai_agent` \| name |
| `created_at` | yes | Creation date. | `YYYY-MM-DD` |
| `updated_at` | yes | Last transition; bumped on every stage or status change. | `YYYY-MM-DD` |
| `links` | no | Optional delivery links (metadata only; never workflow state). `github` is set by `/publish-pr`. | `{clickup, github}` URLs (may be empty) |

Stage ids and their legal transitions are defined canonically per workflow in
`workflows/<type>/workflow.yaml`. Stage names are domain-specific — `development`
runs `intake → research → spec → plan → review → implement → verify` and `hotfix`
runs `intake → diagnose → patch → verify`, while `study` and `research` have their
own topologies.

### Status semantics

| Status | Meaning | Resumable |
|--------|---------|-----------|
| `active` | Work is progressing normally. | — |
| `blocked` | Non-terminal halt. `workflow.current_stage` stays put; transitions report `WORK_ITEM_BLOCKED` until an authorized resume. | yes, via `rules/lifecycle-protocol.md` §J |
| `completed` | Terminal success. `workflow.current_stage` remains the last executed stage. | no (`WORK_ITEM_TERMINAL`) |
| `cancelled` | Terminal rejection. `workflow.current_stage` remains the last executed stage. | no (`WORK_ITEM_TERMINAL`) |

## State History

Append one entry per transition; never edit or remove past entries. The command
recording the outcome writes these — the initial `ticket-created` entry at intake,
and one per transition after that (`rules/lifecycle-protocol.md` §H).

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-09-15
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-09-15
- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: developer
  timestamp: 2026-09-15
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-09-15
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-09-15
- from_stage: review
  to_stage: plan
  event: review-changes-requested
  result: passed
  by: developer
  timestamp: 2026-09-15
  evidence_ref: "Comprehension gate passed 3/3 (administered short, 3 of 5, under
    CG-8). Owner recorded CHANGES_REQUESTED on two major panel findings: AC-19 and
    AC-20 false-green guards. Brief is review.md > Required Follow-up Actions,
    FA-1..FA-10."
- from_stage: plan
  to_stage: review
  event: plan-revised
  result: passed
  by: developer
  timestamp: 2026-09-15
  evidence_ref: "Revision addressing FA-1..FA-10. Plan check revision round run
    with all four agents: both majors confirmed CLOSED by the security and senior
    lenses against the source, claim checker confirmed every follow-up does what
    the brief asked, no new major. Nine minors raised on the revision, all fixed
    in it."
- from_stage: review
  to_stage: implement
  event: review-approved
  result: passed
  by: developer
  timestamp: 2026-09-15
  evidence_ref: "Comprehension gate attempt 2 passed 3/3. Both attempt-1 majors
    confirmed closed against source. One new major (AC-17) accepted as a
    mitigation inside the approved scope; FB-1..FB-13 in review.md are binding on
    implement. degraded: the AC-17 major had no gate question of its own."
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-09-15
  evidence_ref: "One new file, tests/services/elastic/elasticSearch.test.ts, 28
    cases, all 28 Tests rows carried out. Full suite 158 files / 2,590 tests,
    exit 0. Two guard proofs run red on purpose then restored. Two deviations
    (D-1, D-2), both corrections to the test's own reach. No BUG-n. No commit."
- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-09-15
  evidence_ref: "All 28 AC proved by tests that ran; logic-change profile exit 0
    on lint, typecheck and unit-tests (158 files / 2,590 tests). Comprehension
    gate verify attempt 1 passed 3/3, degraded 3 of 4. Integration surface did
    NOT hold: eight client importers, not seven — sellerComments.ts is invisible
    to grep (NUL bytes), recorded as finding F-A. No BUG-n."
```
