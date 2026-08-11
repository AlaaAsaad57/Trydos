---
ticket: unit-tests-proxy-routing
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Verify — unit-tests-proxy-routing

> Final validation and impact review before the ticket is closed.

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: `tests-and-types`

The profile was resolved from `project-config.yaml`: profile → required checks
(`unit-tests`, `typecheck`, `lint`) → the command written against each check in
`validation_checks`. No command was written here. Everything ran locally.

Depth is `all-ac` (MO-6 / VF-4): every acceptance criterion has a result below.
The evidence for AC-1 to AC-13 is the named test group inside
`tests/proxy.test.ts`, all of which ran as part of the `unit-tests` check.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Group "choosing the language (AC-1, AC-2)" — each of `en`, `ar`, `tr`, `ku` in the address is kept; `gb-fr` is refused and falls back to English | `pnpm test:run` | 0 | 5 tests passed | pass |
| AC-2 | Same group — the browser's preference is used when supported (`ar-SA` → `/gb-ar/shop`); missing or unsupported preference falls back to English | `pnpm test:run` | 0 | 3 tests passed | pass |
| AC-3 | Group "choosing the country (AC-3)" — uppercase saved values and an uppercase request country are both accepted; saved beats request-country beats default; an unsupported saved country or language is refused; all four fallback countries are supported | `pnpm test:run` | 0 | 11 tests passed | pass |
| AC-4 | Group "passing through or redirecting (AC-4)" — a valid pair passes through with no `location`; `/shop/shoes?x=1&y=2` keeps its path and query; the site root is handled; no response carries a rewrite header | `pnpm test:run` | 0 | 4 tests passed | pass |
| AC-5 | Group "when the saved country differs from the address (AC-5)" — the marker names both countries (`changed-country=lb%2Ctr`); an address saying `gb` goes to the saved country with the cookies attached | `pnpm test:run` | 0 | 3 tests passed | pass |
| AC-6 | Group "the bounce limit (AC-6)" — a bounce count above the limit lands on `/gb-en/shop?no-country=true`; within the limit it still bounces | `pnpm test:run` | 0 | 2 tests passed | pass |
| AC-7 | Group "crawlers (AC-7)" — five crawler agents pass through with a valid pair; without one a crawler gets a 308; no `changed-country` or `no-country` marker and no cookie is ever written for a crawler | `pnpm test:run` | 0 | 9 tests passed | pass |
| AC-8 | Group "the cookies the proxy leaves behind (AC-8)" — the three locale cookies are readable by the browser (`httpOnly: false`), `userIP` is not (`httpOnly: true`), the referring site is saved only when the visit came from elsewhere, and the logout marker is cleared on a pass-through but kept on a redirect hop | `pnpm test:run` | 0 | 8 tests passed | pass |
| AC-9 | Group "sitemap addresses (AC-9)" — four sitemap addresses pass through untouched, including behind a locale prefix, with no cookie; a sitemap still passes through when the saved country disagrees | `pnpm test:run` | 0 | 5 tests passed | pass |
| AC-10 | Group "recorded findings — today's behaviour, not wanted behaviour (AC-10)" — each test name begins `RECORDED FINDING:` and the group heading says the same in words. Covers the `robots` redirect, the capital-letter 308, the connection-warming headers on that 308, and the doubled prefix | `pnpm test:run` | 0 | 4 tests passed | pass |
| AC-11 | Group "the paths the proxy runs on (AC-11)" — four paths named as in, eight named as out. The exact text of the setting is never asserted; the test builds the rule from it and checks named paths | `pnpm test:run` | 0 | 13 tests passed | pass |
| AC-12 | Whole suite run twice and once shuffled — same result each time. Also proved inside the file: one test fills the country cache, and the test after it loads a fresh copy and sees an empty one | `pnpm test:run` (×2) and `pnpm exec vitest run --sequence.shuffle` | 0 | 7 files, 241 tests passed each time; shuffled run used seed `1786431336964` | pass |
| AC-13 | Group "what leaves the process, and what is remembered (AC-12, AC-13)" — the only call recorded is `GET https://example.com/countries`; the fake network is hand-written and imports nothing, and the shared "a request nobody answered fails the test" rule stays on for every other file | `pnpm test:run` | 0 | 5 tests passed; recorded call count is 1 | pass |
| AC-14 | Baseline on `develop` is 6 test files; the run is now 7 files and 241 tests, all passing. `git status` shows one added file and no other test file changed | `pnpm test:run` + `git status --porcelain` | 0 | 7 files / 241 tests passed; working tree shows only `tests/proxy.test.ts` and `_specs/unit-tests-proxy-routing/` | pass |
| AC-15 | `proxy.ts` compared against `develop` | `git diff develop -- proxy.ts` | 0 | 0 lines of diff — the file is unchanged | pass |

