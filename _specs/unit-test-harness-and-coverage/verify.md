---
ticket: unit-test-harness-and-coverage
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Verify — unit-test-harness-and-coverage

> Final validation and impact review before the ticket is closed.

Checked on branch `ticket/unit-test-harness-and-coverage`. Depth: `all-ac` — every
acceptance criterion has a result (VF-4 / MO-6). Nothing was changed and no
commit was made (VF-7 / VF-10).

## Checks performed

> Reference acceptance-criteria IDs from `spec.md` (AC-1, AC-2, …).
> If `plan.md` named a validation profile, record each executed check resolved
> from `project-config.yaml` (profile → check → command), incl. exit code and a
> bounded output summary.

- Validation profile: `full-build` (resolved to `typecheck`, `lint`, `build`)

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | Coverage runs once, produces a readable report, exits | `pnpm test:coverage` | 0 | Prints a coverage table to the console and writes `coverage/`. Run ends on its own. | pass |
| AC-2 | Report covers only files that have tests | `pnpm test:coverage` | 0 | The table lists one file, `functions.tsx`. No untested file appears. | pass |
| AC-3 | Test check exists; group resolves; group excludes the unused-file check | config read (`.claude/project-config.yaml`) | — | `tests-and-types` requires `['unit-tests','typecheck','lint']`; all three are defined; `knip` and `build` are not in the group; `unit-tests` command is `pnpm test:run`. | pass |
| AC-4 | The check ends on its own and reports pass or fail | `pnpm test:run` (the `unit-tests` check) | 0 | 1 file, 3 tests passed. Returns to the prompt with no input. | pass |
| AC-5 | Written conventions exist | file read | — | `docs/testing/UNIT_TESTING.md` exists: commands, placement, lint position, mocking, coverage, what not to test. | pass |
| AC-6 | The conventions cover protected paths | file read | — | The document gives the `tests/` mirror rule with worked examples and lists all ten protected globs. | pass |
| AC-7 | Scratch test and toy helper are gone | file check | — | `tests/unitTests/init.test.tsx` and `tests/testUtils.ts` are both absent. | pass |
| AC-8 | The pre-existing real test still passes | `pnpm test:run` | 0 | `utils/functions.test.ts` — 3 tests passed. | pass |
| AC-9 | Type check, lint, build and unused-file report still pass | `pnpm exec tsc --noEmit` / `pnpm lint` / `pnpm build` / `pnpm knip` | 0 / 0 / 0 / 1 | Type check clean. Lint 0 errors, 39 pre-existing warnings. Build compiled in 2.0 min. **`knip` could not run — see the note below.** | pass (with a recorded limitation) |
| AC-10 | Coverage output stays out of version control | `git check-ignore coverage/index.html` | 0 | The folder exists and git ignores it. | pass |
| AC-11 | No runtime file and no protected file changed | `git status` | — | Only the eight planned files changed. No path matches a protected glob. `protected_paths` still holds 10 entries. | pass |

**Note on AC-9.** Three of its four clauses ran and passed. The fourth,
`pnpm knip`, exits 1 with "not recognized as an internal or external command":
`knip` is named in `package.json > scripts` but has never been a dependency and
is not installed. `develop` carries the same script and the same missing package,
so the command fails there in exactly the same way. This ticket did not cause it
and cannot have changed it. AC-9 is about the existing checks **still** passing —
that is, no regression — and there is provably no regression here. The clause is
recorded as unevaluable rather than failed. Fixing the unused-file check (install
`knip`, or remove the dead script) is outside this ticket's scope and belongs in
its own ticket.

## Commands run

- `pnpm exec tsc --noEmit`
  ```
  exit=0   (no output)
  ```
- `pnpm lint`
  ```
  exit=0
  ✖ 39 problems (0 errors, 39 warnings)
  ```
- `pnpm build`
  ```
  exit=0
  ✓ Compiled successfully in 2.0min
  ```
- `pnpm test:run`
  ```
  exit=0
   Test Files  1 passed (1)
        Tests  3 passed (3)
  ```
- `pnpm test:coverage`
  ```
  exit=0
  File           | % Stmts | % Branch | % Funcs | % Lines
  All files      |   13.42 |     5.14 |   10.71 |   13.36
   functions.tsx |   13.42 |     5.14 |   10.71 |   13.36
  ```
- `pnpm knip`
  ```
  exit=1
  'knip' is not recognized as an internal or external command
  ```
- `pnpm exec eslint --print-config` on two files (the positive lint check the
  review asked for, done read-only rather than by editing a source file)
  ```
  utils/functions.test.ts : local/translate-key-exists = [0]   i18next/no-literal-string = [0]
  utils/functions.tsx     : local/translate-key-exists = [2]   i18next/no-literal-string = [1]
  ```
  The exemption reaches test files and nothing else. A bad translate key in a
  normal source file would still be an error.
- `git diff --stat .claude/project-config.yaml` (the config check the review asked
  for)
  ```
  1 file changed, 20 insertions(+)
  ```
  Additions only, no deletions, so `protected_paths` cannot have been altered. A
  read of the parsed file confirms it still holds its 10 entries.
- `git status --porcelain` before and after running every check (VP-2)
  ```
  identical (md5 6621025c88fbb39445ec9dccc37de490)
  ```
  The checks changed no file.

## Protected-path & runtime impact review

- Were any `protected_paths` files changed by this ticket? **No.**
- If yes: which files, and was the change intended and reviewed? Not applicable.

None of the eight changed files matches a protected glob. `utils/functions.test.ts`
sits under `utils/`, but only `utils/cookies/**` is protected. `.claude/project-config.yaml`
holds the `protected_paths` list but is not itself protected, and its diff is
additions only, so the list is untouched.

**Runtime impact: none.** Nothing the storefront serves was changed. The changes
are the test runner settings, two package scripts, the workflow's own check
settings, the lint scope for test files, one test file's comment, one new
document, and two deleted scratch files. The production build succeeds and its
route list is unchanged.

## Sign-off

- Outcome: verified
- Final ticket state: closed   # reviewer transitions verified → closed
- Sign-off: developer (owner, self sign-off) — 2026-08-09
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes:
  - Comprehension check passed 4/4 (CG-4 requires 100%), one question above the
    floor of three, including the required integration question (CG-5). Recorded
    in `comprehension.md`.
  - All six accepted review follow-ups were honoured. The two aimed at `/verify`
    are both evidenced above: the positive lint check and the config diff.
  - One item for a future ticket, not a fault of this one: `pnpm knip` cannot run
    because `knip` is in `package.json > scripts` but is not a dependency. Either
    install it or drop the dead script.
  - Coverage stands at 13.42% of statements over the single file in the include
    list. That number is expected and is not a pass mark — no threshold is set,
    by design (`OQ-3`).
