# Homepage cache — phase 2 measurements

Answers to the measurements `docs/homepage-cache-phase-2.md` left open.
Each row states what was run, what came back, and the date.

| # | Question | Answer | Evidence |
|---|---|---|---|
| M-3 | Does an `error.tsx` let a build prerender finish? | **No.** A throw inside a cached segment during prerender fails the whole build. | 2026-08-31 — see below |
| M-4 | Which clock reads does the prerender reject? | **None of them.** `new Date()` inside `use cache` is allowed, and the value is frozen into the output. | 2026-08-31 — see below |
| M-5 | Does a middleware `Set-Cookie` stop a stored page being reused? | **No.** The page was stored and reused across all three request shapes. | 2026-08-31 - see below |
| M-6 | Does a crawler still get a complete document? | **Yes.** Byte-identical to a browser's, same markers. | 2026-08-31 - see below |
| D-3 | Does `expire: 300` get prerendered where `expire: 120` does not? | **Yes. Amendment 1 is confirmed.** | 2026-08-31 - see below |

---

## M-3 — does an `error.tsx` let a build prerender finish?

**Answer: no.** An error boundary does not save the build. One throw inside one
cached segment ends the whole build.

### Why the probe had to move

The plan put the probe inside `components/ServerWrapper/FeaturedProduct.tsx` and
built. That would have measured nothing. Every route under
`app/(client)/[lang]/` is `ƒ` (dynamic) or `◐` (partial) today, and `/[lang]`
itself is `ƒ`, so the build never renders that wrapper and the throw never fires.

The cause is the layout: `app/(client)/[lang]/layout.tsx` renders
`<AuthNavContainer />` unwrapped at line 218, and that component makes four
`getCookieServer` calls. A cookie read outside `<Suspense>` makes the layout
request-bound, so nothing below it can be prerendered. Task 13 moves that read
behind a boundary; until then M-3 cannot be measured on the homepage at all.

So the probe moved to a route that the build really does prerender:
`app/(special)/m3probe/`, next to `/callInProg` (`○` static, no locale layout).

### What was run

A temporary page with two cached components, the second behind `<Suspense>`, and
its own `error.tsx` directly above it:

```tsx
async function Fine() { "use cache"; return <p>this segment rendered</p>; }
async function Boom() {
  "use cache";
  if (process.env.M3_FORCE_THROW === "1") throw new Error("M-3 probe: forced failure inside a cached segment");
  return <p>this segment rendered too</p>;
}
export default function M3Probe() {
  return (<><Fine /><Suspense fallback={<p>loading</p>}><Boom /></Suspense></>);
}
```

| Run | Command | Exit code | Route line |
|---|---|---|---|
| Boundary present, no throw | `pnpm build` | 0 | `○ /m3probe   15m   1y` |
| Boundary present, forced throw | `M3_FORCE_THROW=1 pnpm build` | **1** | route table never printed |

The failing build said:

```
⨯ Error: M-3 probe: forced failure inside a cached segment
Error occurred prerendering page "/m3probe".
Export encountered an error on /(special)/m3probe/page: /m3probe, exiting the build.
```

Three things to read out of that. The build **exited**, so it did not go on to
other routes. It never printed the route table. And the sibling `Fine` segment,
which had nothing wrong with it, was never written either — the unit that fails
is the page, not the segment.

### What this means for the rest of phase 2

`error.tsx` is a **runtime** boundary, not a build one. It stops one failing
segment from blanking a document a shopper is looking at. It does nothing for a
build.

So every route the build prerenders is a route whose deploy fails if
Elasticsearch is down at that moment. That is a direct argument for **D-23**:
prerender the minimum. With `generateStaticParams` returning one locale, the
build's exposure to Elasticsearch is one page, not the 1,860–7,420 that D-17
would have built. D-23 was chosen for build cost; this measurement says it is
also what keeps a deploy from depending on Elasticsearch being up.

Task 16 must not widen `generateStaticParams` without accepting that trade.

### The route table, for reference

Build on this branch, with the error boundary in place and no probe:

| Kind | Count |
|---|---|
| `○` static | 9 |
| `◐` partial prerender | 24 |
| `ƒ` dynamic | 91 |

Phase 1 recorded 8 / 24 / 92. One route moved from dynamic to static between the
two builds. The five fixes on this branch landed in between, so the move is not
attributed to the error boundary; it is one route and nothing in this plan
depends on it.


---

## M-4 — which of the four clock reads does the prerender reject?

**Answer: none.** The premise of the question was wrong. A prerender does not
reject a clock read. It runs it, bakes the result into static HTML, and says
nothing.

### What was run

