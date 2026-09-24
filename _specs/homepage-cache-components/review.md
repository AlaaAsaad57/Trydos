---
ticket: homepage-cache-components
stage: review
mode: standard
status: in_progress
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Review — homepage-cache-components (phase 1)

> Written in two passes. **Panel Findings** below are complete. **Decision** and
> **Approvals** are empty until the comprehension check has been taken.

## Review Scope

`spec.md` (7 criteria, narrowed to phase 1 today) and `plan.md` (fourth version,
phase 1 only). Context: `research.md`, `intake.md`, and the parked follow-up
`docs/homepage-cache-phase-2.md`.

Phase 1 switches on Next.js 16.3 `cacheComponents` across the application and
converts no route. The conversion is a separate, parked work item.

## Plan Summary

Delete the 36 route settings the flag refuses (26 files), prove the two GET auth
routes stay dynamic, fix three synchronous clock reads, enable the flag, add a
`no-store` rule for the analytics path, add `generateStaticParams` with one
locale, run the opt-out codemod, then run one full build and take four
measurements. Nothing is cached; no page's data reading changes.

## Step 1 — Validation

**Passed on the second attempt.** The first run failed `RV-8` and nothing was
written: `spec.md` still described the combined outcome, so 14 of its 16 criteria
had no plan step, no file and no test. The owner directed the spec to be narrowed
to phase 1; validation was re-run and passed.

| Check | Result |
|---|---|
| plan ↔ AC traceability | 7 criteria, 7 Tests rows, one-to-one |
| PL-11 Integration surface | present, all five parts |
| PL-12 no `OQ-n` left open | none; OQ-1 and OQ-5 moved to the parked doc with the reason they cannot be answered here |
| PL-13 Tests row per `AC-n` | 7 rows, each with a disposition |
| PL-14 coverage searched | searched **by filename**, the method that earlier hid three existing test files |
| named test files under Files to change | `tests/proxy.test.ts` — yes |

## Panel Findings

Advisory only (`RP-2`). None of these blocks the decision. A `major` may be
dismissed — but only after it has been understood (`CG-6`).

This is the **fourth** advisory round on this work item. The first three ran
against earlier, wider versions of the plan and produced roughly 60 findings,
which drove a split and four rewrites.

**These findings were raised against plan v4.** The owner then directed a fifth
version, which closes all twelve `major` findings — see `plan.md > Findings
closed (round 4)`, where each one names its closure. The findings are kept here
unchanged, because they are the record of what the plan had to answer and the
source of the seeded comprehension questions (`CG-6`). The comprehension
questions themselves are drawn from **v5** and from the narrowed `spec.md`.

One finding is recorded as **disputed** rather than closed (SR-4, below); the
evidence favours the plan.

### Major — senior lens

| # | Finding | Reference |
|---|---|---|
| SR-1 | **The "seven document routes" premise is unverified and cannot be right as stated.** Around twenty personal routes under `[lang]` already carry no `dynamic` export today — `settings/profile/info`, `settings/profile/Bank-Cards`, `settings/wallet`, `settings/orders/[id]`, the whole `sellerProfile/sellerDashboard/**` tree — and they render the same `AuthNavContainer`. So either the global `/(.*)` public rule never applies to a dynamically rendered page, in which case the merge blocker is imaginary; or the exposure is already live, far larger than seven routes, and **not caused by this ticket**. Confirmed by inspection: 9 such routes found in the first two directories checked. | `plan.md` "What is not neutral" #2; `next.config.ts:97` |
| SR-2 | **`instant = false` throws in a Client Component**, so section F's "client segments are added by hand" is a build break, not a manual step. `app/(special)/call_direct/page.jsx` is `"use client"` — confirmed. The opt-out has to go on the enclosing server layout instead. | `plan.md` § F; `instant.md:23` |
| SR-3 | **`generateMetadata` is never mentioned in the plan.** Eleven route files export it, and `app/(client)/[lang]/page.tsx` awaits `searchParams` *and* calls the uncached `GetHomeMetaData`. It is a documented `cacheComponents` error class that `instant = false` is not documented to clear. Five of the eleven are not in Files to change. It also makes spec `E-4` real: the build **does** reach the backends through metadata, contradicting the plan's "no data reader runs". | `plan.md` § Files to change, § G |

### Major — security lens

