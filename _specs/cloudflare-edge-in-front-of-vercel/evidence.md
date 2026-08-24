---
ticket: "cloudflare-edge-in-front-of-vercel"
workflow: research
version: 2
stage: evidence
status: complete
researched_at: "2026-08-24"
---

# Technical Evidence Base

## 1. Evidence Collection Summary

**Sources queried (all retrieved 2026-08-24):**

- **Vercel primary documentation** — pricing, regional pricing (`dxb1`, `fra1`),
  CDN usage and pricing, Fluid compute pricing, Pro plan, reverse-proxy policy,
  and the knowledge-base article written specifically about Cloudflare in front
  of Vercel.
- **Cloudflare primary documentation** — Workers pricing and limits, default
  cache behaviour, WAF custom rules, rate-limiting rules per plan.
- **This repository** — `vercel-invoice.txt` (the paid April 2026 invoice),
  `app/api/proxy/route.ts`, `proxy.ts`, `vercel.json`, the `force-dynamic` /
  `revalidate` census, and the branch `ticket/vercel-cloudflare-runtime-compat`
  (`scripts/worker-size.mjs`).

**Freshness.** Every pricing item is `VOLATILE` — Vercel's docs carry
`last_updated` dates between 2026-02-13 and 2026-07-15, and Cloudflare's plan
limits change without notice. Every behavioural and policy item is `STABLE`.

**Method note.** Where an invoice line is checked against a published rate, the
arithmetic is shown so the reader can re-do it. **No line reconciles exactly.**
Two come within a cent or two and five miss by 14–17%; `EV-8` and `C-2` record
both, and neither is called a match. An earlier draft of this file claimed two
lines reconciled "to the cent" — they do not, and the claim is withdrawn.

**A caution about this file's sources.** Almost every external citation below is
a vendor documenting its own product, and two of them are Vercel documenting a
competitor. `EV-12` in particular is Vercel's own argument against Cloudflare and
is treated as an interested party, not as a finding — see `C-1`, where one of its
four claims turns out to be contradicted by Vercel's own page. **No independent
source was found, in either direction, on how Cloudflare in front of Vercel
behaves in practice.** That gap is real and is recorded as `OQ-7`.

**Target versions:** Vercel Pro plan as of 2026-08; Cloudflare Free / Pro /
Workers Paid as of 2026-08; Next.js 16 App Router; the app as it stands on
`main` at `136846d5`.

---

## 2. Structured Evidence Items

### `CAN-1`: Status quo — Vercel alone

- **`EV-1`**:
  - **Claim**: The addressable part of the bill is **$60.86 of usage**. The two
    lines a CDN normally takes over — Fast Data Transfer (840.89 GB) and Edge
    Requests (4,150,778) — both billed **$0.00**.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt` (paid 2026-04-23)
  - **Target Version**: April 2026 billing cycle
  - **Stance**: `opposes` every Cloudflare candidate on `CR-6`; `neutral` on the rest
  - **Notes / Context**: This is the single most important number in this work
    item. A CDN in front cannot save money on lines that already cost nothing.

- **`EV-2`**:
  - **Claim**: The Pro plan includes **1 TB Fast Data Transfer** and
    **10,000,000 Edge Requests** every month, plus **$20 of monthly credit**,
    and the credit **resets every month** — it is not a one-off.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/plans/pro-plan — "Every Pro plan
    has $20 in monthly credit"; "The credit and allocations expire at the end of
    the month if they are not used, and are reset at the beginning of the
    following month." Retrieved 2026-08-24, page `last_updated: 2026-07-15`.
  - **Target Version**: Pro plan, 2026-08
  - **Stance**: `supports` `CAN-1` on `CR-6`
  - **Notes / Context**: Resolves an intake open question. The real recurring
    cost of usage is **$40.87/month**, not $60.86. The saving any candidate must
    beat is therefore smaller than it first looks. It also means the first $20 of
    any saving is worth **nothing** in months where usage stays under $20 — but
    at $60.86 we are well past that point, so savings are real dollar-for-dollar.

- **`EV-3`**:
  - **Claim**: Where the allowances stand today: **840.89 GB of 1 TB used (84%)**
    and **4.15 M of 10 M Edge Requests used (42%)**. Fast Data Transfer is the
    allowance closest to being exhausted.
  - **Epistemic Status**: `FACT` (division of `EV-1` by `EV-2`)
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt`; https://vercel.com/docs/plans/pro-plan
  - **Target Version**: April 2026
  - **Stance**: `supports` the Cloudflare candidates on `CR-9` (headroom)
  - **Notes / Context**: The honest counter-argument to `EV-1`. Today a CDN saves
    nothing on transfer — but at ~1.2× current traffic the 1 TB allowance is gone
    and Fast Data Transfer starts costing $0.15–$0.35 per GB. At 2 TB/month that
    is roughly **$150–$300/month of new cost that Cloudflare would absorb**.
    This is the strongest argument any Cloudflare candidate has, and it is about
    the future, not this invoice.

