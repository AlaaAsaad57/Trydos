---
ticket: e2e-guest-cart-survives-sign-in
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Intake — e2e-guest-cart-survives-sign-in

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-guest-cart-survives-sign-in` — no ClickUp task and no GitHub issue yet.
The Workflow Owner gave the request directly in the session of 2026-09-23.

## Ticket Summary

Add a browser (Playwright) journey for one cart flow. A guest adds the QA
product to the cart, then signs in. After sign-in, the item must still be in the
cart. At the end, the journey removes the item from the cart.

## Ticket Metadata

- id / slug: `e2e-guest-cart-survives-sign-in`
- title: Browser journey - a guest's cart survives sign-in
- owner: developer
- created: 2026-09-23
- links: none yet

## User Story

> As the team that ships the storefront, I want a browser journey that adds an
> item as a guest and then signs in, so that a sign-in that empties or loses the
> guest's cart is caught before a shopper finds it.

## The requested flow

The raw request, in the order it was given. The spec stage turns it into `AC-n`.

1. Start as a guest.
2. Add the QA product to the cart.
3. Sign in.
4. The cart must survive the sign-in: the QA product is still in the cart.
5. At the end, remove the item from the cart.

## Acceptance Criteria Presence Check

- Present? **Partly.** The request names the steps and the one outcome that
  matters (the item is still in the cart after sign-in). It does not list them
  as numbered, testable `AC-n` yet.
- Notes: The spec stage gives each step its own `AC-n`. "Survives" needs a
  precise meaning from the code: the same product only, or also the same
  quantity and the same variant (colour / size).

## Test Cases Presence Check

- Present? **Yes, in substance.** The request is one short browser journey with
  named steps.
- Notes: The repository test rule applies in full. Each step that can break on
  its own gets its own check and message, and the journey uses `test.step()`.
  Sign-in crosses several backends, and the cart moves from the guest session to
  the signed-in session, so a failure must name the backend that refused.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **No.** The end
  product is a new test in the repository, not a document.
- Is the goal to *choose between options*? **No.** Nothing is being compared.
- Does a command reproduce behaviour contradicting a *sourced* expectation?
  **No.** No bug is reported. If the journey finds one, it is recorded as a
  finding and gets its own ticket.
- Is the change to make already known, leaving only building it? **Yes.** The
  flow is given; only the code details are still to be read.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

Nothing blocks the next stage. These are open points for `research` to answer
from the code, not from the request:

- How the app moves a guest cart into the signed-in cart: on the client, on the
  server, or by the backend (gateway guest → core verified user).
- Which "QA product" the journey uses, and how it is found under the QA
  production-safety rules already in the suite.
- Whether the suite already has cart and sign-in actions to reuse
  (`tests/e2e/actions/`), and which lane (account / solo) this journey belongs in.
- How the shared shopper account's existing cart is handled, so an item left by
  an earlier run does not make the check pass by accident.
- How the journey cleans up if it fails before the "remove" step.
- Which variant, if any, the QA product needs before "add to cart" works.

## Readiness Status

`READY`

- Justification: The flow is complete and ordered, and the outcome to check is
  named. The open points above are all questions about existing code, which is
  what the `research` stage reads. No outside party has to answer anything first.
