---
ticket: cloudflare-edge-in-front-of-vercel
workflow: research
stage: intake
status: complete
owner: developer
updated: 2026-08-24
links:
  clickup:
---

# Intake — cloudflare-edge-in-front-of-vercel

> First stage. Qualify the request only. **No evidence gathering and no evaluation allowed here.**

## Decision Question

Should we put Cloudflare in front of the Vercel deployment — CDN, WAF, and
Workers — to cut the Vercel bill; and if yes, how far should Cloudflare go:
caching only, caching plus WAF, or Workers taking over work that Vercel
functions do today?

## Trigger

The April 2026 Vercel invoice is now in the repository (`vercel-invoice.txt`)
and gives us real numbers instead of estimates. The month closed at **$90.87**:

| Part | Amount |
|---|---|
| Usage, before credit | $60.86 |
| Credit applied | -$20.00 |
| Usage, billed | $40.87 |
| Platform (Pro $20 + extra seat $20 + Speed Insights $10) | $50.00 |
| **Total paid** | **$90.87** |

The usage side breaks down like this (only the lines above zero):

| Line | Usage | Cost |
|---|---|---|
| Fast Origin Transfer | 100.36 GB | $25.43 |
| Fluid Provisioned Memory | 1,342.46 GB-hrs | $17.61 |
| Fluid Active CPU | 3d 3h 14m | $11.52 |
| Function Invocations | 7,207,760 | $4.80 |
| Speed Insights Data Points | 7,342 | $0.65 |
| Build Minutes | 5h | $0.57 |
| Edge Requests — Additional CPU Duration | 25m 10.8s | $0.13 |
| Image Optimization (transforms + cache) | 1,902 / 24,804 | $0.13 |
| Function Duration | 0.107 GB-hrs | $0.02 |
| Fast Data Transfer | 840.89 GB | $0.00 |
| Edge Requests | 4,150,778 | $0.00 |

Two facts in that table shape the whole question, and they are recorded here so
the later stages cannot drift away from them:

1. **The bandwidth and edge-request lines are already free.** 840 GB of Fast
   Data Transfer and 4.15 M Edge Requests both billed $0.00 — they sit inside the
   Pro plan's included allowance. A CDN in front normally saves money by taking
   over exactly those two lines, so on this invoice that saving is zero.
2. **Almost the whole usage bill is origin work** — origin transfer, provisioned
   memory, active CPU, invocations: $59.36 of the $60.86. That work is only cut
   if a request never reaches Vercel at all, which needs a cacheable response.

There is also a prior, related piece of work in this repository: the branch
`ticket/vercel-cloudflare-runtime-compat` (commits `7f1ee003`, `0f70a1a6`,
`9a4e9804`) made the app able to run on Cloudflare Workers and measured the
resulting bundle. That branch is about *leaving* Vercel; this work item is about
*fronting* it. They must not be confused, but the branch is real evidence for one
of the candidates below.

## Decision Owner

The repository owner (`developer`, the human running this work item). Signs off
at the `decide` stage. This is a spending and infrastructure decision, so no
agent may take it.

## Reversibility

**Mixed — and it differs per candidate, which is itself part of the decision.**

- Pointing DNS at Cloudflare and turning on its CDN/WAF is **cheap to reverse**:
  change the DNS record back. Minutes, no code.
- Making the app's responses cacheable (removing `force-dynamic`, adding cache
  headers) is **moderately expensive to reverse** — it is code, it is reviewable,
  and it carries a real risk of serving one shopper's page to another.
- Moving work into Cloudflare Workers is **expensive to reverse**: it splits the
  app across two platforms and creates a second place where routing, auth
  cookies, and locale handling live.

The cost at stake is small in absolute terms (see Trigger), so the amount of
evidence gathered must stay proportionate. This is a one-pass research item, not
a long study.

## Known Hard Constraints

- **The app must keep working exactly as it does today for shoppers.** No
  candidate may change what a user sees, in any of the four languages.
