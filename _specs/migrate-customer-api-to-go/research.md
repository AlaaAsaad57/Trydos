---
ticket: migrate-customer-api-to-go
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Research — migrate-customer-api-to-go

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Migrate this Next.js app's four customer-profile calls — `GET /customer/info`,
`POST /customer/update-profile`, `POST /customer/update-name`,
`GET /customer/approve-policies` — from the Laravel "market" backend
(`NEXT_PUBLIC_BACKEND_URL`) to the new Go Store Gateway
(`NEXT_PUBLIC_GO_BACKEND_URL`), preserving request/response parity. The ClickUp
task (86ey26atu) is the **backend contract reference**, not work to implement here.

## How routing works today (key finding)

Client customer calls use `fetchData({ ..., server: "market" })`. External
`server: "market"` requests are POSTed to the same-origin route `/api/proxy`,
which injects the HttpOnly `MARKET-TOKEN` (or `DEVICE-TOKEN`) server-side and
forwards to a backend base URL chosen by `getServerBaseUrl(server, url)`:

```
case "market": if (isFromGoApi(url)) → NEXT_PUBLIC_GO_BACKEND_URL
               else                  → NEXT_PUBLIC_BACKEND_URL   (Laravel)
```

`isFromGoApi(url)` returns true when the path is in the `GO_APIS` allow-list
(matched by `endsWith`) or `GO_API_PREFIXES` (matched by `includes`), in
`utils/server/tokenManager.ts` (lines 50–92). **The four `/customer/*` paths are
NOT yet in that list**, so they still resolve to Laravel.

**Therefore the migration is almost entirely a one-line-per-endpoint addition of
the four `/customer/*` paths to the `GO_APIS` allow-list.** No caller in
`services/*` or `components/*` needs to change its `url`/`server` — the same
`server: "market"` calls transparently reroute to Go once allow-listed. This is
the pattern already used for `/cart/*`, `/checklist`, `/home/currency`, etc.

## Relevant directories

- `utils/server/` — **the change site.** `tokenManager.ts` holds `GO_APIS` /
  `isFromGoApi` / `getServerBaseUrl` (the Laravel↔Go routing switch). **Not a
  protected path.**
- `app/api/proxy/` — `route.ts` server-side proxy that injects the token and
  calls `getServerBaseUrl`; also stamps an `IS-FROM-GO` response header (useful
  for verification). **Not a protected path.**
- `services/` — customer call sites: `home.ts` (`getCustomerInfo` → `/customer/info`),
  `auth.ts` (`UpdateName` → `/customer/update-name`, `UpdateProfile` →
  `/customer/update-profile`). **`services/auth.ts` IS a protected path** (see
  Risks) — ideally left untouched.
- `components/Cart/` — `PlaceOrderButtons.tsx` calls `/customer/approve-policies`.
- `utils/` — `endpointConfig.tsx` (`CUSTOMER_INFO_URL = "/customer/info"`);
  `fetchData.ts` (client fetch wrapper: proxy routing, 401 re-auth, success/message
  handling, `ignoredMessages` which already includes "Policies Approved!").

## Relevant config files

- `utils/server/tokenManager.ts` — `GO_APIS` array + `isFromGoApi()` (routing
  allow-list). **Primary edit target.**
- `.env` / Vercel env — `NEXT_PUBLIC_GO_BACKEND_URL` (Go base URL) and
  `NEXT_PUBLIC_BACKEND_URL` (Laravel base URL). No code change; must be set in the
  target environment.
- `next.config.ts` — **protected path.** `images.domains` allowlist: only relevant
  if the Go `image` storage URL uses a new host (must be allow-listed for
  `next/image`). To confirm during spec/plan.
- `.claude/project-config.yaml` — `protected_paths`, modes, validation_checks
  (typecheck / lint / build) used at `/verify`.

## Possibly affected services

