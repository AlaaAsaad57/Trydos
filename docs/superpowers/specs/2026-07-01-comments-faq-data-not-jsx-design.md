# Comments / Reviews / FAQ / Stories — data-not-JSX refactor

**Date:** 2026-07-01
**Branch:** `ticket/listing-refactor` (continue in the same branch)
**Status:** Design approved — pending spec review → implementation plan

## Goal

Extend the listing refactor (server actions return **data**, not JSX; components
map data → components) to the product-page **comments / reviews / ratings / FAQ**
flow — plus **product stories**, which share the same anti-pattern in the same
file. Every `"use server"` action that currently returns rendered React elements
is replaced by a data-returning function, and rendering moves into (client)
components. Along the way, fix the bugs the JSX flow caused so translate / edit /
delete / load-more behave like a professional site.

**Hard rule:** no fetch/action in this flow may return JSX. This includes
**initial render, load-more, edit re-fetch, create re-fetch, modals, and the
extended comments area.** All return data; components render.

## Non-goals

- No test files (repo has no test suite; type-check + `pnpm build` + `pnpm lint`
  are the safety net, per project policy).
- Seller-dashboard reply CRUD (`services/sellerDashboard/*`,
  `services/elastic/sellerComments.ts`) is a separate surface — untouched.
- No visual redesign; markup/classes preserved. This is a data-flow refactor.

## Current state (the problem)

Two parallel layers run near-identical Elasticsearch queries with opposite
return shapes:

- **JSX layer (to retire)** — `serverRequests/product.tsx` (`"use server"`):
  `GetProductBuyersComment`, `GetProductFaqQuestions`, `UpdateBuyerComment`,
  `GetFaqItemElement`, `GetProductStories` return rendered
  `<BuyersCommentItem>` / `<FaqItemComponent>` / story `<div>`/`<svg>` JSX.
- **Data layer (to keep + extend)** — `utils/pagesDataRequests/ProductPageData.ts`:
  `GetRatingCommentsForProduct`, `GetFQACommentsForProduct` (+ private data
  helpers) already return plain objects and already back the API routes.

Consequences of returning JSX (the smells to fix):

1. **Translate mutates the DOM** — `BuyersCommentMenu` / `BuyersReplyMenu` do
   `document.querySelector('#comment-<id>-text').innerText = ...` because the
   body is opaque server JSX handed down as `children`.
2. **Edit/delete key by `node.key`** — client lists store `ReactNode[]` and
   mutate by matching `node.key === option.id`; brittle element-identity coupling.
3. **`setTimeout(2000)` hacks** paper over ES indexing lag before re-fetching a
   freshly-rendered node (edit, create).
4. **Delete mutates local state even on failure** — no `res.success` guard.
5. **Hardcoded endpoints** — the 6 comment-backend URLs are string literals at
   call sites, not in `utils/endpointConfig.tsx`.
6. **Duplicate list state** — modals keep a parallel `commentsData` copy synced
   to the list by hand.
7. **Misspelled store setter** `setShouldUpdateComeentsCount`.
8. **Dead loading state** — `BuyersCommentMenu` edit button reads a `loading`
   never set in that component.

## Target architecture

```
Page (SSR)
  └─ Wrapper (server): await Get…ForProduct() → data[]
       └─ <List comments={data[]} offset>            (client)
            └─ data.map(c => <Item comment={c}/>)     (client, SSR'd first paint)
```

Single data source = `ProductPageData.ts`. Server wrappers await data and pass a
**data array** to the client list. The list renders items, owns array state, and
does load-more / edit / delete / create as **data** operations. Items are client
components that own their own translate state (no DOM mutation). Client
components still server-render on first paint, so SEO/SSR of the first page is
preserved (same as the new `ProductCard`).

## Work items

### A. Data layer (single source; retire JSX actions)

- Retire from `serverRequests/product.tsx`: `GetProductBuyersComment`,
  `GetProductFaqQuestions`, `UpdateBuyerComment`, `GetFaqItemElement`,
  `GetProductStories`.
- **Enrich** `GetRatingCommentsForProduct` / `GetFQACommentsForProduct` to emit
  the fields the JSX layer computed but the data twins currently omit:
  `isOwner`, `ownerId`, `ownerType` (derive `isOwner` by comparing the doc owner
  against the current user). Confirm parity for every field the components read:
  `customer{id,name,image}`, `comment`, `variant`, `created_at`, `star_rating`,
  `recommendation`, `total_likes`, `is_liked`, `has_reply`, `seller_reply`,
  `seller_name`, `reply_created_at`, `reply_total_likes`, `reply_is_liked`,
  `product_id`, `comments_images_customer`, `good_quality_comment`.
- Add **single-item** data functions (`GetRatingCommentItem` /
  `GetFaqCommentItem`) that return one enriched item — replacing the JSX
  wrappers used after edit/create. The private data helpers already build the
  object; expose data.
- Add `GetProductStoriesData` returning story data (title, media, border kind…);
  a small `<StoryItem>` renders the border SVG client-side.

### B. Load-more / pagination → data via API routes

- Client load-more calls the **existing** GET route handlers
  `/api/products/comments/buyers_comments` and `/api/products/comments/fqa_comments`
  via `fetchData` — they already return `{ …_comments, total, filters_key, offset }`.
  This removes per-scroll `"use server"` RSC round-trips and is cacheable
  (the "performance + server load" win). **Never returns JSX.**
- Stories client load-more (`components/products/ProductStories.tsx`) calls a
  data source (route handler or `GetProductStoriesData`) — data, not JSX.

### C. Item components → client, state-based translate

