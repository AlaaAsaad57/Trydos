# Homepage cache — phase 2 measurements

Answers to the measurements `docs/homepage-cache-phase-2.md` left open.
Each row states what was run, what came back, and the date.

| # | Question | Answer | Evidence |
|---|---|---|---|
| M-3 | Does an `error.tsx` let a build prerender finish? | **No.** A throw inside a cached segment during prerender fails the whole build. | 2026-08-31 — see below |
| M-4 | Which clock reads does the prerender reject? | | |
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
