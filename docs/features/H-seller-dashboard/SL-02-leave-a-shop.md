# SL-02 — Leave a Shop

| | |
|---|---|
| **Feature ID** | SL-02 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live — leaving a shop now asks for confirmation, redirects to the shop picker on success, and surfaces errors inline |
| **Last verified** | 2026-07-12 (against branch `ticket/migrate-customer-api-to-go`; ahead of `develop`) |
| **Source of truth** | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

A way for a member of a shop's team to **remove their own access** to that shop. It appears as a
"Leave Shop" action on the signed-in user's own row in the shop's Users list.

## Where it appears

- Inside the seller dashboard → **Users** tab → the users table.
- The "Leave Shop" button only renders on **your own** row (matched by user ID); you cannot use it
  to remove anyone else.

## Who uses it

**Shop staff / team members** — anyone who has been added to a shop and can see the Users tab.

## How it works (verified behaviour)

- The button is shown only when the row's user ID equals the current logged-in user's ID
  (`auth.UserID()`), so it always targets *you*.
- Tapping it opens a **confirmation dialog** (the shared `ConfirmModal`) — *"Are you sure you want
  to leave this shop? You will lose access to it."* — rather than leaving immediately.
- Confirming calls the leave-shop service and shows a spinner in the dialog while it runs.
- **On success** the user is redirected to their shop picker (`/{lang}/sellerProfile`) — they leave
  the dashboard they can no longer access, and the navigation itself is the success signal.
- **On failure** the error is logged to Sentry (via `LogError`) **and** shown to the user as an
  inline error alert in the Users tab (`usersError`); the dialog closes.

## Data source

| Item | Value |
|------|-------|
| Leave shop | `SellerDashboardService.leaveShop(sellerId)` → **DELETE `/shop/users/leave`** (`market-dashboard` backend) — `services/sellerDashboard/index.ts` |

## Technical reference

| Item | Value |
|------|-------|
| Button + handler | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` → button opens `ConfirmModal` (`setShowLeaveConfirm(true)`); `handleLeaveShop` runs on confirm (own-row gate: `String(user.id) === String(currentUserId)`) |
| Confirmation dialog | `components/global/ConfirmModal.tsx` (shared) |
| Service | `services/sellerDashboard/index.ts` → `leaveShop` |
| State | Local component state only (`showLeaveConfirm`, `leaveLoading`, error via `usersError`) — no store slice |

## Current status & maturity

Fully wired end-to-end: confirmation → server call (with in-dialog spinner) → redirect to the shop
picker on success, or an inline error alert on failure. The previous *"client-side behavior after
leaving shop is not defined here"* TODO has been removed.

## Known gaps / notes

- Success is signalled by redirecting to the shop picker rather than a persistent toast — there is
  no global toast system in the app, so the redirect (away from the now-inaccessible shop) is the
  confirmation the user sees.

## Related features

SL-01 (My shops / shop picker) · SL-13 (Team / user management — the Users tab this lives in) ·
SL-14 (Roles & permissions viewer).
