# SL-14 — Roles & Permissions Viewer

| | |
|---|---|
| **Feature ID** | SL-14 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderPermissions`), `services/sellerDashboard/index.ts` |

---

## What it is

The **Permissions** tab — a read-only view of the signed-in user's role in the current shop and a
grouped breakdown of exactly what they're allowed to do.

## Where it appears

- Inside the seller dashboard → **Permissions** tab (always available in the menu).

## Who uses it

**Any shop member** — it shows *your own* role and permissions for this shop.

## How it works (verified behaviour)

- **Role banner:** if you're a Super Admin it shows a "Super Admin — full access" card; otherwise it
  shows your role name ("Your role in this shop").
- **Grouped permissions:** your permissions are sorted into labelled groups (Products, Boutiques,
  Categories, Brands, Orders, Employees, Roles, Shop Info, Product Images, Stories, Comments, Admin,
  etc.; anything unrecognised falls under "Other") and shown as readable permission chips.
- Permissions come from the shared shop context when available, otherwise they're fetched.

## Data source

| Item | Value |
|------|-------|
| Permissions | `getSellerPermissions(sellerId)` → **GET `/shop/auth/permissions`** (`market` backend). Returns the user's shops; the page picks the one matching the route and reads its `permissions`. |

## Technical reference

| Item | Value |
|------|-------|
| Renderer | `page.tsx` → `renderPermissions()` / `showRoleInfo()` |
| Group map | `PERMISSION_GROUPS` (a static map in `page.tsx`) via `getPermissionGroup` |
| State | `SellerProfileContext` (`sellerPermissions`, `shopes`) |

## Current status & maturity

Live and stable as a self-service view of your own role and permission set. Permission-group naming
is derived from a static map in the dashboard.

## Known gaps / notes

- It reflects the **current user's own** permissions only — there is no UI to inspect another
  specific user's permission breakdown.
- The role name (`currentRole`) is only populated when the dashboard's side menu has been opened; a
  non-admin who opens the Permissions tab without ever opening the menu can see a spinner where their
  role name should be (the permission chips still render).
- Permission groups are a **hardcoded static map**; any backend permission not in the map falls into
  the "Other" group.

## Related features

SL-13 (Team / user management — where roles are assigned) · SL-02 (Leave a shop) · SL-01 (My shops).
