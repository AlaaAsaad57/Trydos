---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: spec
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Spec — unit-tests-otp-locks-refresh-and-dedup

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit tests — OTP locks, auth refresh, and request dedup (roadmap Phase 8).

## Business Goal

Five modules on the sign-in path decide whether a user can ask for a code,
whether an expired session comes back to life, and whether the same server work
runs twice. Together they carry almost no test coverage today. A silent change
in any of them locks users out, spends a single-use credential twice, or leaks
work no one is watching — and nothing in the repository would fail. This ticket
makes that class of change fail loudly, at the cost of one test run.

## User Story

> As a developer, I want the OTP lock, auth refresh and request dedup modules
> covered by unit tests, so that a change to the sign-in path cannot silently
> lock users out or send the same request twice.

## Modules in scope (by role)

Named by the job they do, not by path — paths belong to `plan.md`.

1. **The client OTP lock store** — the browser-side, session-scoped mirror of the
   server's send limits (per-number cooldown, per-session distinct-number cap).
2. **The OTP identity resolver** — maps a request to the stable session and IP
   keys the server limiter counts on.
3. **The OTP telemetry recorder** — records every send attempt that reaches the
   server, with the real IP, to the product-analytics service.
4. **The session refresh helpers** — the three token-exchange helpers (shopper
   session, chat, stories) that turn a refresh credential into a fresh one.
5. **The per-request dedup helper** — collapses identical work inside a single
   server render to one execution.

## Functional Requirements

### FR-1 — The client OTP lock store

The suite proves the store's rules as a user meets them: a number stays locked
for the time it was locked for, a lock that has run out stops counting, the
distinct-number cap counts distinct numbers within a rolling window and no
longer, an already-counted number does not consume a second slot, and the whole
store is inert when there is no browser to store anything in.

### FR-2 — The OTP identity resolver

The suite proves that two requests from the same visitor produce the same
limiter keys, and two different visitors do not; that an address is reduced to a
stable identity before it is used as a key (so a rotating client address cannot
buy a fresh quota); that the durable visit identifier is minted once and given a
lifetime far longer than the session token; and that a request which cannot
store cookies still yields usable keys.

### FR-3 — The OTP identity resolver, guest-registration branch

The suite proves what happens when no user id exists yet and the caller asks for
one: the registration is attempted, the credentials it returns are stored, the
resolved id is reported, and a failure returns "no id" and is reported to error
tracking rather than thrown into the send flow.

### FR-4 — The OTP telemetry recorder

The suite proves the recorder is silent outside production and silent without an
analytics key; that when it does record, the attempt carries the outcome, the
block reason, the real address, the reduced address, the session key as the
identity, and the flags that stop a person profile and a location lookup being
created for a server address; and that the recorder never throws and never
delays the send, whatever the analytics service does.

### FR-5 — The session refresh helpers, outcome ladder

For each of the three helpers, the suite proves every outcome and, crucially,
what does **not** happen in each: refusal while a logout is in progress and no
exchange attempted; "no credential" when none is stored and no exchange
attempted; "invalid" on an upstream rejection **with the stored refresh
credential left untouched**; "unavailable" on a network failure, an unreadable
reply, or a reply missing half the pair; and "refreshed" on success.

### FR-6 — The session refresh helpers, what a success writes

On success, the suite proves both halves of the credential pair are stored
together, each with the lifetime its own kind gets; that the stored profile is
written **only** when the reply carries one, so a rotation can never downgrade a
verified shopper to a guest; and that a context which refuses cookie writes is
reported rather than passing silently.

### FR-7 — The session refresh helpers, routing and locale

The suite proves the shopper exchange goes to the backend that serves that user
— the core backend for a verified shopper, the gateway for a guest — and that
the shopper's current locale is sent with the exchange, with the documented
fallback when no locale is stored.

### FR-8 — The session refresh helpers, single-flight

For each of the three helpers, the suite proves that concurrent callers share a
single exchange (a single-use credential is spent once, not once per caller),
and that the flight is released so a later call can exchange again. It also
proves the three helpers do not share a flight with each other.

### FR-9 — The stories reply shape

The suite proves the stories exchange reads its credential pair from both reply
shapes the service is known to return — the flat one and the wrapped one — so a
change of shape on that side cannot silently stop refreshing.

### FR-10 — The per-request dedup helper

The suite proves that two callers with the same key produce one execution and
share one result; that different keys produce separate executions; and it pins
the current behaviour when the shared work fails, as a recorded finding rather
than a fix.

### FR-11 — Contract agreement with the existing suite

The outcome vocabulary these tests pin is the same vocabulary the existing
authed-fetch suite stands in for. Where they disagree, the disagreement is
recorded as a finding.

## Non-Functional Requirements

- **NFR-1 — No real I/O.** No test reaches a network, a cache server, a search
  cluster, a push service, or a real cookie jar. A call that escapes a stand-in
  must fail the test, not quietly succeed or quietly fail.
