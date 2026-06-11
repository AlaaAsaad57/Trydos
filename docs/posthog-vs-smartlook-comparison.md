# PostHog vs Smartlook — Analytics Platform Comparison

_Context: Trydos (Next.js 16 App Router · React 19 · Vercel · Go backend), a multilingual live-shopping storefront. Today the stack already runs **Google Analytics** (quantitative), **Sentry** (errors), and **Smartlook** (session replay). This document compares Smartlook with PostHog to decide whether to keep, replace, or complement._

> **Last reviewed:** 2026-06-10. Pricing and feature tiers for both vendors change often — treat the numbers below as directional and confirm against the live pricing pages before committing.

---

## TL;DR / Verdict

- **Smartlook** is a focused **session-replay + heatmap** tool with best-in-class **native mobile** recording. It answers _"what did this user actually do on screen?"_ It is light to integrate (already done here) but does not do product analytics, feature flags, or experimentation.
- **PostHog** is an all-in-one **product-analytics suite**: events/funnels/retention/paths, session replay, **feature flags**, **A/B experiments**, surveys, and even error tracking — with a SQL layer, a generous free tier, EU cloud, and a self-host/open-source option.

**Recommendation for Trydos:** If the goal is just _"watch recordings and heatmaps,"_ keeping a correctly-integrated **Smartlook** is fine (see the fixes shipped alongside this doc). If the goal is **conversion/funnel optimization + experimentation** for an e-commerce storefront — which it usually is — **PostHog** is the stronger long-term bet because it can consolidate GA + Smartlook + flags + experiments into one tool with one identity graph. A reasonable middle path is to **add PostHog for product analytics/flags and keep Smartlook for mobile replay**, then re-evaluate after one quarter.

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
| **Pricing model** | Per recorded session / MTU tiers | Usage-based per product (events, recordings, flags…) |
| **Free tier** | Modest (≈ a few k sessions/mo) | Generous (millions of events + thousands of recordings/mo) |
| **Ad-blocker resilience** | ⚠️ `recorder.js` often blocked | ✅ Supports reverse-proxy ingestion |
| **Already integrated in Trydos** | ✅ Yes (`utils/smartlook.ts`) | ❌ Not present |

---

## Where each tool wins

### Smartlook is the better choice when…
- The main need is **literally watching what users do** (replays) and **heatmaps**, especially on **native mobile apps**, where its SDKs are mature and battle-tested.
- You want **near-zero analytics maintenance** — it autocaptures sessions without an event taxonomy.
- The team is small and doesn't want to own a broad analytics platform.

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

### 6. Pricing & scale
- **Smartlook:** priced primarily by **recorded sessions / MTUs**; free tier is modest, costs scale with traffic volume.
- **PostHog:** **usage-based per product** (events, recordings, flag requests, etc.) with a large monthly free allotment and self-host escape hatch. Generally more cost-efficient at scale and you only pay for the products you enable.

---

## Recommendation for Trydos

1. **Immediate:** keep Smartlook but ship the integration fixes (below) — the current setup recorded essentially nothing, which is the real reason the dashboard looked empty.
2. **Short term (this quarter):** pilot **PostHog** for product analytics + feature flags on the web storefront, using the reverse-proxy setup. Instrument the core commerce funnel (view → add-to-cart → checkout → purchase) and the live-shopping events.
3. **Re-evaluate after the pilot:** if PostHog's replay quality on web + mobile is sufficient, **consolidate** (drop Smartlook, and consider dropping GA) to reduce vendor sprawl and unify identity. If native-mobile replay fidelity is critical, **keep Smartlook for mobile** and use PostHog for analytics/flags/experiments.

| Goal | Best pick |
|---|---|
| Just replays + heatmaps, minimal effort | **Smartlook** |
| Conversion/funnel optimization + experimentation | **PostHog** |
| One tool to replace GA + Smartlook + flags | **PostHog** |
| Best native-mobile replay fidelity | **Smartlook** |
| Data residency / self-host / SQL access | **PostHog** |

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
