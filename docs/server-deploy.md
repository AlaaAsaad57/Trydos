# Running the storefront on the staging server

The storefront can run in Docker on the shared staging server, next to the
other Trydos apps. This file says how. The copy on Vercel stays as it is.

Files:

- `Dockerfile` — builds the image (`next build`, then `next start`).
- `docker-compose.yml` — runs one container, `trydos-storefront`.
- `.dockerignore` — keeps secrets and large files out of the build.

## How the server is set up

- Each team has its own Linux user and its own **rootless** Docker.
  Rootless means each user runs Docker without root.
- Each app listens only on `127.0.0.1:<port>`.
- The server's nginx sends each domain to its port. Only the admin can
  change nginx.

The storefront follows the same rules. The container listens on
`127.0.0.1:3000` by default. Set `STOREFRONT_PORT` to use another port.

## One-time setup (on the server)

1. Tell the Docker client where the rootless socket is. Add this line to
   `~/.bashrc`, then log in again:

   ```bash
   export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock
   ```

   Check it: `docker ps` must answer without an error.

2. Give the server read access to the repo with a **deploy key**. Do not put
   a personal GitHub token on a shared server.

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/trydos_deploy -N "" -C "storefront-staging"
   cat ~/.ssh/trydos_deploy.pub
   ```

   Add the public key in GitHub: repo **Settings → Deploy keys**, read-only.
   Then add this to `~/.ssh/config` on the server:

   ```
   Host github.com
       IdentityFile ~/.ssh/trydos_deploy
       IdentitiesOnly yes
   ```

3. Clone the repo and pick the branch:

   ```bash
   git clone git@github.com:AlaaAsaad57/Trydos.git
   cd Trydos
   git checkout development
   ```

4. Create the env file `.env.server` from the template. Git ignores
   `.env.server` (`.env*` in `.gitignore`).

   ```bash
   cp .env.server.example .env.server
   chmod 600 .env.server
   ```

   Fill it in. Read **The env file** below first.

   Or copy a filled file from your PC. Do not paste secrets into a chat or a
   ticket:

   ```bash
   scp .env.server frontenddev@212.68.36.107:~/Trydos/.env.server
   ssh frontenddev@212.68.36.107 'chmod 600 ~/Trydos/.env.server'
   ```

   `vercel env pull` gives **no value** for variables marked "Sensitive" in
   Vercel. Today these are `ASSEMBLYAI_API_KEY`, `ASSEMBLYAI_BASE_URL` and
   `NEXT_PUBLIC_DSN_SENTRY`. Copy them from the Vercel dashboard by hand.

## Deploy and update

```bash
cd ~/Trydos
git pull
docker compose up -d --build
```

- `git pull` gets the new commits.
- `--build` builds a new image from them. Then Compose replaces the old
  container with a new one.
- A build takes several minutes. The old container keeps serving until the
  new one starts.

Useful commands:

```bash
docker compose ps                  # is it running? is it "healthy"?
docker compose logs -f --tail=200  # app logs
docker compose restart             # restart without a rebuild
docker compose down                # stop and remove the container
docker image prune -f              # delete old images (disk space)
```

## Look at it before nginx has a domain

You can see the app through an SSH tunnel. An SSH tunnel sends a port on your
PC to a port on the server. Run this **on your PC**:

```bash
ssh -L 3000:127.0.0.1:3000 frontenddev@212.68.36.107
```

Then open <http://localhost:3000/sy-en> in your browser. Always use the
`sy-en` locale (see `CLAUDE.md`).

## The env file

The same file is used twice:

1. **At build time**, as a BuildKit secret. It never becomes part of an image
   layer. The build needs it for two reasons:
   - `NEXT_PUBLIC_*` values are written into the JS bundle during the build.
     So a change to a `NEXT_PUBLIC_*` value needs a **rebuild**, not a restart.
   - `cacheComponents` prerenders pages during the build, and those pages call
     the backends. So the backends must answer while the image builds.
2. **At run time**, through `env_file`, for the server-only values.

`.env.server.example` lists every variable the app reads. It marks each one
as required, optional, or `[build]`. The main rules:

- **Never leave an optional value empty.** Comment it out instead. Some code
  reads an empty value as `0`. For example, `OTP_IP_MAX=` (empty) sets the
  OTP limit to 0.
- **Do not copy a Vercel env file as it is.** Remove every `VERCEL*`,
  `TURBO_*` and `NX_*` line, and `NODE_ENV`. `VERCEL=1` turns on the Sentry
  build wrapper and the source map upload in `next.config.ts`.
- Set `NEXT_PUBLIC_SITE_URL` to the domain this copy uses. Without it, links
  in the page metadata point to `http://localhost:3000`.
