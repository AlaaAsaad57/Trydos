---
ticket: boutique-availability-select
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-19
links:
  clickup:
  github:
---

# Comprehension — boutique-availability-select

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | What does the availability select show when opening the CREATE boutique form? | **Web + Mobile (3) preselected** · Web (1) preselected · Empty — user must pick · Mobile (2) preselected | Web + Mobile (3) preselected | ✅ |
| 2 | What happens on EDIT if the boutique's stored availability is an unrecognized value (e.g. 7)? | **Falls back to default 3** · Select renders blank · Save blocked with an error · Raw value 7 kept and sent | Falls back to default 3 | ✅ |
| 3 | Where does the user-picked value end up on save, and what replaces the old behavior? | **Existing `availability` key; forced constant removed (becomes default only)** · New `availability_value` key · Sent only on create · Per-language in custom_data | availability key; constant removed | ✅ |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0 (3/3)

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Why was the existing `Select` control in controls.tsx NOT reused? | **Forces an empty placeholder option (would allow empty availability, AC-7)** · Only accepts string labels · Deprecated · Breaks RTL | It forces an empty placeholder option | ✅ |
| 2 | What was the deviation from the plan regarding translation keys? | **Only the desc key was new (labels already existed in all three files)** · All five keys added · Keys added to tr only · No keys needed at all | Only the desc key was new | ✅ |
| 3 | How does the change handle a lookup option with an unknown value (e.g. 9)? | **Filtered out — never offered (whitelist on `AVAILABILITY_LABEL_KEYS`; fallback trio if list empty)** · Shown with backend label · Shown but disabled · Validation error | Filtered out — never offered | ✅ |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0 (3/3)
