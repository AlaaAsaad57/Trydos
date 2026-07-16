# PW-02 — Add Funds (Bank Deposit)

| | |
|---|---|
| **Feature ID** | PW-02 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | ⚪ Placeholder / Planned — in-app UI removed; expected from the external wallet |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/settings/page.tsx`, `services/wallet/index.ts` (orphaned helpers) |

---

> ### ⚠️ External package, under active development — the RDB wallet
> The wallet is delivered as an **external package/service** owned by, and **still being built by, the RDB
> developer**. Trydos integrates with it as a **black box** — its internals are **outside our control and
> not documented here**. The interim in-app deposit UI has been **removed**; adding funds is expected to
> be provided by the external wallet package. Treat this feature as **planned** until that lands.

## What it is

Topping up the wallet by **bank deposit** — picking a bank, entering an amount, uploading a transfer
receipt, and tracking the deposit's status. This is intended to be delivered by the external wallet
package, not built inside Trydos.

## Where it appears

**No entry point today.** The interim in-app "Add funds" screen was removed from the settings home
(`/{lang}/settings`), so there is currently no way to start a deposit from the app. It will reappear when
the external wallet package provides it.

## Who uses it

Nobody in-app right now — the capability is pending the external wallet.

## How it works (verified behaviour)

- **The interim in-app deposit UI has been deleted.** The former `DummyAddDeposite` modal (bank picker,
  fee preview, receipt upload, deposit history) and its button on the settings home were removed.
- **No live deposit flow remains in the app.** A few deposit-related service helpers still exist in
  `services/wallet/index.ts` (`GetBanks`, `CalculateFees`, `UploadMedia`, `CreateBankDeposit`,
  `GetBankDepostits`) but **nothing calls them** — they are orphaned pending the external integration.

## Data source

| Item | Value |
|------|-------|
| Deposit flow | **To be provided by the external wallet package** — not implemented in-app |
| Orphaned helpers | `services/wallet/index.ts` still defines bank/fee/upload/deposit calls, currently unused |

## Technical reference

| Item | Value |
|------|-------|
| Removed UI | `components/settings/DummyAddDeposite.tsx` — **deleted**; its mount on `app/(client)/[lang]/settings/page.tsx` removed |
| Orphaned service fns | `GetBanks`, `CalculateFees`, `UploadMedia`, `CreateBankDeposit`, `GetBankDepostits` in `services/wallet/index.ts` (no callers) |
| Backend | External wallet package/service (`NEXT_PUBLIC_WALLET_BACKEND_URL`) — a black box owned by the RDB dev |

## Current status & maturity

**Placeholder / planned.** There is no working deposit experience in the app after the interim UI was
removed. Adding funds is expected to arrive with the external wallet package, which is still under active
development.

## Known gaps / notes

- **No in-app deposit path.** Users cannot add funds from the app today.
- **Orphaned code to clean up.** The deposit helpers left in `services/wallet/index.ts` have no callers;
  they should be removed or wired to the external package when it lands.

## Related features

PW-01 (Wallet balance & history) · PW-03 (Wallet auto-create & multi-currency balance) · PW-06 (Full digital bank — the external package that will own deposits).
