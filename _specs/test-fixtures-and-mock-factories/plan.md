---
ticket: test-fixtures-and-mock-factories
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Plan — test-fixtures-and-mock-factories

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add a test-only folder, `tests/`, holding two groups of small files: **builders**
that return sample objects, and **stand-ins** that replace a module during a test.
Add one more helper that fakes network calls and writes down what it was asked
for. Nothing outside `tests/` changes, apart from moving the one test file that
already exists onto the shared stand-ins.

Three decisions shape the rest of the plan.

**Builders are plain functions that take an overrides object and merge it over a
default.** No data-generating library is added. The suite must give the same
result every time, and a library that invents random names works against that. A
merge is also the least code that satisfies AC-2 and AC-3.

**Stand-ins are exported factory functions, not ready-made objects.** A test calls
the factory inside its own `vi.mock(...)` call. This matters because the test
runner needs the module name at the top of the test file to replace it at all —
a shared file cannot register the replacement on the test's behalf. Exporting a
factory gives every test the same behaviour in one line, while leaving the
registration where the runner requires it. It also gives each test its own fresh
copy, which is what AC-9's "no state leaks between tests" needs.

**The cookie stand-in keeps its own copy of the cookie names, and one test proves
the copy still matches the real module.** The stand-in cannot simply import the
real module at the top of the file: a test that replaces the cookie manager
replaces it for everything that test loads, so the stand-in would end up importing
its own replacement. Reading the real module from inside the factory would avoid
that, but then every test file using the stand-in loads the token library the real
module pulls in, and the whole kit becomes tied to the browser-like test
environment. A copy plus one comparison test catches drift just as well, and only
one file pays that cost.

Alternative considered and rejected: a single global setup file that replaces
every module for the whole suite. It would hide which module a given test depends
on, and the test runner has no setup file configured yet — the roadmap adds one in
a much later phase, and pulling that forward would widen this ticket.

## How the review follow-ups are dealt with (PL-10)

`review.md` recorded `CHANGES_REQUESTED` with seven required actions. Each one is
handled in this plan:

| Follow-up | Where it is handled now |
|---|---|
| 1. Cookie names — decide how, and say why | Approach (third decision) and step 4. The owner chose the copy plus a comparison test; the reason is written down. |
| 2. "Whole public surface" is impossible for the two third-party modules | Step 3. The rule now says what it means for our own five modules and what it means for the two third-party ones. |
| 3. Step 8 would break the existing test file | Step 9. It now says exactly which four stand-ins are swapped and that the other six stay. |
| 4. The fake-network helper's empty queue | Step 6. An empty queue raises a clear error naming the address that was asked for. |
| 5. Sample data must not hold real values | Step 2. Every token, id, email and phone is an obviously fake constant. |
| 6. The analytics stand-in needs a `default` key | Step 3. |
| 7. The cookie stand-in depends on the browser-like environment | Step 4 — the note now applies only to the comparison test, which is the one place that loads the real module. |

## Steps

1. Create `tests/fixtures/` and write one builder file per object group. Base
   every field on a shape already written down in the repository (C-5), and name
   that source in a comment at the top of each file.
2. Fill the builders with **obviously fake constant values** — for example a token
   of `"test-market-token"`, a phone of `"+10000000000"`, an email at
   `example.com`. No value is copied from a real session, a real response or a
   real user. The shapes come from the type definitions; the values are invented.
3. Write the two product builders — one for the tidied-up list shape, one for the
   raw search-engine shape — plus a builder for the search-engine response that
   wraps hits (AC-1, AC-4).
4. Create `tests/mocks/` and write one stand-in file per module, each exporting a
   factory. What "covers the module" means depends on who owns the module
   (AC-5, AC-6):
   - **Our own five** — the cookie manager, the client fetch helper, the shared
     state store, the language and country helper, and the framework's
     server-request reader: the stand-in provides **everything the module makes
     available**. Each surface is small and known, and a missing part would break
     any test whose code path reaches it.
   - **The two third-party ones** — the product-analytics client and the
     error-reporting client: they export hundreds of symbols, so copying all of
     them would be code no test ever calls. The stand-in covers **what this
     repository actually imports**, which is seven methods for the analytics
     client and three for the error-reporting one.
   The analytics stand-in puts its fake client on a `default` key, because the
   wrapper that uses it reads the client from there.
