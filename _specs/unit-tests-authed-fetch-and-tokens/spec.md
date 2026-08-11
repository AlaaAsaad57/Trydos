---
ticket: unit-tests-authed-fetch-and-tokens
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Spec — unit-tests-authed-fetch-and-tokens

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Isolated tests for the server-side token plumbing.

## Business Goal

This code decides whether a shopper stays signed in. If it breaks, the failure
is not a broken feature — it is every shopper being logged out mid-action, or a
logged-in account being silently downgraded to a guest, or a logged-out session
coming back to life. None of that is currently covered by a single test.

The value is a safety net around five distinct recovery paths that today only
exist as comments, plus a written record of what the auth cookies are allowed to
be.

## User Story

> As a shopper who is already signed in, I want my request to keep working when
> my token is rejected, so that I am not silently logged out or shown an error in
> the middle of what I am doing.

## Functional Requirements

**FR-1 — A request carries the shopper's identity.** When an auth token is
present it is attached to the outgoing request; when there is none, the request
still goes out, without one.

**FR-2 — A rejected token is recovered from, and each recovery path is
distinct.** There are five outcomes after a rejection, and the tests must tell
them apart:

1. A logout is in progress → the rejection is returned untouched and no identity
   is minted or written.
2. The context cannot write cookies → the rejection is returned unchanged, and
   nothing single-use is spent.
3. A refresh credential exists → it is exchanged once, and the original request
   is retried once.
4. A verified shopper has no refresh credential → the rejection is returned; the
   account is never downgraded to a guest.
5. No refresh credential and not verified → a guest identity is created once,
   the previous identity's sub-service credentials are cleared, and the original
   request is retried once.

**FR-3 — Recovery never loops.** A rejection on the retry ends the flow. No path
retries more than once, and no path both refreshes and registers a guest.

**FR-4 — A failed recovery leaves the shopper as they were.** If creating a
guest identity fails, no existing credential is cleared or overwritten.

**FR-5 — Transport failures are retried on a bounded schedule.** Temporary
server responses and network errors are retried up to the configured limit and
then reported as a failure with the status preserved. Responses that are not
temporary are returned immediately, without retrying.

**FR-6 — Failures are reported.** A non-successful response and a transport
error each produce an error report carrying the status and the address, with the
response body bounded in length.

**FR-7 — Repeated identical work inside one request runs once**, or the ticket
records why that cannot be shown honestly.

**FR-8 — The auth cookie contract is written down and locked.** One cookie holds
the auth token for guest and signed-in shopper alike. The legacy device cookie is
never read and never written; it survives only in cleanup lists. Every cookie
holding a token or profile data is marked as unreadable by the browser.

**FR-9 — Cookie shape is asserted, not just cookie values.** The tests check how
each cookie is written — its lifetime, its same-site rule, its path, and whether
it is marked secure — not merely that a value survives a round trip.

**FR-10 — Each service gets its own credential.** The credential looked up for a
service is that service's own, and services with no credential get an empty one
rather than someone else's.

**FR-11 — Verified-shopper detection is exact and fails safe.** Placeholder phone
values written by guest flows do not count as verified, and any error while
reading the profile is treated as "not verified" rather than throwing.

**FR-12 — Traffic is routed by role.** A verified shopper's traffic and a guest's
traffic resolve to their respective backends, including for addresses that carry
a trailing dynamic segment or a query string.

**FR-13 — Nothing sensitive leaks outward.** Profile data prepared for the
browser has its tokens and flagged private fields removed, and any credential
written to a log is reduced to a hint that cannot be used.

**FR-14 — A defect found is reported, not repaired and not hidden.** This work
changes no behaviour. When a test shows the code is wrong, the defect is written
down with its location and the difference between what happens and what was
expected, and the test pins the behaviour as it is today so it cannot drift
further unnoticed. Making a failure disappear by weakening, deleting or skipping
a test is not an acceptable outcome.

## Non-Functional Requirements

- **No real input or output.** No network, no cache server, no search cluster, no
  real cookie writes. A request nobody wrote a reply for fails the test.
- **Deterministic.** No test depends on wall-clock waiting, on the order tests
  run in, or on state left by an earlier test.
- **Bounded.** Every test file carries its own explicit time limit, because the
  recovery paths are exactly where an endless loop would hide.
- **Quiet.** No token, refresh credential or one-time code value appears in test
  output, an assertion message, or a stored snapshot.
