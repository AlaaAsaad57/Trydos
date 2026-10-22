---
ticket: order-notification-reuse-tab
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-10-21
links:
  clickup:
  github:
---

# Research — order-notification-reuse-tab

> Read-only phase. **No implementation is allowed in this command.**

## Goal

When a shopper clicks a background `order status changed…` push, and a tab is
already open on that same order's details page, focus that tab and load its
order data again. Do not open a second tab.

## How the flow works today (evidence)

### 1. The push arrives

- The worker's `messaging.onBackgroundMessage` handler
  (`public/firebase-messaging-sw.js:265`) first calls `sendToForeground`
  (`:128`). That function posts `{ type: "FCM_NOTIFICATION", payload }` to
  **every** open window, visible or hidden.
- Each tab's `ForegroundNotificationHandler` (`utils/NotificationHandler.ts:109`)
  receives the message and calls `handleNotification`. For a `market` push it
  calls `handleMarketEvent` (`:415`).
- For any type that starts with `order status changed`, `handleMarketEvent`
  adds 1 to the global `shouldUpdateOrders` counter (`:474`). For a named type
  (not the plain `order status changed`) it also shows an in-app toast that
  links to the order (`:475–481`).
- `OrderDetailsWrapper.tsx:198–202` watches the counter and calls
  `getOrderDetails()` again. So an open order-details tab **usually loads fresh
  data when the push arrives**, before any click.
- The worker then shows the system card. The `order status changed…` branch
  (`firebase-messaging-sw.js:455–475`) builds
  `data: { url: buildUrl("settings/orders/<order_group_id>", localePrefix) }`.
  It sets **no** reuse marker and does not copy `order_group_id` into `data`.
- The card's tag is `market-order-status-<order_group_id>` (`:196–200`), so a
  newer status push replaces the older card.

### 2. The shopper clicks the card

- `notificationclick` (`firebase-messaging-sw.js:745`):
  - `notificationData.callType` is not set, so it enters the open branch.
  - `notificationData.reuseTab` is not set, so it runs
    `clients.openWindow(targetUrl)` (`:756`) → **always a new tab**.
  - Line 756 does **not** wrap the call in `event.waitUntil`. The worker may be
    stopped before the window opens. Line 754 (the chat branch) does use
    `event.waitUntil`.
- The `switch (event.action)` block (`:759–806`) handles `open_url`,
  `any_other_action`, `reply`, `reject`. No order card defines actions, so
  `event.action` is `""` for an order click and none of the cases run.

### 3. The pattern that already exists (delivery-worker chat)

- The private-chat branch (`:560–580`) sets `data.reuseTab: true` plus
  `order_group_id`, `order_id`, `chat_id`.
- `focusOrOpenOrderTab(notificationData, targetUrl)` (`:705–742`):
  1. `clients.matchAll({ type: "window", includeUncontrolled: true })`.
  2. Picks the first client whose URL starts with the origin and whose pathname
     ends with `/settings/orders/<group_id>`. The comment says `matchAll` lists
     the most recently focused tab first.
  3. `await match.focus()`, then
     `match.postMessage({ type: "OPEN_DELIVERY_CHAT", order_group_id, order_id, chat_id })`.
  4. On no match, or on any error, it calls `clients.openWindow(targetUrl)`.
  - `groupId == null` → no tab matches → new tab.
  - The message type `OPEN_DELIVERY_CHAT` is hard-coded inside the helper.
    Today the chat branch is its only caller.
- `NotificationHandler.ts:121–135` turns `OPEN_DELIVERY_CHAT` into the window
  event `OPEN_DELIVERY_CHAT_EVENT` (`utils/notificationEvents.ts:4`).
- `OrderDetailsWrapper.tsx:420–428` listens for that event, checks
  `String(detail.order_group_id) === String(order_group_id)`, and opens the chat.
- The design note for this pattern:
  `docs/superpowers/plans/2026-06-16-delivery-chat-notification-tab-reuse.md`.
  Its Step 5 says other notifications (it names "order status changed") must
  keep opening a new tab. This ticket changes that on purpose, for the same
  order only.

### 4. The order-details page

- Route: `app/(client)/[lang]/settings/orders/[id]/page.tsx`. It passes
  `order_group_id = params.id`, `order_id = ?order_id`, `order_chat_id = ?chat_id`
  to `OrderDetailsWrapper`. There is no `@modal` copy of this route (only
  `(.)filters` and `(.)products`), and `next.config.ts` sets no
  `trailingSlash`. So the pathname of an open details tab always ends with
  `/settings/orders/<id>`.
