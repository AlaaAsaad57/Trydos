---
ticket: unit-tests-authed-fetch-and-tokens
stage: intake
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Intake — unit-tests-authed-fetch-and-tokens

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unit-tests-authed-fetch-and-tokens`. No ClickUp task and no GitHub issue. The
source is the repository's own test roadmap, `docs/testing/UNIT_TEST_ROADMAP.md`,
Journey 2 ("Sign in and stay signed in"), phases 5 and 6.

## Ticket Summary

Write isolated unit tests for the server-side token plumbing: how a server
request gets an auth token, what happens when that token is rejected, and how
the token and its cookies are read, written and parsed. This covers roadmap
phase 5 (`serverRequests/HandleAuthedFetch.ts`, `ServerFetch.tsx`,
`requestDedup.ts`) and phase 6 (`utils/cookies/cookie-manager.ts`,
`utils/server/tokenManager.ts`) — 1,161 lines in five files.

## Ticket Metadata

- id / slug: `unit-tests-authed-fetch-and-tokens`
- title: Unit tests for the server authed fetch, cookies and token manager
- owner: developer
- created: 2026-08-11
- links: none

## User Story

> As a shopper who is already signed in, I want my request to keep working when
> my token is rejected, so that I am not silently logged out or shown an error
> in the middle of what I am doing.

## Scope

**In scope — roadmap phase 5**

| File | Lines |
|---|---|
| `serverRequests/HandleAuthedFetch.ts` | 191 |
| `serverRequests/ServerFetch.tsx` | 184 |
| `serverRequests/requestDedup.ts` | 32 |

**In scope — roadmap phase 6**

| File | Lines |
|---|---|
| `utils/cookies/cookie-manager.ts` | 315 |
| `utils/server/tokenManager.ts` | 439 |

**Out of scope, decided at intake**

- Roadmap phases 7–11 (client `fetchData`, OTP locks and refresh, the auth
  service and store slice, the `app/api/auth/**` routes, the `components/Login`
  screens). The owner first asked for all of Journey 2 in one ticket, then cut it
  back to phases 5 and 6. The rest stay as their own tickets, in roadmap order.
- **Any test that touches a real backend.** A live suite against the staging
  backend is agreed in principle and **deferred to its own ticket**. Everything
  here is isolated, so roadmap rule 5 ("no test performs real I/O") stands
  unchanged and is not amended by this ticket.

## Notes carried in from the request

- **Both target folders are protected paths.** `serverRequests/**` and
  `utils/cookies/**` both match a protected glob. Test files therefore go in the
  `tests/` mirror, not next to the code (roadmap rule 2). No file inside either
  protected folder may be created or changed.
- **Tests must not change the code under test** (roadmap rule 4). A module that
  resists testing produces a finding in this ticket, not a refactor inside it.
- One such finding is already known: `serverRequests/HandleAuthedFetch.ts:139`
  carries a comment that names the backend technology, which the stack-agnostic
  naming rule forbids. Record it; do not fix it here.
- The retry path is where an endless loop would hide, so the tests need an
  explicit time limit rather than the default one.

## Acceptance Criteria Presence Check

- Present? yes
- Notes: draft criteria exist in the roadmap for phase 5 (a 200 passes through
  with the token attached; a 401 causes exactly one guest registration and
  exactly one retry; a 401 on the retry gives up instead of recursing; cookie
  writes quietly do nothing during pure render) and for phase 6 (assert cookie
  names, `HttpOnly`, expiry and `SameSite`; parse a valid, an expired and a
  malformed token; `MARKET-TOKEN` is the single auth cookie for guest and
  signed-in alike, and `DEVICE-TOKEN` appears only in logout cleanup lists).
  **Accepted as written** by the owner. Each one names an observable behaviour
  and can be checked, so they are testable as they stand. `/wf:spec` may add
  criteria if reading the five files turns up behaviour the roadmap did not
  name; anything added is approved at the review gate.

## Test Cases Presence Check

- Present? no
- Notes: the roadmap names the behaviours to protect, but not test cases written
  as inputs and expected results. This does not hold the ticket back. Writing
  test cases is the job of `/wf:spec`, the next stage but one, and the criteria
  above are specific enough to write them from.

## Missing Information

Both questions raised at intake are now answered. Nothing is outstanding.

- **Are the draft acceptance criteria the ones to hold this ticket to?**
  Yes, accepted as written (see the check above).
- **One comprehension gate for both phases, or one each?**
  One gate for both. The `wf` commands are built around a single gate per
  ticket, so splitting the gate would work against the tooling. The quiz must
  therefore cover both halves — the retry logic in phase 5 and the cookie and
  token parsing in phase 6 — and not just one of them.

## Readiness Status

`READY`

- Justification: the request is qualified. The goal is clear (protect the
  server-side token plumbing with isolated tests), the five target files and
  their line counts are known, what is in and out of scope is written down, the
  acceptance criteria are present and testable, and both open questions are
  answered. The test harness this work depends on already exists and is proved
  (roadmap phases 1–3, closed). Nothing is blocking read-only research.
