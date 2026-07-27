---
ticket: unify-delivery-day-calculation
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-26
links:
  clickup:
  github:
---

# Intake — unify-delivery-day-calculation

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`unify-delivery-day-calculation` — no ClickUp task or GitHub issue linked yet.

Prior investigation (read-only, performed before this ticket was opened):
- `starting-settings-contract-diff.md` (repo root) — verified field-by-field diff of the
  `GET /web/home/startingSettings` response between the two backends.
- `tester guide/expected-delivery-date.md` (pre-existing) — documents the intended
  delivery-date behaviour, including the cart "use the MAX, not the sum" rule.

## Ticket Summary

Everywhere the app shows a delivery day count or expected delivery date, the figure must
be the sum of both contributing values — the product's own `shipping_days` **plus** the
platform-wide `shipping_duration_days` from starting-settings. Today that sum is not
applied consistently, and on several surfaces the platform value silently contributes `0`,
so users are shown a shorter delivery estimate than the real one.

Surfaces in scope: the product page, the product-page footer, the add-to-cart sheet
(including its footer), and the cart.

The **core backend's** response shape for starting-settings is the accepted contract; the
gateway is expected to align to it, and this ticket's frontend work is to be written
against that accepted shape.

## Ticket Metadata

- id / slug: `unify-delivery-day-calculation`
- title: Unify expected-delivery-day calculation across the app
- owner: developer
- created: 2026-07-26
- links: none yet (no ClickUp task, no PR)

## User Story

> As a shopper, I want every delivery date and day count in the app to reflect both the
> product's shipping time and the platform's shipping duration, so that the delivery
> estimate I see is the one I actually get — and is the same figure on every screen.

## Acceptance Criteria Presence Check

- Present? **no**
- Notes: the request states the required behaviour (both values always summed, on every
  named surface, against the accepted contract shape) but does not carry testable,
  identified criteria. Acceptance criteria with stable `AC-n` ids are authored at `/spec`,
  which is the stage that owns them (SP-3 / TR-1). The behaviour is specific enough to
  derive them from — no further input is required from the requester.

## Test Cases Presence Check

- Present? **no**
- Notes: this repository has **no automated test suite** by standing policy
  (`CLAUDE.md`, `.github/copilot-instructions.md`) — tests are not to be added. Validation
  is therefore the config-driven profile in `.claude/project-config.yaml`
  (`validation_checks`: `typecheck`, `lint`, `build`) plus manual verification per surface.
  The existing `tester guide/expected-delivery-date.md` supplies the manual scenarios.
  Absence of test cases is the expected state here, not a gap.

## Missing Information

Resolved before this ticket was opened — recorded here so the decisions are not re-litigated:

- **Accepted contract shape** — the core backend's starting-settings response shape is the
  accepted one. The gateway aligns to it. (Owner's decision.)
- **Scope of surfaces** — product page, product-page footer, add-to-cart sheet and its
  footer, and the cart.

Still open — these do **not** block qualification, and are carried into `/research` and
`/spec` as open questions rather than intake blockers:

- Whether the frontend should tolerate **both** response shapes during the transition
  window, or switch to the accepted shape only once the gateway has aligned. This changes
  sequencing and rollback, not the goal.
- Timeline/ownership for the gateway-side alignment, which is a separate backend
  deliverable outside this ticket's repository.

## Readiness Status

`READY`

- Justification: the goal, the affected user-visible surfaces, and the accepted contract
  shape are all stated and unambiguous, and a user story is derivable and recorded. The two
  absent items (acceptance criteria, test cases) are absent **by design** — `AC-n` ids are
  owned by `/spec`, and this repo adds no automated tests by policy. The remaining open
  items concern sequencing rather than intent, so they belong in `/research` / `/spec`, not
  in intake. Nothing further is required from the requester for research to begin.
