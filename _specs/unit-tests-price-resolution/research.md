---
ticket: unit-tests-price-resolution
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-08-26
links:
  clickup:
  github:
---

# Research — unit-tests-price-resolution

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Pin, with unit tests, which price the shopper is shown on a product card.

**The headline finding: the two files the roadmap names do not hold that rule.**
The rule lives in three other places, one of which is already tested. The owner
re-scoped the work item on 2026-08-26 — every `OQ-n` below carries its answer, and
`intake.md > Scope, as decided` is the settled list.

## Relevant directories

- `components/products/ProductCard/` — the card. `index.tsx` (456 lines) is where
  the **flash-deal** price wins or loses. `derivedProps.ts` (47 lines) only maps
  fields onto props.
- `services/elastic/` — `helpers.ts` holds the **per-country** price rule.
- `components/Cart/AddToCart/` — `AddToCartComponent.tsx` (1031 lines) holds the
  **variant to price** rule for the product page.
- `utils/` — `functions.tsx` and `server/helpers.ts` each hold a `RoundPrice`, the
  last step before a price is drawn.
- `tests/` — the unit suite. It mirrors the source path: the test for
  `utils/server/tokenManager.ts` is `tests/utils/server/tokenManager.test.ts`.

## Relevant config files

- `vitest.config.mts` — the `unit` project, the path aliases, and the fake env
  values a component test renders against.
- `tests/render.tsx` — the shared render helper (roadmap phase 3). Not needed by
  the settled scope: both new test files are pure and render nothing.
- `docs/testing/UNIT_TEST_ROADMAP.md` — phase 14, the source of this ticket, and
  phases 19 and 22, which own the neighbouring code. Its phase 14 row is wrong and
  this work item corrects it.

## Possibly affected services

None. This work item reads product data that is already in memory. It calls no
backend, so the gateway and the core backend are both untouched.

## What the code actually does

**1. `derivedProps.ts` decides nothing.** `deriveCardProps` copies `offer_price`,
`price`, `flash_deal_price`, `luck_price` and `flash_deal_end_date` straight onto
props (lines 33 to 40). There is no precedence in it. A test here could only
assert that a field was copied, which asserts that object spread works. It has one
caller, `ProductCard/index.tsx:45`, so it is not dead code — but it is not the
rule this ticket is about.

**2. `store/Details/reducer.ts` is the listing filter store.** Its `prices` fields
are the filter band: `min_price`, `max_price`, `pricesWord`, `pricesSelected`
(lines 22 to 25, and 345 to 360). There is no variant selection in it, and no
displayed price. The roadmap's description of this file is wrong.

**3. The flash-deal rule is in the card component**, `ProductCard/index.tsx:92`
and `:120`:

- line 92 — `flash_price = offer_price ?? price`
- lines 93 to 118 — the deal end date is pushed to `23:59:59.999` of that day, and
  `isFlash` becomes the time left as `{days, hours, minutes, seconds}`, or `null`
  when the deal has ended
- line 120 — when the deal is live, `flash_price = flash_deal_price ?? offer_price ?? price`

`isFlash` is not only a flag: it is passed to the countdown at line 402 as
`initial`, and it decides the orange border at line 124. **A lift that returns the
price alone would change what the card draws**, so the helper has to return the
countdown too.

Nothing tests this, and it reads the clock twice, so a test must pin the clock.

**4. The per-country rule is in `services/elastic/helpers.ts`** —
`resolveOfferPriceForCountry` (line 678) and `resolveUnitPriceForCountry` (line
635). The order is: the nested `country_offer_prices` entry for that country, then
`extra_price_for_country`, then the base price. **This is already tested** —
`tests/services/elastic/helpers.test.ts:164` and `:294`, about 20 cases between
them.

**5. The variant to price rule is in `AddToCartComponent.tsx`** —
`findVariantForSelection` and `GetFinalPriceOfProduct` (lines 466 to 508, and 647
to 693). A chosen colour and size pick a variant, and the variant's `offer_price`
and `luck_price` replace the product's. That file is roadmap **phase 19**, not 14.

**6. `RoundPrice` exists twice, and the copies have drifted.**
`utils/functions.tsx:170` reads the store for the exchange rate and the decimal
digits, and guards a non-finite price so a shopper never sees `NaNM`.
`utils/server/helpers.ts` takes `rate ?? 1` and has no such guard. **Only the
server copy is tested** (`tests/utils/server/helpers.test.ts:224`). The card draws
its price through the client copy.

## Test / validation commands available

- `pnpm test:run` — the unit suite (Vitest, `unit` project). Gates every PR.
- `pnpm test:coverage` — the same, with coverage.
- `pnpm lint` — ESLint, including the i18n key checks.
- `pnpm lint:i18n-parity` — `ar` / `tr` / `ku` key parity.
- `pnpm test:e2e` — the browser suite. It never gates a PR, and it is out of scope
  here.

