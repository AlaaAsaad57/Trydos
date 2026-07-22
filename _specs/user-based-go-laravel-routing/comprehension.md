---
ticket: user-based-go-laravel-routing
stage: review           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-22
links:
  clickup:
  github:
---

# Comprehension — user-based-go-laravel-routing

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
| 1 | A verified user's token expires; `/api/auth/expire` re-registers a guest but the re-registered `User-Data` still carries the phone. Where does their next allow-listed market request (e.g. `/cart/add`) go? | **Laravel** (phone persists → predicate passes) · Go (expiry always flips) · Go then Laravel · Blocked with 401 | Laravel | yes |
| 2 | Why does `getMarketFetchBase()` deliberately NOT consult the `isFromGoApi` allow-list check? | **likesDetails is hardcoded-Go but not allow-listed — consulting the list would flip guests to Laravel** · Performance · Prefix matching unsupported · Dashboard isolation | likesDetails guest behavior | yes |
| 3 | Which of the plan's seven files are protected paths that had to be explicitly listed in "Files to change" (GU-2/IM-5)? | **The 5 serverRequests files** · All seven · tokenManager + proxy route · None | The 5 serverRequests files | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0

## Verify gate (run 1 — outcome FAILED at AC-11 build; questions retained below)

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Before `/publish-pr` runs, how is this implementation rolled back? | **Discard uncommitted working-tree edits on the ticket branch (no commit exists, IM-9)** · git revert the commit · redeploy previous Vercel build · comment out the GO_APIS block | Discard working-tree edits | yes |
| 2 | For a verified user, what do the nine rerouted server-side fetches now send to Laravel? | **Same anonymous request, new host (no Authorization header; lang/country unchanged)** · request + Bearer MARKET-TOKEN · an adapted response shape · only allow-listed URLs | Same anonymous request, new host | yes |
| 3 | During a market request through `/api/proxy`, the `User-Data` cookie is unreadable — what does routing do? | **Guest routing (Go-first): resolver catches everything, returns false — request never fails** · Laravel always · request fails 500 · request blocked 403 | Guest routing (Go-first) | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0

## Verify gate (run 2 — after the resume fix)

> Questions derived from the updated `implement.md` + `spec.md` (CG-2).

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Why is a static `tokenManager` import safe in `products.ts` but was a build-breaker in `index.tsx`? | **`products.ts` is "use server" → client imports become action proxies; `index.tsx` is a plain barrel → its references get client-bundled** · index.tsx is client-only · import order · Turbopack cache bug | "use server" proxy vs plain barrel | yes |
| 2 | How do the two non-"use server" files obtain the user-aware market base now? | **`resolveMarketFetchBase()` — a "use server" wrapper exported by `products.ts` (client graph sees only an action proxy)** · dynamic `await import()` · `process.env` + flag · via `/api/proxy` | resolveMarketFetchBase from products | yes |
| 3 | What is the recorded lint situation backing AC-11? | **Repo-wide lint exits 1 with 8 pre-existing i18n errors in untouched seller-dashboard files (same on develop); scoped eslint on the seven changed files exits 0** · lint fully passes · new errors in tokenManager · lint was skipped | 8 pre-existing, 0 in changed files | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): 1.0
