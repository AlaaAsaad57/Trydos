# /publish-pr

Publish a ticket's reviewed branch to GitHub as a Pull Request. For ticket
`<slug>`, as the **single place where git work happens** (PB-8 / ADR-008): stage
and commit everything that should be published (the implementation changes plus
`implement.md`, `verify.md`, and the closing update to `ticket.md`), push the
`ticket/<slug>` branch, open a PR with the GitHub CLI using a title and body
built from the workflow files, and save the PR URL in
`ticket.md > links.github`.

> **GitHub is only a place to deliver the work (ADR-007).** This command changes
> **no** workflow state: it writes only `links.github` and never touches `state`
> or the state history. Opening, approving, closing, or merging a PR does not
> change the workflow state, and no GitHub status, review, check, or merge
> information is ever read back into the workflow. `ticket.md` stays the one file
> that holds the state (ADR-003).

**Write in plain English.** Everything this command produces — the PR title and
body, the commit message, and the report it prints — must be easy to read: short
sentences, everyday words, no jargon where a plain word works. Keep exact
technical names (rule codes, state names, file paths, front-matter keys) as they
are. See `.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not repeat them here and do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/publish-pr`)
- The decision behind it: `.claude/docs/adr/ADR-007-github-pr-publish.md`
- **Checks: `.claude/rules/validation-model.md` — use the `PB` rule codes. Do NOT
  write checks of your own.**

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Keeping ClickUp and GitHub code in one place

All `git` work (staging, committing, pushing) and all `gh` work live **only** in
`scripts/github_publish.py` (the same pattern as ADR-005). This command contains
no `git` or `gh` calls of its own; it builds the title, body, and commit message
from the workflow files, runs the helper, and saves the URL it returns.

## Checks before you act (stop on any ERROR and write nothing — PB-5)

Read `_specs/<slug>/ticket.md`, `spec.md`, and `verify.md`, then use:
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state`.
- **PB-1** — the state is `verified` or `closed`. You may publish only after
  `/verify` has passed. Any earlier state → stop.
- **PB-2** — the `ticket/<slug>` branch exists locally (the branch the work is
  on). If it is missing → stop (there is nothing to publish).
- **PB-6 (AC-9)** — the helper checks first that `gh` is installed and logged in;
  if `gh` is missing or not logged in, the helper fails safely (GH-1/GH-2) and
  this command makes no push, no PR, and no change to `ticket.md`.

If any ERROR fires, stop and report the rule code and the message. Change nothing.

## What to do (only when every check passes)

1. **Build the PR title (AC-3)** from the workflow files — for example
   `ticket.md > title`.
2. **Build the PR body (AC-4)** from the workflow files — for example the ticket
   reference and `links.clickup`, the business goal and acceptance-criteria table
   from `spec.md`, and the result from `verify.md`. Write it to a temporary body
   file.
3. **Build the commit message** from the workflow files — for example
   `<slug>: <ticket title>`.
4. **Run the helper** (the only home of `git` and `gh` work):
   ```
   python scripts/github_publish.py --branch ticket/<slug> \
       --title "<generated title>" --body-file <body-file> --base develop \
       --commit-message "<generated commit message>"
   ```
   As the single place where git work happens, the helper **stages the changes in
   the working tree on the branch and makes one commit to publish** when there is
   anything to commit (PB-8/PB-9 — on a ticket branch, those changes are exactly
   the implementation plus the `_specs/<slug>/` files and the closing update). It
   then **pushes** the branch (AC-1) and **opens** the PR (AC-2) — or returns the
   URL of the PR that is already open, so running it twice is safe — and prints
   `{"pr_url": "..."}`.
5. **Save the PR URL (AC-5):** write the `pr_url` it returned into
   `ticket.md > links.github`. **Do not** change `state`, and **do not** add a
   state-history entry (PB-3/PB-4). This only writes one piece of information to
   the state file (the commit already captured the earlier closing update; this
   step moves nothing).

## Checks after you finish

- **PB-1** you acted only from `verified` or `closed`.
- **PB-3** this command did not change `ticket.md > state` (AC-6).
- **PB-4** no state-history entry was added, and no GitHub information was read
  back into the workflow (AC-7).
- **PB-8** the one commit to publish was made here (this is the delivery
  boundary) before the push.
- **PB-9** that commit and the PR include the implementation changes plus
  `implement.md`, `verify.md`, and the closing update to `ticket.md`.
- **AC-5** `ticket.md > links.github` holds the PR URL.
- **GU-3** the commit and push cover only this branch's own work (the
  implemented source plus `_specs/<slug>/`); the only workflow **state** field
  written is `ticket.md > links.github`; no source file is *changed* here (it is
  only committed).

## MUST NOT

- Do **not** change the workflow `state` or add a state-history entry
  (PB-3/PB-4).
- Do **not** read GitHub statuses, reviews, comments, checks, or merge
  information back into the workflow (AC-7 / ADR-007).
- Do **not** merge, set auto-merge, manage reviewers or labels, or delete
  branches (not this command's job; ADR-007).
- Do **not** put `git` or `gh` code in here — it lives only in the helper.
- Do **not** change any `protected_paths` file or any of the seven existing
  command contracts (AC-8).
- Do **not** write only part of the work: if a check fails or the helper exits
  with a non-zero code, `ticket.md` is left as it was (PB-5 / AC-9).

## Report

Say that the commit was made, that the branch was pushed, the PR URL (new or
already there), that `ticket.md > links.github` was updated, and that the
workflow `state` was not changed. If publishing failed safely (`gh` missing or
not logged in), report the GH code and say that nothing was changed.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`). `/publish-pr` sits
outside the state machine, so it never changes the state:

- **Published (commit + push + PR):**
  - **Current state:** unchanged (`verified` or `closed` — delivery sits outside
    the state machine).
  - **Next command:** none — publishing is the last delivery step.
  - **Required actions:** none (review and merge on GitHub happen outside the
    workflow and are never read back into it).
  - **Optional actions:** none
  - **Terminal?** the workflow itself already ended at `closed`; this delivery
    step needs no further workflow action.
- **Failed safely (`gh` missing or not logged in):**
  - **Current state:** unchanged; nothing was committed, pushed, or written.
  - **Next command:** `/publish-pr <slug>` again once `gh` works.
  - **Required actions:** install `gh` or log in with it (fix GH-1/GH-2).
  - **Optional actions:** none
  - **Terminal?** no — run it again once `gh` is available.
