---
ticket: unit-tests-product-detail-data
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-03
links:
  clickup:
  github:
---

# Spec — unit-tests-product-detail-data

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Unit coverage for the product page's server-side data reader.

## Business Goal

Every product page, the product modal that opens over a listing, and both
mobile product endpoints get their data from one server-side reader. It decides
which price and stock figures the shopper sees, which backend is asked for
them, and what the page shows when a backend is slow or gone. Nothing executes
that reader today.

The value is not "coverage". It is that a break in the product page currently
gives no clue where it came from — the page renders empty and the work of
finding out is done by hand, across a cache, two backends, a search server and
a stories service. When this ticket is done, a failure names the function and
the backend.

## User Story

> As a shopper, I want the product page to show the right price, stock and
> rating, so that I do not buy the wrong thing at the wrong price.
>
> As the person on call, I want a break in that page to name the function and
> the backend that failed, so that I do not bisect four services by hand.

## Functional Requirements

- **FR-1 — The country list is served from the cache when it is there.** A
  cached list must not cause a backend request, and a fresh list must be kept
  for the next reader. A reply carrying no list must give an empty list rather
  than an error.
- **FR-2 — The product's main record is read, cached and reported honestly.**
  The reader must say whether the record came from the cache or from a backend,
  must write both cache keys after a fresh read, and must honour a caller's
  request to skip the cache — where "skip" means skip the *read*, while still
  keeping the cache warm.
- **FR-3 — The backend asked depends on the shopper.** A guest's product
  request goes to the gateway; a verified shopper's goes to the core backend.
  The reader must be shown making that choice from the shopper's own saved
  profile, not from a value handed to it.
- **FR-4 — What a failed read actually does must be pinned, including where it
  is wrong.** The fetch layer this reader uses **never raises**. On any refused
  or failed request it hands back an envelope carrying `error`, a status and no
  data. Three different things happen to that envelope in this one file, and all
  three must be pinned:
  - The **metadata** reader checks the envelope, raises on it, catches its own
    raise, reports it, and returns nothing. Correct.
  - The **main record** and the **price and stock** readers never look at the
    envelope. They spread its empty data and return an object that looks like a
    product but carries no product id and **no signal the caller can read**. The
    fault is not unreported — the fetch layer sends every refused reply to error
    tracking — but nothing reaches the caller, so a caller cannot tell a dead
    backend from a product that does not exist. Confirmed: no caller checks. The
    mobile product endpoint merges both answers and returns a hollow product as
    a success, and the product page passes them into the render tree unchecked.
    This is **BUG-2**, and the test states what should happen while recording
    what does.
  - Their `catch` blocks are reachable only when a dependency raises — the cache
    does. That is the real raise path, and it is where the difference between
    the two readers shows: one re-raises, the other returns nothing.
- **FR-5 — Price and stock figures survive the read intact.** Price, offer
  price, the variant list and the available quantity must arrive as the backend
  sent them.
- **FR-6 — A product that does not exist is told apart from a backend that is
  unwell.** "Gone" must be reported distinctly, so a caller can send the shopper
  away; a refused or failed request must not be reported as "gone", so a working
  product is never hidden by a passing fault.
- **FR-7 — Search-engine metadata is built from the product.** The chosen colour
  and size appear in the title; brand and category are appended for context when
  the product has them; a description too short to be useful is replaced by a
  built sentence, while a real description is kept; a product with no picture
  falls back to the site image. The result is cached, and a cached copy is
  served without asking the backend.
- **FR-8 — Rating and recommendation numbers are worked out correctly.** The
  star spread becomes rating groups with counts. Recommend and not-recommend
  percentages come from their two totals, and a product nobody has rated gives
  zero rather than a division by zero.
- **FR-9 — A product nobody has viewed counts as zero views, quietly.** A
  missing view record is an ordinary state, not a fault, and must not be
  reported as one.
