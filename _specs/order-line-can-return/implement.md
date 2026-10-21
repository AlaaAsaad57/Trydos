---
ticket: order-line-can-return
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Implement — order-line-can-return

> Record of what was actually built, following `plan.md`.

## Entry

- **Path:** initial (`implementation-started`). Branch `ticket/order-line-can-return`
  created from a clean `development` at `7fe35850` (only this ticket's untracked
  files were present).
- **Review follow-up SR-1 (required before implement):** the owner answered on
  2026-10-21: **"only added lines count"**. Contract rule 5 marks
  `can_return_product: false` only for a line that was actually added to the return
  request; the other lines of an open draft keep their own value. So FR-6 and the
  plan hold as written, and the work went ahead.

## Changes made

- `utils/types/OrderInterface.ts` — order line gets `return_days_limit?: number`
  and `can_return_product?: boolean`, each with its contract meaning. The
  `allow_return_in_days` comment now says it is the old field and the return row
  no longer reads it (OQ-7: the field stays).
- `tests/fixtures/order.ts` — `buildOrderLine` gets `return_days_limit: 1` and
  `can_return_product: false`, next to `allow_return_in_days: 1`.
- `components/setting/orders/OrderItemOptions.tsx`:
  - the window value is `Number(orderItem?.return_days_limit)`;
  - `hasReturnWindow` is true only for a whole number above 0;
  - the "Return This Product In … And Back Your Money" line renders only when
    `hasReturnWindow` is true;
  - the last check of `shouldShowRetutn` is
    `return orderItem?.can_return_product === true;` (it was
    `parentOrder.can_return_order`);
  - the two comments say the new rule.

  The already-in-request rule and the locked-request rule are unchanged.
- `tests/components/setting/orders/OrderItemOptions.test.tsx` — the cases in
  **Tests written** below.
- `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md`:
  - "How it works": the per-line rule, no fallback, products already in the
    request, `return_days_limit`, and that the backend must also check on create
    (finding S-3);
  - "Known gaps": the window line;
  - "Last verified": 2026-10-21 (against `development`).
- `docs/production-readiness/08-orders-and-returns.md`:
  - W-22 says `can_return_product: true`;
  - L-12 is marked fixed;
  - the open question about `allow_return_in_days` is answered by the contract.
- `docs/api-requirements/customer-orders-can-return-per-line.md` — not changed
  here (written before intake; listed so the PR carries it).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9). The single publishable commit is
> created later by `/publish-pr`.

- `components/setting/orders/OrderItemOptions.tsx` — the gate and the window line
- `utils/types/OrderInterface.ts` — two new optional line fields, one comment
- `tests/fixtures/order.ts` — two fixture defaults
- `tests/components/setting/orders/OrderItemOptions.test.tsx` — changed and new cases
- `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md` — new rule
- `docs/production-readiness/08-orders-and-returns.md` — W-22, L-12, open question
- `docs/api-requirements/customer-orders-can-return-per-line.md` — untracked, unchanged

## Deviations from plan

- **AC-5 cases set `can_return_order: true` and `allow_return_in_days` to the same
  bad value.** The first red run showed these cases failing only because the old
  gate hid the row, which does not prove the window part of AC-5. With the order
  flag `true`, the old code shows the row and the "0 Days" / "NaN Days" text, so
  the cases now go red on the window assertion itself. After the change the row
  still shows through `can_return_product: true`. Same file, same cases; only the
  inputs changed.
- **The CO-26 doc gets one extra sentence from finding S-3** ("the backend must
  also check on create"). It is inside the file the plan lists, and it states the
  contract §5 rule. No code change.
- None other.

## Tests written

All rows extend `tests/components/setting/orders/OrderItemOptions.test.tsx`. No
new file.

| AC | Test file | Test case | Disposition carried out |
|----|-----------|-----------|-------------------------|
| AC-1 | `tests/components/setting/orders/OrderItemOptions.test.tsx` | `a delivered, returnable line offers return with a 24-hour window, and report` — now order `can_return_order: false`, line `can_return_product: true`, `return_days_limit: 1`, `allow_return_in_days: 0` | extend (case changed) |
| AC-2 | same | `a line whose return days have ended offers no return, even when the order can still return` | extend (case added) |
| AC-3 | same | `a line without can_return_product offers no return — no fallback to can_return_order` | extend (case added) |
| AC-4 | same | `a longer return window reads in days, and a reported line says so` (now `return_days_limit: 30`, `allow_return_in_days: 7` → "30 Days", no "7 Days") and `the window reads return_days_limit, not allow_return_in_days` (`14` / `0` → "14 Days", no "0 Days") | extend (case changed + case added) |
| AC-5 | same | `a returnable line with no usable window (%s) offers return without the window sentence` — `it.each([0, null, undefined])` | extend (case added) |
| AC-6 | same | `a product already in the return is offered an update only while the return is editable (%s)` — line now `can_return_product: false`, order `can_return_order: true` | extend (case changed) |
| AC-7 | same | `a locked return request stops a new product being added` — line now `can_return_product: true` | extend (case changed) |
| AC-8 | same | `a delivered line with qty 0 offers no return` (line now `can_return_product: true`) and `an order that is not delivered offers no return, even for a returnable line` | extend (case changed + case added) |
| AC-9 | same | the three `starting a return` cases — the row now shows through the line's `can_return_product: true`; their assertions are unchanged | extend (cases changed) |
| AC-10 | — | none — docs-only criterion; checked at `/verify` by reading the two docs | none (as declared) |

### Red before, green after

`npx vitest run tests/components/setting/orders/OrderItemOptions.test.tsx`

- **Before the sheet change** (type, fixture and tests already changed):
  `11 failed | 18 passed (29)`. Red: AC-1, AC-2, AC-3, both AC-4 cases, the
  three AC-5 cases, and the three AC-9 cases. Each failed on its own assertion:
  - AC-2: "return was offered on a line the backend marks not returnable…";
  - AC-3: "…the app fell back to can_return_order";
  - AC-4: "30 Days" / "14 Days" not found;
  - AC-1 / AC-9: "Return This Product" not found.

  After the AC-5 input change, the AC-5 cases failed with "the window sentence
  was shown when return_days_limit is 0 / null / undefined".
- **Green before, as the plan expected:** AC-6, AC-7, AC-8 (rules kept as they
  are).
- **After the sheet change:** `29 passed (29)`.

## Findings — confirmed bugs, out of scope

none

## Not covered (from review)

- **SR-1's suggested case** ("editable request open, this line not yet in it,
  `can_return_product: true` → Return This Product shows") was **not written**.
  It is not declared in `plan.md > Tests` (IM-4), as the owner was told at review.
  The owner's answer (only added lines count) means the current gate already shows
  the row in that state. But no test proves it, so the case is **not covered**
  until a plan revision adds it.

## Validation run during implementation

Profile `logic-change` (`.claude/project-config.yaml`):

- `pnpm lint` — **exit 1**, 2 errors, 80 warnings. Both errors are in files this
  ticket does not touch and that are the same as on `development`:
  - `components/Chat/components/TaggedMessages.tsx:142` — i18n key "Search a
    tag" is missing from ar/tr/ku;
  - `components/Chat/components/messages/MessageTagPicker.tsx:88` — i18n key
    "New tag" is missing from ar/tr/ku.

  No lint error or warning names a file this ticket changed.
- `npx next typegen` then `node_modules/.bin/tsc --noEmit --pretty false` —
  **exit 0**.
- `pnpm test:run` — **exit 0**: `657 passed` files; `7701 passed | 2 expected
  fail (7703)` tests (the two are existing `it.fails` BUG markers).