- `getOrderDetails()` (`OrderDetailsWrapper.tsx:102–197`):
  - sets `loading` to `true`, and the page then shows `OrderDetailsSkeleton`
    in place of the whole page (`:579–580`);
  - calls `Order.getOrderDetails(order_group_id)`, then ratings and returns;
  - keeps the pack from the `order_id` prop as the active pack;
  - ends with `setShouldUpdateOrders(0)`;
  - has **no guard** against two loads running at the same time.
- Other listeners of the global `shouldUpdateOrders` counter:
  `components/global/RouterRefresh.tsx` (calls `router.refresh()`; mounted only
  in `app/(client)/[lang]/settings/page.tsx:121`),
  `components/setting/orders/OrdersListWrapper.tsx:112`,
  `components/SellerDashboard/orders.tsx:2154`,
  `components/global/NotificationsContainer.tsx:546–552`. The comment at
  `OrderDetailsWrapper.tsx:251–257` explains why a bump of this counter has
  side effects. This is why the owner chose an order-specific signal.

### 5. Service-worker registration

- `utils/firebaseInitv1.tsx:95` registers `/firebase-messaging-sw.js` with no
  `scope` option, so the scope is `/`. The worker calls `clients.claim()` on
  activate (`:37`). A tab opened before the worker was active is not
  controlled until it reloads. `includeUncontrolled: true` is what lets
  `matchAll` still return that tab. Today's chat feature already depends on
  focus and `postMessage` working for such tabs.

## Relevant directories

- `public/` — `firebase-messaging-sw.js`, a classic service-worker script.
  Nothing imports it; the browser loads it directly.
- `utils/` — `NotificationHandler.ts` (forwards worker messages to the page),
  `notificationEvents.ts` (event-name constants), `firebaseInitv1.tsx`
  (registration).
- `components/setting/orders/` — `OrderDetailsWrapper.tsx`, the order-details
  page body.
- `tests/public/`, `tests/utils/`, `tests/components/setting/orders/` — the
  existing unit tests for those three source areas.

## Relevant config files

- `vitest.config.mts` — one project, `unit`, `jsdom`, setup file
  `tests/setup.ts`. It picks up every `*.test.ts(x)` except `tests/e2e/**`.
- `eslint.config.mjs` — lints the whole tree except `.next`, `out`, `build`,
  `node_modules`. The i18n rules apply only to `app/`, `components/`,
  `services/`, `utils/`.
- `tsconfig.json` — includes `**/*.ts` and `**/*.tsx`. The worker is `.js`, so
  `tsc` does not check it.
- `.claude/project-config.yaml` — validation profiles. `logic-change` = `lint`
  + `typecheck` + `unit-tests`.

None of these files need to change. None is a protected runtime path that this
ticket touches.

## Possibly affected services

- **Browser service worker** (`public/firebase-messaging-sw.js`) — the click
  handler changes. The chat branch shares `focusOrOpenOrderTab`, so a change to
  that helper can break the delivery-worker chat click.
- **Core / gateway market backend** — not changed. The page refresh calls the
  same `Order.getOrderDetails` it calls on mount. A tab that was in the
  background for more than 60 seconds holds an expired access token, so the
  first call answers 401, then the normal refresh-and-retry runs (one extra
  round trip). That is the normal path, not a fault.
- **Chat backend** — not called by this change.
- **FCM / Firebase** — not changed. The payload is read as it is today.
- **No new user-visible text.** The click focuses a tab and loads data. No
  translation keys are needed.

## Test / validation commands available

Not run in this stage.

- `pnpm test:run` — the Vitest unit suite (`vitest run --project unit`).
- `pnpm lint` — ESLint, including the i18n rules.
- `node_modules/.bin/tsc --noEmit --pretty false` — typecheck (needs
  `next typegen` first in CI; see memory note on GitHub Actions).
- `pnpm lint:i18n-parity` — translation key parity (not affected here).
- `pnpm build` — full production build.
- The browser suite (`tests/e2e/`) cannot click a system notification card, so
  it is not a fit for this change.

## Test layout and naming convention

- Unit tests live under `tests/`, in a path that mirrors the source path, and
  are named `<Source>.test.ts(x)` or by topic. Runner: Vitest, `jsdom`.
- Each assertion carries a plain-English message as the second argument of
  `expect` (CLAUDE.md, Testing rule 1).
- Expected-failure marker: `it.fails("BUG-<id>: …")`, for example
  `tests/components/Chat/SearchResult.test.tsx:146`.
