# Security Remediation Plan — Trydos Web

> Derived from the Stage 0–2 assessment (`stage0_recon.md`, `stage1_auth.md`,
> `stage2_idor.md`) and verified against the current `develop` codebase.
> **Date:** 2026-07-15 · **Owner:** ai_agent (author) → human review/verify.
> **Revision:** r2 — folds in scope decisions (see "Decisions" below).

## Decisions locked for this revision

- **Media API key** (`NEXT_PUBLIC_MEDIA_API_KEY`) — kept public for now. No change.
- **F0-01 CSP** — deferred to a dedicated session.
- **F1-05 verbose errors** — **backend-owned.** This app is only the BFF/relay;
  the upstream service must return generic errors. Moved to section B.
- **F0-03 fingerprint headers** — **won't fix.** Kept as-is by decision.
- **Cookie TTL** — env-driven: **48h for all token cookies**, **1 year for all
  other cookies** (see A2).
- **Client IP** — move server-side, make `userIP` HttpOnly. **`referer` left as-is.**
- **Chat host (`FILE_SERVER`)** — usage removed by the team; residual dead export
  still to be cleaned + verified (A4).

**Validation baseline (repo has _no test suite_):** each task is validated by
`pnpm lint` + `pnpm build` (type-check) + a **manual auth-flow smoke test**
(guest → send OTP → verify → `/api/auth/me` → one proxied call → logout). No test
files are added. New user-facing strings → add to all three
`translations.{ar,tr,ku}.js` before use.

---

## A. Frontend fixes (this repo)

### A1 — F1-02 · Response/cookie data minimization · 🟠 Medium
**Problem:** Internal wallet fields (`WALLET_USER` Mongo id, `isBlocked`,
`isTwoFactorEnabled`, `kycVerification`) are (a) stored in the `WALLET_USER`
cookie and (b) returned **unsanitized** to the client.
**Root cause:**
- `app/api/auth/login/route.ts:315` returns `WalletUser: walletUserData` raw
  (chat/stories go through `sanitizeServiceUser`, wallet does not).
- `WALLET_USER` cookie stored whole (`login/route.ts:299`).
- `utils/server/tokenManager.ts:213` `getCurrentUser()` returns `walletUser` raw
  to `/api/auth/me`.
**Change:**
- Add `sanitizeWalletUser()` in `tokenManager.ts` returning only UI-consumed
  fields (balance/display), dropping internal id, `isBlocked`,
  `isTwoFactorEnabled`, raw `kycVerification`. Apply in **both** the login
  response and `getCurrentUser()`.
- Trim the `WALLET_USER` cookie to the same minimal shape (grep `WALLET_USER`
  first to confirm no server code reads a dropped field).
- **Keep** nested `access_token` in `USER_CHAT`/`USER_STORIES` cookies — HttpOnly,
  and the proxy's re-auth source (`getTokenForServer`, `tokenManager.ts:137/154`);
  already stripped from client responses by `sanitizeServiceUser`. Just confirm
  `/api/auth/me` still strips it.
**Files:** `utils/server/tokenManager.ts`, `app/api/auth/login/route.ts`; grep
`walletUser` consumers in `components/**`, `services/wallet/**`.
**Validation:** log in; `/api/auth/me` + login response carry no internal wallet
id / `isBlocked` / `isTwoFactorEnabled`; wallet UI still renders.
**Rollback:** remove the sanitizer calls.

