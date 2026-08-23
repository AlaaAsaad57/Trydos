---
ticket: unit-tests-api-auth-routes
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Intake — unit-tests-api-auth-routes

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-api-auth-routes` — Phase 10 of `docs/testing/UNIT_TEST_ROADMAP.md`
(journey 2, "Sign in and stay signed in"). No ClickUp task and no GitHub issue.

## Ticket Summary

Write unit tests for the auth route handlers under `app/api/auth/` — `login`,
`logout`, `refresh`, `clear-tokens`, `me`, `update-user`, `register-device`,
`wallet-token`, `expire` — and for the hard block on `send_otp` in
`app/api/proxy/route.ts`. None of these handlers is covered by a test today.
They are the last uncovered part of the sign-in journey: every other phase of
journey 2 is closed.

## Ticket Metadata

- id / slug: `unit-tests-api-auth-routes`
- title: Phase 10 — unit tests for the auth API routes
- owner: developer
- created: 2026-08-17
- links: none

## User Story

> As the owner of this codebase, I want the auth route handlers covered by unit
> tests, so that when the live suite goes red on sign-in I can tell whether our
> code broke or the backend did.

## Why now

This ticket blocks the live test roadmap (`docs/testing/LIVE_TEST_ROADMAP.md`).
Live phases 5–8 drive these exact handlers against staging. Without unit tests
here, a red live run cannot be attributed to either side, which is the whole
reason the two suites are kept apart.

## Scope

In scope, from the roadmap's phase 10 list:

- `app/api/auth/` — `login`, `logout`, `refresh`, `clear-tokens`, `me`,
  `update-user`, `register-device`, `wallet-token`, `expire`
- `app/api/proxy/route.ts` — the hard block on `send_otp`

Out of scope, decided at intake:

- `app/api/auth/simulate/route.ts`. It is not in the roadmap's phase 10 list.
  The live harness spine (live roadmap phase 3) forges an expired session with
  it, and it is recorded security finding 1 in that roadmap, so it gets its own
  ticket instead of being folded into this one.

## Known constraints

- `app/api/auth/**` is a protected path in the unit roadmap's glob list, so test
  files go in the `tests/` mirror of the source path (roadmap rule 2).
- Roadmap rule 4: tests never change the code under test. A handler that resists
  testing produces a finding, not a refactor.
- Roadmap rule 5: no real I/O — no network, no Redis, no real cookie writes.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the roadmap gives three draft criteria for this phase — logout clears
  **every** cookie in the cleanup list, `send_otp` is *blocked* rather than
  passed through, and no response body, header or error string names the backend
  technology. They are the right subjects and they are not yet testable criteria.
  Writing them is `/wf:spec`'s job in this workflow. What the ticket must end up
  proving is clear enough to qualify it: every handler in scope is executed by
  tests covering its refusal paths as well as its happy path, and no production
  code changes.

## Test Cases Presence Check

- Present? no
- Notes: this ticket's deliverable *is* tests, so its criteria and its test cases
  end up nearly the same list. They still get written down at `/wf:spec` before
  any test is written, rather than discovered while writing them. The behaviour
  to pin is readable from the ten files, so there is nothing to ask anyone.

## Missing Information

Both questions raised when this workspace was created are now answered. Nothing
is outstanding.

1. **Do nine handlers plus the proxy block fit one ticket?** Yes, as one focused
   outcome — "the auth route handlers are covered" — delivered as several test
   files. The ten files in scope are 1,415 lines together, and they are not
   evenly sized: `login` is 377, `proxy` 276 and `expire` 186, while `me` is 23
   and `wallet-token` is 16. The nearest precedent shipped as one ticket at a
   comparable size: `unit-tests-auth-service` covered `services/auth.ts` (1,085
   lines) and produced three test files. The roadmap's own closing rule still
   applies — if `/wf:research` finds the split lands mid-seam, it re-cuts the
   scope in that ticket rather than here.

2. **Can these handlers be loaded by a unit test at all?** Yes, and this is the
   question that could have killed the ticket, so it was checked rather than
   assumed. The four biggest handlers import only `next/headers`, `next/server`,
   `utils/cookies/cookie-manager`, `utils/endpointConfig`, `utils/fetch/Endpoints`,
   `utils/server/authRefresh`, `utils/server/tokenManager`,
   `utils/serverErrorReporter`, `utils/serviceTokens` and `utils/tinyUtils`.
   Nothing in that list opens a socket the way `ioredis` does, so none of the
   run-wide stand-ins in `tests/setup.ts` has to be lifted. Four of those
   dependencies — `cookie-manager`, `tokenManager`, `authRefresh` and
   `tinyUtils` — already have their own passing tests from earlier phases, and
   `tests/mocks/nextHeaders.ts` already exists for the cookie store. The outgoing
   call each handler makes is answered by msw, which is already the rule for the
   whole unit suite.

   Note this leaves one thing for `/wf:research` to read from the code rather
   than from a document: what `login` is expected to mint. The live roadmap says
   it fans out to five backends and writes about ten cookies. That number is
   worth pinning, and its source is the handler, not that page.

## Readiness Status

`READY`

- Justification: the request is qualified. All ten files exist and are named
  exactly, the reason each is worth testing is recorded, the scope boundary is
  decided and written down (`simulate` is out, with the reason), and the one
  question that could have made the ticket impossible — whether route handlers
  can be loaded under the run-wide stand-ins — is answered from the handlers'
  own import lists rather than assumed. It changes no production code, it is one
  focused outcome, and it needs no decision from anyone else. Acceptance criteria
  and test cases are absent by design at this stage: `/wf:spec` authors them, and
  the intended outcome above is specific enough for `/wf:research` to start.
