---
ticket: "cloudflare-edge-in-front-of-vercel"
workflow: research
version: 2
stage: frame
status: frozen
decision_question: "Should we put Cloudflare (CDN, WAF, Workers) in front of Vercel to cut the Vercel bill, and how far should Cloudflare go?"
decision_owner: "developer"
researched_at: "2026-08-24"
---

# Decision Framing & Criteria

## 1. Decision Question

> **Re-framed 2026-08-24 at the owner's direction** (see §7, amendment
> `AM-08`). The original question asked whether Cloudflare cuts **this
> invoice**. The owner rejected that scope at the comprehension gate: the
> invoice covers roughly **20 customers**, so it describes a starting point, not
> the app. The question below replaces it. The original wording is preserved in
> the amendment log.

**When, if ever, should Cloudflare go in front of Vercel — and what should be
done now, at 20 customers, so that the answer is available when it is needed?**

Three sub-questions, in the order they matter:

1. At what traffic level does Cloudflare in front stop being worth $0 and start
   being worth real money?
2. What is our cost exposure during an attack — on Vercel as we are, and behind
   Cloudflare — and does that change the timing?
3. Given that a change is far cheaper and safer to make at 20 customers than at
   1 M, what is the right thing to do **now**, even if the saving is zero today?

The scale reference is this repository's own
`docs/vercel-vs-aws-hosting-analysis.md`, which models **~1 M / ~2.5 M / ~4 M
daily active users** as scenarios A / B / C. "1 M users" in the owner's
direction is read as **Scenario A**.

## 2. Context & Problem Statement

The April 2026 invoice (`vercel-invoice.txt`) is the trigger. The month cost
**$90.87**: **$50.00** of fixed subscriptions and **$60.86** of usage, billed at
**$40.87** after a $20 credit.

The shape of that usage decides the whole question:

| Group | Lines | Cost | Can a front-end CDN touch it? |
|---|---|---|---|
| Origin work | Fast Origin Transfer, Fluid Provisioned Memory, Fluid Active CPU, Function Invocations, Function Duration | **$59.38** | Only if the request never reaches Vercel |
| Delivery | Fast Data Transfer (840.89 GB), Edge Requests (4.15 M) | **$0.00** | Nothing to save — already free |
| Extras | Speed Insights, Build Minutes, Image Optimization (transforms + cache reads + cache writes), Edge CPU | **$1.48** | No |

The three groups sum to $60.86. ISR Reads billed $0.00 and sits in no group.

A CDN in front of an origin normally pays for itself by taking over the delivery
lines. On this invoice those lines are already zero, because the Pro plan's
included allowance covers them. So the only thing worth arguing about is whether
Cloudflare can stop requests reaching Vercel's *functions* — and that depends far
more on whether our responses are cacheable than on which CDN sits in front.

The app is, today, built to be uncacheable on purpose:

- 10 route files under `app/` declare `force-dynamic`; 7 declare a `revalidate`.
  The main shopping surfaces are in the dynamic group.
- Every browser and mobile call to the six backend services goes through one
  internal hop, `app/api/proxy/route.ts`, which reads the `MARKET-TOKEN` cookie
  and forwards it. That route answers `Cache-Control: no-store` on failure and is
  personal by design — it is per-user traffic and it can never be shared-cached.
- There are 39 route handlers under `app/api/`.

That is the real cost engine: 7.2 M invocations in a month against 4.15 M edge
requests means most billed work is function work, and a large share of it is the
proxy hop, which no CDN may cache.

One more piece of context, so this work item is not read in isolation:
`docs/vercel-vs-aws-hosting-analysis.md` already projects hosting cost at 1 M–4 M
daily users and recommends staying on Vercel until roughly 2–2.5 M, then moving
to always-on servers behind Cloudflare. This work item is about the bill we are
actually paying **now**, which is roughly three orders of magnitude smaller than
those projections. Both can be true; they are answering different questions.

## 3. Existing System Constraints & Assumptions

**Constraints taken from the repository, not assumed:**

