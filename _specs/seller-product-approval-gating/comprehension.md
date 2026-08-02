---
ticket: seller-product-approval-gating
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-07-25
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 3/3                 # correct / total
decision: PASSED           # gate decision; `none` when the quiz failed (the notification hook reads these — ADR-013)
links:
  clickup:
  github:
---

# Comprehension — seller-product-approval-gating

> Single-owner gate control (ADR-011 / CG-1..CG-4). At each gate the owner answers
> multiple-choice questions (**≥4 options each**) generated **from the artifact
> under review**. One section per gate — never overwrite another gate's section.
> The gate records its decision **only if 100% of answers are correct** (CG-4);
> any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2). Answered before recording
> the `/review` decision. Asked against **revision 2** of `plan.md`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | On the create path, what does the revised plan do when `GET /shop/info` succeeds but the response does not carry `is_new_products_approval` at all? | (a) Blocks creation with the load-error state and a retry · (b) Locks every price input except Purchase Price · (c) Shows the loading state until the field appears · (d) **Treats the seller as unrestricted, exactly as before this ticket** | (d) Treats the seller as unrestricted, exactly as before this ticket | ✅ yes |
| 2 | Why does the plan keep `ShopInfoLoader`'s early-return guard keyed on `sellerId` alone, rather than making it skip failure records so it can retry? | (a) Because a failure record has no `sellerId` to match against · (b) **Because skipping failure records would re-fetch on every render, since writing the record re-triggers the effect that wrote it** · (c) Because the guard is in a protected path and cannot be modified · (d) Because the loader must not run at all on the create path | (b) Because skipping failure records would re-fetch on every render, since writing the record re-triggers the effect that wrote it | ✅ yes |
| 3 | Which file does the revised plan deliberately NOT change, and for what reason? | (a) `components/SellerDashboard/ui/index.tsx` — InlineAlert already supports a warning tone · (b) **`sellerDashboard/[sellerId]/page.tsx` — currency stays required and is always written, so it keeps compiling and behaving as today** · (c) `store/index.ts` — it is a protected path and may never be modified · (d) `utils/fetchData.ts` — its failure contract is handled at the call site instead | (b) `sellerDashboard/[sellerId]/page.tsx` — currency stays required and is always written, so it keeps compiling and behaving as today | ✅ yes |

- Result: **passed** — 3/3 correct (CG-4 threshold is 100%).

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2). Answered before
> recording PASSED at `/verify`.

| # | Question (from the artifact) | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|----------------|----------|
| 1 | Why was `unit_price` coalesced unconditionally in the payload builder rather than gated on the locked state? | (a) **Because it is behaviour-identical and avoids adding a parameter, per the review's binding instruction** · (b) Because the backend rejects the key when it is absent · (c) Because the locked state is not available inside the payload builder · (d) Because `unit_price` must always be sent as 0 for every seller | (a) Because it is behaviour-identical and avoids adding a parameter, per the review's binding instruction | ✅ yes |
| 2 | On the create path, what happens when `GET /shop/info` settles but the request did not succeed? | (a) The form renders unrestricted, since an unknown standing must not restrict · (b) The loader automatically retries until the request succeeds · (c) **The screen shows an error state whose retry clears the record so the loader refetches** · (d) The screen stays in the loading state until the seller reloads the page | (c) The screen shows an error state whose retry clears the record so the loader refetches | ✅ yes |
| 3 | Which protected path did this ticket change, and on what authority? | (a) `components/SellerDashboard/ui/index.tsx` — approved because InlineAlert is shared across the dashboard · (b) `next.config.ts` — required to register the new translation keys · (c) None — no `protected_paths` file was touched by this ticket · (d) **`store/index.ts` — listed in the approved plan's Files to change** | (d) `store/index.ts` — listed in the approved plan's Files to change | ✅ yes |

- Result: **passed** — 3/3 correct (CG-4 threshold is 100%).