A temporary page at `app/(special)/m4probe/` — again outside `[lang]`, for the
reason M-3 explains — with one cached component that calls the real function:

```tsx
async function ClockInCache() {
  "use cache";
  const q = buildBaseConditions({ flashdeal: true }, "sy");
  const flash = q.must.find(c => c?.bool?.must?.some?.(x => x?.range?.start_date));
  return (<><pre data-pw="m4-range">{JSON.stringify(flash.bool.must)}</pre>
           <pre data-pw="m4-now">{new Date().toISOString()}</pre></>);
}
```

`pnpm build` exited **0**. The route table listed `○ /m4probe`, so the page was
prerendered as static content. `.next/server/app/m4probe.html` contains:

```json
[{"term":{"flash_deal_status":1}},
 {"exists":{"field":"start_date"}},
 {"exists":{"field":"end_date"}},
 {"range":{"start_date":{"lte":"08/31/2026"}}},
 {"range":{"end_date":{"gte":"08/31/2026"}}}]
```

and `2026-08-31T17:22:15.904Z`. Both are the build machine's clock, written into
a file that will be served unchanged.

The build printed no warning about `Date`, no "dynamic API" message, nothing.

### What this changes

`docs/homepage-cache-phase-2.md` treats the clock reads as something the
prerender would refuse — a loud failure. They are the opposite: a silent one.

So **finding 6 is a correctness bug, not a build blocker**, and it is worse than
the spec assumed. Put `use cache` on the flash-deals reader as it stands and the
Elasticsearch range bound freezes at the moment the entry is filled. Every deal
that starts after that is invisible, and every deal that ends is still shown,
until the entry expires. Nothing reports it.

Task 8 still does exactly what the plan says. The reason changed, not the fix.

### Which of the four are reachable

| Where | What it reads | Reachable from the home tree? |
|---|---|---|
| `services/elastic/helpers.ts:1457` | `new Date().toLocaleDateString("en-US", …)` — the flash-deal range bound, inside `buildBaseConditions` | **Yes.** Called from `elasticSearch.ts:294, 298, 809, 1077`, `helpers.ts:2334`, `serverRequests/Search.tsx:55, 210, 214`, `elasticsearch-reader.service.ts:196, 1026`. The `filters.flashdeal === true` branch is the homepage flash-deals path. |
| `services/elastic/helpers.ts:429` | `new Date()` — sets `is_flash_deal_active`, inside `processCustomProduct` | **Yes**, on the same path. |
| `services/elastic/helpers.ts:2915` | `new Date().toISOString()` — writes a search-log document | **No.** Search logging only. |
| `utils/server/index.tsx:55` | `new Date()` — "Today" / "Yesterday" | **No** once Task 11 moves the stories bar to the browser. |

`is_flash_deal_active` has **no reader anywhere in this repository** — the only
matches are the three assignments in `helpers.ts` itself. It leaves the app only
by being spread into an API response. That is finding 5, and it is why the field
cannot simply be deleted.

### The `start_date` mapping — Task 8 takes the date-math branch

Read from `products_catalog_develop` on the staging cluster:

```json
start_date: {"type":"date","format":"yyyy-MM-dd HH:mm:ss||yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'||yyyy-MM-dd'T'HH:mm:ss || MM/dd/yyyy"}
end_date:   {"type":"date","format":"...same..."}
flash_deal_status: {"type":"long"}
```

**`"type": "date"`, and `MM/dd/yyyy` is one of the accepted formats.** So:

- Task 8 uses Elasticsearch date math, `{ range: { start_date: { lte: "now/d" } } }`.
  That is the preferred branch, and it removes the clock from the query entirely.
- **`BUG-P2-1` does not exist.** The plan reserved it for the case where the field
  was `keyword` or `text`, which would make `MM/DD/YYYY` compare
  lexicographically and order `01/01/2027` before `12/31/2026`. The field is a
  date type, so Elasticsearch parses the bound. No ticket to open.

### One thing this could not prove, stated plainly

A run against the live index could not confirm that Elasticsearch really parses
`08/31/2026` on this index, because **no document in `products_catalog_develop`
has a `start_date` at all**, and none has `flash_deal_status: 1`:

| Query | Result |
|---|---|
| `exists: start_date` | 0 docs |
| `term: flash_deal_status = 1` | 0 docs |

The control proves the check was blind, and is recorded so nobody repeats it:

| Bound sent | Outcome |
|---|---|
| `08/31/2026` | accepted, 0 docs |
| `now/d` | accepted, 0 docs |
| `31-08-2026` | accepted, 0 docs |
| `not-a-date` | **accepted, 0 docs** |