Test layout and convention: tests live under `tests/`, mirroring the source path;
a file is `<name>.test.ts` or `<name>.test.tsx`; the runner is Vitest; a component
test renders through `tests/render.tsx`. No test in the suite uses an
expected-failure marker today — Vitest's is `test.fails`, which is what a `BUG-n`
guard would use.

## Answers

Decided by the owner on 2026-08-26. `spec.md` carries these forward as `AC-n`.

| ID | Answer |
|----|--------|
| OQ-1 | **Out.** `derivedProps.ts` holds no rule, so no test is written for it. |
| OQ-2 | **Out of the test scope, in as a doc fix.** `store/Details/reducer.ts` is dropped, and the phase 14 row in `docs/testing/UNIT_TEST_ROADMAP.md` is corrected in this work item to name the files that really hold the rule. |
| OQ-3 | **Lift, then test the helper.** Move the block at `index.tsx:92` to `:120` into a new pure helper under `components/products/ProductCard/`, and test the helper directly. The helper returns the price **and** the countdown, because `isFlash` feeds the countdown at line 402 and the border at line 124. The lift must not change what the card draws. |
| OQ-4 | **Existing.** The per-country rule is covered by `tests/services/elastic/helpers.test.ts:164` and `:294`. `plan.md > Tests` records it as `existing`, and no second file is written. |
| OQ-5 | **Stays with phase 19.** The variant to price rule in `AddToCartComponent.tsx` is not touched here. |
| OQ-6 | **In scope.** The client `RoundPrice` (`utils/functions.tsx:170`) gets its own test file: the exchange rate and decimal digits read from the store, and the non-finite guard. |

## Risks and unknowns

- **This work item now changes application code.** OQ-3's answer makes the lift
  part of the deliverable, so it is no longer test-only. The card renders on every
  listing, the home page and the related-products row, so a mistake in the lift is
  visible everywhere. Two things keep it small: the lift must be
  behaviour-preserving, and it must be its own commit so it reverts alone.
- **The countdown is the trap in the lift.** `isFlash` carries the remaining time,
  not a boolean. Returning `true` or the price alone would silently stop the
  countdown and the orange border. The new test has to assert the countdown as
  well as the price.
- **Time dependence.** The flash-deal branch reads the clock twice. The test pins
  the clock; the helper takes the current time as an argument rather than reading
  it, so the behaviour is provable without a fake timer in the card.
- **`RoundPrice` reads the store.** The client copy calls `useAppStore.getState()`
  for the currency and the language, so its test seeds the store rather than
  passing everything in. Never assert on a rounded string built from a real
  currency the app fetched — seed it.
- **The known listing sort defect stays out.** The list sorts on the root
  `offered_price` while the card shows the country or flash price —
  `helpers.ts:128` says the override is deliberately kept out of the sort key. That
  is a recorded finding with no frontend fix, and this work item must not try to
  fix it.
- **Closed:** the scope risk this stage opened. The work item pointed at a field
  copier and at the wrong store. It now points at the flash-deal rule, the client
  rounding step, and one doc row.

## Open questions

> All six are answered above. No question is left open, and none was dropped.

| ID   | Question | Why it matters | Answered |
|------|----------|----------------|----------|
| OQ-1 | Does `derivedProps.ts` stay in scope at all, given it holds no rule? | Deciding it stops a file of tests that assert field copying. | yes — out |
| OQ-2 | `store/Details/reducer.ts` is the listing filter store, not variant pricing. Is it dropped from scope, and is the roadmap row corrected? | The roadmap is the source of later tickets too, so a wrong row misleads all of them. | yes — dropped, row corrected here |
| OQ-3 | Is the card's flash-deal precedence (`index.tsx:92` to `:120`) in scope — as a component test, or by lifting the block into a pure helper first? | Lifting it is an application change and must be declared in `plan.md > Files to change` before `implement`. | yes — lift, then test the helper |
| OQ-4 | Is the per-country rule recorded as `existing`, covered by `tests/services/elastic/helpers.test.ts`? | `PL-14` forbids a second parallel test file for a unit that already has one. | yes — existing |
| OQ-5 | Does the variant to price rule stay with phase 19 (`AddToCartComponent.tsx`)? | Keeps one rule in one suite, and keeps this work item small. | yes — phase 19 |
| OQ-6 | Is the untested client `RoundPrice` (`utils/functions.tsx:170`, including the non-finite guard) in scope, or its own ticket? | It is the last step before a price is drawn, it has drifted from the tested copy, and nothing guards it. | yes — in scope |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No protected runtime path was touched: `proxy.ts`, `next.config.ts`,
  `instrumentation*`, `sentry.*` and `.github/workflows/**` are all unchanged.
  `ProductCard/index.tsx` is not a protected path, so the lift is allowed at
  `implement` once `plan.md` names it.
