---
ticket: unit-tests-price-resolution
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Review — unit-tests-price-resolution

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

- `_specs/unit-tests-price-resolution/spec.md` (10 `AC-n`, two withdrawn).
- `_specs/unit-tests-price-resolution/plan.md` (approach, 7 steps, 5 files to
  change, integration surface, tests table, `full` validation profile, rollback).
- The source the plan names, read to check the plan's claims are true:
  `components/products/ProductCard/index.tsx`,
  `components/products/ProductCard/derivedProps.ts`,
  `components/products/FlashDealBanner.tsx`,
  `components/ServerWrapper/ProductWrapper/RenderPrice.tsx`,
  `tests/fixtures/product.ts`, `tests/setup.ts`,
  `docs/testing/UNIT_TEST_ROADMAP.md`, `.claude/project-config.yaml`.

Validation applied: PL-1..PL-5, PL-11, PL-12, PL-13, PL-14, VP-1, plan ↔ REQ/AC
traceability (RV-3). All pass. Notes on two of them:

- **PL-13.** Every `AC-n` has a row. The two `existing` rows name
  `tests/utils/server/helpers.test.ts`, which is not under Files to change. That
  is correct: PL-14 requires the file listed only for `extend` and `new`, because
  `existing` writes nothing.
- **PL-13, minor.** The `AC-10` row names `flashPrice.test.ts` in the file column
  and then says `none` in the case column. The row is internally inconsistent,
  but the file is already under Files to change and the `none — <reason>` is
  stated, so the rule holds.
- **VP-1.** Profile `full` exists in `.claude/project-config.yaml`, and all four
  checks it requires (`lint`, `typecheck`, `unit-tests`, `build`) are defined in
  `validation_checks`.

## Plan Summary

The flash-deal choice lives inline in `ProductCard/index.tsx` at lines 91–121. It
decides two things a shopper sees: the price on the card, and the time left on the
deal. Nothing can test it while it sits inside the component.

The plan moves that block into a new pure function,
`components/products/ProductCard/flashPrice.ts`, which takes the price fields, the
deal end date, and **the current moment as an argument** — so the answer no longer
depends on when the test runs. It then tests the function directly (`AC-1`..`AC-6`).

The move is proved, not assumed: a characterization test on the card is written
and **seen green against today's code first** (step 1), then the move happens
(step 3), then the same test runs again (step 4). A test written after the move
could only say the new code agrees with itself.

`AC-7` and `AC-8` were withdrawn from the spec on 2026-08-26: the card draws its
price with the copy of the rounding step that already has a test file, so there is
nothing to add. `AC-10` corrects the roadmap's phase 14 row.

## Risks

- The characterization test (`AC-9`) is the only guard on the move, and three of
  the four `major` findings below say it can pass while proving nothing.
- `FlashDealBanner` is the card's most awkward child in a test: it builds an
  `IntersectionObserver`, runs a 1s `setInterval`, and recomputes the countdown
  itself from `end_data`. The plan says "heavy child components are stubbed" but
  does not name it.
- The end-of-day rule uses `setHours(23,59,59,999)` in local time. A test that
  does not pin the timezone can pass on the developer's machine and fail on CI.

## Assumptions

- `is_flashDeal` and `endDate` carry the same value, so the guard at
  `index.tsx:93` is a duplicate check. Verified: `derivedProps.ts:38` sets
  `is_flashDeal: product.flash_deal_end_date` and `:36` sets `endDate` from the
  same field. Every card render goes through `deriveCardProps` (`index.tsx:45`),
  so there is no caller that could pass them differently.
- `tests/fixtures/product.ts > buildListingProduct` already carries
  `flash_deal_end_date` and `flash_deal_price` (both `null` by default), so cases
  can be built from it rather than by hand.
- The unit suite gates every pull request; the browser suite does not.

## Open Questions

