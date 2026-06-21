---
ticket: add-arrows-for-main-categories-bar
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Implement — add-arrows-for-main-categories-bar

> Record of what was actually built, following `plan.md`.

## Changes made

- `components/Server/Navbar.tsx` — added the scroll-affordance arrows to the main
  categories bar, exactly as planned (the only file changed):
  - Imported `useEffect` alongside the existing `useState`.
  - Added `canScrollLeft` / `canScrollRight` state.
  - Added a `useEffect` that locates `#categories-bar-container`, computes the two
    flags from `scrollLeft` / `scrollWidth` / `clientWidth` with a ~1px tolerance
    (avoids sub-pixel flicker), branching on `isRtl` for RTL scroll-origin
    differences. It runs once, on the container `scroll` event, on a
    `ResizeObserver`, and on a 300ms deferred timer (late layout); all three are
    cleaned up on unmount. Deps: `[categoriesData, isRtl]`.
  - Added a `scrollByAmount(amount)` helper that smooth-scrolls the container.
  - Wrapped the existing `HortiznalScrollBar` in a `relative flex-1 min-w-0`
    container and added two absolutely-positioned edge overlays (leading +
    trailing): each a gradient fade plus a circular arrow `<button>` with the
    correct chevron, opacity bound to its `canScroll*` flag, `pointer-events` and
    `tabIndex` disabled (and `aria-hidden`) when hidden, and a static English
    `aria-label` ("Scroll categories left/right").
  - Left untouched: `handleWrapperClick`, the `HortiznalScrollBar` props
    (`id`, classes, `dataCy`), category ordering, and `enable_search` handling.

The shared `components/global/HortiznalScrollBar.tsx` was **not** modified, per
plan (30+ consumers; NFR-1/AC-10).

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `components/Server/Navbar.tsx` — modified (working-tree edit on branch
  `ticket/add-arrows-for-main-categories-bar`).
- `_specs/add-arrows-for-main-categories-bar/*` — workflow artifacts (this
  ticket's workspace), to be staged with the delivery commit.

Pre-existing unrelated working-tree changes (NOT part of this ticket, NOT staged
by this work): `.claude/commands/implement.md`, `.claude/rules/validation-model.md`,
and the `_specs/report-story/` workspace.

## Deviations from plan

- **none** functionally. The plan was followed exactly (single-file change,
  static English `aria-label`s, RTL branch, no touch to the shared primitive).
- Minor: each hidden arrow button additionally sets `aria-hidden={!canScroll*}`
  (in addition to the planned `tabIndex=-1` + disabled pointer-events) to fully
  satisfy AC-9 (hidden affordance not announced to assistive tech). This is within
  the planned FR-8/AC-9 intent, not a scope change.

## Validation run during implementation

- `pnpm exec tsc --noEmit` — **PASS** (exit 0). The change is type-clean.
- `pnpm lint` (profile `standard-frontend` lint check) — **COULD NOT EXECUTE**.
  Root cause: `next lint` was removed in **Next.js 16**, so the repo's `lint`
  script (`next lint`) errors with "Invalid project directory provided ... \lint",
  and a standalone `eslint` binary is not installed. This is a **pre-existing repo
  tooling issue, independent of this change** (no `.js/.ts` source was added that
  could newly fail lint; only `components/Server/Navbar.tsx` changed and it
  typechecks). Flagged for `/verify`: the lint half of `standard-frontend` is not
  runnable in this repo until the lint script is migrated (e.g. to ESLint CLI /
  flat config); typecheck stands as the executable correctness gate.
- Manual visual verification (LTR/RTL, overflow/no-overflow, both edges) is to be
  performed at `/verify` against AC-1..AC-10.
