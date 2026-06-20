---
ticket: fix-settings-button
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Plan — fix-settings-button

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Change the navigation guard in the `MenuItem` component from a substring match to an exact path equality check. The current guard `!pathname.includes(href)` suppresses the link whenever the current URL contains the `href` string anywhere — so `/settings/orders` incorrectly matches `/settings` and the link is silently replaced by a no-op `<div>`. Replacing `pathname.includes(href)` with `pathname === href` makes the guard mean exactly what was intended: "only skip navigation when already on this exact page." This is a single-expression change, confined to one component, with no risk of side-effects elsewhere.

## Steps

1. Open `components/Home/Menu.tsx` and locate the `MenuItem` component's conditional render (the `if (href && !pathname.includes(href))` branch).
2. Replace `!pathname.includes(href)` with `pathname !== href`.
3. Verify the change compiles and lints cleanly.

## Files to change

- `components/Home/Menu.tsx` — change the `MenuItem` navigation guard from `pathname.includes(href)` to `pathname === href`

## Validation strategy

- Validation profile: standard-frontend
- Manual smoke test: open the Menu dropdown while on the Orders list page (`/${lang}/settings/orders`) and on an Order Details page (`/${lang}/settings/orders/[id]`); confirm tapping Settings navigates to `/${lang}/settings` and the menu closes.
- Regression check: open the Menu from the homepage and a product page; confirm the Settings item still navigates correctly.
- Edge case: open the Menu from the Settings root page (`/${lang}/settings`); confirm tapping Settings closes the menu without error.

## Rollback

- Revert the single guard expression in `MenuItem` from `pathname !== href` back to `!pathname.includes(href)`.
- No database or cookie changes to roll back.
- No migration or deployment action needed.

## Out of scope

- The `Compare` menu item, which shares the same guard pattern but is not reported as broken.
- Seller-side views and seller dashboard pages.
- Visual or layout changes to the Menu or Settings item.
- Changes to Settings page content or sub-pages.
- Any other menu items that do not use `href`-based navigation guards.
