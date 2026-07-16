---
ticket: fix-settings-button
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-06-20
links:
  clickup: https://app.clickup.com/t/86ey0f0d2
  github:
---

# Review — fix-settings-button

> Reviewer gate. Evaluates the spec and plan before any implementation begins.

## Review Scope

- `_specs/fix-settings-button/spec.md` — feature name, business goal, user story, functional and non-functional requirements, constraints, edge cases, and 5 acceptance criteria (AC-1..AC-5).
- `_specs/fix-settings-button/plan.md` — approach, steps, files to change, validation strategy, rollback, and out of scope.
- Supporting research in `_specs/fix-settings-button/research.md`.

## Plan Summary

The `MenuItem` component in the dropdown Menu uses `pathname.includes(href)` to decide whether to render a navigable link or a plain div. Because this is a substring match, being on `/settings/orders` (or any `/settings/*` sub-path) causes the Settings item to silently degrade to a non-navigating div. The plan corrects this by replacing the substring check with an exact equality check (`pathname === href`), so navigation is suppressed only when the buyer is already on the exact target page. The change is confined to a single expression in one file (`components/Home/Menu.tsx`) and carries no risk to protected paths, auth, or data.

## Risks

- Minimal. The change is a one-expression guard fix in a UI-only component with no API surface, no store mutations, and no protected-path involvement.
- The `Compare` menu item shares the same guard pattern; it remains unaffected (out of scope) and is unchanged.

## Assumptions

- `usePathname()` from Next.js returns the full locale-prefixed path (e.g. `/gb-en/settings`), which matches the `href` value passed to `MenuItem`. Confirmed by code inspection in `Menu.tsx`.
- No other callers of `MenuItem` pass an `href` that would behave incorrectly under exact-match semantics.

## Open Questions

- None. Root cause, fix site, and expected behaviour are all confirmed.

## Decision

`APPROVED`

- Rationale: The plan is minimal, correct, and precisely scoped. A single expression change fixes the reported bug without touching any unrelated logic or protected path. Spec AC traceability is complete (AC-1..AC-5 map to FR-1..FR-5). The `standard-frontend` validation profile (typecheck + lint) plus a manual smoke test on the two affected pages is proportionate to the change size. Rollback is trivial. No concerns.

## Approvals

> `standard` requires 1 approver.

- Approver 1 (reviewer): Alaa Asaad (human reviewer)
- Approver 2 (high_risk only): n/a

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: none

## Required Follow-up Actions

- none
