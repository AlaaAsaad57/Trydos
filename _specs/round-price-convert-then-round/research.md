---
ticket: round-price-convert-then-round
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-24
links:
  clickup:
  github:
---

# Research — round-price-convert-then-round

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Find everything that the rounding order of `RoundPrice` touches, so that the
spec can say which prices change, which stay the same, and what must match the
backend's charge.

## What the code does today

Both copies do the same two steps, in this order:

1. `toFixedUp(points, num)` — round the **base** price **up** to `points`
   decimals (`Math.ceil(num × 10^points) / 10^points`).
2. `preciseMultiply(rounded, rate)` — multiply by the exchange rate, digit by
   digit, to avoid float drift.

Then `returnNumber: true` returns the number as it is. Otherwise the number is
shown in full below 100,000, as `K` from 100,000, and as `M` from 1,000,000.
The `K`/`M` part carries the comment "Dart's formatNumber logic".

Worked example from the session (checked with Node):
`69.9998 × 100 = 6999.98 → ceil → 7000 → 70.00`, then `70.00 × 100 = 7000`.
Shown: **7000**. With "convert first, then round up": **6999.98**.

A second effect of the same order: the result can carry **more** decimals than
the currency allows, because the multiply happens after the rounding. An
existing test pins one such case (see "Tests that pin the current order").

### The two copies are not the same

| | `utils/functions.tsx:170` (client) | `utils/server/helpers.ts:118` (server) |
|---|---|---|
| Float cleanup before `ceil` | yes: `Number(multiplied.toFixed(12))` (`functions.tsx:153-166`) | **no** (`helpers.ts:113-116`) |
| Rate when none is passed | `rate \|\| currency.exchange_rate \|\| 1` (store) | `rate ?? 1` (no store) |
| Decimal points when none are passed | `points \|\| currency.decimal_digits \|\| 0` (store) | `Number(points) \|\| 0` |
| Language when none is passed | store language, then `"en"` | `"en"` |

Effect of the missing float cleanup: `8.3 × 100 = 830.0000000000001` in
JavaScript, so the server copy rounds `8.3` up to **8.31**. The client copy
cleans that to 830 and shows **8.30**.

`toFixedUp` became "round up" in commit `7f24281d` (2025-12-10); it rounded down
before. The commit message gives no reason. The float cleanup was added to the
client copy only, in commit `720c3b2c` (2025-12-25). `preciseMultiply` also
exists in both files.

## Relevant directories

- `utils/functions.tsx` — client copy of `RoundPrice`, `toFixedUp`,
  `preciseMultiply`.
- `utils/server/helpers.ts` — server copy of the same three. Its header says it
  is "pure helpers shared by server and client code", free of the translation
  tables, and that client components import from it. `utils/server/index.tsx`
  re-exports it (`export * from "./helpers"`, line 10).
- `components/Cart/` — the cart and checkout: line prices, totals, coupon,
  payment method, place-order buttons.
- `components/setting/orders/`, `components/settings/cards/`,
  `components/Orders/` — order details, invoices, cancel and return windows.
- `components/products/`, `components/ServerWrapper/ProductWrapper/`,
  `components/Server/` — product cards, product page price, filters.
- `serverRequests/meta/StructuredData/` — prices in the page's structured data
  (search engines).
- `tests/utils/`, `tests/e2e/actions/cart.ts` — the tests that pin the result.

## Who calls which copy

Counted by resolving each file's `import { RoundPrice } from …`.

**Client copy (`utils/functions`) — 25 files:**

- Cart and checkout: `components/Cart/index.tsx` (2 calls),
  `Cart/AddToCart/Card.tsx` (8), `Cart/AddToCart/PricesRow.tsx` (8),
  `Cart/AddToCart/CartContentOfProduct.tsx` (1), `Cart/AddToCart/ExtraInfoArea.tsx`
  (1), `Cart/couponElement.tsx` (1), `Cart/OrderButton.tsx` (7, of which 6 use
  `returnNumber`), `Cart/OrdersPage.tsx` (1, `returnNumber`),
  `Cart/PaymentMethod.tsx` (1, `returnNumber`), `Cart/PlaceOrderButtons.tsx`
  (1, `returnNumber`), `Cart/PlaceOrderWidget.tsx` (4, `returnNumber`).
- Orders after checkout: `setting/orders/OrderDetailsWrapper.tsx` (6, 4
  `returnNumber`), `OrderInvoice.tsx`, `CancelOrderWrapper.tsx`,
  `CancelOrderItemWrapper.tsx`, `ReturnOrderItemWrapper.tsx` (2),
  `confirmations/OrderItemReturnConfirmationWindow.tsx` (2),
  `settings/cards/OrderInvoiceCard.tsx`, `Orders/ChangeOrderItem.tsx`.
