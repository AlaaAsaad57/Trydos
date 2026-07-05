# PW-03 — Wallet & Multi-Currency Balance

| | |
|---|---|
| **Feature ID** | PW-03 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | 🟢 Live — thin integration over the external wallet |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `services/wallet/index.ts`, `services/auth.ts`, `components/setting/WalletLinkCard.tsx` |

---

> ### ⚠️ External package, under active development — the RDB wallet
> The wallet is delivered as an **external package/service** owned by, and **still being built by, the RDB
> developer**. Trydos integrates with it as a **black box** — its internals are **outside our control and
> not documented here**. The `rdb` package is currently **not installed** in the app (its imports are
> commented out) and the interactive wallet widget on this card is stubbed to *"Under Development"*. Treat
> this feature as **subject to change** until the external wallet integration lands.

## What it is

The integration that makes sure every shopper has a wallet in the external system and shows its balance
**in their own country's currency**. On login the app asks the external wallet to provision one if needed,
and the settings home shows a balance card converted to the local currency.

## Where it appears

- **Balance card** — the "RDB Wallet" card on the settings home (`/{lang}/settings`), with the balance
  in the country currency, plus an error/retry state.
- **Silently at login** — wallet provisioning happens in the background, with no screen of its own.

## Who uses it

Every signed-in shopper — the wallet is provisioned for them automatically.

## How it works (verified behaviour)

- **Provision on login.** After sign-in the app asks the external wallet whether the user already has one
  and, if not, requests that it create a *"Primary Funding Wallet"*. This call is **fire-and-forget** (not
  awaited).
- **Country-currency balance.** To show the balance in local currency, the app resolves the country's
  currency and asks the external wallet for that currency's available balance, then renders it with the
  currency symbol.
- **Error handling.** If the balance lookup fails, the card shows an error tooltip with a **Retry** button.
- **The interactive widget is disabled.** Tapping the card opens a bottom sheet that currently shows only
  *"Under Development"* — the external RDB wallet widget (send money / cards / transfers) is not wired in
  (see PW-06).

## Data source

| Item | Value |
|------|-------|
| Wallet provisioning & balance | The **external wallet package/service** (`NEXT_PUBLIC_WALLET_BACKEND_URL`), via `checkWallet` / `createWallet` / `GetWalletBalanceForCountryCurrency` in `services/wallet/index.ts` |
| Country currency | `GET /home/currency?lang=&country=…` (Trydos backend) — used to pick which wallet currency to show |
| Auth to the wallet | `Authorization: Bearer <wallet token>` (cookie `rdb_at`) |

## Technical reference

| Item | Value |
|------|-------|
| Provisioning | `services/auth.ts` calls `checkWallet(...)` on login (fire-and-forget) → `services/wallet/index.ts` `checkWallet` / `createWallet` |
| Balance | `services/wallet/index.ts` `GetWalletBalanceForCountryCurrency` → `GetWalletBalanceInCurrency` |
| Balance card | `components/setting/WalletLinkCard.tsx` (rendered on `settings/page.tsx`) |
| Store | `useAppStore` — `userProfile`/`user`; balance via `setWalletUser` when reached through `order.GetWallet` |

## Current status & maturity

**Live** for provisioning and balance display — the wallet is auto-created and the localized balance
shows correctly. But it's a thin integration over an **external wallet still under active development**,
and the *interactive* wallet widget behind the card is not wired in yet (see PW-06).

## Known gaps / notes

- **Depends on the external wallet.** Provisioning and balance are only as reliable as the external
  package; its behaviour is outside Trydos' control.
- **Fire-and-forget provisioning.** Wallet creation isn't awaited at login, so a user could reach the
  wallet UI a moment before the external wallet has finished creating it.

## Related features

PW-01 (Wallet balance & history) · PW-02 (Add funds) · PW-04 (Pay an order with the wallet) · PW-06 (Full digital bank — the disabled widget on this same card).
