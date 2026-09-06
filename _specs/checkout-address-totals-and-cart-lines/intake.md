---
ticket: checkout-address-totals-and-cart-lines
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-05
links:
  clickup:
  github:
---

# Intake — checkout-address-totals-and-cart-lines

> First stage. Qualify the request only. **No technical planning allowed.**

## In plain words

- This ticket adds **tests only**. It changes no application code.
- Three things get covered: choosing or editing an address at checkout, the
  shipping cost and the order total against the prices the shopper sees, and
  changing a quantity or removing a line on the cart page.
- The suites are already picked, because the request asked for a pick:
  address = **live**, totals = **unit and live**, cart lines = **unit and live**.
- Easy to confuse: the cart-line case started as unit only. The owner widened it
  on 2026-09-05, so all three cases now have a live half.
- Easy to confuse: only the cart-line case has a unit half that stands alone.
  The address case is live only, because saved addresses come from a backend.
- Easy to confuse: `live` means a real staging backend; `scripted` means a
  browser test with faked backend answers. No scripted case is planned here.

## Ticket Reference

`checkout-address-totals-and-cart-lines` — no ClickUp task, no GitHub issue.
Requested in chat on 2026-09-05.

## Ticket Summary

Add tests that prove the cart and checkout money path works. Cover three cases
that no test covers today: picking between two saved addresses at checkout,
the shipping cost and order total matching the prices shown, and changing a
line quantity or removing a line on the cart page.

## Ticket Metadata

- id / slug: `checkout-address-totals-and-cart-lines`
- title: Prove the money path — address choice at checkout, totals against shown prices, and cart line changes
- owner: developer
- created: 2026-09-05
- links: none

## User Story

> As a shopper, I want the checkout to use the address I picked and to charge me
> the total I was shown, so that I can trust the order before I place it.

> As the team, we want these three cases under test, so that a change to the
> cart or checkout tells us which step broke and against which backend.

## Requested cases and the suite for each

The request asked us to pick the suite. These are the picks and the reason.

| # | Case | Suite | Why |
|---|------|-------|-----|
| 1 | Choose between two saved addresses at checkout, and edit one | **live** | The request said live. Saved addresses come from a real backend. A faked list would prove nothing about whether the pick reaches the order. |
| 2 | Shipping cost and order total match the prices shown | **unit + live** | Unit covers the arithmetic on its own, fast, and gates every pull request. Live covers the real numbers the shop returns, which unit cannot see. |
| 3 | Change a quantity, remove a line, on the cart page | **unit + live** | Unit covers the store and the service on their own, fast. Live proves the change reaches the backend and the totals move with it. Widened from "unit only" by the owner on 2026-09-05. |

Scripted (browser + faked backend) is **not** used here. The existing
`tests/e2e/checkout.scripted.spec.ts` already owns the refusal branches
(SCRIPT-14..SCRIPT-20), and none of the three cases above is a refusal branch.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: the request names three cases but no pass/fail criteria. `AC-n` ids are
  written at the `spec` stage, after `research` confirms where each behaviour
  lives and what already covers it.

## Test Cases Presence Check

- Present? **partly**
- Notes: the three cases are named clearly. The exact steps, the fixtures, and
  the file for each are not decided. `plan.md > Tests` decides them, and
  `PL-14` requires checking existing coverage first — `tests/store/cartReducer.test.ts`,
  `tests/services/cart.test.ts`, `tests/e2e/shopper.live.spec.ts` (BUY-01, BUY-02)
  and `tests/e2e/checkout.scripted.spec.ts` all touch this area already.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the goal is
  to add test files, so `study` is wrong.
- Is the goal to *choose between options*? **no** — the suite choice is one small
  pick inside the work, not the outcome, so `research` is wrong.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **no** — no bug is reported and nothing was reproduced, so `hotfix` is wrong.
- Is the change to make already known, leaving only building it? **yes** — write
  tests for three named cases.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Nothing blocks the next stage. `research` must answer these:

- Does staging have a shopper account with **two** saved addresses, or must the
  live test create the second one first? `tests/e2e/harness/signInProfile.ts` and
  `tests/e2e/profile.live.spec.ts` are the places to look.
- Where is the order total built — in the app, or returned by a backend? That
  decides whether a unit test of the total is possible at all, or whether case 2
  is live-only. If it is backend-only, the unit half of case 2 becomes
  `none — <reason>` in `plan.md > Tests`.
- Which backend answers the shipping cost, so a failure can name it (the
  repository rule: a failure must say which backend refused).
- What `tests/store/cartReducer.test.ts` and `tests/services/cart.test.ts`
  already prove about quantity and line removal, so case 3 extends an existing
  file instead of adding a second parallel one (`PL-14`).
- Whether the live half of case 3 can run inside the existing `shopper.live.spec.ts`
  journey, or needs its own spec, and how it cleans up after itself.

## Scope note

Three cases in one work item is close to the "one focused outcome" limit. They
are kept together because they are one flow: cart → address → total → order.
Splitting them would repeat the same research and the same fixtures three times.
If `spec` finds the three pull apart, the cart-line case is the clean split.

## Readiness Status

`READY`

- Justification: the three cases are named, the suite for each is decided, the
  work is test-only, and the base branch `develop` is clean. Every open question
  above is a question `research` exists to answer, not a blocker.
