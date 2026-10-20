---
ticket: seller-product-ai-autofill
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Verify — seller-product-ai-autofill

> Final validation and impact review before the ticket is closed. Branch
> `ticket/seller-product-ai-autofill`, uncommitted working tree, 2026-10-19.

## Checks performed

- Validation profile: `full` (`.claude/project-config.yaml`, pre-existing) —
  checks `lint`, `typecheck`, `unit-tests`, `build`. Plus `i18n-parity` for
  AC-16 (named in `plan.md > Validation strategy`).

### Profile checks

| Check | Command (resolved) | Exit | Output summary | Result |
|-------|--------------------|------|----------------|--------|
| lint | `pnpm lint` | **1** | `✖ 82 problems (2 errors, 80 warnings)`. Both errors are `local/translate-key-exists` in `components/Chat/components/TaggedMessages.tsx:142` ("Search a tag") and `components/Chat/components/messages/MessageTagPicker.tsx:88` ("New tag"). Both keys are missing from ar/tr/ku **on `development`** (checked with `git show development:public/translations/…`); this branch does not touch `components/Chat` (`git diff development --stat -- components/Chat` is empty). The changed files lint with 0 errors. | fails only outside `plan.md > Files to change` → finding BUG-3 |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | 0 | no errors (stale `.next/dev/types` had been moved aside during implement, see `implement.md`) | pass |
| unit-tests | `pnpm test:run` (= `vitest run --project unit`) | 0 | `Test Files 659 passed (659)`, `Tests 7629 passed \| 3 expected fail (7632)` | pass |
| build | `pnpm build` | 0 | `✓ Compiled successfully`; route table lists `ƒ /api/seller/products/ai-autofill` | pass |
| i18n-parity | `pnpm lint:i18n-parity` | 0 | `✓ i18n parity OK — 2599 keys present in all three files.` | pass |

### Declared tests, per AC (VF-11)

All run in one command: `pnpm exec vitest run --project unit --reporter=verbose
tests/app/api/seller/products/ai-autofill tests/components/SellerDashboard/productEdit/aiPrefill.test.ts
tests/components/SellerDashboard/productEdit/AiAutofillDialog.test.tsx
tests/components/SellerDashboard/productEdit/ProductEditor.test.tsx
tests/app/sellerProfile/sellerDashboard/listRefresh.test.tsx` → **exit 0, 6 files,
196 tests passed**. The same cases also ran inside the full suite above.

