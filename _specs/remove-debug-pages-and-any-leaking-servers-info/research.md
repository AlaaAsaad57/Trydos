---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: ai_agent
updated: 2026-07-19
links:
  clickup:
  github:
---

# Research — remove-debug-pages-and-any-leaking-servers-info

> Read-only phase. **No implementation is allowed in this command.**
>
> Refreshed run. Scope decisions supplied by the owner are recorded under
> "Scope decisions" and are treated as settled inputs, not open questions.

## Goal

Remove the browser-facing surfaces that disclose our backend hosts, service
inventory, and Go-vs-Laravel split, per decisions D1–D4 in
`docs/security/backend-disclosure-decisions.md`, extended by the owner's
decisions below so that **no backend identity reaches the client at all**.

## Scope decisions (owner, this run)

| # | Decision | Effect on scope |
|---|---|---|
| S1 | Fix all four client-reachable env reads from the previous headline finding | D2 grows from a rename into a refactor; the two proxy-bypassing files come on-scope |
| S2 | Split the work | D2 is executed in two ordered phases inside this ticket (refactor, then rename) — see "Phasing" |
| S3 | **Keep** `/simulateUser` | D1 covers `/api-test` and `/requests-log` only |
| S4 | **Remove** the request logger | `utils/requestLoggerClient.ts` and its call sites come on-scope |
| S5 | Keep D2 in this ticket | not split into a separate ticket |
| S6 | Owner updates the Vercel env personally, later | code must tolerate either env state — see RISK-1 |
| S7 | D4 token values chosen by the implementer | proposed set recorded below |
| S8 | `market-dashboard` stays a distinct token | it is the same URL but requires the seller-id header |
| S9 | **`WebViewActions.tsx` is out of scope** — deferred to a later ticket | RISK-2 is closed here; the blocked item is removed from D2a |
| S10 | `compare.tsx` routes through `fetchData` against the **Go** backend, like the other product calls | resolves the prior open question about its upstream |
| S11 | The rename covers **six** vars — **`NEXT_PUBLIC_CHAT_BACKEND_URL` is excluded** because the retained webview code still reads it client-side | consequence of S9; the chat host stays disclosed |
| S12 | Remove the request logger **entirely** | `utils/requestLoggerClient.ts` deleted, not gated |
| S13 | Proposed D4 token values **confirmed** | no further decision needed at `/plan` |
| S14 | The two product paths **should** be served by Go, not Laravel | S10 fixes a real routing defect; it is not a neutral refactor — see below |
| S15 | Leave stale `RequestLoggerDB` data to its 3-day purge | no cleanup shipped; RISK-6(b) accepted |
| S16 | `NEXT_PUBLIC_OTP_BACKEND_URL` is dead and should be removed from the env files | **not yet actually removed** — still present at line 23 of both files |

S6 is superseded: the owner will **not** push until the env vars are updated for
all renamed servers, so the merge-before-env failure mode is removed by process.
See RISK-1 (revised).

## Headline finding — RESOLVED by S9 (deferred, not fixed)

> **Status:** the blocker below is no longer a blocker for this ticket. Per S9,
> `WebViewActions.tsx` is deferred to a later ticket, and per S11 its env var
> (`NEXT_PUBLIC_CHAT_BACKEND_URL`) is excluded from the rename. The analysis is
> retained because it is the justification for both decisions and the scope note
> for the follow-up ticket.

S1 asked for all four client-reachable reads to be fixed. Three are
straightforward. **The fourth is not, and it cannot be resolved by routing
through `/api/proxy`.**

`components/global/WebViewActions.tsx` (7 reads of `NEXT_PUBLIC_CHAT_BACKEND_URL`)
sends `Authorization: Bearer <token>` where the token is supplied by its caller:

```
components/global/WebviewCall.tsx:93   authToken: searchParams.get("authToken")
```

The chat JWT arrives **in the URL query string** from the native app host, and is
then propagated into further navigations (`WebviewCall.tsx:138,140,173,175,297,309`).
It is **not** the browser's HttpOnly `CHAT-TOKEN` cookie.

`/api/proxy` injects the cookie token via `getTokenForServer("chat")`
(`utils/server/tokenManager.ts:148-151`). So routing these calls through the
proxy would authenticate as a **different principal** than today — the browser
session rather than the native app session. In a webview those are frequently
not the same user, and often the cookie is absent entirely. This is a behavioural
change, not a refactor, and it must be designed at `/plan`.