- **Laravel "market" backend** — the four `customer/*` endpoints stop being called
  by the web app once rerouted (retirement is the epic's goal). Other `customer/*`
  endpoints (address/order/wallet/loyalty/chat/settings/firebase-token) stay on
  Laravel and are out of scope.
- **Go Store Gateway** (`NEXT_PUBLIC_GO_BACKEND_URL`) — must have the four
  endpoints live and must accept the same Bearer token the proxy injects
  (`MARKET-TOKEN` / `DEVICE-TOKEN`) with matching audience/client-id.
- **Client consumers unchanged in wiring but sensitive to response shape:**
  `home.getCustomerInfo` reads `data.customer_info` and feeds `/api/auth/update-user`
  (USER_DATA cookie) and `setOrderData({agree: ...is_approve_policies})`;
  `auth.UpdateProfile` reads `res.success`/`res.message` and does chat/wallet/stories
  side-updates + rollback; `PlaceOrderButtons` reads the approve-policies result.

## Test / validation commands available

*(listed only — `/research` does not run them; canonical in
`project-config.yaml > validation_checks`)*

- `pnpm exec tsc --noEmit` — TypeScript type-check (expected no-op; edit is a
  string-array addition).
- `pnpm lint` — ESLint (Next.js lint).
- `pnpm build` — production build succeeds.
- `pnpm knip` — unused files/exports/deps (sanity).
- Runtime spot-check (manual, non-CI): with the four paths allow-listed, confirm
  the proxy response carries `IS-FROM-GO: true` for each customer call and the UI
  (profile view/edit, name change, checkout policy consent) behaves unchanged.

## Risks and unknowns

- **Protected-path avoidance / mode.** The intended change is confined to
  `utils/server/tokenManager.ts` (+ possibly `app/api/proxy/route.ts`), neither
  protected → `standard` mode is correct. **Risk:** if response-shape differences
  force edits to `services/auth.ts` (protected path), MO-3 would require
  `high_risk` mode + ADR. Plan must keep changes out of `services/auth.ts`, or the
  mode must be escalated.
- **Response/envelope parity (highest functional risk).** `fetchData` derives
  `success` from HTTP `res.ok` and reads `responseData.message` /
  `responseData.data`. The Go endpoints must return the same shapes the callers
  read: `data.customer_info` (info), `data` = updated User resource (update-profile),
  `data = ""` + messages `successfully updated!` / `policies approved!`, and the
  User-resource field set (`gender {value,name}|null`, `image` storage URL / null,
  `is_phone_verified`, etc.). Mismatch silently breaks profile UI even though
  routing "works". Backend responsibility, but we depend on it.
- **Token acceptance.** Go must accept the Laravel-issued Passport token the proxy
  forwards (audience = configured client id), else every call 401s → triggers the
  re-auth widget. Cross-service dependency; confirm in the target env.
- **`endsWith` matching.** `isFromGoApi` matches by `normalizedUrl.endsWith(endpoint)`.
  `/customer/info|update-profile|update-name|approve-policies` are unlikely to
  collide, but verify no other allow-listed or Laravel-only path ends with the same
  suffix.
- **Error-status semantics.** Contract specifies 400 (Invalid token / uniqueness),
  403 (missing name), 401 (auth), 500 (unexpected). `fetchData` throws on `!res.ok`
  and surfaces `responseData.message`; behavior should match Laravel's, but the
  400-vs-403-vs-422 codes Go returns must line up with what callers expect
  (`UpdateName` currently relies on the old 403 path).
- **Server-side (RSC) usage.** Discovery shows customer/info is fetched
  **client-side** (`home.getCustomerInfo`), not via `serverRequests/`. Confirm no
  server component fetches these paths through a different base-URL codepath.
- **Pre-existing debug noise (not in scope, note only):** `tokenManager.ts:94`
  `console.log(url, isFromGoApi(url))` and the proxy `IS-FROM-GO`/`fullUrl` headers
  are debug artifacts; do not expand them.

## Open questions

- Are all four Go `/customer/*` endpoints deployed and reachable on the target
  `NEXT_PUBLIC_GO_BACKEND_URL` (staging + prod) at cutover time?
- Does the Go gateway accept the exact `MARKET-TOKEN`/`DEVICE-TOKEN` the proxy
  injects, with matching audience/client-id?
- Is Go's response for each endpoint byte-compatible with the Laravel shape the
  callers read (envelope keys, message strings, User-resource fields, `image`
  host)? If the `image` host differs, must it be added to `next.config.ts`
  `images.domains` (protected path → would raise the mode)?
- Should cutover be all-four-at-once or per-endpoint (the allow-list supports
  incremental, one path at a time, which lowers blast radius)?
- Is there a need to keep a fast rollback? (Removing the path(s) from `GO_APIS`
  instantly reverts to Laravel — natural rollback; confirm acceptable.)

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
