---
ticket: next-16-3-upgrade
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-18
links:
  clickup:
  github:
---

# Research — next-16-3-upgrade

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Move the storefront from Next.js 16.2.11 to 16.3 and take the parts of that
release that do not need the Cache Components migration, with no change to how
any page behaves for a user.

## Headline findings

Three findings change what this ticket is. They are stated here first because
they affect the spec, not just the plan.

**1. One of the five scope items rests on a wrong premise.** The intake says
"convert the existing error boundaries to `catchError` from `next/error`".
`catchError` does **not** replace `error.tsx` / `global-error.tsx`. The docs for
16.3 keep both file conventions and describe `catchError` as a separate tool for
**component-level** boundaries that you wrap by hand around part of a tree. So
there is nothing to convert. See `OQ-1`.

**2. The real 16.3 change to error boundaries is a prop rename, and this repo is
affected.** In the 16.3 docs, `error.js` and `global-error.js` receive `retry`,
where this repo's four boundaries all receive and type `reset`
(`reset: () => void`). None of the four actually calls it — they all recover
with `window.location.reload()` — so nothing breaks for a user, but the typed
prop no longer matches the framework. See `OQ-2`.

**3. `next build` changes how it type-checks the moment you upgrade, before any
TypeScript 7 decision.** `experimental.useTypeScriptCli` is **on by default** in
16.3: `next build` now runs the project-local `tsc` binary instead of loading
the TypeScript compiler API. The docs also mark the flag experimental and say it
is "not recommended for production". Two consequences: the build now checks the
**whole** tsconfig project, including test files and `.next/dev/types`; and
Next.js code frames and error rewriting are no longer applied to type errors.
See `OQ-3` and `OQ-4`.

## Relevant directories

- `app/(client)/[lang]/` — the locale-scoped route tree. 35 `page`/`layout`/
  `not-found` files read `params`; these are the candidates for
  `next/root-params`.
- `app/(special)/` — holds three of the four error boundaries
  (`callInProg/`, `call_direct/`, `endCall/`).
- `app/api/` — 18 route handlers mention `lang`. Route Handlers **cannot** use
  `next/root-params` in 16.3, so all of these keep reading it the way they do
  now.
- `serverRequests/` and `serverActions/` — 15 modules carry the `"use server"`
  directive, which makes every export a Server Action. Server Actions **cannot**
  use `next/root-params`. These keep taking the language as an argument.
- `utils/server/` — `translateFunction(key, language)` and the other server
  helpers take the language explicitly. This is the code that would benefit most
  from root params, but only where it is called from a Server Component.
- `components/` — client components; out of reach for root params by definition.
- `tests/e2e/` and the unit tests beside their sources — the verification set.
- `_specs/` — workflow artifacts for this ticket.

## Relevant config files

- `next.config.ts` — **protected runtime path.** Holds `reactCompiler: !isDev`,
  the `experimental` block (`serverActions`, `optimizeCss`,
  `optimizeServerReact`, `optimizePackageImports`, `staleTimes`), the security
  headers, `images.domains`, and the `withSentryConfig` wrapper applied only
  when `VERCEL` is set. Every config item in this ticket lands here.
- `package.json` — pins `next: 16.2.11`, `eslint-config-next: 16.2.10`,
  `@next/bundle-analyzer: 16.2.10`, `typescript: ^5.9.2`, `react`/`react-dom`
  `19.2.0`. Also holds a large `pnpm.overrides` block and the scripts used for
  verification.
- `tsconfig.json` — `strict: false`, `strictNullChecks: false`,
  `target: ES2017`, `incremental: true`, `moduleResolution: bundler`,
  `plugins: [{ name: "next" }]`, and an `include` covering `**/*.ts`,
  `**/*.tsx`, `.next/types/**/*.ts` and `.next/dev/types/**/*.ts`. The file
  contains `//` comments, so it is JSONC.
- `eslint.config.mjs` — imports `eslint-config-next/core-web-vitals`, adds the
  local `translate-key-exists` rule as an **error** and `i18next/no-literal-string`
  as a warning, and turns off a named list of `react-hooks` v7 rules.
- `vercel.json` — **it is `{}`.** The install command that carries the
  `--production=false` fix is not in the repository at all; it lives only in the
  Vercel dashboard.
- `.github/workflows/tests.yml` — the PR gate. pnpm 10.26.0,
  `pnpm install --frozen-lockfile`, Node 22.x, then parity → lint → typegen →
  `tsc --noEmit` → unit tests.
- `.github/workflows/test-e2e.yml`, `notify-telegram.yml` — the browser suite
  (push and nightly, never on a PR) and the Telegram reporter.
