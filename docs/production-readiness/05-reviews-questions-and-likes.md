# Reviews, questions and likes — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Reading, writing, editing, deleting, translating and liking all work in code, and a search error leaves a section out instead of breaking the product page. Before launch, the production index names must be set in the environment, and the review write path needs one green browser run.
**Checked:** branch `development`, working tree after commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
On the product page the shopper reads buyers' reviews ("Buyers Comment") and pre-purchase questions ("FAQ Buyer & Seller").
A signed-in, verified shopper can ask a question, edit or delete their own question or review, translate any of them, and like comments, seller answers and the product.
Reach: open any product (`/[lang]/products/[slug]`), scroll to the two strips, tap a strip header for the full sheet, or tap the comment icon or heart in the footer bar.
Writes go to the comments backend (`/public_comment/*`, token `USER_ID_HASH` + `COMMENTS-REFRESH-TOKEN`). Reads come from Elasticsearch (the comments index and three other indexes, named in `services/elastic/INDEXES.ts`).

Review writing from the order page belongs to the orders file. Seller answers belong to the seller file. They are only linked here.

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | Open a product → the "Buyers Comment" strip shows the 5 newest reviews (stars, masked name, date, variant). Deleted reviews are skipped. The strip is hidden when there are no reviews. | Elasticsearch comments index | `components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper.tsx`, `utils/pagesDataRequests/ProductPageData.ts` (`GetRatingCommentsForProduct`, `must_not status: deleted`) | `tests/components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper.test.tsx`, `tests/utils/pagesDataRequests/ProductPageData.test.ts`; e2e CMT-09 step "the review is in the product's Buyers Comment section" |
| W-2 | Tap "Load More" at the end of the review strip → the next 10 reviews are added (cursor = `search_after`). | Next route `GET /api/products/comments/buyers_comments` → Elasticsearch | `ProductBuyersCommentList.tsx` (`GetNextComments`), `app/api/products/comments/buyers_comments/route.ts` | `ProductBuyersCommentList.test.tsx`, `tests/app/api/products/comments/buyers_comments/route.test.ts` |
| W-3 | Each review shows its like heart, stars, and the "Good Quality", "True Size" and "Recommend It" badges. | Elasticsearch | `BuyerCommentItem.tsx`, `BuyerCommentRateInfo.tsx` | `BuyerCommentItem.test.tsx`, `BuyerCommentRateInfo.test.tsx` |
| W-4 | Under the review strip the shopper sees the "Recommend It" and "Don't Recommend It" percentages. | Elasticsearch aggregation | `serverRequests/product.tsx` (`GetRecommendationCountForProduct`), `BuyerCommentRateInfo.tsx` (`BuyersRatingBar`) | `BuyerCommentRateInfo.test.tsx`, `tests/serverRequests/product.test.ts` |
| W-5 | Tap the "Buyers Comment" header → a bottom sheet opens with all reviews, aspect filter chips (in the page language), "Load More", and "There is No Comments Yet.." when empty. A second tap on a chip clears the filter. | `GET /api/products/comments/buyers_comments?filter=` | `components/products/BuyersCommentModal.tsx`, `BuyersCommentTopBar.tsx` | `tests/components/products/BuyersCommentModal.test.tsx`, `BuyersCommentTopBar.test.tsx` |
| W-6 | Review owner → menu → "Edit" → change words, stars or photos → "Update Rating". The card changes only after the backend agrees, in every widget at once. Enter in the text box sends only when something changed, like the button. | Comments `PUT /public_comment/comments/{id}/update` | `RatingCommentOptions.tsx` (`handleInputKeyDown`, `isChanged`), `ProductBuyersCommentList.tsx` (`EditComment`), `store/comments/reducer.ts` (`patchCommentEntity`) | `RatingCommentOptions.test.tsx` "sends the edit when Enter is pressed, but not with an empty text", `ProductBuyersCommentList.test.tsx`, `tests/store/commentsReducer.test.ts`; e2e CMT-09 step "the shopper changes the words of their own review" |
| W-7 | Review owner → menu → "Delete" → confirm → the review disappears from the strip and the sheet. | Comments `DELETE /public_comment/comments/{id}/delete` | `ProductBuyersCommentList.tsx` (`deleteComment`), `store/comments/reducer.ts` (`removeCommentEntity`) | `ProductBuyersCommentList.test.tsx`; e2e CMT-09 steps "the shopper removes their own review", "the removal survives a reload" |
| W-8 | Open a product → the FAQ strip shows the 5 newest questions (comments with no order). Each shows the seller's answer, or "Waiting Seller Reply...". The "Q" and "A" letters follow the page language. | Elasticsearch comments index | `ProductFAQSection/ProductFaqSectionWrapper.tsx`, `FaqItemComponent.tsx`, `ProductPageData.ts` (`GetFQACommentsForProduct`) | `ProductFaqSectionWrapper.test.tsx`, `FaqItemComponent.test.tsx`; e2e CMT-05, CMT-06 |
| W-9 | "Load More" on the FAQ strip, and the FAQ bottom sheet (tap the header) with filters and paging. | `GET /api/products/comments/fqa_comments` | `FaqQuestionsList.tsx`, `FaqSectionModal.tsx`, `app/api/products/comments/fqa_comments/route.ts` | `FaqQuestionsList.test.tsx`, `FaqSectionModal.test.tsx`, `tests/app/api/products/comments/fqa_comments/route.test.ts` |
| W-10 | Signed-in verified shopper types in "Ask Seller Your Question…" (the box keeps the first 200 characters) → send → the question appears at the top of every FAQ widget, with the live colour and size as its variant. The footer count refreshes. | Comments `POST /public_comment/comments/create` | `FaqAskInput.tsx`, `store/comments/reducer.ts` (`appendFaqComment`) | `FaqAskInput.test.tsx`; e2e CMT-01 |
| W-11 | Footer comment icon → comment tab → type (the box keeps the first 200 characters) → Enter or send → the question appears at the top. | Comments `POST /public_comment/comments/create` | `components/products/CommentSection.tsx`, `components/products/CommentBar.tsx` | `tests/components/products/CommentBar.test.tsx` (incl. BUG-products-4, BUG-products-5), `CommentSection.test.tsx`; e2e CMT-01 |
| W-12 | A guest cannot ask. The FAQ input is read-only and says "Please log in first". The comment tab shows "Please Login so You Can Add a comment" and no input. A shopper with `need_auth` gets "Please Verify Your Phone Number". | none (blocked in the app) | `FaqAskInput.tsx`, `CommentSection.tsx`, `CommentBar.tsx` | `FaqAskInput.test.tsx`, `CommentSection.test.tsx` |
| W-13 | Question owner → "Edit" (shown only while the seller has not answered) → save → new text in every widget. | Comments `PUT /public_comment/comments/{id}/update` | `BuyersCommentMenu.tsx` (`isOwner && !comment.has_reply`), `FaqItemOptions.tsx`, `FaqQuestionsList.tsx` (`EditComment`) | `FaqItemOptions.test.tsx`, `FaqQuestionsList.test.tsx`; e2e CMT-02 |
| W-14 | Question owner → "Delete" → confirm → the question is hidden in every widget and the count refreshes. | Comments `DELETE /public_comment/comments/{id}/delete` | `FaqQuestionsList.tsx` (`deleteComment`) | `FaqQuestionsList.test.tsx`; e2e CMT-08 |
| W-15 | Any shopper → menu → "Translate" on a question or review → the text changes to the page language. "Show Original" puts it back. | Comments `POST /public_comment/comments/{id}/translate` (`translate_type: "comment"`) | `BuyersCommentMenu.tsx` (`handleTranslateComment`) | `BuyersCommentMenu.test.tsx`; e2e CMT-02 (`translateQuestion`) |
| W-16 | Translate a seller's answer, and show the original again. | Comments `POST …/translate` (`translate_type: "seller_reply"`) | `BuyersReplyMenu.tsx` | `BuyersReplyMenu.test.tsx` |
| W-17 | Signed-in shopper taps the heart on a question, a review or a seller answer → the heart fills and the count goes up at once in every widget. A second tap unlikes. | Comments `POST /public_comment/likes/like`, `DELETE /public_comment/likes/unlike` | `components/Server/product/LikeButtton.tsx`, `services/home.ts` (`LikeComment`, `UnLikeComment`) | `tests/components/Server/product/LikeButtton.test.tsx`, `tests/services/home.test.ts`; e2e CMT-02, CMT-05, CMT-07 |
| W-18 | A guest taps a comment heart → the login sheet opens with "Please Login First". Nothing is sent. | none | `LikeButtton.tsx` (`ReactOnComment`) | `LikeButtton.test.tsx` "asks a guest to sign in and changes nothing" |
| W-19 | Page load shows, per comment, the like count and whether this shopper liked it. Seller-answer likes are stored under `<id>-seller_reply`. | Elasticsearch comment reactions index | `ProductPageData.ts` (`GetFQACommentsForProductWithReactions`) | `tests/utils/pagesDataRequests/ProductPageData.test.ts` |
| W-20 | Shopper taps the product heart in the footer → like or unlike. The heart and count change only after the backend agrees. A refusal puts them back and shows "Failed to update like status. Please try again.". A GA `LIKE_ITEM` event is sent. A tap while a request runs does nothing. | Comments host `POST /products/like`, `DELETE /products/unlike` | `components/Server/product/ProductFooter.tsx/ProductLikeButton.tsx` | `ProductLikeButton.test.tsx`; e2e CMT-01 (like), CMT-08 (unlike) |
| W-21 | Page load shows the product like count and the shopper's own liked state. A product nobody has liked yet (no document in the index) shows 0 likes without a Sentry report. | Elasticsearch product interactions and user likes indexes | `serverRequests/product.tsx` (`GetSocialInfoForProduct`, `getProductInteractions`) | `tests/serverRequests/product.test.ts`, `ProductFooterWrapper.test.tsx` |
| W-22 | The footer comment icon shows the question count. The app reads it again 1.5 s after an ask or a delete. | Elasticsearch count | `ProductFooter.tsx/ProductCommentButton.tsx`, `serverRequests/product.tsx` (`GetProductCommentsCount`) | `ProductCommentButton.test.tsx` |
| W-23 | The comment tab lists questions with "Load More", and sends a GA `VIEW_COMMENTS` event on open. | `GET /api/products/comments/fqa_comments` | `CommentSection.tsx` | `CommentSection.test.tsx` |
| W-24 | The comments token is older than 60 s → a write answers 401 → the app exchanges the comments refresh token, waits 2 s, and retries once. | `/api/auth/refresh` → comments backend | `utils/fetchData.ts:376-390`, `utils/server/authRefresh.ts` (`COMMENTS_REFRESH_BACKEND`) | `tests/utils/fetchData.test.ts`, `tests/utils/server/authRefresh.test.ts`, `tests/app/api/auth/refresh/route.test.ts` |
| W-25 | A guest taps the product heart → the login sheet opens with "Please Login First". Nothing is sent. | none | `ProductLikeButton.tsx` (`onClick`, `auth.UserID()`) | none — see below |
| W-26 | Elasticsearch fails while reading the reviews, the FAQ or the recommendation bar → that section is left out, the error goes to Sentry, and the rest of the product page (with Add to cart) stays. | Elasticsearch | `ProductBuyersCommentsWrapper.tsx` (`try/catch`), `ProductFaqSectionWrapper.tsx` (`try/catch`), `serverRequests/product.tsx` (`GetRecommendationCountForProduct` answers zero stats) | `tests/serverRequests/product.test.ts` "answers zero recommendations, and reports it, when the recommendation count fails"; the two wrappers have no test — see below |
| W-27 | The comments backend refuses a like or unlike → the heart and the count go back in every widget, and the shopper sees "Failed to update like status. Please try again.". | Comments `likes/like`, `likes/unlike` | `services/home.ts` (`LikeComment` / `UnLikeComment` answer `true` only on `success`), `LikeButtton.tsx` (`ReactOnComment`) | `LikeButtton.test.tsx` "puts the old state back and reports it when the comments backend refuses", `tests/services/home.test.ts` |
| W-28 | The comments backend refuses a question, a question edit or a question delete → the shopper sees the backend's reason, or "Something went wrong". The text stays in the box. | Comments `comments/create`, `comments/{id}/update`, `comments/{id}/delete` | `FaqAskInput.tsx`, `CommentBar.tsx`, `FaqQuestionsList.tsx` (`EditComment`, `deleteComment`) | `FaqAskInput.test.tsx` "treats an answer with no id as refused", `CommentBar.test.tsx` "logs when the backend answers without a comment id" (both check the log and the kept text, not the message itself) |

