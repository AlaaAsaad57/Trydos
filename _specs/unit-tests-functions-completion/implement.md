---
ticket: unit-tests-functions-completion
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Implement — unit-tests-functions-completion

> Record of what was actually built, following `plan.md`.

## Changes made

- `utils/functions.test.ts` — grown from 3 tests to **84**, covering all 18
  exports of `utils/functions.tsx`. One `describe` block per export, in the same
  order as the source. The setup around the three original tests was reworked as
  the plan described:
  - The whole `window` is no longer replaced with a bare object. The runner's own
    browser stand-in is kept and only the page address is changed, using the
    browser's history. The server side is reached the other way round, by
    deliberately setting `window` to nothing for those tests.
  - The three translation files are stood in for at the top of the file, so no
    reload can reach the real ones (~466KB together).
  - The clock is pinned, browser storage is emptied, and a stand-in for `fetch`
    is installed before every test.
  - Everything that waits runs on a fake clock, with its own time limit.
- `_specs/unit-tests-functions-completion/implement.md` — this record.

**Not changed:** `utils/functions.tsx` (the module under test), `vitest.config.mts`
(the module was already in its coverage list), and everything in `tests/mocks/`
and `tests/fixtures/`. No `protected_paths` file was touched.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `utils/functions.test.ts` — modified, uncommitted on branch
  `ticket/unit-tests-functions-completion`.
- `_specs/unit-tests-functions-completion/` — the ticket's own workspace, still
  untracked.

## Findings (AC-4)

Places where `utils/functions.tsx` does not do what it looks like it should.
**None of these were repaired** — the conventions say a testing ticket records a
finding and never changes the file it tests (`spec.md` OQ-2, AC-12). Each one is
pinned by a test whose name begins "pins today's behaviour", so nobody later
mistakes it for what we want. Each deserves its own ticket.

| # | Export (line) | What the code actually does | Where it shows |
|---|---|---|---|
| F-1 | `WaitForCondition` (401) | It reads the readiness flag **once, before** its repeating check starts, so the check re-reads a frozen copy and never the shared state. If the flag is false when it is called, it never finishes — there is no time limit, and the repeating check is never stopped. | `services/home.ts:109` waits on it before loading customer information. If the flag is not already set, that never loads, silently, and a timer runs for the life of the page. |
| F-2 | `getOldCart` (214) | Its user id is worked out **once, outside** the waiting loop, and the loop only sleeps. So a user who signs in while it waits is never noticed: it waits the full five minutes and gives up. `getCart` (258) does the same job with a value it re-reads inside the loop, so the two behave differently. | `components/Cart/OldCartContainer.tsx:126` and `:163`, `components/Cart/index.tsx:645`. |
| F-3 | `onClickSearchHistory` (196) | On a repeat search it stores nothing — correctly — but still hands back a list with the word in front of a list that already contains it. The caller is given a duplicate that was never stored. | `components/Home/Search/SearchIcon.tsx:532` puts that list straight on screen, so the shopper sees the word twice until they reload. |
| F-4 | `onClickSearchHistory` (198) | It reads stored search history with no guard. If the stored value is not valid data, it throws out of a click handler. | Same call site as F-3. |
| F-5 | `RoundPrice` (176) | The language argument has a default of `"en"`, so the fallback to the shared state's language can never run. The Arabic short forms at 179–180 only ever appear when the caller passes the language itself. | 22 of the 46 files that call it pass a language; the other 24 do not, so an Arabic shopper sees `K` and `M` there whatever the app language says. |
| F-6 | `RoundPrice` (182–192) | A missing or unreadable price becomes `NaN`, which fails every band test and falls into the millions branch — so the shopper is shown the text **`NaNM`**. | Any call site that can pass an absent price. |
| F-7 | `getConfiguredImage` (99–104) | The object branch replaces `"/upload/"` — the slash included — with a replacement that has no trailing slash, so the rest of the path is glued to the settings (`…/so_0v1/b.jpg`). The text branch replaces `"/upload"` and keeps the slash, so the two branches disagree. | Any image passed as an object whose path is on the media host. |
| F-8 | `getConfiguredImage` (105) | The fallback is `src?.file_path \|\| src \|\| ""`, so an object with no path falls through to **the object itself**. Callers expect text and get an object. | Any image object that arrives without a path. |
| F-9 | `removeFromCompare` (468) | When the slug matches neither compare slot it returns nothing — but still tells the browser the comparison changed, so every listener re-reads for nothing. | `components/global/compare.tsx` and anything listening for the compare event. |
| F-10 | `getUserStories` (77) | It prints the story state **and the whole profile cookie** to the console on every call. Profile data reaches every shopper's browser console in production. | Raised by the security lens at `/review`; kept as its own finding. |
| F-11 | `translateFunction` (66) / `loadTranslations` (28) | Nothing remembers that a load is already on its way, so every call made before the first one finishes starts another import of the same file — 158KB for Arabic. A component rendering in a loop pays for it repeatedly. | Found while testing; see deviation D-3. |

