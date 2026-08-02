---
ticket: gated-upload-migration
stage: research
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-07-30
links:
  clickup:
  github:
---

# Research — gated-upload-migration

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Move every upload in the app onto the media server's new gated upload API (mint a
ticket, then spend it), put all of them behind one new upload service, and make an
upload `401` behave the way a `401` from any other market server API already
behaves.

## What the app does today

Every upload is a **bare `fetch`** straight from the browser to the media server,
with the shared key `NEXT_PUBLIC_MEDIA_API_KEY` in an `x-api-key` header. None of
them go through `utils/fetchData.ts`, so **none of them has any `401` handling at
all** — that is the gap behind ask 3.

There are **eight live upload calls in six files**, plus one dead one:

| # | Where | Route today | Folder | Used by |
|---|---|---|---|---|
| 1 | `services/story.ts:111-147` (`uploadToMediaServer`) | `/upload`, `/upload?story=true` for video | `stories` | user story upload (`:156`) |
| 2 | `services/sellerDashboard/index.ts:328-355` (`uploadStoryToMediaServer`) | `/upload`, `/upload?story=true` for video | `stories` | `components/SellerDashboard/StoriesTab.tsx:477` |
| 3 | `services/sellerDashboard/index.ts:435-460` (`bulkUploadImages`) | `/upload/bulk` | caller's (`product`, `product/meta`, boutique banners) | `ProductEditor.tsx:395,421`, `BoutiqueEditor.tsx:283`, and `index.ts:559` |
| 4 | `services/sellerDashboard/index.ts:571-599` (`uploadShopImage`) | `/upload` | caller's (`seller`, `product/videos`, boutique icons) | `ShopInfo.tsx:199,203`, `ProductEditor.tsx:444` (a **video**), `BoutiqueEditor.tsx:265` |
| 5 | `services/sellerDashboard/index.ts:731-772` (`uploadExcelFile`) | `/upload/excel?folder=…` | `excel` | `ExcelUploadTab.tsx:263` |
| 6 | `services/order.ts:21-50` (`uploadToMediaServer`) | `/upload` | `return_request_products`, `rating_orders` | `order.ts:741` (returns), `order.ts:762` (rating photos) → `components/Orders/UploadImageComponent.tsx:115,117` |
| 7 | `services/auth.ts:878-915` (`uploadToMediaServer`) | `/upload` | `customers/profile` | profile picture (`auth.ts:918`) |
| 8 | `components/Chat/chatsFunctions.tsx:521-547` (`uploadFile`) | **not the media server** — `/api/v1/upload_file` on the chat backend, through `fetchData` | — | chat attachments (`:549`) |
| — | `services/sellerDashboard/comments.ts:62-84` (`UploadExcel`) | `/upload-excel` — a route that exists in **neither** the old nor the new route map | — | **nothing calls it** (dead code) |

Two facts that shape the work:

- **The chat upload (row 8) is the odd one out.** It already goes through
  `fetchData` with `server: "chat"`, so it is proxied and it already has the
  chat `401` behaviour. The new `/gated/chat/upload_file` route on the media server
  is a *different service* from what chat uses today, so moving it is a real scope
  decision, not a like-for-like swap (see `OQ-7`).
- **The same code is copy-pasted six times.** Rows 1 and 2 are near-identical, and
  rows 4, 6 and 7 differ only in the folder and the error text. This is exactly what
  ask 2 (one upload service) is for.

`utils/fetchData.ts:21,111` also carries a dead `"upload story"` server type that
nothing uses.

## How a `401` is handled everywhere else

This is what ask 3 has to match. There are two paths.

**Client-side — `utils/fetchData.ts`.** `handleUnauthorized` (`:170-351`) branches
per server, and the whole thing is capped at two recovery attempts (`:530`). For
`market` / `market-dashboard` (`:183-277`) the order is:

1. If a "verify your number" prompt is already open, wait for it and reuse the
   token it produces (`:203-208`).
2. If a guest registration is already running, wait for it (`:212-215`).
3. On the first `401` only: try `AuthService.RefreshSession` — refresh before
   anything else (`:225-235`).
4. Otherwise `AuthService.ExpiredUser()` (`:250`) — this registers a fresh guest so
   a dismissed prompt still leaves a working token. If that renewed the session,
   just retry (`:257`).
5. A seller (or a `/seller` page) gets the "please log in again" prompt and the
   request waits for it (`:259-266`); a phone-verified shopper likewise (`:273`).
