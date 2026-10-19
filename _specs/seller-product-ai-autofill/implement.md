---
ticket: seller-product-ai-autofill
stage: implement
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Implement — seller-product-ai-autofill

> Record of what was actually built, following `plan.md` (with the owner's
> post-review amendments A-1 and A-2).

Branch: `ticket/seller-product-ai-autofill`, cut from a clean `development` at
`06ac7d30` (project profile: base branch is `development`).

## Evidence — Step 0 (A-1 / P-3, A-2)

The owner supplied a real staging `GET /shop/excel/categories` answer
(`_specs/seller-product-ai-autofill/json.txt`, 471 items). Analysed by script:

| Check | Result |
|---|---|
| (a) child `display_name` = parent path + ` -> ` + name | **405 / 405** children have their exact parent path in the list. No duplicate paths, no duplicate ids, no ` -> ` inside a name. Max depth 2. |
| (b) tree order | **405 / 405** children come after their parent. |
| (c) top categories also in the form's `parent_categories` | **Not checked on data.** The owner chose not to wait for the `/shop/products/lookups` answer ("depend on the code"). The route keeps only depth-0 items that are also in `parent_categories` at run time, so a missing form category can never be suggested. |
| (d) counts | By path depth: 66 / 91 / 314. **By the `level` field: 368 / 62 / 41.** |

**Finding:** the `level` field is wrong for **302 of 471** items (273 two
levels deep and 29 one level deep say `level: 0`). That is a core backend data
fault against its own contract (`docs/shop-excel-template-mode.md`). It led to
plan amendment **A-2** (owner-directed): level = path depth. The backend team
should fix `level`; the route reports `levelMismatch` to Sentry meanwhile.

Stop rule from Step 0: (a) and (b) are both true, so implement continued.

## Changes made

- `app/api/seller/products/ai-autofill/_autofill.ts` — **new.** Access check
  (`/shop/auth/permissions`, `CREATE_PRODUCT | SUPER_ADMIN`, 401 at once with
  no market cookie), `parseImageName`, `loadImage` (`/product/<name>` on
  `NEXT_PUBLIC_BASE_MEDIA_URL`, 10 s, `redirect: "error"`, `image/*`, ≤ 7 MB),
  `buildCategoryLists` (path depth, parent by path then by order, Sentry counts
  incl. `levelMismatch`), `loadLists` (lookups + Excel categories with
  `X-Seller-ID` and `lang: en`, in parallel), `buildGeminiRequest` (inline
  photo, instructions + four lists, six-field schema, `thinkingBudget: 0`),
  `callGemini` (key in `x-goog-api-key`, 30 s, 503/429 → busy), and
  `checkSuggestion` (every FR-10 rule). Message keys live here.
- `app/api/seller/products/ai-autofill/route.ts` — **new.** `POST`: shop id
  format → access → per-shop rate limit `seller:ai:rl:<sellerId>` 10/60 s
  (`ttl === 0` → 503 fail closed) → image → lists → AI → checked answer.
  Failures go to `LogServerError` with scenario, reason and shop id only.
  `Cache-Control: no-store`.
- `components/SellerDashboard/productEdit/aiPrefill.ts` — **new.** One-shot
  hand-off (`setAiPrefill` / `peekAiPrefill` / `clearAiPrefill`, keyed by shop)
  and `applyAiSuggestion` / `descriptionToHtml` (escaped, one `<p>` per
  paragraph).
- `components/SellerDashboard/productEdit/AiAutofillDialog.tsx` — **new.**
  Photo picker (JPEG / PNG / WebP), upload through `bulkUploadImages(..., "product")`
  + `extractNames`, call to the route, translated error messages, hand-off and
  navigation to `…/products/new`.