- `proxy.ts` (the Next.js 16 middleware) does locale routing for `en/ar/tr/ku`,
  country detection, bot detection, and the staging gate on `main`. It is a
  protected runtime path in `CLAUDE.md`.
  **Correction, made at `recommend` after advisory review:** an earlier draft of
  this document said it "runs on every request", repeating the wording in
  `CLAUDE.md`. That is not what the code does. The matcher at
  `proxy.ts:674-694` excludes `api`, `_next`, `static`, sitemaps, `robots`, the
  asset folders and anything with a file extension, and its `missing:` clause
  additionally skips prefetches (`purpose: prefetch`, `next-router-prefetch`),
  Server Actions (`next-action`) and RSC navigations (`next-router-state-tree`).
  **`proxy.ts` runs on full document navigations only, and never on the
  `/api/proxy` hop.** `CLAUDE.md` is loose here and should be corrected
  separately; this work item does not change protected runtime paths.
- `proxy.ts` runs on the Node runtime. Prior work on the branch
  `ticket/vercel-cloudflare-runtime-compat` recorded that this is the blocking
  issue for running the app on Cloudflare Workers at all.
- Auth is HttpOnly cookies only: `MARKET-TOKEN` (guest or signed-in) and
  `User-Data`. `serverRequests/HandleAuthedFetch.ts` auto-registers a guest token
  on a 401 and retries, which means a cold visitor causes a token-writing round
  trip — a response that must never be shared between visitors.
- Abuse protection is **Vercel Firewall**, configured in the Vercel dashboard,
  plus an application-level OTP rate limiter backed by Redis. There is no
  in-code, portable WAF to carry across.
- `vercel.json` sets `git.deploymentEnabled: false`; deploys are driven from CI.
- Images are served through `next/image` with an allowlist of hosts in
  `next.config.ts`; product media already comes from a separate media server.

**Assumptions, to be tested at `evidence`:**

- The $20 credit is not guaranteed to recur. The safe planning figure is the
  full **$60.86** usage, not $40.87.
- Traffic is roughly steady month to month; April 2026 is representative.
- The extra team seat ($20) and Speed Insights ($10) are wanted by the team, so
  they are treated as fixed, not as savings waiting to be taken.

## 4. Non-Goals & Scope Boundaries

- **Not** a decision to leave Vercel. `CAN-6` exists only so the option is priced
  honestly, not because migrating is on the table in this work item.
- **Not** a rewrite of the caching strategy. `CAN-2` names caching as an option
  and estimates it; designing it is a separate `development` work item.
- **Not** about the six backend services or their infrastructure. Their cost is
  out of scope, as it is in `docs/vercel-vs-aws-hosting-analysis.md`.
- **Not** about cutting the $50 fixed subscriptions. Dropping the extra seat or
  Speed Insights is a real saving and larger than most candidates here, but it is
  a team decision with no technical content, and no CDN affects it. It is
  recorded under Excluded Candidates so the owner sees it, and stops there.
- **Not** a performance project. If a candidate happens to make the site faster,
  that is a bonus, not a criterion this decision is judged on.

## 5. Evaluation Criteria

### Hard Constraints (Must-Have Eligibility Requirements)

- **`CR-1`**: **Shopper-visible behaviour is unchanged** — Pass/fail. The site
  must behave exactly as it does now in all four languages, including locale
  redirects, country detection, and the intercepted modal routes. A candidate
  that changes what a user sees fails, however cheap it is.
- **`CR-2`**: **Auth and personal data are never shared** — Pass/fail. Every
  candidate must pass `MARKET-TOKEN` and `User-Data` through untouched, must
  never store a response carrying them in a shared cache, and must never let one
  visitor receive another visitor's page. This is the one failure mode that
  cannot be undone by a rollback, because the damage happens before anyone
  notices.
- **`CR-3`**: **The total monthly bill goes down, net** — Pass/fail. Cloudflare's
  own charges count against the saving. Moving cost from one vendor to the other
  is a fail, not a draw.
- **`CR-4`**: **Abuse protection does not regress** — Pass/fail. Whatever is in
  front must still stop the traffic Vercel Firewall stops today, and the real
  client IP must still reach the application, Sentry, and the OTP rate limiter.
  A candidate that makes every request appear to come from the proxy fails.
- **`CR-5`**: **The delivery path keeps working** — Pass/fail. Streaming server
  rendering, HttpOnly cookie writes from Server Actions and route handlers,
  `next/image` optimisation, preview deployments, and the `main` staging gate
  must all survive. A candidate that quietly breaks one of these fails even if
  the site still loads.

### Trade-Off Criteria (Comparative Dimensions)

- **`CR-6`**: **Size of the saving** — `HIGH_PRIORITY` — how many dollars a month
  it actually removes, measured against the $60.86 addressable usage, not against
  the $90.87 total. Judged qualitatively as none / small / meaningful, with the
  reasoning shown.
