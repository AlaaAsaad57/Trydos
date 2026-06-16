# Delivery-worker Chat Notification — Tab Reuse & Reliable Chat Open Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a delivery-worker chat notification is tapped, focus an already-open tab on that order's page and open the chat in place (no reload) — otherwise open a new tab — and fix the bug where the chat fails to auto-open for normal (non-return) delivery orders.

**Architecture:** The service worker (`firebase-messaging-sw.js`) tags the delivery-chat notification and, on click, either focuses an existing order tab and `postMessage`s it to open the chat, or opens a new tab. A client-side listener (`NotificationHandler.ts`) turns that message into a window `CustomEvent`, which `OrderDetailsWrapper.tsx` listens for to open the chat without reloading. The same shared helper that opens the chat is fixed to pass the correct `order_id`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, Firebase Cloud Messaging service worker (plain JS), Web `postMessage` + `CustomEvent`.

**Testing note:** This repo has **no test suite** and CLAUDE.md forbids adding test files. Verification for every task is: `pnpm lint` (and a `pnpm build` type-check at the end) plus the manual-test steps in the final task. No test files are created.

**Spec:** `docs/superpowers/specs/2026-06-16-delivery-chat-notification-tab-reuse-design.md`

---

## File Structure

- **Modify** `utils/notificationEvents.ts` — add the `OPEN_DELIVERY_CHAT_EVENT` constant. Single responsibility: shared event-name constants.
- **Modify** `public/firebase-messaging-sw.js` — tag the delivery-chat notification with `reuseTab` + ids; add a `focusOrOpenOrderTab` helper; branch the `notificationclick` plain-tap path.
- **Modify** `utils/NotificationHandler.ts` — translate the `OPEN_DELIVERY_CHAT` SW message into the window `CustomEvent`.
- **Modify** `components/setting/orders/OrderDetailsWrapper.tsx` — extract a `openShippingChatForChatId` helper (with the corrected `order_id`), call it on mount and from an `OPEN_DELIVERY_CHAT_EVENT` listener.

Order of work: constant first (no dependents), then the SW + client message plumbing, then the component wiring + bug fix, then end-to-end verification.

---

### Task 1: Add the shared event-name constant

**Files:**
- Modify: `utils/notificationEvents.ts`

- [ ] **Step 1: Add the constant**

The file currently contains only:

```ts
export const MARKET_NOTIFICATION_RECEIVED_EVENT =
  "market-notification-received";
```

Add a second export below it so the whole file reads:

```ts
export const MARKET_NOTIFICATION_RECEIVED_EVENT =
  "market-notification-received";

export const OPEN_DELIVERY_CHAT_EVENT = "open-delivery-chat";
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: no new errors referencing `utils/notificationEvents.ts`.

- [ ] **Step 3: Commit**

```bash
git add utils/notificationEvents.ts
git commit -m "feat: add OPEN_DELIVERY_CHAT_EVENT constant"
```

---

### Task 2: Tag the delivery-chat notification in the service worker

**Files:**
- Modify: `public/firebase-messaging-sw.js` (the `is_private` branch inside `messaging.onBackgroundMessage`, currently ~lines 408–423)

- [ ] **Step 1: Replace the `is_private` notification block**

Find this exact block:

```js
      if (JSON.parse(payload.data.data)?.is_private) {
        notificationTitle = "Deleivery Worker";
        notificationOptions = {
          body: "there is new message from Deleivery Worker",
          data: {
            url: buildUrl(
              `settings/orders/${
                JSON.parse(payload?.data.data)?.order_group_id
              }?order_id=${
                JSON.parse(payload?.data?.data).parent_order_id ??
                JSON.parse(payload?.data?.data).order_id
              }&chat_id=${JSON.parse(payload?.data?.data)?.order_id}`,
              localePrefix,
            ),
          },
        };
      } else if (
```

Replace it with (compute the ids once, then attach them to `data` alongside `reuseTab`):

```js
      if (JSON.parse(payload.data.data)?.is_private) {
        const privateData = JSON.parse(payload.data.data);
        const orderGroupId = privateData?.order_group_id;
        const orderId = privateData?.parent_order_id ?? privateData?.order_id;
        const chatId = privateData?.order_id;
        notificationTitle = "Deleivery Worker";
        notificationOptions = {
          body: "there is new message from Deleivery Worker",
          data: {
            url: buildUrl(
              `settings/orders/${orderGroupId}?order_id=${orderId}&chat_id=${chatId}`,
              localePrefix,
            ),
            // Markers consumed by the notificationclick handler to reuse an
            // already-open tab on this order's page instead of opening a new one.
            reuseTab: true,
            order_group_id: orderGroupId,
            order_id: orderId,
            chat_id: chatId,
          },
        };
      } else if (
```

Note: the resulting `url` string is identical to before — only the surrounding `data` gains `reuseTab`/ids and the inline `JSON.parse` calls are hoisted into `privateData`.

- [ ] **Step 2: Verify the file still parses**

Run: `node --check public/firebase-messaging-sw.js`
Expected: no output (exit 0). Any syntax error prints here.

- [ ] **Step 3: Commit**

```bash
git add public/firebase-messaging-sw.js
git commit -m "feat: tag delivery-worker chat notification for tab reuse"
```

---

### Task 3: Add the focus-or-open helper and branch the click handler

**Files:**
- Modify: `public/firebase-messaging-sw.js` (add helper above the `notificationclick` listener ~line 545; edit the default-tap block ~lines 551–554)

- [ ] **Step 1: Add the `focusOrOpenOrderTab` helper**

Immediately above this line (currently ~line 545):

```js
// Notification click handler - works for background notifications only
self.addEventListener("notificationclick", function (event) {
```

Insert this helper:

```js
// Reuse an already-open tab that is on this order's detail page and ask it to
// open the delivery-worker chat in place (no reload). Falls back to opening a
// new tab when no matching tab exists.
async function focusOrOpenOrderTab(notificationData, targetUrl) {
  const baseUrl = self.location.origin;
  const groupId = notificationData.order_group_id;
  try {
    const windowClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    // matchAll returns window clients most-recently-focused first, so the first
    // match is the tab the user used most recently.
    const match = windowClients.find((client) => {
      if (!client.url.startsWith(baseUrl) || groupId == null) return false;
      try {
        const path = new URL(client.url).pathname;
        return path.endsWith(`/settings/orders/${groupId}`);
      } catch (e) {
        return false;
      }
    });
    if (match) {
      if ("focus" in match) {
        await match.focus();
      }
      match.postMessage({
        type: "OPEN_DELIVERY_CHAT",
        order_group_id: notificationData.order_group_id,
        order_id: notificationData.order_id,
        chat_id: notificationData.chat_id,
      });
      return;
    }
  } catch (e) {
    // Fall through to opening a new tab.
  }
  if (clients.openWindow) {
    await clients.openWindow(targetUrl);
  }
}
```

- [ ] **Step 2: Branch the default-tap behavior**

Inside the `notificationclick` listener, find this block (currently ~lines 551–554):

```js
  // Only open the link by default if this is NOT a call notification
  if (!notificationData.callType) {
    clients.openWindow(targetUrl); // Android needs explicit close.
  }
```

Replace it with:

```js
  // Only open the link by default if this is NOT a call notification
  if (!notificationData.callType) {
    if (notificationData.reuseTab) {
      // Delivery-worker chat: reuse an open order tab, else open a new one.
      event.waitUntil(focusOrOpenOrderTab(notificationData, targetUrl));
    } else {
      clients.openWindow(targetUrl); // Android needs explicit close.
    }
  }
```

Leave the `switch (event.action)` block (reply / reject / open_url / any_other_action) below it unchanged.

- [ ] **Step 3: Verify the file still parses**

Run: `node --check public/firebase-messaging-sw.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add public/firebase-messaging-sw.js
git commit -m "feat: focus existing order tab on delivery-chat notification tap"
```

---

### Task 4: Forward the SW message as a window event

**Files:**
- Modify: `utils/NotificationHandler.ts` (import ~line 20; `handleServiceWorkerMessage` ~lines 89–94)

- [ ] **Step 1: Extend the notificationEvents import**

Find (currently ~line 20):

```ts
import { MARKET_NOTIFICATION_RECEIVED_EVENT } from "./notificationEvents";
```

Replace with:

```ts
import {
  MARKET_NOTIFICATION_RECEIVED_EVENT,
  OPEN_DELIVERY_CHAT_EVENT,
} from "./notificationEvents";
```

- [ ] **Step 2: Handle the OPEN_DELIVERY_CHAT message**

Find this method (currently ~lines 89–94):

```ts
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const message: ServiceWorkerMessage = event.data;
    if (message.type === "FCM_NOTIFICATION") {
      this.handleNotification(() => {}, message.payload);
    }
  }
```

Replace with:

```ts
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const message: any = event.data;
    if (!message) return;
    if (message.type === "FCM_NOTIFICATION") {
      this.handleNotification(() => {}, message.payload);
    } else if (message.type === "OPEN_DELIVERY_CHAT") {
      // Sent by the service worker when it focused an already-open order tab.
      // Re-broadcast as a window event the order page listens for.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(OPEN_DELIVERY_CHAT_EVENT, {
            detail: {
              order_group_id: message.order_group_id,
              order_id: message.order_id,
              chat_id: message.chat_id,
            },
          }),
        );
      }
    }
  }
