---
ticket: next-16-3-upgrade
stage: plan
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-18
links:
  clickup:
  github:
---

# Plan — next-16-3-upgrade

> Decide the approach before changing code. Plan only — no implementation here.

**Revision 6** — addresses `review.md` round 5 (FU-59..FU-65). No change to
`spec.md` and no change to scope.

Rounds 4 and 5 each closed every follow-up and introduced one new contradiction
while doing so, because instructions were added one at a time without checking
them against each other. This revision adds a **Measurement and reference map**
below, which states every baseline and reference once, with the exact build state
it is taken in. Every step then points at the map instead of restating a
condition in its own words. That is the structural fix for the failure mode, not
just a fix for the two defects it produced.

## Approach

Six commits, each provable on its own: pin the framework packages; convert the
twenty-eight leaf files (carrying the accessor flag); convert the root layout;
align the error boundaries; then the two compiler switches.

**TypeScript 7 stays out** (`OQ-8`) — `eslint-config-next` depends on
`typescript-eslint`, which needs the TypeScript JavaScript API that 7.0 does not
expose. AC-3's second branch applies. `typescript` **is** pinned exactly, which
does not reopen `OQ-8`.

**Slice B stays at full scope by the owner's decision** — twenty-nine files,
verified against the repository — split across two commits so the root layout is
genuinely revertable.

## Measurement and reference map

Every baseline and reference is defined **here once**. Steps refer to these
names and never restate the conditions.

| Name | Taken at | Build state | Used for |
|------|----------|-------------|----------|
| `BASE-CI` | step 2 | existing CI run history | compared at step 14 |
| `BASE-DEPLOY` | step 2 | existing deploy run history | compared at step 14 |
| `BASE-LOCAL-BUILD` | step 2 | 16.2, cleaned build directory, cold cache | the like-for-like partner for `A-LOCAL-BUILD` (FU-62) |
| `BASE-DEV-MEM` | step 2 | 16.2, guard on | reference only — **not** D1's comparison point |
| `BASE-RESOLVED` | step 2 | scratch clone outside the working tree, deploy package manager, no committed lock file | the regression baseline for the step-4 resolved-version gate |
| `A-LOCAL-BUILD` | step 4 | 16.3, guard on, **flag off**, cleaned directory, cold cache | build-duration band, compared to `BASE-LOCAL-BUILD` |
| `A-DEV-MEM` | step 4 | 16.3, guard on, flag off | **the guarded baseline D1 is judged against** |
| `A-ROUTES` | step 4 | 16.3, flag off, cleaned directory | measures the **flag's own effect** when compared to `FLAG-ROUTES`. Not a conversion reference. |
| `FLAG-ROUTES` | step 7 | 16.3, **flag on, no conversion**, cleaned directory | **the reference route table for steps 8, 9 and 10** (FU-59) |
| `D1-DEV-MEM` | step 12 | 16.3, guard removed, native path off | attribution between D1 and D2 |

**Every dev-memory reading** uses three samples with the cache state noted, and
every revert trigger is a delta beyond the observed spread — never an unqualified
judgement (FU-54).

**Every route-table comparison** is a **per-route** diff — no route may change
its rendering mode. Equal totals are not enough. **Every build that produces or
is compared against a route table runs the same way**: cleaned build directory,
production gate environment (FU-64). Steps do not restate this.

## Steps

1. **Confirm the deploy install command (AC-11).** The owner confirms the deploy
   platform still installs development dependencies. If not, stop — blocked.
2. **Record the baselines.** `BASE-CI` and `BASE-DEPLOY` are read from existing
   run history, not from dedicated runs — they are evidence for NFR-4, which the
   plan states is not a gate, and six dedicated builds would cost more than the
   evidence is worth (FU-63). `BASE-LOCAL-BUILD`, `BASE-DEV-MEM` and
   `BASE-RESOLVED` are taken as the map describes. Median function duration is
   **not** baselined — it cannot move before merge; it moves to a follow-up
   ticket.
3. **Check the published versions.** Confirm the target patch is published for
   all three framework packages. If not, fall back to same-minor and record the
   mismatch.