- **`CR-7`**: **Effort to build and to keep running** — `HIGH_PRIORITY` — setup
  work plus the permanent cost of one more thing to understand when something
  breaks. With so little money at stake, effort is the criterion most likely to
  decide this, and a candidate needing days of work is disqualified by
  arithmetic long before it is judged on merit.
- **`CR-8`**: **Blast radius and reversibility** — `HIGH_PRIORITY` — if it goes
  wrong, how much of the site is down, and how fast can it be undone. A DNS
  change is minutes; a split request path is not.
- **`CR-9`**: **Headroom** — `MEDIUM_PRIORITY` — does the candidate still help
  when traffic grows 10× or 100×, or does it stop mattering. A candidate worth
  little today but decisive at scale is worth more than its current dollar value.
- **`CR-10`**: **Clarity when something breaks** — `MEDIUM_PRIORITY` — how hard
  it becomes to answer "which layer did this?" once a second vendor is in the
  request path, and whether Sentry and the logs still name the right one.
- **`CR-11`**: **Latency for shoppers** — `MEDIUM_PRIORITY` — an extra proxy hop
  adds time to every uncached request. Cached hits get faster, uncached ones get
  slower, and today almost everything is uncached.
- **`CR-12`**: **Cost exposure during an attack** — `HIGH_PRIORITY` — **added
  2026-08-24** (`AM-11`). If someone points traffic at us, how much can they
  make the bill move before anyone reacts? This is a distinct failure mode from
  availability: the site can stay up while the invoice is driven to a number
  nobody approved. It is judged on how much attack traffic is billable, how fast
  mitigation engages, and whether an unrecognised abuser — a scraper, a
  low-and-slow bot — is billed at all.

> **Priority change, 2026-08-24 (`AM-10`).** `CR-9` (headroom) is promoted from
> `MEDIUM_PRIORITY` to **`HIGH_PRIORITY`**, and is now the criterion the decision
> most turns on. Under the original framing it was a tiebreaker for a decision
> about this month's invoice. Under the re-framed question it is the whole point:
> the invoice is 20 customers, so what a candidate is worth *at scale* matters
> more than what it is worth today.

Criteria are **frozen** on exit from this stage. Any later change needs a
`CRITERIA_AMENDMENT` block in section 7.

## 6. Candidates Under Consideration

### Shortlisted Candidates

- **`CAN-1`**: **Status quo — Vercel alone, unchanged.** Keep paying ~$41–61 of
  usage a month. The baseline every other candidate must beat.
- **`CAN-2`**: **Cut the bill on Vercel itself — no Cloudflare.** Make the pages
  that can be shared cacheable (drop `force-dynamic` where the response is not
  personal, set real cache headers, use ISR), and trim per-request function work.
  This attacks the $59.38 of origin work directly, at its source, with no second
  vendor. Included because without it the comparison would only offer Cloudflare
  flavours and would be rigged.
- **`CAN-3`**: **Cloudflare CDN in front, proxied DNS, caching only.** Point the
  domain at Cloudflare, let it cache what it is willing to cache by default
  (static assets, `_next/static`), leave Vercel untouched behind it. The
  cheapest, most reversible form of the thing the question asks about.
- **`CAN-4`**: **Cloudflare CDN + WAF.** As `CAN-3`, plus abuse protection and
  rate limiting move from Vercel Firewall to Cloudflare rules.
- **`CAN-5`**: **Cloudflare Workers doing real work in front.** A Worker that
  serves cached HTML or API responses, and/or takes over one hot path — the
  strongest candidates being the `app/api/proxy` hop (which is pure forwarding
  and is most of the 7.2 M invocations) and image resizing. The only Cloudflare
  candidate that can reach the origin-work lines.
- **`CAN-6`**: **Leave Vercel for Cloudflare Workers entirely.** Priced here only
  to close it out. Prior work on `ticket/vercel-cloudflare-runtime-compat`
  already did the compatibility work and measured the bundle, so ruling it in or
  out costs almost nothing.

### Considered Baseline Candidates

- **Status Quo / Do Nothing**: **INCLUDED** — as `CAN-1`. With an addressable
  bill of about $60 a month, doing nothing is a serious answer and may well win.
- **Build In-House**: **NOT_APPLICABLE** — running our own edge, CDN, or servers
  (the AWS containers direction in `docs/vercel-vs-aws-hosting-analysis.md`)
  costs more in operator time in a single week than this invoice costs in a year.
  That document already recommends it only from ~2–2.5 M daily users. It is the
  right answer to a different question and is not evaluated here.

