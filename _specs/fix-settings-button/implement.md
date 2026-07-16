---
ticket: fix-settings-button
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Implement — fix-settings-button

> Record of what was actually built, following `plan.md`.

## Changes made

- `components/Home/Menu.tsx` — in the `MenuItem` component, changed the navigation guard on line 68 from `!pathname.includes(href)` to `pathname !== href`. This makes the guard an exact path equality check, so the Settings `<NextLink>` renders (and navigates) from any page whose path is not exactly `/${lang}/settings` — including `/settings/orders` and `/settings/orders/[id]`.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. List the changed files — the single publishable commit is created
> later by `/publish-pr` (the git delivery boundary).

- `components/Home/Menu.tsx` — guard expression changed (`pathname.includes` → `pathname !==`)

## Deviations from plan

- none

## Validation run during implementation

- `pnpm lint` — not run (deferred to `/verify` stage per standard-frontend profile)
- `pnpm exec tsc --noEmit` — not run (deferred to `/verify` stage)
- Change confirmed by code inspection: the `if (href && pathname !== href)` branch now renders `<NextLink href={href}>` for all paths that are not an exact match of the Settings href, covering the Orders list and Order Details pages.
