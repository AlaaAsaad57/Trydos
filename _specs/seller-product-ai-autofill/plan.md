---
ticket: seller-product-ai-autofill
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Plan — seller-product-ai-autofill

> Decide the approach before changing code. Plan only — no implementation here.

> **Post-review amendment A-1 (owner-directed, 2026-10-19).** The owner approved
> this plan at `/review` and accepted the three `major` panel findings P-1, P-2
> and P-3 (`review.md > Panel Findings`). The owner then asked for the plan to
> carry those fixes **without** moving the ticket back to `plan`. So the
> amendments below were added after the gate: **the comprehension check did not
> examine them.** Every amended place is marked `(A-1 / P-n)`. Nothing else in
> the plan changed. `ticket.md` was not touched.
>
> | Finding | Fix in this plan | Where |
> |---|---|---|
> | P-1 — thinking not limited | `thinkingConfig.thinkingBudget: 0` on every call; asserted in the AC-7 test | Step 1 `buildGeminiRequest`; Tests AC-7 |
> | P-2 — weak rate-limit key, fails open | Key on `sellerId` only (per shop, not per rotating token); a limiter that failed open answers 503, so the paid call is never made uncapped | Step 2; Tests AC-6; Integration surface |
> | P-3 — tree rule unverified | New Step 0 checks a real staging answer before code; parent by path **with** an order fallback; unlinked items reported to Sentry; AC-8 fixture built from the real answer | Step 0; Step 1 `loadLists`; Tests AC-8 |

> **Post-review amendment A-2 (owner-directed, 2026-10-19, during implement
> Step 0).** Step 0 read a real staging `GET /shop/excel/categories` answer
> (471 items). The `display_name` paths are fully consistent: 405 of 405
> children have their exact parent path in the list, and every child comes
> after its parent. But the **`level` field is wrong for 302 of 471 items**:
> 273 items two levels deep and 29 items one level deep say `level: 0` (for
> example `"Women1 -> Sportswear -> Yoga Tight"`, `level: 0`). That breaks the
> core backend's own contract (`docs/shop-excel-template-mode.md`). So:
>
> - an item's level is its **path depth** — the number of ` -> ` separators in
>   `display_name` (0 = top, 1 = sub, 2 = sub-sub). The `level` field is
>   **not used** to sort items;
> - the order fallback (A-1) uses the same path depth, never `level`;
> - when `level` and path depth disagree for any item, the Sentry
>   `category tree` event also carries `levelMismatch: <count>`, so the backend
>   fault stays visible;
> - an item deeper than 2 is dropped and counted.
>
> The owner chose this amendment, ticket status unchanged. The comprehension
> gate did **not** examine A-2. Amended places are marked `(A-2)`.

## Approach

A new **web-only** route handler, `POST /api/seller/products/ai-autofill`, plays
the backend role from the guide. It checks the seller against the core backend
(same model as seller comments), rate-limits, loads the photo **from our media
host itself**, loads the brand list and the three-level category tree, makes
**one** Gemini call with a JSON schema through plain `fetch`, checks the answer,
and returns six fields. On the dashboard, a small dialog uploads the photo with
the existing media upload, calls the route, keeps the answer in a **one-shot
in-memory hand-off**, and navigates to the existing create page. `ProductEditor`
reads the hand-off once when it mounts in create mode and fills the form; its
existing category cascade loads the lower levels.

Why this shape:

- **Route downloads the image and sends it inline** (OQ-2/OQ-3). On 2026-10-19
  Gemini read a real stored image from `{NEXT_PUBLIC_BASE_MEDIA_URL}/product/<file>`
  both by link and inline (HTTP 200 both). But Gemini's own fetcher refused a
  Wikimedia link the same day, so a link depends on Google's crawler rules. If
  the route downloads the bytes, the route alone decides: it fetches only our
  media host, checks the type and size, and Gemini never needs network access to
  us. The browser sends only a **bare file name**, so the route builds the URL
  itself and cannot be pointed at another host.
- **Plain `fetch` to the Gemini REST API** (OQ-11). No new dependency. The
  installed `@google/generative-ai` 0.21 is the old, deprecated SDK. The exact
  REST request was already tested with this key.
