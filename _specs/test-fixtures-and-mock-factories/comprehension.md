---
ticket: test-fixtures-and-mock-factories
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-10
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4                 # correct / total
decision: PASSED           # gate decision; `none` when the quiz failed (the notification hook reads these — ADR-013)
missed:
links:
  clickup:
  github:
---

# Comprehension — test-fixtures-and-mock-factories

> Single-owner gate control (ADR-011 / ADR-014 / CG-1..CG-6). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4); any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.
>
> **English only.** Questions, options, answers, and every other word in this file
> are written in English — whatever language the conversation used (CLAUDE.md).
>
> **Three rows is the floor, not the form** (CG-1): add rows freely. Every gate
> carries **≥1 integration / cross-flow question** (CG-5), and `/review` adds
> **one row per `major` panel finding** on top of the floor (CG-6).

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.

Five questions were asked: the floor of three, plus one extra required because
the panel returned one `major` finding (CG-6). One of the five is the required
integration question (CG-5).

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | `plan.md > Integration surface` says this change is NOT self-contained. What is the failure that matters most if a builder's shape does not match the real backend? | plan.md § Integration surface | integration (CG-5) | A lint error in `tests/`, because the i18n rules apply to builder files · A slower test suite, because each builder does expensive work on every call · A type error at build time, because `tsc` covers `tests/` · **Later tests pass while the application is broken — a green suite that proves nothing, and it does not show up as a failing build** | Later tests pass while the application is broken | yes |
| 2 | The senior lens raised the `major` finding against plan step 4 (reading the real cookie names inside the cookie stand-in). What problem does it identify? | panel:senior | panel finding (CG-6) | A plain top-level import would pull in `next/headers` and break under the test environment · **A test that replaces the cookie manager also replaces it for the stand-in, so `tests/mocks/cookieManager.ts` would import its own replacement** · Reading the real names makes `pnpm knip` report the stand-in as an unused file · The real cookie names differ between the two backends, so reading them gives the wrong value | A test that replaces the cookie manager also replaces it for the stand-in | yes |
| 3 | According to `plan.md > Files to change`, which files may `/implement` change? | plan.md § Files to change; AC-15 | scope / protected paths | Everything under `tests/`, and nothing else · Everything under `tests/`, plus `utils/cookies/cookie-manager.ts` so the real cookie names can be exported · **Everything under `tests/`, plus `utils/functions.test.ts`** · Everything under `tests/`, plus `vitest.config.mts` to add the new files to the coverage list | Everything under `tests/`, plus `utils/functions.test.ts` | yes |
| 4 | `plan.md > Approach` makes the stand-ins exported factory functions rather than ready-made objects. Why? | plan.md § Approach | approach | Because calling a factory is faster at run time than reading a plain object · Because factories let the kit replace modules without any `vi.mock` call in the test file · Because the coverage report only counts functions, not plain objects · **Because the test runner needs the module name at the top of the test file, so a shared file cannot register the replacement for a test — and a factory also gives each test a fresh copy** | Because the test runner needs the module name at the top of the test file | yes |
| 5 | `plan.md` step 7 proves the store stand-in reaches a module that loads the store late. If one registration turns out NOT to cover both ways of loading, what does the plan say to do? | plan.md § Steps step 7; AC-8 | fallback / rollback | Change the module that loads the store late so it loads at the top of the file instead · **Record it as a finding and provide a second way in the kit, without changing the module that loads the store late** · Stop the ticket and reject the plan · Widen `plan.md > Files to change` during `/implement` to include that module | *not answered* | no answer |

**Note on the score.** No answer was wrong. Questions 1 to 4 were answered and all
four were correct. Question 5 was not answered, so the quiz is not 100% complete
and `result` is recorded as `failed` with `decision: none` — the file only has two
values for `result`, and "complete and all correct" is not what happened.

This did **not** block the gate, because the gate did not record `APPROVED`. The
comprehension check stands in the way of `APPROVED` and `PASSED` only (CG-1,
CG-4). The decision recorded at this gate is `CHANGES_REQUESTED`, which leaves the
ticket where it already was and authorises nothing.

The plan is being rewritten, so the next `/review` asks a fresh set of questions
against the new `plan.md`. Question 5 will be asked again there.

### Second run — 2026-08-10 (against the rewritten `plan.md`)

