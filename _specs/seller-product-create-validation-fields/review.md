---
ticket: seller-product-create-validation-fields
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-07-18
links:
  clickup:
  github:
---

# Review — seller-product-create-validation-fields

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

**Review 2** — re-review of `plan.md` revision 2, which was written to address the
ten follow-up actions from review 1 (`CHANGES_REQUESTED`, same date). This review
supersedes review 1; its findings and disposition are recorded below.

## Review Scope

`spec.md` (10 acceptance criteria) and `plan.md` **revision 2**, plus a
re-dispatch of all three advisory lenses against the revised plan, each
explicitly tasked with verifying that the ten follow-ups were genuinely addressed
rather than merely claimed. Two contested panel claims were independently
verified against the repository before disposition (see below).

## Plan Summary

Fix all three rejected fields at their shared source rather than special-casing
creation: the payload builder gains an always-present `default_language_code`
(from a literal-typed `DEFAULT_LANGUAGE_CODE` constant) and switches the two
boolean flags from enable-token/omit to explicit `true`/`false`; form validation
gains a brand-required check surfaced through the existing `Select` props. One
builder feeds both endpoints, so creation and editing are fixed together. Six
files change; no component work is required.

## Verification of contested panel claims

Two lenses asserted findings that conflicted with the owner's own observations.
Both were checked directly rather than accepted or dismissed on authority:

- **Protected-paths citation — panel correct, plan wrong.** `plan.md` claimed
  `protected_paths` "contains exactly one entry, `observability: false`". Direct
  read of `.claude/project-config.yaml` shows `protected_paths:` at line 109
  listing **ten globs** (`proxy.ts`, `serverRequests/**`, `utils/cookies/**`,
  `app/api/auth/**`, `services/auth.ts`, `services/cart.ts`, `services/order.ts`,
  `services/orders.ts`, `store/index.ts`, `next.config.ts`); `observability:
  false` is a `features:` key at line 179. The plan's citation is **false**. The
  *conclusion* survives — none of the six planned files matches any of the ten
  globs — but the stated evidence does not.
- **Working tree — panel wrong, plan correct.** Two lenses claimed the tree was
  dirty and that commit `5d0899e3` did not exist. Live `git status` / `git log`
  show `HEAD` at `5d0899e3`, no modified tracked files, and `develop` in sync with
  `origin/develop`. The lenses were reading the stale session-start snapshot. The
  plan's "follow-up 5 resolved" claim is accurate; the finding is dismissed on
  evidence.

## Risks

- The residual backend truthiness defect: if `false` is read as truthy on the
  update path, a flag a seller switches off is stored as on — a silent,
  data-affecting wrong-state write on the path every existing seller uses.
  Detected by `AC-8`.
- Blast radius: the shared builder means the encoding change reaches every
  existing seller's edit path, not only the blocked create path.
- `AC-7` rests on an unverified assumption — that the server accepts the
  multipart strings `"true"` / `"false"`. Knowingly carried into implementation.
- The plan carries a **known-false protected-paths citation** into
  `/implement` and `/verify`. Accepted by the owner; correction deferred.
- `plan.md` step 2 (the encoding probe) is **unexecutable as ordered**: create is
  currently rejected on all three fields, so a probe create cannot isolate whether
  the boolean spelling is accepted. It must run against the update endpoint on an
  existing product, or explicitly read the per-field error list.
- The captured live-seller-data file is relocated **into** `_specs/<slug>/`, which
  `/publish-pr` stages wholesale (PB-9). The `.gitignore` entry is the only thing
  preventing it reaching a public PR.
- Client brand validation confers no security property; `brand_id` /
  `boutique_id` scoping is unconfirmed.

## Assumptions

- The backend accepts boolean values as their string spelling in a multipart
  body. **Unverified** — to be settled by the probe at implementation.
- `brand_id` and `boutique_id` are authorization-scoped server-side to the
  authenticated seller. **Unverified** — deferred to `/verify`.
- `CoreSection` is visible at submit time, or the toast is sufficient
  discoverability. **Unverified.**
- None of the six planned files matches a protected path. **Verified true**, by
  direct read, despite the plan's incorrect citation.

## Open Questions

