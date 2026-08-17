---
ticket: unit-tests-otp-send-and-limiter
stage: verify              # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-17
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4                 # correct / total (latest attempt — the verify gate)
decision: PASSED           # gate decision (the notification hook reads these — ADR-011)
missed:                    # empty when passed
links:
  clickup:
  github:
---

# Comprehension — unit-tests-otp-send-and-limiter

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4); any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.
>
> **English only.** Questions, options, answers, and every other word in this file
> are written in English — whatever language the conversation used (CLAUDE.md).
>
> **Three rows is the floor, not the form** (CG-1): add rows freely. Every gate
> carries **≥1 integration / cross-flow question** (CG-5), and `/review` adds
> **one row per `major` panel finding** on top of the floor (CG-6).

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.

Nine questions: the floor of three (one of them the mandatory integration
question, CG-5) plus one per **distinct** major panel finding (CG-6). The panel
returned eight major findings across three lenses; two pairs described the same
defect from different angles (M1 = security + performance, M4 = senior +
performance), so they are recorded once each, giving six seeded questions.
Options are listed alphabetically; the correct option fell in positions
2, 3, 4, 2, 1, 3, 2, 2, 1.

**`result: passed`** — full record (CG-2):

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Which shared thing does this ticket change that every other test file in the unit suite already depends on, and what pins its current value? | `plan.md > Integration surface` | integration (CG-5) | jsdom environment setting / **Limiter stand-in reply** / msw handler list / Router stand-in | Limiter stand-in reply | Yes |
| 2 | What does `spec.md` put explicitly Out of Scope for the rate-limit wrapper? | `spec.md > Out of Scope`, AC-11..AC-15 | scope | Correcting the shared stand-in / Recording files in the roadmap / **The counter script itself** / The fail-open behaviour | The counter script itself | Yes |
| 3 | Which statement about protected paths is true for this ticket? | `plan.md > Files to change`, TR-3 | governance | CI workflow files are in scope / No protected path involved / proxy.ts is touched / **serverRequests/** applies** | serverRequests/** applies | Yes |
| 4 | If the client-library stand-in is missing from the limiter test, why can the fake network not protect the run? | `panel:security` + `panel:performance` (M1), AC-16 | risk | ioredis retries once / **msw only sees HTTP** / setup.ts is not loaded / The connection is lazy | msw only sees HTTP | Yes |
| 5 | What else does loading the real limiter module bring into scope? | `panel:security` (M2), `plan.md > Integration surface` | blast radius | **A key-deleting function** / A salt-rotating function / The Lua counting logic / The seller comment handler | A key-deleting function | Yes |
| 6 | Why must the tests not assert on a hard-coded identity hash? | `panel:security` (M3), AC-10 | secrets | Coverage cannot instrument crypto / It changes every run / **It encodes a real secret** / No hash is produced | It encodes a real secret | Yes |
| 7 | As the plan stands, why would the "no counter store" case pass on the wrong path? | `panel:senior` + `panel:performance` (M4), AC-11 | correctness | resetModules cannot run / **The client is null only on edge** / The limiter fails closed / The shared stand-in answers | The client is null only on edge | Yes |
| 8 | In the store-failure case, what runs for real if the error reporter is not stood in for the limiter test? | `panel:performance` + `panel:senior` (M5), AC-12 | risk | A guest registration request / **A reporter that reads cookies and posts** / Nothing — the catch swallows it / The script against the real store | A reporter that reads cookies and posts | Yes |
| 9 | Which boundary did the plan's Step 3 leave unnamed for the send action's test? | `panel:senior` (M6), `plan.md > Steps`, AC-5..AC-7 | integration | **Cookies and the backend address** / The coverage include list / The navigation stand-in / Translation key parity | Cookies and the backend address | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Attempt 2 — against plan revision 2 (`result: failed`)

The first attempt above passed and carried the `CHANGES_REQUESTED` decision. The
plan was then revised, so the gate was re-run with **new** questions (CG-7). This
attempt failed, so **no decision was recorded** and `ticket.md` was left
unchanged. Five questions were planned — the floor of three plus one per distinct
major panel finding — and the attempt stopped at the wrong answer, so only three
were asked.

Failed attempt, **no answer key** (CG-7): no option list, no marked correct
answer. The next attempt asks new questions again.

| # | Question (from the artifact) | Source | Axis | Owner's answer | Correct? | Re-read |
|---|------------------------------|--------|------|----------------|----------|---------|
| 1 | If the `AC-11` case does not restore the runtime marker and reset the module registry, what happens to every later case in that file? | `plan.md > Steps` §2, `plan.md > Integration surface`; AC-11 | integration (CG-5) | Every later case fails open | Yes | — |
| 2 | Why must every reply set on the shared limiter spy be single-use? | `plan.md > Integration surface > Who else depends on them`; AC-17 | shared state | The between-tests reset only clears calls | Yes | — |
| 3 | Why does the plan run the whole suite rather than only the two new files? | `plan.md > Validation strategy` | validation | The live project shares the setup | **No** | `plan.md > Validation strategy`, and `plan.md > Integration surface > Who else depends on them` |

<!-- Questions 4 and 5 (the two seeded by this round's major findings) were not
     reached: the attempt stopped at the first wrong answer (CG-4). -->

### Attempt 3 — against plan revision 2, unchanged (`result: failed`)

The plan was not revised between attempts 2 and 3, so the panel findings were
carried over from the run against this same revision, and the questions were
generated fresh (CG-7). Five were planned — the floor of three plus one per
distinct major — and the attempt again stopped at the third.

Failed attempt, **no answer key** (CG-7): no option list, no marked correct
answer.

| # | Question (from the artifact) | Source | Axis | Owner's answer | Correct? | Re-read |
|---|------------------------------|--------|------|----------------|----------|---------|
| 1 | Which other flow shares the identity layer the send action uses, so an expectation written here describes both? | `plan.md > Integration surface > Who else depends on them`; AC-10 | integration (CG-5) | OTP debug statistics action | Yes | — |
| 2 | Which validation profile does the plan name, and what does it require? | `plan.md > Validation strategy` | validation | logic-change | Yes | — |
| 3 | If only the shared stand-in correction turns out to be wrong, what does the plan say happens? | `plan.md > Rollback` | rollback | The whole commit reverts | **No** | `plan.md > Rollback` — the sentence beginning "If only the shared stand-in correction turns out to be wrong" |

<!-- Questions 4 and 5 were not reached (CG-4). -->

**Gate history so far:** attempt 1 passed 9/9 and carried `CHANGES_REQUESTED`
against revision 1. Attempts 2 and 3 both failed 2/3 against revision 2, each on
its third question, on different axes (validation, then rollback). No decision has
been recorded against revision 2.

### Attempt 4 — against plan revision 3 (`result: passed`)

Five valid questions: the floor of three (one on the mandatory integration axis,
CG-5) plus one per surviving major panel finding (CG-6). The panel re-ran in full
against revision 3, and two distinct majors survived.

**One question was voided and is excluded from the score.** It asked which defect
a new test exposes while the plan forbids fixing it, and offered "the refusal
names in the wrapper" as a distractor — but that is *also* a recorded-not-fixed
item in `plan.md > Out of scope`, so the question had two defensible answers and
breached CG-2. It was replaced with a question on the ordering axis. The defect
belonged to the question author, not the owner, so it is not scored either way; it
is recorded here so the gate's history stays honest.

Full record (CG-2). Options alphabetical; the correct one is shown in bold and
fell in positions 3, 4, 2, 1, 3.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Which piece of shared state survives a module-registry reset, so the `AC-11` re-import could silently reuse a client built earlier? | `plan.md > Integration surface`; AC-11 | integration (CG-5) | The fake network's handlers / The guard test's registration / **The module's cached client** / The suite's environment block | The module's cached client | Yes |
| 2 | Which file in revision 3's scope has no acceptance criterion behind it, and what did the panel recommend doing with it? | `plan.md > Files to change`; `panel:senior`, `panel:performance` | scope | The action's test file — split it / The guard test — keep it / The live roadmap — strike it / **The vitest config — strike it** | The vitest config — strike it | Yes |
| 3 | Inside the limiter test, why must the client stand-in be registered above the lift and above any dynamic import? | `plan.md > Steps` §2, `plan.md > Integration surface > Ordering`; AC-16 | ordering | Coverage instruments in that order / **The client is built at evaluation** / The fake network must start first / The guard test asserts the order | The client is built at evaluation | Yes |
| 4 | Why did the performance lens call the pinned cache host a major problem rather than a detail? | `panel:performance` (R1); `plan.md > Files to change` | risk | **A resolving host reaches a third party** / Coverage cannot instrument it / It breaks the live project / The guard test pins it | A resolving host reaches a third party | Yes |
| 5 | What does the security lens require so the new fail-open comment does not overstate the boundary it describes? | `panel:security` (R2); `plan.md > Steps` §2 | risk | Remove the comment entirely / Say the backend throttle is per address / **Say the counters are flushable** / Say the platform edge blocks all sends | Say the counters are flushable | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Attempt 5 — against plan revision 4 (`result: passed`, decision `APPROVED`)

Five questions: the floor of three (one on the mandatory integration axis, CG-5)
plus one per surviving major panel finding (CG-6). The panel re-ran in full against
revision 4: the senior lens recorded no blocking item and no major, the performance
lens recorded no major, and the security lens recorded two.

Full record (CG-2). Options alphabetical; the correct one is in bold and fell in
positions 2, 4, 3, 3, 1.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | What does the limiter module consult before constructing a client, and why does that matter here? | `plan.md > Integration surface`, `Steps` §2; AC-11, AC-16 | integration (CG-5) | The four OTP limits / **The global cached client** / The runtime marker only / The suite's env block | The global cached client | Yes |
| 2 | What did revision 4 remove from scope, and on what grounds? | `plan.md > Files to change` ("Removed from scope") | scope | The guard test update / The live roadmap edit / The spec correction / **The suite config file** | The suite config file | Yes |
| 3 | Under the partial rollback, which files revert together and which stay in place? | `plan.md > Rollback` | rollback | Both new tests revert / Everything reverts together / **Stand-in pair reverts, tests stay** / The roadmap edits revert | Stand-in pair reverts, tests stay | Yes |
| 4 | Why is the residual risk worse than the "hang" the plan describes? | `panel:security` (S1); `plan.md > Integration surface`; AC-16 | risk | It fails fast after 20 retries / No client is built outside production / **Real credentials pass through** / The fake network intercepts it | Real credentials pass through | Yes |
| 5 | What is available today, at zero code change, to shrink the window on the unauthenticated cache-clearing route? | `panel:security` (S2); `plan.md > Out of scope` | risk | **A platform firewall rule** / Deleting the route in this ticket / Removing the maintenance function / Renaming the route | A platform firewall rule | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

**Gate history, complete.** Attempt 1 passed 9/9 → `CHANGES_REQUESTED` (revision 1).
Attempts 2 and 3 failed 2/3 against revision 2. Attempt 4 passed 5/5 →
`CHANGES_REQUESTED` (revision 3), with one question voided for breaching CG-2.
Attempt 5 passed 5/5 → `APPROVED` (revision 4).

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-010) — CG-6 does not apply.

Four questions: the floor of three plus one, because the change touches shared
suite state. One is on the mandatory integration axis (CG-5). Passed on the first
attempt.

Full record (CG-2). Options alphabetical; the correct one is in bold and fell in
positions 1, 4, 2, 3.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan said the corrected stand-in is loaded by every test file. What actually demonstrated that nothing else broke? | `implement.md > Validation`; `plan.md > Integration surface`; AC-16, AC-17 | integration (CG-5) | **All 30 files ran green** / Coverage moved off zero / The two new files passed alone / The type check passed | All 30 files ran green | Yes |
| 2 | What was the one deviation from the plan during implementation? | `implement.md > Deviations from plan` | what changed | A production file had to be edited / The limiter test was flattened / The shared stand-in could not be corrected / **The subject is imported inside the tests** | The subject is imported inside the tests | Yes |
| 3 | If this ticket were rolled back, what would the revert drag with it? | `plan.md > Rollback`; `implement.md > Changes prepared` | rollback | A production change to fail-open / **Both roadmaps and the test files only** / The coverage thresholds and CI gate / The suite configuration file as well | Both roadmaps and the test files only | Yes |
| 4 | The limiter module reports 20.5% statement coverage. Why is that the honest number rather than a gap? | `implement.md > Validation`; `spec.md > Out of Scope` | runtime impact | Several criteria were left unproven / The provider cannot instrument it / **Three jobs, one in scope** / Only the fail-open path ran | Three jobs, one in scope | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
