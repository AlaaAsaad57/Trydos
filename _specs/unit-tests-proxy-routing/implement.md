---
ticket: unit-tests-proxy-routing
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Implement — unit-tests-proxy-routing

> Record of what was actually built, following `plan.md`.

## Changes made

- `tests/proxy.test.ts` — **new, and the only file this ticket writes.** It holds
  72 tests covering AC-1 to AC-15, plus the local request builder, the loader
  that gives each test a fresh copy of the proxy, and the fake network.

Nothing else was touched. `proxy.ts` has no diff at all against `develop`
(AC-15), and no shared test file was edited (AC-14).

### How the file is built

- **The way in.** Each test builds a request, calls the exported `proxy()`
  function, then reads the status, the address in the `location` header, and the
  cookies on the response. The helpers inside `proxy.ts` are private, so this is
  the only way in — and it pins the behaviour a visitor gets rather than the
  shape of the code (NFR-4).
- **A fresh copy for every test.** `loadProxy()` calls `vi.resetModules()` and
  then imports the proxy, so every test starts with an empty country cache and
  an unset "already fetching" flag (OQ-2, NFR-2, AC-12).
- **A fake network.** `makeMockFetch` from `tests/mocks/mockFetch.ts` replaces
  the global `fetch`. It imports nothing, so it can never reach a real address,
  and it writes down every call — which is how the tests prove the background
  country lookup went out (OQ-2, NFR-1, AC-13).
- **The settings are pinned inside the file** with `vi.stubEnv`, not added to
  `vitest.config.mts`, so no other test file in the suite is affected.

### The test groups, and the criteria they prove

| Group | Criteria |
|-------|----------|
| choosing the language | AC-1, AC-2 |
| choosing the country, and in which order | AC-3 |
| passing through or redirecting | AC-4 |
| when the saved country differs from the address | AC-5 |
| the bounce limit | AC-6 |
| crawlers | AC-7 |
| the cookies the proxy leaves behind | AC-8 |
| sitemap addresses | AC-9 |
| recorded findings — today's behaviour | AC-10 |
| the paths the proxy runs on | AC-11 |
| what leaves the process, and what is remembered | AC-12, AC-13 |

AC-14 and AC-15 are proved by the whole-suite run and the empty `proxy.ts` diff,
both recorded under "Validation run" below.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

On branch `ticket/unit-tests-proxy-routing`, left uncommitted:

- `tests/proxy.test.ts` — new file, 72 tests.
- `_specs/unit-tests-proxy-routing/` — the workflow artifacts for this ticket
  (`intake.md`, `research.md`, `spec.md`, `plan.md`, `review.md`,
  `comprehension.md`, this file, and `ticket.md`).

## Deviations from plan

**None in what was built** — the plan's one file is the one file written, and
every step was carried out. Four things the plan left open or the review asked
for are settled here:

- **OQ-1 — the environment: the shared `jsdom` one, unchanged.** The fallback was
  not needed. `proxy.ts` loads and runs there, because `jsdom` does not define
  the web `Request`, `Response` and `Headers` objects, so Node's own versions
  stay in place underneath it. **No `@vitest-environment` marker was added**, and
  neither `vitest.config.mts` nor `tests/setup.ts` was touched.
- **The fake network and the pinned settings are set up before each test and
  undone after each test** (`beforeEach` / `afterEach`), not once for the whole
  file. This is the review's first follow-up: a single setup with a per-test undo
  would have left only the first test with a fake network.
- **`NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` is pinned in the test file too**, on top
  of the two settings the plan named. This is the review's second follow-up: the
  AC-10 preconnect-header test reads that value, and the shared list supplies it,
  so pinning it here stops another ticket's edit from breaking this test.
- **The backend address is `https://example.com`** — obviously fake, the same
  convention `vitest.config.mts` already uses. This is the review's third
  follow-up. No value was copied from a `.env` file.

## Behaviour that resisted testing, and findings

- **AC-13 is proved by the recorded calls, not by a failure.** The proxy swallows
  every error from its background country lookup on purpose, and replacing the
  global `fetch` takes the shared "a request nobody answered fails the test" rule
  out of the path for this file. So the test asserts the recorded call — its
  address, method and headers — which is what the plan and the review both
  expected. Nothing left the process: the fake network imports nothing.
- **A fourth surprising behaviour, found while writing the tests.** The spec named
  three (`AC-10`). This is a fourth, now pinned in the same group and marked the
  same way: an address whose first segment *looks* like a pair but names an
  unsupported country or language ends up with the prefix **doubled**. `/xx-en/shop`
  and `/gb-fr/shop` both redirect to `/gb-en/gb-en/shop?no-country=true`. The
  code swaps the bad prefix for the default and then adds the default in front
  again (`proxy.ts:566-572`, and the same shape at `proxy.ts:421-427`). Under
  C-1 this is recorded, not fixed. **A fix is its own ticket.**
- **The two testing documents still disagree about coverage** (OQ-5). Nothing was
  changed here; `proxy.ts` was already in the measured list. Still open for its
  own ticket.
- **Nothing else resisted testing.** No behaviour in the spec had to be left out.

## Validation run during implementation

- `pnpm exec vitest run tests/proxy.test.ts` — **passed.** 1 file, 72 tests.
- `pnpm test:run` (the whole suite) — **passed.** 7 files, 241 tests. The
  baseline recorded in `research.md` was 6 files and 169 tests, so this ticket
  adds 1 file and 72 tests and breaks nothing that passed before (AC-14).
- `pnpm exec tsc --noEmit` — **passed**, no output.
- `pnpm lint` — **passed.** 39 problems, **0 errors**, all of them warnings that
  already existed elsewhere in the repo. `tests/proxy.test.ts` produced none.
- `pnpm exec vitest run tests/proxy.test.ts --sequence.shuffle` — **passed**, 72
  tests, so the order the tests run in makes no difference (AC-12).
- `git diff develop -- proxy.ts` — **empty.** The file under test is unchanged
  (AC-15).
- `git status --porcelain` — only `tests/proxy.test.ts` and
  `_specs/unit-tests-proxy-routing/`, so no unrelated file was touched (IM-4).
- No commit was made and nothing was pushed (IM-9).
