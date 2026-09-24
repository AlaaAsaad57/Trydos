---
ticket: unit-tests-price-resolution
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Implement — unit-tests-price-resolution

> Record of what was actually built, following `plan.md`.

Branch: `ticket/unit-tests-price-resolution`, cut from `develop` — this
repository's base branch, which overrides IM-3's `main` (see `CLAUDE.md >
Project profile`).

## Changes made

- `components/products/ProductCard/flashPrice.ts` — **new.** `resolveCardPrice`:
  the flash-deal rule moved out of the card. It takes the deal end date, the deal
  price, the offer price and the plain price, plus **the moment** as an argument,
  and returns `{ flashPrice, timeLeft }`. It reproduces the old expression
  exactly, including the local-time end-of-day rule and the `??` fallbacks. The
  file opens with the FA-10 line: display only, never the source of a price sent
  to cart, checkout or an order.
- `components/products/ProductCard/index.tsx` — the inline block at lines 91 to
  121 is gone; the card calls `resolveCardPrice(...)` with an unmemoized
  `new Date()` in the render body (FA-9), so it still reads the clock once per
  card per render. The destructured `is_flashDeal` was removed with it — the
  removed block was its only reader, and it is the same field as `endDate`
  (`derivedProps.ts:36,38`), so the rule takes the end date only.
- `tests/components/products/ProductCard/index.test.tsx` — **new.** `AC-9`, three
  cases.
- `tests/components/products/ProductCard/flashPrice.test.ts` — **new.** `AC-1` to
  `AC-6`, thirteen cases.
- `docs/testing/UNIT_TEST_ROADMAP.md` — `AC-10` and FA-7: the phase 14 row now
  names `flashPrice.ts` and records why the two old names were wrong; the phase 14
  note names the four uncovered copies of the same logic and the timezone trap;
  the phase 25 row (`:372`) says `index.test.tsx` already exists and must be
  extended, not duplicated.

No other file was touched. No protected runtime path was touched.

## Changes prepared (uncommitted)

- `components/products/ProductCard/flashPrice.ts` (new)
- `components/products/ProductCard/index.tsx` (modified)
- `tests/components/products/ProductCard/flashPrice.test.ts` (new)
- `tests/components/products/ProductCard/index.test.tsx` (new)
- `docs/testing/UNIT_TEST_ROADMAP.md` (modified)

Untracked and **not part of this change**: `knip.json` (already on the working
tree before this stage) and `_specs/unit-tests-price-resolution/` (the workflow
artifacts).

## Deviations from plan

Three, all small and all inside files the plan lists:

1. **`is_flashDeal` was removed from the destructuring in `index.tsx`.** The plan
   said "nothing else in this file changes". The removed block was its only
   reader, so leaving it would have left a dead binding created by this change.
   It is the same field as `endDate`, so nothing else can want it.
2. **The card test asserts the border as `rgb(255, 98, 0)`, not `#FF6200`.** The
   first run failed on this. It was the **test** that was wrong, not the app —
   jsdom reports an inline colour as `rgb(...)`. The app writes the hex, and it is
   unchanged.
3. **FA-5 is met by the date form, not by pinning `TZ`.** Pinning the timezone
   needs `vitest.config.mts` or `tests/setup.ts`, and neither is in the approved
   plan (that was the IM-8 boundary the review named). Instead the boundary cases
   write the date in local form (`"2026-08-27T00:00:00"`), which every timezone
   parses as local midnight, and the card cases stay more than a day from any
   boundary. The clock is still pinned in the card test with `vi.setSystemTime`.
   The result is what FA-5 asked for — no case can flip on a different runner.

## Tests written

| AC   | Test file | Test case | Disposition carried out |
|------|-----------|-----------|-------------------------|
| AC-1 | `tests/components/products/ProductCard/flashPrice.test.ts` | shows the deal price while the deal is running | new |
| AC-2 | `tests/components/products/ProductCard/flashPrice.test.ts` | falls back to the offer price / to the plain price / treats zero as a real price (3 cases) | new |
| AC-3 | `tests/components/products/ProductCard/flashPrice.test.ts` | still running in the last moment of its last day; has ended once that day is over (2 cases) | new |
| AC-4 | `tests/components/products/ProductCard/flashPrice.test.ts` | uses the offer price and reports no deal; ignores a deal price with no deal date (2 cases) | new |
| AC-5 | `tests/components/products/ProductCard/flashPrice.test.ts` | reports the days, hours, minutes and seconds; hands back the four keys the banner seeds from; reports nothing once ended (3 cases) | new |
| AC-6 | `tests/components/products/ProductCard/flashPrice.test.ts` | the same moment gives the same answer; reads the moment it is handed, never the clock (2 cases) | new |
| AC-9 | `tests/components/products/ProductCard/index.test.tsx` | deal running → deal price, countdown and orange border; deal ended → ordinary price, no countdown, no border; no deal at all (3 cases) | new |
| AC-10 | — | none — a documentation row, proven by reading the corrected roadmap at `/verify` | new (declared as `none`) |
| AC-7 | `tests/utils/server/helpers.test.ts` | `showing a price (RoundPrice)` — confirmed present, 9 cases, still covering the drawing step the card uses | existing |
| AC-8 | `tests/utils/server/helpers.test.ts` | `shows nothing rather than "NaNM" when the price cannot be read` — confirmed present | existing |

