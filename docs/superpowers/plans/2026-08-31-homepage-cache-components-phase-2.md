# Homepage Cache Components — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the homepage and the category view to Cache Components, so a
cache hit serves the product grids with roughly zero Elasticsearch queries, while
nothing personal is ever stored in a shared cache entry.

**Architecture:** Three moves, in this order. (1) Take every request-bound read —
cookies, `searchParams`, the clock — out of the shared render tree, either by
moving it to the browser or by pushing it below a `<Suspense>` boundary. (2) Put
`use cache` on the readers that are left, all of which take plain serialisable
arguments. (3) Replace the `?mainCategory=` query parameter with a real route
segment, `/{lang}/categories/{slug}`, because a page keyed on `searchParams`
cannot be cached at all.

**Tech Stack:** Next.js 16.3 App Router (`cacheComponents: true`, `use cache`,
`cacheLife`, `cacheTag`, `next/root-params`), React 19, TypeScript,
Elasticsearch, Redis, Vitest (unit suite), Playwright (browser suite, staging
only).

**Spec:** `docs/homepage-cache-phase-2.md` — read it before Task 1. It carries the
decisions (D-3 … D-23), the 18 open findings, and the honest outcome statement.
This plan implements that document and **amends two of its decisions**; both
amendments are stated in full below.

---

## Precondition — clear the tree first

This plan assumes a clean `develop`. At the time of writing, the working tree
holds the five pre-phase-2 bug fixes (sitemap `Cache-Control`, category-slug
validation, sitemap N+1, sitemap `?page=` bound, `[lang]` validation, `is_luck`
cookie re-check) as 11 modified and 5 new files, uncommitted.

**Commit and merge those first.** Two of them are load-bearing here:
`utils/locale.ts` (Task 16 depends on it) and `isValidCategorySlug` in
`serverRequests/meta/home.ts` (Task 14 depends on it).

---

## Global Constraints

Copied from `CLAUDE.md` and `.github/copilot-instructions.md`. Every task's
requirements implicitly include this section.

- **Every bug fix needs a test seen RED before the fix and GREEN after.** No
  exceptions. Say which test, that you saw it red, and that it is green after.
- **Every assertion carries a message** that names the step that failed and, when
  the step crossed a backend, which backend. Never assert on a count. Never put a
  token, a one-time code or a phone number in a message.
- **Two test suites only:** `tests/` (Vitest, `pnpm test:run`, gates every PR) and
  `tests/e2e/` (Playwright, staging, gates nothing). Prefer the unit suite.
- **Never add a parallel test file** for a unit that already has one. Extend the
  existing file.
- **Never test code with no caller.** Prove it repo-wide, then delete the code.
- **Every user-visible string is translated.** Check the exact English key exists
  in all three of `public/translations/translations.{ar,tr,ku}.js` before use; if
  missing, add it to all three in the same edit. `pnpm lint` errors on a missing
  key.
- **Stack-agnostic naming.** No `go`, `laravel`, `nest`, `django` in any name or
  stored value. The two backends are the **gateway** and the **core** backend.
- **JWTs live only in HttpOnly cookies** (`MARKET-TOKEN`, `User-Data`). Never
  localStorage, never a client component. `DEVICE-TOKEN` is legacy — never read
  or set it.
- **Never flag or ticket `app/api/auth/simulate/route.ts`.** Known, accepted,
  slated for removal.
- **Open every local URL with the `sy-en` locale**, never `gb-en`. `gb` is not in
  the region list, so the region modal covers the page.
- **Protected runtime paths** — `proxy.ts`, `next.config.ts`, `instrumentation*.ts`,
  `sentry.*.config.ts`, `.github/workflows/**`. This plan changes `next.config.ts`
  (Task 5) and nothing else in that list.
- **Smallest change that meets the requirement.** No extra abstraction, no
  refactoring of siblings, no scope the plan does not name.
- Breakpoints are inverted max-widths: `xs`/`sm` = max 480px, `md` = max 768px,
  `lg2` = max 912px, `lg` = min 769px.
- React Compiler is on. Do not add `useMemo` / `useCallback` without a profile.
- Commands: `pnpm test:run`, `pnpm lint`, `pnpm lint:i18n-parity`,
  `npx next typegen && npx tsc --noEmit`, `pnpm build`.

---

## Two amendments to `docs/homepage-cache-phase-2.md`

Both come from the Next 16.3 docs shipped inside this repo. Read them before you
disagree.

### Amendment 1 — D-3 changes from `expire: 120` to `expire: 300`

D-3 reads `stale: 60, revalidate: 60, expire: 120`.

`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md`,
section **Prerendering behavior**, says:

> **`revalidate` of `0`, or `expire` under 5 minutes**: excluded from prerenders,
> becoming a "dynamic hole" resolved at request time.

`expire: 120` is under five minutes. So with D-3 as written, **every cached scope
in this plan is excluded from the prerender** and resolved on each request.

That matters because of a second documented fact, in
`.../01-directives/use-cache.md`, section **Runtime caching considerations**:

| Environment | Runtime caching behaviour |
|---|---|
| Serverless | Cache entries typically don't persist across requests |
| Self-hosted | Cache entries persist across requests |

This app deploys to Vercel, which is serverless. Put the two together and D-3 as
written produces: no prerender, no cross-request reuse, and therefore **the same
Elasticsearch load as today, plus extra `<Suspense>` round trips**. It would make
the app slower and change nothing else.

**The amendment:** `stale: 60, revalidate: 60, expire: 300`.

Freshness is unchanged. `revalidate: 60` is what governs how often the server
refreshes content, and it stays at 60. `expire` only takes effect after a period
with **no traffic at all**, and it only decides whether the next visitor waits for
a fresh render instead of getting a stale one. Raising it from 120 to 300 buys the
prerender and costs nothing a shopper can see.

`stale: 60` is left alone on purpose. The same doc says a `stale` between 30
seconds and 5 minutes is included in prerenders but excluded from the route's App
Shell. That is the intended trade: fresh prices matter more than an instant shell.

Task 4 measures this claim against a real build before Task 5 writes the profile.
If the measurement disagrees with the doc, the measurement wins and the profile
changes — say so out loud in the commit.

### Amendment 2 — finding 2 is settled as "shape check only, never 404"

An unknown category slug does **not** 404. `isValidCategorySlug` (already on
`develop`) checks the shape only — letters or digits in any script, plus `-` and
`_`, 1 to 64 characters. Anything that passes renders; Elasticsearch returns no
products and the page shows its empty state.

This satisfies AC-15: a category the backend added one second ago opens
immediately, with no 60-second window in which the cached list has not caught up.
Cache keys stay bounded by the shape rule rather than by a list that goes stale.

---

## Decisions carried over unchanged

| # | Decision | Where it lands |
|---|---|---|
| D-4 | Named `homepage` profile in `next.config.ts`, driven by `HOMEPAGE_CACHE_SECONDS`, fallback 60 | Task 5 |
| D-5 | Stories request starts during HTML parse, not after hydration | Task 11 |
| D-6 | Stories go through the existing `/api/proxy` | Task 11 |
| D-7 | The visitor's own story tile is decided from the Zustand store | Task 11 |
| D-8 | Lucky badges: an inline pre-paint script reads `redemed_ids` | Task 9 |
| D-9 | Signed-in navigation stays server-side and streams behind `Suspense` | Task 13 |
| D-11 | Currency is cached per country and language, on the gateway base | Task 7 |
| D-12 | Unit suite only; no browser test | every task |
| D-13 | Category view moves to `/{lang}/categories/{slug}` | Task 14 |
| D-14 | No redirects from the old `?mainCategory=` addresses | Task 14 |
| D-22 | State no longer resetting on navigation is recorded, not fixed here | Task 21 |
| D-23 | Prerender the minimum, build the rest on demand | Task 16 |

---

## Why `use cache` and not `use cache: remote`

`use cache: remote` stores entries in a platform cache (Redis or KV) that
persists across server instances. It would guarantee the cross-request reuse the
in-memory LRU cannot give on serverless. It also adds a network round trip per
lookup and a platform bill.

**This plan starts with plain `use cache`**, for one reason: the persistence this
change actually needs comes from the **route-level** store, not from the
in-memory LRU. From
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md:157`:

> Pages rendered with runtime params are saved to disk after a successful first
> request.

That is D-23, and it is what makes the second visitor to
`/lb-ar/categories/shoes` cost nothing. Task 20 measures whether it holds. If
Elasticsearch load does not drop, escalating those readers to `use cache: remote`
is a one-word change per function and becomes its own follow-up — with a measured
reason, not a guess.

---

## Three facts that shape every task

Read these three before writing any code. Each one has already caused a wrong
plan in this work item.

**1. `serverRequests/home.tsx` is a `"use server"` module.** You cannot put
`use cache` in it — the two directives are mutually exclusive, and every export in
a `"use server"` file is also a public Server Action endpoint. All new cached
readers go in **new** modules under `serverRequests/cached/`, which are not
`"use server"` and are never re-exported from `serverRequests/index.tsx` (that
barrel is imported by client components; see the "serverRequests barrel client
graph" trap).

**2. `React.cache` does not cross a `use cache` boundary.** From
`.../01-directives/use-cache.md`, section **React.cache isolation**: values stored
via `React.cache` outside a `use cache` function are not visible inside it.
`utils/cookies/getRedeemedIds.ts` is `cache()`-wrapped and is read today inside
all three product wrappers. Moving those wrappers into a cached scope would make
it silently return `[]` — and it reads a cookie, which a `use cache` scope forbids
outright. It has to leave the tree, not be re-plumbed. That is Task 9.

**3. Root params are safe inside `use cache`; `searchParams` is not.** From
`.../04-functions/next-root-params.md:200`: root parameter getters are imported
functions, so Next tracks which ones a cached function uses, and only those join
the cache key. `lang()` inside `use cache` is fine. `searchParams` is request
data — a page that awaits it can never be cached. This is why D-13's route move is
required rather than optional.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `serverRequests/cached/home.ts` | Every `use cache` data reader for the home and category views. Not a `"use server"` module; never re-exported from `serverRequests/index.tsx`; carries `import "server-only"`. |
| `serverRequests/cached/currency.ts` | The cached currency reader (D-11). Same rules. |
| `components/Home/CategoryHomeView.tsx` | The shared server component both routes render. Holds every `<Suspense>` boundary. |
| `components/Home/Stories/StoriesBarClient.tsx` | Client stories bar (D-5, D-6, D-7). Replaces `components/Server/StoriesBarServer.tsx`. |
| `components/Home/RedeemedLuckScript.tsx` | Server component that emits the inline pre-paint script (D-8). |
| `utils/luck/redeemedScript.ts` | The pre-paint script source, as a string, so nothing extra ships as JavaScript. |
| `app/(client)/[lang]/categories/[slug]/page.tsx` | The category route (D-13). |
| `app/(client)/[lang]/error.tsx` | Route error boundary (M-3). |
| `tests/serverRequests/cached/home.test.ts` | Cache-key and argument-shape tests for the cached readers. |
| `tests/utils/luck/redeemedScript.test.ts` | The pre-paint script's behaviour. |
| `tests/cache/noRuntimeReadsInCachedTree.test.ts` | The import-graph assertion (finding 17). |
| `tests/cache/sharedEntryIsNotPersonal.test.ts` | The two-cookie-jar check (finding 16). |
| `docs/homepage-cache-phase-2-measurements.md` | The spike's recorded answers (M-3 … M-6) and Task 20's numbers. |

### Modified files

| Path | Change |
|---|---|
| `next.config.ts` | Add the `homepage` cache profile (Task 5). |
| `app/(client)/[lang]/page.tsx` | Thin wrapper around `CategoryHomeView`; loses `searchParams`; loses `export const instant = false`. |
| `app/(client)/[lang]/layout.tsx` | Loses `export const instant = false`; `AuthNavContainer` moves behind `<Suspense>`. |
| `serverRequests/meta/home.ts` | The metadata reader becomes cached (finding 3). |
| `services/elastic/helpers.ts` | Two clock reads dealt with (finding 6, M-4). |
| `app/api/related-products/[id]/route.ts` | Computes `is_flash_deal_active` itself for the mobile app (finding 5). |
| `components/Server/MainCategories/index.tsx` | Reads the cached category map instead of the raw hit set (finding 12). |
| `components/ServerWrapper/FeaturedProduct.tsx` | Loses its cookie read; takes plain props. |
| `components/ServerWrapper/FlashDealsProduct.tsx` | Same. |
| `components/ServerWrapper/BoutiquesListWrapper.tsx` | Same; recommendations split into their own dynamic hole. |
| `docs/homepage-cache-phase-2.md` | Record the two amendments (Task 21). |

### Deleted files

| Path | Why |
|---|---|
| `components/Server/StoriesBarServer.tsx` | Replaced by `StoriesBarClient`. **Only this file goes** — `serverRequests/stories.ts` has four other live callers (finding 4) and stays. |

---

# Phase A — The spike

Four measurements phase 1 could not produce. Each one is an experiment whose
**recorded answer** is the deliverable, written to
`docs/homepage-cache-phase-2-measurements.md`. Nothing in Phase A ships a
behaviour change except Task 1, which ships a real error boundary the app is
missing today.

Do not start Phase B until all four rows in that file are filled in.

---

### Task 1: Answer M-3 — does an `error.tsx` let a build prerender finish?

There is no `error.tsx` anywhere under `app/(client)`. One Elasticsearch throw
therefore blanks the whole document (see the "E2E NavLogo = Elastic down" note).
M-3 asks a narrower question: with Cache Components on, does an error boundary
let the build finish prerendering the rest of the page when one cached segment
throws?

**Files:**
- Create: `app/(client)/[lang]/error.tsx`
- Create: `docs/homepage-cache-phase-2-measurements.md`
- Test: none — this is a build-behaviour measurement, and the boundary itself is
  a UI component with no logic to unit test. The `build` exit code is the
  evidence.

**Interfaces:**
- Produces: `app/(client)/[lang]/error.tsx`, a client error boundary every route
  under `[lang]` inherits. Tasks 15 and 16 rely on it existing.

- [ ] **Step 1: Add the three translation keys**

Add to all three of `public/translations/translations.ar.js`,
`translations.tr.js`, `translations.ku.js`. Keep them key-parallel — a key in one
must be in all three, in the same edit.

```js
"Something went wrong": "حدث خطأ ما",          // ar
"Try again": "حاول مرة أخرى",                  // ar
"We could not load this part of the page": "لم نتمكن من تحميل هذا الجزء من الصفحة", // ar
```

```js
"Something went wrong": "Bir şeyler ters gitti",   // tr
"Try again": "Tekrar dene",                        // tr
"We could not load this part of the page": "Sayfanın bu bölümünü yükleyemedik",   // tr
```

```js
"Something went wrong": "شتێک هەڵە بوو",           // ku
"Try again": "دووبارە هەوڵ بدە",                    // ku
"We could not load this part of the page": "نەمانتوانی ئەم بەشەی پەڕەکە باربکەین", // ku
```

- [ ] **Step 2: Run the parity check to confirm the keys landed in all three**

Run: `pnpm lint:i18n-parity`
Expected: exit 0, and the reported key count is 3 higher than before.

- [ ] **Step 3: Write the error boundary**

`error.tsx` must be a client component — that is a framework rule, not a choice.
It uses `translateFunction` from `utils/functions`, **not** from `utils/server`:
importing `utils/server` from a client component pulls ~416KB of translations
into the browser bundle.

```tsx
// app/(client)/[lang]/error.tsx
"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { translateFunction } from "utils/functions";
import { LogError } from "utils/errorReporter";