- `components/SellerDashboard/productEdit/helpers.ts` — receives the exported
  `extractNames` (moved unchanged from `ProductEditor.tsx`).
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — imports
  `extractNames` from helpers; create mode peeks the hand-off once into state,
  clears it on mount, fills the form with `applyAiSuggestion` (`initial` stays
  empty); once the real form is on screen, one success message and a scroll to
  `[data-field="name"]`.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` —
  "Add with AI" button beside "Add Product" (header) and beside "Add your first
  product" (empty state), same `CREATE_PRODUCT` gate; one dialog mount.
- `public/translations/translations.{ar,tr,ku}.js` — 13 new keys each (see
  Deviations for the one key not in the plan's list).
- Local only, git-ignored, not in any commit: `GEMINI_API_KEY` set to the new
  key in `.env`, `.env.development`, `.env.preview`, `.env.production`.

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9). The single publishable commit is
> created later by `/publish-pr`.

- `app/api/seller/products/ai-autofill/route.ts` (new)
- `app/api/seller/products/ai-autofill/_autofill.ts` (new)
- `components/SellerDashboard/productEdit/aiPrefill.ts` (new)
- `components/SellerDashboard/productEdit/AiAutofillDialog.tsx` (new)
- `components/SellerDashboard/productEdit/helpers.ts`
- `components/SellerDashboard/productEdit/ProductEditor.tsx`
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx`
- `public/translations/translations.ar.js`, `.tr.js`, `.ku.js`
- `tests/app/api/seller/products/ai-autofill/route.test.ts` (new)
- `tests/app/api/seller/products/ai-autofill/_autofill.test.ts` (new)
- `tests/components/SellerDashboard/productEdit/aiPrefill.test.ts` (new)
- `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` (new)
- `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx`
- `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx`

## Deviations from plan

All inside files `plan.md > Files to change` already lists:

1. **Closing the dialog does not abort the request** (plan Step 5 said it
   would). Reason: panel finding P-10 — if the route renewed the market
   session, the new pair is only in its answer's `Set-Cookie`; aborting drops
   it after the old refresh token was spent. A late answer is ignored, which is
   all the spec's edge case asks.
2. **The dialog calls the dashboard's `handleCardNavigate` before it
   navigates** (new optional `onNavigate` prop). Reason: panel finding P-8 —
   the two "Add Product" links do the same, and `useDashboardDetailBack` needs
   it for Back to return to the right tab.
3. **No market cookie → 401 before any backend call.** Reason: panel finding
   P-4 — `HandleAuthedFetch` would otherwise register a new guest for an
   anonymous caller. Still AC-4's 401.
4. **The shop id must be 1–12 digits, else 403** before any other step.
   Reason: panel finding P-6 — it goes into a Redis key, a header and logs.
