---
ticket: unit-tests-functions-completion
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Plan — unit-tests-functions-completion

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Grow the one existing test file, `utils/functions.test.ts`, until all 18 exports
of `utils/functions.tsx` are covered. One file, one `describe` block per export,
in the order the exports appear in the source — so a reader can hold the two
files side by side.

Two things have to change in how the file is set up before most of the exports
can be reached at all.

**First, stop replacing the whole browser.** The file currently does
`vi.stubGlobal("window", { location: { pathname: "/sy-en" } })`. That bare object
hides the browser-like environment the runner already provides, so there is no
way to fire an event, read stored data, or read the user agent. The plan is to
keep the runner's own browser stand-in and change only the one thing a test needs
— the address the page thinks it is on — using the browser's own history API.
The server side (no browser at all) is then reached the other way round, by
deliberately replacing `window` with nothing for those few tests. This answers
**OQ-6**: the shared setup is reworked, and `AC-8` is what proves the three
existing tests survive it.

**Second, no test may wait on the real clock.** This answers **OQ-5**. Three
exports wait: the two cart helpers sleep one second at a time for up to five
minutes, and the readiness helper checks every second and, in one case, never
stops. The plan is to use the runner's fake clock for all three and move time
forward on purpose. For the case that never finishes, the test never waits on it
directly — it races it against an already-finished value and proves the helper
did **not** win. Every test in this group also carries its own time limit, so if
the fake clock is ever set up wrongly the test fails in seconds instead of
hanging the suite.

Two alternatives were rejected. Splitting the tests across several files was
rejected because the conventions put the test next to the code it tests, and one
source file should not sprout five test files. Changing `utils/functions.tsx` to
make it easier to test was rejected because the conventions forbid it — the
things that make it awkward are recorded as findings instead.

## Steps

1. **Rework the setup in `utils/functions.test.ts`.** Keep the runner's browser
   stand-in instead of replacing `window`. Add a small helper that sets the page
   address and then loads the module fresh, because the module reads the address
   the moment it is loaded. Add a second helper that loads the module with no
   browser at all, for the server-side tests. Pin the clock to a fixed moment so
   the timestamp the error logger writes is the same on every machine. Silence
   and record the console line the story helper prints. Confirm the three
   existing tests still pass before going further.
2. **Cover the exports that need nothing but input and output:** the browser
   check, the store readers for chat and stories, the store-last-json flag, the
   image address builder, and the product comparison. Normal path plus the edges
   the spec lists — missing input, wrong type, empty object.
3. **Cover the price helper.** Zero, a value under the thousands boundary, a
   value inside it, a value over the millions boundary, with and without a
   currency rate, with a rate that would normally cause a rounding error, and
   with the number-only switch on. Include the Arabic short forms. Pin the fact
   that the language always comes from the argument and never from the shared
   state, and note it as a finding.
4. **Cover the translation helper.** Stand in for the three translation files so
   the real ones are never loaded. Prove: English gives the key back; a language
   with translations gives the translation; a key with no translation gives the
   key back; an unknown language gives the key back; the server side takes the
   language from the app rather than the address bar; and the second call for the
   same language is served from memory.
5. **Cover the search history helper.** Empty storage, storage with a list, the
   same word typed again in different capital letters, and storage holding
   something that is not valid data. Prove both what it returns and what it
   stored — they are not the same thing, and that is a finding.
6. **Cover the two compare helpers.** Every slot combination: nothing set, only
   the first set, both set, removing the first, removing the second, and removing
   something that is in neither. Prove the returned link, the cookies written or
   deleted, and that the browser was told about the change. Record that a change
   is announced even when nothing changed.
7. **Cover the three helpers that wait**, using the fake clock as described in
   the Approach. Prove: with a user present, the request goes out once and the
   result reaches the shared state; with no user present, no request goes out;
   the loop in the older cart helper cannot see a user who arrives late, while
   the newer one can; and the readiness helper never finishes when the flag was
   false at the moment it was called. Each test carries its own time limit.
8. **Cover the cart overview helper and the error-logging pair.** For the
   overview: success reaches the shared state, and a failure is logged rather
   than thrown. For the logger: what it hands on, that it stops while the user is
   logging out, that it copes with an `Error`, a plain object, a bare string and
   nothing at all, and that it never throws even when the send fails. For the
   store helper: the address, the method and the body it posts, that it does
   nothing at all when there is no browser, and that a failed send is swallowed.
9. **Write the findings up** in `implement.md`, one entry per finding, naming the
   export and what the code actually does — `AC-4`.
10. **Run the validation profile** and record the results. Run the coverage
    command by hand and record the new number against the starting point of
    13.42% of statements and 3 of 28 functions — `AC-13`.

## Files to change

- `utils/functions.test.ts` — the only source file this ticket touches. The three
  existing tests stay; the setup around them is reworked and roughly fifteen new
  `describe` blocks are added, one per uncovered export.
- `_specs/unit-tests-functions-completion/implement.md` — the record `/implement`
  writes, carrying the list of findings (`AC-4`).