4. **Slice A — the version bump.** Pin the three framework packages and
   `typescript` exactly. Regenerate the lock file with a targeted install; check
   the diff contains **only those four packages and their transitives**, and
   record the resolved `typescript` version as a named result. Re-read the
   deploy-resolved versions and compare against `BASE-RESOLVED`: a package
   resolving **lower than before the upgrade** blocks the merge, or is accepted
   only with the specific vulnerability named at verify. A shortfall already
   present in `BASE-RESOLVED` is the pre-existing override gap — recorded, not
   blocked. Run the gate set and the browser-suite build. Capture
   `A-LOCAL-BUILD`, `A-DEV-MEM` and `A-ROUTES`. If `A-LOCAL-BUILD` exceeds
   `BASE-LOCAL-BUILD` by more than about a fifth, raise a follow-up ticket
   (FU-62). Compare the response header set: unchanged, technology header absent,
   no browser source maps newly served. Prove the error-reporting wrapper on a
   **preview deploy**.
5. **Slice A follow-up — lint fallout.** Fix new findings **only outside the
   protected runtime paths**. A finding inside one stops the ticket and returns
   to `/plan`.
6. **Slice B preparation — three checks against the installed target package.**
   - **Is the accessor still flag-gated?** In 16.2.11 it is: the configuration
     schema declares an `experimental.rootParams` boolean, the build rejects the
     import without it, and the only thing that implies it is the cache-components
     flag — which AC-12 excludes. The target version's documentation never
     mentions a flag and records the module as introduced in 16.3.0, so it may be
     stable there. **Check the installed package, not the documentation.** If
     gated, apply the flag in the working tree now; it is committed with slice B1
     at step 9. If stable, no flag is added and that is recorded — in which case
     `FLAG-ROUTES` is taken in the same state as `A-ROUTES` and the two are
     identical by construction.
   - **Is the accessor callable inside the metadata function?** Eleven of the
     twenty-nine files read the locale there, where canonical and
     alternate-language URLs are a locale-interpolated URL sink. Confirm against
     the installed types. If not callable, those eleven keep the property for
     that call site and **AC-5 is recorded as narrowed** — not silently omitted.
   - **What is the generated accessor type?** Generate the framework types with
     the flag applied, or the module is a bare declaration and the check yields
     nothing. Five root layouts exist, so the accessor is likely typed as
     possibly undefined; strict null checks are off, so the type gate will not
     catch splitting an undefined value. A green type check is not proof for this
     slice.
7. **Capture `FLAG-ROUTES`.** Build with the flag applied and **no conversion**,
   and capture the route table. Compare it to `A-ROUTES` to measure the flag's
   own effect; record any difference, since that is the flag's cost and not the
   conversion's. `FLAG-ROUTES` is the reference for steps 8, 9 and 10.
8. **Slice B probe — the root layout, thrown away.** Convert the root layout
   alone, build, diff per route against `FLAG-ROUTES`, then **discard the
   conversion and keep the flag**. This surfaces the rendering-mode signal before
   twenty-eight other files are converted.
9. **Slice B1 — the twenty-eight leaf files, committed with the accessor flag.**
   Both ways of reading the locale work at once, so this commit builds on its own.
   Verify: the per-route diff against `FLAG-ROUTES`; and **the accessor value is
   byte-identical to the property value, checked in-process rather than over
   HTTP.** The middleware lowercases the path and redirects any unsupported
   locale, so a malformed segment never reaches the render and cannot be probed
   by requesting a URL — an implementer doing that would observe a redirect and
   wrongly record a pass. The executable form is a temporary comparison inside
   one build: for every locale that *can* reach the render, assert the accessor
   returns exactly what the property returns. **"Redirected, never rendered" is
   inconclusive, not a pass** — if the comparison cannot be made to run, slice B
   does not ship. It **covers the metadata context** where step 6 found it
   callable, asserts on the **URL-bearing fields** of the structured-data
   payloads and on the canonical and alternate-language URLs — not on the
   language field or the page language attribute, which pass through a mapping
   whitelist that would mask a divergence — and its **instrumentation is removed
   before the final gate run**.
