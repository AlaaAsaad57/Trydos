---
ticket: order-notification-reuse-tab
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Implement — order-notification-reuse-tab

> Record of what was actually built, following `plan.md`.

## Branch

- `ticket/order-notification-reuse-tab`, created from `origin/development` at
  `fcc32c99` (`implementation-started`).
- Local `development` was one commit ahead of the remote (`80c7a7e2`, a change
  to `docs/testing/stories-tester-guide.md` only, not pushed). The branch starts
  from the remote tip, so that unrelated commit is not part of this ticket.
  Local `development` was not touched.

## Changes made

- `utils/notificationEvents.ts` — added
  `REFRESH_ORDER_DETAILS_EVENT = "refresh-order-details"` (plan Step 1).
- `public/firebase-messaging-sw.js`
  - The `order status changed…` branch adds `refreshOrderTab: true` and
    `order_group_id` to the card data, next to `url` (Step 2).
  - `focusOrOpenOrderTab(notificationData, targetUrl, message)` posts the
    `message` it is given instead of a hard-coded `OPEN_DELIVERY_CHAT` object.
    The matching, the focus and the fallback are unchanged (Step 3).
  - The plain-click branch of `notificationclick` (Step 4):
    - `reuseTab` passes the same `OPEN_DELIVERY_CHAT` object as before;
    - `refreshOrderTab` passes `{ type: "REFRESH_ORDER_DETAILS", order_group_id }`;
    - the default path is now `event.waitUntil(clients.openWindow(targetUrl))`.
- `utils/NotificationHandler.ts` — `handleServiceWorkerMessage` forwards
  `REFRESH_ORDER_DETAILS` as `REFRESH_ORDER_DETAILS_EVENT` with
  `detail: { order_group_id }`. It does not call `handleNotification` and does
  not touch the store (Step 5).
- `components/setting/orders/OrderDetailsWrapper.tsx` — a new `useEffect` next
  to the delivery-chat listener. It calls `getOrderDetails()` when
  `String(detail.order_group_id) === String(order_group_id)`, with dependencies
  `[order_group_id, order_id, order_chat_id]` (Step 6). `getOrderDetails`
  itself is unchanged. It keeps the pack named in the URL (`?order_id=`)
  active. A pack the shopper tapped goes back to that pack, or to the first
  pack, exactly as on today's arrival refresh (review P-2).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008).

- `public/firebase-messaging-sw.js` — +31 / −12 lines (mark, helper parameter,
  click routing, `waitUntil`)
- `utils/notificationEvents.ts` — +2
- `utils/NotificationHandler.ts` — +12
- `components/setting/orders/OrderDetailsWrapper.tsx` — +18 / −1
- `tests/public/firebaseMessagingSwTags.test.ts` — +338
- `tests/utils/chatMuteNotifications.test.ts` — +46
- `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` — +62 / −1

No other file changed. No protected runtime path changed.

## Deviations from plan

- **Order of work.** Step 1 (the constant) was applied **before** the tests
  were run red, so the new page and handler cases fail because nothing
  listens, not because of a missing import. The constant changes no behaviour.
- **Worker test loader (review P-3, a note).** The click cases use one new
  loader, `loadWorker()`, inside the new `describe("a click on a notification")`
  block. The two existing describe-local loaders were left as they are,
  because changing tests outside the declared cases is not part of the plan. So
  the file now holds three similar loaders. No behaviour depends on this.
- **Review P-6 (a note).** The page's group-id check was not changed. With the
  only mount point (`app/(client)/[lang]/settings/orders/[id]/page.tsx`)
  `order_group_id` is the route param and is never `undefined`. No change
  outside the plan was needed.
- Otherwise none.

## Tests written

Red run on the old code: 2026-10-21, the three files below with only Step 1 in
place → **9 failed | 122 passed (131)**. Green run after Steps 2–6 → **131
passed (131)**. Command:
`npx vitest run --project unit tests/public/firebaseMessagingSwTags.test.ts tests/utils/chatMuteNotifications.test.ts tests/components/setting/orders/OrderDetailsWrapper.test.tsx`.

| AC    | Test file | Test case | Disposition carried out | Before → after |
|-------|-----------|-----------|-------------------------|----------------|
| AC-1  | `tests/public/firebaseMessagingSwTags.test.ts` | `a "%s" click focuses the open tab on that order and asks it to refresh` (`it.each`, tab on `/sy-ar/settings/orders/12`) | extend | red ("the tab already open on order 12 was not brought to the front") → green |
| AC-1  | `tests/utils/chatMuteNotifications.test.ts` | `forwards an order refresh request to the order page, and nothing else` (inside the last `describe`) | extend | red ("the worker's refresh request for order 12 did not reach the order page") → green |
| AC-2  | `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` | `reloads the order and shows the new status when the service worker asks this tab to refresh` | extend | red ("the refresh request did not load the order again … got 1 times") → green |
| AC-3  | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click opens a new tab when %s` — no tab; another order (99); the orders list; order 112 | extend | **regression guard** — green before and after (review P-1, Follow-up 2) |
| AC-4  | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click without an order group id reuses no tab` | extend | **regression guard** — green before and after (review P-1, Follow-up 2) |
| AC-5  | `tests/public/firebaseMessagingSwTags.test.ts` | the AC-1 case, run for `"order status changed"` and `"order status changed to shipped"` | extend | red (both rows) → green |
| AC-6  | `tests/public/firebaseMessagingSwTags.test.ts` | `with two tabs on the same order, only the most recent one is reused` | extend | red ("the tab used most recently was not brought to the front") → green |
| AC-7  | `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` | `ignores a refresh request for another order group` (another group, and no detail) | extend | green before and after — on the old code no listener exists, so it cannot be red; the red evidence for AC-7 is the handler row below |
| AC-7  | `tests/utils/chatMuteNotifications.test.ts` | the AC-1 handler case also checks `handleNotification` not called and `shouldUpdateOrders` still `0` | extend | red (case failed at its first check) → green |
| AC-8  | `tests/public/firebaseMessagingSwTags.test.ts` | `a delivery-chat click still focuses the order tab and opens the chat, or opens a new tab` | extend | **regression guard** — green before and after |
| AC-9  | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click opens a new tab when %s` — focusing it fails; sending it the refresh request fails. Also checks that `focus` / `postMessage` was tried first (review P-1, Follow-up 1) | extend | red ("the worker never tried the tab already open on order 12 (no focus call)" / "(no postMessage call)") → green |
| AC-10 | `tests/public/firebaseMessagingSwTags.test.ts` | `a "%s" click opens one new tab and keeps the worker alive until it is requested` — `order placed`, `product discount` | extend | red ("… (no event.waitUntil)", both rows) → green |
| AC-11 | `tests/public/firebaseMessagingSwTags.test.ts` | `a plain click on a call card opens no tab` | extend | **regression guard** — green before and after |

Every row was carried out in the file the plan declared. No new test file.

## Findings — confirmed bugs, out of scope

none

## Validation run during implementation

- `npx vitest run --project unit <the three files>` — old code: 9 failed /
  122 passed; new code: 131 passed.
- `npx eslint <the 7 changed files>` — exit 0, no errors.
- The full profile (`logic-change`: lint, typecheck, full unit suite) is left to
  `/verify`.