- Keep `NEXT_PUBLIC_ALLOW_INDEXING=false`. Search engines must not index a
  staging copy.
- Keep `SENTRY_ENVIRONMENT=staging-server` and
  `NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging-server`. Without them, Sentry files
  this copy's errors under "production".
- Write a multi-line value, such as `FIREBASE_PRIVATE_KEY`, on one line in
  double quotes, with `\n` for each line break.

## Differences from Vercel

- **Visitor country.** `proxy.ts` reads the country from `cf-ipcountry`
  (Cloudflare) or `x-vercel-ip-country` (Vercel). Without Cloudflare in front
  of this server, neither header exists. Then `proxy.ts` uses its default
  country `gb` (`DEFAULT_COUNTRY`, line 36). `gb` is not in the region list,
  so a first visit opens the "Select Your Region" modal. After the visitor
  picks a region, the `country` cookie keeps it.
- **Visitor IP.** `ipAddress()` from `@vercel/functions` reads the
  `x-real-ip` header. The server's nginx sets it, so the IP is correct.
- **Speed Insights.** The `@vercel/speed-insights` script does not exist off
  Vercel. The browser gets a 404 for it. Nothing else breaks.
- **Rate limiting.** Vercel Firewall does not protect this copy.
- **Memory.** The build uses up to 6 GB (`NODE_OPTIONS` in the `Dockerfile`).
  The server has 15 GB and no swap, and other apps run on it. If a build ends
  with "out of memory", build at a quiet time or ask the admin for swap.

- **The request origin inside the app.** Off Vercel, Next.js builds
  `request.url` from its own listen address (`http://localhost:3000`), not
  from the public domain. Two places compare against it:
  - `app/api/proxy/route.ts` line 150 compares the `Origin` header with it.
    Browsers do not send `Origin` on a same-origin `GET`, so normal page
    calls pass. A cross-origin call is still refused.
  - `proxy.ts` line 436 uses it to skip same-site referers. Off Vercel the
    check never matches, so the `referer` cookie can hold an internal page
    address. Only referer tracking is affected.

## What the admin must do

1. **HTTPS is required.** In a production build, every auth cookie has the
   `Secure` flag (for example `utils/cookies/cookie-manager.ts` line 115).
   Browsers drop `Secure` cookies on plain `http://`, so sign-in and the guest
   session do not work. The server's nginx listens only on port 80. So either
   Cloudflare (proxied record) or a TLS certificate on nginx must serve the
   domain over `https://`. The SSH tunnel is fine without it: browsers treat
   `http://localhost` as secure.
2. **Set `X-Forwarded-For` to the real client IP only.** The OTP limit
   (`utils/server/otpIdentity.ts` line 256), the paid AI routes
   (`utils/server/paidRouteGuard.ts` line 47) and the search log take the
   **first** `X-Forwarded-For` value as the visitor IP. The other nginx blocks
   on this server use `$proxy_add_x_forwarded_for`. That value keeps whatever
   the client sent and adds the real IP at the end. So a client can send a
   fake first value and get a new rate limit on every call. On Vercel this
   did not happen, because Vercel writes the header itself.
   - Without Cloudflare in front, use
     `proxy_set_header X-Forwarded-For $remote_addr;`
   - With Cloudflare in front, use `$http_cf_connecting_ip`, and accept
     connections only from Cloudflare's IP ranges. Otherwise a client can fake
     `CF-Connecting-IP` too.
3. Add the nginx `server` block: the storefront domain → `127.0.0.1:3000` (or
   the chosen `STOREFRONT_PORT`). Copy the other blocks in
   `/etc/nginx/conf.d/ramaaz-projects.conf`, but with the header from point 2.
4. Add the DNS record for that domain.
