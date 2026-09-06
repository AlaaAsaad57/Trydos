---
ticket: checkout-address-totals-and-cart-lines
title: Prove the money path — address choice at checkout, totals against shown prices, and cart line changes
workflow:
  type: development
  version: 2
  current_stage: verify
  capabilities: []
status: active
owner: developer
created_at: 2026-09-05
updated_at: 2026-09-05
links:
  clickup: ""
  github: ""
---

# Ticket Record — checkout-address-totals-and-cart-lines

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`
> (ADR-018). Stage artifacts (`intake.md` … `verify.md`) never own workflow
> state; their local `status` describes only their own progress.
>
> **Do not hand-edit `workflow.current_stage`, `status`, or `active_blocker_id`
> outside a transition.** They are written only by the step that records an
> outcome, following `rules/lifecycle-protocol.md` §H and §J — one edit, plus one
> appended history entry. Editing them any other way leaves a ticket whose state
> and history disagree, and nothing prevents that (ADR-023).

## Field reference

| Field | Required | Purpose | Allowed values |
|-------|----------|---------|----------------|
| `ticket` | yes | Canonical id/slug; ties artifacts + branch together. | slug `^[A-Za-z0-9][A-Za-z0-9._-]*$` |
| `title` | yes | Human-readable summary. | free text |
| `workflow.type` | yes | Which workflow this item runs. Chosen once at `/mw:start`; never changes. | `development` \| `study` \| `research` \| `hotfix` |
| `workflow.version` | yes | Ticket schema version. New tickets are `2`. | `1` \| `2` |
| `workflow.current_stage` | yes | **Authoritative** lifecycle position. | any stage id from `workflows/development/workflow.yaml` |
| `workflow.capabilities` | no | Owner-selected capabilities for this work item. Empty is the default. | list of capability ids |
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
| `blocked` | Non-terminal halt; the stage stays put. | yes, via §J |
| `completed` | Terminal success. | no |
| `cancelled` | Terminal rejection. | no |

## Stages

`development` runs `intake → research → spec → plan → review → implement → verify`.
The base branch in this repository is **`develop`**, not `main`.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-09-05
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-09-05
- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: developer
  timestamp: 2026-09-05
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-09-05
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-09-05
- from_stage: review
  to_stage: implement
  event: review-approved
  result: passed
  by: developer
  timestamp: 2026-09-05
- stage: implement
  event: implementation-blocked
  result: blocked
  from_status: active
  to_status: blocked
  by: developer
  timestamp: 2026-09-05
  blocker_id: BLK-LIVE-TIMEOUT-01
- stage: implement
  event: implementation-resumed
  result: passed
  from_status: blocked
  to_status: active
  by: developer
  timestamp: 2026-09-05
  blocker_id: BLK-LIVE-TIMEOUT-01
  evidence_ref: "Owner decision 2026-09-05: deliver the unit half now and defer the
    live run. The blocker is not withdrawn — the live half moves out of this work
    item's scope into a follow-up, so no declared row is left uncarried (IM-11's
    plan-revision route). Evidence that forced it: GitHub Actions run 33951875379,
    'Timed out waiting 1800s', 5 cases did not run; and staging login reported
    broken by the owner the same day."
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-09-05
```
