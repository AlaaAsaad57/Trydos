---
ticket: report-story
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-06-20
links:
  clickup:
  github:
---

# Research — report-story

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Replace the placeholder story-report confirmation with a real report flow: a
dedicated modal where a non-owner viewer selects one or more reasons (+ optional
details) and submits the report to the stories backend, with success/error
feedback.

## Current behaviour (as-is)

- `components/Home/Stories/StoryHolder.tsx`
  - A Report affordance already exists (lines ~124-144): shown only when
    `!isOwner`, it sets `showReportModal(true)` (icon `ReportOrderItemIcon.svg`,
    `data-cy="report-story-icon"`, keyboard-accessible).
  - `showReportModal` currently renders the generic
    `ConfirmModal` (yes/no dialog), and `handleReportStory` (lines ~81-97) is a
    **placeholder**: it shows a "Story reported successfully." toast **without
    calling any API** (the real call is commented out).
- `services/story.ts > reportStory(storyId)` (lines ~214-235) exists but is
  non-functional: `url: ""` (empty), body `{ story_id }` only, and it
  **swallows errors** (`return null` in `catch`) — so callers can't distinguish
  success from failure.

## Design language / UI inspiration

Source: `docs/DESIGN-LANGUAGE.md` (build-ready reference distilled from the
gitignored `xd-designs-for-inspreation/` artboards). There is **no dedicated
report-modal artboard** in that folder (it covers home/listing/PDP/order/profile
screens), so the modal must be composed from the app's established patterns. The
closest reference patterns:

- **Bottom sheet (§6.11):** the "Return Product (reasons + photo upload)" and
  "Action-about-product" sheets are the canonical reason-selection surface —
  white surface, top corners ~20-24px radius, centered grey grabber pill, over a
  `rgba(0,0,0,0.45)` scrim, swipe/scrim-to-dismiss.
- **Reason chips (§6.10 / §1):** *"Selection by outline + contrast, not
  checkboxes."* A reason row/chip is a grey-fill (`#f2f2f2`) pill with a dark
  label; **selected = primary 1px outline + faint tint**. Checkboxes/radios are
  explicitly avoided in this design system.
- **Buttons (§6.8):** primary CTA = full-width pill, **single primary token
  `#5b3fe0` (indigo)** solid, white `.semibold` `f-16`; **disabled = grey
  `#d9d9de`, identical geometry** (only the fill swaps). Cancel = secondary.
- **Inputs (§6.9):** the optional details field = floating-label card, white
  `15px` radius, 1px hairline (`#e6e6e6`), label `#505050` `f-12`–`f-14`,
  placeholder `#929191`, `(optional)` suffix in faint grey.
- **Type/colors/elevation (§2–§4, §10):** Quicksand (`font-sans`); text
  `#3c3c3c`/`#707070`/`#929191`; one shadow `0 3px 10px rgba(0,0,0,0.1)`;
  centered `f-16 .medium` title.