export default function LocaleRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    LogError({ error, type: "route-error", digest: error.digest });
  }, [error]);

  const lang = String(useParams()?.lang ?? "");
  const language = lang.split("-")[1] || "en";

  return (
    <div
      role="alert"
      data-pw="route-error"
      className="flex flex-col items-center justify-center w-full py-[60px] gap-[12px]"
    >
      <p className="text-[#5d5d5d]">
        {translateFunction("Something went wrong", language)}
      </p>
      <p className="text-[#5d5d5d] text-[14px]">
        {translateFunction(
          "We could not load this part of the page",
          language,
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-[40px] px-[20px] rounded-[10px] bg-[#5d5d5d] text-white"
      >
        {translateFunction("Try again", language)}
      </button>
    </div>
  );
}
```

Check `utils/errorReporter`'s real export name before committing. If the client
reporter is named something else, use that name — do not invent one.

- [ ] **Step 4: Confirm the build still passes with the boundary present**

Run: `pnpm build`
Expected: exit 0. Record the route table it prints (static / partial prerender /
dynamic counts). Phase 1 measured **8 static, 24 partial prerenders, 92 dynamic**
— note any difference.

- [ ] **Step 5: Force one segment to throw, and see whether the build still finishes**

This is the actual measurement. Temporarily add a throw inside
`components/ServerWrapper/FeaturedProduct.tsx`, above the `Promise.all`:

```ts
  if (process.env.M3_FORCE_THROW === "1") {
    throw new Error("M-3 probe: forced failure inside a server wrapper");
  }
```

Run: `M3_FORCE_THROW=1 pnpm build`

Record all three of: the exit code, whether the build completed the route table,
and whether the other segments on that route were still prerendered. **Then
remove the probe** — it must not be committed.

- [ ] **Step 6: Write the answer down**

Create `docs/homepage-cache-phase-2-measurements.md` with this exact skeleton and
fill in the M-3 row:

```markdown
# Homepage cache — phase 2 measurements

Answers to the measurements `docs/homepage-cache-phase-2.md` left open.
Each row states what was run, what came back, and the date.

| # | Question | Answer | Evidence |
|---|---|---|---|
| M-3 | Does an `error.tsx` let a build prerender finish? | | |
| M-4 | Which clock reads does the prerender reject? | | |
| M-5 | Does a middleware `Set-Cookie` stop a stored page being reused? | | |
| M-6 | Does a crawler still get a complete document? | | |
| D-3 | Does `expire: 300` get prerendered where `expire: 120` does not? | | |
```

- [ ] **Step 7: Confirm the probe is gone and commit**

Run: `git diff -- components/ServerWrapper/FeaturedProduct.tsx`
Expected: no output. If the probe is still there, remove it before committing.

```bash
git add app/\(client\)/\[lang\]/error.tsx docs/homepage-cache-phase-2-measurements.md public/translations/
git commit -m "feat(cache): add a route error boundary and record the M-3 measurement"
```

---

### Task 2: Answer M-4 — which of the four clock reads does the prerender reject?

`docs/homepage-cache-phase-2.md` names four unproven candidates. Phase 1's build
reported none of them, because it blocked before reaching any. This task finds out
which are real, and — separately — reads the Elasticsearch mapping that decides
how Task 8 fixes the one that matters.

**Files:**
- Modify: `docs/homepage-cache-phase-2-measurements.md`
- Test: none — a measurement.

**Interfaces:**
- Produces: the M-4 row, plus a recorded answer to "is `start_date` mapped as a
  date type in Elasticsearch?". Task 8 branches on that answer.

- [ ] **Step 1: Prove which of the four are reachable from the home render tree**

The four candidates:

| Where | What it reads | Reached from the homepage? |
|---|---|---|
| `services/elastic/helpers.ts:1457` | `new Date().toLocaleDateString("en-US", …)` — the flash-deal Elasticsearch range bound | expected **yes** |
| `services/elastic/helpers.ts:429` | `new Date()` — computes `is_flash_deal_active` | expected **yes** |
| `services/elastic/helpers.ts:2915` | `new Date().toISOString()` — writes a search-log document | expected **no** (search logging) |
| `utils/server/index.tsx:55` | `new Date()` — "Today" / "Yesterday" strings | expected **no** once stories move (Task 11) |

Run each of these and paste the caller list into the measurement file:

```bash
grep -rn "buildBaseConditions" --include=*.ts --include=*.tsx services components app serverRequests
grep -rn "is_flash_deal_active" --include=*.ts --include=*.tsx services components app utils
grep -rn "ShowDayStr\|formatTime" --include=*.ts --include=*.tsx components app | grep -v "utils/functions"
```

- [ ] **Step 2: Make the build actually reach them**

Temporarily wrap the featured reader in a cached scope, so the prerender walks
into `buildBaseConditions`. In `components/ServerWrapper/FeaturedProduct.tsx`, add
at the top of the function body:

```ts
  "use cache";
```

Run: `pnpm build 2>&1 | tee /tmp/m4-build.log`

Grep the log for the framework's own complaint:

```bash
grep -n "Date\|clock\|random\|dynamic\|prerender" /tmp/m4-build.log | head -40
```

Record which of the four the build names, with the exact message. **Then revert
the temporary `"use cache"`** — Task 10 adds the real one.

- [ ] **Step 3: Read the Elasticsearch mapping for `start_date`**

Task 8 has two possible fixes and this decides between them. `.env.development`
holds the Elasticsearch address; do not paste credentials into the measurement
file.

```bash
node -e "
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config({ path: '.env.development' });
const c = new Client({ node: process.env.ELASTICSEARCH_URL, auth: { apiKey: process.env.ELASTICSEARCH_API_KEY } });
c.indices.getMapping({ index: 'products_catalog_develop' })
 .then(r => {
   const p = Object.values(r)[0].mappings.properties;
   console.log('start_date:', JSON.stringify(p.start_date));
   console.log('end_date:  ', JSON.stringify(p.end_date));
 })
 .catch(e => console.error('mapping read failed:', e.message));
"
```

Check the real env-var names in `services/elastic/elasticsearch.config.ts` first
and use those.

Record the answer as one of:
- **`"type": "date"`** → Task 8 uses Elasticsearch date math (`now/d`). Preferred.
- **`"type": "keyword"` or `"text"`** → Task 8 passes the day string in as an
  argument, and you have also found a second, pre-existing bug: a lexicographic
  range compare on `MM/DD/YYYY` orders `01/01/2027` before `12/31/2026`. Record it
  as `BUG-P2-1` and open a separate ticket. Do **not** fix it here.

- [ ] **Step 4: Confirm the probe is gone**

Run: `git status --short`
Expected: only `docs/homepage-cache-phase-2-measurements.md` is modified.

- [ ] **Step 5: Fill in the M-4 row and commit**

```bash
git add docs/homepage-cache-phase-2-measurements.md
git commit -m "docs(cache): record the M-4 clock-read measurement and the start_date mapping"
```

---

### Task 3: Answer M-5 — does a middleware `Set-Cookie` stop a stored page being reused?

`proxy.ts` writes the locale cookies on a full document navigation. If a
`Set-Cookie` on the response makes Next refuse to store or reuse the page, the
whole plan delivers nothing on a first visit — and phase 1 could not test it,
because nothing was stored.

**Files:**
- Modify: `docs/homepage-cache-phase-2-measurements.md`
- Test: none — a measurement against a running server.

**Interfaces:**
- Produces: the M-5 row. Task 16 reads it before choosing what `generateStaticParams`
  returns.

- [ ] **Step 1: Build and start a production server**

`next dev` never stores pages the way production does, so the measurement must run
against a real build.

```bash
pnpm build && pnpm start -p 3111
```

- [ ] **Step 2: Ask for a locale that is NOT in `generateStaticParams`**

`generateStaticParams` returns only `sy-en`, so `lb-ar` is built on demand — the
D-23 path. Every local request needs `--noproxy '*'`; this machine has a corporate
HTTP proxy that answers 503 for localhost otherwise.

```bash
curl -s -D - -o /dev/null --noproxy '*' http://localhost:3111/lb-ar
```

Record the full response headers. The ones that matter: `set-cookie`,
`x-nextjs-cache`, `cache-control`, `age`.

- [ ] **Step 3: Ask for the same URL a second time**

```bash
curl -s -D - -o /dev/null --noproxy '*' http://localhost:3111/lb-ar
```

Compare `x-nextjs-cache` between the two calls. `MISS` then `HIT` means the page
was stored and reused despite the `Set-Cookie`. `MISS` twice means it was not, and
the plan's outcome statement has to be rewritten before Phase D.

- [ ] **Step 4: Prove the file actually landed on disk**

```bash
find .next/server/app -path "*lb-ar*" -newermt "-5 minutes" | head -20
```

Expected, if D-23 holds: an `.html` and an `.rsc` file for `lb-ar` that did not
exist before Step 2.

- [ ] **Step 5: Run the same three checks with the cookie already set**

A returning shopper sends the locale cookie, so `proxy.ts` has nothing to write.
This is the positive control: it separates "the `Set-Cookie` blocked storage" from
"nothing is stored, ever".

```bash
curl -s -D - -o /dev/null --noproxy '*' \
  -H 'Cookie: NEXT_LOCALE=lb-ar' http://localhost:3111/lb-ar
```

Read the real cookie name from `proxy.ts` before running this. If the header
differs, use the real one — a wrong name makes the control silently meaningless.

- [ ] **Step 6: Fill in the M-5 row and commit**

Record all four header sets verbatim. Then:

```bash
git add docs/homepage-cache-phase-2-measurements.md
git commit -m "docs(cache): record the M-5 Set-Cookie measurement"
```

---

### Task 4: Answer M-6 and the D-3 prerender question

Two questions, one build each. M-6 asks whether a crawler still gets a complete
document. The D-3 question asks whether Amendment 1 is right: does `expire: 300`
get prerendered where `expire: 120` does not?

**Files:**
- Modify: `docs/homepage-cache-phase-2-measurements.md`
- Test: none — a measurement.

**Interfaces:**
- Produces: the M-6 and D-3 rows. Task 5 writes the cache profile from the D-3 row.

- [ ] **Step 1: Build a throwaway probe route with `expire: 120`**

```tsx
// app/(client)/[lang]/cache-probe/page.tsx  — TEMPORARY, deleted in step 5
import { cacheLife } from "next/cache";

async function ProbeBody() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 120 });
  return <p data-pw="probe">expire-120</p>;
}

export default function CacheProbePage() {
  return <ProbeBody />;
}
```

Run: `pnpm build 2>&1 | grep -A2 -B2 "cache-probe"`

Record how the route table classifies `cache-probe`: static, partial prerender, or
dynamic.

- [ ] **Step 2: Change one number to 300 and build again**

```tsx
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
```

Run: `pnpm build 2>&1 | grep -A2 -B2 "cache-probe"`

If Amendment 1 is right, the classification improves — the `expire: 120` build
shows the segment as a dynamic hole and the `expire: 300` build prerenders it. If
both builds classify it the same way, **the amendment is wrong**: say so in the
measurement file, keep `expire: 120`, and note that the plan's expected benefit
has to be re-argued.

- [ ] **Step 3: Answer M-6 — does a crawler get a complete document?**

Start the server built in step 2 and ask as Googlebot. Use `sy-en`, never `gb-en`.

```bash
pnpm start -p 3111
```

```bash
curl -s --noproxy '*' \
  -A 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' \
  http://localhost:3111/sy-en > /tmp/m6-bot.html

curl -s --noproxy '*' \
  -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' \
  http://localhost:3111/sy-en > /tmp/m6-browser.html

wc -c /tmp/m6-bot.html /tmp/m6-browser.html
grep -c 'data-pw="boutiques"'          /tmp/m6-bot.html
grep -c 'featured-products-container'  /tmp/m6-bot.html
grep -c 'stories-bar'                  /tmp/m6-bot.html
```

Record byte sizes and each marker count. A crawler that receives the shell but not
the product markup is the failure this measures. Note that
`NEXT_PUBLIC_ALLOW_INDEXING` is `false` everywhere today, so a bad answer here has
no live impact yet — but it blocks launch.

- [ ] **Step 4: Delete the probe route**

```bash
rm -rf "app/(client)/[lang]/cache-probe"
git status --short
```

Expected: only `docs/homepage-cache-phase-2-measurements.md` is modified.

- [ ] **Step 5: Fill in the M-6 and D-3 rows and commit**

```bash
git add docs/homepage-cache-phase-2-measurements.md
git commit -m "docs(cache): record the M-6 crawler measurement and the D-3 expire comparison"
```

---

# Phase B — Foundations

The cache profile, the two cached readers that have no personalisation problem,
and the clock reads. Nothing in Phase B changes what a shopper sees.

---

### Task 5: The `homepage` cache profile

**Files:**
- Modify: `next.config.ts` (protected runtime path — this plan authorises this one
  change and no other)
- Test: `tests/next-config.test.ts` (extend — do **not** create a parallel file)

**Interfaces:**
- Produces: a `cacheLife` profile named `homepage`, referenced as
  `cacheLife("homepage")` by Tasks 6, 7, 10, 14, 15 and 17.
- Consumes: the D-3 row from Task 4.

- [ ] **Step 1: Write the failing test**

Append to `tests/next-config.test.ts`. `getRules()` already exists there for the
headers; add a sibling reader for the cache profiles, following whatever import
shape that file already uses for the config.

```ts
describe("the homepage cache profile", () => {
  it("defines a profile named homepage", async () => {
    const config = await loadConfig();
    expect(
      config.cacheLife?.homepage,
      "next.config.ts defines no cacheLife profile called 'homepage', so every cacheLife('homepage') call in the home and category routes falls back to the 'default' profile (15 minute revalidate) and shoppers see stale prices",
    ).toBeDefined();
  });

  it("revalidates once a minute by default", async () => {
    const config = await loadConfig();
    expect(
      config.cacheLife?.homepage?.revalidate,
      "the homepage profile must refresh once a minute (D-4, fallback 60); a different value changes how stale a price can be",
    ).toBe(60);
  });

  it("expires no sooner than five minutes, so the segment is prerendered", async () => {
    const config = await loadConfig();
    const expire = config.cacheLife?.homepage?.expire;
    expect(
      expire,
      `the homepage profile expires after ${expire}s. Next excludes any scope with expire under 300s from prerenders (cacheLife.md, "Prerendering behavior"), which on serverless means the cached readers re-run on every request and the conversion saves nothing`,
    ).toBeGreaterThanOrEqual(300);
  });

  it("reads the window from HOMEPAGE_CACHE_SECONDS", async () => {
    const previous = process.env.HOMEPAGE_CACHE_SECONDS;
    process.env.HOMEPAGE_CACHE_SECONDS = "30";
    try {
      const config = await loadConfig();
      expect(
        config.cacheLife?.homepage?.revalidate,
        "HOMEPAGE_CACHE_SECONDS=30 did not reach the homepage profile, so the cache window cannot be tuned without a code change (D-4)",
      ).toBe(30);
    } finally {
      process.env.HOMEPAGE_CACHE_SECONDS = previous;
    }
  });
});
```

`loadConfig()` must re-import `next.config.ts` with a fresh module registry so the
env var is read again — `vi.resetModules()` then a dynamic `import()`. Write that
helper in the same file.

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/next-config.test.ts`
Expected: 4 FAIL. The first message reads "next.config.ts defines no cacheLife
profile called 'homepage'…". A failure that says "loadConfig is not defined" is a
test bug, not a red — fix it and re-run until the failure is about the profile.

- [ ] **Step 3: Add the profile**

In `next.config.ts`, above `let nextConfig: NextConfig = {`:

```ts
// The one cache window the home and category views use (D-3, D-4).
//
// HOMEPAGE_CACHE_SECONDS tunes it without a deploy of new code. 60 is the
// fallback and the value D-3 chose.
//
// `expire` is deliberately NOT 60. Next excludes any cached scope whose expire
// is under 5 minutes from prerenders, turning it into a dynamic hole resolved on
// every request — and on serverless the in-memory cache does not survive between
// requests, so a dynamic hole means a fresh Elasticsearch query every time. 300
// is the smallest value that keeps the segment prerendered. It does not make
// content staler: `revalidate` governs freshness, and `expire` only decides what
// the next visitor gets after a stretch with no traffic at all.
// See node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md.
const homepageCacheSeconds =
  Number(process.env.HOMEPAGE_CACHE_SECONDS) || 60;
```

Then inside `nextConfig`, directly under `cacheComponents: true`:

