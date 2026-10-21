---
ticket: order-notification-reuse-tab
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Intake — order-notification-reuse-tab

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`order-notification-reuse-tab` — no ClickUp task. The owner asked for this in
chat on 2026-10-21. A read-only investigation in the same chat came before this
ticket. The owner agreed with its findings and with the scope below.

## Ticket Summary

A shopper gets a background push when an order status changes. Today, a click
on that push always opens a **new** tab, even when a tab is already open on the
same order's details page. The click should focus that open tab and load the
order data again instead.

## Ticket Metadata

- id / slug: `order-notification-reuse-tab`
- title: Order push click: reuse the open order tab and refresh its data
- owner: developer
- created: 2026-10-21
- links: none (no ClickUp task)

## User Story

> As a shopper, when I click an "order status changed" notification while that
> order's details page is already open in a tab, I want that tab to come to the
> front with the new status, so that I do not end up with duplicate tabs or an
> old status on the screen.

## Request details (as given by the owner)

- The original ask: "for order background notifications, when user clicks on
  any of it and already have opened order-details tab, could we open the
  existing tab and refresh its data?"
- **Scope agreed with the owner on 2026-10-21:**
  - Applies to the `order status changed…` push types.
  - Reuse a tab **only** when it is on the **same** order's details page
    (`/<locale>/settings/orders/<order_group_id>`).
  - A tab on a different order, or on the orders list, keeps today's
    behaviour: the click opens a new tab.
  - `order placed` is **out of scope**. Its click URL is the orders list, not a
    details page.
  - The refresh must be specific to that order. It must not raise the global
    order-refresh signal, because other screens react to that signal too.
  - In the same click handler, the default branch opens a window without
    keeping the service worker alive until the window opens. The owner agreed to
    fix that in this ticket too.
- A similar feature already exists. The delivery-worker chat push reuses an open
  order tab and opens the chat in place, without a reload. This ticket should
  follow the same pattern.

## Investigation notes (from the chat, for `research` to confirm)

- `public/firebase-messaging-sw.js` lines 455–475: the `order status changed…`
  branch builds its click URL but sets no marker to reuse a tab.
- Same file, lines 705–742: `focusOrOpenOrderTab` finds a tab on
  `/settings/orders/<group_id>`, focuses it and posts `OPEN_DELIVERY_CHAT`.
- Same file, lines 745–758: the click handler. Line 756 calls
  `clients.openWindow` without `event.waitUntil`.
- `utils/NotificationHandler.ts:121`: turns the worker's `OPEN_DELIVERY_CHAT`
  message into a window event.
- `components/setting/orders/OrderDetailsWrapper.tsx:198` (refresh on the
  global signal) and `:420` (listens for the chat event).
- When a push arrives and a tab is open, the worker also posts the push to
  every tab, and an order-details tab often loads its data again at that moment.
  So the click refresh acts as a safety net. The main visible gain is "no
  duplicate tab".
- The worker is registered at scope `/` (`utils/firebaseInitv1.tsx:95`).
- No test covers the worker's click handler today.

## Acceptance Criteria Presence Check

- Present? **no** (not as numbered criteria)
- Notes: the agreed scope above says the expected behaviour. The `spec` stage
  turns it into `AC-n`.

## Test Cases Presence Check

- Present? **no**
- Notes: the `spec` stage defines them; the `plan` stage maps each `AC-n` to a
  test.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no** — the
  investigation is already done.
- Is the goal to *choose between options*? **no** — the owner chose the scope
  and the approach on 2026-10-21.
- Does a command reproduce behaviour contradicting a *sourced* expectation? **no**
  — no document says a click must reuse the tab. Today's behaviour is the
  designed one; this is an improvement, not an incident.
- Is the change to make already known, leaving only building it? **yes**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

These are questions for `research`, not blockers for intake:

- Which `order status changed…` payload fields are sure to be present
  (`order_group_id`, and whether `order_id` comes too).
- Whether a tab that the worker does not control (opened before the worker was
  registered) can still be focused and receive a message. Today's chat feature
  depends on this.
- How the existing tests load the worker file
  (`tests/public/firebaseMessagingSwTags.test.ts`), and which test files to
  extend for the message forwarding and for the order page.
- What the order page should do if it receives the refresh while a load is
  already running.

## Readiness Status

`READY`

- Justification: the owner asked on 2026-10-21 to start this work item, after
  agreeing with the investigation and the scope. The behaviour to build and the
  files involved are known. The open points above are repository facts for
  `research` to find.