- None. `spec.md > Open Questions` is `None`, and every `OQ-1`..`OQ-6` is answered
  there (PL-12 satisfied).

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section was written before the comprehension gate ran (RP-4).** The
> **Decision** and **Approvals** sections below were filled in afterwards.
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
>
> Every `major` below was checked against the source before it was written here.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | **major** | The Integration surface names the wrong renderers. `GetProducts`, `GetRelatedProducts` and `ProductListServer` are copied from a stale comment in `derivedProps.ts:13-15`, not from the repo. The card is rendered by **8** call sites today, and the flash-deals strip — the surface this rule governs most — is missing from the list. | `plan.md > Integration surface`, "Who else depends on them"; `components/Server/FlashDealsProducts.tsx:51`, `components/Server/ProductList.tsx:141`, `components/Server/FeatureProducts.tsx:44`, `components/Server/RecomendedProducts.tsx:59`, `components/Server/product/RelatedProductsSection.tsx:57`, `components/ServerWrapper/BoutiquesListWrapper.tsx:119`, `components/ListingPage/ProductInfiniteScroll.tsx:340`, `components/Product/RelatedProductsInfiniteScroll.tsx:158` | **Accept** — the names are stale but the blast-radius statement is unchanged: all 8 call sites render this same card, and none of them passes the flash-deal inputs differently (every render goes through `deriveCardProps`, `index.tsx:45`). Corrected as FA-1, not by a plan rewrite. |
| security | **major** | `AC-9` can pass while proving nothing. `RenderPrice` re-applies `flash_price ?? offer_price ?? price` itself, so a new function returning `undefined` or `null` still renders the correct price and the rendered-text assertion stays green. | `plan.md > Files to change` (`tests/components/products/ProductCard/index.test.tsx`); `components/ServerWrapper/ProductWrapper/RenderPrice.tsx:15`; `index.tsx:428` | **Mitigate** — FA-2. Inside the approved scope: `index.test.tsx` is already under Files to change, so the fix is how that file asserts, not what the plan permits. |
| senior | **major** | `AC-9` can pass while proving nothing, second route. `FlashDealBanner` recomputes the countdown itself from `end_data` on mount, so an unstubbed banner overwrites the `initial` value the card passed. The assertion would prove the banner works, not that the move kept the card's behaviour. | `plan.md > Files to change` (`index.test.tsx`); `components/products/FlashDealBanner.tsx:28-55`, `:105`; `index.tsx:402` | **Mitigate** — FA-3. Same scope argument as FA-2. |
| performance | **major** | Step 1 may not be able to go green at all. `FlashDealBanner` builds an `IntersectionObserver` and a real 1s `setInterval` on mount; jsdom has no `IntersectionObserver`, and `tests/setup.ts` supplies only `window.matchMedia` — no observer polyfill and no fake timers. The plan says "heavy child components are stubbed" without naming the banner. | `plan.md > Files to change` (`index.test.tsx`); `components/products/FlashDealBanner.tsx:63,86`; `tests/setup.ts:70-81` | **Mitigate** — FA-4. If step 1 cannot be made green without editing `tests/setup.ts`, that is an unlisted file: block under IM-8 and return here, do not edit it. |
| senior | minor | Non-determinism the plan does not close: a fixed moment is pinned only for the pure-function tests (step 5). Step 1's card test still goes through the card's inline `new Date()`. | `plan.md > Steps` 1 and 5 vs `spec.md > Non-Functional Requirements` | **Mitigate** — folded into FA-5. |
| security | minor | The local-time `setHours(23,59,59,999)` end-of-day rule makes `AC-3` and `AC-6` timezone-dependent — green on a `+03` laptop, red on a UTC runner. | `index.tsx:96,99`; `spec.md > Non-Functional Requirements` | **Mitigate** — folded into FA-5. The rule keeps local-time end-of-day on purpose; the test pins the zone. |
| senior | minor | The Rollback text would delete a test that should survive. Reverting the move must leave `index.test.tsx` green — that is its whole purpose. Only `flashPrice.test.ts` loses its import. | `plan.md > Rollback` | **Accept** — FA-6. A wrong sentence in the rollback text, not a wrong plan; corrected at `/implement`. |
| senior | minor | Four other copies of the same end-of-day + flash-price logic stay untouched (`ListingPage/Product.tsx:34`, `Server/product/ProductPhotoSliderWrapper.tsx:48-51`, `Cart/AddToCart/FlashDealBannerCart.tsx:18`, `FlashDealBanner.tsx:31`), so the `AC-10` wording "the code that really decides the displayed price" overstates what is pinned. | `plan.md > Files to change`; `docs/testing/UNIT_TEST_ROADMAP.md:322` | **Mitigate** — FA-7. The roadmap row says the copies exist and are uncovered. |
| senior | minor | File-name collision with a later phase: roadmap phase 25 already targets `components/products/ProductCard/` (`:372`). Phase 25 must extend the `index.test.tsx` this ticket creates, not add a parallel one (PL-14). | `plan.md > Files to change`; `UNIT_TEST_ROADMAP.md:322` and `:372` | **Mitigate** — FA-7, same roadmap edit. |
| security | minor | A second, untested copy of the deal-price decision stays behind: `ProductColorsCards.tsx:152` passes `flash_deal_price` straight to `RenderPrice` with no live-deal check, so the colour sheet can show an ended deal's price while the card shows the ordinary one. | `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx:150-155` | **Accept, out of scope** — FA-8. Record it so nobody later assumes the new module is the single source of the deal price. Not fixed here (IM-4). |
| performance | minor | Step 2's "reproduces today's expression exactly" keeps three `Date` allocations and two identical `setHours` calls per card per render. | `index.tsx:94-99`; `plan.md > Steps` 2 | **Dismiss** — "exactly" is the whole safety argument for the move. A behaviour-identical tidy-up is a separate change. |
| performance | minor | The plan never says where the `now` argument comes from at the call site. A `useMemo` or module-level `new Date()` would freeze the countdown seed. | `plan.md > Steps` 2 and Files to change | **Mitigate** — FA-9. Keep an unmemoized `new Date()` in the render body, matching today's behaviour. |
| senior | info | The Integration surface undercounts the border consumers: `shouldShowOrangeBorder` is also handed to `ProductColorsCards` as a prop (`index.tsx:162`) and drives borders at `:266`, `:305`, `:345`. | `plan.md > Integration surface` | **Accept** — noted with FA-1. |
| senior | info | `is_flashDeal` and `endDate` are the same field, so the new function should take the end date only and must not gain a second redundant parameter. | `derivedProps.ts:36,38`; `index.tsx:93` | **Accept** — the plan's signature already reads this way. |
| senior | info | The `full` profile's stated reason ("adds an import to a client component") is weak — `flashPrice.ts` is a pure module with no imports. The profile choice is still cheap insurance. | `plan.md > Validation strategy` | **Dismiss** — keep `full`. A weak reason for a stronger check is not a defect. |
| performance | info | Keep the returned shape exactly `{days,hours,minutes,seconds}` or `null`: `FlashDealBanner` seeds `useState` from it, so the shape is load-bearing. | `index.tsx:124`, `:402-408` | **Accept** — binding on step 2. |
| performance | info | The real per-card cost is not the moved block — `deriveCardProps` spreads the whole product into `InitialProductData` on every render. Out of scope; do not claim this ticket improved render cost. | `derivedProps.ts:42` | **Accept, out of scope.** |
| security | info | The new module is display-only and must never become the source of a price sent to cart or checkout; the server stays the pricing authority. | `spec.md > Out of Scope` | **Accept** — FA-10, one line in the new file. |
| security | info | No secrets, no new endpoint, env var or permission, and no protected runtime path touched (`proxy.ts`, `next.config.ts`, `instrumentation*`, `sentry.*`, `.github/workflows` are all absent from the change list). | `plan.md > Files to change` | **Accept** — no action. |