- **Intent color (§7.3):** *red = destructive/cancel/**report*** — applies to the
  **report icon/intent**, NOT generic primary buttons (red is reserved for
  brand/live/like/error/destructive).

### Gap between the prior (discarded) modal and the design language

The earlier `ReportStoryModal.tsx` used Tailwind `blue-500/600` accents and
**checkbox-style** square toggles. Both conflict with the design system: it
mandates the **single indigo primary token `#5b3fe0`** (never an ad-hoc blue) and
**outline+tint selection, not checkboxes**. The rebuild should adopt the
chip/outline pattern and the indigo primary token (or whatever the design team
confirms — see §2.4 primary-color reconciliation note).

## Relevant directories

- `components/Home/Stories/` — story viewer UI; `StoryHolder.tsx` owns the report
  trigger + modal mount. New `ReportStoryModal.tsx` would live here.
- `docs/DESIGN-LANGUAGE.md` — authoritative design tokens/components to mirror
  (read-only inspiration; gitignored artboards under `xd-designs-for-inspreation/`).
- `components/global/` — shared UI: `ConfirmModal.tsx` (current report dialog),
  `Spinner.tsx` (submit-loading indicator).
- `services/` — `story.ts` holds `reportStory` (the client business logic).
- `store/notifications/` — `showSuccessNotification` / `showErrorNotification`
  (user feedback).
- `public/translations/` — i18n string tables for ar/tr/ku.
- `utils/` — `fetchData.ts` (client fetch path), `Requests.ts` (request titles),
  `functions` (`translateFunction`).

## Relevant config files

- `utils/Requests.ts` — `REQUESTS_DATA.REPORT_STORY = { reqTitle: "REPORT_STORY",
  code: 123 }` is **already defined** (line ~183); reuse it.
- `public/translations/translations.{ar,tr,ku}.js` — flat `{ key: translation }`
  objects. English is **not** a table — `translateFunction` returns the key
  itself when no entry exists, so English strings come from the literal keys; new
  user-facing strings need entries in ar/tr/ku only.
- `next.config.ts` / `tsconfig.json` — path aliases (`components/*`, `services/*`,
  `store`, `utils/*`); no change expected.
- `proxy.ts` (middleware) — i18n/bot routing; not modified by this ticket.
- No `protected_paths` entry is involved (read only to confirm — none touched).

## Possibly affected services

- `services/story.ts > reportStory` — signature/behaviour change: accept selected
  reasons + details, target the real endpoint, and **propagate** errors so the UI
  can show a failure state.
- Client fetch path `utils/fetchData.ts` with `server: "stories"` — routes
  through `/api/proxy` (HttpOnly token injected server-side); POST is a mutating
  method (no auto-retry by design). No change needed to fetchData itself.
- Go backend (`NEXT_PUBLIC_GO_BACKEND_URL`, stories server) — must expose the
  report endpoint. Contract to confirm (see open questions).
- `store/notifications` — success/error toasts.

## Test / validation commands available

(No automated test suite — per CLAUDE.md the project relies on type-checking and
clean code. Commands are listed, not run.)

- `pnpm lint` — ESLint (permissive config).
- `pnpm build` — production build / full type-check (primary correctness gate).
- `pnpm knip` — unused files/exports/deps (e.g. confirm `ConfirmModal` is still
  used by the delete flow after the report flow stops using it).
- Manual UI verification (no Cypress dir present in tree): open a non-owner
  story, open modal, multi-select reasons, empty-submit validation, success
  toast + close, failure toast + stay open, RTL layout in ar/ku.

## Risks and unknowns

- **Backend contract unconfirmed** (highest risk): exact path, payload, and
  response shape for reporting a story. Prior (discarded) attempt used
  `POST /api/v1/stories/report_story` with `{ story_id, reasons, content }` — to
  be confirmed against the Go backend before/at `/plan`.
- **Reason value format:** send canonical English enum values vs. localized
  labels. Localized labels would make backend aggregation/moderation brittle;
  English enum is the safer assumption (confirm with backend).
- **Story id source:** `story.stories[currentStoryId]?.id` — must be resilient
  when `currentStoryId` is out of range (fallback to first story id).
- **Error handling regression:** current `reportStory` swallows errors; changing
  it to throw must be matched by a caller that catches and shows the error
  (otherwise an unhandled rejection / false success).
- **i18n drift:** missing ar/tr/ku entries would silently render English keys;
  all new strings must be added to the three tables.
- **z-index / portal stacking:** the modal must sit above the fullscreen story
  viewer; the story must pause while the modal is open (existing `isPaused`
  already keys off `showReportModal`).

## Open questions

- What is the confirmed report endpoint and request/response schema on the Go
  stories backend? (path, field names, success indicator)
- Are reasons submitted as fixed English enum values or localized text?
- Is the free-text "details" field required by the backend, optional, or capped
  (the prior attempt used optional, max 500 chars)?
- Should the canonical reason list match the prior set (Inappropriate Content,
  Harassment or Hate Speech, Spam or Scam, Intellectual Property Violation,
  Violence or Dangerous Content, Other), or is there a product-defined list?
- Should a user be able to report the same story more than once (idempotency /
  duplicate handling on the backend)?
- **Design — surface:** full-screen centered dialog (as the prior attempt) vs a
  bottom sheet with grabber (the design system's canonical reason-selection
  surface, §6.11). Recommendation: bottom sheet.
- **Design — primary token:** confirm the primary CTA color. The design language
  recommends a single indigo `#5b3fe0` (flagged NEW, §2.3/§2.4); the prior modal
  used Tailwind blue. Avoid inventing a new accent.
- **Design — submit intent color:** report is a flagging action; should Submit be
  the **primary indigo** CTA (consistent with reason-selection sheets) or a
  **destructive red** `#f85555` (per §7.3 report=destructive intent)? Needs a
  product/design decision at `/spec` or `/plan`.

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