## ⚠️ Works, with limits
- **L-1 — Reads lag writes.** Reads come from Elasticsearch, which gets comments writes seconds later. The app covers this with local state: a new question, an edit, a delete and a like are kept in `store/comments`. A reload a few seconds after a write can still show the old state. That is not a lost write. The footer count waits only 1.5 s (`ProductCommentButton.tsx:20`), so it can still read the old number.
- **L-2 — The footer "comments" count counts questions only.** `GetProductCommentsCount` leaves out everything with an `order_details_id`, so reviews are never counted (`serverRequests/product.tsx`).
- **L-3 — Public read routes trust a `user_id` from the query.** `buyers_comments` and `fqa_comments` answer `is_liked` and `isOwner` for any `user_id` sent. `isOwner` only shows the Edit/Delete menu, so the backend must still check the owner. All three routes send `Access-Control-Allow-Origin: *`. The data is public, so the risk is low.
- **L-4 — A failed page of reviews or questions shows "Something went wrong" and keeps the list.** `fetchBuyersComments`, `fetchFaqComments` and both bottom sheets throw when the route does not answer 2xx. The shopper can tap "Load More" again. No unit test drives this path; the fetch stand-ins all answer `ok: true`.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | Review photos are never shown on the product page. The owner can add or change photos in the edit sheet, but `BuyersCommentItem` renders no `comments_images_customer`. | Other shoppers never see review photos. | `components/Server/product/ProductBuyersComment/BuyerCommentItem.tsx` | Frontend / Product | No |
| M-2 | The Elasticsearch index names fall back to the staging names (`comments_develop`, `comments_reactions_develop`, `product_interactions_develop`, `user_product_likes_develop`) when the `ELASTIC_*_INDEX` environment values are not set. They are not set anywhere yet. | In production the page reads staging data, or nothing, until the values are set. | `services/elastic/INDEXES.ts`, `.env.example` (`ELASTIC_COMMENTS_INDEX`, `ELASTIC_COMMENTS_INTERACTIONS_INDEX`, `ELASTIC_PRODUCT_INTERACTIONS_INDEX`, `ELASTIC_USER_INTERACTIONS_INDEX`) | Ops | Yes — set the four values in the production environment. |
| M-3 | The only end-to-end proof of writing, changing and removing a review (CMT-09) goes red on and off. The cause is not pinned. | Nothing directly. The review write path has no stable proof. | `tests/e2e/orderRating.live.spec.ts:150` | Frontend (test) / Backend | Yes — get one green run, or a named backend fault, before launch. |

