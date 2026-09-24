---
ticket: e2e-product-comments-and-reactions
stage: research
mode: standard
status: complete
owner: ai_agent
updated: 2026-09-21
links:
  clickup:
  github:
---

# Research — e2e-product-comments-and-reactions

> Read-only phase. **No implementation is allowed in this command.**

No source file was changed. No protected runtime path was opened for writing.

## Goal

Find out what a browser journey over product comments, replies and reactions
has to drive, and what is missing before it can be written.

## What the feature actually is

The request calls them "FAQ comments". In the code they are **FAQ questions**:
one shopper question, and at most **one** seller answer attached to the same
Elasticsearch document. There is no reply thread and no reply per shopper.

| Request step | What the code calls it |
|---|---|
| "make product like" | `ProductLikeButton` -> `POST /products/like` on the **comments** backend |
| "fqa comment" | `CREATE_COMMENT_URL` = `POST /public_comment/comments/create` |
| "reply" | the seller answer stored on the same document (`seller_reply`, `has_reply`) |
| "like a comment" | `LikeButton` with `target_type: "comment"` |
| "like a reply" | the **same** button with `target_type: "seller_reply"` |

### The two places that post a question

Both post the same FAQ question through the same endpoint. They are different
components in different parts of the page.

1. **In the page** — `components/Server/product/ProductFAQSection/`.
   `ProductFaqSectionWrapper` renders a sideways strip of questions
   (`FaqQuestionsList`) with `AskInput` (`FaqAskInput.tsx`) under it. Always on
   the product page (`components/Product/ProductPageContent.tsx:210`).
2. **The extended area in the footer** — the Comment button in the product
   footer (`ProductCommentButton`, `data-pw="CommentIcon"`) opens
   `ExtendedAreaInfo` -> `components/products/CommentSection.tsx`
   (`data-pw="ExtendCoomentSection"`), which lists the same questions and posts
   through `components/products/CommentBar.tsx` (`data-pw="CommentField"`,
   `data-pw="SubmitComment"`).

There is a **third** place: the bottom sheet opened by the FAQ heading
(`FaqSectionTopBar` -> `FaqSectionModal`). It lists, and can edit or delete, but
it has **no ask input**. The request's "two places" are 1 and 2.

### What each place offers per question

`FaqItemComponent` draws every question in all three places. Its three-dot menu
is `BuyersCommentMenu`:

- **Translate** — always offered, to anyone. `POST
  /public_comment/comments/<id>/translate` with `translate_type: "comment"`.
  Pressing it again reads "Show Original" and restores the text locally with no
  second call.
- **Edit** — only when `isOwner && !comment.has_reply`
  (`components/Server/product/ProductBuyersComment/BuyersCommentMenu.tsx:120`).
- **Delete** — whenever `isOwner`.

The seller answer has its own menu, `BuyersReplyMenu`, which offers **translate
only** (`translate_type: "seller_reply"`).

**The edit rule decides the order of the journey.** Once the seller answers, the
shopper can no longer edit. The requested order already edits before the seller
replies, so it works — but that is a constraint, not a coincidence.

## Relevant directories

- `components/Server/product/ProductFAQSection/` — the in-page FAQ strip, the
  bottom sheet, the ask input, and the edit/delete confirm (`FaqItemOptions`).
- `components/Server/product/ProductBuyersComment/` — `BuyersCommentMenu` and
  `BuyersReplyMenu`, shared with the FAQ item.
- `components/Server/product/LikeButtton.tsx` — the heart on a question and on a
  seller answer. The file name really is spelled with three letter t.
- `components/Server/product/ProductFooter.tsx/` — the footer: `ProductLikeButton`
  (the product heart) and `ProductCommentButton` (opens the extended area).
- `components/products/` — `CommentSection.tsx`, `CommentBar.tsx`,
  `ExtendedAreaInfo.tsx`.
