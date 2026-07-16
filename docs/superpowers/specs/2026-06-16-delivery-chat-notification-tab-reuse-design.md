# Delivery-worker chat notification — tab reuse & reliable chat open

**Date:** 2026-06-16
**Status:** Approved design, pending implementation plan
**Scope:** Delivery-worker (private) chat push notifications only

## Problem

When a delivery worker sends a customer a message, the customer receives an FCM
notification. Two issues today:

- **Bug A — always opens a new tab.** Tapping the notification always spawns a
  brand-new browser tab, even when the customer already has the site open. It
  never focuses the existing tab.
- **Bug B — chat doesn't open in some cases.** Even when the order page loads,
  the chat with the delivery worker frequently fails to open on its own.

Desired behaviour: if a tab is already on **that order's detail path**, focus it
and open the chat **in place** (no reload). Otherwise open a new tab to the order
URL, where the chat opens on mount.

## Root causes

### Bug A — `notificationclick` always calls `openWindow`
`public/firebase-messaging-sw.js` → `notificationclick`: for a plain tap (no
action button) the only code that runs is an unconditional
`clients.openWindow(targetUrl)`. The `matchAll`/focus logic exists only inside
the `reply` / `any_other_action` action-button cases, which a plain tap never
triggers. So an existing tab is never reused.

### Bug B — wrong `order_id` passed to the auto-open
`components/setting/orders/OrderDetailsWrapper.tsx` opens the shipping chat on
mount inside `getOrderDetails` (the `order_chat_id` gate). It calls:

```js
safeGetChatWithShipping({
  is_return: order_item?.return_request_id,
  order_id: order_item?.return_request_id,   // undefined for non-return orders
  parent_order_id: order_item?.id,
});
```

The working chat-icon click path instead uses
`order_id: ActivePack?.return_request_id ?? ActivePack?.id` — i.e. it falls back
to the order id. The auto-open path is **missing the `?? order_item?.id`
fallback**, so:

- Return chats (out_for_return) → `return_request_id` set → `order_id`
  populated → chat opens.
- Normal delivery chats (out_for_delivery, no return) → `return_request_id`
  undefined → `order_id: undefined` sent to
  `/api/v1/channels/orderChatParticipant/get-recipient` → response fails →
  `getChatWithShipping` throws → caught and swallowed → chat silently never
  opens.

This is exactly the "in some cases" symptom: normal delivery chats are broken,
returns work.

## Design

Four files change. The chat-open status gate (open only for `out_for_delivery` /
`out_for_return`) is **kept as-is**.

### 1. `public/firebase-messaging-sw.js`

**Tag the delivery-chat notification.** In `onBackgroundMessage`, the
`is_private` branch (the "Delivery Worker" notification), add markers to the
notification `data` so the click handler can recognise it and message the tab
without parsing the URL:

```js
data: {
  url: buildUrl(
    `settings/orders/${orderGroupId}?order_id=${orderId}&chat_id=${chatId}`,
    localePrefix,
  ),
  reuseTab: true,
  order_group_id: orderGroupId,
  order_id: orderId,
  chat_id: chatId,
}
```
(`orderId`/`chatId` derived exactly as the current code does:
`order_id = parent_order_id ?? order_id`, `chat_id = order_id`.)

**Rework `notificationclick` for a plain tap (no `event.action`):**

- `callType` present → unchanged (call reply/reject action cases untouched).
- `reuseTab` present → `event.waitUntil(...)`:
  1. `clients.matchAll({ type: "window", includeUncontrolled: true })`
  2. keep same-origin tabs; find one whose URL path contains
     `/settings/orders/<order_group_id>`
  3. **found** → `client.focus()` then
     `client.postMessage({ type: "OPEN_DELIVERY_CHAT", order_group_id, order_id, chat_id })`.
     No navigate (avoids reload).
  4. **not found** → `clients.openWindow(targetUrl)` (new tab; mount logic opens
     the chat).
- anything else → unchanged `clients.openWindow(targetUrl)`.

`matchAll` returns window clients most-recently-focused first, so when several
tabs match, the first match is the most recently focused. Browsers lacking
reliable `focus`/`postMessage` fall through to `openWindow`.

### 2. `utils/notificationEvents.ts`

Add: `export const OPEN_DELIVERY_CHAT_EVENT = "open-delivery-chat";`

### 3. `utils/NotificationHandler.ts`

In `handleServiceWorkerMessage`, handle `message.type === "OPEN_DELIVERY_CHAT"`
by dispatching a window `CustomEvent(OPEN_DELIVERY_CHAT_EVENT, { detail: {
order_group_id, order_id, chat_id } })`. Mirrors the existing
`MARKET_NOTIFICATION_RECEIVED_EVENT` window-event pattern.

### 4. `components/setting/orders/OrderDetailsWrapper.tsx`

- **Extract** the chat-open lookup currently inline in `getOrderDetails` (find
  `order_item` by `chat_id`; apply the status gate; call
  `safeGetChatWithShipping`) into a small helper that reads current
  `orderData` / `returnData` state and accepts the target `chat_id`.
- **Fix Bug B** inside that helper — use the icon-click arguments:
  ```js
  safeGetChatWithShipping({
    order_id: order_item?.return_request_id ?? order_item?.id,
    parent_order_id: order_item?.id,
    is_return: order_item?.return_request_id,
  });
  ```
- Call the helper on mount (as today) **and** from a new `useEffect` that listens
  for `OPEN_DELIVERY_CHAT_EVENT`, gated on
  `detail.order_group_id === order_group_id`. Because this tab is already on the
  page, `orderData` is loaded, so the chat opens with no full-page fetch
  (serves Bug A's focus case).

## Data flow

```
FCM push (private message)
  └─ SW onBackgroundMessage → showNotification(data.reuseTab + ids)
       └─ user taps
            └─ SW notificationclick
                 ├─ tab on /settings/orders/<group_id> exists?
                 │     ├─ yes → focus + postMessage OPEN_DELIVERY_CHAT
                 │     │          └─ NotificationHandler → window CustomEvent
                 │     │               └─ OrderDetailsWrapper listener → open chat (no reload)
                 │     └─ no  → openWindow(orderUrl)
                 │                └─ page mounts → getOrderDetails → helper → open chat
                 └─ (non-delivery notifications unchanged)
```

## Out of scope / unchanged
- Foreground in-app toast path (`showChatNotification`).
- Call (voice/video) notification handling.
- All non-delivery notification types (orders, products, boutiques, …) keep the
  current new-tab behaviour.
- The chat-open status gate (`out_for_delivery` / `out_for_return`).

## Edge cases
- Multiple tabs on the same order path → only the most-recently-focused match is
  focused + messaged.
- Tab on the orders *list* (`/settings/orders`) but not this order's detail →
  no path match → new tab.
- `chat_id` from notification used to locate `order_item`; if not found, the
  status gate fails closed and the chat is not force-opened (same as today).
