---
ticket: test-fixtures-and-mock-factories
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Spec — test-fixtures-and-mock-factories

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

Two words are used throughout. A **builder** is a small function that returns a
sample object for a test to use, where the caller can change any field. A
**stand-in** is a replacement for a real module during a test, so the test never
reaches the network, the browser cookies, or a real database.

## Feature Name

Shared test fixtures and mock factories for the unit test suite.

## Business Goal

The test roadmap has 118 phases left after this one. Every one of them needs
sample data and needs to replace the same handful of modules. Without a shared
kit, each phase invents its own, the same object ends up described five different
ways, and a wrong description spreads quietly because the tests still pass.

One kit, built from shapes that are written down in the repository, makes every
later phase cheaper to write and easier to trust. This is the reason the roadmap
puts this phase before all of Tier 1.

## User Story

> As a developer writing tests for Trydos, I want one shared set of sample-data
> builders and module stand-ins, so that every test describes the same object the
> same way and I do not have to rebuild the same setup in each new test file.

## Functional Requirements

- **FR-1 — Sample data for the main objects.** The kit provides a builder for
  each of the objects tests keep needing: a product, a user, a cart, an order, an
  address, a story, a chat message, and a search-engine response.
- **FR-2 — Every builder can be changed by the caller.** A builder called with no
  arguments returns a complete, valid object. A builder called with a partial set
  of fields returns the same object with those fields replaced and everything else
  left at its default.
- **FR-3 — Two product builders, not one.** The app has two real product shapes:
  the tidied-up one used by product lists, and the raw one the search engine
  returns. The kit provides a builder for each, and each matches its own real
  shape.
- **FR-4 — Stand-ins for the modules tests must replace.** The kit provides a
  reusable stand-in for each of these seven: the framework's server-request
  reader, the cookie manager, the client fetch helper, the shared state store, the
  language and country helper, the product-analytics client, and the
  error-reporting client.
- **FR-5 — A stand-in covers the whole module it replaces.** Replacing a module
  replaces all of it, so a stand-in that leaves out part of what the real module
  exports breaks any test whose code touches the missing part. Each stand-in
  therefore provides everything the real module makes available, not only the
  parts needed today.
- **FR-6 — The store stand-in works however the store is loaded.** Some code
  reads the shared state store at the top of the file and one module loads it at
  the moment it is used. The store stand-in works for both.
- **FR-7 — A helper that fakes network calls and records them.** The kit provides
  one helper that a test can hand a list of replies to. It returns those replies
  in order, can return a failure as well as a success, and records how many times
  it was called along with the address, the method and the body of each call.
- **FR-8 — The existing test moves onto the kit.** The one test file that already
  exists stops using its own hand-written stand-ins, uses the shared ones instead,
  and still passes.
- **FR-9 — The cookie stand-in uses the real cookie names.** The names it reports
  are the ones the application really uses, so a later test can check a name and
  get a true answer.

## Non-Functional Requirements

- **NFR-1 — Nothing reaches outside the process.** No builder and no stand-in
  makes a network call or touches a real database, a real cache, a real cookie
  store, or a real push-notification service.
- **NFR-2 — The repository still type-checks and lints.** Adding the kit
  introduces no type error and no lint error.
- **NFR-3 — The suite still runs once and exits.** Nothing in the kit leaves a
  timer, a connection or a watcher running that would stop the test command from
  finishing.
- **NFR-4 — Readable enough to copy.** The kit is the pattern 118 later phases
  will follow, so each builder and stand-in is written plainly and says what it is
  for.

## Constraints

- **C-1 — No production code changes.** This ticket adds test-only files. No file
  that ships to users is changed, and no `protected_paths` file is changed.
- **C-2 — Follow the conventions already written down.** The rules set by the
  previous phase — where a test file goes, the protected-path exception, how to
  replace a module, cleaning up afterwards, pinning anything that varies by
  machine — apply to this ticket too.
- **C-3 — Use the gate group that already exists.** The check group for tickets
  that write tests is already defined and is the one this ticket uses. This ticket
  does not add or change a check or a group.
- **C-4 — The coverage list does not change.** The coverage report names the files
  being tested. Builders and stand-ins are test tooling, not code under test, so
  nothing is added to that list here.
- **C-5 — Build from shapes written down in the repository.** Every builder is
  based on a shape that already exists in the code, not on memory or on a guess
  about what a backend returns.

## Edge Cases

- A builder is called with an unknown field, or with a field set to an empty
  value, `null`, or zero. The override still takes effect; the builder does not
  silently drop it or replace it with the default.
- A builder is called twice. The two objects are independent — changing one does
  not change the other, and no state leaks between tests.
- The fake-network helper is asked for more replies than it was given. What
  happens is defined and obvious, not an accidental hang or a silent success.
