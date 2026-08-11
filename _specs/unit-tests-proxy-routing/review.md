---
ticket: unit-tests-proxy-routing
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: reviewer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Review — unit-tests-proxy-routing

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

Reviewed `_specs/unit-tests-proxy-routing/`: `ticket.md` (state and history),
`research.md` (the six `OQ-n` questions), `spec.md` (FR-1..FR-7, NFR-1..NFR-5,
C-1..C-5, AC-1..AC-15) and `plan.md` (approach, steps, files to change,
integration surface, validation, rollback, out of scope).

Also read for context, without changing anything: `.claude/project-config.yaml`
(the `protected_paths` list and the `tests-and-types` validation profile).

## Plan Summary

The ticket adds **one new file**, `tests/proxy.test.ts`, and nothing else. The
tests drive the proxy the way Next does — build a request, call the exported
function, read the status, the address in the `location` header, and the cookies
on the response. The helpers inside the proxy are private, so this is the only
way in, and it is the right one: it pins the behaviour a visitor gets, not the
shape of the code.

The file lives in `tests/` rather than beside the proxy because `proxy.ts` is a
protected path; a new file inside that area would trigger the full stop at
`/implement`. The proxy itself is deliberately left off the "Files to change"
list, so this ticket may not edit it (C-1, C-2, AC-15).

The plan answers both questions the spec pushed forward. **OQ-1:** the tests run
in the shared `jsdom` environment, with a per-file `@vitest-environment node`
marker as the fallback if the proxy will not load — neither route touches a
shared file. **OQ-2:** each test loads a fresh copy of the proxy through a loader
that calls `vi.resetModules()` first, so the country cache and the "already
fetching" flag start empty; and the global `fetch` is replaced with the existing
`makeMockFetch`, which records every call, so the background country lookup is
proved by reading the recorded calls rather than by waiting for a failure.

Validation uses the `tests-and-types` profile (unit tests, typecheck, lint).
Rollback is deleting the one new file.

## Risks

- The environment question (OQ-1) is the one thing that can still cost time. The
  plan names a fallback, and both routes stay inside the new file, so the risk is
  time, not blast radius.
- These tests write down a contract other code already relies on (the `country`,
  `lang` and `language` cookies). A wrong assertion would lock in a bug instead of
  catching one. The plan names this risk itself.
- Three behaviours are pinned as "today's behaviour, not wanted behaviour"
  (AC-10). If the marking in the test file is weak, a later reader could take
  them for wanted behaviour.

## Assumptions

- `develop` is the branch under test; the `main` staging gate is not described
  and must not be assumed (C-3).
- The existing shared harness stays as it is — `tests/setup.ts` and
  `vitest.config.mts` are not edited by this ticket (NFR-3, AC-14).
- `vitest` gives each test file its own module registry and globals, so pinning
  environment values and replacing `fetch` inside this file cannot leak into
  another file.

## Open Questions

- None. `research.md` raised OQ-1 to OQ-6. `spec.md` answered OQ-3, OQ-4, OQ-5
  and OQ-6 and pushed OQ-1 and OQ-2 forward; `plan.md` answers both of those
  (PL-12). Nothing is left open.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) run
> at Step 1a — read-only lenses over `plan.md` + `spec.md` (ADR-012 / RP-1).
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Record each finding and the owner's disposition. If the panel is disabled or
> returned nothing material, write "none".