- `components/SellerDashboard/CommentsTab.tsx` — the seller list, the reply
  form, edit reply, delete reply.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` — the
  product grid, its per-product social counts, and its pagination.
- `services/elastic/sellerComments.ts` — the guarded server actions the
  dashboard writes through.
- `tests/e2e/` — the browser suite: `actions/`, `harness/`, `selectors.ts`,
  `laneConfig.ts`.

## Relevant config files

- `playwright.config.ts` — `retries: 0`, `workers: 1`, `timeout: 120_000`, the
  `live` and `scripted` projects plus the `setup` project, and `data-pw` as the
  test id attribute.
- `tests/e2e/laneConfig.ts` — the two lanes. **A spec in neither lane stops the
  command**, so a new file must be added to a list here in the same change.
- `tests/e2e/harness/guard.ts` — the staging allow-list. Nothing new is needed.
- `utils/endpointConfig.tsx:24-33` — every comment endpoint, in one block.
- `services/sellerDashboard/commentPermissions.ts` — `READ_COMMENTS`,
  `REPLY_COMMENT`, `EDIT_REPLY`, `DELETE_REPLY`.

## Possibly affected services

- **The comments backend** (`fetchData({ server: "comments" })` through
  `/api/proxy`) — create, update, delete, translate, like and unlike, for both
  the product and a question. It has its own token pair (`USER_ID_HASH`,
  `COMMENTS_REFRESH_TOKEN`), so a failure here is *not* a core-backend failure
  and must not be reported as one.
- **Elasticsearch** — every **read**. The product page, the extended area and
  the bottom sheet all read `/api/products/comments/fqa_comments`, which calls
  `GetFQACommentsForProduct` against the comments index. The seller dashboard
  reads and **writes** the same index directly through the server actions in
  `services/elastic/sellerComments.ts`.
- **The core backend** — only for shop ownership and permissions
  (`GET /shop/auth/permissions`), before any dashboard read or write.

### The write/read split, which is the whole risk

| Action | Written by | Read back from |
|---|---|---|
| product like / unlike | comments backend | `product_interactions_index` |
| question create / edit / delete | comments backend | `comments_index` |
| question like / unlike | comments backend | `comments_interactions_index` |
| seller reply | **Elasticsearch directly**, `refresh: true` | `comments_index` |

Only the seller reply is written with `refresh: true`, so only it is certainly
readable straight away. Everything the shopper does goes to the comments backend
first and reaches Elasticsearch later. The app already knows this. The like
button carries the comment *"no router.refresh (which would re-seed from a
not-yet-indexed Elasticsearch and revert the like)"*
(`components/Server/product/LikeButtton.tsx`), and `CommentBar` says the same
about a new question. **Every "reload and it survives" check in this request
lands exactly on that gap.**

## Test / validation commands available

Listed, not run.

| Command | What it checks |
|---|---|
| `pnpm test:run` | the unit suite (Vitest, `--project unit`) |
| `pnpm test:e2e:live` | preflight, build, then the live browser specs |
| `pnpm e2e:preflight` | is the suite configured, and is the target staging |
| `pnpm e2e:health` | is staging answering at all |
| `pnpm lint` | ESLint, including the i18n key rules |
| `pnpm lint:i18n-parity` | ar / tr / ku keys are in step |
| `npx tsc --noEmit` | types — needs `next typegen` first |
| `tsx tests/e2e/cli.ts run --lane=account` | the lane CI runs |

## Test layout and naming convention

- **Unit suite** — `tests/`, mirroring the source path
  (`tests/components/SellerDashboard/CommentsTab.test.tsx`,
  `tests/services/sellerDashboardComments.test.ts`,
  `tests/store/commentsReducer.test.ts`). Runner Vitest, jsdom.
- **Browser suite** — `tests/e2e/<area>.live.spec.ts`. A locator goes in
  `selectors.ts`, a thing a user does goes in `actions/`, and a long journey
  uses `test.step()`. Case ids are a prefix plus a number, written into the test
  title (`SD-01 ...`, `QA-04 ...`).
- **Expected failure** — this suite has no marker. A case that is red because a
  backend is wrong simply **stays red** and names the backend. `SD-12` is the
  standing example, and its spec file says in a comment not to fix it.

### What already covers this area

| Unit test | Covers |
|---|---|
| `tests/components/SellerDashboard/CommentsTab.test.tsx` | the dashboard tab: list, reply form, edit and delete reply |
| `tests/services/sellerDashboardComments.test.ts` | the dashboard comment service |
| `tests/store/commentsReducer.test.ts` | the shared comment entity store |

**Nothing covers the storefront side.** There is no test for `FaqAskInput`,
`CommentBar`, `FaqQuestionsList`, `BuyersCommentMenu`, `BuyersReplyMenu`,
`LikeButton` or `ProductLikeButton` in either suite.

## The two identities this journey needs

Already built; nothing new is required.

- **User 1, the shopper** — `TEST_ACCOUNT_PHONE`. A spec signs in once and saves
  its own jar under `tests/e2e/.auth/` (`SESSION_STATE` in
  `harness/liveSession.ts`), then hands it on after every case
  (`handOnSession`). One sign-in per identity per run is a suite rule.
- **User 2, the seller** — `TEST_ACCOUNT_PHONE_2`, who **is** the QA seller the
  seed builds. The seed saves its cookie jar at `QA_SELLER_SESSION_PATH`; a
  dashboard spec opens that jar and **never signs in**.
- **The product** — the QA product, opened by address with `gotoQaProduct`
  (`tests/e2e/actions/qaProduct.ts`). It belongs to the QA shop, which the
  seller owns, so one product serves both halves of the journey. When the seed
  skipped, the case must skip with `NO_QA_SEED_REASON`.

## Test hooks that do not exist yet

`data-pw` is the only locator this suite may use, and matching on visible text
is banned because every string goes through `translateFunction`.

| Already there | Where |
|---|---|
| `CommentIcon`, `CountOfComment` | the footer comment button |
| `LoveSymbol`, `CountOfLoves`, `LoveClickOnLast` | the product heart |
| `ExtendCoomentSection`, `CommentArea` | the extended area |
| `CommentField`, `SubmitComment` | the extended area post box |
| `success-comment-options` / `comment-options` | the question three-dot menu |
| `Source-Of-Comment`, `Date-Of-Comment` | inside a question card |
| the whole `sellerDashboard` shell block | `tests/e2e/selectors.ts` |

| Missing | Where |
|---|---|
| the in-page FAQ ask input and its send control | `FaqAskInput.tsx` — no hook at all |
| the heart on a question, and on a seller answer | `LikeButtton.tsx` — only a built id, `<comment_id>reaction` and `<id>-seller_replyreplyreaction` |
| Translate / Show Original, Edit, Delete menu items | `BuyersCommentMenu.tsx`, `BuyersReplyMenu.tsx` |
| the edit box and its confirm | `FaqItemOptions.tsx` |
| the seller answer block and its text | `FaqItemComponent.tsx` — only the id `comment-<id>-reply-text` |
| the whole comments tab: card, reply button, reply box, submit, load more | `CommentsTab.tsx` — no `data-pw` anywhere in the file |
| the product card, its four counts, and Previous / Next | the dashboard page, and `Pagination` in `components/SellerDashboard/ui/index.tsx` |

The `success-comment-options` / `comment-options` pair is **not** a way to tell
the two ask places apart. The in-page strip and the bottom sheet both render
without `isFromComments`, so both say `success-comment-options`, and only the
extended area says `comment-options`. Telling the three widgets apart has to be
done by container.

## How the seller finds the product

- The grid loads one page at a time: `getSellerProducts(sellerId, page)`,
  `productsMeta.last_page`, and a `Pagination` control with **Previous and Next
  only** — no page numbers and **no search box**. So "find the product even if
  it is not on the first page" means: read the page count, press Next until the
  card is there or the last page is reached, and fail naming the page count.
- The card is a `<Link>` to `.../products/<product id>`, so the product id is
  already in the address even with no hook.
- The four counts under a card come from `getSellerProductsSocial`, which is
  gated by `READ_COMMENTS`. The heart is `total_reactions`, read from
  `product_interactions_index.total_likes` — **the product like from step 3**,
  not a comment like. Until the counts arrive the card shows a dash, so "the
  like is there" has to be told apart from "the counts never answered".

## Can the seller like a comment?

**In the dashboard, no.** `CommentsTab` draws `HeartCount`, and the component's
own comment says it: *"Static heart + count — same look as the storefront's
LikeButton, but display-only (the dashboard shows totals, it doesn't react)."*
There is no like endpoint in `services/sellerDashboard/comments.ts` and none in
`services/elastic/sellerComments.ts`.

**On the product page, yes.** `LikeButton` asks only for a signed-in user
(`userProfile?.id`); it never checks who owns the product. So the seller could
like a question by opening the storefront page — which is not what the request
describes, and is a different journey from "the seller works in the dashboard".

## Risks and unknowns

| Risk | Impact / likelihood |
|---|---|
| **Elasticsearch lag on every reload check.** Five of the requested checks are "reload and it survived", and four of them read a value the comments backend wrote and Elasticsearch has not necessarily indexed. | High / high. A flat reload-then-assert would be red for timing, not for a defect. It needs a bounded poll whose message says "not indexed within N seconds", so a real loss and a slow index read differently. |
| **A refused like is never noticed.** `home.LikeComment` and `UnLikeComment` ignore the answer, and `fetchData` returns `{ success: false }` instead of throwing. So the heart turns on, nothing rolls back, and only a reload shows the truth. | Medium. A real defect if a like is refused, and it may be what a red reload check finds. Record it; do not fix it here. |
| **Translate may not be wired on staging.** Nothing in this repository says a translation service exists behind `/public_comment/comments/<id>/translate`. The request only asks that the call succeeds. | Medium. If it answers an error, the case stays red naming the comments backend — this suite's standing rule for a backend fault. |
| **The comments backend has its own session.** A 401 there is refreshed with the comments token pair, separately from the core session. A stale jar fails comment writes while the rest of the page still looks signed in. | Medium. The failure must name the comments backend, never "the sign-in". |
| **Nothing can undo a reply if the run dies.** The reply can be deleted through the dashboard, and a question can be deleted by its author, but a run that dies half-way leaves both on the QA product. | Low. The QA product is ours, so leftovers are contained — but the suite rule is "register for teardown at the moment it is created". |
| **Two identities, and the account lane.** This journey signs in as Shopper A and uses the seed's Shopper B jar. It must be in `ACCOUNT_LANE`, never beside a second copy of itself. | Low, but forgetting it makes the lane guard stop the whole command. |
| **The dashboard product grid is permission gated.** No `READ_COMMENTS` means the counts never arrive and the card shows a dash for ever. | Low, and unknown until the QA seller permission list is read at run time. |
| **Adding hooks touches shipped components.** Every hook listed above is an edit to a storefront or dashboard file. None is a protected runtime path, but the count is not small. | Medium. The plan must list every file. |

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Edit is offered only while a question has **no** reply. Does the spec keep the requested order (edit first, seller replies later), and does it also assert Edit is gone after the reply? | It is the one ordering constraint in the whole journey. Left unsaid, a later reorder silently makes the edit steps impossible. |
| OQ-2 | The seller **cannot** like a comment from the dashboard. Is the step dropped, or turned into a check that the dashboard offers no like control? | The request said "if false ignore it". A check that it stays display-only is cheap and would notice the day it changes. |
| OQ-3 | Which `data-pw` hooks are added, and to which files? | Nothing can be driven without them, and they are edits to shipped components — they belong in `plan.md > Files to change`, named one by one. |
| OQ-4 | What is the bound and the method for every "survives a reload" check — a poll, how long, and what the message says when it runs out? | This is the single biggest source of a false red. It has to be decided once, not per case. |
| OQ-5 | Does the journey assert the **like count** as well as the liked state, and is it a count it computed or a count it read before the action? | The suite bans asserting a bare count, but a heart with no number proves less. The line has to be drawn deliberately. |
| OQ-6 | What is registered for teardown, and when — the two questions, the product like, the seller reply? | Suite rule 6: register at the moment of creation, so a failed assertion still cleans up. |
| OQ-7 | What counts as "the translate call succeeded" — the status the comments backend answered, or the text on screen changing? | The request says "just check the api call success". Reading the text instead would also pass when the service echoes the input. |
| OQ-8 | Which spec file, which case-id prefix, and which lane? | `laneConfig.ts` stops the command for a file in no lane, and `SD-` is already taken by the dashboard spec. |
| OQ-9 | Do the QA seller permissions include `READ_COMMENTS` and `REPLY_COMMENT`, and what does the journey say when they do not? | Without them the seller half cannot run at all, and it must say "this account lacks the permission", not "the screen never loaded". |
| OQ-10 | Is the finding about the unchecked like answer (`home.LikeComment` ignoring its result) recorded as a `BUG-n`, or is it in scope? | IM-12 says wrong behaviour outside the files this plan changes is a finding with its own ticket. `services/home.ts` is not otherwise being changed. |
| OQ-11 | Does a scenario row go into `docs/testing/E2E_SCENARIOS.md`? The seller-dashboard and stories journeys never added theirs. | The suite README says to add a row. The doc is already behind, so this ticket either follows the rule or records that the rule is not kept. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- Nothing under the protected runtime paths was opened for writing.