- **`EV-4`**:
  - **Claim**: Almost the entire bill is origin work. Grouped:
    origin transfer $25.43 + provisioned memory $17.61 + active CPU $11.52 +
    invocations $4.80 + function duration $0.02 = **$59.38 of $60.86 (97.6%)**.
    Spread over 7,207,760 invocations that is **$8.24 per million requests that
    reach a function**.
  - **Epistemic Status**: `INFERENCE` (arithmetic on `EV-1`)
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt`
  - **Target Version**: April 2026
  - **Stance**: `supports` `CAN-2` and `CAN-5` on `CR-6`; `opposes` `CAN-3`
  - **Notes / Context**: **$8.24 per million is an average, and it must not be
    used as a marginal rate.** An earlier draft of this item said "any candidate
    that stops N million requests reaching a Vercel function saves roughly
    N × $8.24". That does not follow, and the claim is withdrawn. Only the
    invocation component — **$0.66 per million** — is genuinely per-request.
    Fast Origin Transfer ($25.43) scales with **response bytes**, Active CPU
    ($11.52) with **work done**, and Provisioned Memory ($17.61) with **instance
    lifetime including I/O wait** (`EV-5`). None of the three is uniform per
    invocation, and the `app/api/proxy` hop is explicitly the *atypical* case:
    low CPU, high wait, small-to-moderate payload. Removing 3 M forwarding
    invocations would therefore save appreciably **less** than 3 × $8.24.
    The honest statement is: the average request costs $8.24/M, the cheapest
    thing a request can cost is $0.66/M, and where any particular route sits
    between those two is unmeasured (`OQ-2`).

- **`EV-5`**:
  - **Claim**: **Provisioned Memory is billed while the function waits on I/O**,
    not only while code runs. Vercel: "Vercel bills Active CPU only while your
    code is actually running. If the request is waiting on I/O, CPU billing
    pauses but memory billing continues."
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/functions/usage-and-pricing
    (retrieved 2026-08-24, `last_updated: 2026-06-16`)
  - **Target Version**: Fluid compute, 2026-08
  - **Stance**: `neutral`; explains `CAN-1` and constrains `CAN-2`
  - **Notes / Context**: Decisive for this app. `app/api/proxy/route.ts` spends
    nearly all of its life waiting on one of six backends. That is why
    Provisioned Memory ($17.61) is larger than Active CPU ($11.52) — we are
    paying for waiting. Making our own code faster barely helps; **not invoking
    the function, or waiting less on the backend, is what helps.**

### `CAN-2`: Cut the bill on Vercel itself — no Cloudflare

- **`EV-6`**:
  - **Claim**: Vercel's own cost-reduction guidance is caching: adding cache
    headers to function responses "reduces Fast Origin Transfer usage", and
    SSG/ISR removes invocations entirely. It also names `s-maxage` +
    `stale-while-revalidate` and `Etag` / `If-Modified-Since` support (on by
    default in Next.js) as the specific mechanisms.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/manage-cdn-usage;
    https://vercel.com/kb/guide/how-can-i-reduce-my-serverless-execution-usage-on-vercel
    (retrieved 2026-08-24)
  - **Target Version**: 2026-06 docs
  - **Stance**: `supports` `CAN-2` on `CR-6`
  - **Notes / Context**: Every mechanism here works on Vercel's own CDN, with no
    second vendor, no DNS change, and no new failure surface.

- **`EV-7`**:
  - **Claim**: **Region choice changes the biggest line on this invoice by 5×.**
    Fast Origin Transfer is **$0.30/GB in Dubai (`dxb1`)** and **$0.06/GB in
    Frankfurt (`fra1`)**. Active CPU is almost identical between them ($0.185 vs
    $0.184 per hour), and Provisioned Memory likewise ($0.0153 vs $0.0152 per
    GB-hour).
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/pricing/regional-pricing/dxb1
    and https://vercel.com/docs/pricing/regional-pricing/fra1 (both
    `last_updated: 2026-02-13`, retrieved 2026-08-24)
  - **Target Version**: 2026-08 regional price tables
  - **Stance**: `supports` `CAN-2` on `CR-6` and `CR-7`
  - **Notes / Context**: **Size it from what was billed, not from the rate
    table.** The line billed **$25.43**, not the $30.11 the `dxb1` rate predicts
    (`EV-8`), so the honest ceiling is "up to about **$20/month**, if and only if
    the functions are currently in an expensive region" — which is `OQ-1` and is
    **not known**. It is the largest *technical* lever found in this research;
    the largest lever on the invoice overall is dropping the $50 of fixed
    subscriptions, which framing put out of scope. **It is not free:** the six backends are
    presumably near the Gulf, so moving compute to Frankfurt lengthens every
    backend round trip, and by `EV-5` longer waiting means *more* Provisioned
    Memory. The saving on transfer could be partly eaten by the memory line, and
    shoppers would see slower responses. This trade-off is real and must be
    measured, not assumed. This evidence item now belongs to **`CAN-7`**, a
    candidate of its own: it was originally scored inside `CAN-2` ("make
    responses cacheable"), which it is not, and it was carrying that candidate's
    whole case. See the amendment log in `framing.md` §7.

- **`EV-8`**:
  - **Claim**: **No line reconciles exactly against the `dxb1` rate table**, and
    the misses do not point the same way:
    invocations 7.20776 M × $0.66/M = **$4.76** vs **$4.80** billed (**0.8%
    over** billed — i.e. the invoice charged *more* than the rate predicts);
    Edge Request CPU 0.4197 h × $0.33 = **$0.14** vs **$0.13** (7% under);
    Active CPU 75.24 h × $0.185 = **$13.92** vs **$11.52** (17.2% under);
    Provisioned Memory 1,342.46 × $0.0153 = **$20.54** vs **$17.61** (14.3%
    under); Fast Origin Transfer 100.36 × $0.30 = **$30.11** vs **$25.43**
    (15.5% under).
  - **Epistemic Status**: `INFERENCE`
  - **Source Authority**: `PRIMARY_VENDOR` (rates) + `PRIMARY_VENDOR` (invoice)
  - **Source Citation**: `vercel-invoice.txt`;
    https://vercel.com/docs/pricing/regional-pricing/dxb1;
    https://vercel.com/docs/functions/usage-and-pricing
  - **Target Version**: April 2026 invoice vs 2026-08 rate tables
  - **Stance**: `neutral`
  - **Notes / Context**: Four explanations were considered, and **none is ruled
    out** by anything available here:
    (a) *traffic split across regions* — the obvious guess, but it is weakened by
    the invoice's own numbers: Function Invocations is priced from the same
    `dxb1` page and comes out **0.8% over**, not 15% under. A region blend should
    have moved that line in the same direction as the others;
    (b) *rates changed between April and August* — the rate pages carry
    `last_updated` dates of 2026-02-13, before the invoice, which argues against
    it but does not exclude a later revision;
    (c) *a blended, negotiated or promotional rate on compute*;
    (d) *the displayed usage figures are rounded* — plausible for the two small
    lines, not for a 15% gap on three large ones.
    An earlier draft named (a) as the likely answer. It has no more support than
    the others, and it happens to be the one explanation that leaves `EV-7`'s
    premise intact — which is exactly why it should not have been preferred.
    **The region must be read from the dashboard, not inferred from arithmetic.**
    See `OQ-1`, which is `CRITICAL` for `CAN-7`.

- **`EV-9`**:
  - **Claim**: The app is deliberately uncacheable today. 10 route files under
    `app/` declare `force-dynamic` and 7 declare `revalidate`; there are 39 route
    handlers under `app/api/`; and the single hottest path,
    `app/api/proxy/route.ts`, forwards a per-user `MARKET-TOKEN` to one of six
    backends and answers `Cache-Control: no-store` on failure.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: this repository at `136846d5` —
    `app/api/proxy/route.ts:24`; census of `force-dynamic` / `revalidate` under
    `app/`
  - **Target Version**: `main` @ `136846d5`
  - **Stance**: `supports` `CAN-2` on `CR-6`; `opposes` `CAN-3` on `CR-6`
  - **Notes / Context**: This cuts both ways and must not be read as only good
    news. It means there is real headroom to cache — **and** it means most of the
    traffic is genuinely personal and will never be cacheable by anyone, at
    Vercel or at Cloudflare. The proxy hop is the biggest single source of
    invocations and is the least cacheable thing in the app.

### `CAN-3`: Cloudflare CDN in front, caching only

- **`EV-10`**:
  - **Claim**: **Cloudflare does not cache HTML or JSON by default.** Its default
    cache list is ~60 static file extensions (images, fonts, JS, CSS, archives,
    media). Caching HTML requires an explicit Cache Rule.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
    — "The Cloudflare CDN does not cache HTML or JSON by default." Retrieved
    2026-08-24.
  - **Target Version**: Cloudflare CDN, 2026-08
  - **Stance**: `opposes` `CAN-3` on `CR-6`
  - **Notes / Context**: Out of the box, Cloudflare in front of us would cache
    `_next/static` and images — exactly the traffic that is already free on
    Vercel (`EV-1`). It would cache **none** of the function traffic that makes
    up 97.6% of the bill (`EV-4`).

- **`EV-11`**:
  - **Claim**: Cloudflare refuses to cache a response when `Cache-Control` is
    `private`, `no-store`, `no-cache` or `max-age=0`, **or when a `Set-Cookie`
    header is present**.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
    (retrieved 2026-08-24)
  - **Target Version**: Cloudflare CDN, 2026-08
  - **Stance**: `supports` `CAN-3`..`CAN-5` on `CR-2`; `opposes` them on `CR-6`
  - **Notes / Context**: Good news for safety, bad news for saving. Our
    guest-token flow (`serverRequests/HandleAuthedFetch.ts` registers a guest and
    sets `MARKET-TOKEN` on a 401) sets a cookie on exactly the first-visit
    responses a CDN would most want to cache. The default protects `CR-2` — but
    anyone later switching on "Cache Everything" to chase a saving would be
    overriding the one rule that keeps `CR-2` safe. That is the failure mode to
    fear here, and it is a configuration checkbox away.

- **`EV-12`**:
  - **Claim**: Vercel states plainly: **"We do not recommend using a reverse
    proxy in front of Vercel."** The stated effects are lost traffic visibility
    for the Vercel Firewall, client IPs that "cannot be accurately identified",
    attack traffic being forwarded through to the project and causing usage
    spikes, and the firewall being unable to purge cache if the proxy is
    compromised.
  - **Epistemic Status**: `FACT` that Vercel says it; `UNKNOWN` whether the
    effects are material at our scale
  - **Source Authority**: `PRIMARY_VENDOR_MARKETING` — **downgraded from
    `PRIMARY_VENDOR`.** This is one vendor's published argument against a
    competitor's product, on a page whose purpose is to keep the customer's
    traffic on its own network. It is a position, not a measurement.
  - **Source Citation**: https://vercel.com/docs/security/reverse-proxy
    (`last_updated: 2026-06-16`); https://vercel.com/kb/guide/cloudflare-with-vercel
    — both retrieved 2026-08-24
  - **Target Version**: 2026-08
  - **Stance**: `opposes` `CAN-3`, `CAN-4`, `CAN-5` on `CR-4`, `CR-10`, `CR-11`
  - **Notes / Context**: An earlier draft said "three of the four are simply
    true of any proxy". That was an unsourced assertion and is withdrawn. What
    can actually be said: **one of the four claims — the client-IP one — is
    contradicted by Vercel's own page** (`EV-14`, `C-1`). A source that
    overstates one of four claims should have the remaining three discounted,
    not accepted. Of those three, "attack traffic can be forwarded through and
    cause usage spikes" is true of any proxy by construction; "reduced firewall
    effectiveness" and "cache management issues" are assertions with no mechanism
    given and no measurement offered, and this research found none. Vercel also warns that under
    its Support Terms it "may be necessary for the team to require you to disable
    or reconfigure your proxy" before helping — a real operational cost the day
    something goes wrong.

- **`EV-13`**:
  - **Claim**: What Cloudflare would cache for us is currently free on Vercel, so
    the direct saving from `CAN-3` is approximately **$0.00/month**.
  - **Epistemic Status**: `INFERENCE`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `EV-1` + `EV-10` + `EV-11`
  - **Target Version**: April 2026 usage
  - **Stance**: `opposes` `CAN-3` on `CR-3` (a hard constraint) and `CR-6`
  - **Notes / Context**: `CAN-3` on the Cloudflare **Free** plan costs $0, so it
    does not lose money — but `CR-3` asks for the bill to go **down**, and this
    does not move it at all. It only starts to pay from the moment the 1 TB
    allowance is exceeded (`EV-3`).

### `CAN-4`: Cloudflare CDN + WAF

- **`EV-14`**:
  - **Claim**: **Vercel automatically recognises Cloudflare as a verified
    proxy on all plans**, including Pro, using the built-in `CF-Connecting-IP`
    header, with "No additional configuration required".
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/security/reverse-proxy —
    "Verified Proxy is automatically enabled for the providers listed below on
    all plans"; the table lists Cloudflare / `CF-Connecting-IP`. Retrieved
    2026-08-24.
  - **Target Version**: Verified Proxy Lite, 2026-08
  - **Stance**: `supports` `CAN-3`, `CAN-4`, `CAN-5` on `CR-4`
  - **Notes / Context**: This corrects the common assumption — and the framing's
    own worry — that Cloudflare in front would break the client IP and blind
    Sentry, the OTP rate limiter, and `proxy.ts`'s country detection. It would
    not. Cloudflare is one of eight providers Vercel supports out of the box.
    `CR-4` is therefore **not** failed on client-IP grounds; it is still at risk
    on the firewall-visibility grounds in `EV-12`.

- **`EV-15`**:
  - **Claim**: **The Vercel WAF is costing us nothing today.** The invoice has no
    `Firewall Rate Limit Requests`, `Firewall OWASP Requests` or
    `Firewall OWASP Excess Bytes` line at all, although those are billable
    resources ($0.55/M, $0.88/M and $0.22/GB in `dxb1`).
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt` (no firewall lines);
    https://vercel.com/docs/pricing/regional-pricing/dxb1
  - **Target Version**: April 2026
  - **Stance**: `opposes` `CAN-4` on `CR-3` and `CR-6`
  - **Notes / Context**: Moving the WAF to Cloudflare saves **$0.00**, because
    the WAF is not on the bill. Whatever protection is in place today (custom
    rules, plus the platform-wide DDoS mitigation that is included) is free. The
    only reason to move it would be capability, not cost — and `CR-3` is a cost
    constraint.

