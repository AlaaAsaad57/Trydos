---
ticket: order-notification-reuse-tab
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Spec — order-notification-reuse-tab

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Order status notification: reuse the open order tab and refresh it

## Business Goal

Today, every click on an order-status notification opens a new tab. A shopper
who already has that order open ends up with two tabs on the same order, and
the old tab may still show the old status. Reusing the open tab removes the
duplicate tab. Loading the order again makes sure the tab the shopper looks at
shows the current status.

## User Story

> As a shopper, when I click an "order status changed" notification while that
> order's details page is already open in a tab, I want that tab to come to the
> front with the new status, so that I do not end up with duplicate tabs or an
> old status on the screen.

## Functional Requirements

- **FR-1 — Reuse the same-order tab.** A click on an order-status notification
  brings to the front an open tab that shows the details page of the **same**
  order group. No new tab opens.
- **FR-2 — Refresh that tab.** The reused tab loads the order group's data
  again after the click, and shows what that load returns.
- **FR-3 — Otherwise, keep today's behaviour.** When no open tab shows the
  details page of that order group, the click opens a new tab at that order's
  details page, as it does today. This includes a tab on a different order, a
  tab on the orders list, and no tab at all.
- **FR-4 — No order group id, no reuse.** A notification that carries no order
  group id never reuses a tab. The click opens a new tab, as today.
- **FR-5 — One tab only.** When several tabs show the same order's details
  page, only the tab the shopper used most recently is focused and refreshed.
- **FR-6 — Order-specific refresh.** The refresh request names its order group.
  A details page for a different order group ignores it. The click must not
  raise the app-wide "orders changed" signal, so the orders list, the settings
  page and the seller dashboard do not react to the click.
- **FR-7 — Fall back on failure.** If the matching tab cannot be focused or
  cannot be sent the refresh request, a new tab opens instead, so the click is
  never lost.
- **FR-8 — The delivery-worker chat click is unchanged.** A click on a
  delivery-worker chat notification still focuses the same-order tab and
  opens the chat in place, or opens a new tab when there is none.
- **FR-9 — Other notifications are unchanged.** Every other notification type
  (order placed, product, boutique, category, cart, chat messages) still opens
  a new tab on click. A call notification still opens nothing on a plain click.
- **FR-10 — Keep the worker alive for a plain click.** When a click opens a new
  tab through the default path, the click event is held open until the new tab
  has been requested. Then the browser does not stop the worker first.

## Non-Functional Requirements

- **NFR-1 — No new requests.** The refresh uses the same order load the page
  already makes when it opens. It adds no new backend call or endpoint.
- **NFR-2 — Normal token handling.** A tab that was in the background for more
  than a minute holds an expired access token. Its refresh must go through the
  normal 401 → exchange → retry path, like any other load on that page.
- **NFR-3 — No new user-visible text.** The change adds no words to the screen,
  so no translation keys are needed.

## Constraints

- Scope agreed with the owner on 2026-10-21: reuse **only** a tab on the
  **same** order's details page.
- Names of any new message, event or field follow the stack-agnostic naming
  rule and match the style of the existing delivery-chat names.
- The proof is in the unit suite. The browser suite cannot click a system
  notification card.
- While the reused tab loads again, it may show its normal loading skeleton,
  the same one it shows on any other reload of its data (OQ-2).
- A second load straight after the load that ran when the push arrived is
  allowed (OQ-3). Both load the same order, and the later answer is shown.

## Edge Cases

- **The push arrived while the tab was hidden.** The tab may already have loaded
  fresh data when the push came in. The click still focuses it and loads again
  (FR-2).
- **The tab is on the same order but another pack** (`?order_id=` names a
  different pack). The tab is still reused. Its chosen pack stays the active
  pack after the refresh.
- **The tab is on the same order in another locale** (for example `sy-ar` when
  the notification link is `sy-en`). The tab is still reused (OQ-8).
- **The tab is on an order whose id ends with the same digits** (for example,
  order 112 when the notification is for order 12). It is **not** a match.
- **Chrome discarded the tab.** Focusing it reloads it, so it loads fresh data
  anyway. Nothing extra is required.
