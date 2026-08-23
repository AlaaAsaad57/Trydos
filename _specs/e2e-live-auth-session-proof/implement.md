---
ticket: e2e-live-auth-session-proof
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-22
links:
  clickup:
  github:
---

# Implement — e2e-live-auth-session-proof

> Record of what was actually built, following `plan.md`.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008). Left as working-tree edits
> on `ticket/e2e-live-auth-session-proof`, branched from `develop`.

- `tests/e2e/selectors.ts` — two additions to the `auth` group: the account-menu
  trigger and the sign-out item, each documented with what it does **not** prove.
- `tests/e2e/harness/session.ts` — the sign-in outcome recorder, plus a new
  header section naming it as the file's one permitted response-body reader and
  listing the five properties any future edit must keep. The existing credential
  helpers are **untouched**.
- `tests/e2e/actions/auth.ts` — the reduced session reader, the account-menu and
  sign-out verbs, the cart-answer proof, the per-backend proof replacing
  `verifyCookiesSet`, three new timeout constants, and the stale "90-second"
  comment corrected to the real 120 seconds.
- `tests/e2e/auth.live.spec.ts` — rewritten as `AUTH-01`..`AUTH-03`. The previous
  single case is replaced.
- `docs/testing/E2E_SCENARIOS.md` — new `## Signed-in journeys` section with the
  three rows and the per-run cost; the guest preamble corrected, since it said
  nobody signs in.
- `docs/testing/E2E_TEST_DESIGN.md` — the shared-session rule, the marker-is-not-
  a-state warning, the shared-testid warning, a new "a failing case must name the
  backend" section, and §9 corrected: one-login-per-run via `globalSetup` is
  described as planned, not built.

**No application code was changed.** No protected runtime path was touched.

## How the two hard proofs were actually solved

Both were required fixes, not accepted risk (`review.md` follow-ups 9 and 10).

**Signing out (`AC-3`, `AC-3b`, `AC-3c`).** The wait keys on the replacement
guest **landing**: both credentials held again *and* both different from the
signed-in ones. Held alone is true before signing out; changed alone is satisfied
by the deletion, because the comparison counts absent as different. Only the pair
means a new guest arrived. The existing mark-blind `waitFor` is not used.

**Surviving a reload (`AC-4`).** Proven by a positive upstream answer, not an
absence: the cart is opened and the case waits for a backend to answer the read
it triggers. A refused credential cannot produce that answer. Waiting for it is
also what makes the two absence checks that follow meaningful — the "sign in
again" prompt is raised two round trips after the first refusal, so a case that
looked earlier would always find nothing. A credential rotation is a **pass**: a
successful renewal keeps the same shopper signed in.

## Deviations from plan

1. **The shared session is handed on through a saved `storageState` file, not a
   shared variable.** The plan said one context held across the three cases. That
   is not possible: Playwright discards the worker process after a failing test,
   so module-level state is gone the moment a case goes red — and this file's
   first case is *expected* red while the wallet is broken. Two runs proved it:
   `AUTH-02` and `AUTH-03` failed in 6ms with "AUTH-01 did not complete" even
   though `AUTH-01` had reached the handover. The session is now written to
   `tests/e2e/.auth/`, which `.gitignore` already reserves for exactly this, is
   not the uploaded directory, and is cleared at the start of the run and again
   when the last case that needs it finishes. Each case reads what it needs from
   that session and compares against its own earlier reading, so nothing is
   carried between cases in memory.
2. **Cleanup is not in `afterAll`.** For the same reason: `afterAll` runs at
   worker teardown, so it fired straight after the failing `AUTH-01` and deleted
   the session before `AUTH-02` could open it. Caught by a run, not by reading.
3. **`AC-1`, `AC-2` and the "was the sign-in answer seen" check are soft.** The
   plan implied hard assertions. Soft means one failure does not hide the other
   nine judgements, which is the ticket's own principle applied to itself. Still
   fail-closed: an unseen sign-in answer is reported, never treated as "nothing
   went wrong".
4. **`verifyCookiesSet` was removed, not left as a shim.** Its only caller was
   rewritten, so a shim would have been dead code.

## A red test that turned out to be the test, not the app

Recorded because `CLAUDE.md` now requires this sequence, and this is the first
time it ran.

`AUTH-02` failed with "the cart was opened but no backend answered it". Before
touching any application code, the app was read: `utils/fetchData.ts` sends the
endpoint in the **`x-proxy-url` header**, and a `GET` through the proxy sends no
body at all — so the matcher, which looked in the request body, could never
match. **The app was correct and the test was wrong.** The matcher was changed to
read the header, and the re-run turned `AUTH-02` green. No application code was
touched, and none needed to be.

## Validation run during implementation

- `npx next typegen && npx tsc --noEmit` — **0 errors**.
- `npx eslint tests/e2e/` — **clean**.
- `pnpm test:run` — **1265 passed, 43 files**. (An earlier run showed 51
  failures; every one was inside a stray `.kilo/worktrees/` copy of the repo that
  the Vitest glob was picking up. The owner removed the directory and the suite
  is green. Nothing in this ticket caused them.)
- `pnpm e2e:health` — **passed**. The staging search node is reachable from this
  machine, which it was not at research time (`OQ-9`, `C-7`). The live run was
  therefore possible here.
- `pnpm test:e2e:live -- auth.live.spec.ts` — final run:
  - `AUTH-01` — **red, naming the wallet**: `the wallet sign-in did not land (the
    app reported WALLET)`. This is the **expected and correct** result (`C-10`,
    `AC-8`). Only the wallet is named; the storefront, chat, stories and comments
    parts all landed.
  - `AUTH-02` — **passed** (24.3s).
  - `AUTH-03` — **passed** (12.7s).

Observed wall clock: `AUTH-01` ~38s, `AUTH-02` ~24s, `AUTH-03` ~13s — all well
inside the 120-second per-case limit. One real one-time code and one real sign-in
per run, as budgeted.

**Unrelated failure in the same run:** `guest.live.spec.ts` › "search finds
products" failed with "search returned nothing at all". That case is `GUEST-03`,
in a file this ticket does not touch, and it is a staging search result, not a
regression from this work.

## Acceptance criteria, as observed

Recorded for `/verify` to confirm, not to replace it.

| AC | Result | Evidence |
|----|--------|----------|
| AC-1 | met | `AUTH-01` — the stored profile carries a numeric account id |
| AC-2 | met | `AUTH-01` — the storefront credential is marked `httpOnly` |
| AC-3 | met | `AUTH-03` passed — no per-backend session state survives |
| AC-3b | met | `AUTH-03` passed — the three shared names are back and changed |
| AC-3c | met | `AUTH-03` passed — a different, unverified account is named |
| AC-4 | met | `AUTH-02` passed — a backend answered after the reload |
| AC-5 | met | three rows in `E2E_SCENARIOS.md` under their own `AUTH-` range |
| AC-6 | met | five separate judgements; four landed, the wallet did not |
| AC-7 | met | the failure names the wallet and quotes the app's own label |
| AC-8 | met | the run reports the wallet by name, as `C-10` predicted |
