# SL-13 — Team / User Management

| | |
|---|---|
| **Feature ID** | SL-13 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (`renderUsers`), `services/sellerDashboard/index.ts` |

---

## What it is

The **Users** tab — where a shop manages its team: invite a person by phone number with a chosen
role, list current members, change a member's role, and remove a member.

## Where it appears

- Inside the seller dashboard → **Users** tab.

## Who uses it

**Shop admins.** Opening the tab needs `USER_MANAGEMENT_ACCESS` or `SUPER_ADMIN`. Seeing the members
list additionally needs `READ_EMPLOYEES` (or `SUPER_ADMIN` / `USER_MANAGEMENT_ACCESS`). **Change Role**
and **Delete** are **`SUPER_ADMIN`-only**.

## How it works (verified behaviour)

- **Add a user:** enter a phone number, search-and-pick a role, submit. The Seller ID field is
  pre-filled and read-only. On success the form clears, the list refreshes, and a success message
  shows for 3 seconds. Both the phone and a role must be provided.
- **Role search** is server-side with a **400 ms debounce**, resetting to page 1 on each change, and
  a "Load more roles" button for more results.
- **Members list** shows name/phone and role, paged via a "Load more" button.
- **Change Role** (SUPER_ADMIN only): a per-member searchable role dropdown (its own 400 ms debounce
  and pagination); picking a role updates that member.
- **Remove** (SUPER_ADMIN only): a Delete button that optimistically removes the row.

## Data source

| Item | Value |
|------|-------|
| List members | `getUsers(sellerId, page, lang)` → **GET `/shop/users`** |
| Add member | `addUserToShop({phone, role_id, seller_id})` → **POST `/shop/users/add`** |
| Delete member | `deleteUser(userId, sellerId)` → **DELETE `/shop/users/{userId}/delete`** |
| Change role | `updateUserRole({user_id, role_id}, sellerId)` → **PUT `/shop/users/role/update`** |
| Roles (dropdowns) | `getRoles(sellerId, page, search)` → **GET `/shop/users/roles`** |

All on the `market-dashboard` backend, shop-scoped by seller ID.

## Technical reference

| Item | Value |
|------|-------|
| Renderer | `page.tsx` → `renderUsers()` |
| Open-tab gate | `USER_MANAGEMENT_ACCESS` or `SUPER_ADMIN` |
| List gate | `READ_EMPLOYEES` / `SUPER_ADMIN` / `USER_MANAGEMENT_ACCESS` |
| Change-role / Delete gate | `SUPER_ADMIN` only |
| State | Local `useState` (users, roles, form) — no store slice |

## Current status & maturity

Live and stable. Invite-by-phone, role search, role change and member removal all work, with
debounced server-side role search and paginated lists.

## Known gaps / notes

- **Change Role and Delete are SUPER_ADMIN-only** — a user with `USER_MANAGEMENT_ACCESS` can open the
  tab, see members and add users, but cannot change roles or remove anyone.
- After a role change, the row's new role name is resolved from the *add-user* roles list rather than
  the dataset actually used to pick it; if the chosen role isn't in that list the label may fall back
  to the old name until refresh.
- A commented-out "Available Roles List" block remains in the source.

## Related features

SL-02 (Leave a shop) · SL-14 (Roles & permissions viewer) · SL-01 (My shops).
