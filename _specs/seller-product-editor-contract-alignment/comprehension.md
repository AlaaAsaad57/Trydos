---
ticket: seller-product-editor-contract-alignment
stage: review              # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-20
links:
  clickup:
  github:
---

# Comprehension — seller-product-editor-contract-alignment

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision.

**Attempt 1 — 2026-07-20 — FAILED (2/3). No decision recorded; `ticket.md` unchanged.**

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Per the revised plan, what happens to `utils/fetchData.ts`? | (a) **Not changed at all — explicitly out of scope** ✅correct · (b) the parsed response body is attached to the thrown `Error` · (c) a new opt-in flag makes it return the envelope instead of throwing · (d) the seller-product calls bypass it to avoid the throwing branch | (a) Not changed at all — explicitly out of scope | ✅ yes |
| 2 | If the work is rolled back, how are the three moved contract documents recovered? | (a) **From the out-of-repo copy taken before the move** ✅correct · (b) `git restore` reverts them like the other changed files · (c) they are staged intent-to-add, so `git restore .` brings them back · (d) from git history, like the four deleted documents | (b) `git restore` reverts them like the other changed files | ❌ **no** |
| 3 | The three new `validate()` checks — boutique, category, description — apply to which path? | (a) **Create only** ✅correct · (b) both create and edit · (c) edit only · (d) both, but only when the product is not yet live | (a) Create only | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 0.67 — below the
  `pass_threshold: 1.0`. Gate blocked (CG-4).

### Why Q2's answer is wrong, and why it matters

The three contract documents (`Untitled-1.md`, `product-body-payloads.txt`,
`seller-product-body-alignment-roadmap.md`) are **untracked**. `git restore`
operates on tracked content, so it cannot restore a file git has never recorded —
and `git clean -fd` would delete them outright at their new path. This is exactly
why revision 2 added step 1: **copy all three outside the repository before
anything else.** That copy, not git, is the recovery path.

The distractor chosen — "(b) `git restore` reverts them like the other changed
files" — is what revision 1's rollback section incorrectly claimed. The review
panel flagged it (P-3), and it was corrected in revision 2; the plan's Rollback
section now states the exclusion explicitly.

There is a further trap the panel raised this round: step 3's `git add -N`
creates index entries with **empty blobs**, so a blanket `git restore .` would
truncate those three documents to zero bytes rather than leave them alone. The
plan needs a "restore per-path, never `git restore .`" clause — this is one of
the outstanding follow-ups.

**To retry:** re-read `plan.md` → Rollback (and step 1), then re-run `/review`.

---

**Attempt 2 — 2026-07-20 — PASSED (3/3). Decision recorded.**

Same three questions, re-asked with Q2's option order changed and its wording
clarified to name the three untracked files explicitly.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Per the revised plan, what happens to `utils/fetchData.ts`? | (a) **Not changed at all — explicitly out of scope** ✅correct · (b) the parsed response body is attached to the thrown `Error` · (c) a new opt-in flag makes it return the envelope instead of throwing · (d) the seller-product calls bypass it to avoid the throwing branch | (a) Not changed at all — explicitly out of scope | ✅ yes |
| 2 | If the work is rolled back, how are the three moved contract documents recovered? | (a) from git history, like the four deleted documents · (b) they are staged intent-to-add, so `git restore .` brings them back · (c) **From the out-of-repo copy taken before the move** ✅correct · (d) `git restore` reverts them like the other changed files | (c) From the out-of-repo copy taken before the move | ✅ yes |
| 3 | The three new `validate()` checks — boutique, category, description — apply to which path? | (a) **Create only** ✅correct · (b) both create and edit · (c) edit only · (d) both, but only when the product is not yet live | (a) Create only | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0 — meets
  `pass_threshold: 1.0`. Gate passed (CG-4); `/review` proceeded to record its
  decision.

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

**Attempt 1 — 2026-07-20 — PASSED (3/3).**

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | What does the builder now send for `packed_after_ordering` when the seller has it switched OFF? | (a) **an empty string — the key is always present** ✅correct · (b) the key is omitted entirely · (c) the string `'false'` · (d) the string `'off'` | (a) an empty string — the key is always present | ✅ yes |
| 2 | After the resume pass, where does the unique content of the four deleted documents now live? | (a) **§5 of the gitignored contract, plus the out-of-repo backup and git history** ✅correct · (b) a new tracked doc under `docs/api-requirements/` · (c) only in git history · (d) it was dropped — the contract already covered it | (a) §5 of the gitignored contract, plus the out-of-repo backup and git history | ✅ yes |
| 3 | Which acceptance criterion does the implementation NOT satisfy as it stands? | (a) **AC-1 — the contract documents are under version control** ✅correct · (b) AC-15 (i18n parity) · (c) AC-19 (typecheck/lint/build) · (d) AC-7 (multiplyQTY unchanged) | (a) AC-1 — the contract documents are under version control | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0 — meets
  `pass_threshold: 1.0`. Gate passed (CG-4); `/verify` proceeded to validation.

> Q3 is the load-bearing one: the owner confirmed, before any result was
> recorded, that the gitignore decision leaves AC-1 unmet as written.

---

**Attempt 2 — 2026-07-20 — PASSED (3/3).** Fresh questions: the artifacts changed
between attempts (AC-1 amended, the manual checks deferred), so attempt 1's Q3
answer is now stale and re-asking it would have tested the wrong state (CG-2).

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | After the amendment, what does AC-1 now require? | (a) **docs excluded by an ignore rule, absent from any stageable change, and copied outside the repo** ✅correct · (b) committed under `docs/api-requirements/` · (c) committed with backend `file:line` citations redacted · (d) deleted, content only in git history | (a) excluded by ignore rule, absent from stageable changes, copied outside the repo | ✅ yes |
| 2 | How will the nine behavioural criteria be recorded in `verify.md`? | (a) **as verified by code inspection, explicitly not as executed** ✅correct · (b) as executed and passing against a live backend · (c) omitted entirely · (d) deferred to `/publish-pr` and verified on the preview | (a) as verified by code inspection, explicitly not as executed | ✅ yes |
| 3 | Which criterion carries the largest residual risk from deferring the manual checks? | (a) **AC-3 — translation identity on edit** ✅correct · (b) AC-15 (parity) · (c) AC-19 (build) · (d) AC-7 (multiplyQTY) | (a) AC-3 — translation identity on edit | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0 — meets
  `pass_threshold: 1.0`. Gate passed (CG-4).

> The owner acknowledged, before the PASSED decision was recorded, both that the
> behavioural evidence is inspection-only and that AC-3 — the data-corruption fix
> this ticket exists for — is the criterion most exposed by that choice.