### A2 — F1-04 · Env-driven cookie TTL (48h tokens / 1y rest) · 🟡 Low
**Problem:** every auth cookie uses `maxAge = 1 year`
(`SECURE_COOKIE_OPTIONS`, `tokenManager.ts:23`; `DEFAULT_OPTIONS`,
`cookie-manager.ts:96`) while tokens expire in 5 min–24 h.
**Change:**
- Introduce two **server-side** env vars (NOT `NEXT_PUBLIC_`):
  - `TOKEN_COOKIE_MAX_AGE` — default `172800` (48h), applied to the token/user
    HttpOnly set via `SECURE_COOKIE_OPTIONS` (`tokenManager.ts`). This covers the
    `SECURE_COOKIE_NAMES` set: `MARKET-TOKEN`, `DEVICE-TOKEN`, `CHAT-TOKEN`,
    `STORIES-TOKEN`, `rdb_at`, `USER_ID_HASH`, `User-Data`, `USER-CHAT`,
    `USER-STORIES`, `WALLET_USER`.
  - `DEFAULT_COOKIE_MAX_AGE` — default `31536000` (1y), applied to non-token
    cookies (`country`, `lang`, `language`, `referer`, `userIP`) in
    `cookie-manager.ts` `DEFAULT_OPTIONS` / `proxy.ts` `COOKIE_OPTIONS`.
- **Exception:** `VISIT-ID` stays at 1y (it is deliberately long-lived / non-
  rotating for OTP rate-limit keying — see its doc comment). Treat it as "rest".
- Read the env with a numeric fallback: `Number(process.env.X) || <default>`.
**Files:** `utils/server/tokenManager.ts`, `utils/cookies/cookie-manager.ts`,
`proxy.ts`, `.env.development`, `.env.production` (add the two vars, documented).
**Risk:** a 48h cookie under a longer-lived token (e.g. `STORIES-TOKEN` 30d) means
the cookie is dropped at 48h and the session must re-mint via the existing
401→guest-reregister/refresh path — verify that bridge holds before rollout.
**Validation:** inspect `Set-Cookie` `Max-Age` after login — 172800 on token
cookies, 31536000 on localization/`referer`/`userIP`; override via env and re-check.
**Rollback:** unset env vars → defaults restore prior 1y behavior for tokens too
(set default to old value if a fast revert is needed).

### A3 — F0-02 · `userIP` → server-side + HttpOnly · 🟡 Low
**Problem:** `userIP` (PII) is set `httpOnly:false` (`proxy.ts:327`), readable by
any page JS.
**Constraint:** it is **read client-side today** — `utils/functions.tsx:340`
(`getCookie("userIP")`) feeds it into the client error payload
(`utils/functions.tsx:370`, `utils/errorReported.tsx`).
**Change:**
- Drop `userIP` from the **client** error payload; rely on the server reporter,
  which already reads it via `getCookieServer("userIP")`
  (`utils/serverErrorReporter.ts:28`) and attaches `ip_address`.
- Then set the `userIP` cookie `httpOnly:true` in `proxy.ts:327`.
- `simulateUser` debug page reads IP from preview data, not the cookie —
  unaffected.
- **`referer` is intentionally left non-HttpOnly** (per decision) — it drives
  cart attribution client-side (`components/Cart/CartProvider.tsx:139`); not PII.
**Files:** `proxy.ts`, `utils/functions.tsx`, `utils/errorReported.tsx`.
**Validation:** `document.cookie` in browser shows **no** `userIP`; server-side
Sentry events still carry `ip_address`.
**Rollback:** restore `httpOnly:false` + the client read.

### A4 — Chat host residual dead export + verify · 🟡 Low
**Status:** chat `FILE_SERVER` usage was removed by the team. **But**
`components/Chat/chatsFunctions.tsx:8` still exports
`export const FILE_SERVER = process.env.NEXT_PUBLIC_CHAT_BACKEND_URL;`. Grep
confirms **no importer** — it is dead. A dead export of a `NEXT_PUBLIC_*` value
may or may not be tree-shaken out of the client bundle.
**Change:**
- Delete line 8 (dead export).
- `pnpm build`, then grep the emitted `.next/static/chunks/*.js` for
  `trydoschatnest` to **confirm the host no longer ships**. This is the actual
  proof the leak is closed, not the source edit alone.
**Files:** `components/Chat/chatsFunctions.tsx`.
**Validation:** `grep -r trydoschatnest .next/static` → no matches.
**Rollback:** trivial (restore the const) — but it should stay removed.

