---
ticket: "cloudflare-edge-in-front-of-vercel"
workflow: research
version: 2
stage: evaluate
status: complete
researched_at: "2026-08-24"
revision: 2
---

# Comparative Evaluation & Hard Constraint Matrix

## 0. Revision 4 — `CAN-5` split and re-scored

The owner asked why the middleware and the `/api/proxy` relay were not
considered for Workers. They were, as `CAN-5` — and `CAN-5` was parked in
revision 2 and then **not re-scored when the scale reframe promoted `CR-9` to
`HIGH_PRIORITY`**. `CAN-3` was re-scored and reversed; `CAN-5` was left holding a
rating derived from the question that had just been discarded. Split per `AM-13`:

| Candidate | CR-1 | CR-2 | CR-3 | CR-4 | CR-5 | Eligibility |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CAN-5a`**: middleware → Worker | UNKNOWN (`OQ-7`) | PASS | PASS (`EV-35`) | UNKNOWN (`EV-23`) | UNKNOWN (`OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-5b`**: `/api/proxy` relay → Worker | UNKNOWN (`EV-37`) | UNKNOWN (`EV-37`) | PASS (`EV-36`) | **UNKNOWN — the crux** (`EV-37`) | PASS (`EV-38`) | **INELIGIBLE_PENDING_EVIDENCE** |

| Criterion | Priority | `CAN-5a` middleware | `CAN-5b` the relay |
| :--- | :---: | :--- | :--- |
| **`CR-6`** saving | HIGH | **WEAK–MODERATE** (`EV-23`, `EV-35`) — Vercel's own docs warn middleware "can accrue Fast Origin Transfer twice for a single Function request", and it is likely part of the unexplained 3 M invocations (`EV-24`). But the matcher already excludes `api`, `_next`, static, prefetches, Server Actions and RSC navigations, so this only touches full document navigations — the minority of traffic. Small prize. | **STRONG** (`EV-34`, `EV-36`) — **the largest single lever in this research.** $59 → $5 today, $594 → $26 at 10×, $5,938 → $246 at 100×. Roughly **24× at scale**. |
| **`CR-7`** effort | HIGH | **WEAK** — duplicates locale routing, country detection, bot detection and the staging gate at Cloudflare. `proxy.ts` is a protected runtime path, and the staging gate plus its matcher are deliberately one revertable unit; splitting them across platforms destroys that property. High effort for the small prize — **the worst effort-to-value ratio of any candidate.** | **MODERATE–WEAK** (`EV-37`) — 319 lines carrying an allowlist, per-server token resolution, secure logging, a deliberately uniform failure response, and a three-way `SEND_OTP` block. Substantial, but bounded and self-contained. |
| **`CR-9`** headroom | **HIGH** | MODERATE — scales with document navigations only. | **STRONG** — the gap *widens* with traffic (12× → 24×), because the structural mismatch it exploits grows. |
| **`CR-12`** attack cost | **HIGH** | MODERATE. | **STRONG** — relayed abuse stops consuming Vercel memory-during-wait and origin transfer entirely. |
| **`CR-2`/`CR-4`** | HARD | Middleware handles no tokens; low exposure. | **This is where it is won or lost** (`EV-37`) — `MARKET-TOKEN` would be read, and per-service tokens held, in a second vendor's runtime, and the `SEND_OTP` hard block would have to be reproduced exactly. Leave any of it behind and it is simply not enforced. |

### The finding revision 4 adds

**`CAN-5b` and `CAN-3` are complementary, and the combination is the real
answer.** `CAN-3` removes the bandwidth column — 71% of the projected bill at
100×. `CAN-5b` removes the origin column — the remaining 25%. Together they
address roughly **95%** of `EV-29`'s $23,442. And `CAN-3` is the **prerequisite
that makes `CAN-5b` cheap**: once traffic already flows through Cloudflare,
putting a Worker on two paths is an increment rather than a new architecture. No
earlier revision modelled them together, because each was scored as a rival to
the status quo rather than as part of a sequence.

**Why `CAN-5b` is still not recommended outright.** `EV-36`'s saving is an
**upper bound** — `OQ-2` means nobody knows what share of the origin bill is
actually the relay — and `EV-37` shows this is a security change that saves
money, not a saving that touches security. It needs its own research and its own
threat review. But it should be **sequenced**, not parked, and revisions 2 and 3
parked it.

**Why `CAN-5a` is not recommended.** It has the worst effort-to-value ratio here:
a minority-traffic prize bought by splitting `proxy.ts` — a protected runtime
path whose staging gate and matcher are deliberately one revertable unit — across
two platforms. `EV-35` gives a cheaper answer to the same problem: Vercel's own
advice is to "only run Middleware when necessary", i.e. tighten the matcher,
which is a one-file change with no second vendor.

---

## Revision 3 matrix — scored against the amended criteria

`CAN-3-NOW` is `CAN-3` adopted **today**, at 20 customers, in its safest form:
orange-cloud the domain, keep Cloudflare's **default** cache behaviour, add **no**
Cache Rules over HTML. It accepts a $0 saving now in exchange for having the
layer in place, understood and tuned before it is needed. `CAN-3-LATER` is the
same change deferred until a trigger fires.

| Candidate | CR-1 | CR-2 | CR-3 (growth path) | CR-4 | CR-5 | Eligibility |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CAN-1`**: Status quo | PASS | PASS | PASS † | PASS | PASS | **ELIGIBLE** |
| **`CAN-3-NOW`**: Cloudflare in front now, default caching | UNKNOWN (`OQ-7`) | PASS (`EV-11`) | PASS (`EV-29`) | PASS (`EV-14`, `EV-27`) | UNKNOWN (`OQ-7`, `EV-17`, `EV-26`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-3-LATER`**: same change, deferred | UNKNOWN (`OQ-7`) | PASS (`EV-11`) | PASS (`EV-29`) | PASS (`EV-14`, `EV-27`) | UNKNOWN (`OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-2`**: Cache on Vercel | UNKNOWN (`EV-33`, `OQ-6`) | UNKNOWN (`EV-11`) | PASS (`EV-6`) | PASS | PASS | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-4`**: + WAF on Cloudflare Free | UNKNOWN (`OQ-7`) | PASS (`EV-11`) | PASS (`EV-16`) | UNKNOWN (`EV-16`, `OQ-5`) | UNKNOWN (`OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-5`**: Workers in front | UNKNOWN | UNKNOWN | UNKNOWN (`OQ-2`) | UNKNOWN (`OQ-5`) | UNKNOWN (`OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-6`**: Leave Vercel for Workers | **FAIL** (`EV-22`) | PASS | UNKNOWN | UNKNOWN | **FAIL** (`EV-21`, `EV-28`) | **DISQUALIFIED** |
| **`CAN-7`**: Change function region | PASS | PASS | UNKNOWN (`OQ-1`) | PASS | PASS | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-8`**: Stop relaying what needn't be relayed | UNKNOWN (`EV-25`) | UNKNOWN | PASS (`EV-25`, `EV-33`) | UNKNOWN (`OQ-5`) | PASS | **INELIGIBLE_PENDING_EVIDENCE** |

† `CAN-1` passes `CR-3` because doing nothing adds no cost **of its own**. Growth
adds the cost, not the candidate. That keeps the constraint clean — and it is why
the case against `CAN-1` now lives entirely in `CR-9`, below, where it is
overwhelming.

**`CAN-3-NOW` gained two `PASS`es it did not have in revision 2**, and the reasons
are evidence, not sympathy:

- **`CR-2` PASS** (`EV-11`) — because the candidate is now scoped to *default*
  cache behaviour. Cloudflare refuses to cache any response carrying
  `Set-Cookie`, `private`, `no-store` or `no-cache`, which is all of our
  authenticated traffic. Revision 2 scored `CAN-3` **with** Cache Rules over
  HTML, which is what put `CR-2` at risk. Adopting the proxy and adding HTML
  caching are two decisions, and only the first is being weighed here.
- **`CR-4` PASS** (`EV-14`, `EV-27`) — Vercel Firewall stays in place and keeps
  receiving the real client IP, because Vercel auto-recognises Cloudflare as a
  Verified Proxy on all plans via `CF-Connecting-IP`. Nothing it stops today
  stops being stopped, and Cloudflare's unmetered L3/L4/L7 mitigation is added in
  front of it. Residual: Vercel's own threat-intelligence visibility is reduced
  (`EV-12`) — an interested party's claim, with no mechanism or measurement
  offered, and now weighed as such.

**`CR-5` is the one real blocker, and it is a test, not a decision.** Four of its
five clauses — Next 16 streaming RSC through Cloudflare's buffering, HttpOnly
cookie writes from Server Actions, `next/image`, and what an orange-clouded apex
does to `*.vercel.app` previews and the `main` staging gate — have no evidence
either way (`OQ-7`). None of that needs research. It needs a staging hostname put
behind Cloudflare for half a day.

### Trade-off ratings that changed under the amended criteria

| Criterion | Priority | `CAN-1` Status quo | `CAN-3-NOW` | `CAN-3-LATER` |
| :--- | :---: | :--- | :--- | :--- |
| **`CR-6`** saving | HIGH | **WEAK** — $0 saved, $40.87/month continues. | **WEAK today, STRONG at scale** (`EV-29`) — $0 now; at 10× it is addressing the $1,477 bandwidth line, at 100× the $16,613 one. | Identical at scale, **zero before the trigger**. |
| **`CR-9`** headroom | **HIGH** (was MEDIUM) | **VERY WEAK** (`EV-29`, `EV-33`) — the allowance is **1.22×** away. Beyond it, bandwidth becomes 53% of the bill at 2× and **71% at 100×**, and `CAN-1` has no answer to any of it. This is now the decisive criterion and `CAN-1` is worst on it. | **STRONG** — the only lever that touches the line that becomes the bill. | **STRONG in effect, WEAK in timing** — same benefit, arriving during the emergency that triggered it. |
| **`CR-12`** attack cost | **HIGH** (new) | **MODERATE** (`EV-30`, `EV-31`) — better than assumed: recognised DDoS is not billed, and mitigation is free on all plans. But unrecognised abuse — scrapers, crawlers, low-and-slow — is billed at full rate, and that is the common case. | **STRONG** (`EV-27`, `EV-31`) — unmetered mitigation, and unrecognised abuse costs **$0 of bandwidth** because Cloudflare does not meter CDN egress. | Same, from the trigger onward. |
| **`CR-8`** blast radius | HIGH | STRONG — nothing to undo. | **MODERATE, and this is the argument for acting now** (`EV-26`) — Free and Pro have no partial/CNAME setup, so this means moving authoritative DNS for the whole domain, MX included. At 20 customers a botched nameserver move is an inconvenience. At 1 M DAU it is an outage across the storefront **and** email. **The same change gets strictly more dangerous the longer it is deferred.** | **WEAK** — identical change, executed under pressure, with no prior operational experience of it. |
| **`CR-7`** effort | HIGH | STRONG — zero. | MODERATE — a nameserver migration plus the `OQ-7` test. Bounded, and done once. | WEAK — the same effort, spent during an incident. |

### The finding that decides revision 3

`CAN-3-NOW` and `CAN-3-LATER` are the **same technical change**. They differ only
in when it happens, and every difference favours doing it early: the blast radius
is smaller (`CR-8`), the effort is unhurried (`CR-7`), and the operational
familiarity is bought before it is needed. Deferring buys nothing — the saving
today is $0 either way — while making the eventual execution strictly worse.

Set against that, the case for `CAN-1` rests on `CR-7`, `CR-8` and `CR-10` — all
of which say "changing nothing is easy", and none of which survives contact with
`CR-9` once the allowance is 1.22× away.

---

## Revision 2 matrix (superseded — retained for the record)

> # Revision 3 — the question changed
>
> **2026-08-24.** Re-run after the owner rejected the framing at the
> comprehension gate: the invoice covers **~20 customers**, so a decision scoped
> to this month's bill answers the wrong question. `framing.md` §7 records
> amendments `AM-08`..`AM-12`: a new decision question with a growth horizon,
> `CR-3` measured across the path to ~1 M DAU, `CR-9` promoted to
> `HIGH_PRIORITY`, a new `CR-12` (cost exposure during an attack), and `CAN-3`
> split by **timing** rather than by whether to adopt.
>
> **The conclusion reverses.** Revision 2 found Cloudflare in front worth
> **$0.00** and recommended the status quo. That finding stands and stops being
> true at about **1.22× today's traffic** (`EV-29`) — the Fast Data Transfer
> allowance is 84% consumed. From 2× onward bandwidth is the **majority** of the
> bill; at 100× it is **71%**, and bandwidth is exactly what a CDN in front
> absorbs. The status quo is no longer the safe option; it is the option that
> defers a change until the month it is most expensive and most dangerous to
> make.
>
> **One part of the owner's premise is corrected, not confirmed.** A recognised
> DDoS does **not** multiply the Vercel bill: Vercel does not charge for traffic
> its firewall denies, challenges or mitigates, and DDoS mitigation, Attack Mode
> and IP blocking are free on all plans (`EV-30`). On volumetric attacks Vercel
> and Cloudflare are close to a draw. The real exposure is narrower and quieter —
> abuse that is never classified as an attack (scrapers, crawlers, low-and-slow
> floods) is billed at full rate on Vercel and costs $0 of bandwidth behind
> Cloudflare (`EV-31`).
>
> The revision-2 text is kept below so the reversal is legible.
>
> ---
>
> **Revision 2, 2026-08-24.** Re-run at the `recommend` stage after the advisory
> `evidence-reviewer` panel found revision 1 unfair between candidates. Its
> central charge was that the evaluation decided the answer before the trade-off
> matrix was reached: a one-month cost constraint applied asymmetrically, to
> candidates defined at unequal strength, sized by an average used as a marginal
> rate, on a lever that was not in the winning candidate and may not exist.
> That charge was checked and upheld. The criteria and candidate amendments are
> logged in `framing.md` §7; this file is scored against the amended set.
>
> **The outcome changed.** Revision 1 had two eligible candidates and a clear
> winner. Revision 2 has **one** eligible candidate — the status quo — and six
> pending evidence. That is a worse-looking result and a more honest one.

## 1. Hard Constraint Eligibility Filter

Hard constraints, from `framing.md` §5 as amended:

| Id | Constraint |
|---|---|
| `CR-1` | Shopper-visible behaviour is unchanged |
| `CR-2` | Auth and personal data are never shared |
| `CR-3` | Net spend does not rise over 12 months (unchanged spend **passes**) |
| `CR-4` | Abuse protection does not regress |
| `CR-5` | The delivery path keeps working |

| Candidate | CR-1 | CR-2 | CR-3 | CR-4 | CR-5 | Eligibility |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CAN-1`**: Status quo | PASS (`EV-1`) | PASS (`EV-1`) | PASS (`EV-2`) | PASS (`EV-15`) | PASS (`EV-1`) | **ELIGIBLE** |
| **`CAN-2`**: Cache on Vercel | UNKNOWN (`EV-9`, `OQ-6`) | UNKNOWN (`EV-9`, `EV-11`) | PASS (`EV-6`) | PASS (`EV-15`) | PASS (`EV-6`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-3`**: Cloudflare CDN + Cache Rules | UNKNOWN (`EV-11`, `OQ-7`) | UNKNOWN (`EV-11`) | PASS (`EV-13`, `EV-27`) | UNKNOWN (`EV-12`, `EV-14`, `EV-27`) | UNKNOWN (`EV-17`, `EV-26`, `OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-4`**: Cloudflare CDN + WAF (Free) | UNKNOWN (`EV-11`, `OQ-7`) | UNKNOWN (`EV-11`) | PASS (`EV-16`, `EV-27`) | UNKNOWN (`EV-16`, `EV-27`, `OQ-5`) | UNKNOWN (`EV-17`, `EV-26`, `OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-5`**: Cloudflare Workers in front | UNKNOWN (`EV-20`, `EV-23`) | UNKNOWN (`EV-20`) | UNKNOWN (`OQ-2`, `OQ-6`) | UNKNOWN (`OQ-5`) | UNKNOWN (`OQ-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-6`**: Leave Vercel for Workers | **FAIL** (`EV-22`) | PASS | UNKNOWN | UNKNOWN | **FAIL** (`EV-21`, `EV-28`) | **DISQUALIFIED** |
| **`CAN-7`**: Change the function region | PASS (`EV-7`) | PASS (`EV-7`) | UNKNOWN (`OQ-1`, `OQ-8`) | PASS (`EV-7`) | PASS (`EV-7`) | **INELIGIBLE_PENDING_EVIDENCE** |
| **`CAN-8`**: Stop relaying what needn't be relayed | UNKNOWN (`EV-25`) | UNKNOWN (`EV-25`) | PASS (`EV-25`) | UNKNOWN (`EV-25`, `OQ-5`) | PASS (`EV-25`) | **INELIGIBLE_PENDING_EVIDENCE** |

*Absence of evidence is `UNKNOWN`, not `FAIL`. A candidate with `UNKNOWN` on a
hard constraint is `INELIGIBLE_PENDING_EVIDENCE` and cannot be recommended while
unverified. Revision 1 stated this rule and then broke it for the candidate it
preferred; revision 2 applies it to all eight.*

### What changed from revision 1, and why

- **`CR-3` no longer disqualifies anything.** As frozen it failed any candidate
  with a zero cost delta — while exempting the do-nothing baseline, which also
  has a zero delta, "by definition". Same fact, opposite verdicts. Amended,
  unchanged spend passes and the *size* of a saving is argued at `CR-6`, where it
  belongs. **`CAN-3` and `CAN-4` are no longer disqualified**; they now fail to
  be recommended for a different and better-supported reason (`CR-1`, `CR-2`,
  `CR-4`, `CR-5` all unproven).
- **`CAN-2` lost its `PASS`es.** Revision 1 marked it `PASS` on `CR-1` and `CR-2`
  while its own risk section recorded, at **Severity: High**, that "a cache
  scoped too wide leaks between shoppers… the one failure that cannot be undone".
  Those two statements cannot both stand. `CR-1` is frozen as "the site must
  behave **exactly** as it does now"; caching a page that is `force-dynamic`
  today can show a shopper a stale price or a sold-out item. Unproven, so
  `UNKNOWN`.
- **`CAN-4` is priced on Cloudflare Free**, not Pro. Revision 1 priced the
  Cloudflare option at its most expensive tier and the Vercel option at a free
  project setting, then compared them on cost.
- **`CAN-3` is scored with Cache Rules.** Revision 1 defined it as "cache what
  Cloudflare caches by default", then failed it for not caching HTML by default —
  while crediting `CAN-2` with exactly the design work that had been defined out
  of `CAN-3`.
- **`CAN-3`'s `CR-4` is now `UNKNOWN`, matching `CAN-4`.** The two are identical
  at the request path — both orange-cloud the domain — so `EV-12`'s
  firewall-visibility loss applies equally. `EV-14` rescues only the client-IP
  half of `CR-4`.
- **All three Cloudflare candidates move to `UNKNOWN` on `CR-5`.** Revision 1
  marked them `PASS` citing `EV-17` — whose own Stance line reads "*opposes*
  `CAN-3`, `CAN-4`, `CAN-5` on `CR-5`". A `PASS` was being justified by the one
  item arguing against it. And four of `CR-5`'s five clauses — streaming RSC,
  Server Action cookie writes, `next/image`, preview deployments and the staging
  gate — have **no evidence at all** behind a Cloudflare proxy (`OQ-7`).
- **The region change became `CAN-7`.** It is not caching and not "per-request
  work", so it was never inside `CAN-2` — yet it was carrying that candidate's
  whole case on the highest-priority criterion.
- **`CAN-8` is new.** Fast Origin Transfer is the **largest line on the invoice**
  ($25.43, 41.8%) and no frozen candidate attacked it at source (`EV-25`).

### Why `CAN-6` is still the only FAIL

`proxy.ts` is Node-runtime middleware and the OpenNext Cloudflare adapter rejects
it (`EV-22`); the built Worker measured **11.42 MiB gzipped against Cloudflare's
published 10 MiB paid ceiling** (`EV-21`, ceiling confirmed independently at
`EV-28`). It cannot be deployed as it stands, so cost never enters the argument.

---

## 2. Trade-Off Comparison Matrix

Only `CAN-1` is eligible, so there is nothing to compare it against. Scoring one
column is not a comparison, and pretending otherwise would repeat revision 1's
mistake in a different form. `CAN-1` is therefore scored on its own merits, and
the pending candidates are scored separately in §2b **for information only** —
those scores must not be read as rankings, because each rests on at least one
unproven hard constraint.

| Criterion | Priority | `CAN-1`: Status quo |
| :--- | :---: | :--- |
| **`CR-6`**: Size of the saving | HIGH | **WEAK** (`EV-1`) — none. Recurring cost stays at **$40.87/month** of usage after the $20 credit, $90.87 all-in. |
| **`CR-7`**: Effort to build and run | HIGH | **STRONG** — zero. |
| **`CR-8`**: Blast radius and reversibility | HIGH | **STRONG** — nothing to undo. |
| **`CR-9`**: Headroom | MEDIUM | **WEAK** (`EV-3`) — Fast Data Transfer is at **84% of the 1 TB allowance**. At roughly 1.2× today's traffic that allowance is gone and transfer bills at $0.15–$0.35/GB. Doing nothing does not stop that arriving; it only means nothing is ready when it does. |
| **`CR-10`**: Clarity when something breaks | MEDIUM | **STRONG** — one vendor, one dashboard. |
| **`CR-11`**: Latency for shoppers | MEDIUM | **MODERATE** — unchanged. Not fast today (almost everything is dynamic), but nothing degrades. |

### 2b. Pending candidates — information only, not a ranking

| Criterion | `CAN-2` Cache on Vercel | `CAN-3`/`CAN-4` Cloudflare | `CAN-5` Workers | `CAN-7` Region | `CAN-8` Stop relaying |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`CR-6`** saving | **UNKNOWN** — depends entirely on `OQ-2`/`OQ-6`. The per-invocation floor is $0.66/M and the average is $8.24/M (`EV-4`); where cacheable routes sit between them is unmeasured. | **WEAK today, MODERATE later** (`EV-1`, `EV-3`) — $0 now, because the lines it would take over already bill $0. Becomes the only candidate that helps the moment 1 TB is crossed. | **UNKNOWN** (`EV-4`, `EV-18`) — costs $5/month (`EV-28`: Workers Paid, our 4.15 M fits the included 10 M). Whether it saves more than $5 turns on `OQ-2`; revision 1's "$20–35/month" was derived from an average used as a marginal rate and is **withdrawn**. | **UNKNOWN, possibly zero** (`OQ-1`) — up to ~$20/month **if** we are in an expensive region. `EV-8` is weak evidence we may already be in a cheaper one. | **UNKNOWN, possibly the largest** (`EV-25`) — attacks the $25.43 line at source, plus invocations and memory-during-wait. Unsized without `OQ-2`. |
| **`CR-7`** effort | MODERATE — deciding what is shareable in a personalised storefront is real design work. | MODERATE — same design work, plus a nameserver migration (`EV-26`). | **WEAK** (`EV-20`) — the auth boundary would live in two runtimes forever. | **STRONG** — one project setting. | WEAK — touches the security boundary the relay exists to provide. |
| **`CR-8`** blast radius | MODERATE — code, reviewable; a mis-scoped cache is the `CR-2` failure. | **WEAK** (`EV-26`) — Free and Pro have no partial/CNAME setup, so this means moving authoritative DNS for the **whole domain**, MX included. A bad step takes down email as well as the site, and reverts at DNS speed, not in minutes. | WEAK — every authenticated request. | **STRONG** — one setting, reverts in minutes. | WEAK — changes who the browser talks to. |
| **`CR-9`** headroom | MODERATE — cuts origin work as traffic grows, but **does not reduce Fast Data Transfer**, so it does not defuse the 1 TB cliff. | **STRONG** (`EV-3`) — the only candidates that move bytes off Vercel entirely. | STRONG — same, plus removes function work. | WEAK — a fixed percentage off one line. | STRONG — less relayed traffic scales with everything. |
| **`CR-10`** clarity | STRONG — one vendor. | WEAK (`EV-12`) — two vendors; Vercel's support terms permit requiring the proxy be disabled. Weight this as an interested party's claim, not a measurement. | WEAK — same. | STRONG — one vendor. | MODERATE. |
| **`CR-11`** latency | MODERATE–STRONG — cached routes get faster. | **UNKNOWN** — an extra hop is real, but no measurement was taken and none was found. Revision 1 scored this WEAK on the strength of `EV-12` alone, which is a vendor page about a competitor and offers no numbers. A `curl` comparison would settle it in minutes. | UNKNOWN — same. | **MODERATE, two-sided** (`EV-5`, `OQ-8`) — moving away from the backends lengthens waits, and memory bills during waits, so latency and cost move together in the wrong direction. | MODERATE — one hop fewer for the traffic it covers. |

---

## 3. Evidence Sufficiency Summary

- **`CAN-1`**: `SUFFICIENT`. The invoice is primary and complete.
- **`CAN-2`**: `PARTIAL` — blocked on `OQ-2`, `OQ-6`, and on a scoping decision
  about what may be cached without breaching `CR-1`/`CR-2`.
- **`CAN-3`** / **`CAN-4`**: `PARTIAL` — cost is settled ($0 on Free), capability
  is not. Blocked on `OQ-5` and `OQ-7`.
- **`CAN-5`**: `PARTIAL` — cost model sound, saving unsized (`OQ-2`, `OQ-6`),
  parity unproven.
- **`CAN-6`**: `SUFFICIENT`. Disqualified on a published hard limit.
- **`CAN-7`**: `PARTIAL` — everything settled **except whether the saving
  exists** (`OQ-1`). One dashboard reading away from being decidable.
- **`CAN-8`**: `MISSING` — newly raised, only `EV-25` behind it.

**The pattern is worth naming.** Seven of eight candidates are blocked on four
questions — `OQ-1`, `OQ-2`, `OQ-5`, `OQ-6` — none of which needs research. Three
are dashboard readings and one is a configuration inventory. The bottleneck in
this decision is not analysis; it is that nobody has looked.

---

## 4. Risk Analysis & Failure Modes

- **`CAN-1` Risks**:
  - **The Fast Data Transfer allowance runs out** (`EV-3`) — **Severity: Medium**
    — at 84% of 1 TB, a modest rise turns a $0.00 line into $0.15–$0.35/GB.
    Mitigation: set a Vercel spend alert now; treat crossing 1 TB as the trigger
    to reopen this decision, because that is the month `CAN-3` starts to pay.
  - **The bill grows with traffic and nothing caps it** (`EV-4`) — **Severity:
    Low** — mitigation: enable spend management, already available on Pro.
  - **Nothing is learned** — **Severity: Medium** — four cheap questions stay
    unanswered, so the next cost conversation restarts from here. This is the
    real cost of `CAN-1` and it is why the recommendation attaches work to it.

- **`CAN-2` Risks**:
  - **A cache scoped too wide leaks between shoppers** (`EV-11`) — **Severity:
    High** — the one failure that a rollback cannot undo. Mitigation: never cache
    a response that reads or sets `MARKET-TOKEN` / `User-Data`; the proxy hop's
    cache headers stay out of scope; run it as its own `development` item.
  - **Stale prices or stock** (`CR-1`) — **Severity: Medium** — on a live-shopping
    storefront a stale price is a product incident, not a caching detail.

- **`CAN-3` / `CAN-4` Risks**:
  - **The nameserver migration** (`EV-26`) — **Severity: High** — Free and Pro
    have no CNAME setup, so the whole domain moves, MX included.
  - **"Cache Everything" as a short-cut** (`EV-11`) — **Severity: High** — the
    reason these are safe on `CR-2` is a Cloudflare *default*, removable with one
    checkbox by anyone chasing the saving.
  - **Certificate issuance and renewal** (`EV-17`) — **Severity: Medium** — an
    orange-clouded domain intercepts the ACME challenge Vercel needs.
  - **Streaming, previews and the staging gate** (`OQ-7`) — **Severity: Unknown**
    — genuinely not researched, not "low risk".

- **`CAN-5` Risks**:
  - **Two copies of the auth boundary** (`EV-20`) — **Severity: High**.
  - **The saving may not exist** (`OQ-2`) — **Severity: Medium**.
  - *Newly reduced:* `EV-23` shows `proxy.ts` never runs on `/api/proxy`, so a
    Worker taking that hop would **not** have to reproduce locale routing,
    country detection or the staging gate. This candidate is simpler than
    revision 1 assumed.

- **`CAN-7` Risks**:
  - **The saving may be zero** (`OQ-1`) — **Severity: High** — unknown whether we
    are in an expensive region at all.
  - **Memory cost replaces transfer cost** (`EV-5`, `OQ-8`) — **Severity: Medium**.
  - **Slower pages for Gulf shoppers** — **Severity: Medium** — a product cost
    traded for perhaps $20/month. The owner's call, not an engineering one.

- **`CAN-8` Risks**:
  - **Weakening the boundary the relay provides** (`EV-25`, `OQ-5`) —
    **Severity: High** — bypassing the hop bypasses whatever it enforces,
    including the OTP block.
  - **Unsized** (`OQ-2`) — **Severity: Medium**.

### Not researched — recorded rather than left silent

These were raised by the advisory panel, are not covered by any `EV-n`, and cut
in both directions:

- Cloudflare's self-serve terms on serving disproportionate non-HTML content, and
  the absence of an SLA on the Free plan — relevant when the whole delivery path
  sits behind it. *(Disfavours Cloudflare.)*
- Whether any media-upload flow traverses the storefront hostname and would meet
  Cloudflare's 100 MB request-body cap on Free/Pro (`EV-28`). Framing says media
  comes from a separate server; nobody checked the upload direction.
  *(Disfavours Cloudflare.)*
- Measured latency of the extra hop. *(Direction unknown — no measurement.)*
- Whether Cloudflare's unmetered L3/L4/L7 DDoS mitigation (`EV-27`) is materially
  better than what Vercel already includes. *(Favours Cloudflare — and its
  absence from revision 1, alongside detailed coverage of Cloudflare's WAF
  weaknesses, was part of the imbalance the panel identified.)*
