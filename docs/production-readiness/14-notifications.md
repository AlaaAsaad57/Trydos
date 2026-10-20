# Notifications — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Push, in-app toasts, the notification list and the preferences page work, but four debug or unprotected pieces ship to every shopper and must be removed or locked before launch.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
- The app asks the shopper to allow notifications (a card from `NotificationWidget`). The card appears when a signed-in shopper opens chat, and after a phone sign-in.
- With permission, the browser gets a push token (FCM through `/firebase-messaging-sw.js`). The app registers the token with the market backend and the chat backend.
- Pushes about orders, products, boutiques, categories, chat messages and calls show as a toast when the site is open, and as a system notification when it is closed.
- The shopper opens the list of past notifications from Menu → "Notifications" (`components/Home/Menu.tsx:190`). They change topics and channels on `/{lang}/settings/prefferences`.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Signed-in shopper taps chat while permission is "default" → the "Stay in the loop" card opens; "Allow" → the browser prompt; "Not now" or Escape → the card closes | none | `components/Home/AuthNavSection.tsx:45-49`; `services/home.ts:312-338`; `components/Home/Init.tsx:205-212`; `components/global/NotificationWidget.tsx:84-169` | `tests/components/global/NotificationWidget.test.tsx`, `tests/components/Home/AuthNavSection.test.tsx`, `tests/components/Home/Init.test.tsx` |
| W-2 | After a phone sign-in → the app checks the permission: granted → push starts; denied → "Notification is Denied" toast; default → the card | none | `services/auth.ts:302`; `services/home.ts:312-338` | `tests/services/home.test.ts` (getNotificationPermissionStatus) |
| W-3 | The browser has no push support → "Notifications Not Supported" card with "Got it" | none | `NotificationWidget.tsx:46-78, 180-187`; `components/global/NotSupportedNotificationsWidget.tsx` | `tests/components/global/NotSupportedNotificationsWidget.test.tsx`, `NotificationWidget.test.tsx` |
| W-4 | Permission denied in the browser → error toast "Notification is Blocked in This Browser…"; chat stays shut | none | `NotificationWidget.tsx:104-114, 136-143`; `AuthNavSection.tsx:51-57` | `NotificationWidget.test.tsx`; e2e SCRIPT-27 |
| W-5 | "Allow" granted → the service worker registers, the push token is made, and it is registered with the market backend and the chat backend; the token is renewed when older than 24 h | market `POST /firebase_device_tokens` (gateway for guests, core for verified shoppers — `utils/server/tokenManager.ts:181`); chat `StoreToken` | `services/home.ts:241-309`; `utils/firebaseInitv1.tsx:107-210` | `tests/utils/firebaseInitv1.test.ts`, `tests/services/home.test.ts` (AllowNotifications) |
| W-6 | Each page load of a signed-in shopper with permission granted → push starts again silently | same as W-5 | `components/Home/Init.tsx:139, 158-176` | `tests/components/Home/Init.test.tsx` |
| W-7 | The shopper changes country or language → the device's push topics move to the new pair, and the saved settings come back | market `POST /firebase_device_tokens/change_country_language` | `services/home.ts:606-645` | `tests/services/home.test.ts` (handleTopicsOnPageRefresh) |
| W-8 | The network comes back and the token changed → the new token is registered again and every tracked topic is subscribed again | market `/firebase_device_tokens`; `/api/subscribe` | `utils/firebaseInitv1.tsx:214-288`; `utils/fcmTopicTracker.ts` | `tests/utils/firebaseInitv1.test.ts`, `tests/utils/fcmTopicTracker.test.ts` |
| W-9 | Site open, an order or product push arrives → a toast with a link: order status → order page; order placed → order page, the cart is read again; product availability / discount / comment / price change / stock → product page; boutique or category created → filtered listing; cart expiration → cart | market `GET /customer/order/getOrdersByOrderGroupID` (order placed only) | `utils/NotificationHandler.ts:398-557` | none for the shopper types (no unit test of `handleMarketEvent`) |
| W-10 | Site open, a chat message or call push arrives → a chat toast (one per channel) or the call screen; muted chats stay silent | chat (through FCM) | `utils/NotificationHandler.ts:160-220`; `store/notifications/reducer.ts:104-131` | `tests/utils/chatMuteNotifications.test.ts`, `tests/components/Chat/CallMessage.test.tsx` |
| W-11 | Site closed or in the background → a system notification for market types, chat messages and calls; one card per product and per order (tags); a tap opens the right page in the shopper's locale | none | `public/firebase-messaging-sw.js:155-205, 265-700, 745-807` | `tests/public/firebaseMessagingSwTags.test.ts` |
| W-12 | Any part of the app shows a success, error or chat toast → it shows on top, closes by itself (10 s default) or by its X | none | `store/notifications/reducer.ts:37-102`; `components/global/NotificationsContainer.tsx` | `tests/store/notificationsReducer.test.ts`, `tests/components/global/NotificationsContainer.test.tsx` |
| W-13 | Menu → "Notifications" → the panel loads page 1, loads more on scroll, says "No more notifications" at the end, and reloads when a new market push arrives; a tap on an item opens the boutique, product, category or order | market `GET /user-notifications/get?page=n` | `components/Notifications/NotificationsPanel.tsx:62-152`; `components/Notifications/NotificationItem.tsx:99-180`; `services/notifications.ts:6-28` | `tests/components/Notifications/NotificationsPanel.test.tsx`, `tests/components/Notifications/NotificationItem.test.tsx`, `tests/services/notifications.test.ts` |
| W-14 | Settings → preferences → "Notifications Settings" tab → enabled and disabled topics are listed; "Unsubscribe" / "Subscribe" moves a topic | market `GET /firebase_device_tokens/my_firebase_settings`; `POST …/subscribe_topic`, `…/unsubscribe_topic` | `components/Home/SettingsModal.tsx:83-212` | `tests/components/Home/SettingsModal.test.tsx` |
| W-15 | Same tab → email / push / WhatsApp switches and the frequency list (daily, weekly, monthly) save at once and go back if the save fails | market `POST /firebase_device_tokens/update_email`, `update_firebase`, `update_whatsapp`, `update_notification_frequency` | `SettingsModal.tsx:216-260`; `services/home.ts:872-894` | `tests/components/Home/SettingsModal.test.tsx` |
| W-16 | Product page → "Notify Me About The Product When…" → a topic turns on only after the backend confirms; with no push token the shopper is told to allow notifications | market `GET /web/notification_types/customer-notification-to-choose`; `POST …/subscribe_topic`, `…/unsubscribe_topic` | `components/products/MoreOptionsSection.tsx:43-125`; `services/home.ts:574-604`; `services/auth.ts:462-470` | `tests/components/products/MoreOptionsSection.test.tsx`, `tests/services/home.test.ts` |
| W-17 | Seller opens the dashboard orders → the device joins the shop's order topics; a new order appears in the list live (see the seller file) | `/api/subscribe` (Firebase Admin) | `components/SellerDashboard/orders.tsx:2133-2143`; `utils/NotificationHandler.ts:418-450` | `tests/components/SellerDashboard/orders.test.tsx` |
| W-18 | Log out → the push token goes to `/api/auth/logout` to be detached from the account, and the device's push subscription is removed | `/api/auth/logout` | `utils/tinyUtils.tsx:52-100` | `tests/utils/tinyUtils.test.ts` |

