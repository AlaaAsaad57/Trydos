# PW-04 — Pay an Order With the Wallet

| | |
|---|---|
| **Feature ID** | PW-04 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | 🟡 Partial — dummy test widget; real payment is expected to go through the external RDB widget |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Cart/WalletPaymentModal.tsx`, `components/Cart/PaymentMethod.tsx`, `components/Cart/PlaceOrderButtons.tsx`, `services/wallet/index.ts` |

---

> ### ⚠️ Dummy test widget — real payment will come from the external RDB wallet
> The wallet-payment modal described here is a **dummy widget used for testing** the checkout-with-wallet
> flow — **not** the final experience. The real payment is expected to happen either through the **external
> RDB wallet widget** (owned by, and **still being built by, the RDB developer**) or a pending design.
> Trydos treats the wallet as a **black box** — its internals (accounts, ledgers, signing, endpoints) are
> outside our control and not documented here. Treat everything below as **interim / subject to change**
> until the external widget (or design) lands.
>
> This is the same capability documented from the checkout side as **CO-13**; this page is the
> wallet-domain view of it.

## What it is

Paying for an order straight from the external wallet balance at checkout — no card, no cash — when the
wallet covers the whole total. **The current in-app modal is a dummy/test implementation**; in production
this is expected to be handled by the external RDB wallet widget (or a pending design).

## Where it appears

At checkout: when the wallet balance covers the order total, the wallet is **auto-selected** as the
payment method and the other methods are disabled. Confirming "Place Order" opens the **dummy Wallet
Payment** modal that shows the balance and a "Confirm Wallet Payment" action.

## Who uses it

Shoppers whose wallet balance fully covers the order total.

## How it works (verified behaviour)

- **Full payment only, auto-selected.** The wallet is offered only when its balance covers the entire
  total; there's no wallet + cash/card split. When it covers the total the app forces the payment to the
  wallet and disables COD / card / crypto tiles. Leftover partial-wallet branches exist in the code but
  are unreachable (dead).
- **Confirmation modal.** It loads the wallet balance/currency, computes the checkout amount, and only
  enables "Confirm Wallet Payment" when the balance is sufficient (re-checked on confirm).
- **Safe submission.** The charge carries a client-generated **idempotency key** (one per modal open) and
  a submit guard, so a double tap can't pay twice. (Because the guard isn't reset on failure, a failed
  attempt can't be retried without closing and reopening the modal.)
- **Then it polls for the order.** After the external wallet accepts the charge, the app **polls every 5
  seconds for up to 10 minutes** for the cart to convert into an order (checked against the Trydos
  backend), then shows the success screen (CO-14). If it doesn't convert in time it shows *"Order
  processing timed out"*. The external wallet is expected to convert the cart into an order out-of-band,
  which is why the polling exists.

## Data source

| Item | Value |
|------|-------|
| Wallet checkout | A **signed request to the external wallet's checkout endpoint** (`services/wallet/index.ts` `CheckoutOrder`), carrying `{ currencyId, store_user_id, amount, cart_group_ids, idempotencyKey }` |
| Balance / currencies | The external wallet package/service |
| Order-conversion check | `GET /customer/order/getOrdersByCartGroupID?cart_group_id=…` (Trydos backend) |
| Backends | Wallet charge/balance → **external wallet** (`NEXT_PUBLIC_WALLET_BACKEND_URL`, a black box); order lookup → Trydos backend |

## Technical reference

| Item | Value |
|------|-------|
| Confirmation modal | `components/Cart/WalletPaymentModal.tsx` (opened from `PlaceOrderButtons.tsx`) |
| Eligibility / auto-select | `components/Cart/PaymentMethod.tsx` (`walletCoversTotal`, wallet id = 1, label "RDB Wallet") |
| Checkout call | `services/wallet/index.ts` `CheckoutOrder` (request is signed for the external wallet) |
| Safety | `idempotencyKey` (`crypto.randomUUID()`), `isSubmittedRef` guard |
| Polling | every 5s up to 10 min → `getOrdersByCartGroupID` → order success |
| Store | `store/Cart/reducer.ts` — `wallet`, `balance`, `orderData.payment` (`[{ id: 1, balance }]`) |

## Current status & maturity

**Partial (dummy test widget).** The happy path (full wallet payment → order conversion → success) works
end-to-end with idempotency and robust polling, but the modal itself is a **throwaway test harness** for
validating the checkout-with-wallet flow. The production experience is expected to move to the external
RDB wallet widget (or a pending design), so this UI should not be treated as final.

## Known gaps / notes

- **It's a dummy widget.** The current modal exists to test the flow; the real pay-with-wallet UI is
  expected to be the external RDB widget (or a pending design). Don't harden this as the shipping surface.
- ⚠️ **SECURITY — signing material leaked on a failed wallet payment.** On the failure branch the wallet
  checkout can return the full signed request object (Bearer token, merchant API key, signature,
  timestamp and body), and the modal runs `alert(JSON.stringify(result))` — showing those secrets to the
  user (`WalletPaymentModal.tsx:274`). The same material is also `console.log`-ged server-side on every
  checkout attempt (`services/wallet/index.ts:486`). It's leftover debug code in the test widget — but
  since it touches real tokens/keys, **it must be removed (and the keys rotated) before this or the real
  widget ships.**
- **Full-payment-only.** No wallet + cash/card split is selectable (partial-wallet scaffolding remains as
  dead code).
- **No retry after failure.** The submit guard isn't reset on failure — the modal must be reopened.
- **Depends on the external wallet.** Checkout, balance and the out-of-band order conversion all rely on
  the external package, whose behaviour is outside Trydos' control.

## Related features

CO-13 (checkout-side view of this feature) · CO-10 (Payment method — wallet auto-selection) · CO-11 (Place order) · CO-14 (Confirmation) · PW-01 (Wallet balance & history) · PW-03 (Multi-currency balance).