- **`EV-16`**:
  - **Claim**: Cloudflare's **Free** plan gives **5 WAF custom rules and 1
    rate-limiting rule**, and that one rule can count **by IP only**, over a
    fixed **10-second** window, with a **10-second** mitigation timeout. Pro
    ($20/month) raises this to 20 custom rules and 2 rate-limiting rules with a
    period up to 1 minute and a timeout up to 1 hour. Custom counting
    characteristics (cookie, header, path, fingerprint) are Business and above.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/waf/rate-limiting-rules/;
    https://developers.cloudflare.com/waf/custom-rules/ (retrieved 2026-08-24)
  - **Target Version**: Cloudflare plans, 2026-08
  - **Stance**: `opposes` `CAN-4` on `CR-3` and `CR-4`
  - **Notes / Context**: A 10-second window with a 10-second block is close to
    useless for the abuse this app actually has — OTP flooding, which the repo
    handles with a Redis limiter counting **per phone number** over minutes.
    Cloudflare Free cannot express that rule at any price, and Cloudflare Pro
    still cannot count by anything but IP. Buying Cloudflare Pro to get a WAF we
    are not paying for would **add $20/month** to a bill whose entire addressable
    usage is $60.86 — a direct `CR-3` failure.

- **`EV-17`**:
  - **Claim**: Certificate handling is a known friction point. Vercel's own
    Cloudflare article says that using a Cloudflare Origin CA certificate on
    Vercel requires uploading a wildcard-SAN certificate and is an **Enterprise**
    capability; multiple Vercel Community threads report domains stuck on
    "Invalid Configuration" or "Failed to Generate Cert" specifically when the
    Cloudflare proxy is enabled.
  - **Epistemic Status**: `FACT` (the Enterprise limit) / `INFERENCE` (frequency)
  - **Source Authority**: `PRIMARY_VENDOR` + `COMMUNITY`
  - **Source Citation**: https://vercel.com/kb/guide/cloudflare-with-vercel;
    community.vercel.com threads "Invalid Configuration Cloudflare Proxy",
    "Custom Domain Stuck on Failed to Generate Cert - Cloudflare Proxy"
    (retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `opposes` `CAN-3`, `CAN-4`, `CAN-5` on `CR-5` and `CR-7`
  - **Notes / Context**: Community reports are weak evidence for how often this
    happens, but they are strong evidence that it happens and that the fix is not
    obvious. Vercel needs to answer an ACME challenge on the domain to issue and
    renew its certificate; an orange-clouded domain intercepts that path. This is
    survivable — it is a documented configuration, not a wall — but it is setup
    and renewal risk on the live storefront domain, which is what `CR-8` is about.

### `CAN-5`: Cloudflare Workers doing real work in front

- **`EV-18`**:
  - **Claim**: Cloudflare Workers **Free** allows 100,000 requests/day
    (~3 M/month) with 10 ms CPU per invocation. **Workers Paid** is **$5/month**
    minimum, including 10 M requests and 30 M CPU-milliseconds, then $0.30 per
    additional million requests.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/workers/platform/pricing/
    (retrieved 2026-08-24)
  - **Target Version**: Workers, 2026-08
  - **Stance**: `opposes` `CAN-5` on `CR-3`
  - **Notes / Context**: Our 4.15 M requests/month exceeds the free daily
    allowance (~3 M/month), so `CAN-5` starts at **$5/month of new spend** and
    fits inside the paid tier's 10 M with room. The 10 ms free-tier CPU limit
    also rules the free tier out for anything but trivial forwarding.

- **`EV-19`**:
  - **Claim**: A Worker is billed per request **whether or not the response came
    from cache** — Cloudflare's own docs state cached requests incur the same
    per-request charge as uncached ones.
  - **Epistemic Status**: `INFERENCE` — **downgraded from `FACT`.** This is a
    paraphrase of the pricing page, not a quoted sentence, and it is load-bearing
    for `CAN-5`. It should be re-verified against the exact wording before any
    money is committed to `CAN-5`.
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/workers/platform/pricing/
    (retrieved 2026-08-24)
  - **Target Version**: Workers, 2026-08
  - **Stance**: `opposes` `CAN-5` on `CR-6`
  - **Notes / Context**: A Worker sitting in front of everything converts a free
    Vercel edge request into a paid Cloudflare request. It only wins where the
    Vercel request it replaces was a **function** request at ~$8.24/M (`EV-4`),
    not an edge request at $0.

- **`EV-20`**:
  - **Claim**: The largest available target for a Worker — the `app/api/proxy`
    hop — is per-user authenticated traffic. Moving it to a Worker means
    `MARKET-TOKEN` is read, and backend service tokens are held, at Cloudflare.
  - **Epistemic Status**: `INFERENCE`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: `app/api/proxy/route.ts` (reads the auth cookie via
    `utils/server/tokenManager`, resolves a per-service token with
    `fromServiceToken`, forwards to one of six backends)
  - **Target Version**: `main` @ `136846d5`
  - **Stance**: `opposes` `CAN-5` on `CR-2` and `CR-8`
  - **Notes / Context**: This is the candidate's central problem. The hop is
    valuable to move *because* it is high-volume and low-CPU; it is dangerous to
    move *because* it is the auth boundary. It also cannot be cached at all, so
    moving it saves invocation and memory cost but adds a Worker request for
    every single call — trading ~$8.24/M for $0.30/M plus a second copy of the
    token-handling logic to keep correct in two places forever.

### `CAN-6`: Leave Vercel for Cloudflare Workers entirely

- **`EV-21`**:
  - **Claim**: The app has already been made able to run on Cloudflare Workers on
    the branch `ticket/vercel-cloudflare-runtime-compat`, and a size gate was
    built to measure the result against Cloudflare's limits: **3 MiB gzipped on
    the free plan, 10 MiB on the paid plan**. The measured bundle was
    **11.42 MiB gzipped** — over the paid limit, with `handler.mjs` alone at
    9.13 MiB.
  - **Epistemic Status**: `FACT` (the limits and the script) / `INFERENCE` (the
    11.42 MiB figure is a recorded prior measurement, not re-run for this work
    item)
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: `scripts/worker-size.mjs` on
    `origin/ticket/vercel-cloudflare-runtime-compat` (commits `7f1ee003`,
    `0f70a1a6`, `5305c06c`, `9a4e9804`), `.github/workflows/worker-build.yml`
  - **Target Version**: OpenNext Cloudflare adapter, as built on that branch
  - **Stance**: `opposes` `CAN-6` on `CR-1` and `CR-5`
  - **Notes / Context**: OpenNext packs every page, route handler and dependency
    into one Worker, so this is a pass/fail deployability limit, not a
    performance concern. It is 1.42 MiB over the paid ceiling.

- **`EV-22`**:
  - **Claim**: `proxy.ts` is Next.js 16 middleware running on the Node runtime,
    and the OpenNext Cloudflare adapter rejects Node middleware — the documented
    blocker for running this app on Workers at all.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: `proxy.ts` in this repository; the prior
    `vercel-cloudflare-runtime-compat` work
  - **Target Version**: Next.js 16 / OpenNext, 2026
  - **Stance**: `opposes` `CAN-6` on `CR-1`
  - **Notes / Context**: `proxy.ts` is also a protected runtime path in
    `CLAUDE.md`. Between this and `EV-21`, `CAN-6` fails on capability before
    cost is even discussed.

### Added at `recommend`, after advisory review

- **`EV-23`**:
  - **Claim**: **`proxy.ts` does not run on every request.** Its matcher excludes
    `api`, `ingest`, `_next`, `static`, sitemaps, `robots`, `manifest.json`, the
    asset folders and any path containing a dot; and its `missing:` clause skips
    requests carrying `purpose: prefetch`, `next-router-prefetch`, `next-action`
    (Server Actions) or `next-router-state-tree` (RSC navigations). It therefore
    runs on **full document navigations only**, and **never** on the
    `app/api/proxy` hop.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: `proxy.ts:674-694` in this repository, read 2026-08-24
  - **Target Version**: `main` @ `136846d5`
  - **Stance**: `opposes` the framing's own stated constraint; `neutral` on candidates
  - **Notes / Context**: `CLAUDE.md` says this file "runs on every request", and
    `intake.md` and `framing.md` repeated it as a constraint "taken from the
    repository, not assumed". It was assumed. The correction matters twice: the
    middleware is a smaller share of the bill than the framing implied, and
    `CAN-5`'s target — the `/api/proxy` hop — never touches middleware at all, so
    a Worker taking it over would not have to reproduce locale routing, country
    detection or the staging gate. That makes `CAN-5` *simpler* than this
    research first assumed, not harder.

- **`EV-24`**:
  - **Claim**: **There are 3 million more function invocations than there are
    edge requests** — 7,207,760 invocations against 4,150,778 Edge Requests. More
    than one function invocation is being billed per incoming request, and/or
    invocations are being billed with no incoming request behind them.
  - **Epistemic Status**: `FACT` (the numbers) / `UNKNOWN` (the cause)
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt`
  - **Target Version**: April 2026
  - **Stance**: `neutral`; it undermines the sizing of `CAN-2`, `CAN-5`, `CAN-8`
  - **Notes / Context**: This is the invoice's central unexplained fact and no
    earlier stage noticed it. Candidate causes: middleware billed as a separate
    invocation alongside the page render on the same request; server components
    calling the app's own `/api/*` routes over the network; ISR regeneration;
    cron. Until it is known which, **every estimate of "requests we could stop
    reaching a function" is built on an unexamined model** — including the claim
    that caching a page removes its cost, when the page may be two invocations.
    Raised as `OQ-6`.

- **`EV-25`**:
  - **Claim**: Fast Origin Transfer is the **largest single line on the invoice**
    — $25.43, 41.8% of the $60.86 usage — and works out at roughly **14 KB of
    function↔CDN traffic per invocation** (100.36 GB ÷ 7,207,760). Because every
    browser and mobile call to the six backends is relayed through
    `app/api/proxy`, each backend payload crosses Vercel's origin boundary as
    both an incoming and an outgoing byte count.
  - **Epistemic Status**: `FACT` (the line and the division) / `INFERENCE` (that
    relaying is what drives it)
  - **Source Authority**: `PRIMARY_VENDOR` + `PRIMARY_TECHNICAL`
  - **Source Citation**: `vercel-invoice.txt`; `app/api/proxy/route.ts`;
    https://vercel.com/docs/manage-cdn-usage — "Usage is incurred on both the
    input and output data transfer"
  - **Target Version**: April 2026 / `main` @ `136846d5`
  - **Stance**: `supports` `CAN-8` on `CR-6`
  - **Notes / Context**: No candidate frozen at `frame` attacked this line at its
    source. That is why `CAN-8` was added. Note the honest limit: reducing the
    relay means letting the browser talk to a backend directly for allow-listed
    public reads, which changes the security posture the relay exists to
    provide. It is named here as a real option, not as an easy one.

- **`EV-26`**:
  - **Claim**: **Cloudflare Free and Pro do not support partial (CNAME) setup** —
    it is Business and Enterprise only. On Free or Pro, using Cloudflare means a
    **full nameserver change**, moving authoritative DNS for the entire domain
    (MX, TXT, SPF/DKIM, every subdomain) to Cloudflare, not just the storefront
    hostname.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/dns/zone-setups/partial-setup/
    — plan availability row reads `No | No | Yes | Yes` for Free / Pro / Business
    / Enterprise. Retrieved 2026-08-24.
  - **Target Version**: Cloudflare DNS, 2026-08
  - **Stance**: `opposes` `CAN-3`, `CAN-4`, `CAN-5` on `CR-8`
  - **Notes / Context**: A materially larger blast radius than "point the
    storefront at Cloudflare", and it was missing from the risk analysis. A
    mistake during the nameserver move takes down **email** as well as the site,
    and it is not reversible in minutes — it is reversible in however long DNS
    takes to propagate.

- **`EV-27`**:
  - **Claim**: Cloudflare provides **unmetered DDoS mitigation at layers 3, 4 and
    7 on all plans, including Free**, with no cap on attack size, type or
    duration.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://developers.cloudflare.com/ddos-protection/ and
    https://www.cloudflare.com/plans/free/ (retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `supports` `CAN-3`, `CAN-4`, `CAN-5` on `CR-4`
  - **Notes / Context**: Recorded because its absence was one-sided. The earlier
    draft credited Vercel's included protection (`EV-15`) and never credited
    Cloudflare's, while listing Cloudflare's WAF weaknesses in detail (`EV-16`).
    On `CR-4` the fair statement is: Cloudflare is **stronger** at volumetric
    L3/L4 attack absorption and **weaker** at expressing the specific
    application-level rules this app needs.

- **`EV-28`**:
  - **Claim**: Cloudflare Workers limits, quoted: requests "100,000/day" on Free
    and "No limit" on Paid; script size after compression "3 MB" Free and "10 MB"
    Paid; CPU time per request "10 ms" Free and "5 min (default: 30 seconds)"
    Paid; maximum request body size "100 MB" on both Free and Pro.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/workers/platform/limits/
    (retrieved 2026-08-24)
  - **Target Version**: Workers, 2026-08
  - **Stance**: `supports` `EV-21`; `neutral` otherwise
  - **Notes / Context**: Added to give `EV-18` and `EV-21` quoted numbers rather
    than paraphrase. It independently confirms the 3 MB / 10 MB ceilings that
    `scripts/worker-size.mjs` gates against, so `CAN-6`'s disqualification rests
    on Cloudflare's own published limit, not only on our script's constants. The
    100 MB body cap is comfortably above anything the storefront posts.

### Added at the second `evidence` pass, after the owner re-framed the question

- **`EV-29`**:
  - **Claim**: **The free allowances are 1.22× and 2.41× away, not far away.**
    Fast Data Transfer at 840.89 GB is **1.22×** below the 1 TB allowance; Edge
    Requests at 4,150,778 are **2.41×** below the 10 M allowance. Beyond those
    multiples the lines start billing at $0.20/GB and $2.20/M (`dxb1`).
    Modelling the whole invoice as traffic multiplies:

    | Traffic | Fast Data Transfer | Edge Requests | Origin work | **Total/month** | Bandwidth share |
    |---|---|---|---|---|---|
    | **1× (today)** | $0 | $0 | $59 | **$61** | 0% |
    | **2×** | $132 | $0 | $119 | **$250** | 53% |
    | **5×** | $636 | $24 | $297 | **$957** | 66% |
    | **10×** | $1,477 | $69 | $594 | **$2,140** | 69% |
    | **100×** | $16,613 | $891 | $5,938 | **$23,442** | **71%** |

  - **Epistemic Status**: `INFERENCE` — linear scaling of April's usage against
    published `dxb1` rates. The rates are `FACT`; the linearity is an assumption.
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: `vercel-invoice.txt`;
    https://vercel.com/docs/pricing/regional-pricing/dxb1;
    https://vercel.com/docs/plans/pro-plan
  - **Target Version**: April 2026 usage, 2026-08 rates
  - **Stance**: **`supports` `CAN-3`, `CAN-4`, `CAN-5` on `CR-9` and `CR-3`;
    `opposes` `CAN-1`**
  - **Notes / Context**: **This reverses the first round's central finding.**
    `EV-1` said the delivery lines bill $0.00 and concluded a CDN in front saves
    nothing. That is true at 1× and false at every multiple above about 1.22×.
    From 2× onward **bandwidth is the majority of the bill**, and by 100× it is
    **71%** — and bandwidth is precisely what a CDN in front absorbs.
    Two independent checks that the 100× row is not fantasy: it lands at
    **$23.4 K/month**, and this repository's own
    `docs/vercel-vs-aws-hosting-analysis.md` independently modelled ~1 M DAU
    hosting on Vercel at **~$18–22 K/month** (`EV-31`). Two different methods,
    same order of magnitude.
    **The honest caveat:** linear scaling is crude. Per-customer traffic will not
    stay constant, caching would change the origin column, and an unknown share
    of today's 840 GB is bots and development traffic rather than customers, so
    the multiplier from "20 customers" to "1 M DAU" is certainly not 50,000×.
    The table should be read as *what happens as traffic multiplies*, not as a
    forecast tied to a user count.

- **`EV-30`**:
  - **Claim**: **Vercel does not bill for traffic its firewall blocks.** "WAF
    deny, challenge, or rate-limit mitigated traffic does not incur CDN Requests
    or Fast Data Transfer (FDT). Requests that pass a challenge and continue to
    your application count toward normal usage." The same applies to "persistent
    actions, DDoS mitigation, Attack Mode, and IP blocking", all of which are
    free on all plans.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing
    (`last_updated: 2026-06-16`, retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `supports` `CAN-1` on `CR-12`
  - **Notes / Context**: **This partly corrects the owner's premise, and it
    should be said plainly rather than buried:** a recognised DDoS does *not*
    multiply the Vercel bill. Vercel absorbs it free, as Cloudflare does
    (`EV-27`). On volumetric attacks the two platforms are close to a draw. The
    exposure is narrower than "the cost will be doubled multiple times" — but it
    is not zero, which is `EV-31`.

- **`EV-31`**:
  - **Claim**: The exposure that **is** real: Vercel bills for "requests that are
    successfully served prior to us automatically mitigating the event", and for
    "requests that are not recognized as a DDoS event, which may include bot and
    crawler traffic". Vercel Community reports describe attack traffic consuming
    the Edge Request quota, with the consumed quota not automatically restored.
  - **Epistemic Status**: `FACT` (the vendor wording) / `COMMUNITY` (the quota
    reports)
  - **Source Authority**: `PRIMARY_VENDOR` + `COMMUNITY`
  - **Source Citation**: https://vercel.com/docs/vercel-firewall/ddos-mitigation;
    community.vercel.com thread "Why challenged DDoS requests count as Edge
    Requests on Vercel Pro Plan" (retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `supports` `CAN-3`, `CAN-4` on `CR-12`; `opposes` `CAN-1`
  - **Notes / Context**: The real attack-cost risk is not the loud volumetric
    flood — both platforms handle that free. It is **abuse that never looks like
    an attack**: scrapers, price-monitoring bots, aggressive crawlers, and
    low-and-slow request floods that stay under any threshold. That traffic is
    billed on Vercel at full rate, and at 100× scale it is billed against a
    bandwidth line costing $0.20/GB. Behind Cloudflare the same traffic still
    costs **bandwidth of $0**, because Cloudflare does not meter CDN egress at
    all. That asymmetry, not DDoS, is the `CR-12` argument.

- **`EV-32`**:
  - **Claim**: **Cloudflare's self-serve terms restrict serving large media
    through the CDN.** "Unless you are an Enterprise customer, Cloudflare offers
    specific Paid Services (e.g., the Developer Platform, Images, and Stream)
    that you must use in order to serve video and other large files via the CDN",
    and Cloudflare reserves the right to "disable or limit your access to or use
    of the CDN … if you use or are suspected of using the CDN without such Paid
    Services to serve video or a disproportionate percentage of pictures, audio
    files, or other large files."
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://www.cloudflare.com/service-specific-terms-application-services/
    (retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `opposes` `CAN-3`, `CAN-4` on `CR-3` and `CR-5` **at scale only**
  - **Notes / Context**: This is the serious limit on "Cloudflare bandwidth is
    free", and it must not be waved away — the whole scale case rests on egress
    being unmetered, and these terms are the condition on that. Two facts make it
    survivable here: `CLAUDE.md` records that **product images and story videos
    are served from a separate media server**, not through this app; and the
    invoice shows only **1,902 image transformations**, so almost nothing is
    flowing through `next/image` either. At **212 KB average per edge request**
    (840.89 GB ÷ 4,150,778) the profile looks like JavaScript bundles, HTML and
    RSC payloads — which is exactly what Cloudflare's CDN is for. But nobody has
    confirmed what the 840 GB actually is. See `OQ-9`.

- **`EV-33`**:
  - **Claim**: This repository already contains a scale analysis reaching the
    same conclusion. `docs/vercel-vs-aws-hosting-analysis.md` models ~1 M DAU
    hosting on Vercel at **~$18–22 K/month** against ~$5–8 K for servers behind
    Cloudflare, and states: "once compute is cached away, you're mostly paying
    for bandwidth, **where Cloudflare wins**." Its top two cost-cutting
    recommendations are (1) turn on caching and (2) stop routing mobile traffic
    through the app's proxy.
  - **Epistemic Status**: `FACT` (that the document says it) / `INFERENCE` (its
    numbers)
  - **Source Authority**: `AUTHORITATIVE_SECONDARY` — an internal analysis, not
    independently verified here
  - **Source Citation**: `docs/vercel-vs-aws-hosting-analysis.md` §1, §3, §8
  - **Target Version**: as committed
  - **Stance**: `supports` `CAN-2`, `CAN-3`, `CAN-8` on `CR-9`
  - **Notes / Context**: **This should have been read against the candidates at
    the first `research` pass and was not.** It was cited in `framing.md` §2 as
    background and then never used as evidence — which is how a research item
    ended up recommending the status quo in a repository that already held a
    written argument against it. Its recommendations (1) and (2) map exactly onto
    `CAN-2` and `CAN-8`. Its warning about the trade-off on caching — "prices and
    stock can lag up to the cache window — solve with event-based cache refresh,
    which the repo already supports via `/api/revalidate`" — is also the answer
    to the `CR-1` objection that made `CAN-2` `UNKNOWN` in the first round.

### Added at the third `evidence` pass — Workers for the middleware and the relay

- **`EV-34`**:
  - **Claim**: **The two platforms bill the opposite halves of a relay.**
    Cloudflare Workers bill **CPU time only** — "No charge or limit for
    duration" — and "Cloudflare does not bill for subrequests you make from your
    Worker", so time spent waiting on a backend is **not billed**. Vercel bills
    **Provisioned Memory for the entire instance lifetime**, and "Vercel bills
    Active CPU only while your code is actually running. If the request is
    waiting on I/O, CPU billing pauses but **memory billing continues**."
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL` (Cloudflare) + `PRIMARY_VENDOR` (Vercel)
  - **Source Citation**: https://developers.cloudflare.com/workers/platform/pricing/;
    https://vercel.com/docs/functions/usage-and-pricing — both retrieved 2026-08-24
  - **Target Version**: 2026-08
  - **Stance**: **`supports` `CAN-5b` on `CR-6`, `CR-9` — strongly**
  - **Notes / Context**: **This is the finding the owner's question exposed, and
    no earlier pass had it.** `app/api/proxy/route.ts` is a relay: it reads a
    cookie, resolves a token, and waits on one of six backends. Nearly all of its
    wall time is backend wait. That is the single worst-priced workload shape on
    Vercel's Fluid model and the single best-priced shape on Workers. It explains
    the invoice directly: **Provisioned Memory ($17.61) is larger than Active CPU
    ($11.52)** — we are paying more to wait than to compute.

- **`EV-35`**:
  - **Claim**: Vercel's own documentation warns that middleware can **double**
    origin transfer: "If using Middleware, it is possible to accrue Fast Origin
    Transfer twice for a single Function request. To prevent this, you want to
    only run Middleware when necessary."
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_VENDOR`
  - **Source Citation**: https://vercel.com/docs/manage-cdn-usage (retrieved 2026-08-24)
  - **Target Version**: 2026-08
  - **Stance**: `supports` `CAN-5a` on `CR-6`
  - **Notes / Context**: Collected at the first evidence pass and **never applied
    to a candidate** — it sat inside the general caching guidance and was read
    only for its caching advice. It also helps explain `EV-24`'s unexplained
    3 M invocations: on a document navigation, middleware and the render can
    each be billed. `EV-23` bounds the prize, though — the matcher already
    excludes `api`, `_next`, static assets, prefetches, Server Actions and RSC
    navigations, so this doubling applies only to full document navigations,
    which are the minority of traffic. `CAN-5a` is the small prize.

- **`EV-36`**:
  - **Claim**: Costed against the same workload, the relay is roughly **12× to
    24× cheaper on Workers**, and the gap widens with traffic. Assuming 2 ms CPU
    per relayed request on Workers Paid ($5/month, 10 M requests and 30 M CPU-ms
    included, then $0.30/M requests and $0.02/M CPU-ms):

    | Traffic | Vercel origin work (linear) | Same on Workers | Ratio |
    |---|---|---|---|
    | 1× (today) | $59 | **$5.00** | 12× |
    | 10× | $594 | **$25.91** | 23× |
    | 100× | $5,938 | **$246.46** | 24× |

  - **Epistemic Status**: `INFERENCE` — the rates are `FACT` (`EV-18`, `EV-28`,
    `EV-34`); the 2 ms CPU estimate and linear scaling are assumptions.
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: derived from `vercel-invoice.txt` and
    https://developers.cloudflare.com/workers/platform/pricing/
  - **Target Version**: 2026-08
  - **Stance**: `supports` `CAN-5b` on `CR-6` and `CR-9`
  - **Notes / Context**: **Two honest caveats, and they matter.** First, the
    Vercel column is the *whole* origin bill, and `OQ-2` means we do not know
    what share of it is the relay — so the saving is an upper bound, not a
    forecast. Second, 2 ms of CPU per request is an estimate; at 10 ms it would
    still fit inside the included allowance at 1× but would cost more at scale.
    Even discounted heavily, the direction is not in doubt, because it comes from
    a structural difference in what the two platforms meter (`EV-34`), not from a
    rate comparison.
    **`CAN-5b` and `CAN-3` are complementary, not competing.** `CAN-3` removes
    the bandwidth column (71% of the bill at 100×); `CAN-5b` removes the origin
    column (25%). Together they address roughly **95%** of the projected
    `EV-29` bill. And `CAN-3` is the prerequisite that makes `CAN-5b` cheap: once
    traffic already passes through Cloudflare, adding a Worker on two paths is an
    increment, not a new architecture.

- **`EV-37`**:
  - **Claim**: The relay is **not a thin passthrough**. `app/api/proxy/route.ts`
    is 319 lines and carries: service-identifier decoding (`fromServiceToken`), a
    server allowlist (`isAllowedServer`), per-server auth token resolution
    (`getTokenForServer`), secure request logging (`logSecureRequest`), a
    deliberately indistinguishable failure response, repeated percent-decoding to
    defeat encoded-path tricks, and a **hard block on `SEND_OTP`** checked three
    ways against the target URL, the decoded target and the decoded path.
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: `app/api/proxy/route.ts:1-319`, specifically lines 73,
    84, 170-172, 205, 241
  - **Target Version**: `main` @ `136846d5`
  - **Stance**: **`opposes` `CAN-5b` on `CR-2`, `CR-4`, `CR-7`**
  - **Notes / Context**: This is the real price of `CAN-5b` and it must be set
    against `EV-36` rather than mentioned after it. Moving the relay means moving
    an allowlist, a token boundary and an anti-abuse block to another vendor's
    runtime — and if any of it is left behind, it is not enforced. The OTP block
    in particular exists because that endpoint is abused; a Worker that forwards
    without reproducing all three of its checks silently reopens it. `CAN-5b` is
    a security change that happens to save money, not a cost optimisation that
    happens to touch security, and it should be planned as one.

- **`EV-38`**:
  - **Claim**: Workers limits are comfortable for a relay: **50 subrequests per
    invocation on Free, 10,000 on Paid**; "up to six connections simultaneously
    waiting for response headers"; response body size has "No enforced limit";
    request body up to 100 MB on Free and Pro (`EV-28`).
  - **Epistemic Status**: `FACT`
  - **Source Authority**: `PRIMARY_TECHNICAL`
  - **Source Citation**: https://developers.cloudflare.com/workers/platform/limits/
    (retrieved 2026-08-24)
  - **Target Version**: Workers, 2026-08
  - **Stance**: `supports` `CAN-5b` on `CR-5`
  - **Notes / Context**: The relay makes one subrequest per call, so none of
    these limits binds. Cloudflare's guidance to use `TransformStream` "instead
    of buffering entire payloads in memory" is the correct pattern here and would
    also avoid re-introducing the buffering concern that `OQ-7` raises for
    streaming responses.

---

## 3. Evidence Conflicts

- **Conflict `C-1`: does a proxy in front break the client IP?**
  - **Source A**: https://vercel.com/docs/security/reverse-proxy (`PRIMARY_VENDOR`)
    — "Real end-user IP addresses cannot be accurately identified."
  - **Source B**: the same page, further down (`PRIMARY_VENDOR`) — Cloudflare is
    listed under **Verified Proxy Lite**, automatically enabled on all plans via
    the built-in `CF-Connecting-IP` header, "No additional configuration
    required."
  - **Analysis & Impact**: Not a real contradiction, but the page reads as one
    and it matters. The warning is the general case for an unrecognised proxy;
    Cloudflare is a recognised one. **Resolution: for Cloudflare specifically,
    the client IP is preserved.** `EV-14` is the operative fact; the headline
    warning is not. This raises confidence in `CAN-3`/`CAN-4` on `CR-4` and is
    the single biggest correction this evidence stage produced.

- **Conflict `C-2`: published rates vs the invoice.**
  - **Source A**: `vercel-invoice.txt` (`PRIMARY_VENDOR`) — Active CPU $11.52,
    Provisioned Memory $17.61, Fast Origin Transfer $25.43.
  - **Source B**: the `dxb1` and Fluid rate tables (`PRIMARY_VENDOR`) — which
    predict $13.92, $20.54 and $30.11 for the same usage.
  - **Analysis & Impact**: A 14–17% shortfall on the three large region-priced
    compute lines, while Function Invocations — priced from the same page — comes
    out 0.8% **over**. No explanation is preferred; `EV-8` lists four and rules
    none out. **Impact on confidence: low for the decision, high for the
    sizing.** The *relative* size of the lines is not in doubt, and that is what
    the decision rests on. But it means **no candidate's saving may be quoted
    from the published rate table** — only from what was actually billed. `EV-7`
    was restated on that basis: the region lever is worth "up to about $20",
    derived from the $25.43 charged, not "$30.11 vs $6.02" as first written.
    See `OQ-1`.

---

## 4. Open Questions & Unknowns

> **Reclassified at `recommend`, after advisory review.** `OQ-1` and `OQ-2` were
> both marked `NON_CRITICAL_UNKNOWN` on the reasoning that they "change how big a
> number is, not which candidate wins". That was wrong in both cases and is
> corrected below.

- **`OQ-1`**: Which region(s) do the functions actually run in, and what is the
  split? — **`CRITICAL_UNKNOWN` for `CAN-7`** (`NON_CRITICAL` for every other
  candidate) — affects `CR-6`. **If the project is already deployed in a cheap
  region, `CAN-7`'s saving is $0 and the candidate does not exist.** It does not
  merely resize the lever; it decides whether there is one. Nothing in this
  repository records the region (`next.config.ts` and `vercel.json` set none, and
  no route declares `preferredRegion`), so it cannot be answered from the code —
  only from Vercel dashboard → Usage → filter by Region. `EV-8` is weak evidence
  *against* an expensive region: every region-priced compute line billed ~15%
  below the `dxb1` rate.
- **`OQ-2`**: What share of the 7.2 M invocations is `app/api/proxy` versus page
  renders versus middleware versus the app's own server-side calls to its
  `/api/*` routes? — **`CRITICAL_UNKNOWN` for `CAN-5` and `CAN-8`**
  (`NON_CRITICAL` elsewhere) — affects `CR-6`. It is the question that makes
  `CAN-5` `INELIGIBLE_PENDING_EVIDENCE`, so by definition it decides a
  candidate's eligibility. Widened at `recommend` to include middleware and
  internal self-calls, because `EV-24` shows the earlier three-way split cannot
  account for the invocation count. Answerable from Vercel Observability.
- **`OQ-3`**: Is April 2026 a representative month? — `NON_CRITICAL_UNKNOWN` —
  affects every candidate on `CR-6` and `CR-9`. One invoice is one data point,
  and `EV-3` shows Fast Data Transfer already at 84% of allowance; whether that
  is trending up is the difference between "no Cloudflare candidate pays" and
  "one of them will next quarter".
- **`OQ-4`**: Would moving the function region to a cheaper one increase
  Provisioned Memory (longer backend waits, per `EV-5`) by more than it saves on
  Fast Origin Transfer? — `NON_CRITICAL_UNKNOWN` — affects `CAN-2` on `CR-6` and
  `CR-11`. Only a measurement can answer it, and only if `CAN-2` is chosen.

- **`OQ-5`**: What rules are actually configured in the Vercel Firewall
  dashboard? — `CRITICAL_UNKNOWN` for `CAN-4` — affects `CR-4`. Nothing can be
  moved to Cloudflare, audited, or rebuilt without that inventory, and today it
  exists only in a dashboard that no artifact in this repository mirrors. Raised
  during evaluation.
- **`OQ-6`**: Why are there 7.2 M invocations against 4.15 M edge requests
  (`EV-24`)? — `CRITICAL_UNKNOWN` for `CAN-2`, `CAN-5` and `CAN-8` — affects
  `CR-6`. Until the extra 3 M invocations are attributed, no candidate's saving
  can be sized, including whether caching a page removes one invocation or two.
- **`OQ-7`**: Does the app's request path actually survive behind Cloudflare? —
  `CRITICAL_UNKNOWN` for `CAN-3`, `CAN-4`, `CAN-5` — affects `CR-5`. `CR-5` has
  five clauses and **no evidence item addresses four of them**: Next 16 streaming
  RSC responses through Cloudflare's buffering/compression, HttpOnly cookie
  writes from Server Actions, `next/image` optimisation, and what an
  orange-clouded apex does to `*.vercel.app` preview deployments and the `main`
  staging gate. No independent report was found in either direction.
- **`OQ-8`**: Does moving the function region increase Provisioned Memory
  (longer backend waits, per `EV-5`) by more than it saves on Fast Origin
  Transfer? — `NON_CRITICAL_UNKNOWN` — affects `CAN-7` on `CR-6` and `CR-11`.
  Renumbered from the original `OQ-4`, which is retained below unchanged.

- **`OQ-9`**: What is the 840.89 GB of Fast Data Transfer actually made of? —
  `CRITICAL_UNKNOWN` for `CAN-3` and `CAN-4` — affects `CR-3` and `CR-5`. The
  whole scale case for Cloudflare rests on its egress being unmetered, and
  `EV-32` shows that is conditional on **not** serving "a disproportionate
  percentage of pictures, audio files, or other large files" on a self-serve
  plan. The 212 KB average per request and the near-zero image-transformation
  count both suggest bundles and HTML rather than media, but suggestion is not
  evidence. Answerable from Vercel Observability, broken down by path.
- **`OQ-10`**: Does `docs/vercel-vs-aws-hosting-analysis.md` still hold? —
  `NON_CRITICAL_UNKNOWN` — affects `CR-9`. `EV-33` is an internal document whose
  own §9 lists assumptions and risks, and this research did not re-derive its
  numbers. It is used here only as a second opinion agreeing with `EV-29`, not as
  a source of figures.

**Coverage assessment: `PARTIAL` — corrected at `recommend`, and again after the
owner re-framed the question. The first-round assessment below is retained
because the correction to it is the substance.**

> **Second-round note (2026-08-24).** The whole coverage judgement below was
> written against the question "does Cloudflare cut this bill". Under the
> re-framed question it is wrong in its most important line: it says the evidence
> is "**sufficient** to answer the question the work item asks … because that
> answer turns on `EV-1` (the delivery lines already bill $0.00), which is not in
> doubt." `EV-1` is still not in doubt — and `EV-29` shows it stops being true at
> about **1.22× today's traffic**. Evidence that is sufficient for one month and
> silent about every month after it was never sufficient for a decision about
> infrastructure. Coverage for the re-framed question is `PARTIAL`, blocked
> principally on `OQ-9`. The earlier
assessment read `SUFFICIENT` and stated that "no `CRITICAL_UNKNOWN` was found".
Both statements were wrong, and the second contradicted the same document, which
had already made `OQ-2` the reason `CAN-5` could not be recommended. The position
now:

- **Sufficient** to answer the question the work item asks — *should Cloudflare
  go in front of Vercel to cut this bill* — because that answer turns on `EV-1`
  (the delivery lines already bill $0.00), which is not in doubt.
- **Not sufficient** to size any of the alternatives. `OQ-1` governs whether
  `CAN-7` exists at all; `OQ-2` and `OQ-6` govern whether `CAN-5` and `CAN-8` are
  worth anything; `OQ-7` governs whether the Cloudflare candidates are even
  deliverable.
- **This does not warrant a `blocked` outcome.** A `CRITICAL_UNKNOWN` blocks when
  it prevents a trustworthy recommendation. It does not here, because the
  recommendation that follows deliberately does not depend on any of them — it
  recommends measuring them. Had the recommendation been "switch region and save
  $20", `OQ-1` would have blocked it, and rightly.
