---
ticket: order-notification-reuse-tab
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-10-21
links:
  clickup:
  github:
---

# Plan — order-notification-reuse-tab

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Extend the delivery-chat tab-reuse pattern that already exists, and do not
build a second one.

1. The worker marks the `order status changed…` card as "refresh the order
   tab", and copies its `order_group_id` into the card data.
2. On click, the worker uses the **same** `focusOrOpenOrderTab` helper the chat
   click uses. The caller now passes the message to post: the chat click passes
   `OPEN_DELIVERY_CHAT` (unchanged), and the order click passes
   `REFRESH_ORDER_DETAILS`.
3. The page's `ForegroundNotificationHandler` turns the new message into a new
   window event.
4. `OrderDetailsWrapper` listens for that event and calls its existing
   `getOrderDetails()` when the order group matches.

**Why this over the alternatives:**
- A second helper would copy the tab-matching code (the `/settings/orders/<id>`
  match, the most-recent-first rule, the fallback). Two copies could then drift
  apart.
- A bump of the global `shouldUpdateOrders` counter would need no new event.
  But it also triggers `RouterRefresh`, the orders list and the seller dashboard
  (`research.md` §4), and FR-6 forbids that.
- Moving another tab to this order with `client.navigate()` is out of scope.

## Answers to deferred questions

- **OQ-5 — one shared helper.** `focusOrOpenOrderTab(notificationData,
  targetUrl, message)` takes the message to post as a third argument. Matching,
  focusing and the fallback stay exactly as they are. The chat call site passes
  the same `{ type: "OPEN_DELIVERY_CHAT", order_group_id, order_id, chat_id }`
  object the helper builds today, so the chat message does not change. AC-8 adds
  a test for the chat click, which has none today.
- **OQ-6 — names.**
  - Worker → page message type: `REFRESH_ORDER_DETAILS`, with the payload
    `{ type, order_group_id }`. This follows the `OPEN_DELIVERY_CHAT` style.
  - Card-data marker: `refreshOrderTab: true`. This follows the `reuseTab`
    style.
  - Window event: `REFRESH_ORDER_DETAILS_EVENT = "refresh-order-details"`,
    kept next to `OPEN_DELIVERY_CHAT_EVENT` in `utils/notificationEvents.ts`.
  - No name says anything about the technology behind it.

## Steps

1. **`utils/notificationEvents.ts`** — add
   `export const REFRESH_ORDER_DETAILS_EVENT = "refresh-order-details";`.
2. **`public/firebase-messaging-sw.js`, the `order status changed…` branch
   (lines 455–475)** — add `refreshOrderTab: true` and
   `order_group_id: <body>.order_group_id` to `notificationOptions.data`, next to
   `url`. Keep the URL, the body, the title and the tag as they are. A missing
   `order_group_id` stays `undefined`, and the helper already treats
   `groupId == null` as "no match" (AC-4).
3. **Same file, `focusOrOpenOrderTab` (lines 705–742)** — add the parameter
   `message`, and post it in place of the hard-coded `OPEN_DELIVERY_CHAT` object.
   Update the comment above the function so it describes both callers.
4. **Same file, `notificationclick` (lines 751–758)** — the plain-click branch
   becomes:
   - `reuseTab` → `event.waitUntil(focusOrOpenOrderTab(data, url, { type: "OPEN_DELIVERY_CHAT", order_group_id, order_id, chat_id }))`
     (the same message as today);
   - else `refreshOrderTab` →
     `event.waitUntil(focusOrOpenOrderTab(data, url, { type: "REFRESH_ORDER_DETAILS", order_group_id }))`;
   - else → `event.waitUntil(clients.openWindow(targetUrl))` (FR-10; today line
     756 has no `waitUntil`).
   - The `callType` guard and the `switch (event.action)` block do not change.
5. **`utils/NotificationHandler.ts`, `handleServiceWorkerMessage` (lines
   116–136)** — add a branch for `message.type === "REFRESH_ORDER_DETAILS"`. It
   dispatches `new CustomEvent(REFRESH_ORDER_DETAILS_EVENT, { detail: {
   order_group_id } })`, in the same shape as the `OPEN_DELIVERY_CHAT` branch. It
   does **not** call `handleNotification` and does **not** touch the store
   (FR-6). Import the constant next to `OPEN_DELIVERY_CHAT_EVENT` (line 23).
