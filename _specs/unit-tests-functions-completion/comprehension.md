---
ticket: unit-tests-functions-completion
stage: verify              # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-10
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4                 # correct / total, e.g. 3/3
decision: PASSED           # gate decision; `none` when the quiz failed (the notification hook reads these — ADR-013)
missed:                    # on a failed quiz: the missed questions + axis; empty when passed
links:
  clickup:
  github:
---

# Comprehension — unit-tests-functions-completion

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

Four questions were asked — one above the floor of three. The panel returned
**no `major` finding**, so CG-6 added none.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Beyond its own files, what does this ticket touch that a broken test here would affect? | `plan.md > Integration surface` | integration (CG-5) | (a) Coverage list in config — the coverage include list in `vitest.config.mts`, because this ticket adds the module to it; (b) The mocks self-test — `tests/mocks/mocks.test.ts`, because this ticket changes the shared cookie stand-in; (c) The module under test — `utils/functions.tsx` itself, because the tests import and re-export parts of it; (d) **The unit-tests gate check — the `unit-tests` check behind the `tests-and-types` profile, the command every later ticket using that profile runs at `/verify`** ← correct | The unit-tests gate check | yes |
| 2 | Which files does `plan.md` allow this ticket to change? | `plan.md > Files to change`; AC-12 | scope | (a) Config and module — `vitest.config.mts` and `utils/functions.tsx`; (b) Shared mocks kit — `tests/mocks/`, a new shared translation stand-in is added there; (c) **Test file and record — `utils/functions.test.ts`, plus the `implement.md` record** ← correct; (d) Test file only — `utils/functions.test.ts` and nothing else at all | Test file and record | yes |
| 3 | How does the plan stop the helper that can never finish from hanging the suite? | `plan.md > Approach` (OQ-5); AC-9 | risk | (a) Awaits with a timeout — it awaits the helper directly and lets the runner's timeout fail the test; (b) Marks the test skipped — the test is skipped, because the helper cannot be tested at all; (c) **Races it and expects loss — the test never awaits it directly; it races it against an already-finished value and proves the helper did not win** ← correct; (d) Sets the flag to true — the readiness flag is always set to true first, so the helper always finishes | Races it and expects loss | yes |
| 4 | What does this ticket do about the places where the code does not do what it looks like it should? | `spec.md > Research Questions Resolved` (OQ-2); AC-3, AC-4, AC-12 | scope | (a) Fix them in this ticket — repair each one in `utils/functions.tsx` as part of the work; (b) Ignore them entirely — say nothing, the tests only cover the behaviour that works; (c) Note them in test comments — leave a comment in the test file and nothing else; (d) **Pin and record them — pin today's behaviour in a test and list each one in the `implement.md` record; repairs become separate tickets** ← correct | Pin and record them | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-012) — CG-6 does not apply.

Four questions were asked — one above the floor of three.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan's Integration surface said the worst case was a test that never finishes, because `pnpm test:run` has no time limit of its own — and that check is shared by every later `tests-and-types` ticket. What did the implementation actually find about that claim? | `implement.md > Notes carried from the review panel`; `plan.md > Integration surface`; AC-9 | integration (CG-5) | (a) Config raised the limit — `vitest.config.mts` was edited to raise the runner's default limit, which every later ticket now inherits; (b) **Default 5s limit exists — the plan was wrong: the runner already stops a test after five seconds by default, so a stuck test fails rather than hanging the shared check; the per-test four-second limits sit under that default and add a tighter guard instead of repeating it** ← correct; (c) No default; 60s added — the plan was right that there is no default limit, so each waiting test was given a sixty-second limit of its own; (d) Plan right; clock only — the plan was right and the fake clock is the only guard, so a stuck test would still hang the shared `unit-tests` check | Default 5s limit exists | yes |
| 2 | Finding F-2 says `getOldCart` and `getCart` behave differently when a user signs in while the helper is still waiting. Which difference do the tests pin? | `implement.md > Findings` (F-2); AC-4 | behaviour | (a) Both pick the user up — both re-read the user inside their loop, so either one notices a late arrival; (b) **getCart picks up, getOldCart cannot — `getCart` re-reads the user inside its loop and sends the request once the user arrives; `getOldCart` works its user id out once, outside the loop, so it never notices and waits the full five minutes before giving up** ← correct; (c) getOldCart picks up, getCart cannot — the other way round; (d) Neither picks the user up — both read the user once before waiting | getCart picks up, getOldCart cannot | yes |
| 3 | Deviation D-3 changed two translation tests instead of loading a translation on the server side. What do those tests prove now, and why were they changed? | `implement.md > Deviations from plan` (D-3); AC-5 | deviation | (a) Deleted, server uncovered — the two tests were removed, so the server side has no test at all; (b) Loads Arabic after waiting — they still load Arabic on the server side with a longer wait; (c) **Proves the app is asked — they prove the decision rather than the download: that the app is asked for the language when there is no browser, and that a language passed by the caller short-circuits the question. Repeated module resets plus a stood-in dynamic import stop resolving after a handful of loads in one file, so a test depending on it would be a flake. The loaded-translation path is still proven for real on the browser side** ← correct; (d) Reads the real file — they read the real translation file from disk on the server side | Proves the app is asked | yes |
| 4 | AC-11 names the time zone and the formatting locale among the ambient things that must be pinned. What did the implementation do about those two? | `implement.md > Notes carried from the review panel`; AC-11 | correctness | (a) Pinned in vitest.config — both were pinned by adding a time zone and a locale setting to `vitest.config.mts`; (b) Pinned per test with Intl — each test stands in for `Intl.DateTimeFormat` and `Intl.NumberFormat`; (c) TZ=UTC only — the time zone was pinned with `TZ=UTC` and the locale left as the machine's; (d) **The module reads neither — its only date is written as an ISO string, which is always UTC, and its numbers are built by joining plain strings. So pinning the clock, the language and the page address is the whole of what "ambient" means here, and no config change was needed** ← correct | The module reads neither | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