`not-a-date` should have been refused. It was not, because with no document
carrying the field there is nothing for the bound to be compared against. So the
probe cannot tell a good bound from a bad one here, and the mapping — not the
probe — is the evidence for the date-math branch.

Two consequences for later tasks. The homepage flash-deals section is **empty on
staging**, so Task 8 cannot be checked against real data there; its proof has to
be a unit test on the query the builder returns, which is what the plan already
asks for. And any browser check of that section on staging will show an empty
state, which is correct, not a fault.

---

## The blocker Phase A found that the plan did not know about

Before any of M-5 could be measured, one thing had to be explained: **a probe
page under `app/(client)/[lang]/` with zero imports and no data was still `ƒ`.**

*(Corrected in Task 13.* The first version of this line said "no route under
`app/(client)/[lang]/` was prerendered at all. Not one." That was too strong —
the baseline route table already had 24 `◐` routes, several of them under
`[lang]`. What the probe showed is narrower and still the point: a page that
reads nothing at all could not be prerendered, so something in the layout was
opting the route out.*)

It is not the root parameter, and it is not `export const instant = false`. Both
were ruled out by building with them changed. Replacing the layout with a
minimal one turned the same probe page into `○` static, which proved the cause
is **inside the layout**.

Bisecting the layout found it. **Four client components in
`app/(client)/[lang]/layout.tsx` call `useSearchParams()` and none of them sits
inside a `<Suspense>` boundary:**

| Component | `useSearchParams()` calls |
|---|---|
| `components/Home/Init.tsx` | 2 |
| `components/Cart/CartProvider.tsx` | 3 |
| `components/PathTracker.tsx` | 2 |
| `components/global/NavigationLoaderSafetyNet.tsx` | 3 |

An unwrapped `useSearchParams()` opts the whole route out of prerendering. Since
these four are in the layout, they opted out **every page under `[lang]`** —
which is the entire storefront.

The fix is four `<Suspense fallback={null}>` wrappers, and it was measured:

| Layout | Probe page result |
|---|---|
| As committed | `ƒ` |
| The four wrapped in `<Suspense>` | `◐` |
| Minimal layout (control) | `○` |

All four render nothing visible — they are effect-only or provider components —
so `fallback={null}` costs no layout shift.

Two things were ruled out along the way and should not be re-checked:
`components/ModalRoute/ModalSlot.tsx` (finding 9) does **not** block
prerendering — adding it back kept the probe at `◐`. Neither does the
`isSupportedLocaleSegment` / `notFound()` guard added in the A5 fix.

**This belongs to Task 13**, next to the `AuthNavContainer` wrapper D-9 already
asks for. It is not optional and it is not cosmetic: without it, Tasks 15 and 16
cannot produce a prerendered page no matter what they do to the readers, and the
plan's whole outcome statement fails. The bisect is recorded here so Task 13 can
apply the fix directly instead of re-deriving it.

The layout was returned to its committed state after the measurement. Nothing in
Phase A ships this change.

### What it did when Task 13 shipped it

The four boundaries went in together with the `AuthNavContainer` one (D-9). The
route table moved:

| | before | after |
|---|---|---|
| `○` static | 8 | 8 |
| `◐` partial prerender | 24 | **44** |
| `ƒ` dynamic | 90 | **70** |

Ten routes moved from `ƒ` to `◐` (each appears twice in the table, once as
`/[lang]/…` and once as `/sy-en/…`): `about`, `compare`, `contact`, `loginDemo`,
`privacy-policy`, `settings/checklist`, `settings/countries`,
`settings/prefferences`, `settings/wallet`, `terms-of-service`.

`/[lang]` itself is still `ƒ`. It keeps `export const instant = false` until
Task 15, so this is expected, not a failure.

The `AuthNavSkeleton` shape was measured, not guessed, and the swap was checked
in a browser: the real navigation lands at exactly the 1189 x 50 the skeleton
reserved, and total layout shift over the whole page load is 0.031 — the 0.030
of it comes from the page body arriving in dev mode, not from the navigation.

---

## M-5 — does a middleware `Set-Cookie` stop a stored page being reused?

**Answer: no.** The page was stored and reused, and the proxy's `Set-Cookie`
headers changed nothing.

### What was run

Against `pnpm start -p 3111` on a real build, with the four `<Suspense>`
wrappers above applied so that routes under `[lang]` were prerenderable, and a
temporary probe at `/[lang]/m5d/[slug]` whose cached component stamps the time
it was filled.

`lb-ar` is deliberately **not** in `generateStaticParams`, so this is the D-23
on-demand path.

