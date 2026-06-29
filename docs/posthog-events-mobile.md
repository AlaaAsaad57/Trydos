# PostHog — Mobile App Event Spec (parity with Web)

Hand-off for the **Trydos mobile (Flutter)** team. Send the **same event names + properties** the web
app sends so PostHog funnels/retention can mix web + mobile. Names are case-sensitive `snake_case` —
match exactly. Split any insight by `platform_source` to compare platforms.

> Web source of truth: `docs/posthog-events.md`. Match names/props; if a prop doesn't apply, omit it.

---

## Global properties (attach to EVERY event)

Register these once as **super properties** so they ride along on every capture automatically.

| Property | Value on mobile |
|---|---|
| `platform_source` | **`"MOBILE"`** (web sends `"WEB"`) — the field every insight is split by |
| `screen_name` | logical screen (e.g. `home_screen`, `product_screen`, `cart_screen`, `checkout_screen`) |
| `screen_path` | route/screen identifier |
| `country_name` | Syria / Turkey / Iraq / Lebanon |
| `device_language` | English / Turkish / Arabic / Kurdish |
| `device_type` | `mobile` / `tablet` |
| `operating_system` | `Android` / `iOS` |
| `session_id` | app session id |
| `user_id_guest` **or** `user_id_verify` | user id — `_guest` when phone unverified, `_verify` once verified |

**Identity:** `identify(user_id, { name, phone })` on login · `reset()` on logout.
**Production-only**, never let analytics throw, don't emit in debug builds.

---

## 1. Auth / onboarding
| Event | Properties |
|---|---|
| `login` | identity props |
| `sign_up` | |
| `login_start` | |
| `sign_up_start` | |
| `create_account_continue` | |
| `confirm_phone_number` | |
| `send_otp` | delivery method (`sms`/`whatsapp`) |
| `resend_otp` | |
| `verify_otp` | |
| `timer_expired` | |
| `cancel_login` | |
| `cancel_signup` | |
| `later_take_look_clicked` | |
| `terms_services` | |
| `custom_user_mapping` | |

## 2. Browsing / discovery
| Event | Properties |
|---|---|
| `screen_view_event` | `screen_name`, `screen_path` |
| `view_item` | `item_id`, `item_name` |
| `view_time_product` | `duration` |
| `view_item_list` | list context |
| `view_boutique_event` | `boutique_id` |
| `view_story` | `story_id`, `item_id`, `item_name`, `user_id_custom` |
| `view_story_button` | |
| `search` | `search_keyword`, `search_item_select` |
| `apply_filter` | `filter_type`, `filter_value`, `user_id_custom` |
| `recommended` | recommendation context |
| `view_image` | |
| `zoom_image` | |
| `view_size_color_chart` | |
| `view_comments` | |
| `read_more_about_product` | |
| `button_clicked` | `button_name` (snake_case, e.g. `add_to_bag_button`) |
| `programming_event` | |

## 3. Engagement
| Event | Properties |
|---|---|
| `like_item` | `product_id` |
| `add_product_to_favorites` | `product_id` |
| `share_content` | channel (`whatsapp`/`telegram`/`facebook`/`twitter`/`email`/`copy_link`) |
| `enable_product_notifications` | `product_id` |
| `change_color` | `color` |
| `change_size` | `size` |
| `item_variant_exchange` | |
| `exception` | `description` (e.g. `otp_incorrect`, `otp_send_failed`) |

## 4. Commerce (GA taxonomy)
| Event | Properties |
|---|---|
| `add_to_cart` | items, value |
| `remove_from_cart` | items |
| `view_cart` | items, value |
| `begin_checkout` | items, value |
| `add_shipping_info` | `shipping_tier` (Paid/Free), items |
| `add_payment_info` | payment type |
| `purchase` | transaction id, value, items |
| `coupon_page_viewed` | |
| `coupon_used` | coupon code |

## 5. Order funnel (PostHog-only)
Mint **`order_attempt_id`** (UUID) at `order_begin_checkout`, attach to every event below, clear at
`order_completed`. Every event also carries these **base props**: `order_attempt_id`, `screen`,
`currency`, `item_count`, `cart_value`, `is_phone_verified`, `user_id`.

