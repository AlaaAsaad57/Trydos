---
ticket: "cloudflare-edge-in-front-of-vercel"
workflow: research
version: 2
stage: recommend
status: complete
researched_at: "2026-08-24"
revision: 3
recommended_candidate: "CAN-1 now, as the holding position only, with CAN-3-NOW as the intended destination once OQ-7 is tested"
confidence_level: "MEDIUM"
revisit_triggers:
  - "OQ-7 is tested on a staging hostname behind Cloudflare (expected within days, not months)"
  - "Fast Data Transfer crosses 1 TB in a billing cycle - it is 1.22x away"
  - "OQ-9 answers what the 840 GB is actually made of"
  - "Any month where usage doubles, or any abuse incident that reaches the invoice"
  - "Cloudflare makes partial (CNAME) setup available on Free or Pro"
---

# Technical Recommendation & Advisory Synthesis

> **This is the AI advisory recommendation only.** It is not a decision. The
> decision belongs to the owner at `decide`, after the comprehension gate at
> `assess`.

> **Revision 2 — the recommendation reversed.** Revision 1 recommended the status
> quo and said Cloudflare in front was not worth doing. The owner rejected the
> premise at the gate: this invoice covers roughly 20 customers. That objection
> was checked and **upheld**, and it changes the answer. Revision 1's arithmetic
> was right about the month it measured and wrong about everything after it.

## 1. Executive Recommendation

- **Recommended Candidate**: **`CAN-1`** — but as a **holding position measured
  in days, not as the answer.** `CAN-1` is the only candidate that currently
  passes every hard constraint, and the rule this evaluation follows is that a
  candidate with an `UNKNOWN` on a hard constraint cannot be recommended.
  **`CAN-3-NOW` — put Cloudflare in front now, on the Free plan, with default
  caching only — is the intended destination**, and it is blocked by exactly one
  thing: `OQ-7`, which is a half-day test on a staging hostname, not a research
  question.
- **Confidence Level**: `MEDIUM`. High that the status quo is wrong at scale;
  medium on `CAN-3-NOW` because `CR-1` and `CR-5` are genuinely untested and
  `OQ-9` could still bite (`EV-32`).
- **Primary Rationale**:

  **The free allowance is 1.22× away, not far away.** Fast Data Transfer is at
  **840.89 GB of 1 TB — 84% consumed at ~20 customers**. Past that multiple it
  bills at $0.20/GB, and bandwidth stops being a rounding error and becomes the
  bill (`EV-29`):

  | Traffic | Total/month | Bandwidth share |
  |---|---|---|
  | 1× (today) | $61 | 0% |
  | 2× | $250 | 53% |
  | 10× | $2,140 | 69% |
  | 100× | $23,442 | **71%** |

  Bandwidth is precisely what a CDN in front absorbs, and Cloudflare does not
  meter CDN egress at all. Revision 1 concluded Cloudflare saves $0 because the
  delivery lines bill $0 — true, and true only below 1.22×.

  **This repository already said so.** `docs/vercel-vs-aws-hosting-analysis.md`
  models ~1 M DAU hosting on Vercel at **~$18–22 K/month** and states that "once
  compute is cached away, you're mostly paying for bandwidth, **where Cloudflare
  wins**" (`EV-33`). Two independent methods, same order of magnitude as the
  100× row above. That document was cited as background at `frame` and never
  read against the candidates — which is how this research managed to recommend
  the status quo in a repository that already held the argument against it.

  **And the same change gets more dangerous the longer it is deferred.**
  Cloudflare Free and Pro have no partial/CNAME setup (`EV-26`), so adopting it
  means moving authoritative DNS for the entire domain — MX included. At 20
  customers that is an inconvenience with a small audience. At 1 M DAU, executed
  under pressure by people who have never done it on this domain, it is an outage
  across the storefront *and* email. **Deferring buys nothing** — the saving is
  $0 either way today — while making the eventual execution strictly worse.

## 2. On the attack-cost question — you are partly right, and partly not

This deserves a straight answer rather than being folded into a matrix.