- **Existing test file per unit this ticket touches:**
  - `public/firebase-messaging-sw.js` → `tests/public/firebaseMessagingSwTags.test.ts`.
    Besides the tag table, the file already runs the **whole worker** with
    stubbed `self`, `firebase`, `clients`, `caches`, `importScripts`
    (`loadBackgroundHandler`, `:128–161` and `:211–240`). The stub
    `self.addEventListener` is `() => {}` today, so it drops the
    `notificationclick` listener. A click test needs a stub that keeps it.
    **No test covers `notificationclick` or `focusOrOpenOrderTab` today**,
    including the chat path.
  - `utils/NotificationHandler.ts` → `tests/utils/chatMuteNotifications.test.ts`.
    Its last block, "foreground handler — service worker messages"
    (`:1259–1299`), already checks that `FCM_NOTIFICATION` and
    `OPEN_DELIVERY_CHAT` are forwarded. It must stay last, because it resets
    the module registry (comment at `:1257`).
  - `components/setting/orders/OrderDetailsWrapper.tsx` →
    `tests/components/setting/orders/OrderDetailsWrapper.test.tsx`. It already
    dispatches `OPEN_DELIVERY_CHAT_EVENT` and checks the group-id filter
    (`:782–818`). Its `renderPage` uses `order_group_id: "test-order-group"`.
  - `utils/notificationEvents.ts` has no test file. It holds constants only.

## Risks and unknowns

- **Breaking the chat click** — the chat branch is the only caller of
  `focusOrOpenOrderTab` today, and no test covers it. If the helper changes to
  carry a different message, the chat path can break with no test going red.
  Impact: high (delivery chat stops opening). Likelihood: medium without a test.
- **A skeleton on the focused tab** — `getOrderDetails()` sets `loading`, and
  the page swaps to the full skeleton. On a click, the shopper sees the
  skeleton for one round trip, plus one more for the token exchange after a
  long time in the background. Impact: low (a short flash). Likelihood: high.
- **Two loads in a row** — the arrival refresh and the click refresh can run
  close together. `getOrderDetails()` has no guard, so the later answer wins.
  Both load the same data, so the result is the same. Impact: low.
- **A tab Chrome froze or discarded** — `postMessage` may not reach it. A
  discarded tab reloads when it gets focus, so it loads fresh data anyway. For a
  frozen tab, the browser should deliver the message once focus unfreezes it.
  This was not checked in a real browser during research. Impact: low.
- **The plain `order status changed` type** — the unit fixture at
  `tests/utils/chatMuteNotifications.test.ts:669` sends it with no
  `order_group_id`. The worker branch uses `startsWith`, so it handles this type
  too, and its URL becomes `settings/orders/undefined`. That is today's
  behaviour. With no group id, `focusOrOpenOrderTab` finds no tab, so the click
  still opens a new tab. Impact: none from this ticket.
- **The real payload shape is not documented.** No doc or captured staging
  payload for `order status changed…` exists in the repository. The code (worker
  and page) reads only `type`, `description`, `showed_type`, `order_group_id`.

## Open questions

| ID   | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Which push types are in scope: every type the worker branch matches with `startsWith("order status changed")`, including the plain `order status changed`? | Decides which branch gets the reuse marker, and what happens when `order_group_id` is missing. |
| OQ-2 | When the reused tab loads again, may it show the full skeleton (what `getOrderDetails()` does today), or must the refresh keep the old content on screen until the new data lands? | A quiet refresh is a larger change to `OrderDetailsWrapper.tsx`. The skeleton is the smallest change. |
| OQ-3 | Is a second load straight after the arrival refresh acceptable, or must the page skip the click refresh when a load is already running? | `getOrderDetails()` has no in-flight guard. Adding one grows the change. |
| OQ-4 | With several tabs on the same order, which one is reused? | `focusOrOpenOrderTab` takes the first `matchAll` match. Keeping that rule keeps the chat path unchanged. |
| OQ-5 | How is `focusOrOpenOrderTab` shared: one helper that takes the message to post, or a second helper? And must the chat click get its own test in this ticket? | The chat click shares the helper and has no test. A change without a test can break it silently. |
| OQ-6 | What are the names of the new worker message and the new window event, and where is the event constant kept? | Names must follow the stack-agnostic rule and the existing `OPEN_DELIVERY_CHAT` / `OPEN_DELIVERY_CHAT_EVENT` style. |
| OQ-7 | Does the `event.waitUntil` fix cover only the default branch (`firebase-messaging-sw.js:756`), or also `clients.openWindow` in the `open_url` case (`:761`)? | No card defines an `open_url` action today. Touching it is scope with no caller. |
| OQ-8 | Should a tab on the same order but another locale (for example `/sy-ar/…` when the push is built for `/sy-en/…`) be reused? | The current path match ignores the locale prefix. |
| OQ-9 | Should the click send a PostHog event (for example "tab reused")? | CLAUDE.md requires every new PostHog event to be documented in `docs/posthog-events.md`. With no event, nothing is added. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No protected runtime path (`proxy.ts`, `next.config.ts`, `instrumentation*`,
  `sentry.*.config.ts`, `.github/workflows/**`) is involved.
