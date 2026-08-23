---
ticket: next-16-3-upgrade
stage: implement
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Implement — next-16-3-upgrade

> **Resumed once** after `/verify` returned FAILED. The resume added no file
> changes — all thirty-six were already applied — and instead ran the planned
> steps that the first pass had scoped out (plan steps 12–13 and the browser
> suite in step 15). See *Resume — evidence gathered* near the end.

> Entry path: **initial** (from `state: approved`), then **resume** (from
> `state: implementation-in-progress`).
> Branch: `ticket/next-16-3-upgrade`, created from a clean **`develop`** — this
> repository's base branch overrides the shared rule's `main` (CLAUDE.md >
> Project profile). No commit was created and nothing was pushed (IM-9).

## Step 6 findings — the three checks the plan branched on

These were run against the **installed** `next@16.3.1`, not the documentation,
exactly as the plan required. All three changed what the implementation did.

1. **The locale accessor is no longer flag-gated.** In `16.2.11` it was:
   `config-shared.d.ts` declared an `experimental.rootParams` boolean and the
   build rejected the import without it. In `16.3.1` the guard message is gone
   from `dist/build/` entirely, `root-params.js` / `root-params.d.ts` ship as
   real entry points, and the accessor is wired through app-render. The
   `experimental.rootParams` key survives in the config schema but is no longer
   required and is dropped from the typed config surface.
   **This is the "stable" branch the plan wrote for (FU-48 / FU-66).**
2. **The accessor is typed `string | undefined`.** `next typegen` generated
   `declare module 'next/root-params' { export function lang(): Promise<string | undefined> }`,
   because five root layouts exist and `[lang]` is in only one. `tsconfig.json`
   has `strictNullChecks: false`, so **the type gate cannot catch splitting an
   undefined value** — the plan predicted this and it is confirmed.
3. **The error-boundary contract is `retry`.** `next/error` exports
   `ErrorInfo = { error, retry: () => void }`. The four boundaries declared
   `reset`, so **slice C was not dropped** — it was needed.

## Changes prepared

Thirty-six files, all from `plan.md > Files to change`, left as **uncommitted
working-tree edits** (IM-9). No file outside that list was touched (IM-4).

**Dependencies (slice A)**

- `package.json` — `next` `16.2.11`→`16.3.1`; `eslint-config-next` and
  `@next/bundle-analyzer` `16.2.10`→`16.3.1`; `typescript` `^5.9.2`→`5.9.3`
  (exact pin — not TypeScript 7, does not reopen `OQ-8`). All three framework
  packages resolve to the same patch, so AC-1 needed no same-minor fallback.
- `pnpm-lock.yaml` — regenerated. Diff confined to the four pinned packages and
  their transitives: `tinyglobby` `0.2.16`→`0.2.17` and `sharp` `0.35.0`→`0.35.3`
  **as a transitive under `next`** — the direct `sharp` pin is unchanged at
  `0.35.0` (`specifier: 0.35.0, version: 0.35.0`).

**Framework configuration — three edits, not four**

- `next.config.ts` — removed the `!isDev` guard (`reactCompiler: true`), rewrote
  the comment that described three guards so it no longer misdescribes the two
  that remain, and added `experimental.turbopackRustReactCompiler: true`.
  **The `experimental.rootParams` edit was not made** — see finding 1.

**Error boundaries (slice C) — `reset` → `retry`**

- `app/global-error.tsx`, `app/(special)/callInProg/error.tsx`,
  `app/(special)/call_direct/error.tsx`, `app/(special)/endCall/error.tsx`.
  Aligned, not deleted, so AC-6 stays answerable. None of the four calls the
  property (all recover via `window.location.reload()` or `href="/"`), so this is
  a rename of an unused parameter and the user-facing recovery path is unchanged.

**Locale accessor (slice B) — twenty-nine files**

Converted to `import { lang as langParam } from "next/root-params"` +
`const lang = await langParam()`. The alias keeps every existing local variable
name, so the diff stays minimal and the split into country/language is byte-identical
to before.

