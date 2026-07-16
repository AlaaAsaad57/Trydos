# PostHog Cost Analysis — Trydos (2M MAU / 4M total users)

> **Scope:** cost-focused comparison of PostHog Cloud vs. PostHog self-hosted vs.
> Google Analytics, grounded in Trydos's **actual** instrumentation and current
> public pricing. **Last updated:** 2026-06-28.
>
> **Audience numbers (given):** ~**2,000,000 monthly active users (MAU)**,
> **~4,000,000 total registered users**, 4 countries (Syria, Turkey, Iraq, Lebanon).

---

## 0. What we run today (verified from code)

| Fact | Source | Cost implication |
|---|---|---|
| **PostHog Cloud — EU region** (`eu.posthog.com`) | `utils/posthog.ts` | Managed; billed on events/recordings |
| Reverse-proxied via `/ingest` (Next.js route on Vercel) | `app/ingest/[...path]/route.ts`, `next.config.ts` | **Every event also costs Vercel Function time** |
| Autocapture + pageviews + pageleave + exception capture **ON** (`defaults: "2025-05-24"`) | `utils/posthog.ts` | Largest, least-curated event stream |
| `person_profiles: "identified_only"` | `utils/posthog.ts` | Guests = events, no profile (cost control already in place) |
| **Session replay DISABLED** (`disable_session_recording: true`) | `utils/posthog.ts` | Replay was the dominant cost driver; intentionally off |
| ~**110 documented custom events** across 5 streams | `docs/posthog-events.md` | On top of autocapture |
| **GA → PostHog fan-out**: every GA event is also sent to PostHog | `utils/gtag.ts:GAevent` | 48 GA-taxonomy events **double-billed** into PostHog |
| GA4 **standard** (free tier), ID `G-2R7L674HT6` | `utils/gtag.ts` | Sampling/cardinality limits at our scale |
| Feature flags wired but **unused** | `utils/posthog.ts` | No flag cost today |

---

## 1. The swing factor: event volume

PostHog bills on **events**, not users. The entire bill depends on **events per
MAU per month**. With autocapture + pageviews + pageleave on, plus ~110 custom
events and the GA fan-out, a live-shopping app sits on the high side. Three
transparent scenarios off **2M MAU**:

| Scenario | Events / MAU / mo | Total events / mo |
|---|---|---|
| Conservative | 50 | 100 M |
| **Expected** | **150** | **300 M** |
| Heavy | 300 | 600 M |

> **Action:** replace this assumption with the real figure from
> **PostHog → Billing → Usage**. Events/MAU moves the answer more than any other input.

---

## 2. PostHog Cloud cost (current setup, replay OFF)

Current PostHog **product-analytics event** pricing (first 1M free; marginal rate
falls with volume):

| Monthly events | Marginal $/event |
|---|---|
| First 1 M | Free |
| 1–2 M | $0.0000500 |
| 2–15 M | $0.0000343 |
| 15–50 M | $0.0000295 |
| 50–100 M | $0.0000218 |
| 100–250 M | $0.0000150 |
| 250 M+ | $0.0000090 |

Applied to our scenarios:

| Volume | Monthly | Annual |
|---|---|---|
| 100 M events | **$2,618** | ~$31.4 k |
| **300 M events (expected)** | **$5,318** | **~$63.8 k** |
| 600 M events | **$8,018** | ~$96.2 k |

**Not in the PostHog invoice — but real:**

- **Vercel Function cost of `/ingest`** — every event round-trips through Vercel
  functions. Pull the actual number from Vercel usage; it is a separate line item.
- **Session replay if re-enabled** — at **10% session sampling** (~1M web
  recordings/mo) ≈ **+$1,718/mo (~$20.6k/yr)**; at 100% ≈ ~10× that. This is why
  it is disabled — if re-enabled, keep it sampled.

### Session replay pricing (web/desktop recordings)

| Monthly recordings | $/recording |
|---|---|
| First 5 k | Free |
| 5–15 k | $0.0050 |
| 15–50 k | $0.0035 |
| 50–150 k | $0.0020 |
| 150–500 k | $0.0017 |
| 500 k+ | $0.0015 |

---

## 3. PostHog self-hosted

To run PostHog's stack (ClickHouse + Kafka + Postgres + Redis + workers) at
~300M events/mo:

| Component | Monthly |
|---|---|
| Infra (multi-node ClickHouse cluster + supporting services, AWS) | $3,000 – $8,000 |
| Ops / maintenance (~0.3 FTE, loaded) | ~$3,750 |
| **Total** | **~$7,000 – 12,000/mo (~$84k – 144k/yr)** |

**Decisive points:**

1. **More expensive than Cloud** at our volume.
2. **PostHog no longer supports self-hosting at this scale** — the open-source
   Helm deployment is explicitly *not recommended* for production-scale volume.
   You would own ClickHouse reliability with **no vendor backstop**.
3. **Break-even** vs. Cloud doesn't arrive until **~600M–1B+ events/mo** — Cloud's
   marginal rate up there is only **$9 per million events**, while self-host fixed
   costs barely move. At 2M MAU we are far below break-even.

