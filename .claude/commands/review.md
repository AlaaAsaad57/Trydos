---
description: The review gate — check plan.md, record APPROVED/CHANGES_REQUESTED/REJECTED, and move to approved only when APPROVED. No branches, no implementation. All or nothing on failure.
argument-hint: <slug> <APPROVED|CHANGES_REQUESTED|REJECTED> "<rationale>"
allowed-tools: Read, Grep, Glob, Write, AskUserQuestion, Task
---

# /review

The review gate for ticket `<slug>`. Check the plan, record the decision in
`_specs/<slug>/review.md`, and **only when the decision is APPROVED** move the
ticket `spec-complete → plan-complete → approved`.

**This command does NOT create a branch and does NOT implement anything.**

**Say what matters — do not over-react and do not over-build.** Report only real
risks, real bugs, and real gaps (an AC with no step behind it, a missing
rollback, a protected-path change the plan does not list). Do not fill the review
with edge cases that might never happen, style preferences, "we could also
add…" ideas, or demands for extra layers, tests, or hardening the spec never
asked for. A short review with zero findings is a good, valid result — never
invent findings to look thorough.

**All or nothing:** run the checks first. If a required check fails, write
**nothing** — not `review.md` and not `ticket.md`.

**Write in plain English.** Everything this command produces — every section of
`review.md`, every comprehension question and answer option, and the report it
prints — must be easy to read: short sentences, everyday words, no jargon where a
plain word works. A comprehension question must test whether the owner
understands the plan, not whether they can decode the wording; if a question
needs a hard term, use it and explain it in the same sentence. Keep exact
technical names (rule codes, state names, `AC-n` ids, file paths, front-matter
keys) as they are. See `.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/review`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Workflow form and comprehension gate: `.claude/project-config.yaml >
  workflow_form` / `> comprehension_gates`. Who owns the state: ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`.
- `decision` (required) — `APPROVED | CHANGES_REQUESTED | REJECTED` (RV-2).
- `rationale` (required) — the reason for the decision.
If any required input is missing, ask once.

## Step 1 — Check (stop if a required check fails and write nothing — RV-8)

Read `_specs/<slug>/ticket.md`, `spec.md`, and `plan.md`, then use:
- **RA-1** — this gate is run by the ticket **owner** themselves (reviewing your
  own work is expected here; ADR-011). No second reviewer is needed, and there is
  **no** RA-3 separation-of-duties check.
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state` from it.
- **CMD-1 / ST-2** — `state` must be `spec-complete`. In any other case, stop.
- **RV-2** — the decision is one of the three allowed values.
- For **APPROVED** only:
  - **RV-3** — `plan.md` exists and meets **PL-1..PL-5 + PL-11** (a real
    **Integration surface**; ADR-014) **+ PL-12** (no `OQ-n` from `research.md` is
    still open — each one is answered in `spec.md` or `plan.md`; ADR-015), and you
    can trace each plan item back to a requirement or an AC. If not, stop.

If a required check fails, stop and report the rule code and the message. **Write
nothing.**

## Step 1a — Advisory review panel (RP-1..RP-4)

This runs only after Step 1 passes, and **before** the comprehension check
(RP-4). If `project-config.yaml > review_panel.enabled` is false, skip this step.

1. Start every reviewer in `review_panel.lenses` **at the same time**, each one a
   read-only subagent (RP-3), and give it the ticket slug so it can read
   `_specs/<slug>/plan.md` and `spec.md`:
   - `senior` → `senior-reviewer` · `security` → `security-reviewer` ·
     `performance` → `performance-reviewer` (in `.claude/agents/`).
   The security reviewer also looks up **publicly known vulnerabilities** for the
   package versions in `package.json` that this ticket touches. It may search the
   web for advisories; that is still read-only and changes no file (RP-3).
2. Collect each reviewer's list of findings.
3. Write them into the **Panel Findings** section of `review.md` (Step 2): one
   row per finding — which reviewer, the severity, the finding, where it comes
   from in the plan or spec, and what the owner decided to do about it (accept /
   fix / dismiss, with a one-line reason).
