# In-Flow Page Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the body-level `position: fixed` navigation loader with an in-flow loader hosted inside `.main-content`, for every page type (home, product, listing, settings, boutique, full-home, compare).

**Architecture:** The loader stops being a viewport-`fixed` overlay positioned by a guessed/measured `top`. Instead `MainContent` (already a client wrapper that hides `children` for overlays) renders the tailored skeleton **in normal flow** and hides `children` (mounted, `display:none`) while `isNavigating` is set. Each destination's existing clearer fires while hidden, then the swap reveals the real page. A pathname-change safety-net guarantees no navigation can hang.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand 5, TailwindCSS 4, `react-loading-skeleton`.

## Global Constraints

- **No test files.** This repo has no test suite (CLAUDE.md). Verify every task with `pnpm lint` + a full `pnpm build` where noted, plus the precise manual runtime check in each task. Do **not** create `*.test.*`/`*.spec.*` files.
- **Do not modify** the store (`isNavigating` shape/reducer in `store/homepage/reducer.ts`), `components/global/NextLink.tsx`, or any destination *clear* component. The set/clear contract is reused verbatim.
- **Tier-1 / Tier-2 invariant:** the `.main-content` hide binds strictly to `isNavigating`, which is set only via the navigation path. Nothing in the search/sort/filter path may set it.
- **No new `loading.tsx` files.**
- **Do not migrate** the intra-settings `loading-page-class` mechanism (the `isFromSetting` branch of `NextLink`) — out of scope.
- Path aliases: `components/*`, `store`, `hooks/*` resolve from repo root (tsconfig). TailwindCSS uses inverted max-width breakpoints; reuse existing classes, don't invent pixel widths.

---

## File Structure

**New files**
- `components/global/InFlowPageLoader.tsx` — in-flow type-switch (home/boutique/product/filter/full-home/settings/filter-search/compare → skeleton). Replaces `hooks/PageLoadingIndicator.tsx`.
- `components/global/NavigationLoaderSafetyNet.tsx` — layout-level fallback that clears `isNavigating` shortly after a pathname change if a destination failed to clear it.

**Modified files**
- `components/ModalRoute/OverlayVisibility.tsx` — `MainContent` hosts the in-flow loader and hides `children` on `isNavigating`.
- `app/(client)/[lang]/layout.tsx` — drop `PageLoadingIndicator`; mount `NavigationLoaderSafetyNet`.
- `components/skeleton/loaders/FilterLoader.tsx` — drop fixed wrapper + delete `getOffset()`.
- `components/skeleton/loaders/BoutiqueLoader.tsx` — drop fixed wrapper.
- `components/skeleton/loaders/ProductLoader.tsx` — drop fixed wrapper.
- `components/skeleton/loaders/SettingsLoader.tsx` — drop fixed wrapper.
- `components/skeleton/loaders/FullHomeLoader.tsx` — drop fixed wrapper.
- `components/skeleton/loaders/CompareSkeleton.tsx` — drop fixed wrapper.
- `components/skeleton/loaders/HomeLoader.tsx` — drop fixed wrapper + complete above-the-fold skeleton.

**Removed**
- `hooks/PageLoadingIndicator.tsx`.

---

## Task 1: Relocate the loader in-flow (host + hide + safety-net)

Introduces the in-flow host, the hidden-children swap, and the safety-net, and removes the body-level overlay. Loader skeletons keep their `fixed` wrappers for now (stripped in Tasks 2–7); the app stays coherent — the loader still appears and still clears, only its positioning is refined per-page afterward.

**Files:**
- Create: `components/global/InFlowPageLoader.tsx`
- Create: `components/global/NavigationLoaderSafetyNet.tsx`
- Modify: `components/ModalRoute/OverlayVisibility.tsx` (the `MainContent` function, ~lines 48-58)
- Modify: `app/(client)/[lang]/layout.tsx` (import + `<PageLoadingIndicator />` at line 158)
- Delete: `hooks/PageLoadingIndicator.tsx`

**Interfaces:**
- Consumes: `useAppStore((s) => s.isNavigating)`; `useOverlayVisibility()` (existing).
- Produces:
  - `InFlowPageLoader` — `export default function InFlowPageLoader({ nav }: { nav: any }): JSX.Element | null`
  - `NavigationLoaderSafetyNet` — `export default function NavigationLoaderSafetyNet(): null`

- [ ] **Step 1: Create the in-flow loader picker**

