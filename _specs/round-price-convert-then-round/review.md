---
ticket: round-price-convert-then-round
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Review — round-price-convert-then-round

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-8, AC-1..AC-10, OQ-1..OQ-9) and `plan.md` (after the
owner-approved pre-gate revision of the AC-9 Tests row, recorded in
`ticket.md > State History` as `plan-revised`). Step 1 validation: PL-1..PL-5,
PL-11, PL-12, PL-13, PL-14 pass on the revised plan.

## Plan Summary

The arithmetic moves into one function, `RoundPrice` in `utils/server/helpers.ts`.
It gets the float cleanup and an optional `charged: true` that multiplies first
and rounds up after. The browser copy in `utils/functions.tsx` only fills a
left-out rate, decimals and language from the saved currency, in the browser only,
and calls the shared function. The charged screens add `charged: true`; the
display screens do not change. The browser suite's `expectedFigureFor` moves to the
new order in the same commit.

## Risks

- A charged call site that is missed keeps showing the old, higher figure.
- The screen can still differ from the real charge if the backend rounds in a way
  the one example (OQ-1) does not show.
- One product page can show two rules at once (cart header vs add-to-cart panel)
  — accepted by the owner in the spec, but see the senior finding on the "Added"
  banner.

## Assumptions

- The backend converts first and rounds up after, for every amount (OQ-1, one
  example from the owner).
- The store never holds a currency on the server. Checked in this review:
  `currency` starts `null` (`store/homepage/reducer.ts:76`) and only browser code
  sets it (`components/Cart/CartProvider.tsx:80`, in an effect;
  `services/order.ts:127`).

## Open Questions

- none open. The "Added" banner in the add-to-cart panel (senior finding S-1)
  keeps the display rule: the owner approved the plan as written, and the plan
  lists `components/Cart/AddToCart/CartContentOfProduct.tsx` as a display file.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).** The gate
> examines the owner on these findings, so they have to be readable first; the
> **Decision** and **Approvals** sections below are filled in afterwards. That is
> also why a failed gate leaves this table populated and the decision empty — it
> is what the owner re-reads before the re-run (CG-7).
>
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding, and its disposition once the decision is made. If the panel
> is disabled or returned nothing material, write "none".

