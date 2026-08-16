---
ticket: unit-tests-otp-locks-refresh-and-dedup
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-15
links:
  clickup:
  github:
---

# Implement — unit-tests-otp-locks-refresh-and-dedup

> Record of what was actually built, following `plan.md`.

## Changes made

**93 new tests across five files.** No module under test was modified (NFR-2).
The suite went from 443 to 536 tests, and from 13 files to 18.

| File | Tests | Criteria |
|---|---|---|
| `tests/utils/otpLocks.test.ts` | 18 | AC-1..AC-7 |
| `tests/utils/server/otpIdentity.test.ts` | 25 | AC-8..AC-14 |
| `tests/utils/server/otpTelemetry.test.ts` | 11 | AC-15..AC-17 |
| `tests/utils/server/authRefresh.test.ts` | 30 | AC-18..AC-28 |
| `tests/serverRequests/requestDedup.test.ts` | 9 | AC-29, AC-30 |

**Protected path (C-1 / TR-3).** No file was added or changed inside
`serverRequests/**`. The dedup test sits in the `tests/serverRequests/` mirror,
and the file says why at the top.

## Changes prepared (uncommitted)

- `tests/mocks/serverOnly.ts` — **new.** Stand-in for the `server-only` marker,
  which is not an installed package and cannot resolve in the runner. Resolves
  to nothing in a server-like test and **throws in a browser-like one**, so the
  boundary the marker exists to defend is kept rather than dropped (FU-10).
- `vitest.config.mts` — **modified.** One `resolve.alias` entry pointing
  `server-only` at that stub. Nothing else changed; the coverage block is
  untouched (C-6).
- `tests/utils/otpLocks.test.ts` — **new.** The lock store as a user meets it:
  cooldown countdown, the distinct-number cap, the rolling window, storage that
  misbehaves, and the no-browser case.
- `tests/utils/server/otpIdentity.test.ts` — **new.** Stable keys per visitor,
  address reduction in seven forms, the durable visit id and its lifetime, the
  cannot-write-cookies case, and the guest-registration branch.
- `tests/utils/server/otpTelemetry.test.ts` — **new.** The recording path first,
  then the two silences measured against it.
- `tests/utils/server/authRefresh.test.ts` — **new.** The full outcome ladder for
  all three helpers, what a success writes, backend routing by visitor type,
  locale, both stories reply shapes, and the single-flight behaviour.
- `tests/serverRequests/requestDedup.test.ts` — **new.** Key handling, promise
  sharing, and the pinned behaviour when shared work fails.
- `docs/testing/UNIT_TEST_ROADMAP.md` — **modified, carried, not authored here.**
  This edit predates the branch: it is the intake's own correction of the Phase 8
  row (this slug, the dedup module moved off Phase 5, the 🔒 marker, corrected
  line counts). It was uncommitted on `develop` when the branch was cut. Carried
  onto the branch by the owner's decision so the roadmap and the phase it
  describes land together, rather than being stashed or committed to the base
  branch outside a PR.

## Deviations from plan

All four are the review's own follow-ups or a direct consequence of one. None
changes scope, criteria, or which modules are covered.

- **The stub moved to `tests/mocks/serverOnly.ts`** instead of a new
  `tests/stubs/` folder (FU-7). The setup file states in writing that a helper
  only some tests want belongs in `tests/mocks/`; a fourth location for one file
  was not worth it.
- **The stub is conditional, not empty** (FU-10). An empty stub would make the
  marker mean nothing in the runner. This one moves where the rule is enforced —
  the build decides by bundle, the stub decides by test environment — so a
  browser-like test that reaches server code still fails loudly, with a message
  saying what to do.
- **A `releaseWhen` helper was added to the refresh tests.** Not in the plan; the
  need was found while writing. Releasing a held reply after one turn of the
  event loop releases nothing, because the helper reads cookies and resolves the
  backend before it calls out. The helper waits, bounded, until the expected
  callers have actually reached the network and then fails with a sentence —
  "only 1 of 2 caller(s) reached the network" — instead of a five-second timeout.
