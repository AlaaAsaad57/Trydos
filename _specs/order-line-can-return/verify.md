---
ticket: order-line-can-return
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Verify — order-line-can-return

> Final validation and impact review before the ticket is closed.

## Checks performed

- Validation profile: `logic-change` (`.claude/project-config.yaml`): `lint`,
  `typecheck`, `unit-tests`, all at depth `all-ac`.
- Declared test file, run on its own:
  `npx vitest run tests/components/setting/orders/OrderItemOptions.test.tsx --reporter=verbose`
  → **exit 0**, `Tests 29 passed (29)`.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | `a delivered, returnable line offers return with a 24-hour window, and report` | `npx vitest run tests/components/setting/orders/OrderItemOptions.test.tsx` | 0 | ✓ (red before the change: "Return This Product" not found) | pass |
| AC-2 | `a line whose return days have ended offers no return, even when the order can still return` | same | 0 | ✓ (red before: "return was offered on a line the backend marks not returnable…") | pass |
| AC-3 | `a line without can_return_product offers no return — no fallback to can_return_order` | same | 0 | ✓ (red before: "…the app fell back to can_return_order") | pass |
| AC-4 | `a longer return window reads in days, and a reported line says so`; `the window reads return_days_limit, not allow_return_in_days` | same | 0 | ✓ ✓ (red before: "30 Days" / "14 Days" not found) | pass |
| AC-5 | `a returnable line with no usable window (0 / null / undefined) offers return without the window sentence` | same | 0 | ✓ ✓ ✓ (red before: "the window sentence was shown when return_days_limit is …") | pass |
| AC-6 | `a product already in the return is offered an update only while the return is editable (true / false)` | same | 0 | ✓ ✓ (green before and after — rule kept) | pass |
| AC-7 | `a locked return request stops a new product being added` | same | 0 | ✓ (green before and after — rule kept) | pass |
| AC-8 | `a delivered line with qty 0 offers no return`; `an order that is not delivered offers no return, even for a returnable line` | same | 0 | ✓ ✓ (green before and after — rules kept) | pass |
| AC-9 | `starting a return` — `creates the request, refreshes, and opens the return screen…`; `says the product cannot be returned…`; `jumps straight to the return screen…` | same | 0 | ✓ ✓ ✓ (red before: row not shown through the old gate) | pass |
| AC-10 | Read `docs/features/B-cart-checkout-orders/CO-26-create-return-request.md` and `docs/production-readiness/08-orders-and-returns.md` against FR-10 | `grep -n "can_return_product\|return_days_limit\|can_return_order"` on both | 0 | CO-26 lines 34, 40, 44, 99, 101 and 08 lines 37, 58, 85 name the new rule and field; the only `can_return_order` left (CO-26:37) says the app does **not** fall back to it | pass (plan: `none — docs-only`) |

### Profile checks

