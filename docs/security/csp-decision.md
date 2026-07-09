# Content-Security-Policy — Decision & Implementation Guide

**Status:** Root-cause XSS fix landed (HTML sanitization). A **minimal, safe,
enforced CSP** is now shipped (`object-src 'none'; base-uri 'self';
frame-ancestors 'self'` — no `default-src`/`script-src`, so it cannot block app
resources). The full **script-src XSS-blocking** policy remains deferred to a
Report-Only rollout.
**Last updated:** 2026-07-09
**Related:** `security_scan_report.md` (finding **F-01**), `next.config.ts` (`headers()`), `proxy.ts`, `utils/sanitizeHtml.ts`

---

## TL;DR

- A **strict** CSP (`script-src 'self'` or nonce-based) is **not** recommended for
  this app: it either white-screens the site or forces every page into dynamic
  rendering, which kills the caching this codebase is built around.
- CSP still has **real defense-in-depth value** here because the app renders
  server/seller-controlled HTML in a few places. That risk is now addressed at
  the **root** with sanitization (`utils/sanitizeHtml.ts`), which is the actual
  fix — CSP would only ever be a second layer.
- If/when we add CSP, do it as a **cached, static header** (keep rendering as-is)
  and roll it out **Report-Only first**. Nonces are off the table until the app's
  caching strategy changes.

---

## 1. Is CSP required for this app?

**Short answer: not required, but worthwhile as a second layer — _after_ the root fix.**

CSP's primary job is mitigating **XSS** (and, secondarily, clickjacking + limiting
where content can load from). Clickjacking is already covered by
`X-Frame-Options: SAMEORIGIN`. So the question is really: *does this app have an
XSS surface CSP would meaningfully protect?*

### The real XSS surface we found

Five components rendered **unsanitized, server/seller-controlled HTML** via
`dangerouslySetInnerHTML`:

| File | Injected value | Origin of the data |
|------|----------------|--------------------|
| `components/products/ProductDetailsText.tsx` | `details` | seller product description |
| `components/global/compare.tsx` | `product.details` | seller product description |
| `components/Home/OfferWidgets/BoutiqueElement.tsx` | `boutique.description` | seller/boutique text |
| `components/Notifications/NotificationItem.tsx` | `parsedDescription.boutique_description` | notification payload |
| `components/setting/orders/OrderDetailsWrapper.tsx` | `message` | order message *(currently commented out)* |

A raw `<script>` inserted via `innerHTML` does **not** execute, but
event-handler payloads (`<img src=x onerror=…>`, `<svg onload=…>`) **do**. If a
seller could store such a payload in a description and the backend did not
sanitize it, that was a **stored-XSS** vector — a genuine risk, more than a
typical brochure storefront carries.

> The other `dangerouslySetInnerHTML` uses in the repo are **not** injection
> vectors: JSON-LD structured data (`JSON.stringify` of controlled data), the
> static `gtag-init` script, and a static `<style>` keyframes block.

### What we did about it (the root fix)

All five sinks now pass their HTML through a shared sanitizer,
`utils/sanitizeHtml.ts`, backed by **`isomorphic-dompurify`** (DOMPurify that runs
identically on the server via jsdom and on the client via the native DOM):

```ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty);
}
```

DOMPurify strips `<script>`, inline event handlers, `javascript:` URLs and other
vectors while preserving safe rich-text formatting. **This is the primary XSS
defense.** With it in place, CSP becomes an optional hardening layer rather than a
necessity.

**Conclusion:** CSP is **not required** for correctness or to close the known
vulnerability — sanitization does that. CSP remains a *nice-to-have* second layer
that would catch a future un-sanitized sink or a script injected by other means.

---

## 2. Why a *strict* CSP is the wrong fit for this app

The strongest CSP (per-request **nonce** + `strict-dynamic`) is a poor architectural
match here.

- Next.js mints the nonce **per request** in `proxy.ts` and reads it via
  `headers()`. Per Next.js's own docs, using nonces **"disables static
  optimization, Incremental Static Regeneration (ISR), CDN caching, and Partial
  Prerendering"** — every page becomes dynamically rendered.
- This codebase is explicitly **built around caching**: `staleTimes`
  (`dynamic: 30`, `static: 180`), `Cache-Control: s-maxage=60,
  stale-while-revalidate=300`, immutable asset caching, and `next.config.ts`
  comments that call out keeping **Vercel Function Duration** down. A nonce CSP
  would push every locale-scoped page to per-request SSR — a serious cost and
  latency regression.

The other "strict" form — a **static** `script-src 'self'` with no `'unsafe-inline'`
— would simply **break the site**: it blocks the inline `gtag-init` script,
Next.js's inline hydration bootstrap, and every third-party script (GTM, PostHog,
Sentry, Firebase, Agora).