- **A product-only access check inside the route folder** (OQ-8). The comments
  helpers are private to a `"use server"` file. Exporting them from there would
  turn them into public server actions. Moving them into a shared module would
  change the comments security code, which this ticket does not need. The new
  check is about 40 lines and follows the same rules: identity from the HttpOnly
  `MARKET-TOKEN` through `HandleAuthedFetch` (so the 60-second token is renewed),
  shop membership + `CREATE_PRODUCT | SUPER_ADMIN` from
  `GET /shop/auth/permissions`, fail closed. No permission cache: the route is
  limited to 10 calls a minute, so one permission read per call is cheap.
- **A module-level one-shot store** for the hand-off (OQ-4). It survives the
  client navigation to `…/products/new`, it is gone on reload (FR-13), and it is
  keyed by `sellerId`. No new Zustand slice, no storage key left behind.

## Steps

0. **Check the real category answer first (A-1 / P-3).** Before any code,
   get one real `GET /shop/excel/categories` answer from staging for a real
   seller (the owner, or the implementer through the dashboard Excel tab at
   `/sy-en/...` and the browser's network panel — it goes through
   `/api/proxy`). Also get the same shop's `GET /shop/products/lookups`
   `parent_categories`. Record in `implement.md > Evidence`:
   - (a) whether **every** level-1 / level-2 `display_name` starts with its
     parent's exact `display_name` followed by ` -> `;
   - (b) whether the answer is in tree order (each child after its parent);
   - (c) how many level-0 items there are, and how many of them are also in
     `parent_categories` (if the Excel list is only "categories that expose an
     excel template", this number shows it);
   - (d) the item counts per level.
   Save a trimmed copy (one or two real branches, ids and paths only) as the
   AC-8 fixture. **If (a) and (b) are both false, or (c) shows that most form
   categories are missing, stop: record a block in `implement.md`** — the
   category source must be decided again, and that is outside this plan.
1. **Server helpers** — `app/api/seller/products/ai-autofill/_autofill.ts`:
   - `assertProductCreateAccess(sellerId)`: `HandleAuthedFetch` →
     `{BACKEND_URL}/shop/auth/permissions`; non-2xx → `{status: 401}`; shop not
     in the list → 403; no `CREATE_PRODUCT` / `SUPER_ADMIN` → 403.
   - `parseImageName(value)`: accepts only a bare file name matching
     `^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$` (case-insensitive);
     anything else (missing, a URL, a path, another extension) → `null`.
   - `loadImage(name)`: `fetch({NEXT_PUBLIC_BASE_MEDIA_URL}/product/<name>)`
     with a 10 s timeout; requires HTTP 200, `content-type` starting with
     `image/`, and at most 7 MB; returns `{ mimeType, base64 }` or `null`.
   - `loadLists(sellerId)`: in parallel, `HandleAuthedFetch` →
     `{BACKEND_URL}/shop/products/lookups` and
     `{BACKEND_URL}/shop/excel/categories`, both with `X-Seller-ID: <sellerId>`
     and `lang: en`. Builds:
     - `brands`: `{ id, name }` from `data.brands`;
     - **(A-2)** every item's level = its `display_name` path depth, not its
       `level` field;
     - `categories`: depth-0 items **whose id is also in
       `data.parent_categories`** (so the AI never picks a top category the
       form cannot show), as `{ id, path }`;
     - `subCategories` / `subSubCategories`: depth-1 / depth-2 items as
       `{ id, path, parentId }`. **(A-1 / P-3)** The parent is found in two
       ways, in this order:
       1. by path — the item whose `display_name` equals this item's path
          without its last ` -> ` segment;
       2. if the path finds nothing, by order — the nearest item **before** it
          in the answer whose **path depth (A-2)** is one less (the contract
          says the answer is a tree "in display order").
       An item that neither rule links is dropped. If any item was dropped, or
       linked only by the order rule, the route reports one Sentry event
       (`LogServerError`, scenario `seller-ai-autofill: category tree`, with the
       counts only: `levelCounts`, `linkedByPath`, `linkedByOrder`, `dropped`,
       `sellerId`). So a wrong rule shows up in Sentry, and is not a silent
       empty sub-level. Step 0's evidence decides which rule is expected to
       carry the real data.
     Either call failing → throws (route answers 500).
   - `buildGeminiRequest(image, lists)`: the request body — the inline image,
     one text part with the guide's instructions and the four lists (one
     `id: path` line each), and `generationConfig` with
     `responseMimeType: "application/json"` and a `responseSchema` of six
     nullable fields (`title`, `description` strings; four integer ids).
     **(A-1 / P-1)** `generationConfig.thinkingConfig.thinkingBudget: 0`, so
     the model does not spend "thinking" tokens. Evidence, 2026-10-19, same
     photo and schema with this key: thinking on → 572 thought tokens (about 10
     times the 57 answer tokens) and 9.9 s; `thinkingBudget: 0` → 0 thought
     tokens and 7.7 s. If the category choice turns out poor in the manual
     check, a small fixed budget is the next step — a plan change, not an
     implement choice.
   - `callGemini(body)`: `POST
     https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
     key in the `x-goog-api-key` header from `process.env.GEMINI_API_KEY`
     (never in the URL), 30 s timeout. Gemini 503 or 429 → `AiBusyError`; any
     other failure, a timeout, or unparsable JSON → `AiFailedError`.
   - `checkSuggestion(raw, lists)`: applies every FR-10 rule and returns the six
     fields with `null` for empty.
2. **Route** — `app/api/seller/products/ai-autofill/route.ts` (`POST` only):
   read JSON `{ sellerId, image }` → access check (401 / 403) → rate limit
   **(A-1 / P-2)** `fixedWindowRateLimit("seller:ai:rl:<sellerId>", 10, 60)`:
   - the key is the **shop only**. It no longer holds a hash of
     `MARKET-TOKEN`, so a renewal does not start a fresh bucket. All staff of
     one shop share the 10 calls a minute. This is stricter than FR-7's "shop +
     session", so AC-6 still holds.
   - `allowed: false` → 429.
   - **fail closed:** `fixedWindowRateLimit` returns `ttl: 0` only when it
     failed open (no Redis client, or a Redis error —
     `serverRequests/radis/index.ts:130` and the `catch`); a real count always
     returns `ttl > 0`. The route treats `ttl === 0` as "limiter unavailable"
     and answers **503** with the busy message, before any AI call. The shared
     limiter is not changed, so comments and OTP keep their fail-open
     behaviour.
   - owner action (outside the code): set a daily request quota for the key in
     Google Cloud, as a last cap.
   → `parseImageName` + `loadImage` (422 "The image must be uploaded to the
   media server") → `loadLists` → `callGemini` → `checkSuggestion` → `200
   { success: true, data }`. Errors answer `{ success: false, message }` with the
   FR-15 message keys; 503 for `AiBusyError`, 500 for everything else.
   `LogServerError` with a scenario and status only. `Cache-Control: no-store`.
3. **Shared upload-name helper** — move `extractNames` from `ProductEditor.tsx`
   into `helpers.ts` (exported, unchanged body) so the dialog reads upload
   answers the same way the editor does.
4. **Hand-off + mapping** — `components/SellerDashboard/productEdit/aiPrefill.ts`:
   `setAiPrefill(sellerId, value)`, `peekAiPrefill(sellerId)`,
   `clearAiPrefill(sellerId)`, and `applyAiSuggestion(form, suggestion, image)`:
   title → `name`; description → HTML-escaped text, one `<p>` per paragraph;
   `brand_id` → `String(id)`; each category level → `[id]` or `[]`; the photo →
   `images[0] = { name, url, isNew: true }`; `null` fields stay empty.
5. **Dialog** — `components/SellerDashboard/productEdit/AiAutofillDialog.tsx`:
   file picker (JPEG / PNG / WebP only), analyse button disabled until a photo
   is picked and while running, loading state, upload with
   `SellerDashboardService.bulkUploadImages([file], "product")` +
   `extractNames`, then `fetch("/api/seller/products/ai-autofill")`. On success:
   `setAiPrefill(...)` with a blob URL preview, then `router.push(…/products/new)`.
   On failure: the translated FR-15 message, the dialog stays open. Closing
   aborts the request and ignores a late answer.
6. **Dashboard** — `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`:
   an "Add with AI" button beside each of the two "Add Product" links (same
   `hasPermission("CREATE_PRODUCT")` gate), and one dialog mount.
7. **Editor** — `ProductEditor.tsx`, create path only:
   `const [aiPrefill] = useState(() => isCreate ? peekAiPrefill(sellerId) : null)`
   and `clearAiPrefill(sellerId)` in a mount effect. In `load()`, create branch:
   `form = aiPrefill ? applyAiSuggestion(emptyProductForm(), …) : emptyProductForm()`;
   `initial` stays `emptyProductForm()` so the AI values count as unsaved
   changes. After the filled form renders (once, guarded by a ref): the success
   message and `scrollIntoView` on `[data-field="name"]`. Edit mode untouched.
8. **Translations** — add every new key to `translations.ar.js`,
   `translations.tr.js`, `translations.ku.js` (see list below).
9. **Env (local, git-ignored)** — set `GEMINI_API_KEY` in `.env`,
   `.env.development`, `.env.preview`, `.env.production` to the new key. These
   files are git-ignored, so they never enter a commit. **Vercel (owner, by
   hand):** set `GEMINI_API_KEY` for Preview and Production.

New translation keys (each checked absent on 2026-10-19 unless marked):

- "Add with AI"
- "Upload a product photo and AI will fill in the product details for you."
- "Choose a photo"
- "Analyze with AI"
- "Analyzing photo..."
- "Please choose a JPEG, PNG or WebP photo."
- "The details were filled by AI. Please check them before saving."
- "AI analysis failed"
- "The image must be uploaded to the media server"
- "The AI service is busy right now. Please try again in a moment."
- "You do not have permission for this action."
- "Too many requests. Please try again in a moment."
- reused, already present in all three files: "Image upload failed", "Cancel"

## Files to change

- `app/api/seller/products/ai-autofill/route.ts` — **new**. The POST route (step 2).
- `app/api/seller/products/ai-autofill/_autofill.ts` — **new**. Access check,
  image load, lists, Gemini request/call, answer check (step 1).
- `components/SellerDashboard/productEdit/aiPrefill.ts` — **new**. One-shot
  hand-off + `applyAiSuggestion` (step 4).
- `components/SellerDashboard/productEdit/AiAutofillDialog.tsx` — **new**. The
  dialog (step 5).
- `components/SellerDashboard/productEdit/helpers.ts` — receives the exported
  `extractNames` (step 3).
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — imports
  `extractNames` from helpers; reads the hand-off in create mode; message +
  scroll (steps 3, 7).
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` —
  two buttons + dialog mount (step 6).
