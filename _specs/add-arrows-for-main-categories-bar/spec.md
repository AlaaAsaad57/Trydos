---
ticket: add-arrows-for-main-categories-bar
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Spec — add-arrows-for-main-categories-bar

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Scroll-affordance arrows for the main categories bar.

## Business Goal

The main categories bar scrolls horizontally, but on many viewports the overflow
is not discoverable — users cannot tell that more categories exist past the
visible edge, so those categories go unseen and unclicked. Adding clear edge
affordances (directional arrows plus a fade cue) signals that the bar is
scrollable and lets users reach the hidden categories, improving category
discovery and navigation.

## User Story

> As a shopper browsing the storefront, I want a clear visual cue on the main
> categories bar that more categories exist off-screen — and a way to move toward
> them — so that I can discover and reach every category, not just the ones that
> happen to fit on screen.

## Functional Requirements

- **FR-1 — Overflow indication.** When the categories bar content is wider than
  its visible area, the user is shown a directional affordance on each side that
  has more content to reveal.
- **FR-2 — Conditional visibility.** A side's affordance is shown only when there
  is more content to scroll toward on that side. When the bar fits without
  overflow, no affordance is shown on either side.
- **FR-3 — Edge awareness.** As the user reaches the start of the scroll range,
  the leading-side affordance disappears; as they reach the end, the
  trailing-side affordance disappears.
- **FR-4 — Click to scroll.** Activating a visible affordance scrolls the bar
  toward that side by a partial (less-than-full-width) amount, with smooth
  motion, revealing more categories.
- **FR-5 — Reactivity.** Affordance visibility updates in response to user
  scrolling (drag/swipe/wheel or affordance activation) and to viewport/container
  size changes.
- **FR-6 — RTL correctness.** In right-to-left locales (`ar`, `ku`) the
  affordances are positioned and directed in mirror image of LTR, and activating
  one scrolls in the correct (locale-appropriate) direction.
- **FR-7 — Visual cue.** Each visible affordance is accompanied by a fade /
  gradient at that edge as an additional "more content" signal.
- **FR-8 — Accessibility of controls.** Each interactive affordance exposes an
  accessible name describing its action; when an affordance is hidden it is not
  keyboard-focusable nor announced to assistive technology.

## Non-Functional Requirements

- **NFR-1 — Scope isolation.** The change affects only the main categories bar;
  no other horizontal scroller or shared component behavior in the app changes.
- **NFR-2 — Usability.** Affordances do not obscure or block interaction with the
  category items beneath/around them; category chips remain fully clickable.
- **NFR-3 — Performance.** Scroll/resize tracking is lightweight and must not
  cause visible jank or layout thrash while scrolling.
- **NFR-4 — Consistency.** Styling fits the storefront's existing design language
  and responsive breakpoints.
- **NFR-5 — No regressions.** Existing categories-bar behavior — drag-to-scroll,
  category ordering (active category first), and navigation on chip click —
  continues to work unchanged.

## Constraints

- No backend, data, or API changes; categories data and its fetch are unchanged.
- No modification of protected runtime paths (the work stays `mode: standard`).
- Must support all four locales (`en`, `ar`, `tr`, `ku`), including the two RTL
  locales.
- Must respect the project's responsive breakpoint conventions rather than ad-hoc
  pixel values.

## Edge Cases

- **No overflow** (few categories / wide viewport): no affordances at all.
- **At the leading edge:** only the trailing-side affordance may show.
- **At the trailing edge:** only the leading-side affordance may show.
- **Exactly-fits / off-by-one-pixel:** sub-pixel overflow must not flicker an
  affordance on and off.
- **Late content / async sizing:** categories arrive/relayout after first paint;
  affordance state must settle correctly once final width is known.
- **Viewport resize / orientation change:** affordance state recomputes.
- **RTL scroll-origin differences** across browsers must not break edge detection.

## Open Questions

- **OQ-1 (a11y/i18n):** Should the affordances' accessible names be localized via
  the translation system, or are the controls decorative duplicates of the
  already-available drag/swipe scroll (and thus hidden from assistive tech)?
  Decision affects AC-8.
- **OQ-2 (device scope):** Should affordances be shown on touch/mobile viewports
  (where swipe scrolling is natural and a scrollbar is hidden) or only on
  pointer/desktop? Default assumed below: shown wherever overflow exists,
  regardless of device. To be confirmed at `/plan`/design.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID   | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | When the categories bar does not overflow its visible area, no scroll affordance is shown on either side. | FR-2 |
| AC-2 | When the bar overflows and the user is not at the leading edge, a leading-side arrow affordance is visible. | FR-1, FR-2 |
| AC-3 | When the bar overflows and the user is not at the trailing edge, a trailing-side arrow affordance is visible. | FR-1, FR-2 |
| AC-4 | At the start of the scroll range the leading affordance is hidden; at the end of the scroll range the trailing affordance is hidden. | FR-3 |
| AC-5 | Activating a visible affordance scrolls the bar toward that side by a partial amount with smooth motion, revealing more categories. | FR-4 |
| AC-6 | Affordance visibility updates correctly after the user scrolls (drag/swipe/wheel or affordance activation) and after a viewport/container resize. | FR-5 |
| AC-7 | In `ar` and `ku` (RTL), the affordances are mirrored in position and direction, and activating one scrolls in the correct direction. | FR-6 |
| AC-8 | Each visible affordance is accompanied by an edge fade/gradient cue. | FR-7 |
| AC-9 | Each interactive affordance exposes an accessible name; a hidden affordance is neither keyboard-focusable nor announced to assistive technology. | FR-8 |
| AC-10 | Category items remain fully clickable and unobscured; category ordering, drag-to-scroll, and chip navigation are unchanged, and no other horizontal scroller in the app is affected. | NFR-1, NFR-2, NFR-5 |

## Out of Scope

- Changing which categories are shown, their order, labels, icons, or links.
- Any change to the data fetch or backend for categories.
- Applying arrow affordances to other horizontal scrollers in the app (e.g.
  product rows, filters) — only the main categories bar is in scope.
- The separate mobile category navigation component, except insofar as the
  categories rendered inside the bar must keep working.
- Redesigning the categories bar's overall layout or the category chips.