**The order that makes `AC-9` mean anything.** `index.test.tsx` was written and
run **against the old code**, with the rule still inline, and was green — 3 of 3
— before `flashPrice.ts` existed. It was run again after the move and is still
green. Both runs are recorded under *Validation run* below.

## Follow-up actions from the review

| FA | Done |
|----|------|
| FA-1 | Caller list re-derived from the repository: **8** call sites — `ListingPage/ProductInfiniteScroll.tsx`, `Product/RelatedProductsInfiniteScroll.tsx`, `Server/FeatureProducts.tsx`, `Server/FlashDealsProducts.tsx`, `Server/product/RelatedProductsSection.tsx`, `Server/ProductList.tsx`, `Server/RecomendedProducts.tsx`, `ServerWrapper/BoutiquesListWrapper.tsx`. All eight render this same card through `deriveCardProps`. The border also leaves the card as a prop at `index.tsx:162`. |
| FA-2 | `RenderPrice` is **not** stubbed, and every live-deal case uses a deal price (60) different from the offer price (80), so a rule returning nothing would show 80 and the case would fail. |
| FA-3 | `FlashDealBanner` is stubbed and records its props; the case asserts the `initial` object the card passed, not rendered countdown text. |
| FA-4 | Handled inside the test file — stubbing the banner means no `IntersectionObserver` and no 1s interval are ever created. `tests/setup.ts` was not touched, so no IM-8 block was needed. |
| FA-5 | See deviation 3. The clock is pinned; the dates cannot flip on another timezone. |
| FA-6 | Rollback below corrected: reverting the move leaves `index.test.tsx` green; only `flashPrice.test.ts` loses its import. |
| FA-7 | Both roadmap rows updated, plus the phase 14 note naming the four uncovered copies. |
| FA-8 | Recorded as `BUG-1` below. Not fixed. |
| FA-9 | The call site uses an unmemoized `new Date()` in the render body. |
| FA-10 | First lines of `flashPrice.ts`. |

## Findings — confirmed bugs, out of scope

| BUG  | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Ticket |
|------|------------------------|---------------------------------------|---------------------|--------|
| BUG-1 | The colour sheet under a card shows a deal price with **no check that the deal is still running**. `ProductColorsCards` hands `InitialProductData.flash_deal_price` straight to `RenderPrice`, which uses `flash_price ?? offer_price ?? price`. So after a deal ends, the card shows the ordinary price and the colour sheet still shows the deal price — two different prices for the same product on the same screen. | none written — see the note below | `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx:150-155` | _(opened by the owner)_ |

**Why `BUG-1` carries no confirming test.** `ProductColorsCards.tsx` is not in
`plan.md > Files to change`, and neither is a test file for it. Writing one would
be scope creep under IM-4, and this repository's Vitest expected-failure marker
(`it.fails`) is used nowhere in the suite yet. The finding is recorded with the
exact lines so the follow-up ticket starts from a red test of its own — which is
where the four-step rule applies. **It was found by reading the code during the
review, not by a test.**

## Validation run during implementation

Profile: `full`.

- `pnpm exec vitest run tests/components/products/ProductCard/index.test.tsx`
  (**before** the move, rule still inline) — **1 failed, 2 passed**: the border
  assertion looked for the hex. Assertion corrected, re-run: **3 passed**. This is
  the `AC-9` baseline.
- `pnpm exec vitest run tests/components/products/ProductCard/index.test.tsx`
  (**after** the move) — **3 passed.** Behaviour preserved.
- `pnpm exec vitest run tests/components/products/ProductCard/` — **16 passed**
  (13 new for the rule, 3 for the card).
- `node_modules/.bin/tsc --noEmit --pretty false` — exit **0**.
- `pnpm lint` — **0 errors**, 62 warnings, all pre-existing and none in the files
  changed here.
- `pnpm test:run` — **1531 passed, 63 files, 0 failed.**
- `pnpm build` — **succeeded**, all routes generated.

## Rollback

- The move and its tests are separate concerns: reverting
  `components/products/ProductCard/index.tsx` and deleting `flashPrice.ts` puts
  the rule back inline. Only `flashPrice.test.ts` then has nothing to import and
  must go with it.
- `index.test.tsx` **stays** — it is written against the card, not against the
  new file, and it was green before the move existed. That is the whole point of
  it (FA-6).
- Nothing outside git to undo: no data, no schema, no config, no backend.
