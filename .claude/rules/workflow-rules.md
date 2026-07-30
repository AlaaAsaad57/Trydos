# Workflow Rules — Engineering Workflow v1

This file describes each stage, its gates, and the safety rules that apply
everywhere. The stages, the single workflow form, the comprehension gate, the
lifecycle states, and how decisions are tracked are all defined in
`.claude/project-config.yaml` — that file is the source of truth.

## Plain language — how everything must be written

**Everything the workflow produces must be easy to read.** This covers every
artifact under `_specs/<ticket>/` (intake, research, spec, plan, review,
implement, verify, comprehension), every comprehension question and answer
option, every review-panel finding, every PR title and body, and every report or
next-step block a command prints.

Write at roughly **B2 English level**:
- Short sentences. One idea per sentence.
- Everyday words. Say "stop" not "abort", "change" not "mutate", "all or nothing"
  not "atomic", "safe to run again" not "idempotent", "how much can break" not
  "blast radius", "point out" not "surface".
- Explain a term the first time you use it, in a few words, rather than assuming
  the reader knows it.
- Use the active voice: "the command writes `plan.md`", not "`plan.md` is
  written".
- No filler, no marketing tone, no long words used to sound serious.

**What must stay exactly as it is** — never simplify or translate these:
- rule codes (`RS-1`, `CG-5`, `PB-8`, …), state names (`spec-complete`,
  `implementation-in-progress`, …), and event names (`plan-approved`, …),
- file paths, command names, front-matter keys and their values, YAML snippets,
  and ADR references,
- acceptance-criteria ids (`AC-n`) and open-question ids (`OQ-n`).

**Language:** the artifacts, the comprehension questions, and the recorded
answers are always written in **English**, whatever language the conversation is
in (CLAUDE.md). Plain English still means English.

This rule is about wording only. It never changes what a command checks, what it
writes, or which state it moves the ticket to.

## The stages: what each one is, and how you get in and out

### 1. intake
- **What it is:** Capture the request, decide whether it is clear enough, and
  create the ticket workspace.
- **Way in:** a request exists with at least a title and a goal.
- **Way out:** `_specs/<ticket>/` is created, with the metadata filled in as
  described in `ticket-standard.md`.

### 2. research
- **What it is:** Read the repo, the configs, and work out the impact. Change
  nothing.
- **Way in:** intake is finished.
- **Way out:** `research.md` lists the directories that matter, the config files,
  the affected services, the validation commands, the risks, and the open
  questions with `OQ-n` ids (ADR-015). **No code is changed.**

### 3. spec
- **What it is:** Write the acceptance criteria and the test cases.
- **Way in:** research is finished.
- **Way out:** the acceptance criteria and test cases exist and leave no room for
  doubt, and every `OQ-n` from research is either answered or pushed to `/plan`
  with its id (SP-9).

### 4. plan
- **What it is:** Decide the approach and the concrete steps.
- **Way in:** the spec is finished.
- **Way out:** `plan.md` has the approach, the steps, the files to change, the
  validation, the rollback, the integration surface, and an answer for every
  `OQ-n` the spec pushed forward (PL-12).

### 5. review  (gate)
- **What it is:** The owner reviews the spec and the plan (their own work) and
  answers a comprehension check before anything is implemented.
- **Way in:** the spec and the plan are finished.
- **Way out:** the owner records `APPROVED` after passing the comprehension
  check. `CHANGES_REQUESTED` or `REJECTED` sends the ticket back to spec/plan.

### 6. implement
- **What it is:** Make the change, following the approved plan and nothing else.
- **Way in:** the review said `APPROVED`.
- **Way out:** `implement.md` records the files changed and anything done
  differently from the plan. The changes sit on the `ticket/<slug>` branch but
  are **not committed** — the one commit that gets published is made later by
  `/publish-pr`, the single place where git work happens (ADR-008).