**Corrected:** a recognised DDoS does **not** multiply the Vercel bill. Vercel
does not charge for traffic its firewall denies, challenges or rate-limits, and
the same applies to DDoS mitigation, Attack Mode and IP blocking — all free on
all plans (`EV-30`). On a loud volumetric flood, Vercel and Cloudflare are close
to a draw. "The cost will be doubled multiple times" overstates that case.

**Upheld, and it is the more likely case:** Vercel does bill for "requests
successfully served prior to us automatically mitigating the event", and for
"requests that are not recognized as a DDoS event, **which may include bot and
crawler traffic**" (`EV-31`). That is the ordinary condition of a public
storefront — scrapers, price-monitoring bots, aggressive crawlers, low-and-slow
floods that never trip a threshold. All of it is billed at full rate on Vercel.
Behind Cloudflare the same traffic costs **$0 of bandwidth**, because CDN egress
is not metered. Vercel Community reports also describe attack traffic consuming
the Edge Request quota without it being restored.

So the risk is real but it is **not** the dramatic one. It is a slow leak on a
metered platform, and it grows with the same multiplier as everything else in
`EV-29`. That is why `CR-12` was added as a HIGH-priority criterion, and
`CAN-3-NOW` is `STRONG` on it while `CAN-1` is `MODERATE`.

## 3. Hard Constraints Compliance Summary — and the single blocker

`CAN-1` passes all five (`comparison.md` §0). `CAN-3-NOW` passes three and is
`UNKNOWN` on two, both governed by one open question:

- **`CR-2` PASS** (`EV-11`) — Cloudflare refuses to cache any response carrying
  `Set-Cookie`, `private`, `no-store` or `no-cache`. Scoped to default cache
  behaviour with **no** HTML Cache Rules, our authenticated traffic cannot be
  shared. Adopting the proxy and caching HTML are two separate decisions; only
  the first is recommended.
- **`CR-3` PASS** (`EV-29`) — $0 on Cloudflare Free today, lower at every point
  above 1.22×.
- **`CR-4` PASS** (`EV-14`, `EV-27`) — Vercel Firewall stays and keeps the real
  client IP, because Vercel auto-recognises Cloudflare as a Verified Proxy on all
  plans via `CF-Connecting-IP`. Cloudflare's unmetered mitigation is added in
  front. Residual: reduced Vercel threat-intelligence visibility (`EV-12`), a
  vendor's claim about a competitor with no mechanism or measurement behind it.
- **`CR-1` and `CR-5` UNKNOWN** (`OQ-7`) — **the whole blocker.** Four clauses
  have no evidence either way: Next 16 streaming RSC through Cloudflare's
  buffering and compression; HttpOnly cookie writes from Server Actions; the
  `next/image` path; and what an orange-clouded apex does to `*.vercel.app`
  preview deployments and the `main` staging gate. Plus certificate issuance,
  where an orange-clouded domain intercepts the ACME challenge Vercel needs
  (`EV-17`).

**None of that is a research question. It is a test**, and until it is run no
candidate but `CAN-1` may be recommended.

## 4. What to do — in order

1. **Test `OQ-7`.** Put a staging hostname behind Cloudflare Free and check, by
   name: a streaming RSC navigation; a sign-in that writes `MARKET-TOKEN` from a
   Server Action; an image through `next/image`; a preview deployment URL; the
   `main` staging gate; and certificate issuance and renewal. Half a day. This is
   the only thing standing between the current recommendation and `CAN-3-NOW`.
2. **Answer `OQ-9`** — what the 840.89 GB actually is, broken down by path.
   Cloudflare's self-serve terms forbid using the CDN for "video or a
   disproportionate percentage of pictures, audio files, or other large files"
   without paid add-ons (`EV-32`), and the entire scale case rests on egress being
   unmetered. Two signs are favourable — `CLAUDE.md` says product images and
   story videos come from a **separate media server**, and the invoice shows only
   1,902 image transformations — and 212 KB average per request looks like
   bundles and HTML. But it is unconfirmed, and if the 840 GB turns out to be
   media, `CAN-3` weakens sharply.
3. **Then adopt `CAN-3-NOW`** if 1 and 2 pass: orange-cloud the domain on
   Cloudflare **Free**, default cache behaviour, **no** HTML Cache Rules. Expect
   $0 saving in month one. That is the point — it is bought cheaply, while it is
   cheap to get wrong.