## ⚠️ Works, with limits
- **L-1 — The panel asks for permission by itself.** Each time the Notifications panel opens, `NotificationInfo` calls `Notification.requestPermission()` and makes a push token (`NotificationsPanel.tsx:317-345`). A shopper who said "not now" gets the browser prompt again.
- **L-2 — The card has no memory.** The `localStorageKey` prop is never used (`NotificationWidget.tsx:28`). The card comes back on every sign-in and every chat tap while permission is "default".
- **L-3 — Topic names are raw.** `formatTopicName` only swaps `_` for spaces (`SettingsModal.tsx:124-127`). The list shows backend names such as "product discount 7681", not translated and with ids (`SettingsModal.tsx:352, 399`).
- **L-4 — Topic changes fail without a word.** With no push token, or when the backend refuses, the preferences tab only logs (`SettingsModal.tsx:157-171, 197-210`). The button just does nothing for the shopper.
- **L-5 — Some error toasts are hidden.** `showErrorNotification` drops any message that contains "authorized" (`store/notifications/reducer.ts:91`). A real "not authorized" message from a backend is never shown.
- **L-6 — Some toast links are rough.** "product hurry up" links to `/products/{product_id}`: an id, not a slug, and no locale (`NotificationHandler.ts:465-468`). The boutique toast uses `boutique_id`, while the background card uses `boutique_slug` (`NotificationHandler.ts:469-478`). Cart expiration links to `/?cart=true` with no locale (`:480`). The fallback text "New boutique available!" is English only (`:471`).
- **L-7 — Push payloads go to the browser console.** `console.log("Received foreground notification:", payload)` runs in production (`NotificationHandler.ts:131`). The payload can hold message text and order data. There is one more log at `firebaseInitv1.tsx:244`.
- **L-8 — The token is replaced every 24 h.** The app deletes the old token and makes a new one when the stored one is older than one day (`firebaseInitv1.tsx:116-142`). Topics joined through `/api/subscribe` are only joined again on the `online` event (W-8) or when the seller dashboard opens again.
- **L-9 — Seller order topics stay joined.** The unsubscribe on leaving the dashboard is commented out (`orders.tsx:2140-2142`). Logout still removes the push subscription (W-18).
- **L-10 — The Firebase project is hardcoded.** The web config is written in two files (`utils/firebaseInitv1.tsx:11-20`, `public/firebase-messaging-sw.js:58-67`). All environments use one Firebase project. Changing the project needs a code change.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | `/api/subscribe` and `/api/unsubscribe` have no auth. They only check that `token` and `topic` exist, then call Firebase Admin. Seller order topics have a guessable name, `shop_{sellerId}_order`. Anyone can join another shop's order topic with their own token and receive its order pushes (the payload carries the order, `NotificationHandler.ts:419-430`) | Nothing — a data leak | `app/api/subscribe/route.ts:7-22`; `app/api/unsubscribe/route.ts`; `components/SellerDashboard/orders.tsx:2134-2135` | Frontend + Backend | **Yes** — order data can leak. Check the session and allow only known topic patterns (shop topics only for that shop's staff), or move this to the backend |
| M-2 | `/api/info` is a debug GET `?token=` with no auth. It uses the Firebase Admin credential to read any token's details from Google's IID API and returns them in full. The app never calls it | Nothing | `app/api/info/route.ts:5-52` | Frontend | **Yes** — remove it (open use of the server credential) |
| M-3 | A "Notification Test" tab is in the shopper's preferences page. It shows hardcoded English test buttons. Each button subscribes the device to a topic for product 7681 (or boutique 66) and calls `/firebase_device_tokens/send_*`, which asks the backend to send a real push | Every shopper sees developer test buttons and can trigger pushes | `components/Home/SettingsModal.tsx:5, 324, 500`; `components/global/NotificationsTest.tsx`; `services/home.ts:674-870` | Frontend + Backend | **Yes** — remove the tab and the 8 `TestNotification*` functions; the backend must close `send_*` in production |
| M-4 | A debug block sits at the top of the Notifications panel for every shopper: "Notification Permission", "FireBase Supported", "User ID", the first 30 characters of the "FCM Token", "FCM Error". A tap copies all of it to the clipboard. The labels also name the push technology, against the stack-naming rule | Debug data above the notification list | `components/Notifications/NotificationsPanel.tsx:317-405`; also the switch label "Enable FireBase Notifications" (`SettingsModal.tsx:449`) | Frontend | **Yes** — remove the block; rename the label |
| M-5 | **Chat cannot open on iPhone Safari (normal tab) or in in-app browsers.** Opening chat needs push permission "granted". iOS Safari gives the Notification API only to Home Screen web apps (iOS 16.4+), so `Notification` is undefined in a tab. `getNotificationPermissionStatus` returns -1, the app shows the "Not Supported" card, and the chat never opens. The card even advises "switch to … Safari" | iPhone shopper taps chat → "Notifications Not Supported" → no chat | `components/Home/AuthNavSection.tsx:45-66`; `services/home.ts:315-322`; `NotSupportedNotificationsWidget.tsx:75-78` | Product + Frontend | **Yes** — product decision: let chat open without push where push is not possible |
| M-6 | The device registration body carries a placeholder `auth_token: "some_random_token_for_now"` and a `user_id` from the browser | Nothing | `utils/firebaseInitv1.tsx:177-187` | Frontend + Backend | No — if the backend reads the user from the bearer token (confirm) |
| M-7 | The notification list has no empty state and no error state. `fetchNotifications` returns `undefined` on a failure (comment "Fallback to mock data", but there is none). The panel then throws on `response.isSuccessful`, catches it and only logs | No notifications, or an error: an empty panel with only the debug block, and no text | `services/notifications.ts:26, 46`; `NotificationsPanel.tsx:62-82, 300-309` | Frontend | No |
| M-8 | The product "Notify me" row breaks when the types request fails. `getNotificationsTypes` returns `undefined`, the store gets `NotificationsType = undefined`, and `NotificationsType.length` throws during render | When `/web/notification_types/...` fails, the product page section crashes | `components/products/MoreOptionsSection.tsx:46, 315`; `services/notifications.ts:29-47` | Frontend | No — only when that request fails, but then the error is a page crash; fix soon |
| M-9 | The service worker has no branch for "seller order added" or "seller order with detail realtime". If the backend sends these as data-only pushes, a seller with the dashboard closed gets no system notification | No new-order alert while the site is closed | `public/firebase-messaging-sw.js:285-470` (branches); compare `NotificationHandler.ts:147-153` | Frontend | No — confirm the payload form with the backend first |