6. Then the original request is retried with the new token (`:544-546`).

**Server-side — `serverRequests/HandleAuthedFetch.ts`.** On a `401` it probes
whether cookies are writable (`:82-101`), refreshes if a refresh cookie exists
(`:112-128`), returns the `401` untouched for a verified shopper with no refresh
cookie (`:134`), and otherwise calls `/auth/register-guest` and retries with the
new token (`:140-179`).

**The important detail:** both paths can end with **a fresh guest token**. The
gateway contract for the mint call
(`docs/api-requirements/media-upload-identity-endpoint.md:85-86,151-153`) says a
guest is meant to get **`403` — may not upload**. So the app's standard `401`
recovery can hand the upload a token that the mint call will reject. Asks 1 and 3
therefore have to be reconciled, not just implemented side by side (`OQ-1`,
`OQ-2`).

## How the token can reach the mint call

The mint call needs `Authorization: Bearer <user access token>`. That token lives
in the **HttpOnly** `MARKET-TOKEN` cookie (`utils/server/tokenManager.ts:230-234`,
`SECURE_COOKIE_OPTIONS` at `:19-30`). Browser JavaScript cannot read it and the
browser will not attach it to a cross-origin request. So **the mint has to happen
on our server** — a route handler or a server action. There is no `app/api/media/`
route today; nothing in the app references `gated/`, `X-Upload-Ticket` or
`is_allowed_to_upload_files`.

`/api/proxy` (`app/api/proxy/route.ts`) is the existing "inject the token
server-side" path, but it only knows seven services
(`utils/server/tokenManager.ts:50-58`, `utils/serviceTokens.ts:17-25`) and the
media server is not one of them. Note it also **reads the whole body into the
function** (`route.ts:150-151`), which matters for the byte path (`OQ-4`).

## Relevant directories

- `services/` — five of the six files holding upload code live here
  (`story.ts`, `order.ts`, `auth.ts`, `sellerDashboard/index.ts`,
  `sellerDashboard/comments.ts`). The new upload service would live here too.
- `components/SellerDashboard/` — the screens that upload: `StoriesTab.tsx`,
  `ShopInfo.tsx`, `ExcelUploadTab.tsx`, `productEdit/ProductEditor.tsx`,
  `boutiqueEdit/BoutiqueEditor.tsx`.
- `components/Orders/` — `UploadImageComponent.tsx`, the return / rating photo UI.
- `components/Chat/` — `chatsFunctions.tsx`, the chat attachment upload.
- `app/api/` — where a server-side mint route would go; `app/api/proxy/` is the
  existing token-injecting route to compare against.
- `utils/server/` — `tokenManager.ts` (cookie reads, allowed servers, base URLs)
  and `helpers.ts` (media URL building, `:63-77`).
- `serverRequests/` — `HandleAuthedFetch.ts`, the server-side `401` pattern to
  match. **Protected path.**
- `utils/` — `fetchData.ts` (the client `401` pattern), `serviceTokens.ts`,
  `tinyUtils.tsx` / `functions.tsx` (media URL builders).
- `public/translations/` — the three translation files any new message must be
  added to.

## Relevant config files

- `.env.development` / `.env.production` — both declare
  `NEXT_PUBLIC_MEDIA_API_KEY` (line 92) and `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL`
  (line 93), plus `NEXT_PUBLIC_BASE_MEDIA_URL` (line 34). The base URLs stay (they
  build public image `src` values); the key is what this work removes the need for.
- `next.config.ts` — `images.domains` already allows `media_server.ramaaz.dev`
  (`:176`), so delivery URLs need no change. **Protected path.**
- `proxy.ts` — only uses the media base URL for a `preconnect` hint (`:341-347`).
  No upload logic. **Protected path** — expected to stay untouched.
- `.claude/project-config.yaml` — `protected_paths` (`:114-124`) and the
  validation profiles (`:218-256`). Read to understand only; never changed.
- `package.json` — the scripts listed below.

**Protected paths this ticket will most likely have to touch:**
`services/auth.ts` (row 7) and `services/order.ts` (row 6) both contain upload
code and are both on the protected list. Under GU-2 / IM-5 they may only change
inside an approved `/implement` **and only if `plan.md` lists them under "Files to
change"** (`OQ-11`).

## Possibly affected services

- **Media server** (external, already live) — the new `/gated/*` routes. The legacy
  routes still work, so nothing breaks while we migrate.