Create `components/global/InFlowPageLoader.tsx`:

```tsx
"use client";
import Spinner from "components/global/Spinner";
import BoutiqueLoader from "components/skeleton/loaders/BoutiqueLoader";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import ProductLoader from "components/skeleton/loaders/ProductLoader";
import SettingsLoader from "components/skeleton/loaders/SettingsLoader";

/**
 * In-flow navigation loader picker. Rendered INSIDE `.main-content` (normal
 * document flow) — never fixed/absolute. Chooses the tailored skeleton from the
 * `isNavigating` payload. Mirrors the retired hooks/PageLoadingIndicator switch.
 */
export default function InFlowPageLoader({ nav }: { nav: any }) {
  if (!nav) return null;
  if (nav.is_home) return <HomeLoader />;
  if (nav.is_boutique) return <BoutiqueLoader boutique={nav} />;
  if (nav.is_product) return <ProductLoader product={nav} />;
  if (nav.is_filter) return <FilterLoader isForSearch boutique={nav} />;
  if (nav.is_full_home) return <FullHomeLoader />;
  if (nav.is_settings) return <SettingsLoader />;
  if (nav.is_filter_search) return <FilterLoader isForSearch boutique={nav} />;
  if (nav.is_compare) return <CompareSkeleton />;

  // Bare-truthy isNavigating (e.g. setIsNavigating(true)) → generic spinner.
  return (
    <div className="w-full flex justify-center p-5 min-h-[50vh]">
      <span className="scale-[5]">
        <Spinner />
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create the safety-net**

Create `components/global/NavigationLoaderSafetyNet.tsx`:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "store";

/**
 * Fallback clear for the in-flow navigation loader.
 *
 * The precise, data-ready clear is done by each destination on mount
 * (ProductInfiniteScroll, InfinteScroll, ProductBackButton, InitialNavigation,
 * compare.tsx, …). Because `.main-content` hides `children` while `isNavigating`
 * is set, a route with NO clearer would hang. This watches the pathname and, a
 * short beat after it changes, clears `isNavigating` if it is somehow still set —
 * so navigation can never hang. In the normal case the destination clears first
 * and this is a no-op.
 */
export default function NavigationLoaderSafetyNet() {
  const pathname = usePathname();
  const prev = useRef(pathname);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;

    const id = setTimeout(() => {
      if (useAppStore.getState().isNavigating) {
        useAppStore.getState().setIsNavigating(null);
      }
    }, 1500);

    return () => clearTimeout(id);
  }, [pathname]);

  return null;
}
```

- [ ] **Step 3: Host the loader inside `MainContent` and hide children**

In `components/ModalRoute/OverlayVisibility.tsx`, add imports at the top (below the existing React import):

```tsx
import { useAppStore } from "store";
import InFlowPageLoader from "components/global/InFlowPageLoader";
```

Replace the `MainContent` function (currently lines ~48-58) with:

```tsx
/**
 * Renders the page body (`children` slot). Two React-driven hide reasons, never
 * imperative DOM mutation:
 *  - an intercepted-route overlay is showing (`overlayActive`) → whole slot hidden;
 *  - a route navigation is in progress (`isNavigating`) → the in-flow loader shows
 *    and `children` are hidden but STILL MOUNTED, so the destination's own clearer
 *    fires and then the swap reveals the real page.
 */
export function MainContent({ children }: { children: ReactNode }) {
  const { overlayActive } = useOverlayVisibility();
  const isNavigating = useAppStore((s) => s.isNavigating);
  const showLoader = !!isNavigating && !overlayActive;

  return (
    <div
      className="w-full flex-col main-content max-w-[1365px]"
      style={{ display: overlayActive ? "none" : "flex" }}
    >
      {showLoader && <InFlowPageLoader nav={isNavigating} />}
      <div style={{ display: showLoader ? "none" : "contents" }}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Drop the body-level overlay from the layout**

In `app/(client)/[lang]/layout.tsx`:

Remove the import (line 12): `import PageLoadingIndicator from "hooks/PageLoadingIndicator";`

Add near the other global clients: `import NavigationLoaderSafetyNet from "components/global/NavigationLoaderSafetyNet";`

Replace the `<PageLoadingIndicator />` usage (line 158) with:

```tsx
        <NavigationLoaderSafetyNet />
