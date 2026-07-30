---
description: Set up a new ticket workspace (ticket.md + intake.md) as defined by Engineering Workflow v1.
argument-hint: <slug> "<title>" [owner=...] [clickup_id=...]
allowed-tools: Read, Write, Glob, Bash
---

# /start-ticket

Set up a new ticket workspace under `_specs/<slug>/`. You create **exactly two
files** — `ticket.md` (the one file that holds the ticket's state) and
`intake.md` — and nothing else.

**Write in plain English.** Everything this command produces — the text it puts
into `ticket.md` and `intake.md`, and the report it prints — must be easy to
read: short sentences, everyday words, no jargon where a plain word works. Keep
exact technical names (rule codes, state names, file paths, front-matter keys) as
they are. See `.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not repeat them here and do not make up your own):
- State machine, the single workflow form, closure: `.claude/project-config.yaml`
- Stage gates and who owns the state: `.claude/rules/workflow-rules.md`
- What this command must do: `.claude/docs/command-architecture.md` (`/start-ticket`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**

## Inputs

Read from `$ARGUMENTS`:
- `slug` (required) — the ticket id.
- `title` (required) — a human title, in quotes.
- `mode` — **not an input.** There are no modes and no risk levels (ADR-011).
  `ticket.md` is always written with the one legal value `mode: standard`.
- `owner` (optional, `developer` by default).
- `links` (optional) — ClickUp / GitHub URLs.
- `clickup_id` (optional) — a ClickUp task id to fill the ticket from
  (read-only). See "ClickUp intake" below.

**Slug rule:** a slug given by the user always wins. Only when `clickup_id` is
given **and** no slug is supplied, use `cu-<clickup_id>` as the slug.

If `title` is missing and no `clickup_id` is given, ask the user once. (With a
`clickup_id`, the title comes from ClickUp.)

## ClickUp intake (optional, read-only)

If `clickup_id` is given, fill the workspace from the ClickUp task **before** you
write any file. The HTTP code lives **only** in `scripts/clickup_intake.py` —
this command contains no HTTP or curl code of its own. It just runs the helper:

```
python scripts/clickup_intake.py <clickup_id>
```

The helper makes one read-only `GET` and returns `{title, description, url}`.
Use them like this: `title` → the ticket title; `description` → the intake
`Ticket Summary`; `url` → `links.clickup`. **Read-only: never write anything to
ClickUp, and never take the workflow state from ClickUp** — `ticket.md` stays the
one place that holds the state.

## Checks before you write anything (stop on any ERROR)

Use these rules from `validation-model.md`:
- **FM-3** — `mode` is the one legal value `standard`. Reject anything else (such
  as `high_risk` or `fast`): `FM-3 ERROR: <value> is not a valid mode — the
  workflow has a single form (ADR-011)`.
- **FM-5** — `slug` matches `^[A-Za-z0-9][A-Za-z0-9._-]*$`.
- **CMD-3** — `_specs/<slug>/` must not already exist (use Glob to check). If it
  does, stop and report `CMD-3 ERROR: workspace already exists`.
- **MO-1** — `intake` is a valid stage of the single workflow form (it always is).
- **CU-1 / CU-2** (only when `clickup_id` is given) — `CLICKUP_API_TOKEN` is set
  (CU-1) and the helper's fetch works (CU-2). If the helper exits with a non-zero
  code, stop and create nothing (CU-4 — all or nothing).

If any ERROR fires, stop and report the rule code and the message. Create nothing.

## What to do (only when every check passes)

Use today's date (`YYYY-MM-DD`) for `created_at`, `updated_at`, and `updated`.
If `clickup_id` was given, use the helper's `title` for `<title>`, its
`description` for the intake `Ticket Summary`, its `url` for `links.clickup`, and
use `cu-<clickup_id>` as the slug when no slug was supplied.

1. Read `_specs/_templates/ticket.md`. Write `_specs/<slug>/ticket.md` with the
   front-matter filled in:
   - `ticket: <slug>`, `title: <title>`, `mode: standard`,
   - `state: draft`  ← the starting state, and the only one that counts,
   - `status: active`, `owner: <owner>`,
   - `created_at: <today>`, `updated_at: <today>`.
   Leave the field-reference text in the body as it is, and write the **first
   state-history entry** in the "State history" section:
   ```yaml
   - state: draft
     event: ticket-created
     by: ai_agent
     timestamp: <today>
   ```
2. Read `_specs/_templates/intake.md`. Write `_specs/<slug>/intake.md` with the
   front-matter: `ticket: <slug>`, `stage: intake`, `mode: standard`,
   `status: in_progress`, `owner: <owner>`, `updated: <today>`, and `links`
   (clickup/github if you have them, otherwise empty). Fill in
   `Ticket Reference`, `Ticket Summary`, and the metadata from the inputs. Leave
   the readiness checks for the user to complete.

## Checks after you write

- **TS-2 / TS-3** — `ticket.md` exists with every required field; `state: draft`
  is one of the official states; `status: active`.
- **TS-4** — `ticket.md` is the only state record written, and it includes the
  first `ticket-created` history entry.
- **FM-1..FM-8** — the front-matter of both files is valid and `mode` matches.
- **ST-1** — the current state (`ticket.md > state`) is `draft`.
- **CMD-2** — the state after this command is `draft`.

## MUST NOT (not this command's job)

- Do **not** create a git branch. Under the branch strategy
  (`command-architecture.md §3`), a branch is created only after the review gate
  approves the plan, by the command that starts implementation — never at
  start-ticket, and never for a ticket that is not approved yet (GU-4).
- Do **not** create `research.md`, `spec.md`, `plan.md`, `review.md`,
  `implement.md`, or `verify.md`.
- Do **not** change source code or any `protected_paths` file.
- Do **not** move the state past `draft` (the `draft → ready-for-research` step
  happens later, once intake is marked `READY`).

## Report

Say what you created (`_specs/<slug>/ticket.md`, `_specs/<slug>/intake.md`), that
the state is `draft`, and what comes next: fill in `intake.md`, mark it `READY`,
then run `/research`.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **Current state:** `draft`
- **Next command:** `/research <slug>`
- **Required actions:** fill in `intake.md` and set its Readiness Status to
  `READY` (the `draft → ready-for-research` step needs it — RS-7).
- **Optional actions:** none
- **Terminal?** no
