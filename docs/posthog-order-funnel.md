# PostHog — Create-Order Funnel & Event Reference

_Trydos (Next.js 16 · React 19 · Vercel · Go backend). Companion to `posthog-vs-smartlook-comparison.md`._

This documents **every PostHog event** in the add-to-cart → place-order journey: the **old** events (GA events that already reach PostHog via the `GAevent` → `posthogCapture` fan-out) and the **new** PostHog-only funnel/diagnostic events added for drop-off analysis.

---

## How it works

### Two event streams reach PostHog
1. **Old (GA-mirrored).** `utils/gtag.ts:GAevent()` fans every GA event out to `posthogCapture` (wired in the PostHog migration). So GA's commerce taxonomy (`add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `coupon_used`, login/OTP events…) already exists in PostHog with the GA event names.
2. **New (PostHog-only).** `utils/orderFunnel.ts` emits funnel-step + abandon/blocker + error events via `trackOrder()` → `posthogCapture` only. These never touch the GA stream. They are prefixed/scoped to the order journey and cover the transitions GA never recorded.

### Helper — `utils/orderFunnel.ts`
- `trackOrder(event, props)` — single entry point. Merges **base props** (below) then PostHog-captures. No-op off-client / outside production; never throws.
- `startOrderAttempt()` — mints `order_attempt_id` (UUID) at `begin_checkout`, stashes it on `orderData` (store merges partials).
- `endOrderAttempt()` — clears it at `order_completed`.
- `ORDER_EVENTS` — the canonical name enum (import, don't hardcode strings).

### Base props (auto-attached to every `trackOrder` event)
`order_attempt_id`, `screen` (`DetectScreen()`), `currency`, `item_count`, `cart_value`, `is_phone_verified`, `user_id`. Explicit props override these.

### Correlation
One checkout attempt — including retries and abandons — shares a single `order_attempt_id` from `begin_checkout` to `order_completed`. Use it to trace a single user's full path and to spot retry loops.

---

## Old events (GA → PostHog, already live)

| PostHog name (GA) | Stage | Fires at | File |
|---|---|---|---|
| `add_to_cart` | cart | add / qty+1 | `AddToCart/Button.tsx`, `Cart/index.tsx` |
| `remove_from_cart` | cart | qty→0 / remove | `AddToCart/Button.tsx` |
| `view_cart` | cart | cart opened w/ items | `Cart/index.tsx:88` |
| `change_color` / `change_size` | variant | variant slider | `AddToCartComponent.tsx` |
| `begin_checkout` | checkout | go to checkout | `CartProvider.tsx` |
| `add_shipping_info` | address | default address set | `ShippingAddressContainer.tsx` |
| `add_payment_info` | payment | method chosen | `PaymentMethod.tsx` (×4) |
| `purchase` | done | order success screen | `OrderSuccess.tsx` |
| `coupon_page_viewed` / `coupon_used` | discount | coupon view / applied at success | `CartProvider.tsx`, `OrderSuccess.tsx` |
| `login` / `sign_up` / `login_start` / `confirm_phone_number` / `send_otp` / `resend_otp` / `verify_otp` | verify | login + OTP flow | `components/Login/*` |

> These keep their GA names in PostHog. The new events below are **additive** — they capture the transitions and failures GA never emitted.

---

## New events (PostHog-only) — `ORDER_EVENTS`

All names are the literal event strings sent to PostHog.

### Cart edit
| Event | Fires when | Key props | File |
|---|---|---|---|
| `order_add_to_cart` | item added (enriched — see below) | full add-to-cart context | `AddToCart/Button.tsx` |
| `cart_item_qty_increased` | + in cart | `from_qty`,`to_qty`,`unit_price` | `Cart/index.tsx` |
| `cart_item_qty_decreased` | − in cart | same | `Cart/index.tsx` |
| `cart_item_removed` | delete from cart / qty→0 | `qty`,`unit_price`,`variant` | `Cart/index.tsx`, `AddToCart/Button.tsx` |
| `cart_item_moved_to_old` | "move to old cart" | `product_id`,`variant` | `Cart/index.tsx` |
| `old_cart_item_removed` | hide one old item | `product_id` | `OldCartContainer.tsx` |
| `old_cart_cleared` | "Hide All" | `item_count` | `OldCartContainer.tsx` |
| `order_cart_viewed` | cart opened w/ items | `item_count` | `Cart/index.tsx` |

### Discount / coupon
| Event | Fires when | Key props | File |
|---|---|---|---|
| `coupon_apply_attempt` | tap Apply | `coupon_code` | `couponElement.tsx` |
| `coupon_apply_succeeded` | coupon valid | `discount_value` | `couponElement.tsx` |
| `coupon_apply_failed` | coupon rejected | `reason` | `couponElement.tsx` |
| `discount_totals_shown` | non-zero savings rendered | `total_discount`,`discount_pct` | `OrderButton.tsx` |
| `order_coupon_used` | coupon on completed order | `coupon_code`,`coupon_discount_rate` | `OrderSuccess.tsx` |

### Checkout entry
| Event | Fires when | File |
|---|---|---|
| `order_begin_checkout` ⚓ | enter checkout — **mints `order_attempt_id`** | `CartProvider.tsx` |
| `checkout_address_screen_viewed` | shipping/payment screen shown | `OrdersPage.tsx` |

### Address
| Event | Fires when | File |
|---|---|---|
| `address_saved` | address added OK | `services/order.ts` |
| `address_save_failed` | add address error | `services/order.ts` |
| `address_selected` | default address active | `ShippingAddressContainer.tsx` |
| `address_deleted` | address deleted | `OrdersPage.tsx` |

### Payment method
| Event | Props | File |
|---|---|---|
| `payment_method_selected` | `payment_type` ∈ `wallet`/`cash_on_delivery`/`crypto`/`credit` (+`auto_selected` for wallet) | `PaymentMethod.tsx` |

### Confirm shipping + payment (step 1.0 → 1.1)
| Event | Meaning | File |
|---|---|---|
| `checkout_confirm_clicked` | tapped Confirm Shipping & Payment | `OrdersPage.tsx` |
| `checkout_blocked_address_missing` | no address selected | `OrdersPage.tsx` |
| `checkout_blocked_payment_missing` | no payment selected | `OrdersPage.tsx` |
| `checkout_blocked_balance_insufficient` | wallet balance < total | `OrdersPage.tsx` |
| `checkout_blocked_phone_unverified` ★ | **blocked at verify-number gate** | `OrdersPage.tsx` |
| `checkout_blocked_cart_unavailable` | item OOS/restricted mid-checkout | `OrdersPage.tsx` |
| `checkout_empty_cart` | cart emptied | `OrdersPage.tsx` |

### Place order (final)
| Event | Meaning | File |
|---|---|---|
| `terms_agreed_toggled` | agree-terms checkbox (`agreed` bool) | `PlaceOrderButtons.tsx` |
| `place_order_clicked` | tapped Place Order | `PlaceOrderButtons.tsx` |
| `place_order_blocked_terms_not_agreed` | terms unchecked | `PlaceOrderButtons.tsx` |
| `place_order_blocked_phone_unverified` ★ | verify-number gate at final step | `PlaceOrderButtons.tsx` |
| `place_order_blocked_cart_unavailable` | item unavailable | `PlaceOrderButtons.tsx` |
| `place_order_empty_cart` | cart emptied | `PlaceOrderButtons.tsx` |

### Payment execution — COD / crypto / card
| Event | Meaning | File |
|---|---|---|
| `order_submit_attempt` | PlaceOrder called (`payment_method`) | `OrdersPage.tsx` |
| `payment_redirect_opened` ★ | external gateway opened (crypto/card) — user leaves app | `services/order.ts` |
| `order_place_failed` ★ | PlaceOrder error (`reason`,`stage`,`payment_method`) | `services/order.ts`, `OrdersPage.tsx` |

### Payment execution — wallet
| Event | Meaning | File |
|---|---|---|
| `wallet_modal_opened` | wallet pay modal shown | `PlaceOrderButtons.tsx` |
| `wallet_payment_attempt` | Confirm wallet payment | `WalletPaymentModal.tsx` |
| `wallet_payment_blocked_insufficient` | balance < amount | `WalletPaymentModal.tsx` |
| `wallet_payment_processing` | order-conversion polling started | `WalletPaymentModal.tsx` |
| `wallet_payment_succeeded` | wallet order confirmed | `WalletPaymentModal.tsx` |
| `wallet_payment_timeout` | polling timed out | `WalletPaymentModal.tsx` |
| `wallet_payment_failed` ★ | wallet checkout error (`stage`,`reason`) | `WalletPaymentModal.tsx` |
| `wallet_currency_changed` | currency switched | `WalletPaymentModal.tsx` |
| `wallet_data_load_failed` | wallet data load error | `WalletPaymentModal.tsx` |

### Completion
| Event | Meaning | File |
|---|---|---|
| `order_completed` ⚓ | success screen — **funnel end, clears `order_attempt_id`** | `OrderSuccess.tsx` |
| `order_success_done_clicked` | tapped Done / back-to-home | `PlaceOrderButtons.tsx` |

---

## `order_add_to_cart` — enriched props (emphasis)

Fired from `AddToCart/Button.tsx` on every add. Beyond the base props it carries everything needed to answer "what kind of add was this, and from where":

| Prop | Meaning |
|---|---|
| `product_id`, `item_name`, `variant` | product + chosen variation id |
| `brand`, `brand_id`, `category`, `category_id` | merchandising dimensions |
| `quantity`, `price`, `original_price` | qty added, paid price, list price |
| `has_discount` | `original_price > price` — was it discounted? |
| `is_flash_deal` | `flash_deal_end_date` / `flash_deal_details` present — flash deal? |
| `is_luck` | lucky-deal product? |
| `color_changed` | did the user actively change color before adding? |
| `size_changed` | did the user actively change size before adding? |
| `selected_color`, `selected_size` | the chosen options |
| `source` | **source surface** (see mapping) |

`color_changed` / `size_changed` come from refs in `AddToCartComponent` set in the color/size change handlers and reset when the product changes — so they reflect genuine user interaction, not the default selection.

### `source` mapping (`DetectScreen()` in `utils/tinyUtils.tsx`)
| Path | `source` value | Meaning |
|---|---|---|
| `?cart=true` | `cart_screen` | added from cart |
| `/products...` | `product_screen` | **product page** |
| `/filters/boutique` | `boutique_screen` | **boutique page** |
| `/filters...` | `filters_screen` | **search / filter page** |
| `tags_names` | `tags_filters_screen` | tag listing |
| else | `home_screen` | **homepage** |

So you can break `order_add_to_cart` down by `source` to see adds from homepage vs product page vs search/filter vs boutique, and cross with `has_discount` / `is_flash_deal` / `is_luck` / `color_changed` / `size_changed`.

---

## Build the funnel in PostHog

Primary conversion funnel (ordered):
```
order_begin_checkout
  → address_selected
  → payment_method_selected
  → checkout_confirm_clicked
  → place_order_clicked
  → order_submit_attempt      (or wallet_payment_attempt for wallet)
  → order_completed
```
Break each drop down by the sibling `*_blocked_*` / `*_failed` events to see the exact stall:
- **verify-number** → `checkout_blocked_phone_unverified`, `place_order_blocked_phone_unverified`
- **address** → `checkout_blocked_address_missing`
- **payment** → `checkout_blocked_payment_missing`, `checkout_blocked_balance_insufficient`
- **terms** → `place_order_blocked_terms_not_agreed`
- **gateway** → `payment_redirect_opened` then no `order_completed`
- **wallet** → `wallet_payment_failed` / `wallet_payment_timeout`
- **cart/stock** → `checkout_blocked_cart_unavailable`, `*_empty_cart`

Use `order_attempt_id` as the funnel correlation property for accurate multi-step / retry attribution.

---

## Verify-number sub-flow (note)

The OTP/verify events (`login_start`, `confirm_phone_number`, `send_otp`, `verify_otp`) already reach PostHog via the GA fan-out. The **"user stops at verify number"** signal is captured directly by `checkout_blocked_phone_unverified` / `place_order_blocked_phone_unverified`.

Optional future enhancement: tag the login events with `flow_source: "checkout"` when the login widget is opened from the checkout gate, to isolate checkout-driven verification drop from login started elsewhere. Reserved names: `verify_flow_opened`, `verify_otp_failed`, `verify_completed_returned_to_checkout` (in `ORDER_EVENTS`, not yet wired).

---

## Routing & safety
- **PostHog-only** — `trackOrder` → `posthogCapture`; GA untouched. No backend.
- No-op outside production / off-client; all calls swallow errors. Analytics never breaks checkout.
- Verify on a **preview/prod deploy** (wrappers early-return in dev). Watch events land live in PostHog → Activity, then build the funnel.