**Related pre-existing defect, surfaced here but NOT in this ticket's scope:**
passing a bearer token as a query parameter leaks it through `Referer` headers,
browser history, server access logs, and any analytics that captures URLs. It
affects the whole webview route family (`/call_direct`, `/callInProg`,
`/endCall`). This deserves its own security ticket; `spec.md` should name it as
explicitly out of scope so it is not silently absorbed.

### One is already fixed in the working tree

`services/auth.ts:679` (`BACKEND`) — **already changed, uncommitted on `develop`**,
observed during this run:

```diff
- ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${prevImagePath}`
+ ? `${process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}${prevImagePath}`
```

This is the correct fix and it resolves the prior open question about that line:
it builds an image `src`, not an API call, so the media base URL is the right
source. `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` is already client-public and stays
public per the decisions doc, so this introduces no new disclosure while removing
the API host from a client-reachable file.

Consequences: `services/auth.ts` is a **protected path** and is now part of the
uncommitted working-tree set (RISK-5) — it must join the stash and must be listed
in `plan.md` "Files to change" (IM-4). It also means only **two** client-reachable
reads remain tractable, plus the blocked one.

### The other two are tractable

| File:line | Var | Fix |
|---|---|---|
| `components/global/compare.tsx:169,175` | `BACKEND` | Route through `fetchData({server: "market"})` per S10 — see the routing note below. |
| `utils/functions.tsx:404` | `GO` | Read sits in a `typeof window === "undefined"` branch that never executes client-side, but the bundler inlines the literal anyway. Move the server branch into a server-only module so the string leaves the client bundle. |

### Routing note for `compare.tsx` (S10) — verified

`compare.tsx:157-158` declares its own path constants:

```ts
let DETAILS_URL = "/web/product/globalDetails";
let QTY_URL     = "/web/product/qtyPriceDetails";
```

Both are **Go-gateway** paths: `GO_API_PREFIXES`
(`utils/server/tokenManager.ts:104-108`) lists `/web/product/globalDetails/` and
`/web/product/qtyPriceDetails/`. The built URL is
`/web/product/globalDetails/<slug>?lang=…`; `isFromGoApi` (`:110-114`) strips the
query and prefix-matches, so `fetchData({server: "market"})` resolves to
`GO_BACKEND_URL`. S10 is therefore directly implementable — no new server token
is needed, `market` already routes Go paths correctly.

**Latent defect this exposes — CONFIRMED (S14).** Today those Go paths are sent
to `NEXT_PUBLIC_BACKEND_URL` (the Laravel host). The owner confirms they **should
be served by Go, not Laravel**, so the current code is pointing at the wrong
upstream.

This reframes S10: routing `compare.tsx` through `fetchData({server: "market"})`
is a **bug fix**, not a neutral refactor. Two consequences for later stages:

- `spec.md` should carry an acceptance criterion that the compare feature still
  returns product details and qty/price after the change — this is the one place
  in the ticket where behaviour is intended to change, so it needs its own
  verification rather than riding on "the build passes".
- If the compare feature currently appears to work, Laravel is evidently also
  answering these paths; switching to Go could surface response-shape
  differences between the two backends. `/plan` should treat the response
  handling in `compare.tsx:180+` as in-scope for review, not just the two fetch
  lines.

## Phasing (S2)

```
Phase A  D1  delete /api-test + /requests-log   (/simulateUser retained, S3)
         S12 remove the request logger entirely
              └─ also deletes api-test's duplicate ServerType + 96 call sites,
                 which de-risks Phase C

Phase B  D2a 2 client-reachable reads remain (S1, narrowed by S9)
              ├─ compare.tsx      → fetchData({server:"market"}) → Go  (S10)
              ├─ utils/functions.tsx:404 → move server branch to a server-only module
              ├─ services/auth.ts:679    → DONE in working tree
              └─ WebViewActions.tsx      → OUT OF SCOPE (S9)
         D2b rename SIX env vars — chat excluded (S11)

Phase C  D4  opaque service identifiers, shipped atomically (tokens confirmed, S13)

