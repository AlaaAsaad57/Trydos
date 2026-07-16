---
ticket: add-arrows-for-main-categories-bar
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-06-20
links:
  clickup:
  github:
---

# Review — add-arrows-for-main-categories-bar

> Review gate. The reviewer evaluates the spec and plan before any implementation.

## Review Scope

Reviewed `spec.md` (FR-1..FR-8, NFR-1..NFR-5, AC-1..AC-10) and `plan.md`
(approach, steps, files to change, validation, rollback) for the categories-bar
scroll-affordance feature. Separation of duties: the plan/spec were authored by
the ai_agent; this gate is recorded by a distinct human reviewer (RA-3 satisfied;
`allow_self_review.standard` is false).

## Plan Summary

Add edge scroll affordances (gradient fade + circular arrow button) to the main
categories bar by wrapping — not modifying — the shared `HortiznalScrollBar`
inside `components/Server/Navbar.tsx`. Visibility is driven by `canScrollLeft` /
`canScrollRight` state computed from the scroller's geometry in a `useEffect`
(scroll + `ResizeObserver` + deferred timer), branching on `isRtl` for RTL
correctness. Arrows smooth-scroll by a partial amount on click. The change is
confined to one file.

## Risks

- RTL scroll-origin differences across browsers — addressed by the `isRtl` branch
  in the scroll-state computation (AC-7).
- Sub-pixel overflow flicker — addressed by the ~1px tolerance in the plan.
- Touching the shared `HortiznalScrollBar` would have wide blast radius — plan
  explicitly leaves it untouched (NFR-1/AC-10).

## Assumptions

- Only one categories bar (`#categories-bar-container`) renders per page, so the
  fixed element id lookup is safe.
- Static English `aria-label`s are acceptable, consistent with existing repo
  convention (OQ-1 resolved); no translation files change.
- Arrows shown wherever overflow exists, regardless of device (OQ-2 resolved).

## Open Questions

- None blocking. OQ-1 and OQ-2 from the spec are resolved in the plan; remaining
  styling details (arrow size, fade width, scroll step) are implementation polish
  to confirm visually at `/verify`.

## Decision

`APPROVED`

- Rationale: Plan is sound and well-scoped — a single-file change to
  `components/Server/Navbar.tsx` that wraps (does not modify) the shared
  `HortiznalScrollBar`, keeping blast radius to the categories bar. All acceptance
  criteria AC-1..AC-10 are traceable to plan steps, RTL and edge cases are
  addressed, rollback is trivial (restore one file), and the `standard-frontend`
  validation profile is appropriate.

## Approvals

> `standard` requires 1 approver. `high_risk` requires 2.

- Approver 1 (reviewer): human reviewer (gate invoker)
- Approver 2 (high_risk only): n/a

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: none

## Required Follow-up Actions

- none
