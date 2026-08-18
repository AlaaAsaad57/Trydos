---
ticket: next-16-3-upgrade
stage: verify              # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-18
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4                 # correct / total
decision: PASSED           # gate decision; `none` when the quiz failed (the notification hook reads these — ADR-011)
missed:                    # empty when passed
links:
  clickup:
  github:
---

# Comprehension — next-16-3-upgrade

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4); any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.
>
> **English only.** Questions, options, answers, and every other word in this file
> are written in English — whatever language the conversation used (CLAUDE.md).

## Review gate

> Questions derived from `plan.md` (revision 6) + `spec.md` (CG-2), incl.
> `plan.md > Integration surface` and the Step 1a panel findings. Answered before
> recording the `/review` decision.
>
> Four questions were asked against a floor of three (CG-1). The advisory panel
> returned **no `major` findings** in round 6, so CG-6 seeded no extra questions;
> the fourth was added because the plan's measurement and ordering design is
> intricate enough to warrant it.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | What breaks if slice B1 is reverted on its own while slice B2 is already present? | `plan.md > Integration surface > Ordering`; `plan.md > Rollback`; AC-10 | **integration (CG-5)** | (a) Nothing — each commit is independent by design; (b) **The build fails, because B1 carries the accessor flag that B2's converted root layout needs**; (c) The dev server uses more memory, because the React Compiler guard returns; (d) The route table changes, because the root layout returns to per-request rendering | (b) | **Yes** |
| 2 | Which route table is the reference for the per-route comparisons in steps 8, 9 and 10? | `plan.md > Measurement and reference map`; steps 7–10 | measurement design | (a) A-ROUTES — taken at slice A with the accessor flag off; (b) BASE-LOCAL-BUILD — taken on 16.2 before the upgrade; (c) **FLAG-ROUTES — taken with the flag on and no files converted**; (d) The route table from the browser-suite build at slice A | (c) | **Yes** |
| 3 | AC-10 requires every configuration switch to be turnable off on its own, but the accessor flag cannot be. How is AC-10 recorded? | `plan.md > Validation strategy`; spec AC-10 | criteria / verifiability | (a) AC-10 is recorded as not met, because one switch is not independent; (b) **AC-10 is recorded against slices D1 and D2; the flag is a build prerequisite of slice B, not an independent switch**; (c) AC-10 is recorded by counting the six commits on the branch; (d) AC-10 is waived, because the spec cannot be amended | (b) | **Yes** |
| 4 | Why can the malformed-locale check not be done by requesting a URL? | `plan.md` step 9; `plan.md > Integration surface`; AC-5 | risk / executability | (a) Because the accessor is only callable in Server Components, not in route handlers; (b) Because the browser suite does not run on pull requests; (c) **Because the middleware lowercases the path and redirects any unsupported locale, so the segment never reaches the render**; (d) Because the structured-data payloads escape the value before rendering | (c) | **Yes** |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording the
> `/verify` outcome. No panel here (ADR-010) — CG-6 does not apply.
>
> Four questions against a floor of three. Q1 is the mandatory integration
> question (CG-5) and is sourced from a **deviation** from the plan's declared
> Integration surface, which the contract calls the strongest question available.
> The quiz passed, so the outcome (`FAILED`) was recorded.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan declared `next.config.ts` would take four edits across three commits, including the accessor flag. What actually happened? | `implement.md > Step 6 findings`, `> Deviations 1`; `plan.md > Integration surface > Ordering` | **integration (CG-5)** — deviation from the declared surface | (a) All four edits were made, including `experimental.rootParams`; (b) **The accessor flag was not needed — 16.3.1 ships root-params ungated, so the file has three edits and slice B1 reverts alone**; (c) The accessor flag was replaced by enabling cacheComponents, which implies it; (d) The file was not edited at all; the compiler switches moved to a separate config file | (b) | **Yes** |
| 2 | The production build passed. Why does that still not evidence AC-2? | `implement.md > Deviations 3`; `plan.md > Validation strategy`; AC-2 | evidence / validity | (a) Because source-map upload was disabled, so no errors could be reported; (b) Because the build ran with the default TypeScript checker path; (c) Because the error-reporting package is incompatible with 16.3.1; (d) **Because the error-reporting wrapper is only applied when the deploy environment variable is set, so a local build exports the unwrapped config** | (d) | **Yes** |
| 3 | `tsc --noEmit` passed on all twenty-nine converted files. Why is that not proof the conversion is safe? | `implement.md > Step 6 findings 2`, `> Validation run` caveats; AC-5 | risk / limits of evidence | (a) **Because `strictNullChecks` is off and the accessor is typed `string \| undefined`, so splitting an undefined value compiles**; (b) Because the accessor types are only generated during `next dev`, never for a build; (c) Because `tsc` skips files under `app/` by default; (d) Because TypeScript 7 was dropped, so no type checking ran | (a) | **Yes** |
| 4 | AC-10 requires each switch to be revertable on its own. What is its verify result and why? | `implement.md > Deviations 4`; `plan.md > Validation strategy`; AC-10 | rollback / delivery | (a) **AC-10 cannot be evidenced because `/implement` creates no commits, so the change is one uncommitted working-tree state**; (b) AC-10 fails because the accessor flag cannot be reverted independently; (c) AC-10 passes because each switch is on its own line in `next.config.ts`; (d) AC-10 was recorded against the accessor flag rather than the compiler switches | (a) | **Yes** |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Verify gate — second run (outcome `PASSED`)