- **`module` was renamed to `refresh`** in two table-driven tests. `pnpm lint`
  forbids assigning to that name.

## Findings

Recorded, not fixed (NFR-2, roadmap rule 4). Three were found by writing the
tests; the rest come from the review panel and are logged here so a later change
to any of them is a decision somebody makes on purpose.

- **F-1 — an expired lock is pruned on read but not written back.**
  `read()` drops dead entries from the copy it is working on and never stores
  that copy, so the entry is still in session storage after a read. It is cleared
  only when something else writes. Harmless today (reads report the pruned
  answer, and the store is thrown away with the tab), but "expired" and "gone"
  are not the same moment. Pinned by *"forgets an expired lock, and clears it out
  on the next write"*. **My first version of that test asserted the opposite and
  failed** — which is how the behaviour was found.
- **F-2 — a rejected refresh credential stays in the jar.** An upstream
  rejection returns `invalid` and deliberately does not delete the stored
  credential, because a rejection cannot tell "this is dead" from "a concurrent
  winner already rotated it". The cost is that a genuinely dead credential is
  carried on every later request until something else clears it. Pinned as a
  characterization test (FU-11) — unreviewed, not endorsed.
- **F-3 — the dedup store never evicts, including on failure.** Two consequences,
  neither visible from the helper: a single refused call is the answer every
  later caller in that render gets, with no second attempt; and the map only
  grows, with keys the caller builds from the address (search terms, sort,
  filters), so what goes in is influenced from outside and nothing bounds how
  many distinct keys one request can create. Both are contained by the store
  being discarded at the end of the request (FU-13).
- **F-4 — the framework's per-request memo does nothing outside a render.** In
  both builds, with no render in progress it hands the work straight back and
  keeps nothing. Any future test of a module built on it must supply the store
  itself. The consequence for this ticket is stated in the dedup file: it proves
  our key handling and sharing, not the framework's per-request scoping.
- **F-5 — `server-only` is not an installed package.** `require.resolve` fails on
  it; the framework's build is what resolves it. Every module carrying that
  import was unloadable in the runner until this ticket. Now aliased.
- **F-6 — the conventions document no longer matches practice.**
  `docs/testing/UNIT_TESTING.md` says colocate unless the source is under a
  sensitive path, but `utils/fetchData.ts` and `utils/server/tokenManager.ts` are
  both unprotected and both mirrored; only the Phase-1 example is colocated. This
  ticket mirrors all five for one location per ticket. The document is stale in a
  second place too: its coverage section says the include list "names files, not
  folders", and it has listed folders since Phase 3. Correcting both lines is its
  own small ticket (OQ-1).
- **F-7 — the mirror shape is not consistent either.** `tests/utils/tokenManager.test.ts`
  flattens `utils/server/`; this ticket nests it (`tests/utils/server/…`), which
  is the shape the document describes. The existing flattened file is the odd one
  out (FU-8).
- **F-8 — the limiter identity is an unsalted, truncated hash.** Session and
  address keys are SHA-256 cut to 32 hex characters, with no salt, and v6
  addresses are collapsed to a /64. That is a brute-forceable hash over personal
  data (the v4 space is small enough to enumerate), and the /64 width is an
  evasion budget for anyone holding a larger prefix. Both are trade-offs nobody
  has revisited; a later salt or width change should be a decision, not a test
  failure (FU-12).
- **F-9 — the raw client address is exported to a third-party analytics
  processor.** AC-16 pins that `ip` carries the real address as an ordinary event
  property, which is the point of the server-side record — but it is a privacy
  decision nobody has signed off. Pinned, not endorsed (FU-12).
- **F-10 — AC-35 needed no work.** The outcome vocabulary
  (`refreshed | no-token | invalid | ineligible | unavailable`) already matches
  what `tests/serverRequests/HandleAuthedFetch.test.ts` stands in for. Confirmed
  by reading both; no disagreement to record.
