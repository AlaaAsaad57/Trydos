---
ticket: unit-tests-auth-service
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-16
links:
  clickup:
  github:
---

# Intake — unit-tests-auth-service

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-auth-service` — Phase 9 of the unit test roadmap
(`docs/testing/UNIT_TEST_ROADMAP.md`, Journey 2 — "Sign in and stay signed in").
No ClickUp task and no GitHub issue.

## Ticket Summary

Write unit tests for the client-side auth service and the auth store slice: the
OTP send and verify calls, the session and expiry handling, and the profile
updates — and, for each of them, **the dispatch into the store**, not only the
returned value. This is the last service-level phase of Journey 2; phases 4
through 8 are merged and closed.

## Ticket Metadata

- id / slug: `unit-tests-auth-service`
- title: Unit tests — auth service and auth store
- owner: developer
- created: 2026-08-16
- links: none

## User Story

> As a shopper signing in, I want the app to record my session and my profile
> correctly after each auth step, so that I am not left half signed-in, shown a
> stale profile, or logged out while I am still using the app.

## Modules in scope

| Module | Lines | Coverage today |
|---|---|---|
| `services/auth.ts` | 1096 | one method only — see below |
| `store/auth/reducer.tsx` | 224 | not loaded by any test |

**The whole of `services/auth.ts` is in scope** (owner's decision — one ticket,
not a split). Its methods are `SendOtp`, `VerifyOtp`, `VerifyOtpForUpdatePhone`,
`UpdateName`, `cancelAuth`, `NotifyForProducts`, `getUser`, `validateFCMToken`,
`UserID`, `User`, `ConfigurePhoto`, `RefreshSession`, `ExpiredUser`,
`_getLocale`, `UpdateProfile`, `getImageForCookie`, `uploadToMediaServer`,
`UpdateProfileImage`.

**Out of scope: logout and guest registration.** The roadmap describes this
phase as "login, logout, session, guest, OTP send/resend/verify", but there is no
logout or guest-register method in this file — those paths live in
`app/api/auth/**` (Phase 10) and in `serverRequests/` (Phase 5/6, closed). The
ticket follows the file, not the roadmap's wording. The roadmap records
`services/auth.ts` at 1085 lines; it is 1096 today.

`services/auth.ts` is a protected glob, so this ticket is 🔒: tests go in the
`tests/services/` mirror, `plan.md` must say so, and `verify.md` must carry the
protected-path statement (TR-3). `store/index.ts` is protected too — the roadmap
says to build the auth slice in isolation so the phase never touches it.

## What already exists (so research does not duplicate it)

`tests/services/authRefreshSession.test.ts` (165 lines) covers `RefreshSession`
dedup only: concurrent 401s on one service share a single exchange; `market` and
`market-dashboard` share one exchange; the key is released so a later 401 can
refresh again; nothing refreshes while logging out. It stubs the whole client
stack that `services/auth.ts` drags in. Everything else in the file is untested.

That file is **left as it is**. New tests go in sibling files under
`tests/services/`. `RefreshSession` dedup is already covered and must not be
tested twice; anything else `RefreshSession` does is still open.

## Acceptance Criteria Presence Check

- Present? no
- Notes: The roadmap names the modules and one standing requirement ("assert the
  dispatch into the store, not just the return value") but states no acceptance
  criteria. They are written at `/spec`. Normal for a roadmap phase; does not
  block research.

## Test Cases Presence Check

- Present? no
- Notes: The roadmap's standing rules apply — no real I/O (rule 5), and a module
  that resists testing produces a finding rather than a refactor (rule 4).
  Concrete cases are written at `/spec`.

## Missing Information

None. The three open questions are decided by the owner:

1. **Scope follows the file, not the roadmap wording.** Cover
   `services/auth.ts` and `store/auth/reducer.tsx`. Logout, guest registration
   and the auth API routes stay in Phase 10.
2. **One ticket, the whole file.** No sign-in / profile split. The profile
   methods are covered here alongside the session ones.
3. **`authRefreshSession.test.ts` stays untouched.** New work goes in sibling
   files; the spec states that `RefreshSession` dedup is already covered.

One documentation gap is recorded, not fixed here: the roadmap's Phase 9 row
still says "login, logout" and 1085 lines, and its status markers for phases 4–8
are stale. Correcting the roadmap is a separate edit, not part of this ticket's
scope.

## Readiness Status

`READY`

- Justification: One focused outcome — unit tests for two named modules on the
  sign-in path. Both exist, are committed, and nothing else is touching them
  (working tree clean on `develop`). The scope questions are decided, so
  `/research` starts against a settled target list. Acceptance criteria and test
  cases are absent, which is expected at intake for a roadmap phase; they are
  the output of `/spec`.