| # | Finding | Reference |
|---|---|---|
| SEC-1 | **AC-2's measurement covers only the seven routes losing `force-dynamic`.** The ~20 routes in SR-1 carry more personal data and are unmeasured. | `plan.md` step 6; `layout.tsx:191` |
| SEC-2 | **`getCookieServer` swallows the prerender bail-out.** `utils/cookies/server-cookie-manager.ts:35-38` wraps `cookies()` in `try/catch` and returns `null` — and Next's own guidance says a `try/catch` catches that bail-out. So the layout may **not** block as the plan assumes; it can prerender a real static **guest** shell that `/(.*)` then marks `public, s-maxage=60`, and a signed-in shopper can be served guest navigation. The same pattern is at `utils/server/tokenManager.ts:145-150`. **Verified by inspection.** This inverts the plan's safety argument. | `plan.md` "What this phase does not deliver" |
| SEC-3 | **Step 0's baseline records the route table, build time and size — but not today's `Cache-Control` and `Vary` on the same paths.** Step 6 therefore cannot tell "phase 1 introduced this" from "already live on `develop`", and only the first is fixable inside this work item. | `plan.md` step 0 vs step 6 |
| SEC-4 | **Step 7 names no candidate fix.** `next.config.ts` is the only lever, and the plausible fixes — dropping `Cache-Control` from `/(.*)`, or adding per-route rules — are broad CDN behaviour changes, not tidy-ups. | `plan.md` step 7, § E |
| SEC-5 | **The plan holds two conflicting header models at once.** It says the render's `no-store` beats the config rule for pages, yet relies on the config rule to keep the sitemaps cached at `s-maxage=3600`. If the first is true the second is false — and the six sitemap routes are losing `revalidate`, their only other cache. | `plan.md` "What is not neutral" vs § A |
| SEC-6 | **Local `pnpm start` does not model the Vercel CDN.** It rewrites `s-maxage`, ignores `Vary: Cookie`, and adds `x-vercel-cache`. A local `no-store` therefore does not prove AC-2 in production. | `plan.md` Validation strategy 1 |

### Major — performance lens

| # | Finding | Reference |
|---|---|---|
| PERF-1 | **The `/ingest/:path*` `no-store` rule re-adds a cost the team deliberately removed.** `app/ingest/[...path]/route.ts:51-52` routes `/ingest/static/*` to the PostHog **assets** host — `recorder.js` and the remote config. Those GETs are CDN-cacheable today. A blanket `no-store` makes every one a function invocation, and `utils/posthog.ts:66-71` records that replay was paused *because* per-chunk `/ingest` invocations "dominated the bill". | `plan.md` § C |
| PERF-2 | **`sitemap-search.xml` is one of the six routes losing `revalidate`, and it carries the ~101-query N+1** the plan attributes only to the seventh route. `getTopSearchTerms(100)` awaits one Elasticsearch query per term inside a `for` loop (`sitemap.service.ts:493`). The parked doc records this; `plan.md` lost it in the rewrite. After the deletion it runs per CDN miss instead of hourly. | `plan.md` § A vs § A2 |
| PERF-3 | **The `/ingest` replay measurement cannot be taken as written.** `utils/posthog.ts:71` sets `disable_session_recording: true`. There are no replay chunks, so the invocation count is zero and the average size undefined — yet AC-3 asks for "a large session-replay upload". As written this records nothing and still reads as passed, which is exactly the `E-5` failure the spec forbids. | `plan.md` Validation strategy 4; `spec.md` AC-3 |

### Notable minor findings

- **SR-4 (disputed).** The senior lens argues only ~20 of the 36 settings are
  truly *rejected*, the other 16 being redundant defaults. **The recorded build
  output contradicts this**: a real `next build` with the flag on emitted
  `Turbopack build failed with 36 errors`, every one reading "Route segment
  config … is not compatible with `nextConfig.cacheComponents`. Please remove
  it." — 14 `runtime`, 12 `dynamic`, 7 `revalidate`, 3 `dynamicParams`. The
  performance lens independently verified 36 across 26 files as exact. Recorded
  as disputed, with the evidence favouring the plan.
- **PERF-5.** M-1 will likely report **zero** prerendered pages, not "empty
  shells" — a fourth degraded measurement alongside M-3, M-4 and M-5.
- **PERF-6.** D-23's citations check out, but "removes the build-cost blocker
  entirely" is too strong: the cost is **moved** to first-request latency, once
  per URL per deploy. Also `dynamic-routes.md:267` — for runtime params outside
  `generateStaticParams`, a `cookies()` read outside `<Suspense>` fails that
  *request*. `instant = false` covers it in phase 1; it will not in phase 2.
- **PERF-10.** The plan's sitemap "correction" over-corrects. Five of the six
  routes do send `max-age=3600, s-maxage=3600`; only `sitemap-static.xml:20`
  sends 43200. The 12× disagreement with the config is real; "wrong twice" is not.
- **SEC-7.** `/api/auth/wallet-token` returns a raw token and sets no
  `Cache-Control` of its own, relying entirely on the `/api/:path*` rule winning.
  Step 2 checks only that it stays dynamic, never the header.
- **SR-8.** AC-4 has two halves and only one has coverage: `tests/proxy.test.ts`
  tests the gate redirect, never that `/` still serves the logo page.
