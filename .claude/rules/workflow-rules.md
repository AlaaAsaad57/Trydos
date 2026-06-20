# Workflow Rules — Engineering Workflow v1

Defines each stage, its gates, and the cross-cutting guardrails. Stages, modes,
lifecycle states, and decision tracking are canonical in
`.claude/project-config.yaml`.

## Stage definitions, entry & exit criteria

### 1. intake
- **Definition:** Capture and qualify the request; create the ticket workspace.
- **Entry:** A request exists with at least a title and goal.
- **Exit:** `_specs/<ticket>/` created; metadata per `ticket-standard.md` filled.

### 2. research
- **Definition:** Read-only investigation of repo, configs, and impact.
- **Entry:** Intake complete.
- **Exit:** `research.md` lists relevant directories, config files, affected
  services, validation commands, risks. **No code changed.**

### 3. spec
- **Definition:** Define acceptance criteria and test cases.
- **Entry:** Research complete.
- **Exit:** Acceptance criteria + test cases exist and are unambiguous.

### 4. plan
- **Definition:** Decide the approach and concrete steps.
- **Entry:** Spec complete.
- **Exit:** `plan.md` has approach, steps, files to change, validation, rollback.

### 5. review  (review gate)
- **Definition:** A reviewer (not the author) reviews spec + plan before any implementation.
- **Entry:** Spec and plan complete.
- **Exit:** Reviewer records `APPROVED`. `CHANGES_REQUESTED`/`REJECTED` returns to spec/plan.

### 6. implement
- **Definition:** Apply the change per the approved plan only.
- **Entry:** Review `APPROVED`.
- **Exit:** `implement.md` records files changed and deviations. Changes are
  applied to the working tree on `ticket/<slug>` but **not committed** — the
  single publishable commit is created later by `/publish-pr` (the git delivery
  boundary; ADR-008).

### 7. verify  (review gate)
- **Definition:** Validate the change and review runtime impact.
- **Entry:** Implementation complete.
- **Exit:** `verify.md` shows passing checks; a reviewer signs off; ticket
  `verified` → `closed` (see closure strategy below).

## Execution modes

v1 has **two** modes sharing the same lifecycle and gates; they differ only in
depth. The **canonical definitions** (stages, approvals, ADR/verification
requirements) live in `project-config.yaml > modes` — this section only
summarizes them.

- **standard** — all seven stages. Default for normal work. 1 approval (one reviewer).
- **high_risk** — all seven stages for protected-runtime-path, irreversible, or
  wide-blast-radius work. **2 approvals** (reviewer + second approver; the
  Workflow Owner is eligible as the second), **mandatory ADR**, verification
  includes a rollback rehearsal.
- **fast** — **deferred (not in v1).** `/start-ticket` rejects `mode: fast`.

The `review` gate is **never** skipped in any mode. The mode is declared in
each artifact's front-matter (`mode:`). Choosing a lighter mode than the work
warrants is a guardrail violation.

## Lifecycle states

The canonical ticket **state machine** (states + allowed transitions) is defined
in `project-config.yaml > lifecycle`. This is the single source of truth:

`draft → ready-for-research → research-complete → spec-complete → plan-complete
→ approved → implementation-in-progress → implemented → verified → closed`

- (Fast mode's `ready-for-research → plan-complete` shortcut is deferred — not
  part of v1.)
- `blocked` is **not** a state; it is an orthogonal flag carried in artifact
  front-matter (`status: blocked`). A stage may not advance while its artifact
  status is `blocked`.
- The only path into `implementation-in-progress` is from `approved` — no mode
  bypasses the review gate.
- `closed` is terminal: no reopen; open a new ticket.

## Closure strategy

There is **no `/close` command.** Closure is owned by two commands
(`project-config.yaml > closure`):

- **Success:** `/verify` — at reviewer sign-off the ticket transitions
  `verified → closed`.