---

## 3. If we add CSP — how (options & trade-offs)

| Option | Security | Keeps caching? | Verdict for this app |
|--------|----------|----------------|----------------------|
| **A. Nonce + `strict-dynamic`** | Strongest | ❌ Forces dynamic rendering | ❌ Too costly — fights the architecture |
| **B. Static header, `'unsafe-inline'` scripts** | Modest (origin allowlisting, `object-src`, `base-uri`, `frame-ancestors`); does **not** stop inline XSS | ✅ Yes | ✅ Pragmatic fit — recommended if we ship CSP |
| **C. Experimental SRI (`experimental.sri`)** | Strong-ish, hash-based | ✅ Yes | ⚠️ Promising but experimental; can't cover inline/3rd-party scripts |
| **D. Report-Only (any of the above)** | None (measurement only) | ✅ Yes | ✅ Correct **first step** regardless |

### Recommended sequence

1. **Root fix — done.** Sanitize the HTML sinks (`utils/sanitizeHtml.ts`).
2. **Report-Only.** Ship `Content-Security-Policy-Report-Only` (Option B policy)
   as a static header in `next.config.ts`. Zero breakage; keeps caching. Route
   violations to a report endpoint / Sentry for ~1 week to catch anything the
   origin inventory below missed.
3. **Enforce Option B.** Flip to `Content-Security-Policy` once Report-Only is
   quiet. You get origin allowlisting + `object-src 'none'` + `base-uri 'self'` +
   `frame-ancestors` hardening without the Function-Duration hit.
4. **Revisit Option C (SRI)** later if we want to drop `'unsafe-inline'` without
   going dynamic.

### The origin allowlist this app actually needs

Derived from a scan of the codebase (analytics, RTC, push, error reporting, media):

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com 'wasm-unsafe-eval';
connect-src 'self'
  https://*.google-analytics.com
  https://*.googleapis.com                                   # Firebase installations / FCM
  wss://*.firebasedatabase.app https://*.firebasedatabase.app  # Firebase RTDB
  https://*.sentry.io                                        # Sentry ingest (tunnelRoute is OFF)
  wss://*.agora.io wss://*.sd-rtn.com https://*.agora.io https://*.sd-rtn.com  # Agora RTC
  <NEXT_PUBLIC_GO_BACKEND_URL> <NEXT_PUBLIC_BACKEND_URL>;
img-src 'self' data: blob: res.cloudinary.com *.amazonaws.com media.ramaaz.dev *.trydos.tech placehold.co eu.ui-avatars.com;
media-src 'self' blob:;                                      # Agora video, Stories
worker-src 'self' blob:;                                     # Agora workers / wasm
style-src 'self' 'unsafe-inline';                            # Tailwind + pervasive inline styles
font-src 'self' data:;
frame-src <crypto-payment-origin>;                           # components/Cart/ModalIframe.tsx
object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self';
```

Notes:
- **PostHog is already first-party** (reverse-proxied through `/ingest`), so
  `'self'` covers it — no PostHog origin needed in `connect-src`.
- **Agora** needs `'wasm-unsafe-eval'`, `blob:` workers/media, and both `wss://`
  and `https://` for `*.agora.io` / `*.sd-rtn.com`.
- **Sentry** connects directly to its ingest host (the `tunnelRoute` option in
  `next.config.ts` is commented out); if that's enabled later, Sentry traffic
  becomes first-party and the `*.sentry.io` entry can drop.
- `frame-ancestors 'self'` mirrors the existing `X-Frame-Options: SAMEORIGIN`.

---

## 4. Headers already in place (for reference)

`next.config.ts` currently sends (applies to `/:path*`):

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)`
- `poweredByHeader: false` (removes `X-Powered-By`)
- `Content-Security-Policy: object-src 'none'; base-uri 'self'; frame-ancestors 'self'`
  — the safe **enforced** subset (no `default-src`/`script-src`, so no resource
  loading is affected). See §3 "safe enforceable subset" reasoning.

**F-01 (CSP)** is now partially addressed: the header is present and enforcing the
zero-risk directives. The remaining work — a `script-src`/`connect-src` policy
that actually blocks inline XSS — stays deferred to the Report-Only → enforce
sequence above, because that is the part with real breakage risk.

---

## Sources

- [Next.js — Content Security Policy guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js CSP: static pages, nonces & trade-offs — John Kavanagh](https://johnkavanagh.co.uk/articles/content-security-policy-in-nextjs/)
- [Agora — Firewall / domain requirements](https://docs.agora.io/en/Agora%20Platform/firewall)
- [MDN — CSP `connect-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src)
- [MDN — CSP `script-src` (`wasm-unsafe-eval`)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)
- [OWASP — DOMPurify / HTML sanitization](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