| Event | Properties |
|---|---|
| `add_to_cart_widget_opened` | `product_id`, `item_name`, `brand`, `category`, `is_luck`, `is_flash_deal`, `source` |
| `add_to_cart_buy_clicked` (fire **before** validation) | `product_id`, `item_name`, `brand`, `category`, `variant`, `selected_color`, `selected_size`, `is_valid`, `reached_max`, `already_in_cart`, `is_luck`, `source` |
| `order_add_to_cart` (successful add only) | `source`, `has_discount`, `is_flash_deal`, `is_luck`, `color_changed`, `size_changed`, `brand`, `category`, `quantity`, `price`, `original_price` |
| `cart_item_qty_increased` / `cart_item_qty_decreased` / `cart_item_removed` | |
| `cart_item_moved_to_old` / `old_cart_item_removed` / `old_cart_cleared` / `order_cart_viewed` | |
| `coupon_apply_attempt` / `coupon_apply_succeeded` / `coupon_apply_failed` / `discount_totals_shown` / `order_coupon_used` | |
| `order_begin_checkout` (mints id) / `checkout_address_screen_viewed` | |
| `address_list_opened` | `address_count` |
| `address_add_started` | `source` |
| `address_saved` / `address_save_failed` / `address_selected` / `address_deleted` | |
| `payment_method_selected` | `payment_type`, `auto_selected` |
| `checkout_confirm_clicked` | |
| `checkout_blocked_address_missing` / `checkout_blocked_payment_missing` / `checkout_blocked_balance_insufficient` / `checkout_blocked_phone_unverified` / `checkout_blocked_cart_unavailable` / `checkout_empty_cart` | |
| `verify_flow_opened` / `verify_otp_failed` / `verify_completed_returned_to_checkout` | `flow_source` (`story`/`chat`/`seller`/`checkout`), `reason` |
| `terms_agreed_toggled` / `place_order_clicked` | |
| `place_order_blocked_terms_not_agreed` / `place_order_blocked_phone_unverified` / `place_order_blocked_cart_unavailable` / `place_order_empty_cart` | |
| `order_submit_attempt` / `payment_redirect_opened` | |
| `order_place_failed` | `reason`, `stage`, `payment_method` |
| `wallet_modal_opened` / `wallet_payment_attempt` / `wallet_payment_blocked_insufficient` / `wallet_payment_processing` / `wallet_payment_succeeded` / `wallet_payment_timeout` / `wallet_payment_failed` / `wallet_currency_changed` / `wallet_data_load_failed` / `wallet_balance_refreshed` | |
| `order_completed` (clears id) / `order_success_done_clicked` | |

## 6. Post-purchase order management
Cart is empty here — base props are just `screen`, `currency`, `user_id`.

| Event | Properties |
|---|---|
| `order_history_viewed` | `status_filter`, `order_count`, `page` |
| `order_history_filtered` | `from_status`, `to_status` |
| `order_details_viewed` | `order_id`, `order_group_id`, `order_status`, `item_count` |
| `order_item_change_requested` | `change_type` (`Color`/`Size`), `order_detail_id`, `product_id`, `from_variant`, `to_variant` |
| `order_address_changed` | `order_id`, `from_address_id`, `to_address_id`, `note_added` |
| `order_cancelled` | `order_id`, `order_value`, `order_status`, `payment_type`, `cancel_reason` |
| `order_item_cancelled` | `order_id`, `item_id`, `qty` |
| `order_return_requested` | `order_id`, `item_id`, `product_id`, `return_reason`, `is_update`, `qty`, `image_count` |
| `order_item_rated` | `product_id`, `order_detail_id`, `star_rating`, `has_comment`, `image_count`, `is_edit` |
| `order_item_reported` | `order_id`, `item_id`, `product_id` |
| `order_options_opened` | `order_id`, `order_group_id`, `order_status` |
| `order_item_options_opened` | `order_id`, `item_id`, `product_id`, `order_status` |
| `order_pack_hidden` | `order_id`, `order_group_id` |
| `order_item_hidden` | `order_id`, `item_id`, `product_id` |

## 7. Chat / stories / product page
| Event | Properties |
|---|---|
| `story_product_clicked` | `story_id`, `product_slug`, `story_type` |
| `story_link_clicked` | `story_id`, `story_type`, `link` |
| `story_uploaded` | `media_type` (`image`/`video`), `has_link` |
| `chat_opened` | — |
| `chat_message_sent` | `conversation_id`, `message_type`, `is_order_chat`, `is_reply` |
| `chat_product_shared` | `product_id`, `product_slug`, `receiver_user_id` |
| `delivery_stats_viewed` | `product_id`, `expected_days` |

---

## Flutter examples (`posthog_flutter`)

**1 — Wrapper: global props + identity** (register super props once; reuse `track` everywhere)
```dart
final _ph = Posthog();

Future<void> bootstrap() async {
  await _ph.register('platform_source', 'MOBILE'); // most important
  await _ph.register('country_name', country);
  await _ph.register('device_language', language);
  await _ph.register('session_id', sessionId);
  await _ph.register('operating_system', os);      // Android | iOS
  await _ph.register('device_type', deviceType);   // mobile | tablet
}

Future<void> track(String event, [Map<String, Object>? props]) async {
  if (!kReleaseMode) return;                 // prod only
  try { await _ph.capture(eventName: event, properties: props ?? const {}); } catch (_) {}
}

// login / logout
await _ph.identify(userId: user.id, userProperties: {'name': user.name, 'phone': user.phone});
await track('login');
// ...later
await _ph.reset();
```

**2 — Add-to-cart drop-off funnel** (fire the buy-click *before* validation)
```dart
await track('add_to_cart_widget_opened', {'product_id': p.id, 'source': 'product_page'});

await track('add_to_cart_buy_clicked', {                 // every tap, even failed ones
  'product_id': p.id, 'is_valid': isValid, 'reached_max': reachedMax,
  'selected_color': color, 'selected_size': size,
});

if (isValid && !reachedMax) {
  await track('order_add_to_cart', {'product_id': p.id, 'quantity': qty, 'price': price});
}
```

**3 — Order funnel with `order_attempt_id` correlation**
```dart
String? attemptId;
Map<String, Object> base() => {
  if (attemptId != null) 'order_attempt_id': attemptId!,
  'screen': 'checkout_screen', 'currency': cart.currency,
  'item_count': cart.items.length, 'cart_value': cart.total,
  'is_phone_verified': user.verified, 'user_id': user.id,
};

attemptId = const Uuid().v4();          // mint at entry
await track('order_begin_checkout', base());
await track('place_order_clicked', base());
await track('order_completed', base());
attemptId = null;                       // clear on completion
```
