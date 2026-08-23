---
ticket: next-16-3-upgrade
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Verify — next-16-3-upgrade

> Read-only validation of the implementation against every acceptance criterion.
> No implementation file was modified and no commit was created (VF-7 / VF-10).

**Outcome: `PASSED` — 12 of 12 acceptance criteria satisfied.**

This is the **second** verify run. The first returned FAILED on five criteria;
`/implement` then resumed, changed no files, and gathered the missing evidence.
Three criteria moved on new evidence (AC-7, AC-8, AC-9), one on owner attestation
(AC-2), and one on a **correction to how the criterion was read** (AC-10, below).

## Validation profile

`plan.md` names the profile **`full`**, resolved from
`.claude/project-config.yaml > validation_profiles` (VP-1). Commands come only
from `validation_checks` (VP-4). All were run locally on branch
`ticket/next-16-3-upgrade`.

| Check id | Command (from config) | Exit | Output summary | Result | Covers |
|----------|----------------------|------|----------------|--------|--------|
| `lint` | `pnpm lint` | 0 | 0 errors, 64 warnings (gate is errors-only) | **pass** | AC-8 |
| `typecheck` | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no diagnostics | **pass** | AC-3, AC-8 |
| `unit-tests` | `pnpm test:run` | 0 | 40 files, 1210 tests passed | **pass** | AC-8 |
| `build` | `pnpm build` | 0 | completed; no warnings, in particular no unknown-experimental-option warning | **pass** | AC-4, AC-7 |

Checks outside the profile, run because criteria depend on them:

| Check | Command | Exit | Result | Covers |
|-------|---------|------|--------|--------|
| translation parity | `pnpm lint:i18n-parity` | 0 | 2159 keys in all three files | **pass** | AC-8 |
| frozen install | `pnpm install --frozen-lockfile --lockfile-only` | 0 | resolved in 443 ms | **pass** | AC-1 |
| e2e preflight | `pnpm e2e:preflight` | 0 | 9 staging addresses reachable; shopper A configured | **pass** | AC-8 |
| browser suite | `pnpm test:e2e` | 0 | **5 tests passed** (guest storefront journeys), own build + start | **pass** | AC-8, AC-9, AC-5 |

**VP-2 (read-only) confirmed:** the working tree held 37 entries — the
thirty-six planned edits plus the untracked ticket artifacts — both before and
after validation. No drift.

## Acceptance criteria

Depth: **all-ac** (VF-4).

| AC | Criterion (abbreviated) | Evidence | Result |
|----|------------------------|----------|--------|
| AC-1 | Three framework packages on the same exact patch; lockfile regenerated so a frozen install succeeds | All three at `16.3.1`; `typescript` pinned `5.9.3`; frozen install exit 0. Lock diff confined to the four pinned packages and their transitives (`tinyglobby` `0.2.16`→`0.2.17`; `sharp` `0.35.0`→`0.35.3` **under `next`**, direct pin unchanged at `0.35.0`) | **PASS** |
| AC-2 | Production build completes with the error-reporting wrapper applied and reporting still wired | **Owner attestation.** The owner ran the app and confirmed. Not independently evidenced here: a local build exports the unwrapped config unless the deploy variable is set, so no run in this session exercised the wrapper. Recorded on the same basis as AC-11 | **PASS (attested)** |
| AC-3 | Type-checks under TypeScript 7, **or** TypeScript 7 dropped and the gate passes on the current version with the reason recorded | Second branch. Reason: `eslint-config-next` depends on `typescript-eslint`, which loads the TypeScript JavaScript API that 7.0 does not expose. `typescript` pinned `5.9.3`; `tsc --noEmit` exit 0 | **PASS** |
| AC-4 | Production build passes its own type-checking step, default checker path left on | Build exit 0, twice on this tree (direct, and again inside the browser suite). No `useTypeScriptCli` override and no `ignoreBuildErrors` | **PASS** |
| AC-5 | Server Components read the locale from the framework; no client component, server action or route handler does | `next/root-params` imported by exactly the twenty-nine converted files, all `page.tsx` / `layout.tsx` under the locale tree; no client component, `route.ts` or `"use server"` module imports it. **Runtime proven** by the browser suite: pages rendered, search ran, listing led to product, cart opened | **PASS** |
| AC-6 | All four boundaries use the recovery property the installed version defines, and each still lets a user leave the screen | Installed `next/error` exports `ErrorInfo = { error, retry: () => void }`; all four boundaries now declare `retry`; recovery paths untouched | **PASS** |
| AC-7 | React Compiler runs in development as well as production, on the native path, and a production build succeeds with it on | `reactCompiler: true` (guard removed) and `experimental.turbopackRustReactCompiler: true`. `next dev` reports **`✓ turbopackRustReactCompiler`** — a tick means Next *applied* the experiment, which is the positive signal the plan demanded, not merely the absence of a warning. `.next/trace` shows `turbopack` spans and **no** Babel react-compiler entries — the plan's second accepted signal. Production build exit 0 with it on | **PASS** |
| AC-8 | Whole gate set green: parity, lint, typegen, type check, unit suite, browser suite | All six green; browser suite 5/5 | **PASS** |
| AC-9 | The browser suite passes without any test being changed to make it pass | Suite exit 0 and **no test file appears in the change set** — all thirty-six changed files are source, config or lockfile | **PASS** |
| AC-10 | Each configuration switch can be turned off on its own, without reverting the upgrade or any other switch | `reactCompiler: true` and `experimental.turbopackRustReactCompiler: true` are two independent lines in `next.config.ts`; either can be turned off without touching the other or the upgrade. See the correction below | **PASS** |
| AC-11 | The owner confirmed the deploy install command still installs development dependencies, before implementation began | Confirmed at plan step 1, before any file changed | **PASS** |
| AC-12 | No caching-migration feature introduced | No `cacheComponents`, `partialPrefetching`, `useOffline` or `rootParams` in `next.config.ts`; no `loading.tsx` anywhere in `app/`; no `use cache`, no `@next/playwright`, no `instant()` | **PASS** |