**Conclusion: self-hosting costs more and carries more risk at our scale.**

---

## 4. Google Analytics

- **GA4 standard (current):** $0, but at 4M users we hit reporting **sampling**,
  **cardinality** limits, and the ~10M-events/property soft ceiling — data quality
  degrades (a key reason PostHog runs alongside it).
- **GA4 360 (only paid GA tier):** floor **~$50k/yr** for **25M events/mo**
  included. Our ~300M/mo is **12×** that, so overages push it (contract-based,
  quote-only) into the **~$60k–100k+/yr** range.

---

## 5. Side-by-side (expected = 300M events/mo)

| Option | Annual cost | Session replay | Support / risk | Data ownership |
|---|---|---|---|---|
| **PostHog Cloud EU (current)** | **~$64k** (+ Vercel proxy) | optional, +~$20k/yr @10% | Managed, low risk | EU-hosted |
| PostHog self-hosted | ~$84k – 144k | included (infra) | **Unsupported at scale** | Full / self-run |
| GA4 360 | ~$60k – 100k+ | none | Managed | Google |
| GA4 standard | $0 | none | Sampled/limited at our scale | Google |

---

## 6. Recommendation

**Stay on PostHog Cloud (EU).** At 2M MAU it is cheaper than both self-hosting and
GA360 and is the lowest-operational-risk option. Then cut the bill at the source:

1. **Measure real events/MAU now** — replace the 150 assumption; it is the only
   number that materially changes the result.
2. **Trim the GA fan-out** — every GA event is double-billed into PostHog. If
   PostHog is the real analytics platform, dropping GA-standard (and the fan-out)
   removes duplicate event volume at no cost.
3. **Tame autocapture** — the largest, least-curated stream. Scoping autocapture
   (or disabling it in favor of the 110 explicit events) is the single biggest
   lever on event volume.
4. **Keep replay off or ≤10% sampled** — never 100% at this scale.

---

## 7. Can PostHog's AI recommend products per user? (asked by PM)

**Question:** *Can we ask PostHog's AI one prompt per user and get back the
product IDs that fit that user — based on their events plus other users'
activity?*

**Short answer: no — not in the way it was described.** PostHog's AI (**Max AI**)
is an *analyst inside the PostHog dashboard*: it writes queries, builds funnels,
and explains our data in the UI. It is **not** a runtime recommendation API you
call per-user to get product IDs, and there is no supported "one prompt per user →
their products" endpoint. Even if we scripted Max to do it, it would be too slow,
too costly, and rate-limited to power a live product feed.

Two things are being conflated:

1. **"Based on other users' activity"** — that is **collaborative filtering**
   ("people like you also bought…"), which is a **data/ML problem, not an LLM
   prompt**. No language model can hold every user's activity in its context, so
   asking it directly produces *plausible-but-made-up* product IDs, not real
   recommendations.
2. **A language model's actual strength** — *ranking and personalizing a
   shortlist you already hand it.* It cannot generate the candidates from the
   crowd; it can only re-order candidates you supply.

**What actually works** (two layers, and neither is "prompt PostHog per user"):

- **Recommendation signal (the "other users" part) — computed from data, cached.**
  A nightly batch job over the event data (PostHog HogQL export, or our own store)
  builds "viewed-also-viewed / bought-also-bought" per product. We also already
  run **Elasticsearch**, which gives content-based "more like this" for free.
- **Optional LLM layer.** Take those candidates + the user's recent events and
  send them to an LLM (via Vercel AI Gateway) for a final re-rank/explanation —
  one call per request, over *our* candidates, not over PostHog.

**Bottom line for planning:** treat PostHog as the **event source and offline
analysis tool**, not as the recommender. A "recommended for you" feature is
buildable, but it's an engineering project (candidate generation + caching, with
an optional LLM re-rank), **not** a PostHog AI prompt — and it carries no extra
PostHog line item beyond the query/export volume already covered above.

> **Caveat / to validate:** this reflects PostHog's product as understood at the
> time of writing. PostHog ships fast — confirm against their current
> [Max AI docs](https://posthog.com/docs/max-ai) before treating "no per-user
> recommendation API" as final.

---

## Sources

- [PostHog pricing](https://posthog.com/pricing)
- [GA4 360 pricing model — Cardinal Path](https://www.cardinalpath.com/blog/ua-360-vs-ga4-360-pricing-model)
- [GA4 vs GA4 360 — pricing/limits — OptimizeSmart](https://optimizesmart.com/blog/ga4-vs-ga4-360-pricing-limits-billing-and-more/)
- Internal: `utils/posthog.ts`, `utils/gtag.ts`, `docs/posthog-events.md`, `next.config.ts`, `app/ingest/[...path]/route.ts`

> **Caveat:** PostHog and GA360 pricing change over time, and the cost totals scale
> directly with the events/MAU assumption. Re-validate both against live usage and
> current price sheets before budgeting.
