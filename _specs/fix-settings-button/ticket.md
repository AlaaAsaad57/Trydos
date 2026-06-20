---
ticket: fix-settings-button
title: "Fix: Settings button does nothing on Orders and Order Details views"
mode: standard
state: closed
status: active
owner: ai_agent
created_at: 2026-06-20
updated_at: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Ticket Record — fix-settings-button

> **This file is the single canonical owner of the ticket's workflow state.**
> Commands read `state` from here and write transitions back here. Stage
> artifacts (`intake.md` … `verify.md`) never own workflow state; their local
> `status` describes only their own progress. See
> [ADR-003](../../.claude/docs/adr/ADR-003-ticket-state-ownership.md).

## Field reference

| Field        | Required | Purpose                                              | Allowed values |
|--------------|----------|------------------------------------------------------|----------------|
| `ticket`     | yes      | Canonical id/slug; ties artifacts + branch together. | slug `^[A-Za-z0-9][A-Za-z0-9._-]*$` |
| `title`      | yes      | Human-readable summary.                              | free text |
| `mode`       | yes      | Execution mode (canonical here; artifacts mirror it). | `standard` \| `high_risk` (`fast` deferred, not in v1) |
| `state`      | yes      | **Authoritative** workflow state.                   | `draft`, `ready-for-research`, `research-complete`, `spec-complete`, `plan-complete`, `approved`, `implementation-in-progress`, `implemented`, `verified`, `closed` |
| `status`     | yes      | Orthogonal health flag (transitions blocked while `blocked`). | `active` \| `blocked` |
| `owner`      | yes      | Accountable owner.                                  | `em` \| `developer` \| `ai_agent` \| name |
| `created_at` | yes      | Creation date.                                      | `YYYY-MM-DD` |
| `updated_at` | yes      | Last state change; bumped on every transition.      | `YYYY-MM-DD` |
| `links`      | no       | Optional delivery links (metadata only; never workflow state). `github` is set by `/publish-pr`. | `{clickup, github}` URLs (may be empty) |

`state` values and their legal transitions are defined canonically in
`.claude/project-config.yaml > lifecycle`. `status: blocked` corresponds to the
orthogonal "blocked" flag in the validation model (ST-3) and halts advancement.

## State history (required)

Append one entry per state change; never edit or remove past entries.
`/start-ticket` writes the initial `ticket-created` entry shown below; each later
command appends one entry for the transition it performs.

```yaml
- state: draft
  event: ticket-created
  by: ai_agent
  timestamp: 2026-06-20
- state: ready-for-research
  event: research-started
  by: ai_agent
  timestamp: 2026-06-20
- state: research-complete
  event: research-validated
  by: ai_agent
  timestamp: 2026-06-20
- state: spec-complete
  event: spec-validated
  by: ai_agent
  timestamp: 2026-06-20
- state: plan-complete
  event: plan-validated
  by: reviewer
  timestamp: 2026-06-20
- state: approved
  event: plan-approved
  by: reviewer
  timestamp: 2026-06-20
- state: implementation-in-progress
  event: implementation-started
  by: developer
  timestamp: 2026-06-20
- state: implemented
  event: implementation-completed
  by: developer
  timestamp: 2026-06-20
- state: verified
  event: verification-passed
  by: reviewer
  timestamp: 2026-06-20
- state: closed
  event: ticket-closed
  by: reviewer
  timestamp: 2026-06-20
```