**No `major` finding was returned, so CG-6 added no extra comprehension
question.**

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | minor | Step 4 can be read two ways: "put the fake network in place for the whole file" plus "undo the stand-ins after each test". If the stub is set once up front and undone after each test, only the first test has the fake network. | `plan.md > Steps` 4 | **Fix at `/implement`** — set the fake network and the pinned environment values before each test and undo them after each test. The plan already requires an undo after every test; this makes the pairing explicit. Record it in `implement.md`. No plan rewrite. |
| senior | minor | The Integration surface names only the two settings the shared list is missing, but the AC-10 preconnect-header test also depends on `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`, which the shared list does supply. If another ticket blanks it, that test fails for an unrelated reason. | `plan.md > Integration surface`; AC-10 | **Fix at `/implement`** — pin that value in the test file too, the same way as the other two, and note it in `implement.md`. It is the same technique already in the plan, applied to one more value, so no plan rewrite is needed. |
| senior | minor | AC-13's "an unanswered request fails the test" cannot hold for the proxy's own lookup: the proxy swallows errors from it, and replacing the global `fetch` takes the shared "unhandled request fails" rule out of the path for this file. | AC-13 / NFR-1; `plan.md > OQ-2` | **Accept — no change.** The plan already says the proof is the recorded calls, not a failure, and the validation strategy already says `/verify` judges AC-13 by the recorded calls. The two documents agree; nothing to rewrite. |
| senior | minor | The `@vitest-environment node` fallback still runs `tests/setup.ts` (jest-dom plus the render cleanup). If the node route needed a change there, the plan leaves no route, because that file may not be edited. | `plan.md > OQ-1`, Files to change | **Accept — no change.** This is the correct behaviour: if the fallback needs a shared file to change, `/implement` must stop with `status: blocked` (IM-8 / IM-10) and the plan is rewritten. Try the fallback early. |
| senior | info | A fourth oddity exists that AC-10 does not cover: a locale-shaped but unsupported first segment leaves the prefix doubled (`/xx-en/foo` → `/gb-en/gb-en/foo`). | AC-4, AC-6 | **Accept — no change.** Pin it as today's behaviour and write it down as a finding in `implement.md` (C-1). Do not reshape the test until the result looks tidy, and do not fix the proxy. |
| senior | info | Scope is tight, the rollback is real, and the protected-path reasoning matches the project config. | `plan.md > Files to change`, Rollback | Noted — proceed. |
| security | minor | Whoever writes the file could paste a real internal backend address from a `.env` file into the test, putting an internal hostname in the repo and the PR. | `plan.md > Approach` (OQ-2) | **Fix at `/implement`** — the pinned backend address must be an obviously fake value such as `https://example.com`, the convention the shared test settings already use. Never copied from a `.env` file. |
| security | info | No protected file changes; nothing new is exposed; the change is easy to undo. | `plan.md > Files to change`, Rollback | Noted — proceed. |
| security | info | The cookie behaviour AC-8 pins (browser-readable `country`/`lang`/`language` and `referer`, not-readable `userIP`) matches the decision already recorded elsewhere in the repo, so these tests lock in nothing new. | AC-8 / FR-5 | Noted — proceed. |
| security | info | The installed versions carry no advisory that affects this app: `vitest@4.1.10` is past all three current fixes and the repo uses neither Vitest UI nor browser mode; `next@16.2.11` is the patched July 2026 release; no advisory found for `msw@2.15.0`. | `package.json`, `pnpm-lock.yaml` | Noted — proceed. |
| performance | info | No performance concern. One test file, no runtime code, no timers; resetting the module registry re-runs only the proxy itself, so the suite time barely moves. | `plan.md > Approach`, OQ-2 | Noted — proceed. |

## Decision

`APPROVED`

- Rationale: the plan is complete and traceable. It states an approach, steps,
  the one file it writes, a validation profile that exists in the project config,
  a real rollback (delete the file), what is out of scope, and a full integration
  surface (PL-11). Every `OQ-n` from `research.md` is dealt with — four in
  `spec.md`, and OQ-1 and OQ-2 in `plan.md` (PL-12), so nothing is left open.
  Each step in the plan traces back to an acceptance criterion: steps 1–4 carry
  AC-12 and AC-13, step 5 names AC-1 to AC-11 group by group, and step 6 covers
  AC-14 and AC-15. The blast radius is one new file that no shipped code imports,
  and the protected path stays deliberately out of scope. The panel returned no
  `major` finding; the four `minor` ones are handled inside the existing plan at
  `/implement` and none of them changes the approach, the files, or the
  acceptance criteria. The comprehension check passed 4/4.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-08-11 (comprehension check passed 4/4; ADR-011)

## ADR reference

> Optional — record an ADR only if the decision is notable; otherwise "none".

- ADR: none

## Required Follow-up Actions

Nothing has to happen before `/implement` starts — the plan stands as written.
Carry these three panel points into `/implement` and record them in
`implement.md`:

- Put the fake network and the pinned environment values in place **before each
  test** and undo them **after each test**, so every test has them.
- Pin `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` in the test file as well, so the AC-10
  preconnect-header test does not depend on a shared value.
- Use an obviously fake backend address such as `https://example.com`; never copy
  a value from a `.env` file.
- Try the `@vitest-environment node` fallback early. If it turns out to need a
  change in `tests/setup.ts` or `vitest.config.mts`, stop with `status: blocked`
  (IM-8 / IM-10) and rewrite the plan — do not edit a shared file.
