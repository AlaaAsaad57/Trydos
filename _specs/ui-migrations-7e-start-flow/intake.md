---
ticket: ui-migrations-7e-start-flow
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Intake — ui-migrations-7e-start-flow

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- Slug: `ui-migrations-7e-start-flow`
- Source: `UI-MIGRATION-PLAN.md` on `ui-migrations`, section "Stage 7e", Steps 4 and 5
  (at commit `a4e31b857`, the merge of PR #148).
- No ClickUp task. No GitHub issue.
- Comes after: `ui-migrations-7e-merge` (part 1, completed, merged as PR #148).

## Ticket Summary

Part 2 of 3 of Stage 7e. Part 1 brought the `/demo` code of the start flow and of
the sign-in request sheet into `ui-migrations`. This ticket makes them real:

- **Step 4 — the start flow.** Start animation → country picker → Quick Preview →
  Get Started. The new flow replaces `utils/PopupCountry.tsx` where that popup
  shows now. It uses the real country list, the real pick action (cookies and the
  move to the new `/<country>-<lang>/` URL) and the real login of Stage 2.
- **Step 5 — the sign-in request sheet.** A guest sees it 5 s after a page shows,
  once per page load. "Get Started" opens the real login and comes back to the
  same page. "Later", the dimmed page and a drag down close it.

## Ticket Metadata

- id / slug: `ui-migrations-7e-start-flow`
- title: Stage 7e part 2: the start flow (country picker, Quick Preview) and the guest sign-in request sheet
- owner: developer
- created: 2026-11-28
- links: none

## User Story

> As the owner of the UI migration, I want the start flow and the sign-in request
> sheet that the designer approved on `/demo` to work in the real app with real
> data and real actions, so that a new visitor picks a country and a guest is asked
> to sign in with the new design, and the old country popup can go.

## Scope of this ticket (from the plan, Stage 7e)

- **Step 4** — boards `Ramaaz pay signin – 14`, `– 16`, `– 15`, the Quick Preview,
  Get Started. Real country list (`components/Home/Init.tsx`, `getCountries`, with
  its load error and retry). Real pick (`setLocaizationCookies`, the URL move, the
  old events). Shows where `PopupCountry` shows now (`shouldShowBluredInfo`). Bots
  never see it, and the page HTML renders under it. Get Started opens the real
  login; "Later" opens the page. Delete `PopupCountry` only when nothing else uses
  it (D-6). The splash gap fix stays on the real `/login` (checked in part 1).
- **Step 5** — board `Sign In request`. Guest only, tested by the phone
  (`isValidPhone`), not by `auth.UserID()`. 5 s after the page shows, once per page
  load; waits while another sheet is open or the shopper types; checks again every
  second. Get Started opens the real login and returns to the same page.

**Not in this ticket:** Step 6 (the orders screens) — part 3, its own ticket.

**Rules that apply** (plan, S7e-1 to S7e-9): the real screens look and move exactly
as `/demo` on `development`; real data, or "Soon available" with the UI kept; no
designed part removed; shipping code never imports `/demo` data files; the proof
compares with `/demo` at 3 phone sizes, in Chromium and WebKit, in `en` and `ar`;
skeletons, RTL, old events only, words in all three translation files; speed as
now, measured before and after on a production build, with no cache as the fix
(S7e-9); the plan's test rule of 2026-11-04.

## Acceptance Criteria Presence Check

- Present? Partly.
- Notes: the plan's Steps 4 and 5 name the boards, the code, the real data and the
  real actions. They are not yet testable `AC-n` lines. The spec stage writes them.

## Test Cases Presence Check

- Present? No.
- Notes: the plan's rule of 2026-11-04 says no new unit tests in the migration, and
  the full unit suite runs in CI. Tests that exist for `PopupCountry`,
  `NewLoginWidget` and the demo shell may go stale when the popup is replaced. The
  plan stage must say which tests change and why.

## Workflow Type Check

- Is the goal to *understand* something that already exists? No.
- Is the goal to *choose between options*? No. The owner already chose (plan Stage 7e, 2026-11-28).
- Does a command reproduce behaviour contradicting a *sourced* expectation? No. Both branches are staging; there is no open incident.
- Is the change to make already known, leaving only building it? Yes.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

**Base branch exception** (plan S7e-5, the owner's choice on 2026-11-28): the repo
default base branch is `development`. For this ticket, `implement` cuts
`ticket/ui-migrations-7e-start-flow` from `ui-migrations`, and `/wf:publish-pr`
opens the PR against `ui-migrations`.

## Missing Information

These do not block the start. The defaults below apply until the owner answers
("Open for the owner" in the plan):

- **Where the start flow shows** — default: only where `PopupCountry` shows now,
  not on every load as on `/demo`.
- **How the login opens from the start flow and the sign-in sheet** — default: as a
  layer over the page, as on `/demo` (S7e-1). Every other opener keeps
  `/[lang]/login?next=` (D-11).

The research stage answers these:

- Every place that renders or reads `PopupCountry` and `shouldShowBluredInfo`, and
  every test that covers them.
- How the login layer of `/demo` maps onto the real Stage 2 login (send code,
  verify, the 3-wrong-codes lock, resend, name, the return path, events).
- How a bot is detected on the client today, so the start flow never shows to one.
- Which `/demo` parts (`CountryPickerBody`, `SignInRequestSheet`, `SignInSlides`,
  `previewSlides.tsx`) read `/demo` data files and need a plain-data split (S7e-6).
- The speed numbers before the change (S7e-9) for the pages the flow touches.

## Readiness Status

`READY`

- Justification: the owner approved the plan's Stage 7e and asked to start round 2
  (2026-11-28). Part 1 is merged into `ui-migrations` (PR #148) and `development`
  has no newer commit than `9517cb02b`. Scope, boards, real sources and rules are
  written down. The two owner questions have written defaults; the rest are
  research questions.