4. **Advice only (RP-2):** the panel **never** blocks the decision. Even a
   `major` finding does not force CHANGES_REQUESTED — it is shown to the owner to
   weigh up. APPROVED stays the owner's call, and the only thing that can stop it
   is the comprehension check (CG-*), never the panel's output.
5. **But you cannot simply ignore a `major` finding (CG-6, ADR-014):** each one
   adds an extra comprehension question in Step 1b. The owner may still dismiss
   it — after showing they understood it. Carry the `major` findings forward.

Show the findings to the owner before Step 1b, so they can inform the decision.

## Step 1b — Comprehension check (CG-1..CG-6)

There is no second reviewer at this gate, so the owner has to show they
understand the plan before they decide:
1. Write multiple-choice questions **taken from `plan.md` and `spec.md`** (the
   acceptance criteria, the "Files to change" list, the **Integration surface**,
   the rollback, the risks) — specific, not generic (CG-2). Each question offers
   **at least 4 answers** taken from those files: one correct answer plus at
   least 3 wrong ones that still look believable. **Sort each question's answers
   in alphabetical order** — the position of the correct answer must give nothing
   away (never put it first out of habit).
   **Write every question, every answer, and the recorded result in English** —
   the language of the conversation never changes the language of the gate
   (CLAUDE.md).

   **How many (CG-1):** `comprehension_gates.questions_min` (3) is a **minimum,
   not a fixed number** — ask more whenever the plan calls for it. On top of that
   minimum:
   - **CG-5 — one integration question is required (at least 1, and it counts
     towards the minimum):** about what this change touches outside itself — which
     other component or use-case flow shares that code, config, interface,
     metric, or file path; what has to happen in a set order or at the same time;
     and what breaks if the assumption is wrong. Take it from `plan.md >
     Integration surface` (PL-11) and the Step 1a findings. If the plan says
     `none — self-contained`, ask *why* it is self-contained.
   - **CG-6 — one extra question for each `major` panel finding, on top of the
     minimum.** Two `major` findings means at least 5 questions; `minor` and
     `info` findings add none. This is **not** a way to block the plan (RP-2):
     the owner may still dismiss the finding in `review.md`, but only after
     showing they understood it.
2. Ask them with `AskUserQuestion`; the owner picks one answer per question.
3. Write down, under the **review** section of `_specs/<slug>/comprehension.md`
   (create it from `_specs/_templates/comprehension.md` if it does not exist):
   each question, its answers, where it came from (`plan.md` section / `AC-n` /
   `panel:<lens>`), the answer the owner picked, and whether it was correct. Set
   the front-matter (the notification hook reads it — ADR-013): `stage: review`,
   `result: passed|failed`, `score: <correct>/<total>`, `decision:` = the gate
   decision when the quiz passed and `none` when it failed, and `missed:` = the
   questions that were wrong plus their topic on a failed quiz (for example
   `Q2 (integration)`), left empty when it passed.
4. **You pass only with 100% correct (CG-4).** If **any** answer is wrong, record
   **no** decision and leave `ticket.md` untouched (all or nothing); report which
   questions were wrong and stop — the owner re-reads the plan and runs `/review`
   again. Record the decision only when every answer is correct.

This is what takes the place of a second reviewer (CG-1).

## Step 2 — Write review.md (RV-1)

Read `_specs/_templates/review.md` and write `_specs/<slug>/review.md`:
- Front-matter: `ticket: <slug>`, `stage: review`, `mode: <ticket.md mode>`,
  `status: complete`, `owner: reviewer`, `updated: <today YYYY-MM-DD>`, `links`.
- Fill in: Review Scope, Plan Summary, Risks, Assumptions, Open Questions,
  **Panel Findings** (the panel's findings from Step 1a plus what the owner
  decided about each one; RP-1), **Decision** (the chosen value and the reason),
  **Approvals** (the owner's own single approval), **ADR reference** (optional;
  `none` if you did not use one), and Required Follow-up Actions.

## Step 3 — Apply the decision

