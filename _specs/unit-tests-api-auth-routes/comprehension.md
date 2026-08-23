---
ticket: unit-tests-api-auth-routes
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-17
result: passed
score: 4/4
decision: PASSED
missed:
links:
  clickup:
  github:
---

# Comprehension — unit-tests-api-auth-routes

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. The gate records its decision **only if 100% of
> answers are correct** (CG-4). Options are listed **alphabetically** — the
> correct answer's position carries no signal. **English only.**

The front-matter reflects the **latest** run of this gate (the second). Both runs
are kept below; neither overwrites the other.

## Review gate — first run (plan revision 1)

> Questions derived from `plan.md` revision 1 + `spec.md`, incl. the Integration
> surface and the first panel's findings. Ten questions: the floor of three plus
> one per `major` finding (seven). Result: **passed, 10/10** → decision
> `CHANGES_REQUESTED`.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | What is the concrete failure if a route test pins a contract the existing client-side tests contradict? | `plan.md > Integration surface` | integration (CG-5) | (a) CI fails on typecheck first; (b) next/image throws; (c) **the live suite becomes unreadable in exactly the case this ticket exists to fix, and the unit suite stays green**; (d) the gate is cancelled by a concurrency group | (c) | Yes |
| 2 | Why can AC-18 pass while missing the regression it exists to catch? | `panel:security`, AC-18 | assertion soundness | (a) DEVICE-TOKEN is legacy; (b) the guard is armed after the deletions; (c) deletions run in parallel; (d) **the test would import the same list the route derives its deletions from, so a cookie missing from that list is missing from both** | (d) | Yes |
| 3 | What gap did the security lens find around error reporting? | `panel:security`, FR-1 / FR-7 | data egress | (a) no once-per-failure assertion; (b) **no criterion checks the reporter payload for credential material**; (c) the reporter is asserted to be disabled; (d) stubbing contradicts AC-38 | (b) | Yes |
| 4 | AC-34 says the unknown-service answer and an ordinary failure cannot be told apart. What is true in the code? | `panel:security`, AC-34 | false premise | (a) they are already identical; (b) the statuses differ 503/500; (c) **the allow-list refusal sets a Cache-Control header the catch-all does not**; (d) the catch-all names the service | (c) | Yes |
| 5 | What must the plan state about credential values in the tests? | `panel:security`, `plan.md > OQ-2` | secrets | (a) **every token and key fixture is an obviously synthetic literal, never copied from a real session**; (b) real staging tokens are fine offline; (c) read them from .env.development; (d) generate them from the wallet key | (a) | Yes |
| 6 | What does the performance lens want recorded? | `panel:performance` | suite cost | (a) a coverage threshold; (b) assertions per file; (c) worker-pool peak memory; (d) **the `pnpm test:run` wall-clock before and after, in implement.md** | (d) | Yes |
| 7 | Why must the error reporter be stood in per file? | `panel:senior`, `plan.md > OQ-3` | test isolation | (a) it is a protected path; (b) **it makes a real outbound call that consumes a queued reply and, un-awaited, leaks into the next file**; (c) it reads next/headers; (d) it writes to the cookie store | (b) | Yes |
| 8 | Why does the unnamed cookie boundary matter? | `panel:senior`, `plan.md > Approach` | boundary choice | (a) standing in next/headers is forbidden; (b) **standing in next/headers proves cookie names and options, while standing in tokenManager proves only that a helper was called**; (c) it decides the environment; (d) the routes would not import | (b) | Yes |
| 9 | Why is the logout file written first? | `plan.md > Steps` | risk ordering | (a) **it carries the only real unknown — whether the deferred detach runs when the handler is called directly**; (b) most criteria; (c) smallest file; (d) the guard must exist first | (a) | Yes |
| 10 | What does a rollback involve? | `plan.md > Rollback` | rollback | (a) **deleting the ten test files, or reverting the commit — nothing else changes**; (b) also re-enabling the run-wide stand-ins; (c) also restoring vitest.config.mts; (d) reverting then redeploying | (a) | Yes |

## Review gate — second run (plan revision 2)

