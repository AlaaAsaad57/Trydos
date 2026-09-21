---
ticket: e2e-product-comments-and-reactions
stage: plan
mode: standard
status: complete
owner: developer
updated: 2026-09-21
links:
  clickup:
  github:
---

# Plan — e2e-product-comments-and-reactions

> Decide the approach before changing code. Plan only — no implementation here.

> **Revised twice, from the advisory panel.** Round 1 raised nine `major`
> findings; round 2 read the revision against the code and found four more,
> three of which were the first round's fixes being *worded* rather than *true*.
> All thirteen are closed below. **What the panel changed** lists every one.

## Approach

Add one browser journey in the shape the suite already uses: hooks in the app,
locators in `selectors.ts`, a file of actions per screen, and a spec that reads
like the story. The journey is **eight cases in one file**, declared
`test.describe.configure({ mode: "serial" })` — the same as every other
dependent journey in this lane. Serial matters here: without it a failed
`CMT-01` leaves seven cases each burning up to 240 seconds to report a failure
they inherited.

Each case uses `test.step()` so a failure names the step. The ids of the two
questions are created in the first case and read by the rest; a case that finds
none fails by naming the case that was supposed to create them.

Nothing about the feature changes. Every application edit is a `data-pw`
attribute, a `data-*` value restating something the component already renders,
or one stale code comment corrected.

## Four mechanics decided here, once

These decide whether the journey reports the truth, so they are settled in the
plan rather than left to the implementation.

### 1. Reading what a backend answered

Four criteria are written as "the comments backend accepted it" (`AC-2`, `AC-3`,
`AC-4`, `AC-8`). `AC-8` is completely invisible in the page: a refused
translation is swallowed into `LogError` and the text simply does not change,
which looks exactly like a translation returning the same words.

So the journey **watches the network**. Every comment call is a `POST` to the
single address `/api/proxy`, and the request carries `x-proxy-url` naming the
real endpoint. One helper in `actions/productComments.ts` owns this, with four
rules:

- **Armed before the action, never after.** A wait registered after the click
  never sees the response and hangs for the whole case budget, reporting a
  backend fault that never happened.
- **Its own 30-second timeout**, well inside every case budget.
- **Reads `response.request().headers()`**, never `allHeaders()` — the latter
  carries the `Cookie` header, which is the session. The helper never prints a
  header map: only the endpoint it was given and the status.
- **Tells a proxy refusal from a backend answer.** `/api/proxy` has its own
  400, 403 and 503 paths. A proxy-level refusal is reported as the proxy
  refusing, not as the comments backend refusing — otherwise `NFR-2` is being
  broken by the very helper meant to satisfy it.

**What a message may print.** The endpoint and the status. **Never a response
body, never a card's shopper name or question text.** This repository is public
and, on CI, Playwright's `list` reporter prints assertion messages straight into
a world-readable Actions log with nothing redacting them — so the **whole**
assembled message goes through `harness/redact.ts` before it is used. There is
no carve-out for "the app's own label": this backend packs per-field refusals
inside `message`, so a label is often backend-authored text.

### 2. The checkpoint re-read — bounded in reloads as well as in seconds

`NFR-3` bounds every "it survived the reload" check. One helper in
`actions/productComments.ts` owns it, and it works **per checkpoint**:

1. reload the document once;
2. open the extended comment area, because two of the values live there and it
   is not in the DOM after a reload;
3. read **every** value the checkpoint cares about off that one page;
4. if something is still missing, wait 10 seconds and repeat — **at most six
   reloads**, and no new reload is started after 60 seconds.

Both bounds are needed. Seconds alone leave the loop rate set by how fast
staging answers: at a four-second page load that is about fifteen reloads per
checkpoint, four checkpoints, sixty product-page loads — worse than the
nineteen the per-value design was rejected for. Six reloads with a ten-second
gap is the same 60 seconds and a known cost.

- The helper passes `{ timeout: 60_000 }` explicitly. `playwright.config.ts`
  sets `expect: { timeout: 15_000 }` suite-wide, so a plain `expect` would
  quietly use 15 seconds and call a late index a lost write.
- **The literal bound is "no new reload after 60 seconds."** A checkpoint that
  starts its last reload at 59 seconds runs on to roughly 105 seconds. The real
  ceiling is the case budget, which is why those cases get 240 seconds.
