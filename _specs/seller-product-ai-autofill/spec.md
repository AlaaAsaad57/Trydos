---
ticket: seller-product-ai-autofill
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Spec — seller-product-ai-autofill

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Add a product with AI from a photo (seller dashboard).

## Business Goal

Adding a product by hand takes many fields. Most sellers start from a photo.
If the AI fills the name, the description, the brand and the categories from
that photo, the seller only checks and corrects them. So new products are added
faster, and with fewer wrong categories.

## User Story

> As a seller with the right to create products, I want to upload a product
> photo and get the new-product form filled in for me, so that I add the product
> faster and only correct what is wrong.

## Functional Requirements

- **FR-1 — Entry point.** The Products section of the seller dashboard shows an
  **"Add with AI"** button wherever it shows the "Add Product" action (the list
  header and the empty state). The button is shown only to a user who may create
  products in that shop (`CREATE_PRODUCT` or `SUPER_ADMIN`).
- **FR-2 — Photo step.** The button opens a dialog. The seller picks **one**
  photo (JPEG, PNG or WebP). The analyse action stays disabled until a photo is
  picked. The seller can close the dialog at any time before the result arrives;
  closing changes nothing.
- **FR-3 — Upload and analyse.** The photo is uploaded to **our media server**
  (the same place product images go). Then the app asks the internal AI route
  to analyse it. While this runs, the dialog shows a loading state and its action
  is disabled. The action is enabled again when the call ends, with success or
  failure.
- **FR-4 — Access control on the route.** The internal AI route answers only a
  signed-in user who is a member of the shop named in the request **and** holds
  `CREATE_PRODUCT` or `SUPER_ADMIN` in that shop, as the core backend reports it.
  The shop id sent by the browser is never trusted on its own. This is the same
  check the seller comments flow uses. A caller who fails the check gets no AI
  call.
- **FR-5 — Session renewal.** A seller whose 60-second access token has expired
  still gets a real answer: the route renews the session the same way other
  server calls in this app do, instead of refusing the seller.
- **FR-6 — Image check.** The route accepts only an image stored on our media
  server. No image, or an image from any other host, is refused before any AI
  call.
- **FR-7 — Rate limit.** Each shop + session may call the AI route at most
  **10 times per minute**. A call over the limit is refused before any AI call.
- **FR-8 — What the AI receives.** The route sends the AI model
  (`gemini-2.5-flash`, structured output) only:
  1. the photo;
  2. the shop's **brand list** (id + name) from the product lookups;
  3. the **category tree in three levels** (id + full path, for example
     `Clothes -> Men -> Shirts`) from the categories-with-levels lookup the Excel
     section already uses;
  4. the instructions from the guide: a short marketable title (≤ 100
     characters), a short factual description (2–4 sentences), always English,
     only what is visible, no invented sizes / materials / prices, brand and
     categories only from the lists, consistent levels, empty instead of a
     guess.
  It sends **no** user data, seller data, prices, stock or other product data.
- **FR-9 — What the AI returns.** Six fields, each one may be empty: `title`,
  `description`, `brand_id`, `category_id`, `sub_category_id`,
  `sub_sub_category_id`.
- **FR-10 — The route checks the answer** before it returns it:
  - a brand or category id that is not in the lists sent → emptied;
  - no category → sub-category and sub-sub-category emptied too;
  - a sub-category that is not under the chosen category → emptied;
  - a sub-sub-category that is not under the chosen sub-category → emptied;
  - the title cut to 255 characters;
  - empty or blank text → empty.
- **FR-11 — Filling the form.** On success the app opens the normal
  new-product form with:
  - the title in **Name**;
  - the description in **Description**, shown as plain paragraph text (no markup
    from the AI is ever rendered as markup);
  - the brand selected in **Brand**;
  - each category level selected as a **single** choice in its group, with the
    lower levels' options loaded and the chosen values still selected after they
    load;
  - the uploaded photo as the **first image** of the product.
  An empty field from the AI leaves that form field empty.
- **FR-12 — After filling.** The form shows a success message that asks the
  seller to check the values, and scrolls to the Name field.
- **FR-13 — One use only.** The AI values fill **one** form opening. Opening
  "Add Product" by hand afterwards, or reloading the new-product page, shows the
  normal empty form.
- **FR-14 — Nothing is saved by the AI.** The product is created only when the
  seller saves the form, through the existing save flow and its existing checks.
- **FR-15 — Failures.** The dialog stays open and shows a message the seller can
  act on. The seller can try again or close the dialog:

  | Situation | Route answer | Seller sees |
  |---|---|---|
  | Not signed in / not allowed for this shop | 401 / 403 | "You do not have permission for this action." |
  | No image, or image not on our media server | 422 | "The image must be uploaded to the media server" |
  | Over the rate limit | 429 | "Too many requests. Please try again in a moment." |
  | AI service overloaded | 503 | "The AI service is busy right now. Please try again in a moment." |
  | Any other AI or lookup failure | 500 | "AI analysis failed" |
  | Photo upload to the media server failed | — | the existing "Image upload failed" message |