### Excluded Candidates

- **Cut the fixed $50 subscriptions** (drop the extra team seat, drop Speed
  Insights): excluded because it is a team and product decision with no technical
  content and nothing to do with Cloudflare — but the owner should know it is the
  single largest lever on this invoice, worth up to $30/month against the $59 of
  usage every candidate here is fighting over.
- **Negotiate with Vercel / change plan tier**: excluded — at $90 a month there is
  nothing to negotiate, and the lower tier does not fit a team.
- **A different CDN (Fastly, Bunny, CloudFront)**: excluded — the question names
  Cloudflare, and on an invoice where the delivery lines are already $0.00 no CDN
  choice can beat any other. Reopening this would only be worth it if the
  delivery lines start costing money.
- **Cloudflare Pages / full static export**: excluded — the app is a logged-in,
  personalised, four-language storefront with 39 API route handlers. A static
  export is not a possible shape for it.

## 7. Change Control & Amendments

Criteria `CR-1`..`CR-11` and candidates `CAN-1`..`CAN-6` were frozen on
2026-08-24. The advisory `evidence-reviewer` panel, run at the `recommend` stage
the same day, found that the frozen set was **not fair between candidates** and
that the leading candidate's main strength sat outside its own definition. The
amendments below fix that. All were made before `recommendation.md` was written,
and `comparison.md` was re-run against them.

### Second round — the owner re-framed the question (2026-08-24)

At the `assess` comprehension gate the owner did not answer the questions. They
rejected the premise instead: *"this invoice is for only 20 customers so it will
be bigger later; and if we have a DDoS attack the cost will be doubled multiple
times; now it's free but what about later when we have 1 M users?"*

That is a correct criticism and it invalidates the first round's conclusion. The
first round proved that Cloudflare saves **$0.00 today** and recommended the
status quo on that basis. Both halves are still true and the second is now
irrelevant, because "today" was never the horizon that mattered. Worse, this
repository already contained the counter-argument:
`docs/vercel-vs-aws-hosting-analysis.md` projects hosting at ~1 M DAU and
concludes that "once compute is cached away, you're mostly paying for bandwidth,
**where Cloudflare wins**" — and no stage of this research read that section
against its own candidates.

The work item was returned from `assess` to `frame`. Amendments `AM-08`..`AM-12`
follow; `AM-01`..`AM-07` from the first round stand unchanged below.

```yaml
- id: AM-08
  type: SCOPE_AMENDMENT
  target: decision_question
  original: "Should we put Cloudflare in front of the Vercel deployment - CDN,
    WAF, and Workers - to cut the Vercel bill; and if yes, how far should
    Cloudflare go?"
  amended: "When, if ever, should Cloudflare go in front of Vercel - and what
    should be done now, at 20 customers, so that the answer is available when it
    is needed?"
  rationale: "The original question is answerable only against the current
    invoice, and the current invoice describes roughly 20 customers. A candidate
    that saves nothing at 20 customers and a great deal at 1 M is not a bad
    candidate; it is a candidate with a start date. The original question had no
    way to express that, so it returned the wrong answer confidently."
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-1", "CAN-2", "CAN-3", "CAN-4", "CAN-5", "CAN-6", "CAN-7", "CAN-8"]

- id: AM-09
  type: CRITERIA_AMENDMENT
  criterion_id: CR-3
  original: "Over a 12-month horizon at current and reasonably projected traffic,
    the candidate must not increase total monthly spend."
  amended: "Across the growth path from today to Scenario A (~1 M DAU), the
    candidate must not increase total monthly spend at any point on that path,
    counting Cloudflare's own charges. Spend that is unchanged today but lower at
    scale PASSES."
  rationale: "The 12-month-at-current-traffic reading measures every candidate at
    the one traffic level where the answer is least interesting. The constraint
    should test the growth path, because that is what the app is on."
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-1", "CAN-3", "CAN-4", "CAN-5", "CAN-7"]

- id: AM-10
  type: CRITERIA_AMENDMENT
  criterion_id: CR-9
  original: "Headroom - MEDIUM_PRIORITY."
  amended: "Headroom - HIGH_PRIORITY, and the criterion the decision most turns
    on."
  rationale: "Under the re-framed question, what a candidate is worth at scale
    matters more than what it is worth this month. CR-9 was already carrying the
    strongest evidence for the Cloudflare candidates (EV-3: 84% of the 1 TB
    allowance already used) and was being outvoted by a HIGH-priority criterion
    measuring a single month."
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-1", "CAN-3", "CAN-4", "CAN-5"]

- id: AM-11
  type: CRITERIA_AMENDMENT
  criterion_id: CR-12
  original: "(not present)"
  amended: "NEW - CR-12: Cost exposure during an attack. HIGH_PRIORITY
    trade-off criterion."
  rationale: "The owner raised attack cost and no criterion covered it. The first
    round treated abuse only as an availability and rule-expressiveness question
    (CR-4) and never as a spending question. On a usage-billed platform an
    attacker can move the invoice without taking the site down, and that is a
    different risk needing its own criterion."
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-1", "CAN-3", "CAN-4", "CAN-5"]

- id: AM-12
  type: CANDIDATE_AMENDMENT
  candidate_id: CAN-3
  original: "Cloudflare in front, caching, adopted or not adopted."
  amended: "Split by timing. CAN-3 now means adopt Cloudflare in front NOW, at 20
    customers, while it is cheap to get wrong - accepting a $0 saving today in
    exchange for having it in place, understood and tuned before it is needed.
    CAN-3-LATER means adopt it when a trigger fires (1 TB crossed, or an attack)."
  rationale: "The first round could only ask 'does it pay now'. The real choice
    is when to adopt, and the two options have very different risk profiles:
    changing authoritative DNS for the whole domain (EV-26) at 20 customers is a
    minor event, and doing it during a traffic emergency at 1 M users is not."
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-3", "CAN-4"]
```