- Twenty-eight leaf files, then `app/(client)/[lang]/layout.tsx` last.
- Files whose only use of `params` was the locale had the `params` prop removed
  entirely — that is the actual prop-drilling win.
- Files that also read a non-root parameter kept `params` for it:
  `products/[productId]`, `filters`, `featured`, `flashDeals`, both `@modal`
  routes, `settings/orders/[id]` (order id) and
  `sellerProfile/sellerDashboard/[sellerId]` (seller id).
- **What did not change:** the locale properties passed into client components
  (`local={lang}`, `lang={lang}`) all remain, because client components cannot
  use the accessor. This slice changed where server code reads the locale from;
  it did not end property passing, as the plan stated.

**One defect found and fixed during the conversion.** `app/(client)/[lang]/page.tsx`
contained `let lang = Params.lang;`, which the substitution turned into
`let lang = lang;` — a self-referential redeclaration next to the new accessor
line. Caught by a post-substitution scan for that pattern and removed. A
repository-wide re-scan found no other instance.

## Deviations from plan

1. **No `experimental.rootParams` edit (finding 1).** The plan made it conditional
   and this is the branch where it is not needed. Consequences, all of which the
   plan anticipated: the framework configuration has **three** edits, not four;
   it is touched by **two** commits (D1, D2), not three; the three flag-ordering
   rules do not apply; **slice B1 reverts alone**; and `FLAG-ROUTES` would be
   identical to `A-ROUTES` by construction.
2. **Slice C was not dropped.** The installed contract is `retry` and the repo
   declared `reset`, so the alignment was required.
3. **Scope limited to code edits and local gates**, by the owner's decision at
   the start of implement. **Not run, and owed before this ticket can be called
   done:** the preview-deploy proof of AC-2; `BASE-RESOLVED` and the
   resolved-version regression gate; every dev-memory reading and therefore D1's
   revert trigger; `BASE-CI` / `BASE-DEPLOY`; the `A-ROUTES` / `FLAG-ROUTES`
   capture and the per-route diffs; the response-header and source-map
   comparison; the browser-suite build and the browser suite itself; the
   in-process byte-identity comparison; the intercepted-modal check; the
   right-to-left render diff; and the positive confirmation that the native
   compiler path actually ran. **AC-2, AC-4, AC-7 and AC-9 are therefore not yet
   evidenced.**
4. **No commits were created (IM-9), which conflicts with the plan's structure.**
   The plan is built on six commits, each revertable alone, and AC-10 is recorded
   against the independent switches on that basis. `/implement` produces
   uncommitted working-tree edits and `/publish-pr` creates *the single
   publishable commit*. As it stands the branch would deliver one commit, and
   **AC-10 cannot be satisfied as written**. This needs a decision before
   publishing: either `/publish-pr` is directed to create the separate commits,
   or AC-10 is recorded differently at `/verify`. Flagged, not resolved here.
5. **AC-11 confirmed by the owner** at the start of implement: the deploy install
   command still installs development dependencies.

## Validation run

Local gates only, per deviation 3. All green.

| Check | Result |
|-------|--------|
| `pnpm lint:i18n-parity` | **pass** — 2159 keys present in all three files |
| `pnpm lint` | **pass** — 0 errors, 64 warnings (gate is errors-only) |
| `pnpm exec next typegen` | **pass** — types generated |
| `pnpm exec tsc --noEmit` | **pass** — exit 0 |
| `pnpm test:run` | **pass** — 40 files, 1210 tests |

**Lint fallout (OQ-14 / FU-26): none requiring action.** The bumped configuration
introduced at least one new rule — `@next/next/no-location-assign-relative-destination`,
firing in `utils/fetchData.ts` — but as a **warning**, not an error. The gate
stays green, no files needed fixing, and no protected-path stop was triggered.

**Two caveats on the green type check**, both material:

- `strictNullChecks: false` plus an accessor typed `string | undefined` means
  `tsc` cannot prove the twenty-nine conversions are safe. At runtime the value
  is always present inside the locale tree, which is the same assumption the
  property path already made — but the type gate is not evidence here.