```ts
  cacheLife: {
    homepage: {
      stale: homepageCacheSeconds,
      revalidate: homepageCacheSeconds,
      expire: Math.max(300, homepageCacheSeconds * 5),
    },
  },
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/next-config.test.ts`
Expected: PASS, and the file's pre-existing header tests still pass.

- [ ] **Step 5: Regenerate types and confirm `cacheLife("homepage")` type-checks**

The `cacheLife` signature is generated from `next.config.ts`, so the name only
autocompletes after a typegen run.

Run: `npx next typegen && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts tests/next-config.test.ts
git commit -m "feat(cache): add the homepage cacheLife profile, driven by HOMEPAGE_CACHE_SECONDS"
```

---

### Task 6: Cache the derived category map, not the raw hit set (finding 12)

`GetMainCategories` asks Elasticsearch for **4000 documents** and then throws
almost all of it away — it keeps six fields per unique category. Caching the call
as it stands would store the whole hit set, with every language variant, in every
cache entry.

**Files:**
- Create: `serverRequests/cached/home.ts`
- Create: `tests/serverRequests/cached/home.test.ts`
- Modify: `components/Server/MainCategories/index.tsx`

**Interfaces:**
- Consumes: `cacheLife("homepage")` from Task 5;
  `ElasticsearchReader.getCategories` from
  `services/elastic/elasticsearch-reader.service.ts`.
- Produces:

  ```ts
  export interface HomeCategory {
    id: string | number;
    name: string;
    slug: string;
    flat_photo_path?: { file_path?: string } | null;
    outline_photo_path?: { file_path?: string } | null;
    fill_photo_path?: { file_path?: string } | null;
  }

  export async function getCachedCategories(
    country: string,
    language: string,
  ): Promise<HomeCategory[]>;
  ```

  Tasks 14 and 15 call `getCachedCategories`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/serverRequests/cached/home.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCategories = vi.fn();

vi.mock("services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getCategories = getCategories;
  },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

function hit(categories: any[]) {
  return { _source: { custom_categories: categories } };
}

