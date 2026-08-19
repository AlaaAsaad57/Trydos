---
ticket: e2e-guest-token-lifecycle
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-19
result: passed          # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4              # correct / total — this gate (review scored 6/6)
decision: PASSED        # gate decision; `none` when the quiz failed (ADR-011)
missed:                 # empty when passed
links:
  clickup:
  github:
---

# Comprehension — e2e-guest-token-lifecycle

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

Six questions: the floor of three (one of them on the integration axis, CG-5),
plus one for each of the three `major` panel findings from round four (CG-6).

**Result: passed (6/6).**

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan scopes case 3's "no prompt appears" assertion to this recovery's own window. Why? | `plan.md > Integration surface` (overlapping flow d) | integration (CG-5) | **(a) Because chat, stories, wallet and comments refusals raise the same prompt from a different cause** ✅ · (b) Because the ordering ticket will extend the same action module · (c) Because the prompt can only exist after the cart has opened · (d) Because the session-expired screen is rendered by a parallel route slot | (a) | Yes |
| 2 | What tells a renewal apart from a new guest? | `spec.md` AC-4, AC-5, AC-6, AC-7; `plan.md > Approach` | acceptance criteria | (a) A renewal rotates only the access credential; a new guest rotates both · (b) A renewal shows a refresh request and no expiry request; a new guest shows both · **(c) The identity survives with both credentials rotated; a new guest shows a differing identity plus an expiry request** ✅ · (d) The identity survives with both credentials rotated; a new guest shows a registration request to the gateway | (c) | Yes |
| 3 | Which file is deliberately NOT in "Files to change", and why? | `plan.md > Files to change`, `> Out of scope` | files / rollback | (a) `docs/testing/E2E_TEST_DESIGN.md`, because the design document is owned by another ticket · (b) `tests/e2e/actions/nav.ts`, because `openCart` is shared with an existing case · **(c) `tests/e2e/globalSetup.ts`, because the artifact guard was deleted as scope beyond every criterion** ✅ · (d) `tests/e2e/selectors.ts`, because adding a locator would affect all thirty-one existing cases | (c) | Yes |
| 4 | What actually gates whether the app registers a guest on boot? | panel:senior (major) | correctness of a stated dependency | (a) The absence of a country cookie · **(b) The absence of the auth token cookie** ✅ · (c) The absence of user profile data in the store · (d) The presence of the no-country query parameter | (b) | Yes |
| 5 | Why can a case die before its own 30-second budget ever applies? | panel:performance (major); `plan.md` step 5, AC-10 | timing / budget | **(a) Because a cold country discovery plus the fresh navigation can exceed the suite's 90-second per-case timeout** ✅ · (b) Because retries are disabled, so the first failure ends the whole run · (c) Because the guest session expires after about sixty seconds · (d) Because the prompt-absence assertion inherits the fifteen-second expect timeout | (a) | Yes |
| 6 | What happens to the stated guest and time figures after one case fails? | panel:performance (major); `plan.md` AC-11 figures | cost / resource | (a) Nothing; the figures are per-run and are unaffected by a failure · (b) The failed case retries once, which doubles the guests it registers · (c) The suite aborts, so no further guests are created · **(d) The worker restarts and drops the cached country, so later cases pay a cold discovery again** ✅ | (d) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-010) — CG-6 does not apply.

Four questions: the floor of three, including the mandatory integration
question, plus one on the acceptance criterion that was met by weaker means than
planned.

**Result: passed (4/4).**

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan's Integration surface listed four overlapping flows. Implementation found a fifth. Which? | `implement.md > Deviations`; `plan.md > Integration surface` | integration (CG-5) | (a) The country discovery in the locale coverage, which the cases reuse · **(b) The server-side authed fetch, which reacts to the same refused credential during a render** ✅ · (c) The shared cart-opening step, which an existing browsing case depends on · (d) The suite's global setup, which every case runs through | (b) | Yes |
| 2 | Why do the cases boot on a country the app serves, rather than the country the app picks by itself? | `implement.md > Deviations` (1) | what changed | (a) Because a served country is needed for the cart to contain products · **(b) Because the app picks its default over loopback, and the region picker covers any address under that default** ✅ · (c) Because the proxy redirects an unknown country to the picker · (d) Because the seeded cookies are ignored on an IP address | (b) | Yes |
| 3 | What would reverting this ticket drag with it? | `implement.md > Changes prepared`; `plan.md > Rollback` | rollback | **(a) Nothing beyond the three cases and the documents; no application code and no runtime configuration** ✅ · (b) The artifact policy guard in the suite's global setup · (c) The country discovery helper the locale coverage owns · (d) The two prompt hooks added to the login components | (a) | Yes |
| 4 | Which criterion is satisfied today, but by a weaker means than the plan asked for? | `implement.md > Validation`; AC-8 | coverage honesty | (a) AC-10, because the window was measured only on a green run · (b) AC-11, because the guest count was estimated rather than measured · (c) AC-3, because the country is chosen from a candidate list · **(d) AC-8, because the prompt locators were confirmed by reading the components rather than by forcing the prompts** ✅ | (d) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
