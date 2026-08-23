---
ticket: unit-tests-authed-fetch-and-tokens
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-11
result: passed             # quiz outcome — were ALL answers correct? (CG-4)
score: 5/5                 # correct / total (verify gate; both review attempts were 9/9)
decision: PASSED           # gate decision (the notification hook reads these — ADR-011)
missed:                    # empty when passed
links:
  clickup:
  github:
---

# Comprehension — unit-tests-authed-fetch-and-tokens

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
>
> **On a failed gate this file must not become an answer key (CG-7).** When
> `result: failed`, write the **Failed attempt** form below instead of the full
> table: the question, the axis, the answer the owner gave, and the artifact
> section to re-read. Do **not** write the option list and do **not** mark which
> option was correct. The gate is re-run, so an answer key stored next to the
> questions turns the re-run into a lookup — and this file is published with the
> ticket (PB-9). The full table with the marked correct answer is written **only**
> when `result: passed`, where CG-2 requires it and no re-run follows.
>
> **A re-run asks new questions (CG-7).** Replaying the same questions tests
> memory, not comprehension. Generate them again from the artifact; keep the same
> axes (including the mandatory integration axis), change the questions.

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision.

Run twice — once per plan revision. Both attempts passed 9/9. Each attempt asked
**new** questions (CG-7); the round-2 set is not a replay of round 1.

### Attempt 1 — plan revision 1 → decision `CHANGES_REQUESTED`

Nine questions: the floor of three, plus one per `major` panel finding (six), with
the integration question counted inside the floor. Passed 9/9.

**`result: passed`** — full record (CG-2):

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Per `plan.md > Integration surface`, what does this ticket touch beyond its own files? | `plan.md > Integration surface` | integration (CG-5) | Nothing — self-contained / **One shared test helper (the request-store stand-in), no callers today but used by phases 6–11** / The five source files under test, modified to be testable / The global setup file, shared handler list and runner settings | One shared test helper | Yes |
| 2 | Why can AC-18 (role-based routing) not be proved under the plan as written? | `panel:senior`, AC-18 | correctness | **Both backend addresses are absent, so the resolver returns an empty string for verified and guest alike** / Only reachable through the request proxy, which the plan does not stand in / The routing helper reads the profile cookie, which the stand-in cannot store / Verified routing depends on a phone value the fixtures lack | Both addresses are absent | Yes |
| 3 | What actually happens when the code builds the register-guest address with the backend value missing? | `panel:senior`, `panel:performance`, AC-8 | correctness | The fake network answers it with the guest-registration handler / The fake network's unknown-path reply returns a 404 / The request resolves against the test origin / **Undici rejects it as an unparseable address before the fake network sees it, and the wrapper retries three times as a network error** | Rejected before the fake network | Yes |
| 4 | Why does the failure reporter matter for the ticket's no-real-input-or-output rule? | `panel:security`, `panel:senior`, NFR | integration | It buffers reports and flushes them after the suite ends / **It fires its own outbound request, swallowed by two catch blocks, so the fake network cannot fail a test on it** / It reads the profile cookie the stand-in cannot provide / It writes reports to disk the runner does not clean | Outbound call is swallowed | Yes |
| 5 | What did the security lens find the failure reporter does with credentials? | `panel:security`, AC-19, FR-13 | security | **It copies raw tokens and the user-id hash into every report it sends** / It drops the report entirely when a token is present / It masks tokens to four leading and four trailing characters / It stores tokens in a fixture file that would be committed | Copies raw tokens into reports | Yes |
| 6 | Why would an AC-15 test on the secure marking stay green even if the production branch were deleted? | `panel:security`, `panel:senior`, AC-15 | correctness | The stand-in discards the secure option / The secure marking is applied by the framework, not the options object / The test asserts the cookie name rather than its options / **Under the runner the environment is never production, and the options are frozen once at module load** | Frozen at module load | Yes |
| 7 | What was wrong with the plan's answer to OQ-9 (retry timing)? | `panel:performance`, `plan.md > Validation strategy` | correctness | Fake timers were ruled out but the ceiling needs them / **The claim that the wrapper accepts its own retry, delay and timeout parameters holds only for the transport layer, not the authed layer** / The named time limit is longer than the request abort / It relied on real waiting for every retry test | Claim holds for one layer only | Yes |
| 8 | When a test shows the code under test is genuinely wrong, what does AC-20 require? | AC-20, FR-14 | process | Fix the code, since the defect is in scope for the ticket that found it / Mark the test skipped and open a follow-up / **Record the defect with location and expected-versus-actual, and pin today's behaviour in a test that says it pins something broken** / Weaken the assertion until it passes | Record it and pin today | Yes |
| 9 | The spec settled that neither source area is protected — so why do the test files still go in the `tests/` mirror? | `plan.md > Files to change`, OQ-1 | integration | **A test file inside those server-only areas would be picked up by the app's own module graph** / Both areas are protected paths, so an exception applies / Colocated test files are forbidden by the conventions / The runner only discovers test files under `tests/` | Picked up by the module graph | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Attempt 2 — plan revision 2 → decision `APPROVED`