- **FR-10 — Likes, comments and shares are gathered into one answer**, and
  whether *this* shopper liked the product is decided from their most recent
  interaction.
- **FR-11 — The comment count counts the right comments** — not deleted ones,
  and not order ratings.
- **FR-12 — Product stories carry the shopper's stories credential when there is
  one**, and a refused reply gives empty lists rather than an error. A story
  group counts as having something new when any story in it is unseen.
- **FR-13 — The known ratings defect is confirmed by a test, not fixed here.**
  When the ratings query fails, the reader falls back to a set of zero values
  built in a shape the caller cannot read, so none of them arrives. A test must
  assert what arrives today, state in its message what should arrive instead,
  and carry the bug id — so the suite stays green now and turns red the moment
  the defect is fixed, forcing the fix to update it.

## Non-Functional Requirements

- **NFR-1 — A failure identifies the step.** Every assertion carries a message
  written for somebody who did not write the test. Where a step crosses a
  backend, the message names it.
- **NFR-2 — Backends are named by role, never by technology.** "the core
  backend" and "the gateway". No output may name the stack behind either — and
  that includes any value a test puts into an assertion, not only the words a
  human typed.
- **NFR-3 — No real input or output.** No network, no cache server, no search
  server, no stories service, no real cookie writes.
- **NFR-4 — Nothing secret and nothing real reaches output.** Assertion text is
  **published**: a failure diff is copied into the run report and sent to the
  team chat as a file attachment on every push to `develop` and `main`. So no
  credential, token, one-time code — and no real host name — may appear in an
  assertion message, in a value an assertion compares, in a fixture, **or in
  anything handed to a stand-in** (a seeded cookie, a seeded profile, a seeded
  header). Every such value must be an obviously fake literal, declared either
  in the test file itself or in the shared test environment settings, and never
  pasted from a real response or a real browser session.

  **No phone number is needed, and none may appear.** An earlier draft allowed
  one, on the grounds that FR-3 could not be proved without it. That was wrong:
  the app's verified check accepts **any** non-empty value that is not `"0"`, so
  the profile can be seeded with a plain marker word and the same branch runs.
  An exception whose stated reason is untrue is the one that gets copied, so
  there is no exception.

  **One thing the rule cannot demand, stated so it is not mistaken for a
  breach.** Five criteria assert which search index was queried, and those names
  are real and come from the tracked index list. They must be asserted **through
  the imported constants**, never retyped as literals — so a published diff
  shows only names the tracked source already holds, and no copy in a test file
  can drift from it.
- **NFR-5 — Nothing ambient decides a result.** No assertion depends on the
  machine's clock, timezone, locale, measured durations, or on a value the test
  environment happens not to set.
- **NFR-6 — The gate stays green, and this work stays cheap.** The validation
  profile must exit zero, and the new test file's own run time must stay within
  a stated budget.

## Constraints

- **C-1 — No application code changes.** If the reader resists testing, that is
  a recorded finding, not licence to refactor.
- **C-2 — Only new test material is added.** Nothing that ships to a user
  changes.
- **C-3 — The unit suite only.** Nothing is added to the browser suite, and
  nothing is added to the pull-request gate — it already runs the unit suite and
  picks new files up on its own.
- **C-4 — One test file for the reader.** A second parallel file for a unit that
  already has one is a defect.
- **C-5 — Every fixture field is copied from a shape written down in this
  repository, and names where it came from.** No field is guessed, and no value
  is taken from a real response.
- **C-6 — A shared fixture stays free of production imports.** The fixture file
  this ticket extends is used by unrelated test files, and its standing promise
  is that using a builder loads no production module. That promise must survive.
- **C-7 — Every builder is covered by the shared fixture guard.** That guard
  checks *every* builder; two new ones outside it would quietly break the word
  "every".
- **C-8 — Deleting what this ticket adds restores today's state exactly.**

## Edge Cases

- A reply that arrives but carries no payload — for the country list, for the
  product record, for the stories list.