6. **`components/setting/orders/OrderDetailsWrapper.tsx`** — add one `useEffect`
   next to the delivery-chat listener (lines 418–428):
   - listen for `REFRESH_ORDER_DETAILS_EVENT`;
   - return early unless `String(detail.order_group_id) === String(order_group_id)`;
   - otherwise call `getOrderDetails()`;
   - remove the listener on cleanup.

   Dependencies: `[order_group_id, order_id, order_chat_id]`, because those are
   the props `getOrderDetails` reads. Import the constant next to
   `OPEN_DELIVERY_CHAT_EVENT` (line 46). `getOrderDetails` itself does not change.
   It already keeps the `order_id` pack active, and it ends with
   `setShouldUpdateOrders(0)`, which sets the counter to 0 and never raises it.
7. Write the tests in the **Tests** table. Run each new case against the old
   code first and see it red, then make the change and see it green. AC-8 and
   AC-11 are the exceptions: they guard behaviour that already works, so they are
   green before and after.

## Files to change

- `public/firebase-messaging-sw.js` — mark the order-status card; give
  `focusOrOpenOrderTab` a `message` parameter; route the plain click; wrap the
  default `openWindow` in `event.waitUntil`.
- `utils/notificationEvents.ts` — add `REFRESH_ORDER_DETAILS_EVENT`.
- `utils/NotificationHandler.ts` — forward `REFRESH_ORDER_DETAILS` as the window
  event.
- `components/setting/orders/OrderDetailsWrapper.tsx` — listen for the event
  and reload the matching order group.
- `tests/public/firebaseMessagingSwTags.test.ts` — **extend**: a new `describe`
  block for the click handler (AC-1, AC-3–AC-6, AC-8–AC-11).
- `tests/utils/chatMuteNotifications.test.ts` — **extend**: the last
  `describe` block ("foreground handler — service worker messages") gets the
  forwarding case (AC-1 page side, AC-7 store side).
- `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` — **extend**:
  the refresh-event cases (AC-2, AC-7 page side).

No protected runtime path is in this list.

## Integration surface

- **Components / shared config touched:**
  - `focusOrOpenOrderTab` and the plain-click branch of `notificationclick` in
    the service worker. They are shared with the delivery-worker chat click.
  - `ForegroundNotificationHandler.handleServiceWorkerMessage`, the single
    listener for every worker → page message (`FCM_NOTIFICATION`,
    `OPEN_DELIVERY_CHAT`, and now `REFRESH_ORDER_DETAILS`).
  - `utils/notificationEvents.ts`, shared event-name constants.
  - `OrderDetailsWrapper.getOrderDetails`, also run on mount, on the global
    `shouldUpdateOrders` signal, and from the menus' "update" callbacks.
- **Who else depends on them:**
  - The delivery-worker chat click (ticketed in
    `docs/superpowers/plans/2026-06-16-delivery-chat-notification-tab-reuse.md`).
    It uses the same helper and expects `OPEN_DELIVERY_CHAT` with
    `order_group_id`, `order_id`, `chat_id`.
  - Every push type: they all pass through the plain-click branch that step 4
    rewrites. Product, boutique, category, cart, order-placed and chat cards
    take the default path. Call cards are skipped by the `callType` guard.
  - The arrival path (`sendToForeground` → `FCM_NOTIFICATION` →
    `handleMarketEvent` → `shouldUpdateOrders`) is **not** changed. It keeps
    refreshing tabs when a push arrives.
- **Overlapping flows:**
  - Arrival refresh and click refresh both call `getOrderDetails()` on the same
    page. Two loads close together are allowed (spec Constraints, OQ-3).
  - `getOrderDetails()` calls `openShippingChatForChatId(order_chat_id)`. If
    the tab's URL still carries `?chat_id=`, a refresh tries to open the chat
    again. The existing `shouldUpdateOrders` refresh behaves the same way today,
    and `getChatWithShipping` clears the query after it opens the chat. Nothing
    new comes from this ticket.
- **Ordering / lockstep dependencies:**
  - The worker and the page change in one release. The worker change reaches a
    browser only when the browser updates the worker (`skipWaiting` +
    `clients.claim`, lines 19–40). Until then, the old worker keeps opening a new
    tab, which is safe.
  - If a new worker meets a page bundle that is still old, the page ignores the
    unknown `REFRESH_ORDER_DETAILS` message: `handleServiceWorkerMessage` has no
    `else`. The tab is still focused, but it does not refresh. Safe, and the
    arrival refresh still runs.
  - No `CACHE_VERSION` bump is needed: the worker caches nothing that this
    change touches.
