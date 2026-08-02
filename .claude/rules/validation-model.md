# Validation Model — Engineering Workflow v1

> **One set of checks for the whole workflow.** Every command MUST run the rules
> below that apply to it, and MUST NOT invent checks of its own. This model
> **comes from** (and never disagrees with) the source files:
> `.claude/project-config.yaml` (state machine, single workflow form,
> comprehension gate, closure),
> `.claude/rules/workflow-rules.md` (gates and safety rules), and
> `.claude/docs/command-architecture.md` (what each command must do).
>
> This file only defines the checks. **No checking code or tooling is built here.**

## How a check reports its result

- Each rule ends in either `PASS` or a problem: `{ code, severity, message }`.
- **Severity:** `ERROR` stops the command (it must stop and report);
  `WARN` is a note (the command may carry on, but must show it).
- A command may do its work only when **no `ERROR` problems** are left in the set
  of rules that apply to it.
- Checks run at two points in every command: **before it acts**, and **after it
  has written its file or made its changes**.

## The rules

### FM — Front-matter (every artifact)
| Code | Severity | Condition |
|------|----------|-----------|
| FM-1 | ERROR | All keys are there: `ticket, stage, mode, status, owner, updated, links`. |
| FM-2 | ERROR | `stage` is one of the official stages **and** matches the artifact's own stage. |
| FM-3 | ERROR | `mode` == `standard` — the only legal value (there is one workflow form; ADR-011). `high_risk` and `fast` are invalid and must be rejected (for example at `/start-ticket`). (Old tickets that are already closed and still say `high_risk` are history and are left alone — they are not rewritten.) |
| FM-4 | ERROR | `status` is one of `not_started`, `in_progress`, `blocked`, `complete`. |
| FM-5 | ERROR | `ticket` matches the slug pattern `^[A-Za-z0-9][A-Za-z0-9._-]*$`. |
| FM-6 | WARN  | `updated` is an ISO date, `YYYY-MM-DD`. |
| FM-7 | WARN  | `links` has a `clickup` key and a `github` key (they may be empty). |
| FM-8 | ERROR | `mode` is the same in every artifact of the same ticket. |

### TS — Where the ticket state comes from (ADR-003)
| Code | Severity | Condition |
|------|----------|-----------|
| TS-1 | ERROR | The ticket state is read **only** from `_specs/<ticket>/ticket.md > state`. Working the state out from which files exist, or from what they say, is not allowed. |
| TS-2 | ERROR | `ticket.md` exists and its front-matter has every required field (`ticket, title, mode, state, status, owner, created_at, updated_at`). |
| TS-3 | ERROR | `ticket.md > state` is one of the official states; `ticket.md > status` is `active` or `blocked`. |
| TS-4 | ERROR | A move updates `ticket.md` (`state`, `updated_at`) — the one place the state is written. |
| TS-5 | WARN  | `ticket.md > mode` and `owner` match what the artifacts say (`ticket.md` is the source of truth; the artifacts copy it). |

### ST — State machine
> The "current state" in every ST rule is `_specs/<ticket>/ticket.md > state` (TS-1).

| Code | Severity | Condition |
|------|----------|-----------|
| ST-1 | ERROR | The current ticket state (`ticket.md > state`) is one of the official states (`project-config.yaml > lifecycle.states`). |
| ST-2 | ERROR | A state **change** must go to a state listed in `allowed[current]`. A command that does **not** change the state (running it again with no effect, a `/plan` rewrite, a `/research` refresh, a `/implement` resume or stop) is exempt — it adds history without moving the state. Anything else is not allowed. |
| ST-3 | ERROR | No stage moves forward while `ticket.md > status: blocked`. The ticket must be unblocked first (for example, a `/implement` resume sets `status: active` again). |
| ST-4 | ERROR | No move may start from `closed` (it is the end). |
| ST-5 | ERROR | You can only reach `implementation-in-progress` from `approved` (starting the work) or from `implemented` / `verified` (rework after a failed `/verify`). There is no other way in. |

### MO — The workflow form (one form, the same for everyone)
> There are no modes and no risk levels (ADR-011): one workflow form for every
> ticket, with the same safeguards. A single owner runs their own gates; the
> comprehension gate (CG-*) is what keeps that honest.
> Source of truth: `project-config.yaml > workflow_form`.

