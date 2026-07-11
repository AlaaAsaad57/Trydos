---
ticket: migrate-customer-api-to-go
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Review — migrate-customer-api-to-go

> Review gate. The reviewer evaluates the spec and plan before any implementation.

## Review Scope

Reviewed `spec.md` (13 acceptance criteria AC-1..AC-13) and `plan.md` (Initial
entry) for the migration of the four customer operations (`/customer/info`,
`/customer/update-profile`, `/customer/update-name`, `/customer/approve-policies`)
from the legacy Laravel "market" backend to the Go Store Gateway, plus the
supporting `research.md` findings on the routing mechanism. ClickUp task 86ey26atu
is the backend contract of record.

## Plan Summary

Reroute the four operations by adding their paths to the `GO_APIS` allow-list in
`utils/server/tokenManager.ts`. The existing `/api/proxy` + `isFromGoApi` /
`getServerBaseUrl` machinery then switches those `server: "market"` calls to
`NEXT_PUBLIC_GO_BACKEND_URL`, with no caller changes — the same pattern already
used for `/cart/*` and `/checklist`. Single functional change on a non-protected
path; rollback is re-commenting the grouped block.

## Risks

- Response parity is a precondition, not something this change enforces; if a Go
  response diverges from the legacy shape, the profile UI could break silently.
  Accepted: parity is confirmed by the ticket owner and is the backend's
  contractual responsibility (ClickUp 86ey26atu).
- `isFromGoApi` matches by `endsWith`; a future path ending in the same suffix
  could be misrouted. Low likelihood for these four distinctive paths.
- Cross-service token acceptance (Go accepts the injected session credential) is
  external to this repo. Confirmed by the owner (shared auth layer).

## Assumptions

- All four Go operations are deployed and reachable on the target environment(s).
- The Go backend shares the same auth/session layer and accepts the existing
  session credential (no re-login).
- Go responses are byte-compatible with the legacy responses (shape, messages,
  field set, image host).

## Open Questions

- None. All spec open questions were resolved by the ticket owner (2026-07-11)
  and recorded as decisions in `spec.md`.

## Decision

`APPROVED`

- Rationale: The plan is the minimal, correct realization of the spec — a single
  allow-list addition on a non-protected path, reusing the established Go-routing
  pattern, with zero caller edits and an instant, side-effect-free rollback. It
  satisfies PL-1..PL-5 and traces cleanly to the acceptance criteria (allow-list
  → AC-1..AC-5/AC-12; parity precondition → AC-6..AC-9; untouched boundary →
  AC-10/AC-13; commented-block revert → AC-11). Standard mode is justified because
  no protected runtime path is touched. Residual risks are external (backend
  parity / token acceptance) and have been accepted by the owner.

## Approvals

> `standard` requires 1 approver (reviewer). `high_risk` requires 2.

- Approver 1 (reviewer): yasser.omran@ramaaz.com
- Approver 2 (high_risk only): n/a (standard mode)

## ADR reference

> Required for `high_risk`; otherwise "none".

- ADR: none

## Required Follow-up Actions

- none — approved to proceed to `/implement`.
