---
ticket: unit-test-harness-and-coverage
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Implement — unit-test-harness-and-coverage

> Record of what was actually built, following `plan.md`.

Branch: `ticket/unit-test-harness-and-coverage`, created from a clean `develop`
(first run, IM-3). All eight files from `plan.md > Files to change` were changed
and nothing else (IM-4). No protected path was touched (IM-5). No commit was made
(IM-9).

## Changes made

- `vitest.config.mts` — added a `coverage` section: the `v8` provider, a `text`
  report for the console and an `html` report to browse, an `include` list naming
  **`utils/functions.tsx`** exactly, and an `exclude` for test files. The include
  list names files, not folders, so the number only describes tested code
  (AC-1, AC-2).
- `package.json` — added two scripts: `test:run` (runs once and exits) and
  `test:coverage` (the same with coverage). `test` was left as watch mode
  (AC-3, AC-4).
- `.claude/project-config.yaml` — added the `unit-tests` check, which calls the
  plain run-once script, and the `tests-and-types` group, which covers the tests,
  the type check and the lint check. The group deliberately leaves out the
  unused-file check and the build (AC-3).
- `eslint.config.mjs` — switched the two i18n rules off for files named
  `*.test.*` or `*.spec.*`. Matched by **file name**, not by folder, so a test
  sitting next to its source is covered. Placed after the i18n block so it wins
  (AC-9).
- `utils/functions.test.ts` — removed the `eslint-disable` line and the two lines
  that existed only to justify it; kept a one-line note that the untranslated key
  is deliberate (AC-8).
- `docs/testing/UNIT_TESTING.md` — **new**. The written conventions: the commands,
  where a test file goes including the protected-path rule, the lint position, how
  to mock, how the coverage list grows, what not to test, and what to do when a
  module resists testing (AC-5, AC-6).
- `tests/unitTests/init.test.tsx` — **deleted** (the scratch learning test)
  (AC-7).
- `tests/testUtils.ts` — **deleted** (its only importer was the file above)
  (AC-7). The `tests/` folder is now empty and gone; the next phase recreates it
  for fixtures.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `.claude/project-config.yaml` — modified (20 insertions, 0 deletions)
- `eslint.config.mjs` — modified
- `package.json` — modified (scripts only)
- `utils/functions.test.ts` — modified
- `vitest.config.mts` — modified
- `docs/testing/UNIT_TESTING.md` — new file
- `tests/testUtils.ts` — deleted
- `tests/unitTests/init.test.tsx` — deleted

Plus this ticket's own `_specs/unit-test-harness-and-coverage/` artifacts.

## Deviations from plan

- **The unused-file check could not be run.** `pnpm knip` fails because `knip` is
  not installed — the script is in `package.json` but the package is not a
  dependency. This is **not** something this ticket caused: the same script and
  the same missing dependency are already on `develop`, so the check fails there
  in exactly the same way. Because of this, the plan's fallback of adding an
  ignore entry for the coverage package was not needed and was not done, and
  `package.json` carries script additions only. The unused-file part of AC-9
  cannot be judged in this working tree; `/verify` has to weigh it against the
  fact that it was already unrunnable.
- **The conventions document restates where a test file goes.** The review
  accepted a finding saying the new document should stay to what the roadmap does
  not already cover. AC-6 requires the document itself to say where a test goes
  when the code is protected, so that rule is stated in full. The document does
  not repeat the roadmap's phase list and points at the roadmap for ordering.
- **The positive lint check was done read-only.** The review asked `/verify` to
  prove that a bad translate key in a normal source file still fails lint. Doing
  that by editing a source file would break IM-4, so it was proved by printing
  the resolved lint configuration for two files instead. Result below.
- Nothing else differed from the plan.

## Validation run during implementation

- `pnpm test:run` — **pass**. 1 file, 3 tests, exits on its own (AC-4, AC-8).
- `pnpm test:coverage` — **pass**. Prints a table and writes `coverage/`. Reports
  on `functions.tsx` only: 13.42% statements, 5.14% branches, 10.71% functions,
  13.36% lines (AC-1, AC-2).
- `pnpm exec tsc --noEmit` — **pass**, exit 0 (`typecheck`).
- `pnpm lint` — **pass**, exit 0. 0 errors, 39 warnings, all pre-existing
  (`lint`). No "unused eslint-disable" warning appears for
  `utils/functions.test.ts`, which confirms the removed comment was the right one.
- `pnpm build` — **pass**, exit 0 (`build`). The `full-build` profile is
  therefore satisfied in full.
- `pnpm knip` — **could not run**. `knip` is not installed; identical on
  `develop`. See Deviations.
- `pnpm exec eslint --print-config` on two files — **pass**. On
  `utils/functions.test.ts` both i18n rules resolve to `0` (off). On
  `utils/functions.tsx` `local/translate-key-exists` resolves to `2` (error) and
  `i18next/no-literal-string` to `1` (warn). The exemption reaches test files and
  nothing else.
- `git status` — **pass**. Only the eight planned files changed. No protected
  path appears (AC-11).
- `git check-ignore coverage/index.html` — **pass**. The coverage folder exists
  and git ignores it (AC-10).
- `git diff --stat .claude/project-config.yaml` — **pass**. 20 insertions, 0
  deletions, so `protected_paths` cannot have been altered.