| Check | Command | Exit | Summary | Result |
|-------|---------|------|---------|--------|
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` (after `npx next typegen` at implement) | 0 | no errors | pass |
| lint | `pnpm lint` | **1** | `82 problems (2 errors, 80 warnings)`. Both errors are outside this ticket — see F-1. No error or warning names a file this ticket changed. | **fail — outside scope (F-1)** |
| unit-tests | `pnpm test:run` | **1** | `Test Files 1 failed \| 656 passed (657)`; `Tests 1 failed \| 7700 passed \| 2 expected fail (7703)`. The one failure is `tests/components/global/compare.test.tsx` — see F-2. | **fail — outside scope, flaky (F-2)** |

The implement-stage run of the same `pnpm test:run` exited **0**
(`657 passed`; `7701 passed | 2 expected fail`). The 2 expected fails are the
existing `it.fails` BUG markers in other files.

## Commands run

- `npx vitest run tests/components/setting/orders/OrderItemOptions.test.tsx --reporter=verbose`
  ```
  Tests  29 passed (29)      exit 0
  ```
- `node_modules/.bin/tsc --noEmit --pretty false`
  ```
  exit 0
  ```
- `pnpm lint`
  ```
  components/Chat/components/TaggedMessages.tsx 142:42 error  i18n key "Search a tag" is missing from: ar, tr, ku
  components/Chat/components/messages/MessageTagPicker.tsx 88:42 error  i18n key "New tag" is missing from: ar, tr, ku
  ✖ 82 problems (2 errors, 80 warnings)      exit 1
  ```
- `git diff --stat development -- components/Chat/components/TaggedMessages.tsx components/Chat/components/messages/MessageTagPicker.tsx public/translations eslint.config.mjs`
  ```
  (empty — identical to development); both files last changed in 1163efd1 (2026-10-06)
  ```
- `pnpm test:run`
  ```
  FAIL tests/components/global/compare.test.tsx > the compare page > loads both products named in the address and puts them side by side
  AssertionError: search box 1 must show the loaded product: expected '' to be 'Shirt'
  Test Files 1 failed | 656 passed (657)   Tests 1 failed | 7700 passed | 2 expected fail (7703)   exit 1
  ```
- `npx vitest run tests/components/global/compare.test.tsx` (three times)
  ```
  Tests 17 passed (17) · Tests 17 passed (17) · Tests 17 passed (17)
  ```
- `git diff --quiet development -- components/global tests/components/global`
  ```
  identical to development
  ```

## Integration surface — did it hold?

- `components/setting/orders/OrderDetailsWrapper.tsx`, `services/order.ts` and the
  protected paths (`proxy.ts`, `next.config.ts`) are unchanged (`git diff --quiet`).
- `git diff --name-only` lists exactly the six tracked files in `plan.md > Files to
  change`, plus the untracked contract doc that the plan also lists.
- The shared fixture `buildOrderLine` got two defaults. Every other test file that
  uses it passed in both full runs. The only failure (F-2) does not use the order
  fixture.
- `OrderDetailsWrapper.test.tsx` still mocks `OrderItemOptions` (line 70) and
  passed.
- **Release order (spec C-1, review SR-2 / S-1): still open.** The staging check of
  `getOrdersByOrderGroupID` has not been done. The PR must stay open (not merged
  into `development`) until it is, and its result is recorded in the PR or here.

## Findings — confirmed bugs, out of scope

No `BUG-n` in `implement.md`, and this run confirmed none in the ticket's files.
Two failures of profile checks lie **outside** `plan.md > Files to change`:

| ID | Scenario that is wrong | Confirming check | Where it lives | Expected vs actual | Ticket |
|----|------------------------|------------------|----------------|--------------------|--------|
| F-1 | Lint fails on two missing i18n keys | `pnpm lint` (`local/translate-key-exists`) | `components/Chat/components/TaggedMessages.tsx:142` ("Search a tag"), `components/Chat/components/messages/MessageTagPicker.tsx:88` ("New tag"); since `1163efd1` | expected: keys in ar/tr/ku · actual: missing; identical on `development` | _(to open)_ |
| F-2 | A compare-page test fails once in a full run | `tests/components/global/compare.test.tsx::the compare page > loads both products named in the address and puts them side by side` | the test or the compare page under full-suite load; identical on `development` | expected: `'Shirt'` · actual: `''` in the full run; 17/17 pass alone, 3 runs out of 3 | _(to open, if the owner wants the flake tracked)_ |

## Not covered

- SR-1's suggested case ("editable request open, this line not yet in it,
  `can_return_product: true` → Return This Product shows") has no test. It needs
  a plan revision (see `implement.md > Not covered`).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **no** (the
  repository owns none; `features.observability: false`).

## Sign-off

- Outcome: verified. Every declared test ran and passed (29/29, exit 0). The two
  failing profile checks fail only outside `plan.md > Files to change` (F-1, F-2),
  with evidence that both are the same on `development`.
- Final ticket state: completed
- Sign-off: developer (owner), 2026-10-21 — verify comprehension gate 3/3
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: do not merge the PR until the staging check (C-1) is done and recorded.
