---
ticket: fix-settings-button
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Research — fix-settings-button

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Fix the Settings menu item in the dropdown Menu so that tapping it while on the buyer-side Orders or Order Details view navigates to `/${lang}/settings` instead of doing nothing.

## Root Cause (discovered during research)

`components/Home/Menu.tsx` contains a `MenuItem` component that decides whether to render as a `<NextLink>` (navigable) or a plain `<div>` (no navigation) using:

```js
if (href && !pathname.includes(href)) {
  return <NextLink href={href}>...</NextLink>
}
return <div onClick={onClick} />
```

The `pathname.includes(href)` check is a **substring match**, not an exact match. When `href` is `/${lang}/settings` and the current path is `/${lang}/settings/orders` or `/${lang}/settings/orders/[id]`, the condition evaluates to `true` — suppressing the link. The resulting `<div>`'s `onClick` only calls `setMenuOpen(false)`, so the menu closes with no navigation.

## Relevant directories

- `components/Home/` — contains `Menu.tsx` (the dropdown with the Settings item) and `UserNavTopSection.tsx` (which mounts the Menu on `menuOpen`)
- `app/(client)/[lang]/settings/` — the settings section root; sub-routes `orders/` and `orders/[id]/` are the affected pages
- `components/setting/orders/` — `OrdersListWrapper.tsx` and `OrderDetailsWrapper.tsx` (these render inside the settings sub-routes but are not the fix site)

## Relevant config files

- `app/(client)/[lang]/settings/template.tsx` — slide animation template wrapping all settings sub-pages; no changes needed here
- `tsconfig.json` — path aliases (`components/*`, etc.); confirms `components/Home/Menu.tsx` resolves correctly

## Possibly affected services

- **Client-side navigation only** — the fix is a routing guard change in a UI component; no API calls, no backend services, no Zustand store writes are involved.
- `NextLink` (`components/global/NextLink.tsx`) — used for the navigable branch; no change needed there.
- The `Compare` menu item (`href={/${lang}/compare}`) has the same `includes`-based guard and would benefit from the same fix, but it is not reported as broken and is out of scope for this ticket.

## Test / validation commands available

- `pnpm lint` — ESLint check (permissive config; catches obvious issues)
- `pnpm build` — full TypeScript compile + Next.js build; confirms no type errors
- Manual smoke test: open the Menu dropdown while on `/${lang}/settings/orders` and `/${lang}/settings/orders/[id]`, tap Settings, verify navigation to `/${lang}/settings`

## Risks and unknowns

- **Exact-match change scope** — changing `!pathname.includes(href)` to `pathname !== href` will also affect the Compare item and any future item added with an `href`. All cases would then show a link (navigate) even when already on a sub-page of that path. This is the correct behaviour — the intent was "don't navigate if already on this page", not "don't navigate if anywhere under this path". Risk: LOW.
- **RTL / locale prefix** — the `href` values are prefixed with `/${lang}` (e.g. `/gb-en/settings`). Exact comparison still works correctly because `usePathname()` returns the same locale-prefixed path. Risk: NONE.
- **`setMenuOpen(false)` on click** — the `onClick` prop passed to the Settings `MenuItem` is `() => setMenuOpen(false)`. The fix must preserve this call (close the menu after navigation). The `NextLink` branch already calls `onClick()` before navigating, so this is handled. Risk: NONE.

## Open questions

- None. The fix site, root cause, and correct behaviour are all confirmed by code inspection.

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