describe("getCachedCategories", () => {
  beforeEach(() => {
    getCategories.mockReset();
  });

  it("returns only the six fields the navbar renders", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            {
              id: 7,
              language_code: "en",
              name: "Shoes",
              slug: "shoes",
              flat_photo_path: { file_path: "/f.png" },
              outline_photo_path: { file_path: "/o.png" },
              fill_photo_path: { file_path: "/x.png" },
              position: 3,
              category_id: 99,
              description: "a long description nobody renders",
            },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      Object.keys(categories[0]).sort(),
      "the cached category carries fields the navbar never renders, so every cache entry stores more than it needs (finding 12)",
    ).toEqual([
      "fill_photo_path",
      "flat_photo_path",
      "id",
      "name",
      "outline_photo_path",
      "slug",
    ]);
  });

  it("keeps only the requested language", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [
          hit([
            { id: 7, language_code: "en", name: "Shoes", slug: "shoes" },
            { id: 7, language_code: "ar", name: "أحذية", slug: "shoes" },
          ]),
        ],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "ar");

    expect(
      categories.map((c) => c.name),
      "asking for Arabic returned a name in another language, so the navbar would render the wrong words",
    ).toEqual(["أحذية"]);
  });

  it("matches the language case-insensitively", async () => {
    getCategories.mockResolvedValue({
      hits: {
        hits: [hit([{ id: 7, language_code: "EN", name: "Shoes", slug: "shoes" }])],
      },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "a category whose language_code is upper-case was dropped, so the navbar renders empty for that index",
    ).toEqual(["shoes"]);
  });

  it("returns each category once even when many products share it", async () => {
    const shoes = { id: 7, language_code: "en", name: "Shoes", slug: "shoes" };
    getCategories.mockResolvedValue({
      hits: { hits: [hit([shoes]), hit([shoes]), hit([shoes])] },
    });

    const { getCachedCategories } = await import("serverRequests/cached/home");
    const categories = await getCachedCategories("sy", "en");

    expect(
      categories.map((c) => c.slug),
      "the same category came back more than once, so the navbar would show a duplicate tab",
    ).toEqual(["shoes"]);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    getCategories.mockResolvedValue({ hits: { hits: [] } });

    const { getCachedCategories } = await import("serverRequests/cached/home");

    await expect(
      getCachedCategories("sy", "en"),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than the navbar",
    ).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/serverRequests/cached/home.test.ts`
Expected: 5 FAIL, all with "Cannot find module 'serverRequests/cached/home'".

A module-not-found failure is **not** a behavioural red. Before writing the real
implementation, create the file with a stub that returns the raw hits — today's
behaviour:

```ts
// temporary stub, replaced in step 3
export async function getCachedCategories(country: string, language: string) {
  const reader = new ElasticsearchReader();
  const result: any = await reader.getCategories({ country, size: 4000 });
  return result.hits.hits.map((h: any) => h._source.custom_categories[0]);
}
```

Re-run. Expected now: 4 FAIL, 1 PASS — the field-shape, language, case and
de-duplication tests fail on real behaviour, and the empty-list test passes. That
is the red this task needs.

- [ ] **Step 3: Write the real implementation**

```ts
// serverRequests/cached/home.ts
import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { ElasticsearchReader } from "services/elastic/elasticsearch-reader.service";

// Cached readers for the home and category views.
//
// This module is deliberately NOT "use server". A "use server" module cannot
// carry "use cache", and every export in one is also a public Server Action
// endpoint. Do not add it to serverRequests/index.tsx either — that barrel is
// imported by client components, and a next/headers import reaching it breaks
// the build (it type-checks, then fails at build time).
//
// Every function here takes plain serialisable arguments. Nothing reads a
// cookie, a header or the clock: those are the three things a `use cache` scope
// forbids, and they are also the three things that would make one shopper's data
// end up in another shopper's cache entry.

export interface HomeCategory {
  id: string | number;
  name: string;
  slug: string;
  flat_photo_path?: { file_path?: string } | null;
  outline_photo_path?: { file_path?: string } | null;
  fill_photo_path?: { file_path?: string } | null;
}

/**
 * The category tabs, one entry per category, in one language.
 *
 * The Elasticsearch call asks for up to 4000 product documents and each one
 * carries every language variant of its categories. Caching that raw answer
 * would store the whole hit set per (country, language). Only the six fields the
 * navbar renders are kept, so the cache entry stays small (finding 12).
 */
export async function getCachedCategories(
  country: string,
  language: string,
): Promise<HomeCategory[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`categories-${country}-${language}`);

  const reader = new ElasticsearchReader();
  const result: any = await reader.getCategories({ country, size: 4000 });

  const wanted = language?.toLowerCase();
  const byId = new Map<string | number, HomeCategory>();

  for (const item of result?.hits?.hits ?? []) {
    const match = item?._source?.custom_categories?.find(
      (candidate: any) => candidate?.language_code?.toLowerCase() === wanted,
    );
    if (!match || byId.has(match.id)) continue;
    byId.set(match.id, {
      id: match.id,
      name: match.name,
      slug: match.slug,
      flat_photo_path: match.flat_photo_path ?? null,
      outline_photo_path: match.outline_photo_path ?? null,
      fill_photo_path: match.fill_photo_path ?? null,
    });
  }

  return [...byId.values()];
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/serverRequests/cached/home.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Point the navbar at the cached reader**

Replace the body of `components/Server/MainCategories/index.tsx` down to the
`mainCategories` assignment:

```tsx
import { getCachedCategories } from "serverRequests/cached/home";
import NavbarServer from "../Navbar";
import CategoryNavMobile from "components/Home/CategoryNavMobile";

export default async function MainCategoriesNavbar({ lang, mainCategory }) {
  const [country, language] = lang?.split("-");
  let mainCategories = await getCachedCategories(country, language);
  const activeCategory = mainCategory;

  if (mainCategory) {
    const active = mainCategories.find((cat) => cat.slug === mainCategory);
    mainCategories = [
      ...(active ? [active] : []),
      ...mainCategories.filter((cat) => cat.slug !== mainCategory),
    ];
  }
  // …the JSX below stays exactly as it is
```

Note the one behaviour fix folded in: the old code did
`[mainCategories.find(...), ...rest]`, which put `undefined` at the head of the
array whenever the slug was not in the list, and `category.name` then threw. With
Amendment 2 an unknown slug is allowed to render, so this path is now reachable —
guarding it is required, not optional.

- [ ] **Step 6: Run the whole suite and the type check**

Run: `pnpm test:run`
Expected: all green, no new failures.

Run: `npx next typegen && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add serverRequests/cached/home.ts tests/serverRequests/cached/home.test.ts components/Server/MainCategories/index.tsx
git commit -m "feat(cache): cache the derived category map instead of the raw hit set"
```

---

### Task 7: Cache the currency reader (D-11)

`serverRequests/currency.ts` must keep `"use server"` — finding 8, proved during
phase 1: `serverRequests/index.tsx` re-exports it and is imported by client
components, so a plain module there pulls `next/headers` into the client graph. It
type-checks and then fails the build.

So the cached reader is a **new** function in the new module, and it calls the
existing one.

**Files:**
- Create: `serverRequests/cached/currency.ts`
- Modify: `tests/serverRequests/cached/home.test.ts` — no. Create
  `tests/serverRequests/cached/currency.test.ts` (a different unit, so a separate
  file is correct here).

**Interfaces:**
- Consumes: `getCurrency` from `serverRequests/currency` (unchanged,
  still `"use server"`); `cacheLife("homepage")`.
- Produces: `export async function getCachedCurrency(country: string, language: string): Promise<Record<string, any>>`.
  Tasks 10 and 15 call it.

- [ ] **Step 1: Write the failing test**

```ts
// tests/serverRequests/cached/currency.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrency = vi.fn();

vi.mock("serverRequests/currency", () => ({ getCurrency }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

describe("getCachedCurrency", () => {
  beforeEach(() => getCurrency.mockReset());

  it("passes the country and language straight through", async () => {
    getCurrency.mockResolvedValue({ exchange_rate: 12, symbol: "£" });

    const { getCachedCurrency } = await import("serverRequests/cached/currency");
    await getCachedCurrency("sy", "ar");

    expect(
      getCurrency.mock.calls[0],
      "the cached currency reader called the core currency reader with the wrong arguments, so a shopper in one country would see another country's prices",
    ).toEqual(["sy", "ar"]);
  });

  it("drops the timing fields, which differ on every call", async () => {
    getCurrency.mockResolvedValue({
      exchange_rate: 12,
      symbol: "£",
      redis: true,
      time: 3.14159,
    });

    const { getCachedCurrency } = await import("serverRequests/cached/currency");
    const currency = await getCachedCurrency("sy", "ar");

    expect(
      Object.keys(currency).sort(),
      "the cached currency still carries the per-call timing fields (`time`, `redis`); storing them freezes one request's measurement into every later response and makes cache entries differ for no reason",
    ).toEqual(["exchange_rate", "symbol"]);
  });

  it("keeps the empty answer empty rather than inventing a rate", async () => {
    getCurrency.mockResolvedValue({});

    const { getCachedCurrency } = await import("serverRequests/cached/currency");

    expect(
      await getCachedCurrency("sy", "ar"),
      "an empty currency answer was turned into something else; the wallet path treats {} as truthy and walks on, so changing that shape changes the wallet (finding 7)",
    ).toEqual({});
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/serverRequests/cached/currency.test.ts`
Expected: FAIL with "Cannot find module 'serverRequests/cached/currency'".

As in Task 6, first write a stub that forwards the raw result unchanged:

```ts
export async function getCachedCurrency(country: string, language: string) {
  return await getCurrency(country, language);
}
```

Re-run. Expected: 1 FAIL (the timing-fields test), 2 PASS. That is the
behavioural red.

- [ ] **Step 3: Write the real implementation**

```ts
// serverRequests/cached/currency.ts
import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getCurrency } from "serverRequests/currency";

/**
 * The exchange rate and symbol for one country and language (D-11).
 *
 * getCurrency() stays where it is and keeps its "use server" directive:
 * serverRequests/index.tsx re-exports it and client components import that
 * barrel, so a plain module there drags next/headers into the client graph. It
 * type-checks and then fails the build (finding 8).
 *
 * `redis` and `time` are dropped. They measure the call that happened to run,
 * not the money, and storing them would freeze one request's timing into every
 * response served from the entry.
 */
export async function getCachedCurrency(
  country: string,
  language: string,
): Promise<Record<string, any>> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`currency-${country}`);

  const { redis, time, ...currency } = (await getCurrency(
    country,
    language,
  )) as Record<string, any>;

  return currency;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/serverRequests/cached/currency.test.ts`
Expected: 3 PASS.

- [ ] **Step 5: Confirm the failure mode did not change for the wallet**

Finding 7 warns that `services/wallet/index.ts:485` treats `{}` as truthy and
carries on. Nothing in this task touches `getCurrency`, so the wallet is
unaffected — prove it rather than assert it:

Run: `git diff --stat -- serverRequests/currency.ts services/wallet/`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add serverRequests/cached/currency.ts tests/serverRequests/cached/currency.test.ts
git commit -m "feat(cache): add a cached currency reader that keeps getCurrency's use-server module intact"
```

---

### Task 8: Take the clock out of the flash-deal query (finding 6, M-4)

`services/elastic/helpers.ts:1457` reads `new Date().toLocaleDateString()` inside
`buildBaseConditions`, on the `filters.flashdeal === true` branch — the homepage
flash-deals path. It is the Elasticsearch range bound and **cannot** be deleted.

`helpers.ts:429` reads `new Date()` to compute `is_flash_deal_active`. The web
homepage never uses that field — `normalizeListingProduct` does not copy it, and
`components/products/ProductCard/flashPrice.ts` already works it out in the
browser. But the read still runs. Finding 5 says the mobile app does use the
field, so it moves rather than goes.

**Files:**
- Modify: `services/elastic/helpers.ts`
- Modify: `app/api/related-products/[id]/route.ts`
- Test: `tests/services/elastic/helpers.test.ts` (extend if it exists; check first
  with `ls tests/services/elastic/`)

**Interfaces:**
- Consumes: the `start_date` mapping answer from Task 2 step 3.
- Produces: `export function computeFlashActive(product: { flash_deal_start_date?: string; flash_deal_end_date?: string }, now: Date): boolean` from
  `services/elastic/helpers.ts`. The mobile route calls it.

- [ ] **Step 1: Write the failing test for `computeFlashActive`**

```ts
describe("computeFlashActive", () => {
  const window = {
    flash_deal_start_date: "2026-08-01T00:00:00Z",
    flash_deal_end_date: "2026-08-31T23:59:59Z",
  };

  it("is true for a moment inside the window", () => {
    expect(
      computeFlashActive(window, new Date("2026-08-15T12:00:00Z")),
      "a flash deal that is running was reported as finished, so the mobile app would hide a live offer",
    ).toBe(true);
  });

  it("is false before the window opens", () => {
    expect(
      computeFlashActive(window, new Date("2026-07-31T23:59:59Z")),
      "a flash deal that has not started yet was reported as running, so the mobile app would advertise a price nobody can pay",
    ).toBe(false);
  });

  it("is false after the window closes", () => {
    expect(
      computeFlashActive(window, new Date("2026-09-01T00:00:01Z")),
      "a finished flash deal was reported as running",
    ).toBe(false);
  });

  it("is false when the dates cannot be read", () => {
    expect(
      computeFlashActive(
        { flash_deal_start_date: "not a date", flash_deal_end_date: "" },
        new Date("2026-08-15T12:00:00Z"),
      ),
      "an unreadable flash-deal window was reported as running instead of falling back to false",
    ).toBe(false);
  });

  it("takes the moment as an argument and never reads the clock itself", () => {
    const first = computeFlashActive(window, new Date("2026-08-15T12:00:00Z"));
    const second = computeFlashActive(window, new Date("2026-09-15T12:00:00Z"));
    expect(
      [first, second],
      "computeFlashActive gave the same answer for two different moments, so it is reading the clock itself rather than the moment it was given — and a cached scope would freeze whichever moment ran first",
    ).toEqual([true, false]);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/services/elastic/helpers.test.ts`
Expected: 5 FAIL with "computeFlashActive is not a function" or
"computeFlashActive is not defined".

That is an import failure, not a behavioural red. There is no existing exported
function to stub against, because the logic is inline in `formatProduct` today —
so this is genuinely new code, not a behaviour change, and the import-failure red
is the correct red for it. Say that in the commit rather than pretending
otherwise.

- [ ] **Step 3: Extract the function and delete the inline clock read**

In `services/elastic/helpers.ts`, add near the other exported helpers:

```ts
/**
 * Is this product's flash deal running at `now`?
 *
 * `now` is an argument on purpose. Reading the clock here would be a runtime read
 * inside whatever scope calls it, and the homepage now calls the surrounding code
 * from a cached scope — the answer would be frozen at the moment the entry was
 * written and stay wrong until it expired.
 *
 * The web storefront does not use this. normalizeListingProduct never copies the
 * field, and components/products/ProductCard/flashPrice.ts works the window out
 * in the browser, where the clock is the shopper's own. The mobile app reads it
 * from app/api/related-products/[id]/route.ts, which is a route handler and is
 * never cached — so it calls this with a real `new Date()` (finding 5).
 */
export function computeFlashActive(
  product: {
    flash_deal_start_date?: string | null;
    flash_deal_end_date?: string | null;
  },
  now: Date,
): boolean {
  const start = new Date(product?.flash_deal_start_date ?? "");
  const end = new Date(product?.flash_deal_end_date ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return now >= start && now <= end;
}
```

Then in `formatProduct`, replace lines 424–436 (`result.is_flash_deal_active = false;`
through the closing `catch`) with:

```ts
    // is_flash_deal_active is NOT set here any more. Computing it needs the
    // clock, and this function now runs inside a cached scope on the homepage,
    // which would freeze the answer. The one caller that needs the field — the
    // mobile related-products route — calls computeFlashActive() itself.
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/services/elastic/helpers.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: Give the field back to the mobile app**

In `app/api/related-products/[id]/route.ts`, after the products are formatted and
before the response is built:

```ts
import { computeFlashActive } from "services/elastic/helpers";

// The mobile app reads is_flash_deal_active from this endpoint (finding 5).
// formatProduct stopped setting it, because it now runs inside a cached scope on
// the web homepage where a clock read would be frozen. This route handler is
// never cached, so the clock here is the real one.
const now = new Date();
const withFlashState = products.map((product) => ({
  ...product,
  is_flash_deal_active: computeFlashActive(product, now),
}));
```

Use the real variable names in that file. Confirm the field reaches the response
body:

```bash
grep -n "is_flash_deal_active" app/api/related-products/\[id\]/route.ts
```

- [ ] **Step 6: Fix the Elasticsearch range bound — branch on Task 2's answer**

**If Task 2 recorded `"type": "date"`** — replace lines 1457–1461 of
`services/elastic/helpers.ts`:

```ts
  } else if (filters.flashdeal === true) {
    // The range bound is Elasticsearch's own date math, not a JavaScript clock.
    // "now/d" is the start of the current day, worked out by the search engine
    // when the query runs. A JavaScript `new Date()` here would be a clock read
    // inside a cached scope: the bound would freeze at the moment the cache entry
    // was written and keep matching yesterday's deals until it expired
    // (finding 6).
    mustConditions.push({
      bool: {
        must: [
          { term: { flash_deal_status: 1 } },
          { exists: { field: "start_date" } },
          { exists: { field: "end_date" } },
          { range: { start_date: { lte: "now/d" } } },
          { range: { end_date: { gte: "now/d" } } },
```

**If Task 2 recorded `"type": "keyword"` or `"text"`** — date math does not work
on a keyword field. Add a parameter instead, and let the caller pass the day:

```ts
export function buildBaseConditions(filters: any, today?: string) {
  // …
  } else if (filters.flashdeal === true) {
    // The day is an argument, not a clock read. This function runs inside a
    // cached scope on the homepage, so reading the clock here would freeze the
    // bound at the moment the entry was written (finding 6). The caller passes
    // the day, which makes it part of the cache key: a new day is a new entry.
    const currentDate =
      today ??
      new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
```

and in `serverRequests/cached/home.ts`, Task 10's flash reader takes `today` as
its own argument, so the caller outside the cache supplies it.

In this branch, also record `BUG-P2-1` — a lexicographic range compare on
`MM/DD/YYYY` orders `01/01/2027` before `12/31/2026` — in
`docs/homepage-cache-phase-2-measurements.md`, and open a separate ticket. Do not
fix it here.

- [ ] **Step 7: Run the full suite, the type check and the build**

Run: `pnpm test:run`
Expected: all green.

Run: `npx next typegen && npx tsc --noEmit && pnpm build`
Expected: exit 0 for all three.

- [ ] **Step 8: Commit**

```bash
git add services/elastic/helpers.ts app/api/related-products tests/services/elastic/helpers.test.ts
git commit -m "fix(cache): take the clock out of the flash-deal query and give is_flash_deal_active back to the mobile route"
```

---

### Task 9: Move the lucky-badge gate to a pre-paint script (D-8, finding 14)

Today three server wrappers read the `redemed_ids` cookie and bake `is_luck` into
the markup. In a shared cache entry that is wrong twice over: a `use cache` scope
cannot read a cookie at all, and if it could, one shopper's redemption record
would be served to everybody else.

D-8's answer: render every luck badge, and let an inline script that runs before
first paint hide the ones this browser has already redeemed.

**Files:**
- Create: `utils/luck/redeemedScript.ts`
- Create: `components/Home/RedeemedLuckScript.tsx`
- Create: `tests/utils/luck/redeemedScript.test.ts`
- Modify: `utils/listing/normalizeListingProduct.ts`

**Interfaces:**
- Consumes: `REDEEMED_IDS_COOKIE` from `utils/luck` (value `"redemed_ids"` — the
  existing misspelling is deliberate and every reader and writer already uses it).
- Produces:
  - `export const REDEEMED_LUCK_SCRIPT: string` from `utils/luck/redeemedScript`
  - `export function hideRedeemedLuck(document: Document, cookieValue: string): number` from the same module — the same logic as a testable function, returning how many badges it hid
  - `<RedeemedLuckScript />` from `components/Home/RedeemedLuckScript`
  - `normalizeListingProduct(product)` — the second parameter is gone

- [ ] **Step 1: Write the failing test**

```ts
// tests/utils/luck/redeemedScript.test.ts
import { describe, it, expect } from "vitest";
import { hideRedeemedLuck } from "utils/luck/redeemedScript";

function pageWith(ids: (string | number)[]) {
  document.body.innerHTML = ids
    .map((id) => `<span data-luck-badge="${id}">lucky</span>`)
    .join("");
  return document;
}

const cookieFor = (entries: { id: string | number }[]) =>
  encodeURIComponent(JSON.stringify(entries));

describe("hideRedeemedLuck", () => {
  it("hides the badge of a product this browser already redeemed", () => {
    const doc = pageWith([10, 20]);
    hideRedeemedLuck(doc, cookieFor([{ id: 10 }]));

    expect(
      doc.querySelector('[data-luck-badge="10"]')?.getAttribute("hidden"),
      "the badge of an already-redeemed product is still showing, so the shopper is offered a luck price they cannot take",
    ).not.toBeNull();
  });

  it("leaves a badge the shopper has not redeemed alone", () => {
    const doc = pageWith([10, 20]);
    hideRedeemedLuck(doc, cookieFor([{ id: 10 }]));

    expect(
      doc.querySelector('[data-luck-badge="20"]')?.getAttribute("hidden"),
      "a badge the shopper never redeemed was hidden, so a live luck offer disappeared",
    ).toBeNull();
  });

  it("matches a numeric id against a string id", () => {
    const doc = pageWith([10]);
    hideRedeemedLuck(doc, cookieFor([{ id: "10" }]));

    expect(
      doc.querySelector('[data-luck-badge="10"]')?.getAttribute("hidden"),
      "the cookie stored the id as text and the markup as a number, and they did not match — so redeemed products keep showing their badge",
    ).not.toBeNull();
  });

  it("hides nothing when there is no cookie", () => {
    const doc = pageWith([10, 20]);
    const hidden = hideRedeemedLuck(doc, "");

    expect(
      hidden,
      "badges were hidden for a shopper with no redemption record at all",
    ).toBe(0);
  });

  it("hides nothing when the cookie is not readable", () => {
    const doc = pageWith([10, 20]);
    const hidden = hideRedeemedLuck(doc, "%7Bnot json");

    expect(
      hidden,
      "an unreadable cookie hid badges instead of being ignored; a corrupt cookie must never remove a live offer",
    ).toBe(0);
  });

  it("survives a cookie that holds something other than a list", () => {
    const doc = pageWith([10]);

    expect(
      () => hideRedeemedLuck(doc, encodeURIComponent('{"id":10}')),
      "a cookie holding an object instead of a list threw, and this script runs before paint — a throw there blanks the page",
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/utils/luck/redeemedScript.test.ts`
Expected: 6 FAIL with "Cannot find module 'utils/luck/redeemedScript'".

Create the stub that does nothing — today's behaviour on the client, since the
gate is currently server-side:

```ts
export function hideRedeemedLuck(_document: Document, _cookieValue: string) {
  return 0;
}
```

Re-run. Expected: 3 FAIL, 3 PASS. The three hiding tests fail; the three
do-nothing tests pass. That is the behavioural red.

- [ ] **Step 3: Write the implementation**

```ts
// utils/luck/redeemedScript.ts
import { REDEEMED_IDS_COOKIE } from "utils/luck";

/**
 * Hide the luck badges of products this browser has already redeemed.
 *
 * The server cannot do this any more. The product grids are rendered inside a
 * cached scope shared by every shopper, so `is_luck` in the markup is a fact
 * about the product, not about the visitor. The visitor's own redemption record
 * lives in the `redemed_ids` cookie and is applied here, in their browser.
 *
 * Takes the document and the raw cookie value as arguments so it can be tested
 * without a browser. REDEEMED_LUCK_SCRIPT below is the same logic inlined into
 * the page, where it runs before first paint — a badge that appears and then
 * disappears is worse than one that was never drawn.
 */
export function hideRedeemedLuck(
  doc: Document,
  cookieValue: string,
): number {
  if (!cookieValue) return 0;

  let entries: unknown;
  try {
    entries = JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return 0;
  }
  if (!Array.isArray(entries)) return 0;

  const redeemed = new Set(
    entries
      .map((entry: any) => entry?.id)
      .filter((id) => id !== undefined && id !== null)
      .map(String),
  );
  if (redeemed.size === 0) return 0;

  let hidden = 0;
  for (const element of Array.from(doc.querySelectorAll("[data-luck-badge]"))) {
    const id = element.getAttribute("data-luck-badge");
    if (id !== null && redeemed.has(String(id))) {
      element.setAttribute("hidden", "");
      hidden += 1;
    }
  }
  return hidden;
}

/**
 * The same logic, as a string, for an inline <script> in the document.
 *
 * Written out rather than generated from the function above, because the
 * function is a module and this has to be self-contained source that runs with
 * no bundler and no imports. The two are kept in step by the tests: any change
 * to one is a change to the other.
 */
export const REDEEMED_LUCK_SCRIPT = `
(function () {
  try {
    var name = ${JSON.stringify(REDEEMED_IDS_COOKIE)} + "=";
    var raw = "";
    var parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.indexOf(name) === 0) { raw = part.substring(name.length); break; }
    }
    if (!raw) return;
    var entries = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(entries)) return;
    var redeemed = {};
    for (var j = 0; j < entries.length; j++) {
      if (entries[j] && entries[j].id != null) redeemed[String(entries[j].id)] = 1;
    }
    var apply = function () {
      var badges = document.querySelectorAll("[data-luck-badge]");
      for (var k = 0; k < badges.length; k++) {
        var id = badges[k].getAttribute("data-luck-badge");
        if (id !== null && redeemed[String(id)]) badges[k].setAttribute("hidden", "");
      }
    };
    apply();
    document.addEventListener("DOMContentLoaded", apply);
  } catch (e) {}
})();
`;
```

The script runs once straight away, for the markup already parsed above it, and
once more on `DOMContentLoaded` for everything streamed in after. Both are needed:
the product grids arrive inside `<Suspense>` boundaries, so they are not in the
document when the script first runs.

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/utils/luck/redeemedScript.test.ts`
Expected: 6 PASS.

- [ ] **Step 5: Write the server component that emits it**

```tsx
// components/Home/RedeemedLuckScript.tsx
import { REDEEMED_LUCK_SCRIPT } from "utils/luck/redeemedScript";

/**
 * A raw <script>, not next/script, and placed high in the document on purpose.
 *
 * A plain element sits exactly where it is written; next/script lets the
 * framework decide, which is too late — the badge would flash before it was
 * hidden. dangerouslySetInnerHTML is required because React escapes a text child
 * of <script>. This is a Server Component, so the module is rendered to a string
 * here and never shipped to the browser as JavaScript. Same pattern as the image
 * fallback script in the layout.
 */
export default function RedeemedLuckScript() {
  return (
    <script
      id="redeemed-luck"
      dangerouslySetInnerHTML={{ __html: REDEEMED_LUCK_SCRIPT }}
    />
  );
}
```

- [ ] **Step 6: Take the cookie parameter out of `normalizeListingProduct`**

The function's only remaining job for luck is to pass `is_luck` through. Replace
lines 37–39 of `utils/listing/normalizeListingProduct.ts`:

```ts
  // is_luck is a fact about the product, not about the visitor. The visitor's
  // redemption record is a cookie, which a cached scope cannot read — the luck
  // badge is hidden in the browser instead (utils/luck/redeemedScript.ts).
  if (product?.is_luck && product?.luck_price) {
    base.is_luck = true;
  }
```

and change the signature to `normalizeListingProduct(product: any): ListingProduct`.

Find every caller and drop the second argument:

```bash
grep -rn "normalizeListingProduct(" --include=*.ts --include=*.tsx . | grep -v node_modules
```

- [ ] **Step 7: Add `data-luck-badge` to the badge element**

Find where the luck badge is rendered:

```bash
grep -rn "is_luck" --include=*.tsx components/products/ | head -20
```

Add `data-luck-badge={product.product_id ?? product.id}` to the element that
wraps the badge. Without this attribute the script has nothing to select and every
test above passes while the feature does nothing — check it by hand in step 8.

- [ ] **Step 8: Prove it end to end in a browser**

```bash
pnpm dev -p 3111
```

Open `http://localhost:3111/sy-en`. In DevTools, set the cookie to a product on
the page and reload:

```js
document.cookie = 'redemed_ids=' + encodeURIComponent(JSON.stringify([{ id: <a real product_id from the page> }])) + '; path=/';
```

Expected: that product's luck badge is not drawn; every other badge is. Record the
product id you used in the commit message.

- [ ] **Step 9: Run the full suite and commit**

Run: `pnpm test:run && pnpm lint && npx tsc --noEmit`
Expected: all exit 0.

```bash
git add utils/luck/redeemedScript.ts components/Home/RedeemedLuckScript.tsx tests/utils/luck/redeemedScript.test.ts utils/listing/normalizeListingProduct.ts components/products/
git commit -m "feat(cache): hide redeemed luck badges in the browser instead of on the server"
```

---

### Task 10: Cached product readers with no request-bound reads

With the cookie gone from `normalizeListingProduct`, the three product readers can
be cached. They move into `serverRequests/cached/home.ts` beside
`getCachedCategories`.

**Files:**
- Modify: `serverRequests/cached/home.ts`
- Modify: `tests/serverRequests/cached/home.test.ts`
- Modify: `components/ServerWrapper/FeaturedProduct.tsx`
- Modify: `components/ServerWrapper/FlashDealsProduct.tsx`
- Modify: `components/ServerWrapper/BoutiquesListWrapper.tsx`

**Interfaces:**
- Consumes: `GetFeaturedProducts`, `GetFlashDealProducts`, `GetHomeBoutiques` from
  `serverRequests/home` (which stays `"use server"` and is unchanged);
  `normalizeListingProduct` with its new one-argument signature (Task 9).
- Produces, all from `serverRequests/cached/home.ts`:

  ```ts
  export async function getCachedFeatured(
    country: string, language: string, categorySlug: string | null,
  ): Promise<ListingProduct[]>;

  export async function getCachedFlashDeals(
    country: string, language: string, categorySlug: string | null,
  ): Promise<ListingProduct[]>;

  export async function getCachedBoutiques(
    country: string, language: string, categorySlug: string | null,
  ): Promise<{ boutiques: any[]; offset: any }>;
  ```

- [ ] **Step 1: Write the failing tests**

Append to `tests/serverRequests/cached/home.test.ts`. Add these mocks at the top
of the file, beside the existing ones:

```ts
const GetFeaturedProducts = vi.fn();
const GetFlashDealProducts = vi.fn();
const GetHomeBoutiques = vi.fn();

vi.mock("serverRequests/home", () => ({
  GetFeaturedProducts,
  GetFlashDealProducts,
  GetHomeBoutiques,
}));
```

```ts
describe("getCachedFeatured", () => {
  beforeEach(() => GetFeaturedProducts.mockReset());

  it("asks for one category when a slug is given", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    await getCachedFeatured("sy", "en", "shoes");

    expect(
      GetFeaturedProducts.mock.calls[0][0].category,
      "the category slug did not reach the search engine, so a category page would show the whole catalog",
    ).toBe('["shoes"]');
  });

  it("asks for no category when the slug is null", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: { products: [] } });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    await getCachedFeatured("sy", "en", null);

    expect(
      GetFeaturedProducts.mock.calls[0][0].category,
      "a category filter was sent for the plain homepage, so the homepage would show one category's products",
    ).toBeUndefined();
  });

  it("returns products the caller can render without a cookie", async () => {
    GetFeaturedProducts.mockResolvedValue({
      data: { products: [{ product_id: 1, name: "Shoe", is_luck: true, luck_price: 5 }] },
    });
    const { getCachedFeatured } = await import("serverRequests/cached/home");
    const products = await getCachedFeatured("sy", "en", null);

    expect(
      products[0].is_luck,
      "the cached product lost its is_luck flag, so the luck badge would never be drawn for anybody",
    ).toBe(true);
  });

  it("returns an empty list rather than throwing when the search engine answers nothing", async () => {
    GetFeaturedProducts.mockResolvedValue({ data: {} });
    const { getCachedFeatured } = await import("serverRequests/cached/home");

    await expect(
      getCachedFeatured("sy", "en", null),
      "an empty answer from the search engine threw instead of returning an empty list, which would blank the whole page rather than one row",
    ).resolves.toEqual([]);
  });
});
```

Write the matching four for `getCachedFlashDeals` against `GetFlashDealProducts`.
Repeat the code rather than looping over both — a failure must name which of the
two readers broke, and a shared loop reports the same line for both.

For `getCachedBoutiques`:

```ts
describe("getCachedBoutiques", () => {
  beforeEach(() => GetHomeBoutiques.mockReset());

  it("returns the boutiques and the offset the infinite scroll needs", async () => {
    GetHomeBoutiques.mockResolvedValue({
      data: { boutiques: [{ slug: "shop-a" }], offset: [42] },
    });
    const { getCachedBoutiques } = await import("serverRequests/cached/home");
    const result = await getCachedBoutiques("sy", "en", null);

    expect(
      result.boutiques.map((b: any) => b.slug),
      "the cached boutique list came back without its boutiques, so the home page would show an empty offers section",
    ).toEqual(["shop-a"]);
    expect(
      result.offset,
      "the cached boutique list came back without an offset, so the infinite scroll cannot ask for the next page",
    ).toEqual([42]);
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `pnpm test:run -- tests/serverRequests/cached/home.test.ts`
Expected: 9 FAIL, all "getCachedFeatured is not a function" and the like. New
functions, so an import-shape red is the correct red here.

- [ ] **Step 3: Write the readers**

Append to `serverRequests/cached/home.ts`:

```ts
import {
  GetFeaturedProducts,
  GetFlashDealProducts,
  GetHomeBoutiques,
} from "serverRequests/home";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";
import type { ListingProduct } from "types/listing";

/** A category slug as an Elasticsearch filter, or undefined for "no filter". */
function categoryFilter(slug: string | null): string | undefined {
  return slug ? JSON.stringify([slug]) : undefined;
}

export async function getCachedFeatured(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<ListingProduct[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`featured-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetFeaturedProducts({
    language,
    country,
    category: categoryFilter(categorySlug),
    limit: 10,
  });
  return (response?.data?.products ?? []).map(normalizeListingProduct);
}

export async function getCachedFlashDeals(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<ListingProduct[]> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`flash-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetFlashDealProducts({
    language,
    country,
    category: categoryFilter(categorySlug),
    limit: 10,
  });
  return (response?.data?.products ?? []).map(normalizeListingProduct);
}

export async function getCachedBoutiques(
  country: string,
  language: string,
  categorySlug: string | null,
): Promise<{ boutiques: any[]; offset: any }> {
  "use cache";
  cacheLife("homepage");
  cacheTag(`boutiques-${country}-${language}-${categorySlug ?? "all"}`);

  const response: any = await GetHomeBoutiques({
    language,
    country,
    category: categoryFilter(categorySlug) ?? null,
  });
  return {
    boutiques: response?.data?.boutiques ?? [],
    offset: response?.data?.offset ?? null,
  };
}
```

If Task 2 put you on the keyword branch of Task 8 step 6, `getCachedFlashDeals`
takes a fourth argument `today: string` and passes it down, and its `cacheTag`
includes the day.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `pnpm test:run -- tests/serverRequests/cached/home.test.ts`
Expected: all PASS.

- [ ] **Step 5: Rewrite the three wrappers to take plain props**

```tsx
// components/ServerWrapper/FeaturedProduct.tsx
import FeatureProducts from "components/Server/FeatureProducts";
import { getCachedFeatured } from "serverRequests/cached/home";

export async function FeaturedProductWrapper({
  lang,
  currency,
  mainCategory = null,
}: {
  lang: string;
  currency: Record<string, any>;
  mainCategory?: string | null;
}) {
  const [country, language] = lang.split("-");
  const products = await getCachedFeatured(country, language, mainCategory);

  return (
    <FeatureProducts
      currencyData={currency}
      fetauredProductsData={{ data: { products } }}
      lang={lang}
    />
  );
}
```

Note two changes beyond the reader: `currency` is now a resolved value, not a
promise, and `getRedeemedIds()` is gone. The promise-passing existed so the
currency fetch could overlap the product fetch; the caller now awaits the cached
currency once and hands the value to all three wrappers, so nothing is lost.

Apply the same shape to `FlashDealsProduct.tsx` with `getCachedFlashDeals`.

For `BoutiquesListWrapper.tsx`, use `getCachedBoutiques` and **remove the
`RecomendedProductWrapper` child** — it reads the `User-Data` cookie and becomes
its own dynamic hole in Task 12. Leave the `children` slot in place so Task 12 can
pass it in from outside the cached scope:

```tsx
export async function BoutiquesListWrapper({
  params,
  currency,
  mainCategory = null,
  children,
}: any) {
  const [country, language] = params.lang.split("-");
  const { boutiques, offset } = await getCachedBoutiques(
    country,
    language,
    mainCategory,
  );

  return (
    <OfferListServer
      boutiquesData={{ boutiques, offset }}
      params={params}
      mainCategory={mainCategory}
    >
      {children}
    </OfferListServer>
  );
}
```

- [ ] **Step 6: Prove no cookie read is left in the three wrappers**

```bash
grep -n "getRedeemedIds\|getCookieServer\|cookies()" \
  components/ServerWrapper/FeaturedProduct.tsx \
  components/ServerWrapper/FlashDealsProduct.tsx \
  components/ServerWrapper/BoutiquesListWrapper.tsx
```

Expected: no output. A single hit here means the cached scope will throw at
request time, so this check is the gate for the whole task.

- [ ] **Step 7: Run the full suite, type check and build**

Run: `pnpm test:run && npx next typegen && npx tsc --noEmit && pnpm build`
Expected: all exit 0. Record the route table.

- [ ] **Step 8: Commit**

```bash
git add serverRequests/cached/home.ts tests/serverRequests/cached/home.test.ts components/ServerWrapper/
git commit -m "feat(cache): cache the featured, flash-deal and boutique readers"
```

---

# Phase C — Take personal data out of the shared tree

---

### Task 11: Move the stories bar to the browser (D-5, D-6, D-7)

`StoriesBarServer` reads two cookies — `USER_STORIES` and `STORIES_TOKEN` — so it
can never sit inside a cached document. D-5 and D-6 move the request to the
browser, through the existing `/api/proxy`, started during HTML parse rather than
after hydration. D-7 decides the visitor's own tile from the Zustand store.

**Files:**
- Create: `components/Home/Stories/StoriesBarClient.tsx`
- Delete: `components/Server/StoriesBarServer.tsx`
- Test: `tests/components/Home/storiesBarClient.test.tsx`

**Interfaces:**
- Consumes: `/api/proxy` (already exists and already forwards the stories token
  from the HttpOnly cookie — confirm the exact path and payload shape in
  `app/api/proxy/` before writing the fetch); `useAppStore` for the visitor's own
  profile (D-7).
- Produces: `<StoriesBarClient language={string} country={string} />`.

- [ ] **Step 1: Confirm what stays and what goes**

`serverRequests/stories.ts` has four live callers and **must not be deleted**
(finding 4). Prove it before touching anything:

```bash
grep -rn "fetchStoriesForUser\|fetchStoriesForGuest" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected: `components/Chat/pages/StoriesList.tsx`,
`components/Home/Stories/AddStoryWidget.tsx` (twice),
`components/Login/Enhanced/FullEnhancedLoginWidget.tsx`, and
`components/Server/StoriesBarServer.tsx`. Only the last one goes.

- [ ] **Step 2: Confirm `/api/proxy` can serve the stories list**

```bash
ls app/api/proxy/
grep -rn "stories" app/api/proxy/
```

If the proxy does not already forward `users_stories`, add that one endpoint to
its allow list in the same task — do not build a second proxy.

- [ ] **Step 3: Write the failing test**

```tsx
// tests/components/Home/storiesBarClient.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StoriesBarClient from "components/Home/Stories/StoriesBarClient";

describe("StoriesBarClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the stories the storefront returned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ data: [{ id: 1, name: "Rana", stories: [] }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() =>
      expect(
        screen.queryByText("Rana"),
        "the stories backend returned a story but the bar never showed it",
      ).not.toBeNull(),
    );
  });

  it("shows the skeleton, not an error, when the stories backend refuses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream unavailable", { status: 503 }),
    );

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() =>
      expect(
        document.querySelector('[data-pw="stories-skeleton"]'),
        "the stories backend answered 503 and the bar rendered something other than its skeleton; a dead stories service must not stop a shopper browsing",
      ).not.toBeNull(),
    );
  });

  it("never sends a token of its own", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const init = fetchSpy.mock.calls[0][1] as RequestInit | undefined;
    const headers = new Headers(init?.headers ?? {});
    expect(
      headers.get("authorization"),
      "the stories bar set an Authorization header from the browser; the stories token is HttpOnly and must only ever be attached by /api/proxy on the server",
    ).toBeNull();
  });

  it("asks the storefront's own proxy, not the stories backend directly", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    render(<StoriesBarClient language="en" country="sy" />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(
      String(fetchSpy.mock.calls[0][0]),
      "the stories bar called an address other than /api/proxy, so the HttpOnly stories token cannot be attached and every shopper is treated as a guest",
    ).toContain("/api/proxy");
  });
});
```

- [ ] **Step 4: Run the test and watch it fail**

Run: `pnpm test:run -- tests/components/Home/storiesBarClient.test.tsx`
Expected: FAIL with "Cannot find module".

Create a stub that renders the skeleton and fetches nothing. Re-run. Expected:
2 FAIL (the first and the fourth), 2 PASS. That is the behavioural red — the bar
shows nothing and calls nobody.

- [ ] **Step 5: Write the component**

```tsx
// components/Home/Stories/StoriesBarClient.tsx
"use client";

import { useEffect, useState } from "react";
import AddStory from "components/Home/AddStory";
import AddStoryWidget from "components/Home/Stories/AddStoryWidgetLazy";
import StoriesSkeleton from "components/skeleton/StoriesSkeleton";
import StoriesWrapper from "components/clientWrapper/StoriesWrapper";
import { useAppStore } from "store";

/**
 * The stories bar, fetched from the browser.
 *
 * It used to be a server component, and it read two cookies to do it. The home
 * document is now a shared cache entry, so a cookie read there would serve one
 * shopper's session to everybody. The request goes through /api/proxy instead:
 * the proxy runs on the server, so it — and only it — can attach the HttpOnly
 * stories token (D-6). Nothing here ever sees a token.
 *
 * The visitor's own tile comes from the Zustand store, which the auth flow
 * already keeps up to date (D-7).
 *
 * Costs one round trip more than the old server render. That is the trade the
 * outcome statement in docs/homepage-cache-phase-2.md records: the stories bar
 * paints later, and the rest of the page paints from cache.
 */
export default function StoriesBarClient({
  language,
  country,
}: {
  language: string;
  country: string;
}) {
  const [stories, setStories] = useState<any[] | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>();
  const userData = useAppStore((state) => state.auth?.user);
  const isRtl = language === "ar" || language === "ku";

  useEffect(() => {
    let cancelled = false;

    // No Authorization header. The token is HttpOnly; /api/proxy attaches it.
    fetch(
      `/api/proxy/stories/users_stories?page=1&lang=${language}&country=${country}`,
      { credentials: "same-origin" },
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        setStories(body.data ?? []);
        setNextPageUrl(body.next_page_url);
      })
      .catch(() => {
        // A dead stories service must not stop a shopper browsing. The skeleton
        // stays, and nothing is reported to the shopper.
      });

    return () => {
      cancelled = true;
    };
  }, [language, country]);

  return (
    <>
      <AddStoryWidget />
      <div className="stories-bar-container h-[183px] items-center flex w-full z-99999999 max-w-[1365px] justify-start">
        <div
          id="stories-bar"
          className={`stories-bar w-full h-[183px] items-center flex justify-start ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <AddStory />
          {stories ? (
            <StoriesWrapper
              stories={stories}
              userData={userData}
              next_page_url={nextPageUrl}
              isRtl={isRtl}
            />
          ) : (
            <StoriesSkeleton />
          )}
        </div>
      </div>
    </>
  );
}
```

Check the real store selector for the signed-in profile before committing — read
`store/auth/reducer.ts` rather than trusting `state.auth?.user`.

- [ ] **Step 6: Give the skeleton the test's marker**

`components/skeleton/StoriesSkeleton` needs `data-pw="stories-skeleton"` on its
root element, or the second test can never see it.

- [ ] **Step 7: Start the request during HTML parse, not after hydration (D-5)**

`useEffect` runs after hydration, which is the thing D-5 rules out. Add a
preconnect and a preload hint in the same component's render, so the browser opens
the connection while it is still parsing:

```tsx
<link
  rel="preload"
  as="fetch"
  crossOrigin="anonymous"
  href={`/api/proxy/stories/users_stories?page=1&lang=${language}&country=${country}`}
/>
```

Measure it rather than assume: load `http://localhost:3111/sy-en` with the Network
panel open and compare the stories request's start time against `domInteractive`.
Record both numbers in the commit message. If the preload does not move it
earlier, delete the hint — an unused preload is a warning in every browser
console.

- [ ] **Step 8: Delete the server component and re-point its caller**

```bash
git rm components/Server/StoriesBarServer.tsx
grep -rn "StoriesBarServer" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected after the edit in Task 15: no output.

- [ ] **Step 9: Run the test and watch it pass, then the full suite**

Run: `pnpm test:run`
Expected: all green.

- [ ] **Step 10: Commit**

```bash
git add components/Home/Stories/StoriesBarClient.tsx tests/components/Home/storiesBarClient.test.tsx components/skeleton/StoriesSkeleton.tsx
git commit -m "feat(cache): fetch the stories bar from the browser through /api/proxy"
```

---

### Task 12: Recommendations become their own dynamic hole

`RecomendedProductWrapper` reads the `User-Data` cookie for `userId`, and the
recommendations are personal by definition. It cannot be cached and it must not
sit inside a cached parent.

**Files:**
- Create: `components/ServerWrapper/RecommendedWrapper.tsx` (moved out of
  `BoutiquesListWrapper.tsx`)
- Modify: `components/ServerWrapper/BoutiquesListWrapper.tsx`

**Interfaces:**
- Consumes: `getCookieServer(COOKIE_NAMES.USER_DATA)`, `GetRecommedndedProducts`
  from `serverRequests/home`, and a resolved `currency` value.
- Produces: `<RecommendedWrapper lang={string} currency={Record<string, any>} />`,
  rendered by Task 15 inside its own `<Suspense>`.

- [ ] **Step 1: Move the component out, unchanged**

Cut `RecomendedProductWrapper` from `components/ServerWrapper/BoutiquesListWrapper.tsx`
into a new file. Change only two things: the name (`RecommendedWrapper`, spelled
correctly — the old misspelling was never exported, so nothing else references it)
and the `currency` prop, which is now a resolved value rather than a promise.

```tsx
// components/ServerWrapper/RecommendedWrapper.tsx
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { getCookieServer } from "utils/cookies/server-cookie-manager";
import { GetRecommedndedProducts } from "serverRequests/home";
// …the rest of the imports and the JSX exactly as they were

/**
 * Recommendations, rendered per request.
 *
 * This is a dynamic hole on purpose. It reads the User-Data cookie for the
 * shopper's id, so it can never join a cached entry — one shopper's
 * recommendations in a shared cache entry would be shown to everybody. The
 * caller wraps it in its own <Suspense>, so the rest of the page still comes
 * from cache while this streams in.
 */
export default async function RecommendedWrapper({ lang, currency }) {
  const [country, language] = lang.split("-");
  const userId = ((await getCookieServer(COOKIE_NAMES.USER_DATA)) as any)?.id;
  const response = await GetRecommedndedProducts({
    country,
    language,
    limit: 7,
    userId,
  });
  // …unchanged body, using `currency` directly instead of awaiting it
}
```

- [ ] **Step 2: Confirm nothing else referenced the old inner component**

```bash
grep -rn "RecomendedProductWrapper" --include=*.ts --include=*.tsx . | grep -v node_modules
```

Expected: no output. It was a module-private function.

- [ ] **Step 3: Run the full suite and the build**

There is no new logic here — it is a move — so no new test is written. That is the
rule: never add a test for code that has no new behaviour.

Run: `pnpm test:run && npx tsc --noEmit && pnpm build`
Expected: all exit 0.

- [ ] **Step 4: Commit**

```bash
git add components/ServerWrapper/
git commit -m "refactor(cache): move recommendations into their own component so they can be a dynamic hole"
```

---

### Task 13: Stream the signed-in navigation behind `Suspense` (D-9)

`AuthNavContainer` reads four cookies and sits directly in the layout, above
`children`. That is exactly the "blocking-prerender-runtime" shape the migration
guide warns about: a runtime read outside a `<Suspense>` boundary makes the whole
route dynamic.

**Files:**
- Modify: `app/(client)/[lang]/layout.tsx`
- Create: `components/Home/AuthNavSkeleton.tsx`

**Interfaces:**
- Produces: `<AuthNavSkeleton />` — a shape-matched placeholder for
  `UserNavTopSection`. Task 16 keeps it.

- [ ] **Step 1: Measure the shape the skeleton has to match**

Load `http://localhost:3111/sy-en` and, in DevTools, read the rendered width and
height of the element `AuthNavContainer` produces. A skeleton of a different size
moves the logo when the real navigation arrives, which is a layout shift on the
largest element above the fold.

Record both numbers. The repo's rule is that every deferred slot gets a
shape-matched skeleton built from `components/Server/Skeleton.tsx` with
`animate-pulse` — never `null`, never a bare `div`.

- [ ] **Step 2: Write the skeleton**

```tsx
// components/Home/AuthNavSkeleton.tsx
import Skeleton from "components/Server/Skeleton";

/**
 * Placeholder for the signed-in navigation while it streams in (D-9).
 *
 * Its size is measured from the real component, not guessed. This sits beside
 * the logo at the top of every page, so a placeholder of the wrong size shifts
 * the largest element above the fold.
 */
export default function AuthNavSkeleton() {
  return (
    <div
      className="flex flex-row items-center gap-[10px] ml-auto"
      data-pw="auth-nav-skeleton"
      aria-hidden="true"
    >
      <Skeleton className="w-[<measured>px] h-[<measured>px] rounded-full animate-pulse" />
      <Skeleton className="w-[<measured>px] h-[<measured>px] rounded-[8px] animate-pulse" />
    </div>
  );
}
```

Replace `<measured>` with the numbers from step 1 before committing. Leaving the
placeholder text in is a plan failure, not a style point.

- [ ] **Step 3: Wrap the container in the layout**

In `app/(client)/[lang]/layout.tsx`, replace `<AuthNavContainer />` on line 218:

```tsx
            {/* Four cookie reads, so this is request-bound. Wrapped so the rest
                of the document can be prerendered and this streams in behind it
                (D-9). Without the boundary the whole route is dynamic and
                nothing else on the page can be cached. */}
            <Suspense fallback={<AuthNavSkeleton />}>
              <AuthNavContainer />
            </Suspense>
```

Add `import { Suspense } from "react";` and the skeleton import at the top.

- [ ] **Step 4: Prove the route table changed**

Run: `pnpm build`

Compare the route table against the one Task 1 step 4 recorded. If no route moved
from dynamic towards partial-prerender, the boundary did not help — find the next
runtime read that is still outside a boundary before continuing:

```bash
grep -rn "getCookieServer\|cookies()\|headers()" app/\(client\)/\[lang\]/layout.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/\(client\)/\[lang\]/layout.tsx components/Home/AuthNavSkeleton.tsx
git commit -m "feat(cache): stream the signed-in navigation behind Suspense"
```

---

# Phase D — The routes

---

### Task 14: The `/{lang}/categories/{slug}` route (D-13, D-14, finding 2)

`?mainCategory=` is a search parameter, and a page that awaits `searchParams` can
never be cached. The category view becomes a path segment.

**Files:**
- Create: `app/(client)/[lang]/categories/[slug]/page.tsx`
- Create: `components/Home/CategoryHomeView.tsx`
- Test: `tests/app/categoryRoute.test.ts`

**Interfaces:**
- Consumes: `isValidCategorySlug` from `serverRequests/meta/home`;
  `getCachedCurrency` (Task 7); every cached reader from Task 10;
  `<RecommendedWrapper>` (Task 12); `<StoriesBarClient>` (Task 11);
  `<RedeemedLuckScript>` (Task 9).
- Produces: `<CategoryHomeView slug={string | null} />` — the single component both
  routes render. Task 15 uses it too.

- [ ] **Step 1: Write the failing test for the slug gate**

```ts
// tests/app/categoryRoute.test.ts
import { describe, it, expect } from "vitest";
import { isValidCategorySlug } from "serverRequests/meta/home";

describe("the category route's slug gate", () => {
  it("accepts a slug the backend could really return", () => {
    expect(
      isValidCategorySlug("womens-shoes"),
      "an ordinary category slug was refused, so a real category page would 404",
    ).toBe(true);
  });

  it("accepts a slug that is not in the cached category list", () => {
    // Amendment 2 / finding 2: the gate checks the SHAPE, never a list. A
    // category the backend added a second ago must open at once (AC-15).
    expect(
      isValidCategorySlug("a-category-added-one-second-ago"),
      "a slug the cached list has not caught up with was refused; AC-15 requires a brand new category to open immediately",
    ).toBe(true);
  });

  it("refuses a slug carrying a path", () => {
    expect(
      isValidCategorySlug("../../etc/passwd"),
      "a slug containing path characters was accepted, and it reaches the Redis metadata key and the OpenGraph url",
    ).toBe(false);
  });

  it("refuses a slug longer than the cache key should ever carry", () => {
    expect(
      isValidCategorySlug("x".repeat(65)),
      "an over-long slug was accepted; the slug is part of the cache key, so an unbounded length is an unbounded number of entries a stranger can create",
    ).toBe(false);
  });

  it("accepts a slug written in Arabic", () => {
    expect(
      isValidCategorySlug("أحذية"),
      "an Arabic slug was refused; three of the four languages this app serves are not written in Latin letters",
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and watch it fail — or not**

Run: `pnpm test:run -- tests/app/categoryRoute.test.ts`

Expected: **5 PASS.** `isValidCategorySlug` already exists on `develop`, so these
are regression guards, not a red-first proof. Say exactly that in the commit
rather than claiming a red you did not see. The behaviour they guard is new to
this route even though the function is not.

- [ ] **Step 3: Write the shared view**

```tsx
// components/Home/CategoryHomeView.tsx
import { Suspense } from "react";
import { lang as langParam } from "next/root-params";

import SearchIcon from "components/Home/Search/SearchIcon";
import MainCategoriesNavbar from "components/Server/MainCategories";
import StoriesBarClient from "components/Home/Stories/StoriesBarClient";
import RedeemedLuckScript from "components/Home/RedeemedLuckScript";
import Home from "components/Home";
import RecommendedWrapper from "components/ServerWrapper/RecommendedWrapper";
import { BoutiquesListWrapper } from "components/ServerWrapper/BoutiquesListWrapper";
import { FlashProductWrapper } from "components/ServerWrapper/FlashDealsProduct";
import { FeaturedProductWrapper } from "components/ServerWrapper/FeaturedProduct";

import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";

import { getCachedCurrency } from "serverRequests/cached/currency";

/**
 * The home and category views, which differ only by `slug`.
 *
 * `slug` is null for the home page and a category slug for /categories/{slug}.
 * It arrives as a route segment, never as a search parameter: a page that awaits
 * searchParams can never be cached, which is why D-13 moved the address.
 *
 * Every child is either cached or wrapped in its own <Suspense>. Nothing between
 * them reads a cookie, a header or the clock. Two children are deliberately
 * request-bound and stream in: the recommendations (they need the shopper's id)
 * and the stories bar (it runs in the browser).
 */
export default async function CategoryHomeView({
  slug,
}: {
  slug: string | null;
}) {
  const lang = await langParam();
  const [country, language] = lang.split("-");
  const isRtl = language === "ar" || language === "ku";
  const currency = await getCachedCurrency(country, language);

  return (
    <>
      <RedeemedLuckScript />

      <div
        className={`${
          isRtl ? "flex-row-reverse pr-[10px]" : "flex-row pl-[10px]"
        } bg-white w-full pl-[10px] shadow-[0px_0px_6px_rgb(0,0,0,0.1)] z-999999995`}
      >
        <SearchIcon country={country} language={language} />
        <Suspense fallback={<MobileNavigationSkeleton />} key={`Navbar ${lang}`}>
          <MainCategoriesNavbar lang={lang} mainCategory={slug} />
        </Suspense>
      </div>

      <StoriesBarClient language={language} country={country} />

      <Suspense
        fallback={<FeaturedProductsSkeleton />}
        key={`Featured ${lang} ${slug ?? "main"}`}
      >
        <FeaturedProductWrapper
          currency={currency}
          lang={lang}
          mainCategory={slug}
        />
      </Suspense>

      <Suspense
        fallback={<FeaturedProductsSkeleton />}
        key={`FlashDeals ${lang} ${slug ?? "main"}`}
      >
        <FlashProductWrapper
          currency={currency}
          lang={lang}
          mainCategory={slug}
        />
      </Suspense>

      <Home key={`Home ${lang}`} />

      <Suspense
        fallback={<OfferListSkeleton />}
        key={`OfferList ${lang} ${slug ?? "main"}`}
      >
        <BoutiquesListWrapper
          currency={currency}
          params={{ lang }}
          mainCategory={slug}
        >
          {slug ? null : (
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <RecommendedWrapper lang={lang} currency={currency} />
            </Suspense>
          )}
        </BoutiquesListWrapper>
      </Suspense>
    </>
  );
}
```

`StoriesBarClient` needs no `<Suspense>` — it is a client component that renders
its own skeleton while it fetches. The old server version needed one because it
awaited on the server.

- [ ] **Step 4: Write the route**

```tsx
// app/(client)/[lang]/categories/[slug]/page.tsx
import { notFound } from "next/navigation";
import { lang as langParam } from "next/root-params";
import CategoryHomeView from "components/Home/CategoryHomeView";
import { GetHomeMetaData, isValidCategorySlug } from "serverRequests/meta/home";
import { LogServerError } from "utils/serverErrorReporter";

// The slug is checked by SHAPE only, never against the category list (finding 2,
// Amendment 2). Checking against a list cached for 60 seconds would 404 a
// category the backend added a moment ago, which AC-15 forbids. A slug-shaped
// name the catalog does not know simply returns no products.
//
// The check still matters: the slug joins the cache key, the Redis metadata key
// and the OpenGraph url. Without it, anyone can create as many cache entries as
// they can send requests.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const lang = await langParam();
  const category = isValidCategorySlug(slug) ? slug : null;
  try {
    return await GetHomeMetaData({ local: lang, category });
  } catch (error) {
    LogServerError({ error, type: "meta" }, `/${lang}/categories/${category}`);
    return {};
  }
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  if (!isValidCategorySlug(slug)) notFound();
  return <CategoryHomeView slug={slug} />;
}
```

The `catch` returns `{}` rather than rebuilding the whole fallback object the
homepage has: Next merges an empty object with the layout's `metadata`, so the
page keeps the site title. Duplicating a 40-line fallback in a second file is the
kind of copy this repo's rules rule out.

- [ ] **Step 5: Build and confirm the route appears**

Run: `pnpm build 2>&1 | grep -A1 -B1 "categories"`
Expected: `/[lang]/categories/[slug]` in the route table. Record its
classification.

- [ ] **Step 6: Open it in a browser**

```bash
pnpm dev -p 3111
```

Check all three, using `sy-en`:

| URL | Expected |
|---|---|
| `http://localhost:3111/sy-en/categories/<a real slug>` | products for that category |
| `http://localhost:3111/sy-en/categories/definitely-not-a-category` | the page renders with no products — **not** a 404 |
| `http://localhost:3111/sy-en/categories/..%2F..%2Fetc%2Fpasswd` | 404 |

- [ ] **Step 7: Run the full suite and commit**

Run: `pnpm test:run && pnpm lint && npx tsc --noEmit`
Expected: all exit 0.

```bash
git add app/\(client\)/\[lang\]/categories components/Home/CategoryHomeView.tsx tests/app/categoryRoute.test.ts
git commit -m "feat(cache): add the /categories/[slug] route and the shared home view"
```

---

### Task 15: The homepage becomes a thin, cacheable wrapper

**Files:**
- Modify: `app/(client)/[lang]/page.tsx`

**Interfaces:**
- Consumes: `<CategoryHomeView slug={null} />` from Task 14.
- Produces: a homepage with no `searchParams`, no `export const instant = false`.

- [ ] **Step 1: Rewrite the page**

```tsx
// app/(client)/[lang]/page.tsx
import { lang as langParam } from "next/root-params";
import CategoryHomeView from "components/Home/CategoryHomeView";
import { GetHomeMetaData } from "serverRequests/meta/home";
import { General_Site_Data } from "serverRequests/meta/StructuredData/Constants";
import { LogServerError } from "utils/serverErrorReporter";
import { translateFunction } from "utils/server";

// `export const instant = false` is gone. It was phase 1's opt-out, added so the
// app could build with Cache Components on before any route was converted. This
// route is converted now.
//
// `searchParams` is gone too, and that is the change that makes the rest
// possible: a page that awaits searchParams is request-bound and can never be
// cached. ?mainCategory= became /categories/{slug} (D-13). Old addresses are not
// redirected (D-14) — they now render the plain homepage, which is a correct
// page, not an error.

export async function generateMetadata() {
  const lang = await langParam();
  try {
    return await GetHomeMetaData({ local: lang, category: null });
  } catch (error) {
    LogServerError({ error, type: "meta" }, `/${lang}`);
    const language = lang.split("-")[1];
    const baseUrl = General_Site_Data.url;
    const ogImageUrl = baseUrl + General_Site_Data.og;
    const title = translateFunction(
      "TryDos - Premium Shopping Experience",
      language,
    );
    const description = translateFunction(
      "Discover premium products on TryDos - Your ultimate shopping destination with featured products, flash deals, and boutique collections.",
      language,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${lang}`,
        siteName: "Trydos",
        type: "website",
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }
}

export default async function HomePage() {
  return <CategoryHomeView slug={null} />;
}
```

The `try`/`catch` that used to wrap the JSX is gone. It caught, logged and then
re-threw the same error, which is what an error boundary is for — and Task 1 added
one. Re-throwing from a Server Component only prevented React from streaming the
parts that had already rendered.

- [ ] **Step 2: Confirm no runtime read is left in the page**

```bash
grep -n "searchParams\|cookies()\|getCookieServer\|new Date\|instant" app/\(client\)/\[lang\]/page.tsx
```

Expected: no output.

- [ ] **Step 3: Build and read the route table**

Run: `pnpm build`

Record how `/[lang]` is classified now, against Task 1 step 4's baseline of
**8 static, 24 partial prerenders, 92 dynamic**. `/[lang]` moving from dynamic to
partial-prerender is the result this whole plan exists for. If it did not move,
stop and find the read that is still blocking it before going on to Task 16.

- [ ] **Step 4: Check the old address still works**

```bash
curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' \
  'http://localhost:3111/sy-en?mainCategory=shoes'
```

Expected: `200`, rendering the plain homepage. D-14 chose not to redirect; the
parameter is now ignored rather than honoured.

- [ ] **Step 5: Commit**

```bash
git add app/\(client\)/\[lang\]/page.tsx
git commit -m "feat(cache): convert the homepage to a cacheable route"
```

---

### Task 16: The layout's static shell and `generateStaticParams` (D-23)

**Files:**
- Modify: `app/(client)/[lang]/layout.tsx`

**Interfaces:**
- Consumes: `isSupportedLocaleSegment` from `utils/locale` (already on `develop`);
  the M-5 answer from Task 3.
- Produces: a layout with no `instant = false` opt-out.

- [ ] **Step 1: Remove the opt-out**

Delete lines 32–34 of `app/(client)/[lang]/layout.tsx`:

```tsx
// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;
```

- [ ] **Step 2: Confirm `generateStaticParams` still returns one locale (D-23)**

Leave it exactly as it is:

```tsx
export function generateStaticParams() {
  return [{ lang: "sy-en" }];
}
```

D-23 is unchanged, and Task 3 measured that a locale outside this list is built on
first request and stored. Update the comment above it to point at the measurement
rather than at a prediction:

```tsx
// One value on purpose (D-23). 20 locales times every category page is between
// roughly 1,860 and 7,420 pages; building them all would make every deploy pay
// for pages nobody may open, and would tie the build to Elasticsearch.
//
// Every locale not listed here still works: Next serves the App Shell and saves
// the page to disk after the first successful request. That is measured, not
// assumed — see docs/homepage-cache-phase-2-measurements.md, row M-5.
```

If Task 3's M-5 row says pages were **not** stored, this comment is a lie and D-23
does not hold. Stop and take it back to the owner before continuing.

- [ ] **Step 3: Confirm the locale guard survived**

The `notFound()` on an unsupported locale segment must still be there — it is what
bounds the cache keys now that `[lang]` is part of every one.

```bash
grep -n "isSupportedLocaleSegment" app/\(client\)/\[lang\]/layout.tsx
```

Expected: one hit, inside `RootLayout`.

- [ ] **Step 4: Prove the guard still refuses an unknown locale**

An RSC prefetch always answers **200**, even after `notFound()`. Status tells you
nothing here. Judge by payload size — a refused locale returns the small
not-found payload, an allowed one returns the full page.

```bash
pnpm build && pnpm start -p 3111
```

```bash
for locale in sy-en jo-ar syria-en zz-qq; do
  size=$(curl -s --noproxy '*' \
    -H 'purpose: prefetch' -H 'RSC: 1' \
    "http://localhost:3111/$locale?_rsc" | wc -c)
  echo "$locale -> $size bytes"
done
```

Expected shape, measured before this plan started: `sy-en` about 262,000 bytes,
`jo-ar` about 268,000, and both `syria-en` and `zz-qq` about 230,000. The two
groups must stay clearly apart. If a refused locale returns a payload the size of
an allowed one, the guard broke.

- [ ] **Step 5: Run the whole gate**

```bash
pnpm test:run
pnpm lint
pnpm lint:i18n-parity
npx next typegen && npx tsc --noEmit
pnpm build
```

Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/\(client\)/\[lang\]/layout.tsx
git commit -m "feat(cache): remove the layout's Cache Components opt-out"
```

---

### Task 17: Cache the metadata reader (finding 3)

`GetHomeMetaData` builds `meta-obj-${category}-${lang}-${country}` and writes it to
Redis on every request. The slug is already validated (a pre-phase-2 fix). What is
left is that `generateMetadata` runs on every request even when the page itself is
served from cache.

**Files:**
- Modify: `serverRequests/meta/home.ts`
- Modify: `tests/serverRequests/meta/home.test.ts` (extend — it exists)

**Interfaces:**
- Consumes: `cacheLife("homepage")`.
- Produces: `GetHomeMetaData` unchanged in signature, cached internally.

- [ ] **Step 1: Write the failing test**

Append to `tests/serverRequests/meta/home.test.ts`:

```ts
it("asks the search engine once for two identical metadata requests", async () => {
  // generateMetadata runs on every request, including the ones the page itself
  // is served from cache. Without a cached scope, every one of those is another
  // Elasticsearch query and another Redis write for a title that did not change.
  const { GetHomeMetaData } = await import("serverRequests/meta/home");

  await GetHomeMetaData({ local: "sy-en", category: "shoes" });
  await GetHomeMetaData({ local: "sy-en", category: "shoes" });

  expect(
    searchSpy.mock.calls.length,
    "two identical metadata requests each ran their own search-engine query; the second one must come from cache",
  ).toBe(1);
});
```

`searchSpy` is the existing Elasticsearch mock in that file — reuse it, do not add
a second one.

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm test:run -- tests/serverRequests/meta/home.test.ts`
Expected: 1 FAIL, "two identical metadata requests each ran their own
search-engine query" — received 2, expected 1.

- [ ] **Step 3: Split the reader and cache the inner half**

`GetHomeMetaData` cannot become `"use cache"` wholesale, because it validates the
slug from a raw argument and its Redis write is a side effect a cached scope must
not carry. Split it:

```ts
/**
 * The category's name and picture, cached.
 *
 * generateMetadata runs on every request — including the many that are served
 * from a cached page — so an uncached reader here means the search engine is
 * asked for a title that did not change, once per visit (finding 3).
 *
 * The slug is validated by the caller before it reaches this function, so the
 * cache key can never carry a value a stranger chose.
 */
async function getCachedMetaSource(
  country: string,
  language: string,
  category: string | null,
) {
  "use cache";
  cacheLife("homepage");
  cacheTag(`meta-${country}-${language}-${category ?? "home"}`);

  // …the existing search-engine read, moved here unchanged
}
```

`GetHomeMetaData` keeps the slug check, calls `getCachedMetaSource`, and keeps its
Redis write outside the cached scope.

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm test:run -- tests/serverRequests/meta/home.test.ts`
Expected: all PASS, including the 23 cases that were already there.

- [ ] **Step 5: Check the titles by hand**

```bash
pnpm dev -p 3111
curl -s --noproxy '*' http://localhost:3111/sy-en | grep -o '<title>[^<]*</title>'
curl -s --noproxy '*' 'http://localhost:3111/sy-en/categories/shoes' | grep -o '<title>[^<]*</title>'
```

Expected: `TryDos - Premium Shopping Experience` for the homepage, and a title
naming the category for the category page.

- [ ] **Step 6: Commit**

```bash
git add serverRequests/meta/home.ts tests/serverRequests/meta/home.test.ts
git commit -m "feat(cache): cache the metadata reader so generateMetadata stops querying per request"
```

---

# Phase E — Verification

These four tasks are the ones the advisory panel said were designed badly the
first time. Read each finding before writing the test.

---

### Task 18: The two-cookie-jar check (finding 16)

The first draft of this check could not fail. It needs four things it did not
have: the signed-in request **first**, a positive control, the correct wire cookie
names, and an honest statement about what `pnpm start` cannot see.

**Files:**
- Create: `tests/cache/sharedEntryIsNotPersonal.test.ts`

**Interfaces:**
- Consumes: a running `pnpm build && pnpm start` on port 3111.
- Produces: a test that skips loudly when the server is not up, and fails
  otherwise.

- [ ] **Step 1: Write the test**

```ts
// tests/cache/sharedEntryIsNotPersonal.test.ts
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.CACHE_CHECK_BASE ?? "http://localhost:3111";
const PATH = "/sy-en";

// The wire names, not the constant names. USER_DATA is the key in
// utils/cookies/cookie-manager; `User-Data` is what actually travels. Getting
// this wrong is how the first draft of this check passed without testing
// anything (finding 16).
const SIGNED_IN_JAR = "MARKET-TOKEN=<a staging token>; User-Data=<a staging profile>";

let serverIsUp = false;

beforeAll(async () => {
  try {
    const response = await fetch(`${BASE}${PATH}`);
    serverIsUp = response.ok;
  } catch {
    serverIsUp = false;
  }
});

describe("a shared cache entry never carries one shopper's data", () => {
  it("has a server to talk to", () => {
    expect(
      serverIsUp,
      `no server answered at ${BASE}${PATH}. Run \`pnpm build && pnpm start -p 3111\` first — this check cannot run against \`next dev\`, which does not store pages the way production does`,
    ).toBe(true);
  });

  it("does not put a signed-in shopper's name into the guest document", async () => {
    // The signed-in request goes FIRST, on purpose. Warming the entry as a guest
    // and then asking as a signed-in shopper proves nothing: the guest entry was
    // already correct. The risk is the other way round.
    const signedIn = await fetch(`${BASE}${PATH}`, {
      headers: { cookie: SIGNED_IN_JAR },
    });
    const signedInHtml = await signedIn.text();

    const guest = await fetch(`${BASE}${PATH}`);
    const guestHtml = await guest.text();

    // The positive control. If the signed-in document does not itself contain
    // the marker, the comparison below is empty and would pass no matter what.
    expect(
      signedInHtml,
      "the signed-in request did not render any signed-in marker, so this check has nothing to look for and cannot fail — fix the fixture before trusting a pass",
    ).toContain("initialUserData");

    expect(
      guestHtml.includes("<a staging profile marker>"),
      "the guest document carries a signed-in shopper's profile, so a shared cache entry is serving one shopper's data to another",
    ).toBe(false);
  });

  it("marks the personal parts as private", async () => {
    const response = await fetch(`${BASE}${PATH}`, {
      headers: { cookie: SIGNED_IN_JAR },
    });
    const cacheControl = response.headers.get("cache-control") ?? "";

    expect(
      cacheControl,
      `the home document answered "${cacheControl}"; a document that streams a signed-in navigation must never be publicly cacheable`,
    ).not.toContain("public");
  });
});
```

- [ ] **Step 2: State what this check cannot see**

Add this comment at the top of the file. It is part of the deliverable, not
decoration — the first draft's real fault was claiming coverage it did not have.

```ts
// What this check does NOT cover.
//
// `pnpm start` has no CDN in front of it. Every header risk that only appears
// when a shared cache sits between the browser and the app — a proxy storing a
// document with no `Vary: Cookie`, an edge cache keyed on the URL alone — is out
// of this check's reach entirely. It sees what one server sends. It cannot see
// what a CDN does with it.
//
// That part is covered by tests/next-config.test.ts, which asserts on the
// headers the config sends, and by the platform firewall rules. Do not read a
// pass here as "the CDN is safe".
```

- [ ] **Step 3: Fill in the real fixtures**

Replace `<a staging token>`, `<a staging profile>` and
`<a staging profile marker>` with values from a staging test account. Read them
from environment variables, not literals — the repo's rules forbid a credential
in a test file or in any kept artifact:

```ts
const SIGNED_IN_JAR = `MARKET-TOKEN=${process.env.CACHE_CHECK_TOKEN}; User-Data=${process.env.CACHE_CHECK_PROFILE}`;
```

and skip with a clear message when they are absent — a missing setting is the one
allowed reason to skip.

- [ ] **Step 4: Watch it fail against a deliberately broken build**

Temporarily move `AuthNavContainer` back out of its `<Suspense>` boundary and
above `children` in the layout, so the personal read is inside the shared
document. Build, start, run the check.

Run: `pnpm build && pnpm start -p 3111 &` then
`pnpm test:run -- tests/cache/sharedEntryIsNotPersonal.test.ts`
Expected: the "guest document carries a signed-in shopper's profile" test FAILS.

This is the step that proves the check works at all. **Put the boundary back**
and re-run: expected PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/cache/sharedEntryIsNotPersonal.test.ts
git commit -m "test(cache): add the two-cookie-jar check, with a positive control and a stated blind spot"
```

