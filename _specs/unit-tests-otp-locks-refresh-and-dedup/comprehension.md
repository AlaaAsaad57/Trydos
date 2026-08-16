---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-15
result: passed          # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4              # correct / total (verify gate; the review gate scored 9/9)
decision: PASSED        # gate decision (the notification hook reads these — ADR-011)
missed:                 # empty when passed
links:
  clickup:
  github:
---

# Comprehension — unit-tests-otp-locks-refresh-and-dedup

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4); any wrong answer blocks it. Each question's options are listed
> **alphabetically** — the correct answer's position must carry no signal.
>
> **English only.** Questions, options, answers, and every other word in this file
> are written in English — whatever language the conversation used (CLAUDE.md).

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.
>
> Count: 9 questions — the floor of 3 (CG-1), including the mandatory integration
> question (CG-5), plus one question per `major` panel finding (CG-6). The panel
> returned **6 major** findings: 2 senior, 2 security, 2 performance.

**`result: passed`** — full record (CG-2):

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Beyond its own five test files, what does this ticket change that every other test file depends on, and what is the concrete failure mode if the assumption is wrong? | `plan.md > Integration surface` | integration (CG-5) | Nothing — self-contained · The coverage include list · **The server-only alias** ✅ · The shared setup file | The server-only alias | Yes |
| 2 | Which file in this ticket is the protected-path one, and what obligation follows? | `plan.md > Files to change`; C-1 / TR-3 | protected paths | authRefresh test, mirrored · otpLocks test, colocated · **requestDedup test, mirrored** ✅ · vitest.config.mts change | requestDedup test, mirrored | Yes |
| 3 | The plan decides (OQ-2) to test the dedup helper against a stand-in memo. What does that test deliberately NOT prove? | `plan.md > Approach` bullet 3; AC-29 / AC-30 | scope limits | That different keys run separately · That our helper shares one promise per key · **That the framework scopes its store per request** ✅ · That the helper never evicts a failed entry | That the framework scopes its store per request | Yes |
| 4 | Why can AC-20's network-failure assertion pass against a module that never really ran? | `panel:senior` (major) | correctness of evidence | Cookie missing → no-token · Leftover single-flight state · msw rejects the request · **Unset base URLs → relative URL** ✅ | Unset base URLs → relative URL | Yes |
| 5 | Why do AC-15's two "the recorder does nothing" assertions prove nothing as the runner config stands? | `panel:senior` (major) | correctness of evidence | after() is not stood in · **Both gates already hold by default** ✅ · The recorder swallows errors · Wrong test environment | Both gates already hold by default | Yes |
| 6 | What rule does the security lens want for the five files, and why won't the current ACs catch its absence? | `panel:security` (major) | secrets handling | Assert no token values · Encrypt the fixtures · **Obviously-fake fixtures rule** ✅ · Read credentials from env | Obviously-fake fixtures rule | Yes |
| 7 | How can the telemetry test fire a real request at the analytics host and still pass? | `panel:security` (major); AC-17 / AC-31 | real-I/O escape | **Callback settles after teardown** ✅ · Coverage instrumentation · Fake network ignores absolute URLs · server-only alias | Callback settles after teardown | Yes |
| 8 | What does the performance lens want in the refresh and dedup files, and what does it prevent? | `panel:performance` (major); `plan.md` step 5 | suite reliability | **Explicit timeouts + released gates** ✅ · Fewer single-flight cases · Global timeout in shared config · Real timers everywhere | Explicit timeouts + released gates | Yes |
| 9 | Why are fake timers particularly dangerous in these specific files? | `panel:performance` (major); `plan.md` steps 2 and 5 | suite reliability | Fake timers break storage · **msw uses timers internally** ✅ · React compiler needs real timers · Single-flight depends on the clock | msw uses timers internally | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-010) — CG-6 does not apply.
>
> Count: 4 questions — the floor of 3 (CG-1) plus one, including the mandatory
> integration question (CG-5). The integration question is drawn from a
> **deviation** from the declared surface (the stub became conditional), which is
> the strongest axis available.

**`result: passed`** — full record (CG-2):

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The implemented `server-only` stub is conditional rather than empty (FU-10). What does that mean for a test file this ticket did not write? | `implement.md > Deviations`; `plan.md > Integration surface` | integration (CG-5) | Every existing test must declare an environment · Nothing changes for other files · **Server code in a browser-like test fails loudly** ✅ · Server code in a browser-like test loads quietly | Server code in a browser-like test fails loudly | Yes |
| 2 | One finding in the lock store was uncovered by a test failing rather than by reading the code. Which one? | `implement.md > Findings` F-1; AC-5 | evidence quality | **A dead entry stays until the next write** ✅ · Blank numbers count toward the cap · Expired locks throw on read · The same number takes two slots | A dead entry stays until the next write | Yes |
| 3 | What would a rollback of this ticket drag with it, or leave behind? | `implement.md > Findings` F-12; `plan.md > Rollback` | rollback | Everything goes, alias included · Nothing can be reverted · **The alias stays behind as shared harness** ✅ · The roadmap must be reverted separately | The alias stays behind as shared harness | Yes |
| 4 | What does the dedup suite pin about work that fails while other callers have joined it? | AC-30; `implement.md > Findings` F-3 | pinned behaviour | A failed entry is evicted at once · **The failure sticks for the rest of the request** ✅ · Three retries happen before caching · Work is re-run for each caller | The failure sticks for the rest of the request | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
