# PW-06 — Full Digital Bank (Accounts / Cards / Transfers)

| | |
|---|---|
| **Feature ID** | PW-06 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | ⚪ Placeholder / Planned — external package not wired in; "Under Development" |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/setting/WalletLinkCard.tsx`, `services/RDB/index.ts`, `services/RDB/serverActions.ts`, `package.json` |

---

> ### ⚠️ External package, under active development — the RDB wallet (critical)
> This feature **is** the external RDB wallet/banking package — bank accounts, cards, sending money and
> transfers. It is owned by, and **still being built by, the RDB developer**; Trydos would embed it as a
> **black box** and does not implement any of it. The `rdb` package is currently **absent from
> `package.json` and not installed**; every `rdb` import in the app is commented out, and the widget is
> replaced by a hardcoded *"Under Development"* message. Nothing here is functional yet — treat the whole
> digital bank as **planned / in-progress** until the external integration lands.

## What it is

The rich digital-banking experience — bank accounts, cards, sending money and transfers — delivered by the
external **`rdb`** widget embedded inside the app. It's the "full bank" beyond the basic wallet (balance,
pay-with-wallet). **Today it is not wired in and shows "Under Development".**

## Where it appears

- On the settings home (`/{lang}/settings`), the **"RDB Wallet"** card (PW-03). Tapping it opens a bottom
  sheet where the external banking widget *would* render.
- Right now the sheet shows only a centered **"Under Development"** message.

## Who uses it

No one yet — the banking widget is not enabled in the current build.

## How it works (verified behaviour)

- **The widget is not wired in.** Where the external `<RDB … />` component (send money / cards /
  transfers) should mount, the code renders a hardcoded **"Under Development"** message instead. The real
  widget sits beside it as commented-out code.
- **Disabled by source-commenting, not a flag.** There is **no feature flag / env toggle** for the bank —
  it's off because the integration code is commented out.
- **The external `rdb` package isn't installed.** `rdb` does **not appear in `package.json`** and isn't
  installed; the server-action bridge files (`services/RDB/*`) are entirely commented out, as are the
  `rdb` imports in `WalletLinkCard`.
- **A token handoff stands ready.** `/api/auth/wallet-token` exists specifically to hand the wallet token
  to the external RDB widget when it's enabled; the card already fetches it on open, but it goes unused
  while the widget is disabled.
- **No dedicated routes** exist for accounts / cards / transfers / send-money — they would live inside the
  external widget. The separate "Bank Cards" placeholder screen is tracked as **PW-05**.

## Data source

| Item | Value |
|------|-------|
| Banking UI | The external **`rdb`** widget (owned by the RDB dev) — **not installed / commented out** |
| Server actions | `services/RDB/*` bridge to the external package — **entirely commented out** |
| Token handoff | `GET /api/auth/wallet-token` — hands the wallet token to the external widget (currently unused) |
| Backend | The external wallet/banking service, still under development |

## Technical reference

| Item | Value |
|------|-------|
| Host card | `components/setting/WalletLinkCard.tsx` — bottom sheet renders `translateFunction("Under Development")` in place of `<RDB … />` |
| Bridge (dead) | `services/RDB/index.ts`, `services/RDB/serverActions.ts` — fully commented |
| Package | `rdb` — **absent from `package.json`**, not in `node_modules` |
| Cookie | Wallet token cookie is `rdb_at` (naming is `rdb` heritage) |
| Gating | **No** feature flag — disabled by commenting |

## Current status & maturity

**Placeholder / planned.** The integration points (host card, bottom sheet, token handoff, commented
widget and server-action bridge) are scaffolded, but the external `rdb` package is not installed and the
UI is stubbed to "Under Development". This is the biggest under-development item in the wallet/banking
domain and is blocked on the RDB developer delivering the package.

## Known gaps / notes

- **Not functional.** No accounts, cards, transfers or send-money are available to users today.
- **External `rdb` not declared or installed** despite code referencing it — the integration must be added
  to `package.json` (and installed) before it can be enabled.
- **Disabled by comment, not a flag** — enabling it currently means editing source, not flipping a
  toggle. A real feature flag would be safer.
- **Dead token path** — `/api/auth/wallet-token` and the card's token fetch exist only to feed the
  not-yet-wired external widget.

## Related features

PW-05 (Bank Cards placeholder) · PW-03 (Wallet card that hosts this widget) · PW-01 / PW-04 (the basic wallet integration that *is* live).