## Decision

`APPROVED`

- Rationale: The plan satisfies PL-1..PL-5, PL-11..PL-14 and VP-1, and traces
  cleanly to the spec's `AC-n`. Its central choice is the right one and the
  reason is stated: the characterization test is written and **seen green before**
  the move, so the move is proved rather than assumed.

  The four `major` findings do not argue against the plan's approach. Three of
  them are the same worry from three angles — that the `AC-9` test could stay
  green while proving nothing — and all three land inside a file the plan already
  lists under Files to change, so they are about *how that test asserts*, not
  about what the plan permits. They are carried as FA-2, FA-3 and FA-4 and are
  binding on `/implement`. The fourth is a factual correction to the Integration
  surface text: the three renderer names are stale, but every one of the 8 real
  call sites renders the same card through the same `deriveCardProps` path, so
  the blast-radius statement the plan reasons from is unchanged.

  One boundary is stated now so it cannot be improvised later: if FA-4 turns out
  to need an edit to `tests/setup.ts`, that file is not in the approved plan.
  `/implement` must block under IM-8 and come back here for a revision.

  Recorded honestly: **no `major` finding was examined by a gate question.** Two
  panel-seeded questions were drafted and both were answered correctly by the
  CG-8 falsifier, so they were dropped and the regeneration rounds were spent.
  The gate ran full at the floor (3/3, 100%) on the artifact axes instead. See
  `comprehension.md > CG-6 note`.