### Third round — the owner asked why Workers were not considered for the
### middleware and the relay (2026-08-24)

The owner's question at the second gate: *"what about the middleware and proxy
api? why did we not consider using workers for it?"*

They were considered, as `CAN-5`. The failure was not omission, it was
**weighting**: `CAN-5` was parked as `INELIGIBLE_PENDING_EVIDENCE` in revision 2
and then **never re-scored when the scale reframe promoted `CR-9` to
`HIGH_PRIORITY`**. `CAN-3` was re-scored for scale and reversed; `CAN-5` was left
at a rating derived from the superseded one-month question, although its case
strengthens with traffic in exactly the same way. Two decisive facts had also
never been collected — see `EV-34` and `EV-35`.

```yaml
- id: AM-13
  type: CANDIDATE_AMENDMENT
  candidate_id: CAN-5
  original: "CAN-5: Cloudflare Workers doing real work in front - a Worker that
    serves cached responses, and/or takes over one hot path."
  amended: >
    Split by target, because the two targets have completely different cost
    profiles, risk profiles and sizes.
    CAN-5a - move the middleware (proxy.ts: locale routing, country detection,
    bot detection, staging gate) to a Worker.
    CAN-5b - move the app/api/proxy relay to a Worker, so per-user backend calls
    never touch a Vercel function.
  rationale: >
    Scoring them as one candidate hid the finding. CAN-5a is small: EV-23
    establishes that middleware runs on full document navigations only, a
    minority of traffic. CAN-5b is potentially the largest single lever in this
    research: the relay is pure I/O forwarding, which is the workload Vercel's
    Fluid pricing charges most for (Provisioned Memory bills during backend
    wait, EV-5) and the workload Cloudflare charges least for (CPU time only,
    duration and subrequest wait not billed, EV-34). One candidate carrying both
    could only ever get one rating, and it got the small one's.
  authorized_by: developer
  discovered_at_stage: assess
  affected_candidates: ["CAN-5", "CAN-5a", "CAN-5b"]
```

### First round — the advisory panel (2026-08-24)