---

### Task 19: The import-graph assertion (finding 17)

Three requirements from the finding: state the mechanism, cover the cached
*component props* and not only the reader module, and prove it resolved a
known-bad module first.

That last one matters here specifically. This repo maps `"*": ["./*"]` in
`tsconfig.json`, so bare imports like `utils/...`, `store` and
`serverRequests/...` resolve. A walker that only understands relative paths and
`@/` skips all of them **silently** and reports a clean graph.

**Files:**
- Create: `tests/cache/noRuntimeReadsInCachedTree.test.ts`

**Interfaces:**
- Produces: a source-scan test over `serverRequests/cached/*.ts` and the component
  tree they render.

- [ ] **Step 1: Write the test**

```ts
// tests/cache/noRuntimeReadsInCachedTree.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

// MECHANISM: a source scan, not a runtime check.
//
// It reads the files, follows their import statements and looks for the three
// reads a `use cache` scope forbids. It does NOT execute anything, so it cannot
// see a read reached through a dynamic import or a runtime string. It is a
// tripwire for the ordinary case, not a proof.
//
// Resolution follows this repo's tsconfig, where "*": ["./*"] makes `utils/x`,
// `store` and `serverRequests/x` resolve from the repo root. A walker that only
// understands "./" and "@/" skips every one of those WITHOUT SAYING SO, and
// reports a clean graph for a tree full of cookie reads. The self-check below
// exists because of exactly that.

const ROOT = resolve(__dirname, "../..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const FORBIDDEN = [
  { pattern: /\bcookies\s*\(/, what: "cookies()" },
  { pattern: /\bheaders\s*\(/, what: "headers()" },
  { pattern: /getCookieServer\s*\(/, what: "getCookieServer()" },
  { pattern: /getRedeemedIds\s*\(/, what: "getRedeemedIds()" },
  { pattern: /new Date\s*\(\s*\)/, what: "new Date()" },
  { pattern: /Date\.now\s*\(/, what: "Date.now()" },
  { pattern: /Math\.random\s*\(/, what: "Math.random()" },
];

function resolveImport(specifier: string, fromFile: string): string | null {
  const bases = specifier.startsWith(".")
    ? [join(dirname(fromFile), specifier)]
    : [
        join(ROOT, specifier.replace(/^@\//, "")),
        join(ROOT, specifier), // the "*": ["./*"] mapping
      ];

  for (const base of bases) {
    for (const ext of ["", ...EXTENSIONS]) {
      const candidate = base + ext;
      if (existsSync(candidate) && !candidate.endsWith("/")) return candidate;
    }
    for (const ext of EXTENSIONS) {
      const candidate = join(base, "index" + ext);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function walk(entry: string) {
  const seen = new Set<string>();
  const unresolved: string[] = [];
  const found: string[] = [];
  const queue = [entry];

  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file) || file.includes("node_modules")) continue;
    seen.add(file);

    const source = readFileSync(file, "utf8");
    const relative = file.slice(ROOT.length + 1).replace(/\\/g, "/");

    // A "use client" module runs in the browser, where the clock and the
    // document cookie are the visitor's own. It is not part of the cached
    // server tree.
    if (/^\s*["']use client["']/m.test(source)) continue;

    for (const { pattern, what } of FORBIDDEN) {
      if (pattern.test(source)) found.push(`${relative} -> ${what}`);
    }

    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const specifier = match[1];
      if (specifier.startsWith("next/") || !specifier.match(/^[.@a-z]/i)) continue;
      const resolved = resolveImport(specifier, file);
      if (resolved) queue.push(resolved);
      else if (specifier.startsWith(".") || specifier.match(/^(utils|store|services|components|serverRequests|hooks|types)\b/))
        unresolved.push(`${relative} -> ${specifier}`);
    }
  }

  return { seen, found, unresolved };
}

describe("nothing in the cached tree reads a cookie, a header or the clock", () => {
  it("resolves a bare repo-root import, so the walk is not silently empty", () => {
    // The self-check finding 17 asks for. `utils/luck` is a bare specifier that
    // only resolves through tsconfig's "*": ["./*"] mapping. If this returns
    // null, every `utils/...`, `store` and `serverRequests/...` import in the
    // scan below is skipped and a clean result means nothing.
    const resolved = resolveImport(
      "utils/luck",
      join(ROOT, "serverRequests/cached/home.ts"),
    );
    expect(
      resolved,
      "the walker cannot resolve a bare repo-root import like `utils/luck`, so it skips most of this repo's imports and every result below is meaningless",
    ).not.toBeNull();
  });

  it("finds a forbidden read when one is really there", () => {
    // The second half of the self-check: prove the matcher fires. This file
    // genuinely reads cookies today, and always will.
    const { found } = walk(join(ROOT, "components/ServerWrapper/RecommendedWrapper.tsx"));
    expect(
      found.join(", "),
      "the scan reported no forbidden read in the recommendations component, which reads the User-Data cookie on purpose — so the matcher is broken and a clean report proves nothing",
    ).toContain("getCookieServer()");
  });

  it("resolves every import it meets in the cached readers", () => {
    const { unresolved } = walk(join(ROOT, "serverRequests/cached/home.ts"));
    expect(
      unresolved,
      "the walk could not resolve these imports, so whatever they contain was never checked",
    ).toEqual([]);
  });

  it("finds nothing forbidden in serverRequests/cached/home.ts", () => {
    const { found } = walk(join(ROOT, "serverRequests/cached/home.ts"));
    expect(
      found,
      "a module reachable from a cached reader reads a cookie, a header or the clock; inside a `use cache` scope that either throws at request time or freezes one request's value into every later response",
    ).toEqual([]);
  });

  it("finds nothing forbidden in serverRequests/cached/currency.ts", () => {
    const { found } = walk(join(ROOT, "serverRequests/cached/currency.ts"));
    expect(found, "a module reachable from the cached currency reader reads a cookie, a header or the clock").toEqual([]);
  });

  it("finds nothing forbidden in the cached component props", () => {
    // Finding 17's second requirement: the components rendered inside cached
    // scopes matter as much as the readers, because their props are what gets
    // stored.
    for (const component of [
      "components/ServerWrapper/FeaturedProduct.tsx",
      "components/ServerWrapper/FlashDealsProduct.tsx",
      "components/ServerWrapper/BoutiquesListWrapper.tsx",
      "components/Server/MainCategories/index.tsx",
    ]) {
      const { found } = walk(join(ROOT, component));
      expect(
        found,
        `${component} is rendered inside a cached scope and something it reaches reads a cookie, a header or the clock`,
      ).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run the test and read what it says**

Run: `pnpm test:run -- tests/cache/noRuntimeReadsInCachedTree.test.ts`

The two self-checks must pass first. If "the walker cannot resolve a bare
repo-root import" fails, fix `resolveImport` before believing anything else in
the file.

Expect the last three to fail on the first run — the scan will find real reads.
Each failure names a file and a read. Fix the tree, not the test: move the read
outside the cached scope, or pass its value in as an argument.

- [ ] **Step 3: Watch it fail on purpose**

Add `const now = new Date();` to `serverRequests/cached/home.ts` and re-run.
Expected: the fourth test FAILS naming that file and `new Date()`. Remove the
line and re-run: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/cache/noRuntimeReadsInCachedTree.test.ts
git commit -m "test(cache): assert nothing in the cached tree reads a cookie, a header or the clock"
```