- Is the truthy-string defect live on the update path? (Detected by `AC-8`.)
- Does the server accept `"true"` / `"false"`, or require `1` / `0`?
- Are `brand_id` / `boutique_id` authorization-scoped to the caller?

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior + security | major | Follow-up 7's evidence is itself false: `protected_paths` lists ten globs at `project-config.yaml:109-119`, not `observability: false` (a `features:` key at line 179). A third false claim, in the section the prior review asked to evidence. | plan "Protected-path impact" | **Accept, deferred.** Independently verified as correct — the citation is false, the conclusion is not. Owner approves regardless; the citation is to be corrected during implementation and the correction recorded in `implement.md`. |
| senior + security | major | Follow-up 5's "working tree resolved" claim contradicted by git state; `ProductEditor.tsx` still modified and not in Files to change. | plan "Working tree — resolved" | **Dismiss on evidence.** Independently verified false: `HEAD` = `5d0899e3`, no modified tracked files, `develop` in sync. Both lenses read the stale session-start snapshot. |
| senior | major | Follow-up 6 openly not done — `AC-7` still rests on an assumption, the condition the prior review asked to remove. | plan "Status of follow-up 6"; `AC-7` | **Accept, knowingly.** The plan states it plainly rather than hiding it. Owner accepts entering `/implement` with `AC-7` unverified; the probe runs before the encoding change is written. |
| senior | major | Step 2 is unexecutable as ordered: create currently fails on all three fields, so a probe create cannot isolate the `multiplyQTY` result. | plan steps 2 → 6 | **Accept, mitigate at implement.** A genuine logic hole. The probe must target the update endpoint on an existing product, or read the per-field error list. To be corrected in `implement.md`. |
| senior + security + performance | major/minor | Relocating the live-seller-data capture into `_specs/<slug>/` places it in the one directory `/publish-pr` stages wholesale (PB-9); a bare-filename ignore is the only guard. | plan step 1; Files to change (`.gitignore`) | **Accept, mitigate at implement.** Three lenses converged. Keep the capture out of `_specs/` (scratchpad), or strip it before publish; verify the ignore pattern holds in the new location. |
| security | minor | The probe writes a real product to a live backend under a real seller token, with no cleanup or non-prod target named. | plan step 2 | **Accept.** Name a non-prod target where available and delete the throwaway product; record at `/verify`. |
| senior | minor | Rollback still calls the change "additive edits to six files"; step 6 rewrites existing behaviour on the shared edit path, contradicting the plan's own blast-radius paragraph. | plan Rollback bullet 1 vs "Blast radius" | **Accept.** Wording defect; reword to "modifying edits" during implementation. |
| senior | minor | A ticket-specific filename in repo-root `.gitignore` is permanent churn for a temporary artifact. | plan Files to change (`.gitignore`) | **Mitigate.** Prefer deleting the capture over a permanent ignore entry; if kept, add a commented general pattern. |
| security | info | Follow-up 3 addressed — `DEFAULT_LANGUAGE_CODE` named, literal-typed, locality justified so a request-scoped user value cannot reach a payload contract. | plan Approach bullet 1; step 4 | **Dismiss** — no action. |
| security | info | Follow-up 10 addressed and correctly scoped — brand check stated as UX only, scoping deferred to `/verify`. | plan "Authorization is out of this ticket's reach" | **Dismiss** — no action, but `/verify` must capture the backend team's actual answer, not restate the question. |
| security | info | Follow-up 8 addressed; publicly-served nature of `public/translations/*.js` stated with the correct constraint. | plan "Blast radius"; "Protected-path impact" | **Dismiss** — no action. |
| security | info | Revision 2 introduces no new attack surface: no endpoints, ports, permissions, secrets, or untrusted-input parsing. | plan steps 4–8 | **Dismiss** — no action. |
| senior | info | Follow-ups 1, 2, 3, 8, 9, 10 are substantively addressed, not cosmetic — the partial-rollback claim is retracted with the correct fallback, the E-3 over-claim is softened, the constant is named and justified. | plan Approach / Rollback / Validation strategy | **Dismiss** — no action. |
| senior | info | AC coverage complete: AC-1→step 5, AC-2→steps 7–8, AC-3→step 3, AC-4/5→step 6, AC-6→shared builder, AC-7/8/10→manual, AC-9→profile. No orphaned AC; scope minimal. | plan Steps vs spec AC table | **Dismiss** — satisfies RV-3 traceability. |
| performance | info | No material performance concerns; code-level changes identical to revision 1, all on submit-time paths. `DEFAULT_LANGUAGE_CODE` is a compile-time literal that removes a duplicated literal. | plan steps 3–8 | **Dismiss** — no action. |
| performance | info | Pre-existing whole-object `errors` replacement re-renders every section on failed submit; correctly parked in Out of scope and not worsened. | plan Out of scope | **Dismiss** — no action. |

**Panel did not gate this decision (RP-2).** The senior lens's explicit verdict
was "not yet sound enough to implement". The owner weighed it and approved
regardless, which the advisory model permits. That disagreement is recorded here
deliberately rather than smoothed over.

## Decision

`APPROVED`

- Rationale: **unblock creation urgently.** Product creation is fully blocked for
  sellers — the dashboard's core function is unavailable — and shipping the fix
  outweighs another round of plan-document iteration. The approach is sound and
  was never contested by any lens; AC coverage is complete; and the one factual
  defect (the protected-paths citation) has a conclusion that was independently
  verified as correct, so no planned file touches a protected path in fact.
- **Recorded against this decision:** the plan enters implementation carrying a
  known-false citation, an unexecutable probe step, an unverified `AC-7`, and an
  unresolved publish-staging exposure. Each is listed under Required Follow-up
  Actions to be corrected during implementation and recorded as a deviation in
  `implement.md` (IM-6). This is a deliberate trade of document accuracy for
  delivery speed, not an oversight.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): `developer` (self-review, ADR-011), 2026-07-18. Comprehension
  gate passed 3/3 (100%, CG-4) — see `comprehension.md` § Review gate.

## ADR reference

- ADR: none

## Required Follow-up Actions

These do **not** block implementation (the plan is approved), but each must be
carried out during `/implement` and recorded as a deviation in `implement.md`:

1. **Correct the protected-paths citation** — quote the ten globs at
   `project-config.yaml:109-119` and re-derive that none of the six planned files
   matches.
2. **Reorder the encoding probe** so it can actually produce an answer: run it
   against the update endpoint on an existing product, or state that it reads the
   per-field error list to isolate `multiplyQTY`.
3. **Keep the captured payload out of `_specs/`** — use the scratchpad, since
   `/publish-pr` stages `_specs/<slug>/` wholesale (PB-9); verify the ignore
   pattern holds wherever it lands.
4. **Add probe teardown** — name a non-prod target where available and delete the
   throwaway product.
5. **Reword Rollback bullet 1** — "modifying edits", not "additive edits".
6. **Record the probe's observed result** so `AC-7` rests on an observation by the
   time `/verify` runs.
7. **Confirm `brand_id` / `boutique_id` authorization scoping** with the backend
   team and record the actual answer at `/verify`.
