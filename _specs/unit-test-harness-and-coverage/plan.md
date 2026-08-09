---
ticket: unit-test-harness-and-coverage
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-09
links:
  clickup:
  github:
---

# Plan — unit-test-harness-and-coverage

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add a coverage section to the test runner settings, add two run-once scripts,
register a test check and a named check group in the workflow settings, delete
the scratch learning test and its toy helper, and write the conventions down in a
new document. Nothing the storefront uses at runtime is touched.

Two choices are worth stating. **First**, the coverage list starts as the single
file that actually has tests today, not a whole folder — a folder would report on
59 untested files and the number would say nothing (AC-2). Each later phase adds
its own entries. **Second**, test files stay next to the code they test, and the
translation lint rules are switched off for test files. The alternative was to
move every test into a separate folder; that was rejected because it would mean
rewriting the one working test's imports and risking AC-8, for no gain beyond
tidiness.

### OQ-4 — where the written rules go

**Answer: a new document, `docs/testing/UNIT_TESTING.md`.**

`docs/testing/UNIT_TEST_ROADMAP.md` says *what* to do and *in what order*. The
conventions say *how* to write a test. They change for different reasons and at
different times — a convention changing should not mean editing the roadmap that
119 tickets are reading. The other testing document in that folder is ignored by
git, so it cannot be the home for something all later tickets must read.

### OQ-7 — the one rule for where a test file goes

**Answer: a test file sits next to the file it tests. If that place is inside a
protected path, the test goes in a `tests/` mirror of the same path instead.**

This keeps the one real test where it already is, so AC-8 is not put at risk.
It also means no later ticket ever creates a file inside a protected path just to
add a test (AC-6, and GU-2 / IM-5 stay untroubled).

Research found the catch: the translation lint rules cover `app/`, `components/`,
`services/`, `utils/` and `store/`, so a test placed beside the source is checked
by them, and the one existing test already carries a hand-written exception
comment. Rather than repeat that comment in every future test file, this plan
switches the translation rules off for test files. That is correct on its own
terms — those rules exist to protect wording a user can see, and a test file ships
no wording to any user. The now-pointless exception comment in the existing test
is removed at the same time.

## Steps

1. Add a coverage section to the test runner settings: the `v8` provider, a
   human-readable console report plus a browsable HTML report, an explicit list
   naming only files that have tests, and exclusions for test files themselves.
2. Add two scripts: one that runs the suite once and exits, and one that does the
   same with coverage turned on. Leave the existing watch-mode script alone.
3. Delete the scratch learning test and the toy helper it imports. Remove the now
   empty folder they lived in.
4. Add a test check and a named check group to the workflow settings. The group
   covers the tests, the type check and the lint check. It does not include the
   unused-file check.
5. Switch the translation lint rules off for test files, and delete the exception
   comment in the existing test that this makes unnecessary.
6. Write the conventions document: where a test file goes (including the
   protected-path rule), how to mock a module, how the coverage list grows, and
   what not to test.
7. Run the validation described below and record the results.

## Files to change

- `vitest.config.mts` — add the coverage section (AC-1, AC-2).
- `package.json` — add the two run-once scripts (AC-3, AC-4). If the unused-file
  check reports the coverage package as unused, add an ignore entry for it here
  as well (AC-9).
- `.claude/project-config.yaml` — add the `unit-tests` check under
  `validation_checks` and the `tests-and-types` group under
  `validation_profiles` (AC-3).
- `eslint.config.mjs` — switch the translation rules off for test files
  (**OQ-7**; AC-9).
- `utils/functions.test.ts` — remove the exception comment that step 5 makes
  unnecessary (**OQ-7**; AC-8).
- `docs/testing/UNIT_TESTING.md` — **new file**, the written conventions
  (**OQ-4**; AC-5, AC-6).
- `tests/unitTests/init.test.tsx` — **delete** (AC-7).
- `tests/testUtils.ts` — **delete**; its only importer is the file above (AC-7).