5. Give the cookie stand-in its own copy of the cookie names, and add one test in
   `tests/mocks/mocks.test.ts` that loads the **real** cookie module and checks
   every copied name still matches (AC-7). That comparison test is the only place
   in the kit that loads the real module, so it is the only place that pays for
   the token library it pulls in — and the only place that needs the browser-like
   test environment, because the real module only reaches for server-side request
   reading when there is no browser window. Note that dependency in the stand-in's
   comment so a later phase does not hit it by surprise.
6. Write the fake-network helper: it takes a list of replies, hands them back in
   order, can hand back a failure, and records the number of calls plus the
   address, method and body of each (AC-10, AC-11). When it is asked for a reply
   and the list is empty, it raises a clear error naming the address that was
   asked for — never an empty result and never a hang.
7. Write a small test file for the kit itself, next to the code it covers. It
   checks that each builder returns a valid object with no arguments, that
   overrides take effect and leave other fields alone, that two calls return
   independent objects, and that the helper queues, fails, records, and raises on
   an empty queue (AC-2, AC-3, AC-10, AC-11).
8. Write one test that proves the store stand-in reaches a module that loads the
   store at the moment it is used, not only one that loads it at the top of the
   file (AC-8). If it turns out one registration does not cover both, record that
   as a finding and provide the second way in the kit — do not change the module
   that loads the store late.
9. Move `utils/functions.test.ts` onto the shared stand-ins. That file registers
   **ten** replacements today. Swap only the **four** the kit covers — the shared
   state store, the language and country helper, the client fetch helper, and the
   cookie manager. Leave the other **six** exactly as they are: `./Requests`,
   `./history`, `./errorReported`, `./posthog`, `./errorSerialization` and
   `./types/cart`. Two of those look like they belong to the kit but do not:
   `./errorReported` and `./posthog` are **our own wrappers**, not the third-party
   clients the kit stands in for. Keep every existing assertion unchanged (AC-12).
10. Run the checks in the validation profile and record the results.

## Files to change

All new files are test-only. **No `protected_paths` file is changed** — the
protected modules are read from and imitated, never edited.

- `tests/fixtures/product.ts` — new. Builders for the tidied-up list product and
  the raw search-engine product.
- `tests/fixtures/elastic.ts` — new. Builder for a search-engine response that
  wraps product hits.
- `tests/fixtures/user.ts` — new. Builder for a user.
- `tests/fixtures/cart.ts` — new. Builders for a cart item and a whole cart.
- `tests/fixtures/order.ts` — new. Builders for an order and one order line.
- `tests/fixtures/address.ts` — new. Builder for a shipping address.
- `tests/fixtures/story.ts` — new. Builders for a story and one story item.
- `tests/fixtures/chat.ts` — new. Builders for a chat message and its sender.
- `tests/fixtures/fixtures.test.ts` — new. Checks the builders (AC-2, AC-3).
- `tests/mocks/nextHeaders.ts` — new. Stand-in for the framework's
  server-request reader.
- `tests/mocks/cookieManager.ts` — new. Stand-in for the cookie manager, holding
  its own copy of the cookie names.
- `tests/mocks/fetchData.ts` — new. Stand-in for the client fetch helper.
- `tests/mocks/store.ts` — new. Stand-in for the shared state store.
- `tests/mocks/localization.ts` — new. Stand-in for the language and country
  helper.
- `tests/mocks/posthog.ts` — new. Stand-in for the product-analytics client, on a
  `default` key.
- `tests/mocks/sentry.ts` — new. Stand-in for the error-reporting client.
- `tests/mocks/mockFetch.ts` — new. The fake-network helper.
- `tests/mocks/mocks.test.ts` — new. Checks the helper, the store stand-in, and
  that the copied cookie names still match the real module (AC-7, AC-8, AC-10,
  AC-11).
- `utils/functions.test.ts` — changed. Four of its ten replacements are swapped
  for the shared ones; the other six and every assertion stay as they are (AC-12).

No `OQ-n` was pushed forward by `spec.md`, so there is none left to answer here
(PL-12). All eight were settled in `spec.md > Research Questions Resolved`.

## Integration surface

> Required (PL-11, ADR-014). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

This is **not** self-contained. The files are new and test-only, but the kit is a
shared contract that 118 later tickets will build on, and it describes modules it
does not own.

