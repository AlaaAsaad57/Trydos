# CO-24 — Order Chat

| | |
|---|---|
| **Feature ID** | CO-24 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/orders/OrderDetailsWrapper.tsx`, `components/settings/OrderChatIcon.tsx`, `components/Chat/ChatWidget.tsx`, `services/chat.ts` |

---

## What it is

A **chat thread tied to a specific order**, letting the shopper message the **delivery worker** while
the order is out for delivery (or a return is out for pickup). It is a focused delivery-support chat,
not a general seller chat.

## Where it appears

On the order detail page (CO-16): a **"chat with delivery worker" icon** next to the order items when
the order is in the right state, and it can **auto-open** when reached from a chat push/notification
(`?order_chat_id=…`).

## Who uses it

Shoppers with an order out for delivery, or a return out for pickup.

## How it works (verified behaviour)

- **Delivery-worker only.** The thread is between the **customer and the delivery worker** — the seller
  is never a participant. The worker's identity is **masked** (name shown as `"Delivery Worker"`,
  phone blanked).
- **State-gated.** The chat icon only appears (and auto-open only fires) for orders that are
  **`out_for_delivery`**, or returns that are **`out_for_return`**.
- **Tied to the order.** Opening sends the `order_id` (or `return_request_id` + `parent_order_id` for
  returns) to fetch/create the recipient channel; an existing channel opens directly, otherwise a
  placeholder channel is synthesized.
- **Notification dot** on the icon clears when the chat is opened; the `order_chat_id` URL param is
  cleared too.
- The order→chat linking logic lives in the order screen; the general chat plumbing (login, channels,
  receipts) is in the chat service and store (see Domain E).

## Data source

| Item | Value |
|------|-------|
| Get order chat recipient | `POST /api/v1/channels/orderChatParticipant/get-recipient` — `{ original_user_id, order_id, parent_order_id? }` (`server: "chat"`) |
| Chat plumbing | `services/chat.ts` — login, `my_channels`, mark-received |
| Backend | **Chat backend** (`NEXT_PUBLIC_CHAT_BACKEND_URL`) |

## Technical reference

| Item | Value |
|------|-------|
| Linking logic | `components/setting/orders/OrderDetailsWrapper.tsx` (`getChatWithShipping`, `openShippingChatForChatId`) |
| Chat button | `components/settings/OrderChatIcon.tsx` (unread dot via `ShowNotificationSign`) |
| Chat panel | `components/Chat/ChatWidget.tsx` |
| Request code | `utils/Requests.ts` — `GET_CHAT_WITH_DELEIVERY` (98) |
| Store | `store/chat/reducer.ts` — `openChat` / `activeChat`, unread-dot flags |

## Current status & maturity

**Live.** The order-scoped delivery chat opens correctly from both the icon and a notification, and
ties into the shared chat system.

## Known gaps / notes

No dedicated gaps found.

## Related features

CH-08 / CH-25 (One-to-one chat & Order / delivery chat in Domain E — the underlying chat system) ·
CO-16 (Order details — hosts the chat) · CO-28 (Manage a return — reuses this chat to reach the return
courier) · CH-06 (Delivery-worker calls — the voice counterpart).
