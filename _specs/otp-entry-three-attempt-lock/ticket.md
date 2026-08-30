---
ticket: otp-entry-three-attempt-lock
title: Lock the OTP code boxes after 3 wrong codes, and show how many tries are left
workflow:
  type: development
  version: 2
  current_stage: verify
status: completed
owner: developer
created_at: 2026-08-29
updated_at: 2026-08-30
links:
  clickup: ""
  github: ""
---

# Ticket Record — otp-entry-three-attempt-lock

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`
> (ADR-018). Stage artifacts (`intake.md` … `verify.md`) never own workflow
> state; their local `status` describes only their own progress.
>
> **Do not hand-edit `workflow.current_stage`, `status`, or `active_blocker_id`
> outside a transition.** They are written only by the step that records an
> outcome, following `rules/lifecycle-protocol.md` §H and §J — one edit, plus
> one appended history entry.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-08-29
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-08-29
- from_stage: research
  to_stage: spec
  event: research-validated
  result: passed
  by: ai_agent
  timestamp: 2026-08-30
- from_stage: spec
  to_stage: plan
  event: spec-validated
  result: passed
  by: ai_agent
  timestamp: 2026-08-30
- from_stage: plan
  to_stage: review
  event: plan-validated
  result: passed
  by: ai_agent
  timestamp: 2026-08-30
- from_stage: review
  to_stage: implement
  event: plan-approved
  result: passed
  by: developer
  timestamp: 2026-08-30
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-08-30
- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-08-30
```