## Non-Functional Requirements

- **NFR-1 — Secret handling.** The AI key lives only in the server environment
  variable `GEMINI_API_KEY`. It never reaches the browser bundle, a response
  body, a header, a log line or Sentry.
- **NFR-2 — No stack names to the browser.** Text and headers that reach the
  browser do not name the AI provider's internals or any backend technology
  (CLAUDE.md "Stack-agnostic naming"). Seller-facing text says "AI".
- **NFR-3 — Bounded wait.** The route gives up on the AI call after a fixed
  time limit and answers "AI analysis failed" instead of hanging the dialog.
- **NFR-4 — Translations.** Every new seller-visible string exists in `en`
  (the key) and in `ar`, `tr`, `ku`.
- **NFR-5 — Errors are reported.** A failed AI or lookup call is reported to
  Sentry with a scenario name and the status, never with the key, the token or
  the image bytes.
- **NFR-6 — Cost.** One AI click makes at most one AI call. Lookup data that is
  the same for every click may be cached for a short time per shop.

## Constraints

- No change to the protected runtime paths (`proxy.ts`, `next.config.ts`,
  `instrumentation*`, `sentry.*`, `.github/workflows/**`).
- Web dashboard only: the route uses the HttpOnly session cookie. No mobile
  bearer-token path, no CORS (owner decision, OQ-13).
- The existing "Add Product" flow, the edit flow, drafts and the save payload
  keep working exactly as before when the AI is not used.
- The key value is set by hand in the local `.env*` files and in Vercel; it is
  never committed.
- Output text is English only (guide §5).

## Edge Cases

- The AI returns **all six fields empty** (for example a photo with no clear
  product): the form still opens with the photo as first image and empty
  fields; the success message still asks the seller to check.
- The AI returns a sub-category id that exists but under **another** category:
  it is emptied (FR-10), and so is its sub-sub-category if that one depends on it.
- The chosen category has **no sub-categories**: the lower levels stay empty.
- The lower-level options fail to load in the form: the form's existing
  behaviour applies (it keeps the selection and does not prune on a failed load).
- The seller **closes the dialog** while the analysis runs: the late answer does
  not open the form.
- The seller presses "Add with AI" **twice** quickly: only one analysis runs at a
  time from the dialog.
- The access token expired before the click: the route renews and answers
  (FR-5); a renewal the backend refuses ends as 401.
- The shop's brand list or category tree is **empty**: the AI gets empty lists,
  so those fields come back empty (FR-10); title and description still work.
- A very large photo: the upload limits of the media server apply; the AI route
  itself never receives the raw file from the browser.
- Text printed on the photo that tries to give the AI instructions: the answer
  is still limited to the six fields, and every id is checked (FR-10).

## Research Questions Resolved

| OQ | Answer | Lands in |
|----|--------|----------|
| OQ-1 | Use the **categories-with-levels lookup the Excel section already uses** (`GET /shop/excel/categories`): one call returns every active category with `level` 0/1/2 and the full path in `display_name`. Brands come from the product lookups. So one AI call gets all lists, as the guide does. How parent/child is derived from that answer is the plan's job. (Owner pointed to it on 2026-10-19.) | FR-8, FR-10, AC-7, AC-8 |
| OQ-2 | The browser uploads the photo to our media server first (same upload the editor uses), then sends the stored image reference to the route. The route accepts only our media server. Whether the route passes a link to the AI or downloads the bytes and sends them inline is **deferred to the plan** (depends on OQ-3). | FR-3, FR-6, AC-3, AC-5; Open Questions |
| OQ-3 | **Deferred to the plan.** The plan must check whether the AI can read a real stored image from our media host, and choose OQ-2's transport from that result. | Open Questions |
| OQ-4 | The button sits next to "Add Product" in the Products list header and in the empty state, with the same permission. The hand-off mechanism is **deferred to the plan**; its required behaviour is fixed here: it must reach the form after navigation and be used once only. | FR-1, FR-11, FR-13, AC-1, AC-10, AC-12; Open Questions |
| OQ-5 | **Yes** — the uploaded photo becomes the product's first image (owner decision). | FR-11, AC-10 |
| OQ-6 | Each level is filled with **one** id (a single selection), or left empty. | FR-11, AC-10 |
| OQ-7 | The description is shown as plain paragraph text; anything in it that looks like markup is shown as text, never rendered. | FR-11, AC-10 |
| OQ-8 | Gate: `CREATE_PRODUCT` or `SUPER_ADMIN`, checked against the core backend's shop permissions, same model as seller comments. Whether the comments helpers are shared or a small product-only gate is written is **deferred to the plan**. | FR-4, AC-4; Open Questions |
| OQ-9 | 10 calls per minute per shop + session. | FR-7, AC-6 |
| OQ-10 | Put the new key in the **existing `GEMINI_API_KEY`** (local `.env*` files and Vercel). The shopper image search keeps using the same variable; its retired model is a separate ticket (owner decision). | NFR-1, Constraints, Out of Scope |
| OQ-11 | **Deferred to the plan** (which client to use for the AI call). | Open Questions |
| OQ-12 | English always. | FR-8, Constraints |
| OQ-13 | **Web dashboard only** (owner decision). | Constraints, FR-4 |
| OQ-14 | Send the raw English `name` (and the full path for categories), not the translated names. | FR-8, AC-7 |
| OQ-15 | **Out of scope.** The only entry is the new button, so the form is always empty when filled; no overwrite confirmation is needed. | Out of Scope |

