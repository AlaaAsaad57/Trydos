---
ticket: order-line-can-return
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Review — order-line-can-return

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-10, AC-1..AC-10, C-1..C-3) and `plan.md` (Approach, Steps
1-6, Files to change, Integration surface, Tests, Validation strategy,
Rollback), with `research.md` and the saved contract
`docs/api-requirements/customer-orders-can-return-per-line.md` as context.

## Plan Summary

The last check of the return gate in `OrderItemOptions.tsx` changes from the
order's `can_return_order` to the line's `can_return_product === true`. The
window sentence reads `return_days_limit` and is hidden when that value is not a
whole number above 0. The already-in-request rule and the locked-request rule
stay. The type and the shared fixture get the two new fields. The one existing
test file is extended. Two docs are updated.

## Risks

- Release order (spec C-1): shipping before backend PR #637 removes every
  return row. See panel findings S-1 / SR-2.
- The backend's meaning of "in a return request" (contract rule 5) is not known.
  See SR-1.

## Assumptions

- The backend sends `can_return_product` as a JSON boolean and
  `return_days_limit` as a number (SR-3, SR-4 question this).
- `already_return` in `returnDetails` and contract rule 5 mean the same thing.

## Open Questions

- What does contract rule 5 count as "in a return request": only a line added to
  the request, or every line of an open draft? (SR-1)

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).** The gate
> examines the owner on these findings, so they have to be readable first; the
> **Decision** and **Approvals** sections below are filled in afterwards. That is
> also why a failed gate leaves this table populated and the decision empty — it
> is what the owner re-reads before the re-run (CG-7).
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| ID | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|----|------|----------|---------|--------------------------|---------------------|
| SR-1 | senior | major | FR-6 / AC-6 assume the backend and the app mean the same thing by "in a return request". The app uses `already_return: true` in `returnDetails` (`OrderItemOptions.tsx:121-125`). Opening the flow creates a draft first (CO-26 "Draft-first model"). If the backend counts every line of an open draft as "in a request", then after the first product is added, every other line gets `can_return_product: false` and falls through to "no row". The shopper can no longer add a second product to an editable request. Today `can_return_order` keeps that working. Suggestion: confirm rule 5 with the backend before implementing; add a case "editable request open, this line not yet added, `can_return_product: true` → Return This Product shows"; add it to the staging check. | spec FR-6, AC-6; plan step 4; contract §1 rule 5 | **accept** — confirm with the backend what contract rule 5 counts before `/implement`; the suggested test case is not in the approved `plan.md > Tests` (see follow-ups). |
| SR-2 | senior | major | The release hold is "merge into `development`, do not promote to `main`". `main` is promoted from `development` as a whole, so after the merge any other ticket's promotion carries this change, or is blocked by it. Suggestion: keep the PR open (not merged) until the staging check passes; reword C-1. | spec C-1; plan Integration surface "Ordering / lockstep", Rollback | **accept** — the PR stays open (not merged into `development`) until the staging check passes. |
| S-1 | security | major | Same point as SR-2 from the security side: the hold depends on a person. If the backend is not ready, every delivered line loses "Return This Product" on staging (FR-2 has no fallback). Suggestion: do not merge into `development` until the staging network check is done; write the check result (date and the `getOrdersByOrderGroupID` evidence) in the PR or `verify.md`. | spec C-1; plan Integration surface, Rollback | **accept** — same as SR-2; the check result (date + `getOrdersByOrderGroupID` evidence) is recorded in the PR or `verify.md`. |
| SR-3 | senior | minor | The gate is `can_return_product === true`. The core backend sends some line flags as `0/1` (`is_stock_decreased`, `refund_request` in the type). A `1` would hide every row. The staging check only asks that the field is present. Suggestion: also confirm it is a JSON boolean; do not loosen the gate. | plan step 4; Integration surface "how the owner checks it" | not dispositioned at the gate (minor) |
| SR-4 | senior | minor | "A whole number above 0" may treat a numeric string like `"30"` as invalid. The old field is typed `number \| string` (`OrderInterface.ts:129`). If `return_days_limit` also comes as a string, every line loses its window sentence. Suggestion: decide whether `Number()` runs before the integer check; add `"30"` to the AC-4 / AC-5 cases. | plan step 4; spec FR-5; AC-5 | not dispositioned at the gate (minor) |
| S-2 | security | minor | Same input point as SR-4: the plan names no handling for a numeric string or a non-numeric string. React escapes the text, so there is no injection risk. Suggestion: `Number.isInteger(Number(v)) && Number(v) > 0`; add `"30"` and a non-numeric string to the AC-5 `it.each`. | plan step 4; AC-5 | not dispositioned at the gate (minor) |
| S-3 | security | minor | The row is a UI gate only. With `can_return_order: false` and `can_return_product: true`, a tap still creates a draft before "not allowed" (FR-9). The plan does not say the backend applies the per-line rule on create. Suggestion: one line in the CO-26 doc: the core backend must refuse or skip a line with `can_return_product: false` on create. | spec Edge Cases, FR-9; `OrderItemOptions.tsx:149` | not dispositioned at the gate (minor) |
| SR-5 | senior | minor | `docs/production-readiness/BLOCKERS-BY-SECTION.md:346` (W-22) also says "only when `can_return_order`". It is not in Files to change, so it will disagree with `08-orders-and-returns.md`. The file is untracked today. | FR-10, AC-10; plan Files to change | not dispositioned at the gate (minor) |
| SR-6 | senior | minor | The Integration surface leaves out the other readers of `already_return`: `ReturnOrderItemWrapper.tsx:33-37` and `OrderItemReturnConfirmationWindow.tsx`. They carry the same "in request" meaning that FR-6 depends on. | plan Integration surface "Overlapping flows" | not dispositioned at the gate (minor) |
| SR-7 | senior | info | Small scope that fits the code: one gate change, no helper, no service or store change. F-7 holds (`services/order.ts:411-432`, `OrderDetailsWrapper.tsx:565`). | plan Approach | — (info) |
| SR-8 | senior | info | The fixture claim holds: `tests/fixtures/fixtures.test.ts:76` only compares two builds; no snapshot on `buildOrderLine`. | plan step 2 | — (info) |
| SR-9 | senior | info | The red-first list in step 3 matches the code. The new AC-8 "not delivered" case and the changed AC-7 case are green before the fix, and the plan does not claim them as red. | plan step 3 | — (info) |
| S-4 | security | info | The contract doc holds no secrets and names no backend technology. | plan Files to change | — (info) |
| S-5 | security | info | No new endpoint, request, cookie, permission or translation key; no protected path (NFR-1, NFR-2, C-3). | plan Files to change | — (info) |
| S-6 | security | info | Rollback is one revert. The only lasting side effect of a wrong gate is draft return requests, which already happen today (F-3). | plan Rollback | — (info) |
| P-1 | performance | info | No material performance concern: a few constant-time checks in a sheet that renders on demand. | plan Approach, step 4 | — (info) |
| P-2 | performance | info | The change removes a wasted backend write: an expired line no longer reaches `CreateReturnRequest` (line 149). AC-2 and AC-3 protect this. | spec Business Goal | — (info) |
| P-3 | performance | info | NFR-1 holds; two small fields per line in an answer the page already loads. | spec NFR-1 | — (info) |
| P-4 | performance | info | Backend cost is outside this repo; PR #637 may read each line's category (N+1). Optional: note at the staging check that the order answer is not slower. | spec C-1 | — (info) |
| P-5 | performance | info | The two fixture defaults do not change suite run time. | plan step 2 | — (info) |

