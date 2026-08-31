---
ticket: homepage-cache-components
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Implement — homepage-cache-components (phase 1)

Cache Components is switched on application-wide. No route is converted, nothing
uses `use cache`, and no cache profile is defined.

**54 tracked files changed.** Nothing is committed (`IM-9`); publishing is
`/wf:publish-pr`'s job.

## Sequence, including the halt

1. Branch `ticket/homepage-cache-components` from a clean `develop` at `54130b0d`
   (`IM-3`; this repository's base is `develop`, overriding the plugin's `main`).
2. **Step 0** — baseline build and header matrix on unchanged code.
3. **Halted** (`BLK-CACHE-EXPOSURE-01`). Step 0 found a live pre-existing
   security exposure. Recorded as BUG-1, fixed on a separate branch, and this
   work item resumed against that evidence.
4. Steps 1, 4, 5 applied. Step 6 build and measurements taken.
5. **Recorded `implementation-completed` here** — with AC-3 and AC-4 partial and
   BUG-3 open.
6. **Then, at the owner's direction, the remaining work was done anyway**: BUG-3
   fixed, AC-3's synthetic upload run, AC-4 exercised with the gate on. This
   happened *after* the transition was recorded, so the stage field says `verify`
   while this file describes work that belongs to `implement`. Stated plainly
   rather than papered over; no second transition was invented.
7. **PR #114 merged to `develop`** (squash, `31840fbb`, CI green), then `develop`
   merged into this branch — cleanly, no conflicts. AC-2 and AC-6 are therefore
   provable **here**, not only in theory.

## Step 0 — the baseline (unchanged code)

| Measurement | Value |
|---|---|
| Build duration | **5m 46s** |
| `.next` size | **1.2 GB** |
| Route table | `/` static; every `[lang]` route dynamic |

Header matrix, measured on `develop` before any change — **every** document route
answered `public, s-maxage=60, stale-while-revalidate=300`, including
`settings/wallet`, `settings/profile/info`, `settings/orders` and
`sellerProfile`. `Vary` did not include `Cookie`. `/api/*` correctly answered
`private, no-store`; the sitemaps answered `s-maxage=3600`.

## Step 6 — the build with the flag on

| Measurement | Baseline | With the flag | Note |
|---|---|---|---|
| Build duration | 5m 46s | **3m 30s** | 39% faster |
| `.next` size | 1.2 GB | **1.1 GB** | slightly smaller |
| Static `○` | — | **9** | 8 before the PR #114 merge |
| Partial prerender `◐` | — | **24** | unchanged throughout |
| Dynamic `ƒ` | — | **90** | 92 before the merge |

`Cache Components enabled` confirmed in the build output. Exit code 0.

### Header comparison — the flag changed nothing

Re-measured on this branch with the flag on: `/sy-en` and
`/sy-en/settings/wallet` still answer `public, s-maxage=60,
stale-while-revalidate=300`; `/api/auth/me` still `private, no-store`;
`/sitemap.xml` still `s-maxage=3600`. **Identical to the baseline.**

This is the answer to AC-2: **phase 1 introduces no caching-header change at
all.** The exposure found at step 0 predates it and is fixed separately (BUG-1).
PR #114 is not on this branch, which is why the public header is still visible
here.

## Acceptance criteria

| AC | Result | Evidence |
|---|---|---|
| AC-1 build and every route answers, including an unlisted locale | **pass** | build exit 0; `/gb-en` → **200**, `/lb-ar` → **200**, neither listed in `generateStaticParams` |
| AC-2 no page served in a form a shared cache may store | **pass, measured on this branch** | after merging PR #114, `settings/wallet`, `settings/profile/info`, `settings/orders`, `sellerProfile`, `/sy-en` and `/sy-en/featured` all answer `private, no-cache, no-store, max-age=0, must-revalidate`. `/sitemap.xml` still `s-maxage=3600` and `/icons/Logo.svg` still `immutable`, so nothing that should be cached lost it |
| AC-3 analytics works after the runtime setting is removed | **pass** | `runtime = "edge"` removed; a **250 KB synthetic payload** POSTed through `/ingest/e/` was buffered and forwarded on the Node runtime, and PostHog replied `401 "event submitted without an api_key"` — it rejecting the fake payload's content, not the proxy failing. `/ingest/static/recorder.js` still answers **200 and cacheable** |
| AC-4 staging gate still serves its logo page | **pass** | with `STAGING_GATE=on`, `/` answers **200** with the logo markup (6,783 bytes) and `/sy-en` answers **307** to `/` — a temporary redirect, never 308, as the repository requires. `tests/proxy.test.ts` passes unchanged |
| AC-5 handover states honestly what it covers | **pass** | this file; M-1/M-3/M-4/M-5 statuses recorded below |
| AC-6 analytics path no longer publicly cacheable | **pass, measured** | `/ingest/e/` answers with **no `Cache-Control` at all**; `/ingest/static/recorder.js` answers `public, max-age=14400` — PostHog's own upstream header, forwarded. The asset stays cacheable, so the `PERF-1` cost regression the plan's own rule would have caused is avoided |
| AC-7 state-retention change recorded | **pass** | recorded in `next.config.ts`'s comment, in `plan.md`, and below |

