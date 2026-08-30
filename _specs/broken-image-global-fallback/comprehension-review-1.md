---
ticket: broken-image-global-fallback
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-08-30
result: passed
score: 3/3
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

# Comprehension — broken-image-global-fallback

> Single-owner gate control (ADR-009 / ADR-012 / ADR-025 / CG-1..CG-8). The owner
> answered multiple-choice questions generated from the artifact under review. The
> gate records its decision only if 100% of answers are correct (CG-4). Options are
> listed alphabetically — the correct answer's position carries no signal.

## Falsification log (CG-8)

Three rounds were run against `wf:gate-falsifier`, closed-book — questions and
options only, no artifacts, no ticket, no repository.

| Round | Question | Falsifier's blind pick | Verdict | Basis | Remedy applied |
|---|---|---|---|---|---|
| 1 | Which rule paints the element after the marker is removed | correct | rejected | domain-knowledge | fact changed — one option self-destructed and another painted nothing, so the answer was deducible |
| 1 | What the AC-7 evidence check greps for | correct | rejected | construction-tell | options rewritten — the correct one was the only one giving a reason |
| 1 | Why hydration is the path AC-11 needed | correct | rejected | construction-tell | options rewritten — the correct one was the only one mentioning hydration |
| 1 | Which media surfaces research listed besides `<img>` | correct | rejected | domain-knowledge | fact changed — the counts were a coin flip it happened to win |
| 1 | How many document roots exist | correct | rejected | construction-tell | options rewritten — the correct one was longest and most qualified |
| 2 | What the recovery listener attaches to, and when | correct | rejected | construction-tell | fact replaced — one option contradicted itself, leaving one coherent choice |
| 2 | What the AC-7 evidence check searches for | correct | rejected | domain-knowledge | fact replaced — the "marker appears in the script's own source" trap is a known generic gotcha |
| 2 | Which proof method the panel asks for | **wrong** | rejected | domain-knowledge | dropped — missed, but reported `answerable: yes` |
| 2 | Which source the kept handler loads, and which AC skips it | **wrong** | **survived** | — | asked as Q2 (`answerable: no`) |
| 2 | How many roots import `styles/globals.css`, and how many exist | **wrong** | **survived** | — | asked as Q3 (`answerable: no`) |
| 3 | Which AC row holds a named case, and which finding cites it | **wrong** | **survived** | none | asked as Q1 (`answerable: no`, `basis: none`) |
| 3 | How many checks the named validation profile runs | correct | rejected | construction-tell | dropped — `full` reads as running more checks than `logic-change` from the names alone |

Three questions survived, which meets `gate.min_questions: 3` exactly. The gate was
**not** degraded: every question asked was missed blind and reported
`answerable: no`. The mandatory integration question (CG-5) is among them, so
`degraded:` is empty.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The plan declares a test case named `the marker is removed when a working source loads on the same element`. Which acceptance criterion's row holds that case, and which panel finding says it would pass while the defect was present? | `plan.md > Tests` joined with `review.md > Panel Findings` (panel: senior + performance) | proof / test design | 2 | **The AC-3 row, and F-1 says so** ✓ · The AC-11 row, and F-1 says so · The AC-11 row, and F-3 says so · The AC-3 row, and F-3 says so | yes | The AC-3 row, and F-1 says so | Yes |
| 2 | Which source does the one kept `onError` handler load, and which acceptance criterion makes the new listener skip it? | `plan.md > Conflict found` joined with `spec.md > AC-4` | scope / criteria | 2 | **A local `/icons/flag/` path, and AC-4 skips it** ✓ · A local `/icons/flag/` path, and AC-10 skips it · A media-app address, and AC-10 skips it · A media-app address, and AC-4 skips it | yes | A local `/icons/flag/` path, and AC-4 skips it | Yes |
| 3 | How many of the other document roots import `styles/globals.css`, and how many document roots does this repository have in total? | `plan.md > Integration surface` corrected by panel finding F-5 (panel: senior) | integration (CG-5) | 1 | **Three of the others, and five roots in total** ✓ · None of the others, and five roots in total · None of the others, and three roots in total · Two of the others, and three roots in total | yes | Three of the others, and five roots in total | Yes |

- Score: 3/3 — 100%, meets the threshold of 1.0.
