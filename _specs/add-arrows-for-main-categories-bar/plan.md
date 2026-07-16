---
ticket: add-arrows-for-main-categories-bar
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Plan — add-arrows-for-main-categories-bar

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add the scroll affordances **inside `components/Server/Navbar.tsx`**, wrapping the
existing `HortiznalScrollBar` in a `relative` container and overlaying two
absolutely-positioned edge elements (each = a gradient fade + a circular arrow
button). The shared `components/global/HortiznalScrollBar.tsx` primitive is **not**
touched — it is used by 30+ call sites, so wrapping it keeps the blast radius to
the categories bar only (research Risk #1, NFR-1).

Visibility is driven by two pieces of state (`canScrollLeft` / `canScrollRight`)
computed in a `useEffect` from the scroller's `scrollLeft` / `scrollWidth` /
`clientWidth`, branching on `isRtl` (already derived in the component) to handle
the browser-dependent RTL scroll origin (research Risk #2). The effect subscribes
to the container's `scroll` event and a `ResizeObserver`, and recomputes on
`categoriesData` changes, so the arrows react to scrolling, late layout, and
viewport resize (FR-5/AC-6). Clicking an arrow calls `scrollBy({ left, behavior:
"smooth" })` by a partial amount (FR-4/AC-5). React Compiler is enabled, so no
manual `useMemo`/`useCallback` is added.

**Resolved open questions:**
- **OQ-1 (a11y/i18n):** arrows are real `<button>`s carrying a **static English
  `aria-label`** (e.g. "Scroll categories left/right"), matching the existing
  repo convention (`components/Home/Stories/StoryHolder.tsx` uses static English
  `aria-label`s). No translation files are modified. Hidden arrows are removed
  from the tab order (`tabIndex=-1` + non-interactive) so they are not announced
  (FR-8/AC-9).
- **OQ-2 (device scope):** arrows are shown wherever overflow exists, regardless
  of device (no breakpoint gating), per the spec's assumed default.

## Steps

1. In `Navbar.tsx`, import `useEffect` alongside the existing `useState`.
2. Add `canScrollLeft` / `canScrollRight` state.
3. Add a `useEffect` that locates the `#categories-bar-container` scroller, defines
   an `updateScrollState()` that sets the two flags from `scrollLeft` /
   `scrollWidth` / `clientWidth` (with a small ~1px tolerance to avoid sub-pixel
   flicker — Edge Case "exactly-fits"), branching on `isRtl`. Run it once, on the
   container `scroll` event, on a `ResizeObserver`, and on a short deferred timer
   for late layout. Clean up all three on unmount; depend on `[categoriesData,
   isRtl]`.
4. Add a `scrollByAmount(amount)` helper that smooth-scrolls the container.
5. Wrap the existing `HortiznalScrollBar` return in a `relative` flex container and
   add two absolutely-positioned edge overlays (leading + trailing): each a
   gradient fade plus a circular arrow `<button>` with the correct chevron, an
   `aria-label`, opacity bound to its `canScroll*` flag, and `pointer-events` /
   `tabIndex` disabled when hidden. Use the existing chevron SVG markup.
6. Keep `handleWrapperClick`, the `HortiznalScrollBar` props
   (`id="categories-bar-container"`, classes, `dataCy`), category ordering, and
   `enable_search` handling unchanged (NFR-5/AC-10).
7. Run the validation profile and a manual visual pass (LTR + RTL, overflow vs.
   no-overflow, both edges).

## Files to change

- `components/Server/Navbar.tsx` — add the scroll-state effect, the
  `scrollByAmount` helper, and the wrapper + two edge arrow/fade overlays around
  the existing `HortiznalScrollBar`. **This is the only file changed.**

(Explicitly NOT changed: `components/global/HortiznalScrollBar.tsx`,
`components/Server/MainCategories/index.tsx`, `components/Home/CategoryNavMobile.tsx`,
`public/translations/*`, any `protected_paths` entry, `next.config.ts`.)

## Validation strategy

- Validation profile: standard-frontend
- The profile's checks (type safety + lint) prove the change compiles and passes
  lint. In addition, manual visual verification in `pnpm dev` covering every AC:
  no-overflow → no arrows (AC-1); overflow shows the correct edge arrow(s)
  (AC-2/AC-3); arrows hide at each edge (AC-4); click scrolls smoothly toward that
  side (AC-5); arrows update on scroll + on resize (AC-6); `ar`/`ku` mirrored and
  scrolling the correct way (AC-7); fade cue present (AC-8); hidden arrows not
  focusable / accessible name present (AC-9); chips clickable, ordering, drag, and
  other scrollers unaffected (AC-10).

## Rollback

- Single-file change with no data/schema/API impact. Revert by restoring
  `components/Server/Navbar.tsx` to its prior version (`git restore` the file, or
  revert the delivery commit). No migration or cleanup needed; categories data and
  all other components are untouched.

## Out of scope

- Modifying the shared `HortiznalScrollBar` primitive or any other horizontal
  scroller in the app.
- Localizing the arrow `aria-label`s / editing translation files (OQ-1 resolved to
  static English per repo convention).
- Changing categories data, ordering, labels, icons, links, or the data fetch.
- Redesigning the categories bar layout or the mobile category navigation.
- Adding automated UI tests (no test suite by repo policy).