- Product and listing: `Server/product/ProductPrices/ProductPricesWrapper.tsx`
  (3), `ServerWrapper/ProductWrapper/ProductButtonWrapper.tsx`,
  `products/ProductCartHeader.tsx`, `global/compare.tsx` (2),
  `ListingPage/filterComponents/FiltersWindow/index.tsx` (3).
- `serverRequests/meta/StructuredData/ProductStructuredData.tsx` (`returnNumber`).

**Server copy (`utils/server/helpers` or `utils/server`) — 6 files:**

- `components/products/ProductCard/index.tsx` — the listing card.
- `components/ServerWrapper/ProductWrapper/RenderPrice.tsx` — the product page
  price.
- `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx`.
- `components/Server/FilterList.tsx` (2), `components/ListingPage/FilterItem.tsx`
  (2) — price filter labels.
- `serverRequests/meta/StructuredData/ListingBreadcrumbList.tsx` (`returnNumber`,
  through `utils/server`).

So the **same product** is priced by the server copy on the listing card and the
product page, and by the client copy in the cart. Every caller that was read
passes `rate: currency?.exchange_rate` and `points: currency?.decimal_digits`
(e.g. `RenderPrice.tsx:15-17`, `ProductCard/index.tsx:405-407`,
`FilterList.tsx:636-647`, `Cart/index.tsx:546-556`).

## Relevant config files

- None. The rate and the decimal points are data, not configuration:
  `GET /mobile/home/currency` on the market backend
  (`utils/tinyUtils.tsx:110-140`, `getCurrency`), stored by `setCurrency`
  (`store/homepage/reducer.ts:95`), called from
  `components/Cart/CartProvider.tsx:80` and `services/order.ts:127`. The same
  endpoint serves the mobile app (its path says `/mobile/`).
- `settings.starting_setting.decimal_point_settings` exists
  (`components/Cart/PaymentMethod.tsx:429`) but `RoundPrice` never reads it.

## Where the charged amount comes from

- Checkout is `POST /customer/order/checkout[/<payment_method>]?order_note=…&address_id=…`
  with an **empty body** (`services/order.ts:72-82`). The web sends no price and
  no total. **The backend computes the charge itself**, from the cart it holds.
- The web's rounded figure is therefore display only. What the backend charges
  for 69.9998 at rate 100 cannot be read from this repository (OQ-1).
- The cart totals on screen come from the backend's cart answer (`total`,
  `total_cash`, `sub_total`, `total_discount`, `total_shipping_cost`). The web
  adds and subtracts those base-currency numbers and rounds **once**
  (`OrderButton.tsx:60-66`, `378-388`, `566`). It does not add up rounded
  lines.
- Each cart line is rounded on its own: `RoundPrice({ num: product.price ×
  product.quantity, … })` (`Cart/index.tsx:544-558`). So the lines and the total
  can differ by the rounding, today and after the change (OQ-7).

## Tests that pin the current order

Test layout (for `/plan`, PL-14):

- Unit suite, Vitest, project `unit`. A test mirrors its source path under
  `tests/`: `utils/functions.tsx` → `tests/utils/functions.test.ts`,
  `utils/server/helpers.ts` → `tests/utils/server/helpers.test.ts`. Both files
  already have a `RoundPrice` block — `describe("RoundPrice", …)` at
  `functions.test.ts:520` and `describe("showing a price (RoundPrice)", …)` at
  `helpers.test.ts:224`. A new case is an `extend`, not a new file.
- Expected-failure marker: Vitest `it.fails(...)` with a `BUG-…` id in the name
  (e.g. `tests/components/Chat/components/OptionsMenu.test.tsx:109`).
- Browser suite: Playwright under `tests/e2e/`, run against staging; it does not
  gate pull requests.

What changes under "convert first, then round up":

| Test | Input | Today | Under the new order |
|---|---|---|---|
| `helpers.test.ts:231` "multiplies without the usual decimal drift" | 0.1, rate 0.2, points 1 | `0.02` | `0.1` |
| `functions.test.ts:594` same name | 0.1, store rate 3, points 2 | `0.3` | `0.3` |
| `functions.test.ts:604` / `helpers.test.ts:238` "rounds up" | 10.001, points 2, rate 1 | `10.01` | `10.01` |
| `helpers.test.ts:225` "converts" | 10.5, rate 2, points 2 | `21` | `21` |
| every other case | rate 1 or none | unchanged | unchanged |

