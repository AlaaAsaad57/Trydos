---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-19
links:
  clickup:
  github:
---

# Comprehension — remove-debug-pages-and-any-leaking-servers-info

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision. Questions target the settled scope decision, the
> documented exclusion, and the blocking defect corrected in revision 3.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Per the plan, what happens to request-log data already stored in returning users' browsers? (Phase A step 4; spec C-5) | **(a) Left to its 3-day purge** · (b) Deleted once at application boot · (c) Cleared on next logout · (d) Migrated to server-side logging | (a) Left to its 3-day purge | ✅ correct |
| 2 | Which of the seven backend base-URL variables is excluded from the rename, and why? (Phase C step 8; spec FR-2 / AC-5) | **(a) Chat — retained webview code reads it client-side** · (b) Wallet — it touches a protected path · (c) Elastic — it is only read server-side · (d) Market — it has too many call sites | (a) Chat — webview code reads it client-side | ✅ correct |
| 3 | Why does the identifier mapping live in a new standalone module instead of the server token module? (Approach ¶3; review round 1 FU-1) | **(a) The token module imports `next/headers`, so client files importing it pass type checking but fail the production build** · (b) To keep the mapping secret from the client · (c) Because the token module is a protected path · (d) To avoid a circular import with the fetch helper | (a) The token module imports next/headers | ✅ correct |

- Score (optional, only if `comprehension_gates.ai_graded`): 3/3 = 1.0 (pass threshold 1.0 met)

Note on Q3: distractor (b) is deliberately wrong. The forward mapping necessarily
ships to the browser — the plan treats it as public throughout, and the security
value comes from the tokens not naming the services, not from secrecy.

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Why did the second implementation block occur — the server error-log reaching the client bundle? (implement.md, Block 2) | **(a) `serverErrorReporter` is imported by client code (`services/home.ts` is "use client")** · (b) The dynamic import was missing a window guard · (c) The variable was still `NEXT_PUBLIC_` prefixed · (d) `errorSerialization` imports `next/headers` | (a) serverErrorReporter is imported by client code | ✅ correct |
| 2 | What evidence was recorded for AC-4, and what was the chat backend result? (implement.md, Validation run) | **(a) 0 variable names and 0 hostnames; chat present once as the accepted exception** · (b) 0 hostnames but 3 variable names; chat absent · (c) A passing production build alone · (d) 0 names and 0 hostnames including chat | (a) 0 names and 0 hostnames; chat present once | ✅ correct |
| 3 | What must still happen before this branch is pushed? (implement.md, Phase C) | **(a) Create the six renamed variables in production, preview and development** · (b) Delete the OTP backend entry from the env files · (c) Run knip to confirm no orphaned exports · (d) Nothing — the branch is ready | (a) Create the six renamed vars in all platform environments | ✅ correct |

- Score (optional, only if `comprehension_gates.ai_graded`): 3/3 = 1.0 (pass threshold 1.0 met)

The gate passed, so verification proceeded; the first round's FAILED outcome came
from the acceptance-criteria results in `verify.md`, not from this check.

### Verify gate — round 2 (after the post-verification rework)

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Why did removing the string `api-test` from the middleware exclusion list not fix `/api-test`? (implement.md, Post-verification rework) | **(a) The `api` token already prefix-matches it** · (b) The route file was never deleted · (c) `public/api-test.html` is served at that path · (d) The build cache held the old route | (a) The `api` token already prefix-matches it | ✅ correct |
| 2 | What evidence showed the `/api-test` 200 is generic rather than specific to the deleted page? | **(a) `/apifoo` and `/apizzz` return the same 200 homepage; `/api-test/deeper` 404s** · (b) The body matched `public/api-test.html` · (c) The build manifest still listed the route · (d) Only `/api-test` behaved this way | (a) /apifoo and /apizzz return the same 200 homepage | ✅ correct |
| 3 | After the rework, what does `/requests-log` return? | **(a) 307 redirect, ending at 404** · (b) 200 with the storefront homepage · (c) 404 directly, no redirect · (d) 503 from the middleware | (a) 307 redirect, ending at 404 | ✅ correct |

- Score: 3/3 = 1.0 (pass threshold 1.0 met)
