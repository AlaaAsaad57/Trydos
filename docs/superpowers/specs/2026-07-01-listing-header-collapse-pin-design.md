# Listing header collapse / pin — design

- **Date:** 2026-07-01
- **Status:** Approved (brainstorm) — pending spec review
- **Area:** Listing / boutique page header (banner + top-bar), global navbar pin
- **Approach:** A — native `position: sticky` + a single `IntersectionObserver` flag + CSS transitions

## Problem

On the listing (boutique / featured / flashDeals) page, scrolling should collapse the
banner images and keep the listing top-bar pinned at the top. Today this is implemented
imperatively and is fragile, especially during the skeleton → hydrated swap.

### Current implementation (what we are replacing)

- A single global `scroll` listener registered in `components/Cart/CartProvider.tsx`
  (which lives in the persistent `app/(client)/[lang]/layout.tsx`, so it runs on **every**
  page) calls two ~80-line functions in `utils/functions.tsx`:
  - `expandView({ filter })` — the collapsed/pinned state (`scrollY > 80`)
  - `normalizeView()` — the expanded state (`scrollY <= 80`)
- Each function performs ~20 `document.querySelector(...)` reads and writes `.style` /
  `.classList` directly on `.home-navbar`, `.filter-listing-bar`, `.boutique-header`,
  `.boutique-top-info`, `.boutique-photo-holder`.

### Concrete defects

1. **Imperative DOM mutation fighting React** — direct `.style` / `.classList` writes on
   nodes React owns; any re-render can wipe them. Animation state lives outside React.
2. **Scroll listener leak** — the `useEffect` cleanup removes only `popstate`, not
   `scroll`, and the handler is an anonymous function so it cannot be removed → listeners
   stack on remount.
3. **Runs on every route** — it is in `CartProvider`, not scoped to the listing route.
4. **No rAF/throttle** — ~40 `querySelector` + inline-style writes per scroll event →
   layout thrash / jank.
5. **Stale-closure `filterEnabled`** — the handler closes over `filterEnabled` at mount
   (`[]` deps) for its guard, while the two functions read
   `useAppStore.getState().filterEnabled` fresh → inconsistent gating.
6. **Skeleton mutated mid-scroll** — `BoutiqueLoader` / `ListingSkeleton` render the same
   class names and are themselves `position: fixed`; scrolling while the skeleton is up
   mutates skeleton nodes, then real content swaps in carrying half-applied inline styles
   → the flicker.
7. **`transition: 1s` on all properties** of `.filter-listing-bar, .boutique-top-info`
   while toggling `position: static ↔ fixed` (not animatable) → snapping, not a smooth
   pin. `@keyframes move` is effectively dead (`.move-anim` overrides it with `!important`).
8. **Magic numbers** — `scrollY > 80`, `marginTop 214/118px`, `top 158/111/109px`,
   `maxHeight 342px`, `zIndex 999999999999999`, hardcoded per RTL / `isForSearch`.

## Desired behavior (agreed)

- **Sticky top-bar** — the listing top-bar (`.filter-listing-bar`) stays pinned at the top
  while scrolling.
- **Global navbar stays pinned** — `.home-navbar` continues to pin on scroll (as it does
  today), across all pages.
- **Banner collapses on scroll down, re-expands only near the top** — the banner does not
  re-expand mid-list on scroll-up; it re-expands only when the user returns near the top.
  This avoids a ~340px mid-list content jump.
- **Persistent branding** — when collapsed, a compact store logo remains visible in the
  sticky bar.
- **Skeleton is static** — the loading skeleton always renders the expanded state and never
  responds to scroll (kills the flicker at the root).

## Design

### Overview

Replace the JS-driven imperative pin/collapse with:

1. **Native `position: sticky`** for both pinned elements (no JS, no scroll listener).
2. **One `IntersectionObserver`** watching a 1px sentinel at the top of the banner to
   toggle a single `collapsed` boolean.
3. **CSS transitions** driven by a `data-collapsed` attribute for the banner collapse and
   the compact-logo crossfade.

The global scroll listener and both `expandView` / `normalizeView` functions are deleted.

### Components

#### `ListingHeaderCollapse` (new, client) — `components/Listing/ListingHeaderCollapse.tsx`

- `"use client"`. Owns a single local `collapsed: boolean` state (not Zustand — nothing
  else reads it; YAGNI).
- Renders a root `<div data-collapsed={collapsed}>` wrapping the listing header subtree
  (the `.filter-listing-bar` and the `.boutique-header`), which are passed in from the
  server component as children / props so they stay server-rendered and streamed through
  the existing Suspense boundaries.
- Renders a **1px sentinel** at the top of the banner region and runs **one**
  `IntersectionObserver` on it:
  - sentinel leaves the top (not intersecting) → `collapsed = true`
  - sentinel returns (intersecting) → `collapsed = false`
  - This *is* the "re-expand only near the top" rule — no scroll-direction tracking.
- **Filter-modal gate:** reads `filterEnabled` from the store; while `true` (filter modal
  open) it pauses toggling so opening filters does not reshuffle the header (preserves
  current behavior).
- Renders the **compact store logo** inside the sticky bar (from boutique data), hidden
  when expanded, crossfading in on `[data-collapsed="true"]`.
- Cleans up the observer on unmount.

#### `FiltersPageContent` (edit) — `components/Listing/FiltersPageContent.tsx`

- Wrap the existing `.filter-listing-bar` + `.boutique-header` in `<ListingHeaderCollapse>`.
- No data-fetching changes; boutique data (for the compact logo) is already available.

