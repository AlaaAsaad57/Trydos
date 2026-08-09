---
ticket: unit-test-harness-and-coverage
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-09
links:
  clickup:
  github:
---

# Research — unit-test-harness-and-coverage

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Give the existing test suite a coverage report, one written set of rules for
writing tests, and a way for the workflow to run the suite at a gate.

## Relevant directories

- `tests/` — the existing test folder. It holds `testUtils.ts` (one toy
  function, `Sum`) and `unitTests/init.test.tsx` (a scratch learning file). It is
  also the folder the roadmap picks for tests of code that sits under a
  protected path.
- `utils/` — holds `functions.test.ts`, the only real test file today and the
  pattern later phases copy.
- `docs/testing/` — holds `UNIT_TEST_ROADMAP.md` (tracked) and two tester guides.
  The natural home for a conventions document.
- `.claude/` — holds the workflow's own configuration and rules, including the
  file the new gate check has to go into.
- `coverage/` — the output folder. It does not exist yet. Git already ignores it.

## Relevant config files

- `vitest.config.mts` — the test runner. It sets `globals: true`, the `jsdom`
  environment, and the `tsconfigPaths()` and `react()` plugins. **There is no
  `coverage` block.**
- `package.json` — `test` runs `vitest` (watch mode). `@vitest/coverage-v8`
  version `4.1.10` is already a devDependency and matches the installed
  `vitest` `4.1.10`. There is **no `knip` section**, so `knip` runs on its
  defaults.
- `tsconfig.json` — already lists `vitest/globals` under `types`, so the global
  `describe` / `it` / `expect` type-check. `include` covers `**/*.ts` and
  `**/*.tsx`; `exclude` is only `node_modules`.
- `.claude/project-config.yaml` — holds `validation_checks` (the commands) and
  `validation_profiles` (the selection). Today there are four checks
  (`typecheck`, `lint`, `build`, `knip`) and two profiles (`standard-frontend`,
  `full-build`). **Nothing runs the test suite.** This file also holds
  `protected_paths`, which was read to understand it and not changed.
- `.gitignore` — line 13 already ignores `/coverage/*`. Line 15 still ignores
  `.nyc_output/*`, left over from a coverage tool the repo no longer uses.
- `eslint.config.mjs` — the i18n rules are scoped to `app/`, `components/`,
  `services/`, `utils/` and `store/`. A test file placed inside one of those
  trees is linted with `local/translate-key-exists` set to `error`. A file under
  `tests/` is not in scope and is exempt.
- `.gitlab-ci.yml` — a dead pipeline. It calls `yarn`, `nyc`, `cypress` and
  `codecov`, none of which are installed, and it is limited to a branch named
  `development` while the working branch is `develop`. It collects a `coverage`
  folder that nothing produces.

## Possibly affected services

**No runtime service of the storefront is affected.** This ticket changes test
tooling and workflow configuration only. Nothing it touches is imported by the
app at runtime, and no `protected_paths` file is involved.

The tooling that could be affected:

- **The workflow's own `/verify` step** — adding a check and a profile to
  `.claude/project-config.yaml` changes how every future ticket is verified, not
  only this one. A malformed entry breaks `/verify` for all tickets.
- **`pnpm knip`** — removing the scratch test file changes which files have a
  user, so the existing `knip` check may start reporting a file as unused.
- **`pnpm lint`** — where test files are placed decides whether the i18n rules
  apply to them.
- **`pnpm build` and `pnpm exec tsc --noEmit`** — `tsconfig.json` includes every
  `.ts` and `.tsx` file, so new test files are type-checked along with the app.

## Test / validation commands available

Listed only. None were run during research.

- `pnpm test` — runs `vitest` in **watch mode**. It does not exit on its own.
- `pnpm exec vitest run` — runs the suite once and exits.
- `pnpm exec tsc --noEmit` — the `typecheck` check in `project-config.yaml`.
- `pnpm lint` — the `lint` check.
- `pnpm build` — the `build` check.
- `pnpm knip` — the `knip` check (unused files, exports and dependencies).
- `pnpm lint:i18n-parity` — the translation parity script.
- Existing profiles: `standard-frontend` (typecheck + lint) and `full-build`
  (typecheck + lint + build).

## Risks and unknowns

- **`pnpm test` is watch mode** — a gate check that called it would never
  finish and would hang `/verify`. Certain to happen if the check is written
  carelessly. High impact.
- **`tests/testUtils.ts` has exactly one user.** A repository search found
  `tests/unitTests/init.test.tsx` as its only importer. Deleting that scratch
  file leaves `testUtils.ts` with no user, and `pnpm knip` may then report it and
  fail the existing `knip` check. Likely. Medium impact — it would fail a gate
  for a reason unrelated to the work.
- **`knip` runs on defaults.** There is no `knip.json` and no `knip` key in
  `package.json`, so how it treats test files is unknown until it is run. `/plan`
  needs this answered before it can promise the `knip` check still passes.
- **Where a test file goes changes which lint rules hit it.** A test colocated
  under `utils/`, `services/`, `store/`, `components/` or `app/` is checked by
  `local/translate-key-exists` at error level — `utils/functions.test.ts`
  already carries an inline disable comment for exactly this. Tests under
  `tests/` avoid it. Certain. Low impact per file, but it repeats across all 119
  later phases.
- **Editing `.claude/project-config.yaml` touches the workflow's source of
  truth.** It is not a protected path, but a mistake there affects every ticket,
  not just this one. Low likelihood, high impact.
- **A coverage threshold set now would not mean anything.** There are 6 tests
  against roughly 34,000 lines of non-component source, so any honest global
  number is near zero. Setting one early either blocks the gate or is set so low
  it says nothing.
- **`vite-tsconfig-paths` prints a warning** that Vite now resolves `tsconfig`
  paths natively and the plugin can be removed. Observed in test output before
  this ticket was opened. It is noise, not a failure, and cleaning it up is not
  part of this ticket unless `/spec` puts it in scope.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `protected_paths` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Is the scratch file `tests/unitTests/init.test.tsx` deleted in this ticket, and if it is, does `tests/testUtils.ts` go with it? | `testUtils.ts` has no other user. Leaving it may fail the `knip` check; removing it is a second deletion that has to be agreed. |
| OQ-2 | Which directories does the first coverage `include` list name? | The list decides what the coverage number describes. Naming untested directories makes the number meaningless. |
| OQ-3 | Does this ticket set coverage thresholds, or are they left until later phases have covered enough code? | A threshold set now is either near zero or blocks the gate. |
| OQ-4 | Do the conventions go into a new file `docs/testing/UNIT_TESTING.md`, or into a document that already exists? | Decides whether this ticket adds a file or edits one, and where the 119 later phases look for the rules. |
| OQ-5 | What command does the new `unit-tests` check run, given `pnpm test` is watch mode and would hang a gate? | A gate check must finish on its own and return an exit code. |
| OQ-6 | Does the `tests-and-types` profile include the `knip` check, or only `unit-tests`, `typecheck` and `lint`? | Every later phase names this profile. Including `knip` makes all 119 phases sensitive to unused-file reports. |
| OQ-7 | Is "colocated by default, `tests/` mirror for protected paths" kept, or do all test files move under `tests/`? | Colocated tests are linted by the i18n rules and need disable comments; the mirror avoids that but splits the convention in two. |
| OQ-8 | Which coverage reporters are produced, and is the HTML report enough without a machine-readable one? | There is no CI to consume a report, so anything beyond local reading is unused work. |

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
