---
ticket: unit-tests-authed-fetch-and-tokens
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-11
links:
  clickup:
  github:
---

# Verify — unit-tests-authed-fetch-and-tokens

> Final validation and impact review before the ticket is closed.

## Checks performed

> Every acceptance criterion is mapped to a result at depth `all-ac`.

- Validation profile: `logic-change`

Resolved from `.claude/project-config.yaml`: profile → checks → commands. All
three ran locally, non-interactively, and left the working tree unchanged (VP-2).

| Check | Command (resolved) | Exit | Output summary | Result |
|---|---|---|---|---|
| `unit-tests` | `pnpm test:run` | 0 | 11 files, **348 tests passed**, 0 failed, 15.4s | pass |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no output — no type errors | pass |
| `lint` | `pnpm lint` | 0 | **0 errors**, 39 warnings across 25 files, none in this ticket's files | pass |

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | "carries the shopper's token and hands the answer back untouched" | `pnpm test:run` | 0 | token attached as expected; answer unchanged | pass |
| AC-2 | "still sends the request when there is no token" | `pnpm test:run` | 0 | request sent, no identity header | pass |
| AC-3 | "hands the rejection back and mints nothing at all" (sign-out in flight) | `pnpm test:run` | 0 | 401 returned; 0 registrations, 0 writes, 0 deletes | pass |
| AC-4 | "hands the rejection back and spends nothing single-use" (writes refused) | `pnpm test:run` | 0 | 401 returned; exchange never called; 0 writes | pass |
| AC-5 | "exchanges it exactly once and retries exactly once" | `pnpm test:run` | 0 | 1 exchange, 2 attempts, 0 registrations | pass |
| AC-6 | "gives the rejection back when the exchange does not succeed" | `pnpm test:run` | 0 | 401 returned; 0 registrations; no second attempt | pass |
| AC-7 | "gives the rejection back rather than replacing the account with a guest" | `pnpm test:run` | 0 | 401 returned; 0 registrations | pass |
| AC-8 | "creates one guest identity, clears the old one, and retries once" + "stores the new pair hidden from the browser" | `pnpm test:run` | 0 | 1 registration, 2 attempts, 7 sub-service cookies deleted, options asserted | pass |
| AC-9 | "stops after one retry when the retry is rejected too" | `pnpm test:run` | 0 | 1 registration, exactly 2 attempts, no recursion | pass |
| AC-10 | two tests: creation fails (500), and creation returns no credential | `pnpm test:run` | 0 | 0 deletes; existing cookie values intact | pass |
| AC-11 | 13 transport tests: retryable vs permanent, backoff schedule, report shape | `pnpm test:run` | 0 | delays recorded `[400, 800, 1000, 1000]`; body bounded; status preserved | pass |
| AC-12 | — | — | — | **Moved out of scope at the review gate** (round 1, follow-up 8): the per-request memoisation module is snapshot dedupe for the listing and modal flow, not token plumbing. FR-7 and the spec's OQ-10 answer move with it. Not a failure — a scope decision recorded in `review.md` and `plan.md`. | moved |
| AC-13 | 5 cookie-name tests + the legacy-cookie read pin | `pnpm test:run` | 0 | single auth cookie confirmed; one legacy reader pinned (finding 8) | pass |
| AC-14 | 11 hidden-cookie tests + the list-divergence pin | `pnpm test:run` | 0 | every token/profile cookie hidden; divergence pinned (finding 5) | pass |
| AC-15 | 7 cookie-shape tests incl. both environment branches | `pnpm test:run` | 0 | 48h default, 30d refresh, 1y profile; `secure` false and true both asserted | pass |
| AC-16 | 9 credential-lookup tests | `pnpm test:run` | 0 | each service gets its own; empty for search, unknown and legacy | pass |
| AC-17 | 10 verified-detection tests | `pnpm test:run` | 0 | all six non-verified phone values; failure falls back to guest | pass |
| AC-18 | 7 routing tests | `pnpm test:run` | 0 | verified → core, guest → gateway; query strings and trailing segments | pass |
| AC-19 | 7 cleaner and masking tests | `pnpm test:run` | 0 | tokens and private fields stripped; short credential fully hidden | pass |
| AC-20 | no source file changed; 8 findings recorded; 3 defects pinned | `git status --porcelain` | 0 | only `tests/` and `_specs/` changed — no file under test modified | pass |

**19 pass, 1 moved, 0 fail.**

## Commands run

- `pnpm test:run`
  ```
  Test Files  11 passed (11)
       Tests  348 passed (348)
    Duration  15.40s
  ```
- `node_modules/.bin/tsc --noEmit --pretty false`
  ```
  (no output; exit 0)
  ```
- `pnpm lint`
  ```
  ✖ 39 problems (0 errors, 39 warnings)
  ```
  All 39 are pre-existing warnings in `services/` and `utils/` — anonymous
  default exports and unused disable directives. A search of the report for the
  ticket's files returns nothing. (`implement.md` recorded 36 from an earlier run
  of the same command; the verify run is the authoritative number. Neither run
  reported an error, and neither attributed anything to this ticket.)
- `git status --porcelain` — after all three checks, the working tree still shows
  only `tests/mocks/nextHeaders.ts` modified plus the three untracked
  directories. Validation changed nothing (VP-2, VF-7).

## Observability & runtime impact review

- **Were any `observability/` runtime configs changed by this ticket? No.** This
  repository owns no observability runtime files (`features.observability: false`
  in `.claude/project-config.yaml`), and no such path exists in the tree.
- **Were any protected runtime paths changed? No.** `proxy.ts`, `next.config.ts`,
  the instrumentation and Sentry configs, and `.github/workflows/**` are all
  untouched.
- **Runtime impact: none.** Every change is a test file or an additive change to
  a test stand-in that had no callers before this ticket. No application code
  path, no configuration the app reads at runtime, and no shared test settings
  were altered. The product behaves exactly as it did before this branch.
- **What the ticket does change is future work.** The cookie names, lifetimes,
  same-site rules and routing allow-list are now pinned by tests. A later change
  to any of them will fail this suite — intended, and worth knowing before
  someone edits them expecting silence.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer — self sign-off (ADR-009), comprehension check passed 5/5
  including the mandatory integration question, which was drawn from the one
  place the plan's declared surface proved incomplete.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`).
- Notes:
  - **Eight findings are recorded and none is fixed** (AC-20). Three of them —
    the disagreeing hidden-cookie lists, the unstripped refresh token, and the
    legacy cookie still being read — are pinned by tests that say in plain words
    that they pin a defect, and each says what to do when it is fixed.
  - **Two findings deserve their own tickets soon.** The failure reporter copies
    raw credentials into every report it sends, and one module still reads the
    legacy device cookie that the rules say must never be read.
  - **One loose end this ticket cannot close.** The memoisation module left this
    ticket's scope, but `docs/testing/UNIT_TEST_ROADMAP.md:204` still assigns it
    to this phase, and no command here may edit that file. Without a ticket or a
    roadmap edit it silently drops off the journey.
  - **`spec.md` still lists AC-12, FR-7 and the OQ-10 answer.** Only `/wf:plan`
    and `/wf:review` may write that file, so the drift is recorded here rather
    than edited away.