- Gate: `comprehension.md`, `stage: review`, `attempt: 1`, `result: passed`,
  `score: 3/3`, threshold `1.0`. Includes the mandatory CG-5 integration question.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-08-26, decision passed as the argument to
  `/wf:review` after the comprehension gate passed.

## ADR reference

- ADR: none

## Required Follow-up Actions

These are binding on `/implement` and are checked again at `/verify`. None of them
changes `plan.md > Files to change`.

- **FA-1** — Re-derive the card's caller list from the repository when `/implement`
  writes `implement.md`; record the 8 call sites, including
  `components/Server/FlashDealsProducts.tsx:51`. Note the border prop hand-off at
  `index.tsx:162`.
- **FA-2** — `index.test.tsx` must assert the value the moved function returns,
  not only the rendered price text. Do **not** stub `RenderPrice`, and include a
  live-deal case where `flash_deal_price` differs from `offer_price`, so a wrong
  return is visible.
- **FA-3** — State in `implement.md` how `FlashDealBanner` is handled, and assert
  the `initial` prop the card passed rather than rendered countdown text.
- **FA-4** — Handle the jsdom gap (`IntersectionObserver`, the 1s interval) inside
  the test file. **If this cannot be done without editing `tests/setup.ts`, block
  under IM-8** — that file is not in the approved plan.
- **FA-5** — Pin the clock and the timezone for step 1, and never put an absolute
  future date in a fixture. `AC-3` and `AC-6` must not depend on the runner's zone.
- **FA-6** — Correct the rollback sentence: reverting the move deletes one test
  file (`flashPrice.test.ts`), not two. `index.test.tsx` must stay green.
- **FA-7** — While editing `UNIT_TEST_ROADMAP.md` for `AC-10`, say that the four
  other copies of this logic exist and are uncovered, and note in the phase 25 row
  (`:372`) that `index.test.tsx` already exists and must be extended, not
  duplicated (PL-14).
- **FA-8** — Record `ProductColorsCards.tsx:152` (deal price with no live-deal
  check) as a finding under `implement.md > Findings`. Do not fix it here (IM-4).
- **FA-9** — Call the new function with an unmemoized `new Date()` in the render
  body, matching today's one clock read per card.
- **FA-10** — One line in `flashPrice.ts` saying the module is display-only and
  must not be imported by cart, checkout or order code.