```

- [ ] **Step 5: Delete the retired file**

```bash
git rm hooks/PageLoadingIndicator.tsx
```

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: no new errors referencing the changed files.

- [ ] **Step 7: Manual runtime verification**

Run: `pnpm dev` and in the browser:
1. From the home page, click a boutique/category link → a loader appears **instantly**, the previous page content is hidden, and it clears to the real page on arrival (no permanent blank/skeleton).
2. Navigate to a product, to settings, back to home → each shows its loader and clears.
3. On a listing page, focus the search box and type → the search input stays focused, only the in-grid skeleton/spinner shows, `.main-content` is **not** hidden (Tier-2 unaffected).

Note: loaders may still look like a full-viewport overlay here (their `fixed` wrappers are removed in Tasks 2–7). What matters in this task is that the loader **shows and clears**, and search typing is unaffected.

- [ ] **Step 8: Commit**

```bash
git add components/global/InFlowPageLoader.tsx components/global/NavigationLoaderSafetyNet.tsx components/ModalRoute/OverlayVisibility.tsx app/\(client\)/\[lang\]/layout.tsx
git commit -m "feat(loader): host navigation loader in-flow inside main-content + safety-net"
```

---

## Task 2: Listing loader in-flow (FilterLoader) — the headline fix

**Files:**
- Modify: `components/skeleton/loaders/FilterLoader.tsx` (whole file)

**Interfaces:**
- Consumes: `ListingSkeleton` (unchanged) from `components/skeleton/listing`.
- Produces: `FilterLoader({ boutique, isForSearch })` — same props, now in-flow.

- [ ] **Step 1: Replace the file with the in-flow version**

Replace the entire contents of `components/skeleton/loaders/FilterLoader.tsx` with:

```tsx
import React from "react";
import ListingSkeleton from "../listing";

/**
 * In-flow listing loader. Rendered inside `.main-content` (below the persistent
 * navbar), so it needs no fixed positioning and no measured `top` — the source of
 * the "floats above the search bar / NaN top" bug that this removes.
 */
function FilterLoader({
  boutique,
  isForSearch,
}: {
  boutique: any;
  isForSearch?: boolean;
}) {
  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <ListingSkeleton
        isForSearch={isForSearch}
        boutique={boutique?.name === "Search" ? null : boutique}
        forProducts={true}
        withBanners={true}
      />
    </div>
  );
}

export default FilterLoader;
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors; note `getOffset`, `zIndex`, `top`, `fixed`, `w-screen`, `min-h-screen`, `mx-auto`, `max-w-[1365px]` are all gone.

- [ ] **Step 3: Manual runtime verification (the reported bug)**

Run `pnpm dev`:
1. On a listing/boutique page, **scroll down** so scroll ≠ 0, then click a filter category/chip that navigates → the skeleton appears **in flow, directly under the navbar/search bar**, never floating over the search bar.
2. Repeat starting from home and from a page **without** a `.boutique-header` (e.g. search) → no `NaN`/misplacement; the skeleton is always correctly under the header.
3. The skeleton clears to the real grid on arrival.

- [ ] **Step 4: Commit**

```bash
git add components/skeleton/loaders/FilterLoader.tsx
git commit -m "fix(loader): render listing FilterLoader in-flow, drop measured top"
```

---

## Task 3: Boutique loader in-flow (BoutiqueLoader)

**Files:**
- Modify: `components/skeleton/loaders/BoutiqueLoader.tsx` (the outer wrapper `div`, lines 11-18)

**Interfaces:**
- Consumes: `ListingSkeleton`, `BoutiqueSlidersSkeleton`, `Skeleton` (unchanged).
- Produces: `BoutiqueLoader({ boutique, isForSearch })` — same props, in-flow.

- [ ] **Step 1: Replace the outer wrapper**

In `components/skeleton/loaders/BoutiqueLoader.tsx`, replace the opening wrapper `div` (currently):

```tsx
    <div
      style={{
        zIndex: "99999999999999",
        top: isForSearch ? "150px" : "98px",
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
```

with:

```tsx
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
```

Leave everything inside (the `filter-listing-bar`, `boutique-header`, both `ListingSkeleton` calls) unchanged.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors. `isForSearch` may now be unused in positioning — it is still a declared prop and fine to keep; if lint flags it as unused, keep the prop in the signature (it is part of the public shape) and ignore.

- [ ] **Step 3: Manual runtime verification**

Run `pnpm dev`: navigate into a boutique (e.g. from a boutique tile) while scrolled on the source page → the boutique skeleton (bar + header + filters + grid) renders in-flow under the navbar and clears to the real boutique page.

