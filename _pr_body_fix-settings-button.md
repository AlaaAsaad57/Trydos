## fix-settings-button — Fix Settings button navigation on Orders and Order Details views

**ClickUp:** https://app.clickup.com/t/86ey0f0d2

---

## Business Goal

Buyers can reach the Settings screen from the dropdown Menu at any point during
their order-browsing session. Previously the Settings item silently did nothing
when the buyer was on the Orders list or Order Details page, forcing them to
manually navigate away before Settings became accessible. This fix removes a
dead-end interaction and preserves trust in the navigation UI.

## Root cause

`components/Home/Menu.tsx` — `MenuItem` used `!pathname.includes(href)` as the
navigation guard. Since `/settings/orders` and `/settings/orders/<id>` both
contain the substring `/settings`, the guard suppressed `<NextLink>` and rendered
a no-op `<div>` that only closed the menu. Fix: change to `pathname !== href`
(exact equality).

## Changed files

| File | Change |
|------|--------|
| `components/Home/Menu.tsx` | Navigation guard: `!pathname.includes(href)` → `pathname !== href` |

## Acceptance criteria

| ID   | Criterion | Result |
|------|-----------|--------|
| AC-1 | Settings item navigates from Orders list page (`/settings/orders`) | ✅ pass |
| AC-2 | Settings item navigates from Order Details page (`/settings/orders/<id>`) | ✅ pass |
| AC-3 | Menu dropdown closes after tap on Settings (all pages) | ✅ pass |
| AC-4 | Settings item still works from pages where it already worked (e.g. homepage) | ✅ pass |
| AC-5 | When already on Settings root, menu closes without error or broken navigation | ✅ pass |

## Verification

- **Typecheck:** `pnpm exec tsc --noEmit` → exit 0
- **Lint:** pre-existing infrastructure failure (`next lint` was removed in
  Next.js 16). Unrelated to this change — separate ticket recommended to replace
  with a direct `eslint` invocation in `package.json`.
- **Protected paths modified:** no

## Workflow artifacts

- Ticket workspace: `_specs/fix-settings-button/` (state: `closed`)
- Verification outcome: PASSED (all 5 ACs)
- Mode: standard | Owner: ai_agent

🤖 Published via Engineering Workflow v1 `/publish-pr`
