---
ticket: unit-tests-price-resolution
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Verify — unit-tests-price-resolution

> Read-only. No implementation file was edited here, and no commit was created
> (VF-7 / VF-10).

**Outcome: `PASSED` — 8 of 8 live acceptance criteria satisfied.** Two more
(`AC-7`, `AC-8`) were withdrawn at the spec stage and are recorded below as
already covered rather than silently dropped.

## Validation profile — `full`

Resolved from `.claude/project-config.yaml > validation_profiles`, run at depth
`all-ac`. Every command is read-only and deterministic.

| Check | Command | Exit | Result |
|---|---|---|---|
| lint | `pnpm lint` | 0 | 0 errors, 62 warnings — every one pre-existing, none in a file this work item touched |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | clean |
| unit-tests | `pnpm test:run` | 0 | **1531 passed, 63 files, 0 failed** |
| build | `pnpm build` | 0 | production build succeeded, all routes generated |

The declared tests were also run on their own, with per-case output:
`pnpm exec vitest run --project unit tests/components/products/ProductCard/` —
exit **0**, **16 passed** (13 for the rule, 3 for the card).

## Acceptance criteria

| AC | Result | Evidence |
|----|--------|----------|
| AC-1 | **Met** | `flashPrice.test.ts` › "shows the deal price while the deal is running" — a running deal with a deal price of 60 against an offer price of 80 returns 60. |
| AC-2 | **Met** | Same file, three cases: no deal price falls back to the offer price; no offer price falls back to the plain price; an offer price of **zero** is used as a real price rather than treated as missing. |
| AC-3 | **Met** | Same file, two cases: still running at `23:59:59.998` on the deal's last day; ended at `00:00:00` the next day. The dates are written in local form so no runner's timezone can move the boundary. |
| AC-4 | **Met** | Same file, two cases: no deal date uses the offer price and reports no deal; a deal price arriving with no deal date is ignored, so a product cannot sit on a deal price for ever. |
| AC-5 | **Met** | Same file, three cases: the time left reads 1 day, 11 hours, 59 minutes, 59 seconds for a known gap; the four keys the banner seeds from are exactly `days, hours, minutes, seconds`; an ended deal reports nothing. |
| AC-6 | **Met** | Same file, two cases: the same product at the same moment gives an identical answer; a later moment handed in ends the deal, which is what proves the rule reads its argument and not the clock. |
| AC-9 | **Met** | `index.test.tsx`, three cases — and the **order** is the evidence. It was written against the old code, with the rule still inline, and was green (3/3) before `flashPrice.ts` existed; it is green again after the move. Live deal → 60 on screen, countdown given the time left, orange border. Ended deal → 80, no countdown, no border. No deal → 80, nothing about a deal. |
| AC-10 | **Met** | Read, not executed — it is a documentation row and the plan declared `none` with that reason. `docs/testing/UNIT_TEST_ROADMAP.md:322` now names `flashPrice.ts` and says why the two old names were wrong; the phase 14 note names the four uncovered copies and the timezone trap; the phase 25 row at `:378` warns that `index.test.tsx` exists and must be extended, not duplicated. |
| AC-7 | **Withdrawn**, covered | Withdrawn in `spec.md` on 2026-08-26 — the card draws its price with the copy of `RoundPrice` that already has a test file. Confirmed still covering it: `tests/utils/server/helpers.test.ts` › "showing a price (RoundPrice)", 11 cases, exit 0. |
| AC-8 | **Withdrawn**, covered | Same. The `NaNM` guard case is present and green: "shows nothing rather than \"NaNM\" when the price cannot be read". |

## Why AC-9 is real and not circular

The one criterion that could have been faked here is `AC-9` — a test written after
a refactor can only prove the new code agrees with itself. Three things stop that:

1. **It ran before the move.** First run against the inline code: 1 failed, 2
   passed. The failure was the test's own assertion (jsdom prints
   `rgb(255, 98, 0)`, not the hex the component writes); corrected, then 3/3
   green — all before `flashPrice.ts` existed.
2. **`RenderPrice` is not stubbed** (FA-2). It re-applies
   `flash_price ?? offer_price ?? price`, so a rule returning nothing would still
   render a plausible number. Every live-deal case therefore uses a deal price
   (60) that differs from the offer price (80), so a wrong return shows on screen.
3. **The countdown banner is stubbed and its props are read** (FA-3). The real
   banner recomputes the countdown from `end_data`, so asserting rendered
   countdown text would have proven the banner works, not the card.

