---
ticket: unit-tests-otp-send-and-limiter
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-17
links:
  clickup:
  github:
---

# Intake — unit-tests-otp-send-and-limiter

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-otp-send-and-limiter` — no ClickUp task and no GitHub issue. The
request came from a review of what the auth flow still has no test for, held
against `docs/testing/UNIT_TEST_ROADMAP.md` (journey 2, "Sign in and stay signed
in").

## Ticket Summary

Two files in the OTP send path have no unit tests, and both are replaced by
stand-ins for the whole test run, so nothing has ever executed them:
`serverActions/sendOtp.ts` (the only way an OTP is ever sent, and the file that
decides the rate limit) and the `otpRateLimit` wrapper in
`serverRequests/radis/index.ts`. Add unit tests for both. Neither file appears in
any phase of the unit roadmap today, so the roadmap needs them recorded as well.

## Ticket Metadata

- id / slug: `unit-tests-otp-send-and-limiter`
- title: Unit tests — OTP send action and rate-limit wrapper
- owner: developer
- created: 2026-08-17
- links: none

## User Story

> As the owner of this codebase, I want the OTP send action and the rate-limit
> wrapper covered by unit tests, so that a change to how an OTP send is refused,
> counted, or reported is caught before it reaches staging.

## Acceptance Criteria Presence Check

- Present? no
- Notes: the request names the two files and the reason, not the criteria, and
  writing them is `/wf:spec`'s job in this workflow. What the ticket has to end
  up proving is clear enough to qualify it: both files are executed by tests
  covering their refusal paths as well as their happy paths, the run-wide
  stand-ins still hold for every other test file, and no production code changes
  (roadmap rule 4). `/wf:spec` turns that into numbered, testable criteria.

## Test Cases Presence Check

- Present? no
- Notes: this ticket's deliverable *is* tests, so its criteria and its test cases
  will be nearly the same list. They still get written down at `/wf:spec` before
  any test is written, rather than discovered while writing them. The behaviour
  to pin is readable from the two files, so there is nothing to ask anyone.

## Missing Information

All three questions raised at intake are now answered. Nothing is outstanding.

1. **Does the roadmap edit belong to this ticket?** Yes. Neither file sits in any
   phase of `docs/testing/UNIT_TEST_ROADMAP.md` today, so leaving the edit out
   would let the roadmap keep implying the OTP send path is accounted for. It is
   one short entry on the same subject, and it is declared in `plan.md` like any
   other touched file.

2. **May the real `serverActions/sendOtp.ts` be loaded in its own test file?**
   Yes, and it does not weaken the run-wide cut. `tests/setup.ts:41-52` registers
   both stand-ins with `vi.mock`, which a single file can override with
   `vi.unmock` for itself alone; every other file keeps the stand-in, and
   `tests/setup.test.tsx` still guards that it is registered. The action's test
   can therefore load the real action while keeping the `serverRequests/radis`
   stand-in, which is what lets it choose the limiter's reply. The limiter's own
   test does the same one level down: load the real `serverRequests/radis` and
   stand in for `ioredis`, which is the module that opens the socket. No
   production code is touched, so roadmap rule 4 holds.

3. **How far do the limiter tests go?** The wrapper only. Its own behaviour is
   testable without a Redis: it fails **open** when Redis is absent and when the
   call throws, it reads its four defaults from the environment (2 numbers per
   session, 4 sends per IP, a 1-hour window, a 60-second cooldown), it maps the
   script's status to `cooldown` / `session_cap` / `ip_cap`, and it falls back to
   the cooldown when no TTL comes back. The Lua script itself cannot be proven
   without a real Redis and is handed to the live suite — phase 6 of
   `docs/testing/LIVE_TEST_ROADMAP.md`, which already owns proving the limiter
   for real. `/wf:spec` states that boundary so it is not rediscovered later.

## Readiness Status

`READY`

- Justification: the request is qualified. Both files exist, both are named
  exactly, the reason they are worth testing is recorded, and the one question
  that could have killed the ticket — whether the real modules can be loaded at
  all under the run-wide stand-ins — is answered from `tests/setup.ts` rather
  than assumed. Scope is one focused outcome (two files in the same path, plus
  the roadmap entry that records them), it changes no production code, and it
  needs no decision from anyone else. Acceptance criteria and test cases are
  absent by design at this stage: `/wf:spec` authors them, and the intended
  outcome above is specific enough for `/wf:research` to start.
