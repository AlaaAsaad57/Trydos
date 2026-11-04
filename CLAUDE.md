# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Long rules live in `docs/claude/`. Read the file named in each "Read" line when your task matches it.

## Project

Trydos — a multilingual e-commerce / live-shopping storefront. Next.js 16 (App Router) + React 19 + TypeScript + Zustand 5 + TailwindCSS 4, deployed on Vercel against two separate backends: the **core** backend (`BACKEND_URL`) and the **gateway** (`GO_BACKEND_URL` — pending rename, see "Stack-agnostic naming").

`.github/copilot-instructions.md` is the authoritative coding-standards document for this repo (security checklist, fetch patterns, store rules, breakpoints, "no automated tests" policy). Read it before non-trivial work — the notes below complement, not replace, it.

## Commands

Package manager is **pnpm** locally and in GitHub Actions. **Vercel runs yarn** — never add `packageManager` to `package.json`.

```bash
pnpm dev            # dev server (next dev)
pnpm turbo          # dev server with Turbopack
pnpm build          # production build
pnpm start          # serve production build
pnpm lint           # next lint (ESLint config is permissive — many a11y/hook rules off)
pnpm knip           # find unused files/exports/deps
ANALYZE=true pnpm build   # bundle analyzer (@next/bundle-analyzer)
```

```bash
pnpm test:run       # unit suite (Vitest)
pnpm test:e2e:live  # browser suite against staging (builds + starts the app first)
pnpm e2e:health     # is staging answering? run this before blaming a test
pnpm lint:i18n-parity   # ar/tr/ku translation keys are in step
```

Two suites exist: the **unit** suite (`tests/`, Vitest) and the **browser** suite (`tests/e2e/`, Playwright, run against staging). In CI, neither suite runs on a push or a pull request. Both run every **Friday** on `main` (unit at 02:10 UTC in `tests.yml`: parity, lint, typecheck, unit; browser at 02:30 UTC in `test-e2e.yml`), or by hand with `gh workflow run Tests` / `gh workflow run E2E --ref <branch>`. Deploying is by hand too (`gh workflow run Deploy`). Do not add tests outside these two, and do not add a test for code that has no caller. Anything you do add must follow the testing rules below.

## Opening the app by hand — always use the `sy-en` locale

Any URL you open yourself (browser, curl, Playwright, screenshot) uses
`/sy-en/...`, never `/gb-en/...`. `gb` is not in the region list, so the app
opens the "Select Your Region" modal over the page and every click lands on it.

## Architecture

### Request entry: `proxy.ts` (the middleware)
Next.js 16 renames `middleware.ts` → **`proxy.ts`**. This single file runs on **full document navigations only** — its matcher (`proxy.ts`, bottom of file) excludes `/api`, `_next`, `static`, sitemaps, `robots`, `manifest.json`, the asset folders (`assets`, `icons`, `fonts`, `images`, `styles`, `translations`, `reports`) and any path containing a dot; and its `missing:` clause additionally skips prefetches (`purpose: prefetch`, `next-router-prefetch`), Server Actions (`next-action`) and RSC navigations (`next-router-state-tree`). **It never runs on `/api/proxy` or any other route handler.** Check the matcher before assuming a request reaches it. It handles:
- **i18n locale routing** — supported languages `en`/`ar`/`tr`/`ku`, default `en`; country detection (default `gb`). Rewrites/redirects URLs under `app/(client)/[lang]/`.
- **Bot detection** (googlebot, facebookexternalhit, etc.). Rate limiting / abuse protection is handled at the platform edge by **Vercel Firewall**, not in this file.
- Locale is persisted in non-HttpOnly cookies for the client.

### Routing layout (`app/`)
- `app/(client)/[lang]/` — the main user-facing app; every page is locale-scoped. `@modal/` is a parallel route slot for intercepted modal routes.
- `app/(special)/` — special-case routes (redirects, etc.).
- `app/api/` — route handlers grouped by domain (`auth`, `home`, `products`, `stories`, `fcm`, `revalidate`, `proxy`, …).
- Sitemaps are generated dynamically (`app/sitemap-*.xml`, `robots.ts`).