The `helpers.test.ts:231` expectation gives a 2-decimal result for a 1-decimal
currency. So it pins the very effect this ticket removes (OQ-4).

**The browser suite repeats the current order.** `expectedFigureFor` in
`tests/e2e/actions/cart.ts:1316-1330` rounds up first and multiplies after
(`roundUpTo` line 1298, `preciseMultiply` line 1306). `tests/e2e/shopper.live.spec.ts`
uses it at lines 1020, 1034, 1185 and 1192 to say what the bag should draw for
the shipping and the total. If the app changes and this helper does not, those
checks disagree with the app whenever the staging currency's rate is not 1 and
the amount has more decimals than the currency.

## Possibly affected services

- **Storefront display only.** Every price shown in a non-base currency: cart
  lines and totals, coupon, payment method amounts, order details and invoices,
  cancel and return windows, product cards, product page, price filters, compare.
- **Structured data** (`ProductStructuredData.tsx`,
  `ListingBreadcrumbList.tsx`) — the price search engines read.
- **Market backend (core and gateway)** — not changed, but it charges. If its
  rounding order differs from the new web order, the screen and the charge
  disagree (OQ-1).
- **Mobile app** — not in this repository. If it keeps the old order, the web
  and the app show different prices for one item (OQ-2).
- **Analytics:** `OrderButton.tsx:47-56` sends `getTotaPriceToShow()` (the raw
  backend total, not a `RoundPrice` result) — not affected.

## Test / validation commands available

- `pnpm test:run` — the unit suite (Vitest, project `unit`); gates pull requests.
- `pnpm exec vitest run tests/utils/functions.test.ts tests/utils/server/helpers.test.ts`
  — the two `RoundPrice` test files alone.
- `pnpm lint` — ESLint.
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — typecheck, as CI runs it.
- `pnpm test:e2e:live` — the browser suite against staging (checkout journeys in
  `tests/e2e/shopper.live.spec.ts`); does not gate pull requests.
- `pnpm e2e:health` — is staging serving, before a browser run.

## Risks and unknowns

- **Screen and charge disagree** — high impact if the backend rounds in the old
  order; unknown likelihood (OQ-1).
- **Web and mobile app disagree** — medium impact, unknown likelihood (OQ-2).
- **Wide display change** — every non-base-currency price may move by up to one
  unit of the last decimal, on about 31 files. With rate 1 nothing moves,
  because rounding before or after × 1 is the same. Medium impact, low risk.
- **Browser suite drift** — `expectedFigureFor` keeps the old order and the
  checkout checks go red on staging if it is not changed with the app. High
  likelihood if left out; it does not gate pull requests, so it would be seen
  late.
- **Two copies drift again** — they already differ in three ways. Fixing one
  and not the other leaves the listing card and the cart showing different
  prices for one product.
- **Lines vs total** — each line is rounded up on its own, the total once; they
  may not add up on screen. Exists today; not caused by this ticket (OQ-7).

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | When the backend charges an item of 69.9998 at rate 100 with 2 decimals, does it charge 6999.98 (convert, then round) or 7000 (round, then convert)? | The web sends no amount at checkout (`services/order.ts:72-82`), so the backend's number is the real charge. The screen must match it. Only the owner or the backend team can answer. |
| OQ-2 | Does the mobile app round before or after the rate? | The web copied the app ("Dart's formatNumber logic"). A web-only change makes the two clients show different prices for one item. |
| OQ-3 | Is the change for every caller of both copies, or for the cart only? | The owner named the cart and called the function critical. A cart-only rule makes the product page and the cart show two prices for one item. |
| OQ-4 | Must the result never carry more decimals than the currency allows? | `helpers.test.ts:231` expects `0.02` for a 1-decimal currency. Under the new order it becomes `0.1`. The spec must say which is right, and the test changes with it. |
| OQ-5 | Should the server copy's other differences (no store fallback for rate, points and language) be aligned too, or only the float cleanup and the order? | They are behaviour differences a shared implementation would remove. Changing them widens the ticket. |
| OQ-6 | Should the client copy call the server copy's helpers (one implementation), or should both be fixed in place? | `utils/server/helpers.ts` is already client-safe by its own header. One implementation stops the drift that caused the 8.31 bug. |
| OQ-7 | Should the cart lines and the total add up on screen? | Each line is rounded up alone and the total once. Out of this ticket unless the spec takes it in. |
| OQ-8 | Is `tests/e2e/actions/cart.ts > expectedFigureFor` in scope? | It encodes the old order. Leaving it makes the live checkout checks disagree with the app. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No backend was called. The currency values staging uses today (rate and
  decimals for `iq` and `sy`) were not read; they decide whether any live price
  moves at all.
