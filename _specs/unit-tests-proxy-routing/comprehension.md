---
ticket: unit-tests-proxy-routing
stage: verify
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-11
result: passed          # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4              # correct / total
decision: PASSED        # gate decision; `none` when the quiz failed (ADR-013)
missed:                 # empty — every answer was correct
links:
  clickup:
  github:
---

# Comprehension — unit-tests-proxy-routing

> Single-owner gate control (ADR-011 / ADR-014 / CG-1..CG-6). At each gate the
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
> the `/review` decision. The panel returned **no `major` finding**, so CG-6 added
> no extra question. Four questions were asked — one above the floor of 3.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | The proxy reads two settings the shared test settings do not have — the backend address and the cookie lifetime. Why does the plan pin them inside its own file with `vi.stubEnv` instead of adding them to `vitest.config.mts`? | `plan.md > Integration surface` | integration (CG-5) | (a) A shared value cannot be undone after a test · (b) Both values are secrets · **(c) Sharing them would hand them to every test file in the suite — all 6 files and 169 tests — including files written later that never asked for them** · (d) `vitest.config.mts` only takes values Next already defines | (c) Sharing them would hand them to every test file | yes |
| 2 | What ordering rule matters inside the new test file, and why? | `plan.md > Integration surface` (Ordering / lockstep dependencies) | ordering | (a) Nothing has to happen in a set order inside the file · **(b) The environment values are pinned before the proxy is loaded, because the cookie lifetime is read once at load time** · (c) The fake network is started after the proxy is loaded · (d) The proxy is loaded first, then the registry is reset | (b) The environment values are pinned before the proxy is loaded | yes |
| 3 | Why does the new test file go in the `tests/` folder rather than next to the proxy? | `plan.md > Approach`, `plan.md > Files to change` | protected paths | (a) Because coverage only measures files inside `tests/` · (b) Because `jsdom` cannot load a file that sits at the repo root · **(c) Because `proxy.ts` is a protected path, and a new file inside that area would trigger the full stop at `/implement` (GU-2 / IM-5)** · (d) Because vitest only picks up test files inside `tests/` | (c) Because `proxy.ts` is a protected path | yes |
| 4 | What happens if the module registry is not reset between tests? | `plan.md > Integration surface` (What breaks if this is wrong) | risk | (a) A failing test would name the wrong acceptance criterion · (b) The cookie lifetime would be read twice · **(c) The country cache stays filled from the first test, so later tests silently test the cache instead of the fallback list and a broken fallback list would still pass** · (d) The fake network would be put back too early | (c) The country cache stays filled from the first test | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED at
> `/verify`. No panel here (ADR-012) — CG-6 does not apply.

Four questions were asked — one above the floor of 3.

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | The plan's Integration surface named two settings the shared test list does not carry. `implement.md` records that a third setting was pinned inside the test file as well. Which one, and why? | `implement.md > Deviations from plan`; `plan.md > Integration surface`; AC-10 | integration (CG-5) | (a) `BACKEND_URL` · (b) `DEFAULT_COOKIE_MAX_AGE` · (c) `NEXT_PUBLIC_DEFAULT_COUNTRY` · **(d) `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` — the AC-10 preconnect-header test reads it and the shared list supplies it, so pinning it here stops another ticket's edit from breaking this test** | (d) `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` | yes |
| 2 | How did the environment question (OQ-1) actually turn out? | `implement.md > Deviations from plan`; `plan.md > OQ-1` | approach | (a) A per-file `@vitest-environment node` marker was added · **(b) The proxy loads in the shared `jsdom` environment unchanged, so the fallback was not needed and no shared file was touched** · (c) `tests/setup.ts` was given a small exception · (d) `vitest.config.mts` was switched to the node environment | (b) The proxy loads in the shared `jsdom` environment unchanged | yes |
| 3 | `implement.md` records a fourth surprising behaviour, found while writing the tests and not named in the spec. What is it? | `implement.md > Behaviour that resisted testing, and findings`; AC-10 | findings | (a) A sitemap under a locale prefix is redirected · **(b) An address whose prefix names an unsupported country or language ends up doubled — `/xx-en/shop` redirects to `/gb-en/gb-en/shop?no-country=true`** · (c) The logout marker is cleared on a redirect hop too · (d) The visitor's IP cookie is readable by page scripts | (b) An address whose prefix names an unsupported country or language ends up doubled | yes |
| 4 | What would undoing this ticket drag with it? | `implement.md > Changes made`; `plan.md > Rollback` | rollback | (a) Also reverting settings added to `vitest.config.mts` · (b) Deleting the test file and reverting `tests/setup.ts` · **(c) Nothing else — deleting `tests/proxy.test.ts` is the whole change; no application file, shared test file or setting was edited** · (d) The fix to `proxy.ts` has to be reverted too | (c) Nothing else — deleting `tests/proxy.test.ts` is the whole change | yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
