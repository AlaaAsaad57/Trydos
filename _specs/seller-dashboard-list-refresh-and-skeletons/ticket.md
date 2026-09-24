---
ticket: seller-dashboard-list-refresh-and-skeletons
title: Seller dashboard — refresh the product/boutique list on return, and replace the blank/spinner loading states with skeletons
workflow:
  type: development
  version: 2
  current_stage: verify
status: completed
owner: developer
created_at: 2026-09-02
updated_at: 2026-09-02
links:
  clickup: ""
  github: ""
---

# Ticket Record — seller-dashboard-list-refresh-and-skeletons

## Summary

Three reported problems in the seller dashboard, all in the same list-and-loading
surface:

1. Adding or updating a product or a boutique, then pressing back, shows the old
   list. The list state lives in a layout-level React context that never unmounts,
   and the refetch effect is guarded on the list being empty.
2. Pressing back from a detail route collapses the page. The generic in-flow
   loader hides the real page and renders a `scale-[5]` spinner in a `50vh` box.
3. The dashboard `loading` flag starts `false`, so a tab first paints its empty
   state ("No products found") before the spinner and then the real list.

## State History

```yaml
- to_stage: intake
  event: ticket-created
  result: passed
  by: developer
  timestamp: 2026-09-02

- from_stage: intake
  to_stage: research
  event: intake-completed
  result: passed
  by: developer
  timestamp: 2026-09-02

- from_stage: research
  to_stage: spec
  event: research-completed
  result: passed
  by: ai_agent
  timestamp: 2026-09-02

- from_stage: spec
  to_stage: plan
  event: spec-completed
  result: passed
  by: developer
  timestamp: 2026-09-02

- from_stage: plan
  to_stage: review
  event: plan-completed
  result: passed
  by: developer
  timestamp: 2026-09-02

- from_stage: review
  to_stage: plan
  event: review-changes-requested
  result: changes_requested
  by: developer
  timestamp: 2026-09-02

- from_stage: plan
  to_stage: review
  event: plan-revised
  result: passed
  by: developer
  timestamp: 2026-09-02

- from_stage: review
  to_stage: implement
  event: review-approved
  result: approved
  by: developer
  timestamp: 2026-09-02

- from_stage: implement
  to_stage: plan
  event: owner-directed-plan-revision
  result: passed
  by: developer
  timestamp: 2026-09-02
  note: >-
    Owner directed a plan revision after approving revision 2, to close the four
    major panel findings before any code. No implement work had started and no
    branch existed. The round 2 APPROVED decision in review.md applies to plan
    revision 2 only; revision 3 carries no gate record.

- from_stage: plan
  to_stage: review
  event: plan-revised
  result: passed
  by: developer
  timestamp: 2026-09-02
  note: >-
    Plan revision 3 closes all four round 2 major findings. Written at the
    owner's instruction without a review panel and without a comprehension gate,
    so review is due but not yet run for this revision.

- from_stage: review
  to_stage: implement
  event: owner-override-no-gate
  result: passed
  by: developer
  timestamp: 2026-09-02
  note: >-
    OWNER OVERRIDE. The owner directed implementation of plan revision 4 without
    running the review stage for it. No comprehension gate was administered for
    revision 4 and no comprehension.md exists for this round; attempts 1 and 2
    are retired at comprehension-review-1.md and comprehension-review-2.md and
    belong to plan revisions 1 and 2. The APPROVED decision in review.md belongs
    to plan revision 2 only, and its "Major finding dispositions" table describes
    that revision, not this one. Plan revisions 3 and 4 were authored without a
    review panel, also at the owner's instruction. This entry is the whole of the
    record that revision 4 reached implement ungated.

- from_stage: implement
  to_stage: verify
  event: implementation-completed
  result: success
  by: developer
  timestamp: 2026-09-02

- stage: verify
  event: verification-passed
  result: passed
  from_status: active
  to_status: completed
  by: developer
  timestamp: 2026-09-02
  note: >-
    All 18 acceptance criteria met; every declared test ran with exit code 0 and
    the whole unit suite is green (138 files, 2235 passed). Comprehension gate
    4/4, stage verify, attempt 1. Three coverage limits are recorded in
    verify.md > Findings rather than waived: the side-menu badge counts are
    verified by inspection only, AC-11 proves half its criterion, and FR-7 is met
    for the seller dashboard alone.
```
