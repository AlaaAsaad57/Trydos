# PostHog vs Smartlook — Analytics Platform Comparison

_Context: Trydos (Next.js 16 App Router · React 19 · Vercel · Go backend), a multilingual live-shopping storefront. Today the stack already runs **Google Analytics** (quantitative), **Sentry** (errors), and **Smartlook** (session replay). This document compares Smartlook with PostHog to decide whether to keep, replace, or complement._

> **Last reviewed:** 2026-06-12. Pricing and feature tiers for both vendors change often — treat the numbers below as directional and confirm against the live pricing pages before committing.

> ## ⚠️ Critical: Smartlook is End-of-Life
>
> Cisco (which acquired Smartlook in 2023) has issued a formal **End-of-Sale / End-of-Life** bulletin for Smartlook.com. This single fact dominates any honest comparison today:
>
> | Milestone | Date | Meaning |
> |---|---|---|
> | **End of Sale** | **2026-05-31** | Last day to order or create new accounts. Product enters maintenance mode; **no new features**. *(Already passed as of this review.)* |
> | **End of Renewal** | 2026-08-31 | Last day existing customers can renew or change subscriptions. |
> | **Last Date of Support / shutdown** | 2027-08-31 | Servers are turned off. |
>
> **Implications:** You can no longer sign up for Smartlook as a new customer. Existing accounts are frozen on features and have a hard ~14-month runway. Session replays are **not exportable**, so anything not migrated before shutdown is lost. Treat "keep Smartlook" not as a long-term option but as a **wind-down**, and any new analytics decision as effectively *"PostHog (or another alternative) vs. nothing."* Cisco is steering former Smartlook capability into **AppDynamics / Full-Stack Observability** (enterprise DEM), not a like-for-like standalone replacement.

> **Decision (2026-06-11):** Trydos migrated from Smartlook to **PostHog** (EU cloud). Smartlook (`smartlook-client` + `utils/smartlook.ts`) was removed; PostHog is wired via `utils/posthog.ts` (lazy-loaded, production-only) and initialised in `components/Home/Init.tsx`. The comparison below is retained as historical rationale.
>
> **Full wiring (2026-06-12):** every PostHog capability is now connected end-to-end:
> - **Replay + heatmaps + autocapture + SPA pageviews** — on via the `defaults: "2025-05-24"` preset in `posthogInit`. Heatmaps are powered by DOM autocapture (view in the PostHog toolbar).
> - **Ad-blocker-proof ingestion** — reverse-proxied through `/ingest/*` (rewrites in `next.config.ts`; `api_host: "/ingest"`). `proxy.ts` matcher excludes `ingest` so the i18n middleware doesn't rewrite it.
> - **Funnels / paths / retention** — `GAevent()` (`utils/gtag.ts`) fans every event out to `posthogCapture`, so the existing GA taxonomy (`utils/GAEvents.ts`: `add_to_cart` → `begin_checkout` → `add_payment_info` → `purchase`, etc.) populates PostHog with zero new call sites. Build the commerce funnel in the PostHog UI from these events.
> - **Error tracking** — `LogError` (`utils/functions.tsx`) routes exceptions to `posthogCaptureException`, linking each error to its session replay.
> - **Identity** — `posthogIdentify` on login (`services/auth.ts`, `Init.tsx`); `posthogReset` on logout (`clearAllUserData` in `utils/tinyUtils.tsx`) so guest sessions aren't stitched onto the previous user.
> - **Feature flags / experiments** — helpers `posthogIsFeatureEnabled` / `posthogGetFeatureFlag` ready for use (define flags in the PostHog dashboard).
>
> Verify on a **production/preview deploy** (all wrappers early-return when `NODE_ENV !== "production"`). Confirm `NEXT_PUBLIC_POSTHOG_KEY` is set in Vercel env, then check the Network tab for `/ingest/*` 200s and watch the live session land in the PostHog dashboard.

---

## TL;DR / Verdict