- **Rejection:** `/review` — a `REJECTED` decision transitions
  `spec-complete → closed` (terminal).

In both cases `closed` is terminal: no reopen; open a new ticket.

## Ticket state ownership

The ticket's workflow state has exactly one owner (see
[ADR-003](../docs/adr/ADR-003-ticket-state-ownership.md)):

- **`_specs/<ticket>/ticket.md` owns workflow state** — its front-matter `state`
  field is authoritative.
- **Artifact files never own workflow state.** They may carry a *local* `status`
  describing only their own stage progress.
- **Only `ticket.md` defines the current ticket state.** A `review.md` may
  document *why* a transition happened, but does not own the state.
- Commands **must never** infer state from artifact existence or content. They
  read `ticket.md`, validate the transition, then update `ticket.md`.

## Role authority & separation of duties

(Canonical: `project-config.yaml > role_authority` / `separation_of_duties`;
validation: RA-1..RA-3.)

- **Roles:** `workflow_owner` (governance — workflow evolution, governance
  decisions, escalations, cross-project issues; **not** a per-ticket gate),
  `reviewer` (per-ticket gate authority for `/review` and `/verify`; any
  qualified team member who is not the author — need not be an Engineering
  Manager), `developer`/`ai_agent` (authors). Legacy `em` maps to `reviewer`
  (gate) / `workflow_owner` (governance).
- The gates `/review` and `/verify` may be invoked **only** by the `reviewer`
  role (RA-1). Authoring commands are run by `developer`/`ai_agent`. **The
  workflow never requires Engineering Manager participation on a ticket.**
- Every recorded actor (`owner`, history `by`) must be a defined role (RA-2).
- **Separation of duties:** the `reviewer` approving at a gate must **not** be the
  author of the plan/implementation under review — no self-approval (RA-3). This
  makes concrete the prohibition in CLAUDE.md.
  - **Standard-mode exception (opt-in, off by default):** for `standard`
    (low-risk) tickets only, self-review may be permitted when
    `project-config.yaml > separation_of_duties.allow_self_review.standard: true`.
    `high_risk` always requires a distinct second actor and can never self-review.

## Traceability

- Every stage artifact begins with YAML front-matter carrying `ticket`, `stage`,
  `mode`, `status`, `owner`, `updated`, and `links` (ClickUp/GitHub).
- Acceptance criteria are given stable IDs in `spec.md` and referenced by the
  same IDs in `verify.md`, giving criterion → test → result traceability.

## Architectural decisions (ADRs)

- Significant or hard-to-reverse choices are recorded as ADRs under
  `.claude/docs/adr/` using `ADR-0000-template.md`.
- An ADR references the originating ticket; a ticket references its ADRs in the
  relevant artifact. ADRs are append-only (supersede, never rewrite).

## Guardrails

- No stage may begin before the previous stage's exit criteria are met.
- Research/spec/plan/review are **non-mutating** — no source or config edits.
- Protected runtime paths (`protected_paths`) are never modified by
  workflow tooling or governance work.
- Each stage writes only inside its own `_specs/<ticket>/` folder.
- No workflow commands are created except where a phase explicitly authorizes it.

## Verification requirements

- Every acceptance criterion (by ID) maps to at least one executed test case in
  `verify.md`, with its result recorded.
- The `verify` stage must explicitly state whether any `protected_paths` file
  changed (yes/no) and, if yes, that it was intended and approved at the review gate.
- Verification commands and their output must be reproducible.

## Documentation requirements

- Each stage produces its artifact from `_specs/_templates/`, including front-matter.
- Deviations from the plan are documented in `implement.md`.
- Review decisions (`APPROVED` / `CHANGES_REQUESTED` / `REJECTED`) are recorded
  against the stage.
- Architectural decisions are recorded as ADRs (see above).
- This rules file and `project-config.yaml` are the source of truth; other docs
  must be reconciled to them.