Four questions were asked: the floor of three, plus one extra required because the
panel returned one `major` finding (CG-6). Question 1 is the required integration
question (CG-5). All four were answered correctly, so the gate could record its
decision.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | `plan.md > Integration surface` says nothing has to ship at the same time as anything else, but the order inside the ticket does matter. Which ordering dependency does it state? | plan.md § Integration surface | integration (CG-5) | Nothing depends on order — the nine steps may be done in any order · **The stand-ins must exist before the existing test file is moved onto them (step 9 depends on step 4), and the store stand-in must be proven against the late-loading module (step 8) before the kit counts as finished** · The existing test file is moved onto the stand-ins first, and the stand-ins are written afterwards · The whole kit must ship at the same time as the first Tier 1 test file | The stand-ins must exist before the existing test file is moved onto them, and the store stand-in must be proven against the late-loading module | yes |
| 2 | The performance lens raised the one `major` finding on this pass. What risk does it name? | panel:performance | panel finding (CG-6) | A barrel file in `tests/` would make every later test file load all eight builders and all seven stand-ins · Copying the cookie names instead of reading them makes the comparison test slow · **If a stand-in is built by importing the real module, the store stand-in drags in nine slice reducers and the big translations module once per test file — and, like the cookie case, it would import its own replacement** · The builders merge overrides on every call, and that cost grows with the number of fields | If a stand-in is built by importing the real module, the store stand-in drags in nine slice reducers and the big translations module once per test file | yes |
| 3 | `plan.md` step 9 moves `utils/functions.test.ts` onto the shared stand-ins. What exactly does it change? | plan.md § Steps step 9; AC-12 | scope | All ten of the file's replacements are swapped for shared ones · **Four of the file's ten replacements are swapped (the store, the language and country helper, the client fetch helper, the cookie manager); the other six stay exactly as they are, and every existing assertion is unchanged** · Six of the file's ten replacements are swapped, including `./posthog` and `./errorReported`, because the kit stands in for those clients · The file is deleted and rewritten from scratch on top of the kit | Four of the file's ten replacements are swapped; the other six stay exactly as they are | yes |
| 4 | `plan.md` gives the cookie stand-in its own copy of the cookie names plus one comparison test, instead of importing the real module. Why? | plan.md § Approach; step 5; AC-7 | approach | A copy is required because the real cookie names are secret and must not appear in `tests/` · **Because a test that replaces the cookie manager replaces it for everything that test loads, so the stand-in would import its own replacement; and reading the real module from inside the factory would tie every test file that uses the stand-in to the token library and the browser-like environment** · Because the real cookie names change per country, so no import could ever give a stable value · Because the type check does not cover `tests/`, so importing the real module would fail to compile | Because the stand-in would import its own replacement, and reading it inside the factory ties every test file to the token library and the browser-like environment | yes |

Score: 4/4 (100%). The gate passed and recorded `APPROVED`.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-012) — CG-6 does not apply.

Four questions were asked: the floor of three plus one more, because this change
carries a kit that 118 later phases build on. Question 1 is the required
integration question (CG-5). CG-6 does not apply — there is no panel at
`/verify`. All four were answered correctly.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The AC-8 proof had to go through a module that loads the store at the moment it is used. Which module was used, and what did that proof need? | implement.md § How AC-8 was proved; plan.md § Integration surface; AC-8 | integration (CG-5) | `store/notifications/reducer.ts`, stood in for by the kit so the notifications slice could be read · **`utils/fetchData.ts`, with the stand-in registered as `"store"` — a different text from the `"../store"` fetchData writes — plus five extra stand-ins local to the test file, and a fake network with an empty queue set as a trap** · `utils/fetchData.ts`, with the stand-in registered under the same `"../store"` text the module itself writes, and no extra stand-ins needed · `utils/functions.tsx`, because it reads the store at the top of the file | `utils/fetchData.ts`, with the stand-in registered as `"store"` — a different specifier — plus five extra stand-ins and a fake-network trap | yes |
| 2 | `implement.md` records a correction to the plan's detail for the error-reporting (Sentry) stand-in. What was corrected? | implement.md § Deviations from plan; review.md follow-up 2; AC-6 | evidence / deviation | **It covers the seven symbols this repository actually imports, not the three the plan quoted** · It moved from flat exports to a `default` key, the same way the analytics stand-in did · It now imports the real `@sentry/nextjs` package so it can never drift out of step · It was dropped, because the error-reporting client is not used by any early test phase | It covers the seven symbols this repository actually imports, not the three the plan quoted | yes |
| 3 | `plan.md > Rollback` says how to undo this ticket. What does undoing it actually involve? | plan.md § Rollback; implement.md § Changes prepared | rollback | Restore `vitest.config.mts` and re-run the coverage report, because the coverage list changed · Revert the commit that `/implement` made on the ticket branch · Roll back the seven production modules that the stand-ins describe · **The `tests/` folder is deleted and `utils/functions.test.ts` is put back as it was. Nothing that ships to users is touched, no configuration changes, and no data is migrated** | The `tests/` folder is deleted and `utils/functions.test.ts` is put back as it was | yes |
| 4 | Moving `utils/functions.test.ts` onto the shared cookie stand-in silently corrected something. What was it? | implement.md § Deviations from plan; AC-7, AC-12 | evidence | The file had ten replacements, and four of them were swapped for shared ones while six stay · **The old hand-written mock used the cookie name `"USER_DATA"`, but the real name in the cookie manager is `"User-Data"`** · The old mock returned `undefined` for a missing cookie, where the real module returns `null` · The old mock was missing `deleteCookie`, so a code path in the test threw | The old hand-written mock used `"USER_DATA"`, but the real name is `"User-Data"` | yes |

Score: 4/4 (100%). The gate passed and recorded `PASSED`.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
