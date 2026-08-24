---
ticket: "cloudflare-edge-in-front-of-vercel"
workflow: research
version: 2
stage: decide
status: completed
decision_status: "ACCEPTED"
selected_candidate: "CAN-1 as a time-boxed holding position, with CAN-3-NOW as the committed destination once OQ-7 passes"
decision_owner: "developer"
decided_at: "2026-08-24"
---

# Authoritative Engineering Decision Record

## 1. Final Decision Outcome

- **Decision Status**: `ACCEPTED`
- **Selected Candidate**: **`CAN-1`** — status quo, **as a holding position
  only**, with **`CAN-3-NOW`** (Cloudflare in front, Free plan, default cache
  behaviour, no HTML Cache Rules) as the **committed direction** to be adopted
  as soon as `OQ-7` passes.
- **Decision Owner**: developer (repository owner)
- **Date**: 2026-08-24
- **Comprehension gate**: passed 4/4, first attempt (`comprehension.md`).

**Read this precisely.** `CAN-1` is selected because it is the only `ELIGIBLE`
candidate — `CAN-3-NOW` carries `UNKNOWN` on `CR-1` and `CR-5`, and the rule this
workflow follows is that a candidate with an unproven hard constraint cannot be
signed for. **This is not a decision to stay on Vercel alone.** The direction is
decided; only the evidence needed to execute it is missing, and that evidence is
a half-day test rather than an open question.

## 2. Decision Rationale

**The bill being researched is not the bill that matters.** The April 2026
invoice covers roughly 20 customers. Fast Data Transfer is at **840.89 GB of the
1 TB allowance — 84% consumed, 1.22× from the cliff**. Past that point bandwidth
is 53% of the bill at 2× traffic and **71% at 100×** (`EV-29`), and Cloudflare
does not meter CDN egress. The first two revisions of this research answered
"does Cloudflare cut *this* invoice" and correctly answered no; that was the
wrong question, and the owner said so at the gate.

**The change gets strictly more dangerous the longer it is deferred.** Cloudflare
Free and Pro have no partial/CNAME setup (`EV-26`), so adoption means moving
authoritative DNS for the whole domain, MX included. At ~20 customers that is a
small, recoverable event. At 1 M DAU, executed under pressure by people who have
never performed it on this domain, it is an outage across the storefront *and*
email. Deferring buys nothing — the saving is $0 either way today — while making
the eventual execution worse. `CAN-3-LATER` was rejected on exactly this.

**The safety objections did not survive the evidence.** Vercel auto-recognises
Cloudflare as a Verified Proxy on all plans via `CF-Connecting-IP`, so the real
client IP still reaches the application, Sentry and the OTP limiter (`EV-14`);
Cloudflare refuses to cache any response carrying `Set-Cookie`, so authenticated
traffic cannot be shared under default behaviour (`EV-11`); and Cloudflare adds
unmetered L3/L4/L7 mitigation in front of a Vercel Firewall that stays in place
(`EV-27`). Vercel's argument against reverse proxies is a vendor's position about
a competitor, and one of its four claims is contradicted by Vercel's own page
(`EV-12`, conflict `C-1`).

**The attack-cost premise was corrected, and the corrected version still
supports the direction.** A recognised DDoS does **not** multiply the Vercel
bill — Vercel does not charge for traffic it denies, challenges or mitigates
(`EV-30`). The real exposure is abuse that is never classified as an attack —
scrapers, crawlers, low-and-slow floods — which is billed at full rate on Vercel
and costs $0 of bandwidth behind Cloudflare (`EV-31`).

**The repository already contained this conclusion.**
`docs/vercel-vs-aws-hosting-analysis.md` models ~1 M DAU on Vercel at
**~$18–22 K/month** and states that "once compute is cached away, you're mostly
paying for bandwidth, **where Cloudflare wins**" (`EV-33`). It was cited as
background at `frame` and never read against the candidates.

## 3. Decision Alignment with AI Recommendation

**`ACCEPTED` — aligned with `recommendation.md` revision 3.** No candidate is
overridden and nothing is deferred.

Two owner positions are recorded alongside the acceptance, because they shape
what happens next and are not otherwise captured in a decision field:

1. **The research was biased against Cloudflare in its first revision.**
   Upheld — the advisory panel found the same independently, and the corrections
   are logged as `AM-01`..`AM-07` in `framing.md` §7. Revisions 3 and 4 reversed
   the conclusion. Recorded because a decision record that hides how close this
   came to the opposite answer is not worth keeping.