## 🔒 Must do before launch
- [ ] M-2: set `ELASTIC_COMMENTS_INDEX`, `ELASTIC_COMMENTS_INTERACTIONS_INDEX`, `ELASTIC_PRODUCT_INTERACTIONS_INDEX` and `ELASTIC_USER_INTERACTIONS_INDEX` in the production environment, to the production index names.
- [ ] M-3: get a green CMT-09 run, or name the backend that refuses.

## ❓ Needs confirmation from the backend team
- The product heart calls `/products/like` and `/products/unlike` on the comments host, not under `/public_comment/`. Do both paths exist in production? Does `DELETE` with a JSON body work through every proxy in front of the service?
- The create call sends `user_id`, `user_name`, `user_avatar` and `phone` in the body (`FaqAskInput.tsx`, `CommentBar.tsx`). Does the comments backend take the author from the token, or from the body? If from the body, a shopper can post under another name.
- Does the comments backend check that the caller owns the comment on update and delete? The app shows the menu from `isOwner`, which comes from a query parameter.
- What do `likes/like` and `likes/unlike` answer on a refusal, and on a repeat (liking twice)? Are they idempotent?
- What are the production Elasticsearch index names (M-2)?
- How many seconds does the comments index lag in production? The count refresh waits only 1.5 s.
- Which `target_language` values does `/translate` support? Is `ku` supported?