> New questions (CG-7), same axes. Derived from `plan.md` revision 2 + `spec.md`
> and the second panel's findings. Six questions: the floor of three plus one per
> `major` finding (three). Result: **passed, 6/6** → decision
> `CHANGES_REQUESTED`.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | Why does omitting a backend address from the per-file stubs make a guard test pass vacuously? | `panel:security`, `plan.md > OQ-2`; AC-20, AC-33 | assertion soundness | (a) **a missing base URL produces the same observable as a working guard — no call, or a 503 — so the test cannot tell them apart**; (b) it throws before import so the file never runs; (c) the runner substitutes .env.development; (d) tsc catches a missing name | (a) | Yes |
| 2 | Beyond recording a finding, what does the security lens want for AC-34's header divergence? | `panel:security`, AC-34 | security posture | (a) **an expected-fail assertion written against the intended behaviour, plus a follow-up ticket**; (b) remove the header in this ticket; (c) delete the criterion; (d) move the allow-list check after the upstream call | (a) | Yes |
| 3 | Which environment value did revision 2's stub list miss, and why does it matter most? | `panel:senior`, `plan.md > OQ-2` | configuration | (a) COMMENT_BACKEND_URL; (b) **NEXT_PUBLIC_CHAT_BACKEND_URL, because the shared config already sets it to a resolvable example.com host**; (c) TOKEN_COOKIE_MAX_AGE; (d) WALLET_PUBLIC_API_KEY | (b) | Yes |
| 4 | Why is "two boundaries are stood in, and nothing else" inaccurate for the proxy file? | `panel:senior`, `plan.md > Approach`, Integration surface | integration (CG-5) | (a) **logSecureRequest runs for real: it reads the token, reports through the error reporter on the catch path, and prints a line on every test**; (b) the credential helper is stood in too; (c) the run-wide cache stand-in counts as a third; (d) next/navigation is replaced by the shared setup | (a) | Yes |
| 5 | What happens if GO_BACKEND_URL and BACKEND_URL are stubbed to the same address? | `panel:security`, AC-35 | fixture design | (a) **AC-35's core branch becomes unreachable while the test still passes, because the gateway comparison is checked first**; (b) the host guard rejects both; (c) the proxy throws "Missing base URL"; (d) the two answers become indistinguishable, satisfying AC-34 | (a) | Yes |
| 6 | What regression does the literal thirteen-name list still not catch? | `panel:security`, AC-18 | coverage gap | (a) **a cookie added to the shared list and to neither the cleanup path nor the test**; (b) a cookie deleted twice; (c) a cookie deleted that is not on the list; (d) a legacy cookie nothing writes | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Review gate — third run (plan revision 3)

> New questions again (CG-7), same axes. Derived from `plan.md` revision 3 +
> `spec.md` and the third panel's findings. Seven questions: the floor of three
> plus one per `major` finding (four). Result: **passed, 7/7** → decision
> `CHANGES_REQUESTED`.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | What does importing the sign-in route pull in beyond the route itself? | `panel:senior`, `plan.md > Approach`, Integration surface | integration (CG-5) | (a) nothing beyond next/server and the credential helper; (b) **the guest-name helper, whose module imports the shared store, the translations module, analytics and the client fetch helper**; (c) the renewal helper only; (d) the run-wide cache stand-in and the counter store | (b) | Yes |
| 2 | Why does the security lens reject `it.fails` for AC-34 where the performance lens accepted it? | `panel:security` vs `panel:performance`, AC-34 | assertion soundness | (a) it.fails is unavailable here; (b) **it.fails passes on any throw, so it cannot tell "the weakness is still there" from "the test is broken"**; (c) it still reports the suite red; (d) it needs a configuration change | (b) | Yes |
| 3 | Why is asserting that `secure` matches `NODE_ENV === "production"` not good enough? | `panel:security`, AC-3, AC-19 | assertion soundness | (a) **it re-computes the source expression, so deleting the option or hardcoding false stays green**; (b) it needs a runner configuration change; (c) no route writes the option; (d) the runner sets NODE_ENV to production | (a) | Yes |
| 4 | Which two environment values does the table still miss, and why are they different? | `panel:security`, `panel:senior`, `plan.md > Environment values` | configuration | (a) ELASTIC_BACKEND_URL and WALLET_PUBLIC_API_KEY; (b) NEXT_PUBLIC_MEDIA_URL and the analytics keys; (c) **NODE_ENV and TOKEN_COOKIE_MAX_AGE, read at module load, so stubbing after import has no effect**; (d) STORIES_BACKEND_URL and COMMENT_BACKEND_URL | (c) | Yes |
| 5 | The guest-name helper is already covered by its own suite. What follows for AC-6? | `plan.md > Approach`; AC-6; `tests/utils/tinyUtils.test.ts` | scope boundary | (a) **AC-6 asserts the route applies the guard, while the guard's behaviour stays proven in the helper's suite**; (b) it becomes untestable; (c) it moves to the helper's file; (d) it needs the real helper to load | (a) | Yes |
| 6 | Why should the AC-18 and AC-19 tests send no push token? | `panel:senior`, `plan.md > Steps` (step 1) | test isolation | (a) **so the detach is never prepared and the deferred call never reached, which would otherwise risk a 500 that derails both criteria**; (b) so the guard is armed first; (c) so the reporter is not called; (d) so the body stays empty | (a) | Yes |
| 7 | The lenses disagree about the cost estimate. Which is right, given the import graphs? | `panel:senior` vs `panel:performance`, `plan.md > Steps` (step 1) | suite cost | (a) neither, the shared setup dominates; (b) the performance lens — logout is heaviest, estimate too high; (c) **the senior lens — logout's graph is small while sign-in pulls the whole store and translations graph, so the estimate is too low**; (d) the senior lens, because the runner caches modules | (c) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Review gate — fourth run (plan revision 4)

