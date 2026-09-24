# PW-04 — Pay an Order With RDB

| | |
|---|---|
| **Feature ID** | PW-04 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | 🟢 Live |
| **Last verified** | 2026-09-16 (against `develop`) |
| **Source of truth** | `components/Cart/RdbPaymentModal.tsx`, `components/Cart/RdbPaymentLockedSheet.tsx`, `components/Cart/PaymentMethod.tsx`, `services/rdbPayment.ts` |

---

> This is the same capability documented from the checkout side as **CO-13**; this page is the
> wallet-domain view of it.

## What it is

Paying for an order through the shopper's **RDB wallet**, for the full order total, with no card
and no cash. The Trydos storefront does not talk to RDB itself. It asks the Trydos **core**
backend to create a payment request, and the shopper finishes the payment **inside the RDB app** —
by scanning a QR code or by typing a short code shown on the payment screen.

The old flow signed a request in the browser and posted it straight to a separate wallet backend
(`components/Cart/WalletPaymentModal.tsx`, `POST {WALLET}/merchant/checkout`, HMAC-signed). That
code, and every merchant key and signature it used, is deleted. RDB is no longer treated as a
black box the storefront has to sign requests for — it is three plain HTTP endpoints on the core
backend.

## Where it appears

At checkout: RDB is a **normal, selectable** payment method row, the same as cash on delivery,
card or crypto (`PaymentMethod.tsx`, method id `1`, label "RDB Wallet"). There is no auto-select
and no forced "wallet covers the total" gate — the shopper picks RDB the way they pick any other
method. Confirming "Place Order" opens the **RDB payment screen**
(`components/Cart/RdbPaymentModal.tsx`), which shows the QR code, the short code, the amount, and
a countdown.

## Who uses it

Any shopper who wants to pay through RDB. RDB always collects the **full** order amount — there is
no partial-wallet payment and no wallet-plus-cash split.

## How it works (verified behaviour)

- **Starting a payment.** The screen calls `POST /customer/order/checkout/rdb` on the core
  backend, sending the shopper's default address id. The core backend decides the amount (cart
  total minus discount) and creates the payment request on RDB itself; the browser never computes
  or signs anything.
- **QR, short code, deep link.** The response carries `qr_payload` (drawn as a QR image),
  `short_code` (for typing into the RDB app), `deep_link` (an `rdb://` link), `amount` and
  `currency` (shown exactly as the strings the backend sent — never parsed into a number), and
  `expires_at`. The QR is always drawn; the "Open the RDB app" button only appears on a mobile
  browser, since a desktop browser cannot follow an `rdb://` link.
- **Polling.** The screen asks `GET /customer/order/rdb-request/{reference}` every 4 seconds for
  the current status. A poll that fails to answer is treated as "ask again," not as a failure.
- **The five statuses.**
  | Status | What the screen does |
  |---|---|
  | `awaiting_payment` | keep polling until `expires_at` |
  | `paid` | orders exist now — load them via the existing cart-to-order lookup and move to the success screen |
  | `expired` | tell the shopper; the cart is unlocked; they may pay again |
  | `cancelled` | same as expired |
  | `failed` | show the backend's `failure_reason`; the cart is unlocked |
- **Cancel.** A "Cancel payment" button calls
  `POST /customer/order/rdb-request/{reference}/cancel`. If the backend says the request is
  already paid, the screen reads the latest status instead of reporting a failed cancel.
- **The cart is locked while a request is open.** While any request is `awaiting_payment`, the
  core backend answers cart writes and checkout with HTTP 409 and the pending reference. The
  `RdbPaymentLockedSheet` shows "you have a payment in progress" with two buttons: "Continue
  payment" (reopens the payment screen on that reference) and "Cancel payment."
- **No wallet spend for other methods.** Since this change, cash on delivery, crypto and card
  never take a share from the Trydos wallet either — `pay_by_wallet` is gone from every checkout
  call.

## Data source

| Item | Value |
|------|-------|
| Start a payment | `POST /customer/order/checkout/rdb` (Trydos **core** backend) — `services/rdbPayment.ts:StartRdbPayment` |
| Poll status | `GET /customer/order/rdb-request/{reference}` (Trydos core backend) — `GetRdbRequest` |
| Cancel | `POST /customer/order/rdb-request/{reference}/cancel` (Trydos core backend) — `CancelRdbRequest` |
| Order lookup after `paid` | `GET /customer/order/getOrdersByCartGroupID?cart_group_id=…` (Trydos core backend) |
| Backends | All four calls go to the Trydos **core** backend, authorised with the `MARKET-TOKEN` cookie. There is no direct call from the browser to RDB, and no separate wallet backend involved in checkout. |

## Technical reference

| Item | Value |
|------|-------|
| Payment screen | `components/Cart/RdbPaymentModal.tsx` (opened from `PlaceOrderButtons.tsx`) |
| Cart-lock sheet | `components/Cart/RdbPaymentLockedSheet.tsx` |
| Payment method selection | `components/Cart/PaymentMethod.tsx` (`handleWalletPayment`, method id `1`, label "RDB Wallet") |
| Service layer | `services/rdbPayment.ts` — `StartRdbPayment`, `GetRdbRequest`, `CancelRdbRequest`, `readRdbLock` |
| Cart lock detection | `readRdbLock()`, called after every cart write (`services/cart.ts`), after checkout (`services/order.ts`), and after the old-cart calls (`services/home.ts`) |
| Store | `store/Cart/reducer.ts` — `rdbLock` (`{ reference, expires_at }` or `null`), `setRdbLock` |
| Analytics | `rdb_request_created`, `rdb_request_start_failed`, `rdb_payment_paid`, `rdb_payment_expired`, `rdb_payment_ended`, `rdb_cart_lock_hit`, `rdb_cart_lock_cleared` — see `docs/posthog-events.md` |

## Current status & maturity

**Live.** The full flow works end to end: start a request, show the QR and short code, poll to
`paid`, load the resulting orders, and lock the cart while a request stays open. The old signed
`merchant/checkout` call, its HMAC signature, and the secret-leak bug that came with it
(`WalletPaymentModal.tsx`, deleted) no longer exist in this codebase.

## Known gaps / notes

- **Full-payment-only, by design.** RDB always collects the whole order total. There is no
  wallet-plus-cash split, and this is a product decision, not a missing feature.
- **`expires_at` sets the countdown wording only.** No code depends on the actual number of
  minutes a request lives.
- **The RDB wallet's internals stay outside Trydos.** Trydos only sees the payment request object
  the core backend hands back (reference, status, amount, QR, short code) — not RDB's own
  accounts, ledgers or signing.

## Related features

CO-13 (checkout-side view of this feature) · CO-10 (Payment method selection) · CO-11 (Place
order) · CO-14 (Confirmation) · PW-01 (Wallet balance & history) · PW-03 (Multi-currency balance).
