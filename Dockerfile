# syntax=docker/dockerfile:1

# Storefront image for the shared staging server.
# How to build and run it: docs/server-deploy.md
#
# Two stages:
#   1. build   - installs all packages and runs `next build`.
#   2. runtime - holds only what `next start` needs.
#
# The runtime keeps the full node_modules on purpose. next.config.ts imports
# @next/bundle-analyzer, which is a devDependency, so a production-only install
# would break `next start`. Next.js `standalone` output would give a smaller
# image, but it needs a change in next.config.ts, which is a protected path.

ARG NODE_VERSION=22

# ---------- 1. build ----------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app

# Same pnpm version as local work. Do not add `packageManager` to
# package.json: Vercel runs yarn and that field changes how it installs.
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Install first, so Docker can reuse this layer when only the source changes.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# The build needs more memory than the Node default. The server has 15 GB and
# no swap.
ENV NODE_OPTIONS=--max-old-space-size=6144

# The env file arrives as a BuildKit secret, so it never becomes part of an
# image layer. The build needs it for two reasons:
#   - NEXT_PUBLIC_* values are written into the JS bundle at build time.
#   - cacheComponents prerenders pages, and those pages call the backends.
# Next.js reads `.env.production.local` during `next build`.
RUN --mount=type=secret,id=storefront_env,target=/app/.env.production.local,required=true \
    pnpm build \
    && rm -rf .next/cache

# ---------- 2. runtime ----------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# `next start` loads next.config.ts, so it needs the config file, the packages
# and the build output. `public/` holds the translations and static assets.
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next

# Never run the app as root.
USER node

EXPOSE 3000

# /robots.txt is cheap: proxy.ts skips it, so it never redirects or calls a
# backend.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