No finding is `major`, so CG-6 adds no gate question.

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| S-1 | senior | minor | The "Added" banner in the add-to-cart panel shows the total of this product's items **already in the bag** — the same sum and call as the cart header. The plan keeps it on the display rule, so one product page can show 6999.98 in the header and 7000 in the banner for the same bag. The spec's panel definition ("the price shown before the item is added") does not fit this banner. | `components/Cart/AddToCart/CartContentOfProduct.tsx:60-65,113` vs `components/products/ProductCartHeader.tsx:13`; spec FR-1/FR-3, OQ-9 | |
| S-2 | senior | minor | `OrderDetailsWrapper.tsx` has 2 **commented-out** `RoundPrice(` calls (lines 1318, 1330). The plan's "(6)" and "33 calls" count them; the real counts are 4 and **31**. A plain text scan for AC-9 would demand `charged: true` inside comments. | plan Step 4, Files to change, Tests AC-9 | |
| S-3 | senior | minor | The claim "the call-site test names a missed charged site" holds only for listed files. A file that calls `RoundPrice` but is in neither list — today or later — passes silently. Suggested: one more assertion that every file calling `RoundPrice` is in one of the two lists. | plan Approach; Tests AC-9 | |
| S-4 | senior | info | The browser guard is safe: the store never gets a currency on the server, so the guard changes no server HTML and adds no hydration mismatch. | plan "The browser guard"; `CartProvider.tsx:80`, `services/order.ts:127` | |
| S-5 | senior | info | The integration surface matches the repo: 31 files, the 16 + 15 split covers all, the e2e line numbers are right, `helpers.ts` imports nothing, and no charged value feeds a request body. | plan Integration surface | |
| S-6 | senior | info | `utils/functions.tsx` exports `RoundPrice` and will import `RoundPrice` from `helpers.ts`, so the import needs an alias. The charged calls without `returnNumber` (`couponElement.tsx:163`, `ProductCartHeader.tsx:13`) still show `K`/`M` above 100,000 — kept on purpose by FR-7. | plan Step 3; spec FR-1 vs FR-7 | |
| X-1 | security | minor | Nothing checks the backend's **real** charge. `matchesSentAmount` converts the base amount with the test's own copy of the rule; it never reads the amount charged in the shopper's currency. If the backend rounds differently (e.g. per line, then sums), the bag shows less than the charge and no check sees it. Suggested: one real staging checkout at rate 100 before merge, or add that comparison to the live spec. | spec OQ-1, FR-4, AC-10; plan Validation strategy; `tests/e2e/actions/cart.ts:1322-1345` | |
| X-2 | security | minor | The browser guard changes the server-drawn HTML of charged client components that leave out `rate` (`OrderButton`, `PaymentMethod`, `PlaceOrderWidget`, …): rate 1 on the server, the converted amount in the browser → a hydration mismatch. | plan "The browser guard"; `PaymentMethod.tsx:419`, `PlaceOrderWidget.tsx:632-666` | |
| X-3 | security | minor | `ProductStructuredData.tsx` runs on the server and imports the **browser** copy. With `currency.exchange_rate` missing, today it reads the shared store; after the guard it falls back to rate 1, so the base price goes out under the country's `priceCurrency`. The plan calls structured data "unchanged". Suggested: leave `offers.price` out when rate or decimals are missing. | plan Integration surface; `serverRequests/meta/StructuredData/ProductStructuredData.tsx:4,68-74` | |
| X-4 | security | info | The server copy's rate `0` now falls back to 1 (named in the plan). It also reaches `ListingBreadcrumbList` structured data. Only matters if currency data ever arrives with rate 0. | plan Integration surface; `ListingBreadcrumbList.tsx:48` | |
| X-5 | security | info | `helpers.ts` reads only `NEXT_PUBLIC_BASE_MEDIA_URL` (public), has no imports and no secrets; nothing new reaches the browser bundle. Keep it free of `next/headers` and non-public env. | plan Validation strategy; `utils/server/helpers.ts:1-3` | |
| X-6 | security | info | No new endpoint, cookie, env var, protected path, logging or request body. `RoundPrice` output is display only. Rollback is one `git revert`. | plan Files to change, Rollback | |
| P-1 | performance | minor | Same concern as X-2 (hydration mismatch from the guard) on the bag, orders and cart header. Suggested: check once on a charged page in `pnpm build && pnpm start` at a rate that is not 1. | plan "The browser guard"; Step 3 | |
| P-2 | performance | minor | `tests/harness/expectedBagFigure.test.ts` loads `tests/e2e/actions/cart.ts`, which imports `@playwright/test` and five harness modules — a few hundred ms per run. Suggested: accept, or move `expectedFigureFor` and its two helpers into a file with no dependencies that `cart.ts` re-exports. | plan Tests AC-10; Step 5; `cart.ts:19-33` | |
| P-3 | performance | minor | The AC-9 call-site scan runs in the unit suite, which gates every PR. Reading the files as text with a regex costs well under 50 ms; loading the TypeScript compiler would add seconds. Suggested: say in the plan that the scan reads text. | plan Tests AC-9 | |
| P-4 | performance | info | Hot path stays flat: one `toFixed(12)` and one `Number()` per call on the server copy, one `typeof window` check on the browser copy. | spec NFR 1; plan Step 2 | |
| P-5 | performance | info | No bundle growth: `helpers.ts` is already in client chunks (14 client components import it), and removing the local helpers from `utils/functions.tsx` shrinks it a little. | plan Integration surface | |
| P-6 | performance | info | Correctness: the charged rule runs `preciseMultiply` on the **raw** price. A long-decimal price times a decimal rate (e.g. 12.3456789012 × 1234.56) can push `intA × intB` above 2^53, so a charged figure could be off by one unit without any error. Suggested: add an AC-1-style case, or state that such inputs do not occur. | plan Step 2, Out of scope; `utils/server/helpers.ts:94-112` | |

**Review note on X-2 / P-1 (checked in this review, not a disposition):** the
store's `currency` starts `null` (`store/homepage/reducer.ts:76`) and only browser
code sets it (`CartProvider.tsx:80` in an effect, `services/order.ts:127`). So on
the server the browser copy already falls back to rate 1 today, and the guard
changes no server-drawn figure. `CartContainer` and `OrdersPage` are also loaded
with `ssr: false` (`CartProvider.tsx:10-17`). S-4 reached the same result. The
same fact applies to X-3: with `exchange_rate` missing, today's structured data
already goes out at rate 1.

## Decision

`APPROVED`

- Rationale: the owner passed the comprehension gate (3/3, `comprehension.md`,
  attempt 1, not degraded) and chose `APPROVED`, with the panel findings on disk
  before the gate. No finding is `major`. The plan is approved **as written**:
  the "Added" banner (S-1) stays on the display rule, as the plan lists it.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (owner), 2026-09-24 — self-approval after the
  comprehension gate.

## ADR reference

- ADR: none

## Major finding dispositions

- none — no finding is `major`. The minor and info findings stay on record above
  without an owner disposition; the plan was approved as written.

## Required Follow-up Actions

- none required before `implement`. Notes for `implement` and `verify`, all
  inside the approved plan:
  - S-2: `OrderDetailsWrapper.tsx` has 4 live `RoundPrice` calls, not 6 (31 in
    total, not 33). Only live calls get `charged: true`; the AC-9 call-site cases
    must not count or demand anything inside comments.
  - X-1: the live checkout still compares against the test's own copy of the
    rule, not the backend's real charge. The bag = charge claim rests on OQ-1.
