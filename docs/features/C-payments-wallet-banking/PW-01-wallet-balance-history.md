# PW-01 — Wallet Balance & History

| | |
|---|---|
| **Feature ID** | PW-01 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | 🟡 Partial — thin in-app view over the external wallet |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/settings/wallet/page.tsx`, `components/settings/WalletTransactions.tsx`, `services/order.ts`, `services/wallet/index.ts` |

---

> ### ⚠️ External package, under active development — the RDB wallet
> The wallet is delivered as an **external package/service** owned by, and **still being built by, the RDB
> developer**. Trydos integrates with it as a **black box** — its internals (accounts, ledgers, signing,
> endpoints) are **outside our control and not documented here**. The `rdb` package is currently **not
> installed** in the app (its imports are commented out) and the full banking widget is stubbed to *"Under
> Development"*. Treat every wallet capability below as **subject to change** until the external wallet
> integration lands.

## What it is

A thin in-app view of the shopper's external wallet: it shows the current balance in their country's
currency and a scrollable list of past wallet transactions (money in / money out). It's the "statement"
view — the wallet itself lives in the external package.

## Where it appears

- **Wallet screen** — `/{lang}/settings/wallet` ("Wallet Transactions"), reached from the account/settings area.
- **Balance card** — the "RDB Wallet" balance card on the settings home (`/{lang}/settings`).

## Who uses it

Any signed-in shopper who has a wallet (a wallet is auto-created on login — see PW-03).

## How it works (verified behaviour)

- **Balance** is fetched on mount from the external wallet and shown with the country-currency symbol.
  If the currency's decimal-digit count is missing it silently formats to 0 decimals.
- **Transaction history loads in pages of 10.** The offset starts at 1 and increments per page; a
  manual **"Load More"** button fetches the next page, and paging stops as soon as a page comes back empty.
- **Inflow vs. outflow** is derived per row: a positive `credit` shows as money in, otherwise the
  `debit` shows as money out.
- **Tap-through to the order.** Tapping a transaction that carries an `order_id` looks the order up and
  navigates to that order's detail page (`…/settings/orders/{group}?…&is_from_wallet=true`).

## Data source

| Item | Value |
|------|-------|
| Balance | The **external wallet package/service** (`NEXT_PUBLIC_WALLET_BACKEND_URL`), via `order.GetWallet()` → `GetWalletBalanceForCountryCurrency` |
| Transaction history | `order.GetWalletTransactions(limit, offset)` → `GET /customer/wallet/list?limit=10&offset=…` on the **Trydos (legacy) backend** — **not** the external wallet |
| Order lookup (tap-through) | `GET /customer/order/details?order_id=…` (Trydos backend) |
| Auth to the wallet | `Authorization: Bearer <wallet token>` (cookie `rdb_at`) — the token is our only handle on the black box |

## Technical reference

| Item | Value |
|------|-------|
| Wallet screen | `app/(client)/[lang]/settings/wallet/page.tsx` → `components/settings/WalletTransactions.tsx` |
| Page size | `PAGE_SIZE = 10`, offset starts at 1, manual "Load More" |
| Integration layer | `services/order.ts` (`GetWallet`, `GetWalletTransactions`) → `services/wallet/index.ts` (`GetWalletBalanceForCountryCurrency`) |
| Store | `store/Cart/reducer.ts` — `setWalletUser` / `wallet.wallet_balance`, `currency` |
| UI label | Card reads `translateFunction("RDB Wallet")` |

## Current status & maturity

**Partial.** The balance and paginated history render today, but this is only a thin view layered over an
**external wallet that is still under active development** — the display (and the split where history
comes from the Trydos backend rather than the wallet) is expected to change as the external integration
matures.

## Known gaps / notes

- **Depends on the external wallet.** The balance card cannot render numbers if the external wallet is
  unavailable; its behaviour and shape are outside Trydos' control.

## Related features

PW-02 (Add funds) · PW-03 (Wallet auto-create & multi-currency balance) · PW-04 (Pay an order with the wallet) · CO-15 (Order history, for tap-through).
