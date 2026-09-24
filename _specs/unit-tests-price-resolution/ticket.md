---
ticket: unit-tests-price-resolution
title: "Unit tests for the price a shopper sees — variant, country and flash-deal precedence"
workflow:
  type: development
  version: 2
  current_stage: verify
status: completed
owner: developer
created_at: 2026-08-26
updated_at: 2026-08-26
links:
  clickup: ""
  github: "https://github.com/AlaaAsaad57/Trydos/pull/107"
---

# Ticket Record — unit-tests-price-resolution

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

**A. Stage transition** — the lifecycle moved to a different stage:

```yaml
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-08-12
```

**B. Status change** — health or terminal outcome moved; the stage did not:

```yaml
- stage: implement
  event: workflow-blocked
  result: blocked
  from_status: active
  to_status: blocked
  by: developer
  timestamp: 2026-08-12
  blocker_id: BLK-ACCESS-01
```

A resume records the same shape in reverse (`from_status: blocked`,
`to_status: active`) and carries the `evidence_ref` that authorized it.

### Entries

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: ai_agent
  timestamp: 2026-08-26
```

```yaml
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- from_stage: review
  to_stage: implement
  event: plan-approved
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-08-26
```

```yaml
- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-08-26
```
