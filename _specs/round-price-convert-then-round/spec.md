---
ticket: round-price-convert-then-round
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Spec — round-price-convert-then-round

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Charged prices are converted first, then rounded up; every other price keeps
today's rule; and the two copies of the price rule behave the same.

## Business Goal

The screens where the shopper pays, and sees what was paid, must show the amount
the backend charges. The backend converts first and rounds up after (owner,
2026-09-24: 69.9998 at rate 100 with 2 decimals is charged **6999.98**). The
storefront rounds up **before** the rate and shows **7000**, so the bag and the
order show more than the charge.

Every other price (product cards, product page, filters) keeps today's rule on
purpose: it rounds up before the rate (owner, 2026-09-24). The mobile app will
follow the rules this ticket sets.

## User Story

> As a shopper who pays in a currency other than the base one, I want the bag,
> the checkout and my orders to show exactly the amount I am charged, so that I
> pay what I see.

## The two rules

Both round **up**. They differ only in the order of the two steps.

- **Charged rule** — multiply the price by the exchange rate, then round up to
  the currency's decimal points. 69.9998 at rate 100, 2 decimals → **6999.98**.
- **Display rule** — round the price up to the currency's decimal points, then
  multiply by the exchange rate. This is today's rule, unchanged.
  69.9998 at rate 100, 2 decimals → **7000**.

## Functional Requirements

- **FR-1 — Charged screens use the charged rule.** These screens show amounts
  the shopper pays or has paid (owner, 2026-09-24):
  - the bag: each line, coupon, shipping, discount and total;
  - checkout and payment: payment method amounts, cash-on-delivery cost, the
    place-order amount;
  - orders and invoices: order details, invoices, and the cancel and return
    windows;
  - the cart header on the product page (OQ-9).
- **FR-2 — A charged amount never carries more decimals than the currency
  allows.**
- **FR-3 — Every other screen keeps the display rule.** Product cards, the
  product page, the add-to-cart panel (the price shown before the item is
  added, OQ-9), price filters, compare, and the price in the page's structured
  data show exactly what they show today.
- **FR-4 — Both rules round up.** A charged amount is never below the exact
  converted price, and above it by less than one unit of the currency's last
  decimal.
- **FR-5 — No lift from floating-point noise, in either rule.** A value that
  already fits the decimal points is not raised by one unit because of the
  machine's arithmetic noise (8.3 stays 8.3, never 8.31).
- **FR-6 — The two copies are identical.** The server-drawn and the
  browser-drawn copy of the price rule give the same result for the same
  arguments, for both rules, **including** when the rate, the decimal points or
  the language are left out (owner, 2026-09-24). A left-out value falls back the
  same way in both: to the shopper's own saved currency and language where the
  page has them, otherwise to rate 1, 0 decimals and English.
- **FR-7 — Nothing else moves.** With a rate of 1 every figure is the same as
  today in both rules. The short forms (`K` from 100,000, `M` from 1,000,000, the
  Arabic `أ` and `م`), `0` for a free item and `0` for an unreadable price stay
  as they are.
- **FR-8 — The browser suite predicts the bag with the charged rule.** Its own
  figure for "what the bag should show" follows the charged rule, so a live
  checkout check agrees with the app.

## Non-Functional Requirements

- No price becomes slower to draw in a way a shopper can notice. The rule runs
  for every price on a listing page.
- A failing check names the input, the rule, the copy (server-drawn or
  browser-drawn) and the figure it got, per the repository test rule.

## Constraints

- The backend's charge is the reference for charged screens (OQ-1). The
  storefront follows it and does not change it.
- No backend request is added, and checkout sends the same request as today.
- The rate and the decimal points come from the same currency data as today.
  No new setting is read.
- **A server-drawn price never uses another shopper's data.** On the server,
  the app's store is shared by every request of the process, not kept per
  shopper. So a left-out value on a server-drawn page must not be filled from
  that store; it falls back to rate 1, 0 decimals and English (FR-6).
- **Accepted by the owner:** the same item can show two figures — the display
  rule on the product page (7000) and the charged rule in the bag (6999.98) —
  when the rate is not 1 and the price has more decimals than the currency.
- Every bug this ticket fixes is shown by a test that fails before the fix and
  passes after it (repository rule).

## Edge Cases

- **Rate 1** — no figure moves in either rule (FR-7).
- **Decimal points 0** — both rules round up to a whole number (1234.5 at rate 1
  → 1235, as today).
- **Currency not loaded yet** — rate and decimal points missing; both copies
  fall back the same way (FR-6).
- **A rate below 1** — charged: 0.1 at rate 0.2 with 1 decimal → **0.1**.
  Display: → **0.02**, as today (more decimals than the currency; accepted for
  display screens).
- **A stored value with noise** (8.3 held as 8.30…01) — not lifted, in either
  rule and either copy (FR-5).
- **A converted amount at a short-form boundary** (99,999.99 vs 100,000) — the
  band is chosen on the final value, as today.