## Open Questions

- **OQ-2 / OQ-3** (deferred) — how the photo reaches the AI: a link to our
  media host, or bytes sent inline by the route. The plan checks a real stored
  image first.
- **OQ-4** (deferred) — the mechanism that hands the AI values to the form.
- **OQ-8** (deferred) — share the comments access helpers, or write a
  product-only gate.
- **OQ-11** (deferred) — which client the route uses for the AI call.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|----|----------------------|---------------------|
| AC-1 | "Add with AI" appears next to "Add Product" in the Products header and in the empty state when the user has `CREATE_PRODUCT` or `SUPER_ADMIN`, and is absent when the user has neither. | FR-1 |
| AC-2 | The button opens a dialog where the analyse action is disabled until one JPEG/PNG/WebP photo is picked; closing the dialog changes nothing. | FR-2 |
| AC-3 | After a photo is picked and analyse is pressed, the photo is uploaded to the media server and then sent to the AI route; during both steps the dialog shows a loading state with its action disabled, and the action is enabled again after success and after failure. | FR-3 |
| AC-4 | The route answers 401/403 and makes no AI call when the caller has no session, is not a member of the requested shop, or has neither `CREATE_PRODUCT` nor `SUPER_ADMIN` there; a member with one of those permissions passes. | FR-4 |
| AC-5 | The route answers 422 and makes no AI call when the image is missing or is not on our media server. | FR-6 |
| AC-6 | For one shop + session, the 11th call within 60 seconds is answered 429 with no AI call. | FR-7 |
| AC-7 | The AI request uses `gemini-2.5-flash` with a six-field structured output, and contains only the photo, the brand list (id + English name), the three-level category list (id + full path) and the guide's instructions — no user, seller, price or stock data. | FR-8, FR-9 |
| AC-8 | The route's answer obeys every FR-10 rule: unknown ids emptied; no category empties both lower levels; a mismatched sub-category is emptied; a mismatched sub-sub-category is emptied; title cut to 255 characters; blank text returned empty. | FR-10 |
| AC-9 | An AI "overloaded" failure gives 503 with the busy message; any other AI or lookup failure, including the time limit, gives 500 "AI analysis failed". | FR-15, NFR-3 |
| AC-10 | On success the new-product form opens with Name, Description (as plain paragraph text), Brand, one id per category level (still selected after the lower levels load), and the uploaded photo as the first image; empty AI fields stay empty. | FR-11 |
| AC-11 | After the form is filled, a success message asks the seller to check the values and the page scrolls to the Name field. | FR-12 |
| AC-12 | After one AI fill, opening "Add Product" by hand or reloading the new-product page shows the normal empty form. | FR-13 |
| AC-13 | On each failure in the FR-15 table the dialog stays open, shows that row's message, and lets the seller retry or close. | FR-15 |
| AC-14 | A seller whose access token has expired gets a real answer from the route after one session renewal; a refused renewal ends as 401. | FR-5 |
| AC-15 | The key is read only from the server variable `GEMINI_API_KEY`; it is absent from the client bundle, every route response and every log/Sentry payload; and no browser-facing text or header names a backend technology. | NFR-1, NFR-2, NFR-5 |
| AC-16 | Every new seller-visible string exists in `ar`, `tr` and `ku` translations, and `pnpm lint:i18n-parity` passes. | NFR-4 |
| AC-17 | No product is created by the AI flow itself; the product is created only by the existing save action of the form. | FR-14 |

## Out of Scope

- A "Fill with AI" button **inside** the product form, and its overwrite
  confirmation (guide Step 2.2).
- The edit page, bulk / Excel import and other product screens (guide §2).
- A mobile-app path (bearer token, CORS) for the AI route.
- Translating the AI text into ar / tr / ku.
- Attributes (descriptors), colours, sizes, prices, stock, tags and every field
  other than name, description, brand, categories and the first image.
- Fixing the shopper image search (`/api/image-search`: retired model). Separate
  ticket.
- New analytics events.
