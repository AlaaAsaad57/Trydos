---
ticket: round-price-convert-then-round
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Plan — round-price-convert-then-round

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

**One implementation, one switch.** The server copy of `RoundPrice` in
`utils/server/helpers.ts` becomes the only place the arithmetic lives. It gains
the float cleanup the client copy has, and a new optional argument
`charged: true` that selects the charged rule (multiply, then round up). Without
it, the display rule runs exactly as today (round up, then multiply). The client
copy in `utils/functions.tsx` stops doing arithmetic: it fills a left-out rate,
decimal points and language from the shopper's saved currency — **only in the
browser** — and hands everything to the shared function. Each call site on a
charged screen adds `charged: true`; display call sites do not change.

**Why this over the alternatives:**

- *Two copies fixed in place* — rejected. They already drifted three ways
  (research), and FR-6 asks for identical behaviour; one implementation is the
  only way that cannot drift again.
- *A second exported function* (`RoundChargedPrice`) — rejected. It doubles the
  public surface and makes the client wrapper do the same fallback work twice.
  One optional argument keeps one function and one fallback path.
- *Making the charged rule the default* — rejected. It would flip every display
  screen too (FR-3), and a missed display call site would silently change price.
  With the flag, a missed **charged** site keeps today's figure, and the call-site
  test (AC-9) names it.
- *The shared function lives in `utils/server/helpers.ts`, not `utils/functions.tsx`*
  — that file is already the client-safe pure module (its header, and the
  project's rule that client code imports `utils/server/helpers`, never
  `utils/server`). The reverse direction would drag `utils/functions.tsx` and its
  store import into server code.

**The browser guard.** On the server the app store is one object for every
request of the process (spec, Constraints). So the client copy reads
`useAppStore.getState()` only when `typeof window !== "undefined"`. On the
server a left-out value falls back to rate 1, 0 decimals and English — the same
as the shared function does on its own.

**OQ-9 mapping** (owner, 2026-09-24): the cart header on the product page is
charged; the add-to-cart panel is display. Research placed the other screens;
two of them are named here so the review can check the grouping:
`components/Cart/OrdersPage.tsx` draws the checkout button's label — item count
and bag total — on the address step (rendered from
`components/settings/PersonalInfoAddress.tsx`; charged), and
`components/Orders/ChangeOrderItem.tsx` shows the "New Price" of an item changed
on an existing order (an orders screen, charged).

## Steps

1. **Red first.** Write every test in the **Tests** table. Run them; each row
   marked "red before" must fail for the bug itself (7000 instead of 6999.98,
   8.31 instead of 8.3, a charged call site without `charged: true`, the old
   order in the browser-suite helper, the store read on the server).
2. `utils/server/helpers.ts`: give `toFixedUp` the float cleanup
   (`Number((value × 10^d).toFixed(12))` before `Math.ceil`), exactly as the client
   copy does. Add `charged?: boolean` to `RoundPrice`; when set, multiply first and
   round up after; otherwise keep today's order. Read the rate and the decimal
   points as `Number(rate) || 1` and `Number(points) || 0`, and the language as
   `language ?? "en"` — the fallbacks the client copy uses when nothing is saved.
   Everything after the number is computed (`returnNumber`, `K`, `M`, `0`, Arabic
   forms) is unchanged.
3. `utils/functions.tsx`: replace the body of `RoundPrice` with the browser
   guard, the saved-currency fallbacks (`rate || currency.exchange_rate`,
   `points || currency.decimal_digits`, `language ?? state.language`), and a call
   to the shared `RoundPrice`, passing `charged` through. Delete the local
   `toFixedUp` and `preciseMultiply`; nothing else in the file uses them. The
   exported name and signature stay, so no import changes anywhere.
4. Add `charged: true` to every `RoundPrice` call on a charged screen — the 16
   files listed under **Files to change** (33 calls). Touch nothing else in them.
