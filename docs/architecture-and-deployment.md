# Trydos — architecture and deployment (for DevOps)

A short map of the three parts we deploy, how each one is deployed, and
whether its CI/CD runs by itself. Checked against the repos and GitHub Actions
on 2026-09-15.

## 1. The big picture

```
                         Browser / mobile
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
     trydos.ramaaz.dev              media.ramaaz.dev
     (Cloudflare, proxied)          (Cloudflare, proxied)
                 │                           │
   ┌─────────────┼─────────────┐             │  WAF + rate limit
   ▼             ▼             ▼             ▼
/api/proxy   /ingest/*     everything    Apache on AWS EC2 (ap-south-1)
   │             │           else             │
trydos-proxy trydos-ingest    │          MediaServing (Docker: app + worker)
 Worker        Worker         ▼               │
   │             │          Vercel            ├─ AWS S3  (files)
   ▼             ▼        (Next.js app)       └─ Redis   (locks, job queue)
Backends     PostHog EU
(core, gateway, chat, stories, comments, wallet, search)
```

- **Cloudflare** (zone `ramaaz.dev`) sits in front of both the storefront and media.
- **Two Cloudflare Workers** take two paths of the storefront hostname. Vercel
  still serves every other path.

## 2. The three parts

| Part | Repo | Runs on | Deploy tool | CI/CD active? |
|---|---|---|---|---|
| Storefront (Next.js 16) | `AlaaAsaad57/Trydos` | Vercel (project `trydos-front`, team `trydos-front-team`) | GitHub Actions → `vercel deploy` | **Yes, but commented out for now** (see section 3) |
| Edge Workers | `AlaaAsaad57/trydos-cf-worker` (public) | Cloudflare Workers (paid plan) | GitHub Actions → `wrangler deploy` | **Yes**, on push to `main` |
| Media server | `AlaaAsaad57/MediaServing` | One AWS EC2 box, Docker Compose | GitHub Actions → GHCR image → SSH | **Yes**, on push to `main` |

---

## 3. Storefront — `Trydos` on Vercel

**Stack:** Next.js 16 (App Router), React 19, Node 22.x. Vercel builds it with
the install command `rm -rf node_modules && yarn install --production=false`
(set in the Vercel dashboard). The repo uses pnpm locally and in CI.

**Branches**

- `develop` — the real storefront. All work merges here.
- `main` — a staging gate. It is `develop` plus a logo-only landing page, and
  `proxy.ts` sends every path to `/` with a 307 redirect.

**Pipeline** (`.github/workflows/`)

| Workflow | When it runs | What it does |
|---|---|---|
| `tests.yml` | Friday 02:10 UTC on `main`, or by hand | i18n parity, lint, type check, unit tests (Vitest). About 5 min |
| `test-e2e.yml` + `e2e-lane.yml` | Friday 02:30 UTC on `main`, or by hand | Builds the app, runs Playwright in 2 lanes against the staging backends. 15–45 min. |
| `deploy.yml` | By hand only | Deploys to Vercel if **both** suites passed for that commit (or with `force`) |
| `notify-telegram.yml` | Called by the others | Sends the result to the Telegram channel |

**How a deploy happens**

1. Vercel's own Git deploys are **off** (`vercel.json` → `git.deploymentEnabled: false`).
   GitHub Actions is the only thing that deploys.
2. Nothing deploys on a push. You start `Deploy` by hand on a ref.
3. The `Deploy` gate checks if both suites passed for that exact commit. The
   Friday run covers the tip of `main`; any other commit needs both test
   workflows started by hand on it first.
4. If yes, it runs `vercel deploy --archive=tgz` without `--prebuilt`.
   Vercel builds the app remotely with its own env vars. `main` becomes
   **production**, `development` a **preview** deployment.
5. The result goes to Telegram.

**Switch:** the repo variable `DEPLOY_WHEN_SUCCESS` (now `true`). Set it to
`false` to deploy even when the tests are red.

