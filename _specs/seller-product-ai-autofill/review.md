---
ticket: seller-product-ai-autofill
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Review — seller-product-ai-autofill

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (FR-1..FR-15, NFR-1..NFR-6, AC-1..AC-17) and `plan.md` (Approach,
Steps 1–9, Files to change, Integration surface, Tests, Validation, Rollback),
with `research.md` as context. Structure checks passed: an Integration surface
is present (PL-11), every OQ-n is answered (PL-12), every AC-n has a Tests row
or a `none — <reason>` (PL-13), and each row records the coverage search and one
disposition, with `extend` on the existing `ProductEditor.test.tsx` and
`listRefresh.test.tsx` (PL-14).

## Plan Summary

A new web-only route `POST /api/seller/products/ai-autofill` checks the seller
against `/shop/auth/permissions` (`CREATE_PRODUCT | SUPER_ADMIN`), rate-limits,
downloads the photo from our media host by bare file name, loads brands
(`/shop/products/lookups`) and the three-level category tree
(`/shop/excel/categories`), makes one `gemini-2.5-flash` call with a JSON schema
through plain `fetch`, checks the answer (FR-10) and returns six fields. A
dashboard dialog uploads the photo, calls the route, stores the answer in a
one-shot in-memory hand-off and opens the create page; `ProductEditor` reads the
hand-off once and fills the form.

## Risks

- The category parent rule rests on a documented answer shape, not a live one
  (panel: senior, major).
- The cost cap is softer than "10 per minute" (panel: performance, major;
  security and senior agree).
- Gemini "thinking" can make calls slow and more expensive (panel: performance,
  major).
- Session loss if a renewed pair is dropped by an aborted request (panel:
  senior).

## Assumptions

- `GET /shop/excel/categories` returns every active category the form can use,
  and each child's `display_name` starts with its parent's exact `display_name`.
- The Vercel function time limit is above the route's worst-case wait.
- `{NEXT_PUBLIC_BASE_MEDIA_URL}/product/<name>` is where product uploads are
  read back (verified for existing products on 2026-10-19).

## Open Questions

- none beyond the panel findings below.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **This section is written before the comprehension gate runs (RP-4).**
> **Advisory only:** these inform the owner; they never block the decision (RP-2).

| # | Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|---|------|----------|---------|--------------------------|---------------------|
| P-1 | performance | **major** | `gemini-2.5-flash` has "thinking" on by default and the plan sets no thinking budget. Thinking tokens are billed as output and often add 5–20 s, which pushes against the 30 s time limit. Suggestion: set `generationConfig.thinkingConfig.thinkingBudget` to 0 or a small fixed value, and assert it in the AC-7 test. | plan Step 1 `buildGeminiRequest` / `callGemini`; NFR-3, NFR-6, AC-7 | **accept** — the owner agrees a thinking budget must be set and asserted. |
| P-2 | performance (+ security, senior) | **major** | The rate-limit key hashes `MARKET-TOKEN`, which rotates at every renewal, so each new token starts a fresh bucket and a caller can reset the limit by forcing a renewal. `fixedWindowRateLimit` also fails open when Redis is down (`serverRequests/radis/index.ts:130`), so an outage removes the cap on paid AI calls. Suggestion: key on `sellerId` (or `sellerId` + the user id from the permissions answer), add a per-shop cap, and fail closed for this paid route or rely on a Google-side quota. | plan Step 2; FR-7, AC-6, NFR-6 | **accept** — the owner agrees the token-based key and the fail-open cap are too weak for a paid route. |
| P-3 | senior | **major** | The category parent rule (match `display_name` paths) was never checked against a real `/shop/excel/categories` answer, and `services/sellerDashboard/index.ts:765` says the endpoint lists "categories that expose an excel template", maybe not every active category. If either guess is wrong, every sub-level is dropped as an orphan while fixture tests still pass, so AC-10 fails silently. Suggestion: fetch one real staging answer before implement, confirm both facts, write the result in the plan, and build the AC-8 fixture from it. | plan Step 1 `loadLists`; AC-8, AC-10; OQ-1 | **accept** — the owner agrees the tree rule must be checked against a real staging answer. |
| P-4 | security | minor | A POST with no cookies reaches `HandleAuthedFetch`, which on a 401 with no refresh cookie registers a new gateway guest (`serverRequests/HandleAuthedFetch.ts` guest path). Every anonymous POST would create a guest. Suggestion: answer 401 at once when there is no `MARKET-TOKEN` and no refresh cookie; add that case to AC-4. | plan Step 1 `assertProductCreateAccess`, Step 2 | |
| P-5 | security | minor | `loadImage` does not say how the 7 MB limit is applied or what happens on a redirect; a default `fetch` follows redirects to any host. Suggestion: `redirect: "error"`, stream and stop after 7 MB, refuse early on `content-length`, accept only jpeg/png/webp types. (performance raised the same memory point.) | plan Step 1 `loadImage`; FR-6, AC-5 | |
| P-6 | security | minor | `sellerId` from the body goes into the Redis key, the `X-Seller-ID` header and logs without a format check. Suggestion: accept only a positive integer before any other step. | plan Step 2, Step 1 `loadLists` | |
| P-7 | security | minor | `/api/image-search` reads the same `GEMINI_API_KEY` with no auth and no rate limit. Once its model is fixed, anonymous users can spend the new key. Suggestion: record this in the image-search ticket; give that route its own limit or key first. | plan Integration surface; OQ-10 | |
| P-8 | senior | minor | The dialog navigates with a bare `router.push`; the existing "Add Product" links also call `handleCardNavigate` (`page.tsx:353`), which sets `lastPathname` used by `useDashboardDetailBack`. Without it, Back from the create page loses the list/tab restore. | plan Steps 5–6; `useDashboardDetailBack.ts` | |
| P-9 | senior | minor | The success message + scroll can fire before the real form exists: `ProductEditor` shows `FormSkeleton` while `loading \|\| shopInfoPending`, and a message instead of the form when shop info is forbidden/unavailable. A ref-guarded effect could fire once on the skeleton and never again. | plan Step 7; AC-11 | |
| P-10 | senior | minor | "Closing aborts the request" can lose a renewed session: if the route renewed the pair, the new pair is only in its final `Set-Cookie`; an aborted fetch drops it after the old refresh token is spent. Suggestion: do not abort on close; ignore the late answer (all the spec asks). | plan Step 5; spec Edge Cases; AC-14 | |
| P-11 | senior | minor | A server helper for the same permission read already exists: `GetSellerShops` in `serverRequests/settings/index.ts` (uses `HandleAuthedFetch`, returns `shops` + `conclusive`). Reusing it avoids a new 40-line check. | plan Approach (OQ-8), Step 1 | |
| P-12 | senior | minor | The AC-14 route test mocks `HandleAuthedFetch`, so it proves only that the route uses the renewing fetch, not that a renewed token gets a real answer. Suggestion: name the test for what it proves; keep the permission call strictly before `loadLists`. | plan Tests AC-14 | |
| P-13 | senior | minor | No function duration is set in the repo (`vercel.json` empty, no `maxDuration`). If the project's limit is shorter than the route's worst case, the dialog gets a non-JSON 504. Suggestion: confirm the limit, add `export const maxDuration` if needed, treat non-JSON as "AI analysis failed". | plan Steps 1–2; NFR-3, AC-9 | |
| P-14 | performance | minor | The total wait is not bounded as one number: permissions (+ renewal), image (10 s), lists, Gemini (30 s) run one after another — worst case about 70–85 s. Suggestion: run `loadImage` and `loadLists` in parallel and add one overall deadline (for example 40 s). | plan Steps 1–2; NFR-3, AC-9 | |
| P-15 | performance | minor | Every click fetches the full `/shop/products/lookups` (only `brands` used) and the full category tree; `/shop/products/lookups` once hung 7 min 42 s (`tests/e2e/harness/sellerDashboard.ts:162`). Suggestion: accept for v1, or cache the two built lists per shop for about 5 minutes. | plan Step 1 `loadLists`; NFR-6 | |
| P-16 | performance | minor | The image goes first in the prompt, so Gemini's implicit prefix cache cannot reuse the long fixed text. Suggestion: instructions and lists first, image last; measure the token count for a real shop. | plan Step 1 `buildGeminiRequest`; AC-7 | |
| P-17 | performance | minor | The blob URL made for the preview is never revoked; each AI use leaks one image-sized blob until the tab closes. | plan Steps 5, 7 | |
| P-18 | performance | info | The dialog is mounted for every seller who can create products. Option: load it with `next/dynamic` and a matching skeleton on first open. | plan Step 6 | |
| P-19 | senior | info | Gemini 429 maps to "busy"; a 429 can also mean the quota is used up, so sellers would see "busy" every time. Make sure Sentry carries the upstream status. | plan Step 1 `callGemini`; FR-15, AC-9 | |
| P-20 | senior / security | info | The Integration surface leaves out the media server (`/api/ticket`, `/gated/upload/bulk`, server read of `/product/<name>`); an abandoned AI fill leaves an orphan upload, as an abandoned manual upload does. | plan Integration surface | |
| P-21 | security | info | Positive notes: the key only in the `x-goog-api-key` header; `.env*` git-ignored; cookies `SameSite=Strict`; prompt injection bounded by schema + id checks + HTML-escaping (keep a `<script>` / `<img onerror>` test); `LogServerError` payload should be asserted exactly in the AC-15 test. If the old key was ever shared, revoke it. | plan Steps 1, 4, 9; AC-8, AC-10, AC-15 | |

## Decision

`APPROVED`

- Rationale: chosen by the owner at the gate on 2026-10-19 after a passing
  comprehension check (3/3, degraded — see `comprehension.md`). The owner
  accepted all three `major` findings (P-1, P-2, P-3).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — 2026-10-19

## ADR reference

- ADR: none

## Required Follow-up Actions

- **Accepted findings are not yet in `plan.md`.** P-1 (thinking budget), P-2
  (rate-limit key + fail-open cap) and P-3 (check the real
  `/shop/excel/categories` answer) were accepted, but the approved `plan.md`
  does not contain them. `/implement` may only apply what `plan.md` declares
  (IM-4), and a gate never edits the plan (RV-11). The owner must choose how
  they land before or during implement: a plan revision, or a follow-up
  ticket. Until then, implementing them would be undeclared scope.
  - **Update 2026-10-19:** the owner chose a plan amendment without moving the
    ticket. The fixes are now in `plan.md > Post-review amendment A-1`. The
    comprehension gate did **not** examine A-1.
- Minor findings P-4..P-17 and info P-18..P-21 are recorded for the owner; none
  is dispositioned as required.
- Record P-7 (unauthenticated `/api/image-search` shares `GEMINI_API_KEY`) in
  the separate image-search ticket.
- Owner, by hand: set `GEMINI_API_KEY` in Vercel (Preview + Production).