- [ ] **Step 4: Commit**

```bash
git add components/skeleton/loaders/BoutiqueLoader.tsx
git commit -m "fix(loader): render BoutiqueLoader in-flow"
```

---

## Task 4: Product loader in-flow (ProductLoader)

**Files:**
- Modify: `components/skeleton/loaders/ProductLoader.tsx` (the outer wrapper `div`, lines 30-36)

**Interfaces:**
- Consumes: `useAppStore` currency, `useParams` lang (unchanged).
- Produces: `ProductLoader({ product })` — same prop, in-flow.

- [ ] **Step 1: Replace the outer wrapper**

In `components/skeleton/loaders/ProductLoader.tsx`, replace:

```tsx
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed max-w-[1365px] mx-auto flex-col bg-[#fafafa] min-h-screen flex    w-screen  overflow-hidden"
    >
```

with:

```tsx
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
```

Leave the `product-details-container` subtree unchanged.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manual runtime verification**

Run `pnpm dev`: from a listing grid, click a product card while scrolled → the product skeleton (image + name + body) renders in-flow under the navbar and clears to the real product page. The clicked product's real name/brand/first image show immediately (tailored data).

- [ ] **Step 4: Commit**

```bash
git add components/skeleton/loaders/ProductLoader.tsx
git commit -m "fix(loader): render ProductLoader in-flow"
```

---

## Task 5: Settings loader in-flow (SettingsLoader)

**Files:**
- Modify: `components/skeleton/loaders/SettingsLoader.tsx` (the outer wrapper `div`, lines 22-28)

**Interfaces:**
- Consumes: `useAppStore` userProfile (unchanged).
- Produces: `SettingsLoader()` — in-flow.

- [ ] **Step 1: Replace the outer wrapper**

In `components/skeleton/loaders/SettingsLoader.tsx`, replace:

```tsx
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex-col    w-screen  overflow-hidden"
    >
```

with:

```tsx
    <div className="w-full flex-col bg-[#fafafa] overflow-hidden">
```

Leave the inner settings skeleton unchanged.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manual runtime verification**

Run `pnpm dev`: navigate into Settings from the nav/profile entry (the `is_settings` path) → the settings skeleton renders in-flow under the navbar and clears (via `InitialNavigation` in `settings/template.tsx`) to the real settings page. (Intra-settings sub-navigation still uses its existing `loading-page-class` — unchanged.)

- [ ] **Step 4: Commit**

```bash
git add components/skeleton/loaders/SettingsLoader.tsx
git commit -m "fix(loader): render SettingsLoader in-flow"
```

---

## Task 6: Full-home and compare loaders in-flow

**Files:**
- Modify: `components/skeleton/loaders/FullHomeLoader.tsx` (the outer wrapper `div`, lines 9-15)
- Modify: `components/skeleton/loaders/CompareSkeleton.tsx` (the outer wrapper `div`, lines 5-11)

**Interfaces:**
- Produces: `FullHomeLoader()`, `CompareSkeleton()` — both in-flow.

- [ ] **Step 1: FullHomeLoader wrapper**

In `components/skeleton/loaders/FullHomeLoader.tsx`, replace:

```tsx
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="site-container items-center fixed max-w-[1365px] mx-auto bg-[#fafafa] min-h-screen  flex    w-screen  overflow-hidden"
    >
```

with:

```tsx
    <div className="w-full flex-col items-center bg-[#fafafa] overflow-hidden">
```

Leave the `MobileNavigationSkeleton`/`StoriesSkeleton`/`FeaturedProductsSkeleton`/`OfferListSkeleton` children unchanged.

- [ ] **Step 2: CompareSkeleton wrapper**

In `components/skeleton/loaders/CompareSkeleton.tsx`, replace:

```tsx
    <div
      style={{
        zIndex: "99999999999999",
        top: "100px",
      }}
      className="fixed bg-[#fafafa] h-screen max-w-[1365px] mx-auto flex justify-center p-5  w-screen overflow-hidden top-[100px]"
    >
```

with:

```tsx
    <div className="w-full bg-[#fafafa] flex justify-center p-5 overflow-hidden">
```

Leave the inner `container … max-w-7xl` table skeleton unchanged.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Manual runtime verification**