> New questions again (CG-7), same axes. Derived from `plan.md` revision 4 +
> `spec.md` and the fourth panel's findings. Four questions: the floor of three
> plus one per `major` finding (one). Result: **passed, 4/4** → decision
> `APPROVED`.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | Why is AC-33 unprovable with revision 4's fixtures? | `panel:senior`, `plan.md > Environment values`, step 8; AC-33 | assertion soundness | (a) **a bare-origin base makes the path prefix collapse to a single slash, so a climb-out target still starts with it and passes**; (b) the fake network has no binary reader; (c) the path guard runs before the decode header; (d) the two storefront hosts must be identical | (a) | Yes |
| 2 | What does the proxy's wire contract mean for these tests? | `panel:senior`, `plan.md > Integration surface`; AC-31..AC-35 | integration (CG-5) | (a) **the service name crosses the wire as an opaque token, so a test sending the readable name lands on the unknown-service refusal**; (b) it is sent in the target URL; (c) it is validated by the credential helper; (d) it must match the base host | (a) | Yes |
| 3 | Why must the AC-34 follow-up ticket be opened before the proxy file is written? | `panel:security`, `plan.md > Steps` (step 8), Out of scope | traceability | (a) **the comment carrying its id is the only pointer from the pinned assertion to the reason it exists**; (b) the ticket owns the fixtures; (c) the gate refuses to run unlinked; (d) the tests need the route fixed first | (a) | Yes |
| 4 | Why is the "nine light plus one heavy" estimate now stale? | `panel:performance`, `plan.md > Steps` (step 1), Approach | suite cost | (a) coverage instrumentation dominates; (b) **standing in the guest-name helper cuts the sign-in route's graph, so all ten files are light**; (c) the shared setup was trimmed; (d) the sign-in file was split | (b) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. No panel here (ADR-010), so CG-6 does
> not apply. Four questions: the floor of three plus one, including the mandatory
> integration question. Result: **passed, 4/4** → outcome `PASSED`.

| # | Question (from the artifact) | Source | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|--------|------|---------------------------------|----------------|----------|
| 1 | What did the step-9 cross-check find about a shared test stand-in? | `implement.md > Findings` (F-5); `plan.md > Integration surface` | integration (CG-5) | (a) it is unused and can be deleted; (b) **it returns cookie names that differ from the real constants, so client tests assert names that do not exist**; (c) it starts the fake network twice; (d) it was edited by this ticket | (b) | Yes |
| 2 | Why is AC-34 recorded as "not satisfied" rather than failed and fixed? | `implement.md > Findings` (F-2); AC-34, AC-38 | scope boundary | (a) it was removed from the spec at review; (b) the divergence disappears under coverage; (c) **the only fix is a change to the proxy route, which this ticket may not make**; (d) the test could not be written at all | (c) | Yes |
| 3 | What would a rollback drag with it? | `implement.md > Changes prepared`; `plan.md > Rollback` | rollback | (a) **nothing beyond the ten test files — no production code, config, mock or workflow changed**; (b) the renewal helper stand-in; (c) the two follow-up tickets; (d) the updated cookie-names mock | (a) | Yes |
| 4 | What did the measured suite cost turn out to be? | `implement.md > Validation run` | runtime impact | (a) **+0.5 seconds for 149 tests, far below the 20-second threshold**; (b) +12 seconds; (c) +34 percent; (d) unmeasurable | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