- **What breaks if this is wrong:**
  - A wrong `message` argument at the chat call site → the chat tab is focused
    but the chat does not open. AC-8 catches this.
  - A missing `waitUntil`, or a branch that does not return → a click opens
    nothing on some browsers. AC-10 catches this.
  - A forwarding branch that bumps the store → the settings page runs
    `router.refresh()` and the orders list reloads on every click. AC-7 catches
    this.
  - A page that skips the group-id check → every open order tab reloads on any
    order click. AC-7 catches this.

## Tests

Search done in the layout `research.md` recorded: `tests/public/`,
`tests/utils/`, `tests/components/setting/orders/`, plus a repo-wide
`grep -rn "notificationclick\|focusOrOpenOrderTab\|REFRESH_ORDER" tests` (no
hits).

**How the worker cases run.** Follow `loadBackgroundHandler` in
`tests/public/firebaseMessagingSwTags.test.ts`: run the whole worker through
`new Function("self", "importScripts", "firebase", "caches", "clients", source)`.
This time `self.addEventListener` keeps the `notificationclick` listener. The
fake `clients` has a list of windows that the test can change; each window has
`url`, `focus: vi.fn()` and `postMessage: vi.fn()`. `clients.openWindow` is
`vi.fn()`. Each case:
1. runs the background handler on a real `market` push, with no windows open,
   and takes the `data` the worker gave to `showNotification`;
2. sets the windows for the case;
3. fires the click with `{ notification: { data, close }, action: "",
   waitUntil }`;
4. awaits every promise passed to `waitUntil`.

So the click runs on the card data the worker really builds, not on data the
test made up.

