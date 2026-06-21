---
ticket: report-story
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Spec — report-story

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Report Story — reason-based reporting flow for stories.

## Business Goal

Give viewers a real way to flag inappropriate or abusive stories so the content
can be moderated, replacing the current placeholder that pretends a report
succeeded without sending anything to the backend. This protects users, supports
trust & safety, and produces actionable moderation signal (reason + optional
details) instead of a no-op.

## User Story

> As a viewer of a story I do not own, I want to report it with one or more
> specific reasons and optional details, so that inappropriate or abusive content
> is flagged for moderation and I get clear confirmation it was submitted.

## Functional Requirements

- FR-1 — A viewer who is **not** the owner of the story can open a Report flow
  from the existing report affordance in the story viewer.
- FR-2 — The Report flow presents a fixed list of report reasons: Inappropriate
  Content, Harassment or Hate Speech, Spam or Scam, Intellectual Property
  Violation, Violence or Dangerous Content, Other.
- FR-3 — The viewer can select **one or more** reasons. Reason selection uses the
  app's selection pattern (outline + tint, single-tap toggle) — not checkboxes.
- FR-4 — The viewer can optionally add free-text details (bounded length).
- FR-5 — Submitting is only possible when at least one reason is selected or
  details are provided; otherwise the viewer is told they must provide a reason
  or details, and nothing is sent.
- FR-6 — On submit, the report is sent to the stories backend including the
  reported story's identifier, the selected reasons, and the details text.
- FR-7 — On a successful submission, the viewer sees a success confirmation and
  the Report flow closes.
- FR-8 — On a failed submission, the viewer sees an error message and the Report
  flow stays open with their selections preserved so they can retry.
- FR-9 — While a submission is in flight, the submit control shows a loading
  state and cannot be triggered again.
- FR-10 — All user-facing text in the flow is localized for the four supported
  languages (en, ar, tr, ku) and the layout is correct in RTL (ar, ku).
- FR-11 — While the Report flow is open, the underlying story is paused.

## Non-Functional Requirements

- NFR-1 — Visual design conforms to the Trydos design language: Quicksand type,
  `15px` card / sheet radius, single soft shadow, the standard text colors, a
  **single primary action color (indigo `#5b3fe0`)**, and the standard
  disabled→enabled CTA pair (grey `#d9d9de` → primary, same geometry). No ad-hoc
  accent color (e.g. raw blue) is introduced.
- NFR-2 — The reported-story request must not silently swallow failures: a failed
  request is surfaced to the viewer (no false "reported successfully").
- NFR-3 — The flow is keyboard- and screen-reader-accessible (focusable trigger,
  labeled controls, dismissable).
- NFR-4 — Mobile-first; the flow is usable at the `xs/sm` (≤480px) breakpoint and
  sits above the fullscreen story viewer.
- NFR-5 — No regression to the existing delete-story flow or other story-viewer
  controls.

## Constraints

- C-1 — Reuse the existing report request identity already defined for stories;
  do not invent a parallel request channel.
- C-2 — Reasons are submitted as stable, language-independent values (so backend
  moderation/aggregation is not tied to the viewer's display language).
- C-3 — The report affordance remains owner-gated: owners never see Report (they
  see Delete); non-owners never see Delete.
- C-4 — English copy is sourced from the literal string keys (no separate English
  table); ar/tr/ku must each receive the new strings.
- C-5 — No protected runtime path is involved.

## Edge Cases

- E-1 — Submit attempted with no reason and empty details → blocked with guidance
  (FR-5); nothing sent.
- E-2 — Backend returns an error / network failure → error shown, flow stays
  open, selections preserved (FR-8).
- E-3 — Details exceeds the allowed length → input is bounded (cannot exceed).
- E-4 — The current story index is out of range → a valid story identifier is
  still resolved (fallback) so the report targets a real story.
- E-5 — Rapid double-submit → prevented by the in-flight loading state (FR-9).
- E-6 — Dismissing the flow (cancel / scrim / back) without submitting → no
  request is sent and the story resumes.

## Open Questions

> These do not block the UI behaviour specified above; they must be confirmed
> before/at `/plan` for the backend contract details.

- OQ-1 — Confirm the exact backend endpoint and request/response schema for
  reporting a story (path, field names, success indicator).
- OQ-2 — Confirm the canonical machine values for each reason sent to the backend
  (C-2) and the exact maximum length of the details field.
- OQ-3 — Does the backend deduplicate repeat reports of the same story by the
  same user, or should the client guard against it? (Default assumption: backend
  owns dedup; client allows resubmission.)
- OQ-4 — Confirm the submit-action color: primary indigo (assumed here, matching
  reason-selection sheets) vs destructive red (report-as-destructive intent). The
  spec assumes **primary indigo**; a design decision can override before `/plan`.

## Acceptance Criteria Mapping

> Each criterion has a stable ID; `verify.md` references these.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | A non-owner viewing a story can open the Report flow from the report affordance; an owner cannot (owner sees Delete instead). | FR-1, C-3 |
| AC-2  | The Report flow lists exactly the six specified reasons. | FR-2 |
| AC-3  | Reasons can be multi-selected and de-selected via single tap, shown with outline+tint selected styling (no checkbox control). | FR-3 |
| AC-4  | An optional details field accepts text up to the allowed maximum and cannot exceed it. | FR-4, E-3 |
| AC-5  | Submit is disabled/blocked until at least one reason or some details exist; attempting an empty submit shows guidance and sends nothing. | FR-5, E-1 |
| AC-6  | A valid submit sends the story id, selected reasons, and details to the stories backend using the existing report request identity. | FR-6, C-1 |
| AC-7  | On success, a success confirmation is shown and the flow closes. | FR-7 |
| AC-8  | On failure, an error is shown, the flow stays open, and selections are preserved (no false success). | FR-8, NFR-2, E-2 |
| AC-9  | During submission a loading state is shown and re-submission is prevented. | FR-9, E-5 |
| AC-10 | All flow text is localized for en/ar/tr/ku and renders correctly in RTL. | FR-10, C-4 |
| AC-11 | While the flow is open the story is paused; on dismiss without submit, nothing is sent and the story resumes. | FR-11, E-6 |
| AC-12 | The flow visually conforms to the design language (Quicksand, 15px radius, single soft shadow, single indigo primary token, disabled→enabled CTA pair) with no ad-hoc accent color. | NFR-1 |
| AC-13 | Reasons are transmitted as stable language-independent values, not localized display strings. | C-2 |
| AC-14 | The existing delete-story flow and other story-viewer controls are unaffected. | NFR-5 |

## Out of Scope

- Backend implementation of the report endpoint / moderation handling (server
  side is consumed, not built here).
- Any moderation dashboard, review queue, or notification to the reported user.
- Photo/screenshot attachment with the report.
- Reporting of content other than stories (orders, products, comments, users).
- Rate-limiting/abuse-protection policy for reporting (owned at the platform
  edge, not in this UI ticket).
- Changes to the category-bar scroll-arrow work (separate ticket).
