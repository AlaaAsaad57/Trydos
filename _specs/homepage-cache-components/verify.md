---
ticket: homepage-cache-components
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-08-31
links:
  clickup:
  github:
---

# Verify — homepage-cache-components (phase 1)

**Outcome: PASSED.** All seven acceptance criteria are satisfied with measured
evidence, and all five validation checks exit 0.

No implementation file was edited at this stage and no commit was created
(`VF-7`, `VF-10`).

## Validation profile — `full`

Resolved from `.claude/project-config.yaml > validation_profiles.full`, depth
`all-ac`. Every command is read-only.

| Check | Command | Exit | Result |
|---|---|---|---|
| `lint` | `eslint .` | **0** | 0 errors, 69 pre-existing warnings |
| `i18n-parity` | `pnpm lint:i18n-parity` | **0** | 2,165 keys present in all three files |
| `typecheck` | `next typegen` then `tsc --noEmit --pretty false` | **0** | 0 errors |
| `unit-tests` | `vitest run --project unit` | **0** | **1,979 passed, 113 files** |
| `build` | `next build` | **0** | 9 static, 24 partial prerender, 90 dynamic; **0** swallowed-cookie warnings |

## Acceptance criteria — all seven

| AC | Result | Evidence |
|---|---|---|
| **AC-1** builds and every route answers, including an unlisted locale | **pass** | `build` exit 0. `/gb-en` → **200**, `/lb-ar` → **200** — neither is in `generateStaticParams`, which returns only `sy-en` |
| **AC-2** nothing personal served in a form a shared cache may store | **pass** | `settings/wallet`, `settings/profile/info`, `settings/orders`, `sellerProfile`, `/sy-en`, `/sy-en/featured` all answer `private, no-cache, no-store, max-age=0, must-revalidate`. Baseline measured `public, s-maxage=60` on every one |
| **AC-3** analytics works after the runtime setting is removed | **pass** | 250 KB synthetic payload POSTed through `/ingest/e/`, buffered and forwarded on the Node runtime; upstream replied `401 "event submitted without an api_key"` — rejecting the fake payload's content, not the proxy failing |
| **AC-4** the staging gate still serves its logo page | **pass** | with `STAGING_GATE=on`, `/` → **200** with the logo markup (6,783 bytes); `/sy-en` → **307** to `/`, temporary and never 308. `tests/proxy.test.ts` passes unchanged |
| **AC-5** the handover states honestly what it covers | **pass** | `implement.md` records M-3 and M-5 as **not produced**, M-4 as **partial by construction** with four named unproven candidates, and M-1's prediction as **wrong** |
| **AC-6** the analytics path is no longer publicly cacheable | **pass** | `/ingest/e/` answers with **no `Cache-Control` at all**; `/ingest/static/recorder.js` answers `public, max-age=14400` — the vendor's own header, forwarded |
| **AC-7** the state-retention change is recorded | **pass** | recorded in `next.config.ts`'s comment, `plan.md`, and `implement.md`, naming `SearchIcon` and the eleven page-mounted modals |

## Declared tests (`VF-11`)

`plan.md > Tests` declared **one** row with a disposition other than `none`:

| AC | Disposition | File | Ran? | Exit |
|---|---|---|---|---|
| AC-4 | `existing` | `tests/proxy.test.ts` | yes, via `unit-tests` | **0** |

All other rows were declared `none — <reason>` and are proven by the `build`
check plus recorded manual measurements, as the plan stated. The plan created no
new test file.

Two tests **were** written during implement, both for confirmed bugs rather than
for an `AC-n`, and both ran green in the same suite: `tests/next-config.test.ts`
(BUG-1) and the new case in `tests/utils/cookieManager.test.ts` (BUG-3).

## Findings

| # | Status | Where it lives | Blocking? |
|---|---|---|---|
| BUG-1 | **closed** | `next.config.ts` | no — fixed and merged as PR #114 (`31840fbb`) |
| BUG-2 | **reclassified — not a defect** | `next.config.ts`, `app/sitemap-static.xml/route.ts` | no — see below |
| BUG-3 | **closed** | `utils/cookies/server-cookie-manager.ts` | no — fixed, 556 warnings → 0 |
| BUG-4 | **closed** | — | no — the synthetic upload was run |

### BUG-1 — personal pages served publicly cacheable

Found by the plan's step 0, which the review gate made a hard precondition for
exactly this purpose. Every document route answered `public, s-maxage=60,
stale-while-revalidate=300` with no `Vary: Cookie`. **Not caused by this work
item** — `/sy-en` carried `force-dynamic` at the time and answered with that
header anyway, disproving the plan's claim that the export masked the config
rule.