- **NFR-2 — No source change.** Nothing outside the test surface is modified. A
  module that resists testing produces a finding, not a refactor.
- **NFR-3 — Deterministic.** Anything ambient — the clock, stored browser state,
  environment values, module-level state held between calls — is pinned or reset,
  so the suite gives the same answer on any machine and in any order.
- **NFR-4 — A test that cannot fail is not a test.** Three code paths here
  swallow their own errors by design. Every test over such a path must be able to
  distinguish "it worked" from "it was silently skipped".
- **NFR-5 — Readable failures.** A failing test names the user-facing
  consequence, not the internal symbol.
- **NFR-6 — Runs in the existing gate.** The suite runs under the repository's
  single test command with no new command, no pipeline, and no extra service.

## Constraints

- **C-1** — One module in scope sits under a protected path. Its test lives in
  the mirror, `plan.md` says so, and `verify.md` carries the protected-path
  statement (TR-3).
- **C-2** — The test harness, fixtures and stand-ins built in earlier phases are
  reused. New shared helpers are added only where nothing existing fits.
- **C-3** — No test name, message or comment may name the technology behind a
  backend. Backends are referred to by role: the **core** backend and the
  **gateway**.
- **C-4** — The client lock store runs in a browser-like environment; the other
  four are server modules and run in a server-like one.
- **C-5** — The validation profile for this ticket is `logic-change` (lint,
  typecheck, unit tests). The roadmap's `tests-and-types` label is not a defined
  profile in this repository.
- **C-6** — Coverage reporting is already folder-wide; this ticket adds no
  coverage-configuration change.
- **C-7** — The client-side refresh dedup already covered by the existing
  services suite is a different mechanism at a different layer. It is not
  re-tested here.

## Edge Cases

- Stored browser state that is unreadable or was written by an older version.
- Browser storage that refuses to write (full, or disabled).
- A lock asked for with zero seconds, and a phone value that is empty or has no
  digits at all.
- A cooldown checked at the exact moment it expires.
- A distinct-number slot checked at the exact edge of the rolling window.
- An address given in compressed, bracketed, zoned, or v4-in-v6 form; and no
  address at all.
- A request that can read cookies but cannot write them.
- A reply that is not readable as data at all.
- A reply that carries one half of the credential pair but not the other.
- A reply that carries a fresh credential pair but no profile.
- An upstream rejection arriving while another caller's exchange is in flight.
- Shared work that fails after other callers have already joined it.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Deferred.** Where each test file sits is a path decision, and paths belong to the plan. The scope decision is settled here: the protected module's test goes in the mirror (C-1); the rest follow the repository's own convention, chosen once and applied to all of them — not per file by taste. | Open Questions (for `/plan`); C-1 |
| OQ-2 | **Deferred.** The dedup helper must be tested with a real deduplication boundary in place; how that boundary is supplied is an approach decision. The scope decision is settled here: the helper is tested for real, not skipped, and whatever is stood in must leave *our* helper as the thing under test (NFR-4). | Open Questions (for `/plan`); FR-10, AC-29, AC-30 |
| OQ-3 | **Partly answered.** In scope: changing the shared test configuration if that is the cleaner way to make the two server-only modules loadable. Out of scope: changing the modules themselves (NFR-2). The mechanism is deferred to `/plan`. | Open Questions (for `/plan`); NFR-2 |
| OQ-4 | **Answered: in scope.** The guest-registration branch is the only outbound call in the identity resolver and the only branch that stores credentials. Leaving it out would leave the riskiest path in that module uncovered. | FR-3; AC-12, AC-13, AC-14 |
| OQ-5 | **Answered: `logic-change`.** It is the profile that exists and it matches this work (lint, typecheck, unit tests). `tests-and-types` is not defined in this repository; the roadmap wording is stale and is not followed. | C-5 |
| OQ-6 | **Answered: one ticket.** The five modules are one journey slice and share one harness; splitting would double the setup for no gain. The protected-path obligations apply to the whole ticket (C-1). | C-1; Out of Scope |
| OQ-7 | **Answered: pin it.** The current behaviour when shared work fails is pinned by a test and recorded as a finding. It is not fixed here — fixing it is its own ticket (NFR-2). | FR-10; AC-30 |
| OQ-8 | **Answered: yes, by role.** Backend routing is asserted, because a wrong pick logs the shopper out. Test names and messages say "core backend" and "gateway" and never name a technology (C-3). | FR-7; AC-24, AC-34 |

## Open Questions

- **OQ-1** — Which location convention applies to the three non-protected server
  modules (colocated with the source, or the tests mirror), applied uniformly.
  `/plan` decides and names the paths.
- **OQ-2** — How the dedup test is given a real deduplication boundary, given
  that the framework's per-request memoization does nothing outside a real render.
  `/plan` decides.