## 🧪 Tests that cover this section
**Unit (Vitest):**
- `tests/app/api/products/comments/buyers_comments/route.test.ts`, `fqa_comments/route.test.ts`, `order_rating/route.test.ts`
- `tests/components/Server/product/ProductBuyersComment/` — `BuyerCommentItem`, `BuyerCommentRateInfo`, `BuyersCommentMenu`, `BuyersCommentTopBar`, `BuyersReplyMenu`, `ProductBuyersCommentList`, `ProductBuyersCommentsWrapper`, `RatingCommentOptions`
- `tests/components/Server/product/ProductFAQSection/` — `FaqAskInput`, `FaqItemComponent`, `FaqItemOptions`, `FaqQuestionsList`, `FaqSectionModal`, `FaqSectionTopBar`, `ProductFaqSectionWrapper`
- `tests/components/Server/product/LikeButtton.test.tsx` (BUG-server-30 is a normal passing case)
- `tests/components/Server/product/ProductFooter.tsx/` — `ProductLikeButton`, `ProductCommentButton`, `ProductFooter`, `ProductFooterWrapper`
- `tests/components/products/` — `BuyersCommentModal`, `CommentBar` (BUG-products-4 and BUG-products-5 are normal passing cases), `CommentSection`, `CommentIcon`, `ExtendedAreaInfo`
- `tests/store/commentsReducer.test.ts`, `tests/services/home.test.ts`, `tests/utils/pagesDataRequests/ProductPageData.test.ts`, `tests/serverRequests/product.test.ts`, `tests/utils/fetchData.test.ts`, `tests/utils/server/authRefresh.test.ts`

**Browser (Playwright, staging):**
- `tests/e2e/comments.live.spec.ts` — CMT-01 to CMT-08, CMT-10, CMT-11 (ask, edit, translate, like, seller answer, unlike, delete, product like and unlike).
- `tests/e2e/orderRating.live.spec.ts` — CMT-09 (review written, shown, changed, removed). Red on and off. It has no `test.fail` marker.

There are no `it.fails` or `test.fail` markers in this section.

**Important cases with NO real test:**
- An Elasticsearch error inside the reviews wrapper or the FAQ wrapper (W-26). Only the recommendation count has a test for its failure.
- A failed page of reviews or questions (L-4). Every fetch stand-in answers `ok: true`.
- The error message after a refused question, edit or delete (W-28). The tests check the log and the kept text only.
- A guest tapping the product heart (W-25). The product heart test signs the shopper in.
- Review photos on the product page (M-1).
- Aspect filter chips in the two bottom sheets, in the browser suite.
- Translating a seller answer, in the browser suite.