---

### Task 20: Measure it, with a threshold that can block the merge (finding 18)

Finding 18: per-visit numbers on a warm cache are not a measurement. This needs
aggregate load, a cold request, an unlisted slug, and a written threshold.

**Files:**
- Modify: `docs/homepage-cache-phase-2-measurements.md`

**Interfaces:**
- Consumes: everything built so far.
- Produces: the numbers, and a stated pass or fail against the threshold.

- [ ] **Step 1: Write the threshold down BEFORE measuring**

Append this to `docs/homepage-cache-phase-2-measurements.md`. Writing it first is
the point — a threshold decided after seeing the numbers is not a threshold.

```markdown
## The merge threshold

This change merges only if all four hold. Any one failing blocks it.

| # | Criterion | Threshold |
|---|---|---|
| T-1 | Elasticsearch queries for 20 sequential home requests in one minute | at most **4** (one warm-up per reader). Today it is about 60. |
| T-2 | `/[lang]` in the build's route table | not `dynamic` |
| T-3 | Time to first byte, warm cache, home page | no worse than today's, measured on the same machine |
| T-4 | A guest document containing a signed-in shopper's profile | never (Task 18 green) |
```

- [ ] **Step 2: Count Elasticsearch queries per minute — before**

Do this on `develop`, before the change, so there is a baseline to compare against.