### Data fetching — three distinct paths (do not mix)
1. **Server components / server actions → `serverRequests/HandleAuthedFetch.ts`**. Reads `MARKET-TOKEN` (one cookie for guest AND signed-in). Its 401 handling is in the sessions file below. Cookie writes no-op during pure render (allowed only in Server Actions / Route Handlers). Wraps `fetchServerData` (`serverRequests/ServerFetch.tsx`).
2. **Client-side (services, handlers) → `utils/fetchData.ts`** with the `{ url, method, body, server, reqTitle }` shape.
3. **Bare `fetch`** only for internal API routes you control (e.g. `/api/auth/update-user`), where token injection isn't needed.

Endpoint path constants live in `utils/endpointConfig.tsx`.

### Sessions and tokens — summary
- Access token lives **60 seconds**. Refresh token lives **2 days** and is **single-use** (every exchange rotates the pair). So a 401 on a signed-in page older than a minute is normal.
- Each service has its own cookie pair (market, chat, stories, comments). A 401 on one never means another is broken. Wallet has no refresh.
- Never treat the first 401 as a failure. Judge the **first answer that is not a 401**. `refresh-token 401` + `register-guest` is a lost session.
- `/api/proxy` sets `x-market-backend: gateway|core` — read it, never guess.

**Read `docs/claude/sessions-and-tokens.md` before you judge any 401, or touch `utils/fetchData.ts`, `services/auth.ts` or `HandleAuthedFetch`.**

### State — single combined Zustand store (`store/index.ts`)
All slices (`auth`, `Cart`, `chat`, `Details`, `homepage`, `listing`, `search`, `notifications`) live in `store/<domain>/reducer.ts` and are spread into one `useAppStore`. Devtools middleware is applied **only** in development — do not add it elsewhere. In non-React / service code use `useAppStore.getState()`; never call the hook in a Server Component.

### Services (`services/`)
Domain modules (`auth.ts`, `cart.ts`, `chat.ts`, `search.ts`, `order(s).ts`, `elastic/`, `RDB/`, `sellerDashboard/`, `wallet/`) hold client-side business logic. They call `fetchData`, then dispatch into the store via `useAppStore.getState()`. Functional, not class-based.

