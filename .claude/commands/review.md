---
description: Review gate — validate plan.md, record APPROVED/CHANGES_REQUESTED/REJECTED, and advance to approved only when APPROVED. No branches, no implementation. Atomic on failure.
argument-hint: <slug> <APPROVED|CHANGES_REQUESTED|REJECTED> "<rationale>"
allowed-tools: Read, Grep, Glob, Write
---

# /review

The review gate for ticket `<slug>`. Validate the plan, record the decision in
`_specs/<slug>/review.md`, and **only when APPROVED** advance the ticket
`spec-complete → plan-complete → approved`.

**This command does NOT create a branch and does NOT implement anything.**

**Atomic:** validate first. If a required check fails, write **nothing** —
neither `review.md` nor `ticket.md`.

Authoritative references (apply, do not reinvent):
- Command contract: `.claude/docs/command-architecture.md` (`/review`)
- **Validation: `.claude/rules/validation-model.md` — apply rule codes only; no
  custom validation logic.**
- Modes/approvals: `.claude/project-config.yaml > modes`. State ownership: ADR-003.

## Inputs

- `slug` (required) — workspace `_specs/<slug>/`.
- `decision` (required) — `APPROVED | CHANGES_REQUESTED | REJECTED` (RV-2).
- `rationale` (required) — reason for the decision.
- For `high_risk` + `APPROVED`: two approver names + an ADR reference.
If any required input is missing, ask once.

## Step 1 — Validate (abort on required-validation failure, writing nothing — RV-8)

Read `_specs/<slug>/ticket.md`, `spec.md`, `plan.md`, then apply:
- **RA-1 / RA-3** — the invoker must be the `reviewer` role, and (separation of duties)
  must **not** be the author of `plan.md`/`spec.md` under review — **unless** this is
  a `standard` ticket and `separation_of_duties.allow_self_review.standard: true`.
  Otherwise abort.
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists, valid; read current `state` here.
- **CMD-1 / ST-2** — `state` must be `spec-complete`. Otherwise abort.
- **RV-2** — decision is one of the three allowed values.
- For **APPROVED** only:
  - **RV-3** — `plan.md` exists and satisfies **PL-1..PL-5** with plan↔REQ/AC
    traceability. Otherwise abort.
  - **RV-5 / RV-6** — if `ticket.md > mode` is `high_risk`: two approvers AND an
    ADR reference must be supplied; otherwise abort.

If a required check fails, stop and report the rule code + message. **Make no writes.**

## Step 2 — Write review.md (RV-1)

Read `_specs/_templates/review.md` and write `_specs/<slug>/review.md`:
- Front-matter: `ticket: <slug>`, `stage: review`, `mode: <ticket.md mode>`,
  `status: complete`, `owner: reviewer`, `updated: <today YYYY-MM-DD>`, `links`.
- Fill: Review Scope, Plan Summary, Risks, Assumptions, Open Questions,
  **Decision** (the chosen value + rationale), **Approvals** (Approver 1 = reviewer;
  Approver 2 for `high_risk`), **ADR reference** (required for `high_risk`,
  else `none`), Required Follow-up Actions.

## Step 3 — Apply the decision

**If APPROVED** — update `_specs/<slug>/ticket.md` (TS-4 / RV-4):
- `state: approved`, `updated_at: <today>`.
- Append two state-history entries:
  ```yaml
  - state: plan-complete
    event: plan-validated
    by: reviewer
    timestamp: <today>
  - state: approved
    event: plan-approved
    by: reviewer
    timestamp: <today>
  ```

**If CHANGES_REQUESTED** (RV-7) — do **not** advance to `approved`. Keep
`ticket.md > state` at `spec-complete`. Optionally set `status: blocked` if the
follow-up requires it. (No state-history transition entry.)

**If REJECTED** (RV-7 / RV-10) — do **not** advance to `approved`. Document
rejection reasons in `review.md`, then update `_specs/<slug>/ticket.md` (TS-4):
- `state: closed` (terminal), `updated_at: <today>`.
- Append one state-history entry:
  ```yaml
  - state: closed
    event: plan-rejected
    by: reviewer
    timestamp: <today>
  ```
This closes the ticket without a `/close` command. `closed` is terminal — to
revisit the work, open a new ticket.

## Postconditions — validate AFTER writing

- **RV-1** `review.md` written. **RV-2** decision valid.
- APPROVED: **RV-3** plan validated · **RV-4 / TS-4** `state = approved` with
  `plan-validated` + `plan-approved` history · **RV-5/RV-6** high_risk approvals
  + ADR recorded · **CMD-2** state = `approved`.
- CHANGES_REQUESTED: **RV-7** state still `spec-complete`.
- REJECTED: **RV-7 / RV-10** state `spec-complete → closed` (terminal) with
  `plan-rejected` history; reasons documented in `review.md`.
- **RV-9** no branch created; nothing implemented.
- **FM-1..FM-8** `review.md` front-matter valid; **GU-1 / GU-3** writes confined
  to `review.md` (+ `ticket.md` on APPROVED or REJECTED).

## MUST NOT

- Do **not** advance to `approved` for CHANGES_REQUESTED or REJECTED (RV-7).
- Do **not** create a git branch (RV-9 / GU-4) or perform any implementation.
- Do **not** approve `high_risk` without two approvers + ADR reference (RV-5/RV-6).
- Do **not** modify source code or any protected runtime path.
- Do **not** perform a partial write: if Step 1 fails, nothing is written (RV-8).

## Report

State the decision recorded, the resulting `ticket.md` state + history, and the
next step:
- APPROVED → `approved`; next: `/implement` (which creates the branch).
- CHANGES_REQUESTED → stays `spec-complete`; next: revise via `/plan` (revision
  mode) → `/review`.
- REJECTED → `closed` (terminal); the ticket is done — open a new ticket to
  revisit.

## Next step (NS-1..NS-4)

Emit the next-step block (`command-architecture.md §6`) for the recorded decision:

- **APPROVED:**
  - **Current state:** `approved`
  - **Next command:** `/implement <slug>` (the author; creates the branch)
  - **Required actions:** none
  - **Optional actions:** none
  - **Terminal?** no
- **CHANGES_REQUESTED:**
  - **Current state:** `spec-complete` (`status: blocked` if set)
  - **Next command:** `/plan <slug>` (revision), then `/review <slug>` again
  - **Required actions (NS-3):** address the `Required Follow-up Actions` in
    `review.md` via a `/plan` revision before re-review.
  - **Optional actions:** none
  - **Terminal?** no
- **REJECTED (terminal; NS-4):**
  - **Current state:** `closed`
  - **Next command:** none — `closed` is terminal.
  - **Required actions:** none — open a new ticket to revisit the work.
  - **Optional actions:** none
  - **Terminal?** yes — no further workflow action is required.
