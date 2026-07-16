# Sentry Setup & Switching Accounts/Projects

How Sentry is wired into Trydos and how to point the app at a **different Sentry
account or project**. Also covers enabling source-map upload **only on Vercel**.

## How it's wired

The app is fully **env-driven** — switching projects is an env change, not a code
change. Nothing about the Sentry project is hardcoded.

| File | Reads |
|------|-------|
| `instrumentation-client.ts` (browser) | `NEXT_PUBLIC_DSN_SENTRY` |
| `sentry.server.config.ts` (server) | `NEXT_PUBLIC_DSN_SENTRY` |
| `sentry.edge.config.ts` (edge/proxy) | `NEXT_PUBLIC_DSN_SENTRY` |
| `next.config.ts` (build plugin) | `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, `SENTRY_URL` |

> `sentry.client.config.ts` is legacy/dead in SDK v10 (superseded by
> `instrumentation-client.ts`). Ignore it.

## Environment variables

| Variable | Value | Set where | Notes |
|----------|-------|-----------|-------|
| `NEXT_PUBLIC_DSN_SENTRY` | new **DSN** | Vercel (all envs) **+** local `.env.*` | Inlined at **build time**; safe to expose (public by design) |
| `SENTRY_ORG` | org **slug** | Vercel only | upload only |
| `SENTRY_PROJECT` | project **slug** | Vercel only | upload only |
| `SENTRY_AUTH_TOKEN` | auth **token** | Vercel only | secret — never commit |
| `SENTRY_URL` | `https://de.sentry.io` **if** DE region | Vercel only | omit for US region |

Local `pnpm build` does **not** need the `SENTRY_*` upload vars — source-map
upload is skipped locally (see below).

## Where to get each value from Sentry

Log into the account, create/select the project (platform: **Next.js**), then:

1. **DSN** → Settings → Projects → [project] → **Client Keys (DSN)**
   (`.../settings/<org>/projects/<project>/keys/`). Copy the full
   `https://<hash>@o<n>.ingest.<region>.sentry.io/<n>` string.
2. **Org slug** (`SENTRY_ORG`) → Settings → Organization → General → **Slug**
   (or read `<org>` from the URL `sentry.io/organizations/<org>/`).
3. **Project slug** (`SENTRY_PROJECT`) → Settings → Projects → [project] →
   General → **Name** (or `<project>` from the URL).
4. **Auth token** (`SENTRY_AUTH_TOKEN`) → Settings → **Developer Settings →
   Organization Tokens** → **Create New Token**. Org tokens already carry the
   correct scopes. **Copy immediately — shown only once.**
5. **Region** (`SENTRY_URL`) → read it off the DSN host:
   - `ingest.de.sentry.io` → EU/DE → set `SENTRY_URL=https://de.sentry.io`
   - `ingest.us.sentry.io` / plain `ingest.sentry.io` → US → **don't set it**

> Shortcut for the token: `npx @sentry/wizard@latest -i nextjs --saas` logs in
> and writes a fresh token to `.env.sentry-build-plugin` (discard its config
> rewrites, keep the token).

## Source maps: Vercel only, never local

Controlled in `next.config.ts`:

```ts
sourcemaps: {
  disable: !process.env.VERCEL, // Vercel sets VERCEL=1 → upload on; local → off
}
```

- **Vercel build** → uploads source maps (needs `SENTRY_AUTH_TOKEN` + `SENTRY_ORG`
  + `SENTRY_PROJECT` in Vercel env). Maps are uploaded then deleted, not served.
- **Local `pnpm build`** → no `VERCEL` env → upload skipped, no token needed.

## Switching checklist

1. Get DSN, org slug, project slug, token from the new project (steps above).
2. In **Vercel → Project → Settings → Environment Variables** set:
   `NEXT_PUBLIC_DSN_SENTRY`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`,
   and `SENTRY_URL` (only if DE region).
3. Add `NEXT_PUBLIC_DSN_SENTRY` to local `.env.development` / `.env.production`.
4. Redeploy.

## Verify

- New errors appear in the **new** project's Issues.
- Vercel build log shows Sentry uploading source maps (logs print because
  `silent` is off in CI).
- A new issue's stack trace shows **original file names + line numbers**, not
  minified code.
- Local `pnpm build` prints nothing about source-map upload.

## Gotchas

- DSN, slugs, and token must all belong to the **same org** — a cross-org mix
  reports errors fine (DSN self-routes) but fails source-map upload with an
  auth/permission error on the Vercel build.
- Wrong region: if the new project is US and `SENTRY_URL` is still set to DE (or
  vice-versa), uploads 404. Match `SENTRY_URL` to the DSN host.
- `.env.sentry-build-plugin` holds a token locally — keep it gitignored; it's a
  live secret. Prefer setting the token in Vercel env instead.
