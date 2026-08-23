---
ticket: auth-closeout-tests
title: Close the auth journey at unit and browser level, without touching application code
workflow:
  type: development
  version: 2
  current_stage: verify
status: completed
owner: developer
created_at: 2026-08-23
updated_at: 2026-08-23
links:
  clickup: ""
  github: ""
---

# Ticket Record — auth-closeout-tests

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`
> (ADR-018). Stage artifacts (`intake.md` … `verify.md`) never own workflow
> state; their local `status` describes only their own progress.
>
> **Do not hand-edit `workflow.current_stage`, `status`, or `active_blocker_id`
> outside a transition.** They are written only by the step that records an
> outcome, following `rules/lifecycle-protocol.md` §H and §J — one edit, plus one
> appended history entry. Since 3.0.0 nothing prevents a bad transition
> (ADR-023), so this history is the only control left.

Stage ids and their legal transitions are defined canonically in the `wf`
plugin's `workflows/development/workflow.yaml`:
`intake → research → spec → plan → review → implement → verify`.

## Scope

Items **C**, **D** and **E** of `docs/testing/AUTH_CLOSEOUT_PLAN.md`. Items **B**
and **F** are out — B carries an application change and F adds live surface; each
is its own ticket, as that plan requires.

This work item was opened as `e2e-session-recovery-signed-in` (Item C alone) and
widened to the three items before the `research` stage ran. Nothing had been
built and no branch existed, so the workspace was renamed rather than kept under
a slug that no longer described it. The `ticket-created` entry below is the
original one.

**It carried one application change for part of its life, and no longer does.**
`FR-5` was folded in at `spec` on the owner's answer to `OQ-5` and dropped
entirely at `review`. It concerned the tester simulate feature, which is being
removed from the product — so it is not deferred, not ticketed, and not recorded
as a finding anywhere. There is nothing to come back to.

So the item is back to what `intake.md` describes: test-only, no application
change, revertible with no runtime risk. `intake.md` and `spec.md` are left as
written for the stages they belong to; the moves are recorded in
`spec.md > Out of Scope` and `review.md > Decision`.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: ai_agent
  timestamp: 2026-08-23
- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: review
  to_stage: plan
  event: changes-requested
  result: failed
  by: developer
  timestamp: 2026-08-23
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: review
  to_stage: plan
  event: changes-requested
  result: failed
  by: developer
  timestamp: 2026-08-23
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: review
  to_stage: plan
  event: changes-requested
  result: failed
  by: developer
  timestamp: 2026-08-23
- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: review
  to_stage: implement
  event: plan-approved
  result: passed
  by: developer
  timestamp: 2026-08-23
- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: passed
  by: developer
  timestamp: 2026-08-23
- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-08-23
```
