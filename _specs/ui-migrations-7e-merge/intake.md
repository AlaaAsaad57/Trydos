---
ticket: ui-migrations-7e-merge
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-11-28
links:
  clickup:
  github:
---

# Intake — ui-migrations-7e-merge

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- Slug: `ui-migrations-7e-merge`
- Source: `UI-MIGRATION-PLAN.md` on `ui-migrations`, section "Stage 7e" (commit `246536cea`).
- No ClickUp task. No GitHub issue.

## Ticket Summary

Part 1 of 3 of Stage 7e. Bring the 27 `development` commits since `ac30db094`
(up to `9517cb02b`, 2026-11-28) into `ui-migrations`. Solve the merge conflicts.
Check the fixes that come with the merge. Port one fix by hand. Remove the Safari
splash lab's debug parts on `ui-migrations`, but keep the splash fix.

## Ticket Metadata

- id / slug: `ui-migrations-7e-merge`
- title: Stage 7e part 1: merge development into ui-migrations, port the email fix, remove the splash debug menu
- owner: developer
- created: 2026-11-28
- links: none

## User Story

> As the owner of the UI migration, I want every change made on `development`
> since 2026-11-17 to be in `ui-migrations`, with the conflicts solved and the
> fixes working on the new-design screens, so that the next two Stage 7e tickets
> (the start flow and sign-in sheet; the orders screens) start from a branch that
> has all the approved designs and fixes.

## Scope of this ticket (from the plan, Stage 7e)

- **Step 1** — merge `development` (to `9517cb02b`) into `ui-migrations`. A test
  merge on 2026-11-28 found 9 files with conflicts and 1 file deleted on one
  side. The plan says how to solve each one.
- **Step 2** — check the fixes that come with the merge: `140b3aea9`,
  `60fd710af` (session expired in `fetchData`), `c2a6720e0` (the "order placed"
  push), `22de7f5e9` (the active pack on the old order details), `bfae3eb6e`
  (one media origin and its env variables), `0d93cd90a` / `490632f97` /
  `cc6f0f605` (Docker, observability), `38617d539` (docs).
- **Step 3** — port `b48a3e999` (ask for the email code before saving) into
  `components/DemoApp1/screens/PersonalInfoScreen.tsx`. The file it changed on
  `development` (`PersonalInfoForm.tsx`) is deleted on `ui-migrations`.
- **Step 7** — check the small shared changes on the real screens: Syria's row
  flag, `Sheet keepHeight`, `ListingParts keepLinks`, the slide translations.
- **S7e-4** — on `ui-migrations`, remove the splash lab's debug menu, rulers,
  badges and the hand mode switch (`?safariFix=` and the saved setting). Keep
  the fix Safari 26 gets by default.

**Not in this ticket:** Steps 4 and 5 (the start flow and the sign-in request
sheet as real screens) and Step 6 (the orders screens). Each is its own ticket
later. The merge brings their `/demo` code in; this ticket does not make them real.

**Rules that apply** (plan, S7e-1 to S7e-9): same design as `/demo` on
`development`; real data, or "Soon available" with the UI kept; no designed part
removed; shipping code never imports `/demo` data files; speed as now, with no
cache as the fix; the plan's test rule of 2026-11-04.

## Acceptance Criteria Presence Check

- Present? Partly.
- Notes: the plan's Stage 7e names each step, each commit and each conflict
  file with how to solve it. It does not yet say them as testable `AC-n` lines.
  The spec stage writes them.

## Test Cases Presence Check

- Present? No.
- Notes: the commits from `development` bring their own tests (for example
  `tests/utils/fetchData.test.ts`, `tests/public/firebaseMessagingSwTags.test.ts`,
  `tests/components/SafariSplashGapLab.test.tsx`), and they stay. The plan's rule
  of 2026-11-04 says no new unit tests in the migration, and the repo rule says
  every bug fix needs a test seen red first. The plan stage must say which rule
  each `AC-n` follows (Step 3 is a fix ported by hand).

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

**Base branch exception** (plan S7e-5, the owner's choice on 2026-11-28): the
repo default base branch is `development`. For this ticket, `implement` cuts
`ticket/ui-migrations-7e-merge` from `ui-migrations`, and `/wf:publish-pr` opens
the PR against `ui-migrations`.

## Missing Information

These do not block the start. The research stage answers them:

- The exact parts of the splash "default fix" that must stay after the debug
  parts go (S7e-4): the default mode, the `@layer utilities` CSS, `coverBottomY`,
  and what `scaling/AppScaler.tsx` and `scaling/Page.tsx` need.
- Whether the Vercel preview of `ui-migrations` has `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`
  set, now that `NEXT_PUBLIC_BASE_MEDIA_URL` and `NEXT_PUBLIC_BASE_VIDEO_MEDIA_URL`
  are gone (`bfae3eb6e`).
- Which test rule applies to the Step 3 port (see Test Cases above).

## Readiness Status

`READY`

- Justification: the owner approved the plan's Stage 7e and asked to start the
  workflow on it (2026-11-28). The scope, the source commits, the conflict files
  and the rules are written down. The open points above are research questions,
  not missing decisions.
