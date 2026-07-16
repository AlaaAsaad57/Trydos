---
ticket: report-story
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-06-21
links:
  clickup:
  github:
---

# Implement — report-story

> Record of what was actually built, following `plan.md`.

## Changes made

- `services/story.ts` — reworked `reportStory` to
  `reportStory(storyId, reasons: string[], content: string)`: posts to
  `/api/v1/stories/report_story` with `{ story_id, reasons, content }` via the
  existing `REQUESTS_DATA.REPORT_STORY` identity and `server: "stories"`, and now
  **throws** on failure instead of `return null` (so the UI can show a real
  error). (FR-6, NFR-2, AC-6, AC-8, C-1)
- `components/Home/Stories/ReportStoryModal.tsx` — **new** client component:
  portal sheet over a `rgba(0,0,0,0.45)` scrim, white surface, `15px`/`20px`
  radii, single soft shadow, centered `f-16` title, grabber. Reasons rendered as
  outline+tint selectable rows (multi-select, single-tap toggle, no checkboxes);
  optional details field bounded to 500 chars; disabled→enabled primary (indigo
  `#5b3fe0`) Submit + secondary Cancel with identical geometry. Handles
  empty-submit guard, in-flight loading + re-submit lock, success (toast + close),
  failure (toast + stay open, selections preserved). RTL-aware. Reasons modeled
  as `{ value, labelKey }` so stable language-independent values are sent and
  localized labels shown. (FR-2..FR-11, NFR-1/3/4, AC-2..AC-13)
- `components/Home/Stories/StoryHolder.tsx` — imported `ReportStoryModal`;
  replaced the generic `ConfirmModal` report branch with `ReportStoryModal`
  (passing a resilient `storyId` = `story.stories[currentStoryId]?.id ||
  story.stories[0]?.id`); removed the placeholder `handleReportStory` no-op.
  Owner-gating and the existing `isPaused` (story pauses while open) are
  unchanged; `ConfirmModal` remains imported for the delete flow. (FR-1, AC-1,
  AC-11, AC-14, E-4)
- `public/translations/translations.ar.js`, `.tr.js`, `.ku.js` — added the 11 new
  user-facing strings (5 reason labels + "Other", "Report Reason",
  "Details (optional)", "Write details here...", "Submit Report", empty-submit
  guidance). Excluded keys already present ("Cancel", "Report Story", "Story
  reported successfully.", "Failed to report story.") to avoid duplicates. English
  resolves from the literal keys (no en table). (FR-10, C-4, AC-10)

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `services/story.ts`
- `components/Home/Stories/ReportStoryModal.tsx` (new)
- `components/Home/Stories/StoryHolder.tsx`
- `public/translations/translations.ar.js`
- `public/translations/translations.tr.js`
- `public/translations/translations.ku.js`

(Branch `ticket/report-story`, cut from clean `develop`. `_specs/report-story/`
workspace artifacts also present, to be committed at `/publish-pr`.)

## Deviations from plan

- **Backend contract (OQ-1/OQ-2):** implemented against the documented assumption
  (`POST /api/v1/stories/report_story`, `{ story_id, reasons, content }`, reasons
  as stable snake_case values, details max 500). Still to be confirmed with the
  backend; if it differs, only `reportStory` + the reason `value`s change.
- **Caller check (review follow-up):** verified the only reference to
  `reportStory` was the commented-out placeholder in `StoryHolder.tsx`; no live
  caller depended on the previous error-swallowing behaviour, so changing it to
  throw is safe.
- **`pnpm lint` not runnable:** Next.js 16 removed `next lint`, so the `lint`
  script errors at the environment level (unrelated to these changes). Type
  safety was instead validated with `tsc --noEmit` (the build's typecheck gate).
- No protected-runtime-path file was touched. No other deviations.

## Validation run during implementation

- `npx tsc --noEmit` — **passed** (no type errors; new `reportStory` signature,
  modal props, and all call-sites compile).
- `pnpm lint` — **not runnable** (`next lint` removed in Next 16); see deviation
  above. Typecheck via `tsc` used instead.
- Manual AC verification (AC-1..AC-14) — to be exercised by the reviewer at
  `/verify` (mode `standard` → all-AC depth); not run here.