- **An unreadable or missing price** — `0`, as today.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | The backend converts first and rounds **up** after: it charges **6999.98** for 69.9998 at rate 100 with 2 decimals (owner, 2026-09-24). | Business Goal; The two rules; FR-1; FR-4; AC-1 |
| OQ-2 | The mobile app will follow the rules this ticket sets (owner, 2026-09-24). No app change here. | Business Goal; Out of Scope |
| OQ-3 | **Both copies change, and the screens split by rule** (owner, 2026-09-24, which replaces the earlier "all callers, one rule"): charged screens — bag, checkout and payment, orders and invoices — use the charged rule; every other screen keeps the display rule. | FR-1; FR-3; AC-9 |
| OQ-4 | **Yes, for charged amounts:** they never carry more decimals than the currency allows (owner, 2026-09-24). Display screens keep today's result, including the `0.02` case, because the owner chose to keep the display rule. | FR-2; FR-3; AC-2; AC-4 |
| OQ-5 | **In scope — the two copies must be identical**, including their fallbacks for a missing rate, decimal points and language (owner, 2026-09-24). A server-drawn page never falls back to shared store data. | FR-6; Constraints; AC-8 |
| OQ-6 | **Answered by OQ-5:** the two copies behave identically for every input and both rules (owner, 2026-09-24). How the code is shared is the plan's approach, not an open question. | FR-6; AC-6; AC-8 |
| OQ-7 | Out of scope: bag lines are rounded one by one and the total once, so they may not add up on screen. That exists today. Proposed in research, not objected to; confirmed at review. | Out of Scope |
| OQ-8 | **In scope:** the browser suite's figure for the bag follows the charged rule (owner, 2026-09-24). | FR-8; AC-10 |

## Open Questions

- None open. **OQ-9** (raised by the spec: which group gets the screens near the
  cart that the first list did not name) is answered by the owner, 2026-09-24:
  the cart header on the product page is a **charged** screen (FR-1); the
  add-to-cart panel is a **display** screen (FR-3). Compare was already a
  display screen.

## Acceptance Criteria Mapping

"In both copies" means the criterion is checked in the server-drawn copy and in
the browser-drawn copy, separately.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | Charged rule: 69.9998, rate 100, 2 decimals → **6999.98**, as shown text and as a number — in both copies. | FR-1, FR-4 |
| AC-2  | Charged rule: 0.1, rate 0.2, 1 decimal → **0.1** (never 0.02) — in both copies. | FR-2 |
| AC-3  | Charged rule rounds up after the rate: 1.2345, rate 3, 2 decimals → **3.71**; 10.001, rate 1, 2 decimals → **10.01** — in both copies. | FR-4 |
| AC-4  | Display rule is unchanged: 69.9998, rate 100, 2 decimals → **7000**; 1.2345, rate 3, 2 decimals → **3.72**; 0.1, rate 0.2, 1 decimal → **0.02** — in both copies. | FR-3 |
| AC-5  | No float lift: 8.3, rate 1, 2 decimals → **8.3** (never 8.31) — in both rules and both copies. | FR-5 |
| AC-6  | For every input of AC-1 to AC-5, and for 150000 at rate 1 with 2 decimals (→ `150K`), the two copies give the **same** figure, rule by rule. | FR-6 |
| AC-7  | With rate 1 nothing moves, in both rules: `0` → `0`; 99999 → 99999; 100000 → `100K`; 999999 → `1000K`; 1000000 → `1M`; 2500000 → `2.5M`; the Arabic `أ` and `م`; an unreadable price → `0`; 25.4 with no decimals → 26; 1234.5 with no decimals → 1235. | FR-7 |
| AC-8  | With the rate, the decimal points or the language left out, the two copies agree: (a) with no saved currency, 25.4 → 26 and 100000 → `100K` in both; (b) with a saved currency of rate 3 and 2 decimals in the browser, a browser-drawn price of 0.1 with nothing passed gives 0.3, and a server-drawn price never reads that saved currency. | FR-6 |
| AC-9  | Each charged screen in FR-1 — including the cart header on the product page — shows **6999.98** for a price of 69.9998 at rate 100 with 2 decimals; the product card, the product page and the add-to-cart panel show **7000** for the same input. | FR-1, FR-3 |
| AC-10 | The browser suite's expected bag figure for the AC-1, AC-2 and AC-3 inputs equals the charged rule's figure for the same inputs. | FR-8 |

## Out of Scope

- Any backend change, and what checkout sends.
- The mobile app (it will follow these rules on its own — OQ-2).
- Changing the rounding direction (it stays "up" in both rules).
- Changing what display screens show (FR-3).
- Making bag lines add up to the bag total (OQ-7).
- The `decimal_point_settings` value in the starting settings, which price
  rounding does not read today.
- Number formatting beyond rounding: thousands separators and trailing zeros
  (6999.90 still shows as 6999.9).