- **Gateway** (external) — the mint call resolves identity through it. If the
  identity endpoint or the `is_allowed_to_upload_files` flag is not finished, minting
  may refuse users it should allow (`OQ-1`).
- **Market / market-dashboard backends** — unchanged, but they receive the values
  the uploads produce: `file_path` for stories, `sub_path` for return and rating
  photos, bare file names for product images, boutique icons and banners, and
  `file_url` for the Excel import (`sellerDashboard/index.ts:714-722`).
- **Chat backend** — only affected if the chat attachment upload is moved (`OQ-7`).
- **Stories backend** — receives the story file path built from the upload
  response (`story.ts:157-169`).
- **Auth / session** — the `401` alignment touches the same recovery machinery the
  whole app shares (`fetchData.ts`, `services/auth.ts`). A mistake here can affect
  far more than uploads.

## Test / validation commands available

No test suite exists in this repo; these are the checks that do exist. **None were
run during research.**

- `pnpm exec tsc --noEmit` — TypeScript compiles with no errors (`typecheck`).
- `pnpm lint` — ESLint, including the rule that fails on translate keys missing
  from `ar` / `tr` / `ku`.
- `pnpm lint:i18n-parity` — checks the three translation files stay key-parallel.
- `pnpm build` — production build.
- `pnpm knip` — finds unused files, exports and dependencies (useful here: a
  migration leaves dead upload functions behind).
- Profiles available in `project-config.yaml`: `standard-frontend` (typecheck +
  lint) and `full-build` (typecheck + lint + build). Because protected paths are
  in play, `full-build` is the safer choice for `/plan` to name.

Manual checks will carry most of the verification: upload a story image and a story
video, product images (bulk), a product video, a meta image, a shop logo and
banner, a boutique icon and banner, an Excel file, a return photo, a rating photo,
and a profile picture — each as a signed-in user, and each with a deliberately
expired session.

## Risks and unknowns

- **The `401` recovery can produce a token that cannot upload.** The app's standard
  answer to a `401` is "become a guest and retry"; the mint call is meant to refuse
  guests with `403`. Done naively this turns an expired session into a silent
  `403` loop. Impact: high. Likelihood: high unless decided deliberately.
- **Uploads are the app's largest requests and must not pass through our server.**
  The Excel cap is 512 MB and a single upload can be 100 MB, while a Vercel
  function accepts a request body up to 100 MB — and `/api/proxy` reads the whole
  body into memory (`route.ts:150-151`). Minting (small JSON) can go through our
  server; the bytes must keep going straight to the media server. Impact: high if
  missed — Excel import would break outright.
- **Two protected paths are in the way** (`services/auth.ts`,
  `services/order.ts`). If `plan.md` does not list them, `/implement` must stop
  (IM-5, IM-8). Impact: the ticket stalls at implementation.
- **The ticket is single use and dies in 120 s.** Any code that mints early (on
  file pick, on page load) or reuses a ticket across two requests will fail
  intermittently and look like a flaky network. Impact: medium, and hard to debug
  later.
- **A cross-origin custom header triggers a CORS preflight.** `X-Upload-Ticket`
  means the browser sends an `OPTIONS` request first. If the media server does not
  allow that header for our domains, every browser upload fails while the same call
  works from a terminal. Cannot be confirmed read-only (`OQ-13`).
- **The Excel response no longer has `url`.** `ExcelUploadTab.tsx:263-265` reads
  `uploaded.url` and hands it to `processExcel` as `file_url`. Switching to `key`
  changes the value the backend receives, which may not be the same string
  (`OQ-6`). Impact: silent Excel import failure.
- **Bulk is images-only and count-exact.** Today `bulkUploadImages` is only called
  with images, but the mint has to declare `count` and the request must send exactly
  that many files, or it returns `413`. A caller that filters files after minting
  breaks (`OQ-12`).
- **Story size cap drops to 10 MB for `story` tickets.** Today only *videos* use
  `?story=true`; images go to the plain route. If we mint every story upload with
  `story: true`, story images gain a 10 MB limit they did not have (`OQ-5`).
- **The key stays leaked until a later ticket.** Removing the app's use of
  `NEXT_PUBLIC_MEDIA_API_KEY` does not un-leak it; it is in git history and the
  legacy routes still accept it. That cutover is explicitly a later ticket, so this
  one must not be described as "closing the hole".
- **One shared service is a single point of failure.** Every upload screen in the
  app will depend on one module. A regression in it breaks stories, products,
  boutiques, shop branding, Excel import, returns, ratings and profile pictures at
  once. Impact: high — this is what verification has to cover screen by screen.
