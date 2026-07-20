# Backend Disclosure — Decisions

Status: **partially implemented** — D3 is applied in the working tree; D1/D2/D4 pending
Date: 2026-07-19 (revised 2026-07-19 after research)
Ticket: `_specs/remove-debug-pages-and-any-leaking-servers-info/`
Scope: reduce what an attacker learns about our backend topology from the browser.

> **Revision note.** The original version of this document contained a
> **factually wrong feasibility claim** about D2 (see D2 below), written from an
> incomplete grep. Research under the ticket above corrected it, and the owner
> then narrowed several decisions. Where this document and
> `_specs/remove-debug-pages-and-any-leaking-servers-info/research.md` disagree,
> **the research file is authoritative** — it carries the full file:line
> inventory and the owner's scope decisions (S1–S16).

Goal: a penetration tester who reads the JS bundle and replays requests against
`/api/proxy` should not be able to enumerate our hosts, tell which services exist,
or tell which backend (Go vs Laravel) serves a given endpoint.

These four decisions are the agreed scope. Findings that were raised but are **not**
in scope here (proxy CSRF/origin guard, proxy path allowlist, `NEXT_PUBLIC_MEDIA_API_KEY`
exposure, API-route error sanitization) are tracked separately — see "Out of scope".

---

## D1 — Remove the debug pages

Delete the two unauthenticated debug routes from the production route tree:

| Route | File |
|---|---|
| `/api-test` | `app/(client)/api-test/page.tsx` (+ `CurrencyTestCard`) |
| `/requests-log` | `app/(client)/requests-log/page.tsx` |

**Why.** `api-test/page.tsx:66-87` renders four backend base URLs
(`NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_ELASTIC_BACKEND_URL`,
`NEXT_PUBLIC_CHAT_BACKEND_URL`, `NEXT_PUBLIC_STORIES_BACKEND_URL`) directly into
the DOM, alongside a working request builder and a labelled endpoint inventory.
There is no auth check and no environment gate. `requests-log` dumps captured
request logs at a public URL.

This page alone discloses more than D2–D4 can hide, so it lands first.

**Decision:** delete, do not gate behind an env flag. A dev-only variant can be
reintroduced later outside `app/` if it is genuinely needed.

**Added after research — a third debug route exists.** `/simulateUser`
(`app/simulateUser/{page.tsx,layout.tsx}`) was not in the original list. It
accepts pasted session JSON and writes **only** `COUNTRY` and `LANG` cookies
(`page.tsx:104,107`); it does not inject auth tokens and exposes no backend URLs.
**Decision: retain it** — it does not serve this document's goal.

**Added after research — the request logger is removed entirely.** Deleting
`/requests-log` removes only the *viewer*. `utils/requestLoggerClient.ts` is also
imported by `utils/fetchData.ts` (`:12`, calls at `:467,545,594`) and
`utils/functions.tsx` (`getLastRequest`, `:14`), and writes an IndexedDB store
(`RequestLoggerDB` / `request_logs`) retaining **3 days** of
`{url, response, body, userId, …}` in every user's browser.
**Decision: delete the logger module and all its call sites.** Note this
degrades client error-report context (`getLastRequest`). Data already in users'
browsers is **left to its 3-day purge** — no cleanup is shipped.

**Note:** deleting `/api-test` also removes the only client-side reader of
`NEXT_PUBLIC_BACKEND_URL`, `..._ELASTIC_...`, `..._CHAT_...` and `..._STORIES_...`,
which is what makes D2 a clean rename. **D1 must merge before D2.**

---

## D2 — Base URLs become server-only env (drop `NEXT_PUBLIC_`)

Rename these so they are never inlined into the client bundle:

| Current | New | In scope? |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `BACKEND_URL` | yes |
| `NEXT_PUBLIC_GO_BACKEND_URL` | `GO_BACKEND_URL` | yes |
| `NEXT_PUBLIC_ELASTIC_BACKEND_URL` | `ELASTIC_BACKEND_URL` | yes |
| `NEXT_PUBLIC_STORIES_BACKEND_URL` | `STORIES_BACKEND_URL` | yes |
| `NEXT_PUBLIC_COMMENT_BACKEND_URL` | `COMMENT_BACKEND_URL` | yes |
| `NEXT_PUBLIC_WALLET_BACKEND_URL` | `WALLET_BACKEND_URL` | yes |
| `NEXT_PUBLIC_CHAT_BACKEND_URL` | — | **NO — excluded**, see "Chat exclusion" |