**If APPROVED** — update `_specs/<slug>/ticket.md` (TS-4 / RV-4):
- `state: approved`, `updated_at: <today>`.
- Add two state-history entries:
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

**If CHANGES_REQUESTED** (RV-7) — do **not** move to `approved`. Keep
`ticket.md > state` at `spec-complete`. You may set `status: blocked` if the
follow-up work needs it. (No state-history entry for a move.)

**If REJECTED** (RV-7 / RV-10) — do **not** move to `approved`. Write the reasons
for the rejection in `review.md`, then update `_specs/<slug>/ticket.md` (TS-4):
- `state: closed` (the end), `updated_at: <today>`.
- Add one state-history entry:
  ```yaml
  - state: closed
    event: plan-rejected
    by: reviewer
    timestamp: <today>
  ```
This closes the ticket without any `/close` command. `closed` is the end — to
pick the work up again, open a new ticket.

## Checks after you write

- **RV-1** `review.md` written. **RV-2** the decision is valid.
- **RP-1** the panel ran (if it is enabled) and its findings are in `review.md`;
  **RP-2** no decision was blocked by what the panel said.
- APPROVED: **RV-3** the plan was checked (including **PL-11** and **PL-12**) ·
  **CG-1** the comprehension record has at least the minimum number of questions ·
  **CG-5** an integration question was asked · **CG-6** one question per `major`
  panel finding · **RV-4 / TS-4** `state = approved` with the `plan-validated`
  and `plan-approved` history entries · **CMD-2** state = `approved`.
- CHANGES_REQUESTED: **RV-7** the state is still `spec-complete`.
- REJECTED: **RV-7 / RV-10** the state went `spec-complete → closed` (the end)
  with a `plan-rejected` history entry, and the reasons are in `review.md`.
- **RV-9** no branch was created; nothing was implemented.
- **FM-1..FM-8** the front-matter of `review.md` is valid; **GU-1 / GU-3** you
  wrote only `review.md` (plus `ticket.md` on APPROVED or REJECTED).

## MUST NOT

- Do **not** move to `approved` for CHANGES_REQUESTED or REJECTED (RV-7).
- Do **not** create a git branch (RV-9 / GU-4) and do **not** implement anything.
- Do **not** record any decision before the comprehension check is finished
  (CG-1).
- Do **not** treat `questions_min` as a maximum (CG-1), do **not** skip the
  integration question (CG-5), and do **not** drop the extra question a `major`
  finding adds (CG-6).
- Do **not** let the panel block or make the decision: it never gates APPROVED
  and never runs before the Step 1 checks (RP-2 / RP-4). The panel subagents are
  read-only — they must change no file except through `review.md` (RP-3 / GU-1).
- Do **not** change source code or any `protected_paths` file.
- Do **not** write only part of the work: if Step 1 fails, nothing is written
  (RV-8).

## Report

Say which decision you recorded, what state and history `ticket.md` now has, and
what comes next:
- APPROVED → `approved`; next: `/implement` (which creates the branch).
- CHANGES_REQUESTED → stays at `spec-complete`; next: rewrite the plan with
  `/plan`, then `/review` again.
- REJECTED → `closed` (the end); the ticket is finished — open a new ticket to
  pick the work up again.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`) for the decision you
recorded:

- **APPROVED:**
  - **Current state:** `approved`
  - **Next command:** `/implement <slug>` (the author; it creates the branch)
  - **Required actions:** none
  - **Optional actions:** none
  - **Terminal?** no
- **CHANGES_REQUESTED:**
  - **Current state:** `spec-complete` (plus `status: blocked` if you set it)
  - **Next command:** `/plan <slug>` (rewrite), then `/review <slug>` again
  - **Required actions (NS-3):** deal with the `Required Follow-up Actions` in
    `review.md` by rewriting the plan with `/plan`, before you review again.
  - **Optional actions:** none
  - **Terminal?** no
- **REJECTED (the end; NS-4):**
  - **Current state:** `closed`
  - **Next command:** none — `closed` is the end.
  - **Required actions:** none — open a new ticket to pick the work up again.
  - **Optional actions:** none
  - **Terminal?** yes — no further workflow step is needed.
