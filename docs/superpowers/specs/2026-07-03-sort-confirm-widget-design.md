# Sort widget: select-then-confirm — Design

**Date:** 2026-07-03
**Branch:** `ticket/listing-refactor`
**Scope:** `components/Listing/ListingSortControl.tsx` (single file)

## Problem

The listing sort bottom sheet applies a sort the instant an option is tapped
(`applySort` → `router.push` → sheet closes). This diverges from the filter
widget, where the user edits a pending selection and then commits it with a
primary **Search** button (with an outline **Reset**), after which the product
grid shows skeletons while it reloads.

We want the sort sheet to follow the same select-then-confirm pattern, and to
show the product-card skeletons immediately on confirm.

## Behavior

Convert the sort sheet from *apply-on-tap* to *select-then-confirm*:

1. **Pending selection.** Add local `pending: SortKey` state. When the sheet
   opens, initialize `pending` from the applied URL sort (`active`). Tapping any
   `SingleRow` / `DirectionalRow` option sets `pending` only — it highlights the
   choice and the sheet **stays open**; no navigation happens.

2. **Fixed footer** — sticky at the bottom of the sheet (white background,
   hairline top border; the options list gets bottom padding so nothing hides
   behind it). Always visible, two buttons:
   - **Clear** — outline (neutral grey border/text, white fill). Resets
     `pending` back to `Recommended`/relevance. Does **not** navigate.
     Disabled / muted when `pending` is already `relevance`.
   - **Confirm** — primary filled `#FF6464` (the sort widget's established
     accent). Applies `pending`: `router.push` with the new `?sort=` (or removes
     it for relevance) and closes the sheet. Disabled / muted when
     `pending === active` (nothing to apply).

3. **Skeleton on confirm.** The `router.push` changes `?sort=`; `SortableGrid`
   (unchanged) sees the changed param and swaps to `ProductsInfiniteScroll` with
   `firstPageSkeleton`, so product-card skeletons appear immediately — exactly
   like the filter widget's Search.

## Implementation notes

- The existing `applySort` param logic (no-op when unchanged, delete-vs-set the
  `sort` param, `router.push`) is reused inside **Confirm**. The per-row
  `onSelect` handlers are rewired to `setPending` instead of applying.
- Footer button styling parallels `FiltersButton` (rounded, filled primary +
  outline secondary) but keeps the sort widget's `#FF6464` palette instead of
  the filter widget's red/blue, so the sheet stays internally consistent.
- The trigger button's active-dot badge and a11y label continue to derive from
  the **applied** URL sort (`active`), never `pending`, so the bar reflects what
  is actually applied.
- RTL: the footer respects `isRtl` row direction like the rest of the sheet.

## Out of scope

- `SortableGrid`, `ProductsInfiniteScroll`, and the server page are unchanged.
- No change to the sort key vocabulary or backend behavior.
- No new PostHog events.

## Validation

No test suite (project policy). Verify by `pnpm build` / type-check and manual
UX check: open sort → pick option (sheet stays open, no reload) → Confirm →
product skeletons appear and grid re-sorts; Clear resets the pending pick to
Recommended without navigating; both buttons gate correctly.
