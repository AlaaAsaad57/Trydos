---
description: Check that every AC is met and that the implementation evidence is there (read-only), write verify.md, then close the ticket on PASSED or stop it on FAILED. Changes no implementation file and makes no commit; writes nothing if a check before it fails.
argument-hint: <slug>
allowed-tools: Read, Grep, Glob, Bash, Write, AskUserQuestion
---

# /verify

For ticket `<slug>`: check that the implementation meets every acceptance
criterion, write `_specs/<slug>/verify.md`, and then either **close** the ticket
(PASSED) or **stop** it for rework (FAILED). This is the last gate command, and
it is the one that closes a successful ticket.

**It only reads the implementation:** `/verify` runs validation and test commands
but **changes no implementation file and makes no commit (VF-10 / AC-6)**. The
only files it writes are `verify.md` and `ticket.md`. (Committing belongs only to
`/publish-pr`, the single place where git work happens — PB-8 / ADR-008.)

**Say what matters — do not over-react and do not over-build.** Check against the
spec's acceptance criteria, and nothing more. FAIL only for a real fault: an AC
that clearly does not hold, a real bug, or a planned change that is missing. Do
not fail (and do not fill `verify.md` with) style preferences, edge cases outside
the ACs, or improvements the spec never asked for — anything outside the scope is
at most a one-line note, never a failure. A clean PASSED with nothing added is a
good, valid result.

**Write in plain English.** Everything this command produces — every section of
`verify.md`, every comprehension question and answer option, and the report it
prints — must be easy to read: short sentences, everyday words, no jargon where a
plain word works. A comprehension question must test whether the owner
understands what was built, not whether they can decode the wording; if a
question needs a hard term, use it and explain it in the same sentence. Keep
exact technical names (rule codes, state names, `AC-n` ids, file paths,
front-matter keys) and any command output you quote as they are. See
`.claude/rules/workflow-rules.md > Plain language`.

Rules to follow (use them; do not make up your own):
- What this command must do: `.claude/docs/command-architecture.md` (`/verify`)
- **Checks: `.claude/rules/validation-model.md` — use its rule codes. Do NOT
  write checks of your own.**
- Closure: `.claude/project-config.yaml > closure`. Who owns the state: ADR-003.

## Inputs

- `slug` (required) — the workspace `_specs/<slug>/`. If it is missing, ask once.

## Step 1 — Check before you start (stop on any ERROR and write nothing — VF-8)

Read `_specs/<slug>/ticket.md`, `spec.md`, `plan.md`, and `implement.md`, then
use:
- **RA-1** — this gate is run by the ticket **owner** themselves (checking your
  own work is expected here; ADR-011). No second reviewer is needed, and there is
  **no** RA-3 separation-of-duties check.
- **TS-1 / TS-2 / TS-3** — `ticket.md` exists and is valid; read the current
  `state`.
- **CMD-1 / ST-2** — the state must be `implemented`. In any other case, stop.
- **VF-2 (what you need to cover the ACs)** — `spec.md` has acceptance criteria
  with fixed `AC-n` ids (TR-1). If they are missing → stop.
- **VF-3 (what you need as evidence)** — `implement.md` records the files that
  changed. If it is missing → stop.
- **VP-1 (only when `plan.md` names a validation profile)** — the profile exists
  in `project-config.yaml > validation_profiles` and every check it needs is
  defined in `validation_checks`. If not, stop.

If any check fails, stop and report the rule code and the message. **Write nothing.**

## Step 2 — Check the work (read-only)

On the ticket's branch (`ticket/<slug>`), check **every** `AC-n` at depth
`all-ac` (VF-4 / MO-6) — every acceptance criterion gets a result. There are no
risk levels and no rollback rehearsal (ADR-011).

**Turning a validation profile into commands (VP-1..VP-5).** If the Validation
strategy in `plan.md` names a validation profile:
- Turn **profile → required checks → commands**: for each required check whose
  `depth` is `all-ac` or lower, look up its `command` and `pass_when` in
  `project-config.yaml > validation_checks`. The command is **never** written
  here (VP-4) — it comes only from the config.
- **Run** each command locally (VP-3: it must give the same result every time and
  must not ask questions). A check **passes** when `pass_when` is met (for
  example `exit-zero`, `exit-code:<n>`, plus any `output_contains`). A command
  that cannot run at all is recorded as `error` (could not run) — which is not a
  pass.
- **VP-2:** the commands must not change any implementation file; after running
  them, confirm the working tree did not change.
- Run them **locally only** — no GitHub, CI/CD, MCP, or outside runner.

If **no** profile is named (**VP-5**), skip the profile path completely and check
the work the way you did before — nothing changes.

For **each** `AC-n` in `spec.md`, record a result (pass or fail), and show which
executed check covers which AC. **Change no implementation file.** Work out the
protected-path statement (yes or no) (VF-9 / TR-3).

The result is **PASSED** only if every AC passes; otherwise it is **FAILED**.

## Step 2b — Comprehension check (CG-1..CG-5)

