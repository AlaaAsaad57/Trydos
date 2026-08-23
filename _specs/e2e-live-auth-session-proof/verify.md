---
ticket: e2e-live-auth-session-proof
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Verify — e2e-live-auth-session-proof

> Final validation and impact review before the ticket is closed.

## Checks performed

- **Validation profile: none.** `plan.md` names none (VP-5), because no profile in
  `.claude/project-config.yaml` covers the browser suite and naming one would have
  forbidden writing the live-run command into the plan (VP-4). Validation is the
  free-form set below.

Depth is `all-ac` (VF-4 / MO-6): every acceptance criterion is mapped to a result.

| AC ID | Check / test case | Command (resolved) | Exit | Output summary | Result |
|-------|-------------------|--------------------|------|----------------|--------|
| AC-1 | `AUTH-01` — the stored profile carries an identity for the account that signed in | `pnpm test:e2e:live -- auth.live.spec.ts` | 1 | The identity judgement raised no error; the only failure reported in `AUTH-01` is the wallet one | **pass** |
| AC-2 | `AUTH-01` — the storefront credential is marked unreadable by page scripts | same run | 1 | The `httpOnly` judgement raised no error | **pass** |
| AC-3 | `AUTH-03` — no per-backend session state survives signing out | same run | 1 | `AUTH-03` passed (12.7s) | **pass** |
| AC-3b | `AUTH-03` — the three names a guest also gets are back and **changed** | same run | 1 | `AUTH-03` passed; the settle wait only completes once both credentials are held again *and* differ | **pass** |
| AC-3c | `AUTH-03` — the account now named is neither the signed-out one nor verified | same run | 1 | `AUTH-03` passed | **pass** |
| AC-4 | `AUTH-02` — a backend answers an authenticated request after a full reload | same run | 1 | `AUTH-02` passed (28.5s) | **pass** |
| AC-5 | Three rows under an `AUTH-` range of their own | `docs/testing/E2E_SCENARIOS.md` | — | `## Signed-in journeys` holds `AUTH-01`..`AUTH-03`, separate from `GUEST-01`..`GUEST-41` | **pass** |
| AC-6 | Five backends judged separately; a partial sign-in is not a pass; no count | same run | 1 | Five separate judgements; four landed, the wallet did not, and the case failed | **pass** |
| AC-7 | The failure names each backend that did not land | same run | 1 | `the wallet sign-in did not land (the app reported WALLET)` | **pass** |
| AC-8 | The run reports the wallet by name (or all five landed, if repaired) | same run | 1 | The wallet is reported by name, as `C-10` predicted | **pass** |

**Outcome: PASSED** — every acceptance criterion passes.

### On `AUTH-01` being red

`AUTH-01` fails on every run, and that is the criterion being **met**, not missed.
`AC-8` says in terms that a green run which says nothing about the wallet would
*not* satisfy it. The wallet backend is genuinely broken on staging; this ticket's
job was to make that visible and named, and it does. Repairing it is a separate
ticket (`C-10`, and `spec.md > Out of Scope`).

The red is confined to the wallet. Nothing else in `AUTH-01` raised an error, which
is how `AC-1`, `AC-2`, `AC-6` and `AC-7` are recorded as passing from a failing case:
the judgements are soft, so all ten report in one run instead of the first failure
hiding the rest.

## Commands run

- `npx next typegen && npx tsc --noEmit --pretty false`
  ```
  0 errors
  ```
- `npx eslint .`
  ```
  ✖ 64 problems (0 errors, 64 warnings)     exit 0
  ```
  Warnings only, none from this ticket's files.
- `pnpm test:run`
  ```
  Test Files  43 passed (43)
        Tests  1265 passed (1265)
  ```
- `pnpm lint:i18n-parity`
  ```
  ✓ i18n parity OK — 2161 keys present in all three files.
  ```
- `pnpm e2e:health`
  ```
  [e2e] staging health check passed.
  ```
- `pnpm test:e2e:live -- auth.live.spec.ts`
  ```
  ✘  1 auth.live.spec.ts:137 › AUTH-01 a real sign-in lands on every backend it writes for (37.7s)
  ✓  2 auth.live.spec.ts:209 › AUTH-02 a signed-in session still works after a full page reload (28.5s)
  ✓  3 auth.live.spec.ts:249 › AUTH-03 signing out takes the whole session away (12.7s)

  Error: the wallet sign-in did not land (the app reported WALLET)

  1 failed
  43 passed (5.7m)
  ```

**Stability.** The live suite was run twice on the final code, minutes apart, with
identical results — `AUTH-01` red on the wallet, `AUTH-02` and `AUTH-03` green.
That matters under `retries: 0`, where a flaky wait is indistinguishable from a
defect. Observed wall clock: 37.7s / 28.5s / 12.7s, all well inside the
120-second per-case limit.

**One unrelated failure, and its resolution.** The first run also showed
`guest.live.spec.ts` › "search finds products" failing with "search returned
nothing at all". It passed on the second run. That case is `GUEST-03`, in a file
this ticket does not touch — a transient staging search result, not a regression.

**A note on `OQ-9` / `C-7`.** Research recorded that `pnpm e2e:health` could not
reach the staging search node from this machine, and the plan said `/verify` would
block if no reachable machine were available. It passes now, so the live run — the
only thing that can prove these criteria — was performed here rather than deferred.

## Observability & runtime impact review

- **Were any `observability/` runtime configs changed by this ticket? — No.**
  This repository owns no observability runtime files at all
  (`.claude/project-config.yaml > features.observability: false`), and none of the
  six changed files is under such a path.
- **No application runtime impact.** No file under `app/`, `components/`,
  `services/`, `utils/` or `serverRequests/` was changed, and no protected runtime
  path (`proxy.ts`, `next.config.ts`, the instrumentation files,
  `.github/workflows/**`) was touched. The change is test and documentation code
  only.
- **What it costs a run.** One real one-time code and one real sign-in against
  staging, plus two throwaway guest registrations. Nothing is created that needs
  cleaning up.
- **Credential handling.** The signed-in session is written to `tests/e2e/.auth/`,
  a path `.gitignore` already reserves for exactly this, is not the directory the
  pipeline uploads, and is cleared at the start of the run and again when the last
  case that needs it finishes. Confirmed absent after the verification run.

## Sign-off

- Outcome: **verified**
- Final ticket state: `closed`
- Sign-off: developer (owner; self sign-off, ADR-009), recorded after the
  comprehension check passed **4/4** (`comprehension.md > Verify gate`), including
  the mandatory integration question on the plan's Integration surface versus what
  the implementation actually did.
- Commit: none created at verify (VF-10 / ADR-008 — committing is the delivery
  boundary's job, owned by `/publish-pr`)
- Notes: the six `major` findings carried into `/implement` as accepted risk were
  **all fixed**, not shipped. The two the owner escalated to must-fix — the
  sign-out settle signal and the `AC-4` anchor — are proven by `AUTH-03` and
  `AUTH-02` passing. One red test during implementation was correctly diagnosed as
  a fault in the test rather than the app, under the rule now in `CLAUDE.md`, and
  no application code was touched as a result.