4. **Set the alarms regardless**: a Fast Data Transfer alert at 900 GB and a
   spend alert. The cliff should arrive as a warning, not as an invoice.
5. **Queue `CAN-5b` (relay on a Worker, see §4a), `CAN-2` (caching) and
   `CAN-8` (stop relaying) as their own work items, in that order.** These are `EV-33`'s top two recommendations, they attack the 97.6%
   of today's bill that is origin work, and they help on any platform. `EV-33`
   also answers the objection that blocked `CAN-2` in revision 1 — stale prices
   and stock are solved by event-based cache refresh, which this repo already
   supports through `/api/revalidate`.
6. **Inventory the Vercel Firewall rules into this repository** (`OQ-5`). Worth
   doing whatever is decided: abuse protection that exists only in a dashboard
   cannot be reviewed, moved or rebuilt.

## 4a. The relay on a Worker — added after the owner's second challenge

**The two platforms bill the opposite halves of a relay, and that is the whole
argument.** Cloudflare Workers bill **CPU time only** — "No charge or limit for
duration", and "Cloudflare does not bill for subrequests you make from your
Worker". Vercel bills **Provisioned Memory for the entire instance lifetime**,
explicitly including time "waiting on I/O" (`EV-34`).

`app/api/proxy/route.ts` reads a cookie, resolves a token, and then waits on one
of six backends. Almost all of its wall time is waiting. **That is the single
worst-priced workload shape on Vercel's model and the single best-priced shape on
Workers** — and the invoice shows it directly: **Provisioned Memory ($17.61) is
larger than Active CPU ($11.52)**. We pay more to wait than to compute.

Costed at 2 ms CPU per relayed request on Workers Paid (`EV-36`):

| Traffic | Vercel origin work | Same on Workers | Ratio |
|---|---|---|---|
| 1× (today) | $59 | **$5.00** | 12× |
| 10× | $594 | **$25.91** | 23× |
| 100× | $5,938 | **$246.46** | 24× |

**`CAN-5b` and `CAN-3-NOW` are complementary, not rival.** `CAN-3` removes the
bandwidth column — **71%** of the projected bill at 100×. `CAN-5b` removes the
origin column — the remaining **25%**. Together they address roughly **95%** of
`EV-29`'s $23,442, and `CAN-3-NOW` is the prerequisite that makes `CAN-5b` cheap:
once traffic already flows through Cloudflare, a Worker on two paths is an
increment, not a new architecture. **No earlier revision modelled them together,
because each was scored as a rival to the status quo rather than as a step in a
sequence.** That is the structural mistake this addition corrects.

**Two things keep it from being recommended outright, and both are real:**

1. **The saving is an upper bound.** The Vercel column above is the *whole*
   origin bill, and `OQ-2` means nobody knows what share of it is the relay.
2. **It is a security change that saves money, not a saving that touches
   security.** `EV-37`: the route is 319 lines carrying a server allowlist,
   per-service token resolution, secure request logging, a deliberately
   indistinguishable failure response, repeated percent-decoding against
   encoded-path tricks, and a **hard block on `SEND_OTP` checked three ways**.
   `MARKET-TOKEN` and the service tokens would be read in another vendor's
   runtime. Anything left behind is not enforced — a Worker that forwards without
   reproducing all three OTP checks silently reopens an endpoint that is blocked
   today because it gets abused. This needs its own threat review, not a
   footnote.

**So it is sequenced, not parked:** after `CAN-3-NOW` is in place and `OQ-2` is
answered, `CAN-5b` should get its own research work item with the threat review
as its first stage.

## 5. Rejected & Disqualified Candidates

- **`CAN-3-LATER`** — **REJECTED**. Identical change, deferred, executed during
  the emergency that triggered it, by people with no prior experience of it on
  this domain. It saves nothing that `CAN-3-NOW` does not, and costs strictly
  more on `CR-7` and `CR-8`.
- **`CAN-4`** (WAF moves to Cloudflare) — **NOT RECOMMENDED (unproven on
  `CR-4`)**. On Free it costs nothing, so cost is not the objection; capability
  is. Free gives one rate-limiting rule counting by IP over a fixed 10-second
  window with a 10-second block (`EV-16`), which cannot express per-phone,
  multi-minute OTP protection. And nobody has inventoried what the Vercel
  Firewall does today (`OQ-5`). **Keep the WAF on Vercel; take Cloudflare for the
  CDN and the unmetered mitigation only.**
