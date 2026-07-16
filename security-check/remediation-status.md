# Security Remediation — Status Summary

> Based on the Stage 0–2 assessment (`stage0_recon.md`, `stage1_auth.md`,
> `stage2_idor.md`). Tracks what was fixed on the frontend, what's left here, and
> the backend-owned items. **Date:** 2026-07-15.
> All frontend fixes below are applied to the working tree and type-check clean;
> the live auth smoke test is still pending (needs the real backend).

---

## ✅ Solved — frontend

| Fix | Finding | What changed |
|-----|---------|--------------|
| **Chat backend host leak** | recon | Removed the `FILE_SERVER` export that inlined `trydoschatnest.ramaaz.dev` into the client bundle. |
| **Wallet data minimization** | F1-02 | `sanitizeWalletUser()` strips internal/PII fields (`email`, `isBlocked`, `isTwoFactorEnabled`, `kycVerification`, `kycStatus`, `sessionId`) from the login response, `/api/auth/me`, and the `WALLET_USER` cookie. Functional `id` preserved. |
| **Client IP cookie** | F0-02 | `userIP` cookie is now `HttpOnly`; client IP attribution moved to Sentry ingestion (`sendDefaultPii`). Server-side readers unaffected. |
| **Cookie TTL** | F1-04 | Env-driven: **token cookies 48h** (`TOKEN_COOKIE_MAX_AGE`), **user-data & other cookies 1y** (`DEFAULT_COOKIE_MAX_AGE`). Fixed an accidental ~6.9-year TTL. `VISIT-ID` pinned to 1y (durable OTP rate-limit key). |
| **Dead-secret hygiene** | recon | Removed the unused `NEXT_PUBLIC_ASSEMBLYAI_API_KEY` and the dead `storeHashedUserId`/`getHashedUserId` (would have exposed the comments access token client-side, non-HttpOnly, at 1y). |

**Files touched:** `tokenManager.ts`, `login/route.ts`, `update-user/route.ts`,
`clear-tokens/route.ts`, `otpIdentity.ts`, `proxy.ts`, `functions.tsx`,
`chatsFunctions.tsx`, `serverRequests/stories.ts`, `StoriesBarServer.tsx`,
`cookie-manager.ts`, `AuthNavContainer.tsx`, `UserNavTopSection.tsx`,
`useUserData.tsx`, `.env.development`, `.env.production`.

---

## 🟡 Remaining — frontend

| Item | Finding | Status / decision |
|------|---------|-------------------|
| **Content-Security-Policy** (nonce-based in `proxy.ts`) | F0-01 | Deferred to a dedicated session. |
| **Fingerprint headers** (`x-matched-path`, `x-vercel-*`) | F0-03 | Decision: **accepted / won't fix**. |

---

## 🔴 Remaining — backend (out of this repo)

1. **F1-01 — Wallet token `rdb_at` HS256 → RS256/ES256.** Migrate to asymmetric signing, pin the verifier algorithm. *(highest real risk)*
2. **F1-03 — Static dev OTP `999999`.** Gate behind an env flag + CI guard for production; allow-list test numbers.
3. **F1-05 — Verbose internal errors** (`PassportAuth: unauthorized`). Return a generic error + `request_id`, keep internals server-side.
4. **F1-04 (backend half) — Session revocation.** No "log out other devices" / prior-session invalidation; concurrent logins allowed.
5. **F2-01 — IDOR / access-control testing.** Money-flow (cart/order/wallet writes) and chat-server horizontal IDOR remain untested — provide a test route map / non-rate-limited tenant.
