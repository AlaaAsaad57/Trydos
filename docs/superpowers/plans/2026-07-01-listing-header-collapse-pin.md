# Listing Header Collapse / Pin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the imperative `expandView`/`normalizeView` scroll handler with a native `position: sticky` pin, a single `IntersectionObserver` collapse flag, and CSS transitions, so the listing banner collapses and the top-bar/navbar stay pinned without DOM-mutating scroll code.

**Architecture:** The site navbar and listing top-bar pin via CSS `position: sticky` (no JS). One small client component (`ListingHeaderCollapse`) wraps the listing header, drops a 1px sentinel at the top of the banner, and runs a single `IntersectionObserver` that toggles a `data-collapsed` attribute. CSS grid-rows animate the banner to zero height; a compact store logo crossfades into the sticky bar for persistent branding. The old global scroll listener and both functions are deleted.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand 5 (`useAppStore`), TailwindCSS 4, plain CSS in `public/styles/`.

## Global Constraints

- **No test suite** — this repo has none and CLAUDE.md forbids adding one. Every "verify" step below is **manual dev-server validation + `pnpm build` + `pnpm lint`**, not automated tests. Do NOT create test files.
- Package manager is **pnpm**.
- Data fetching, store, and Suspense patterns must follow existing code — no new store slice (nothing else reads collapse state).
- TailwindCSS custom **max-width** breakpoints are inverted (`md` = max 768px, `lg` = min 769px). Use existing classes; do not introduce raw pixel breakpoints.
- React Compiler is enabled — do not add manual `useMemo`/`useCallback`.
- Work happens on the existing branch `ticket/listing-refactor`. Commit per task.
- Reference spec: `docs/superpowers/specs/2026-07-01-listing-header-collapse-pin-design.md`.

## Pin geometry (single source of truth)

- Site navbar `.home-navbar` height ≈ **98px** (`min-h-[98px]`) → CSS var `--listing-navbar-h: 98px`.
- Listing bar `.filter-listing-bar` height = **50px**.
- Collapse trigger offset = navbar + bar = **148px** (used as the observer `rootMargin` top inset).

## File structure

- `utils/functions.tsx` — **delete** `expandView` + `normalizeView` (lines ~109–260).
- `components/Cart/CartProvider.tsx` — **remove** the `window.addEventListener("scroll", …)` block + the `expandView`/`normalizeView` import.
- `components/Home/Search/SearchIcon.tsx` — **remove** the unused `normalizeView` import and the `// normalizeView();` comment.
- `app/(client)/[lang]/layout.tsx` — change `<html>` `overflow-x-hidden` → `overflow-x-clip`.
- `public/styles/globals.css` — add `--listing-navbar-h` + `.home-navbar { position: sticky }`; remove `@keyframes animate-in`, `.home-navbar.animate-in`, `.filter-listing-bar.fixedAlign`.
- `public/styles/listing-components.css` — add `.filter-listing-bar { position: sticky }`, `.banner-collapse`, `.banner-sentinel`, `.listing-header[...]`, `.brand-mini`; remove `@keyframes move`, `.move-anim`, and the blanket `transition: 1s` on `.filter-listing-bar, .boutique-top-info`.
- `components/Listing/ListingHeaderCollapse.tsx` — **new** client component (collapse state + observer + sentinel + wrapper).
- `components/Listing/BoutiqueMiniLogo.tsx` — **new** server component (compact logo in the bar).
- `components/Listing/FiltersPageContent.tsx` — wrap the bar + boutique-header in `ListingHeaderCollapse`; remove `relative` from the bar; add `BoutiqueMiniLogo`.
- `components/skeleton/loaders/BoutiqueLoader.tsx` — verify it is NOT wrapped, align offsets so the swap-in doesn't jump.

---

## Task 1: Remove the imperative system and establish the native sticky pin

**Files:**
- Modify: `utils/functions.tsx` (delete `expandView`/`normalizeView`)
- Modify: `components/Cart/CartProvider.tsx:4,125-133`
- Modify: `components/Home/Search/SearchIcon.tsx:8,395`
- Modify: `app/(client)/[lang]/layout.tsx:97`
- Modify: `public/styles/globals.css` (add sticky navbar + var; remove animate-in + fixedAlign)
- Modify: `public/styles/listing-components.css` (add sticky bar; remove move/transition:1s)
- Modify: `components/Listing/FiltersPageContent.tsx:162` (remove `relative`)