D3       already applied in the working tree; carried in via stash
```

Phase A before Phase C is a hard ordering. D2b must not precede D2a, or the
remaining client-reachable files break.

### Env vars in the rename (S11)

| Var | Renamed to | In scope? |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `BACKEND_URL` | yes |
| `NEXT_PUBLIC_GO_BACKEND_URL` | `GO_BACKEND_URL` | yes |
| `NEXT_PUBLIC_ELASTIC_BACKEND_URL` | `ELASTIC_BACKEND_URL` | yes |
| `NEXT_PUBLIC_STORIES_BACKEND_URL` | `STORIES_BACKEND_URL` | yes |
| `NEXT_PUBLIC_COMMENT_BACKEND_URL` | `COMMENT_BACKEND_URL` | yes |
| `NEXT_PUBLIC_WALLET_BACKEND_URL` | `WALLET_BACKEND_URL` | yes |
| `NEXT_PUBLIC_CHAT_BACKEND_URL` | — | **NO — excluded (S11)**, still read client-side by the retained `WebViewActions.tsx` |
| `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` | — | no — direct browser uploads (decisions doc) |

Note `NEXT_PUBLIC_CHAT_BACKEND_URL` is still read by **server-only** code too
(`app/api/auth/login/route.ts:160`, `utils/server/tokenManager.ts:126`). Those
reads are harmless and need no change; the variable simply keeps its public
prefix until the webview follow-up lands.

## Relevant directories

- `app/(client)/api-test/`, `app/(client)/requests-log/` — deleted by D1 (7 files total; `/simulateUser` retained per S3).
- `app/api/proxy/` — the proxy handler: D3 response headers, D4 `x-proxy-server` read.
- `utils/server/` — `tokenManager.ts`: `ProxiedServer`, `ALLOWED_SERVERS`, `getServerBaseUrl`, `getTokenForServer`. The whole D2/D4 mapping.
- `utils/` — `fetchData.ts` (the `ServerType` union, the `x-proxy-server` send site, 3 logger calls), `functions.tsx` (1 logger import + a client-reachable env read), `requestLoggerClient.ts` (deleted by S4), `errorReported.tsx`.
- `serverRequests/` — 15 env reads across 8 files. **Protected path.**
- `services/` — 272 `server:` call sites. `auth.ts`, `order.ts`, `orders.ts`, `cart.ts` are **protected paths**.
- `components/global/` — `compare.tsx`, `WebViewActions.tsx`, `WebviewCall.tsx`: the proxy bypasses.
- `docs/security/` — the decisions doc, whose feasibility claim is wrong (see below).

## Relevant config files

- `.claude/project-config.yaml` — `protected_paths` (`:109-119`), `validation_checks` (`:207-230`), `validation_profiles` (`:232-250`). Read-only.
- `.env.development`, `.env.production` — all seven vars plus an unused `NEXT_PUBLIC_OTP_BACKEND_URL`. **Confirmed NOT git-tracked** (`.gitignore:24,72,74`); they live on dev machines and in the Vercel dashboard only.
- `next.config.ts` — **protected path**. `images.domains` (`:173-183`) still names `media_server.ramaaz.dev`, `market_staging.trydos.tech`, `trydos.s3.ap-south-1.amazonaws.com`. See "Residual disclosure".
- `package.json` — validation script definitions.
- No `vercel.json` / `.gitlab-ci.yml` / `.github/` reference to these vars: the Vercel dashboard is the only out-of-repo coupling.

## Protected paths in scope (GU-2 / IM-5)

Must be listed in `plan.md` "Files to change" or `/implement` blocks:

| Path | Phase | Why |
|---|---|---|
| `app/api/auth/**` | D3, D2b | `register-device/route.ts` already modified; `login/route.ts`, `expire/route.ts` read the env vars |
| `serverRequests/**` | D2b | 15 reads across 8 files |
| `services/auth.ts` | D2a, D2b | `:679` is a client-reachable read |
| `services/order.ts`, `services/cart.ts`, `services/orders.ts` | D4 | `order.ts` alone has 29 `server:` call sites |
| `proxy.ts` | D2b | `:201` reads `NEXT_PUBLIC_BACKEND_URL` |
| `utils/cookies/**` | — | not expected to change; cookie names are a separate namespace from wire values |

## Possibly affected services

- **All seven proxied backends** — D2 changes base-URL resolution; D4 changes addressing.
- **Vercel platform env** — seven variables re-created in every environment. Owner-managed (S6); see RISK-1.
- **Agora / live video (webview calling)** — the blocked D2a item. Any change risks breaking native-app call flows, which are hard to exercise from a browser.
- **Sentry** — `utils/errorReported.tsx:59-60` tags errors with the server identifier. After D4, historical data splits across old and new tag values; saved searches filtering `server:market` need updating. The only real operational consequence of D4.
- **Seller dashboard Excel download** — `services/sellerDashboard/index.ts:662-710` hand-builds its proxy request; highest-risk D4 miss (untyped literal at `:674`).
- **Client error reporting** — S4 removes `getLastRequest` (`utils/functions.tsx:14`), which enriches error payloads. Removing the logger degrades that diagnostic context; confirm at `/plan` that nothing depends on it.

## Test / validation commands available

Listed, not run:

- `pnpm exec tsc --noEmit` — check `typecheck`, `pass_when: exit-zero`. Catches most of D4 via `ProxiedServer`.
- `pnpm lint` — check `lint`, `pass_when: exit-zero`.
- `pnpm build` — check `build`, `pass_when: exit-zero`. Required: D2 only fully manifests at build time.
- `pnpm knip` — check `knip`. Proves no orphaned exports after D1 and the logger removal.
- `pnpm lint:i18n-parity` — not relevant; no user-visible strings change.

Suggested profile: **`full-build`** (typecheck + lint + build) — the ticket
touches multiple `protected_paths` and is build-affecting, exactly the profile's
stated purpose.

**Beyond the profile — the only check that actually proves the goal:** grep the
compiled client bundle (`.next/static/chunks`, already present) for the seven
variable names and for the literal backend hostnames. A green build says nothing
about what leaked. `spec.md` should make this an acceptance criterion, because
"no leaking at all" (S1) is only demonstrable this way.

## D4 token values — CONFIRMED (S7, S13)

Meaningless, no decodable abbreviation, no shared prefix, uniform length so
length itself carries no signal. **Confirmed by the owner; `/plan` adopts these
verbatim and no further decision is required:**

| Current | Proposed |
|---|---|
| `market` | `vv7qsd` |
| `market-dashboard` | `k2muhz` |
| `chat` | `p9xtrb` |
| `stories` | `dw4nge` |
| `elastic` | `hs6ljc` |
| `comments` | `tn3ykf` |
| `wallet` | `ge8zpm` |

Per S8 `market-dashboard` remains distinct: it resolves to the same base URL as
`market` (`tokenManager.ts:118-122`) and the same token (`:152-158`), but it
carries the seller-id header, so collapsing them would lose that distinction.
The 35 `market-dashboard` call sites stay as they are.

## Risks and unknowns

- **RISK-1 — D2b deploy ordering (revised by S6-superseded).** The owner will not
  push until the Vercel env is updated for every renamed server. That removes the
  merge-before-env outage by process, so the fallback-read mitigation previously
  recommended here is **no longer required**. Two residual notes for `/plan`:
  (a) the guarantee is procedural, not enforced by code — a rebuild of an older
  deployment against new env, or a preview deployment on an environment that was
  missed, still breaks; (b) the env must be updated in **all** Vercel
  environments (production, preview, development), not just production.
- ~~**RISK-2 — WebViewActions is blocked.**~~ **Closed by S9** — deferred to a
  later ticket. See the headline section for the analysis, which is the scope
  note for that follow-up.
- **RISK-2a (new) — the chat host stays disclosed (S11).** Because
  `WebViewActions.tsx` is retained and keeps reading
  `NEXT_PUBLIC_CHAT_BACKEND_URL` from client-bundled code, that variable is
  excluded from the rename and the chat backend hostname remains readable in the
  JS bundle. This is a deliberate, accepted gap — but it means the ticket
  delivers "six of seven hosts hidden", not "no leaking at all". `spec.md` must
  state this plainly so the acceptance criteria are not written against an
  unachievable goal.
- **RISK-3 — D4 is 272 call sites**, with four places the compiler will not
  catch:
  1. `services/sellerDashboard/index.ts:674` — untyped literal in a plain header object. Highest risk.
  2. `utils/server/tokenManager.ts:310` — `getTokenForServer(server as ProxiedServer)` casts from raw `string`, defeating the check.
  3. `serverRequests/ServerFetch.tsx:112` — hardcoded `request_server: "market"` telemetry label; cosmetic but reads stale.
  4. `services/home.ts:529,544` use `server:'market'` (single quotes, no space) and `components/Cart/PlaceOrderButtons.tsx:63` uses `server:"market"` (no space) — a naive `server: "` search misses all three.
  Phase A removes a fifth (`app/(client)/api-test/page.tsx:31`, a duplicate 4-member `ServerType` with 96 call sites that would compile silently against old values).
- **RISK-4 — two unions drift.** `ProxiedServer` (`tokenManager.ts:7-14`, 7 members) and `ServerType` (`fetchData.ts:16-25`, 9 = the 7 plus `"local"`, `"upload story"`) are unlinked and hand-maintained. Renaming one and not the other compiles but misroutes.
- **RISK-5 — uncommitted work on `develop` is growing.** Verified again this run: `IS-FROM-GO` has zero matches repo-wide, `"fullUrl"` is gone, the `console.log` is gone. The working-tree set is now **five** files, not four — `services/auth.ts` was edited during this session (see above). Per intake, stash and restore on the ticket branch; the stash **must** precede branch creation (IM-8) and **all five** must appear in `plan.md` (IM-4):
  `app/api/proxy/route.ts`, `app/api/auth/register-device/route.ts`,
  `app/api/internal/mobile-error-log/route.ts`, `utils/server/tokenManager.ts`,
  `services/auth.ts`.
  This set is drifting between runs. `/plan` should re-check `git status` rather
  than trust this list, and further ad-hoc edits to `develop` before the ticket
  branch exists will keep widening it.
  **Still unverified:** whether the `Cache-Control: no-store` addition to the proxy's binary path was included.
- **RISK-6 — S12 collateral.** Removing the logger entirely deletes
  `utils/requestLoggerClient.ts` and touches `utils/fetchData.ts` (import `:12`;
  calls `:467,545,594`) and `utils/functions.tsx` (`getLastRequest` `:14`).
  Two consequences to settle at `/plan`:
  (a) `getLastRequest` enriches client error reports — removing it degrades that
  diagnostic context, so confirm nothing depends on it before deleting;
  (b) the IndexedDB store `RequestLoggerDB` persists in existing users' browsers
  after the code ships, retaining up to 3 days of URLs, bodies, responses and
  user IDs. Code removal alone does not clear it.
- **RISK-7 — D4 remains obfuscation only.** The client must send the token, so all seven values are still readable in the JS bundle. An attacker learns *that* seven services exist and can still enumerate them via `400 "Invalid server type"`; they simply no longer learn *what* each one is. This does not secure the proxy and must not be recorded as if it did.

## Residual disclosure after this ticket ("no leaking at all", S1)

S1's goal is not fully reachable within the current scope. These remain and
should be named as out of scope in `spec.md` so the gap is explicit:

- **`NEXT_PUBLIC_CHAT_BACKEND_URL` — the chat backend hostname stays readable in the JS bundle** (S11/RISK-2a). This is the largest accepted gap: the ticket hides six of the seven backend hosts, not all seven.
- `WebViewActions.tsx` continues to call the chat backend directly from the browser, bypassing `/api/proxy` (S9).
- `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` and `NEXT_PUBLIC_MEDIA_API_KEY` stay in the client bundle (direct browser uploads). The API key is a live credential and needs its own ticket regardless.
- `next.config.ts` `images.domains` publicly names the media host, the staging host, and the S3 bucket.
- The seven opaque D4 tokens are visible in the bundle (RISK-7).
- Bearer tokens in webview URLs (headline finding) — separate security ticket.
- `/simulateUser` is retained per S3.

Taken together: the accurate claim after this ticket is **"six of seven backend
hosts hidden, service names obfuscated, debug surfaces removed"** — not "no
leaking at all". `spec.md` should write its acceptance criteria against that.

## Open questions

**None remain.** All questions raised by this research are settled by S9–S16.
The ticket is ready for `/spec`.

One carry-over item that is a task, not a question: `NEXT_PUBLIC_OTP_BACKEND_URL`
is still present at line 23 of both `.env.development` and `.env.production`
(verified after the owner reported deleting it — the edit did not land). It has
zero code references. It is env-file housekeeping outside the repo's tracked
files, so it does not block any stage; `/plan` should simply note it alongside
the six-variable rename so it is not forgotten during the env update.

Resolved this run:

- ~~Does Laravel actually serve the two Go product paths?~~ They **should** be served by Go (S14) — the current Laravel routing is a defect, so S10 is a bug fix.
- ~~Leave stale `RequestLoggerDB` data or ship a cleanup?~~ Leave to the 3-day purge (S15).
- ~~Is `NEXT_PUBLIC_OTP_BACKEND_URL` dead?~~ Yes — remove during the env update (S16).

Resolved in the prior run:

- ~~How should `WebViewActions.tsx` handle its caller-supplied token?~~ Deferred (S9).
- ~~Do `compare.tsx`'s calls belong on Laravel or Go?~~ Go (S10), verified implementable.
- ~~Does `services/auth.ts:679` need the API host?~~ No — already changed to the media base URL in the working tree.
- ~~Ship the D2b fallback or require the env update first?~~ Env update first; owner will not push before it (supersedes S6).
- ~~Confirm the D4 token values?~~ Confirmed (S13).

## Correction to the source document

`docs/security/backend-disclosure-decisions.md:61-68` states that after D1
"every remaining read of these seven vars is server-side, so the rename is
mechanical and breaks nothing." **This is false** — it was written from an
incomplete grep. A full inventory found 48 read sites, four of them
client-reachable and surviving D1. Only `NEXT_PUBLIC_COMMENT_BACKEND_URL` is
read exclusively from server-only files and is a genuine two-line rename. The
doc should be corrected; it is currently a misleading input to `/plan`.

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
