---
ticket: unit-tests-functions-completion
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Spec — unit-tests-functions-completion

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Full unit-test cover for the shared helper module `utils/functions.tsx`.

## Business Goal

`utils/functions.tsx` is one of the most-used files in the app: 260 files import
it, and its price helper alone is called 139 times across 46 files. It holds the
price rounding a shopper sees, the cart loading, the product-compare links, the
search history and the whole client error-logging path. Today only 3 of its 18
exports are covered, so a change to any of that reaches shoppers with nothing to
catch it. Covering the file turns silent breakage into a failing test, and
writing down the places where the code already misbehaves gives the team a list
worth acting on.

## User Story

> As a developer working on Trydos, I want every exported function in the shared
> helper module covered by unit tests, so that a change to price rounding, cart
> loading, product compare or error logging is caught before it reaches a user.

## Functional Requirements

- **FR-1** Every export of the module has at least one test that proves what it
  does. There are 18: 17 functions and one constant.
- **FR-2** Each function is tested on its normal path **and** on the edges that
  really happen for it — empty input, a missing field, `null` or `undefined`, a
  number at or over a boundary, and the wrong type.
- **FR-3** The tests pin what the code does **today**, including in the places
  where it does not do what it looks like it should.
- **FR-4** Every place where the code does not do what it looks like it should is
  written down as a finding in the ticket's implementation record, naming the
  export it belongs to and what the code actually does.
- **FR-5** The translation helper is proven on both sides: English (where the key
  comes back unchanged), a language that has translations, a key with no
  translation, and the server side where the language comes from the app rather
  than the address bar.
- **FR-6** The error-logging path is proven on what it hands on, on stopping
  while the user is logging out, and on never throwing — including when the
  send itself fails.
- **FR-7** For the helpers that change something as well as return something —
  product compare and search history — the tests prove **both** the returned
  value and the change: which cookies were written or deleted, what the browser
  was told, and what was stored.
- **FR-8** The three tests that pass today keep passing.

## Non-Functional Requirements

- **NFR-1** The suite finishes quickly and never hangs. No test may wait on real
  clock time, and no test may sit forever waiting for something that never comes.
- **NFR-2** No test reaches outside the process — no network call, no real cookie
  store, no real browser storage, and no loading of the real translation files.
- **NFR-3** Anything ambient is pinned: the time zone, the number and date
  formatting locale, the language, and the address the page thinks it is on. The
  same run must give the same result on any machine.
- **NFR-4** Each test reads as a plain sentence saying what it proves, so a
  failure tells you what broke without reading the test body.
- **NFR-5** The module under test is left exactly as it is.

## Constraints

- The file under test is not changed. The repository conventions say a testing
  ticket records a finding and never repairs the file it tests; a repair is its
  own ticket.
- No protected path is touched. The module under test is not on the protected
  list, and the parts of the app that are protected are only ever stood in for,
  never opened.
- The shared stand-ins and fixtures that the earlier phases produced are used
  rather than new ones invented for this ticket.
- The module is already named in the coverage list, so no change to the runner's
  configuration is expected.
- Everything runs locally. There is no CI in this repository and this ticket adds
  none.
- All artifacts and test names are written in English.

## Edge Cases

- No user id in the shared state when a cart helper is called — the helpers wait
  for one, and one of them can never see it arrive.
- A wait that never ends: the readiness helper freezes the flag it checks, so if
  the flag is false when it is called it waits forever with no time limit.
- The user is logging out while an error is being logged.
- The thing being logged is an `Error`, a plain object, a bare string, or
  nothing at all.
- Browser storage is empty, holds a valid list, or holds something that is not
  valid data.
- The same search word typed again in different capital letters.
- A compare slug that matches the first slot, the second slot, or neither; and
  both slots already full.
- An image source given as text, as an object holding a path, or missing.
- A price of zero, a price below the "thousands" boundary, a price inside it, and
  a price above the "millions" boundary — with and without a currency rate, and
  with a rate that would normally cause a rounding error.
