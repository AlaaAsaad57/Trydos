---
ticket: ui-migrations-7e-merge
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Review — ui-migrations-7e-merge

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-14, NFR-1..NFR-4, AC-1..AC-15, OQ-1..OQ-8 answered) and `plan.md` (12 steps, files to
change, integration surface, tests per AC, validation, rollback), with `research.md` for context.

**How the panel ran on this account.** The account owner forbids subagents and parallel agents. So the three
advisory lenses (senior, security, performance) were applied by the main agent, one after another, with each
lens's own instructions (`agents/senior-reviewer.md`, `security-reviewer.md`, `performance-reviewer.md`). The
same agent wrote the plan, so this panel is less independent than the framework intends. The CG-8 falsifier
check was also done by the main agent, not blind (see `comprehension.md > degraded`).

## Plan Summary

One real merge commit of `development` (`9517cb02b`) into `ticket/ui-migrations-7e-merge` cut from
`ui-migrations` (`246536cea`), with the `ui-migrations` side as the base of every conflict. Then small
follow-up commits: the splash debug parts and 5 unused modes removed (fix kept, `data-pw="login-stage"` added
to `AuthStage`); the email-code-before-save port, test first; the flag helper; the media preconnect on the
single origin; the preview-only words kept out of real pages; the test updates. Speed is measured before
and after.

## Risks

- `NewLoginWidget.tsx`: 12 conflict hunks on two structures; a lost line breaks every sign-in.
- The splash fix can fail without any error and shows only on a real iPhone with Safari 26.
- `AuthStage` is shared with the verify overlays and the session-expired widget.

## Assumptions

- The Vercel preview has `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (owner, OQ-3).
- The owner gives the OK to push the ticket branch for the preview checks (AC-2, AC-8 on a real iPhone).

## Open Questions

- none

## Panel Findings (advisory)

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| P-1 | senior | major | The splash fix was built and proven on `development`'s `/loginDemo` and `/demo`. On `ui-migrations` the real `/login` renders inside the `[lang]` root layout with `AppShell` (the bottom bar) and the screen mount; the fix's CSS names `.site-container`, `.main-content`, `.home-navbar` and the demo boxes, not those. A fixed box of the real shell at the bottom edge while the splash waits would bring back the white strip. The plan's WebKit check (Step 10) must look for any fixed full-width box at the bottom edge of the real `/login`, and the real iPhone check must happen on the preview. | AC-8, plan Step 10, `NewLoginDesign/SafariSplashGapLab.tsx` | mitigate — Step 10's WebKit check on the real `/login` also lists every fixed full-width box at the bottom edge while the splash waits (must be none); the real iPhone Safari 26 check runs on the preview before verify. |
| P-2 | senior | minor | `PREVIEW_ONLY_KEYS` hides `ORDER_KEYS` and `INTRO_KEYS` from the real pages. If a real screen already uses one of those words (for example "Select Your Region" or "Get Started"), it would show in English. Step 8 needs a grep of every real screen for each hidden key before the filter goes in. | plan Step 8, AC-15, `components/DemoApp/demoKeys.ts` | mitigate — before Step 8, grep every real screen and the real login for each `ORDER_KEYS` / `INTRO_KEYS` word; a word a real screen uses stays out of `PREVIEW_ONLY_KEYS`. |
| P-3 | senior | minor | AC-2's real sign-in and AC-8's iPhone check need a preview deploy, so the ticket branch must be pushed before `/wf:verify`, not only at `/wf:publish-pr`. The plan says "after the owner's OK to push"; the order should be explicit. | plan Step 10, AC-2, AC-8 | mitigate — the ticket branch is pushed (owner's OK at that moment) after Step 9 and before `/wf:verify`, so the preview exists for AC-2 and AC-8. |
| P-4 | senior | info | The merge commit alone still holds the debug menu and the old email behaviour until the follow-up commits; nobody should build a preview from the merge commit alone. | plan Steps 3–5 | accept — no preview is built from the merge commit alone. |
| P-5 | security | minor | The merge brings `server.mjs` with `GET /metrics` open in code; only an Nginx rule (`location = /metrics { deny all; }`) blocks it. Vercel does not run `server.mjs`, so the `ui-migrations` preview is not exposed, but a Docker deploy without that Nginx rule would publish runtime metrics. Already on `development`; note for the deploy docs. | FR-14, `server.mjs` | accept — Vercel does not run `server.mjs`; noted for the Docker deploy, not part of this ticket. |
| P-6 | security | info | `/api/proxy` now forwards a client-sent `x-request-id` / `x-correlation-id` to the backends as `X-Request-ID`. A client can set any value (log noise only; no auth meaning). Already on `development`. | FR-14, `app/api/proxy/route.ts` | accept — log noise only; already on `development`. |
| P-7 | security | info | Removing `?safariFix=` and the saved setting removes the only user-controlled input to the prepaint `<script>`; the script is a static string. No secret in `.env.server.example` (checked: only non-secret defaults). | AC-7 | accept. |
| P-8 | performance | minor | AC-15's "the login page grows only by the start flow's own parts" has no number. Set a budget at Step 1 (for example: the login page's JS after ≤ before + the size of the picker step and `previewSlides`), so verify can say pass or fail. | AC-15, plan Steps 1 and 11 | mitigate — at Step 1 the budget is fixed: the real login page's JS after ≤ before + the bytes of the picker step, `CountryPickerBody`, `CountryRow` and `previewSlides`; home's JS after ≤ before. |
| P-9 | performance | info | The in-flow mode makes the document tall and scrollable only while the splash waits, and its style tag is removed when the splash ends; no per-request or per-page cost on other pages. The preview-only word filter lowers every real page's payload. | Step 4, Step 8 | accept. |

## Decision

`APPROVED`

- Rationale: the owner passed the comprehension check 4/4 (`comprehension.md`, attempt 1) and chose `approved`. `plan.md` stays as written. The owner asked that the panel findings be closed; the gate may not edit `plan.md` (RV-11), so the fixes are the required follow-up actions below, binding on `/wf:implement`, which records each one in `implement.md`.

## Approvals

- Approver (owner): developer (self-approval), 2026-11-28

## ADR reference

- ADR: none

## Required Follow-up Actions

Binding on `/wf:implement` (owner, 2026-11-28). Each is recorded in `implement.md` with its evidence.

1. **P-1** — In Step 10, the WebKit check of the real `/login` with an iPhone Safari 26 user agent lists every element with `position: fixed` whose box touches the bottom edge of the window while the splash waits. The list must be empty (the AppShell bar and the screen mount included). Then the real iPhone check on the preview.
2. **P-2** — Before Step 8, `git grep` every real screen (`components/DemoApp1/screens/App*`, the screens in `APP_SCREEN_VIEWS`, `NewLoginDesign/`) for each word in `ORDER_KEYS` and `INTRO_KEYS`. Any word a real screen uses is left out of `PREVIEW_ONLY_KEYS`. The list of words checked goes in `implement.md`.
3. **P-3** — After Step 9, ask the owner for the OK to push `ticket/ui-migrations-7e-merge`, push it, and run the preview checks (AC-2, AC-8 on a real iPhone) before `/wf:verify`.
4. **P-8** — At Step 1, write the budget next to the before numbers: the real login page's JS after ≤ before + the bytes of the picker step, `CountryPickerBody`, `CountryRow` and `previewSlides`; the home page's JS after ≤ before. Step 11 says pass or fail against it.
