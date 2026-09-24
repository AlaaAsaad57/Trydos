---
ticket: unit-tests-search-execution-and-filters
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-09-15
result: passed
score: 3/3
threshold: 1.0
decision: PASSED
missed:
degraded: "3 of 4 — the count met gate.min_questions and the CG-5 integration question was asked and survived falsification clean; one of the three is marked short, because the falsifier answered it wrongly while reporting answerable: yes"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — unit-tests-search-execution-and-filters

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), including whether the
> plan's declared Integration surface held. No panel at this stage (ADR-010), so
> CG-6 does not apply. The two `review` records are retired as
> `comprehension-review-1.md` and `comprehension-review-2.md`; this is the first
> attempt of the **verify** gate, so `attempt: 1` is correct.

**How this set was built.**

Four questions were drafted: one integration (CG-5) and three on what the
implement stage actually did. Two falsification rounds ran, with no artifacts
attached.

| Round | Sent | Survived | Why the rest died |
|-------|------|----------|-------------------|
| 1 | 4 | Q1, Q4 | Q2 — `answerable: yes`, the three distractors described plainly bad practice so the right answer stood out; Q3 — blind pick **correct** from convention |
| 2 | 2 (Q2 options rewritten, Q3 fact changed) | none | Q2 — blind pick **wrong** but `answerable: yes`; Q3 — blind pick **correct** |

Q2's round-1 rejection is worth recording, because it is a question-writing fault
rather than a fact fault: three of its four options described practices no one
would defend, so the fourth was pickable with the artifact closed. The rewrite
made all four defensible, and the falsifier then picked the **wrong** one — which
is the evidence this check exists to obtain, even though it still reported
`answerable: yes`. Under CG-8 / ADR-028 that question was administered as part of
the degraded set and is marked `short`, not `yes`.

**What the shortfall cost.** Nothing that matters here: the integration question
survived clean, and there is no panel at this stage, so no finding went
unexamined. The set is one below the drafted four, not below the floor.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The verify run re-checked the integration surface against the repository. What did it find? | `verify.md > Integration surface`; `plan.md > Integration surface` | integration (CG-5) | 2 | **`Eight other modules import the client`** ✅; `Nine…`; `Seven…`; `Six…` | yes | `Eight other modules import the client` | **Yes** |
| 2 | Which deviation did the implement stage record, and what forced it? | `implement.md > Deviations from plan`, `D-1`; `helpers.ts:1333-1334` | deviation | 2 | **`The nested condition lookup`** ✅; `The router marker`; `The environment pin`; `The reply clone` | yes | `The nested condition lookup` | **Yes** |
| 3 | The project rule is "see the test red, then green". What did the implement stage do instead? | `implement.md > Guard proofs`; `CLAUDE.md` testing rules | evidence | 2 | `Marked the cases as regression guards`; **`Proved two guards bite by perturbing the test`** ✅; `Ran each case against the previous commit`; `Recorded the exit code of each first run` | short | `Proved two guards bite by perturbing the test` | **Yes** |

- Score: 3/3 — 100% of what was asked (CG-4).

**Practice (LP-5, not scored).** Two were asked before the gate. The first was
correct. The second was answered wrongly — the owner named `AC-19` and the plan,
where the case that failed first was `AC-24` and the fault was the test's own
assertion — and was corrected against `implement.md > Deviations from plan`
before the gate began.