## 🔒 Must do before launch
- [ ] M-1: protect `/api/subscribe` and `/api/unsubscribe` (session check plus an allow-list of topic patterns), or move topic joins to the backend.
- [ ] M-2: delete `app/api/info/route.ts` and its test.
- [ ] M-3: remove the "Notification Test" tab, `components/global/NotificationsTest.tsx` and `services/home.ts:674-870`; the backend closes the `send_*` test endpoints in production.
- [ ] M-4: remove the debug block from the Notifications panel; rename "Enable FireBase Notifications".
- [ ] M-5: product decision on chat for shoppers whose browser has no push (iPhone Safari tab, in-app browsers), then the code change.
- [ ] Ops: set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in Vercel production (`utils/firebaseAdmin.ts:4-8`), and decide which Firebase project production uses (L-10).

## ❓ Needs confirmation from the backend team
- Who may call `/firebase_device_tokens/send_*` (boutique_created, product_cart_expiration, product_availability, product_comment, product_discount, category_created, product_before_stock_out, product_when_change_in_price)? Are they off in production?
- `POST /firebase_device_tokens`: does it take the user from the bearer token, and ignore `user_id` and `auth_token` in the body (M-6)?
- `subscribe_topic`: does it check the topic name and who asks for it?
- When the web token changes (every 24 h, L-8), does the backend move the topic subscriptions made through `subscribe_topic` to the new token?
- Seller order pushes: are they data-only? What exactly is in the payload (buyer name, phone, address)? (M-1, M-9)
- `/user-notifications/get` always goes to the core backend, also for a guest (it is not in the gateway list). Does core answer a guest token?
- Are the email and WhatsApp channels really sent? Does the backend honour `notification_frequency` (daily, weekly, monthly)?
- What does the "greeting" push do on the backend side? The app answers it with `/firebase_device_tokens/validate_token` (`NotificationHandler.ts:139-142`, `services/auth.ts:477-497`).