- **SR-9.** The codemod's real diff is every page, layout and default under
  `app/` — around 45 files — while Files to change lists 26.

### Verified clean

36 settings across 26 files (exact, both lenses); `app/page.tsx` reads no data
and is not `async`; the three named clock reads exist at the stated lines
(`ProductExpectedDeleiveryWrapper.tsx:29`, `ProductPhotoSliderWrapper.tsx:46`,
`mobile/product/details/[slug]/route.ts:74`); `app/api/auth/me` is POST-only and
sets its own `no-store`; `login` and `wallet-token` both reach `cookies()`;
`sitemap-static.xml` really is 43200 against the config's 3600;
`next.config.ts:122` matches one root segment only. Revertability and the
prerequisite claim both hold. The parked document carried the earlier rounds'
findings faithfully, with one loss (PERF-2) and one line-number drift.

## Risks and Assumptions

- The plan's central safety mechanism — "the layout blocks, so nothing is
  prerendered" — is contradicted by SEC-2 and unverified by SR-1. Both are
  settled by measurement, and both measurements are cheap.
- Four of the six handover measurements are degraded or unavailable.
- The gate's own history: three earlier rounds, four plan versions, one split,
  and six false statements of fact corrected along the way.

## Comprehension Check

See `comprehension.md`.

## Decision

**`APPROVED`** — recorded by the owner on 2026-08-31, after the comprehension
check passed 4/4 (`comprehension.md`, attempt 1).

**Rationale.** The plan's fifth version closes all twelve `major` findings, and
the two that mattered most were closed by *withdrawing* a claim rather than
patching it: the "seven document routes" assertion and the "the layout blocks"
assumption are now stated as questions that step 0 answers before any code
changes. The phase is independently revertable, which the combined plan was not,
and it is a hard prerequisite for the conversion.

**What the approval knowingly accepts:**

- The panel's findings on disk were raised against v4. **v5 has not been panel
  reviewed.**
- Four of the six handover measurements are degraded or unavailable, and the plan
  says which.
- Six of seven criteria have no unit test; the proof is the `build` check plus
  recorded manual measurements.
- One visible change ships with this phase: component state stops resetting on
  navigation (R-15 / D-22).
- The comprehension gate ran **without its `CG-5` integration question** — see
  `comprehension.md > CG-5`.

## Approvals

| Role | Name | Decision | Date |
|---|---|---|---|
| Owner (self-review, ADR-009) | developer | APPROVED | 2026-08-31 |

## Major finding dispositions

| # | Disposition | One line |
|---|---|---|
| SR-1 / SEC-1 | **mitigate** | Assertion withdrawn; step 0's baseline over both route groups decides World A or World B before any change. |
| SEC-2 | **mitigate** | Named as a third possibility; both files declared contingencies in section G. |
| SEC-3 | **accept** | Step 0 now takes the full header matrix on `develop` first. |
| SR-2 | **accept** | Opt-out moves to the enclosing server layout for client segments; three named. |
| SR-3 | **mitigate** | All eleven `generateMetadata` files named in section G; the "no data reader runs" claim corrected. |
| SEC-4 | **accept** | Fix shape pre-decided; `Vary: Cookie` explicitly ruled out. |
| SEC-5 | **mitigate** | Made an explicit step-0 question with a pass/fail for the sitemaps. |
| SEC-6 | **accept** | The header matrix is taken on a preview deployment, recording `x-vercel-cache` and `age`. |
| PERF-1 | **accept** | Rule scoped to ingestion paths; `/ingest/static/*` keeps its upstream headers. |
| PERF-2 | **accept** | `sitemap-search.xml` named as the expensive one; cold duration recorded at step 6. |
| PERF-3 | **accept** | Restated as a synthetic upload; unmeasurable asks dropped; the disabled state recorded. |
| SR-4 | **dismiss** | Disputed on evidence: a real build emitted 36 errors, one per setting, including all 14 `runtime` exports. Independently verified as 36 across 26 files. |

## Follow-up Actions

1. **Step 0 is a hard precondition.** No code changes until the baseline header
   matrix on `develop` is recorded. It decides World A or World B, and only in
   World B is anything this ticket's to fix.
2. **`implement.md` must record M-1's count, M-3, M-4 and M-5 as degraded or
   unavailable** — AC-5 is exactly this obligation, and an empty result must
   never be recorded as a clean one.
3. **`implement.md` must list every file the codemod touched** (~45), not only
   the hand-edited client segments.
4. **If step 0 shows the exposure already live on `develop`**, record it and open
   a separate work item. Do not widen this change to chase it.
5. **Re-run the advisory panel on v5** if `implement` deviates from the plan in
   any material way.
6. **Carry the phase-2 findings forward** from `docs/homepage-cache-phase-2.md`;
   nothing in that document is closed by this approval.