Fixed in PR #114, with `tests/next-config.test.ts` seen red before the fix and
green after. Merged, then merged into this branch, and AC-2 is now measured here.

### BUG-2 — reclassified, with the reasoning stated

`implement.md` recorded this as a bug: `app/sitemap-static.xml/route.ts` sets
`max-age=43200`, but the measured response is `3600`, because `next.config.ts`
sets 3600 for the same URL and wins.

`VF-12` permits `passed` only when every **open** finding lies **outside**
`plan.md > Files to change`. Both files are inside it, so as a bug this would
block. It is reclassified instead, on four grounds:

1. **No behaviour is wrong.** `next.config.ts` deliberately sets one hour for
   every sitemap. The system does what the configuration says.
2. **Nothing changed.** Measured `max-age=3600` at baseline and `max-age=3600`
   now — byte-identical. This work item neither created nor altered it.
3. **It has no failing test**, so `VF-12`'s mechanism does not apply.
4. **It was never in scope.** The plan scoped the sitemap edits to `revalidate`
   only; that `Cache-Control` line was outside the change.

What remains is a **redundant value**, not a defect: the handler's 43200 has
never taken effect. Recorded for a future tidy-up, not fixed here.

This reclassification is written out rather than made quietly, because
reclassifying a finding at the gate that would otherwise block it is exactly the
move that deserves scrutiny. The owner was shown the reasoning before the
outcome was recorded.

### BUG-3 — the swallowed prerender bail-out

`getCookieServer` caught the `cookies()` rejection Next raises during a
prerender and answered `null`, so a component could render as a guest instead of
deferring. Predicted by the review panel as SEC-2, then observed: **556 build
warnings**.

The documented fix, `unstable_rethrow`, was **tried and measured to be wrong for
this use** — it re-throws a plain `Error` too, which would have broken the
module's documented "no request → null" contract. Replaced with an explicit rule:
re-throw only what carries a `digest`, plus React's postpone symbol.

**556 warnings → 0**, route counts unchanged. Confirming case added to the
existing `tests/utils/cookieManager.test.ts` (`PL-14` — not a parallel file),
seen red first, and the pre-existing case that the `unstable_rethrow` attempt had
broken passes again. 29 of 29.

## Present in the tree but not part of this work item

A navigation demo, done outside this work item, shares the working tree:
`BOTTOMNAVIGATION.mp4`, `app/(client)/[lang]/navigation/`,
`components/NavigationDemo/`, `docs/mobile-seller-dashboard-locations-api-guide.md`,
and **one word** added to `proxy.ts`'s middleware matcher.

`proxy.ts` is a protected runtime path that `plan.md` does not list, so `IM-5`
forbids this work item touching it — and it did not. The change arrived with the
demo. It is recorded so the modification is accounted for rather than
unexplained, and the owner has confirmed it must not block this work item.

**58 tracked files differ from `develop`: 57 are this work item's, 1 is not.**

## Comprehension gate

`comprehension.md`, `stage: verify`, `attempt: 1`, `result: passed`,
`score: 1/1`.

**Severely degraded, and it must be read that way.** One question against a floor
of three. Both regeneration rounds are spent: the falsifier answered **9 of 10**
drafts correctly, so only one survived. **The `CG-5` integration question was
among the excluded** — attempted twice, rejected twice as a construction tell.

The owner's understanding of the integration surface is **not** evidenced by this
record. Weigh the validation evidence above far more heavily than the gate.

## Deviations carried from implement

1. The plan's `/ingest` header rule was **not added** — PR #114 made it
   redundant, and adding it would have made `recorder.js` uncacheable, the exact
   `PERF-1` regression the panel warned about. AC-6 is satisfied better without
   it.
2. The plan's three clock fixes were **not made** — the build demanded none of
   them. Editing files the build does not object to is change without cause.
3. `implementation-completed` was recorded **before** BUG-3 was fixed and AC-3
   and AC-4 were closed, so the stage said `verify` while that work was still
   implement's. An ordering slip, stated in `implement.md` rather than smoothed
   over; no second transition was invented.

## Follow-up actions

1. **Exclude the navigation demo from the PR** — all five artifacts together,
   including the `proxy.ts` line. Ship the line without the route and it exempts
   a path that does not exist, sitting unexplained in a protected file.
2. **Tidy the redundant sitemap `Cache-Control`** (BUG-2) whenever those handlers
   are next touched.
3. **Carry `docs/homepage-cache-phase-2.md` forward.** Nothing in it is closed by
   this work item. Its M-3 and M-5 are still unanswered and are phase 2's first
   task; M-4 is partial with four named candidates.
4. **Re-check `NEXT_PUBLIC_ALLOW_INDEXING` before launch** — indexing is off
   everywhere today, which is why the crawler-facing findings have no impact yet.