```bash
gh workflow run Deploy --ref main                 # production, needs green Friday run
gh workflow run Deploy --ref development          # preview
gh workflow run Deploy --ref main -f force=true   # skip the test check once
```

**Secrets** (GitHub repo): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`E2E_ENV_FILE`, `E2E_ARTIFACT_PASSPHRASE`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `GH_PAT`. App env vars live in the Vercel dashboard.

**Other services the app calls:** Sentry (errors), PostHog EU (analytics),
Google Analytics, Firebase (push), Agora (live video), Redis, Elasticsearch.
Rate limiting for the Vercel side is done by **Vercel Firewall** rules in the
dashboard, not in code.

---

## 4. Edge Workers — `trydos-cf-worker` on Cloudflare

**Why it exists:** to cut Vercel cost (origin transfer and function time).

**What it deploys**

| Thing | Folder | Routes | Deployed by |
|---|---|---|---|
| `trydos-proxy` Worker | `workers/proxy/` | `trydos.ramaaz.dev/api/proxy*` | CI |
| `trydos-ingest` Worker | `workers/ingest/` | `trydos.ramaaz.dev/ingest/*` | CI |

- `trydos-proxy` forwards browser API calls to the 7 backends. It keeps the
  auth cookie server-side, blocks SSRF paths and blocks `send_otp`.
- `trydos-ingest` forwards PostHog events to PostHog EU and strips cookies from them.
- The proxy Worker **must** stay on the same hostname as the app. The auth
  cookies are host-only, so a Worker on another subdomain never gets them.

**Pipeline** (`.github/workflows/ci.yml`)

1. Every PR and every push to `main` → type check + all tests (unit + workerd).
2. Push to `main` only → a script picks which Worker changed.
3. Only the Worker that changed is deployed with `wrangler deploy`. A change in
   `packages/shared/` or the lockfile deploys both.
4. A deploy runs only if the tests passed. PRs never deploy and never see secrets.

**Secrets** (GitHub repo): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
The 7 backend URLs are Worker secrets stored in Cloudflare (`wrangler secret put`).
CI does not touch them.

**Rollback — read this before you do one.** The old way was "delete the route
in the Cloudflare dashboard". Traffic then falls back to the Next.js route of the
same path on Vercel, which is still deployed. **But** each CI deploy puts the route
back. So a rollback that lasts needs one of these:

- `gh workflow disable ci.yml` **and** delete the route, or
- remove the route from the Worker's `wrangler.jsonc` and merge that change.

---

## 5. Media server — `MediaServing` on AWS EC2

**What it is:** our own image/video service (like Cloudinary). Fastify + Sharp +
FFmpeg. Files live in **AWS S3**. Redis holds the locks and the BullMQ job queue.

**How it runs**

- One EC2 box in ap-south-1. The box also runs other apps.
- Apache on ports 80/443 forwards to the app on port `4001`.
- `docker-compose.prod.yml` has two containers from the same image:
  - `app` — the HTTP API (port `4001` → `3000`, health at `/health`)
  - `worker` — the heavy video jobs.
- Redis, Loki and Grafana run in a **separate** compose project. CI does not deploy them.
- Logs go to Loki through the Loki Docker log driver. Containers do not start
  without that driver.

**Pipeline** (`.github/workflows/deploy-production.yml`)

1. Push to `main` (or start it by hand).
2. Build the image in CI for `linux/amd64` and push it to GHCR:
   `ghcr.io/alaaasaad57/mediaserving:latest` and `:sha-<short>`.
3. SSH to the server → `git pull --ff-only` → `docker compose pull` → `up -d`.
4. Check `/health` for up to 60 s.

There are **no tests** in this pipeline. The health check runs **after** the
containers are replaced, so it reports a bad deploy but does not stop it.

**Rollback:**

```bash
IMAGE_TAG=sha-<previous> docker compose -f docker-compose.prod.yml up -d
```

**Secrets** (GitHub repo): `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`,
`DEPLOY_PATH`. The server's `.env.production` is only on the server (gitignored).

**Manual deploy** (when Actions is down): build and push the image on a laptop,
then pull and restart on the server.
---