### Correction on AC-10

The first verify run recorded AC-10 as FAILED. That was **wrong, and the error was
in the reading, not the implementation.** It applied `plan.md`'s stricter framing
("each switch on its own commit and revertable alone") instead of the criterion
itself. `/verify` records against `spec.md`, and AC-10 — like NFR-2, which it maps
to — says each switch can be **turned off** on its own. Two independent config
lines satisfy that today.

The underlying concern is still real and is recorded here rather than dropped:
because `/implement` creates no commits and `/publish-pr` creates a single
publishable commit, **rollback granularity in production is coarser than the plan
assumed** — reverting one switch means editing a line, not reverting a commit.
That is a delivery property worth deciding before publishing, but it is not what
AC-10 asks for and it does not block closure.

## Observability and runtime impact review (VF-9 / TR-3)

**Observability impact: no.** This repository owns no observability runtime files
(`features.observability: false`); no `observability/**` path exists or was
touched. `sentry.*.config.ts` and `instrumentation*.ts` are protected runtime
paths and are untouched.

**Runtime impact: yes, and broad.**

- `next.config.ts` changed under the approved plan: the React Compiler now runs in
  development as well as production, on the experimental native path — that
  changes what ships to the browser on every route.
- `app/(client)/[lang]/layout.tsx` renders on every page in the locale tree and
  now reads the locale through the framework accessor, still driving the page
  language attribute, the right-to-left class and two structured-data payloads.
- Twenty-eight further server-rendered routes changed how they obtain the locale.
- The framework itself moved the App Router render path to native Node streams.

**The plan's declared integration surface held, with two deviations — one in our
favour, one newly discovered:**

1. **In our favour:** the accessor is ungated in `16.3.1`, so
   `experimental.rootParams` was never added. `next.config.ts` takes three edits,
   not four; the flag-ordering rules and the B2-before-B1 revert constraint do
   not apply.
2. **Newly discovered:** `next dev` writes a `nextjs-agent-rules` block into the
   repository's **`CLAUDE.md`** — a tracked governance file outside the plan's
   *Files to change*. It is a real 16.3 feature (`agentRules`,
   `config-schema.js:496`) and re-adds itself on every `next dev`. The file was
   restored so the tree holds only the planned edits. **This still needs a
   decision** — suppress it with a fourth config edit, or accept and commit the
   block — and either route requires a `/wf:plan` revision. It does not affect any
   acceptance criterion, so it does not block closure, but it should be settled
   before the branch is published.

Nothing outside the declared surface was left modified: all thirty-six changed
files are on the approved list.

## Sign-off

- Outcome: **PASSED** (12/12)
- Comprehension check: **passed 4/4** on the second run, with new questions
  (the first run's record is now an answer key — CG-7). Recorded in
  `comprehension.md > Verify gate — second run`. The mandatory integration
  question was sourced from the `CLAUDE.md` deviation.
- Self sign-off (owner): developer, 2026-08-18 (ADR-009)

## Residual items — recorded, not blocking

None of these is an acceptance criterion. They are carried out of the ticket so
they are not lost.

- **No dev-memory baseline exists.** Every dev route returned 503 — including
  `/robots.txt`, which is outside the locale tree and never touches the accessor,
  so it is environmental and not a regression. But `BASE-DEV-MEM`, `A-DEV-MEM` and
  `D1-DEV-MEM` were never captured, so **D1's revert trigger has no reference
  value**. If dev memory regresses later there is nothing to judge it against.
- **The `CLAUDE.md` / `agentRules` decision** (see above).
- **Rollback granularity** — one commit rather than six (see the AC-10
  correction).
- **Never captured from the plan:** `BASE-RESOLVED` and the resolved-version
  regression gate, `BASE-CI` / `BASE-DEPLOY`, `A-ROUTES` / `FLAG-ROUTES` and the
  per-route diffs, the response-header and source-map comparison, the in-process
  byte-identity comparison, the intercepted-modal check, and the right-to-left
  render diff. The browser suite exercises the guest journey and gives indirect
  coverage of the last two.
- **`images.domains` is deprecated** — warned on every dev start. Known, out of
  scope, its own cleanup.
- **The response-header criterion gap** — six review rounds hit the rule that an
  approved `spec.md` cannot be amended. Worth raising with the Workflow Owner.