| Code | Severity | Condition |
|------|----------|-----------|
| MO-1 | ERROR | The one workflow form includes **all seven stages for every ticket** — there are no modes and no risk levels. `mode` keeps one old value (`standard`); `high_risk` and `fast` are invalid (ADR-011). Every stage applies to every ticket. |
| MO-2 | — | *Removed.* (Was about fast mode; fast mode is gone — ADR-011.) |
| MO-3 | — | *Removed.* (Was about risk levels; there are none — every change is treated the same, ADR-011.) |
| MO-4 | ERROR | The number of approvals needed before `/implement` is **1** (`workflow_form.approvals`) — the owner approving their own work, read from `review.md > Approvals`. |
| MO-5 | — | *Removed.* (There is no level that forces an ADR; ADRs are optional for every ticket — ADR-011.) |
| MO-6 | ERROR | Verification depth is **`all-ac` for every ticket** (`workflow_form.verification`): every acceptance criterion gets a result. There is no rollback-rehearsal level (ADR-011). |

### CMD — What each command needs before and after
The full list of what each command needs before and after is in
`command-architecture.md §1`. The checks below turn those into state checks (see
the "Which rules apply to which command" table).
| Code | Severity | Condition |
|------|----------|-----------|
| CMD-1 | ERROR | The state the command needs before it runs is the state the ticket is actually in. |
| CMD-2 | ERROR | After the command, the state is one of the states that command is allowed to end in. A command may have more than one possible result (for example `/review` → `approved`, `closed`, or `spec-complete`; `/verify` → `closed` or `implementation-in-progress`). |
| CMD-3 | ERROR | `/start-ticket` only: no workspace directory exists for that slug yet. (No branch is created or checked at start-ticket.) |

### GU — Safety rules
| Code | Severity | Condition |
|------|----------|-----------|
| GU-1 | ERROR | The stages that change nothing (`research`, `spec`, `plan`, `review`) left no diff outside `_specs/<ticket>/`. |
| GU-2 | ERROR | A `protected_paths` file is changed **only** inside an approved `/implement` stage, on the ticket branch, and only when `plan.md` lists it (CLAUDE.md calls this a full stop). There are no risk levels — the comprehension gate and this full stop are the only guards (ADR-011). |
| GU-3 | ERROR | A command writes only inside `_specs/<ticket>/` (and, for `/implement`, the approved files on branch `ticket/<slug>`). |
| GU-4 | ERROR | Branches are only ever created by the command that starts implementation (after the state is `approved`), named `ticket/<slug>`, from a clean `develop`. `/start-ticket` must NOT create a branch, and no branch may exist for a ticket that is not approved yet. |

### RS — The research file (`/research`)
| Code | Severity | Condition |
|------|----------|-----------|
| RS-1 | ERROR | `research.md` lists the directories that matter. |
| RS-2 | ERROR | `research.md` lists the config files that matter. |
| RS-3 | ERROR | `research.md` lists the services that might be affected and the test/validation commands that exist. |
| RS-4 | ERROR | `research.md` writes down the risks and the unknowns. |
| RS-5 | ERROR | `research.md` writes down the open questions, each with a fixed id (`OQ-n`) — the ids that `spec.md` answers under SP-9 (ADR-015). Tickets closed before ADR-015 keep their unnumbered lists; they are not rewritten. |
| RS-6 | ERROR | When it succeeds, `/research` updates `ticket.md` exactly once (TS-4): state `draft → ready-for-research`, refresh `updated_at`, add one history entry. It writes only `ticket.md` and `research.md`; looking through the repo changes nothing. |
| RS-7 | ERROR | Before it runs: the state is `draft` and the `intake.md` Readiness Status is `READY`. |
| RS-8 | ERROR | **All or nothing:** if any check fails, `/research` writes nothing — not `ticket.md` and not `research.md`. |

