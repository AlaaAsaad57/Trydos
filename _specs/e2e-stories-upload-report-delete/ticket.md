---
ticket: e2e-stories-upload-report-delete
title: Browser tests for the stories journey — upload, report and delete, with no real shopper ever seeing them
workflow:
  type: development
  version: 2
  current_stage: verify
  capabilities: []

status: completed
owner: developer
created_at: 2026-09-20
updated_at: 2026-09-20
links:
  clickup: ""
  github: ""
---

# Ticket Record — e2e-stories-upload-report-delete

> **Keep the front matter free of commentary.** The runtime parses it with a
> standard-library YAML subset reader — it does drop a trailing ` # ...` comment
> correctly, but this file is machine-owned and every field is documented in the
> reference table below. Annotate there, not in the front matter.

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`
> (ADR-018). Stage artifacts (`intake.md` … `verify.md`) never own workflow
> state; their local `status` describes only their own progress.
>
> **Do not hand-edit `workflow.current_stage`, `status`, or `active_blocker_id`
> outside a transition.** They are written only by the step that records an outcome,
> following `rules/lifecycle-protocol.md` §H and §J — one edit, plus one appended
> history entry.

## Field reference

| Field | Required | Purpose | Allowed values |
|-------|----------|---------|----------------|
| `ticket` | yes | Canonical id/slug; ties artifacts + branch together. | slug `^[A-Za-z0-9][A-Za-z0-9._-]*$` |
| `title` | yes | Human-readable summary. | free text |
| `workflow.type` | yes | Which workflow this item runs. Chosen once at `/wf:start`; never changes. | `development` \| `study` \| `research` \| `hotfix` |
| `workflow.version` | yes | Ticket schema version. New tickets are `2`. | `1` \| `2` |
| `workflow.current_stage` | yes | **Authoritative** lifecycle position. | any stage id from `workflows/development/workflow.yaml` |
| `workflow.capabilities` | no | Owner-selected capabilities engaged for this work item. | list of capability ids, e.g. `[tdd]` |
| `status` | yes | Orthogonal health and terminal status. | `active` \| `blocked` \| `completed` \| `cancelled` |
| `active_blocker_id` | when blocked | Identity of the blocker halting progress. | e.g. `BLK-ACCESS-01` |
| `owner` | yes | Accountable owner. | `em` \| `developer` \| `ai_agent` \| name |
| `created_at` | yes | Creation date. | `YYYY-MM-DD` |
| `updated_at` | yes | Last transition. | `YYYY-MM-DD` |
| `links` | no | Optional delivery links (metadata only). | `{clickup, github}` |

### Status semantics

| Status | Meaning | Resumable |
|--------|---------|-----------|
| `active` | Work is progressing normally. | — |
| `blocked` | Non-terminal halt. `workflow.current_stage` stays put. | yes, via `rules/lifecycle-protocol.md` §J |
| `completed` | Terminal success. | no (`WORK_ITEM_TERMINAL`) |
| `cancelled` | Terminal rejection. | no (`WORK_ITEM_TERMINAL`) |

## State History

- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-09-20
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-09-20
- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: developer
  timestamp: 2026-09-20
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-09-20
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-09-20
- from_stage: review
  to_stage: implement
  event: review-approved
  result: passed
  by: developer
  timestamp: 2026-09-20
- stage: implement
  event: stage-blocked
  result: blocked
  from_status: active
  to_status: blocked
  by: developer
  timestamp: 2026-09-20
  blocker_id: BLK-VIDEO-01
- stage: implement
  event: stage-resumed
  result: passed
  from_status: blocked
  to_status: active
  by: developer
  timestamp: 2026-09-20
  blocker_id: BLK-VIDEO-01
  evidence_ref: "owner on 2026-09-20: 'no video upload required only image' — AC-6 withdrawn, STORY-02 removed from tests/e2e/stories.live.spec.ts"
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-09-20
- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-09-20
