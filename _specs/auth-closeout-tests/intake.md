---
ticket: auth-closeout-tests
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Intake — auth-closeout-tests

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`auth-closeout-tests`. No ClickUp task and no GitHub issue. The source is
`docs/testing/AUTH_CLOSEOUT_PLAN.md` → items **C**, **D** and **E**.

## Ticket Summary

Close the auth journey at the two layers that need no application change: prove
live that a signed-in shopper survives a credential refused mid-action (**C**),
cover the five profile screens that decide things without a backend (**D**), and
guard the profile-mirror fix in the suite that actually gates a pull request
(**E**).

## Ticket Metadata

- id / slug: `auth-closeout-tests`
- title: Close the auth journey at unit and browser level, without touching
  application code
- owner: developer
- created: 2026-08-23
- links: —

## User Story

> As a signed-in shopper, I want a refused credential to be exchanged behind my
> back and my own details to be shown back to me correctly, so that I keep
> shopping as myself instead of being logged out mid-action or shown a change
> that did not take.

## What is in, and what is not

**In — three items, no application code:**

| Item | Deliverable |
|---|---|
| **C** | `tests/e2e/session-recovery.live.spec.ts` — a signed-in shopper survives a refused credential, and the page-load session tick does not undo it |
| **D** | unit component tests for the five untested profile targets |
| **E** | one field-parity guard on `UpdateProfile` in `tests/services/auth.profile.test.ts` |

**Out, and why:**

- **Item B** (`profile.scripted.spec.ts`) — it carries the one open application
  bug in the plan: the rollback mirror in `services/auth.ts` writes the **new**
  value after reverting to the old one. That fix must be proved red-first by the
  rollback case, so it belongs with the test that exercises it, in its own ticket
  and its own revert.
- **Item E's second guard** (the rollback mirror) — it can only be written after
  B has fixed the app, or it would be red for a defect that is knowingly open. It
  goes with B.
- **Item F** (profile picture and address, live) — additive live surface, and the
  address case needs a boundary call against `LIVE_TEST_ROADMAP.md` phase 15
  (`live-addresses`) before anyone writes it.

This is one outcome — *the auth journey is proved at unit and browser level* —
and it reverts as one commit set with no runtime risk, which is why B was kept
out rather than folded in.

## Acceptance Criteria Presence Check

- Present? **yes** — as source material, not yet as `AC-n`.
- Notes: the plan states each item's outcomes concretely. **C** lists five: sign
  in and note the user id; spoil the credential and act again; the exchange runs,
  the action completes and `whoAmI` reports the **same** user id; the stored pair
  changed and the storefront token is still `HttpOnly`; a real page-load tick of
  `utils/sessionManager.ts` / `components/SessionChecker.tsx` leaves it alone.
  **D** names five targets and, for each, what it decides without a backend.
  **E** names one test and what it reads. The `spec` stage turns these into `AC-n`
  with a test case each. Nothing is ambiguous enough to block.

## Test Cases Presence Check

- Present? **yes** — the deliverable *is* tests.
- Notes: one new live spec (`tests/e2e/`), five new component test files
  (`tests/components/`), and one added test in an existing unit file. **C** has to
  be live: it needs a real account, a real credential exchange against staging and
  a real page load. **D** must not be live: none of it needs a network, and the
  unit suite gates pull requests. **E** is unit for the same reason — the mirror
  fix is currently proved only by PROF-03, which lives in the browser suite and
  never runs on a PR.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the
  behaviour is understood; what is missing is proof.
- Is the goal to *choose between options*? **no** — the plan already decided the
  suites, the files and the cases.
- Is the change to make already known, leaving only building it? **yes**.

Source files are edited — new test files, and one shared-helper lift in
`tests/e2e/harness/session.ts` — and a branch is cut. `development` is right.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Nothing blocking. Five things the `research` stage must settle, all answerable
from the repository:

- **The shared session helpers.** `SIGNED_IN_STATE`, `forgetSavedSession`,
  `newLiveContext` and `handOnSession` are `const`s inside
  `tests/e2e/profile.live.spec.ts:133–231`, not exports. This is the first ticket
  after Item A to need a saved signed-in session, so the plan says it lifts all
  four into `tests/e2e/harness/session.ts` and repoints Item A at them. Confirm
  that is still true and that nothing has moved them.
- **Which action Item C "acts" with.** It needs an authenticated call that is safe
  to repeat and leaves nothing on the shared staging account. It must **not** be a
  profile write — those belong to Item A and would collide with it.
- **Whether the account is configured.** `TEST_ACCOUNT_PHONE` / `TEST_ACCOUNT_OTP`
  drive `hasShopperA`. An unconfigured account **skips**; it never fails. A backend
  answering wrongly is a different finding and stays red.
- **How much of Item D's five targets is really reachable in jsdom.** The plan
  gives line counts, not seams. `PersonalInfoForm.tsx` is 650 lines and opens
  global auth surfaces; research says which parts test cleanly and which need a
  mock that already exists in `tests/mocks/`.
- **What Item E's parity test can read.** It must assert the mirrored fields **by
  name** and drive the list from what the request body carried, so a field added
  later is covered the day it is added. Research confirms `marketUpdate` is
  reachable from a test without changing `services/auth.ts`. If it is not, that is
  a finding for the `plan` stage — not a licence to refactor the app inside a
  test-only ticket.

## Readiness Status

`READY`

- Justification: the request comes from a written plan that already names every
  file, suite, case and exclusion. Every helper Item C depends on exists on
  `develop` and was proved in use by Item A; the mocks Item D needs
  (`tests/mocks/device.ts`, `location.ts`, the `matchMedia` stand-in) were left
  behind by unit phase 11 for exactly this. No open question changes what gets
  built — only details the `research` stage reads out of the repository.

## Note for every later stage

`CLAUDE.md` now carries a repository-wide rule: **every bug is confirmed by a test
before it is fixed**, however it was found. If any of the three items turns up an
application defect, this ticket does **not** fix it. It records the finding, and
the fix goes to its own work item with a test that was seen red first — the same
reason Item B was kept out of this scope.
