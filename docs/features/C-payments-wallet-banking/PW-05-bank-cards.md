# PW-05 — Bank Cards

| | |
|---|---|
| **Feature ID** | PW-05 |
| **Domain** | C · Payments, Wallet & Banking |
| **Status** | ⚪ Placeholder — empty shell screen |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/settings/profile/Bank-Cards/page.tsx`, `app/(client)/[lang]/settings/profile/page.tsx` |

---

> ### ⚠️ External package, under active development — the RDB wallet
> Bank cards are part of the external wallet/banking package owned by, and **still being built by, the RDB
> developer**. Trydos integrates with that package as a **black box** and does not implement cards itself.
> The `rdb` package is **not installed** yet, so this screen ships as an empty placeholder. It will be
> filled in when the external integration lands (the full card/banking UI is tracked as **PW-06**).

## What it is

A "Bank Cards" screen intended to let a shopper view/manage saved bank cards. **Today it is an empty
shell** — the screen exists and is reachable, but it has no card list, no data and no actions.

## Where it appears

- **Route:** `/{lang}/settings/profile/Bank-Cards`.
- **Entry point:** a "Bank Cards" item in the **Profile settings** menu (with a bank icon) links to it.

## Who uses it

Nobody functionally yet — a shopper can open it, but there is nothing to do there.

## How it works (verified behaviour)

- The page component renders **only a back bar** (title "Profile | Bank Cards") inside a wrapper — there
  is **no card list, no data fetch, and no other content**.
- It is linked from the profile settings menu, so it's navigable but functionally empty.

## Data source

| Item | Value |
|------|-------|
| Any data | **None** — no fetch, no service call. Real card data would come from the external wallet package |

## Technical reference

| Item | Value |
|------|-------|
| Route / component | `app/(client)/[lang]/settings/profile/Bank-Cards/page.tsx` — `ProfileBankCards`, renders a single `BackBar` |
| Menu entry | `app/(client)/[lang]/settings/profile/page.tsx` — "Bank Cards" item (icon `/icons/BankIcon.svg`) → the route above |
| Translations | Keys `"Bank Cards"`, `"Profile | Bank Cards"` exist; `"Your Bank Cards Info"` is defined but **never used** (leftover placeholder) |

## Current status & maturity

**Placeholder.** The route and menu entry are in place, but the screen has no functionality. Real card
management depends on the external wallet/banking package, which is still under active development (see
PW-06).

## Known gaps / notes

- **Empty shell linked in the UI.** Because it's reachable from the profile menu, a shopper can land on a
  blank page — consider hiding the menu item until real card management exists.
- **Unused translation key** `"Your Bank Cards Info"` is defined in all locales but never referenced.

## Related features

PW-06 (Full digital bank — the external cards/transfers package) · PW-03 (Wallet balance card) · AC-17 (Account / settings home).