- **Components / shared config touched:** no production file is edited, but the
  kit **describes** eight protected or heavily used modules from the outside: the
  cookie manager, the shared state store, the client fetch helper, the language
  and country helper, the framework's server-request reader, the
  product-analytics client, the error-reporting client, and the search-engine
  response shape. It also depends on the test runner's existing settings — the
  path mapping that lets `tests/...` be imported by name, and the absence of a
  setup file. The lint rules are relied on too: they do not apply to `tests/`, so
  English text in a builder is fine. One file, the comparison test in
  `tests/mocks/mocks.test.ts`, additionally depends on the browser-like test
  environment, because it loads the real cookie module.
- **Who else depends on them:** every remaining roadmap phase. Tiers 1 and 6 need
  the product builders; Tier 2 needs the cookie stand-in with true names; Tier 3
  needs the fake-network helper to prove exact call counts; Tiers 5 and 6 need the
  store stand-in. The one existing test file depends on it immediately, because
  this ticket moves it over.
- **Overlapping flows:** the cookie stand-in and the store stand-in both get used
  by the same tests, and the client fetch helper reads the store itself — so a
  test can end up with two stand-ins that must agree about the same session. The
  two product shapes overlap the same way: the raw search-engine shape is what the
  tidied-up one is built from, so a builder that gets one wrong will make the
  other look right when it is not. `utils/functions.test.ts` is the first place
  four stand-ins meet six hand-written ones in the same file, and they have to
  co-exist.
- **Ordering / lockstep dependencies:** nothing has to ship at the same time as
  anything else. The order inside the ticket does matter. The stand-ins must exist
  before the existing test file is moved onto them (step 9 depends on step 4). The
  store stand-in must be proven against the late-loading module (step 8) before
  the kit is treated as finished, because Tiers 3 and 6 cannot be written if that
  does not hold. The cookie names must be copied and the comparison test written
  in the same step (step 5) — a copy without the comparison is the drift risk the
  copy was chosen to accept.
- **What breaks if this is wrong:** a builder whose shape does not match the real
  backend will make later tests pass while the application is broken — the worst
  outcome here, because it looks like coverage. If the copied cookie names drift
  from the real ones and the comparison test is missing or weak, a Tier 2 test
  will assert a wrong name and lock the mistake in. If the store stand-in does not
  reach the module that loads the store late, every Tier 3 and Tier 6 ticket hits
  the same wall and the kit has to be reopened. If step 9 swaps more than the four
  covered replacements, `utils/functions.test.ts` breaks straight away — that one
  at least fails loudly. None of the others show up as a failing build; they show
  up as a green suite that proves nothing, which is why steps 5 and 8 prove their
  case rather than assuming it.

## Validation strategy

- Validation profile: `tests-and-types`
- The profile's checks prove the acceptance criteria that can be checked by
  running something: the suite passing covers AC-2, AC-3, AC-7, AC-8, AC-10,
  AC-11, AC-12 and AC-13; the type check and the lint check cover AC-14.
- The rest are checked by reading: AC-1, AC-4, AC-5, AC-6 and AC-9 are confirmed
  by comparing each builder and stand-in against the shape or the module it is
  based on.
- AC-15 is confirmed by looking at the list of changed files — only `tests/` and
  the one existing test file may appear, and no `protected_paths` file.
- The unused-file check is deliberately not in this profile. It will report the
  new files until the next phase imports them, and that is expected (OQ-6).

## Rollback

Every change is a new file except one. To undo the ticket, delete `tests/` and
restore `utils/functions.test.ts` to its previous contents. Nothing that ships to
users is touched, no configuration is changed, and no data is migrated, so there
is nothing else to unwind and no state to restore. Because `/implement` makes no
commit, an abandoned attempt can also be dropped straight from the working tree.

## Out of scope

- Testing real application code. That starts with the next phase.
- Changing any production file. If a module resists being replaced, that is
  recorded as a finding, not fixed here (C-1).
- Adding or changing a check or a validation profile. The one this ticket uses
  already exists (C-3).
- Changing the coverage list (OQ-5).
- Doing anything about the unused-file report on the new files (OQ-6).
- Wiring the notifications slice into the shared store (OQ-7) — recorded as a
  finding for the later phases that cover the store.
- Adding the browser-component testing tools, the request-interception library,
  or the test runner's setup file. The roadmap adds those in a later phase.
- Adding a data-generating library.
- Replacing our own wrappers around the analytics and error-reporting clients.
  The kit stands in for the third-party clients only; the wrappers are tested in
  their own later phases.
- Any pipeline or automated run.
