---
ticket: seller-product-ai-autofill
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-10-19
links:
  clickup:
  github:
---

# Research — seller-product-ai-autofill

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Let a seller start a new product from a photo: an "Add with AI" button, a
seller-only internal route that asks Gemini for name / description / brand /
categories, and the existing create form opened with those values filled in.

## Relevant directories

- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` (2865
  lines) — the dashboard. The Products tab renders the **"+ Add Product"** link
  at line ~1266 (header) and **"+ Add your first product"** at line ~1244 (empty
  state). Both are shown only when `hasPermission("CREATE_PRODUCT")` is true, and
  both link to `…/products/new`.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/products/new/page.tsx`
  — the create page. It renders `<ProductEditor mode="create" />` and nothing
  else. It takes no starting values today.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` (1705 lines) — the
  form owner.
  - `load()` (line ~226): in create mode it calls
    `SellerDashboardService.getProductCreateForm(sellerId)` and sets
    `form = emptyProductForm()`. There is **no prop or input for initial values**.
  - Category cascade (lines ~287–442): a `useEffect` keyed on the joined
    `category_id + sub_category_id + sub_sub_category_id` calls
    `syncCategoryLookups`. That function fetches
    `GET /shop/products/categories/{id}/lookups` for **every selected id at every
    level, in parallel**, merges the branches, then prunes sub / sub-sub ids that
    are not in the merged branch — **only when every fetch succeeded**.
    So setting all three levels in one `setForm` loads the branch and keeps
    valid children. The order problem in the guide (Step 9.4) is already
    handled by this code.
  - `onUploadImages` (line ~446): uploads with
    `SellerDashboardService.bulkUploadImages(files, "product")` and stores
    `ImageItem { name: <bare file name>, url: <blob URL>, isNew: true }`.
  - Drafts: `handleSaveDraft` / `handleLoadDraft` (lines ~688–753) keep the whole
    `ProductForm` in `localStorage` under
    `trydos_product_editor_draft_<sellerId>_<productId|new>`. Loading is a manual
    button, not automatic.
- `components/SellerDashboard/productEdit/helpers.ts` — `ProductForm`,
  `Lookups`, `emptyProductForm()`, `fileName()`.
  - `category_id`, `sub_category_id`, `sub_sub_category_id` are **`number[]`**
    (multi-select chips). The guide returns **one** id per level.
  - `brand_id` is a **string** (a `<Select>` value).
  - `description` is **HTML** from a TipTap editor (`ui/RichTextEditor.tsx`,
    sanitised by `utils/sanitizeHtml`, per `docs/features/H-seller-dashboard/SL-04-product-editing.md`).
  - `name` is plain text.
- `components/SellerDashboard/productEdit/sections.tsx` — the Brand select
  (line 531, options from `lookups.brands`), the description editor (line 539),
  and the three category chip groups (lines 700–702, from
  `lookups.parent_categories / sub_categories / sub_sub_categories`).
- `services/sellerDashboard/index.ts` — client service (`fetchData`, server
  `"market-dashboard"`, header `X-Seller-ID` through `/api/proxy`).
  - `getProductCreateForm` → `GET /shop/products/lookups` — gate
    `CREATE_PRODUCT | SUPER_ADMIN`. Datasets are flat under `data`.
  - `getCategoryLookups` → `GET /shop/products/categories/{id}/lookups` — gate
    noted as `UPDATE_PRODUCT | SUPER_ADMIN`. Returns `{ sub_categories,
    sub_sub_categories, descriptor_groups }` for one branch. For a top id,
    `sub_categories` are direct children and `sub_sub_categories` are the
    grandchildren of that branch.
  - `bulkUploadImages` → `POST {NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}/gated/upload/bulk`
    with `x-api-key` + an upload ticket (`GetTicket`). The editor keeps only the
    last path segment of what comes back (`extractNames` → `fileName`).
- `tests/e2e/harness/qaSeed.ts:991–999` — states from a live answer that
  `GET /shop/products/lookups` carries `brands` and `parent_categories`. So the
  create lookups give the **top level only**. Sub and sub-sub levels exist only
  per category, through the second endpoint.
- `app/api/seller/comments/*` + `_utils.ts` — the mobile seller-comments routes.
  They read the market token from `Authorization: Bearer` or `x-market-token`,
  answer CORS, and pass the token into the server-action gate.
- `services/elastic/sellerComments.ts` — **the seller auth pattern the owner
  pointed to** (also described in `docs/seller-comments-auth.md`):
  1. `resolveAuthToken`: the explicit header token (mobile) or the HttpOnly
     `MARKET-TOKEN` cookie (web).
  2. `getVerifiedShops`: `GET {BACKEND_URL}/shop/auth/permissions`. Web path
     goes through `HandleAuthedFetch` (handles the 60-second token and the 401
     exchange); header path calls `fetch` directly and fails closed. Cached with
     React `cache` + Redis (`seller:perms:<sha256(token)>`, 30 s fresh, 3600 s
     stale).
  3. `assertSellerCommentAccess`: the shop with `seller_id === sellerId` must be
     in the list, and its `permissions` must include `SUPER_ADMIN` or the
     required one. It never trusts the client `sellerId` alone.
  4. `withSellerCommentAccess`: wraps every action; then a per
     `shop + token-hash` rate limit with `fixedWindowRateLimit`.
  All of these helpers are **private to that file** and the permission type is
  `CommentPermission`, so a product permission cannot be passed in today.
- `serverRequests/radis/index.ts:124` — `fixedWindowRateLimit(key, limit,
  windowSeconds)`. It fails open when Redis is not configured.
- `serverRequests/HandleAuthedFetch.ts` — server fetch with `MARKET-TOKEN`, 401
  exchange, accepts extra `headers` (so `X-Seller-ID` can be sent).
- `app/api/image-search/route.ts` — the **only existing Gemini caller**
  (shopper search by photo). It uses `@google/generative-ai` `^0.21.0` and
  `process.env.GEMINI_API_KEY`, model `gemini-1.5-flash`, image sent inline as
  base64. It has no auth and no rate limit.

## Relevant config files

- `.env`, `.env.development`, `.env.preview`, `.env.production` (all
  git-ignored by `.gitignore:149 .env*`) — already define `GEMINI_API_KEY`. The
  stored value is an **old key** (`AIza…`, 39 chars), **not** the key the owner
  gave. A check on 2026-10-19 with the old key: `gemini-2.5-flash` → HTTP 404,
  `gemini-1.5-flash` → HTTP 404 ("not found for API version v1beta").
- `.env.example:139` — documents `GEMINI_API_KEY`.
- `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` (`https://media_server.ramaaz.dev`, upload)
  and `NEXT_PUBLIC_BASE_MEDIA_URL` (`https://media.ramaaz.dev`, reading images
  back) — the two media hosts.
- `package.json` — `@google/generative-ai ^0.21.0` is installed. No `ai`,
  `@ai-sdk/*`, `@google/genai` or `zod` dependency was found.
- `vitest.config.mts` — unit suite config (`pnpm test:run` = `vitest run
  --project unit`).
- No protected runtime path (`proxy.ts`, `next.config.ts`, `instrumentation*`,
  `sentry.*`, `.github/workflows/**`) is needed: `proxy.ts`'s matcher already
  skips `/api`, and no new image host is needed for `next/image`.

## Possibly affected services

- **Core backend** (`BACKEND_URL`, "market-dashboard") — two reads per AI call
  at least: `/shop/auth/permissions` (cached) and `/shop/products/lookups`; plus
  category branch reads (see OQ-1).
- **Google Gemini API** (`generativelanguage.googleapis.com`) — new outbound
  call from a Vercel function. One call with an image takes several seconds.
- **Media server** — the photo is uploaded there, and Gemini or our route must
  read it back (OQ-2, OQ-3).
- **Redis** — permission cache and the rate-limit counter.
- **Seller dashboard UI** — Products tab button, create page, `ProductEditor`.
- **Shopper image search** (`/api/image-search`) — shares the env var name
  `GEMINI_API_KEY` (OQ-10).

## Test / validation commands available

- `pnpm test:run` — unit suite (Vitest, about five minutes, no backend).
- `pnpm lint` — ESLint; also fails on a translation key missing from ar/tr/ku.
- `pnpm lint:i18n-parity` — ar/tr/ku keys are in step.
- `pnpm exec next typegen && pnpm exec tsc --noEmit` — typecheck (`tsc` needs
  `next typegen` first).
- `pnpm build` — production build (catches server-only imports in client code).
- `pnpm test:e2e:live` / `pnpm e2e:health` — browser suite against staging.

### Test layout and naming

- Unit tests live under `tests/`, **mirroring the source path**:
  `app/api/seller/comments/route.ts` → `tests/app/api/seller/comments/route.test.ts`;
  `components/SellerDashboard/productEdit/ProductEditor.tsx` →
  `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx`;
  dashboard pages → `tests/app/sellerProfile/sellerDashboard/*.test.tsx`
  (e.g. `productPages.test.tsx`).
- File name: `<unit>.test.ts` / `<unit>.test.tsx`. Route tests start with
  `// @vitest-environment node`.
- Runner: Vitest. Mocks with `vi.mock(...)`. Every assertion carries a message
  (CLAUDE.md "Testing").
- Expected-failure marker: `it.fails("BUG-<id>: …")` (e.g.
  `tests/components/Orders/ChangeAddressWidget.test.tsx:189`).
- Existing files that already cover units this ticket may touch:
  `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx`,
  `…/helpers.test.ts`, `…/sections.test.tsx`,
  `tests/app/sellerProfile/sellerDashboard/productPages.test.tsx`,
  `tests/app/api/image-search/route.test.ts`,
  `tests/app/api/seller/comments/route.test.ts`.
- Browser suite: `tests/e2e/`, `*.live.spec.ts`, `test.step()` per step; seller
  dashboard cases SD-01..SD-12 run on a QA seed session.

## Risks and unknowns

- **The 60-second access token.** The route runs on a signed-in page, so the
  first core call often gets a 401. The web path must go through
  `HandleAuthedFetch` (exchange + retry). A plain `fetch` with the cookie
  would fail every minute. — high likelihood if missed.
- **Vercel body limit 4.5 MB.** If the photo travels through our route, a large
  phone photo can pass that limit. — medium.
- **Gemini cannot fetch every link.** On 2026-10-19 a Wikimedia link failed with
  "Cannot fetch content from the provided URL"; a `picsum.photos` link worked.
  Whether Gemini can fetch from `media.ramaaz.dev` is **not verified**. — medium.
- **Category level data is not in one call** (OQ-1). Fanning out to every top
  category on each click multiplies core calls. — high impact on cost/latency.
- **Prompt injection through text in the photo.** The output is fixed by a JSON
  schema and every id is checked against our lists, so the worst case is a
  wrong title or description that the seller sees before saving. — low.
- **Region refusal.** Gemini refuses some countries. Vercel runs the function in
  its own region, so this is a risk only for local runs. — low.
- **Cost and abuse.** Each call costs tokens. Gate + rate limit are needed
  (guide: 10 per minute per user). `fixedWindowRateLimit` fails open when Redis
  is down. — medium.
- **Stack-agnostic naming.** Nothing that reaches the browser may name a backend
  technology. "Gemini" is the AI provider, not our backend stack, but the env
  var and any error text should still be checked against the CLAUDE.md rule
  (OQ-10).
- **Out-of-scope finding:** the shopper image search
  (`app/api/image-search/route.ts`) uses `gemini-1.5-flash`, which answers 404
  today, with an old key that also answers 404. Shopper search by photo is very
  likely broken now. This is a separate ticket, not this one.

## Open questions

| ID | Question | Why it matters |
|----|----------|----------------|
| OQ-1 | `GET /shop/products/lookups` gives only `parent_categories` and `brands`. Sub and sub-sub categories come only from `GET /shop/products/categories/{id}/lookups`, one top category at a time. How does the route give Gemini the three levels? Options: (a) **two Gemini steps**: choose the top category from the parents, then load that one branch and choose sub / sub-sub; (b) load **every** branch on each call (one core call per top category, cached in Redis); (c) ask the backend team for a full-tree endpoint. | Decides the number of core and Gemini calls per click, the latency, and whether the guide's "one call with all lists" can be followed. |
| OQ-2 | How does the photo reach Gemini? (a) the browser uploads to the media server first (as the editor does), sends the file name to our route, and the route builds the public link for Gemini; (b) the same, but the route downloads the image itself and sends it inline (base64); (c) the browser sends the file to our route directly (multipart, ≤ 4.5 MB). | Changes the request shape, the size limit, and whether the uploaded photo can become the product's first image without a second upload. |
| OQ-3 | Can Gemini fetch images from `https://media.ramaaz.dev`? Evidence so far (2026-10-19): the host root answers **HTTP 401** to an anonymous request; `dev.trydos.com` did not answer from this machine, so no real product image link could be tested. | If not, OQ-2 (a) fails and the route must send the bytes inline. |
| OQ-4 | Where is the button, and how do the AI values reach the create form? Options for the hand-off: in-memory (Zustand store / module state), `sessionStorage`, the existing `localStorage` draft key, or a query string. | `ProductEditor` has no input for starting values today. The hand-off must survive the client navigation to `…/products/new`, and must not leave old values behind for the next manual "Add Product". |
| OQ-5 | Should the uploaded photo also be added to the form's **images** as the first (main) image? | The guide's photo is the product's main image. If not carried over, the seller uploads the same photo twice. |
| OQ-6 | The form's category fields are multi-select arrays (`number[]`). The AI returns one id per level. Fill each level with `[id]` or `[]`? | Fixes the mapping from the AI answer to `ProductForm`. |
| OQ-7 | The description field is HTML (TipTap). The AI returns plain text. Wrap it as escaped `<p>…</p>`? | Raw text with `<` or line breaks could render wrongly or inject markup. |
| OQ-8 | Which permission gates the route: `CREATE_PRODUCT` or `SUPER_ADMIN` (the same gate as the button and `/shop/products/lookups`)? And how is the comments gate reused: extract the private helpers of `services/elastic/sellerComments.ts` into a shared module, or write a small product-only copy? | Security boundary. Extracting touches the comments flow; copying duplicates security code. |
| OQ-9 | Rate limit: 10 calls per minute per verified shop + session, through `fixedWindowRateLimit` (fails open without Redis)? | Cost control; the guide asks for it. |
| OQ-10 | Env var: put the new key in the existing `GEMINI_API_KEY` (this also changes the key the shopper image search uses), or add a new server-only variable with a role-based name (e.g. `AI_VISION_API_KEY`)? | The old key fails today; the naming rule in CLAUDE.md; Vercel env must be set for preview and production. |
| OQ-11 | How does the route call Gemini: the installed `@google/generative-ai` 0.21 (legacy SDK), a plain `fetch` to the REST API, or a new dependency (`@google/genai` or the AI SDK)? | New dependencies, bundle size of the function, and how the JSON schema is passed. |
| OQ-12 | Output language: always English (as the guide says), even when the seller's UI is ar / tr / ku? | The form has a translations section; English text goes into the main `name` / `description`. |
| OQ-13 | Does the route need a **mobile** path too (bearer token in the header, CORS), as the comments routes have, or only the web dashboard (HttpOnly cookie)? | The owner said "like seller comments auth flow"; those routes are the mobile ones. A mobile path adds CORS and a second token source. |
| OQ-14 | Which name is sent to Gemini for brands and categories: `name` (English, raw) or `translated_name` (depends on the `lang` header)? | Gemini must match English text; a translated list lowers the match quality. |
| OQ-15 | Is the guide's "overwrite confirmation" (Step 2) in scope? It applies only if a "Fill with AI" button also exists **inside** the open form. | If the only entry is the new button on the Products tab, the form is always empty and no confirmation is needed. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- The shopper image-search finding above is recorded here for a separate
  ticket; it is not part of this work item.