- `instrumentation.ts`, `instrumentation-client.ts`, `sentry.*.config.ts` —
  **protected runtime paths.** Not expected to change, but they are the blast
  radius if the Sentry wrapper is incompatible with 16.3.

## Possibly affected services

- **Sentry error reporting** — `next.config.ts` wraps the entire config in
  `withSentryConfig`. `@sentry/nextjs` is `^10.66.0` and is unverified against
  16.3. This is the largest single point of failure in the upgrade.
- **Vercel builds** — the install command is dashboard-only. If it does not pass
  `--production=false`, `next build` installs TypeScript itself and picks
  whatever `latest` is, which is what broke the builds in July 2026. 16.3 makes
  this sharper, not softer, because the default type checker now shells out to
  the project-local `tsc` binary.
- **The CI gate** — it installs with `--frozen-lockfile`, so any dependency bump
  fails CI until `pnpm-lock.yaml` is regenerated in the same commit.
- **Server-side rendering of every locale route** — 16.3 replaces web streams
  with native Node streams in the App Router render path. No code change, but it
  touches every rendered page.
- **PostHog / Google Analytics / Agora / Elasticsearch / Redis / FCM** — no
  known interaction with anything in this ticket. Listed so the review can see
  they were considered and dismissed.

## Test / validation commands available

Listed, not run.

- `pnpm lint:i18n-parity` — the `ar` / `tr` / `ku` translation files hold the
  same keys.
- `pnpm lint` — `eslint .`; errors only. Enforces that every translate key
  exists in all three files.
- `pnpm exec next typegen` — writes `next-env.d.ts` and the route types.
  Required before type checking on a fresh checkout, and it is also what
  generates the `next/root-params` types.
- `pnpm exec tsc --noEmit` — the type gate.
- `pnpm test:run` / `pnpm test:ci` — the unit suite (vitest, `unit` project).
- `pnpm test:e2e` / `pnpm test:e2e:live` — the Playwright suite against a real
  `next build` + `next start`.
- `pnpm e2e:preflight`, `pnpm e2e:build` — e2e environment checks and build.
- `pnpm build` — production build; the only way to see the new type-check path
  and the Sentry wrapper together.
- `pnpm knip` — unused files/exports; useful after removing prop drilling.
- `ANALYZE=true pnpm build` — bundle analyzer.

## Risks and unknowns

- **Sentry incompatibility with 16.3** — impact: total, the build fails or error
  reporting silently stops. Likelihood: low to medium. Cheapest early check in
  the ticket.
- **`useTypeScriptCli` default-on widens what `next build` type-checks** —
  impact: medium, the build can fail on files that `tsc --noEmit` already covers
  but that the old build path never looked at. Likelihood: medium. The repo runs
  `tsc --noEmit` over the same broad `include` in CI today and it passes, which
  lowers this, but the two sets are not proven identical.
- **TypeScript 7 across the rest of the toolchain** — impact: high, it is a
  native rewrite rather than a version bump. eslint's TypeScript parsing, vitest,
  `tsx`, the `next` tsconfig plugin and `incremental: true` all have to accept
  it, and the CI step is literally `pnpm exec tsc --noEmit`. Likelihood: medium.
- **`eslint-config-next` 16.3 changing bundled rules** — impact: low to medium,
  new lint errors in a gate that fails on errors. The config already switches off
  a named list of `react-hooks` v7 rules, so a renamed or added rule shows up as
  a failure rather than a warning. Likelihood: medium.
- **Rust React Compiler changes production output** — impact: high if it
  miscompiles, because the React Compiler runs on the shipped build and the app
  has no automated coverage of most rendered UI. Likelihood: low. The flag is
  experimental. The owner accepted this at intake.
- **Package-manager divergence** — CI uses pnpm with a frozen lockfile; Vercel
  uses yarn with no committed lockfile. The two resolve dependencies
  independently, so a green CI run does not prove the Vercel install resolves the
  same tree. Impact: medium. Likelihood: medium.
- **Scope drift into Cache Components** — several 16.3 features read as if they
  belong together. `partialPrefetching`, loading shells and the `instant()`
  helper are all out of scope and must stay out.
- **`next.config.ts` is a protected runtime path** — four of the five scope
  items edit it, so `plan.md` must list it explicitly or `/wf:implement` is not
  allowed to touch it.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `observability/**` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | The intake asks to "convert the existing error boundaries to `catchError`". `catchError` does not replace `error.tsx` / `global-error.tsx` — it is a separate, component-level boundary. Is this scope item dropped, or replaced by "add `catchError` boundaries at named places"? | One of the five scope items has no valid meaning as written. Left unanswered, implement either does nothing or invents new feature work. |
