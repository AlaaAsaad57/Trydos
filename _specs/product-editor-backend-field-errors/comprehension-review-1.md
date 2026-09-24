---
ticket: product-editor-backend-field-errors
stage: review
attempt: 1
status: complete
owner: developer
updated: 2026-08-26
result: passed
score: 1/1
threshold: 1.0
decision: CHANGES_REQUESTED
missed:
degraded: "1 of 3 — 4 of 5 questions could not clear CG-8 after both regeneration rounds; the CG-5 integration question was among those excluded"
evaluator:
  host: claude
  actor: owner
links:
  clickup:
  github:
---

# Comprehension — product-editor-backend-field-errors

> Gate record for the `review` stage, attempt 1. Administered **short** under
> CG-8 / ADR-028: one question, being the only one of the final round whose blind
> pick the falsifier got wrong. 100% of what was asked was answered correctly.

## Review gate

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Hops | Options (correct + distractors) | Falsified (CG-8) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|------|---------------------------------|------------------|----------------|----------|
| 1 | The plan replaces an existing hand-written list of field names with a larger set. How many names does the old list hold, and how many of them appear in the new set? | `plan.md > Steps` step 1, read against `research.md`'s 20-name allowlist and `spec.md > AC-4` | scope / regression | 2 | **b) 20 names, and all 20 appear** *(correct)*; a) 20 names, and 17 appear; c) 29 names, and all 29 appear; d) 31 names, and 20 appear | short | b) 20 names, and all 20 appear | Yes |

- Score: 1/1

## How the gate came to be short (CG-8, ADR-028)

Five questions were drafted and put to the `gate-falsifier` with no artifacts
attached. Two regeneration rounds were spent. The record of what happened, because
a short gate that hides its shortness is not a gate:

**Round 1** — four of five rejected.

| Q | Blind pick | Basis reported | Outcome |
|---|---|---|---|
| shared errors record | correct | domain-knowledge | rejected — a record holding both server and client messages is a standard form pattern |
| which AC the gate breaks | wrong | domain-knowledge | rejected — `answerable: yes` from what "validation-only gate" means |
| which field yields raw text | wrong | — | survived |
| banner reset points | correct | domain-knowledge | rejected — reset-on-cancel and reset-on-success are equally common conventions |
| why AC-25's test cannot exist | correct | construction-tell | rejected — the correct option was the only one naming a mechanism |

**Round 2** — one survived.

| Q | Blind pick | Basis reported | Outcome |
|---|---|---|---|
| missing importer | wrong | — | survived |
| AC-10's first group | correct | construction-tell | rejected — **answered using another question's options**; the set leaked across itself |
| which field yields raw text | wrong | domain-knowledge | rejected — `answerable: yes` |
| what rules out the anchor query | wrong | construction-tell | rejected — the stem telegraphed which option was self-defeating |
| the flow step 4 also changes | correct | construction-tell | rejected — the only option naming a shared mechanism |

**Round 3 (final)** — one blind pick wrong.

| Q | Blind pick | Outcome |
|---|---|---|
| missing importer | **correct** | excluded |
| old list size and carry-over | **wrong** | **administered** |
| which criterion a pure test cannot see | **correct** | excluded |
| which three need a wrapper | **correct** | excluded |
| the two paths sharing one function | **correct** | excluded — **this was the CG-5 integration question** |

Rounds exhausted with one question left whose blind pick was wrong. Under ADR-028
that question is administered rather than the gate skipped, and the shortfall plus
the excluded integration question are recorded in `degraded:` above.

**Two of the rejections were faults in the question set, not in the artifact.**
Round 2's second question was answerable only because another question in the same
set described the same fact from the other side. Three others were construction
tells: the correct option was the only one naming a concrete mechanism while its
distractors named features, so the falsifier could pick the shape of an answer
without knowing one.