5. `tests/e2e/actions/cart.ts`: `expectedFigureFor` becomes
   `roundUpTo(decimalDigits, preciseMultiply(sent, exchangeRate))`. Its comments
   name the new source of the rule. It stays a copy, on purpose (its own comment:
   importing the app's helper would make both sides move together).
6. Run the Tests rows green, then the `full` profile.

## Files to change

**The rule**

- `utils/server/helpers.ts` — float cleanup in `toFixedUp`; `charged` argument;
  rate/points/language fallbacks aligned with the client copy.
- `utils/functions.tsx` — `RoundPrice` becomes the browser-guarded fallback
  wrapper around the shared function; local `toFixedUp` and `preciseMultiply`
  removed.

**Charged screens — add `charged: true` to each `RoundPrice` call (FR-1)**

- `components/Cart/index.tsx` — bag lines (2 calls).
- `components/Cart/couponElement.tsx` — coupon (1).
- `components/Cart/OrderButton.tsx` — bag totals, shipping, discount (7).
- `components/Cart/OrdersPage.tsx` — checkout button label: items and bag total (1).
- `components/Cart/PaymentMethod.tsx` — cash-on-delivery cost (1).
- `components/Cart/PlaceOrderButtons.tsx` — place-order amount (1).
- `components/Cart/PlaceOrderWidget.tsx` — place-order amounts (4).
- `components/products/ProductCartHeader.tsx` — cart header on the product page (1).
- `components/setting/orders/OrderDetailsWrapper.tsx` — order details (6).
- `components/setting/orders/OrderInvoice.tsx` — invoice (1).
- `components/setting/orders/CancelOrderWrapper.tsx` — cancel order (1).
- `components/setting/orders/CancelOrderItemWrapper.tsx` — cancel item (1).
- `components/setting/orders/ReturnOrderItemWrapper.tsx` — return item (2).
- `components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx` — return confirmation (2).
- `components/settings/cards/OrderInvoiceCard.tsx` — invoice card (1).
- `components/Orders/ChangeOrderItem.tsx` — "New Price" of an item changed on an order (1).

**The browser suite's copy of the rule (FR-8)**

- `tests/e2e/actions/cart.ts` — `expectedFigureFor` in the new order; comments.

**Tests**

- `tests/utils/server/helpers.test.ts` — extend.
- `tests/utils/functions.test.ts` — extend.
- `tests/components/Cart/OrderButton.test.tsx` — extend.
- `tests/components/products/ProductCard/index.test.tsx` — extend.
- `tests/harness/expectedBagFigure.test.ts` — new.

**Not changed (display rule, FR-3):** `components/Cart/AddToCart/{Card,PricesRow,CartContentOfProduct,ExtraInfoArea}.tsx`
(the add-to-cart panel), `components/Server/product/ProductPrices/ProductPricesWrapper.tsx`,
`components/ServerWrapper/ProductWrapper/{ProductButtonWrapper,RenderPrice,ProductColorsCards}.tsx`,
`components/products/ProductCard/index.tsx`, `components/global/compare.tsx`,
`components/ListingPage/filterComponents/FiltersWindow/index.tsx`,
`components/ListingPage/FilterItem.tsx`, `components/Server/FilterList.tsx`,
`serverRequests/meta/StructuredData/{ProductStructuredData,ListingBreadcrumbList}.tsx`.
The call-site test (AC-9) lists them as display files, so one that gains
`charged: true` by mistake goes red.

## Integration surface

- **Components / shared config touched:** the shared price function used by 31
  files (research, "Who calls which copy"); the server/client module boundary
  (`utils/functions.tsx` now imports `utils/server/helpers.ts`); the browser
  suite's checkout oracle `expectedFigureFor`, used by
  `tests/e2e/shopper.live.spec.ts` at lines 1020, 1034, 1185 and 1192 through
  `matchesSentAmount`. No env var, config file, endpoint or protected runtime
  path is touched.
- **Who else depends on them:** every price on the storefront; search engines
  (structured data — display rule, unchanged); the live checkout journeys, which
  run on staging at **rate 100** (`cart.ts:1243-1247`), so they exercise exactly
  this case; the mobile app, which will copy the rules (spec, OQ-2).
- **Overlapping flows:** the listing card and the product page use the server
  copy; the bag and the orders use the client copy. After this change both go
  through one function, so a display figure and a charged figure for one item
  differ only by the rule, never by the copy. The add-to-cart panel and the cart
  header both sit on the product page but use different rules (owner, OQ-9).
- **Ordering / lockstep dependencies:** the app change and the `expectedFigureFor`
  change must land in the **same commit**. With only the app changed, the live
  checkout expects 7000 and reads 6999.98, and goes red on staging. With only the
  helper changed, the opposite. The two files are also the only ones where the
  rule is written twice on purpose.
- **What breaks if this is wrong:**
  - A charged call site left without `charged: true` keeps showing the old,
    higher figure. The call-site cases in `tests/utils/functions.test.ts` name
    the file and line.
  - The client copy importing `utils/server/helpers.ts` pulls a server-only
    module into the browser bundle — the `full` profile's `build` check catches
    that; `helpers.ts` imports nothing today.
  - **Two intended changes on display screens**, which the review should see:
    (1) the float cleanup reaches the server copy, so a price like 8.3 on the
    listing card and the product page shows **8.3**, where it showed **8.31**
    (FR-5); (2) a rate of `0` on a server-drawn price now falls back to 1, where
    it made the price `0` (FR-6, same as the client copy). Neither is visible
    with real data unless a price carries float noise or a rate is 0.

## Tests

Layout (research): unit tests mirror the source path under `tests/`; e2e harness
code is unit-tested under `tests/harness/` (e.g. `stagingProbeCoverage.test.ts`
imports `../e2e/harness/health`). Loading `tests/e2e/actions/cart.ts` outside
Playwright was checked in this stage: it loads, and `expectedFigureFor(69.9998,
{ decimalDigits: 2, exchangeRate: 100 })` returns **7000** today.

"Red before" = the case must fail on the current code, for the bug itself.

| AC    | Existing coverage found | Disposition | Test file | Test case / name |
|-------|-------------------------|-------------|-----------|------------------|
| AC-1  | none — searched `tests/utils/**` for `RoundPrice` and `69.9998`; no charged rule exists | extend | `tests/utils/server/helpers.test.ts`, `tests/utils/functions.test.ts` | "charged: 69.9998 at rate 100 with 2 decimals is 6999.98, as text and as a number" — red before (7000) |
| AC-2  | none for the charged rule | extend | both files above | "charged: 0.1 at rate 0.2 with 1 decimal is 0.1, never more decimals than the currency" — red before (0.02) |
| AC-3  | `helpers.test.ts` "always rounds a fraction of a penny up" (10.001 → 10.01, rate 1) — display rule only | extend | both files above | "charged: rounds up after the rate — 1.2345 at rate 3 is 3.71; 10.001 at rate 1 is 10.01" — red before (3.72) |
| AC-4  | `helpers.test.ts::multiplies without the usual decimal drift` (0.1 @ 0.2 → 0.02, server copy) | extend | both files above | "display rule is unchanged: 7000, 3.72, 0.02" — the server copy's 0.02 case stays as it is; the others are added — green before (a guard) |
| AC-5  | none — no noisy-value case in either file | extend | both files above | "8.3 at rate 1 with 2 decimals stays 8.3 in both rules" — red before in the server copy (8.31) |
| AC-6  | none — no test runs both copies side by side | extend | `tests/utils/functions.test.ts` | "the browser copy and the server copy give the same figure, rule by rule" (inputs of AC-1 to AC-5 and 150000 → 150K) — red before (8.3 vs 8.31) |
| AC-7  | display rule, rate 1: `functions.test.ts` "RoundPrice" block (0, 99999, 100K, 1000K, 1M, 2.5M, Arabic, NaN, 1234.5 → 1235) and `helpers.test.ts` (0, 150K, 1M, Arabic, 25.4 → 26) — existing | extend | both files above | "with rate 1 the charged rule gives the same figures as the display rule" (the same inputs with `charged: true`) — green before only if `charged` is ignored; the display cases stay as existing |
| AC-8  | (b) browser side: `functions.test.ts::multiplies without the usual decimal drift` (saved rate 3 → 0.3) — existing | extend | both files above | "(a) nothing passed and nothing saved: both copies give 26 and 100K"; "(b) the server copy never reads the saved currency" (store seeded with rate 3, server copy of 0.1 → 0.1); "(b) the browser copy on the server never reads the saved currency" (`window` undefined, store seeded → 0.1) — the last is red before |
| AC-9  | none — no test checks which rule a screen uses (searched `tests/utils/`, `tests/components/Cart/`, `tests/components/products/`) | extend | `tests/utils/functions.test.ts`; `tests/components/Cart/OrderButton.test.tsx`; `tests/components/products/ProductCard/index.test.tsx` | functions.test.ts, in its `RoundPrice` block: "every RoundPrice call on a charged screen passes charged: true" (the 16 files) and "no RoundPrice call on a display screen does" (the display files), each failure naming file and line — red before; OrderButton: "the bag total at rate 100 shows 6999.98 for 69.9998" — red before; ProductCard: "the card at rate 100 shows 7000 for 69.9998" — green before (a guard) |
| AC-10 | none — `expectedFigureFor` has no unit test (searched `tests/harness/`, `tests/**/*.test.ts`) | new | `tests/harness/expectedBagFigure.test.ts` | "the browser suite's expected bag figure follows the charged rule" (69.9998 @ 100 → 6999.98; 0.1 @ 0.2 / 1 → 0.1; 1.2345 @ 3 → 3.71) — red before (7000) |

Every file in this table is listed under **Files to change**.

## Validation strategy

- Validation profile: `full`.
- Profile source: `pre-existing` (`.claude/project-config.yaml`, not edited).
- Why `full`: the client copy starts importing across the `utils/server`
  boundary, and only `build` catches a server-only import that reaches the
  browser bundle. `full` runs `lint`, `typecheck`, `unit-tests` (`pnpm test:run`,
  which is `vitest run`, non-writing) and `build`.
- The Tests table runs inside `unit-tests`. `/verify` records the exit code per
  `AC-n`.
- The browser suite does not gate this ticket. After merge, the next live run on
  `development` exercises `expectedFigureFor` against staging at rate 100; a red
  checkout figure there points to a charged screen or the helper.

## Rollback

- One commit holds the rule, the call sites, the browser-suite helper and the
  tests. `git revert <commit>` restores today's figures everywhere.
- No data, config, endpoint or backend changes, so nothing else needs undoing.

## Out of scope

- Everything the spec lists under Out of Scope: backend, mobile app, rounding
  direction, display figures (except the two intended server-copy changes named
  under Integration surface), bag lines vs total (OQ-7), `decimal_point_settings`,
  number formatting.
- Renaming `RoundPrice`, or moving call sites between the two import paths.
- The `preciseMultiply` weakness with numbers JavaScript prints in exponent form
  (e.g. `1e-7`) — it exists in both copies today and is not reported.