- A refused request, which comes back as an envelope rather than a raise. This
  is the case the reader mostly ignores, and the reason FR-4 exists.
- A product with no picture, and a product whose description is a single word.
- A product nobody has rated: percentages must not divide by zero.
- A product nobody has viewed: a missing record is zero views, not a fault.
- A guest with no stories credential.
- A caller asking for a fresh read while a cached copy exists.
- The cache itself failing — the only dependency in this file that raises, and
  therefore the only way the two readers' `catch` blocks run at all.
- A search server that fails while its two neighbours succeed — recorded as
  FIND-2, and the reason FR-13's defect matters at all.
- The reader reports how long it took. That number changes on every run and must
  never be asserted; only the cached-or-fresh flag beside it may be.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Settled during research by running a throwaway probe, since deleted.** The cache stand-in registered for the whole suite does reach the reader, including its relative import. The reader also loads under the test harness in 31ms with no socket opened. No stand-in of its own is needed for the cache — but the shared one only forgets calls between tests, it does not forget answers, so any answer a test sets must be set for one call only. | NFR-3, and a stated constraint on how cache answers are given |
| OQ-2 | **A strict pinned assertion carrying the bug id — not the runner's `it.fails()` marker.** `it.fails()` was tested directly and is **not strict**: a probe with three cases (the intended assertion, a `TypeError` from a missing stand-in, and a plain raised error) reported all three as "expected fail". It therefore cannot tell "the defect is still here" from "my stand-in is broken", which is the silent pass the repository's testing rules forbid. The strict form keeps everything the marker was chosen for: the suite stays green, and the case turns red the moment the defect is fixed. | FR-13, AC-23 |
| OQ-3 | **Extend the existing product builders, justified by provenance only.** The earlier justification — that the follow-up ticket wants the same shapes — does not hold: that module returns comment and interaction shapes, not these. The real reason is C-5 and C-4: the shapes belong with the other product shapes, and a second parallel set for the same unit is a defect. | C-4, C-5, C-6, C-7 |
| OQ-4 | **All nine exported functions are in scope.** None is deferred. | The full AC list below |
| OQ-5 | **"the core backend" and "the gateway".** The variable naming the gateway still carries the old technology name, so the test reads it but never repeats it — and because assertion text is published (NFR-4), the *values* the test compares must not carry it either. | NFR-1, NFR-2, NFR-4 |

## Open Questions