- **Dead code will be left behind.** `sellerCommentsService.UploadExcel` already
  points at a route that does not exist, and `fetchData`'s `"upload story"` server
  type is unused. A migration that ignores them leaves two misleading paths in the
  codebase (`OQ-8`).

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count. A question about touching `protected_paths` is answered by putting the
> path in scope (then `plan.md > Files to change`) or by putting it Out of Scope.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Can a **guest** token mint a ticket, or does the live media server answer `403`? And is the gateway identity flag (`is_allowed_to_upload_files`) finished, or does it currently refuse people it should allow? | Everything about the `401` and `403` behaviour depends on this answer. It also decides whether any not-signed-in upload screen still works. |
| OQ-2 | What exactly must "an upload `401` behaves like any other market server `401`" mean: reuse the full client recovery in `fetchData.handleUnauthorized` (refresh → expire → prompt → retry, capped at two attempts), or only the parts that can help an upload? And what happens when that recovery ends with a guest token the mint call refuses (OQ-1)? | This is the owner's requirement and the one thing not covered by the migration guide. It cannot be verified unless it is written down precisely. |
| OQ-3 | Does this ticket add a **server-side mint step** (our own route or server action), given that `MARKET-TOKEN` is HttpOnly and the browser cannot send it cross-origin? | Without it there is no way to mint from the web app at all. The spec should state the constraint; the exact shape is `/plan`'s call. |
| OQ-4 | Do the **file bytes** keep going straight from the browser to the media server (only the mint passes through our server)? | Excel allows 512 MB and a normal upload 100 MB; routing bytes through a function would break the large ones. |
| OQ-5 | For each of the eight call sites, what `folder`, `count` and `story` values does the mint send — and in particular, do **story images** mint with `story: true` (10 MB cap) or `false` (100 MB), given that today only story *videos* use the story route? | The mint now carries what the upload used to send. Getting one wrong silently changes where a file lands or what size is allowed. |
| OQ-6 | The gated Excel response drops `url` and returns only `key`. Does the backend's `processExcel` (`file_url`) want the bare `key`, or a URL built from it? | `ExcelUploadTab.tsx:263-265` passes `uploaded.url` today. Guessing here breaks the Excel import with no visible error. |
| OQ-7 | Is the **chat attachment** upload in scope — moving it off the chat backend's `/api/v1/upload_file` onto the media server's new `/gated/chat/upload_file`? | It is the only upload that is not on the media server today. "All uploads" is ambiguous until this is decided, and moving it changes where chat files are served from. |
| OQ-8 | Is the dead `sellerCommentsService.UploadExcel` (and the unused `"upload story"` server type in `fetchData.ts`) **deleted** in this ticket, or left alone? And is `NEXT_PUBLIC_MEDIA_API_KEY` removed from the code and env here, or in the later cutover ticket? | Decides whether `pnpm knip` stays clean and whether the ticket is a pure migration or also a cleanup. |
| OQ-9 | What is the **retry rule**? The guide says a ticket is single use, a failed upload burns it, and `403` means "mint a new one, retry once". How many silent re-mints do we allow, and does the user ever see the ticket problem? | Too few retries means avoidable failures; too many hides a real fault and can double-upload a file. |
| OQ-10 | Which **new user-visible messages** does this need (session expired, not allowed to upload, file too large, service busy), and are the `ar` / `tr` / `ku` entries added before the code uses them? | CLAUDE.md forbids hardcoded copy, and `pnpm lint` now fails on a key missing from the three files. |
| OQ-11 | Are the two protected paths **`services/auth.ts`** and **`services/order.ts`** in scope for this change (they hold two of the eight uploads), or is their migration deferred? | GU-2 / IM-5: if they are not listed in `plan.md > Files to change`, `/implement` must stop and change nothing. |
| OQ-12 | Do the bulk-upload screens guarantee **images only** and a file count that matches the minted `count` exactly? | The gated bulk route rejects videos into a `skipped` array and answers `413` when the count does not match. |
| OQ-13 | Has the media server been confirmed to allow the cross-origin **`X-Upload-Ticket` preflight** from our domains, and are the client-side size checks aligned with the new caps (100 MB, 10 MB for story, 25 MB for chat, 512 MB for Excel)? | A missing CORS allowance fails every browser upload while working from a terminal; stale client limits reject files the server would accept. |

## Notes

- No code was changed during research.
- No `protected_paths` files were modified.