## Review follow-up actions

All ten were carried out and are recorded in `implement.md > Follow-up actions`.
Checked again here:

- **FA-1** — 8 call sites re-derived from the repository, `FlashDealsProducts.tsx`
  included. Confirmed at verify with the same search.
- **FA-2, FA-3, FA-4** — the three `major` findings about `AC-9`: all three are
  visible in the test file and in the evidence above. `tests/setup.ts` was **not**
  edited, so the IM-8 boundary the review drew was never crossed.
- **FA-5** — met by the date form rather than by pinning `TZ`; see the deviation
  below. The clock is pinned with `vi.setSystemTime`.
- **FA-6 to FA-10** — rollback text corrected, both roadmap rows updated, `BUG-1`
  recorded and not fixed, one unmemoized `new Date()` at the call site, and the
  display-only note at the top of `flashPrice.ts`.

## Deviations carried from implement

Three, all accepted here:

1. **The dead `is_flashDeal` binding was removed** from `index.tsx`. Its only
   reader was the block that moved out, and it is the same field as `endDate`.
   Inside a file the plan lists.
2. **The border is asserted as `rgb(255, 98, 0)`, not `#FF6200`.** The test was
   wrong, not the app; the app still writes the hex.
3. **FA-5 met without pinning `TZ`.** Pinning it needs `vitest.config.mts` or
   `tests/setup.ts`, neither of which is in the approved plan. Boundary dates are
   written as `"2026-08-27T00:00:00"`, which every timezone reads as local
   midnight, and the card cases sit more than a day from any boundary. The intent
   of FA-5 — no case can flip on another runner — is met.

## Findings

| BUG | Scenario | Confirming test | Where it lives | In scope? |
|-----|----------|-----------------|----------------|-----------|
| BUG-1 | The colour sheet under a card shows a deal price with no check that the deal is still running. After a deal ends, the card shows the ordinary price while the colour sheet still shows the deal price — two prices for one product on one screen. | none — see below | `components/ServerWrapper/ProductWrapper/ProductColorsCards.tsx:150-155` | **No** — outside `plan.md > Files to change` |

`BUG-1` has no confirming test, and that is stated rather than glossed: the file
is not in the approved plan, so writing one would be scope creep under IM-4, and
this suite uses no expected-failure marker yet. It was found by reading the code
at review, not by a test. **The follow-up ticket must start with a red test of its
own** — the four-step rule applies there, not here.

`passed` is permitted because the only open finding lies outside the files this
plan changes (VF-12).

## Non-functional

- The new checks run in the suite that gates every pull request.
- They are deterministic: the rule takes the moment as an argument, the card test
  pins the clock, and no case sits close enough to a boundary for a timezone to
  move it.
- Every assertion carries a message naming what was supposed to be true.
- No new dependency. The suite went from 1515 to 1531 tests and its runtime did
  not change meaningfully.

## Scope

Five files changed, exactly the five the plan listed. No protected runtime path
was touched — `proxy.ts`, `next.config.ts`, `instrumentation*`, `sentry.*` and
`.github/workflows/**` are all unchanged. No commit was created; the branch
`ticket/unit-tests-price-resolution` carries the working tree for
`/wf:publish-pr`.

## Gate

`comprehension.md`, `stage: verify`, `attempt: 1`, `result: passed`,
`score: 2/2`, threshold `1.0`. It includes the mandatory CG-5 integration
question.

**The gate was administered short — 2 questions against a floor of 3** — and the
reason is on the record in `degraded:`. Both regeneration rounds were spent
because the CG-8 falsifier could answer the other questions blind. The two that
survived were the two it got wrong, and both were answered correctly.

## Follow-ups this work produced

1. **`BUG-1`** — the colour sheet's unchecked deal price. Needs its own ticket,
   starting from a red test.
2. **The client `RoundPrice`** (`utils/functions.tsx:170`) is used by 30 cart,
   checkout and order screens and has no test file. Withdrawn from this work item
   when the premise behind `OQ-6` turned out to be wrong.
3. **Four more copies of the end-of-day flash-deal logic** stay uncovered —
   `ListingPage/Product.tsx:34`, `Server/product/ProductPhotoSliderWrapper.tsx:48`,
   `Cart/AddToCart/FlashDealBannerCart.tsx:18`, `FlashDealBanner.tsx:31`. Recorded
   in the roadmap so the next reader is not misled about what phase 14 pinned.
