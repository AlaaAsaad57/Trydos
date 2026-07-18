---
ticket: seller-product-create-validation-fields
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Comprehension — seller-product-create-validation-fields

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
| 1 | Per `plan.md` Rollback, if `AC-8` fails (a flag turned off comes back on after save), what is the correct fallback? | (a) **Backend fix to the truthiness defect; block the ticket (VF-6) — step 6 is not independently revertable because `multiplyQTY` was one of the three create-blocking errors** ✅ · (b) Revert step 6 alone, keeping brand validation and base language · (c) Reinstate the omit pattern as a client workaround · (d) Revert the translation keys and brand validation | (a) Backend fix; block the ticket | ✅ correct |
| 2 | Why does `plan.md` treat `AC-8` as the single most important criterion? | (a) **`buildUpdateFormData` is shared by both endpoints, so the encoding change reaches every existing seller's edit path, not just the broken create path** ✅ · (b) It is the only criterion not covered by the `standard-frontend` profile · (c) It gates the translation-parity check · (d) Product creation cannot succeed until the flag round-trips, so `AC-8` blocks `AC-7` | (a) Shared builder reaches all edits | ✅ correct |
| 3 | Why is `DEFAULT_LANGUAGE_CODE` kept local to the product-editor helpers rather than derived from the existing i18n default in `proxy.ts`? | (a) **The proxy default is the request-scoped, user-facing storefront UI language; this is a product-content contract value, and coupling them would let a locale change silently alter stored product data** ✅ · (b) Importing from `proxy.ts` would pull a protected runtime path into Files to change · (c) The editor helpers are client-only and cannot import from the edge runtime · (d) It would add the translation modules to the seller-dashboard bundle | (a) UI locale vs content contract | ✅ correct |

- Score (optional, only if `comprehension_gates.ai_graded`): 3/3 = 1.0 (pass
  threshold 1.0 met; `ai_graded` is off, so this is recorded for reference only)

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Per `implement.md`, what did the `AC-8` result establish? | (a) **The documented truthiness defect is NOT live on the update path — a flag turned off on a pre-existing product stayed off after reload** ✅ · (b) Product creation now succeeds with none of the three errors · (c) Brand validation blocks submit client-side · (d) The server requires `1`/`0` encoding | (a) Truthiness defect not live on update | ✅ correct |
| 2 | Which changed file carries the edit that reaches **both** the create and update endpoints? | (a) **`helpers.ts` — `buildUpdateFormData`, the single builder feeding both endpoints** ✅ · (b) `sections.tsx` — `CoreSection` · (c) `services/sellerDashboard/index.ts` · (d) `ProductEditor.tsx` — `confirmSave` | (a) helpers.ts — buildUpdateFormData | ✅ correct |
| 3 | Per `implement.md`, what remains open even after the manual pass? | (a) **Whether `brand_id` / `boutique_id` are authorization-scoped server-side to the authenticated seller (review follow-up 7)** ✅ · (b) Whether the off-case sends `false` · (c) Translation parity across `ar`/`tr`/`ku` · (d) Whether a plan revision is needed | (a) brand_id / boutique_id auth scoping | ✅ correct |

- Score (optional, only if `comprehension_gates.ai_graded`): 3/3 = 1.0 (pass
  threshold 1.0 met; `ai_graded` is off, so this is recorded for reference only)
