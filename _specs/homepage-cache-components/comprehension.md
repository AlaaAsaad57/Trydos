---
ticket: homepage-cache-components
stage: verify
attempt: 1
result: passed
score: 1/1
threshold: 1.0
min_questions: 3
max_questions: 5
questions_asked: 1
decision: passed
degraded: "yes — severely. One question was asked against a floor of 3. Both
  regeneration rounds are spent: the falsifier answered 9 of the 10 drafts
  correctly across two rounds, so only one survived. The CG-5 integration
  question was among the excluded — it was attempted twice and rejected twice,
  both times as a construction tell. The owner's understanding of the
  integration surface is therefore NOT evidenced by this record. CG-4's 100%
  applies to the single question that was actually asked, which is thin
  evidence and is recorded as such rather than dressed up."
owner: developer
updated: 2026-08-31
---

# Comprehension Record — verify gate, attempt 1

## Result

**Passed on what was asked: 1 of 1.** Read the `degraded:` note above before
treating that as a strong result — it is not.

## Retired record

`comprehension.md` from the `review` gate was renamed to
`comprehension-review-1.md` before this stage ran (protocol §G, E1/E2), so the
review's evidence stays readable and cannot be mistaken for this one. No prior
`verify` attempt exists, so `attempt: 1` satisfies X5.

## Falsification (`CG-8`)

Ten drafts across two rounds went to the `gate-falsifier` blind — questions and
options only, never told which option was correct. **It answered nine
correctly.**

| Round | Drafts | Survived | Why the rest were rejected |
|---|---|---|---|
| 1 | 5 | 1 | 3 construction-tell, 1 domain-knowledge |
| 2 | 5 | 1 | 3 construction-tell, 1 domain-knowledge |

The construction tells are worth recording, because they are the same mistake
made four different ways:

- **A number reused as its own decoy.** "556" appeared in two options, once
  reversed, which marked it as the real figure. Fixed by drawing distractors
  from other genuine numbers in the run (112, 1979, 90) — and that rewrite is
  what produced the one surviving question.
- **A number reused across questions.** "24" appeared in two different
  questions, flagging it as a real value being bent elsewhere.
- **An option that explained itself.** Only one carried a "so …" clause, so it
  read as the answer without any artifact.
- **An option that stated its own link.** "the matcher line **that exempts it**"
  made that pair obviously atomic while the other three had no stated
  dependency.

The domain-knowledge rejections were the more instructive ones: both questions
sounded specific but were answerable from convention alone — which protected
runtime path a caching work item would legitimately own, and what a framework
re-throw helper typically does.

## Question asked

Correct answers are deliberately not recorded (`CG-7`), so this file cannot serve
as an answer key.

| # | Axis | Question | Falsified |
|---|---|---|---|
| 1 | implementation evidence | The before-and-after counts of the swallowed-cookie build warning | short |

Marked `short` per `CG-8`: this is the final round's question whose blind pick
the falsifier got **wrong**, and it reported `answerable: no` — at-chance, which
is the evidence the check exists to obtain.

## What this record does NOT evidence

- The `CG-5` integration axis. No integration question survived falsification.
- Anything about the change's breadth: one question cannot cover 57 files.

A reader deciding whether to trust this work item should weigh the validation
evidence in `verify.md` far more heavily than this gate.

## Decision

`passed` — recorded from the evidence, with the limitation above stated in full.