- `public/translations/translations.ar.js`, `public/translations/translations.tr.js`,
  `public/translations/translations.ku.js` — new keys (step 8).
- `tests/app/api/seller/products/ai-autofill/route.test.ts` — **new** test file.
- `tests/app/api/seller/products/ai-autofill/_autofill.test.ts` — **new** test file.
- `tests/components/SellerDashboard/productEdit/aiPrefill.test.ts` — **new** test file.
- `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` — **new** test file.
- `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` — **extend**.
- `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` — **extend**
  (the existing test file that renders the dashboard's Products tab).
- Not committed, changed locally: `.env`, `.env.development`, `.env.preview`,
  `.env.production` (`GEMINI_API_KEY` value only, step 9).

No protected runtime path is touched.

## Integration surface

- **Components / shared config touched:**
  - env var `GEMINI_API_KEY` (local `.env*` + Vercel Preview/Production);
  - `ProductEditor` create path and `helpers.ts` (`extractNames` moves there);
  - the dashboard Products tab header and empty state;
  - core endpoints `GET /shop/auth/permissions`, `GET /shop/products/lookups`,
    `GET /shop/excel/categories` (read-only);
  - the market session pair (`MARKET-TOKEN` / refresh cookie) through
    `HandleAuthedFetch`;
  - Redis, new key prefix `seller:ai:rl:` — **(A-1 / P-2)** one key per shop,
    shared by every staff member of that shop; and the AI route now **depends
    on Redis being up** (fail closed), unlike comments and OTP;
  - Sentry, new scenario `seller-ai-autofill: category tree` (A-1 / P-3);
  - the three translation files.
- **Who else depends on them:**
  - `/api/image-search` (shopper search by photo) reads the **same**
    `GEMINI_API_KEY`. Its model `gemini-1.5-flash` is retired, so it fails
    today with either key; the new key does not fix or break it further.
  - Manual "Add Product" and the edit page use the same `ProductEditor`;
    `onUploadImages` / `onUploadMeta` use `extractNames`.
  - The Excel tab reads `/shop/excel/categories` (we only read it too).
  - Every other server call in the same browser shares the market session;
    `refreshMarketSession` is single-flight per refresh token.
- **Overlapping flows:**
  - Create mode of `ProductEditor` is shared by "Add Product" and "Add with
    AI". The only difference is whether a hand-off exists for this `sellerId`
    at mount.
  - The editor's category cascade (`syncCategoryLookups`) runs for AI-filled
    ids exactly as for ids picked by hand.
  - Drafts (`localStorage`) are untouched; "Load draft" still replaces the form.
- **Ordering / lockstep dependencies:**
  - Translation keys must land in all three files in the same change as the
    UI that uses them (`pnpm lint` fails otherwise).
  - `extractNames` move and its import in `ProductEditor` change together.
  - The Vercel env value must be set before the feature is used on a deployed
    build; without it every call ends as 500 "AI analysis failed".
- **What breaks if this is wrong:**
  - A plain `fetch` with the cookie instead of `HandleAuthedFetch` → the
    route answers 401 to every seller whose token is older than 60 s.
  - The hand-off read twice or never cleared → a manual "Add Product" opens
    with old AI values, or the AI values are lost under React StrictMode.
  - A wrong parent rule for categories → valid sub-categories emptied, or a
    sub-category from another branch accepted (the editor's prune would then
    drop it silently). **(A-1 / P-3)** Step 0 checks the rule on real data
    first, and the Sentry `category tree` event makes a later break visible.
  - **(A-1 / P-2)** Redis down or not configured → every "Add with AI" click
    answers 503 "busy". This is on purpose (no uncapped paid calls); the
    manual "Add Product" flow does not use Redis and keeps working.
  - **(A-1 / P-2)** A busy shop with several staff can reach 10 calls a minute
    together and see 429 sooner than with a per-session key.
  - `extractNames` move done wrong → product image upload in the editor stores
    no file names ("Upload returned no files").
  - The key in a URL or a log → the key leaks into Vercel logs / Sentry.

## Tests

Searched: `tests/app/api/seller/**`, `tests/app/api/image-search/`,
`tests/components/SellerDashboard/productEdit/**`,
`tests/app/sellerProfile/sellerDashboard/**`. Nothing covers an AI autofill
route, dialog or hand-off; the route folder, `aiPrefill.ts` and the dialog are
new units, so they get new files. `ProductEditor` and the dashboard page already
have test files, so those are extended.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|----|-------------------------|-------------|-----------|------------------|
| AC-1 | none — `listRefresh.test.tsx` renders the Products tab but never checks the add actions | extend | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | "shows Add with AI beside Add Product only to a user who may create products (AC-1)" |
| AC-2 | none — searched `tests/components/SellerDashboard/**` | new | `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` | "keeps Analyze disabled until a JPEG/PNG/WebP photo is picked, refuses other types, and closing changes nothing (AC-2)" |
| AC-3 | none | new | `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` | "uploads the photo, then asks the AI route, showing a disabled loading state until each answer (AC-3)" |
| AC-4 | none — searched `tests/app/api/seller/**` | new | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "refuses with 401 / 403 and never calls the AI when the session, the shop membership or the permission is missing; lets CREATE_PRODUCT and SUPER_ADMIN through (AC-4)" |
| AC-5 | none | new | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "answers 422 and never calls the AI for a missing image, a URL, a path, or a file the media host does not serve as an image (AC-5)" |
| AC-6 | none | new | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "answers 429 and never calls the AI when the shop is over 10 calls a minute (AC-6)"; **(A-1 / P-2)** "keys the limit on the shop only, so a renewed token does not reset it (AC-6)"; "answers 503 busy and never calls the AI when the limiter failed open (ttl 0) (AC-6)" |
| AC-7 | none | new | `tests/app/api/seller/products/ai-autofill/_autofill.test.ts` | "sends gemini-2.5-flash the inline photo, the brands, the three category levels and the instructions — and nothing else (AC-7)"; **(A-1 / P-1)** "turns thinking off with thinkingBudget 0 on every call (AC-7)" |
| AC-8 | none | new | `tests/app/api/seller/products/ai-autofill/_autofill.test.ts` | one case per FR-10 rule: "empties an unknown brand / category id", "empties both lower levels when no category is chosen", "empties a sub-category from another branch", "empties a sub-sub-category from another sub-category", "cuts the title to 255 characters", "returns blank text as empty" (AC-8); **(A-1 / P-3)** "builds the tree from the real staging answer (Step 0 fixture) with every child linked by path"; "links a child by order when its path finds no parent, and reports the counts to Sentry"; "drops a child neither rule links, and reports it to Sentry"; **(A-2)** "sorts items by path depth, not by the level field, and reports level/depth mismatches to Sentry" |
| AC-9 | none | new | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "answers 503 with the busy message when the AI is overloaded, and 500 'AI analysis failed' on any other AI or lookup failure, including the time limit (AC-9)" |
| AC-10 | none — searched `ProductEditor.test.tsx` (create-mode cases load an empty form only) | new + extend | `tests/components/SellerDashboard/productEdit/aiPrefill.test.ts`; `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` | aiPrefill: "maps the six fields and the photo onto an empty form, escaping the description into paragraphs (AC-10)"; ProductEditor: "opens the create form filled from the AI hand-off and keeps the category ids after the lower levels load (AC-10)" |
| AC-11 | none | extend | `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` | "shows the check-the-values message once and scrolls to the Name field after an AI fill (AC-11)" |
| AC-12 | none | new + extend | `tests/components/SellerDashboard/productEdit/aiPrefill.test.ts`; `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` | aiPrefill: "gives the hand-off only to its own shop, and nothing after it is cleared (AC-12)"; ProductEditor: "a second create mount after an AI fill opens the empty form (AC-12)" |
| AC-13 | none | new | `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` | "keeps the dialog open with the translated message for each failure (401, 403, 422, 429, 503, 500, upload failure) and lets the seller retry or close (AC-13)" |
| AC-14 | none | new | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "reads the session through the renewing fetch, so a renewed token gets a real answer, and a refused renewal ends as 401 (AC-14)" |
| AC-15 | none | new | `tests/app/api/seller/products/ai-autofill/_autofill.test.ts`; `tests/app/api/seller/products/ai-autofill/route.test.ts` | _autofill: "puts the key only in the x-goog-api-key header, never in the URL or body (AC-15)"; route: "never returns the key, and reports failures to Sentry without the key or the token (AC-15)". The client-bundle half needs no test: Next.js inlines only `NEXT_PUBLIC_*` variables into browser code, and the key is read only in the route folder; the `full` profile's build proves the route folder stays server-side. |
| AC-16 | none — a parity check, not a unit | none — the `i18n-parity` and `lint` checks of the `full` profile prove it | — | — |
| AC-17 | none | new + extend | `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx`; `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` | dialog: "never creates a product (AC-17)"; ProductEditor: "an AI-filled form creates nothing until the seller saves (AC-17)" |

Every assertion carries a message (CLAUDE.md "Testing"). Route tests start
with `// @vitest-environment node` and mock `serverRequests/HandleAuthedFetch`,
`serverRequests/radis`, `utils/serverErrorReporter` and global `fetch` (media +
Gemini); no test reaches a real backend or Gemini.

**(A-1)** No new test file and no new source file: every amended case sits
in a file this plan already declares. The AC-8 fixture from Step 0 lives inside
`_autofill.test.ts`.

## Validation strategy

- Validation profile: `full`
- Profile source: `pre-existing` (`.claude/project-config.yaml`). Checks:
  `lint`, `typecheck`, `unit-tests` (`pnpm test:run` = `vitest run --project
  unit`), `build`. `i18n-parity` is not in `full`; `/verify` also runs
  `pnpm lint:i18n-parity` for AC-16 (and `pnpm lint` already fails on a missing
  key).
- `full` because the change adds a server-only module next to client code
  (route folder, dialog, editor); only `build` catches a server import in a
  client bundle.
- Manual check after implement, against staging, at `/sy-en/...`: open the
  dashboard Products tab, "Add with AI", a real photo, check the filled form.
  Needs the new key in local `.env`.

## Rollback

- Revert the single commit. The route, dialog and hand-off are new files; the
  editor and dashboard edits are additive; the translation keys are additive.
- The env value: the old key already fails (HTTP 404 on 2026-10-19), so going
  back to it restores nothing useful. Leave the new key in place.

## Out of scope

- A "Fill with AI" button inside the form and its overwrite confirmation.
- The edit page, Excel import, mobile path, translation of the AI text.
- Fixing `/api/image-search` (retired `gemini-1.5-flash`) — separate ticket.
- A Redis cache for permissions or lookups (possible follow-up if the wait is
  too long).
- Analytics events.

## Research questions resolved here (PL-12)

| OQ | Answer |
|----|--------|
| OQ-2 | The browser uploads to the media server and sends the **bare file name**; the route builds `{NEXT_PUBLIC_BASE_MEDIA_URL}/product/<name>`, downloads it, and sends it inline. |
| OQ-3 | **Yes**, verified 2026-10-19: `GET {BASE_MEDIA_URL}/product/22538323-…381.jpg` → 200 `image/webp`; Gemini read it by link (200) and inline (200). The bare name without `/product/` answers 404. The route sends inline anyway (see Approach). |
| OQ-4 | Buttons beside both "Add Product" links; hand-off by a module-level one-shot store keyed by `sellerId`, peeked once into editor state and cleared on mount. |
| OQ-8 | A product-only access check in the route folder; the comments code is not changed. |
| OQ-11 | Plain `fetch` to the Gemini REST API; no new dependency. |
