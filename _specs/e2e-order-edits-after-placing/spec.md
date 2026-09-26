---
ticket: e2e-order-edits-after-placing
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-26
links:
  clickup:
  github:
---

# Spec — e2e-order-edits-after-placing

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser journey — a shopper changes an order after placing it.

## Business Goal

After an order is placed, a shopper can change its delivery address, hide it
from the orders list, restore it, and cancel a line. The unit suite checks these
screens with fake answers only. Today no check proves that the **real core
backend** accepts each change and keeps it. A broken change is found only when a
shopper reports it. This journey finds it on the next run.

## User Story

> As the team that ships the storefront, I want a browser journey that changes
> an order after it is placed, so that a broken change-address, hide, restore or
> cancel-line action is caught before a shopper finds it.

## Functional Requirements

- **FR-1 — A real order to work on.** The journey signs in as the shared shopper
  with its own sign-in and shops in Syria, the only country with cash on
  delivery. It empties the bag and places a cash-on-delivery order for **one
  line** of the QA product. It then finds that order in the shopper's orders
  list and opens it.
- **FR-2 — A second address to move to.** Before the change, the journey makes
  one probe address that it owns and marks as test data. The account's default
  address is not changed.
- **FR-3 — Change the delivery address.** Through the order's own menu, the
  shopper picks the probe address and confirms the change. The core backend must
  then hold the probe address on that order, and the order page must show it.
- **FR-4 — The option must be offered.** If the order's menu does not offer the
  address change, the step fails. The message says that the core backend did
  not allow the change on a new order (the `can_update_address` flag). The case
  never passes or skips in this state.
- **FR-5 — Hide the order.** Through the order's own menu, the shopper hides the
  order and confirms. The order must leave the orders list. The core backend
  must list it among the shopper's hidden orders.
- **FR-6 — Restore the order.** From the orders screen, the shopper opens the
  hidden-orders view. The order is shown there as fully hidden. The shopper
  restores it and confirms. The order must be back in the orders list. The core
  backend must no longer list it as hidden.
- **FR-7 — Cancel the only line.** Through the line's own menu, the shopper
  cancels the line, picks a reason and confirms. The core backend must then show
  the line with nothing left to deliver. The order page must show the order as
  cancelled.
- **FR-8 — Leave nothing behind on a green run.** At the end, no order from this
  run is still live, no order from this run is hidden, and the probe address is
  gone. The safety net that cancels leftover orders must catch nothing.
- **FR-9 — Clean up on a failed run.** When the journey stops part-way, its
  teardown cancels the order, restores it if it is hidden, and removes the probe
  address. The teardown says what it had to clean, by order number and probe
  name.
- **FR-10 — Test hooks for the controls.** The order screens give every control
  the journey presses a stable test hook, so the journey does not depend on the
  English copy. Adding a hook changes nothing a shopper sees or does.
- **FR-11 — Part of the suite.** The journey has a case id and a row in the
  suite's scenario table. It runs with the other journeys that use the shared
  shopper account.

## Non-Functional Requirements

- **NFR-1 — A failure names the step.** The journey is one test with one named
  step per action. Every assertion carries a message that says what was supposed
  to be true. A step that reads back from a backend names that backend (the core
  backend), from the app's own label of which backend answered, not from a guess.
- **NFR-2 — A partial success is a failure.** Each change is checked on the
  screen **and** on the core backend, as two separate checks. A screen that shows
  the change while the backend does not hold it fails, and the reverse fails too.
- **NFR-3 — No secret in any output.** No message, log or kept artifact carries a
  token, a one-time code, a phone number, or the text of the account's own
  addresses. Order numbers and the probe's own name may appear.
- **NFR-4 — Known staging causes are handled.** The journey waits for any token
  renewal to settle before it navigates. It waits for a write's first answer that
  is not a 401 before it moves on. It does not start a navigation while a popup
  that just closed is still leaving history.
- **NFR-5 — Cost per run.** One more one-time code per run (its own sign-in), one
  real order, one probe address. Nothing else is written.

## Constraints

- Real staging only: the QA product, the shared shopper account, the Syria
  region. The journey never buys a real seller's product.
- Only the core backend is involved. No read in this journey comes from
  Elasticsearch, so the "wait for the index" rule does not apply.
- No application behaviour changes. The only application edits allowed are the
  test hooks in FR-10.
- The shared account is not assumed clean. Earlier runs may have left hidden
  orders or extra addresses. The journey finds its own order and its own probe
  by their ids, never by position or by count.
- The comments and messages follow the repository's testing rules
  (`CLAUDE.md > Testing`).

## Edge Cases

- **The address change is not offered** → FR-4: red, the flag named.
- **The line cancel is not offered** (the order is no longer cancellable) → the
  step fails and names the core backend flag for cancelling, as the whole-order
  cancel in the existing buy journey already does.
- **The order is not on the first page of the list** — the list pages as it
  scrolls. The journey looks further before it says "not listed".
- **The hidden-orders view already holds other hidden orders** — the journey
  finds its own order by number and ignores the rest.
- **A write answers 401 first** — normal on staging (a 60-second access token).
  The journey judges the first answer that is not a 401.
- **The probe address cannot be removed while an order uses it** — the teardown
  reports this by probe name. It does not fail silently, and it does not delete
  any address that is not its own.