- The fake-network helper is handed a failure reply. The calling code sees a
  failure, and the call is still recorded.
- A stand-in is used by a test that only touches part of it. The unused parts do
  nothing rather than throwing.
- Two tests in the same run use the same stand-in. Neither sees what the other
  did to it.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Two builders, not one. The tidied-up product shape and the raw search-engine shape are genuinely different, and one builder bent to cover both would be wrong for whichever it fits less well. | FR-3, AC-4 |
| OQ-2 | In scope, and stated as a requirement: the store stand-in must work for a module that loads the store late as well as one that loads it at the top of the file. How that is achieved is the approach, so `/plan` decides it. | FR-6, AC-8 |
| OQ-3 | All seven are built now. Each already has a consumer in an early phase — the error-reporting client is needed by Tier 1, the product-analytics client by Tier 4 — so leaving either out would only push the same work into a later ticket and let that ticket invent its own. The roadmap's list is kept as it is. | FR-4, AC-5 |
| OQ-4 | Included now. This is not extra work for its own sake: replacing a module replaces all of it, so a stand-in missing part of what the module exports breaks any test whose code path touches that part. The stand-in covers the module's whole public surface, server-only parts included. | FR-5, AC-6 |
| OQ-5 | No. The coverage list names code being tested, and builders and stand-ins are test tooling. Nothing is added to it in this ticket, and no acceptance criterion asks for a coverage increase. | C-4, AC-14 |
| OQ-6 | Accepted, and written down rather than worked around. The unused-file report will name the new files until Tier 1 imports them. That check is deliberately not part of this ticket's gate group, so it cannot block the gate. This ticket does nothing else about it. | Out of Scope, C-3 |
| OQ-7 | No. The store stand-in describes the store as it really is, and the notifications slice is not part of it. Inventing state the real store does not have would let tests pass against something that does not exist. The wider question — whether that slice should be wired in — belongs to the later phases that cover the store, and is recorded as a finding, not fixed here. | Out of Scope, AC-9 |
| OQ-8 | The helper records how many times it was called and, for each call, the address, the method and the body. It also accepts a list of replies and returns them in order, and can return a failure. This is the minimum that lets a later phase prove a failed sign-in causes exactly one retry. | FR-7, AC-10, AC-11 |

## Open Questions

- None. Every `OQ-n` from `research.md` is answered above; nothing is pushed
  forward to `/plan`.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A builder exists for each of: product, user, cart, order, address, story, chat message, and a search-engine response. | FR-1 |
| AC-2 | Each builder called with no arguments returns a complete, valid object. | FR-2 |
| AC-3 | Each builder called with a partial set of fields returns those fields changed and every other field at its default. | FR-2 |
| AC-4 | There are two product builders — one for the tidied-up list shape and one for the raw search-engine shape — and each matches its own real shape as written in the repository. | FR-3, C-5 |
| AC-5 | A reusable stand-in exists for all seven named modules. | FR-4 |
| AC-6 | Each stand-in provides everything the real module makes available, including any server-only part. | FR-5 |
| AC-7 | The cookie stand-in reports the real cookie names used by the application. | FR-9 |
| AC-8 | The store stand-in works for a module that loads the store at the moment it is used, not only for one that loads it at the top of the file. | FR-6 |
| AC-9 | The store stand-in contains no state the real store does not have. | FR-6, C-5 |
| AC-10 | The fake-network helper accepts a list of replies, returns them in order, and can return a failure as well as a success. | FR-7 |
| AC-11 | The fake-network helper records how many times it was called and, for each call, the address, the method and the body. | FR-7 |
| AC-12 | The test file that already exists uses the shared stand-ins instead of its own, and still passes. | FR-8 |
| AC-13 | The whole suite passes with no network access, and the test command finishes on its own. | NFR-1, NFR-3 |
| AC-14 | The type check and the lint check both pass, and the coverage list is unchanged. | NFR-2, C-4 |
| AC-15 | No production file is changed and no `protected_paths` file is changed. | C-1 |

## Out of Scope

- **Testing anything.** This ticket builds the kit. Writing tests for real
  application code starts with the next phase.
- **Changing production code.** If a module turns out to be hard to replace, that
  is recorded as a finding, not fixed here.
- **Adding or changing a check or a gate group.** The group for test tickets
  already exists.
- **Changing the coverage list** (OQ-5).
- **Doing anything about the unused-file report** for the new files (OQ-6). It is
  expected and does not block the gate.
- **Wiring the notifications slice into the shared store** (OQ-7). Recorded as a
  finding for the later phases that cover the store.
- **Browser-component testing tools and the request-interception library.** The
  roadmap adds those in a later phase, together with the setup file the test
  runner needs for them.
- **Any pipeline or automated run.** Everything here runs on a developer's own
  machine.