10. **Slice B2 — the root layout, its own commit.** Verify the rendered page
    language attribute and the right-to-left body class are unchanged for a
    right-to-left locale, re-run the per-route diff against `FLAG-ROUTES`, and
    confirm an intercepted modal route resolves the same locale opened directly
    and by navigation (spec Edge Case 3).
11. **Slice C — the error boundaries.** Confirm the recovery property name
    against the **installed package types**, then align all four boundaries with
    it. Do not delete it — AC-6 requires the boundaries to use the property the
    installed version defines. **If the installed contract already matches what
    the four files declare, slice C is dropped entirely** and that is recorded.
    All four declare the property and none call it, so this is a rename of an
    unused parameter; expect an unused-variable lint finding, which is not a
    wiring task.
12. **Slice D1 — remove the development guard** on the React Compiler, updating
    the stale comment in the same edit. Capture `D1-DEV-MEM`.
13. **Slice D2 — enable the native compiler path.** Confirm it is **actually
    active**, not merely recognised: the absence of an unknown-option warning
    only proves the option name is accepted, and a recognised switch can still
    fall back if the platform-specific native binary is unavailable. Require a
    positive signal — the Babel plugin absent from the compile path, or a
    measurable compile-time drop. Re-read dev memory and compare against
    `A-DEV-MEM` and `D1-DEV-MEM`. Revert trigger: peak memory worse than
    `A-DEV-MEM` beyond the observed spread. In that case **D1 is reverted with
    D2**, the ticket ships slices A, B and C, **AC-7 is recorded as not met**,
    and the compiler work returns to `/plan`. Repeat the header and source-map
    comparison, since D2 edits the framework configuration.
14. **Re-read the baselines** — `BASE-CI` and `BASE-DEPLOY` from run history,
    dev memory by the map's protocol — and record them beside the originals.
15. **Run the whole gate set once more on the finished branch**, then hand over
    for the owner's live manual test. This final build supplies the last header
    comparison rather than being a separate run.
16. **Raise the structured-data escaping follow-up ticket** — unconditionally,
    not on a condition that cannot occur. See the Integration surface.

## Files to change

**Dependencies**

- `package.json` — pin `next`, `eslint-config-next` and `@next/bundle-analyzer`
  to the version confirmed in step 3, and `typescript` exactly (`OQ-11`).
  **The override block is not edited**: roughly twenty of the thirty-one keys use
  selector syntax the deploy package manager does not accept, so mirroring them
  would be silently ignored and would break the lock-diff check.
- `pnpm-lock.yaml` — regenerated by a targeted install, diff constrained to the
  four pinned packages and their transitives (C-7).

**Framework configuration — protected runtime path, listed here so the implement
stage may edit it (GU-2 / IM-5). Four named edits, in three different commits:**

- `next.config.ts`
  1. **`experimental.rootParams`** — enables the locale accessor. Applied in the
     working tree at step 6 and **committed with slice B1** at step 9, so that
     commit builds. **Conditional**: added only if step 6 finds the accessor
     still gated in the installed target package.
  2. Remove the development guard on `reactCompiler` — slice D1.
  3. Update the comment above it, which describes three guards together — D1.
  4. Add the native compiler switch to the `experimental` block — slice D2.
- Nothing else in this file is touched — not the security headers, not the image
  hosts, not `staleTimes`, not the error-reporting wrapper.

**Lint fallout**

- Any file the bumped lint configuration flags, **excluding every protected
  runtime path** (`proxy.ts`, `next.config.ts` beyond the four edits above,
  `instrumentation*.ts`, `sentry.*.config.ts`, `.github/workflows/**`). Listing
  the set here is what makes those edits legal at implement; a finding inside a
  protected path stops the ticket instead.

**Error boundaries — slice C** (dropped entirely if the installed contract
already matches, step 11)

- `app/global-error.tsx`, `app/(special)/callInProg/error.tsx`,
  `app/(special)/call_direct/error.tsx`, `app/(special)/endCall/error.tsx`.

**Locale accessor — slice B (`OQ-6` answered)**

