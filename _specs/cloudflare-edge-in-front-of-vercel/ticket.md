---
ticket: cloudflare-edge-in-front-of-vercel
title: "Should we put Cloudflare (CDN + WAF + Workers) in front of Vercel to cut the Vercel bill?"
workflow:
  type: research
  version: 2
  current_stage: decide
status: completed
owner: developer
created_at: 2026-08-24
updated_at: 2026-08-24
links:
  clickup: ""
  github: ""
---

# Ticket Record — cloudflare-edge-in-front-of-vercel

> **This file is the single canonical owner of the ticket's workflow state.**
> Its lifecycle position lives in exactly one field: `workflow.current_stage`.
> Stage artifacts (`intake.md`, `framing.md`, …) never own workflow state.
> Do not hand-edit `workflow.current_stage` or `status` outside a transition.

## Summary

The April 2026 Vercel invoice in this repository (`vercel-invoice.txt`) is
**$90.87** for the month: **$50.00** fixed platform charges (Pro seat, an extra
team seat, Speed Insights) and **$60.86** of usage, reduced to **$40.87** after a
$20 credit. This work item decides whether placing Cloudflare in front of Vercel
— CDN, WAF, and Workers — is the right way to cut that bill, and which parts of
it such a move could actually touch.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: intake
  to_stage: frame
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: frame
  to_stage: evidence
  event: framing-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evidence
  to_stage: evaluate
  event: evidence-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evaluate
  to_stage: recommend
  event: evaluation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: recommend
  to_stage: assess
  event: recommendation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: assess
  to_stage: frame
  event: framing-invalidated-by-owner
  result: reopened
  by: developer
  timestamp: 2026-08-24
  note: >
    Recorded deliberately even though the research definition declares no
    assess -> frame transition. At the comprehension gate the owner rejected the
    framing's premise, not the questions: this invoice covers roughly 20
    customers, so a decision scoped to "does Cloudflare cut THIS bill" answers a
    question that stops mattering as the app grows, and it ignores cost exposure
    during an attack. The decision question, CR-3's horizon, CR-9's priority and
    a new criterion CR-12 all change, which is framing work, not evaluation
    work. Going only as far back as `evaluate` would have re-scored candidates
    against criteria already known to be wrong. No comprehension.md was written,
    so no gate record is being retired or overwritten.

- from_stage: frame
  to_stage: evidence
  event: reframing-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evidence
  to_stage: evaluate
  event: evidence-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evaluate
  to_stage: recommend
  event: evaluation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: recommend
  to_stage: assess
  event: recommendation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: assess
  to_stage: frame
  event: candidate-underweighted-owner-challenge
  result: reopened
  by: developer
  timestamp: 2026-08-24
  note: >
    Second reopen from the gate, and again on the owner's challenge, not on the
    questions. The owner asked why the middleware and the /api/proxy relay were
    not considered for Workers. They were - as CAN-5 - but CAN-5 was parked as
    INELIGIBLE_PENDING_EVIDENCE at revision 2 and then NOT re-scored when the
    scale reframe raised CR-9 to HIGH, even though its case strengthens with
    scale exactly as CAN-3's does. Two facts that decide it were never
    collected: Workers bill CPU time only and do not bill time waiting on a
    subrequest, while Vercel bills Provisioned Memory during I/O wait; and
    Vercel's own docs warn that middleware can accrue Fast Origin Transfer twice
    for one request. CAN-5 is split into CAN-5a (middleware) and CAN-5b (the
    relay) and re-scored.

- from_stage: frame
  to_stage: evidence
  event: candidate-split-recorded
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evidence
  to_stage: evaluate
  event: evidence-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: evaluate
  to_stage: recommend
  event: evaluation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: recommend
  to_stage: assess
  event: recommendation-completed
  result: passed
  by: developer
  timestamp: 2026-08-24

- from_stage: assess
  to_stage: decide
  event: comprehension-gate-passed
  result: passed
  by: developer
  timestamp: 2026-08-24
  score: 4/4

- stage: decide
  event: decision-accepted
  result: accepted
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-08-24
```
