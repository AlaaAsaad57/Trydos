---
ticket: unit-tests-functions-completion
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-10
links:
  clickup:
  github:
---

# Verify — unit-tests-functions-completion

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `tests-and-types`

The profile was resolved from `.claude/project-config.yaml`: profile
`tests-and-types` → checks `unit-tests`, `typecheck`, `lint` → the commands held
in `validation_checks`. All three ran locally, all three passed, and the working
tree was unchanged afterwards (VP-2). The coverage number for AC-13 comes from a
separate hand-run command, which is deliberately not a gate check.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | All 18 exports have a test. Read the finished file: 18 `describe` blocks, one per export, in source order — `SSRDetect`, `translateFunction`, `getUserChat`, `getUserStories`, `_isStoreLastJson`, `getConfiguredImage`, `RoundPrice`, `onClickSearchHistory`, `COMPARE_CHANGED_EVENT`, `addToCompare`, `removeFromCompare`, `areProductsEqual`, `getCart`, `getOldCart`, `GetCartOreview`, `WaitForCondition`, `storeError`, `LogError`. | read `utils/functions.test.ts`; `pnpm test:run` | 0 | 18 `describe` blocks, 84 tests in this file. None of the 18 exports is left out. | pass |
| AC-2 | Every tested function has a normal path and a real edge. Spot-checked across the file: `RoundPrice` (zero, under the boundary, at it, over the millions boundary, with and without a rate, text, missing); `getConfiguredImage` (text source, object source, no source, object with no path, host that is not the media host); `areProductsEqual` (missing product, same, different id, one choice differs, missing vs empty choice); `LogError` (`Error`, plain object, bare text, nothing). | read `utils/functions.test.ts` | — | Every `describe` block holds at least one normal-path test and at least one edge test. | pass |
| AC-3 | A test that pins odd behaviour says so. Every such test's name begins "pins today's behaviour", and each carries a comment saying what the code really does. | `grep -c "pins today's behaviour" utils/functions.test.ts` | 0 | 11 matches. They cover findings F-1 to F-9 (F-10 has its own named test; F-11 is recorded as a finding, not a test — deviation D-3). | pass |
| AC-4 | The record lists every place the code misbehaves, naming the export and what it does. | read `_specs/unit-tests-functions-completion/implement.md` | — | The **Findings** table holds 11 entries, F-1 to F-11. Each names the export with its line, what the code actually does, and where it shows in the app. | pass |
| AC-5 | The translation helper is proven for English, a language with translations, a key with no translation, and the server side. | `pnpm test:run` | 0 | 9 tests. English gives the key back; Arabic, Turkish and Kurdish each give their translation; an unknown key comes back as itself; an unknown language gives the key back; with no browser the app is asked for the language, and a language passed by the caller short-circuits that. | pass |
| AC-6 | The error-logging path is proven on what it hands on, on stopping while the user is logging out, and on never throwing when the send fails. | `pnpm test:run` | 0 | 8 `LogError` tests. The payload carries the profile, chat, stories, last paths, language, country, timestamp and address; nothing is reported while `LoggingOut` is true; it resolves rather than throws both when the reporter itself throws and when the send fails. | pass |
| AC-7 | The compare helpers are proven on the value, the cookies, and the browser being told; the search-history helper on the value and on what was stored. | `pnpm test:run` | 0 | `addToCompare` and `removeFromCompare` cover all slot combinations, assert on the cookie jar (written and deleted) and listen for `compare-changed`. `onClickSearchHistory` asserts both the returned list and the contents of storage — which differ on a repeat (finding F-3). | pass |
| AC-8 | The three tests that passed before this ticket still pass. | `git show HEAD:utils/functions.test.ts`; `pnpm test:run` | 0 | The three earlier assertions all still run and pass, renamed but unchanged in what they prove: `SSRDetect()` is true with a browser; `translateFunction("welcome")` gives the key back for English; `getUserChat()` reads the chat user from the shared state. | pass |
| AC-9 | `pnpm test:run` finishes and exits on its own; nothing waits on real clock time and nothing can hang. | `pnpm test:run` | 0 | 129 tests in 3 files, 7.99s, the command exits by itself. The five tests that wait all use the fake clock (`vi.useFakeTimers` + `advanceTimersByTimeAsync`) and each carries its own 4000ms limit, under the runner's 5000ms default. | pass |
| AC-10 | No test reaches the network, a real cookie store, real browser storage, or a real translation file. | read `utils/functions.test.ts` | — | The three translation files, `./cookies/cookie-manager`, `./fetchData` and `store` are all stood in for at the top of the file, so no reload can reach the real ones. `fetch` is replaced in `beforeEach` by a stand-in that reaches nothing; the tests that assert on a request replace it with a recording stand-in. Storage is the runner's in-process jsdom store, emptied before and after every test. | pass |
| AC-11 | Everything ambient is pinned, so the run is the same on any machine. | read `utils/functions.test.ts`; read `utils/functions.tsx` | — | The clock is pinned to a fixed moment, the language is seeded per test, and the page address is set before every load. Checked the module for the other two: it uses no `toLocale*` and no `Intl` — its one date is `new Date().toISOString()` (always UTC) and its sort compares `getTime()`. So there is no time zone or formatting locale to pin, and no config change was needed. | pass |
| AC-12 | The module under test is unchanged. | `git status --porcelain`; `git diff --stat` | 0 | One tracked file changed: `utils/functions.test.ts` (+1107 / −36). `utils/functions.tsx` does not appear. Neither does `vitest.config.mts`, `tests/mocks/**` or `tests/fixtures/**`. | pass |
| AC-13 | Coverage for the module is above the recorded starting point of 13.42% of statements and 3 of 28 functions. | `pnpm test:coverage` | 0 | `functions.tsx`: statements **99.53%**, branches **92%**, functions **100%** (28/28), lines **100%**. Well above the starting point on every measure. | pass |

