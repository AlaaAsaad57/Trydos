# PostHog — Event Registry (single source of truth)

_Trydos (Next.js 16 · React 19 · Vercel · Go backend)._

This file is the **canonical list of every PostHog event** we send, what it means, and
the properties attached to each. **When you add a new event, add it here in the same PR.**

Companion docs:
- `docs/posthog-order-funnel.md` — deep dive on the create-order funnel (correlation, drop-off analysis, how to build the funnel in the PostHog UI).
- `docs/posthog-vs-smartlook-comparison.md` — why we use PostHog and what it replaced.

---

## How events reach PostHog

There are **several event streams** plus identity and error capture. All wrappers live in
`utils/posthog.ts` and **no-op outside production / off the client**, and never throw.

1. **GA-mirrored stream** — `utils/gtag.ts:GAevent({ action, params })` fires the GA
   event *and* fans the same event out to `posthogCapture(action, …)`. Every name in
   `utils/GAEvents.ts:GA_EVENT_NAMES` therefore exists in PostHog under its GA name. See
   [GA-mirrored events](#1-ga-mirrored-events).
2. **PostHog-only order stream** — `utils/orderFunnel.ts:trackOrder(event, props)` →
   `posthogCapture` only (never touches GA). Names come from `ORDER_EVENTS`. See
   [Order-funnel events](#2-order-funnel-events-posthog-only).
3. **PostHog-only order-management stream** — `utils/orderFunnel.ts:trackOrderMgmt(event, props)`
   → `posthogCapture` only. Names come from `ORDER_MGMT_EVENTS`. Same wrapper file, but a
   cart-free base-prop set for post-purchase screens. See [Order-management events](#3-order-management-events-posthog-only--order_mgmt_events).
4. **PostHog-only chat/stories stream** — `utils/posthogEvents.ts:trackPosthog(event, props)`
   → `posthogCapture` only. Attaches the shared `globalProps()` block (the same context the GA
   fan-out adds), but names live in `STORY_EVENTS` / `CHAT_EVENTS`, **not** in `GA_EVENT_NAMES`
   — use this for new events with no GA counterpart. See
   [Chat & stories events](#4-chat--stories-events-posthog-only) and `funnels/chat-stories-funnels.md`.
5. **Identity** — `posthogIdentify(userId, props)` on login (`components/Home/Init.tsx`,
   `services/auth.ts`); `posthogReset()` on logout (`utils/tinyUtils.tsx`).
6. **Exceptions** — `LogError` → `posthogCaptureException(error, props)` (PostHog
   error-tracking, linked to the matching session replay).
7. **Server-side OTP stream** — `utils/server/otpTelemetry.ts:captureOtpAttempt()` POSTs
   straight to the PostHog capture API from the `sendOtpAction` Server Action (NOT through
   `posthog-js` or the `/ingest` proxy). This is the only stream that carries the **raw client
   IP** (client events can't — see §5) and the only one that sees server-side blocks and
   scripted RSC-direct attacks. See [Server-side OTP events](#5-server-side-otp-events).

> Autocapture, pageviews, pageleave, and session replay are enabled by the
> `defaults: "2025-05-24"` preset in `posthogInit()` — those are automatic and **not**
> listed below (this file covers explicit/custom events only).

---

## Global properties

### Auto-attached to every GA-mirrored event (`utils/gtag.ts`)
Merged into every `posthogCapture` call made by `GAevent` — you don't pass these per call:

| Property | Source | Notes |
|---|---|---|
| `screen_name` | `DetectScreen()` | logical screen (see source mapping in funnel doc) |
| `screen_path` | `window.location.pathname` | |
| `country_name` | URL locale segment | e.g. Syria / Turkey / Iraq / Lebanon |
| `device_language` | URL locale segment | English / Turkish / Arabic / Kurdish |
| `device_type` | UA sniff | `mobile` / `tablet` / `desktop` |
| `operating_system` | UA sniff | Android / iOS / Windows / Macintosh / Linux / … |
| `session_id` | store (`session_id`) | |
| `platform_source` | constant | always `"WEB"` |
| `user_id_guest` **or** `user_id_verify` | `userProfile` | guest if phone unverified/absent, else verified |

### Auto-attached to every order event (`utils/orderFunnel.ts:baseProps`)
Merged into every `trackOrder` call (explicit props override these):

| Property | Source |
|---|---|
| `order_attempt_id` | `orderData.attempt_id` — correlation id for one checkout attempt |
| `screen` | `DetectScreen()` |
| `currency` | `currency.code` |
| `item_count` | `cart.length` |
| `cart_value` | `total_cash` ?? `total` |
| `is_phone_verified` | `userProfile.is_phone_verified` |
| `user_id` | `auth.UserID()` |

### Person properties (`posthogIdentify`)
Set on login (`components/Home/Init.tsx`): `name`, `phone`. `person_profiles` is
`identified_only`, so guests get session replay but no person profile.

---

## 1. GA-mirrored events

These reach PostHog via the `GAevent` → `posthogCapture` fan-out under their GA name.
All carry the [global GA props](#auto-attached-to-every-ga-mirrored-event-utilsgtagts);
the **Key params** column lists the notable extras passed at the call site.

### Auth / onboarding
| Event (`action`) | Description | Key params |
|---|---|---|
| `login` | User logged in | user identity props |
| `sign_up` | New account created | |
| `login_start` | Login flow opened | |
| `sign_up_start` | Sign-up flow opened | |
| `create_account_continue` | Continued past create-account step | |
| `confirm_phone_number` | Phone number confirmed | |
| `send_otp` | OTP requested | delivery method (sms/whatsapp) |
| `resend_otp` | OTP re-requested | |
| `verify_otp` | OTP submitted/verified | |
| `timer_expired` | OTP resend timer elapsed | |
| `cancel_login` | Login flow abandoned | |
| `cancel_signup` | Sign-up flow abandoned | |
| `later_take_look_clicked` | "Later, take a look" dismiss | |
| `terms_services` | Terms & services viewed/accepted | |
| `custom_user_mapping` | User identity mapping | |

### Browsing / discovery
| Event (`action`) | Description | Key params |
|---|---|---|
| `screen_view_event` | Screen/page viewed | `screen_name`, `screen_path` |
| `view_item` | Product page viewed | product id/name |
| `view_time_product` | Time spent on a product | duration |
| `view_item_list` | Product list/grid viewed | list context |
| `view_boutique_event` | Boutique/seller page viewed | boutique id |
| `view_story` | Story viewed | `story_id`, `item_id`, `item_name`, `user_id_custom` |
| `view_story_button` | Story opened via button | |
| `search` | Search performed | `search_keyword`, `search_item_select` (id/name) |
| `apply_filter` | Filter applied | `filter_type`, `filter_value`, `user_id_custom` |
| `recommended` | Navigated via a recommendation | recommendation context |
| `view_image` | Product image viewed | |
| `zoom_image` | Product image zoomed | |
| `view_size_color_chart` | Size/color chart opened | |
| `view_comments` | Product comments/reviews viewed | |
| `read_more_about_product` | Read-more on description | |
| `button_clicked` | Generic button click | button name (see `GA_BUTTONS_NAMES`) |
| `programming_event` | Internal/programmatic event | |

### Engagement
| Event (`action`) | Description | Key params |
|---|---|---|
| `like_item` | Product liked | product id |
| `add_product_to_favorites` | Added to wishlist/favorites | product id |
| `share_content` | Content shared | channel (whatsapp/telegram/email/…) |
| `enable_product_notifications` | Back-in-stock / product notify enabled | product id |
| `change_color` | Variant color changed | color |
| `change_size` | Variant size changed | size |
| `item_variant _exchange` | Variant swapped _(note: name has a literal space — legacy)_ | |
| `exception` | Handled exception logged via GA | `description` (see `GA_EXCEPTIONS_DESCRIPTIONS`) |

### Commerce (GA taxonomy — coexists with the richer order stream in §2)
| Event (`action`) | Description | Key params |
|---|---|---|
| `add_to_cart` | Item added to cart | items, value |
| `remove_from_cart` | Item removed from cart | items |
| `view_cart` | Cart viewed | items, value |
| `begin_checkout` | Checkout started | items, value |
| `add_shipping_info` | Shipping address added | `shipping_tier` (Paid/Free), items |
| `add_payment_info` | Payment method added | payment type |
| `purchase` | Order completed | transaction id, value, items |
| `coupon_page_viewed` | Coupon entry viewed | |
| `coupon_used` | Coupon applied on order | coupon code |

---

## 2. Order-funnel events (PostHog-only)

Emitted by `trackOrder()` (`utils/orderFunnel.ts`), names from `ORDER_EVENTS`. All carry
the [order base props](#auto-attached-to-every-order-event-utilsorderfunnelts).
**Full reference (per-event props, files, funnel build):** `docs/posthog-order-funnel.md`.
Summary of what exists today:

| Group | Events |
|---|---|
| Cart edit | `order_add_to_cart` (enriched: `source`, `has_discount`, `is_flash_deal`, `is_luck`, `color_changed`, `size_changed`, `brand`, `category`, `quantity`, `price`, `original_price`, …), `cart_item_qty_increased`, `cart_item_qty_decreased`, `cart_item_removed`, `cart_item_moved_to_old`, `old_cart_item_removed`, `old_cart_cleared`, `order_cart_viewed` |
| Discount | `coupon_apply_attempt`, `coupon_apply_succeeded`, `coupon_apply_failed`, `discount_totals_shown`, `order_coupon_used` |
| Checkout entry | `order_begin_checkout` (mints `order_attempt_id`), `checkout_address_screen_viewed` |
| Address | `address_list_opened` (`address_count`; checkout list bottom-sheet mount, `AddressListContainer.tsx`), `address_add_started` (`source`; "Add New Shipping Address" tap, `AddressListContainer.tsx`), `address_saved`, `address_save_failed`, `address_selected`, `address_deleted` |
| Payment method | `payment_method_selected` (`payment_type`, `auto_selected`) |
| Confirm step | `checkout_confirm_clicked`, `checkout_blocked_address_missing`, `checkout_blocked_payment_missing`, `checkout_blocked_balance_insufficient`, `checkout_blocked_phone_unverified`, `checkout_blocked_cart_unavailable`, `checkout_empty_cart` |
| Verify sub-flow | `verify_flow_opened` (`flow_source`; verify widget mount, `ConfirmMobilePhoneWidget.tsx`), `verify_otp_failed` (`flow_source`, `reason`; OTP failure, `services/auth.ts:VerifyOtp`), `verify_completed_returned_to_checkout` (`flow_source`; verify success when opened from checkout, `ConfirmMobilePhoneWidget.tsx`) |
| Place order | `terms_agreed_toggled`, `place_order_clicked`, `place_order_blocked_terms_not_agreed`, `place_order_blocked_phone_unverified`, `place_order_blocked_cart_unavailable`, `place_order_empty_cart` |
| Payment exec (COD/crypto/card) | `order_submit_attempt`, `payment_redirect_opened`, `order_place_failed` (`reason`, `stage`, `payment_method`) |
| Payment exec (wallet) | `wallet_modal_opened`, `wallet_payment_attempt`, `wallet_payment_blocked_insufficient`, `wallet_payment_processing`, `wallet_payment_succeeded`, `wallet_payment_timeout`, `wallet_payment_failed`, `wallet_currency_changed`, `wallet_data_load_failed`, `wallet_balance_refreshed` (refresh icon, `PaymentMethod.tsx`) |
| Completion | `order_completed` (clears `order_attempt_id`), `order_success_done_clicked` |

> **`flow_source`** on the verify events is resolved by `resolveVerifyFlowSource()` from the
> auth store's `shouldAuthinticated` marker: `"open Story"→story`, `"open chat"→chat`,
> `"seller"→seller`, and the bare boolean gate (cart/checkout purchase buttons) → `checkout`.
> `verify_completed_returned_to_checkout` fires **only** when `flow_source === "checkout"`.

---

## How to add a new event

1. **Pick the stream.**
   - Checkout-funnel step / drop-off (cart is live) → add to `ORDER_EVENTS`, call `trackOrder()`.
   - Post-purchase order-management (cart is empty) → add to `ORDER_MGMT_EVENTS`, call
     `trackOrderMgmt()` (see §3).
   - Cross-cutting event that should also live in GA → `GAevent()` with a name in `GA_EVENT_NAMES`.
   - Never call `posthog.capture` directly — go through a wrapper.
2. **Use snake_case**, PostHog-friendly names. Import the constant; never hardcode strings.
3. **Add a row here** (event name, when it fires, key props, file) in the same PR — this is
   mandated by `CLAUDE.md`.
4. Verify on a **preview/prod deploy** (wrappers early-return in dev) — watch it land in
   PostHog → Activity.

---

## 3. Order-management events (PostHog-only) — `ORDER_MGMT_EVENTS`

Everything that happens to an order **after `order_completed`** — the order history +
order-management UI under `components/setting/orders/**` and `components/Orders/**`, backed by
`services/order.ts` / `services/orders.ts`. All are now wired.

Emitted by **`trackOrderMgmt()`** (`utils/orderFunnel.ts`), names from `ORDER_MGMT_EVENTS`.
These do **not** use `trackOrder()`: `baseProps()` reads the live `cart` / `total` /
`order_attempt_id`, which are empty post-purchase. `trackOrderMgmt` instead attaches a
cart-free base set: **`screen`, `currency`, `user_id`** (explicit props override).

### Browse past orders
| Event | Fires when | Props | File |
|---|---|---|---|
| `order_history_viewed` | Orders list first page loads (per applied filter, not per scroll page) | `status_filter`, `order_count`, `page` | `OrdersListWrapper.tsx` |
| `order_history_filtered` | Status tab changed (skipped if unchanged) | `from_status`, `to_status` | `OrdersListWrapper.tsx` |
| `order_details_viewed` | Order detail screen's first load (ref-gated; refreshes don't re-fire) | `order_id`, `order_group_id`, `order_status`, `item_count` | `OrderDetailsWrapper.tsx` |

### Modify / cancel / return / rate a placed order
| Event | Fires when | Props | File |
|---|---|---|---|
| `order_item_change_requested` | "Change Product Request" confirmed → `changeOrderItemVariant()` | `change_type` (`Color`/`Size`), `order_detail_id`, `product_id`, `from_variant`, `to_variant` | `confirmations/ChangeOrderItemConfirmWindow.tsx` |
| `order_address_changed` | "Change Delivery Address & Note" confirmed → `changeOrderAddress()` | `order_id`, `from_address_id`, `to_address_id`, `note_added` | `Orders/ChangeAddressWidget.tsx` |
| `order_cancelled` | "Cancel This Pack" confirmed → `CancelOrder()` | `order_id`, `order_value`, `order_status`, `payment_type`, `cancel_reason` (selected reasons, threaded from `CancelOrderWrapper`) | `confirmations/OrderCancelConfirmationWindow.tsx` |
| `order_item_cancelled` | "Cancel This Product" (3-hr window) confirmed → `CancelOrderItem()` | `order_id`, `item_id`, `qty` | `confirmations/CancelOrderItemConfirmationWindow.tsx` |
| `order_return_requested` | "Return This Product" (24-hr, delivered) confirmed → `ReturnProduct()` / `UpdateReturnedProduct()` | `order_id`, `item_id`, `product_id`, `return_reason`, `is_update`, `qty`, `image_count` | `confirmations/OrderItemReturnConfirmationWindow.tsx` |
| `order_item_rated` | Star rating + comment submitted → `RateOrderWithhComment()` | `product_id`, `order_detail_id`, `star_rating`, `has_comment`, `image_count`, `is_edit` | `Orders/RatingOrderItem.tsx` |
| `order_item_reported` | "Report This Product" (delivery time/man/car) tapped | `order_id`, `item_id`, `product_id` | `OrderItemOptions.tsx` |

### Option-sheet entry points + list hygiene (denominators / lower-value)
| Event | Fires when | Props | File |
|---|---|---|---|
| `order_options_opened` | Order-level options bottom-sheet mounts | `order_id`, `order_group_id`, `order_status` | `OrderOptionsMenu.tsx` |
| `order_item_options_opened` | Item-level options bottom-sheet mounts | `order_id`, `item_id`, `product_id`, `order_status` | `OrderItemOptions.tsx` |
| `order_pack_hidden` | "Hide This Pack" tapped | `order_id`, `order_group_id` | `OrderOptionsMenu.tsx` |
| `order_item_hidden` | "Hide This Product" tapped | `order_id`, `item_id`, `product_id` | `OrderItemOptions.tsx` |

> `order_options_opened` / `order_item_options_opened` are the denominators for "opened menu →
> took an action" — pair them with the modify/cancel/return events above to measure intent-to-action.

---

## 4. Chat & stories events (PostHog-only)

Engagement-flow events for **chat** and **stories**, used to relate active users / purchasers to
those flows. Emitted by **`trackPosthog()`** (`utils/posthogEvents.ts`); names live in
`STORY_EVENTS` / `CHAT_EVENTS` — **not** in `GA_EVENT_NAMES` (no GA counterpart). Each carries the
shared [global props](#auto-attached-to-every-ga-mirrored-event-utilsgtagts) via `globalProps()`.
Funnel designs that use these: `funnels/chat-stories-funnels.md`.

> Stories *viewing* is already covered by the GA-mirrored `view_story` (§1) — these add the
> shoppable click + creation. Chat had zero custom events before this.

### Stories
| Event | Fires when | Props | File |
|---|---|---|---|
| `story_product_clicked` | "View Product" tapped in the story viewer (shoppable bridge) | `story_id`, `product_slug`, `story_type` | `components/Home/Stories/StoryViewer.tsx` |
| `story_link_clicked` | "View More" external link tapped | `story_id`, `story_type`, `link` | `components/Home/Stories/StoryViewer.tsx` |
| `story_uploaded` | Story upload succeeds (image + video paths) | `media_type` (`image`/`video`), `has_link` | `components/Home/Stories/AddStoryWidget.tsx` |

### Chat
| Event | Fires when | Props | File |
|---|---|---|---|
| `chat_opened` | Chat panel opens (`chatVar` → true) | — (global props only) | `components/Chat/ChatModal.tsx` |
| `chat_message_sent` | A message is sent — text + media (image/voice/video/file) | `conversation_id`, `message_type`, `is_order_chat`, `is_reply` | `components/Chat/pages/ConversationContainer.tsx` |
| `chat_product_shared` | A product is shared into a chat → `ShareProduct()` (commerce bridge) | `product_id`, `product_slug`, `receiver_user_id` | `services/chat.ts` |

---

## 5. Server-side OTP events

Emitted by **`captureOtpAttempt()`** (`utils/server/otpTelemetry.ts`) from the `sendOtpAction`
Server Action (`serverActions/sendOtp.ts`). Best-effort: **production-only**, never throws, and
fired in `after()` so it never adds latency to the send.

**Why a server stream exists at all:** the client `send_otp` event **cannot carry the IP** —
PostHog geo-enriches at ingestion and then discards the raw IP, so `properties.$ip` is `null` on
every client event (verified in-project). It also can't see two cases: server-side rate-limit
blocks, and scripted attackers hitting the RSC action endpoint directly (no browser → no client
event). `otp_send_attempt` is the authoritative, one-per-server-attempt record with the real IP.

| Event | Fires when | Props | File |
|---|---|---|---|
| `otp_send_attempt` | Every send that reaches `sendOtpAction` — one per outcome branch | `outcome` (`sent`/`blocked`/`failed`), `block_reason` (`cooldown`/`session_cap`/`ip_cap`/`ok`/`backend_rejected`/`no_verification_id`), `ip` (raw client IP — the blocklist value), `normalized_ip` (IPv6→/64, the Redis key), `is_whatsapp`, `source` (`server_action`) | `serverActions/sendOtp.ts` |

Notes:
- `distinct_id` is the hashed durable session key (`sid`, from the `VISIT-ID` cookie) — no PII,
  stable across the token/user-id churn the limiter defends against.
- `$process_person_profile: false` (no person profile, mirrors the client `identified_only`
  config) and `$geoip_disable: true` (don't geo-resolve the *server's* IP).
- **`ip` is PII.** It's stored deliberately for abuse forensics/blocklisting. Blocking itself
  happens at the **Vercel Firewall** edge, not in PostHog.
- Insight + how to read it: `docs/posthog-otp-abuse-insight.md`.

---

## Future ideas (not yet wired)

Post-purchase flows that exist in `services/order.ts` but aren't instrumented yet, if deeper
coverage is wanted later: **return cancellation** (`CancelReturn()` / `CancelReturnRequest()`,
`OrderDetailsWrapper.tsx`), **return confirmation** (`ConfirmReturnRequest()`), and
**order/delivery chat opened** (`getChatWithShipping`, `OrderDetailsWrapper.tsx`). Add to
`ORDER_MGMT_EVENTS` + `trackOrderMgmt()` and document in §3 when wired.
