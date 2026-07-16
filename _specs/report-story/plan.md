---
ticket: report-story
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Plan — report-story

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Build a dedicated, design-language-conformant `ReportStoryModal` and wire it into
the existing report affordance in `StoryHolder`, replacing the generic
`ConfirmModal` branch and the placeholder `handleReportStory` no-op. Make
`StoryService.reportStory` functional: accept the selected reasons + details,
post to the stories backend with the already-defined `REPORT_STORY` request
identity, and **propagate** failures so the UI can show a true error instead of a
fake success. Reasons are modeled as `{ value, labelKey }` pairs so stable,
language-independent values go to the backend while localized labels are shown
(AC-13/C-2). Chosen over extending `ConfirmModal` because the spec needs
multi-select reasons + free-text + per-state feedback, which a yes/no dialog
cannot express; chosen over a new service module because story logic already
lives in `services/story.ts`.

The endpoint and field names follow the documented assumption
(`POST /api/v1/stories/report_story` with `{ story_id, reasons, content }`,
OQ-1/OQ-2); if backend confirmation differs, only the service call + reason
values change (isolated to one function).

## Steps

1. **Service** — rework `StoryService.reportStory` to the signature
   `(storyId, reasons: string[], content: string)`: target the real stories
   report endpoint, send `{ story_id, reasons, content }`, treat a non-success
   response as an error, and **throw** on failure (remove the `return null`
   error-swallow) so callers can react. Reuse `REQUESTS_DATA.REPORT_STORY`.
2. **Reasons model** — define the six reasons as stable `{ value, labelKey }`
   pairs (language-independent `value` sent to backend; `labelKey` localized for
   display) — satisfying C-2/AC-13. Single source used by the modal.
3. **Modal component** — add `ReportStoryModal` (portal over a
   `rgba(0,0,0,0.45)` scrim, white surface, `15px` radius, single soft shadow,
   centered `f-16` title): reason list rendered as outline+tint selectable chips
   (multi-select, single-tap toggle, no checkboxes), an optional bounded details
   field (floating label, max length enforced), and a disabled→enabled primary
   (indigo `#5b3fe0`) Submit + secondary Cancel using identical geometry. Handle
   states: empty-submit guard (guidance, no send), in-flight loading + re-submit
   lock, success (toast + close), failure (toast + keep open, preserve
   selections). RTL-aware for ar/ku.
4. **Wire-up** — in `StoryHolder`, replace the `showReportModal` `ConfirmModal`
   branch with `ReportStoryModal`, pass a resilient story id
   (`story.stories[currentStoryId]?.id` with first-story fallback, E-4), and
   delete the placeholder `handleReportStory`. Keep the existing `isPaused`
   wiring so the story pauses while open (FR-11/AC-11) and resumes on dismiss.
5. **i18n** — add the new user-facing strings (reason labels, title, "Report
   Reason", "Details (optional)", "Submit Report", "Cancel", success/error,
   empty-submit guidance) to `translations.ar.js`, `translations.tr.js`,
   `translations.ku.js`. English is the literal key (no en table) — C-4.
6. **Self-check** — run validation (below), eyeball each AC, confirm no
   regression to the delete-story flow and no unrelated edits (e.g. Navbar).

## Files to change

- `components/Home/Stories/ReportStoryModal.tsx` — **new**: the report
  bottom-sheet/modal UI + submit orchestration (FR-2..FR-11, NFR-1/3/4, AC-2..AC-12).
- `components/Home/Stories/StoryHolder.tsx` — swap `ConfirmModal` report branch
  for `ReportStoryModal`; pass resilient `storyId`; remove placeholder handler;
  preserve owner-gating and `isPaused` (FR-1, AC-1, AC-11, AC-14).
- `services/story.ts` — functional `reportStory(storyId, reasons, content)`: real
  endpoint, propagate errors, reuse `REPORT_STORY` (FR-6, NFR-2, AC-6, AC-8, C-1).
- `public/translations/translations.ar.js` — add report strings (AC-10, C-4).
- `public/translations/translations.tr.js` — add report strings (AC-10, C-4).
- `public/translations/translations.ku.js` — add report strings (AC-10, C-4).

Not changed: `utils/Requests.ts` (`REPORT_STORY` already exists);
`utils/fetchData.ts`; `components/global/ConfirmModal.tsx` (still used by delete);
`components/Server/Navbar.tsx` (unrelated ticket).

## Validation strategy

- Validation profile: none   # free-form (repo has no automated test suite)
- `pnpm build` — full TypeScript typecheck + production build is the primary
  correctness gate (the new `reportStory` signature, modal props, and all
  call-sites must compile).
- `pnpm lint` — ESLint on the changed files.
- `pnpm knip` — confirm no newly-unused exports and that `ConfirmModal` is still
  referenced (by the delete flow).
- Manual UI verification mapped to **AC-1..AC-14** (mode `standard` → all-AC
  depth): non-owner sees Report / owner sees Delete (AC-1); six reasons (AC-2);
  multi-select toggle styling (AC-3); details max length (AC-4); empty-submit
  guard (AC-5); successful submit posts correct payload + success + close
  (AC-6/AC-7); forced failure → error + stays open + selections kept (AC-8);
  loading + double-submit lock (AC-9); en/ar/tr/ku + RTL (AC-10); reasons sent as
  stable values (AC-13, verify request body); story pauses/resumes (AC-11);
  visual design conformance (AC-12); delete flow unaffected (AC-14).

## Rollback

- No commit is created at `/implement` (changes are uncommitted working-tree
  edits on `ticket/report-story`). To revert: `git checkout --` the five modified
  files and delete the new `ReportStoryModal.tsx` (or `git stash`/discard the
  branch). No data migration, no protected path, no config change — rollback is a
  clean working-tree restore with zero residual state.

## Out of scope

- Building/altering the backend report endpoint or moderation handling.
- Photo/attachment upload with the report.
- Reporting content other than stories; moderation dashboards/queues.
- Reporting rate-limit/abuse policy (platform edge).
- Category-bar scroll-arrow changes in `Navbar.tsx` (separate ticket).