- **Honest.** A module that cannot be tested truthfully produces a written
  finding, not a test that asserts nothing.

## Constraints

- **The code under test is not changed.** Not to make it easier to test, not to
  fix a defect found along the way. A defect becomes a finding; fixing it is a
  separate ticket.
- **A broken behaviour is reported, never repaired here — and never hidden.**
  When a test fails because the code is genuinely wrong, there are exactly two
  correct moves: write the defect down as a finding, and make the test pin the
  behaviour the code has **today** so the defect is locked in place and cannot
  drift further unnoticed. Weakening a test until it passes, deleting it, or
  marking it skipped are all forbidden — they turn a discovered defect into a
  silent one. A pinned test must say in plain words that it pins broken
  behaviour, so nobody later reads it as the intended contract.
- **Findings are recorded where the work happened.** Every defect found while
  writing these tests is written into the implementation record, with its
  location, what the code does now, and what it was expected to do. The
  verification stage repeats them, so a finding cannot be lost between stages or
  live only in conversation.
- **The existing test harness is reused, not replaced.** The fixtures, stand-ins
  and fake network built by earlier phases are what this ticket builds on.
- **Isolated only.** No test in this ticket contacts a real backend. A suite that
  does is agreed separately and is not part of this work.
- **Test-only change.** Nothing outside the test surface is modified.

## Edge Cases

- A rejection arrives with no token in the first place.
- A rejection arrives while a logout is in flight.
- A rejection arrives during a pure page render, where cookies cannot be written.
- The refresh exchange reports failure, or reports success without a usable
  credential.
- A verified shopper's session predates refresh credentials entirely.
- Creating a guest identity succeeds but returns no credential.
- Creating a guest identity returns a credential but no profile and no refresh
  credential.
- The address being called carries a query string, or ends in a dynamic segment.
- A stored profile value is not valid encoded data.
- A phone value is absent, null, the number zero, the text "0", empty, or only
  spaces.
- A credential is shorter than the length the masking rule assumes.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Not protected.** `CLAUDE.md` is the authoritative contract and its protected runtime list does not include these two areas; the roadmap's longer list is stale. No protected-path exception applies and no protected-path statement is required at verify. Where test files physically sit is an approach decision. | Constraints; `/plan` places the files |
| OQ-2 | **New criteria, covering all five outcomes.** The roadmap's single criterion describes one branch of five and is out of date. Testing only it would leave the logout guard, the writability probe, the refresh path and the verified-shopper guard uncovered. | FR-2, FR-3, AC-3..AC-9 |
| OQ-3 | **The refresh exchange stays out of scope as code under test**, and gets its own ticket. Its *effect* on the recovery flow is in scope: the tests must show that a successful exchange leads to exactly one retry and that a failed one does not fall through to guest creation. | FR-2, AC-6, AC-7; Out of Scope |
| OQ-4 | **Yes — the harness may be extended.** A stand-in is a test file, not code under test, so the no-change constraint does not apply to it. Without the extension two requirements cannot be expressed at all. It is shared with other phases, so the extension must add capability and not change what existing callers already rely on. | Constraints, FR-9, NFR |
| OQ-5 | **Dropped as written, replaced.** No token parsing exists in either area, so "a valid, an expired and a malformed token" has no behaviour behind it. The intent — that the cookie contract is pinned — is kept and expressed as cookie name, cookie shape and reachability rules instead. | FR-8, FR-9, AC-13..AC-15 |
| OQ-6 | **`logic-change`.** The profile the roadmap names does not exist in this repository's configuration. `logic-change` requires lint, types and the unit tests, which is what this ticket needs. `/plan` records it in its validation section. | `/plan` validation strategy |
| OQ-7 | **Deferred to `/plan`.** Whether the missing backend addresses are added as obviously fake values or matched as-is is a choice about how the fake network is wired, and it touches a shared configuration file. | Open Questions |
| OQ-8 | **Findings only — no code change.** The three findings (the backing technology named in identifiers, comments and a non-production log; the unused parsing library import) are recorded and reported. Fixing any of them is a separate ticket. | Out of Scope; AC-19 |
| OQ-9 | **Deferred to `/plan`.** How the retry schedule is made instant, and the exact time limit each file carries, are approach decisions. The requirement that they be deterministic and bounded is fixed here. | Open Questions; NFR |
| OQ-10 | **In scope, with an honest fallback.** The per-request memoisation must either be shown to collapse repeated work, or the ticket records in writing why that cannot be demonstrated outside a render pass. A test that asserts nothing is not acceptable. | FR-7, AC-12 |

