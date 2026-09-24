---
ticket: round-price-convert-then-round
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Implement — round-price-convert-then-round

> Record of what was actually built, following `plan.md`.

Branch: `ticket/round-price-convert-then-round`, cut from a clean `development`
at `d9bd7074` (equal to `origin/development` after a fetch). No commit, no push
(IM-9).

## Changes made

**The rule**

- `utils/server/helpers.ts` — `toFixedUp` clears float noise before rounding up
  (`Number((value × 10^d).toFixed(12))`), as the browser copy did. `RoundPrice`
  gains `charged?: boolean`: with it, multiply by the rate and then round up;
  without it, round up and then multiply (unchanged). Rate is read as
  `Number(rate) || 1`, decimals as `Number(points) || 0`, language as
  `language ?? "en"`. The `K`/`M`, zero and Arabic handling after the number is
  computed is unchanged.
- `utils/functions.tsx` — `RoundPrice` is now a wrapper: it fills a left-out
  rate, decimals and language from `useAppStore.getState()` **only when
  `typeof window !== "undefined"`**, then calls the shared `RoundPrice`
  (imported as `roundPriceRule` from `./server/helpers`), passing `charged`
  through. The local `preciseMultiply` and `toFixedUp` are deleted; nothing
  else used them. Exported name and signature unchanged.

**Charged screens — `charged: true` added to every live `RoundPrice` call (31)**

- `components/Cart/index.tsx` (2), `components/Cart/couponElement.tsx` (1),
  `components/Cart/OrderButton.tsx` (7), `components/Cart/OrdersPage.tsx` (1),
  `components/Cart/PaymentMethod.tsx` (1), `components/Cart/PlaceOrderButtons.tsx`
  (1), `components/Cart/PlaceOrderWidget.tsx` (4),
  `components/products/ProductCartHeader.tsx` (1),
  `components/setting/orders/OrderDetailsWrapper.tsx` (**4**),
  `components/setting/orders/OrderInvoice.tsx` (1),
  `components/setting/orders/CancelOrderWrapper.tsx` (1),
  `components/setting/orders/CancelOrderItemWrapper.tsx` (1),
  `components/setting/orders/ReturnOrderItemWrapper.tsx` (2),
  `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx`
  (2), `components/settings/cards/OrderInvoiceCard.tsx` (1),
  `components/Orders/ChangeOrderItem.tsx` (1).
- One line per call: `charged: true` is the first property of the argument
  object. Nothing else in these files changed.

**The browser suite's copy of the rule**

- `tests/e2e/actions/cart.ts` — `expectedFigureFor` is now
  `roundUpTo(decimalDigits, preciseMultiply(sent, exchangeRate))`; its three
  comments point at `utils/server/helpers.ts` and the charged rule. It stays a
  copy, on purpose.

## Changes prepared (uncommitted)

- The 18 source files and `tests/e2e/actions/cart.ts` above.
- `tests/utils/functions.test.ts`, `tests/utils/server/helpers.test.ts`,
  `tests/components/Cart/OrderButton.test.tsx`,
  `tests/components/products/ProductCard/index.test.tsx` (extended).
- `tests/harness/expectedBagFigure.test.ts` (new).

Every file is under `plan.md > Files to change`; no other file was touched.

## Deviations from plan

- **Call count: 31, not 33.** `OrderDetailsWrapper.tsx` has 4 live calls and 2
  commented-out ones (lines 1318, 1330). Panel finding S-2 and `review.md >
  Required Follow-up Actions` said so; only live calls got `charged: true`, and
  the AC-9 scan blanks comments before it looks.
- **AC-8(b) cases pass `points: 2`.** As first written, the server-copy case
  expected 0.1 with no decimals passed and got 1 — the 0-decimal fallback, not a
  store read. Passing the decimals leaves only the rate missing, which is what
  the case is about (saved rate 3 → 0.3; not read → 0.1). Same change in the
  browser-copy case. No other test changed its claim.
- **S-3 not done.** The panel suggested also asserting that every file calling
  `RoundPrice` is on one of the two lists. The approved plan does not declare
  that case (IM-4), so it was not written. Recorded here for a later ticket.