- The message has two halves: what was expected, named; and that it was **not
  readable within the bound**. A slow index and a lost write must read
  differently.

**Cost per checkpoint:** one document load plus one extended-area open (which
re-fetches the comment list), so two comment-list reads. Good case four
checkpoints; worst case 24 reloads across the journey.

### 3. The dashboard is not re-read the same way

The two dashboard reads behave differently, and getting this wrong makes `AC-12`
time out against a cached value:

- **The product grid must reload the document.** `productsSocial` is page state
  and `requestedSocialIds` is a `useRef`; `changeTab` uses `router.replace`,
  which does not remount the page. The file's own comment says the state
  "survives a tab switch". So re-opening the Products tab re-reads **nothing** —
  the checkpoint reloads the document instead.
- **The comments tab may simply be re-opened.** `CommentsTab` is conditionally
  mounted and refetches on `[subTab, sellerId]`, so re-opening really does ask
  again.

Both are capped at **four re-reads with a fifteen-second gap**, not six: each
one spends a token of the seller's 60-reads-per-60-seconds budget, shared with
the grid's own social batch.

### 4. Time budgets, written down

`playwright.config.ts` gives every case 120 seconds, and a 60-second bound does
not fit inside that. Each case names its own budget, and so does the teardown —
an unbudgeted `afterAll` also gets the 120-second default, and this one is the
heaviest hook in the file.

| Cases | `test.setTimeout` | Why |
|---|---|---|
| `CMT-01` .. `CMT-05` | 180 s | a sign-in or a page load, a fresh context, plus real writes |
| `CMT-06`, `CMT-07`, `CMT-08` | 240 s | one checkpoint (up to ~105 s) plus the work before it |
| `afterAll` | 240 s | two contexts, a dashboard open, three deletes and an unlike |

Worst case the budgets sum to **31 minutes**. That figure now includes the
per-case cost the first version left out: eight context builds and eight full
page loads before any checkpoint reload, plus the seller cases re-resolving
`GET /shop/auth/permissions` whenever the 30-second cache has lapsed.

**What it will probably cost.** No measurement of a full account-lane run exists
anywhere in this repository — `_specs/e2e-stories-upload-report-delete/verify.md`
records only grep-filtered sub-runs. The nearest real datapoint is that journey:
**eight cases, about 30 minutes of budget, 4.0 minutes actual.** On that ratio
this journey costs about four to six minutes, and the 85-minute `globalTimeout`
is safe. That is an estimate from one comparable, not a measurement, and it is
written here so the gate can weigh it as such.

`/verify` records the **measured account-lane duration** — the first one this
repository will have — against the 85-minute `globalTimeout` and the 100-minute
CI job cap.

**If it does not fit, that is a different ticket.** The cap lives in
`.github/workflows/e2e-lane.yml`, a protected runtime path this plan does not
list. `/implement` hard-stops rather than editing it.

## Safety: the reply is bound by a mark in the data, not by an id

The suite's own rule is that **a numeric id carries no QA mark**, so a dashboard
write must be bound to something re-read from the environment. The server side
binds a reply to the *shop*, which stops another shop's comment being touched —
but the QA shop's own list also holds any real question a real shopper ever
asked it.

The first revision said to check that the question "belongs to the seeded
product". That was not implementable: `CommentsTab` never renders a product id,
and the same plan banned a hook for one, so both checks traced back to the same
remembered ids. It was a restatement, not a second bind.

**The mark travels in the data instead** — the idiom this suite already uses for
a QA shop slug and a QA story link. `CMT-01` writes each question with a unique
run token in its text, minted by the existing `newRunToken()` helper (a pure
function in `actions/story.ts`, reused rather than copied). The dashboard card
renders that text, so before it replies `actions/sellerComments.ts` refuses
unless **both** hold:

- the card's `data-comment-id` is one of the two ids `CMT-01` created, **and**
- the card's text carries **this run's** token.

A card failing either check is not answered, and the failure says the journey
refused to write to a question it could not prove was its own. The token is the
journey's own string, so quoting it in a message is safe — unlike a card's
shopper name or question text, which a message never prints.

## Sessions: two identities, three rules

- **Shopper A** signs in once, in `CMT-01`, and keeps the new `SESSION_STATE`
  slot. `handOnSession` runs in every shopper case's `finally`.