## Commands run

- `pnpm test:run` — check `unit-tests` (`pass_when: exit-zero`) — **exit 0, pass**
  ```
   Test Files  3 passed (3)
        Tests  129 passed (129)
     Duration  7.99s
  ```
- `pnpm exec tsc --noEmit` — check `typecheck` (`pass_when: exit-zero`) — **exit 0, pass**
  ```
  (no output)
  ```
- `pnpm lint` — check `lint` (`pass_when: exit-zero`) — **exit 0, pass**
  ```
  ✖ 39 problems (0 errors, 39 warnings)
  ```
  All 39 warnings are in other files (`services/chat.ts`, `services/home.ts`,
  `services/order.ts`, `services/search.ts`, `services/sellerDashboard/index.ts`,
  `utils/history.ts`, `utils/usePhoneInput.tsx`) and all were there before this
  ticket. None is in `utils/functions.test.ts`.

Run by hand, outside the profile, for AC-13:

- `pnpm test:coverage` — **exit 0**
  ```
  File           | % Stmts | % Branch | % Funcs | % Lines
  functions.tsx  |   99.53 |       92 |     100 |     100
  ```

**VP-2 — the commands changed nothing.** `git status --porcelain` after the runs
shows the same two entries as before them: `M utils/functions.test.ts` and the
untracked `_specs/unit-tests-functions-completion/`. **VP-3** — the suite was run
twice with the same result, and no command asked a question. All four ran
locally; no CI, no outside runner.

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **No.**
- The only changed file is `utils/functions.test.ts`, which is not on the
  protected list. `utils/cookies/**` and `store/index.ts` are on the list and are
  only ever stood in for — the real modules are never opened or edited.
- Runtime impact: none. This ticket adds tests only. No product code, no
  configuration, no data and nothing that runs in a browser or on a server was
  changed.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer (the ticket owner, self sign-off — ADR-011), after the
  comprehension gate scored **4/4** (`comprehension.md > Verify gate`), including
  the required integration question about whether the plan's declared Integration
  surface held.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - **Result: PASSED.** All 13 acceptance criteria pass, at depth `all-ac`.
  - The 11 findings recorded in `implement.md` are **not** failures of this
    ticket. The spec put repairing them out of scope (OQ-2, AC-12); each one is
    pinned by a test and each deserves its own ticket. F-10 (the story helper
    printing the whole profile cookie to the console in production) and F-1
    (customer information silently never loading) look like the two worth raising
    first.
  - One correction the implementation made to the plan is worth keeping: the test
    runner **does** stop a test after five seconds by default, so a stuck test
    fails rather than freezing the shared `unit-tests` check that every later
    `tests-and-types` ticket depends on. The per-test four-second limits sit under
    that default, so they tighten it rather than repeat it.
