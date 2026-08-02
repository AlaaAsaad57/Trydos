---
ticket: boutique-availability-select
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Review — boutique-availability-select

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (8 ACs) and `plan.md` (approach, 5 steps, 6 files, `full-build`
validation profile, rollback), against the boutique-editor code
(`components/SellerDashboard/boutiqueEdit/*`) and the API contract
(`shop-seller-product-boutique-apis.md` §4).

## Plan Summary

Extend the existing boutique form model: `availability` joins `BoutiqueForm`,
`availabilities` joins `BoutiqueLookups`, hydrated from the two fetches the
editor already performs (edit → `lookups.availabilities`; create → lookups
`data`). A new `AvailabilitySection` renders right after the global-info header
card. Labels are local translations keyed by option value (3 reuses the
existing "Web + Mobile"). `FIXED_AVAILABILITY` becomes `DEFAULT_AVAILABILITY`
(create default + invalid-value fallback), and the save payload carries the
user's pick in the existing `availability` key. No new requests, no new
validation rule (valid by construction).

## Risks

- Lookup key name on the create endpoint assumed to match the edit lookups
  (`availabilities`); mitigated by the three-option fallback (EC-1).
- New backend availability values (beyond 1/2/3) would be filtered out /
  reset to default — accepted; only 1/2/3 exist per the API contract.

## Assumptions

- Backend continues to validate `availability` server-side (per contract §4,
  required integer).
- `"Web + Mobile"` keys in ar/tr/ku are correct translations to reuse.

## Open Questions

- none

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | Widget ambiguous: plan step 2 offers "Segmented-style or `<select>`"; IM-2 needs an unambiguous plan | plan step 2 / FR-1 | **Accept — pinned: plain `<select>` with `dashInputClass`** (simplest, matches spec wording) |
| senior | minor | `"Web"` already exists in `translations.tr.js` — adding it again would create a duplicate key | plan step 4 / AC-8 | **Accept — pinned: add each key only to the files where it is missing**, keeping the three files key-parallel |
| senior | minor | EC-2 drift: hydration whitelist is the hardcoded 1/2/3, not the lookup list — a hypothetical new backend option would be reset to 3 | plan step 1 / EC-2 | **Dismiss (deliberate hardcode)** — only 1/2/3 exist per the API contract; keeping it simple per owner instruction |
| senior + security | minor/info | Unknown lookup values: label fallback would render a raw backend label (EC-3) and an out-of-range option would be submitted unvalidated | plan step 2 / EC-3, AC-2 | **Mitigate — pinned: render only options whose `value` is in `AVAILABILITY_LABEL_KEYS`** (one-line filter; kills both issues, no extra machinery) |
| security | info | No protected paths, no secrets, no new endpoints; blast radius = boutique create/edit; rollback is a single frontend revert | Files to change / config | Accept — proceed |
| performance | info | No material concerns: zero new requests, bounded 3-option work, negligible bundle impact | plan / NFR-3 | Accept — proceed |

## Decision

`APPROVED`

- Rationale: Owner: "don't over-engineer — it's a simple task." The plan is
  minimal and fully traceable to AC-1..AC-8; panel raised only minor items,
  resolved by three pinned clarifications (plain `<select>`; add translation
  keys only where missing; whitelist-filter options to known values) that
  simplify rather than expand the plan. Comprehension check passed 3/3.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (self-review, comprehension 3/3 — 2026-07-19)

## ADR reference

- ADR: none

## Required Follow-up Actions

- none — the three pinned clarifications above are bindings on `/implement`,
  not plan changes (they narrow choices already inside the approved plan's
  scope).