- **The backend leaves the order open after its only line is cancelled** — the
  "nothing is left live" check (FR-8) fails and names the order.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Owner decision: if the address change is not offered, the step goes **red** and names the core backend and `can_update_address`. It never passes or skips. `can_cancele_order` is already proven true for a new COD order by the existing buy journey; if it is false for the line menu, the cancel-line step fails the same way. | FR-4, Edge Cases, AC-3, AC-7 |
| OQ-2 | Owner decision: **no second line**. The order has one line of the QA product. The checks "the other line stays active" and "hide one line only" are dropped, because one line cannot show them (cancel-line cancels the whole quantity, and hiding the only line hides the order). The seed is not changed. | FR-1, FR-7, Out of Scope |
| OQ-3 | **Deferred to `/plan`.** Whether the journey is a new spec file or new cases next to the buy journey, and whether the order-placing steps move into a shared action, is an approach decision. | Open Questions |
| OQ-4 | Owner decision: **yes**, add stable test hooks to the order screens. No behaviour change. | FR-10, AC-10 |
| OQ-5 | Owner decision: **its own sign-in**. One more one-time code per run. | FR-1, NFR-5 |
| OQ-6 | **Answered in part.** What teardown must put back is a requirement: cancel the order, restore it if hidden, remove the probe address, and say what it cleaned. **How** it does that — and whether the existing leftover-order net still finds the packs of a hidden order — is deferred to `/plan`. | FR-9, AC-9; Open Questions |
| OQ-7 | **Deferred to `/plan`.** Which backend fields prove each change (address on the order, line quantity or status, the hidden flag) needs the real staging answer, which is approach work. The spec fixes only **what** must be proved. | Open Questions |
| OQ-8 | **Answered.** Order of steps: change the address first (it needs an open order), then hide, then restore, then cancel the only line last. Cancelling last also means the order is already closed if a later check fails. | FR-3 → FR-7 order, AC-3 → AC-8 |
| OQ-9 | **Answered.** Out of scope: the delivery note is not saved (FIND-1) and the cancel reason is not sent (FIND-2). Both are known gaps in the feature docs. The journey must not type a delivery note. | Out of Scope |

## Open Questions

- **OQ-3** (deferred to `/plan`) — new spec file or cases next to the buy
  journey; share the order-placing steps or not.
- **OQ-6** (part deferred to `/plan`) — how teardown restores and cancels, and
  whether the leftover-order net finds a hidden order's packs.
- **OQ-7** (deferred to `/plan`) — which fields of the core backend's order
  answers prove each change.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The journey signs in with its own sign-in, shops in Syria, empties the bag, and places a cash-on-delivery order for one line of the QA product. Each of these is its own checked step. The order number is shown, and the order is found in the orders list and opens. | FR-1, NFR-1, NFR-5 |
| AC-2 | A probe address owned by this run exists before the change, and the account's default address is the same after the journey as before it. | FR-2 |
| AC-3 | The order's menu offers the address change. If it does not, the step fails with a message that names the core backend and `can_update_address`. | FR-4 |
| AC-4 | After the shopper confirms the probe address, a read-back from the core backend shows the probe address on the order, and the order page shows it. These are two separate checks. | FR-3, NFR-2 |
| AC-5 | After the shopper hides the order, it is not in the orders list, and a read-back from the core backend lists it among the hidden orders. Two separate checks. | FR-5, NFR-2 |
| AC-6 | The hidden-orders view shows the order as fully hidden. After the shopper restores it, the order is back in the orders list, and the core backend no longer lists it as hidden. Separate checks. | FR-6, NFR-2 |
| AC-7 | The line's menu offers "cancel this product" (or the step fails naming the core backend's cancel flag). After the shopper confirms with a reason, a read-back from the core backend shows the line with nothing left to deliver, and the order page shows the order as cancelled. Separate checks. | FR-7, NFR-2 |
| AC-8 | On a green run the leftover-order net catches nothing, no order from this run is hidden, and the probe address is gone. The journey asserts each of the three. | FR-8 |
| AC-9 | When the journey is made to stop after the order is hidden, its teardown cancels the order, restores it, removes the probe address, and reports what it cleaned by order number and probe name. | FR-9 |
| AC-10 | Every control the journey presses is found by a stable test hook, not by its text. The unit tests of every order screen that got a hook still pass, and lint and typecheck pass. | FR-10 |
| AC-11 | Every step is a named step; every assertion has a message; every read-back message names the core backend from the app's own label. No message or artifact holds a token, code, phone number or the account's address text. | NFR-1, NFR-3 |
| AC-12 | Before each navigation on the signed-in page the journey waits for token renewal to settle, and each write is judged on its first answer that is not a 401. | NFR-4 |
| AC-13 | The journey has a case id and a row in the suite's scenario table, and it runs in the shared-account group of journeys. | FR-11 |

## Out of Scope

- **Two lines in one order**: "cancel one line, the other stays active" and
  "hide one line only, then restore it". Dropped by owner decision (OQ-2). A
  later ticket can add them once the QA seed builds a second product.
- **Changing a line's colour, size or quantity** (the "Change Product Request"
  screen).
- **The delivery note** — it is never saved today (FIND-1).
- **The cancel reason reaching the backend** — it is never sent today (FIND-2).
- **Cancelling the whole pack** — already covered by the existing buy journey.
- **The order's price after the address change** — the journey reads the
  address, not the total.
- **Any fix to application behaviour.** A defect this journey finds is recorded
  as a finding and gets its own ticket.
