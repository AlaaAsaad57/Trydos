# CO-13 — Pay With RDB at Checkout

| | |
|---|---|
| **Feature ID** | CO-13 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-09-16 (against `develop`) |
| **Source of truth** | `components/Cart/RdbPaymentModal.tsx`, `components/Cart/RdbPaymentLockedSheet.tsx`, `components/Cart/PaymentMethod.tsx`, `services/rdbPayment.ts` |

---

## What it is

Paying for an order through the shopper's **RDB wallet**. The shopper picks RDB like any other
payment method, and pays the **full order total** inside the RDB app — by scanning a QR code or
typing a short code. The browser never talks to RDB directly. It only asks the Trydos **core**
backend to start the payment, and then asks the core backend whether it landed.

This replaces the old flow, where the browser built a signed request itself and posted it
straight to a separate wallet backend. That code (`components/Cart/WalletPaymentModal.tsx` and
the signed `merchant/checkout` call) is deleted.

## Where it appears

At checkout, RDB is a normal row in the payment method list, next to cash on delivery, card and
crypto (`PaymentMethod.tsx`). The shopper taps it to select it, the same way they select any other
method — there is no auto-select and no "wallet covers the total" gate any more. Confirming "Place
Order" opens the **RDB payment screen** (`RdbPaymentModal.tsx`), which shows a QR code, a short
code and a countdown.

## Who uses it

Any shopper who wants to pay through their RDB wallet. RDB always collects the **full** order
amount — there is no partial-wallet or wallet-plus-cash option.

## How it works (verified behaviour)

- **Starting a payment.** The screen asks the core backend to create a payment request:
  `POST /customer/order/checkout/rdb`, with the shopper's default address id. The core backend
  works out the amount itself (cart total minus discount) — the browser sends no amount and no
  `pay_by_wallet` flag.
- **The payment screen.** On success the core backend returns a `qr_payload` (drawn as a QR
  code), a `short_code` (for manual entry), a `deep_link`, the `amount` and `currency` as strings,
  and an `expires_at` time. The amount is shown exactly as the backend sent it — the screen never
  parses it into a number.
  - The QR code is always shown.
  - An "Open the RDB app" button (the `deep_link`) is shown only on a mobile browser, because a
    desktop browser cannot open the RDB app.
  - A countdown ("Time left mm:ss") counts down to `expires_at`. When it reaches zero, the screen
    treats the request as expired and stops polling, even if the last poll had not confirmed it.
- **Polling.** Every 4 seconds the screen asks `GET /customer/order/rdb-request/{reference}` for
  the current status: `awaiting_payment`, `paid`, `expired`, `cancelled` or `failed`. A poll that
  fails to answer (a dropped request, a 404) is treated as "ask again," never as a failed payment.
- **Reaching an end state.**
  - `paid` — the screen loads the new orders through the existing cart-to-order lookup
    (`GET /customer/order/getOrdersByCartGroupID`) and moves on to the success screen. Orders exist
    **only** after this point; nothing is created earlier.
  - `expired` or `cancelled` — the screen tells the shopper and lets them try again.
  - `failed` — the screen shows the backend's `failure_reason`.
- **Cancelling.** A "Cancel payment" button calls
  `POST /customer/order/rdb-request/{reference}/cancel`. If the backend answers that the request
  is already paid, the screen reads the latest status instead of treating the cancel as failed.
- **The cart lock.** While a request is `awaiting_payment`, the core backend refuses cart writes
  and checkout with HTTP 409, carrying the pending request's reference. The
  `RdbPaymentLockedSheet` then shows "you have a payment in progress," with two buttons:
  "Continue payment" (reopens `RdbPaymentModal` on the same reference) and "Cancel payment" (the
  same cancel call as above).

## Data source

| Item | Value |
|------|-------|
| Start a payment | `POST /customer/order/checkout/rdb` (Trydos core backend) — `StartRdbPayment` |
| Poll status | `GET /customer/order/rdb-request/{reference}` (Trydos core backend) — `GetRdbRequest` |
| Cancel | `POST /customer/order/rdb-request/{reference}/cancel` (Trydos core backend) — `CancelRdbRequest` |
| Order lookup after `paid` | `GET /customer/order/getOrdersByCartGroupID?cart_group_id=…` (Trydos core backend) |
| Backend | All four calls go to the **core** backend, authorised with the same `MARKET-TOKEN` cookie every other checkout call uses. The browser never calls RDB directly. |

## Technical reference

| Item | Value |
|------|-------|
| Payment screen | `components/Cart/RdbPaymentModal.tsx` (opened from `PlaceOrderButtons.tsx`) |
| Cart-lock sheet | `components/Cart/RdbPaymentLockedSheet.tsx` |
| Payment method selection | `components/Cart/PaymentMethod.tsx` — RDB is method id `1`, a normal selectable row |
| Service layer | `services/rdbPayment.ts` — `StartRdbPayment`, `GetRdbRequest`, `CancelRdbRequest`, `readRdbLock` |
| Cart lock detection | `readRdbLock()` is called after every cart write in `services/cart.ts`, after checkout in `services/order.ts`, and after the old-cart calls in `services/home.ts` |
| Store | `store/Cart/reducer.ts` — `rdbLock` (`{ reference, expires_at }` or `null`), `setRdbLock` |
| Analytics | `rdb_request_created`, `rdb_request_start_failed`, `rdb_payment_paid`, `rdb_payment_expired`, `rdb_payment_ended`, `rdb_cart_lock_hit`, `rdb_cart_lock_cleared` — see `docs/posthog-events.md` |

## Current status & maturity

**Live.** The full flow — start a request, show the QR and short code, poll to `paid`, load the
resulting orders, and lock the cart while a request is open — is implemented and tested. The old
signed merchant call and its secret-leak bug are gone: that code no longer exists.

## Known gaps / notes

- **No wallet-plus-cash split.** RDB always collects the full order amount. This is a deliberate
  product decision, not a gap.
- **`expires_at` sets the countdown.** No code depends on how long a request actually lives — only
  the on-screen wording does.

## Related features

CO-10 (Payment method selection) · CO-11 (Place order) · CO-14 (Confirmation) · PW-01 (Wallet
balance & history) · PW-03 (Multi-currency balance) · PW-04 (Pay an order with RDB — the
wallet-domain view of this same feature).