2. **Caching will be enabled later, "even for one minute".** Endorsed, and
   stronger than stated. A 60-second cache collapses a page's requests-per-minute
   into a single origin hit, so its value scales with concurrency — near zero at
   ~20 customers, very large at 1 M DAU. More importantly it is what **unlocks**
   the Cloudflare saving: without cacheable responses Cloudflare can only cache
   static assets (`EV-10`), and caching on Vercel alone does not reduce Fast Data
   Transfer at all. Caching **behind** Cloudflare does, because the request never
   reaches Vercel. `CAN-2` and `CAN-3-NOW` are therefore one plan, not two
   candidates, and the `CAN-2` ticket must be written that way.

## 4. Next Steps & Implementation Path

Ordered. Steps 1 and 2 are the gate on step 3.

- [ ] **1. Test `OQ-7` — the only blocker.** Put a staging hostname behind
      Cloudflare Free and verify, by name: a streaming RSC navigation; a sign-in
      that writes `MARKET-TOKEN` from a Server Action; an image through
      `next/image`; a preview deployment URL; the `main` staging gate; and
      certificate issuance and renewal (`EV-17` — an orange-clouded domain
      intercepts the ACME challenge Vercel needs). Half a day.
      `/wf:start development cloudflare-staging-proxy-trial "Prove the request path survives behind Cloudflare"`
- [ ] **2. Answer `OQ-9`** — break the 840.89 GB down by path in Vercel
      Observability. Cloudflare's self-serve terms forbid serving "video or a
      disproportionate percentage of pictures, audio files, or other large files"
      without paid add-ons (`EV-32`), and the whole plan rests on unmetered
      egress. Signs are favourable — 212 KB average per request, only 1,902 image
      transformations, media on a separate server — but unconfirmed.
- [ ] **3. Adopt `CAN-3-NOW`** if 1 and 2 pass: orange-cloud the domain on
      Cloudflare **Free**, default cache behaviour, **no** HTML Cache Rules.
      Expect $0 saving in month one — that is the point.
      **Standing rule to carry into that ticket: never enable "Cache Everything".**
      It removes the `Set-Cookie` protection that is the only reason this is safe
      on auth, and that failure is not repaired by a rollback.
- [ ] **4. Set alarms regardless of the above** — a Fast Data Transfer alert at
      900 GB and a spend alert. The cliff should arrive as a warning, not as an
      invoice.
- [ ] **5. Inventory the Vercel Firewall rules into this repository** (`OQ-5`).
      Worth doing whatever happens: abuse protection that exists only in a
      dashboard cannot be reviewed, moved or rebuilt.
- [ ] **6. Follow-on research: `CAN-5b`** — move `app/api/proxy` to a Worker.
      The largest single lever found (12× today, ~24× at scale — `EV-36`),
      because Workers bill CPU only and do not bill time waiting on a subrequest,
      while Vercel bills Provisioned Memory *during* I/O wait (`EV-34`). Needs
      `OQ-2` answered and a **threat review as its first stage**: the route is
      319 lines carrying an allowlist, per-service token resolution and a
      three-way `SEND_OTP` block (`EV-37`). It is a security change that saves
      money, not the reverse.
- [ ] **7. Follow-on development: `CAN-2`** — caching, written as the second half
      of the Cloudflare plan per §3.2 above, using event-based revalidation
      through the existing `/api/revalidate` for price and stock freshness.
- [ ] **8. Not adopted: `CAN-5a`** (middleware → Worker). Worst effort-to-value
      ratio here. Prefer Vercel's own advice — "only run Middleware when
      necessary" — i.e. tighten the `proxy.ts` matcher. One file, no second
      vendor, and it keeps the staging gate and its matcher as one revertable
      unit.
- [ ] **9. Correct `CLAUDE.md`.** It states that `proxy.ts` "runs on every
      request". The matcher at `proxy.ts:674-694` excludes `api`, `_next`,
      static, sitemaps and the asset folders, and its `missing:` clause skips
      prefetches, Server Actions and RSC navigations (`EV-23`). Three artifacts
      in this work item repeated the wrong claim as a constraint before it was
      checked.
- [ ] **10. Record an ADR** in `docs/adr/` capturing the direction and the two
      revisit triggers below.

**Revisit triggers** (from `recommendation.md`): `OQ-7` tested; Fast Data
Transfer crosses 1 TB; `OQ-9` shows the 840 GB is mostly media; usage doubles or
an abuse incident reaches the invoice; Cloudflare adds partial (CNAME) setup to
Free or Pro.