- **The seller never signs in.** The seller cases open the jar the QA seed
  saved, and every one of them hands it back with
  `handOnSession(context, page, QA_SELLER_SESSION_PATH)` in its `finally` —
  **including the `afterAll`**, which deletes the reply and is therefore
  authenticated work like any other. The seed's jar is a snapshot, and a case
  that lets the app rotate the credential without handing it on leaves a dead
  jar behind. Alphabetically `comments.live.spec.ts` sorts before
  `sellerDashboard.live.spec.ts` in the same one-worker lane, so this journey
  runs first and would poison all ten dashboard cases after it — the exact
  failure that file documents.
- **Two skip guards, not one.** `qaSeedRan()` for the whole file, and
  `qaSellerSessionSaved()` for the seller cases. Without the second, a missing
  jar reads as "the dashboard failed" and invites a second sign-in as the
  seller, which spends a real one-time code and breaks `NFR-6`.

## One locator rule, written once

The same question is drawn by up to three widgets, and the in-page strip and the
extended area are **both in the DOM** while the extended area is open. So a bare
`[data-comment-id=X]` matches twice and Playwright stops with a strict-mode
violation.

**Every FAQ lookup is scoped to its container** — `container.getByTestId(...)`,
never a page-wide lookup — and every step message names which container it read.
The containers exist: `faq-section` for the strip, the existing
`ExtendCoomentSection` for the extended area.

## A known unknown, stated rather than assumed

`AC-5` edits a question from the extended area. That menu's Edit sets a global
option, and the dialog is rendered by the in-page `FaqQuestionsList` — **behind**
the extended area, on the evidence of the class names: the extended area is
`z-99999999999999`, the dialog `z-99999999999` and its backdrop `z-9999999999`.

So the edit dialog may not be reachable from the extended area at all.

**The journey does not work around it.** It attempts the edit the way a shopper
would. If the dialog is unreachable, that is a real defect — a shopper cannot
edit a question from one of the two places the app offers — and it is handled
the way this repository handles one: the case stays red, names what it found,
and the defect is recorded as a `BUG-n` finding in `implement.md` with its own
ticket. Closing the extended area first to make the test pass would hide exactly
the thing the request asked to be checked.

## Steps

1. Add the storefront test hooks (the FAQ ask box, the strip, the question card,
   the like heart, the question menu, the edit box, the delete confirm).
2. Add the dashboard test hooks (the comments tab, the product card and its
   counts, the pagination Next control), and correct the `CommentsTab` comment
   that states no comment id is surfaced.
3. Add the locators to `tests/e2e/selectors.ts`, following the container rule.
4. Add `tests/e2e/actions/productComments.ts` — ask, edit, like, unlike,
   translate, delete, the proxy-response reader, and the bounded checkpoint.
