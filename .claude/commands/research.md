---
description: Look through the repo (read-only), write research.md, and move the ticket from draft to ready-for-research. All or nothing — nothing is written if a check fails.
argument-hint: <slug>
allowed-tools: Read, Grep, Glob, Write
---

# /research

For ticket `<slug>`: check that the ticket is ready, look through the repository
**without changing anything**, write `_specs/<slug>/research.md`, and move the
ticket state from `draft` to `ready-for-research` (adding one history entry).

**All or nothing:** run every check first. If any check fails, write **nothing** —
not `research.md` and not `ticket.md`. Looking through the repo never changes
source code or any `protected_paths` file.

**Write in plain English.** Everything this command produces — every section of
`research.md`, the wording of each `OQ-n` question, and the report it prints —
must be easy to read: short sentences, everyday words, no jargon where a plain
word works. Keep exact technical names (rule codes, state names, file paths,
front-matter keys) as they are. See
`.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/research`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Who owns the state: `.claude/rules/workflow-rules.md` + ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Step 1 — Check (stop on any ERROR and write nothing — RS-8)

Read `_specs/<slug>/ticket.md` and `intake.md`, then use:
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state` from it.
- **RS-7 / CMD-1 / ST-2** — `state` must be `draft` **and** the Readiness Status
  in `intake.md` must be `READY` (that is the only thing that allows the move to
  `ready-for-research`). If `state` is already `ready-for-research`, skip the
  state change and only rewrite `research.md` — running the command again is
  safe. In any other case, stop.
- **MO-1** — the single workflow form has no modes, so `research` always applies.
  `ticket.md > mode` must be the one legal value `standard`; stop on anything
  else (`MO-1 ERROR: only the single workflow form is supported — ADR-011`).

If any ERROR fires, stop and report the rule code and the message. **Write nothing.**

## Step 2 — Look through the repo (read-only) and write research.md

Investigate with **Read, Grep, and Glob only** (change nothing, run no shell
commands with side effects). Starting from the ticket goal in `intake.md`,
collect: the directories that matter; the config files that matter (read
`protected_paths` only to understand it, never change it); the services that
might be affected; the test and validation commands that exist (list them, do not
run them); risks and unknowns; and open questions.

Give every open question its own id — `OQ-1`, `OQ-2`, … (RS-5, ADR-015). These
ids are what `/spec` has to answer (SP-9) and, when the answer is pushed back,
what `/plan` has to answer (PL-12) — so a question raised here cannot get lost.
Ask them here even when the answer looks obvious: an answer given in chat is not
written down anywhere and does not carry over.

Read `_specs/_templates/research.md` and write `_specs/<slug>/research.md`:
- Front-matter: `ticket: <slug>`, `stage: research`, `mode: <ticket.md mode>`,
  `status: complete`, `owner: ai_agent`, `updated: <today YYYY-MM-DD>`, and
  `links` copied from `ticket.md`.
- Fill in every section (RS-1..RS-5). Leave the read-only statements in the
  "Notes" section as they are.

## Step 3 — Move the ticket state (TS-4)

Only when you started from `state: draft`, update `_specs/<slug>/ticket.md` (the
one place the state is written):
- `state: ready-for-research`
- `updated_at: <today>`
- Add one state-history entry:
  ```yaml
  - state: ready-for-research
    event: research-started
    by: ai_agent
    timestamp: <today>
  ```
(When you re-run the command and the state is already `ready-for-research`, do
not add a second entry.)

## Checks after you write

- **RS-1..RS-5** — `research.md` lists the directories, the config files, the
  affected services and validation commands, the risks, and the open questions
  **with `OQ-n` ids**.
- **RS-6 / TS-4** — `ticket.md` updated once: `state = ready-for-research`,
  `updated_at` refreshed, one history entry added.
- **CMD-2** — the state after this command is `ready-for-research`.
- **FM-1..FM-8** — the front-matter of `research.md` is valid, and `mode` matches
  `ticket.md`.
- **GU-1 / GU-3** — you wrote only `research.md` and `ticket.md`; the rest of the
  repo was only read.

## MUST NOT

- Do **not** move the state past `ready-for-research` (the step from
  `ready-for-research` to `research-complete` belongs to `/spec`).
- Do **not** change source code or any `protected_paths` file.
- Do **not** run validation or test commands — only find them and list them.
- Do **not** create any other file, and do **not** create a branch.
- Do **not** write only part of the work: if Step 1 fails, nothing is written
  (RS-8).

## Report

Say that `_specs/<slug>/research.md` was created (from read-only investigation),
that `ticket.md` moved from `draft` to `ready-for-research` (history entry
added), and what comes next: run `/spec`.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **Current state:** `ready-for-research`
- **Next command:** `/spec <slug>`
- **Required actions:** none
- **Optional actions:** run `/research <slug>` again to refresh `research.md`
  (safe to repeat — the state does not move a second time).
- **Terminal?** no
