---
ticket: unit-tests-price-resolution
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Plan — unit-tests-price-resolution

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Move the flash-deal choice out of the card into a small pure function, then check
that function directly. The block at `components/products/ProductCard/index.tsx:91`
to `:121` decides two things a shopper sees — the price, and the time left on the
deal — and it cannot be reached by a test while it sits inside the component.

The move must not change what the card draws, so it is proved rather than assumed:
a **characterization test on the card is written and seen green against today's
code first**, then the move happens, then the same test runs again. A test written
after the move could only say that the new code agrees with itself.

Alternatives rejected: a component test alone (it cannot state the rule case by
case, and every case pays the cost of rendering the whole card), and leaving the
block where it is (nothing could check it).

`AC-7` and `AC-8` were withdrawn from the spec on 2026-08-26 — the card draws its
price with the copy of the rounding step that already has a test file, so there is
nothing to add. See `spec.md`, `OQ-6`.

## Steps

1. Write the card characterization test (`AC-9`) against the **current** code and
   run it. It must be green before anything moves; if it is not, the test is
   wrong and the move does not start.
2. Add the new pure function. It takes the product's price fields, the deal end
   date, and **the current moment as an argument**, and returns the price and the
   time left. It reproduces today's expression exactly, including the end-of-day
   rule and the `??` fallbacks.
3. Point the card at the function and delete the inline block. No other change in
   that file.
4. Run the characterization test again. Green means the move kept the behaviour;
   red means the move is wrong, not the test.
5. Write the function's own test file (`AC-1` to `AC-6`), one case per rule, each
   with a fixed moment passed in.
6. Correct the roadmap row for this phase (`AC-10`).
7. Run the validation profile below.

## Files to change

- `components/products/ProductCard/flashPrice.ts` — **new.** The moved rule:
  price and time left, from the product and a given moment. Pure, no clock, no
  store, no import from the card.
- `components/products/ProductCard/index.tsx` — call the new function instead of
  holding the rule inline; remove lines 91 to 121. Nothing else in this file
  changes — the countdown at line 402, the border rule at line 124 and the price
  row at line 428 keep reading the same two values.
- `tests/components/products/ProductCard/flashPrice.test.ts` — **new.** `AC-1`
  to `AC-6`.
- `tests/components/products/ProductCard/index.test.tsx` — **new.** `AC-9`, the
  characterization test. Heavy child components are stubbed; the case asserts the
  price text and whether the countdown is on screen.
- `docs/testing/UNIT_TEST_ROADMAP.md` — `AC-10`. Rewrite the phase 14 row (line
  322) to name the rule that really decides the displayed price, and record that
  the per-country part is already covered by the search-helpers test file.

## Integration surface

- **Components / shared config touched:** `components/products/ProductCard/index.tsx`
  only, plus one new file beside it. No config, no env var, no shared style, no
  protected runtime path.
- **Who else depends on them:** every listing surface renders this card —
  `GetProducts`, `GetRelatedProducts` and `ProductListServer` (named in
  `derivedProps.ts`), so the home page, category and search listings, the boutique
  page and the related-products row. Three children read the two values the moved
  rule produces: `FlashDealBanner` takes the time left as `initial` (line 402),
  `shouldShowOrangeBorder` reads it for the deal border (line 124), and
  `RenderPrice` takes the price (line 428).
- **Overlapping flows:** the "lucky price" flow shares the border rule — the
  border is on when **either** a deal is live or `is_luck` is set — and
  `useLuckTimer` runs beside it. The struck-through old price is decided
  separately (`price !== offer_price`, line 416) and must keep working. The moved
  rule must not touch either.
- **Ordering / lockstep dependencies:** the characterization test comes before the
  move (step 1 before step 3), or `AC-9` cannot be proven. The new function must
  exist before the card imports it. Within the change, the move is its own commit
  so it can be reverted alone.
- **What breaks if this is wrong:** every product card on every listing shows the
  wrong price, or loses its countdown and deal border. It would show up as a
  shopper seeing a deal price that is not the deal price — the worst kind, because
  nothing fails loudly. Today no test would catch it, which is why step 1 exists.

## Tests

| AC   | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `none — searched tests/components/ (no products folder), and grep for "ProductCard" across tests/ returned nothing` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | a live deal shows the deal price |
| AC-2 | `none — same search` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | a live deal with no deal price falls back to the offer price, then the plain price |
| AC-3 | `none — same search` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | a deal ending today runs to the end of that day, and not a moment longer |
| AC-4 | `none — same search` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | with no deal date the ordinary price is used and no deal is reported |
| AC-5 | `none — same search` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | a live deal reports the days, hours, minutes and seconds left; an ended deal reports none |
| AC-6 | `none — same search` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | the same product at the same given moment always gives the same answer |
| AC-9 | `none — grep "ProductCard" across tests/ returned no file` | new | `tests/components/products/ProductCard/index.test.tsx` | the card shows the same price, countdown and deal border as before the move |
| AC-10 | `none — a documentation row, nothing can cover it` | new | `tests/components/products/ProductCard/flashPrice.test.ts` | none — proven by reading the corrected row at `/verify`, not by a test |
| AC-7 | withdrawn in `spec.md` on 2026-08-26 | existing | `tests/utils/server/helpers.test.ts` | `showing a price (RoundPrice)` — the whole block |
| AC-8 | withdrawn in `spec.md` on 2026-08-26 | existing | `tests/utils/server/helpers.test.ts` | `shows nothing rather than "NaNM" when the price cannot be read` |