**Interfaces:**
- Produces: `--listing-navbar-h` CSS var; `.home-navbar`/`.filter-listing-bar` are `position: sticky`. No exported symbols.
- After this task the header pins on scroll but the banner does **not** collapse yet (full height always). App is coherent.

- [ ] **Step 1: Delete `expandView` and `normalizeView`**

In `utils/functions.tsx`, remove the entire `export const expandView = ({ filter }) => { … }` block and the entire `export const normalizeView = () => { … }` block (≈ lines 109–260, ending at the `};` that precedes `function preciseMultiply`). Leave `preciseMultiply` and everything else intact.

- [ ] **Step 2: Remove the scroll listener from `CartProvider`**

In `components/Cart/CartProvider.tsx`, delete the import on line 4:

```tsx
import { expandView, normalizeView } from "utils/functions";
```

Then remove the scroll block inside the first `useEffect` (lines ~125–133):

```tsx
    window.addEventListener("scroll", function (e) {
      if (!filterEnabled) {
        if (window.scrollY > 80) {
          expandView({ filter: false });
        } else {
          normalizeView();
        }
      }
    });
```

Leave the `popstate` listener, its cleanup, and everything else untouched. (`filterEnabled` is still destructured elsewhere in the component — do not remove that.)

- [ ] **Step 3: Clean the stale reference in `SearchIcon`**

In `components/Home/Search/SearchIcon.tsx`, remove `normalizeView,` from the `utils/functions` import (line ~8) and delete the `// normalizeView();` comment (line ~395).

- [ ] **Step 4: Swap `overflow-x-hidden` → `overflow-x-clip` on `<html>`**

In `app/(client)/[lang]/layout.tsx` (line ~97), inside the `className` array on `<html>`, change `"overflow-x-hidden"` to `"overflow-x-clip"`. (`clip` clips horizontally identically but does not create a scroll container, keeping `position: sticky` reliable.)

- [ ] **Step 5: Add the sticky navbar + var, remove dead navbar CSS**

In `public/styles/globals.css`:

Add near the top (after the first `:root {…}` or at the top of the file):

```css
:root {
  --listing-navbar-h: 98px;
}

.home-navbar {
  position: sticky;
  top: 0;
}
```

Remove the now-dead rules:

```css
/* DELETE */
.filter-listing-bar.fixedAlign {
  top: 98px !important;
}
```

```css
/* DELETE */
.home-navbar.animate-in {
  animation-name: animate-in;
  animation-duration: 0.5s;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes animate-in {
  /* …the full keyframe block… */
}
```

- [ ] **Step 6: Add the sticky bar, remove dead listing CSS**

In `public/styles/listing-components.css`:

Add:

```css
.filter-listing-bar {
  position: sticky;
  top: var(--listing-navbar-h);
  background: #fff;
}
```

Remove the blanket 1s transition and the dead move animation:

```css
/* DELETE the `transition: 1s;` — replace the combined rule so only boutique-top-info keeps a scoped transition if needed */
.filter-listing-bar,
.boutique-top-info {
  transition: 1s;
}
```

Replace it with:

```css
.boutique-top-info {
  transition: opacity 0.3s ease;
}
```

```css
/* DELETE */
@keyframes move {
  /* …full block… */
}
.move-anim {
  /* …full block… */
}
```

- [ ] **Step 7: Remove `relative` from the real listing bar**

In `components/Listing/FiltersPageContent.tsx` (the `.filter-listing-bar` div, line ~162), delete the `relative` token from the className string so the CSS `position: sticky` is not overridden by Tailwind's `.relative`. (Leave the skeleton's `relative` in `BoutiqueLoader` — that is handled in Task 4.)

- [ ] **Step 8: Verify build + lint**

Run: `pnpm lint`
Expected: no new errors referencing `expandView`/`normalizeView`/`SearchIcon`.