Twenty-nine server-rendered files, verified against the repository: thirty-six
parameter-reading files under `app/`, minus one route handler, five client
dashboard screens and the client not-found page.

*Slice B1 — twenty-eight leaf files, plus the accessor flag:*

- `app/(client)/[lang]/page.tsx`, `about/page.tsx`, `contact/page.tsx`,
  `privacy-policy/page.tsx`, `terms-of-service/page.tsx`, `compare/page.tsx`
- `products/[productId]/page.tsx`, `filters/[[...filters]]/page.tsx`,
  `featured/[[...filters]]/page.tsx`, `flashDeals/[[...filters]]/page.tsx`
- `@modal/(.)filters/[[...filters]]/page.tsx`,
  `@modal/(.)products/[productId]/page.tsx`
- `settings/page.tsx`, `settings/languages/page.tsx`,
  `settings/checklist/page.tsx`, `settings/countries/page.tsx`,
  `settings/orders/page.tsx`, `settings/orders/[id]/page.tsx`,
  `settings/wallet/page.tsx`, `settings/prefferences/page.tsx`,
  `settings/profile/page.tsx`, `settings/profile/info/page.tsx`,
  `settings/profile/size/page.tsx`, `settings/profile/address/page.tsx`,
  `settings/profile/picture/page.tsx`, `settings/profile/Bank-Cards/page.tsx`
- `sellerProfile/layout.tsx`,
  `sellerProfile/sellerDashboard/[sellerId]/layout.tsx`

*Slice B2 — the root layout, its own commit:*

- `app/(client)/[lang]/layout.tsx` — probed at step 8, converted at step 10.

**Genuinely excluded by the framework, not by choice** (C-2): the seven client
components under the locale tree; the route handler
`app/(client)/[lang]/sitemap.xml/route.ts`; the fifteen server-action modules
under `serverRequests/` and `serverActions/`; the eighteen route handlers under
`app/api/`; and anything inside the older caching helper.

**What this slice does not remove.** Most converted files read the locale in
order to pass it to a client component as a property. Those properties stay,
because client components cannot use the accessor. Many also keep awaiting their
route parameters for a non-root value. This slice changes where server code reads
the locale from; it does not end property passing.

## Integration surface

> Required (PL-11, ADR-012). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:** the framework configuration, shared by
  every route and the definition of the app's security header posture, now edited
  by **three different commits**; the dependency lock file, shared by CI and every
  developer machine; the locale root layout, which renders on every page in the
  locale tree; the framework's generated types, which are empty for the accessor
  unless the flag is on.
- **The locale value's real blast radius.** Four structured-data components
  interpolate the locale into a JSON payload rendered through raw HTML injection:
  `serverRequests/meta/StructuredData/Organaization.tsx` and `Website.tsx`
  (mounted by the root layout), `ListingBreadcrumbList.tsx` (listing pages) and
  `ProductStructuredData.tsx` (product page). Serialising to JSON does **not**
  escape a closing script tag. The raw locale reaches those payloads only through
  **URL-bearing fields**; the language field passes through a mapping whitelist.
  The same applies to the canonical and alternate-language URLs built in eleven
  metadata functions.
- **Why the sink is safe today, stated precisely.** It is safe **for the locale
  field only**, and only because the middleware lowercases the path and rejects
  any locale outside the supported set. This ticket does not touch the middleware,
  so that guarantee is unchanged — but it is also why a malformed-locale HTTP
  probe cannot run, and why the check had to become an in-process comparison.
  **The same four payloads also interpolate product slug, name and description,
  which the middleware never normalises.** Pre-existing and out of scope here, but
  it means the payloads are not safe in general — only the locale field is
  protected. Step 16 raises that as its own ticket unconditionally, because the
  in-ticket safety case can never fire: no reachable locale can carry a closing
  script tag.