| AC    | Existing coverage found | Disposition | Test file | Test case / name |
|-------|-------------------------|-------------|-----------|------------------|
| AC-1  | none — searched the three folders above. `chatMuteNotifications.test.ts::"listens to the service worker and forwards pushes and delivery-chat requests"` covers only `OPEN_DELIVERY_CHAT` | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click focuses the open tab on that order and asks it to refresh` — one window on `/sy-ar/settings/orders/12` (another locale). Checks: `focus` called; `postMessage` called with `{ type: "REFRESH_ORDER_DETAILS", order_group_id: 12 }`; `openWindow` not called. Each check has its own message. |
| AC-1  | (as above) | extend | `tests/utils/chatMuteNotifications.test.ts` | `forwards an order refresh request to the order page` — inside the last `describe`. The listener gets `{ type: "REFRESH_ORDER_DETAILS", order_group_id: 12 }`. Checks: `REFRESH_ORDER_DETAILS_EVENT` fired with `detail.order_group_id === 12`. |
| AC-2  | `OrderDetailsWrapper.test.tsx::"refetches when the store asks for an update"` covers reload by the store signal only | extend | `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` | `reloads the order and shows the new status when the service worker asks this tab to refresh` — first load answers a pending group status, second load answers `Shipped`. Dispatch the event for `"test-order-group"`. Checks: `Order.getOrderDetails` called a 2nd time with `"test-order-group"`; the page then shows `Shipped`. |
| AC-3  | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click opens a new tab when no tab shows that order` — `it.each` over: no windows; `/sy-en/settings/orders/99`; `/sy-en/settings/orders`; `/sy-en/settings/orders/112` (push for 12). Checks per row: `openWindow` called once with `https://trydos.test/settings/orders/12`; no window was focused or got a refresh message. |
| AC-4  | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click without an order group id reuses no tab` — push `{ type: "order status changed" }` with no id; one window on `/sy-en/settings/orders/undefined`. Checks: no focus, no message; `openWindow` called once. |
| AC-5  | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | Same case as AC-1, run with `it.each` over `"order status changed"` and `"order status changed to shipped"` (both with `order_group_id: 12`). |
| AC-6  | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `with two tabs on the same order, only the most recent one is reused` — windows `[recent, older]`, both on `/sy-en/settings/orders/12`. Checks: `recent` focused and got the refresh message; `older` not focused and got no message. |
| AC-7  | none — searched as above | extend | `tests/components/setting/orders/OrderDetailsWrapper.test.tsx` | `ignores a refresh request for another order group` — dispatch the event for `"other-group"`, and once with no detail. Checks: `Order.getOrderDetails` still called once (the mount load). |
| AC-7  | none — searched as above | extend | `tests/utils/chatMuteNotifications.test.ts` | Same case as the AC-1 row in this file. Also checks: `handleNotification` not called for the refresh message, and the store's `shouldUpdateOrders` is still `0`. |
| AC-8  | none — searched as above (no test covers the chat click) | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `a delivery-chat click still focuses the order tab and opens the chat, or opens a new tab` — real private-chat push (`is_private: true`, `order_group_id: 12`, `order_id: 5`). With a window on `/sy-en/settings/orders/12`: focused, and got `{ type: "OPEN_DELIVERY_CHAT", order_group_id: 12, order_id: 5, chat_id: 5 }`. With no window: `openWindow` called once. Regression guard: green before and after. |
| AC-9  | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `an order-status click opens a new tab when the open tab cannot be focused` — `it.each` over a window whose `focus` rejects and one whose `postMessage` throws. Checks: `openWindow` called once with the order URL. |
| AC-10 | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `a default click opens one new tab and keeps the worker alive until it is requested` — `it.each` over an `order placed` push and a `product discount` push, each with a window on that card's URL open. Checks: `openWindow` called once with the card URL; `waitUntil` got the promise that `openWindow` returned. Red before the change (line 756 has no `waitUntil`). |
| AC-11 | none — searched as above | extend | `tests/public/firebaseMessagingSwTags.test.ts` | `a plain click on a call card opens no tab` — real `VoiceCallEvent` push. Checks: `openWindow` not called, no window focused. Regression guard: green before and after. |

Every test file above is also listed under **Files to change**. There is no new
test file.

## Validation strategy

- Validation profile: `logic-change`
- Profile source: `pre-existing` (`.claude/project-config.yaml` already carries
  `logic-change` = `lint` + `typecheck` + `unit-tests`; this ticket does not
  edit the file).
- `/verify` runs the **Tests** table through `unit-tests` (`pnpm test:run`, that
  is `vitest run --project unit`, non-writing). It also runs `lint` and
  `typecheck`.
- Red-first evidence per row goes in `implement.md`: the case, the red run on the
  old code, and the green run after. AC-8 and AC-11 are recorded as green
  before and after, as regression guards.
- The full unit suite often has one random flaky failure (memory note). Any red
  case that this ticket did not touch is re-run alone before anyone judges it.
- Manual check (not a gate): in Chrome, with `/sy-en/settings/orders/<id>`
  open in a background tab, trigger a status change on staging, click the
  system card, and see the same tab come to the front and reload.

## Plan ↔ REQ / AC traceability

| AC    | FR          | Step(s) |
|-------|-------------|---------|
| AC-1  | FR-1        | 2, 3, 4, 5 |
| AC-2  | FR-2        | 1, 6 |
| AC-3  | FR-3        | 3 (unchanged matching), 4 |
| AC-4  | FR-4        | 2, 3 |
| AC-5  | FR-1        | 2 (`startsWith` branch) |
| AC-6  | FR-5        | 3 (unchanged first-match rule) |
| AC-7  | FR-6        | 5, 6 |
| AC-8  | FR-8        | 3, 4 |
| AC-9  | FR-7        | 3 (unchanged fallback) |
| AC-10 | FR-9, FR-10 | 4 |
| AC-11 | FR-9        | 4 (unchanged `callType` guard) |

Every `OQ-n` from `research.md` is closed: OQ-1–4 and OQ-7–9 in `spec.md`,
OQ-5 and OQ-6 above.

## Rollback

- One revert of the change commit puts the old worker, handler and page back.
  Browsers pick up the reverted worker on their next worker update check. Until
  then, a browser that already runs the new worker meets a page that ignores
  `REFRESH_ORDER_DETAILS`: the tab is focused but does not refresh. That is safe,
  and the arrival refresh still runs.
- No data, backend, config or translation changes, so there is nothing else to
  undo.

## Out of scope

- `order placed` clicks, and reusing a tab on the orders list.
- Moving a tab that shows another order to this order (`client.navigate()`).
- A quiet refresh without the skeleton, and a guard against two loads at once.
- The `open_url`, `any_other_action`, `reply` and `reject` action cases.
- Any PostHog or Google Analytics event.
- The arrival path (`sendToForeground`, `handleMarketEvent`) and its in-app
  toast.
- Any change to the push payload or the backend.