### A5 — Hygiene: dead public key · 🔵 Info
**Remove dead `NEXT_PUBLIC_ASSEMBLYAI_API_KEY`.** The live route
(`app/api/speech-recognition/route.ts`) uses the **server-only**
`ASSEMBLYAI_API_KEY`; the `NEXT_PUBLIC_` twin in `.env.development` /
`.env.production` is unused (confirmed absent from client bundles) but is a
foot-gun. **Delete both `NEXT_PUBLIC_ASSEMBLYAI_API_KEY` lines**; rotate the key
if it was ever live.
**Note:** the login-route token-logging `console.log`
(`app/api/auth/login/route.ts:50`) is **already commented out** — done. Leave the
other `console.log(otp_response)` (~`:149`) review to the backend-log cleanup in B1.
**Files:** `.env.development`, `.env.production`.
**Validation:** `pnpm build` clean; grep confirms the var is gone.

---

## B. Backend / coordination tickets (not fixable in this repo)

### B0 — F1-05 · Verbose internal error disclosure · 🟡 Low → **backend-owned**
This app is only the BFF: `/api/auth/login` **relays** the upstream body on a
non-OK OTP verify (`login/route.ts:141`), which currently includes
`detailed_error.internal: "PassportAuth: unauthorized"`. **Ask (backend):** the
OTP/verify service should return a generic client error + `request_id` and keep
internals server-side. The BFF already forwards full context to Sentry via
`LogServerError`. Minimal BFF change only if backend cannot: strip
`detailed_error`/`internal` before relaying.

### B1 — F1-01 · Wallet token `rdb_at` HS256 → RS256/ES256 · 🔴 High (Risk 15)
Owner: **RDB / wallet team.** Wallet token uses a symmetric shared secret while
all others use RS256 → any service holding the secret can mint wallet tokens
(money impersonation, forged `kycStatus`/`userType`), plus alg-confusion risk.
**Ask:** migrate to asymmetric; every verifier pins `algorithms:['RS256']` and
never trusts the token `alg` header; if HS256 must persist short-term, use a
≥256-bit isolated, rotated secret. This repo only holds the `rdb_at` cookie.
**Highest real risk — open first.** (Also: minimize backend server logs that dump
token-bearing bodies — keep the description minimal per request.)

### B2 — F1-03 · Static dev OTP `999999` · 🔵 Info (control)
Owner: **OTP / Go verify service** (verified server-side, not here). **Ask:** gate
behind an env flag + a CI guard that fails the build if the static path is
reachable when `NODE_ENV=production`; restrict to allow-listed test MSISDNs. OTP
send is already rate-limited with escalating lockout.

### B3 — F1-04 (backend half) · Session revocation / "log out other devices"
Owner: **market/auth backend.** Login reports
`Logged_in_from_another_device:true` with no prior-session invalidation. **Ask:**
server-side revocation list + "log out other devices"; step-up re-auth before
wallet-sensitive operations. Frontend A2 aligns cookie TTLs; true invalidation
needs the backend.

### B4 — Stage 2 carry-forward · Chat-server & money-flow IDOR testing
Owner: **security testing + backend.** Stage 2 could not confirm/refute
horizontal IDOR on `trydoschatnest.ramaaz.dev` (route map unknown) nor exercise
cart/order/wallet **write** IDOR (route-specific server-action IDs + OTP lockout).
**Ask:** provide a test route map / Postman collection + a non-rate-limited test
tenant. Top substantive gap.

---

## Suggested sequencing

1. **B1** (wallet HS256) — open with backend immediately; highest real risk.
2. **A4** (delete dead `FILE_SERVER` + verify bundle) + **A5** (dead key) — quick wins.
3. **A1** (wallet data minimization) — auth-route change.
4. **A2** (env cookie TTL) + **A3** (`userIP` HttpOnly) — cookie-layer, review carefully.
5. **B0 / B2 / B3 / B4** — backend coordination, parallel track.

## Not in this plan (by decision)
- CSP (F0-01) · media API key · fingerprint headers (F0-03).