- A language that has no translations at all.
- Running with no browser present at all (the server side).

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | "Full coverage" means **every export has at least one test that proves something about it**, plus the edges that really happen for that export. It is **not** a percentage. No coverage number is a pass mark, because some branches in the file look unreachable and a percentage target could be impossible to meet. The coverage report is still used, but only as a direction of travel: it must be higher than the recorded starting point. | FR-1, FR-2, AC-1, AC-2, AC-13 |
| OQ-2 | The tests pin what the code does **today**. Changing the module — including repairing anything the tests reveal — is **out of scope for this ticket**. Each repair becomes its own ticket. | FR-3, NFR-5, Constraints, Out of Scope, AC-3, AC-12 |
| OQ-3 | The findings are written into the **ticket's implementation record**, one entry per finding, naming the export and what the code actually does. A comment inside a test is not enough on its own, because nobody reads it later. `/verify` checks the list is there. | FR-4, AC-4 |
| OQ-4 | The non-English side of the translation helper **is in scope**. The real translation files must **not** be loaded — they are around 416KB and would be pulled into the suite. Stand-ins are used instead. | FR-5, NFR-2, AC-5, AC-10 |
| OQ-5 | **Deferred to `/plan`.** The scope decision is settled here: the suite must never wait on real clock time and must never hang (NFR-1, AC-9). *How* the slow and never-ending helpers are covered while keeping that true needs the approach, so `/plan` answers it. | Open Questions (OQ-5); the requirement it must satisfy is NFR-1 / AC-9 |
| OQ-6 | Reworking the shared setup inside the existing test file **is in scope**. It is the thing blocking most of the remaining exports. The condition is that the three tests passing today still pass afterwards. | FR-8, AC-8 |
| OQ-7 | **Deferred to `/plan`.** At spec level the requirement is that the ticket is checked by running the unit tests, the type check and the lint. Naming the validation profile belongs to the plan's validation strategy, so `/plan` records it. | Open Questions (OQ-7) |

## Open Questions

- **OQ-5** — How should the helpers that wait (the two cart helpers and the
  readiness helper) be covered so that the suite still finishes quickly and never
  hangs? The requirement is fixed (NFR-1, AC-9); the approach is not. `/plan`
  answers this (PL-12).
- **OQ-7** — Which validation profile does this ticket run at `/verify`? `/plan`
  names it in its validation strategy (PL-12, VP-1).

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | All 18 exports of the module have at least one test. None is left out. | FR-1 |
| AC-2 | Every tested function has at least one test for its normal path and at least one for an edge that really happens for it. | FR-2 |
| AC-3 | Where a test pins behaviour that looks wrong, the test says so in its own name or a note, so nobody later mistakes it for the behaviour we want. | FR-3 |
| AC-4 | The ticket's implementation record lists every place where the code does not do what it looks like it should, naming the export and what the code actually does. | FR-4 |
| AC-5 | The translation helper is proven for English, for a language that has translations, for a key with no translation, and for the server side. | FR-5 |
| AC-6 | The error-logging path is proven on what it hands on, on stopping while the user is logging out, and on never throwing when the send fails. | FR-6 |
| AC-7 | The compare helpers are proven on the value they return, on the cookies they write or delete, and on the browser being told about the change; the search-history helper is proven on the value it returns and on what was stored. | FR-7 |
| AC-8 | The three tests that passed before this ticket still pass. | FR-8 |
| AC-9 | `pnpm test:run` finishes and exits on its own. No test waits on real clock time, and none can hang. | NFR-1 |
| AC-10 | No test reaches the network, a real cookie store, real browser storage, or a real translation file. | NFR-2 |
| AC-11 | Everything ambient is pinned — time zone, formatting locale, language, and the address the page thinks it is on — so the run gives the same result on any machine. | NFR-3 |
| AC-12 | The module under test is unchanged. | NFR-5, FR-3 |
| AC-13 | The coverage report for the module is higher than the recorded starting point of 13.42% of statements and 3 of 28 functions. | FR-1, FR-2 |

## Out of Scope

- Changing the module under test in any way, including repairing the behaviour
  the tests reveal. Each repair is its own ticket.
- Testing the modules this one imports — the fetch helper, the cookie manager,
  the shared state, the error reporting and the request catalogue. Each has its
  own phase in the test roadmap.
- Any coverage percentage as a pass mark.
- Adding CI, a pipeline, or uploading coverage anywhere.
- Component tests, browser tests, and end-to-end tests.
- Refactoring anything to make it easier to test.
- Changing a shared stand-in in a way that changes how the other test files
  behave.