```bash
git stash && pnpm build && pnpm start -p 3111
```

Count the queries. The cleanest way is to wrap the client's `search` in a counter
behind an env var, in `services/elastic/elasticsearch.config.ts` — a temporary
probe, removed before committing:

```ts
if (process.env.ES_QUERY_COUNT === "1") {
  const inner = client.search.bind(client);
  let n = 0;
  (client as any).search = (...args: any[]) => {
    console.log(`[ES-COUNT] ${++n}`);
    return inner(...args);
  };
}
```

```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null --noproxy '*' http://localhost:3111/sy-en
done
```

Record the highest `[ES-COUNT]` number the server printed. Then `git stash pop`.

- [ ] **Step 3: Count them again, after**

Same 20 requests against the converted build. Record the number and the ratio.

- [ ] **Step 4: Measure a cold request and an unlisted slug**

Both are cases finding 18 says a warm-cache measurement hides.

```bash
# cold: a locale that is not in generateStaticParams, asked for the first time
curl -s -o /dev/null -w 'cold locale: %{time_total}s\n' --noproxy '*' \
  http://localhost:3111/lb-ar

# the same locale, second time
curl -s -o /dev/null -w 'warm locale: %{time_total}s\n' --noproxy '*' \
  http://localhost:3111/lb-ar

# a slug-shaped category the catalog does not know
curl -s -o /dev/null -w 'unlisted slug: %{time_total}s\n' --noproxy '*' \
  http://localhost:3111/sy-en/categories/not-a-real-category
```