- **The plain `order status changed` type with no order group id.** FR-4
  applies: a new tab opens, as today.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Every notification type that **starts with** `order status changed`, including the plain type. Without an order group id, no tab is reused. | FR-1, FR-4 · AC-1, AC-5 |
| OQ-2 | The normal loading skeleton is allowed while the reused tab loads again. A quiet refresh that keeps the old content is not required. | Constraints · Out of Scope |
| OQ-3 | A second load right after the arrival load is allowed. No in-flight guard is required. | Constraints · Out of Scope |
| OQ-4 | The tab the shopper used most recently. This is the same rule the delivery-chat click uses today. | FR-5 · AC-6 |
| OQ-5 | **Split.** The rule: the delivery-chat click must keep working, and this ticket must prove that with its own test, because no test covers it today. **Deferred:** how the tab-finding code is shared between the two clicks is an approach question. | FR-8 · AC-8 · Open Questions (OQ-5) |
| OQ-6 | **Deferred.** The names of the new message and event, and where the event name is kept, are implementation. The rule they must follow is in Constraints. | Constraints · Open Questions (OQ-6) |
| OQ-7 | Only the default plain-click path. The `open_url` action case is not touched, because no notification defines that action. | FR-10 · AC-10 · Out of Scope |
| OQ-8 | Yes. A tab on the same order in another locale is reused. | Edge Cases · AC-1 |
| OQ-9 | No. The click sends no new PostHog event. | Out of Scope |

## Open Questions

- **OQ-5 (deferred to `/plan`)** — how the tab-finding and focusing code is
  shared between the order-status click and the delivery-chat click: one shared
  helper that is told which request to send, or a second helper.
- **OQ-6 (deferred to `/plan`)** — the names of the new worker-to-page message
  and the new page event, and where the event name is defined.

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | With one open tab on the details page of order group G (any locale), a click on an order-status notification for G focuses that tab, sends it a refresh request that names G, and opens no new tab. | FR-1 |
| AC-2  | When the details page of G receives a refresh request for G, it loads order group G again, and the page then shows the data from that new load (for example, the new status). | FR-2 |
| AC-3  | With no open tab on the details page of G — no tab at all, a tab on another order group, a tab on the orders list, or a tab on order 112 when G is 12 — the click opens one new tab at G's details page. | FR-3 |
| AC-4  | A click on an order-status notification that carries no order group id reuses no tab and opens one new tab. | FR-4 |
| AC-5  | Every type that starts with `order status changed` (for example `order status changed` and `order status changed to shipped`) gets the reuse behaviour of AC-1. | FR-1 |
| AC-6  | With two open tabs on the details page of G, only the tab used most recently is focused and gets the refresh request. The other gets nothing. | FR-5 |
| AC-7  | The details page of order group H ignores a refresh request for G: it makes no new load. The click does not raise the app-wide "orders changed" signal. | FR-6 |
| AC-8  | A click on a delivery-worker chat notification still focuses the same-order tab and sends it the open-chat request, and still opens a new tab when no such tab is open. | FR-8 |
| AC-9  | If focusing the matching tab fails, or sending it the request fails, the click opens one new tab at G's details page. | FR-7 |
| AC-10 | A click that takes the default path (for example, an `order placed` or product notification) opens one new tab, and the click event is held open until that tab has been requested. | FR-9, FR-10 |
| AC-11 | A plain click on a call notification still opens no tab. | FR-9 |

## Out of Scope

- `order placed` notifications. A click still opens a new tab at the orders
  list, even when a tab on the list is open.
- Reusing a tab that shows a different order, or the orders list, by moving it
  to this order.
- A quiet refresh that keeps the old content on screen (OQ-2).
- A guard against two loads running at the same time (OQ-3).
- The `open_url`, `any_other_action`, `reply` and `reject` action cases of the
  click handler (OQ-7).
- Any PostHog or Google Analytics event for the click (OQ-9).
- The in-app toast that a tab shows when the push arrives. It is unchanged.
- Any backend change, and any change to the push payload.
