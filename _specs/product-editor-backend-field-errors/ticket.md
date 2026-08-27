---
ticket: product-editor-backend-field-errors
title: Show backend validation errors on the product editor's own fields
workflow:
  type: development
  version: 2
  current_stage: verify
status: completed
owner: developer
created_at: 2026-08-26
updated_at: 2026-08-27
links:
  clickup: ""
  github: ""
---

# Ticket Record — product-editor-backend-field-errors

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
| `workflow.type` | yes | Which workflow this item runs. Chosen once at `/wf:start`; never changes. | `development` \| `study` \| `research` |
| `workflow.version` | yes | Ticket schema version. New tickets are `2`; legacy tickets keep `1` and are normalized in memory, never rewritten on disk (ADR-016). | `1` \| `2` |
| `workflow.current_stage` | yes | **Authoritative** lifecycle position: the stage currently active or due to execute next. There are no pseudo-stages — completion and cancellation live in `status`. | any stage id from the ticket's `workflows/<type>/workflow.yaml` |
| `status` | yes | Orthogonal health and terminal status. | `active` \| `blocked` \| `completed` \| `cancelled` |
| `active_blocker_id` | when blocked | Identity of the blocker halting progress. Set with `status: blocked`; cleared on resume. A resume must present a `ResolutionSignal` carrying this exact id. | e.g. `BLK-ACCESS-01` |
| `owner` | yes | Accountable owner. | `em` \| `developer` \| `ai_agent` \| name |
| `created_at` | yes | Creation date. | `YYYY-MM-DD` |
| `updated_at` | yes | Last transition; bumped on every stage or status change. | `YYYY-MM-DD` |
| `links` | no | Optional delivery links (metadata only; never workflow state). `github` is set by `/publish-pr`. | `{clickup, github}` URLs (may be empty) |

Stage ids and their legal transitions are defined canonically per workflow in
`workflows/<type>/workflow.yaml`. Stage names are domain-specific — `development`
runs `intake → research → spec → plan → review → implement → verify`, while
`study` and `research` have their own topologies.

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
and one per transition after that (`rules/lifecycle-protocol.md` §H). This history
is the audit trail, and since 3.0.0 it is the *only* control left over the
lifecycle: nothing refuses a bad transition, so the record of what happened is what
makes one detectable.

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-08-26

- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-08-26

- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: ai_agent
  timestamp: 2026-08-26

- from_stage: spec
  to_stage: plan
  event: spec-validated
  result: passed
  by: developer
  timestamp: 2026-08-26

- from_stage: plan
  to_stage: review
  event: plan-validated
  result: passed
  by: developer
  timestamp: 2026-08-26

- from_stage: review
  to_stage: plan
  event: changes-requested
  result: changes_requested
  by: developer
  timestamp: 2026-08-26

- from_stage: plan
  to_stage: review
  event: plan-revised
  result: passed
  by: developer
  timestamp: 2026-08-26

- from_stage: review
  to_stage: spec
  event: returned-to-spec
  result: changes_requested
  by: developer
  timestamp: 2026-08-27
  note: >-
    Owner direction. plan.md revision 3 records one deviation from spec.md:
    E-4's last sentence ("It shows as text") requires a codeless, unmatched
    refusal entry to be shown, while follow-up 1 (SEC-1, owner disposition
    "mitigate") requires it to be withheld. The owner sent the work item back to
    spec to reword E-4 rather than accept the deviation at the gate. No artifact
    was edited by this transition.

- from_stage: spec
  to_stage: plan
  event: spec-validated
  result: passed
  by: ai_agent
  timestamp: 2026-08-27
  note: >-
    Revision 2 of spec.md. E-4 reworded and FR-20 added, so an entry that names
    no field is withheld rather than shown; FR-6, C-3, C-4, AC-4, AC-12, AC-21
    and the Out of Scope note follow it. E-15 and AC-30 added for a price input
    that is not on the page when prices are locked. All seven OQ-n still
    resolved; AC-1 .. AC-29 keep their ids and meaning.

- from_stage: plan
  to_stage: review
  event: plan-validated
  result: passed
  by: ai_agent
  timestamp: 2026-08-27
  note: >-
    Revision 4 of plan.md. The "Deviation from spec.md" section is removed: the
    specification now carries the withhold rule as FR-20, so step 2 cites the
    requirement instead of an owner disposition. AC-30 gets its own Tests row,
    which its case previously shared with AC-12. Thirty Tests rows, one per
    AC-n. All twelve review follow-ups stay answered; the map is in the file.

- from_stage: review
  to_stage: implement
  event: review-approved
  result: approved
  by: developer
  timestamp: 2026-08-27
  note: >-
    Review round 2. Comprehension gate attempt 2 passed 3/3 at the minimum set,
    not degraded; attempt 1 is retired at comprehension-review-1.md. The panel
    raised three major rows covering two distinct faults (SEC-10, and SEC-11 /
    SEN-11 found by two lenses); the owner accepted both with no plan change,
    and recorded no action on fourteen minor and six info findings. No
    follow-ups return to plan. Two accepted exposures are carried into verify
    and are written in review.md > Accepted exposures.

- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-08-27
  note: >-
    Branch ticket/product-editor-backend-field-errors cut from a clean develop
    (project profile overrides IM-3's main). Six planned files edited plus the
    one declared new test file; nothing outside plan.md > Files to change. All
    30 Tests rows carried out — 24 new cases, AC-15 existing and unedited, 6
    none. 76 unit tests pass; tsc clean; lint 0 errors; i18n parity OK at 2163
    keys. Four deviations recorded, all smaller than planned. No BUG-n. No
    commit created (IM-9).

- from_stage: verify
  event: verification-passed
  result: passed
  by: developer
  timestamp: 2026-08-27
  note: >-
    All 30 acceptance criteria satisfied at depth all-ac. The full profile
    exited 0 on every check — lint, typecheck, unit-tests, build — plus
    i18n-parity for AC-19. Comprehension gate attempt 1 for verify passed 4/4,
    a full gate; the two review records are retired and preserved. AC-16 and
    AC-29 are recorded with explicit limits rather than bare passes. Two
    findings stay open, FIND-1 (a flaky sign-in test) and FIND-2 (the accepted
    "authorized" exposure); both lie outside plan.md > Files to change, which
    is what permits passed under VF-12. Neither was fixed here.
```