### API protection — Vercel Firewall
Rate limiting and abuse/DDoS protection run at the platform edge via **Vercel Firewall** (rules configured in the Vercel dashboard), before functions are invoked. There is no in-code rate-limiter wrapper. If a specific endpoint needs business-logic limits (auth, OTP, checkout), use an edge-compatible limiter such as Upstash `@upstash/ratelimit` — never `ioredis` in middleware (it can't run on the Edge runtime).

### Auth & tokens
JWTs live **only** in HttpOnly cookies — the service pairs above, plus `User-Data` (profile JSON). `DEVICE-TOKEN` is legacy: never read or set it (it survives only in logout-cleanup lists). Read server-side via `utils/cookies/cookie-manager` / `next/headers`. Never put tokens in localStorage or expose them to client components.

### Error reporting & analytics
`LogError` / `LogServerError` route to **Sentry** (config in `sentry.*.config.ts`, `instrumentation*.ts`). Analytics via `utils/gtag.ts` (Google Analytics) and PostHog (`utils/posthog.ts`) for session replay + product analytics.

**Whenever you add a new PostHog event, document it in `docs/posthog-events.md`** — the event name, when it fires, and its properties. Keep that file in sync with the events emitted in code.

### Integrations
Firebase / FCM push (`utils/firebaseAdmin.ts`, `utils/NotificationHandler.ts`, `app/api/subscribe`, `app/api/unsubscribe`),  media, Agora RTC (live video), Elasticsearch search, Redis (`ioredis`), and the private `rdb` digital-banking package (Git dependency).

**Elasticsearch is a copy, and it lags.** Listings, search, product pages and
the product's reviews / Q&A read from Elasticsearch, not from the backend that
took the write. Market (products) and comments writes reach the index **seconds
later**. So a read straight after a write can show the old state; that is not a
lost write. Reviews: `GetRatingCommentsForProduct` skips `status: "deleted"`.

## Conventions

- **Path aliases** (`tsconfig.json`): `@/*`, `services/*`, `components/*`, `styles/*`, `assets/*` all resolve from repo root. Bare imports like `utils/...`, `store`, `serverRequests/...` work because `"*": ["./*"]` is mapped.
- **TailwindCSS uses custom max-width breakpoints** (inverted): `xs`/`sm` = max 480px, `md` = max 768px, `lg2` = max 912px, `lg` = min 769px. Use these, not raw pixels. Default font is `font-sans` (Quicksand).
- **React Compiler is enabled** (`reactCompiler: true`) — don't add manual `useMemo`/`useCallback` without a profiled reason.
- `next/image` domains are allowlisted in `next.config.ts` (`images.domains`); add new media hosts there.

## Testing — a failure must say exactly what broke

A test tells you *what* broke, not *that* something broke. Rules in short:

- **Every assertion has a message** that says what should be true, in plain words. Put the status code or id in it when it helps. Never put a token, one-time code or phone number in it.
- **One assertion per step** that can fail on its own. Name the backend whenever a step calls one (core, gateway, chat, stories, comments, wallet, media, search).
- **A partial success is a failure.** Check each part, and check the content, not only that something exists.
- **Never assert on a count.** Assert the thing you mean, by name.
- **Long browser flows use `test.step()`.** Copy `tests/e2e/profile.live.spec.ts`.
- **A red test is not a bug report.** Confirm the bug in the app code first. Only then touch app code.
- **Every bug fix needs a test you saw red first, then green.** Say which test, and that you saw it red, in the commit and the reply. Keep the test in `tests/`. Prefer the unit suite.
- **Adding a step or backend to a flow adds its own check** in the same change.

**Read `docs/claude/testing-rules.md` before you write or change a test, or fix a bug.** For a red browser test, also read `docs/claude/e2e-known-causes.md` before you suspect the app.

## Internationalization — MANDATORY for every user-visible string

**Any word or sentence a user can see is translatable. Never ship a hardcoded string.** This covers JSX text, `placeholder` / `aria-label` / `title` / `alt`, button labels, validation and error messages, toast/dialog copy, and copy built in helper/`.ts` files (e.g. `validate()`, diff builders), not just `.tsx`.

The app has **4 languages**: `en` is the source (the English string *is* the key — no file), and `ar` / `tr` / `ku` are looked up in `public/translations/translations.<lang>.js`. Use `translateFunction(key)` (client) / the `utils/server` variant (server components — see the async-cache rule).

**Before adding or editing any user-visible text:**
1. **Check** whether the exact English key exists in **all three** files (`grep -F '"<exact string>":'`).
2. **If it exists**, reuse it. Do **not** invent a synonym.
3. **If it is missing**, add the key to **all three** files (correct `ar`, `tr`, `ku`), *then* use it in code.

**Rules:**
- **Never miss a string.** Trace every hardcoded word, including placeholders, alts and helper-file messages.
- **Never deduplicate keys.** Each distinct English string is its own key, one entry per file.
- **Interpolation:** translate the static sentence and interpolate the value — `` `${t("Missing")}: ${name}` `` — never build a key by concatenation.
- Keep the three files **key-parallel** in the same edit.

## Stack-agnostic naming — never encode the backing technology

**Never name or store anything after the technology that implements it.** No `go`, `laravel`, `nest`, `next`, `django`, `rails`, `symfony`, `express`, … Name things after the **role they play in the product**. This covers env vars, identifiers, cookie/storage keys, file and directory names, ticket/branch names, HTTP header and query names, API fields, telemetry/log payloads and error messages.

```
✗ GO_BACKEND_URL, GO_APIS, isFromGoApi, isLaravelVerify, { backend: "laravel" }
✓ GATEWAY_BACKEND_URL, GATEWAY_APIS, isGatewayApi, isCoreVerify, { backend: "core" }
```

Two backends serve this app: the **gateway** (guest/allow-listed traffic) and the **core** backend (`BACKEND_URL`, verified-user traffic). Use those words in code, comments, docs and tickets.

**Exempt** (framework-mandated): imports from `next/*`, the `NEXT_PUBLIC_` env prefix, config files a tool names (`next.config.ts`), and dependency names in `package.json`.

**Security rule too:** nothing that reaches the client (response bodies, headers, error text, bundle identifiers, public env values) may name the backend technology.

## Security note

`package.json` contains a **hardcoded GitLab access token** embedded in the `rdb` Git dependency URL. Treat it as a leaked secret — it should be rotated and moved to an auth'd `.npmrc` / env var rather than committed. Flag, don't propagate.

### Known and accepted — do not re-raise

- **`app/api/auth/simulate/route.ts`** — an unauthenticated `POST` that sets `MARKET-TOKEN`, `User-Data`, the chat/stories/wallet tokens and `USER_ID_HASH` from the request body. It has no environment gate, and `proxy.ts`'s matcher excludes `/api`, so nothing gates it in code. **This is known.** It exists for testers only and is slated for removal. Do **not** open a ticket for it, do **not** raise it as a review finding, and do **not** build anything that depends on it — set auth cookies through the browser's own cookie store instead.

<!-- wf governance text: v3.4.0 (full text moved to docs/claude/workflow-governance.md) -->

# Engineering Workflows v3 — project profile

Governance contract for any AI agent (and human) working in this repository.
When in doubt, stop and ask the Workflow Owner.

**Read `docs/claude/workflow-governance.md` before you work on any `_specs/<ticket>/` item or any `/wf:*` stage.** It holds the stages, hard stops, forbidden actions, review gates and small-change rules. Do not edit it; it is a copy of the `wf` plugin text.

**Mission.** This repository hosts the Trydos storefront — a multilingual
e-commerce / live-shopping web app (Next.js App Router, two backends: the
**gateway** and the **core** backend). The mission of the engineering workflow is
to make every change **small, reviewed, and verifiable**, moving through a fixed
set of stages with explicit review gates — never improvising scope or skipping
review.

**Base branch — this repository overrides the plugin default.** The shared rules
(GU-4 / IM-3) say `main`; in this repository the base branch is
**`development`**. `main` is the staging branch (storefront gate) and is never
branched from or merged into directly. So: `implement` creates `ticket/<slug>`
from a clean **`development`**, and `/wf:publish-pr` opens the PR against
**`development`** (`--base development`). This applies to `development` work
items only — `study` and `research` cut no branch and open no PR.

> **`develop` is dead — never branch from it.** `origin/develop` is gone. A
> workflow trigger, script or document still naming `develop` does nothing; fix
> it when you touch it.

**Protected runtime paths.** The paths below are this repository's runtime. They
may be changed **only** inside an approved `implement` stage, and only when the
approved `plan.md` lists them:

- `proxy.ts` — runs on full document navigations (locale routing, country
  detection, bot handling, the staging gate). Its matcher excludes `/api`,
  `_next`, static assets, and all prefetch / Server Action / RSC requests — see
  "Request entry" above.
- `next.config.ts` — build and image/host configuration
- `instrumentation.ts`, `instrumentation-client.ts`, `sentry.*.config.ts` —
  error reporting wiring
- `.github/workflows/**` — CI configuration

**Hard stops (short list).** Stop and ask the Workflow Owner if: a change touches a protected path outside an approved `implement` stage; acceptance criteria are missing or untestable; a test is needed that `plan.md > Tests` does not declare; scope grows past the approved spec/plan; or a stage's entry criteria are not met. Everything written to this repo is plain English. The full list is in the governance file.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
