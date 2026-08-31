---
ticket: broken-image-global-fallback
stage: verify
attempt: 1
status: complete
owner: developer
updated: 2026-08-30
result: passed
score: 3/3
threshold: 1.0
decision: PASSED
missed:
degraded: "3 of 3 asked, but 1 was administered short — the CG-5 integration question never cleared falsification (blind pick wrong, but reported answerable: yes) and its rounds were spent; 2 of the 3 cleared CG-8 fully"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — broken-image-global-fallback

> Verify gate. The owner answered questions generated from `implement.md`,
> `verify.md` and `spec.md`. The gate records its decision only at 100% (CG-4).
> Options are listed alphabetically — position carries no signal. No advisory
> panel runs at `/verify` (ADR-010), so CG-6 does not apply.

The `review` record was retired to `comprehension-review-1.md` before this round,
so no `verify` record can be cleared by it (§G, E1/E2). No earlier `verify`
attempt exists, so this is `attempt: 1`.

## Falsification log (CG-8)

Three rounds against `wf:gate-falsifier`, closed-book — questions and options
only, no artifacts, no ticket, no repository.

| Round | Question | Blind pick | Verdict | Basis | Remedy |
|---|---|---|---|---|---|
| 1 | Which escape the old code produced, and from which transform | correct | rejected | construction-tell | options rewritten — one option was internally impossible |
| 1 | What the AC-12 chunk search found | correct | rejected | domain-knowledge | fact changed — "0 of N chunks" reads as the clean pass state |
| 1 | What the F-8 case asserts now versus before | correct | rejected | construction-tell | **my drafting defect — two options were word-for-word identical**; question replaced |
| 1 | What three roots importing the stylesheet means | correct | rejected | construction-tell | options rewritten — the stem contradicted two options and only one said why |
| 2 | Script bytes in round 1 and round 2 | **wrong** | **survived** | — | asked as Q1 (`answerable: no`) |
| 2 | Suite total and case count | correct | rejected | domain-knowledge | dropped — rounds spent |
| 2 | What the round-2 test case checks, and the value it feeds | **wrong** | rejected | domain-knowledge | dropped — the canonical breakout payload pairs itself |
| 2 | Roots, stylesheet imports and script reach | correct | rejected | construction-tell | replaced — the third clause was fully determined by the second |
| 3 | Placeholder gzipped size and chunks searched | **wrong** | **survived** | — | asked as Q2 (`answerable: no`) |
| 3 | Where the exact-`src` selectors live, and what they target | **wrong** | short | domain-knowledge | asked as Q3 **under the short rule** — the file-naming convention eliminated half the set blind |

**Why this gate is degraded.** Only two questions cleared CG-8 outright, below the
floor of three. Rather than block the work item or pad the set with a question the
falsifier answered, the third asked is the final round's **missed** question — the
integration one (CG-5), which the falsifier picked wrongly but could half-reason
about. It is marked `short` below, not `yes`: it was administered, not cleared.
CG-4 still applies in full to what was asked.

## Verify gate

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | How many bytes was the fallback script as shipped in the built page in round 1, and how many in round 2? | `implement.md > Round 2` table joined with `verify.md > Commands run` | build evidence | 2 | **2824 bytes, then 2818 bytes** ✓ · 2818 bytes, then 2818 bytes · 2818 bytes, then 2824 bytes · 2824 bytes, then 2824 bytes | yes | 2824 bytes, then 2818 bytes | Yes |
| 2 | How many bytes does the placeholder take when gzipped, and how many client JavaScript chunks were searched for it in the build output? | `verify.md > Recorded for the record` (F-10) joined with the AC-12 row | cost / AC-12 | 2 | **1274 bytes gzipped, and 116 chunks searched** ✓ · 1274 bytes gzipped, and 112 chunks searched · 2287 bytes gzipped, and 112 chunks searched · 2287 bytes gzipped, and 116 chunks searched | yes | 1274 bytes gzipped, and 116 chunks searched | Yes |
| 3 | Where do the two browser-suite selectors that match on an exact `src` live, and what do they point at? | `plan.md > Integration surface` joined with `research.md > Possibly affected services` | integration (CG-5) | 2 | **`tests/e2e/selectors.ts`, pointing at local icons** ✓ · `tests/e2e/actions/nav.ts`, pointing at local icons · `tests/e2e/actions/nav.ts`, pointing at media addresses · `tests/e2e/selectors.ts`, pointing at media addresses | **short** | `tests/e2e/selectors.ts`, pointing at local icons | Yes |

- Score: 3/3 — 100%, meets the threshold of 1.0.