- **OQ-3** — By what mechanism the two server-only modules become loadable in the
  test runner (shared configuration, or per-file stand-in). `/plan` decides.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A locked number reports its remaining time in whole seconds, and reports zero once the lock has run out. | FR-1 |
| AC-2 | A lock request with no digits, or with zero seconds, stores nothing. | FR-1 |
| AC-3 | A number already counted this session does not consume a second slot, and its first-seen time does not move. | FR-1 |
| AC-4 | The cap blocks a new number once the limit is reached, and never blocks a number already counted. | FR-1 |
| AC-5 | A number first seen longer ago than the rolling window no longer counts toward the cap. | FR-1 |
| AC-6 | Unreadable stored state, and storage that refuses to write, both leave the store usable rather than throwing. | FR-1 |
| AC-7 | With no browser present, every operation is inert and reports "not locked" / "not capped". | FR-1 |
| AC-8 | Two requests from the same visitor produce identical session and address keys; a different visitor produces different ones. | FR-2 |
| AC-9 | Addresses in compressed, bracketed, zoned, v4-in-v6 and absent forms all reduce to the documented stable identity. | FR-2 |
| AC-10 | A first-time visitor is given a durable visit identifier whose lifetime is far longer than the session token's. | FR-2 |
| AC-11 | A request that cannot store cookies still returns usable keys, and reports that the identifier was newly minted. | FR-2 |
| AC-12 | When asked to ensure a user id and none exists, registration is attempted once, the returned credentials and profile are stored, and the id is reported. | FR-3 |
| AC-13 | A failed or unreadable registration returns no id, is reported to error tracking, and does not throw. | FR-3 |
| AC-14 | Nothing is registered when a user id already exists, or when the caller did not ask for one. | FR-3 |
| AC-15 | The recorder does nothing outside production, and nothing without an analytics key. | FR-4 |
| AC-16 | A recorded attempt carries the outcome, the reason, the real address, the reduced address, the session key as the identity, and the flags that suppress profile creation and location lookup. | FR-4 |
| AC-17 | The recorder returns without waiting for the analytics service, and an analytics failure is swallowed rather than reaching the send flow. | FR-4, NFR-4 |
| AC-18 | Each helper returns "ineligible" during a logout and "no credential" when none is stored, and attempts no exchange in either case. | FR-5 |
| AC-19 | An upstream rejection returns "invalid" and leaves the stored refresh credential in place. | FR-5 |
| AC-20 | A network failure, an unreadable reply, and a reply missing half the pair each return "unavailable" and are reported to error tracking. | FR-5 |
| AC-21 | A successful exchange stores both halves of the pair together, each with its own lifetime, and returns the fresh session credential. | FR-6 |
| AC-22 | The stored profile is written only when the reply carries one, so a rotation never downgrades a verified shopper. | FR-6 |
| AC-23 | A context that refuses cookie writes is reported to error tracking rather than passing silently. | FR-6, NFR-4 |
| AC-24 | The shopper exchange goes to the core backend for a verified shopper and to the gateway for a guest. | FR-7 |
| AC-25 | The shopper's stored locale is sent with the exchange, and the documented fallback is used when none is stored. | FR-7 |
| AC-26 | Concurrent callers of one helper share a single exchange, and a later call exchanges again. | FR-8 |
| AC-27 | The three helpers never share an exchange with one another. | FR-8 |
| AC-28 | The stories exchange reads its credential pair from both the flat and the wrapped reply shape. | FR-9 |
| AC-29 | Two callers with the same key cause one execution and receive the same result; different keys cause separate executions. | FR-10 |
| AC-30 | The current behaviour when shared work fails is pinned by a test and written up as a finding, with no change to the helper. | FR-10, NFR-2 |
| AC-31 | No test performs real I/O, and a call that escapes a stand-in fails the test rather than passing quietly. | NFR-1, NFR-4 |
| AC-32 | The suite passes repeatably, independent of machine clock, execution order and leftover state. | NFR-3 |
| AC-33 | No file outside the test surface is modified; anything untestable is recorded as a finding. | NFR-2 |
| AC-34 | No test name, message or comment names the technology behind a backend. | C-3 |
| AC-35 | The outcome vocabulary pinned here matches what the existing authed-fetch suite stands in for; any disagreement is recorded as a finding. | FR-11 |

## Out of Scope

- The send-OTP server action, the auth route handlers, and the server-side rate
  limiter itself — later phases own them.
- The client-side refresh dedup in the auth service, already covered (C-7).
- The sign-in screens and widgets that consume the lock store — a component
  phase owns them.
- Any change to the modules under test, including a refactor that would make one
  easier to test (NFR-2).
- Adding a pipeline, a coverage threshold, or a browser-level test suite.
- Fixing anything a finding records, including the behaviour pinned by AC-30.
