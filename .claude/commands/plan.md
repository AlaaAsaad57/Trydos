---
description: Check the spec and write plan.md. The first run moves research-complete to spec-complete; you can also re-run it to rewrite the plan after CHANGES_REQUESTED. It does not approve anything and creates no branch. All or nothing on failure.
argument-hint: <slug>
allowed-tools: Read, Grep, Glob, Write
---

# /plan

For ticket `<slug>`: check the spec and write the plan file
`_specs/<slug>/plan.md` (approach, steps, files to change, validation, rollback).

There are two ways into `/plan`:
- **First run** — from `state: research-complete`: writes `plan.md` and moves the
  ticket from `research-complete` to `spec-complete`.
- **Rewrite** — from `state: spec-complete`, when the latest decision in
  `review.md` is `CHANGES_REQUESTED`: rewrites `plan.md` to deal with the
  follow-ups, keeps the state at `spec-complete`, and adds a history entry. This
  is what makes a CHANGES_REQUESTED review recoverable **without editing the
  state by hand**.

**This command does NOT approve implementation and does NOT create a branch.**

**All or nothing:** run every check first. If any check fails, write **nothing** —
not `ticket.md` and not `plan.md`.

**Write in plain English.** Everything this command produces — every section of
`plan.md`, and the report it prints — must be easy to read: short sentences,
everyday words, no jargon where a plain word works. The **Integration surface**
especially: say plainly what this change touches and what would break, so the
person answering the gate question can follow it. Keep exact technical names
(rule codes, state names, `AC-n` and `OQ-n` ids, file paths, front-matter keys)
as they are. See `.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/plan`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Who owns the state: `.claude/rules/workflow-rules.md` + ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Step 1 — Check (stop on any ERROR and write nothing — PL-8)

Read `_specs/<slug>/ticket.md`, `spec.md`, and `review.md` (if it exists), then
use:
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state` from it.
- **MO-1** — the single workflow form has no modes; stop if `ticket.md > mode` is
  anything other than `standard` (`MO-1 ERROR: only the single workflow form is
  supported — ADR-011`).
- **PL-7 (which way in)** — exactly one of these:
  - *First run:* `state == research-complete`; or
  - *Rewrite:* `state == spec-complete` **and** `review.md` exists with
    `Decision: CHANGES_REQUESTED`.
  Any other state → stop.
- **Spec checks** — `spec.md` exists and meets **SP-1..SP-5 + TR-1**.
- **VP-1 / VP-4 (only when the Validation strategy names a profile)** — the named
  validation profile must exist in `project-config.yaml > validation_profiles`,
  every check it needs must be defined in `validation_checks`, and the plan must
  name the profile by id only (never a command line inside `plan.md`). If not,
  stop.

If any ERROR fires, stop and report the rule code and the message. **Write nothing.**

## Step 2 — Write plan.md

Read `_specs/_templates/plan.md` and write `_specs/<slug>/plan.md` (a rewrite
replaces the old file): the front-matter (`ticket`, `stage: plan`,
`mode: standard`, `status: complete`, `owner: developer`, `updated: <today>`,
`links`) and every section — Approach, Steps, Files to change, **Integration
surface**, Validation strategy, Rollback, Out of scope — all based on the
acceptance criteria in `spec.md`. **On a rewrite, deal openly with the
`Required Follow-up Actions` from `review.md`.**

The **Integration surface** (PL-11, ADR-014) is not optional, and it is not a
summary of the steps. Investigate (read-only) and write down: which components,
services, or shared config this change touches beyond its own files; who *else*
reads them or depends on them (another ticket's flow, a dashboard, an alert, a
metric label, an env var, a port, a path, an interface); where this ticket's flow
**overlaps another use case in the same code**; any step that has to happen in a
set order or at the same time as something else; and what breaks if you got that
wrong. `none — self-contained` is allowed **only** when you also give the reason.
`/review` takes its required integration question from this section (CG-5) — a
vague section gives you a vague gate.

Every `OQ-n` that `spec.md > Open Questions` pushed back must be **answered here**
(PL-12, ADR-015). Name the id in the section that carries the answer — Approach,
Files to change, Integration surface, or Out of scope. After `/plan` no `OQ-n` is
still open; `/review` checks this before it may record APPROVED (RV-3). A
question about `protected_paths` is answered by listing the exact paths under
**Files to change** — once approved, that list is the only thing that makes
editing those files legal at `/implement` (GU-2 / IM-5). Nobody's spoken "yes"
gives that permission.

The **Validation strategy** may name **one** validation profile
(`Validation profile: <profile-id>`) that is defined in
`project-config.yaml > validation_profiles`; `/verify` later turns it into checks
and commands. Commands are **never** written into `plan.md` — they live only in
`validation_checks` (VP-4). Leave the line out (or write `none`) to keep the
current free-form validation behaviour (VP-5).

## Step 3 — Update ticket.md (TS-4)

**First run** (from `research-complete`):
- `state: spec-complete`, `updated_at: <today>`; add:
  ```yaml
  - state: spec-complete
    event: spec-validated
    by: ai_agent
    timestamp: <today>
  ```

**Rewrite** (already at `spec-complete`):
- Keep `state: spec-complete`; set `updated_at: <today>`; if `status: blocked`,
  set it back to `status: active`; add:
  ```yaml
  - state: spec-complete
    event: plan-revised
    by: developer
    timestamp: <today>
  ```

## Checks after you write

- **PL-1..PL-5 + PL-11** — every part of `plan.md` is there, including the
  Integration surface (and, on a rewrite, the follow-ups are dealt with) ·
  **PL-12** every `OQ-n` pushed back by `spec.md` is answered, with its id named.
- **PL-6 / TS-4** — `ticket.md` updated once; `state = spec-complete`; one
  history entry added (`spec-validated` on the first run, `plan-revised` on a
  rewrite).
- **PL-9** — nothing approved; no branch.
- **CMD-2** — the state after this command is `spec-complete`.
- **FM-1..FM-8** — the front-matter of `plan.md` is valid; **GU-1 / GU-3** you
  wrote only `plan.md` and `ticket.md`.

## MUST NOT

- Do **not** approve implementation or move to `approved` / `plan-complete`
  (PL-9 — that is the `/review` gate's job).
- Do **not** create a git branch (PL-9 / GU-4).
- Do **not** change source code or any `protected_paths` file.
- Do **not** create any other file.
- Do **not** write only part of the work: if Step 1 fails, nothing is written
  (PL-8).

## Report

Say that `_specs/<slug>/plan.md` was created or rewritten, which way in you used
(first run or rewrite), that `ticket.md` is at `spec-complete` (history entry
added), that nothing was approved and no branch was created, and what comes next:
the owner runs `/review`.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **Current state:** `spec-complete`
- **Next command:** `/review <slug> <APPROVED|CHANGES_REQUESTED|REJECTED> "<rationale>"`
- **Required actions:** none — the ticket **owner** runs `/review` themselves and
  answers the comprehension questions at the gate (CG-1).
- **Optional actions:** run `/plan <slug>` again to rewrite the plan before the
  review, if you need to.
- **Terminal?** no