You now know the result, but **nothing has been written yet**. Before you record
it, the owner has to show they understand what was built:
1. Write multiple-choice questions **taken from `implement.md` and `spec.md`**
   (what changed, which acceptance criteria it meets, how to undo it, what it
   does at runtime) — specific, not generic (CG-2). Each question offers **at
   least 4 answers** taken from those files: one correct answer plus at least 3
   wrong ones that still look believable. **Sort each question's answers in
   alphabetical order** — the position of the correct answer must give nothing
   away (never put it first out of habit).
   **Write every question, every answer, and the recorded result in English** —
   the language of the conversation never changes the language of the gate
   (CLAUDE.md).

   **How many (CG-1):** `comprehension_gates.questions_min` (3) is a **minimum,
   not a fixed number** — ask more when the change calls for it. CG-6 does not
   apply here (there is no panel at `/verify` — ADR-012). Required on top of the
   minimum:
   - **CG-5 — one integration question (at least 1, and it counts towards the
     minimum):** about what the change you *actually built* touches outside
     itself — which other component or use-case flow shares the files, config,
     interface, metric, or path that changed; whether the **Integration surface**
     the plan declared turned out to be complete; and what undoing the change
     would drag with it. Take it from `implement.md` (the files changed and the
     deviations), `spec.md`, and `plan.md > Integration surface`. If the work
     differs from the declared surface, that is the strongest question you have —
     use it.
2. Ask them with `AskUserQuestion`; the owner picks one answer per question.
3. Write down, under the **verify** section of `_specs/<slug>/comprehension.md`
   (create it from the template if it does not exist; do **not** overwrite the
   `review` section): each question, its answers, where it came from
   (`implement.md` / `AC-n` / `plan.md > Integration surface`), the answer the
   owner picked, and whether it was correct. Set the front-matter (the
   notification hook reads it — ADR-013): `stage: verify`,
   `result: passed|failed`, `score: <correct>/<total>`, `decision:` = the Step 2
   result (`PASSED`/`FAILED`) when the quiz passed and `none` when it failed, and
   `missed:` = the questions that were wrong plus their topic on a failed quiz
   (for example `Q3 (integration)`), left empty when it passed.
4. **You pass only with 100% correct (CG-4).** If **any** answer is wrong, record
   **no** PASSED and leave `ticket.md` untouched (all or nothing); report which
   questions were wrong and stop — the owner re-reads and runs `/verify` again.
   Carry on only when every answer is correct.

## Step 3 — Write verify.md (VF-1)

Write `_specs/<slug>/verify.md` from `_specs/_templates/verify.md`: the
front-matter (`ticket`, `stage: verify`, `mode`, `status: complete`,
`owner: developer`, `updated: <today>`, `links`) plus the AC → test → result
table (VF-2), the commands you ran with their output, the protected-path and
runtime review (VF-9), and the sign-off with the result and the owner's own
approval.
When you used a validation profile, also record the **profile id** and, for each
check you ran, the **command**, the **exit code**, a short **summary of the
output**, the **result**, and the `AC-n` it covers.

## Step 4 — Apply the result to ticket.md (TS-4)

**If PASSED** (VF-5) — close the ticket:
- `state: closed`, `status: active`, `updated_at: <today>`; add:
  ```yaml
  - state: verified
    event: verification-passed
    by: reviewer
    timestamp: <today>
  - state: closed
    event: ticket-closed
    by: reviewer
    timestamp: <today>
  ```

**If FAILED** (VF-6) — stop it for rework; do **not** close it:
- `state: implementation-in-progress`, `status: blocked`, `updated_at: <today>`;
  add:
  ```yaml
  - state: implementation-in-progress
    event: verification-failed
    by: reviewer
    timestamp: <today>
  ```
- Write down in `verify.md` which ACs failed and what has to be fixed. The ticket
  can be picked up again with `/implement` (resume).

## Checks after you finish

- **VF-1** `verify.md` written · **VF-2** every AC has a result · **VF-3** the
  evidence was checked · **VF-4** depth = all-ac · **CG-1** the comprehension
  record has at least the minimum number of questions · **CG-5** an integration
  question was asked · **VF-9 / TR-3** the protected-path statement is there.
- PASSED: **VF-5 / CL-1 / TS-4 / CMD-2** state = `closed`.
- FAILED: **VF-6 / TS-4** state = `implementation-in-progress`,
  `status: blocked`.
- **VF-7** no implementation file was changed; you wrote only `verify.md` and
  `ticket.md`. **VF-10** no commit was made. **FM-1..FM-8** the front-matter is
  valid.
- **VP-1..VP-5 (when a profile was used)** — the profile and its checks came from
  the config; the commands gave the same result every time, asked no questions,
  and changed nothing; the no-profile path is unchanged.

## MUST NOT

- Do **not** close the ticket unless the result is PASSED (VF-5).
- Do **not** change implementation files or source code (VF-7) — this command
  only reads.
- Do **not** make any commit (VF-10) — committing belongs only to `/publish-pr`.
- Do **not** change any `protected_paths` file.
- Do **not** run when the state is not `implemented` (VF-8 — write nothing).

## Report

Say the result (PASSED or FAILED), a summary of the AC results, the
protected-path statement, and the state `ticket.md` now has:
- PASSED → `closed` (the workflow is finished).
- FAILED → `implementation-in-progress` plus `status: blocked`; next:
  `/implement` (resume) to fix it, then `/verify` again.

## Next step (NS-1..NS-4)

Print the next-step block (`command-architecture.md §6`):

- **PASSED → `closed` (the end; NS-4):**
  - **Current state:** `closed`
  - **Next command:** none — the workflow is finished.
  - **Required actions:** none
  - **Optional actions:** `/publish-pr <slug>` to deliver the work to GitHub (the
    single place where git work happens; it sits outside the state machine).
  - **Terminal?** yes — no further workflow step is needed.
- **FAILED → `implementation-in-progress` plus `status: blocked` (NS-3):**
  - **Current state:** `implementation-in-progress` (`status: blocked`)
  - **Next command:** `/implement <slug>` (resume), then `/verify <slug>` again.
  - **Required actions:** fix the acceptance criteria that failed, as written in
    `verify.md` (rewrite the plan with `/plan` first if the fix changes the plan).
  - **Optional actions:** none
  - **Terminal?** no
