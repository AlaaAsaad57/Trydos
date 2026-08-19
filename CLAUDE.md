# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Trydos — a multilingual e-commerce / live-shopping storefront. Next.js 16 (App Router) + React 19 + TypeScript + Zustand 5 + TailwindCSS 4, deployed on Vercel against two separate backends: the **core** backend (`BACKEND_URL`) and the **gateway** (`GO_BACKEND_URL` — pending rename, see "Stack-agnostic naming").

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
1. **Server components / server actions → `serverRequests/HandleAuthedFetch.ts`**. Reads the auth token from the `MARKET-TOKEN` cookie (single auth cookie for guest AND logged-in), and on a 401 auto-registers a guest token (`/auth/register-guest`) and retries. Cookie writes silently no-op during pure render (only allowed in Server Actions / Route Handlers). Wraps `fetchServerData` (`serverRequests/ServerFetch.tsx`).
2. **Client-side (services, handlers) → `utils/fetchData.ts`** with the `{ url, method, body, server, reqTitle }` shape.
3. **Bare `fetch`** only for internal API routes you control (e.g. `/api/auth/update-user`), where token injection isn't needed.

Endpoint path constants live in `utils/endpointConfig.tsx`.

### State — single combined Zustand store (`store/index.ts`)
All slices (`auth`, `Cart`, `chat`, `Details`, `homepage`, `listing`, `search`, `notifications`) live in `store/<domain>/reducer.ts` and are spread into one `useAppStore`. Devtools middleware is applied **only** in development — do not add it elsewhere. In non-React / service code use `useAppStore.getState()`; never call the hook in a Server Component.

### Services (`services/`)
Domain modules (`auth.ts`, `cart.ts`, `chat.ts`, `search.ts`, `order(s).ts`, `elastic/`, `RDB/`, `sellerDashboard/`, `wallet/`) hold client-side business logic. They call `fetchData`, then dispatch into the store via `useAppStore.getState()`. Functional, not class-based.