The unlisted-slug number is the one to watch. Amendment 2 lets any slug-shaped
name through, so each distinct one is a cache entry and an Elasticsearch query. If
that number is close to a cold home request, an attacker can generate load one URL
at a time. Record it and say plainly whether it needs a rate limit at the platform
firewall.

- [ ] **Step 5: Measure the cache hit ratio and the revalidation rate**

```bash
for i in $(seq 1 30); do
  curl -s -D - -o /dev/null --noproxy '*' http://localhost:3111/sy-en \
    | grep -i "x-nextjs-cache"
done | sort | uniq -c
```

Record the `HIT` / `MISS` / `STALE` counts. With `revalidate: 60`, 30 requests
inside one minute should be one `MISS` and 29 `HIT`s. Anything close to 30 `MISS`
means entries are not being reused, and the answer is
`use cache: remote` — record that conclusion rather than shipping and hoping.

- [ ] **Step 6: Remove the probe and write the verdict**

```bash
git diff -- services/elastic/elasticsearch.config.ts
```

Expected: no output.

Fill in each row of the threshold table with the measured number and a **pass** or
**fail**. If any row fails, say so — "it should be better" is not a result.

- [ ] **Step 7: Commit**

```bash
git add docs/homepage-cache-phase-2-measurements.md
git commit -m "docs(cache): record the phase 2 performance measurement against the stated threshold"
```

---

### Task 21: Record what this change does not fix

Three things stay open on purpose. Recording them is the deliverable — an
unrecorded known problem is indistinguishable from an unknown one.

**Files:**
- Modify: `docs/homepage-cache-phase-2.md`

- [ ] **Step 1: Record the two amendments in the spec**

Add a section at the top of `docs/homepage-cache-phase-2.md` stating that D-3's
`expire` changed from 120 to 300 and why, and that finding 2 is settled as "shape
check only, never 404". Point at
`docs/homepage-cache-phase-2-measurements.md` for the evidence. The spec must not
still say something the code no longer does.

- [ ] **Step 2: Record finding 15 — the CSP nonce**

```markdown
### Finding 15 — still open, and this change made it harder

The document now carries two inline scripts: the image fallback (already there)
and the redeemed-luck script (added by this change). A Content-Security-Policy
`script-src` needs a nonce per response, and a nonce cannot be per-request inside
a document that is shared between shoppers — the nonce would be stored with the
page and reused, which is the same as having no nonce.

The CSP work item has to choose one of: a hash-based `script-src` for these two
scripts (they are fixed strings, so their hashes are stable), or moving both to
external files, or leaving `script-src` out of the policy. This change did not
make that choice.
```

- [ ] **Step 3: Record D-22 — state retention**

```markdown
### D-22 — state no longer resets on navigation

Cache Components enables React `<Activity>` route retention, so component state
survives a navigation away and back. This shipped with **phase 1**, not with this
change, and is recorded rather than fixed. It affects `SearchIcon` and the eleven
page-mounted modals.
```

- [ ] **Step 4: Record findings 5 and 10**

```markdown
### Finding 5 — `is_flash_deal_active` and the mobile app

The field is still returned by `app/api/related-products/[id]/route.ts`, and it
is still correct: the route handler computes it with a real clock. It was removed
from `formatProduct`, which is now reachable from a cached scope. **Confirm with
the mobile team** before anything removes it from the response entirely.

### Finding 10 — `app/api/products/recomended`

Not touched by this change and not fixed by it. Wildcard CORS, a browser-supplied
`user_id`, and a 500 body that echoes the error message — which names the search
engine to the browser — plus every filter. It has its own ticket.
```

- [ ] **Step 5: Commit**

```bash
git add docs/homepage-cache-phase-2.md
git commit -m "docs(cache): record the two amendments and what phase 2 leaves open"
```

---

## Final gate

Run all of these before opening the pull request. Every one must exit 0.

```bash
pnpm test:run
pnpm lint
pnpm lint:i18n-parity
npx next typegen && npx tsc --noEmit
pnpm build
```

Then, against `pnpm start -p 3111`, with `--noproxy '*'` on every curl and
`sy-en` in every URL:

| Check | Expected |
|---|---|
| `/sy-en` | 200, products render, `/[lang]` is not `dynamic` in the route table |
| `/sy-en/categories/<real slug>` | 200, that category's products |
| `/sy-en/categories/not-a-real-category` | 200, no products, **not** a 404 |
| `/sy-en/categories/..%2F..%2Fetc%2Fpasswd` | 404 |
| `/sy-en?mainCategory=shoes` | 200, the plain homepage (D-14) |
| `/syria-en` prefetch payload | about 230 KB — clearly smaller than `/sy-en`'s |
| Guest document | contains no signed-in profile (Task 18) |
| 20 sequential home requests | at most 4 Elasticsearch queries (T-1) |

The pull request opens against **`develop`**, never `main`.

---

## Self-review

Checked after writing, against `docs/homepage-cache-phase-2.md`.

**Spec coverage.** Every decision and finding is claimed by a task:

| Spec item | Task |
|---|---|
| D-3 (amended), D-4 | 5 |
| D-5, D-6, D-7 | 11 |
| D-8 | 9 |
| D-9 | 13 |
| D-11 | 7 |
| D-12 | every task — unit suite only |
| D-13, D-14 | 14 |
| D-22 | 21 |
| D-23 | 16 |
| M-3 | 1 |
| M-4 | 2, 8 |
| M-5 | 3 |
| M-6 | 4 |
| Finding 1 (global `Cache-Control`) | **already closed** by PR #114 — `next.config.ts` now carries an explicit "NO Cache-Control here" block. Verified on `develop`, no task needed. |
| Finding 2 | Amendment 2, Task 14 |
| Finding 3 | 17 |
| Finding 4 (`stories.ts` stays) | 11 step 1 |
| Finding 5 (`is_flash_deal_active`) | 8, 21 |
| Finding 6 (flash clock) | 8 |
| Finding 7 (`getCurrency` callers) | 7 step 5 |
| Finding 8 (`currency.ts` keeps `"use server"`) | 7 |
| Finding 9 (`ModalSlot` reads `usePathname`) | **not addressed — see the gap below** |
| Finding 10 (`recomended` route) | 21, recorded only |
| Finding 11 (sitemap N+1, `?page=`) | **already fixed** before this plan started |
| Finding 12 | 6 |
| Finding 13 (`[lang]` validation) | **already fixed** before this plan started; Task 16 guards it |
| Finding 14 (`is_luck` without the cookie) | 9 |
| Finding 15 (CSP nonce) | 21, recorded only |
| Finding 16 | 18 |
| Finding 17 | 19 |
| Finding 18 | 20 |

**One gap, stated rather than hidden.** Finding 9 — `components/ModalRoute/ModalSlot.tsx`
reads `usePathname()` during render, at lines 37, 44, 48 and 59, not inside an
effect. It is a client component in the layout, so it is not inside a cached
server scope and it does not block this plan. But it is the "hard case" the
finding names, and no task here touches it. If Task 16's build shows the layout
still refusing to prerender after `AuthNavContainer` is wrapped, `ModalSlot` is
the next place to look — and fixing it is a separate work item, because moving
that read changes how every intercepted modal route opens.

**Type consistency.** Checked across tasks:
- `getCachedCategories(country, language)` — Task 6 defines, Task 6 step 5 calls.
- `getCachedCurrency(country, language)` — Task 7 defines, Task 14 calls.
- `getCachedFeatured / getCachedFlashDeals / getCachedBoutiques(country, language, categorySlug)` — Task 10 defines, Task 10 step 5 calls.
- `computeFlashActive(product, now)` — Task 8 defines, Task 8 step 5 calls.
- `hideRedeemedLuck(document, cookieValue)` and `REDEEMED_LUCK_SCRIPT` — Task 9 defines, Task 9 step 5 uses.
- `normalizeListingProduct(product)` — one argument from Task 9 step 6 onward; Task 10 relies on that, and Task 9 step 6 updates every caller.
- `<CategoryHomeView slug={string | null} />` — Task 14 defines, Tasks 14 and 15 render.
- `<RecommendedWrapper lang currency />` — Task 12 defines, Task 14 renders.
- `<StoriesBarClient language country />` — Task 11 defines, Task 14 renders.
- `cacheLife("homepage")` — Task 5 defines the profile; Tasks 6, 7, 10 and 17 call it.

**Placeholder scan.** Two deliberate fill-ins remain, both with the command that
produces the value and an explicit instruction not to commit the placeholder:
Task 13 step 2's `<measured>` pixel sizes, and Task 18 step 3's staging fixtures,
which must come from environment variables rather than literals.

One task branches: Task 8 step 6 has two fully written implementations and Task 2
step 3 gives the exact command that chooses between them. That is a measured
decision, not an unfinished step.