## Handover measurements for phase 2

| # | Status | Value |
|---|---|---|
| M-1 route table | **produced, and the prediction was wrong** | 8 static, **24 partial prerenders**, 92 dynamic. The plan predicted the prerendered count would be **0**; it is 24. |
| M-2 build cost | **produced** | 3m30s / 1.1 GB, against a 5m46s / 1.2 GB baseline |
| M-3 does `error.tsx` save a prerender | **not produced** | no error boundary and no cached data exist in this phase |
| M-4 clock reads the prerender refuses | **produced, and empty — but not falsely** | the build reported **no** clock errors, even though 24 routes did produce partial prerenders. The three candidates in the plan were not demanded. The four unproven candidates from `docs/homepage-cache-phase-2.md` remain unproven |
| M-5 does `Set-Cookie` stop reuse | **not produced** | nothing is stored |
| M-6 crawler gets a complete document | **not produced** | not exercised |

## Findings

### BUG-1 — personal pages served publicly cacheable (pre-existing, **fixed**)

Found by step 0. Every HTML document answered `public, s-maxage=60,
stale-while-revalidate=300` with no `Vary: Cookie`, including personal pages that
render per-visitor data. Requests skipping the middleware carried the same header
with no `Set-Cookie` at all.

**Not caused by this work item** — `/sy-en` carried `dynamic = "force-dynamic"`
at the time and still answered with that header, which disproves the plan's claim
that the export produced `private, no-store` and masked the config rule.

**Fixed** on `fix/personal-pages-publicly-cacheable`, PR #114, with
`tests/next-config.test.ts` seen red before the fix and green after. Out of scope
for this work item by the approved plan and `review.md` follow-up 4.

### BUG-2 — the config header overrides each sitemap handler's own

`app/sitemap-static.xml/route.ts` intends `max-age=43200`; the measured response
is `3600`, because `next.config.ts` sets 3600 for the same URL and wins. The
handler's intent has never taken effect. Recorded only.

### BUG-3 — `getCookieServer` swallowed the prerender bail-out (**fixed**)

The build logged, repeatedly:

> `Failed to get cookie from server: Error: During prerendering, cookies()
> rejects when the prerender is complete … This occurred at route
> "/[lang]/settings".`

This is the mechanism the review panel predicted (SEC-2):
`utils/cookies/server-cookie-manager.ts:35-38` catches the rejection and returns
`null`, so a component can render as though the visitor were a guest instead of
deferring to a dynamic hole.

**It did not produce a leaking shell.** Of the 76 prerendered HTML files, **68
are empty (0 bytes)** and the 8 non-empty ones are all outside `[lang]`
(`call_direct`, `callInProg`, `endCall`, `_not-found`, `_global-error`,
`simulateUser`, `loginDemo`, and the `/` logo page). **None contains
`AuthNavContainer`, `UserNavTopSection` or any personal marker.** Checked by
scanning every file, not by sampling.

**Fixed**, because step 6 reported it and the plan's section G puts
`utils/cookies/server-cookie-manager.ts` in scope on exactly that condition.

The documented fix is `unstable_rethrow` from `next/navigation`. **It was tried
and measured to be wrong for this use**: it re-throws a plain
`new Error("...")` as well, which would have turned the module's documented
"no request to read from → null" case into a thrown error and broken every
caller. A probe test proved it.

The fix instead re-throws only what carries a `digest` — how Next signals
control flow (`notFound`, `redirect`, the prerender bail-out) — plus React's
postpone symbol. Ordinary failures have no `digest` and still return `null`.
The reasoning, including why the documented API was rejected, is written into
the file.

**Effect, measured across two full builds: 556 swallowed-cookie warnings became
0.** Route counts are unchanged (8 static, 24 partial, 92 dynamic), so nothing
regressed structurally.