The panel re-ran against revision 2 and confirmed every round-1 `major` resolved,
but raised **six new majors**. Nine questions again: floor of three plus one per
new `major`, integration question inside the floor. Passed 9/9.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Which flows outside this ticket get pinned by the cookie contract it asserts? | `plan.md > Integration surface` | integration (CG-5) | None — only the two modules under test / The seller dashboard and boutique edit flow / **The sign-out path, the auth routes, the request proxy and the OTP rate limiter** / The sitemap generation and metadata builders | Sign-out, auth routes, proxy, OTP | Yes |
| 2 | Which second failure reporter did round 2 find missing from the Integration surface? | `panel:senior` | integration | **LogError from `utils/functions`, called in the authed layer's catch block, dragging the store and its reducers into a server-only test file** / LogServerError from the reporter module / The PostHog client / The Sentry browser client | LogError from utils/functions | Yes |
| 3 | Where must the failure reporter stand-in actually be applied? | `panel:security` | correctness | In the cookie module's test file only / In the transport layer's test file only / Nowhere — the network rule covers it / **Wherever the reporter is reachable: all three server-side files, because AC-3..AC-10 and AC-19 reach it too, not only AC-11** | Everywhere it is reachable | Yes |
| 4 | Why did the two round-1 fixes make the outbound escape more reachable rather than less? | `panel:security` | security | **The address now parses and the node environment removes the browser guard, so the request is genuinely sent — unawaited, possibly after the fake network has stopped** / The fake network now passes unhandled requests through / The reporter is now awaited / The stand-in was removed in revision 2 | Address parses, guard removed | Yes |
| 5 | What is wrong with the plan's "watch the delay function" wording? | `panel:performance` | correctness | **The backoff helper is a private closure, so the only seam is the global timer — and spying without short-circuiting still waits real time** / It is exported, so watching it is unnecessary / It is only called on permanent failures / It requires a simulated clock, which the plan forbids | It is a private closure | Yes |
| 6 | What could the server-style environment do to the cookie module's tests? | `panel:performance` | correctness | Make the module throw at import / Prevent its constants from being imported / **Silently leave its cookie helpers doing nothing, or load the real framework request reader the stand-in cannot intercept — either way the tests still pass** / Slow the file down without changing behaviour | Silently no-op, or load the real one | Yes |
| 7 | Why is the module-reset step a hazard in the file that also covers AC-16..AC-19? | `panel:senior`, `plan.md` step 7 | correctness | Because it clears the fake network handlers / **Because it re-runs the stand-in factory and produces a new instance, orphaning the cookie jar and spies the rest of the file holds** / Because it cannot be undone once the environment stub is applied / Because it makes the file exceed its five-second limit | Produces a new stand-in | Yes |
| 8 | Approving with these six open — what does that mean for implement? | `review.md > Decision`, IM-3 | process | Ignore them and apply the plan as written / **Implement deviates from the approved plan on the reporter scope and the stub hosts, and must record each deviation — which IM-3 otherwise discourages** / They are resolved automatically because the panel is advisory / They become a separate ticket | Deviate and record it | Yes |
| 9 | What is the rollback for this ticket? | `plan.md > Rollback` | rollback | **Delete the new test files and revert one additive change to a shared helper with no callers today** / Revert the branch and redeploy / Roll back cookie lifetime changes / None — not independently revertable | Delete new files, revert helper | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-010) — CG-6 does not apply.
>
> **CG-7 applies here too:** on `result: failed` use the failed-attempt form (no
> option list, no marked correct answer), and ask new questions on the re-run.

Five questions — the floor of three, plus two the size of the change warranted
(eight findings and seven deviations). No panel at this gate, so CG-6 does not
apply. Passed 5/5.

**`result: passed`** — full record (CG-2):

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | Did the plan's declared Integration surface turn out complete once the code was written? | `implement.md > Deviations`, `plan.md > Integration surface` | integration (CG-5) | **No — a second reporter, `LogError` from `utils/functions`, is reached on the recovery's catch path and was absent from the surface** / No — the runner settings needed editing after all / Yes — everything the tests reached was listed / Yes, but only because the stand-in was dropped | No — a second reporter was missing | Yes |
| 2 | Which two findings were new, found by the tests rather than known at plan time? | `implement.md > Findings` | correctness | The reporter copies raw credentials, and the technology is named in identifiers / **The legacy device cookie is still read by one module, and the server-side cookie reader silently does nothing under test** / The refresh token is not stripped, and the two hidden-cookie lists disagree / The routing log prints the backend name, and the token library import is unused | Legacy cookie read + reader no-ops | Yes |
| 3 | How is AC-12 recorded at this gate? | `spec.md` AC-12, `plan.md > Files to change` | scope | As failed, because no test covers it / **As moved out of scope at the review gate, along with FR-7 and the spec's OQ-10 answer** / As passed, because the module works / Not recorded at all | Moved out of scope at review | Yes |
| 4 | How was the one-second backoff ceiling proven? | `implement.md > Deviations` 3; AC-11 | correctness | By advancing a simulated clock through each retry / **By recording the delay the code asked for and running the callback immediately, so none of it was spent** / By setting a delay too small for the ceiling to apply / By waiting out two real backoffs | Recording the delay, firing at once | Yes |
| 5 | If this branch were reverted, what would come back with it? | `plan.md > Rollback`, `implement.md > Changes prepared` | rollback | **Nothing beyond the new test files and one additive change to a stand-in that had no callers before this ticket** / The cookie lifetime and same-site settings the tests pinned / The shared setup file and runner settings / The sign-out path and auth routes sharing the cookie contract | Nothing beyond the test files | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