| AC ID | Check / test case | Exit | Output summary | Result |
|-------|-------------------|------|----------------|--------|
| AC-1 | `listRefresh.test.tsx` › "shows Add with AI beside Add Product only to a user who may create products (AC-1)"; "opens the Add with AI dialog from the button" | 0 | ✓ | met |
| AC-2 | `AiAutofillDialog.test.tsx` › "keeps Analyze disabled until a JPEG/PNG/WebP photo is picked, refuses other types, and closing changes nothing (AC-2)" | 0 | ✓ | met |
| AC-3 | `AiAutofillDialog.test.tsx` › "uploads the photo, then asks the AI route, showing a disabled loading state until each answer (AC-3)"; "enables Analyze again after a failure" | 0 | ✓ | met |
| AC-4 | `route.test.ts` › "refuses with 401 / 403 and never calls the AI when the session, the shop membership or the permission is missing; lets CREATE_PRODUCT and SUPER_ADMIN through (AC-4)" | 0 | ✓ | met |
| AC-5 | `route.test.ts` › "answers 422 and never calls the AI for {no image, a URL, a path, another type} (AC-5)"; "… for a file the media host does not serve as an image (AC-5)" | 0 | ✓ ×5 | met |
| AC-6 | `route.test.ts` › "answers 429 … over 10 calls a minute (AC-6)"; "keys the limit on the shop only, so a renewed token does not reset it (AC-6)"; "answers 503 busy … when the limiter failed open (ttl 0) (AC-6)" | 0 | ✓ ×3 | met |
| AC-7 | `_autofill.test.ts` › "sends gemini-2.5-flash the inline photo, the brands, the three category levels and the instructions — and nothing else (AC-7)"; "turns thinking off with thinkingBudget 0 on every call (AC-7)" | 0 | ✓ ×2 | met |
| AC-8 | `_autofill.test.ts` › the seven FR-10 cases + the four tree cases (real Step 0 fixture, path depth vs `level`, order link, drop) | 0 | ✓ ×11 | met |
| AC-9 | `route.test.ts` › "answers 503 with the busy message when the AI is overloaded, and 500 'AI analysis failed' on any other AI or lookup failure, including the time limit (AC-9)" | 0 | ✓ | met |
| AC-10 | `aiPrefill.test.ts` › "maps the six fields and the photo onto an empty form, escaping the description into paragraphs (AC-10)"; `ProductEditor.test.tsx` › "opens the create form filled from the AI hand-off and keeps the category ids after the lower levels load (AC-10)" | 0 | ✓ ×2 | met |
| AC-11 | `ProductEditor.test.tsx` › "shows the check-the-values message once and scrolls to the Name field after an AI fill (AC-11)" | 0 | ✓ | met |
| AC-12 | `aiPrefill.test.ts` › "gives the hand-off only to its own shop, and nothing after it is cleared (AC-12)"; `ProductEditor.test.tsx` › "a second create mount after an AI fill opens the empty form (AC-12)" | 0 | ✓ ×2 | met |
| AC-13 | `AiAutofillDialog.test.tsx` › "keeps the dialog open with the translated message for a {401, 403, 422, 429, 503, 500, 504} (AC-13)"; "shows the upload failure and never calls the AI when the photo upload fails (AC-13)" | 0 | ✓ ×8 | met |
| AC-14 | `route.test.ts` › "uses the renewing core-backend fetch for every core call, and a refused renewal ends as 401 (AC-14)" | 0 | ✓ — proves the route reads only through `HandleAuthedFetch` (which owns the renewal) and maps a refused one to 401; a real renewal against the backend is not exercised by a unit test (panel P-12) | met, at that depth |
| AC-15 | `_autofill.test.ts` › "puts the key only in the x-goog-api-key header, never in the URL or body (AC-15)"; `route.test.ts` › "never returns the key, and reports failures to Sentry without the key or the token (AC-15)"; client bundle: `build` exit 0, key read only in the route folder, no `NEXT_PUBLIC_` name | 0 | ✓ ×2 | met for this route — but see BUG-1: the shared reporter itself adds tokens to the gateway error log |
| AC-16 | `none` — `i18n-parity` exit 0; changed files lint with 0 errors | 0 | 13 new keys in all three files | met |
| AC-17 | `AiAutofillDialog.test.tsx` › "never creates a product (AC-17)"; `ProductEditor.test.tsx` › "an AI-filled form creates nothing until the seller saves (AC-17)" | 0 | ✓ ×2 | met |

## Commands run

- `pnpm lint` → exit 1 (2 errors, both in `components/Chat/**`, pre-existing)
- `pnpm lint:i18n-parity` → exit 0
- `node_modules/.bin/tsc --noEmit --pretty false` → exit 0
- `pnpm test:run` → exit 0 (659 files, 7629 passed, 3 expected fail)
- `pnpm build` → exit 0
- declared-tests command above → exit 0 (6 files, 196 passed)
- `git show development:public/translations/translations.{ar,tr,ku}.js | grep` for "Search a tag" / "New tag" → missing in all three on `development`

## Integration surface — did it hold?

| Declared item | Held? | Evidence |
|---|---|---|
| `GEMINI_API_KEY` shared with `/api/image-search` | yes | `tests/app/api/image-search/route.test.ts` passes in the full suite; the route's code is untouched. It still uses the retired `gemini-1.5-flash` (separate ticket). |
| `ProductEditor` create path shared with manual "Add Product" | yes | all 64 pre-existing `ProductEditor.test.tsx` cases pass; AC-12 proves the hand-off is not reused. |
| `extractNames` moved to `helpers.ts` | yes | the editor's image / meta-image upload cases in `ProductEditor.test.tsx › uploads` pass. |
| Excel tab reads `/shop/excel/categories` too | yes | read-only use; `ExcelUploadTab` untouched, its tests pass. |
| Market session shared via `HandleAuthedFetch` | yes | the route calls it for every core read (AC-14 test). |
| Redis `seller:ai:rl:` per shop; route fails closed | yes | AC-6 tests; the shared limiter is unchanged, so comments and OTP keep failing open. |
| Sentry scenarios `seller-ai-autofill: …` | yes | `_autofill.test.ts` tree cases and the AC-15 route case assert the payloads. |
| Translation files lockstep | yes | `i18n-parity` exit 0. |