## Tests written

"Red before" was run on the old code and failed for the bug itself; "green
before" is a guard that passed on the old code, as planned.

| AC    | Test file | Test case | Disposition carried out |
|-------|-----------|-----------|-------------------------|
| AC-1  | `tests/utils/server/helpers.test.ts`; `tests/utils/functions.test.ts` | "charged: 69.9998 at rate 100 with 2 decimals is 6999.98, as text and as a number (AC-1)" — red before in both (7000) | extend |
| AC-2  | both files above | "charged: 0.1 at rate 0.2 with 1 decimal is 0.1, never more decimals than the currency (AC-2)" — red before in both (0.02) | extend |
| AC-3  | both files above | "charged: rounds up after the rate — 1.2345 at rate 3 is 3.71; 10.001 at rate 1 is 10.01 (AC-3)" — red before in both (3.72) | extend |
| AC-4  | both files above | "display rule is unchanged …" (server: 7000, 3.72; the 0.02 case is the existing "multiplies without the usual decimal drift"; browser: 7000, 3.72, 0.02) — green before (guard) | extend |
| AC-5  | both files above | "8.3 at rate 1 with 2 decimals stays 8.3 in both rules (AC-5)" — red before in the server copy (8.31), green in the browser copy | extend |
| AC-6  | `tests/utils/functions.test.ts` | "the browser copy and the server copy give the same figure, rule by rule (AC-6)" — red before (server 8.31 vs browser 8.3) | extend |
| AC-7  | both files above (existing display cases kept) | "with rate 1 the charged rule gives the same figures as the display rule (AC-7)" — green before (guard) | extend |
| AC-8  | `tests/utils/functions.test.ts` (existing "multiplies without the usual decimal drift" covers the browser side of (b)) | "(a) nothing passed and nothing saved: both copies give 26 and 100K" — green before; "(b) the server copy never reads the saved currency" — green before (guard); "(b) the browser copy on the server never reads the saved currency" — red before (0.3) | extend |
| AC-9  | `tests/utils/functions.test.ts`; `tests/components/Cart/OrderButton.test.tsx`; `tests/components/products/ProductCard/index.test.tsx` | "every RoundPrice call on a charged screen passes charged: true" — red before (`components/Cart/index.tsx:545`); "no RoundPrice call on a display screen passes charged" — green before (guard); OrderButton "at rate 100 shows 6999.98 for 69.9998, the amount the backend charges" — red before (7000); ProductCard "at rate 100 shows 7000 for 69.9998, the display figure" — green before (guard) | extend |
| AC-10 | `tests/harness/expectedBagFigure.test.ts` | "follows the charged rule: 69.9998 at rate 100 with 2 decimals is 6999.98"; "never gives more decimals than the currency: 0.1 at rate 0.2 with 1 decimal is 0.1"; "rounds up after the rate: 1.2345 at rate 3 with 2 decimals is 3.71" — all red before (7000, 0.02, 3.72) | new |

## Findings — confirmed bugs, out of scope

none

## Validation run during implementation

- Red run, before any source change: every "red before" case above failed with
  the bug's own figure (7000 / 0.02 / 3.72 / 8.31 / 0.3 / missing `charged`).
- `vitest run` on the five declared test files, after the change — 5 files,
  233 tests passed.
- `node_modules/.bin/tsc --noEmit --pretty false` — exit 0.
- `eslint` on every changed file — no errors.
- `pnpm test:run` (full unit suite) — 637 files; 7097 passed, 4 expected
  fail, **1 failed**: `tests/components/global/compare.test.tsx > the compare
  page > loads both products named in the address and puts them side by side`
  ("search box 1 must show the loaded product: expected '' to be 'Shirt'").
- That failure is **pre-existing and flaky, not caused by this change**:
  - with this change, run alone 3 times — failed 1 of 3;
  - with this change stashed (the untouched `development` code), run alone 6
    times — failed 1 of 6.
  `components/global/compare.tsx` is a display file and was not edited. Not in
  `plan.md > Files to change`, so not fixed here; worth its own ticket.