## Open Questions

- **OQ-7** — Are obviously fake backend addresses added to the shared test
  settings, or does the fake network match the address exactly as the code builds
  it today? Deferred to `/plan`.
- **OQ-9** — How is the retry schedule made instant, and what explicit time limit
  does each test file carry? Deferred to `/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A successful call carries the shopper's token, and the successful response is returned unchanged. | FR-1 |
| AC-2 | With no token stored, the request still goes out and carries no identity header. | FR-1 |
| AC-3 | A rejection while a logout is in flight is returned untouched: no identity is created and no cookie is written. | FR-2 |
| AC-4 | A rejection in a context that cannot write cookies is returned unchanged, and no refresh credential is spent. | FR-2 |
| AC-5 | A rejection with a refresh credential present causes exactly one exchange and exactly one retry, and never creates a guest identity. | FR-2, FR-3 |
| AC-6 | When the exchange does not succeed, the original rejection is returned and no guest identity is created. | FR-2, FR-3 |
| AC-7 | A verified shopper with no refresh credential gets the rejection back; their account is never replaced by a guest. | FR-2 |
| AC-8 | A guest with no refresh credential gets exactly one guest identity created, the previous identity's sub-service credentials cleared, the new credentials and profile stored, and exactly one retry. | FR-2, FR-3 |
| AC-9 | A rejection on the retry ends the flow — no second recovery attempt and no recursion. | FR-3 |
| AC-10 | When creating a guest identity fails or returns no credential, no existing cookie is cleared or overwritten. | FR-4 |
| AC-11 | Temporary responses and network errors are retried up to the limit and then reported with the status preserved; a non-temporary response is returned immediately with no retry, and every failure produces an error report carrying status, address and a length-bounded body. | FR-5, FR-6 |
| AC-12 | Repeated identical work inside one request runs once — or the ticket records, in writing, why that cannot be demonstrated honestly. | FR-7 |
| AC-13 | One cookie holds the auth token for guest and signed-in shopper alike; the legacy device cookie is never read and never written, appearing only in cleanup lists. | FR-8 |
| AC-14 | Every cookie holding a token or profile data is marked unreadable by the browser. | FR-8 |
| AC-15 | Each cookie's lifetime, same-site rule, path and secure marking are asserted, including that the three lifetimes differ by purpose and that the secure marking depends on the environment. | FR-9 |
| AC-16 | Each service's credential lookup returns that service's own credential, and a service with none returns an empty value rather than another service's. | FR-10 |
| AC-17 | Absent, null, zero, "0", empty and whitespace-only phone values are all treated as not verified, and an error while reading the profile is treated as not verified rather than thrown. | FR-11 |
| AC-18 | Verified and guest traffic resolve to their respective backends, including for addresses carrying a query string or ending in a dynamic segment. | FR-12 |
| AC-19 | Profile data prepared for the browser carries no tokens and none of the flagged private fields, and a credential written to a log is reduced to an unusable hint — including when it is shorter than the masking rule assumes. Findings recorded, no code changed. | FR-13, OQ-8 |
| AC-20 | No behaviour of the code under test is changed by this ticket. Every defect found is written into the implementation record with its location, what the code does now, and what was expected; the matching test pins today's behaviour and says in plain words that it does so. No test is weakened, deleted or skipped to make a failure go away. | FR-14 |

## Out of Scope

- **The refresh exchange itself** as code under test. Its own ticket.
- **Everything after this ticket in the sign-in journey** — the client-side
  request helper, one-time-code locks and identity, the auth service and its
  store slice, the auth routes, and the sign-in screens. Each stays its own
  ticket, in roadmap order.
- **Any test that contacts a real backend.** Agreed in principle, deferred to its
  own ticket. The standing "no real input or output" rule is unchanged by this
  work.
- **Fixing the recorded findings** — the backing technology named in identifiers,
  comments and a non-production log; the unused parsing library import. Recorded
  and reported here; fixed elsewhere.
- **Any change to the code under test**, including refactoring for testability.
- **Token parsing tests**, because no token parsing exists to test (OQ-5).
- **Repo-wide coverage targets.** This ticket is judged by the criteria above,
  not by a coverage number.