**No protected path is listed here, and none is touched.** The protected globs
are `proxy.ts`, `serverRequests/**`, `utils/cookies/**`, `app/api/auth/**`,
`services/auth.ts`, `services/cart.ts`, `services/order.ts`, `services/orders.ts`,
`store/index.ts` and `next.config.ts`. `utils/functions.test.ts` sits under
`utils/`, but only `utils/cookies/**` is protected, so it is not one of them
(AC-11).

## Integration surface

> Required (PL-11, ADR-014). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** three shared settings files, none of
  them storefront code. `.claude/project-config.yaml` holds the checks used by
  **every** ticket's `/verify`. `eslint.config.mjs` decides which lint rules apply
  across the **whole repository**. `package.json` holds the script names that the
  new check calls. The coverage list inside `vitest.config.mts` is a shared list
  that all 119 later phases will edit.

- **Who else depends on them:** every future ticket depends on the workflow
  settings — `/verify` reads them to work out what to run. Every future test file,
  and anyone writing user-visible text, depends on the lint scope. Phases 2
  onwards depend on the `tests-and-types` group existing and on the conventions
  document being there to follow. The new check depends on the script name in
  `package.json` staying exactly as written.

- **Overlapping flows:** the coverage list is the one place all 119 later phases
  meet. Each adds its own entries to the same list, so two phases worked on at the
  same time will collide there. The lint settings are shared with the i18n
  enforcement work, which is a different concern using the same file.

- **Ordering / lockstep dependencies:** this ticket must land before any ticket
  that names the `tests-and-types` group, or that ticket's `/verify` will fail its
  profile check (VP-1). Within this ticket, the exception comment in the existing
  test may only be removed **after** the lint rules are switched off for test
  files — doing it the other way round makes the lint check fail in between.

- **What breaks if this is wrong:**
  - A mistake in the workflow settings file breaks `/verify` for **every**
    ticket, not just this one. It would show up as a profile that cannot be
    resolved, or as YAML that fails to load.
  - If the check runs the suite in watch mode, the gate never finishes. It would
    look like a hung `/verify` rather than a failure.
  - If the lint exemption pattern is written too broadly and catches files that
    are not tests, real untranslated text stops being reported and ships
    unnoticed. This is the most dangerous item here, because it fails **silently**
    — the lint check still passes.
  - If the script name and the check disagree, the gate fails with a missing
    script rather than a real test failure, which is easy to misread.
  - If the coverage list names folders instead of tested files, the number looks
    catastrophic and stops being read at all.

## Validation strategy

- Validation profile: `full-build`
- On top of the profile, confirm by hand that: the coverage command produces a
  readable report and exits on its own (AC-1, AC-4); the report covers only files
  that have tests (AC-2); the workflow settings load and the new group resolves
  to its checks (AC-3); the existing real test still passes (AC-8); the
  unused-file check still passes after both deletions (AC-9); the coverage output
  stays out of version control (AC-10); and no runtime or protected file appears
  in the change (AC-11).

## Rollback

Revert the single commit. Nothing here runs in production, nothing is deployed,
and no data is migrated, so reverting restores the previous state completely. The
branch is local until it is published, so before that point the branch can simply
be deleted. If only the lint change proves wrong, the exemption block can be
removed on its own and the exception comment put back in the one test that needed
it.

## Out of scope

- Any CI pipeline, and any publishing or upload of coverage results.
- A pass mark for coverage (`OQ-3` put this out of scope at `/spec`).
- A machine-readable coverage report (`OQ-8`).
- Shared fixtures and reusable mocks — the next phase does those.
- Tests for any of the app's product code.
- Removing the dead pipeline file the repository still carries.
- Removing the test-runner plugin that now reports itself as no longer needed.
- Moving the existing test into a separate folder — considered under `OQ-7` and
  rejected.
- Any component-testing or browser-testing tool.
