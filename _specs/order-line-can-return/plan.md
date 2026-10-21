---
ticket: order-line-can-return
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Plan — order-line-can-return

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Change the one gate that decides the return row, in the per-line options
sheet. For a line that is not in a return request, the last check reads the
line's `can_return_product === true` instead of the order's `can_return_order`.
The window sentence reads `return_days_limit`, and it renders only when that
value is a whole number above 0.

The two rules before it stay as they are: the already-in-request rule
(`edit_return_request`) and the locked-request rule.

**Why this way.** The page already passes the raw API line to the sheet
(research F-7), so no service, store or mapping code changes. Adding a helper
or a new component would be more code for the same result. The alternatives the
owner rejected (disabled row, days left, fallback) are out of scope by decision.

## Steps

1. **Type.** Add `can_return_product?: boolean` and `return_days_limit?: number`
   to the order-line type. Each gets a short comment that names its contract
   meaning. Rewrite the `allow_return_in_days` comment: it is the old field, the
   backend keeps it for old app versions, and the return row no longer reads it
   (OQ-7).
2. **Fixture.** Add `can_return_product: false` and `return_days_limit: 1` to
   `buildOrderLine`, next to `allow_return_in_days: 1`. These follow the
   fixture's existing defaults (`can_return_order: false`, a 1-day window), so
   no other test that uses the builder changes behaviour.
3. **Tests first.** Change and add the cases in the **Tests** table. Run
   `OrderItemOptions.test.tsx` against the **unchanged** sheet and record which
   cases go red. The expected red cases are AC-1, AC-2, AC-3, AC-4, AC-5 and the
   changed AC-9 cases. They show that today's code follows `can_return_order`
   and `allow_return_in_days`.
4. **Sheet.** In `OrderItemOptions.tsx`:
   - the window value comes from `orderItem?.return_days_limit`;
   - a flag says whether that value is a whole number above 0;
   - the "Return This Product In … And Back Your Money" line renders only when
     the flag is true;
   - in `shouldShowRetutn`, the final `return parentOrder.can_return_order`
     becomes `return orderItem?.can_return_product === true`;
   - the comments at lines 70-71 and 134-137 say the new rule.

   Nothing else in the file changes.
5. **Tests green.** Run the same file again; every case must pass. Then run the
   `logic-change` profile.
6. **Docs.** Update the CO-26 feature document and the orders-and-returns
   readiness page (AC-10). Commit the saved contract with the change.

## Files to change

- `utils/types/OrderInterface.ts` — order-line type: add `can_return_product`,
  `return_days_limit`; rewrite the `allow_return_in_days` comment (step 1).
- `components/setting/orders/OrderItemOptions.tsx` — the gate and the window
  sentence (step 4).
- `tests/fixtures/order.ts` — `buildOrderLine` gets the two new fields with
  safe defaults (step 2).
- `tests/components/setting/orders/OrderItemOptions.test.tsx` — the cases in
  **Tests** (step 3).
- `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md` —
  "How it works", "Known gaps" and the technical rows: the option follows
  `can_return_product`; the window reads `return_days_limit`; no fallback.
- `docs/production-readiness/08-orders-and-returns.md` — W-22 (line 37) says
  `can_return_product`; L-12 (line 58) is closed by FR-5; the open question on
  line 85 is answered by the contract.
- `docs/api-requirements/customer-orders-can-return-per-line.md` — the backend
  contract. Already written before intake (untracked). It is listed here so the
  PR carries it; `/implement` does not change it.

## Integration surface

- **Components / shared config touched:**
  - the order-line type, shared with `OrderItem.tsx`, `ChangeOrderItem.tsx`,
    `OrdersListWrapper.tsx` and `OrderDetailsWrapper.tsx`. The two new fields
    are optional, so none of them needs a change;
  - the shared fixture `buildOrderLine`, used by about 18 test files under
    `tests/components/setting/orders/`, `tests/components/Orders/` and
    `tests/components/settings/cards/`, and by `tests/fixtures/fixtures.test.ts`.
- **Who else depends on them:**
  - `OrderDetailsWrapper.tsx` mounts `OrderItemOptions` and passes the raw line
    and pack. It does not change; its test mocks `OrderItemOptions`
    (`OrderDetailsWrapper.test.tsx:70`);
  - no other code reads `can_return_product`, `return_days_limit`, or (on an
    order line) `allow_return_in_days`.
- **Overlapping flows:**
  - CO-26 (create a return) starts from this row, so a row hidden here means
    `CreateReturnRequest` is never called for that line;
  - CO-28 (manage a return) — confirm, cancel and the per-line return info
    read `edit_return_request`, `order_has_return_request` and `returnDetails`.
    This change does not touch them;
  - the product page reads `allow_return_in_days` from the product details API
    (research F-8). It shares only the field name, and it does not change.
- **Ordering / lockstep dependencies:**
  - **backend first (spec C-1).** Core backend PR #637 must serve the new fields
    on staging before this change reaches `main`;
  - **how the owner checks it:** sign in on staging, open
    `/sy-en/settings/orders/<order_group_id>` for a delivered order, and look at
    the `getOrdersByOrderGroupID` answer in the browser network tab. Every
    `details[]` line must carry `can_return_product` and `return_days_limit`;
  - the PR may merge into `development` before that check. It must not be
    promoted to `main` until the check passes.