```

(The `message` type is widened to `any` because the SW now sends two distinct message shapes; the `ServiceWorkerMessage` interface still documents the FCM shape.)

- [ ] **Step 3: Verify lint passes**

Run: `pnpm lint`
Expected: no new errors referencing `utils/NotificationHandler.ts`.

- [ ] **Step 4: Commit**

```bash
git add utils/NotificationHandler.ts
git commit -m "feat: forward OPEN_DELIVERY_CHAT sw message to window event"
```

---

### Task 5: Open the chat in place + fix the non-return order_id bug

**Files:**
- Modify: `components/setting/orders/OrderDetailsWrapper.tsx`
  - import (~line 40 area)
  - the chat-open gate inside `getOrderDetails` (~lines 154–168)
  - add helper + `useEffect` after `safeGetChatWithShipping` (~line 355)

- [ ] **Step 1: Add the notificationEvents import**

After this line (currently ~line 40):

```ts
import { REQUESTS_DATA } from "utils/Requests";
```

Add:

```ts
import { OPEN_DELIVERY_CHAT_EVENT } from "utils/notificationEvents";
```

- [ ] **Step 2: Replace the inline chat-open gate in `getOrderDetails`**

Find this block (currently ~lines 154–168):

```js
      if (
        order_chat_id &&
        (order_item?.order_status?.value === "out_for_delivery" ||
          returnRequests?.return_requests_data?.find(
            (return_item) =>
              String(return_item.order_id) === String(order_id) ||
              String(order_item?.return_request_id) === String(order_chat_id),
          )?.status?.value === "out_for_return")
      ) {
        safeGetChatWithShipping({
          is_return: order_item?.return_request_id,
          order_id: order_item?.return_request_id,
          parent_order_id: order_item?.id,
        });
      }
```

Replace with a call to the shared helper, passing the freshly-fetched data so it
does not depend on not-yet-committed state:

```js
      openShippingChatForChatId(order_chat_id, {
        orderData: data,
        returnData: returnRequests,
      });
```

- [ ] **Step 3: Add the helper and the event listener**

Find the end of `safeGetChatWithShipping` (currently ~lines 345–355):

```js
  const safeGetChatWithShipping = async ({
    order_id,
    parent_order_id,
    is_return,
  }) => {
    await getChatWithShipping({
      order_id,
      parent_order_id,
      is_return,
    });
  };