### SP — The spec file (`/spec`)
| Code | Severity | Condition |
|------|----------|-----------|
| SP-1 | ERROR | `spec.md` states a Business Goal and a User Story. |
| SP-2 | ERROR | `spec.md` lists Functional Requirements and Non-Functional Requirements (plus Constraints). |
| SP-3 | ERROR | The acceptance criteria have fixed ids (`AC-n`) and each one links to a requirement (this goes with TR-1). |
| SP-4 | ERROR | `spec.md` has **no implementation detail** — no file paths, no code, no approach or steps. (Planning the implementation is `/plan`'s job.) |
| SP-5 | ERROR | `spec.md` says what is Out of Scope. |
| SP-6 | ERROR | When it succeeds, `/spec` updates `ticket.md` exactly once (TS-4): `state → research-complete`, refresh `updated_at`, add one history entry. It writes only `ticket.md` and `spec.md`. |
| SP-7 | ERROR | Before it runs: `research.md` exists and meets RS-1..RS-5, and the state is `ready-for-research`. |
| SP-8 | ERROR | **All or nothing:** if any check fails, `/spec` writes nothing — not `ticket.md` and not `spec.md`. |
| SP-9 | ERROR | **Every `OQ-n` in `research.md` is dealt with in `spec.md`** (ADR-015), under **Research Questions Resolved**, in one of two ways: *answered* — the answer plus where it ends up (a requirement, an `AC-n`, a constraint, or Out of Scope); or *pushed back* — the answer needs the approach first, so it is repeated under `spec.md > Open Questions` with the same id for `/plan` to answer (PL-12). An `OQ-n` that appears nowhere in `spec.md` is an ERROR. **An answer given in conversation does not count** — only what is written in the file counts (ADR-003). Writing the answer down is not implementation detail and does not break SP-4: state the scope decision, never the file paths or the approach. |

### PL — The plan file (`/plan`)
| Code | Severity | Condition |
|------|----------|-----------|
| PL-1 | ERROR | `plan.md` states an Approach. |
| PL-2 | ERROR | `plan.md` lists Steps. |
| PL-3 | ERROR | `plan.md` lists the Files to change. |
| PL-4 | ERROR | `plan.md` states a Validation strategy and a Rollback. |
| PL-5 | ERROR | `plan.md` says what is Out of scope. |
| PL-6 | ERROR | When it succeeds, `/plan` updates `ticket.md` exactly once (TS-4): *first run* `research-complete → spec-complete` (history `spec-validated`); *rewrite* stays at `spec-complete` (history `plan-revised`, and `status: blocked` is set back to `active`). Refresh `updated_at`. It writes only `plan.md` and `ticket.md`. |
| PL-7 | ERROR | Before it runs (exactly one way in), with `spec.md` meeting SP-1..SP-5 + TR-1: *first run* state = `research-complete`; OR *rewrite* state = `spec-complete` AND `review.md` Decision = `CHANGES_REQUESTED`. |
| PL-8 | ERROR | **All or nothing:** if any check fails, `/plan` writes nothing — not `ticket.md` and not `plan.md`. |
| PL-9 | ERROR | `/plan` does **not** approve the implementation (no move to `approved`) and does **not** create a branch. |
| PL-10 | ERROR | A rewrite must deal with `review.md > Required Follow-up Actions` in the new `plan.md`. |
| PL-11 | ERROR | `plan.md` states an **Integration surface** (ADR-014): the components, flows, and shared config this change touches; who else depends on them; where this ticket's flow overlaps another use case; and what breaks if that is wrong. `none — self-contained` is a valid answer only when it is stated openly with its reason. This is the section CG-5 takes its integration question from. |
| PL-12 | ERROR | **Every `OQ-n` that `spec.md > Open Questions` pushed back is answered in `plan.md`** (ADR-015), naming the id in the section that carries the answer (Approach, Files to change, Integration surface, or Out of scope). After `/plan`, no `OQ-n` is still open — that is what RV-3 checks before APPROVED. |

### RV — The review file (`/review`, a gate)
| Code | Severity | Condition |
|------|----------|-----------|
| RV-1 | ERROR | `review.md` exists (it is written for every decision). |
| RV-2 | ERROR | The decision is `APPROVED`, `CHANGES_REQUESTED`, or `REJECTED`. |
| RV-3 | ERROR | `APPROVED` needs `plan.md` to meet PL-1..PL-5 **+ PL-11** (Integration surface; ADR-014) **+ PL-12** (no `OQ-n` still open; ADR-015), and you must be able to trace each plan item back to a requirement or an AC. |
| RV-4 | ERROR | `APPROVED` updates `ticket.md` to `approved` (TS-4): `spec-complete → plan-complete → approved`, refresh `updated_at`, add the history entries (`plan-validated`, `plan-approved`). |
| RV-5 | — | *Removed.* (There is no two-approver level; the owner approves their own work — ADR-011. What keeps it honest is the comprehension gate, CG-*.) |
| RV-6 | — | *Removed.* (There is no level that forces an ADR; ADRs are optional — ADR-011.) |
| RV-7 | ERROR | `CHANGES_REQUESTED` and `REJECTED` must **not** move the ticket to `approved`. `CHANGES_REQUESTED` keeps `state = spec-complete`; `REJECTED` moves it to `closed` (RV-10). |
| RV-8 | ERROR | **All or nothing:** if a required check fails, nothing is written — not `review.md` and not `ticket.md`. |
| RV-9 | ERROR | `/review` never creates a branch and implements nothing. |
| RV-10 | ERROR | `REJECTED` updates `ticket.md` (TS-4): `spec-complete → closed` (the end), refresh `updated_at`, add history (`plan-rejected`); the reasons for the rejection are written in `review.md`. No `/close` command is used. |

### IM — Implementation (`/implement`)
| Code | Severity | Condition |
|------|----------|-----------|
| IM-1 | ERROR | Before it runs (which way in): *first run* state = `approved` AND `review.md` Decision = APPROVED; OR *resume* state = `implementation-in-progress`. Any other state stops it. |
| IM-2 | ERROR | `plan.md` is complete (PL-1..PL-5) and its "Files to change" list is clear and leaves no doubt. |
| IM-3 | ERROR | *First run:* the `ticket/<slug>` branch is created here (GU-4), from a clean `develop`, only after approval; no branch exists yet. |
| IM-3a | ERROR | *Resume:* the `ticket/<slug>` branch already exists and is checked out; `/implement` must **not** create a second branch. |
| IM-4 | ERROR | The changes stay inside the files listed in `plan.md` "Files to change". **No unrelated file is changed** (no quiet extra work). |
| IM-5 | ERROR | A `protected_paths` file is changed only when the approved `plan.md` lists it under "Files to change", and only inside the `/implement` stage (GU-2). No risk level is involved (ADR-011). |
| IM-6 | ERROR | `implement.md` records the files changed, anything done differently from the plan, and the validation that was run. **No commit is made at `/implement`** (IM-9), so there are no commit ids to record — committing is the delivery step's job (PB-8). |
| IM-7 | ERROR | `state = implemented` requires **all** planned work to be done and the validation to be written down. On completion, update `ticket.md` (TS-4), refresh `updated_at`, and add history: *first run* `implementation-started` then `implementation-completed`; *resume* `implementation-resumed` then `implementation-completed`. |
| IM-8 | ERROR | **Stop when something is unsafe or unclear:** an unclear plan, extra work outside the plan, a dirty `develop`, a branch that already exists or does not match, or a `protected_paths` file that the approved `plan.md` does not list → make NO changes and report. |
| IM-9 | ERROR | `/implement` makes **no commit** and never pushes; the changes stay as uncommitted edits in the working tree on the local `ticket/<slug>` branch (the one commit that gets published is made later by `/publish-pr`, PB-8). It never moves the state past `implemented`. |
| IM-10 | ERROR | **Stopped is a valid result, but not a finished one:** if the work cannot go on, keep `state = implementation-in-progress`, set `status: blocked`, and have `implement.md` record why it stopped, what was changed so far, what to do next, and whether the plan has to be rewritten. Do **not** set `implemented`. |

### VF — Verification (`/verify`, a gate)
| Code | Severity | Condition |
|------|----------|-----------|
| VF-1 | ERROR | `verify.md` exists (it is written for both PASSED and FAILED). |
| VF-2 | ERROR | **AC coverage:** every acceptance criterion (`AC-n`) in `spec.md` has a result that was actually produced in `verify.md` (TR-2). |
| VF-3 | ERROR | **Evidence:** `implement.md` records the files that changed (and any validation that was run); `PASSED` needs every AC result to pass. Because `/implement` makes no commit (IM-9), commit ids are **not** required as evidence — having no commit is expected, not a failure. |
| VF-10 | ERROR | `/verify` makes **no commit** (AC-6); checking is read-only, and committing belongs only to the delivery step (PB-8). |
| VF-4 | ERROR | Verification depth is **`all-ac`** for every ticket (MO-6): every AC gets a result. No risk levels, no rollback-rehearsal level (ADR-011). |
| VF-5 | ERROR | **PASSED closes the ticket (TS-4):** `implemented → verified → closed`, refresh `updated_at`, add history (`verification-passed`, `ticket-closed`). |
| VF-6 | ERROR | **FAILED stops the ticket (TS-4):** `implemented → implementation-in-progress`, `status: blocked`, add history (`verification-failed`); the ticket is **not** closed, and the failures are written down in `verify.md`. |
| VF-7 | ERROR | `/verify` does **not** change implementation files; it writes only `verify.md` and `ticket.md` (checking is read-only). |
| VF-8 | ERROR | **All or nothing:** if a check before it fails, `/verify` writes nothing. |
| VF-9 | ERROR | `verify.md` records the protected-path statement, yes or no (TR-3). |

### CU — ClickUp intake (`/start-ticket`, optional, read-only)
| Code | Severity | Condition |
|------|----------|-----------|
| CU-1 | ERROR | If a `clickup_id` is given, `CLICKUP_API_TOKEN` must be set in the environment. |
| CU-2 | ERROR | The read-only fetch (`scripts/clickup_intake.py <id>`) must work (the task exists, you are allowed to see it, and it can be reached). |
| CU-3 | ERROR | ClickUp access is **read-only** — only a `GET` is sent; nothing is written (no POST/PUT/DELETE), no status or comment is changed, and no task is created or closed. |
| CU-4 | ERROR | **All or nothing:** if a `clickup_id` is given and CU-1 or CU-2 fails, `/start-ticket` writes nothing (no workspace is created). |
| CU-5 | ERROR | ClickUp only supplies `title`, `description`, and `url`; `ticket.md` still owns the workflow state (no state comes from ClickUp). |

### VP — Validation profiles (chosen at `/plan`, run at `/verify`; WF-PILOT-003)
> These apply only when a ticket's `plan.md` Validation strategy names a
> validation profile. There are two **separate** things in
> `project-config.yaml`: `validation_checks` (the definitions — the commands) and
> `validation_profiles` (the selection — check ids only). Commands run **locally
> and from the config**: no GitHub, CI/CD, MCP, or outside runner. Who owns the
> state does not change (ADR-003): profiles, checks, and results are config and
> records, never workflow state. Decision: ADR-006.

| Code | Severity | Condition |
|------|----------|-----------|
| VP-1 | ERROR | If `plan.md` names a profile, that profile exists in `project-config.yaml > validation_profiles` and **every** check it needs is defined in `validation_checks`. (Checked at `/plan` and at `/verify`.) |
| VP-2 | ERROR | The validation commands do not change any implementation file — running them leaves the working tree as it was (this backs up VF-7). |
| VP-3 | ERROR | The validation commands give the same result every time and never ask a question (no prompts, no human input). |
| VP-4 | ERROR | **Keep the two things apart:** profiles name only check ids; the commands live **only** in `validation_checks`. A profile that contains a command is invalid. |
| VP-5 | ERROR | **Nothing changes when no profile is used:** when no profile is named, `/verify` runs no profile path and behaves exactly as before (using a profile is opt-in). |

### RA — Who may run what (single owner; no split of duties)
| Code | Severity | Condition |
|------|----------|-----------|
| RA-1 | ERROR | The gate commands (`/review`, `/verify`) are run by the **ticket owner** themselves (`project-config.yaml > role_authority.gate_commands`). No separate reviewer is needed (ADR-011). The workflow never needs an Engineering Manager to take part. |
| RA-2 | ERROR | Every person recorded (`owner`, and `by` in the history) is one of the defined roles: `workflow_owner`, `reviewer`, `developer`, `ai_agent` (or a named person mapped to one of them). The old `em` maps to `reviewer` (at a gate) and `workflow_owner` (for governance). |
| RA-3 | — | *Removed.* (There is no split of duties — the owner runs their own gates, ADR-011. What stops approval without reading is the comprehension gate, CG-1..CG-6.) |

### CG — Comprehension gate (`/review`, `/verify`; every gate — ADR-011, ADR-014)
> With a single owner there is no second reviewer, so the gate is kept honest by
> a comprehension check: the owner answers questions taken FROM the file being
> reviewed before the gate records its decision. It is the **only** thing that
> can block a gate — so it has to cover the risky areas, not just the easy ones
> inside a single file (ADR-014). Source of truth:
> `project-config.yaml > comprehension_gates`.

| Code | Severity | Condition |
|------|----------|-----------|
| CG-1 | ERROR | A gate (`/review`, `/verify`) may not record its decision (APPROVED / PASSED) until `_specs/<ticket>/comprehension.md` exists with **all** the questions for that stage answered (no blank answers). The number is a **minimum, not a fixed count**: at least `comprehension_gates.questions_min`, plus any question CG-5 or CG-6 requires. Asking more than the minimum is always fine; asking fewer is an ERROR. |
| CG-2 | ERROR | The questions come **from the file being reviewed** (`/review`: `plan.md` + `spec.md`; `/verify`: `implement.md` + `spec.md`) — about its acceptance criteria, its files, its **integration surface**, its rollback, its risks. They must be specific, not generic. Each one is **multiple choice** with **at least 4** answers (one correct plus at least 3 wrong ones that still look believable), all taken from the file (`comprehension_gates.options_min`). Record the answer chosen, where the question came from (a section of the file, an `AC-n`, or a panel finding), and whether it was correct. |
| CG-3 | ERROR | The comprehension gate is **required at every gate for every ticket** (`comprehension_gates.required: always`); it is what takes the place of a second reviewer. Writes to `comprehension.md` stay inside `_specs/<ticket>/` (GU-3). |
| CG-4 | ERROR | **You pass only with 100% correct (`comprehension_gates.pass_threshold: 1.0`).** The gate records APPROVED / PASSED **only if every answer is correct**. One wrong answer blocks the gate: it records no decision and does not move `ticket.md` (all or nothing, like RV-8 and VF-8); it reports which questions were wrong, and the owner re-reads the file and runs the command again. |
| CG-5 | ERROR | **One integration question is required (`comprehension_gates.integration_question: required`; ADR-014).** At least one question per gate is about **integration and cross-flow effects** — what this change touches outside itself, which other component or use-case flow shares that code, config, or interface, what has to happen in a set order or at the same time, and what breaks if the assumption is wrong. Where it comes from: at `/review`, `plan.md > Integration surface` (PL-11) plus `spec.md` (plus the panel findings); at `/verify`, `implement.md` plus `spec.md` plus the plan's Integration surface. A plan that says `none — self-contained` still gets asked *why* it is self-contained. This question counts towards the CG-1 minimum. |
| CG-6 | ERROR | **Questions added by panel findings (ADR-014).** When the panel ran (RP-1), **every** finding at severity `comprehension_gates.panel_question_severity` (`major`) adds **one more** question **on top of** the CG-1 minimum, recorded with that finding as its source. `minor` and `info` findings add none. This does **not** give a reviewer a way to block (RP-2): the owner may still dismiss the finding in `review.md` — but they must first show they understood it. What blocks the gate is a wrong answer, never the finding itself. |

### RP — Advisory review panel (`/review`; ADR-012)
> AI reviewers (senior / security / performance) that **help** the single owner
> at `/review`. They inform the decision; they never make it. This does **not**
> bring back a split of duties (ADR-011) — the panel only advises, and the
> comprehension gate (CG-*) is still what keeps the gate honest. Source of truth:
> `project-config.yaml > review_panel`. These rules apply only when
> `review_panel.enabled` is true.

| Code | Severity | Condition |
|------|----------|-----------|
| RP-1 | ERROR | When `review_panel.enabled` is true, `/review` runs **every** reviewer in `review_panel.lenses` (each a read-only subagent in `.claude/agents/`) and records their findings in the **Panel Findings** section of `review.md`. When it is disabled, `/review` runs no panel at all (opt-in; it behaves exactly as before). |
| RP-2 | ERROR | **Advice only (`review_panel.advisory: true`):** a panel finding **never** blocks a decision or forces one. APPROVED is gated only by the comprehension check (CG-*) and RV-3 — never by what the panel said. A `major` finding is shown, not enforced; under CG-6 it also **adds a comprehension question**, which makes the owner understand it, not act on it — dismissing it in `review.md` is still allowed. No reviewer can block (ADR-014 does not change this). |
| RP-3 | ERROR | The panel subagents are **read-only**: they may read `plan.md` and `spec.md` (and the context they point to), and the security reviewer may also look up public advisories on the web, but they produce **no** change in the working tree outside `review.md` (this backs up GU-1). |
| RP-4 | ERROR | **Order:** the panel runs only **after** the Step 1 checks pass and **before** the comprehension check (Step 1a → Step 1b). It is never run on a plan that failed its checks, and it never gates or comes before those checks. |

### NT — Gate notifications (local hook; ADR-013)
> A reliable notice on every gate decision, sent by a local PostToolUse hook
> (`.claude/hooks/notify_gate.py`) that fires when `comprehension.md` is written.
> It reuses the existing Alertmanager Telegram bot (token and chat come from a
> gitignored local config file or from the environment, never from a committed
> file). Sending the notice is the **harness's** job (the hook), not something the
> AI has to remember — the same pattern as ClickUp and GitHub (ADR-005/007).
> Source of truth: `project-config.yaml > notifications`. Applies only when
> `notifications.enabled` is true.

| Code | Severity | Condition |
|------|----------|-----------|
| NT-1 | ERROR | Only the local hook sends the notice; **no command contains the HTTP call** (the I/O stays in one place). Commands write the file; the harness runs the hook. |
| NT-2 | ERROR | The hook is **one-way** (workflow → channel): it reads the artifacts plus config or environment, and sends. It **never** writes `ticket.md`, never changes the workflow state, and never edits a `protected_paths` file (it only reuses the bot's credentials — the same idea as PB-4). |
| NT-3 | ERROR | What happens when sending fails is set by `notifications.enforcement`: `warn` (the default) logs it and the gate still **completes** (hook exit 0); `block` **fails** the gate (hook exit 2). If it is not configured at all (no token or chat), it always lets the gate through — missing credentials must never freeze a gate. |

### TR — Tracing
| Code | Severity | Condition |
|------|----------|-----------|
| TR-1 | ERROR | Every acceptance criterion in `spec.md` has a fixed id (`AC-n`). |
| TR-2 | ERROR | Every `AC-n` appears in `verify.md` with a recorded result. |
| TR-3 | ERROR | `verify.md` contains the protected-path statement, yes or no. |

### CL — Closing a ticket
| Code | Severity | Condition |
|------|----------|-----------|
| CL-1 | ERROR | `verified → closed` happens only at the `/verify` sign-off, by the reviewer. |
| CL-2 | ERROR | There is no `/close` command; closing a ticket anywhere other than `/verify` is invalid. |

### PB — Publishing a GitHub PR (`/publish-pr`, delivery; wf-004)
> `/publish-pr` is an **extra delivery command that sits outside the state
> machine** — it is not one of the seven stages and it moves the state nowhere.
> GitHub is only a place to deliver the work; `ticket.md` stays the source of
> truth (ADR-003). Decision: ADR-007. All `git` and `gh` code lives only in
> `scripts/github_publish.py` (the ADR-005 pattern).

| Code | Severity | Condition |
|------|----------|-----------|
| PB-1 | ERROR | Before it runs: `ticket.md > state` is `verified` or `closed`. You may publish only after `/verify` has passed. |
| PB-2 | ERROR | The `ticket/<slug>` branch exists before you publish. |
| PB-3 | ERROR | `/publish-pr` moves the state **nowhere**: `ticket.md > state` is unchanged; it writes **only** `links.github` (AC-6). |
| PB-4 | ERROR | `/publish-pr` adds **no** state-history entry and reads **no** GitHub information (status, review, comment, check, merge) back into the workflow — it is one-way, workflow → GitHub (AC-7). |
| PB-5 | ERROR | **All or nothing:** if a check fails, or the helper exits with a non-zero code, nothing is written — `ticket.md` is left as it was. |
| PB-6 | ERROR | **Fails safely (AC-9):** when `gh` is missing or not logged in, the helper stops (GH-1/GH-2) with **no commit**, no push, no PR, and no change to `ticket.md`. |
| PB-7 | ERROR | The `git` work (staging, committing, pushing) and the `gh` work (the PR) live **only** in `scripts/github_publish.py` (the command contains none of it); the PR title and body are built from the workflow files (AC-3/AC-4). |
| PB-8 | ERROR | `/publish-pr` is the **single place where git work happens**: it stages and makes the one commit to publish on `ticket/<slug>` (when there are uncommitted changes) **before** pushing and opening the PR. No other command makes a commit (IM-9, VF-10). |
| PB-9 | ERROR | The commit and the PR include everything that should be published (AC-8): the implementation changes plus `implement.md`, `verify.md`, and the closing update to `ticket.md`. Staging covers only the implemented source (per `plan.md`) and `_specs/<slug>/`; no unrelated path is staged (GU-3). |

### NS — Telling the user what comes next (every command; wf-005)
> This is for usability: every command tells the person what to do next. It is
> **display only** — it comes from the §2 state machine (defined in
> `project-config.yaml > lifecycle`) and never changes or owns any state
> (ADR-003). The fields are defined in `command-architecture.md §6`. Decision:
> ADR-008.

| Code | Severity | Condition |
|------|----------|-----------|
| NS-1 | ERROR | Every command — all seven stages **and** `/publish-pr` — prints next-step guidance when it finishes (AC-1). |
| NS-2 | ERROR | The guidance names all five fields: the current workflow state; the next command you may run; the manual actions that are required; the optional actions; and, when it applies, that the state is the end (AC-2). |
| NS-3 | ERROR | When the command **stopped** (`status: blocked`, for example `/implement` stopping or `/verify` FAILED), the required-actions field says exactly what has to be done before the workflow can go on (AC-3) — not a generic message. |
| NS-4 | ERROR | When the ticket **ended** (`closed`), the guidance sets the next command to `none` and says that no further workflow action is needed (AC-4). |
| NS-5 | WARN  | The wording and shape of the guidance are the same across all commands and agree with the official state machine (usability). |

## Which rules apply to which command

Every command except `/start-ticket` begins by reading `ticket.md`
(TS-1..TS-3) and ends by writing the move to `ticket.md` (TS-4).
`/start-ticket` **creates** `ticket.md` with `state: draft`. Every command
enforces **RA-1/RA-2** (who may run it). The gates `/review` and `/verify` also
run the **comprehension gate (CG-1..CG-6)** before recording a decision (CG-6
applies only where the panel ran — `/review`). Every command also prints
next-step guidance when it finishes (**NS-1..NS-4**), so that is not repeated in
each row below.

| Command        | Rules before it acts                        | Rules after it acts                     |
|----------------|---------------------------------------------|-----------------------------------------|
| `/start-ticket`| FM-3, FM-5, CMD-3, GU-4, MO-1, CU-1..CU-5 (with a `clickup_id`) | TS-2/3/4, FM-1..FM-8, ST-1, CMD-2 |
| `/research`    | TS-1/2/3, FM-*, ST-1, ST-2, MO-1, CMD-1, RS-7, RS-8 | RS-1..RS-6, TS-4, FM-*, GU-1, GU-3, CMD-2 (state → ready-for-research) |
| `/spec`        | TS-1/2/3, FM-*, ST-1, ST-2, MO-1, CMD-1, SP-7 (RS-1..RS-5), SP-8 | SP-1..SP-6, SP-9, TR-1, TS-4, FM-*, GU-1, GU-3, CMD-2 (state → research-complete) |
| `/plan`        | TS-1/2/3, FM-*, ST-1, ST-2, MO-1, CMD-1, PL-7, PL-8, VP-1/VP-4 (when a profile is named) | PL-1..PL-6, PL-9, PL-10 (rewrite), PL-11, PL-12, TS-4, FM-*, GU-1, GU-3, CMD-2 (state stays at / moves to spec-complete) |
| `/review`      | TS-1/2/3, FM-*, ST-1, ST-2, CMD-1, RV-2, RV-8, RP-4, CG-1..CG-6 | RP-1..RP-3 (when `review_panel.enabled`), RV-1, RV-3, RV-4, RV-7, RV-9, RV-10, TS-4 (APPROVED → approved; REJECTED → closed), FM-*, GU-1, GU-3, CMD-2 |
| `/implement`   | TS-1/2/3, FM-*, ST-2, ST-5, MO-4, CMD-1, IM-1, IM-2, IM-8 | IM-3 or IM-3a, IM-4, IM-5, IM-6, IM-9, then IM-7 (finished → `implemented`) **or** IM-10 (stopped → `implementation-in-progress` + `status: blocked`), TS-4, FM-*, GU-2, GU-3, CMD-2 |
| `/verify`      | TS-1/2/3, FM-*, ST-2, MO-6, CMD-1, VF-8, CG-1..CG-5 (CG-6 does not apply — no panel at `/verify`), VP-1 (when a profile is named) | VF-1..VF-4, VF-7, VF-9, VF-10, VP-2..VP-5 (when a profile is named), then VF-5 (PASSED → closed) or VF-6 (FAILED → implementation-in-progress + blocked), TR-2, TR-3, CL-1, TS-4, FM-*, GU-3, CMD-2 |
| `/publish-pr`  | TS-1/2/3, RA-1/RA-2, PB-1, PB-2, PB-6 | PB-3, PB-4, PB-5, PB-7, PB-8, PB-9, GU-3 (the commit stages the implemented source plus `_specs/<slug>/`; the only workflow **state** field written is still `ticket.md > links.github`, plus the push to `origin`); **no** TS-4 move |

## How the error codes work

- The codes are fixed names (`FM-1`, `ST-2`, …) so that command output and logs
  are easy to search and stay the same everywhere.
- A command reports the **first** `ERROR` in each group, plus all the `WARN`s.

## Not part of this file

- No checking code, scripts, hooks, or commands are built here.
- No `protected_paths` runtime file is changed.