#### Layout (edit) — `app/(client)/[lang]/layout.tsx` + CSS

- `.home-navbar` becomes `position: sticky; top: 0` (replaces the JS `animate-in` pin).
  Preserves pinning on all pages, natively, with no content jump (sticky stays in flow,
  unlike the old `position: fixed`).

### The pin (pure CSS)

```css
:root { --listing-navbar-h: 98px; } /* single source; was the 98px in .fixedAlign */

.home-navbar      { position: sticky; top: 0; }
.filter-listing-bar { position: sticky; top: var(--listing-navbar-h); }
```

- No scroll listener, no rAF, no offset math.
- Navbar entrance flourish (`@keyframes animate-in`) is **dropped** for clean native
  sticky (agreed).

### The collapse (CSS grid-rows — height-agnostic)

```css
.banner-collapse { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .35s ease; }
[data-collapsed="true"] .banner-collapse { grid-template-rows: 0fr; }
.banner-collapse > * { min-height: 0; overflow: hidden; }
```

- Animates the banner to zero height without knowing its pixel height (removes the
  `max-height: 342px` magic number).

### Persistent branding (compact logo crossfade)

- A compact store logo is rendered inside the sticky bar, **on the leading side next to the
  back button** (`FilterListingBackButton`); it mirrors on the trailing side for RTL.
  Expanded: hidden. Collapsed: crossfades in (pure CSS opacity/transform transition on
  `[data-collapsed="true"]`).
- The large logo + name collapse together with the banner.
- Rationale: avoids physically flying the `.boutique-top-info` element across the DOM (the
  fragile `move-anim` / FLIP problem). Same visual intent (branding stays visible while
  scrolled), measurement-free and robust.

### Skeleton (static, inert)

- `BoutiqueLoader` / `ListingSkeleton` are **not** wrapped by `ListingHeaderCollapse` — no
  `data-collapsed`, no observer.
- With the global scroll listener removed, nothing mutates skeleton nodes → flicker is
  structurally impossible.
- Align the skeleton banner/bar heights and the sticky offset with the real header so the
  swap-in does not shift.

### `overflow-x: hidden` sticky risk

- `<html>` currently has `overflow-x: hidden`, which can establish a scroll container and
  break `position: sticky`.
- Mitigation: change `<html>`'s `overflow-x: hidden` → **`overflow-x: clip`** (clips
  horizontally the same, but does **not** create a scroll container, so sticky keeps
  working). Verify `.site-container` / `.main-content` set no `overflow` / `transform`.
- Validate sticky manually in dev (all four locales incl. RTL, and the `isForSearch` /
  search variant) before finalizing.

## Deletions / cleanup

- Delete `expandView` and `normalizeView` from `utils/functions.tsx`.
- Remove the `window.addEventListener("scroll", …)` block (and any now-dead imports) from
  `components/Cart/CartProvider.tsx`.
- Remove the unused `normalizeView` import and the `// normalizeView();` comment in
  `components/Home/Search/SearchIcon.tsx`.
- Remove dead CSS:
  - `@keyframes move` and `.move-anim` (`public/styles/listing-components.css`)
  - `@keyframes animate-in` and `.home-navbar.animate-in` (`public/styles/globals.css`)
  - `.filter-listing-bar.fixedAlign` (`public/styles/globals.css`) — replaced by the
    `--listing-navbar-h` sticky offset
  - the blanket `transition: 1s` on `.filter-listing-bar, .boutique-top-info`
    (`public/styles/listing-components.css`) — replaced by scoped transitions
- Confirm (grep) there are no remaining callers of `expandView` / `normalizeView` before
  deleting.

## Validation (manual — repo has no test suite)

1. `pnpm build` / `pnpm lint` clean.
2. Listing page: scroll down → banner collapses smoothly, top-bar + navbar stay pinned,
   compact logo appears in the bar. Scroll back to top → banner re-expands; no re-expand
   mid-list on scroll-up.
3. No content jump when the navbar pins.
4. Skeleton: scroll while loading → skeleton stays expanded and inert; swap-in to real
   content does not flicker or jump.
5. Open the filter modal → header does not reshuffle; close → behavior resumes.
6. Verify sticky works with `overflow-x: clip` on `<html>` and that horizontal overflow is
   still contained (no sideways scroll).
7. Check all four locales including RTL (`ar` / `ku`) and the search (`isForSearch`)
   variant.
8. Confirm other pages (home, product) still pin the navbar and are otherwise unaffected by
   removing the global scroll listener.

## Rollback

- Changes are additive-plus-deletions on a ticket branch; revert the branch / commit to
  restore `expandView` / `normalizeView`, the CartProvider listener, and the old CSS.

## Out of scope

- Redesigning the top-bar contents, filter modal, category filters, or product grid.
- Changing the banner slider (Embla) behavior itself.
- Any unrelated refactor of `utils/functions.tsx` beyond removing the two functions.
- Reworking the global navbar contents (only its positioning changes to sticky).

## Open decisions — resolved

- Scope: rewrite + improve behavior. ✅
- Interaction: sticky bar; banner collapse-on-down / expand-on-up. ✅
- Scroll-up: banner re-expands **only near the top**. ✅
- Branding: keep persistent branding (compact-logo crossfade). ✅
- Skeleton: static, never responds to scroll. ✅
- Global navbar: keep pinned, via native sticky; drop the slide-in flourish (globally, all
  pages). ✅
- Compact logo placement: leading side next to the back button (RTL-mirrored). ✅