- `BuyerCommentItem.tsx` (`BuyersCommentItem`) and
  `ProductFAQSection/FaqItemComponent.tsx` become `"use client"`, take a
  `comment` data object, and hold `const [displayText, setDisplayText]
  = useState(comment.comment)` (+ a reply variant for FAQ).
- `BuyersCommentMenu` / `BuyersReplyMenu` translate handlers call the passed
  setter instead of `document.querySelector(...).innerText`. **All DOM mutation
  removed.** "Show Original" flips state back.
- Children already client (`LikeButton`, `BuyerCommentRateInfo`, menus). Verify
  `utils/server` helpers used (`formatTime`, `convertTextToXFormat`,
  `GetImageUrl`, `translateFunction`) stay client-safe (confirmed during the
  ProductCard work).

### D. Lists → data arrays

- `ProductBuyersCommentList` / `FaqQuestionsList` take `comments: data[]`
  instead of `children`; map to items; **key by `comment.id`**.
- Load-more appends data (section B).
- **Edit**: on `res.success`, optimistically patch the matching item from the
  submitted fields (text/rating) — **removes `setTimeout(2000)`**. (Optional
  single-item refetch via `GetRatingCommentItem` for server truth.)
- **Delete**: filter by `comment.id` **only after `res.success`**.
- Keep the store `shouldUpdateComment` cross-component signal, but drive
  siblings from data rather than a full JSX re-fetch.

### E. Widgets that also consume JSX actions (all → data)

- `components/products/BuyersCommentModal.tsx` — modal load-more/filter: data.
- `components/Server/product/ProductFAQSection/FaqSectionModal.tsx` — modal
  load-more: data.
- `components/products/CommentSection.tsx` — **extended comments area**: data.
- `components/Server/product/ProductFAQSection/FaqAskInput.tsx` &
  `components/products/CommentBar.tsx` — **create** flow: after POST create,
  prepend the returned **data** item (via `GetFaqCommentItem`), not a JSX node;
  drop the `setTimeout` hack. De-duplicate the modal's parallel list copy so
  list + modal read one source.

### F. Cleanup (fix depth = all)

- Centralize the 6 comment-backend endpoints in `utils/endpointConfig.tsx`:
  `create`, `<id>/update`, `<id>/delete`, `<id>/translate`, `likes/like`,
  `likes/unlike`.
- Rename store setter `setShouldUpdateComeentsCount` →
  `setShouldUpdateCommentsCount` (slice + all call sites).
- Wire or remove the dead `loading` "Updating…" state in `BuyersCommentMenu`.

## Complete call-site inventory (files to touch)

Data / config:
- `serverRequests/product.tsx` (retire 5 JSX actions)
- `utils/pagesDataRequests/ProductPageData.ts` (enrich + single-item + stories data)
- `utils/endpointConfig.tsx` (new comment endpoint constants)
- store comments slice (setter rename)

Buyers/reviews:
- `components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper.tsx`
- `components/Server/product/ProductBuyersComment/ProductBuyersCommentList.tsx`
- `components/Server/product/ProductBuyersComment/BuyerCommentItem.tsx`
- `components/Server/product/ProductBuyersComment/BuyersCommentMenu.tsx`
- `components/products/BuyersCommentModal.tsx`

FAQ:
- `components/Server/product/ProductFAQSection/ProductFaqSectionWrapper.tsx`
- `components/Server/product/ProductFAQSection/FaqQuestionsList.tsx`
- `components/Server/product/ProductFAQSection/FaqItemComponent.tsx`
- `components/Server/product/ProductFAQSection/BuyersReplyMenu.tsx`
- `components/Server/product/ProductFAQSection/FaqSectionModal.tsx`
- `components/Server/product/ProductFAQSection/FaqAskInput.tsx`
- `components/products/CommentBar.tsx`
- `components/products/CommentSection.tsx`

Stories:
- `components/Server/product/ProductStoriesWrapper.tsx`
- `components/products/ProductStories.tsx`

## Commit stages (each builds + type-checks before commit; same branch)

1. **Infra, no behavior change** — endpoint constants + store setter rename.
2. **Data layer** — enrich data fns (ownership/variant parity) + single-item
   fns + `GetProductStoriesData` (JSX actions still present, unused-by-new-code).
3. **Item components** → client + state-based translate (menus updated).
4. **Wrappers** map data → items (buyers + FAQ + stories SSR).
5. **Lists** → data arrays: load-more via API, optimistic edit, guarded delete.
6. **Widgets** — modals + extended `CommentSection` + create inputs + stories
   client load-more → data.
7. **Retire** the 5 dead JSX actions; final cleanup + parity sweep.

## Verification (per stage)

- `pnpm build` (type-check) and `pnpm lint` must pass before each commit.
- Manual field-parity check: the data layer emits every field the components
  read (ownership, variant, star_rating, recommendation, reply/likes, images).
- Manual behavior check of the four operations: translate (state toggle, no
  DOM), edit (optimistic, no `setTimeout`), delete (only on success), load-more
  (appends data, no JSX).

## Risks & mitigations

- **Field parity** old JSX layer vs data layer — the main regression risk;
  stage 2 handles it explicitly and stage 7 re-sweeps.
- **Client-component SSR** — first page still server-rendered (SEO safe); mirror
  the `ProductCard` precedent.
- **Ownership derivation** — `isOwner` must match the old logic exactly, or
  edit/delete menu entries appear/disappear incorrectly.
- **Cursor pagination** — `offset` is a JSON-stringified ES `search_after`;
  preserve the encode/decode contract across page/modal/API paths.