- **Smartlook** is a focused **session-replay + heatmap** tool with best-in-class **native mobile** recording. It answers _"what did this user actually do on screen?"_ It is light to integrate (already done here) but does not do product analytics, feature flags, or experimentation.
- **PostHog** is an all-in-one **product-analytics suite**: events/funnels/retention/paths, session replay, **feature flags**, **A/B experiments**, surveys, and even error tracking — with a SQL layer, a generous free tier, EU cloud, and a self-host/open-source option.

**Recommendation for Trydos:** With Smartlook now end-of-life (see banner above), "keep Smartlook" is no longer a long-term option — it's a wind-down. **PostHog** is the stronger pick regardless of goal: it does everything Smartlook did (replay + heatmaps) *plus* the product analytics, feature flags, and experiments an e-commerce storefront needs, under one identity graph, with a generous free tier and EU cloud. Trydos has already migrated (decision below). The only reason to evaluate other tools instead of PostHog would be a need for **best-in-class native-mobile replay**, where dedicated mobile-replay vendors may still edge it out.

---

## At-a-glance comparison

| Dimension | Smartlook | PostHog |
|---|---|---|
| **Primary category** | Session replay & heatmaps (qualitative) | Product analytics suite (qual + quant) |
| **Session replay** | ✅ Core strength | ✅ Strong (web + mobile) |
| **Heatmaps** | ✅ Click / scroll / mouse heatmaps | ✅ Heatmaps via toolbar |
| **Product analytics** (funnels, retention, paths) | ⚠️ Basic events & funnels | ✅ Deep, with HogQL/SQL |
| **Feature flags** | ❌ | ✅ |
| **A/B testing / experiments** | ❌ | ✅ |
| **Surveys** | ❌ | ✅ |
| **Error tracking** | ⚠️ JS error capture in replays | ✅ Dedicated error tracking (you already use Sentry) |
| **Native mobile SDKs** | ✅ Excellent (iOS/Android/RN/Flutter) | ✅ Good and improving (RN/iOS/Android/Flutter) |
| **Autocapture** (no manual events) | ✅ (records everything) | ✅ Autocapture for clicks/pageviews |
| **Data model** | Session-centric | Event-centric (with person profiles) |
| **SQL / raw data access** | ❌ | ✅ HogQL + data warehouse |
| **Self-hosting** | ❌ SaaS only | ✅ Open-source self-host option |
| **Data region** | EU / US | EU / US cloud + self-host |
| **Pricing model** | Flat plan tiers by recorded sessions | Usage-based per product (events, recordings, flags…); no base fee |
| **Free tier** | 3,000 sessions/mo, 1-month retention | 1M events + 5K web recordings (2.5K mobile) + 1M flag requests + more, monthly |
| **Entry paid price** | Pro from **$55/mo** (~5,000 sessions, 90-day retention) | **$0/mo** base; pay only past free tier |
| **Ad-blocker resilience** | ⚠️ `recorder.js` often blocked | ✅ Supports reverse-proxy ingestion |
| **Product status** | 🔴 **End-of-Life** (EOS 2026-05-31, shutdown 2027-08-31) | 🟢 Active, frequent releases |
| **Already integrated in Trydos** | Removed (was `utils/smartlook.ts`) | ✅ Yes (`utils/posthog.ts`) |

---

## Where each tool wins

### Smartlook *was* the better choice when… (historical — now EOL)
- The main need was **literally watching what users do** (replays) and **heatmaps**, especially on **native mobile apps**, where its SDKs were mature and battle-tested.
- You wanted **near-zero analytics maintenance** — it autocaptures sessions without an event taxonomy.
- The team was small and didn't want to own a broad analytics platform.

> These strengths are real but moot for new adoption: Smartlook is closed to new accounts (EOS 2026-05-31) and shuts down 2027-08-31. For these same needs today, evaluate PostHog or a dedicated mobile-replay vendor.

