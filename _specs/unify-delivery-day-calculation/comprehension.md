---
ticket: unify-delivery-day-calculation
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-07-26
result: passed
score: 3/3
decision: PASSED
links:
  clickup:
  github:
---

# Comprehension — unify-delivery-day-calculation

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Which file in the plan's "Files to change" is the protected path requiring review-gate approval? | `components/Cart/CartItem.tsx` · **`serverRequests/index.tsx`** · `services/home.ts` · `utils/startingSettings.ts` | `serverRequests/index.tsx` | ✅ yes |
| 2 | Why does the resolver accept BOTH backend envelope shapes rather than only the accepted (core) one? | Because the core backend may rename the key again later · **Because the gateway serves guests, who are correct today and would regress if only the core shape were read** · Because the session cache may contain either shape · To avoid changing the server-side fetcher | Because the gateway serves guests, who are correct today and would regress if only the core shape were read | ✅ yes |
| 3 | Per the plan, what does the delivery estimate show when the platform shipping duration is absent? | It falls back to the value cached in sessionStorage · It renders as 0 days total · **The estimate equals the product shipping days alone** · The row is hidden until settings load | The estimate equals the product shipping days alone | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | In the protected file `serverRequests/index.tsx`, what exactly did the resolver replace? | A call to `resolveMarketFetchBase` · **The hard-coded `response?.data?.data?.["starting_setting"]` lookup** · The headers passed to `fetchServerData` · The whole `GetStarttingSetting` function body | The hard-coded `response?.data?.data?.["starting_setting"]` lookup | ✅ yes |
| 2 | In `OldCartContainer`, the row's render condition changed from truthy `product.shipping_days` to the coerced sum being `> 0`. What is the visible effect? | Lines with a zero platform duration are now hidden · Nothing visible changes; it is a refactor only · **Rows for products with no shipping time of their own now appear when the platform duration is non-zero** · The day count is rounded to whole days | Rows for products with no shipping time of their own now appear when the platform duration is non-zero | ✅ yes |
| 3 | Per the plan, how is this change rolled back? | By clearing the session cache on every client · By re-running the gateway alignment · **By reverting the single publishable commit; each file is also independently revertable** · By toggling a feature flag added in this change | By reverting the single publishable commit; each file is also independently revertable | ✅ yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