Deliberately **not** changed, and why:

- `vitest.config.mts` — `utils/functions.tsx` is already in its coverage list, so
  there is nothing to add. Touching it would put this ticket's number at the
  mercy of an unrelated edit.
- `utils/functions.tsx` — the file under test. Out of scope by the spec
  (**OQ-2**).
- `tests/mocks/**` and `tests/fixtures/**` — used as they are. The stand-in for
  the three translation files is kept inside this test file rather than added to
  the shared kit, because only this module loads them today. If a later phase
  needs the same thing, that phase can lift it out.
- No `protected_paths` file is changed. `utils/functions.tsx` and
  `utils/functions.test.ts` are not on the protected list. The protected cookie
  manager is only ever stood in for, never opened.

## Integration surface

> Required (PL-11, ADR-014). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** no product code at all — this ticket
  adds tests only. What it *does* touch beyond its own file is the shared test
  kit it reads from (`tests/mocks/store.ts`, `cookieManager.ts`, `fetchData.ts`,
  `localization.ts`, `mockFetch.ts`), the coverage list in `vitest.config.mts`
  that already names the module, and — most importantly — the **`unit-tests`
  check**, which is the command `pnpm test:run` behind the `tests-and-types`
  validation profile.
- **Who else depends on them:** the `unit-tests` check is shared by **every
  future ticket** that names `tests-and-types`. The whole test roadmap — 108
  phases still to come — runs through it. `tests/mocks/mocks.test.ts` also
  depends on the shared stand-ins staying as they are: it loads the real cookie
  module once and checks that every name copied into the stand-in still matches.
- **Overlapping flows:** the three tests that already pass in this file share the
  setup being reworked, so they are in the same blast radius as the new ones.
  Beyond that, the exports covered here are read by roughly 260 files across the
  cart, the listing pages, the product pages, the seller dashboard and the search
  box — but this ticket only reads that code to understand it, and changes none
  of it.
- **Ordering / lockstep dependencies:** one thing has to happen in a set order
  inside each test. `utils/functions.tsx` does work the moment it is loaded — it
  reads the page address and may start loading a translation file. So the
  address, the stand-ins and the fake clock must all be in place **before** the
  module is loaded, and the module must be loaded fresh for each test. Get that
  order wrong and a test either reads the previous test's address or throws while
  loading.
- **What breaks if this is wrong:** the worst case is not a wrong assertion, it
  is a test that never finishes. `pnpm test:run` has no time limit of its own, so
  a single test awaiting the readiness helper — the one that can never finish —
  would hang the command. That command is the `unit-tests` check, so a hang here
  would freeze the `/verify` gate of every later ticket using `tests-and-types`,
  and it would look like a stuck terminal rather than a failure. Two guards
  against it: the fake clock, and a time limit on every test in that group. The
  second worst case is quieter — a test that passes because a stand-in returned
  a default nobody meant, proving nothing. That is why the waiting tests assert
  the number of requests made, not only the value returned.

## Validation strategy

- Validation profile: `tests-and-types`
- This answers **OQ-7**. `tests-and-types` is the profile written for tickets
  that add tests: it runs the unit tests, the type check and the lint. It leaves
  out the unused-file check on purpose, because adding files is normal work here,
  and it leaves out the production build, because this ticket touches no code
  that runs in the product.
- The profile covers what matters here: the suite runs and exits (which is also
  how `AC-9` is proven), the types still compile, and the lint still passes. The
  lint run matters more than it looks — the two translation rules are off for
  test files, but every other rule still applies to them.
- Two things the profile does not cover, both done by hand at `/verify` and
  written into `verify.md`:
  - The coverage number for `AC-13`. It comes from the coverage command, which is
    deliberately a separate hand-run command, not a gate check.
  - Reading the finished test file for `AC-1`, `AC-2`, `AC-3`, `AC-10` and
    `AC-11` — that all 18 exports appear, that each has a normal path and an
    edge, that a test pinning odd behaviour says so, that nothing reaches the
    network or the real translation files, and that the ambient things are
    pinned.
- `AC-12` is proven by the change list itself: `utils/functions.tsx` must not
  appear in it.

## Rollback

Revert the one file, `utils/functions.test.ts`. Nothing else is touched — no
product code, no configuration, no data, no stored state, and nothing that runs
in a browser or on a server. There is no partly-applied state to unpick and
nothing to undo in any environment. Since no commit is made at `/implement`, an
abandoned attempt is discarded by throwing away the working-tree change; after
delivery it is a single-file revert.

## Out of scope

- Changing `utils/functions.tsx`, including repairing anything the tests reveal.
  Each repair is its own ticket (**OQ-2**).
- Testing the modules it imports — the fetch helper, the cookie manager, the
  shared state, the error reporting, the request catalogue. Each has its own
  phase.
- Any coverage percentage as a pass mark (**OQ-1**).
- Adding to the shared test kit, or changing it in a way that moves any other
  test file.
- Changing `vitest.config.mts`.
- CI, pipelines, or uploading coverage anywhere.
- Component, browser and end-to-end tests.