| OQ-2 | 16.3 documents `retry` as the prop on `error.js` / `global-error.js`; all four boundaries here take and type `reset`. Is `reset` still accepted in 16.3, and do all four files change to `retry`? | It is the one real error-boundary change that does affect this repo. None of the four calls the prop today, so the risk is a wrong type rather than a broken page — but leaving it wrong hides a real API change. |
| OQ-3 | `experimental.useTypeScriptCli` is on by default in 16.3 and is documented as experimental and "not recommended for production". Do we accept the default, or set it to `false`? | It changes `next build` behaviour on upgrade with no action from us. Note the trap: setting it `false` **while** TypeScript 7 is installed makes `next build` exit, so this answer and the TypeScript 7 answer are one decision, not two. |
| OQ-4 | With the CLI checker, `next build` checks the whole tsconfig project including test files and `.next/dev/types`. `tsconfig.json` includes `**/*.ts` and `**/*.tsx` with `strict: false`. Do we accept that widened set, or narrow it with `typescript.tsconfigPath`? | Decides whether the build starts failing on files it never checked before. CI already runs `tsc --noEmit` over a broad include and passes, which suggests it is fine, but that has not been proven for the build path. |
| OQ-5 | The `[lang]` segment does not hold a language. It holds `"<country>-<language>"` (for example `gb-en`) and the root layout splits it with `lang.split("-")`. Do we keep the generated getter name `lang` and split at every call site, as today? | The getter name comes from the folder name and cannot be chosen. It decides how much prop drilling actually disappears, and whether a wrapper helper is wanted instead of calling `lang()` raw. |
| OQ-6 | Which call sites convert to `next/root-params`? Confirmed unreachable: 15 `"use server"` modules under `serverRequests/` and `serverActions/`, 18 route handlers under `app/api/`, every client component, and anything inside `unstable_cache`. | This is the size of the ticket. Without a named list, "adopt root params" has no finish line and `/wf:verify` cannot check it. |
| OQ-7 | Does `@sentry/nextjs@^10.66.0` support Next.js 16.3, and if not, is bumping Sentry inside this ticket or is the ticket blocked? | Biggest single point of failure. It also decides whether the ticket stays a Next.js upgrade or becomes a Next.js + Sentry upgrade. |
| OQ-8 | Does the rest of the toolchain run on TypeScript 7 — the `pnpm exec tsc --noEmit` CI step, eslint's TypeScript parsing, vitest, `tsx`, `next typegen`, the `plugins: [{ name: "next" }]` tsconfig plugin, and `incremental: true`? | TypeScript 7 is a native rewrite. If any of these does not work, the ticket has to either drop TypeScript 7 or change the CI gate — and changing the gate is scope the intake never asked for. |
| OQ-9 | Do we remove the `!isDev` guard on `reactCompiler` in `next.config.ts` outright, or keep a way to switch it off in dev? | The guard is a deliberate choice for a constrained machine, with a written reason in the file. Removing it is the point of the Rust compiler, but it should be a decision, not a side effect. |
| OQ-10 | `experimental.turbopackRustReactCompiler` changes **production** output. What is the signal that would make us revert it, and is it reverted alone or with the whole ticket? | The owner accepted the risk at intake. Accepting a risk without naming the rollback leaves nobody able to act when it fires. |
| OQ-11 | Which exact version do we pin? The repo pins `next` exactly (`16.2.11`) and the docs currently show `16.3.1`. Do `eslint-config-next` and `@next/bundle-analyzer` pin to the same exact version? | The three are pinned exactly today and version skew between them is a known failure source. |
| OQ-12 | `pnpm-lock.yaml` must be regenerated in the same commit or CI fails on `--frozen-lockfile`. Vercel installs with yarn and no committed lockfile, so it resolves independently. Is that divergence accepted for this ticket, or is a committed lockfile for the deploy path in scope? | A green CI run does not prove the Vercel install resolves the same tree. This is exactly the gap behind the July 2026 outage. |
| OQ-13 | `vercel.json` is `{}`. Should the install command carrying `--production=false` be written into it so the fix is versioned in the repo, or does it stay a dashboard setting? | Today the one thing that keeps builds green is invisible to the repo and to review, and nothing stops someone changing it. It is also the only item in this ticket that research cannot verify. |
| OQ-14 | Bumping `eslint-config-next` to 16.3 may add or rename bundled rules, and `pnpm lint` fails on errors. Do we accept fixing whatever it reports inside this ticket, or pin `eslint-config-next` and split that off? | The config already disables a named list of `react-hooks` v7 rules. A renamed rule turns into a lint failure and could quietly grow the ticket. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