- **Auth must not weaken.** JWTs live only in HttpOnly cookies (`MARKET-TOKEN`,
  `User-Data`). Anything sitting in front of the app must pass those through
  untouched and must never cache a response that carries them.
- **`proxy.ts` runs on every request** and is a protected runtime path in this
  repository. It does locale routing, country detection, bot handling, and the
  staging gate. Any candidate that moves or duplicates that logic is changing
  the single most sensitive file in the app.
- **Abuse protection must not regress.** Rate limiting and DDoS protection are
  Vercel Firewall today, configured in the Vercel dashboard. A candidate that
  moves the WAF to Cloudflare must carry those rules across, not drop them.
- **Net saving, not gross.** Cloudflare's own price (plan, Workers requests, any
  paid add-on) counts against whatever it saves. A change that moves $20 from
  Vercel to Cloudflare is not a saving.
- **The $50.00 platform charge is out of reach for every candidate.** Pro seat,
  extra team seat, and Speed Insights are fixed subscriptions. No CDN can touch
  them. The addressable amount is the $60.86 usage line, and in practice only
  the part of it that survives the $20 credit.

## Initial Candidates

The `frame` stage will formalise these as `CAN-n`.

- **Stay on Vercel as-is** — the do-nothing baseline every other option must beat.
- **Cut the bill on Vercel itself** — make responses cacheable and reduce the
  per-request work, with no Cloudflare at all. This is the candidate that most
  directly attacks the $59.36 of origin work, and it must be on the table or the
  comparison is rigged.
- **Cloudflare in front, CDN only** — orange-cloud DNS, Cloudflare caches what it
  can, Vercel unchanged behind it.
- **Cloudflare in front, CDN + WAF** — as above, plus abuse protection moves from
  Vercel Firewall to Cloudflare.
- **Cloudflare Workers doing real work** — a Worker in front that serves cached
  responses, or that takes over a specific hot path (for example the
  `app/api/proxy` hop, or image resizing) so those requests never reach Vercel.
- **Leave Vercel for Cloudflare Workers entirely** — the direction the branch
  `ticket/vercel-cloudflare-runtime-compat` already explored. Out of the literal
  question asked ("in front of Vercel"), but it is the obvious neighbour and
  ruling it in or out cheaply is worth one line of evidence.

## Workflow Type Check

Confirm this is Research and not another workflow type:

- **Is the answer already inside this repository?** No. The repository tells us
  what the app does and what it was billed; it cannot tell us what Cloudflare
  charges, what it caches by default, or how it behaves in front of Vercel.
  Those are outside facts, so this is not a `study`.
- **Has the choice already been made, leaving only execution?** No. Nothing has
  been decided. It is not a `development` item.
- **Are there at least two genuine options?** Yes — six are listed above, and at
  least three of them are serious.

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `research` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `research` |

## Missing Information

Nothing blocks framing. The following are open questions for the `evidence`
stage, not gaps in the request:

- What share of the 7.2 M invocations are `app/api/proxy` calls versus page
  renders? This decides whether a CDN can help at all.
- What Cloudflare plan would be needed (Free, Pro, or Workers Paid), and what
  does it charge for the traffic we actually have?
- Does Vercel support or object to a third-party proxy in front of a Pro project,
  and what breaks if one is used (WebSockets, streaming, image optimisation, the
  `x-forwarded-for` chain that Vercel Firewall and Sentry rely on)?
- Is the $20 credit on this invoice recurring or one-off? It changes the
  addressable amount by a third.

## Readiness Status

`READY`

- **Justification:** the decision question is a real choice, the trigger is a
  paid invoice with line-level numbers, the owner is a human, the hard
  constraints are written down, and there are more than two genuine candidates.
  One caution is recorded on the face of this document rather than discovered
  later: the whole addressable bill is about **$60 a month**, of which roughly
  **$41** is actually paid after the credit — so any candidate whose running cost
  or engineering time exceeds that is disqualified by arithmetic, not by
  opinion. The research proceeds on that basis, kept deliberately short.
