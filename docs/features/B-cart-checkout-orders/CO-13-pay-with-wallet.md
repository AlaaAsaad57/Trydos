# CO-13 — Pay With Wallet at Checkout

| | |
|---|---|
| **Feature ID** | CO-13 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live — ⚠️ but a secret-leak bug in the failure path needs fixing |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Cart/WalletPaymentModal.tsx`, `components/Cart/PaymentMethod.tsx`, `services/wallet/index.ts`, `store/Cart/reducer.ts` |

---

## What it is

Paying for an order **from the in-app wallet balance** (see Domain C — Wallet). At checkout, if the
wallet covers the whole order, the shopper can confirm payment straight from their balance without a
card or cash.

## Where it appears

At checkout: when the wallet fully covers the total it's auto-selected as the payment method
(CO-10), and confirming opens a **Wallet Payment** modal that shows the balance and a "Confirm Wallet
Payment" action.

## Who uses it

Shoppers with enough wallet balance to cover the order total.

## How it works (verified behaviour)

- **Full payment only.** The wallet is offered **only when its balance (in the shopper's currency)
  covers the entire total** — there's no wallet + cash split in the UI. If it's insufficient, the
  wallet option is disabled. (Partial-wallet display code exists but has no selection path — it's
  legacy/dead.)
- **Confirmation modal.** It loads the wallet balance in the chosen currency, computes the checkout
  amount, and only enables "Confirm Wallet Payment" when the balance is sufficient (re-checked on
  confirm).
- **Safe submission.** The payment call carries a client-generated **idempotency key** and a
  submit-guard so a double tap can't pay twice.
- **Then it polls for the order.** After a successful wallet charge, the app **polls every 5 seconds
  for up to 10 minutes** for the cart to convert into an order, then shows the success screen (CO-14).
  If it doesn't convert in time it shows *"Order processing timed out"*.

## Data source

| Item | Value |
|------|-------|
| Wallet checkout | `POST {WALLET}/merchant/checkout` — HMAC-SHA256 signed; body `{ currencyId, store_user_id, amount, cart_group_ids, idempotencyKey }` — `wallet.CheckoutOrder` |
| Balance | `GET {WALLET}/wallets/my/balances/{currencyId}` — `GetWalletBalanceForCountryCurrency` |
| Order-conversion check | `GET /customer/order/getOrdersByCartGroupID?cart_group_id=…` |
| Backend | Wallet calls → **separate wallet backend service** (`NEXT_PUBLIC_WALLET_BACKEND_URL`); order lookup → core backend |

## Technical reference

| Item | Value |
|------|-------|
| Confirmation modal | `components/Cart/WalletPaymentModal.tsx` (opened from `PlaceOrderButtons.tsx`) |
| Eligibility / auto-select | `components/Cart/PaymentMethod.tsx` (`walletCoversTotal`, wallet id = 1) |
| Service | `services/wallet/index.ts` — `CheckoutOrder`, `GetWalletBalanceForCountryCurrency` |
| Safety | `idempotencyKey` (`crypto.randomUUID()`), `isSubmittedRef` guard |
| Polling | every 5s up to 10 min → `getOrdersByCartGroupID` → `setOrderData({ success: true })` |
| Store | `store/Cart/reducer.ts` — `wallet`, `balance`, `orderData.payment` (`[{ id: 1, balance }]`) |

## Current status & maturity

**Live** — the happy path (full wallet payment → order conversion → success) works, with idempotency,
HMAC signing and a robust polling confirmation. **However, the failure path has a serious secret-leak
bug that must be fixed** (below).

## Known gaps / notes

- ⚠️ **SECURITY — secrets leaked to the shopper on a failed wallet payment.** When the wallet
  `/merchant/checkout` call fails, the service **returns the entire signed request object** —
  including the `Authorization` Bearer token, `X-Merchant-Api-Key`, `X-Signature` and timestamp —
  back to the component, which then runs **`alert(JSON.stringify(result))`**, showing those secrets
  to the user. The same secrets are also `console.log`-ged on every checkout attempt. **This is
  leftover debug code in a live payment path and should be removed / rotated urgently.**
- **Full-payment-only.** No wallet + cash/card split is selectable, despite partial-wallet
  scaffolding remaining in the codebase (dead).
- It should be an external widget from the RDB app, we add dummy widget now for testing.

## Related features

CO-10 (Payment method — wallet auto-selection) · CO-11 (Place order) · CO-14 (Confirmation) · PW-01
(Wallet balance & history) · PW-03 (Multi-currency balance) · PW-04 (Pay an order with the wallet).
