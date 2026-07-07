# SL-06 — Boutiques Management

| | |
|---|---|
| **Feature ID** | SL-06 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — view-only: lists boutiques, but no create / edit / delete / status actions are built |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderBoutiques`), `services/sellerDashboard/index.ts` |

---

## What it is

The **Boutiques** tab of the seller dashboard — a read-only grid of the shop's boutiques
(sub-storefronts within the shop). Each card shows the boutique's banner image, name,
active/inactive status, a short description and its URL slug.

## Where it appears

- Inside the seller dashboard → **Boutiques** tab (shown to users with any boutique permission).

## Who uses it

**Sellers / shop staff** whose role includes a boutique permission.

## How it works (verified behaviour)

- **Loads on first open** and then caches the list (kept in shared context).
- **Each card shows:** the boutique icon/banner (or a "No Image" placeholder); the name overlaid on
  the image; a green **"Active"** / grey **"Inactive"** badge (from `status === 1`); the description
  with HTML stripped and truncated to 100 characters; and a `/slug` chip.
- **Read-only.** There are no create, edit, delete or activate/deactivate controls in this tab, even
  though the underlying permission set defines write actions.
- **No pagination** — the whole list is fetched at once and the count is simply the list length.

## Data source

| Item | Value |
|------|-------|
| Boutiques list | `SellerDashboardService.getSellerBoutiques(sellerId)` → **GET `/shop/boutiques`** (`market-dashboard` backend), reads `data.boutiques` |

## Technical reference

| Item | Value |
|------|-------|
| Tab renderer | `page.tsx` → `renderBoutiques()` |
| Fetch | `page.tsx` → `getSellerBoutiques()` |
| Permission gate | `canViewBoutiques` = any of `READ_BUTIKS / CREATE_BUTIKS / UPDATE_BUTIKS / DELETE_BUTIKS / CHANGE_BOUTIQUE_STATUS` (or `SUPER_ADMIN`) |
| State | Shared `SellerProfileContext` (`sellerBoutiques`) |

## Current status & maturity

Live and stable **as a viewer**. The tab is labelled "management" but currently only *displays*
boutiques — the management (create/edit/delete/status) actions the name implies are not built.

## Known gaps / notes

- **No management actions.** Despite the "Boutiques management" title and the `CREATE_BUTIKS`,
  `UPDATE_BUTIKS`, `DELETE_BUTIKS`, `CHANGE_BOUTIQUE_STATUS` permissions being defined, the tab has
  no UI to create, edit, delete, or toggle a boutique — it is read-only.
- No pagination: the full list is loaded in one request.

## Related features

SD-17 (the public boutique storefront shoppers see) · SL-03 (Product management) ·
SL-08 (Shop info / branding).