## Decision

`APPROVED`

- Rationale: the owner approved the plan as written on 2026-10-21, after passing
  the comprehension gate (3/3, administered short — see `comprehension.md >
  degraded`). The owner accepted the three major findings. SR-2 / S-1 change only
  how the PR is delivered, so they need no plan change. SR-1's suggested test case
  is **not** in the approved `plan.md > Tests`. The owner was told that
  `/implement` may not write an undeclared test (IM-4) and chose `APPROVED`
  anyway.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-10-21

## ADR reference

- ADR: none

## Required Follow-up Actions

- **SR-1 — before `/implement`:** confirm with the core backend what contract
  §1 rule 5 counts as "in a return request": only a line added to the request, or
  every line of an open draft. If it is every draft line, FR-6 and the plan do
  not hold, and the work item must stop for a plan revision.
- **SR-1 — the new test case** ("editable request open, this line not yet in it,
  `can_return_product: true` → Return This Product shows") is not declared in
  `plan.md > Tests`. `/implement` must **not** write it (IM-4). It needs a plan
  revision; until then this case is **not covered**. Add it to the staging
  manual check meanwhile.
- **SR-2 / S-1 — release hold:** do not merge the PR into `development` until the
  owner has done the staging check in `plan.md > Integration surface`. Record the
  date and the `getOrdersByOrderGroupID` evidence in the PR or in `verify.md`.
- **Minor findings** SR-3, SR-4 / S-2, S-3, SR-5, SR-6 were not dispositioned at
  the gate. They stay on record here; any of them that changes code, tests or the
  file list needs a plan revision.
