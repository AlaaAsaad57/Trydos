# In-Flow Page Loader — Design

**Date:** 2026-07-07
**Status:** Approved (brainstorming) → ready for implementation plan
**Scope:** The route-navigation loader system for **all** page types (home, product, listing, settings, boutique, full-home, compare).

---

## 1. Problem

The navigation loader (`isNavigating` → `PageLoadingIndicator` → per-type loader) renders
as a **body-level `position: fixed` overlay** whose vertical position is a hardcoded or
DOM-measured `top`:

| Loader | `top` |
|--------|-------|
| `HomeLoader` | `350px` |
| `ProductLoader` | `100px` |
| `SettingsLoader` | `100px` |
| `FullHomeLoader` | `100px` |
| `BoutiqueLoader` | `98px` / `150px` |
| `FilterLoader` | `document.querySelector(".boutique-header")?.clientHeight + 120` |

This causes the reported bugs, most visibly on listing:

1. **`NaN` top → floats over the search bar.** Leaving a page without a `.boutique-header`
   makes `getOffset()` return `NaN`; `top:"NaNpx"` is dropped and the fixed box falls back
   to `top:auto`, landing over the navbar + sticky `.filter-listing-bar`.
2. **Wrong offset when scroll ≠ 0.** `fixed` is viewport-relative; a `top` guessed from the
   *outgoing* page never lines up with the *destination's* sticky bar once scrolled.
3. **Latent transform trap.** `.site-container` carries `transition: transform` /
   `transform-origin: top center`. A transformed ancestor re-anchors `fixed` descendants to
   itself instead of the viewport — a structural landmine for any fixed overlay placed inside.

Root cause: a loader for the **destination** is positioned against the **origin's** layout,
using viewport-`fixed` + a guessed offset. The measurement is structurally guaranteed to be
wrong across page types and scroll positions.

`loading.tsx` was rejected because it (a) cannot carry the per-target data the app already has
in hand at click time (boutique name/banner, product title/thumb), and (b) cedes timing to the
router — with `staleTimes.dynamic: 30`, a cached route can skip the loading boundary or show it
late, which reads as delay.

## 2. Goals / Non-goals

**Goals**
- The loader renders **in normal document flow** (like `loading.tsx`), never `fixed`/`absolute`,
  never a measured `top`.
- It appears **instantly** on click (synchronous client state, independent of the router).
- It shows **tailored data** already known from the clicked element.
- **No measurable performance/page-load regression.**
- Applies to **all** page loaders: home, product, listing, settings (entry), boutique,
  full-home, compare.

**Non-goals**
- Not migrating the intra-settings `loading-page-class` sub-navigation loader (the `isFromSetting`
  branch of `NextLink`). It is already in-flow and scoped; left as-is (follow-up).
- Not changing Tier-2 in-page refinement (search/sort/filter) behaviour.
- Not adding `loading.tsx` files.

## 3. Two-tier loading model (the core invariant)

**Tier 1 — Route navigation.** Driven exclusively by `isNavigating`, which is written **only**
through the `NextLink` path (`setIsNavigating(data)`) plus the existing handful of explicit
navigation triggers (back buttons, notifications, place-order). Renders the tailored skeleton
**in-flow inside `.main-content`** and hides the page's `children`.

**Tier 2 — In-page refinement.** Search typing, sort, filter-apply. Driven by
`?search=`/`?sort=` + store flags (`searchLoading`, `searchHasResults`, …). **Never** sets
`isNavigating`; **never** hides `.main-content`. Keeps the in-input spinner + in-grid product-card
skeletons. Unchanged.

**Hard rule:** the `.main-content` hide binds strictly to `isNavigating`, and `isNavigating` is
set only by the navigation path. Nothing in the search/sort/filter path may ever set it. This is
what makes the "search focused, user typing" case safe — you only enter Tier 1 by deliberately
navigating away, so the focused input is never hidden mid-type.

## 4. Architecture

`.main-content` (already a client wrapper that hides `children` for intercepted-route overlays)
becomes the **single host** for the Tier-1 loader. The body-level `PageLoadingIndicator` is
removed; its type-switch moves into an in-flow picker.

```
.site-container (flex-col; may carry transform)
├── .home-navbar                      ← persistent chrome, OUTSIDE children (always visible)
└── OverlayVisibilityProvider
    └── MainContent  (.main-content, flex-col)
        ├── {showLoader && <InFlowPageLoader nav={isNavigating} />}   ← in-flow skeleton
        └── <div style={{display: showLoader || overlayActive ? "none" : "contents"}}>
              {children}              ← stays MOUNTED (hidden) so its clearer fires
            </div>
```