None. Every `OQ-n` from research is answered above; none is deferred to the
plan.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A cached country list is returned, and no backend is asked | FR-1 |
| AC-2 | On a cache miss the list comes from the backend and is kept for the next reader | FR-1 |
| AC-3 | A reply carrying no country list gives an empty list, not an error — **and the backend is shown to have been asked**, so a stand-in nobody configured cannot pass this case by accident | FR-1 |
| AC-4 | A cached product record is returned and reported as coming from the cache | FR-2 |
| AC-5 | With nothing cached, the record is read fresh and reported as not from the cache | FR-2 |
| AC-6 | A fresh read writes both the slug key and the record key | FR-2 |
| AC-7 | Asking to skip the cache skips the read, and still writes the result back | FR-2 |
| AC-8 | A guest's product request goes to the gateway, and a verified shopper's to the core backend, decided from the shopper's own saved profile | FR-3 |
| AC-9 | When the **cache** raises, the main record read reports it and raises — the only path on which it does | FR-4 |
| AC-10 | A cached price and stock payload is returned and reported as cached | FR-2, FR-5 |
| AC-11 | A fresh price and stock read returns price, offer price, variants and available quantity unchanged | FR-5 |
| AC-12 | When the **cache** raises, the price and stock read reports it and returns nothing — differing from the main record read on the same input | FR-4 |
| AC-13 | A product the backend does not have is reported as not found | FR-6 |
| AC-14 | A refused request is not reported as "not found" — the metadata reader checks the envelope and reports the fault instead | FR-4, FR-6 |
| AC-15 | A chosen colour and size appear in the metadata title | FR-7 |
| AC-16 | Brand and category are appended to the title when the product has them | FR-7 |
| AC-17 | A description too short to be useful is replaced by a built sentence, and a real one is kept as it is | FR-7 |
| AC-18 | A product with no picture falls back to the site image | FR-7 |
| AC-19 | Metadata is cached, and a cached copy is served without asking the backend | FR-7 |
| AC-20 | A request with no product id returns the empty shape without asking anything | FR-8 |
| AC-21 | The star spread is turned into rating groups with their counts | FR-8 |
| AC-22 | A product with no view record counts as zero views, and that is not reported as a fault | FR-9 |
| AC-23 | **BUG-1** — when the ratings query fails, the fallback figures do not reach the caller. The test asserts what arrives today and states what should arrive | FR-13 |
| AC-24 | Recommend and not-recommend percentages are worked out from their two totals | FR-8 |
| AC-25 | A product nobody has rated gives zero percent rather than dividing by zero | FR-8 |
| AC-26 | Likes, comments and shares are gathered from their three sources into one answer | FR-10 |
| AC-27 | Whether this shopper liked the product is decided from their **most recent** interaction — shown with more than one interaction present, or by proving the newest-first ordering was asked for. A single interaction proves only that one was read | FR-10 |
| AC-28 | The comment count leaves out deleted comments and order ratings, **shown by the query that was sent**. The count itself comes from the stand-in, so asserting the number proves nothing about what was excluded | FR-11 |
| AC-29 | A shopper with a stories credential sends it; a guest sends none | FR-12 |
| AC-30 | A **refused** stories request gives empty lists, not an error | FR-12 |
| AC-31 | A story group counts as having something new when any story in it is unseen | FR-12 |
| AC-32 | No test reaches a real network, cache server, search server or stories service | NFR-3 |
| AC-33 | No assertion message, compared value, fixture **or value handed to a stand-in** carries a credential, a phone number or a real host name. Search index names are asserted through the imported constants, never retyped | NFR-4 |
| AC-34 | Every assertion names the step it checks, and names the backend when the step crossed one, by role and never by technology | NFR-1, NFR-2 |
| AC-35 | No assertion depends on the clock, the timezone, the locale, a measured duration, or an unset environment value | NFR-5 |
| AC-36 | The validation profile exits zero, and the new file's own run time stays within its stated budget | NFR-6 |
| AC-37 | **BUG-2** — when the backend refuses, the main record read does **not** raise: it returns an object carrying no product id and no sign of the fault, so a caller cannot tell a dead backend from a missing product | FR-4 |
| AC-38 | **BUG-2** — the price and stock read does the same, on the payload that carries the price. The metadata reader, in the same file, checks the envelope correctly — so the three disagree | FR-4 |

## Out of Scope

- **The comment and reaction reader.** Split out at research into its own
  follow-up ticket. Note that it holds a drifted near-copy of the interactions
  reader covered here by AC-26 and AC-27, which rethrows where this one swallows
  — so the follow-up must not assume these criteria carry over.
- **Fixing BUG-1 and BUG-2.** Both confirmed here; both fixed in their own
  tickets, each of which must update the confirming case.
- **FIND-2 — a failing recommendation query taking the whole ratings call down
  with it.** Recorded at research. Its own ticket.
- **FIND-3 — comments naming the backend technology.** A comment-only change to
  files this ticket does not touch.
- **FIND-4 — the roadmap describing a test project that does not exist.**
- **FIND-5 — the stories reader raising on a reply that arrives with an
  unexpected body.** It guards only against a missing payload. No evidence yet
  that the service sends such a body, so it is recorded, not tested.
- **Any refactor** of the reader to make it easier to test.
- **Browser tests** for the product page.
- **A coverage threshold**, and any change to the pull-request gate.
