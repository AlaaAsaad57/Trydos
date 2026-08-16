---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Intake — unit-tests-otp-locks-refresh-and-dedup

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-otp-locks-refresh-and-dedup` — Phase 8 of the unit test roadmap
(`docs/testing/UNIT_TEST_ROADMAP.md`, Journey 2 — "Sign in and stay signed in").
No ClickUp task and no GitHub issue yet.

## Ticket Summary

Write unit tests for the OTP lock and telemetry helpers, the auth refresh flow,
and the server request dedup helper. These five modules sit on the sign-in path
and have almost no test coverage today. This phase also absorbs
`serverRequests/requestDedup.ts`, which was named as a Phase 5 target but was
left untested; the roadmap now records it under Phase 8.

## Ticket Metadata

- id / slug: `unit-tests-otp-locks-refresh-and-dedup`
- title: Unit tests — OTP locks, auth refresh, and request dedup
- owner: developer
- created: 2026-08-15
- links: none

## User Story

> As a developer, I want the OTP lock, auth refresh and request dedup modules
> covered by unit tests, so that a change to the sign-in path cannot silently
> lock users out or send the same request twice.

## Modules in scope

| Module | Lines | Line coverage today |
|---|---|---|
| `utils/server/otpIdentity.ts` | 258 | not loaded by any test |
| `utils/otpLocks.ts` | 108 | 11.6% |
| `utils/server/otpTelemetry.ts` | 95 | not loaded by any test |
| `utils/server/authRefresh.ts` | 415 | 0% |
| `serverRequests/requestDedup.ts` | 32 | 0% |

`serverRequests/**` is a protected glob, so this ticket is 🔒: the dedup test
goes in the `tests/serverRequests/` mirror, `plan.md` must say so, and
`verify.md` must carry the protected-path statement (TR-3).

## What already exists (so research does not duplicate it)

`tests/services/authRefreshSession.test.ts` (committed 2026-08-15) covers four
cases of `RefreshSession` dedup: concurrent 401s on one service share a single
exchange; `market` and `market-dashboard` share one exchange; the key is
released so a later 401 can refresh again; nothing refreshes while logging out.
`RefreshSession` lives in `services/auth.ts`, which is **Phase 9**, not this
phase. It is named here because it is the closest neighbour to
`utils/server/authRefresh.ts` and the two must not be tested twice.

## Acceptance Criteria Presence Check

- Present? no
- Notes: The roadmap names the modules in scope but does not state acceptance
  criteria. They are written at `/spec`. This is normal for a roadmap phase and
  does not block research.

## Test Cases Presence Check

- Present? no
- Notes: The roadmap records two standing constraints for this phase — Redis is
  mocked and no test reaches a real instance (rule 5), and a module that resists
  testing produces a finding rather than a refactor (rule 4). Concrete cases are
  written at `/spec`.

## Missing Information

None. All three open questions from the first draft are resolved:

- **Is `authRefresh.ts` final?** Yes. The working tree is clean as of
  2026-08-15; the refresh-flow work is committed and pushed. The file is 415
  lines, not the 301 the roadmap recorded, and the roadmap is now corrected.
- **Does `requestDedup.ts` belong here?** Yes, by the owner's decision. It is
  removed from the Phase 5 row and added to the Phase 8 row.
- **Should the roadmap record the widened scope?** Yes, and it now does — the
  Phase 8 slug, targets, line counts and the 🔒 marker are updated, with a note
  saying why the file moved.

## Readiness Status

`READY`

- Justification: The request is one focused outcome — unit tests for five named
  modules on the sign-in path. Every module exists, is committed, and is not
  being changed by other work. The scope question that was open (requestDedup)
  is decided and written into the roadmap. Acceptance criteria and test cases
  are absent, which is expected at intake for a roadmap phase; they are the
  output of `/spec`, and the roadmap supplies enough definition for `/research`
  to start.