Run: `pnpm build`
Expected: build completes; no "expandView is not defined" or unused-import errors.

- [ ] **Step 9: Manual validation in dev**

Run: `pnpm dev`, open a boutique listing page (e.g. `/gb-en/<a boutique filter>`).
Expected observations:
- Scrolling down: the TryDos navbar stays pinned at the top and the listing top-bar sits pinned directly under it (`top: 98px`). No console errors.
- The banner is still full height and does **not** collapse yet (expected at this stage).
- No content "jump" when the navbar pins.
- Open the home page and a product page: the navbar still pins on scroll; nothing throws.

- [ ] **Step 10: Commit**

```bash
git add utils/functions.tsx components/Cart/CartProvider.tsx components/Home/Search/SearchIcon.tsx app/\(client\)/\[lang\]/layout.tsx public/styles/globals.css public/styles/listing-components.css components/Listing/FiltersPageContent.tsx
git commit -m "refactor(listing): native sticky pin; remove imperative expand/normalizeView"
```

---

## Task 2: Banner collapse via `ListingHeaderCollapse` + IntersectionObserver

**Files:**
- Create: `components/Listing/ListingHeaderCollapse.tsx`
- Modify: `components/Listing/FiltersPageContent.tsx` (wrap bar + boutique-header)
- Modify: `public/styles/listing-components.css` (add collapse rules)

**Interfaces:**
- Produces: `ListingHeaderCollapse` (default export), props:
  ```ts
  interface ListingHeaderCollapseProps {
    filterBar: React.ReactNode;      // the sticky .filter-listing-bar subtree
    banner: React.ReactNode;         // collapsible: ListingBoutiqueSlider output (logo + banner)
    categoryFilters: React.ReactNode;// stays visible below the banner
    isRtl?: boolean;
  }
  ```
- Consumes (Task 3): the same `filterBar` slot will also contain `BoutiqueMiniLogo`.

- [ ] **Step 1: Create the client component**

Create `components/Listing/ListingHeaderCollapse.tsx`:

```tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useAppStore } from "store";

interface ListingHeaderCollapseProps {
  /** Sticky top-bar (.filter-listing-bar), server-rendered. */
  filterBar: ReactNode;
  /** Collapsible banner region (ListingBoutiqueSlider: store logo + banner slider). */
  banner: ReactNode;
  /** Category filters — stay visible, rendered below the collapsing banner. */
  categoryFilters: ReactNode;
  isRtl?: boolean;
}

// Pin stack height = navbar (--listing-navbar-h, 98px) + top-bar (50px).
// The banner collapses once its top scrolls under the pinned bar, and
// re-expands only when it returns near the top (the sentinel re-enters).
const PIN_STACK_PX = 148;

export default function ListingHeaderCollapse({
  filterBar,
  banner,
  categoryFilters,
  isRtl = false,
}: ListingHeaderCollapseProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Freeze toggling while the filter modal is open so opening filters does not
  // reshuffle the header. Read through a ref so the once-created observer
  // callback always sees the latest value without re-subscribing.
  const filterEnabled = useAppStore((s) => s.filterEnabled);
  const filterEnabledRef = useRef(filterEnabled);
  filterEnabledRef.current = filterEnabled;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (filterEnabledRef.current) return;
        setCollapsed(!entry.isIntersecting);
      },
      { rootMargin: `-${PIN_STACK_PX}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div data-collapsed={collapsed} data-rtl={isRtl} className="listing-header">
      {filterBar}
      <div
        data-cy="boutique_header"
        className="boutique-header flex-col align-center"
      >
        <div ref={sentinelRef} aria-hidden className="banner-sentinel" />
        <div className="banner-collapse">{banner}</div>
        {categoryFilters}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the collapse CSS**

In `public/styles/listing-components.css`, add:

```css
/* Height-agnostic banner collapse (no pixel heights). */
.banner-collapse {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.35s ease;
}
.listing-header[data-collapsed="true"] .banner-collapse {
  grid-template-rows: 0fr;
}
.banner-collapse > * {
  min-height: 0;
  overflow: hidden;
}

/* 1px marker at the top of the banner; drives the collapse observer. */
.banner-sentinel {
  height: 1px;
  width: 100%;
  pointer-events: none;
}
```