- **`CAN-5b`** (`/api/proxy` relay → Worker) — **NOT RECOMMENDED YET, but
  SEQUENCED as the next work item after `CAN-3-NOW`, and it is the largest lever
  in this research.** Revisions 2 and 3 parked it; that was wrong, and the
  correction is §4a below.
- **`CAN-5a`** (middleware → Worker) — **NOT RECOMMENDED.** Worst
  effort-to-value ratio of any candidate: a minority-traffic prize (`EV-23`
  bounds it to full document navigations) bought by splitting `proxy.ts` — a
  protected runtime path whose staging gate and matcher are deliberately one
  revertable unit — across two platforms. `EV-35` points at a cheaper answer to
  the same problem: Vercel's own advice is to "only run Middleware when
  necessary", i.e. tighten the matcher. One file, no second vendor.
- **`CAN-6`** (leave Vercel) — **DISQUALIFIED (`CR-1`, `CR-5`)**. `proxy.ts` is
  Node middleware that the OpenNext adapter rejects (`EV-22`), and the Worker
  measured **11.42 MiB gzipped against a published 10 MiB paid ceiling**
  (`EV-21`, `EV-28`).
- **`CAN-7`** (change function region) — **NOT RECOMMENDED YET (`CR-3`
  UNKNOWN)**. May be worth ~$20/month or exactly nothing; `OQ-1` decides, and it
  is one dashboard reading. Note it becomes *less* interesting under the
  re-framed question: it trims a fixed share of the origin column, which is the
  part of the bill that shrinks in importance as traffic grows.

## 6. Non-Critical Known Unknowns

- **`OQ-3`** — is April representative? One data point; does not change the
  structural finding.
- **`OQ-8`** — would a region move cost more in memory than it saves in transfer?
  Only matters if `CAN-7` is pursued.
- **`OQ-10`** — does `docs/vercel-vs-aws-hosting-analysis.md` still hold? Used
  here only as a second opinion agreeing with `EV-29`, never as a source of
  figures.

`OQ-7` and `OQ-9` are `CRITICAL` and are the two items in §4 steps 1 and 2.
`OQ-1`, `OQ-2`, `OQ-5`, `OQ-6` remain `CRITICAL` for the candidates they govern
and do not block this recommendation.

## 7. Freshness & Revisit Triggers

Researched 2026-08-24. All pricing is `VOLATILE`; the invoice is April 2026 and
the rate pages are dated 2026-02-13 to 2026-07-15.

- **`OQ-7` is tested** — the expected path to changing this recommendation, and
  it should happen in days.
- **Fast Data Transfer crosses 1 TB** — 1.22× away. From that month the saving
  stops being zero.
- **`OQ-9` shows the 840 GB is mostly media** — would weaken `CAN-3` sharply
  under Cloudflare's self-serve terms (`EV-32`).
- **Any month where usage doubles, or any abuse incident that reaches the
  invoice.**
- **Cloudflare adds partial (CNAME) setup to Free or Pro** — removes the largest
  operational objection (`EV-26`).

## 8. What changed between revisions, and why

Revision 1 was produced after an advisory panel found the first evaluation
unfair between candidates; it fixed that and still reached the wrong conclusion,
because both rounds measured a single month. The owner supplied the horizon that
neither round had. The specific failures worth recording:

- `EV-1` ("the delivery lines bill $0.00") was treated as a structural fact. It
  is a fact about **one traffic level**, 22% below a cliff.
- `CR-9` (headroom) held the strongest evidence for the Cloudflare candidates and
  was scored `MEDIUM` against `HIGH`-priority criteria measuring the current
  month. It is now `HIGH` and decisive.
- Attack cost had no criterion at all until the owner named it.
- `docs/vercel-vs-aws-hosting-analysis.md` was in the repository, was cited as
  background, and was never read against the candidates.

---

**No decision is recorded in this document.** The owner decides at `decide`,
after the comprehension gate at `assess`.