- **What breaks if this is wrong:**
  - **front end first:** every delivered line loses "Return This Product". On
    staging, no shopper can start a return. Support would see it as "the return
    button is gone";
  - **gate wrong the other way:** an expired line shows the row, and a tap
    creates a draft request before the "not allowed" message (today's bug, F-3);
  - **fixture defaults wrong:** a test elsewhere that renders a real sheet would
    change — none exists today (the only render of the sheet is its own test).

## Tests

All rows extend the one test file that already exists for the sheet (research
F-10). No new file. Line numbers point at today's file.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|----|-------------------------|-------------|-----------|------------------|
| AC-1 | `OrderItemOptions.test.tsx::a delivered, returnable line offers return with a 24-hour window, and report` (line 163) — shows the row through `can_return_order: true` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change that case: the order has `can_return_order: false` and the line `can_return_product: true`, `return_days_limit: 1`, `allow_return_in_days: 0`. It still expects "Return This Product", "24 Hours" and "Report This Product" |
| AC-2 | none — searched `tests/components/setting/orders/` for `can_return_product` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | new: `a line whose return days have ended offers no return, even when the order can still return` (`can_return_order: true`, `can_return_product: false`) |
| AC-3 | none — searched `tests/components/setting/orders/` for `can_return_product` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | new: `a line without can_return_product offers no return — no fallback to can_return_order` (`can_return_order: true`, field set to `undefined`) |
| AC-4 | `OrderItemOptions.test.tsx::a longer return window reads in days, and a reported line says so` (line 171) — reads `allow_return_in_days: 7` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change that case to `return_days_limit: 30`, `allow_return_in_days: 7`, expecting "30 Days". New: `the window reads return_days_limit, not allow_return_in_days` (`allow_return_in_days: 0`, `return_days_limit: 14` → "14 Days", and no "0 Days") |
| AC-5 | none — searched the same file for `NaN` / `0 Days` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | new `it.each([0, null, undefined])`: `a returnable line with no usable window (%s) offers return without the window sentence`. Expects "Return This Product"; no "Return This Product In" text; no "0 Days" or "NaN Days" |
| AC-6 | `OrderItemOptions.test.tsx::a product already in the return is offered an update only while the return is editable` (line 195) | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change that `it.each` so the line has `can_return_product: false` (as contract rule 5 sends it) and the order `can_return_order: true` |
| AC-7 | `OrderItemOptions.test.tsx::a locked return request stops a new product being added` (line 186) — row would be shown through `can_return_order` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change that case so the line has `can_return_product: true` |
| AC-8 | `OrderItemOptions.test.tsx::a delivered line with qty 0 offers no return` (line 181) — uses `can_return_order` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change that case to `can_return_product: true`. New: `an order that is not delivered offers no return, even for a returnable line` |
| AC-9 | `OrderItemOptions.test.tsx` "starting a return" — three cases (lines 259, 282, 295), shown through `can_return_order: true` | extend | `tests/components/setting/orders/OrderItemOptions.test.tsx` | change the three cases so the row shows through the line's `can_return_product: true` (order `can_return_order: false`). Their assertions stay |
| AC-10 | none — documentation | none — docs-only criterion | — | checked at `/verify` by reading the two documents against FR-10 |

## Validation strategy

- Validation profile: `logic-change` (lint, typecheck, unit tests).
- Profile source: `pre-existing` (`.claude/project-config.yaml`).
- The profile runs `pnpm test:run`, which runs the Tests table. The unit suite
  sometimes has one random failure in a full run. A failure outside
  `OrderItemOptions.test.tsx` is re-run alone before anyone judges it.
- Red-first evidence (step 3): `/implement` runs
  `pnpm vitest run tests/components/setting/orders/OrderItemOptions.test.tsx`
  before step 4 and records the red cases in `implement.md`. A changed or new
  case for AC-1..AC-5 or AC-9 that is green before step 4 does not prove its
  criterion and must be fixed.
- No new user-visible text, so `i18n-parity` is not needed. `lint` still
  catches an unknown key.
- Manual check (after the backend check in Integration surface): on staging,
  open a delivered order with lines of different windows. Only the lines with
  `can_return_product: true` offer "Return This Product", each with its own
  days.

## Rollback

- Revert the ticket's commit. It changes no config, no data, no request, and
  no stored value, so a revert brings back today's behaviour at once.
- If the backend is late after a merge into `development`, keep the change off
  `main` (spec C-1). A revert is needed only if it was already promoted.

## Plan ↔ requirement traceability

| Requirement | AC | Step |
|---|---|---|
| FR-1 | AC-1, AC-2 | 4 |
| FR-2 | AC-3 | 4 |
| FR-3 | AC-2 | 4 |
| FR-4 | AC-4 | 1, 4 |
| FR-5 | AC-5 | 4 |
| FR-6 | AC-6 | 4 (kept as is) |
| FR-7 | AC-7 | 4 (kept as is) |
| FR-8 | AC-8 | 4 (kept as is) |
| FR-9 | AC-9 | 4 (kept as is) |
| FR-10 | AC-10 | 6 |
| NFR-1, NFR-2 | — | 4 adds no request and no key |
| NFR-3 | all | 3 |
| C-1 | — | Integration surface (release check) |

## Open questions resolved here

- **OQ-7** (deferred by the spec) — `allow_return_in_days` **stays** in the
  order-line type. The backend still sends it, and the fixture and the product
  page use the same name. Its comment changes to say it is the old field and the
  return row reads `return_days_limit` (step 1). Removing it would change the
  fixture and other tests for no gain in behaviour.

No `OQ-n` is left open.

## Out of scope

- Everything listed under the spec's Out of Scope.
- Renaming `shouldShowRetutn` or other clean-up in `OrderItemOptions.tsx`.
- Any change to `OrderDetailsWrapper.tsx`, `services/order.ts` or the return
  screens.
