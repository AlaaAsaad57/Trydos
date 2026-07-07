# SL-02 — Leave a Shop

| | |
|---|---|
| **Feature ID** | SL-02 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟡 Partial — the leave call works, but the screen doesn't react afterwards (no redirect/refresh/confirmation) |
| **Last verified** | 2026-07-07 (against `develop`) |
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
- Tapping it calls the leave-shop service directly. There is **no confirmation dialog**.
- On success the code does nothing further — it does not redirect, refresh the list, remove the
  row, or show a toast. On failure it logs the error to Sentry (via `LogError`) but shows no
  visible message.

## Data source

| Item | Value |
|------|-------|
| Leave shop | `SellerDashboardService.leaveShop(sellerId)` → **DELETE `/shop/users/leave`** (`market-dashboard` backend) — `services/sellerDashboard/index.ts` |

## Technical reference

| Item | Value |
|------|-------|
| Button + handler | `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` → `handleLeaveShop` (own-row gate: `String(user.id) === String(currentUserId)`) |
| Service | `services/sellerDashboard/index.ts` → `leaveShop` |
| State | Local component state only (no store slice) |

## Current status & maturity

The backend call is wired and functional, but the **client-side outcome is unfinished** — an
in-code comment states *"client-side behavior after leaving shop is not defined here; trigger a
refresh or redirect if needed."* From the user's point of view nothing appears to happen after
leaving, which makes it feel broken even when it succeeded.

## Known gaps / notes

- ⚠️ **No post-leave feedback.** After a successful leave the UI does not redirect, refresh, remove
  the row, or confirm — so the user gets no signal it worked (verified in-code comment).
- No confirmation step before leaving.
- Minor: the service's hardcoded fallback error string is a copy-paste artifact
  (*"Failed to confirm order detail status"*), only shown if the backend returns no message.

## Related features

SL-01 (My shops / shop picker) · SL-13 (Team / user management — the Users tab this lives in) ·
SL-14 (Roles & permissions viewer).