Confirming test: a case **added to the existing** `tests/utils/cookieManager.test.ts`
(PL-14 — no second parallel file). Seen **red** first with the other 28 passing;
**29 of 29 pass** after the fix, including the pre-existing "no request scope"
case that the `unstable_rethrow` attempt had broken. That is the proof the fix is
narrow enough.

### BUG-4 — AC-3's synthetic upload (**closed**)

Recorded as outstanding in the first pass, then performed: a 250 KB payload
through `/ingest/e/`, plus a check that `/ingest/static/*` stays cacheable. See
AC-3 above. No longer a finding.

## Deviations from the plan

1. **Section C's `/ingest` header rule was not added.** It existed because
   `/ingest/*` inherited `public, s-maxage=60` from the `/(.*)` block. PR #114
   deletes that entry outright, so the rule is redundant — and adding it would
   have made `/ingest/static/*` (`recorder.js`) uncacheable, which is the
   `PERF-1` regression the panel warned about. AC-6 is satisfied by PR #114.
2. **Step 3's three clock fixes were not made.** The plan ordered them before the
   build; the build was run first and **demanded none of them**. Making three
   speculative edits to files the build does not object to would be change
   without cause. All three remain as they are, and are recorded in M-4.
3. **`app/(client)/[lang]/navigation/page.tsx`** was modified by the codemod and
   then reverted. It is an untracked file that is not part of this work item.

## Files changed

- **26 files** — all 36 refused route settings deleted (`dynamic` 12,
  `runtime` 14, `revalidate` 7, `dynamicParams` 3). Verified: none remains
  anywhere in `app/`.
- **`next.config.ts`** — `cacheComponents: true`, with a comment recording that
  the flag is application-wide, that no route is converted, and that it enables
  `<Activity>` route retention with no opt-out.
- **`app/(client)/[lang]/layout.tsx`** — `generateStaticParams` returning
  `[{ lang: "sy-en" }]` inline, with the reasoning for one value.
- **40 files** — `instant = false` added by the
  `cache-components-instant-false` codemod, minus two reverted: `app/page.tsx`
  (exempt per the plan, it is half the staging gate) and the untracked
  `navigation/page.tsx`.

**The codemod skipped every `"use client"` page**, exactly as the review panel
predicted (SR-2). All of them are covered by an ancestor layout that did receive
the opt-out — `call_direct/layout.jsx`, `callInProg/layout.jsx`,
`endCall/layout.jsx`, `sellerDashboard/[sellerId]/layout.tsx`,
`simulateUser/layout.tsx` — because a `false` higher in the tree takes
precedence.

## Tests written

**None**, as the plan declared. `tests/proxy.test.ts` is the only `existing`
row and it passes unchanged.

`tests/next-config.test.ts` was written for BUG-1 and lives on the fix branch,
not here.

## Validation

| Check | Result |
|---|---|
| `build` | **pass** — exit 0, 3m30s |
| `typecheck` (`next typegen` then `tsc --noEmit`) | **pass** — 0 errors |
| `lint` (`eslint .`) | **pass** — 0 errors, 69 pre-existing warnings |
| `unit-tests` (`vitest run`) | **pass** — **1979** tests, 113 files (BUG-3's case plus `tests/next-config.test.ts`, which arrived with PR #114) |
| `i18n-parity` | **pass** — 2165 keys in all three files |

## Present in the tree, but NOT part of this work item

A separate piece of work — a navigation demo, done outside this work item — is
in the same working tree. **None of it is mine, none is in any plan section, and
none of it was evaluated for the acceptance criteria.** The owner has confirmed
it must not block this work item.

**Untracked:**

- `BOTTOMNAVIGATION.mp4` — a video
- `app/(client)/[lang]/navigation/page.tsx` — the demo route
- `components/NavigationDemo/` — 5 files
- `docs/mobile-seller-dashboard-locations-api-guide.md`

**Tracked, and this one matters:**

- `proxy.ts` — **one word**, `navigation`, added to the middleware matcher's
  exclusion list so the demo route bypasses the middleware.

`proxy.ts` is a **protected runtime path** (`CLAUDE.md`), and `plan.md` does not
list it, so `IM-5` forbids this work item from touching it. It was not touched by
this work item: the change arrived with the navigation demo. It is recorded here
so that `/verify` can see it is accounted for rather than unexplained, and so
that whoever publishes decides deliberately whether it ships.

**Consequence for publishing:** if the demo route is excluded, that `proxy.ts`
line excludes a path that no longer exists — harmless, but pointless. The two
belong together, in or out.