```yaml
- id: AM-01
  type: CRITERIA_AMENDMENT
  criterion_id: CR-3
  original: "The total monthly bill goes down, net. Pass/fail."
  amended: "Over a 12-month horizon at current and reasonably projected traffic,
    the candidate must not increase total monthly spend, counting Cloudflare's
    own charges. A candidate that leaves spend unchanged PASSES this constraint
    and scores WEAK on CR-6; only a candidate that raises net spend FAILS."
  rationale: "As frozen, CR-3 disqualified any candidate with a zero delta while
    the do-nothing baseline — which also has a zero delta — was exempted by
    definition. That is the same fact producing opposite verdicts. It also let a
    one-month cost test kill CAN-3 before CR-9 (headroom), the criterion written
    precisely for options that pay later, could be applied to it. The amendment
    makes zero-delta a PASS for everyone and moves the argument to CR-6, where
    the size of a saving belongs."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-1", "CAN-3", "CAN-4", "CAN-5"]

- type: CRITERIA_AMENDMENT
  criterion_id: CR-6
  original: "measured against the $60.86 addressable usage"
  amended: "measured against $40.87 — the usage actually paid after the Pro
    plan's $20 monthly credit."
  rationale: "Framing assumed the $20 credit might be one-off and set the safe
    planning figure at the full $60.86. EV-2 established that the credit is
    recurring and resets monthly. The baseline must move with the evidence, and
    every candidate is now scored against the smaller, correct number."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-1", "CAN-2", "CAN-3", "CAN-4", "CAN-5", "CAN-6"]

- type: CANDIDATE_AMENDMENT
  candidate_id: CAN-2
  original: "Cut the bill on Vercel itself: make responses cacheable and reduce
    the per-request work."
  amended: "Narrowed to caching only — make the responses that are provably
    shareable cacheable on Vercel's own CDN."
  rationale: "CAN-2 as frozen was a bundle. Two of the things inside it were
    doing the work: changing the deployment region, and reducing what the app
    relays. Neither is caching, and the region change is not 'per-request work'
    by any reading — yet it was earning CAN-2 its STRONG on the highest-priority
    criterion. A candidate cannot be recommended on the strength of something
    outside its own definition. The bundle is split into CAN-2, CAN-7 and CAN-8
    so each is judged on its own evidence, its own effort and its own risk."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-2"]

- type: CANDIDATE_AMENDMENT
  candidate_id: CAN-3
  original: "Cloudflare caches what it is willing to cache by default."
  amended: "Cloudflare in front, caching static assets by default PLUS Cache
    Rules over responses that are provably shareable — the same design work
    CAN-2 is credited with, done at Cloudflare instead of at Vercel."
  rationale: "As frozen, CAN-3 was defined at its weakest and then failed for
    being weak: EV-10 shows Cloudflare does not cache HTML by default, which the
    candidate's own wording forbade it from fixing. Meanwhile CAN-2 was defined
    expansively and credited with exactly that design work as a strength. The
    hard part — deciding what is shareable — is identical in both. Scoring it as
    an asset for one and a disqualifier for the other is not a fair test."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-3"]

- type: CANDIDATE_AMENDMENT
  candidate_id: CAN-4
  original: "abuse protection moves from Vercel Firewall to Cloudflare" (priced
    at Cloudflare Pro, $20/month)
  amended: "Priced at Cloudflare Free ($0). The Pro tier is recorded as a
    variant, not as the candidate."
  rationale: "CAN-4 named no plan tier, and was then priced at the most
    expensive one and failed on cost — while CAN-2 was priced at its cheapest
    possible form (a free project setting). Choosing the dearest instance of one
    candidate and the cheapest of another, then comparing them on cost, decides
    the answer in the setup. On Free it costs nothing, and the real argument
    against it — whether Cloudflare can express the rules we have — is CR-4,
    where it belongs."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-4"]

- type: CANDIDATE_AMENDMENT
  candidate_id: CAN-7
  original: "(not present)"
  amended: "NEW — CAN-7: Change the Vercel function region. Fast Origin Transfer
    is priced per region and the spread is 5x."
  rationale: "Split out of CAN-2, where it did not belong (see above). It is a
    project setting, not code, and it deserves to be judged on its own — its
    saving, its latency cost to Gulf shoppers, and its second-order effect on
    Provisioned Memory are all specific to it."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-2", "CAN-7"]

- type: CANDIDATE_AMENDMENT
  candidate_id: CAN-8
  original: "(not present)"
  amended: "NEW — CAN-8: Stop relaying what does not need relaying. Reduce or
    bypass the app/api/proxy hop for allow-listed public reads, and shrink what
    it forwards, so backend payloads stop crossing Vercel's origin boundary."
  rationale: "Fast Origin Transfer is the single largest line on the invoice
    ($25.43, 42% of usage) and no frozen candidate attacked it at source. Every
    browser and mobile call to the six backends is relayed through one Vercel
    route handler, so backend payloads are billed as origin transfer on the way
    in and again on the way out. A research item about cutting this bill that
    never names its biggest line has not finished. Added so it is at least
    visible to the owner, even though sizing it needs OQ-2."
  authorized_by: developer
  discovered_at_stage: recommend
  affected_candidates: ["CAN-8"]
```