Run `pnpm dev`:
1. Trigger a full-home navigation (e.g. the back-to-home button / place-order return, which set `is_full_home`) → the full-home skeleton renders in-flow and clears.
2. Open a compare navigation (`is_compare`) → the compare table skeleton renders in-flow under the navbar and clears.

- [ ] **Step 5: Commit**

```bash
git add components/skeleton/loaders/FullHomeLoader.tsx components/skeleton/loaders/CompareSkeleton.tsx
git commit -m "fix(loader): render FullHomeLoader and CompareSkeleton in-flow"
```

---

## Task 7: Home loader in-flow + complete above-the-fold

`HomeLoader` previously used `top:350px` to let the real hero/stories show through and only skeletoned the offer list. In-flow with children hidden, it must render the full above-the-fold itself (the persistent navbar stays — it lives in the layout, outside `children`).

**Files:**
- Modify: `components/skeleton/loaders/HomeLoader.tsx` (whole file)

**Interfaces:**
- Consumes: `StoriesSkeleton` (`components/skeleton/StoriesSkeleton`), `FeaturedProductsSkeleton` (`components/skeleton/loaders/FeaturedProductsSkeleton`), `OfferListSkeleton` (`components/skeleton/OfferList`) — all existing.
- Produces: `HomeLoader()` — in-flow, full above-the-fold.

- [ ] **Step 1: Replace the file**

Replace the entire contents of `components/skeleton/loaders/HomeLoader.tsx` with:

```tsx
import React from "react";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import OfferListSkeleton from "components/skeleton/OfferList";

/**
 * In-flow home loader. Because the loader now hides the page `children` (rather
 * than overlaying only the lower area at top:350px), it renders the full
 * above-the-fold: stories → featured rows → offer list. The site navbar stays
 * visible (it lives in the layout, outside `children`).
 */
function HomeLoader() {
  return (
    <div className="w-full flex-col flex bg-[#fafafa] overflow-hidden">
      <StoriesSkeleton />
      <FeaturedProductsSkeleton />
      <FeaturedProductsSkeleton />
      <OfferListSkeleton />
    </div>
  );
}

export default HomeLoader;
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors; imports resolve (`StoriesSkeleton`, `FeaturedProductsSkeleton`, `OfferListSkeleton` all exist).

- [ ] **Step 3: Manual runtime verification**

Run `pnpm dev`: trigger a home navigation that sets `is_home` (e.g. a home/category link) → the skeleton now covers the full above-the-fold (stories + featured + offers) with no blank top strip and no content peeking through, then clears to the real home page.

- [ ] **Step 4: Commit**

```bash
git add components/skeleton/loaders/HomeLoader.tsx
git commit -m "fix(loader): render HomeLoader in-flow with full above-the-fold skeleton"
```

---

## Task 8: Full build + final sweep

**Files:** none (verification only).

- [ ] **Step 1: Grep for leftover fixed loaders**

Run: `git grep -n "zIndex: \"99999999999999\"" -- components/skeleton/loaders`
Expected: **no matches** (every loader wrapper stripped).

Run: `git grep -n "PageLoadingIndicator"`
Expected: **no matches** (file deleted, layout no longer references it).

Run: `git grep -n "getOffset" -- components/skeleton/loaders`
Expected: **no matches**.

- [ ] **Step 2: Production build (type-check gate)**

Run: `pnpm build`
Expected: build succeeds with no type errors introduced by the changed files.

- [ ] **Step 3: End-to-end manual sweep**

Run `pnpm dev` and, each time starting from a **scrolled** (scroll ≠ 0) source page, verify the loader appears **in-flow under the navbar** (never floating over the search bar), then clears to the real page for: home, boutique, listing/filter, product, settings, full-home, compare. Also confirm listing search-typing still keeps the input focused with only the in-grid skeleton (Tier-2 untouched), and that no navigation hangs (safety-net covers any missing clearer).

- [ ] **Step 4: Commit (if any final tidy was needed)**

```bash
git commit -am "chore(loader): final in-flow loader sweep" --allow-empty
```

---

## Notes on coherence between tasks

- After **Task 1** the loader is hosted in-flow and children hide/clear correctly, but the individual skeletons still carry their `fixed` wrappers, so they may briefly look like a full-viewport overlay. This is expected and is resolved per-page in Tasks 2–7. The mechanism (instant show + correct clear + Tier-2 safety) is fully testable at Task 1.
- Tasks 2–7 are independent per-loader strips; they can be reviewed/rejected individually without affecting the others (each page's loader is self-contained).
