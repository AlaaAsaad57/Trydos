# CO-02 — Notify Me When Available

| | |
|---|---|
| **Feature ID** | CO-02 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/AddToCart/NotifyButton.tsx`, `components/Cart/AddToCart/AddToCartComponent.tsx`, `services/auth.ts`, `services/home.ts` |

---

## What it is

A **"tell me when it's back" subscription** for out-of-stock items. When a shopper wants a variant
that isn't currently available, they can ask to be alerted (via push notification) when it returns
to stock.

## Where it appears

Inside the **add-to-bag sheet** (CO-01): when the selected variant is sold out (or the product is
inactive / not sold in the shopper's country), the normal "Add To Bag" button is replaced by a
**"Notify Me When Variant Is Available"** button.

> A second, related "notify me about this product" control also exists in the product page's
> More-options menu (SD-30) — it subscribes to notification *topics* for the product. Both surfaces
> ultimately call the same subscribe/unsubscribe endpoints.

## Who uses it

Any shopper who lands on an out-of-stock variant and wants to be told when it comes back.

## How it works (verified behaviour)

- **The button is only shown when it's needed** — i.e. the chosen variant has zero stock, or the
  product is inactive / country-restricted.
- **Tapping it** first asks for notification permission (Firebase/OS), registers the device's push
  token, then subscribes the shopper to that product's availability topic
  (`product_availability_{productId}`, with the variant included where known).
- **The button relabels** from *"Notify Me When Variant Is Available"* to *"We Will Inform You When
  Variant Is Available"* to confirm the subscription.
- **Already subscribed?** It shows *"You will be notified for this product already"*.
- **If permission is denied / it fails**, it shows an error: *"Notification Is Not Enabled! please
  Allow Notification Access"*.
- **Analytics:** subscribing fires the `ENABLE_PRODUCT_NOTIFICATION` Google Analytics event.

## Data source

| Item | Value |
|------|-------|
| Subscribe | `POST /firebase_device_tokens/subscribe_topic` — `{ topic, variant }` (`home.subscribeToTopicInventory`) |
| Unsubscribe | `POST /firebase_device_tokens/unsubscribe_topic` — `{ topic, variant }` (`home.UnsubscribeToTopicInventory`) |
| Topic string | Built client-side: `product_availability_{productId}` (add-to-cart flow) |
| Permission / token | `home.AllowNotifications()` → Firebase FCM registration |
| Backend | **Go backend** — both topic endpoints are on the Go allow-list; market/device token injected server-side |

## Technical reference

| Item | Value |
|------|-------|
| Button | `components/Cart/AddToCart/NotifyButton.tsx` (wrapped by `NotifyCartButton` in `AddToCartComponent.tsx`) |
| Subscribe action | `NotifyAction` in `AddToCartComponent.tsx` → `auth.NotifyForProducts({ id, variant })` → `home.subscribeToTopicInventory` |
| Show/hide logic | `shouldShowNotifyButton()` (out-of-stock / inactive / country-restricted) |
| "Notified" flag | `getSelectedVariantQty()?.variant_notify_for_user` |
| Related surface | `components/products/MoreOptionsSection.tsx` (`enableNotificationTopic`, topic chips) — see SD-30 |
| Analytics | GA `ENABLE_PRODUCT_NOTIFICATION` |

## Current status & maturity

**Live and stable.** The subscribe flow works end to end and is backed by the Go notification
service; the alert itself is delivered through the app's push infrastructure (Domain G).

## Known gaps / notes

- **Optimistic UI.** The button flips to "notified" *before* the subscribe request resolves; a
  failed request still surfaces the error toast, but there's a brief optimistic state.
- **No explicit success toast on first subscribe** (in the add-to-cart flow) — the confirmation is
  only the button relabel. (A toast *is* shown if you were already subscribed.)
- **Topic id is built on the client** (`product_availability_{id}`), and a variant string literally
  containing `"N/A"` is treated as "no variant" and dropped from the subscription — an edge-case
  string check, not a normal-path issue.

## Related features

CO-01 (Add to cart — where this button replaces "Add To Bag") · SD-30 (More-options "notify me"
topic subscription) · NT-01 / NT-07 (Push notifications / topic subscribe — the delivery side) ·
NT-09 (Back-in-stock push).
