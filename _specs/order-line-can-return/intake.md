---
ticket: order-line-can-return
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Intake — order-line-can-return

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`order-line-can-return` — no front-end ClickUp task. The change follows the
backend ticket [`z8n6b61ez6`](https://app.clickup.com/t/z8n6b61ez6) and backend
PR #637. The owner gave the backend's API contract in chat on 2026-10-21. It is
saved as `docs/api-requirements/customer-orders-can-return-per-line.md`. A
read-only investigation in the same chat came before this ticket.

## Ticket Summary

The core backend now decides "can return" for **each order line**. It adds two
fields to every line (`can_return_product`, `return_days_limit`), and it changes
`can_return_order` to mean "at least one line can still be returned". The app
still decides the "Return This Product" row from the order-level
`can_return_order`, so after the backend change the row would show on a line
whose own days have ended. The app must use the new per-line fields.

## Ticket Metadata

- id / slug: `order-line-can-return`
- title: Order returns: decide return per line with can_return_product and show
  return_days_limit
- owner: developer
- created: 2026-10-21
- links: backend ClickUp `z8n6b61ez6`, backend PR #637 (no front-end task)

## User Story

> As a shopper with a delivered order, I want the "Return This Product" option to
> show only on the products I can still return, with the right number of days,
> so that I do not start a return that the store then refuses.

## Request details (as given by the owner)

- The owner's ask: "this api contract for changed feature we need to start
  development ticket for it but before do some investigation to know whats
  about. save the contract in docs".
- **Scope decided by the owner on 2026-10-21:**
  - **A line that cannot be returned hides the row.** When
    `can_return_product` is `false`, the options sheet does not show "Return
    This Product". No "cannot be returned" text is added.
  - **The days text shows the total window.** "Return This Product In …" reads
    `return_days_limit`, not `allow_return_in_days`. It does not count the days
    left, so no delivery date is needed.
  - **No fallback.** The app trusts only `can_return_product` for a new line. A
    line without the field gets no return row. The app does not fall back to
    `can_return_order`.

## Investigation notes (from the chat, for `research` to confirm)

- **The gate.** `components/setting/orders/OrderItemOptions.tsx:126-142`
  (`shouldShowRetutn`). It shows the row when the order is `delivered` and the
  line `qty` is above 0. Then:
  - a line **already in the return request** shows "Update Return Request For
    This Product" while `edit_return_request` is `true` (lines 131-133);
  - a line **not yet in it** is blocked when the request exists and is locked
    (lines 138-140), and otherwise follows `parentOrder.can_return_order`
    (line 141). This last line is the one the contract breaks.
- **Why the already-returned branch must stay.** The contract's rule 5 says
  `can_return_product` is `false` for a line that is already in a return
  request. So that branch cannot read the new field; it keeps
  `edit_return_request`.
- **What happens today on an expired line.** A tap calls
  `initializeReturn` (`OrderItemOptions.tsx:143-177`). It creates a **draft**
  return request on the core backend first, then checks the request details. If
  the line is missing there, the shopper sees "return this product is not
  allowed". So a wrong row creates a draft request before it fails.
- **The days text.** `OrderItemOptions.tsx:70-76` reads
  `allow_return_in_days`: `1` → "24 Hours", more → "`<n>` Days". The contract
  says that field is `0` for a product with no category, so today such a line
  reads "0 Days".
- **The type.** `utils/types/OrderInterface.ts:127-129` has
  `allow_return_in_days` on each line, with a comment that says "Display only —
  never gates". It has no `can_return_product` and no `return_days_limit`.
- **Where the order comes from.** `OrderItemOptions` is used only by
  `components/setting/orders/OrderDetailsWrapper.tsx`. That page loads the
  order with `services/order.ts:411` `getOrderDetails` →
  `GET /customer/order/getOrdersByOrderGroupID` (core backend, `server:
  "market"`).
- **No order-level return button.** The contract says "show the return button
  of the order when `can_return_order` is `true`". The web app has no such
  button. `can_return_order` is read only at `OrderItemOptions.tsx:141`.
- **Tests that exist.** `tests/components/setting/orders/OrderItemOptions.test.tsx`
  covers the return gate (lines 163-208: 24-hour window, days window, qty 0,
  locked request, already-returned line). The order fixture is
  `tests/fixtures/order.ts` (`can_return_order: false` by default).
- **Docs that describe the old rule.**
  `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md` says the
  window is "display only" and the row follows `can_return_order`.
- **Out of scope, seen in passing.** The product page reads
  `allow_return_in_days` from the product details API (`FreeReturnBadge.tsx`,
  `ExpectedDeleiveryModal.tsx`, `PricesRow.tsx`). This contract does not change
  that API, so those screens are not part of this ticket.

## Acceptance Criteria Presence Check

- Present? **no** (not as numbered criteria)
- Notes: the saved contract and the owner's three decisions above say the
  expected behaviour. The `spec` stage turns them into `AC-n`.

## Test Cases Presence Check

- Present? **no**
- Notes: the `spec` stage defines them; the `plan` stage maps each `AC-n` to a
  test. `OrderItemOptions.test.tsx` already exists, so new cases extend it.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the
  investigation is already done.
- Is the goal to *choose between options*? **no** — the owner made the three
  scope choices on 2026-10-21.
- Does a command reproduce behaviour contradicting a *sourced* expectation? **no**
  — today's app matches today's backend. The backend contract is new, so this is
  a planned change, not an incident.
- Is the change to make already known, leaving only building it? **yes**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

These are questions for `research`, not blockers for intake:

- **Is backend PR #637 on staging?** The owner chose "no fallback", so the
  front-end change must not reach shoppers before the backend serves
  `can_return_product`. Otherwise every line loses its return row. Research must
  find out, and the plan must say how the release order is kept.
- What the row should do with `return_days_limit` of `0` or a missing value, now
  that the field comes from the store setting when there is no category.
- Whether the locked-request check (`OrderItemOptions.tsx:138-140`) is still
  needed next to `can_return_product`. The contract's six rules do not mention a
  locked request.
- Which other files read `allow_return_in_days` from an **order** line (not from
  a product), and which tests and docs must change with the gate.

## Readiness Status

`READY`

- Justification: the owner asked on 2026-10-21 to start this work item after the
  investigation, and chose the three open scope points (hide the row, total
  window, no fallback). The behaviour to build and the main file are known. The
  open points above are repository and backend facts for `research` to find.