Because `.main-content` already sits below `.home-navbar` in normal flow, the in-flow skeleton
lands under the navbar with **no positioning math**. Being inside `.site-container`, it transforms
*with* the page instead of fighting the transform. The "float above search bar / NaN / wrong top"
failure class is eliminated structurally.

### 4.1 The linchpin: hide, don't unmount

`children` is hidden via `display:none` (through the `contents`↔`none` toggle) but **stays
mounted**. This is mandatory: every destination clears the loader from a client component *inside*
`children` (see §6). A `display:none` subtree still mounts, runs effects, fetches, and streams — so
the destination clears `isNavigating` while hidden, then the swap reveals it. If `children` were
*replaced* instead of hidden, the destination would never mount and the loader would hang. This is
the same hide-not-remove technique `MainContent` already uses for overlays.

### 4.2 `display: contents` for the children wrapper

The visible state uses `display: contents` so the wrapper box vanishes and `children` participate
in `.main-content`'s flex layout exactly as today (no extra flex box, no layout shift). The hidden
state uses `display: none`. Approved choice; fall back to a plain `div` only if `contents` is found
to break a specific layout during implementation.

## 5. Component changes

1. **`MainContent`** (`components/ModalRoute/OverlayVisibility.tsx`)
   - Read `isNavigating` from the store (selector subscription).
   - Compute `showLoader = !!isNavigating && !overlayActive`.
   - Render `<InFlowPageLoader nav={isNavigating} />` before the children wrapper.
   - Toggle the children wrapper `display: (showLoader || overlayActive) ? "none" : "contents"`.

2. **`InFlowPageLoader`** (new, e.g. `components/global/InFlowPageLoader.tsx`)
   - The relocated type-switch from `PageLoadingIndicator` (`is_home`/`is_boutique`/`is_product`/
     `is_filter`/`is_full_home`/`is_settings`/`is_filter_search`/`is_compare`), returning the
     per-type skeleton. Rendered in-flow; carries no positioning.

3. **Loader skeletons** — drop the `fixed` + `top` + `w-screen` + `min-h-screen` wrapper; each
   becomes a plain in-flow block. Tailored inner content unchanged, EXCEPT `HomeLoader` (see §6).
   - `HomeLoader`, `ProductLoader`, `SettingsLoader`, `FilterLoader`, `BoutiqueLoader`,
     `FullHomeLoader`, `CompareSkeleton`.

4. **`PageLoadingIndicator`** (`hooks/PageLoadingIndicator.tsx`) + its mount in
   `app/(client)/[lang]/layout.tsx` — removed.

5. **Safety-net clear** (new small client component in the layout, e.g.
   `components/global/NavigationLoaderSafetyNet.tsx`) — see §7.

## 6. Per-page migration & clear points (unchanged wiring)

The set/clear contract is reused verbatim; only the skeleton's position changes.

| Page | Set (Tier 1) | Clears `isNavigating` on mount |
|------|--------------|--------------------------------|
| Home | `NextLink`/back/place-order (`is_home`/`is_full_home`) | `InfinteScroll`, `InitialNavigation` |
| Listing/boutique | `FilterItem`, `ProductList`, `FiltersButton`, `BoutiqueWrapper` (`is_filter`/`is_boutique`) | `ProductInfiniteScroll`, `SortableGrid`, `PageLoaderReset` |
| Product | `ProductCard`, `ProductColorsCards`, wishlist, notifications (`is_product`) | `ProductBackButton`, `ProductDetailsSlider` |
| Settings (entry) | `NextLink` / notifications (`is_settings`) | `InitialNavigation` (mounted in `settings/template.tsx`, re-mounts per settings navigation) / `OrderDetailsWrapper` |
| Compare | `compare.tsx` (`is_compare`) | `compare.tsx` |

**Content note — `HomeLoader`.** Today it exploits `top:350px` to let the *real* hero/stories show
through and skeletons only the offer list below. With children hidden, the skeleton must render the
full above-the-fold (navbar stays — it is outside children — but hero/stories are inside children
and get hidden). `HomeLoader` is completed to include the hero/stories skeleton (as `FullHomeLoader`
already does). This is the one loader whose *content* grows; all others only lose their wrapper.