5. Add `tests/e2e/harness/gridWalk.ts` (the walk's decision, pure) and
   `tests/e2e/actions/sellerProducts.ts` (the clicking and reading). The walk is
   bounded by `last_page`; the card's checkpoint reloads the document.
6. Add `tests/e2e/actions/sellerComments.ts` — open the comments section, find a
   question by id **and** by this run's token, answer it, read it back.
7. Give the new spec its own saved-session slot in `harness/liveSession.ts`, for
   **Shopper A only**.
8. Write `tests/e2e/comments.live.spec.ts` — serial mode, `CMT-01` to `CMT-08`,
   the two skip guards, the per-case budgets, `handOnSession` everywhere, and
   the `afterAll`.
9. Put the new spec in `ACCOUNT_LANE`, and add the unit case that proves it.
10. Record one row per case in `docs/testing/E2E_SCENARIOS.md`, and update the
    real-credential accounting in `tests/e2e/README.md`.

## Files to change

### Storefront hooks

- `components/Server/product/ProductFAQSection/FaqAskInput.tsx` — `data-pw`
  `faq-ask-input` on the text box and `faq-ask-send` on the send control. The
  component has no hook of any kind today.
- `components/Server/product/ProductFAQSection/FaqQuestionsList.tsx` — pass
  `dataCy="faq-section"` to the sideways strip. The strip component already
  renders that prop as `data-pw`, so this is one word and no wrapper. Needed
  because the strip's `id="comments-buyers-bar"` is **also** used by the buyers
  review strip on the same page, so the id cannot scope anything.
- `components/Server/product/ProductFAQSection/FaqItemComponent.tsx` —
  `faq-item` plus `data-comment-id` and `data-has-reply` on the card,
  `faq-item-text` on the question text, `faq-reply` and `faq-reply-text` on the
  seller answer.
- `components/Server/product/ProductFAQSection/FaqItemOptions.tsx` —
  `faq-edit-input` and `faq-edit-submit` on the edit dialog, and
  `dataCy="faq-delete-confirm"` passed to the shared confirm dialog, which
  already renders that prop on its confirm button.
- `components/Server/product/LikeButtton.tsx` — `comment-like` plus
  `data-comment-id`, `data-target-type`, `data-liked` and **`data-likes`** on
  the heart. `data-comment-id` carries **`realId`** — the component's own value
  with the `-seller_reply` suffix stripped — so an answer's heart is found as
  `[data-comment-id="<id>"][data-target-type="seller_reply"]`; written the other
  way round the locator matches nothing. `data-liked` avoids reading a CSS
  class, and `data-likes` carries the raw number, because the visible count is
  `toLocaleString()`-formatted and would have to be parsed back.
- `components/Server/product/ProductBuyersComment/BuyersCommentMenu.tsx` —
  `comment-translate`, `comment-edit` and `comment-delete` on the three menu
  items.

### Seller dashboard hooks

- `components/SellerDashboard/CommentsTab.tsx` — the file carries no `data-pw`
  at all today. Add `dashboard-comment-card` plus `data-comment-id`,
  `dashboard-comment-text`, `dashboard-comment-reply-btn`,
  `dashboard-comment-reply-text`, `dashboard-reply-modal`,
  `dashboard-reply-input` and `dashboard-reply-submit`. **Also correct the
  comment above that loop**, which says "No status badge / comment id / product
  id is surfaced here" — after this change the comment id is. No hook carries
  `user_id`, `user_avatar` or `product_id`; the same `map` has `comment.user_id`
  in scope and it stays unrendered.
- `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` —
  `seller-product-card` plus `data-product-id` on the product card link, and
  `seller-product-stat` plus `data-stat` and `data-value` on each of the four
  social counts. `data-value` is what lets a test tell "not answered yet" from
  "zero", which the card draws as a dash.
- `components/SellerDashboard/ui/index.tsx` — `pagination-next` and
  `pagination-status` with `data-current` and `data-last` on the shared
  pagination control. Not `pagination-prev`: the walk only ever presses Next.

### The browser suite

- `tests/e2e/selectors.ts` — **extend.** Add a `productComments` block and a
  `sellerComments` block, and add the product-grid and pagination locators
  beside the existing `sellerDashboard` shell block. One file holds every
  locator in this suite; a second one would be a defect.
- `tests/e2e/actions/productComments.ts` — **new.** Everything the shopper does
  on the product page, plus the proxy-response reader and the checkpoint.
- `tests/e2e/harness/gridWalk.ts` — **new.** The page walk's decision, as a pure
  Playwright-free function, so it can be proven while the QA shop still has one
  page. See "The page walk is built now, and proven now".
- `tests/e2e/actions/sellerProducts.ts` — **new.** The dashboard products
  section: press Next, read a card, read its counts. It clicks; `gridWalk.ts`
  decides.
- `tests/harness/gridWalk.test.ts` — **new.** The walk cases the environment
  cannot produce yet. It lives here, not beside the action, because the unit
  project excludes `tests/e2e/**` from test discovery.
- `tests/e2e/actions/sellerComments.ts` — **new.** The dashboard comments
  section: open it, find and prove a question, answer it, read it back.
- `tests/e2e/harness/liveSession.ts` — **extend.** One more `SESSION_STATE`
  entry, for **Shopper A only**.
- `tests/e2e/comments.live.spec.ts` — **new.** `CMT-01` to `CMT-08`.
- `tests/e2e/laneConfig.ts` — **extend.** Add the new spec to `ACCOUNT_LANE`.
  Left out, `laneSpecs()` stops the whole command.
- `tests/harness/qaHarness.test.ts` — **extend.** One unit case: the new spec is
  in `ACCOUNT_LANE`. Kept deliberately — `laneSpecs()` throws only when the lane
  CLI calls it, and the unit suite never does, so without this case nothing that
  gates a pull request would notice the file dropping out of a lane. It is the
  only proof `AC-24` has.
- `docs/testing/E2E_SCENARIOS.md` — **extend.** One row per case.
- `tests/e2e/README.md` — **extend.** The file records what a full run spends in
  real one-time codes and which cookie jars exist. This journey adds one more
  sign-in on the shared shopper number and one more jar, so both counts move.

**Dropped from the first version:**
`components/Server/product/ProductBuyersComment/BuyersReplyMenu.tsx` and the
`dashboard-comments-empty` hook. Translating a seller answer is Out of Scope, so
no case drives that menu, and no criterion reads an empty state. Hooks with no
criterion behind them are scope.

## Teardown: two identities, two removal paths

Only the shopper can delete a question or remove the product like; only the
seller can delete a reply. So `afterAll` builds **both** contexts, budgets
itself at 240 seconds, and each half is a no-op when `CMT-08` already did the
work. The seller half closes through the same hand-on helper as every seller
case.

Accepted in writing: if a run dies between the reply and the teardown and the
seller jar is unusable, **the reply stays on the QA product**. It is on a
product no shopper sees, and this suite already accepts the same for a location
it cannot delete.

## Integration surface

- **Components / shared config touched:**
  - `LikeButton` is shared by the FAQ question card **and** the buyers review
    card (`BuyerCommentRateInfo`). Its new attributes appear in both.
  - `BuyersCommentMenu` is shared by the FAQ question card **and** the buyers
    review card (`BuyerCommentItem`). Its three new hooks appear on both.
  - `FaqItemComponent` is rendered by **three** widgets on one page, which is
    what makes the container rule above necessary rather than tidy.
  - `ConfirmModal` is used in eight places. Only the FAQ delete passes the new
    `dataCy`; the other seven callers are untouched.
  - `Pagination` in the dashboard `ui` module is shared by the products grid and
    every other paged dashboard list.
  - **The QA seller's cookie jar** (`QA_SELLER_SESSION_PATH`) — shared state,
    written by the seed and read by `sellerDashboard.live.spec.ts`.
  - **The shared shopper's one-time-code budget.** The account lane already
    spends fifteen real codes per run; this adds a sixteenth. A throttled send
    sleeps the backend's own cooldown, so it eats a *different* case's budget.
  - **The seller read limiter** — 60 reads per 60 seconds per shop and session,
    shared by the grid's social batch and the comments list. **This gets tighter
    when the QA shop gains products:** the batch asks per product id, and a walk
    over several pages asks once per page. The named limiter failure is what
    keeps that legible on the day it starts to bite.
  - **`newRunToken()`** in `actions/story.ts`, reused as a pure helper.
  - `tests/e2e/laneConfig.ts` and `tests/e2e/selectors.ts`, which every other
    spec reads.
- **Who else depends on them:** the buyers review section of the product page,
  `sellerDashboard.live.spec.ts` through the seed's jar, every paged dashboard
  list, and every existing spec through `selectors.ts` and `laneConfig.ts`.
- **Overlapping flows:** the buyers review flow shares the like heart and the
  three-dot menu with the FAQ flow. This ticket drives only the FAQ flow, but
  the review flow renders the same new attributes.
- **Ordering / lockstep dependencies:** the spec file, its `ACCOUNT_LANE` entry
  and the unit case must land together — a spec in no lane never runs. The new
  `SESSION_STATE` entry must land with the spec that reads it.
- **Kept artifacts.** The live project records `video: "on"`, and this is the
  first journey to open the dashboard comments list, which draws **real
  shoppers'** names, avatars and question text — quoted again inside the reply
  modal. The video is mitigated by the encrypted archive and its three-day
  retention. Nothing this journey writes may add to it: no failure message
  quotes a card's shopper name or question text, only its id and this run's own
  token.
- **What breaks if this is wrong:**
  - a duplicated `data-pw`, or a page-wide FAQ lookup, makes a locator match two
    elements and fail with "strict mode violation" in a file nobody changed;
  - a missing lane entry stops the lane command for every spec;
  - a seller case or the teardown that does not hand its jar on turns the ten
    dashboard cases after it red, all blaming the wrong thing;
  - tripping the read limiter makes the card draw a dash and the comments list
    answer "Too many requests", which `AC-12` and `AC-13` would read as "the
    data has not arrived" — so **a limiter refusal is its own named failure**,
    on both the grid walk and the comments re-read.

## Two known shapes of the app the journey must survive

- **A refused edit hides every three-dot menu on the page.**
  `BuyersCommentMenu` draws its control only while no modal option is set, and
  `FaqQuestionsList.EditComment` clears that option **only on success**. So one
  refused write leaves the whole page without menus, and every later case would
  fail with "no menu" instead of naming the refusal. The edit action therefore
  judges the update response itself and says "the comments backend refused the
  edit".
- **The grid has no pagination control when there is one page.** `Pagination`
  renders only when `last_page > 1`, and the QA shop has one product. The walk
  reads "no control" as "one page", never as a missing element, and its failure
  says how many of how many pages were walked.

## The page walk is built now, and proven now — not when it first runs

The request asked for the walk from the start, so that a later ticket adding
products does not find the journey assuming page one. The plan has always
carried it (`FR-9`, `AC-11`).

**But on today's environment it would never execute.** The QA shop has one
product, so `last_page` is 1, no control is drawn, and the walk returns on its
first look. `AC-11` would then report "found by walking the pages" having walked
none — a check passing for a case it cannot see. This repository's testing rules
forbid shipping that and forbid parking it as "known weak".

So the walk's **decision** is a pure function, `tests/e2e/harness/gridWalk.ts`,
Playwright-free: given the page it is on, the last page, and whether the card is
on this page, it answers `found`, `go to the next page`, or `exhausted` — and it
writes the "walked N of M pages" sentence. `tests/harness/gridWalk.test.ts`
drives it over the cases the environment cannot produce yet: one page with the
card, one page without, the card on the last page, the card on no page, and a
`last_page` that grows mid-walk.

Three reasons this is the smallest honest option:

- It gates pull requests. The browser suite never does, so a walk proved only
  there would be unguarded from the day it lands.
- It needs no new data. Seeding a second QA product means another real product
  on a real environment, written by a journey that is not about creating
  products.
- The unit project **excludes `tests/e2e/**`** from test discovery, so the test
  cannot sit beside the action — but it may import a Playwright-free module from
  there, which is why the decision is split out and the browser action keeps only
  the clicking.

When the later ticket adds products through the dashboard, the browser half
starts exercising the walk for real, and this helper stays as the fast proof of
what it decides.

## Why the comments list needs no paging

`AC-13` finds two questions in a shop-wide list that pages ten at a time. It
needs no Load More hook and no walk: the list is sorted `created_at desc`, both
questions were written minutes earlier by `CMT-01`, and nobody but this suite
posts to the QA shop. They are on the first page unless ten newer questions
appear mid-run, which cannot happen. Older leftovers from a failed run sort
below them.

## Tests

The unit suite cannot reach any of this: every criterion needs a real product, a
real comments backend and a real Elasticsearch index. So the disposition is
`new` in the browser suite for all but two rows. Searched `tests/` for every
existing name in this area — `tests/components/SellerDashboard/CommentsTab.test.tsx`,
`tests/services/sellerDashboardComments.test.ts`, `tests/store/commentsReducer.test.ts`
and `tests/harness/qaHarness.test.ts`. None covers the storefront side, and none
covers a real write.

| AC | Existing coverage found | Disposition | Test file | Test case / name |
|------|-------------------------|-------------|-----------|------------------|
| AC-1 | `none — searched tests/e2e/*.live.spec.ts and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-01` step "the shopper opens the QA product" |
| AC-2 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-01` step "the comments backend accepted the product like" |
| AC-3 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-01` step "a question asked in the page FAQ section" |
| AC-4 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-01` step "a question asked in the extended area" |
| AC-5 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-02` steps "the page question is edited" / "the extended-area question is edited" |
| AC-6 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-02` step "each question is liked" |
| AC-7 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-02` checkpoint "a reload still shows both edits" |
| AC-8 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-02` step "the comments backend answered the translate call" |
| AC-9 | `none — SD-01 opens the dashboard but never the products grid` | new | `tests/e2e/comments.live.spec.ts` | `CMT-03` step "the seller opens their product list" |
| AC-10 | `none — searched tests/e2e and tests/components/SellerDashboard` | new | `tests/e2e/comments.live.spec.ts` | `CMT-04` step "the seller is offered the comments section" |
| AC-11 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-03` step "the QA product card is found, walking N of M pages" |
| AC-11 (the walk itself) | `none — searched tests/ and tests/e2e` | new | `tests/harness/gridWalk.test.ts` | "one page holding the card" / "the card on the last page" / "the card on no page" / "`last_page` grows mid-walk" |
| AC-12 | `none — searched tests/e2e and tests/components/SellerDashboard` | new | `tests/e2e/comments.live.spec.ts` | `CMT-03` checkpoint "the card's reaction count holds the shopper's like" |
| AC-13 | `tests/components/SellerDashboard/CommentsTab.test.tsx::reply form` — the form with a faked service, never a real write | new | `tests/e2e/comments.live.spec.ts` | `CMT-04` steps "the first question is answered" / "the second question is answered" |
| AC-14 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-05` step "both answers are on the product page" |
| AC-15 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-05` step "each answer is liked" |
| AC-16 | `none — searched tests/e2e and tests/components` | new | `tests/e2e/comments.live.spec.ts` | `CMT-05` step "an answered question offers no Edit" |
| AC-17 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-06` — one checkpoint, one named assertion per value |
| AC-18 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-07` step "every like is removed" |
| AC-19 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-07` checkpoint "a reload keeps every like off" |
| AC-20 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-08` step "each question is deleted" |
| AC-21 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-08` step "the product like is removed" |
| AC-22 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `CMT-08` checkpoint "a reload keeps the deletes and the unlike" |
| AC-23 | `none — searched tests/e2e` | new | `tests/e2e/comments.live.spec.ts` | `afterAll` — both identities, both removal paths |
| AC-24 | `tests/harness/qaHarness.test.ts` reads `laneConfig` for the grep, but asserts nothing about lane membership | extend | `tests/harness/qaHarness.test.ts` | "the comments journey is in the account lane" |
| AC-25 | `shopper.live.spec.ts` uses the same skip guard, but nothing asserts it | new | `tests/e2e/comments.live.spec.ts` | the two skip guards, `qaSeedRan()` and `qaSellerSessionSaved()` |
| AC-26 | `none — no runner can assert that a message is useful` | none — proved by reading `tests/e2e/comments.live.spec.ts` at `/review` and `/verify` | — | — |

`AC-24` has a second half — the row in `docs/testing/E2E_SCENARIOS.md`. No test
runs against a document; it is proved by reading that file at `/verify`.

**One honest note on `AC-5`.** The two edits open from two different menus in
two different widgets, but both use the one `FaqItemOptions` that
`FaqQuestionsList` renders, and both save through the same `EditComment`. The
criterion still holds — the entry points differ — and the step messages say so
rather than implying two save paths. See also "A known unknown" above: the
second entry point may not reach that dialog at all.

## Validation strategy

- Validation profile: `full` (`lint`, `typecheck`, `unit-tests`, `build`, all at
  `all-ac`).
- Profile source: `pre-existing` — `.claude/project-config.yaml` already carries
  it. Nothing in that file is created or edited by this ticket.
- The profile proves **AC-24** (the unit case) and proves that the nine
  application files still lint, typecheck and build. `build` is named because
  this change edits a client component inside a server-rendered tree and a page
  file; it is the check that catches a boundary error the compiler misses.
- **The browser cases are not run by any profile.** `/verify` runs them by hand
  and records the exit code and the output per `AC-n`:

  ```
  pnpm e2e:health
  tsx tests/e2e/cli.ts run --lane=account comments[.]live[.]spec[.]ts
  ```

  `e2e:health` runs first, because a red suite with staging down says nothing
  about this change.
- `/verify` also records the **measured account-lane duration** against the
  85-minute `globalTimeout` and the 100-minute CI job cap.
- No check writes to the repository. `vitest run`, `tsc --noEmit` and `eslint`
  are already pinned to their non-writing modes in the config.

## Rollback

Revert the single commit. Every application edit is an added attribute or a
corrected comment, so reverting restores byte-identical behaviour; nothing is
migrated and no data is written by the app side of this change.

The suite side must be reverted **together**: removing
`tests/e2e/comments.live.spec.ts` while leaving its `ACCOUNT_LANE` entry makes
`laneSpecs()` stop every lane run with "in a lane but not on disk". One commit,
one revert.

What a revert cannot undo: the two questions, the two answers and the product
like a run already wrote on the QA product. They are removed by the journey's
own `afterAll`, and they live on the QA product, which no shopper sees.

## Answers to the deferred questions

- **OQ-3** — answered by **Files to change**: six storefront files and three
  dashboard files, each named with the hooks it gets.
- **OQ-8** — `tests/e2e/comments.live.spec.ts`, case prefix `CMT-`, in
  `ACCOUNT_LANE`. `CMT-` is free: the suite uses `AUTH`, `BUY`, `CMP`, `GUEST`,
  `PROF`, `QA`, `RECOV`, `SCRIPT`, `WISH`, `SD` and `STORY`. The lane is the
  account lane because the journey signs in as the shared shopper and writes for
  real.

## What the panel changed

### Round 1 — nine majors, all closed

| Lens | Finding | Where it landed |
|---|---|---|
| performance | no per-case budget; 60 s cannot fit the 120 s default | "Time budgets, written down" |
| performance | the re-read reloaded per value: up to 19 page loads | "The checkpoint re-read" |
| performance | no wall-clock estimate against an 85-minute lane cap | "Time budgets", plus the measured duration at `/verify` |
| security | quoted backend text reaches a public CI log un-redacted | "Reading what a backend answered" |
| security | the seller write was bound by comment id alone | "Safety: the reply is bound by a mark in the data" |
| senior | the QA seller jar is shared, unlisted state | Integration surface, and "Sessions" |
| senior | no dashboard-side bounded re-read | "The dashboard is not re-read the same way" |
| senior | a 60 s poll does not fit a 120 s case | "Time budgets, written down" |
| senior | no mechanism named for reading what a backend answered | "Reading what a backend answered" |

Round 1 minors also closed: the 15-second `expect` default, the grid-walk bound,
the shared read limiter, the `qaSellerSessionSaved()` guard, the stale
`CommentsTab` comment, the credential accounting, the refused-edit menu trap,
`AC-10`'s wording, the one-page grid, `realId` on the heart, the two-identity
teardown, and dropping the empty-state hook.

### Round 2 — four majors, all closed

| Lens | Finding | Where it landed |
|---|---|---|
| security + senior | the "belongs to the seeded product" bind had **no readable source** and contradicted this plan's own hook ban — it restated the id check | rewritten as a **mark in the data**: the run token in the question text, plus `dashboard-comment-text` |
| senior | re-opening the Products tab re-asks for **nothing** — `router.replace` does not remount, and the counts are held in page state and a ref | "The dashboard is not re-read the same way" — the grid checkpoint reloads the document |
| performance | the checkpoint bounded seconds but not the loop rate: ~60 page loads on the lagging path, worse than the 19 it replaced | six reloads, ten-second gap, no new reload after 60 s |
| performance | `afterAll` had no budget and is the heaviest hook in the file | 240 s, and it is in the 31-minute arithmetic |
| security | the teardown's seller half did not hand the jar on | "Sessions", third bullet, and "Teardown" |

### Round 3 — raised by the Workflow Owner, not the panel

**"Did we consider the pagination from day one, since we only have one product
now but will add products later?"** The walk was planned from the start, but no
panel noticed that on today's environment it would never run, so `AC-11` would
have passed having walked nothing. Closed by splitting the walk's decision into
a pure helper and proving it in the unit suite — see "The page walk is built
now, and proven now".

Round 2 minors also closed: the redaction carve-out dropped, cookie-free header
reading, the proxy-versus-backend status, the wait armed before the action, the
container scoping rule, the extended-area open counted in the checkpoint cost,
the dashboard re-read cap, serial mode, the numeric `data-likes`, the video and
shopper-data line, the comments-list paging justification, dropping
`BuyersReplyMenu` and `pagination-prev`, the lane-cap hard stop, and the
`AC-5` z-order unknown stated rather than assumed.

## Out of scope

- Any change to how comments, likes or replies behave. Only attributes are
  added, plus one stale code comment corrected.
- The buyers review flow. It renders the same new attributes and is not driven.
- Fixing the app's unread answer to a like call — recorded as a finding with its
  own ticket.
- A scripted (faked-backend) copy of any of this.
- Adding an e2e check to `.claude/project-config.yaml`. That file is the
  owner's, and the precedent from the last browser ticket is that `/verify` runs
  the suite by hand and records the result.
- Raising the lane's `globalTimeout` or the CI job cap. Both are outside this
  plan's files and one is a protected runtime path.
- The stale "(Go) backend" comment in `services/elastic/sellerComments.ts`. It
  is server-only and outside this plan's files.
