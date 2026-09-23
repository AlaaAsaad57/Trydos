---
ticket: e2e-guest-cart-survives-sign-in
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-09-23
result: passed
score: 5/5
threshold: 1.0
decision: APPROVED
missed:
degraded:
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — e2e-guest-cart-survives-sign-in

> Gate record for `/review`, attempt 1. Questions derived from `plan.md`
> (revision 3), `spec.md` and `review.md > Panel Findings` (RP-4: the findings
> were written before the first question). Five questions: the CG-1 floor of
> three plus one per `major` panel finding (S-1, S-2), at the CG-1 ceiling.
> The owner decided `APPROVED` after the check passed; the rationale and the
> finding dispositions are in `review.md`.

## Review gate

| # | Question (from the artifact) | Sources (plan §/AC-n/panel:lens — **two** when Hops is 2) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The plan names the two time limits of the account lane that BUY-05 must fit inside. Which pair? | `plan.md > Integration surface` ("What breaks if this is wrong") | integration (CG-5) | 1 | **85-minute globalTimeout, 100-minute CI job cap** · 85-minute globalTimeout, 90-minute CI job cap · 90-minute globalTimeout, 100-minute CI job cap · 90-minute globalTimeout, 90-minute CI job cap | yes | 85-minute globalTimeout, 100-minute CI job cap | Yes |
| 2 | Per review finding S-1, a failed bag read in the drawer gives which two wrong results in the plan's case? | `review.md > Panel Findings` S-1 (panel:senior); `plan.md > Steps` 5.6–5.9 with their AC labels (AC-6 in 5.7, AC-8 in 5.9) | panel finding S-1 (CG-6) | 2 | A silent pass of AC-7 and a false red on AC-5 · A silent pass of AC-7 and a false red on AC-6 · A silent pass of AC-8 and a false red on AC-5 · **A silent pass of AC-8 and a false red on AC-6** | yes | A silent pass of AC-8 and a false red on AC-6 | Yes |
| 3 | Review finding S-2 is about the bounded read loop. Which plan step defines that loop, and which ACs rely on it? | `review.md > Panel Findings` S-2 (panel:senior); `plan.md > Steps` 3 (`waitForGoodRead`) and 5.6 / 5.9 (AC-5, AC-8) | panel finding S-2 (CG-6) | 2 | **Step 3, relied on by AC-5 and AC-8** · Step 3, relied on by AC-6 and AC-7 · Step 4, relied on by AC-5 and AC-8 · Step 4, relied on by AC-6 and AC-7 | yes | Step 3, relied on by AC-5 and AC-8 | Yes |
| 4 | What test time limit does the plan give BUY-05, and which case already uses the same limit? | `plan.md > Time budget` | time budget / risk | 1 | 12 min, the same as BUY-01 · 12 min, the same as BUY-04 · **15 min, the same as BUY-01** · 15 min, the same as BUY-04 | yes | 15 min, the same as BUY-01 | Yes |
| 5 | A non-functional requirement in the spec fixes BUY-05's own code spend per run. Which numbered plan step checks the phone's send limit before the first run? | `spec.md > Non-Functional Requirements` ("One-time codes"); `plan.md > Steps` 9 | code budget / cross-flow | 2 | Step 10 · Step 7 · Step 8 · **Step 9** | yes | Step 9 | Yes |

Correct answers in **bold**. Options listed alphabetically (CG-2). Two-hop share:
3 of 5 (Q2, Q3, Q5), meeting CG-2(d) / X7.

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Falsification log (CG-8)

- **Round 1** (5 questions). Q1 blind-correct, `construction-tell` → options
  rewritten. Q2 `answerable: yes`, `domain-knowledge` → fact changed. Q3
  blind-correct, `domain-knowledge` → fact changed. Q4 blind-correct,
  `injected-context` (`CLAUDE.md`) → fact changed. Q5 `answerable: yes`,
  `construction-tell` (stem wording) → stem rewritten.
- **Round 2.** Q3 cleared. Q2 blind-correct through a `sibling-leak` from Q5's
  stem → Q5 rewritten. Q1 blind-correct (random), `domain-knowledge` → fact
  changed. Q4 blind-correct, `domain-knowledge` → second fact round spent;
  dropped. Q5 `answerable: yes` → fact changed.
- **Round 3.** Q1 (new fact), Q3, Q4 (new: time limit), Q5 (new: `/verify`
  code count) cleared. Q2 blind-correct, `construction-tell` (majority parts) →
  options rewritten as a balanced grid.
- **Round 4.** All five cleared; `sibling-leak: no`. The owner answered these
  five, all correctly.
- **Two-hop shortfall found before recording.** That set held only two two-hop
  questions (Q2, Q3) — below CG-2(d). The one-hop Q5 ("about nine codes"; the
  owner answered it correctly) was replaced with a two-hop question.
- **Rounds 5–8 (replacement Q5).** Round 5: blind-correct, `construction-tell`
  plus a sibling leak from Q3 → options rewritten. Round 6: `answerable: yes`,
  `construction-tell` → options rewritten (second rewrite). Round 7:
  blind-correct, `injected-context` (git status ticket name, `CLAUDE.md`) →
  fact changed. Round 8: cleared, `sibling-leak: no`. The owner answered it
  correctly.