The gate was re-run after `/implement` resumed and gathered the missing evidence.
New questions were generated rather than replaying the first set, which is now a
recorded answer key (CG-7). The mandatory integration question is again sourced
from a **deviation** — this time the framework writing to `CLAUDE.md`.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | Running `next dev` touched a tracked file outside the plan. What happened and how was it handled? | `implement.md > Newly discovered`; `plan.md > Files to change` | **integration (CG-5)** — deviation from the declared surface | (a) **It appended a `nextjs-agent-rules` block to `CLAUDE.md`, a tracked file not on the plan's list; it was restored and the decision recorded**; (b) It created a new `AGENTS.md` file, which was added to Files to change; (c) It rewrote `next.config.ts` to add `agentRules: false` automatically; (d) Nothing was written; the message was informational only | (a) | **Yes** |
| 2 | The browser suite passed 5 tests. Beyond AC-8 and AC-9, what did that run establish? | `implement.md > Resume — evidence gathered`; AC-5 | evidence / coverage | (a) That dev-server memory is within the guarded baseline; (b) That each configuration switch can be reverted independently; (c) **That the accessor works at runtime, including inside `generateMetadata`, because the suite does its own real build and start**; (d) That the error-reporting wrapper is applied on the deploy platform | (c) | **Yes** |
| 3 | On what basis does AC-10 pass, given the whole change is one uncommitted working-tree state? | spec AC-10, NFR-2; `plan.md > Validation strategy` | criteria / verifiability | (a) **Because AC-10 asks that each switch can be turned off on its own, and the two compiler switches are independent config lines — commit granularity is a separate concern**; (b) Because running the app confirmed each switch could be toggled at runtime; (c) Because the accessor flag was never added, so only one switch exists; (d) Because `/publish-pr` was directed to create six separate commits | (a) | **Yes** |
| 4 | What is still missing for D1's revert trigger, even though the native compiler path is confirmed active? | `implement.md > Resume`; `plan.md` steps 2, 11–13 | risk / residual gap | (a) **A dev-server cold-start and peak-memory baseline, which was not captured because every dev route returned 503**; (b) A per-route table diff between `A-ROUTES` and `FLAG-ROUTES`; (c) Confirmation that `turbopackRustReactCompiler` was applied; (d) The frozen-install check against the regenerated lockfile | (a) | **Yes** |

- Score: 4/4
