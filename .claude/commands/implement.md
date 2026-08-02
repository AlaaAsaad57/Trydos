---
description: After an APPROVED review, create the ticket branch and make ONLY the changes listed in plan.md; write implement.md; move the ticket to implemented. Can resume from implementation-in-progress. Stops (status=blocked) when something is unsafe or unclear; never touches files outside the plan; never commits and never pushes (publishing is the one place git work happens).
argument-hint: <slug>
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /implement

For ticket `<slug>`: make **only** the changes listed in `plan.md`, write
`implement.md`, and move the ticket to `implemented`. This is the **first command
that changes source code**.

There are two ways into `/implement` (chosen by the current `ticket.md > state`):
- **First run** — from `state: approved`: create the branch, then implement.
- **Resume** — from `state: implementation-in-progress`: do **not** create a new
  branch; carry on with the planned work that is left. This is what makes a
  ticket stuck at `implementation-in-progress` recoverable **without editing the
  state by hand**.

This command must: change only what `plan.md` lists, never quietly touch other
files, stop (`status: blocked`) when something is unsafe or unclear, and never
push.

**Write in plain English.** Everything this command produces — every section of
`implement.md` (including the reason it stopped, if it stopped) and the report it
prints — must be easy to read: short sentences, everyday words, no jargon where a
plain word works. Keep exact technical names (rule codes, state names, `AC-n`
ids, file paths, front-matter keys) as they are. See
`.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/implement`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Branch strategy: `command-architecture.md §3`. Who owns the state: ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Step 1 — Check and pick the way in (stop on any ERROR and change NOTHING — IM-8)

Read `_specs/<slug>/ticket.md`, `plan.md`, `review.md`, and `implement.md` (if it
exists), then use:
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state`.
- **IM-1 (which way in)** — exactly one of these:
  - *First run:* `state == approved` AND the `review.md` Decision is APPROVED.
  - *Resume:* `state == implementation-in-progress`.
  Any other state → stop.
- **IM-2** — `plan.md` is complete (PL-1..PL-5) and its "Files to change" list is
  **clear and leaves no doubt**.
- **IM-5 / GU-2** — a `protected_paths` file may be changed only when the
  approved `plan.md` lists it under "Files to change"; otherwise stop (CLAUDE.md
  says this is a full stop).
- Branch checks:
  - *First run (IM-3 / GU-4):* `develop` is clean AND no `ticket/<slug>` branch
    exists yet.
  - *Resume (IM-3a):* the `ticket/<slug>` branch **already exists** and is the
    branch you are on. If it is missing or you are on a different branch → stop
    (do not create a second branch).

If any check fails, stop and report the rule code and the message. **No branch,
no file changes, no state change.**

## Step 2 — Branch or continue (depends on the way in)

- **First run:** create `ticket/<slug>` from a clean `develop` and switch to it
  (IM-3 — this is the only place a branch is ever created). Update `ticket.md`:
  `state: implementation-in-progress`, `updated_at: <today>`; add:
  ```yaml
  - state: implementation-in-progress
    event: implementation-started
    by: developer
    timestamp: <today>
  ```
- **Resume:** do **not** create a branch. Make sure you are on `ticket/<slug>`.
  Read `implement.md` to see what is already done; if `status: blocked`, set
  `ticket.md status: active` again. Add:
  ```yaml
  - state: implementation-in-progress
    event: implementation-resumed
    by: developer
    timestamp: <today>
  ```

## Step 3 — Make ONLY the planned changes that are left (IM-4)

Work through each entry in the `plan.md` "Files to change" list that is not done
yet (with Edit or Write). **Do not touch any file that is not on that list.**
Leave the changes **uncommitted** in the working tree on the `ticket/<slug>`
branch — `/implement` makes **no commit** and **never pushes** (IM-9). The one
commit that gets published is created later by `/publish-pr`, the single place
where git work happens (PB-8 / ADR-008).

**If you cannot carry on** (the work needs a file the plan does not list, or
anything is unsafe or unclear):
- Do **not** set `state: implemented`.
- Keep `state: implementation-in-progress` and set `status: blocked` (IM-10).
- Write or update `implement.md` with: **why you stopped**, **what you changed so
  far**, **what you recommend doing next**, and **whether the plan has to be
  rewritten**.
- Stop and report. (Run `/implement` again later to resume, or `/plan` to rewrite
  the plan.)

## Step 4 — Write implement.md (IM-6)

Write or update `_specs/<slug>/implement.md` from
`_specs/_templates/implement.md`: the front-matter (`ticket`,
`stage: implement`, `mode`, `status` showing how far you got, `owner: developer`,
`updated: <today>`, `links`) plus Changes made, Deviations from plan, and
Validation run. **No commit is made at `/implement` (IM-9)** — so there are no
commit ids to record; the "Changes prepared" section lists the changed files
instead.

## Step 5 — Finish (TS-4 / IM-7), only when all the planned work is done

Update `ticket.md`: `state: implemented`, `status: active`,
`updated_at: <today>`; add:
```yaml
- state: implemented
  event: implementation-completed
  by: developer
  timestamp: <today>
```

## Checks after you finish

- **IM-3** the first run created the branch from a clean develop (or **IM-3a**
  the resume used the branch that was already there, with no second branch) ·
  **IM-4** the changes stayed inside the planned files · **IM-5** protected paths
  were touched only if the approved plan listed them · **IM-6** `implement.md` is
  complete · **IM-9** no commit and no push.
- Finished: **IM-7 / TS-4 / CMD-2** state = `implemented`, with all planned work
  done and the validation written down.
- Stopped: **IM-10** state = `implementation-in-progress`, `status: blocked`, and
  `implement.md` records the reason, what was done so far, and what to do next —
  a valid result, but **not** a finished one.

## MUST NOT

- Do **not** run unless the state is `approved` or `implementation-in-progress`
  (IM-1).
- Do **not** create a second branch on a resume (IM-3a).
- Do **not** change files that `plan.md` does not list (IM-4 — no quiet edits).
- Do **not** change `protected_paths` unless the approved `plan.md` lists it
  (IM-5 / GU-2).
- Do **not** set `implemented` unless all the planned work is done and the
  validation is written down (IM-7).
- Do **not** commit and do **not** push (IM-9 — `/publish-pr` owns the one
  publishable commit); do **not** move the state past `implemented` (`/verify`
  owns `implemented → verified → closed`).

## Report

Say which way in you used (first run or resume), the branch, the files you
changed (all of them from `plan.md`, left **uncommitted**), and the state
`ticket.md` now has:
- finished → `implemented`; next: the owner runs `/verify`.
- stopped → `implementation-in-progress` plus `status: blocked`; report why you
  stopped and whether the plan has to be rewritten with `/plan`.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **Finished → `implemented`:**
  - **Current state:** `implemented`
  - **Next command:** `/verify <slug>` (the owner; checks only, changes nothing)
  - **Required actions:** none — the work is on the branch, uncommitted.
  - **Optional actions:** none (do not commit or push here; that is
    `/publish-pr`).
  - **Terminal?** no
- **Stopped → `implementation-in-progress` plus `status: blocked` (NS-3):**
  - **Current state:** `implementation-in-progress` (`status: blocked`)
  - **Next command:** `/implement <slug>` (resume) or `/plan <slug>` (rewrite)
  - **Required actions:** fix the reason you stopped, as written in
    `implement.md` (and if it needs a change to the plan, rewrite the plan with
    `/plan` first).
  - **Optional actions:** none
  - **Terminal?** no