### The profile checks, one row each

| Check | Command (from `validation_checks`) | Exit | `pass_when` | Output summary | Result |
|-------|------------------------------------|------|-------------|----------------|--------|
| `unit-tests` | `pnpm test:run` | 0 | `exit-zero` | 7 files, 241 tests, all passed | pass |
| `typecheck` | `pnpm exec tsc --noEmit` | 0 | `exit-zero` | no output | pass |
| `lint` | `pnpm lint` | 0 | `exit-zero` | 39 problems, **0 errors**, 39 warnings — all of them already existed elsewhere in the repo; `tests/proxy.test.ts` produced none | pass |

**VP-2 — the checks changed nothing.** `git status --porcelain` gives the same
two entries before and after the commands ran: `tests/proxy.test.ts` and
`_specs/unit-tests-proxy-routing/`. **VP-3 — the same result every time and no
questions asked:** the suite was run three times (twice in order, once shuffled)
with the same result, and none of the three commands waits for input.

## Commands run

- `pnpm test:run`
  ```
  Test Files  7 passed (7)
       Tests  241 passed (241)
  ```
- `pnpm exec tsc --noEmit`
  ```
  (no output — exit 0)
  ```
- `pnpm lint`
  ```
  ✖ 39 problems (0 errors, 39 warnings)
  ```
- `pnpm exec vitest run --sequence.shuffle`
  ```
  Running tests with seed "1786431336964"
  Test Files  7 passed (7)
       Tests  241 passed (241)
  ```
- `git diff develop -- proxy.ts`
  ```
  (empty — 0 lines)
  ```
- `git status --porcelain`
  ```
  ?? _specs/unit-tests-proxy-routing/
  ?? tests/proxy.test.ts
  ```

## Protected-path & runtime impact review

- **Were any `protected_paths` files changed by this ticket? — No.**
- `proxy.ts` is the first entry in `protected_paths` and it is the file under
  test. `git diff develop -- proxy.ts` is empty, so it is unchanged. The test was
  written into the `tests/` mirror, outside the protected area, exactly as the
  approved `plan.md` required (C-1, C-2, AC-15, GU-2 / IM-5).
- No other protected path was touched. The only files this ticket adds are
  `tests/proxy.test.ts` and the workflow artifacts under
  `_specs/unit-tests-proxy-routing/`.
- **Runtime impact: none.** No application code changed, so nothing a user sees
  behaves differently. A test file is never bundled or shipped.

## Sign-off

- Outcome: verified
- Final ticket state: closed   # reviewer transitions verified → closed
- Sign-off: developer (the ticket owner; comprehension check passed 4/4 — ADR-011)
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - **All 15 acceptance criteria pass.** Nothing failed and nothing was left
    without a result.
  - **One thing to carry out of this ticket.** A fourth surprising behaviour was
    found while writing the tests and is now pinned as today's behaviour: a first
    path segment that looks like a pair but names an unsupported country or
    language ends up **doubled** — `/xx-en/shop` and `/gb-fr/shop` both redirect
    to `/gb-en/gb-en/shop?no-country=true`. Under C-1 a test ticket records this
    and never fixes it. **A fix needs its own ticket.**
  - **Still open from research, and still out of scope:** the two testing
    documents disagree about how coverage is measured (OQ-5). Nothing here
    changed it; `proxy.ts` was already in the measured list.