### 7. verify  (gate)
- **What it is:** Check the change and look at what it does at runtime.
- **Way out:** `verify.md` shows the checks passing; the owner signs off after
  the comprehension check; the ticket goes `verified` → `closed` (see "How a
  ticket closes" below).

## One workflow form (single owner + comprehension gate)

There are **no modes and no risk levels** (ADR-011). Every ticket runs the **same
workflow**: all seven stages and both gates, carried by a **single owner**. The
source of truth is `project-config.yaml > workflow_form` and
`> comprehension_gates` — this section only summarises it. (`standard`,
`high_risk`, and `fast` are gone; the `mode:` front-matter field keeps one old
value, `standard`.)

- **Single owner:** one person writes the ticket **and** runs its `/review` and
  `/verify` gates. Reviewing your own work is expected here. There is no second
  reviewer and no split of duties.
- **The comprehension gate is the control.** Instead of a second person, each
  gate makes the owner answer questions taken **from the file being reviewed**
  (`plan.md` and `spec.md` at `/review`; `implement.md` and `spec.md` at
  `/verify`) before it can record a decision. This is what stops someone
  approving work without reading it (CG-1..CG-6). **At least 3 questions — a
  minimum, not a fixed number** (ADR-014): always **at least 1 about integration
  and cross-flow effects** (CG-5, taken from the plan's `Integration surface`),
  plus **one more for every `major` finding from the advisory panel** at
  `/review` (CG-6). The panel still never blocks anything — the owner may dismiss
  a finding, but only after showing they understood it.
- **The same safeguards for every ticket:** all seven stages, **1 approval** by
  the owner, `adr_required: false` (ADRs are optional), and verification at
  `all-ac` (every acceptance criterion gets a result). No risk levels, no second
  approver, no rollback rehearsal.

The `/review` and `/verify` gates are **never** skipped, and neither of them may
record a decision until the comprehension questions have been answered.

## Lifecycle states

The official ticket **state machine** (the states and the moves allowed between
them) is defined in `project-config.yaml > lifecycle`. That is the single source
of truth:

`draft → ready-for-research → research-complete → spec-complete → plan-complete
→ approved → implementation-in-progress → implemented → verified → closed`

- `blocked` is **not** a state. It is a separate flag in the artifact
  front-matter (`status: blocked`). A stage cannot move forward while its
  artifact says `blocked`.
- The only way into `implementation-in-progress` is from `approved` — nothing
  gets around the review gate.
- `closed` is the end: you cannot reopen a ticket. Open a new one.

## How a ticket closes

There is **no `/close` command.** Two commands close tickets
(`project-config.yaml > closure`):

- **Success:** `/verify` — when the owner signs off, the ticket moves
  `verified → closed`.
- **Rejection:** `/review` — a `REJECTED` decision moves the ticket
  `spec-complete → closed`.

In both cases `closed` is the end: no reopening. Open a new ticket.

## Who owns the ticket state

Exactly one file owns the ticket's workflow state (see
[ADR-003](../docs/adr/ADR-003-ticket-state-ownership.md)):

- **`_specs/<ticket>/ticket.md` owns the state** — the `state` field in its
  front-matter is the one that counts.
- **Other artifact files never own the workflow state.** They may carry a *local*
  `status` that describes only their own progress.
- **Only `ticket.md` says what state the ticket is in.** A `review.md` may explain
  *why* a move happened, but it does not own the state.
- Commands must **never** work out the state from which files exist or what they
  contain. They read `ticket.md`, check the move is allowed, then write
  `ticket.md`.

## Who may run what (single-owner model)

(Source of truth: `project-config.yaml > role_authority` /
`separation_of_duties`; checks: RA-1..RA-3.)

- **Roles:** `workflow_owner` (looks after the workflow itself — how it evolves,
  governance decisions, escalations, cross-project problems; **not** a gate on
  each ticket), `reviewer` (the person at the `/review` and `/verify` gates —
  normally the ticket **owner** running their own gate; ADR-011),
  `developer` / `ai_agent` (they write the ticket and do the work). The old `em`
  role now maps to `reviewer` (at a gate) and `workflow_owner` (for governance).
- The `/review` and `/verify` gates are run by the ticket **owner** themselves
  (RA-1). The other commands are run by `developer` / `ai_agent`. **The workflow
  never needs an Engineering Manager on a ticket.**
- Every recorded person (`owner`, and `by` in the history) must be one of the
  defined roles (RA-2).
- **No split of duties (single-owner model, ADR-011):** the ticket owner does the
  work **and** runs its `/review` and `/verify` gates. That is expected, not
  forbidden. What stops someone approving work without reading it is the
  **comprehension gate** (CG-1..CG-6), not a second person. There is no second
  approver.

## Tracing the work

- Every stage artifact starts with YAML front-matter carrying `ticket`, `stage`,
  `mode`, `status`, `owner`, `updated`, and `links` (ClickUp/GitHub).
- Acceptance criteria get fixed ids in `spec.md`, and `verify.md` uses the same
  ids — so you can follow each criterion from spec to test to result.

## Architectural decisions (ADRs)

- Choices that are important or hard to undo are written up as ADRs under
  `.claude/docs/adr/`, using `ADR-0000-template.md`.
- An ADR names the ticket it came from, and the ticket names its ADRs in the
  right artifact. ADRs are only ever added to: write a new one that replaces an
  old one, never rewrite the old one.

## Safety rules

- A stage may not start before the previous stage has met its exit criteria.
- Research, spec, plan, and review **change nothing** — no source and no config
  edits.
- Protected runtime paths (`protected_paths` in `project-config.yaml`) are never
  changed by workflow tooling or governance work.
- Each stage writes only inside its own `_specs/<ticket>/` folder.
- No new workflow commands are created unless a phase clearly allows it.

## What verification must cover

- Every acceptance criterion (by id) maps to at least one test case that was
  actually run in `verify.md`, with its result written down.
- The `verify` stage must clearly say whether any `protected_paths` file changed
  (yes or no) and, if yes, that it was intended and approved at the review gate.
- Someone else must be able to run the same validation commands and get the same
  output.

## What must be documented

- Each stage produces its artifact from `_specs/_templates/`, front-matter
  included.
- Anything done differently from the plan is written down in `implement.md`.
- Review decisions (`APPROVED` / `CHANGES_REQUESTED` / `REJECTED`) are recorded
  against the stage.
- Architectural decisions are recorded as ADRs (see above).
- This file and `project-config.yaml` are the source of truth; any other document
  that disagrees with them must be corrected.