- [ ] **Step 3: Wire `FiltersPageContent` to use the wrapper**

In `components/Listing/FiltersPageContent.tsx`, replace the current sibling markup — the `.filter-listing-bar` div followed by the `.boutique-header` div (lines ~160–225) — with a single `ListingHeaderCollapse` element. Move the existing bar JSX into the `filterBar` prop (minus `relative`, already removed in Task 1), the `ListingBoutiqueSlider` Suspense into `banner`, and the `FilterListContainer` Suspense into `categoryFilters`. Add the import at the top:

```tsx
import ListingHeaderCollapse from "components/Listing/ListingHeaderCollapse";
```

Resulting JSX (replace the two `<div>`s with this):

```tsx
<ListingHeaderCollapse
  isRtl={isRtl}
  filterBar={
    <div
      data-cy="filter_listing_bar"
      className={`filter-listing-bar z-99999999 ${
        isRtl ? "flex-row-reverse flex" : "flex-row flex"
      } align-center left-0 right-0 mx-auto w-full h-[50px] pl-[15px] max-w-[1365px] pr-[20px] justify-between bg-white z-10`}
    >
      <FilterListingBackButton lang={Params.lang} isRtl={isRtl} />
      <div
        data-cy="filter_bar_options"
        className={`filter-bar-options w-[170px] justify-between ${
          isRtl ? "flex-row-reverse flex" : "flex-row flex"
        }  align-center ${
          parsedFilters?.search_text?.length > 0 ? "w-full" : ""
        }`}
      >
        <Suspense fallback={<></>}>
          <ListingSearchContainer
            country={country}
            language={language}
            filtersPromise={filtersDataPromise}
            parsedFilters={parsedFilters}
          />
        </Suspense>
        <div data-cy="filter_option_loseSearchInput" className="filter-option">
          <img src="/icons/sortIcon.svg" data-cy="closeSearchInput" alt="" />
        </div>
        <FilterBoutiquePageButton key="filter-button" />
        <ShareBoutiquePageButton />
      </div>
    </div>
  }
  banner={
    parsedFilters?.boutiques?.[0] ? (
      <Suspense
        fallback={<BoutiqueSlidersSkeleton />}
        key={boutiqueItem || "noFilters"}
      >
        <ListingBoutiqueSlider
          boutiquePromise={boutiquePromise}
          key={boutiqueItem || "noFilters"}
        />
      </Suspense>
    ) : null
  }
  categoryFilters={
    <Suspense
      fallback={<ListingSkeleton justFilters />}
      key={`FilterList ${Params.lang}`}
    >
      <FilterListContainer
        filtersPromis={filtersDataPromise}
        currencyPromise={currencyPromise}
        Params={Params}
        parsedFilters={parsedFilters}
      />
    </Suspense>
  }
/>
```

Leave the `<FilterWidgetServer>` Suspense above it and the `<ProductListConainer>` Suspense below it exactly as they are.

- [ ] **Step 4: Verify build + lint**

Run: `pnpm lint` then `pnpm build`
Expected: both succeed; no unused-import warnings for the moved components (`FilterListingBackButton`, `ListingSearchContainer`, etc. are still used inside the slots).

- [ ] **Step 5: Manual validation in dev**

Run: `pnpm dev`, open a boutique listing page.
Expected observations:
- Scroll down past the banner: the banner (store logo + banner images) collapses smoothly to zero height; the category filters slide up and sit under the pinned bar.
- Scroll back to the top: the banner re-expands smoothly. Scrolling **up** mid-list does **not** re-expand it (only near the top does).
- Open the filter modal (filter button): the header does not reshuffle/collapse while it is open. Close it: behavior resumes.
- No console errors; the transition is smooth (no snapping).

- [ ] **Step 6: Commit**

```bash
git add components/Listing/ListingHeaderCollapse.tsx components/Listing/FiltersPageContent.tsx public/styles/listing-components.css
git commit -m "feat(listing): banner collapse via sticky wrapper + IntersectionObserver"
```

---

## Task 3: Persistent compact store logo in the sticky bar

