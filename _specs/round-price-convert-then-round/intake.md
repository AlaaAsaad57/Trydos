---
ticket: round-price-convert-then-round
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-24
links:
  clickup:
  github:
---

# Intake — round-price-convert-then-round

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`round-price-convert-then-round` — no ClickUp task and no GitHub issue yet.
The Workflow Owner gave the request directly in the session of 2026-09-24.

## Ticket Summary

`RoundPrice` rounds a price up to the currency's decimal points **before** it
multiplies by the exchange rate. The rate then multiplies the rounding error.
The shopper sees a higher price than the real one. The request: convert first,
then round up with the decimal points of the currency the shopper sees, in both
copies of the function.

## Ticket Metadata

- id / slug: `round-price-convert-then-round`
- title: RoundPrice - round after the exchange rate, in both copies
- owner: developer
- created: 2026-09-24
- links: none yet

## User Story

> As a shopper who pays in a currency other than the base one, I want every
> price to be converted first and rounded after, so that the price I see is the
> real price and not a price lifted by a rounding error the exchange rate made
> larger.

## What was reported

The raw facts from the session. The spec stage turns them into `AC-n`.

1. Price `69.9998`, exchange rate `100`, decimal points `2`.
   - Shown today: **7000**.
   - Expected by the owner: **6999.98** (the price after the rate, rounded to
     2 decimal points).
2. The steps today, checked with Node in the session:
   `69.9998 × 100 = 6999.98 → ceil → 7000 → 70.00`, then `70.00 × 100 = 7000`.
   The 2 decimal points belong to the displayed currency, but they are applied
   to the base price.
3. There are two copies of the function: `utils/functions.tsx` (client) and
   `utils/server/helpers.ts` (server).
4. The server copy has no float cleanup. So `8.3` shows as **8.31** there, and as
   **8.30** in the client copy (`8.3 × 100 = 830.0000000000001` in JavaScript).
5. Rounding **up** (`Math.ceil`) came in with commit `7f24281d` (2025-12-10),
   which replaced rounding down. The commit gives no reason. The owner did not
   ask to change the direction, only the order.
6. The owner said: the function is critical and used everywhere, but the cart
   must show the right price after the decimal rounding and the exchange rate.

## Acceptance Criteria Presence Check

- Present? **Partly.** The request gives one worked example with the expected
  result (69.9998 × 100 → 6999.98), and the server-copy example (8.3 → 8.30).
  It does not list numbered, testable `AC-n` yet.
- Notes: The spec stage must say which callers are in scope. The owner named the
  cart, and the function is shared by about 67 call sites (cart, orders, product
  pages, product cards, filters). The session suggestion was one rule for all
  callers, so that the product page and the cart never show two prices for one
  item. The spec decides this.

## Test Cases Presence Check

- Present? **Yes, in substance.** The two worked examples are test cases, and the
  session named a third: with a rate of 1, the result must stay exactly as today.
- Notes: Both copies already have test files: `tests/utils/functions.test.ts` and
  `tests/utils/server/helpers.test.ts`. The repository rule applies: each bug is
  shown red by a test before the fix, and each assertion carries a message.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The end
  product is a code change.
- Is the goal to *choose between options*? **No.** The owner chose the
  direction: convert first, then round.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **No.** The wrong result is reproduced, but no written source defines the
  right rounding order. The backend's rule is still an open question (below).
  Deciding the expected behaviour is this workflow's job, not a `hotfix`'s.
- Is the change to make already known, leaving only building it? **Yes.** The
  order of two steps changes, in two known functions.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Nothing blocks the next stage. These are open points for `research` and `spec`:

- **Which rounding order does the backend use when it charges?** The screen
  must match the charge. If the backend rounds before the rate, as the web does
  today, it charges 7000, and a web-only fix would show 6999.98 for a 7000
  charge. Research reads what the order request sends (totals or only ids and
  quantities). The backend rule itself may need the backend team or the owner.
- Which callers use `returnNumber: true` (a raw number, for totals and sums), and
  whether any caller adds up rounded prices, so a change in rounding moves a
  total.
- Whether the mobile app follows the same rule. The code carries a note
  "Dart's formatNumber logic", so the web was copied from the app.
- Whether the two copies should share one implementation, so they cannot drift
  again.

## Readiness Status

`READY`

- Justification: The problem is reproduced with exact numbers, the expected
  result is given for both examples, and both functions and their test files
  are known. The backend question does not stop `research`, which starts from
  the code. It must be answered before `spec` fixes the expected behaviour.
