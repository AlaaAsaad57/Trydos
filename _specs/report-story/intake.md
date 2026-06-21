---
ticket: report-story
stage: intake
mode: standard          # standard | high_risk  (fast deferred, not in v1)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-06-20
links:
  clickup:
  github:
---

# Intake — report-story

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

report-story — user-defined ticket (no ClickUp task / GitHub issue linked).

## Ticket Summary

Replace the placeholder "report story" confirmation with a real report flow: a
dedicated Report Story modal that lets a viewer pick one or more report reasons
and add optional free-text details, then submits the report to the backend and
shows success/error feedback.

## Ticket Metadata

- id / slug: report-story
- title: Wire Report Button for report story
- owner: ai_agent
- created: 2026-06-20
- links:

## User Story

> As a viewer of stories, I want to report a story with a specific reason and
> optional details, so that inappropriate or abusive content can be flagged for
> moderation.

## Acceptance Criteria Presence Check

- Present? (yes — derivable from the prior implementation; to be formalised as
  `AC-n` at the `/spec` stage)
- Notes: Expected behaviour observed in the prior (uncommitted) implementation:
  - Tapping Report on a story opens a Report Story modal instead of the old
    generic confirm dialog.
  - The modal lists selectable report reasons (Inappropriate Content, Harassment
    or Hate Speech, Spam or Scam, Intellectual Property Violation, Violence or
    Dangerous Content, Other) — multi-select.
  - An optional free-text details field (max 500 chars) is available.
  - Submit is disabled until at least one reason is selected or details are
    entered; submitting with neither shows a validation message.
  - On submit the report is POSTed to the stories backend with the story id,
    selected reasons, and details; success shows a success toast and closes the
    modal; failure shows an error toast and keeps the modal open.
  - All user-facing strings are translated for en/ar/tr/ku and respect RTL.

## Test Cases Presence Check

- Present? (yes — manual; repo has no automated test suite per CLAUDE.md)
- Notes: Verification is manual (open modal, select/deselect reasons, validation
  on empty submit, successful submit toast + close, failure toast, RTL layout in
  ar/ku). To be enumerated against `AC-n` at `/verify`.

## Missing Information

- Confirm the backend contract for the report endpoint
  (`POST /api/v1/stories/report_story` with `{ story_id, reasons, content }`) is
  the agreed/available API.
- Confirm the canonical reason list and whether reasons are sent as English enum
  values or localized labels.

> Note (out of scope for this ticket): the prior working-tree changes also
> include unrelated category-bar scroll-arrow buttons in
> `components/Server/Navbar.tsx`. These are NOT part of report-story and should be
> excluded when the previous changes are discarded and the work is redone via the
> workflow.

## Readiness Status

`READY`

- Justification: Request is qualified, user story and expected behaviour are
  clear (grounded in the prior implementation), mode is `standard`, and the
  affected area is well understood. Remaining items above are confirmations, not
  blockers; details belong in `/research` and `/spec`.
