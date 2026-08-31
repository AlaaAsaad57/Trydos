# Homepage cache — phase 2 measurements

Answers to the measurements `docs/homepage-cache-phase-2.md` left open.
Each row states what was run, what came back, and the date.

| # | Question | Answer | Evidence |
|---|---|---|---|
| M-3 | Does an `error.tsx` let a build prerender finish? | **No.** A throw inside a cached segment during prerender fails the whole build. | 2026-08-31 — see below |
| M-4 | Which clock reads does the prerender reject? | **None of them.** `new Date()` inside `use cache` is allowed, and the value is frozen into the output. | 2026-08-31 — see below |
| M-5 | Does a middleware `Set-Cookie` stop a stored page being reused? | | |
| M-6 | Does a crawler still get a complete document? | | |
| D-3 | Does `expire: 300` get prerendered where `expire: 120` does not? | | |

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