5. **`loadImage` uses `redirect: "error"`** and refuses a too-large
   `content-length` early. Reason: panel finding P-5 (FR-6 "only our media
   host").
6. **Success message waits for the real form** (`formShown`: not the skeleton,
   not a gate message). Reason: panel finding P-9.
7. **The preview blob URL is revoked** when the photo changes or the dialog
   closes without a hand-off. Reason: panel finding P-17.
8. **One extra translation key, "Product photo"** — the `alt` text of the
   preview image (CLAUDE.md: every `alt` is translated). Added to all three
   files.
9. **`AccessResult` is one plain object** (`{ ok, status }`) instead of a union:
   the repo compiles without strict null checks, so the union did not narrow.
10. **AC-14 test name** says what the test can prove ("uses the renewing
    core-backend fetch for every core call, and a refused renewal ends as
    401"), per panel finding P-12. A unit test mocks `HandleAuthedFetch`, so it
    cannot prove a real renewal.
11. **AC-2 test** uses `fireEvent.change` on the hidden input (the picker is a
    styled button over a hidden `<input type=file>`).

## Tests written

| AC | Test file | Test case | Disposition carried out |
|----|-----------|-----------|-------------------------|
| AC-1 | `tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` | "shows Add with AI beside Add Product only to a user who may create products (AC-1)" (+ "opens the Add with AI dialog from the button") | extend |
| AC-2 | `tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx` | "keeps Analyze disabled until a JPEG/PNG/WebP photo is picked, refuses other types, and closing changes nothing (AC-2)" | new |
| AC-3 | same | "uploads the photo, then asks the AI route, showing a disabled loading state until each answer (AC-3)" (+ "enables Analyze again after a failure") | new |
| AC-4 | `tests/app/api/seller/products/ai-autofill/route.test.ts` | "refuses with 401 / 403 and never calls the AI when the session, the shop membership or the permission is missing; lets CREATE_PRODUCT and SUPER_ADMIN through (AC-4)" | new |
| AC-5 | same | "answers 422 and never calls the AI for {no image, a URL, a path, another type} (AC-5)"; "answers 422 … for a file the media host does not serve as an image (AC-5)" | new |
| AC-6 | same | "answers 429 … over 10 calls a minute (AC-6)"; "keys the limit on the shop only, so a renewed token does not reset it (AC-6)"; "answers 503 busy … when the limiter failed open (ttl 0) (AC-6)" | new |
| AC-7 | `tests/app/api/seller/products/ai-autofill/_autofill.test.ts` | "sends gemini-2.5-flash the inline photo, the brands, the three category levels and the instructions — and nothing else (AC-7)"; "turns thinking off with thinkingBudget 0 on every call (AC-7)" | new |
| AC-8 | same | "keeps a fully valid answer", "empties an unknown brand / category id", "empties both lower levels when no category is chosen", "empties a sub-category from another branch", "empties a sub-sub-category from another sub-category", "cuts the title to 255 characters", "returns blank text as empty"; tree: "builds the tree from the real staging answer (Step 0 fixture) with every child linked by path", "sorts items by path depth, not by the level field, and reports level/depth mismatches to Sentry", "links a child by order …", "drops a child neither rule links …" | new |
| AC-9 | `route.test.ts` | "answers 503 with the busy message when the AI is overloaded, and 500 'AI analysis failed' on any other AI or lookup failure, including the time limit (AC-9)" | new |
| AC-10 | `tests/components/SellerDashboard/productEdit/aiPrefill.test.ts`; `tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx` | "maps the six fields and the photo onto an empty form, escaping the description into paragraphs (AC-10)"; "opens the create form filled from the AI hand-off and keeps the category ids after the lower levels load (AC-10)" | new + extend |
| AC-11 | `ProductEditor.test.tsx` | "shows the check-the-values message once and scrolls to the Name field after an AI fill (AC-11)" | extend |
| AC-12 | `aiPrefill.test.ts`; `ProductEditor.test.tsx` | "gives the hand-off only to its own shop, and nothing after it is cleared (AC-12)"; "a second create mount after an AI fill opens the empty form (AC-12)" | new + extend |
| AC-13 | `AiAutofillDialog.test.tsx` | "keeps the dialog open with the translated message for a {401,403,422,429,503,500,504} (AC-13)"; "shows the upload failure and never calls the AI when the photo upload fails (AC-13)" | new |
| AC-14 | `route.test.ts` | "uses the renewing core-backend fetch for every core call, and a refused renewal ends as 401 (AC-14)" | new |
| AC-15 | `_autofill.test.ts`; `route.test.ts` | "puts the key only in the x-goog-api-key header, never in the URL or body (AC-15)"; "never returns the key, and reports failures to Sentry without the key or the token (AC-15)" | new |
| AC-16 | — | `none` — proven by the `i18n-parity` and `lint` checks | none |
| AC-17 | `AiAutofillDialog.test.tsx`; `ProductEditor.test.tsx` | "never creates a product (AC-17)"; "an AI-filled form creates nothing until the seller saves (AC-17)" | new + extend |

Extra cases inside declared files: "never lets markup from the AI render as
markup" (`aiPrefill.test.ts`, panel P-21), "leaves every field the AI left
empty empty", "ignores an answer that arrives after the dialog was closed",
"keeps only top categories the product form also offers", "reports nothing
when the tree is clean", "reads the six fields out of the model's JSON
answer", "treats an AI 503/429 as busy", "treats any other AI failure … as
failed".

## Findings — confirmed bugs, out of scope

| BUG | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Ticket |
|-----|------------------------|---------------------------------------|---------------------|--------|
| BUG-1 | Every `LogServerError` call copies the raw `MARKET-TOKEN`, `CHAT-TOKEN`, `STORIES-TOKEN`, `WALLET-TOKEN` and `USER_ID_HASH` cookies into its payload and POSTs it to the gateway's `/mobile_error_log/store` (`utils/server/mobileErrorLog.ts`). Sentry itself does not get them (`ReportError` sends an allow-list of extras). So this route's failure reports — like every other server report in the app — put live tokens into the gateway's error log. | **None written.** The confirming test belongs in a test file for `utils/serverErrorReporter.ts`, which `plan.md` does not declare; writing it here would be undeclared scope (IM-4). Confirmed by reading the code: `utils/serverErrorReporter.ts` lines 24–80 build `Error_Object` with the tokens and pass it to `storeErrorServer` → `postServerErrorLog`; `utils/errorSerialization.ts` has no token redaction. | `utils/serverErrorReporter.ts` (`LogServerError`, `Error_Object`) | _(opened by the owner)_ |
| BUG-2 | Core backend: `GET /shop/excel/categories` returns `level: 0` for 302 of 471 categories that are one or two levels deep (staging, 2026-10-19). Breaks its own contract. | Not a repository bug — a backend fault. Covered on our side by `_autofill.test.ts::"sorts items by path depth, not by the level field, and reports level/depth mismatches to Sentry"`. | Core backend, Excel controller `getCategories` | _(backend team)_ |

## Validation run during implementation

- Live check (outside the repo, `%TEMP%` script, the route's own
  `_autofill.ts` bundled with stand-ins for its three server-only imports, real
  471-item tree, real Gemini, real media host):
  - tree: 66 top / 91 sub / 314 sub-sub, 405 linked by path, 0 by order, 0
    dropped, `levelMismatch: 302` reported;
  - photo `22538323-….jpg` (58 KB webp) → Gemini 200 in 9.1 s with
    `thinkingBudget: 0` and a ~20 000-character prompt → checked answer
    `women → Women's Pajamas → women's Summer Pajamas` (valid, consistent);
  - a direct Node `fetch` from this machine gets Gemini **400 "User location
    is not supported"**; `curl` passes because it uses the machine's
    `HTTPS_PROXY`. Region rule from the guide; Vercel runs from a supported
    region. Through the proxy, one later call timed out at 30 s and ended as
    `AiFailedError` (→ 500 "AI analysis failed"), as designed.
- `pnpm exec vitest run --project unit` on the six declared test files — all
  pass (route 13 + helpers 20, dialog 13, aiPrefill 4, ProductEditor 68,
  listRefresh 78).
- `pnpm lint:i18n-parity` — ✓ 2599 keys present in all three files.
- `node_modules/.bin/tsc --noEmit` — exit 0, after moving a stale generated
  `.next/dev/types` (it referenced `app/(client)/[lang]/products/temp/page.js`,
  deleted on `development` in `2a48e1de`) to `.next/dev/types.stale-2026-10-19`.
- `pnpm lint` on the changed files — 0 errors. Repo-wide `pnpm lint` exits 1 on
  **2 errors in files this branch does not touch**:
  `components/Chat/components/TaggedMessages.tsx:142` ("Search a tag") and
  `components/Chat/components/messages/MessageTagPicker.tsx:88` ("New tag") —
  translation keys missing, from `development` commit `1163efd1`.
- `pnpm test:run` (full unit suite) — exit 0: **659 files passed, 7629 tests
  passed, 3 expected fail** (the existing `it.fails` BUG markers).
- `pnpm build` — exit 0, compiled in 75 s; `ƒ /api/seller/products/ai-autofill`
  is listed as a dynamic route. The prerender `fetch()` log lines in the output
  come from `/[lang]/settings/*` pages, which this branch does not touch.