- **Who else depends on these:** the error-reporting wrapper is applied **only**
  when the deploy environment variable is set, so a fault is invisible locally and
  appears first on a deploy; the CI gate installs with a frozen lock file and
  fails if lock and manifest disagree; the deploy platform installs with a
  **different package manager and no committed lock file**, and that package
  manager **ignores the manifest's override block entirely**, so roughly
  twenty-five security pins that hold in CI do not hold in production — which is
  why step 4 compares against `BASE-RESOLVED` and blocks only on a *regression*;
  the browser-suite workflow runs its own production build and never runs on a
  pull request, so it is a second, late place the widened build type check can
  fail.
- **Overlapping flows:** the locale is read by four kinds of code that share
  nothing but the value — server-rendered pages (converting), client components
  through the client hook, server actions and route handlers (neither can
  convert), and the middleware, the only place it is normalised. After this ticket
  the same value is obtained four ways in one app. That is the framework's
  constraint, not a design choice, but it is what is most likely to be misread
  later as inconsistency.
- **Ordering / lockstep dependencies.** These are the constraints that break the
  build or the measurement if violated:
  - The accessor flag must land **in the same commit as slice B1**, or that
    commit does not build.
  - `FLAG-ROUTES` must be captured **after** the flag and **before** any
    conversion, or the reference conflates the flag's effect with the
    conversion's (FU-59).
  - **Slice B2 reverts before slice B1.** B1 carries the flag and B2 imports the
    accessor, so reverting B1 alone while B2 is present leaves a converted root
    layout importing a flag-gated module and the build fails. B1 is revertable
    alone only while B2 has not landed; otherwise both revert together (FU-60).
  - **Neither compiler revert may remove the accessor flag.** Edits 1 and 4 sit
    in the same configuration block, so reverting D2 can conflict textually
    there; resolve by hand, keeping the flag.
  - **After any revert touching the framework configuration**, assert the file
    state directly — flag present, security headers, image hosts, stale times and
    the reporting wrapper untouched — and re-run the header and source-map
    comparison rather than trusting the revert output (FU-65).
  - The lock file is regenerated in the same commit as the manifest. Type
    generation runs after the flag and before the type check.
- **What breaks if this is wrong:** a wrong locale in the root layout gives every
  page the wrong language attribute and loses right-to-left direction, and — via
  the URL fields of the structured data and the canonical URLs — could break out
  of a script tag. A possibly-undefined accessor split with strict null checks off
  fails at runtime with a green type check. A revert that removes the accessor
  flag breaks every converted page at build time. A regressed response header
  leaves every gate green while the app loses a security header or starts
  advertising preview domains to crawlers. An incompatible error-reporting wrapper
  stays green locally and fails on deploy. An unregenerated lock file fails CI
  immediately — the safe failure.

## Validation strategy

- Validation profile: `full`
- The `full` profile covers lint, type check, unit tests and the production
  build. The build is the important one: it is the only check that exercises the
  new default type-checking path (AC-4) and would catch a server/client boundary
  error from the accessor (AC-5).
- **The production build does not prove AC-2.** The framework configuration
  exports the unwrapped variant unless the deploy environment variable is set.
  AC-2 is proven on a **preview deploy**. A local build with that variable set is
  a fallback only, and requires the reporting upload token unset, because that
  variable also enables real source-map upload into the production reporting
  project.
- Checks the profile does not cover, run in addition: translation parity and the
  browser suite (AC-8, AC-9); the browser-suite build; the header and source-map
  comparison after slice A, after slice D2, and after any configuration revert;
  the lock-file diff with the fourth pin recorded; the resolved-version
  regression check against `BASE-RESOLVED`; the per-route diffs against
  `FLAG-ROUTES`; the right-to-left render diff; the in-process byte-identity
  comparison including the metadata context; the intercepted-modal check; and the
  positive confirmation that the native compiler path ran.
- **How AC-10 is recorded (FU-61).** AC-10 is checked against the **independent
  switches — slices D1 and D2** — each on its own commit and revertable alone.
  **The accessor flag is not an independent switch**: it is a build prerequisite
  of slice B, it reverts with that slice, and it is recorded that way rather than
  counted against AC-10. The commit count is not the check; slice C may be
  dropped and a reporting-tool bump may add a commit.