- The type check does not exercise the render path. Whether the accessor is
  callable inside `generateMetadata` — eleven of the twenty-nine files now call
  it there — is **still unproven**. It compiles; only a production build or the
  browser suite will confirm it runs.

## Resume — evidence gathered

Run after `/verify` returned FAILED. **No file was changed on the resume.** The
working tree still holds exactly the thirty-six planned edits.

**The browser suite passed — AC-8 and AC-9 are now satisfied.**
`pnpm e2e:preflight` passed (nine staging addresses reachable, shopper A
configured), then `pnpm test:e2e` ran **5 tests, all passed**, exit 0. The suite
performs its own real production build and start, so this also settles the
question the type check could not: **the accessor works at runtime, including
inside `generateMetadata`** — pages rendered, search worked, a listing led to a
product page, and the cart drawer opened, all on the converted route tree. No
test file was modified on this branch, which is the other half of AC-9.

**The native compiler path is confirmed active — the positive signal AC-7 asked
for.** `next dev` prints its applied experiments and reports:

```
▲ Next.js 16.3.1 (Turbopack)
✓ Ready in 1698ms
- Experiments (use with caution):
  ✓ externalDir
  ✓ turbopackRustReactCompiler
  ⨯ optimizeServerReact
```

A tick is Next confirming the option was **applied**, not merely accepted — which
is stronger than the absence of an unknown-option warning that the plan warned
was insufficient. Independently, `.next/trace` contains `turbopack` spans and
**no** `react-compiler` or Babel-plugin entries, which is the plan's other
accepted signal ("the Babel plugin absent from the compile path"). `⨯ optimizeServerReact`
is correct and expected: that guard is still `!isDev` and this was a dev run.

**What the resume could not produce.** The dev server returned **503 for every
route** — including `/robots.txt`, which is outside the locale tree and never
touches the accessor — and no route ever compiled. Because a non-locale route
fails identically, this is a local environment problem, **not a regression from
the conversion**; the production build and the browser suite both pass on the
same code. It does mean the dev-memory readings (`BASE-DEV-MEM`, `A-DEV-MEM`,
`D1-DEV-MEM`) were not taken, so **D1's revert trigger still has no baseline**.
Two node processes measured 45 MB and 252 MB, but with no route compiled that is
not a meaningful "after compiling routes" figure and is recorded as such rather
than presented as a baseline.

## Newly discovered: 16.3 writes to the repository's `CLAUDE.md`

Running `next dev` printed:

```
✓ Generated CLAUDE.md for AI agents. Set `agentRules: false` in next.config to disable.
```

and appended a `<!-- BEGIN:nextjs-agent-rules -->` block to the project's
**`CLAUDE.md`** — a tracked file, and this repository's authoritative governance
document. It is **not** on the plan's *Files to change* list.

Verified in the installed package: `agentRules` is a real config option
(`dist/server/config-schema.js:496`) and the generator ships at
`dist/server/lib/generate-agent-files.js`. The block re-adds itself on every
`next dev`, so it will dirty every developer's working tree.

**Handling:** `CLAUDE.md` was restored to its committed state
(`git checkout -- CLAUDE.md`) so the tree contains only the planned thirty-six
edits. Nothing outside the plan was left modified (IM-4 holds).

**This needs a decision that the approved plan does not cover**, and it should be
taken before publishing:

- **Option A — suppress it.** Add `agentRules: false` to `next.config.ts`. That
  is a **fourth** edit to a protected runtime path, and the plan says "three
  edits only … Nothing else", so it requires a `/wf:plan` revision first.
- **Option B — accept it.** Commit the generated block as part of this ticket.
  Next's own text recommends this ("committing it with your work keeps the tree
  clean"), but it means the framework now writes into the governance file, and
  `CLAUDE.md` would have to join *Files to change* — also a plan revision.

Either way it is a plan question, not something to settle silently at implement.
Recorded here rather than acted on.