### API protection — Vercel Firewall
Rate limiting and abuse/DDoS protection run at the platform edge via **Vercel Firewall** (rules configured in the Vercel dashboard), before functions are invoked. There is no in-code rate-limiter wrapper. If a specific endpoint needs business-logic limits (auth, OTP, checkout), use an edge-compatible limiter such as Upstash `@upstash/ratelimit` — never `ioredis` in middleware (it can't run on the Edge runtime).

### Auth & tokens
JWTs live **only** in HttpOnly cookies — `MARKET-TOKEN` (the single auth cookie, guest or logged-in) and `User-Data` (profile JSON). `DEVICE-TOKEN` is legacy: never read or set it (it survives only in logout-cleanup lists). Read server-side via `utils/cookies/cookie-manager` / `next/headers`. Never put tokens in localStorage or expose them to client components.

### Error reporting & analytics
`LogError` / `LogServerError` route to **Sentry** (config in `sentry.*.config.ts`, `instrumentation*.ts`). Analytics via `utils/gtag.ts` (Google Analytics) and PostHog (`utils/posthog.ts`) for session replay + product analytics.

**Whenever you add a new PostHog event, document it in `docs/posthog-events.md`** — the event name, when it fires, and its properties. Keep that file in sync with the events emitted in code.

### Integrations
Firebase / FCM push (`utils/firebaseAdmin.ts`, `utils/NotificationHandler.ts`, `app/api/fcm`),  media, Agora RTC (live video), Elasticsearch search, Redis (`ioredis`), and the private `rdb` digital-banking package (Git dependency).

## Conventions

- **Path aliases** (`tsconfig.json`): `@/*`, `services/*`, `components/*`, `styles/*`, `assets/*` all resolve from repo root. Bare imports like `utils/...`, `store`, `serverRequests/...` work because `"*": ["./*"]` is mapped.

- **TailwindCSS uses custom max-width breakpoints** (inverted): `xs`/`sm` = max 480px, `md` = max 768px, `lg2` = max 912px, `lg` = min 769px. Use these, not raw pixels. Default font is `font-sans` (Quicksand).
- **React Compiler is enabled** (`reactCompiler: true`) — don't add manual `useMemo`/`useCallback` without a profiled reason.
- `next/image` domains are allowlisted in `next.config.ts` (`images.domains`); add new media hosts there.

## Internationalization — MANDATORY for every user-visible string

**Any word or sentence a user can see is translatable. Before you write or edit UI copy, translate it — never ship a hardcoded string.** This applies to JSX text, `placeholder` / `aria-label` / `title` / `alt`, button labels, validation and error messages, toast/dialog copy, confirm-diff labels — and to copy built in helper/`.ts` files (e.g. `validate()`, diff builders), not just `.tsx`.

The app has **4 languages**: `en` is the source (the English string *is* the key — no file), and `ar` / `tr` / `ku` are looked up in the three files under `public/translations/translations.<lang>.js`. Resolve copy through `translateFunction(key)` (client) / the `utils/server` variant (server components — see the async-cache rule) rather than a raw literal.

**Workflow before adding/editing any user-visible text:**
1. **Check** whether the exact English key already exists in **all three** `translations.{ar,tr,ku}.js` files (`grep -F '"<exact string>":'`).
2. **If it exists**, reuse it — wrap the string in `translateFunction(...)` / `t(...)`. Do **not** invent a synonym or restyle the wording to something new.
3. **If it is missing**, first **add the key to every one of the three files** (with a correct `ar`, `tr`, `ku` translation), *then* use it in code. Never use a key that isn't in the files.

**Rules:**
- **Never miss a string.** Every hardcoded word/sentence must be traced and wrapped — placeholders, alts, and helper-file messages included.
- **Never deduplicate keys.** Each distinct English string is its own key with one entry per file; don't merge distinct strings under a shared key, and don't drop an existing key to avoid a near-duplicate. A repeated word still gets wrapped at every call site.
- **Interpolation:** translate the static sentence and interpolate the dynamic value — e.g. `` `${t("Missing")}: ${name}` `` — never build a key by string concatenation.
- Keep the three files **key-parallel**: a key added to one must be added to the other two in the same edit.

## Stack-agnostic naming — never encode the backing technology

**Never name or store anything after the technology that happens to implement it.** No `go`, `laravel`, `nest`, `next`, `django`, `rails`, `symfony`, `express`, … in any name or persisted value. Name things after the **role they play in the product**, not the stack behind them — a service that gets rewritten in another language must not force a rename (or, worse, keep a name that now lies).

Applies to: env vars, identifiers (constants, functions, types, object keys), cookie/storage keys, file and directory names, ticket/branch names, HTTP header and query names, API request/response fields, telemetry and log payloads, and error messages.

```
✗ GO_BACKEND_URL, GO_APIS, isFromGoApi, isLaravelVerify, { backend: "laravel" }
✓ GATEWAY_BACKEND_URL, GATEWAY_APIS, isGatewayApi, isCoreVerify, { backend: "core" }
```

Two backends serve this app; refer to them by role — the **gateway** (guest/allow-listed traffic) and the **core** backend (`BACKEND_URL`, verified-user traffic). Use those words in code, comments, docs, and tickets.

**Exempt** (framework-mandated, not our choice): imports from `next/*`, the `NEXT_PUBLIC_` env prefix Next.js requires, config files a tool dictates by name (`next.config.ts`), and dependency names in `package.json`. Everything we control is in scope.

**Why it is also a security rule:** advertising the server stack to the browser hands an attacker a free head start on which CVEs to try. Nothing that reaches the client — response bodies, headers, error text, bundle identifiers, public env values — may name the backend technology.

## Security note

`package.json` contains a **hardcoded GitLab access token** embedded in the `rdb` Git dependency URL. Treat it as a leaked secret — it should be rotated and moved to an auth'd `.npmrc` / env var rather than committed. Flag, don't propagate.

### Known and accepted — do not re-raise

- **`app/api/auth/simulate/route.ts`** — an unauthenticated `POST` that sets `MARKET-TOKEN`, `User-Data`, the chat/stories/wallet tokens and `USER_ID_HASH` from the request body. It has no environment gate, and `proxy.ts`'s matcher excludes `/api`, so nothing gates it in code. **This is known.** It exists for testers only and is slated for removal. Do **not** open a ticket for it, do **not** raise it as a review finding, and do **not** build anything that depends on it — set auth cookies through the browser's own cookie store instead.

<!-- wf governance text: v1.0.7 -->

# Engineering Workflow v1

Governance contract for any AI agent (and human) working in this repository.
This file is authoritative. When in doubt, stop and ask the Workflow Owner.

The ticket commands ship in the `wf` plugin and are namespaced: `/wf:start-ticket`,
`/wf:research`, `/wf:spec`, `/wf:plan`, `/wf:review`, `/wf:implement`, `/wf:verify`,
`/wf:publish-pr`. The project half of the config is `.claude/project-config.yaml`.

---

## Project profile

> Everything **below** the `---` after this section is the shared governance
> text, copied from the plugin's `templates/CLAUDE.md` unchanged. Only this block
> is per-project. When the plugin ships a new governance version, re-copy the
> shared text and keep this block.

**Mission.** This repository hosts the Trydos storefront — a multilingual
e-commerce / live-shopping web app (Next.js App Router, two backends: the
**gateway** and the **core** backend). The mission of the engineering workflow is
to make every change **small, reviewed, and verifiable**, moving through a fixed
set of stages with explicit review gates — never improvising scope or skipping
review.

**Base branch — this repository overrides the plugin default.** The shared rules
(GU-4 / IM-3) say `main`; in this repository the base branch is **`develop`**.
`main` is the staging branch (storefront gate) and is never branched from or
merged into directly. So: `/wf:implement` creates `ticket/<slug>` from a clean
**`develop`**, and `/wf:publish-pr` opens the PR against **`develop`**
(`--base develop`).

**Protected runtime paths.** The paths below are this repository's runtime. They
may be changed **only** inside an approved `implement` stage, and only when the
approved `plan.md` lists them:

- `proxy.ts` — runs on every request (locale routing, country detection, bot
  handling, the staging gate)
- `next.config.ts` — build and image/host configuration
- `instrumentation.ts`, `instrumentation-client.ts`, `sentry.*.config.ts` —
  error reporting wiring
- `.github/workflows/**` — CI configuration

---

## Workflow stages

Canonical stages (see the `wf` plugin's `workflow-config.yaml` and
`rules/workflow-rules.md` for full definitions; the project half of the config
is `.claude/project-config.yaml` in this repository):

1. `intake` — capture and qualify the request.
2. `research` — read-only investigation of the repo and impact.
3. `spec` — define what "done" means (criteria + test cases).
4. `plan` — decide the approach and concrete steps.
5. `review` — a reviewer reviews spec/plan before any code.
6. `implement` — apply the change per the approved plan.
7. `verify` — validate the change and review runtime impact.

Each stage produces an artifact under `_specs/<ticket>/` in this repository,
from the templates in the `wf` plugin's `templates/`.

## Hard stop conditions

Stop immediately and request Workflow Owner direction if any of these occur:

- A change would touch this repository's **protected runtime paths** (listed in
  **Project profile** above) outside an explicitly approved implement stage.