**Scroll.** `setIsNavigating(null)` already calls `EnableScroll()`, so re-enable on clear is free.
In-flow skeletons need no scroll lock (hidden children contribute no height); any `DisableScroll`
calls inside migrated loaders can be dropped.

## 7. Edge cases & safety

- **Search focused + typing** — safe by the Tier-1/Tier-2 split (§3). No `isNavigating` is set, so
  no hide; the input stays mounted and focused with only the in-grid skeleton + in-input spinner.
- **Stuck loader / missing clearer** — with children hidden, a destination lacking a clearer would
  leave the page blank. **Safety-net:** a layout-level effect watches **`isNavigating` itself** —
  whenever the flag becomes truthy it arms a 2500 ms grace timeout, and if the destination has not
  cleared it by then it force-clears it. The per-destination clears remain the precise, data-ready
  swap in the normal case (the timeout is cancelled); the safety-net only guarantees no permanent
  blank.
  - **Why watch the flag, not `usePathname()` (review finding):** some navigations that set
    `isNavigating` change **only the query string** — home category switch (`?mainCategory=`, set by
    `CategoryNavMobile`, flag `is_home`) and listing sort (`?sort=`, `ListingSortControl`, flag
    `is_filter`). With `staleTimes.dynamic: 30` the destination RSC can be served from the Router
    Cache **without a remount**, so the destination's own clearer never runs *and* the pathname never
    changes. A pathname-only safety-net would miss these and leave a blank page (worse than the old
    overlay, which left the page visible underneath). Watching the flag covers pathname navs,
    query-only navs, and any future setter uniformly. Trade-off: a legitimately slow first page
    (> 2500 ms) is revealed by the safety-net before its data lands — acceptable, since it reveals the
    page's own in-grid loading state rather than hanging.
- **Transformed ancestor** — resolved by being in-flow (no `fixed` to re-anchor).
- **RTL** — no directional positioning remains, so RTL needs no special handling.
- **Overlay + navigation interplay** — when an intercepted-route overlay is active
  (`overlayActive`), children stay hidden and the loader is suppressed (`!overlayActive`), so the two
  hide-reasons compose without conflict.

## 8. Performance

Net neutral-to-positive:
- **Zero** new network requests.
- `children` render hidden during navigation — they render anyway; no added render cost.
- **Deletes** the `getOffset()` DOM measurement and the body-level fixed overlay subtree.
- One in-flow skeleton subtree during navigation (already existed as the overlay).
- No bundle growth of note (one small new picker + safety-net component; one removed).

## 9. Rollback

Isolated and reversible: restore `PageLoadingIndicator` + its layout mount, re-add the `fixed`+`top`
wrappers to the loader skeletons, and revert the `MainContent` change. No data model, store shape,
or set/clear wiring changes — so rollback is purely presentational.

## 10. Decisions (resolved)

1. **Settings** — migrate only the `is_settings` **entry** loader; leave the intra-settings
   `loading-page-class` mechanism as-is (follow-up).
2. **Safety-net clear** — included (§7).
3. **Hidden children wrapper** — `display: contents` (fall back to `div` only if it breaks a
   specific layout).

## 11. File-change list (for the plan)

- `components/ModalRoute/OverlayVisibility.tsx` — host the in-flow loader + `isNavigating` hide.
- `components/global/InFlowPageLoader.tsx` — **new** in-flow type-switch (from `PageLoadingIndicator`).
- `components/global/NavigationLoaderSafetyNet.tsx` — **new** pathname-change fallback clear.
- `hooks/PageLoadingIndicator.tsx` — **removed**.
- `app/(client)/[lang]/layout.tsx` — drop `PageLoadingIndicator`, mount safety-net.
- `components/skeleton/loaders/HomeLoader.tsx` — drop wrapper + complete hero/stories skeleton.
- `components/skeleton/loaders/ProductLoader.tsx` — drop wrapper.
- `components/skeleton/loaders/SettingsLoader.tsx` — drop wrapper.
- `components/skeleton/loaders/FilterLoader.tsx` — drop wrapper + delete `getOffset()`.
- `components/skeleton/loaders/BoutiqueLoader.tsx` — drop wrapper.
- `components/skeleton/loaders/FullHomeLoader.tsx` — drop wrapper.
- `components/skeleton/loaders/CompareSkeleton.tsx` — drop wrapper.

**No changes** to: the store (`isNavigating` shape/reducer), `NextLink`, or any destination clear
component — the set/clear contract is reused as-is.