- **F-11 — one AC-34 inspection note.** The telemetry test contains the analytics
  service's capture address, because that is the constant the module posts to and
  the test asserts on it. That is a third-party processor, not one of our
  backends, and the value is asserted rather than authored. Our two backends are
  referred to only as "core" and "gateway" throughout. Existing env-var names
  (`GO_BACKEND_URL`) are quoted as-is under the FU-16 carve-out.
- **F-12 — the rollback claim needs one qualifier.** Deleting the five test files
  reverts this ticket, but the `server-only` alias is shared harness that later
  phases will build on. Once one of them lands, removing the alias is a
  harness-level change, not this ticket's undo (FU-9).

## Follow-up actions from review

All sixteen were applied. Where one is visible in the code, the file says why in
its own words rather than citing the id.

| FU | Where it landed |
|---|---|
| FU-1 | All four base URLs stubbed to reserved unresolvable hosts; every ladder case asserts the recorded address, not only the returned status. |
| FU-2 | The telemetry file writes the recording path first and measures the two silences against it; the runner's `env` block is named in the file's opening comment as the reason. |
| FU-3 | Every credential, key and address in the five files is invented and self-describing; addresses come from the documentation ranges. Nothing was copied from an env file or a session. |
| FU-4 | The after-response stand-in collects callbacks and flushes them inside the test body; `afterEach` fails the test if anything is left unflushed; `fetch` is stubbed per test. |
| FU-5 | `vi.setConfig({ testTimeout, hookTimeout })` in the refresh and dedup files; every gate released in `afterEach`; every failure handle watched before the failure is triggered. |
| FU-6 | Fake timers are used only in the lock-store file, which makes no network call, and real timers are restored in `afterEach`. |
| FU-7 | Stub lives in `tests/mocks/serverOnly.ts`. |
| FU-8 | Nested mirror shape kept; the flattened file recorded as the odd one out (F-7). |
| FU-9 | Recorded as F-12. |
| FU-10 | Stub throws in a browser-like environment; all four server test files declare the server-like one. |
| FU-11 | Recorded as F-2, pinned by the AC-19 test with the reasoning in the test itself. |
| FU-12 | Recorded as F-8 and F-9. |
| FU-13 | Recorded as F-3, with both consequences named. |
| FU-14 | Only the single-flight block reloads the module; the ladder tests share one import. The file's runtime went from 15.5s to 0.26s once the concurrency tests stopped timing out. |
| FU-15 | Second pass run with `--sequence.shuffle`. |
| FU-16 | Recorded as F-11; `verify.md` carries the statement. |

## Validation run during implementation

Profile: `logic-change` (lint, typecheck, unit-tests).

- `pnpm test:run` — **pass.** 18 files, 536 tests, 0 failures.
- `pnpm test:run` with `--sequence.shuffle` (seed 1786791141063) — **pass.** Same
  18 files, 536 tests. Proves AC-32 against ordering leakage, not just repetition
  (FU-15).
- `node_modules/.bin/tsc --noEmit --pretty false` — **pass.** No output.
- `pnpm lint` — **pass.** 0 errors, 37 warnings, every warning pre-existing in
  `services/**` and `utils/**`; none in a file this ticket touched.
- Per-file runs while writing: 18 / 25 / 11 / 30 / 9 tests passing.
- AC-33 by inspection: `git status` shows exactly the planned files plus the
  carried roadmap edit. No module under test appears.
- AC-34 by inspection: searched all five files for technology names; the only hit
  is the analytics capture address, explained in F-11.

**Three failures were hit and fixed while writing, all in the tests, none in the
code under test.** They are worth naming because each one was the harness lying
rather than a typo: an assertion that expected pruning to persist (became F-1); a
storage stand-in that silently did nothing, because defining a property on the
browser-like storage stores an *item* by that name instead of replacing the
method; and three concurrency tests that timed out because a held reply was
released before the callers had reached the network. The last one is exactly what
FU-5's timeouts were for — it failed in five seconds per test rather than hanging
the run.