## 🧪 Tests that cover this section
**Unit (Vitest):**
- Prompt and permission: `tests/components/global/NotificationWidget.test.tsx`, `tests/components/global/NotSupportedNotificationsWidget.test.tsx`, `tests/components/Home/Init.test.tsx`, `tests/components/Home/AuthNavSection.test.tsx`
- Token and topics: `tests/utils/firebaseInitv1.test.ts`, `tests/utils/fcmTopicTracker.test.ts`, `tests/utils/firebaseAdmin.test.ts`, `tests/services/home.test.ts` (AllowNotifications, handleTopicsOnPageRefresh, subscribing to topics, test notifications, EditNotificationSettings)
- Routes: `tests/app/api/subscribe/route.test.ts`, `tests/app/api/unsubscribe/route.test.ts`, `tests/app/api/info/route.test.ts` (keeps M-2 alive)
- Background push: `tests/public/firebaseMessagingSwTags.test.ts`
- Chat push: `tests/utils/chatMuteNotifications.test.ts`, `tests/components/Chat/CallMessage.test.tsx`, `tests/components/Home/ChatNotification.test.tsx`
- Toasts: `tests/store/notificationsReducer.test.ts`, `tests/components/global/NotificationsContainer.test.tsx`
- Notification list: `tests/components/Notifications/NotificationsPanel.test.tsx` (also asserts the debug block, M-4), `tests/components/Notifications/NotificationItem.test.tsx`, `tests/services/notifications.test.ts`
- Preferences: `tests/components/Home/SettingsModal.test.tsx`, `tests/components/global/NotificationsTest.test.tsx` (tests the M-3 test tab), `tests/components/global/Setting.test.tsx`
- Product "Notify me": `tests/components/products/MoreOptionsSection.test.tsx`
- Logout teardown: `tests/utils/tinyUtils.test.ts`

**E2E (Playwright):**
- `tests/e2e/chat.scripted.spec.ts`: SCRIPT-27 (the browser refuses notifications: the chat stays shut and the shopper is told why).
- `tests/e2e/checkout.scripted.spec.ts` and `tests/e2e/sellerStories.live.spec.ts` record in-app toasts through `tests/e2e/harness/notifications.ts`; they do not test push.

**Markers:** no `it.fails`, `test.fail` or `BUG-n` markers in these files.

**Important cases with NO test:**
- Any real push delivery (foreground or background) in e2e.
- `NotificationHandler.handleMarketEvent` for shopper types (order status, order placed, product, boutique, category, cart) — no unit test.
- The Notifications panel, the preferences page and the product "Notify me" row in e2e.
- The iPhone Safari chat block (M-5), the open `/api/subscribe` topic join (M-1), and the crash in M-8.
