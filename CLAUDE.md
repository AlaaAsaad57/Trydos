# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Trydos — a multilingual e-commerce / live-shopping storefront. Next.js 16 (App Router) + React 19 + TypeScript + Zustand 5 + TailwindCSS 4, deployed on Vercel with a separate Go backend (`NEXT_PUBLIC_GO_BACKEND_URL`).

`.github/copilot-instructions.md` is the authoritative coding-standards document for this repo (security checklist, fetch patterns, store rules, breakpoints, "no automated tests" policy). Read it before non-trivial work — the notes below complement, not replace, it.

## Commands

Package manager is **pnpm** (note: `pnpm-lock.yaml`, but `.gitlab-ci.yml` historically used yarn).

```bash
pnpm dev            # dev server (next dev)
pnpm turbo          # dev server with Turbopack
pnpm build          # production build
pnpm start          # serve production build
pnpm lint           # next lint (ESLint config is permissive — many a11y/hook rules off)
pnpm knip           # find unused files/exports/deps
ANALYZE=true pnpm build   # bundle analyzer (@next/bundle-analyzer)
```

There is **no test suite** — the project relies on clean code and type-checking, not tests. Do not add test files unless explicitly asked. (`.gitlab-ci.yml` references Cypress but no `cypress/` dir exists in the working tree.)

## Architecture

### Request entry: `proxy.ts` (the middleware)
Next.js 16 renames `middleware.ts` → **`proxy.ts`**. This single file runs on every request and handles:
- **i18n locale routing** — supported languages `en`/`ar`/`tr`/`ku`, default `en`; country detection (default `gb`). Rewrites/redirects URLs under `app/(client)/[lang]/`.
- **Bot detection** (googlebot, facebookexternalhit, etc.). Rate limiting / abuse protection is handled at the platform edge by **Vercel Firewall**, not in this file.
- Locale is persisted in non-HttpOnly cookies for the client.

### Routing layout (`app/`)
- `app/(client)/[lang]/` — the main user-facing app; every page is locale-scoped. `@modal/` is a parallel route slot for intercepted modal routes.
- `app/(special)/` — special-case routes (redirects, etc.).
- `app/api/` — route handlers grouped by domain (`auth`, `home`, `products`, `stories`, `fcm`, `revalidate`, `proxy`, …).
- Sitemaps are generated dynamically (`app/sitemap-*.xml`, `robots.ts`).

### Data fetching — three distinct paths (do not mix)
1. **Server components / server actions → `serverRequests/HandleAuthedFetch.ts`**. Reads the auth token from cookies (`MARKET-TOKEN`, falling back to `DEVICE-TOKEN`), and on a 401 auto-registers a guest token (`/auth/register-guest`) and retries. Cookie writes silently no-op during pure render (only allowed in Server Actions / Route Handlers). Wraps `fetchServerData` (`serverRequests/ServerFetch.tsx`).
2. **Client-side (services, handlers) → `utils/fetchData.ts`** with the `{ url, method, body, server, reqTitle }` shape.
3. **Bare `fetch`** only for internal API routes you control (e.g. `/api/auth/update-user`), where token injection isn't needed.

Endpoint path constants live in `utils/endpointConfig.tsx`.

### State — single combined Zustand store (`store/index.ts`)
All slices (`auth`, `Cart`, `chat`, `Details`, `homepage`, `listing`, `search`, `notifications`) live in `store/<domain>/reducer.ts` and are spread into one `useAppStore`. Devtools middleware is applied **only** in development — do not add it elsewhere. In non-React / service code use `useAppStore.getState()`; never call the hook in a Server Component.

### Services (`services/`)
Domain modules (`auth.ts`, `cart.ts`, `chat.ts`, `search.ts`, `order(s).ts`, plus `cloudinary/`, `elastic/`, `RDB/`, `sellerDashboard/`, `wallet/`) hold client-side business logic. They call `fetchData`, then dispatch into the store via `useAppStore.getState()`. Functional, not class-based.

### API protection — Vercel Firewall
Rate limiting and abuse/DDoS protection run at the platform edge via **Vercel Firewall** (rules configured in the Vercel dashboard), before functions are invoked. There is no in-code rate-limiter wrapper. If a specific endpoint needs business-logic limits (auth, OTP, checkout), use an edge-compatible limiter such as Upstash `@upstash/ratelimit` — never `ioredis` in middleware (it can't run on the Edge runtime).

### Auth & tokens
JWTs live **only** in HttpOnly cookies — `MARKET-TOKEN` (logged-in), `DEVICE-TOKEN` (guest), `User-Data` (profile JSON). Read server-side via `utils/cookies/cookie-manager` / `next/headers`. Never put tokens in localStorage or expose them to client components.

### Error reporting & analytics
`LogError` / `LogServerError` route to **Sentry** (config in `sentry.*.config.ts`, `instrumentation*.ts`). Analytics via `utils/gtag.ts` (Google Analytics) and PostHog (`utils/posthog.ts`) for session replay + product analytics.

### Integrations
Firebase / FCM push (`utils/firebaseAdmin.ts`, `utils/NotificationHandler.ts`, `app/api/fcm`), Cloudinary media, Agora RTC (live video), Elasticsearch search, Redis (`ioredis`), and the private `rdb` digital-banking package (Git dependency).

## Conventions

- **Path aliases** (`tsconfig.json`): `@/*`, `services/*`, `components/*`, `styles/*`, `assets/*` all resolve from repo root. Bare imports like `utils/...`, `store`, `serverRequests/...` work because `"*": ["./*"]` is mapped.

- **TailwindCSS uses custom max-width breakpoints** (inverted): `xs`/`sm` = max 480px, `md` = max 768px, `lg2` = max 912px, `lg` = min 769px. Use these, not raw pixels. Default font is `font-sans` (Quicksand).
- **React Compiler is enabled** (`reactCompiler: true`) — don't add manual `useMemo`/`useCallback` without a profiled reason.
- `next/image` domains are allowlisted in `next.config.ts` (`images.domains`); add new media hosts there.

## Security note

`package.json` contains a **hardcoded GitLab access token** embedded in the `rdb` Git dependency URL. Treat it as a leaked secret — it should be rotated and moved to an auth'd `.npmrc` / env var rather than committed. Flag, don't propagate.