| # | Request | Proxy `Set-Cookie`? | Timestamp served |
|---|---|---|---|
| 1 | `/lb-ar/m5d/probe-one`, no cookies | yes — `userIP`, `country`, `lang`, `language` | `18:06:09.059Z` |
| 2 | same URL, no cookies | yes, again | `18:06:09.059Z` |
| 3 | same URL, cookies already set | none | `18:06:09.059Z` |

All three served the value filled on request 1. So the entry was stored on a
response that carried four `Set-Cookie` headers, and reused on later requests
whether or not the proxy wrote cookies again.

### The control, so an unchanging timestamp cannot pass by accident

| Request | Timestamp |
|---|---|
| `/lb-ar/m5d/probe-two` — different slug | `18:07:06.435Z` — **new** |

The check can fail. It did not.

### D-23 confirmed on disk

Files written after the build finished, for a locale the build never generated:

```
.next/server/app/lb-ar/m5d/probe-one.html
.next/server/app/lb-ar/m5d/probe-one.meta
.next/server/app/lb-ar/m5d/probe-one.segments/...
```

This is `dynamic-routes.md:157` — "pages rendered with runtime params are saved
to disk after a successful first request" — happening. D-23 works.

### The response headers, for finding 1

```
x-nextjs-postponed: 1
x-nextjs-stale-time: 180
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

The document is sent `private, no-store`. So a shared cache will not keep it,
and `x-nextjs-postponed: 1` shows the response is a prerendered shell with the
rest streamed. Note this was measured under `pnpm start`, which has no CDN in
front of it — the header risk that finding 1 describes is out of this
measurement's reach, and Task 18 says so too.

### A warning this measurement produced for Task 10

| Request | Timestamp |
|---|---|
| `/lb-ar/m5d/probe-one` | `18:06:09.059Z` |
| `/tr-tr/m5d/probe-one` — **different locale** | `18:06:09.059Z` — **the same entry** |

Two different locales were served one cached value. That is correct framework
behaviour, and it is the rule from `next-root-params.md`: only the root
parameters a cached function **actually reads** join its cache key. The probe's
cached function took `slug` and never called `lang()`, so locale was not part of
the key.

**Task 10 must not repeat this.** A cached reader that forgets to take `country`
and `language` — as an argument, or by calling the root param getter inside the
cached scope — will serve one country's prices and one language's text to every
other. Nothing warns you; the page renders fine and is simply wrong. Every
cached reader in Tasks 6, 7, 10 and 17 needs its key checked against this.

---

## M-6 — does a crawler still get a complete document?

**Answer: yes.**

```
curl -A 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' .../sy-en
curl -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'          .../sy-en
```

| | Googlebot | Browser |
|---|---|---|
| Document size | 481,796 bytes | 481,795 bytes |
| `data-pw="boutiques"` | 2 | 2 |
| `featured-products-container` | 3 | 3 |
| `stories-bar` | 2 | 2 |
| `data-pw="NavLogo"` | 1 | 1 |

One byte apart, and every marker matches. A crawler is not served a shell.

**This is a baseline, not a final answer.** It measures the homepage as it is
today — still `ƒ`, still rendering every reader per request. The move that could
break it is Task 11, which takes the stories bar out of the server render and
into the browser. **Task 20 must run this same comparison again** after Phase D
and put the two tables side by side. `NEXT_PUBLIC_ALLOW_INDEXING` is `false`
everywhere today, so a bad answer has no live effect yet, but it blocks launch.

---

## D-3 — does `expire: 300` get prerendered where `expire: 120` does not?

**Answer: yes. Amendment 1 is confirmed, and Task 5 writes `expire: 300`.**

The same probe page built twice, changing one number:

```tsx
async function ProbeBody() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: /* 120 or 300 */ });
  return <p data-pw="probe">expire-NNN-marker</p>;
}
```

| `expire` | Route table | Marker found in `.next/server/app/sy-en/cache-probe.html` |
|---|---|---|
| `120` | `ƒ` dynamic | **no** — 0 matches |
| `300` | `◐` partial prerender, shown as `1m  5m` | **yes** — 1 match |

Two independent signals agree. The route symbol changed, and the rendered text
either is or is not in the file the build wrote.

This is exactly what `cacheLife.md` → *Prerendering behavior* describes: an
`expire` under five minutes excludes the scope from prerenders and makes it a
dynamic hole resolved at request time. D-3 as originally written would have
produced a page that prerendered nothing, and on serverless — where
`use-cache.md` says entries typically do not persist across requests — would
have run every reader on every request while also paying for the extra
streaming.

Freshness does not change. `revalidate: 60` still governs how often content
refreshes.