**Files:**
- Create: `components/Listing/BoutiqueMiniLogo.tsx`
- Modify: `components/Listing/FiltersPageContent.tsx` (add mini logo in the bar's leading group)
- Modify: `public/styles/listing-components.css` (add `.brand-mini` crossfade)

**Interfaces:**
- Consumes: `boutiquePromise` (already created in `FiltersPageContent`; resolves to `{ icon, name, banners, … }`).
- Produces: `BoutiqueMiniLogo` (default export) — an async server component rendering the compact logo, or `null` when there is no boutique icon (search page).

- [ ] **Step 1: Create the mini-logo server component**

Create `components/Listing/BoutiqueMiniLogo.tsx`:

```tsx
import Image from "next/image";
import { GetImageUrl } from "utils/server";

// Compact store logo that lives inside the sticky bar and crossfades in when the
// header is collapsed (visibility is driven purely by CSS via [data-collapsed]).
export default async function BoutiqueMiniLogo({
  boutiquePromise,
}: {
  boutiquePromise: Promise<{ icon?: string; name?: string } | null>;
}) {
  const boutique = await boutiquePromise;
  if (!boutique?.icon) return null;
  return (
    <div data-cy="boutique_mini_logo" className="brand-mini align-center" aria-hidden>
      <Image
        alt={boutique?.name ?? ""}
        width={90}
        height={18}
        src={GetImageUrl(boutique.icon)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add the mini logo to the bar's leading group**

In `components/Listing/FiltersPageContent.tsx`, add the import:

```tsx
import BoutiqueMiniLogo from "components/Listing/BoutiqueMiniLogo";
```

Inside the `filterBar` slot, wrap the back button and the mini logo in a leading flex group so the logo sits **next to the back button** (mirrors for RTL via the existing `flex-row-reverse`). Replace the lone `<FilterListingBackButton … />` line with:

```tsx
      <div
        className={`align-center ${
          isRtl ? "flex-row-reverse flex" : "flex-row flex"
        } items-center gap-[8px]`}
      >
        <FilterListingBackButton lang={Params.lang} isRtl={isRtl} />
        <Suspense fallback={<></>}>
          <BoutiqueMiniLogo boutiquePromise={boutiquePromise} />
        </Suspense>
      </div>
```

- [ ] **Step 3: Add the `.brand-mini` crossfade CSS**

In `public/styles/listing-components.css`, add:

```css
/* Compact branding: hidden when expanded, crossfades in when collapsed. */
.brand-mini {
  opacity: 0;
  max-width: 0;
  overflow: hidden;
  transform: translateX(-6px);
  transition: opacity 0.3s ease, transform 0.3s ease, max-width 0.3s ease;
  pointer-events: none;
}
.listing-header[data-collapsed="true"] .brand-mini {
  opacity: 1;
  max-width: 120px;
  transform: none;
  pointer-events: auto;
}
.listing-header[data-rtl="true"] .brand-mini {
  transform: translateX(6px);
}
.listing-header[data-rtl="true"][data-collapsed="true"] .brand-mini {
  transform: none;
}
```

- [ ] **Step 4: Verify build + lint**

Run: `pnpm lint` then `pnpm build`
Expected: both succeed; `GetImageUrl` import resolves from `utils/server`.

- [ ] **Step 5: Manual validation in dev**

Run: `pnpm dev`, open a boutique listing page.
Expected observations:
- Expanded (top of page): no compact logo in the bar.
- Collapsed (scrolled down): the compact store logo fades/slides in next to the back button.
- RTL locale (`ar`/`ku`): the compact logo appears on the opposite side, mirrored, next to the back button.
- Search page (no boutique, e.g. a search query with no boutique filter): no compact logo appears and nothing throws.

- [ ] **Step 6: Commit**

```bash
git add components/Listing/BoutiqueMiniLogo.tsx components/Listing/FiltersPageContent.tsx public/styles/listing-components.css
git commit -m "feat(listing): persistent compact store logo in the sticky bar on collapse"
```

---

## Task 4: Skeleton stays static; final cleanup verification

**Files:**
- Modify: `components/skeleton/loaders/BoutiqueLoader.tsx` (align offsets; confirm no collapse wiring)
- Verify: no remaining `expandView`/`normalizeView` references anywhere.

**Interfaces:**
- Consumes/Produces: none (verification + alignment task).

- [ ] **Step 1: Confirm the skeleton is inert**

Open `components/skeleton/loaders/BoutiqueLoader.tsx`. Confirm it does **not** import or render `ListingHeaderCollapse` and has no `data-collapsed`. It should render the plain expanded markup. (It is `position: fixed` at `top: isForSearch ? 150px : 100px` — leave the fixed container, but see Step 2.)

- [ ] **Step 2: Align the skeleton's top offset with the real header**

In `components/skeleton/loaders/BoutiqueLoader.tsx`, the fixed container currently uses `top: isForSearch ? "150px" : "100px"`. The real header now pins the bar at `98px` under the navbar. Change the non-search offset from `"100px"` to `"98px"` so the skeleton bar and the hydrated sticky bar align and the swap-in does not shift:

```tsx
      style={{
        zIndex: "99999999999999",
        top: isForSearch ? "150px" : "98px",
      }}
```

(Leave `isForSearch` at `150px` — that path is unchanged.)

- [ ] **Step 3: Grep for stale references**

Run: `git grep -n "expandView\|normalizeView"`
Expected: **no matches** (all definitions and call sites removed in Tasks 1–2). If any remain, remove them.

Run: `git grep -n "\.move-anim\|animate-in\|fixedAlign\|@keyframes move"`
Expected: no matches in `public/styles/` (all removed in Task 1). Remove any stragglers.

- [ ] **Step 4: Verify build + lint**

Run: `pnpm lint` then `pnpm build`
Expected: both succeed cleanly.

- [ ] **Step 5: Full manual validation (all locales + skeleton)**

Run: `pnpm dev`.
- In DevTools, throttle the network (Slow 4G) and hard-reload a boutique listing page. While the skeleton is visible, scroll: the skeleton stays in the expanded layout and does **not** collapse or flicker. When real content swaps in, the bar/banner do not jump position.
- Repeat the Task 2 + Task 3 checks (collapse, re-expand near top, filter-modal gate, compact logo) in `en`, `ar`, `tr`, `ku`. RTL (`ar`/`ku`) mirrors correctly.
- Confirm horizontal overflow is still contained (no sideways scroll) after the `overflow-x: clip` change.
- Confirm home + product pages still pin the navbar and are otherwise unaffected.

- [ ] **Step 6: Commit**

```bash
git add components/skeleton/loaders/BoutiqueLoader.tsx
git commit -m "fix(listing): align skeleton offset with sticky header; verify cleanup"
```

---

## Self-review

**Spec coverage:**
- Sticky top-bar + global navbar pin → Task 1 (Steps 5–7). ✅
- Banner collapse-on-down / re-expand only near top → Task 2 (observer + grid-rows). ✅
- Persistent compact branding next to back button, RTL-mirrored → Task 3. ✅
- Static skeleton, no flicker, aligned offsets → Task 4. ✅
- Filter-modal gate preserved → Task 2 (`filterEnabledRef`). ✅
- Deletions (functions, listener, SearchIcon, dead CSS) → Task 1 + verified Task 4 Step 3. ✅
- `overflow-x: clip` sticky mitigation → Task 1 Step 4, validated Task 4 Step 5. ✅
- No new store slice; no tests added → honored (local state; manual validation). ✅

**Placeholder scan:** No TBD/TODO; every code step shows full code; every verify step shows the command + expected result.

**Type consistency:** `ListingHeaderCollapse` props (`filterBar`, `banner`, `categoryFilters`, `isRtl`) are defined in Task 2 Step 1 and consumed with those exact names in Task 2 Step 3. `BoutiqueMiniLogo` takes `boutiquePromise` (Task 3 Step 1) and is passed `boutiquePromise` (Task 3 Step 2). `PIN_STACK_PX` (148) matches `--listing-navbar-h` (98) + bar (50).

## Rollback

Each task is one commit on `ticket/listing-refactor`. Revert the relevant commit(s) to restore `expandView`/`normalizeView`, the `CartProvider` listener, and the old CSS.