Not exercised here: a browser run against staging with a signed-in seller (no
seller session on this machine). The live check in `implement.md` ran the
route's own helpers against real Gemini, the real media host and the real
category tree.

## Findings — confirmed bugs, out of scope

| BUG | Scenario that is wrong | Confirming test (file::case + marker) | Where the bug lives | Expected vs actual | Ticket |
|-----|------------------------|---------------------------------------|---------------------|--------------------|--------|
| BUG-1 | Every `LogServerError` report copies the raw `MARKET-TOKEN`, `CHAT-TOKEN`, `STORIES-TOKEN`, `WALLET-TOKEN` and `USER_ID_HASH` cookies into the payload POSTed to the gateway's `/mobile_error_log/store`. | None — the test belongs to `utils/serverErrorReporter.ts`, outside the plan's files (IM-4). Confirmed by reading `utils/serverErrorReporter.ts` (`Error_Object`), `utils/server/mobileErrorLog.ts`, `utils/errorSerialization.ts` (no redaction). | `utils/serverErrorReporter.ts` | Expected: no session token leaves in an error report. Actual: all five go to the gateway error log (Sentry drops them through `ReportError`'s allow-list). | _(to open)_ |
| BUG-2 | Core backend `GET /shop/excel/categories` returns `level: 0` for 302 of 471 categories that are one or two levels deep (staging, 2026-10-19). | Not a repository bug. Our side is covered by `_autofill.test.ts › "sorts items by path depth, not by the level field, and reports level/depth mismatches to Sentry"`. | Core backend, Excel controller `getCategories` | Expected: `level` = depth (0/1/2) per `docs/shop-excel-template-mode.md`. Actual: 0 for 302 deeper items. | _(backend team)_ |
| BUG-3 | `pnpm lint` fails on `development`: i18n keys "Search a tag" and "New tag" are used in Chat components but missing from ar/tr/ku. | `pnpm lint` (`local/translate-key-exists`) → exit 1 on `components/Chat/components/TaggedMessages.tsx:142` and `components/Chat/components/messages/MessageTagPicker.tsx:88`. | `components/Chat/**` + translation files (from commit `1163efd1`) | Expected: lint exit 0. Actual: 2 errors, independent of this branch. | _(to open)_ |

All three lie outside `plan.md > Files to change` (BUG-3's fix would touch the
translation files, but the wrong behaviour — the missing keys for Chat — is not
part of this ticket's change), so they do not fail this stage (VF-12).

## Observability & runtime impact review

- Were any `observability/` runtime configs changed by this ticket? **no**
  (`features.observability: false`; no protected runtime path touched — no
  `proxy.ts`, `next.config.ts`, `instrumentation*`, `sentry.*`,
  `.github/workflows/**` in the diff).
- Runtime impact: one new dynamic route; new outbound calls to Gemini and the
  media host from that route only; new Sentry scenarios
  `seller-ai-autofill: category tree` and `seller-ai-autofill: analysis failed`.
- Owner actions outside the repo: set `GEMINI_API_KEY` in Vercel (Preview +
  Production); optional daily quota on the key in Google Cloud.

## Notes on the governance trail

- Plan amendments A-1 (P-1, P-2, P-3) and A-2 (`level` field) were added after
  the review gate, by the owner's decision, without moving the ticket. The
  review gate did not examine them; this verify gate asked about A-1 (rate
  limit) and A-2 (Step 0 finding).
- 11 implementation deviations are listed in `implement.md`; all stay inside
  the declared files.

## Sign-off

- Outcome: **verified** — every `AC-n` is met by a declared test that ran with
  exit 0; the only failing profile check (`lint`) fails on pre-existing errors
  outside this ticket's files (BUG-3).
- Final ticket state: completed
- Sign-off: developer (owner) — 2026-10-19, comprehension gate 4/4 (degraded,
  see `comprehension.md`)
- Commit: none created at verify (VF-10 / ADR-008)
- Notes: `json.txt` (raw staging category answer) is still in this folder;
  the owner should decide before `/wf:publish-pr` whether it ships with the
  ticket.
