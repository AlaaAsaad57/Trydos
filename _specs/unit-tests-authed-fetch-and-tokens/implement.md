---
ticket: unit-tests-authed-fetch-and-tokens
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Implement — unit-tests-authed-fetch-and-tokens

> Record of what was actually built, following `plan.md`.

Branch `ticket/unit-tests-authed-fetch-and-tokens`, created from a clean
`develop` (this repository's base branch overrides the plugin default of `main`).
Everything is left uncommitted; `/wf:publish-pr` owns the single commit (IM-9).

## Changes made

- `tests/mocks/nextHeaders.ts` — extended the request-store stand-in. It now
  takes a cookie write in the object form the app actually uses, keeps every
  option it was handed on `__writes`, records deletions on `__deletes`, can be
  told to refuse writes, and resets between tests. The old two-argument form
  still works. Nothing was removed.
- `tests/serverRequests/HandleAuthedFetch.test.ts` — new, 12 tests. The five
  ways a rejected token is recovered from, and the two loop guards.
  AC-1..AC-10.
- `tests/serverRequests/ServerFetch.test.ts` — new, 13 tests. What is retried,
  what is not, the backoff schedule, and what is reported. AC-11.
- `tests/utils/cookieManager.test.ts` — new, 18 tests. Cookie names and the
  browser-unreadable set. AC-13, AC-14.
- `tests/utils/tokenManager.test.ts` — new, 40 tests. Cookie shape, credential
  lookup, verified detection, routing, and the outward-facing cleaners.
  AC-15..AC-19.

**83 new tests.** The suite goes from 7 files / 265 tests to 11 files / 348.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

- `tests/mocks/nextHeaders.ts` — modified (additive)
- `tests/serverRequests/HandleAuthedFetch.test.ts` — new
- `tests/serverRequests/ServerFetch.test.ts` — new
- `tests/utils/cookieManager.test.ts` — new
- `tests/utils/tokenManager.test.ts` — new
- `_specs/unit-tests-authed-fetch-and-tokens/**` — the ticket's own artifacts

No file outside `tests/` and `_specs/` was touched. No protected runtime path,
no shared runner settings, no global setup file, no shared handler list.

## Deviations from plan

The review gate approved this plan with six known `major` findings carried as
binding obligations rather than plan text, so these deviations were expected and
authorised at the gate (`review.md > Required Follow-up Actions`).

1. **Both failure reporters stood in, in every file that reaches them**
   (obligation 1). The plan named one reporter and scoped it to AC-11. In fact
   the transport layer's reporter is reached by AC-3..AC-10 and AC-19 as well, so
   it is stood in in all three server-side files. A **second** reporter —
   `LogError` from `utils/functions`, called on the recovery's catch path — was
   missing from the plan entirely and is stood in too; without it, importing the
   file drags the whole shared store into a server-only test.
2. **Reserved `.invalid` hosts** instead of a real-looking domain (obligation 2).
   `https://core.invalid` and `https://gateway.invalid` cannot resolve anywhere,
   so a request that escapes a stand-in dies on this machine.
3. **The delay seam is the global timer, and it does not wait** (obligation 3).
   The plan said "watch the delay function"; that function is a private closure
   with no seam. The spy records the delay it was asked for and runs the callback
   immediately, so the one-second ceiling is proved without spending it. Both the
   test limit and the hook limit are set to 5 seconds, below the 15-second
   request abort.
4. **The module-reset tests keep to themselves** (obligation 4). Each reset lives
   inside a single test, and the environment stub and module registry are put
   back afterwards, so no later test in the file reads production values. The
   48-hour default is proved with the lifetime override deliberately unset. The
   partial replacement of the token module was dropped: verified state is driven
   by seeding the profile cookie in the stand-in, which asserts the real writes
   rather than a spy's idea of them.
5. **The environment probe ran first, and it found what was predicted**
   (obligation 5). See finding 7. The stop rule was not triggered — the shared
   setup file runs fine under the server-style environment, and was not edited.
6. **Findings are recorded by file, line and shape only** (obligation 7). No
   token, cookie or profile value from a real session appears in any test or
   artifact. Every credential in a fixture is an obviously fake constant.

**One deviation beyond the obligations:**

7. **`tests/utils/cookieManager.test.ts` asserts across two modules.** AC-14's
   list-divergence finding cannot be expressed inside one module, because the two
   disagreeing lists live in different files. The test imports both. This is
   within the planned file, but wider than the plan's description of it.

## Findings — recorded, not fixed (AC-20)

Eight. Six were known at plan time; **two are new, found by the tests**.

| # | Finding | Location | Status |
|---|---|---|---|
| 1 | The backing technology is named in identifiers and comments, which the repository rule forbids: `GO_APIS`, `GO_API_PREFIXES`, `isFromGoApi`, and comments naming the two backends. | `utils/server/tokenManager.ts:78-128`; `serverRequests/HandleAuthedFetch.ts:74,104-107,139` | Reported |
| 2 | The routing log prints the backend name whenever the environment is not production. | `utils/server/tokenManager.ts:164-169,186-192` | Reported |
| 3 | The token-parsing library is imported and never used. | `utils/cookies/cookie-manager.ts:1` | Reported |
| 4 | **The failure reporter copies raw credentials into every report** it sends — the auth, chat, stories and wallet tokens and the user-id hash. The irony: the caller masks the token to a hint first, then hands the object to the reporter, which re-attaches all of them in full. | `utils/serverErrorReporter.ts` | Reported. Most serious of the eight. |
| 5 | **The two lists of browser-unreadable cookies disagree.** The chat refresh token is in one and not the other, so which list a future change consults decides whether that cookie is protected. | `utils/cookies/cookie-manager.ts:92-105` vs `utils/server/tokenManager.ts:64-76` | **Pinned by a test** that says it pins a defect. |
| 6 | **A profile's refresh token is not stripped** before the profile can reach the browser, although the sibling cleaner does strip it. A profile carrying that field would leak it. | `utils/server/tokenManager.ts:306-317` | **Pinned by a test** that says it pins a defect. |
| 7 | **NEW — the server-side cookie reader cannot work under test, and fails silently.** The module loads the framework's request reader through a bare `require` at module scope inside a `try`. The runner does not provide that `require`, so the module ends up with no reader and every server-side read returns nothing — even with the cookie present in the stand-in. A test written the obvious way passes while proving nothing. It fails the same way under a browser-like environment, where the `typeof window` guard skips the require entirely, so no environment choice fixes it. | `utils/cookies/cookie-manager.ts:3-11` | Reported. `getCookieServer` has no coverage; documented in the test file. |
| 8 | **NEW — the legacy device cookie is still read.** The rule is that it survives only in cleanup lists, never read, never written. One module declares its own copy of the name and reads the cookie through it. | `services/elastic/sellerComments.ts:91,121` | **Pinned by a test** that fails if a second reader appears. |

Findings 5, 6 and 8 have tests that pin today's behaviour and say in plain words
that the behaviour is wrong, so they cannot drift further unnoticed. Each says
what to do when the defect is fixed.

## Scope moved out

- **AC-12 and the per-request memoisation module** left this ticket at the review
  gate: it is snapshot dedupe for the listing and modal flow, not token plumbing.
  **FR-7 and the spec's OQ-10 answer move with it** — `spec.md` still lists all
  three, because only `/wf:plan` and `/wf:review` may write it. At verify they are
  recorded as moved, not passed or failed.
- The module now has no owner: `docs/testing/UNIT_TEST_ROADMAP.md:204` still
  assigns it to this phase, and this ticket may not edit that file. **It needs a
  ticket of its own, or a roadmap edit, or it silently drops off the journey.**
- The three browser-only cookie helpers stay for the client-side phase.

## Validation run during implementation

Profile `logic-change` — all three checks pass.

| Check | Result |
|---|---|
| `unit-tests` | **348 passed**, 11 files, 0 failed. Slowest new file 2.7s. |
| `typecheck` | **Exit 0.** Four errors in the new files were found and fixed. |
| `lint` | **Exit 0**, 0 errors. 36 warnings, all pre-existing in `services/` and `utils/`; none from the new files. |

Also verified along the way: the probe that answered obligation 5, and a full
suite run confirming the shared stand-in change breaks nothing — it had no
callers before this ticket.