## Notes carried from the review panel

- **AC-11, what "ambient" means here.** The criterion names the time zone and the
  formatting locale. This module reads **neither**: its only date is written as an
  ISO string, which is always UTC, and its numbers are built by joining plain
  strings. So AC-11 is met by pinning the clock, the language and the page
  address — all three are pinned in the setup. There is nothing else to pin, and
  no change to `vitest.config.mts` was needed.
- **Correction to the plan's Integration surface.** The plan claimed
  `pnpm test:run` has no time limit of its own. That is wrong: the runner stops a
  test after five seconds by default, so a stuck test fails rather than hanging
  the gate. The guard still stands — the tests that wait carry their own limit of
  four seconds, under the default, so the limit adds something rather than
  repeating it.
- **Payloads are all fake.** The error-logger tests build their session data from
  the stand-ins and fixtures. Nothing was captured from a real browser.

## Deviations from plan

- **D-1 — the stand-ins are built at load time, not in `beforeEach`.** The plan
  assumed a fresh stand-in per test would follow from resetting the module
  registry. It does not: a `vi.mock` factory runs **once** and its result is kept
  even across a registry reset. The first version of the file therefore had every
  test after the first looking at the first test's state — 17 tests failed for
  that reason. The factories now hand every call on to an instance that the
  loader rebuilds from the seeds, immediately before the module is loaded. That
  is also the only point late enough to see seeds a test sets in its own body.
- **D-2 — the stable spies are reset by hand.** `vi.clearAllMocks()` clears calls
  but not anything a test taught a spy, so a test that made the error reporter
  throw would have leaked that into the next test. The three long-lived spies are
  reset explicitly in `beforeEach`.
- **D-3 — two translation tests were made deterministic instead of waiting.** The
  plan said to prove the server-side language by loading a translation. Repeated
  registry resets plus a stood-in dynamic import stop resolving after a handful
  of loads in one file: the same test passes alone and fails in place, and a
  five-second wait does not help. This is a limitation of the test runner, not of
  our code, and a test that depends on it would be a flake in the check that
  gates every later ticket. So the server-side tests now prove the decision
  rather than the download — that the app is asked for the language when there is
  no browser, and that a language passed by the caller short-circuits the
  question entirely. The loaded-translation path is still proven for real, on the
  browser side, for Arabic, Turkish and Kurdish. The underlying cause is recorded
  as finding F-11 rather than as a test.
- **D-4 — three expectations changed to match reality.** Three tests were written
  against what the code looks like it should do and were corrected to what it
  does: a missing price renders as `NaNM` (F-6), an object with no path comes
  back as an object (F-8), and the object branch of the image builder loses a
  slash (F-7). Each is now a pinned finding rather than a wrong expectation.

Nothing else differs from the plan. No file outside "Files to change" was
touched, and no `protected_paths` file was involved.

## Validation run during implementation

Profile named in `plan.md`: **`tests-and-types`**.

| Command | Result |
|---|---|
| `pnpm test:run` (check `unit-tests`) | **pass**, exit 0. 129 tests in 3 files, about 9 seconds. Run twice in a row with the same result, and the command exits on its own. 84 of those tests are in `utils/functions.test.ts`. |
| `pnpm exec tsc --noEmit` (check `typecheck`) | **pass**, exit 0. No output. |
| `pnpm lint` (check `lint`) | **pass**, exit 0. 39 warnings, 0 errors — all of them in other files and all present before this ticket. None in `utils/functions.test.ts`. |

Run by hand, for AC-13 (coverage is deliberately not a gate check):

| Command | Result |
|---|---|
| `pnpm test:coverage` | Statements **13.42% → 99.53%** (215/216) · Branches **5.14% → 92%** (161/175) · Functions **3/28 → 28/28 (100%)** · Lines **13.36% → 100%** (202/202). |