### PostHog is the better choice when…
- You need **funnels, retention, paths, and cohorts** to optimize an e-commerce conversion flow (add-to-cart → checkout → purchase) — PostHog's core competency.
- You want **feature flags + A/B experiments** wired to the **same** analytics that measure their impact (huge for a storefront iterating on UX/pricing/live-shopping features).
- You care about **data ownership / cost control at scale** — EU cloud, self-hosting, SQL access, and usage-based pricing.
- You want to **consolidate tooling** (potentially retiring GA and Smartlook) under one identity graph and one bill.

---

## Deep dive by dimension

### 1. Session replay & heatmaps
Both record full sessions with privacy masking. Smartlook's replays and heatmaps are its entire product, so the replay UX and mobile fidelity are excellent. PostHog's replay is very capable on web and now solid on mobile, and it's tightly linked to events — you can jump from a funnel drop-off straight to the replays of users who dropped, which Smartlook can't do as fluidly because it lacks the deep funnel layer.

### 2. Product analytics
This is the decisive gap. PostHog is built around an **event + person** model with funnels, retention, paths, lifecycle, and a SQL (HogQL) layer over your raw data. Smartlook offers basic events and funnels but is not a substitute for a real product-analytics tool. For an e-commerce funnel, PostHog answers _"where and why are we losing revenue"_ far better.

### 3. Feature flags & experimentation
PostHog: native feature flags + A/B experiments, evaluated client- and server-side, measured against the same metrics. Smartlook: none. For a fast-iterating storefront (live shopping, promos, checkout tweaks), this is a major PostHog advantage. Note: PostHog server-side flag evaluation pairs well with the Go backend and Next.js server components.

### 4. Privacy / GDPR (multilingual, EU-facing storefront)
Both are GDPR-friendly with input masking. PostHog additionally offers an **EU cloud** and **self-hosting**, giving stronger data-residency control. Both let you mask PII (Trydos already passes only `name`/`phone` to `identify`; keep sensitive fields masked in replays).

### 5. Integration effort on Next.js + Vercel
- **Smartlook:** already integrated via the `smartlook-client` npm package (`utils/smartlook.ts`). Loads an external `recorder.js`, which **ad-blockers frequently block** — a real cause of under-reporting.
- **PostHog:** `posthog-js` on the client + optional `posthog-node` on the server. The recommended pattern is a **Next.js reverse proxy** (rewrite `/ingest/*` → PostHog) so ingestion isn't blocked by ad-blockers and first-party cookies work. Slightly more setup, materially better data capture.

### 6. Pricing & scale (concrete numbers, verified 2026-06-12)

**Smartlook** — flat plan tiers gated by recorded sessions:
- **Free:** 3,000 sessions/mo, 1-month data retention.
- **Pro:** from **$55/mo** for ~5,000 sessions, 90-day retention, advanced analytics + integrations.
- **Enterprise:** custom (SSO, unlimited users/projects, CSM).
- ⚠️ With EOS passed, these plans are effectively closed to new customers; existing customers can renew only until 2026-08-31.

**PostHog** — usage-based, **per product**, no platform/base fee ($0/mo to start). You only pay past each product's free monthly allotment:

| Product | Free / month | Overage (starts at → scales down) |
|---|---|---|
| Product analytics (events) | 1,000,000 events | $0.00005 → $0.0000090 / event |
| Session replay (web) | 5,000 recordings | $0.0050 → $0.0015 / recording |
| Session replay (mobile) | 2,500 recordings | $0.0100 → $0.0030 / recording |
| Feature flags | 1,000,000 requests | $0.0001 → $0.000010 / request |
| Experiments | billed with feature flags | — |
| Surveys | 1,500 responses | $0.10 → $0.010 / response |
| Error tracking | 100,000 exceptions | $0.00037 → $0.000115 / exception |
| Data warehouse | 1,000,000 rows | $0.000015 → $0.000001 / row |

**Honest read:** For low-to-mid traffic, PostHog is very likely **cheaper or free** (the free tier alone covers a lot of a small storefront), and you can cap spend per product. At very high volume the per-unit costs add up across products, but tiered rates fall and you only enable what you use. Smartlook's flat $55 entry is simpler to predict, but you're paying into a product with a shutdown date.

---

## Recommendation for Trydos

Smartlook's EOL removes the "keep it" option, so the path is straightforward:

1. **Done:** Smartlook removed; **PostHog** wired end-to-end (replay + heatmaps + autocapture, ad-blocker-proof `/ingest` reverse proxy, GA event fan-out, error tracking, identity, flags/experiments ready). See decision banner at top.
2. **Now:** build the core commerce funnel in the PostHog UI (view → add-to-cart → checkout → purchase) from the existing GA event taxonomy, and verify replay/heatmap quality on a production deploy.
3. **Next quarter:** start using feature flags + A/B experiments on live-shopping/checkout tweaks. Once confident in PostHog's coverage, consider **retiring GA** too, to unify on one identity graph and one bill.

| Goal | Best pick |
|---|---|
| Replays + heatmaps | **PostHog** (Smartlook is EOL) |
| Conversion/funnel optimization + experimentation | **PostHog** |
| One tool to replace GA + Smartlook + flags | **PostHog** |
| Best native-mobile replay fidelity | A dedicated mobile-replay vendor; PostHog is good and improving |
| Data residency / self-host / SQL access | **PostHog** |
| Long-term viability | **PostHog** (Smartlook shuts down 2027-08-31) |

---

## Appendix A — Smartlook integration fixes shipped with this review

The dashboard was empty because of two defects in the existing integration, both now fixed:

1. **Recorder never started (blocker).** `smartlook-client` v10 is pure ESM and exposes its entire API on the module's **`default`** export. The wrapper called `Smartlook?.init(key)` on the raw module namespace, where `init` is `undefined`; the call threw `TypeError` and was swallowed by the `try/catch`, so the recorder **never initialized for anyone**. Fixed in `utils/smartlook.ts` by unwrapping `mod.default`.
2. **Guests were never recorded.** `init()` was only called inside `if (auth.UserID())` in `components/Home/Init.tsx`, so the bulk of storefront traffic (logged-out visitors) was never recorded. Fixed by initializing for **all** visitors and keeping only `identify()` behind the login check. `init()` is now idempotent (guarded by `initialized()`).

> Note: `smartlookInit`/`smartlookIdentify` early-return when `NODE_ENV !== "production"`, so verify on a production/preview deploy, not `pnpm dev`. Confirm `NEXT_PUBLIC_SMARTLOOK_KEY` is set in the Vercel project env (it currently lives in `.env.development`). After deploying, check `Smartlook.sessionId`/`playUrl` in the browser console and watch for the session in the dashboard within a minute.

## Appendix B — PostHog Next.js reverse-proxy sketch (if piloted)

```ts
// next.config.ts — proxy ingestion through your own domain to dodge ad-blockers
async rewrites() {
  return [
    { source: "/ingest/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
    { source: "/ingest/:path*",        destination: "https://eu.i.posthog.com/:path*" },
  ];
}
```

```ts
// client init (e.g. in a Providers component)
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  capture_pageview: false, // capture manually on App Router route changes
});
```

Use `posthog-node` for server-side flag evaluation in Server Components / the Go-backed API where low-latency, no-flicker flags matter.

---

## Sources

- [PostHog — Pricing](https://posthog.com/pricing)
- [Smartlook — Pricing](https://www.smartlook.com/pricing/)
- [Cisco — End-of-Sale and End-of-Life Announcement for Smartlook.com](https://www.cisco.com/c/en/us/products/collateral/software/smartlook-com-eol.html)
- [Cisco — Smartlook acquisition](https://www.cisco.com/site/us/en/about/corporate-development/acquisitions/smartlook/index.html)
- [Cisco Blogs — Intent to acquire Smartlook (AppDynamics / Full-Stack Observability)](https://blogs.cisco.com/news/cisco-announces-intent-to-acquire-smartlook-enabling-new-offerings-for-cisco-appdynamics-and-cisco-full-stack-observability)
- [UXWizz — Cisco Announces End of Life for Smartlook](https://www.uxwizz.com/blog/smartlook-shutting-down)
- [Capterra — Smartlook Pricing 2026](https://www.capterra.com/p/164713/Smartlook/pricing/)