- The request requires deleting or rewriting existing workflow artifacts.
- Acceptance criteria are missing, ambiguous, or untestable.
- A stage's entry criteria are not met (e.g. implementing before plan approval).
- Scope grows beyond what the approved spec/plan describes.

## Language

**Everything written to this repository is in English.** Workflow artifacts,
comprehension questions and their options, review findings, ADRs, commit
messages, and PR text — regardless of the language the request or conversation
used. The conversation may be in any language; the artifacts never are.

**Write that English plainly.** The reader's first language is Arabic, so keep
the wording simple: short sentences, common words, no idioms, no rare or
academic vocabulary. This is about *vocabulary only* — the reader is a senior
engineer. Never simplify the technical content, the depth, or the reasoning, and
keep standard technical terms as they are (`scrape`, `cardinality`, `rollback`,
`AC-n`, …). Simple words, full engineering substance.

## Forbidden actions

- Do **not** write any artifact, comprehension question, or PR/commit text in a
  language other than English (see **Language** above).
- Do **not** create workflow commands unless a phase explicitly authorizes it.
- Do **not** implement tickets during research, spec, plan, or review stages.
- Do **not** modify the **protected runtime paths** (see **Project profile**) as
  part of workflow/governance work.
- Do **not** delete `_specs/`, `.claude/project-config.yaml` (this project's half
  of the config), or `.claude/settings.json` (which enables the `wf` plugin).
- Do **not** edit the shared governance text below **Project profile** in this
  copy. It is a copy. Change the master in the `wf` plugin
  (`templates/CLAUDE.md`), bump the plugin version, then re-copy.
- Do **not** skip stages or record a gate decision without completing the
  **comprehension check**. The single owner runs their own `/review` and
  `/verify` (self-review is expected; ADR-009) — there is no separate-reviewer
  requirement; the comprehension gate (CG-1..CG-7) is the control against
  rubber-stamping.

## Review gate requirements

- The gates `/review` and `/verify` are run per ticket by the **owner** themselves
  (self-review; ADR-009). Gate integrity comes from the **comprehension check**
  (the owner answers questions generated from the artifact), not a second person.
  They do **not** require an Engineering Manager.
- The `review` stage is a **mandatory gate**: no `implement` may begin until the
  owner accepts the `spec` and `plan` at `/review` (with the comprehension check
  completed).
- The owner signs off again at `verify` (comprehension check) before a ticket is
  considered done.
- Review decisions are recorded as `CHANGES_REQUESTED` / `REJECTED` / `APPROVED`
  against the relevant stage.
- At `/review`, an **advisory** AI panel (senior / security / performance,
  read-only) reviews the plan and records findings for the owner (ADR-010). It
  **informs** the decision — it never blocks or makes it; the comprehension gate
  remains the control.
- The comprehension check asks **at least 3 questions — a floor, not a fixed
  count** (ADR-012). Every gate includes **≥1 question on the integration /
  cross-flow axis** (what the change touches outside itself, which other flow
  shares that code or config), sourced from the plan's required
  **Integration surface** section; and `/review` adds **one question per `major`
  panel finding**. A finding may still be dismissed — only after it is understood.
- The **Workflow Owner** owns governance (workflow evolution, governance
  decisions, escalations, cross-project issues), not per-ticket sign-off. Escalate
  to the Workflow Owner only when a hard-stop or governance question arises.

## Small-change philosophy

- Prefer the smallest change that satisfies the acceptance criteria.
- One ticket = one focused outcome; split anything larger.
- Bias toward read-only investigation first; touch code last and minimally.
- Every change must be reversible and individually verifiable.