Notes on the table:

- **`AC-10` has no test and says so.** It is a documentation row. `/verify` reads
  the corrected roadmap row; nothing executes for it.
- **Reuse the existing fixture.** `tests/fixtures/product.ts` already builds a
  listing product with `flash_deal_end_date` and `flash_deal_price`. Build the
  cases from it rather than writing product objects by hand.
- **Every assertion carries a message**, per the repository rule. A failure must
  name the rule that broke without the reader opening the code.
- **No new parallel file for the rounding step.** `AC-7` and `AC-8` are `existing`
  rows pointing at the file that already covers them.

## Post-approval amendments (binding)

> Added 2026-08-26, after `review.md` recorded `APPROVED`. These come from
> `review.md > Required Follow-up Actions` and are binding on `/implement` and
> checked again at `/verify`. **`Files to change` is unchanged** — every item
> below is about *how* a listed file is written, not about touching a new one.

**The four `major` findings, and what they force:**

- **FA-1 — the caller list in Integration surface is stale.** The three names come
  from a comment in `derivedProps.ts`, not the repository. The card has **8** call
  sites, and the flash-deals strip is one of them
  (`components/Server/FlashDealsProducts.tsx:51`). Re-derive the list in
  `implement.md`. The blast-radius argument is unchanged: all 8 render the same
  card through `deriveCardProps`.
- **FA-2 — `AC-9` could pass while proving nothing.** `RenderPrice.tsx:15`
  re-applies `flash_price ?? offer_price ?? price`, so a function returning
  `undefined` still renders the right number. So: **do not stub `RenderPrice`**,
  and use a live-deal case where the deal price differs from the offer price, so a
  wrong return is visible on screen.
- **FA-3 — the same hole through the banner.** `FlashDealBanner` recomputes the
  countdown from `end_data` on mount, so an unstubbed banner hides a wrong
  `initial`. Stub the banner and assert **the `initial` prop the card passed**,
  not rendered countdown text.
- **FA-4 — step 1 may not go green at all.** The banner builds an
  `IntersectionObserver` and a 1s `setInterval`; jsdom has neither, and
  `tests/setup.ts` supplies only `matchMedia`. Handle this **inside the test
  file**. If it cannot be done without editing `tests/setup.ts`, that file is not
  in this plan: **block under IM-8** and come back to `/plan`.

**The minor and info items that bind:**

- **FA-5** — pin the clock and the timezone for step 1, and never put an absolute
  future date in a fixture. `AC-3` and `AC-6` must not depend on the runner's zone.
- **FA-6** — the Rollback text below is wrong: reverting the move leaves
  `index.test.tsx` green, and only `flashPrice.test.ts` loses its import. One file
  to delete, not two.
- **FA-7** — while editing the roadmap for `AC-10`, say the four other copies of
  this logic exist and are uncovered, and note in the phase 25 row (`:372`) that
  `index.test.tsx` already exists and must be extended, not duplicated.
- **FA-8** — record `ProductColorsCards.tsx:152` (a deal price with no live-deal
  check) as a finding. **Do not fix it** — it is outside `Files to change`.
- **FA-9** — call the new function with an unmemoized `new Date()` in the render
  body, matching today's one clock read per card.
- **FA-10** — one line in `flashPrice.ts` saying the module is display-only and
  must not be imported by cart, checkout or order code.

**Return shape is load-bearing.** `FlashDealBanner` seeds its state from it, so
the time left stays exactly `{days, hours, minutes, seconds}` or `null`.

## Validation strategy

- Validation profile: `full`
- The `full` profile runs `lint`, `typecheck`, `unit-tests` and `build`. It is the
  right one here rather than `logic-change`: this change adds an import to a
  client component that server components render, and this repository has a
  history of failures that only a real build shows.
- `unit-tests` (`pnpm test:run`) is what runs every row in the table above.
- Extra evidence recorded at `/verify`, not a profile check: the characterization
  test was seen **green before** the move as well as after. Green only afterwards
  proves nothing.

## Rollback

- The move is its own commit. Reverting that one commit puts the rule back inside
  the card and leaves the new tests in place; the function's test file then fails
  to import, so the revert is one commit plus deleting the two new test files.
- Cleanest order if it goes wrong: revert the move commit, then the test commit.
  Nothing else in the repository depends on the new file.
- No data, no schema, no config and no backend is touched, so there is nothing to
  undo outside git.

## Out of scope

- The field-mapping step, the listing filter store, the per-country price rule,
  and the rule that a chosen colour or size changes the price. All four are
  recorded in `spec.md > Out of Scope`.
- The untested copy of the rounding step used by 30 cart, checkout and order
  screens. It needs its own work item.
- The known defect where a listing sorts on one price while the card shows
  another. It is a backend gap.
- Any change to what a shopper sees. If a case shows the current behaviour is
  wrong, that is a finding (`BUG-n`) recorded at `/implement`, not a fix.
