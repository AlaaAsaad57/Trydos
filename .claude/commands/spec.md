---
description: Check the research, move the ticket to research-complete, and write a spec you can trace (no implementation planning). All or nothing — nothing is written if a check fails.
argument-hint: <slug>
allowed-tools: Read, Grep, Glob, Write
---

# /spec

For ticket `<slug>`: check that the research is complete, move the ticket state
to `research-complete` (adding one history entry), and write the spec file
`_specs/<slug>/spec.md` (requirements plus acceptance criteria with fixed AC
ids). **No implementation planning.**

**All or nothing:** run every check first. If any check fails, write **nothing** —
not `ticket.md` and not `spec.md`.

**Write in plain English.** Everything this command produces — every section of
`spec.md`, every acceptance criterion, and the report it prints — must be easy to
read: short sentences, everyday words, no jargon where a plain word works. An
acceptance criterion in particular should be a plain sentence anyone on the team
can check. Keep exact technical names (rule codes, state names, `AC-n` and `OQ-n`
ids, file paths, front-matter keys) as they are. See
`.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/spec`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Ticket standard: `.claude/docs/ticket-standard.md`. Who owns the state: ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Step 1 — Check (stop on any ERROR and write nothing — SP-8)

Read `_specs/<slug>/ticket.md`, `intake.md`, and `research.md`, then use:
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state` from it.
- **CMD-1 / ST-2** — `state` must be `ready-for-research` (the only state you may
  move to `research-complete` from). In any other case, stop.
- **MO-1** — the single workflow form has no modes, so `spec` always applies.
  `ticket.md > mode` must be the one legal value `standard`; stop on anything
  else (`MO-1 ERROR: only the single workflow form is supported — ADR-011`).
- **SP-7** — `research.md` exists and meets **RS-1..RS-5** (the directories, the
  config files, the affected services and validation commands, the risks, and the
  open questions). If it is missing or incomplete, stop and tell the user to run
  `/research`.

If any ERROR fires, stop and report the rule code and the message. **Write nothing.**

## Step 2 — Write spec.md

Read `_specs/_templates/spec.md` and write `_specs/<slug>/spec.md`:
- Front-matter: `ticket: <slug>`, `stage: spec`, `mode: <ticket.md mode>`,
  `status: complete`, `owner: developer`, `updated: <today YYYY-MM-DD>`, and
  `links` copied from `ticket.md`.
- Fill in every section, using `intake.md` (goal and user story) and
  `research.md` (constraints, edge cases, open questions): Feature Name, Business
  Goal, User Story, Functional Requirements, Non-Functional Requirements,
  Constraints, Edge Cases, **Research Questions Resolved**, Open Questions,
  **Acceptance Criteria Mapping** (each criterion gets a fixed id `AC-1`, `AC-2`,
  … linked to a requirement), and Out of Scope.

**Research Questions Resolved** (SP-9, ADR-015) is not optional. Every `OQ-n` in
`research.md` gets a row — either *answered* (the answer plus where it ends up: a
requirement, an `AC-n`, a constraint, or Out of Scope) or *pushed back* (the
answer needs the approach first, so repeat it under Open Questions with the same
id and let `/plan` answer it — PL-12). If the owner answered a question in the
conversation, write that answer down here: **the conversation is not a file** and
the next command cannot see it (ADR-003). Keep the answer at spec level — say
what is in scope, never the file paths or the approach (SP-4). For example: an
`OQ-n` asking whether `protected_paths` is touched is answered by putting that
behaviour in scope (`/plan` then names the files) or by putting it in Out of
Scope.

## Step 3 — Move the ticket state (TS-4)

Update `_specs/<slug>/ticket.md` (the one place the state is written):
- `state: research-complete`
- `updated_at: <today>`
- Add one state-history entry:
  ```yaml
  - state: research-complete
    event: research-validated
    by: ai_agent
    timestamp: <today>
  ```

## Checks after you write

- **SP-1** Business Goal and User Story · **SP-2** Functional and Non-Functional
  Requirements (plus Constraints) · **SP-3 / TR-1** fixed `AC-n` ids linked to
  requirements · **SP-4** no implementation detail (no file paths, no code, no
  steps) · **SP-5** Out of Scope · **SP-9** every `OQ-n` from `research.md` is
  answered or pushed back with its id.
- **SP-6 / TS-4** — `ticket.md` updated once: `state = research-complete`,
  `updated_at` refreshed, one history entry added.
- **CMD-2** — the state after this command is `research-complete`.
- **FM-1..FM-8** — the front-matter of `spec.md` is valid, and `mode` matches
  `ticket.md`.
- **GU-1 / GU-3** — you wrote only `spec.md` and `ticket.md`.

## MUST NOT

- Do **not** start planning the implementation: no approach, no steps, no file
  names, no code (SP-4). That is `/plan`'s job.
- Do **not** drop an `OQ-n`, and do **not** treat a chat answer as the answer
  (SP-9). Every id is either answered here or pushed back here — an id that
  appears nowhere in `spec.md` stops the command.
- Do **not** move the state past `research-complete` (the step from
  `research-complete` to `spec-complete` belongs to a later stage).
- Do **not** change source code or any `protected_paths` file.
- Do **not** create any other file, and do **not** create a branch.
- Do **not** write only part of the work: if Step 1 fails, nothing is written
  (SP-8).

## Report

Say that `_specs/<slug>/spec.md` was created with N acceptance criteria
(`AC-1..AC-N`), that `ticket.md` moved to `research-complete` (history entry
added), and what comes next: run `/plan`.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **Current state:** `research-complete`
- **Next command:** `/plan <slug>`
- **Required actions:** none
- **Optional actions:** none
- **Terminal?** no