```

Immediately after it, add the helper and the listener. Note the corrected
`order_id: order_item?.return_request_id ?? order_item?.id` — this is the Bug B
fix (matches the working chat-icon click path):

```js
  // Shared chat-open logic used both on mount (with freshly-fetched data) and
  // when an open tab is asked to show the chat via OPEN_DELIVERY_CHAT_EVENT
  // (reading current state). The status gate is unchanged: open only for
  // out_for_delivery / out_for_return.
  const openShippingChatForChatId = (chatId, source) => {
    if (!chatId) return;
    const data = source?.orderData ?? orderData;
    const returns = source?.returnData ?? returnData;
    const order_item = data?.find(
      (order) =>
        String(order.id) === String(chatId) ||
        String(order.return_request_id) === String(chatId),
    );
    if (!order_item) return;
    const isOutForDelivery =
      order_item?.order_status?.value === "out_for_delivery";
    const isOutForReturn =
      returns?.return_requests_data?.find(
        (return_item) =>
          String(return_item.order_id) === String(order_id) ||
          String(order_item?.return_request_id) === String(chatId),
      )?.status?.value === "out_for_return";
    if (isOutForDelivery || isOutForReturn) {
      safeGetChatWithShipping({
        order_id: order_item?.return_request_id ?? order_item?.id,
        parent_order_id: order_item?.id,
        is_return: order_item?.return_request_id,
      });
    }
  };

  // When the service worker focuses this already-open tab for a delivery-worker
  // message, open the chat in place (no reload).
  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      if (String(detail.order_group_id) !== String(order_group_id)) return;
      openShippingChatForChatId(detail.chat_id);
    };
    window.addEventListener(OPEN_DELIVERY_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_DELIVERY_CHAT_EVENT, handler);
  }, [orderData, returnData, order_id, order_group_id]);
```

- [ ] **Step 4: Verify lint and types**

Run: `pnpm lint`
Expected: no new errors referencing `OrderDetailsWrapper.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/setting/orders/OrderDetailsWrapper.tsx
git commit -m "fix: open delivery chat in place and use correct order_id fallback"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole app**

Run: `pnpm build`
Expected: build completes without TypeScript errors in the four changed files.

- [ ] **Step 2: Manual test — Bug B (chat auto-opens for a normal delivery)**

1. Have a test order in `out_for_delivery` status with a delivery-worker chat.
2. Open the order URL directly in a fresh tab:
   `/<locale>/settings/orders/<group_id>?order_id=<id>&chat_id=<id>`.
3. Expected: the ChatWidget opens automatically on load (previously it did not
   for non-return orders).

- [ ] **Step 3: Manual test — Bug A, focus path (same order tab open)**

1. Open the same order's detail page in a tab; close the chat; switch to another
   app/tab so the page is backgrounded.
2. Trigger a delivery-worker message so an FCM background notification appears.
3. Tap the notification.
4. Expected: the existing tab is focused (no new tab) and the chat opens without
   a full reload.

- [ ] **Step 4: Manual test — Bug A, new-tab fallback (no matching tab)**

1. Ensure no tab is on that order's detail page (e.g. only the home page open,
   or no tab at all).
2. Trigger a delivery-worker message and tap the notification.
3. Expected: a new tab opens at the order URL and the chat opens on mount.

- [ ] **Step 5: Manual test — other notifications unchanged**

1. Trigger a non-delivery notification (e.g. order status changed / product).
2. Tap it.
3. Expected: behaves exactly as before (opens a new tab via `openWindow`).

- [ ] **Step 6: Final commit (if any doc/state tidy-up is needed)**

```bash
git status
# If nothing to commit, this task is complete.
```

---

## Self-Review

**Spec coverage:**
- Bug A new-tab → Tasks 2–5 (tag, focus helper, message forward, in-place open). ✅
- Bug B order_id fallback → Task 5 Step 3 (`?? order_item?.id`). ✅
- Status gate kept as-is → Task 5 helper preserves the `out_for_delivery` /
  `out_for_return` conditions. ✅
- Non-delivery notifications unchanged → Task 3 Step 2 keeps the `else`
  `openWindow` branch; verified in Task 6 Step 5. ✅
- Path-match on `/settings/orders/<group_id>` (not the list) → Task 3 helper uses
  `pathname.endsWith`. ✅

**Placeholder scan:** No TBD/TODO/"handle errors"; every code step shows full code.

**Type/name consistency:** `OPEN_DELIVERY_CHAT_EVENT` defined in Task 1, imported in
Tasks 4 & 5. SW message `type: "OPEN_DELIVERY_CHAT"` sent in Task 3, matched in
Task 4. `focusOrOpenOrderTab` defined and called in Task 3.
`openShippingChatForChatId(chatId, source?)` signature consistent across its
definition (Task 5 Step 3) and both call sites (Task 5 Step 2 mount call with
`source`, listener call without). `reuseTab` / `order_group_id` / `order_id` /
`chat_id` keys set in Task 2 and read in Task 3.