- **AC-9 and AC-12 are checked by reading the branch diff**: AC-9 because a test
  edited to make the suite pass fails the criterion even though the suite is
  green; AC-12 because no caching-migration feature may appear. Note the
  cache-components flag would imply the accessor flag — that is **not** a reason
  to enable it.
- AC-11 is confirmed by the owner outside this repository.
- The baselines are evidence for the ticket's goal, not a gate — NFR-4 stands.
- **Known limitation, unchanged:** a response-header regression has no acceptance
  criterion to fail. The check exists here, but `/verify` records against `AC-n`,
  and adding a criterion would mean rewriting an approved artifact. Recorded, not
  fixed.

## Rollback

- Six commits: slice A, B1, B2, C, D1, D2. Two ordering constraints apply, both
  stated in the Integration surface: **B2 reverts before B1**, and **D1 reverts
  with D2** if the native path proves inactive. Every other commit reverts alone.
- **Slice D2** is the only change that alters what ships to a browser. Revert
  signal: any rendering fault in the owner's live test or in production that does
  not reproduce with the switch off, or peak dev memory worse than `A-DEV-MEM`
  beyond the observed spread. If D1 reverts with it, the ticket ships slices A to
  C, AC-7 is recorded as not met, and the compiler work returns to `/plan`.
- **Slice B2 (the root layout) reverts on its own** — that is why it is a
  separate commit. Revert signals: a wrong page language, a lost right-to-left
  direction, or a route changing rendering mode.
- **Slice B, either commit:** an in-process comparison that cannot be made to run
  is an inconclusive result and blocks the slice — it is not a pass.
- **Slice A**: a security-pinned package resolving lower than `BASE-RESOLVED`
  blocks the merge until resolved, or is accepted only with the specific
  vulnerability named at verify. A shortfall already present in `BASE-RESOLVED`
  is recorded, not blocked.
- **If the upgrade requires an error-reporting tool change beyond a same-major
  version number, stop and return to `/plan`** rather than editing the reporting
  configuration files; they are protected runtime paths, are not listed under
  *Files to change*, and no verbal agreement makes editing them legal. A
  permitted same-major bump becomes **its own commit with its own lock diff**,
  outside slice A.
- Reverting the whole ticket is reverting the branch. No data changes, no
  migrations, no persisted state.

## Out of scope

- TypeScript 7, including the side-by-side aliased installation (`OQ-8`).
- Cache Components, partial prefetching, loading shells, the incremental
  regeneration changes, and the instant-navigation browser test helper.
- Adding new hand-placed component-level error boundaries.
- Converting client components, server actions or route handlers to the locale
  accessor, and removing the locale properties passed into client components.
- Renaming or restructuring the locale route segment.
- **Escaping the structured-data payloads.** Raised as its own ticket at step 16,
  covering both the locale field and the product fields the middleware never
  normalises.
- **Closing the dependency-override gap on the deploy path** (`OQ-12`, `OQ-13`).
  This ticket measures it and blocks only on a regression.
- Relocating the incremental type file.
- **Reading the function-duration delta** — only possible after a production
  deploy; its own follow-up ticket.
- Any change to the middleware, the error-reporting configuration files, or the
  CI workflow files — all protected runtime paths.
- The deprecated image host configuration style.
- Any measured claim beyond the readings named in the Measurement and reference
  map (NFR-4).

## Review follow-ups addressed

| FU | Where addressed |
|----|-----------------|
| FU-59 | Measurement map (`A-ROUTES` vs `FLAG-ROUTES`); steps 7–10; Integration surface > Ordering — the reference is the flag-on, no-conversion table |
| FU-60 | Integration surface > Ordering; *Rollback* — B2 reverts before B1 |
| FU-61 | *Validation strategy* — AC-10 recorded against D1/D2; the flag is a build prerequisite, not an independent switch |
| FU-62 | Measurement map (`BASE-LOCAL-BUILD`, `A-LOCAL-BUILD`); steps 2, 4 |
| FU-63 | Step 2, step 14 — CI and deploy durations read from run history |
| FU-64 | Measurement map — build conditions stated once for every route-table comparison |
| FU-65 | Integration surface > Ordering; *Validation strategy* — assert the file state after any configuration revert |