Also delete `NEXT_PUBLIC_OTP_BACKEND_URL` during the env update — it is present
at line 23 of both `.env.development` and `.env.production` with **zero** code
references anywhere in the repo.

**Why.** `NEXT_PUBLIC_` is compiled into the JS bundle at build time. Any value
carrying that prefix is public by definition, regardless of how it is used.

> **CORRECTION — the original feasibility claim here was wrong.**
> It read: *"After D1, every remaining read of these seven vars is server-side,
> so the rename is mechanical and breaks nothing."* That was written from an
> incomplete grep and is **false**. A full inventory found **48 read sites**,
> four of them client-reachable and surviving D1. D2 is a **refactor**, not a
> rename.

**Feasibility — actual.** The four client-reachable reads and their status:

| File:line | Var | Status |
|---|---|---|
| `services/auth.ts:679` | `BACKEND` | **Fixed** — now uses `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (it builds an image `src`, not an API call) |
| `components/global/compare.tsx:169,175` | `BACKEND` | **To fix** — route via `fetchData({server: "market"})`, which resolves to the **Go** gateway (see note below) |
| `utils/functions.tsx:404` | `GO` | **To fix** — move the `typeof window === "undefined"` branch into a server-only module so the literal leaves the client bundle |
| `components/global/WebViewActions.tsx` (7 reads) | `CHAT` | **Deferred to a separate ticket** — see "Chat exclusion" |

Only `NEXT_PUBLIC_COMMENT_BACKEND_URL` was ever read exclusively from server-only
files, and is the one genuine two-line rename.

**`compare.tsx` also fixes a routing defect.** It uses
`/web/product/globalDetails` and `/web/product/qtyPriceDetails`
(`compare.tsx:157-158`) — both Go-gateway paths per `GO_API_PREFIXES`
(`utils/server/tokenManager.ts:104-108`) — but currently sends them to the
Laravel host. They should be served by Go. Routing through `fetchData` corrects
this, so the change is a **behavioural fix, not a neutral refactor**, and needs
its own verification.

**Chat exclusion — `NEXT_PUBLIC_CHAT_BACKEND_URL` is NOT renamed.** Because
`WebViewActions.tsx` is deferred and keeps reading that variable from
client-bundled code, it must retain its public prefix. **Consequence: this work
hides six of the seven backend hosts, not all seven.** The chat hostname stays
readable in the JS bundle until the webview follow-up lands.

Remaining server-side reads (mechanical once the above are done):

- `utils/server/tokenManager.ts:115-136` (`getServerBaseUrl`)
- `app/api/auth/login/route.ts:95,160,169,177,185`
- `app/api/auth/expire/route.ts:79,98`
- `app/api/auth/register-device/route.ts:37,58`
- `app/api/internal/mobile-error-log/route.ts:48`
- `serverRequests/**` — 15 reads across 8 files
- `proxy.ts:201`, `serverActions/sendOtp.ts:117`, `services/wallet/index.ts` (11 reads), `utils/server/otpIdentity.ts:156`

**Deploy ordering.** The owner will not push until the renamed variables exist in
**every** Vercel environment (production, preview, development). Merging code
before the env update resolves every base URL to `""` and takes all backends
down. This guarantee is procedural, not enforced by code.

**Blocker — media host is NOT included.** `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`
stays public for now: it is read from genuine client code
(`components/SellerDashboard/ExcelUploadTab.tsx:51`,
`components/SellerDashboard/StoriesTab.tsx:478`, plus `services/story.ts`,
`services/order.ts`, `services/auth.ts`, `services/sellerDashboard/*`), which
upload direct to the media server from the browser. De-publicising it requires
routing uploads through a server route first — that is the separate
`NEXT_PUBLIC_MEDIA_API_KEY` workstream, which must move anyway.

**Also update:** Vercel project env (all environments), `.env.example`, and any
deployment docs. `next.config.ts:173-183` `images.domains` still names
`media_server.ramaaz.dev` and `market_staging.trydos.tech` — out of scope here,
flagged for the media workstream.

---

## D3 — Remove the `IS-FROM-GO` response header

**Status: APPLIED in the working tree (uncommitted on `develop`).** Verified:
`IS-FROM-GO` has zero matches repo-wide, the dead `"fullUrl": ''` header is gone,
and the ungated `console.log` in `utils/server/tokenManager.ts` is gone.

Sites that carried it:

- `app/api/proxy/route.ts:203` (JSON path) and `:214` (binary path)
- `app/api/auth/register-device/route.ts:82,115,123`
- `app/api/internal/mobile-error-log/route.ts:60`

**Still unverified:** whether the `Cache-Control: no-store` addition to the
proxy's binary response path was included in that work.

**Why.** `isFromGoApi(targetUrl)` (`utils/server/tokenManager.ts:110-114`) returns
whether an endpoint is served by the Go gateway or the Laravel backend, and we
return that answer to the caller. Replaying the proxy across our endpoint list
yields a complete Go-vs-Laravel topology map for free — precisely the internal
architecture detail this work exists to hide.

**Confirm before deleting:** no client code reads this header. Grep showed only
producers, no consumers.

**Bundled with D3 (same class of leftover debris):**



- `app/api/proxy/route.ts:210-217` — the binary path omits `Cache-Control: no-store`
  that the JSON path sets at `:202`. Add it while we are in this file: these
  responses carry token-authorized upstream content and are cacheable by default.

---

## D4 — Opaque service identifiers in the proxy contract

Replace the human-readable `x-proxy-server` values with non-descriptive tokens:

**Values CONFIRMED** (uniform length, no shared prefix, no decodable
abbreviation):

| Current | New |
|---|---|
| `market` | `vv7qsd` |
| `market-dashboard` | `k2muhz` |
| `chat` | `p9xtrb` |
| `stories` | `dw4nge` |
| `elastic` | `hs6ljc` |
| `comments` | `tn3ykf` |
| `wallet` | `ge8zpm` |

`market-dashboard` stays a **distinct** token: it resolves to the same base URL
as `market` and uses the same auth token, but it carries the seller-id header, so
collapsing the two would lose that distinction.

The mapping lives **server-side only**, in `ALLOWED_SERVERS` /
`getServerBaseUrl` (`utils/server/tokenManager.ts:40-48,115-136`). The client
sends the opaque token; only the proxy knows what it means.

**Why.** Today `x-proxy-server: wallet` tells a reader we run a distinct wallet
service before they have probed anything. Opaque tokens remove that free
service inventory.

**Honest scope — read this.** This is **obfuscation, not access control.** It
raises the cost of casual recon; it does not stop a determined attacker, who can
still enumerate the tokens by replaying each one and observing which return
`400 "Invalid server type"` versus a real response. It is worth doing as
defence-in-depth, and it is explicitly **not** a substitute for the two controls
that actually constrain the proxy — the CSRF/origin guard and the path
allowlist, both out of scope below. D4 should not be allowed to create a
false sense that the proxy is now protected.

**Implementation constraints:**

- **Scale: 272 production call sites** plus 2 direct `x-proxy-server` setters.
  Most are compiler-guarded, but four are **not** and can break silently:
  `services/sellerDashboard/index.ts:674` (untyped literal in a plain header
  object — highest risk); `utils/server/tokenManager.ts:310`
  (`getTokenForServer(server as ProxiedServer)` casts from raw `string`);
  `serverRequests/ServerFetch.tsx:112` (hardcoded telemetry label, cosmetic);
  and `services/home.ts:529,544` + `components/Cart/PlaceOrderButtons.tsx:63`,
  which use `server:'market'` / `server:"market"` with no space and are missed by
  a naive `server: "` search.
- **Two unions are hand-maintained and can drift:** `ProxiedServer`
  (`utils/server/tokenManager.ts:7-14`, 7 members) and `ServerType`
  (`utils/fetchData.ts:16-25`, 9 = those 7 plus `"local"` and `"upload story"`).
  Renaming one and not the other compiles but misroutes.
- Touch points: `utils/fetchData.ts:420` (`x-proxy-server`),
  `services/sellerDashboard/index.ts:674`, `utils/server/tokenManager.ts` types
  (`ProxiedServer`), `ALLOWED_SERVERS`, `getServerBaseUrl`, `getTokenForServer`.
- The `ProxiedServer` union should keep readable *type* names internally where
  possible, with the opaque token as the wire value, so server code stays legible.
- Ship as a single atomic change — a half-migrated map means live requests get
  `400 "Invalid server type"`.

---

## Sequencing

```
D3  ── APPLIED already (uncommitted on develop)

D1  delete /api-test + /requests-log     (/simulateUser retained)
    remove the request logger entirely
     └─ also deletes api-test's duplicate 4-member ServerType and its
        96 call sites, which de-risks D4

D2a fix the client-reachable reads
     ├─ services/auth.ts:679      DONE
     ├─ compare.tsx               → fetchData({server:"market"}) → Go
     ├─ utils/functions.tsx:404   → move server branch to a server-only module
     └─ WebViewActions.tsx        → OUT OF SCOPE (separate ticket)

D2b rename SIX env vars (chat excluded); env updated in Vercel FIRST

D4  opaque identifiers, shipped atomically
```

D1 before D4 is a hard ordering (it removes the duplicate `ServerType`).
D2a before D2b is a hard ordering. The env update precedes the push.

---

## What this work actually achieves

Stated plainly, so nobody reads more into it than is true. After D1–D4:

- **Six of the seven** backend hostnames leave the client bundle. The **chat**
  host remains (see "Chat exclusion").
- Service names are obfuscated, not hidden: the client must send the token, so
  all seven opaque values are still readable in the JS. An attacker still learns
  that seven services exist, and can still enumerate them by replaying each and
  observing which return `400 "Invalid server type"`. **D4 is obfuscation, not
  access control, and does not secure the proxy.**
- The debug pages and the request logger are gone.
- The Go-vs-Laravel topology header is gone.

It is **not** "no leaking at all". The residual surface is listed below.

## Out of scope

Raised during recon, deliberately **not** covered by these four decisions. Each
needs its own ticket:

- **`WebViewActions.tsx` and the chat host.** Deferred. It calls the chat backend
  directly from the browser and cannot simply be routed through `/api/proxy`: it
  sends a bearer token supplied by its caller
  (`WebviewCall.tsx:93` — `searchParams.get("authToken")`), whereas the proxy
  injects the HttpOnly `CHAT-TOKEN` cookie. Routing it through the proxy would
  authenticate as a **different principal**. Needs a design decision.
- **Bearer tokens in webview URLs — a real pre-existing defect.** The chat JWT is
  passed as a query parameter and propagated into further navigations
  (`WebviewCall.tsx:138,140,173,175,297,309`), leaking it via `Referer` headers,
  browser history, server access logs, and URL-capturing analytics. Affects
  `/call_direct`, `/callInProg`, `/endCall`. **This is the most serious finding
  in this document and deserves its own security ticket.**
- **`/simulateUser`** is retained by decision (see D1).

- **`/api/proxy` has no CSRF/origin check.** Cookies are HttpOnly and sent with
  `credentials: "include"`; any same-site XSS or cross-site POST reaches an
  allowed backend with the user's Bearer token attached.
- **No path allowlist on the proxy.** Any endpoint on the seven configured
  origins is reachable with an injected token, including internal/admin routes
  the UI never calls. Note `market` and `market-dashboard` resolve to the same
  base URLs and the same token, so that split grants no separation today.
- **`NEXT_PUBLIC_MEDIA_API_KEY` is a live API key in the client bundle**
  (`services/order.ts:33`, `services/story.ts:15`, `services/auth.ts:782`,
  `services/sellerDashboard/index.ts:6`, `comments.ts:19`). Credential leak, not
  fingerprinting. Blocks the media half of D2.
- **~24 API routes return `error.message` or raw `error` to the client**
  (`revalidate`, `image-search`, `related-products`, `clearRedis`,
  `speech-recognition`, …), leaking upstream hostnames and driver detail. The
  `/api/proxy` handler itself is already clean.
- **`next.config.ts:173-183` `images.domains`** publicly names
  `media_server.ramaaz.dev`, `market_staging.trydos.tech`, and
  `trydos.s3.ap-south-1.amazonaws.com`.

## Already in place (do not redo)

`poweredByHeader: false` and `productionBrowserSourceMaps: false`
(`next.config.ts:22,219`); HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy and a minimal CSP (`next.config.ts:35-89`);
Server Actions origin-locked (`:190-197`); tokens HttpOnly with masked logging;
and the proxy's existing URL validation (`app/api/proxy/route.ts:45-98`) — server
allowlist, leading-slash checks blocking `//` and `/\`, origin+path containment
blocking `/../..`, and the `SEND_OTP` denylist. The proxy is **not** an open SSRF.
