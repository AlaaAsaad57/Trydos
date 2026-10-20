---
ticket: e2e-order-edits-after-placing
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Intake — e2e-order-edits-after-placing

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`e2e-order-edits-after-placing` — no ClickUp task and no GitHub issue yet.
The Workflow Owner gave the request directly in the session of 2026-09-26. The
request picks up a gap list made in the same session: the browser suite covers
placing an order and cancelling the whole order (`BUY-01`), but no case changes
an order after it is placed.

## Ticket Summary

Add a browser (Playwright) journey that places a cash-on-delivery order, then
changes it the way a shopper can after placing it:

- cancel one line of the order;
- change the order's delivery address;
- hide the order from the orders list, then restore it;
- hide one line of the order, then restore it.

Each change is checked on the screen and on the core backend. At the end, the
journey cancels the order and removes any probe data it made.

## Ticket Metadata

- id / slug: `e2e-order-edits-after-placing`
- title: Browser journey - a shopper changes an order after placing it
- owner: developer
- created: 2026-09-26
- links: none yet

## User Story

> As the team that ships the storefront, I want a browser journey that changes
> an order after it is placed, so that a broken cancel-one-line, change-address,
> hide or restore action is caught before a shopper finds it.

## Acceptance Criteria Presence Check

- Present? yes, in draft form.
- Notes: The request came with five draft cases. Each one names the action and
  the result to check:

  | Draft id | The shopper… | The check |
  |---|---|---|
  | ORD-01 | cancels one line of a two-line order | The core backend shows that line cancelled. The other line is still active. |
  | ORD-02 | changes the order's delivery address | The core backend holds the new address. The order screen shows it. |
  | ORD-03 | hides the order | The order is gone from the orders list. The hidden-orders list shows it. |
  | ORD-04 | restores the hidden order | The order is back in the orders list. The hidden-orders list no longer shows it. |
  | ORD-05 | hides one line, then restores it | The core backend follows each step. |
  | — | teardown | The order group is cancelled. Probe data is removed. |

  The draft ids are working names. `spec` gives the final `AC-n` ids.

## Test Cases Presence Check

- Present? yes, in draft form — the same five cases above.
- Notes: This ticket **is** a test ticket. The deliverable is the browser
  journey itself. It follows the "a failure must say exactly what broke" rules in
  `CLAUDE.md > Testing`: one `test.step()` per action, a message on every
  assertion, and the core backend named whenever a step reads back from it.

## Workflow Type Check

- Is the goal to *understand* something that already exists? no. The goal is a
  new test file, which is a source change.
- Is the goal to *choose between options*? no.
- Does a command reproduce behaviour contradicting a *sourced* expectation? no.
  No failure has been seen. The actions are simply not covered.
- Is the change to make already known, leaving only building it? yes — add a
  browser journey for the five draft cases.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `asked` |
| ClickUp field said | — (no ClickUp id given) |
| Argument said | — (the argument named no type: "for the suggested set of cases") |

## Missing Information

Nothing blocks the next stage. These are open points for `research` to answer
from the code and from staging, not from the request:

- **Whether staging offers each action on a new order.** The app shows "change
  address" and "cancel line" only when the backend sends the matching flags on
  the order. A new cash-on-delivery order on staging may not carry them. If a flag
  is off, that case gets no button, and the ticket must say so plainly. It must
  not pass silently.
- How to get two lines into one order: two products, or one product at quantity
  two. The QA seed may hold only one product. It is not yet known how
  "cancel one line" treats quantity.
- Which existing helpers to reuse: the `BUY-01` order flow, the order-list
  actions, the order clean-up helper, and the probe-address pattern from `BUY-03`.
- Which lane (account / solo) the journey belongs in. The shopper account is
  shared by every case.
- Which country to seed. Cash on delivery exists only in `sy`, and the live suite
  defaults to `iq`.
- How the journey cleans up if it fails part-way — for example, an order left
  hidden, or a probe address left behind.
- Where the Elasticsearch lag rule applies, if any. The order list may read from
  the core backend directly, which has no lag.

**Out of scope for this ticket:** changing a line's colour or size
(`change-item-variant`). That action needs a product with a second variant and
its own backend flag. It can be a later ticket.

## Readiness Status

`READY`

- Justification: The flow is complete and ordered, and each case names the
  result to check. The open points above are questions about existing code and
  about what staging answers, which is what the `research` stage reads. No
  outside party has to answer anything first.
