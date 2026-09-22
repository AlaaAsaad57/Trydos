---
ticket: e2e-seller-story-product-link
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: ai_agent
updated: 2026-09-22
links:
  clickup:
  github:
---

# Research — e2e-seller-story-product-link

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Find out what a browser journey needs in order to follow one seller story from
the dashboard, to the home page feed, to the product page, and back to the
dashboard to be deleted — and find out which parts of that path already exist.

## Headline finding

**The product page does not hide QA stories.** This is the one finding that
changes what the ticket has to build, so it is stated first.

`serverRequests/product.tsx:547` — `GetProductStoriesData` returns
`response.data.data.data` straight from the stories backend. It never calls
`dropQaStories`. Every other reader of a story feed does:

| Reader | File | Filters? |
|---|---|---|
| home stories bar | `components/Home/Stories/StoriesBarClient.tsx:71` | yes |
| home bar, later pages | `components/Home/Stories/StoriesPaginationWrapper.tsx:63` | yes |
| server-side home feed | `serverRequests/stories.ts:83` | yes |
| client story service | `services/story.ts:43` | yes |
| **product page stories** | **`serverRequests/product.tsx:547`** | **no** |

`components/products/ProductStories.tsx:84` calls the same function again for
its own paging, so the later pages are unfiltered too.

**What it means.** A QA story attached to a product is shown in the "Product
Story" section of that product's page to **every** visitor, including a guest.
That is exactly what the QA story lock exists to prevent, and this ticket would
have walked straight into it: step 7 of the requested journey ("confirm the
product page shows the story") passes **today**, but it passes because of the
leak, not because the feature works.

The journey does not have to change. After the leak is closed, the story is
still shown to the allow-listed test viewer — which the test account is — so the
same case proves the same thing, for the right reason. `spec` should write the
criterion so that it says so, and add the opposite criterion: a visitor who is
not on the allow-list must not see it.

This is a bug found by reading, not by a red test. `CLAUDE.md` therefore applies
in full: a unit test must be written, **seen red**, and only then may
`serverRequests/product.tsx` change. The file that test belongs in already
exists — see *Test layout* below.

## Relevant directories

- `components/SellerDashboard/` — the dashboard's sections. `StoriesTab.tsx`
  (1075 lines) is the whole feature: list, viewer, upload form, product picker
  and delete.
- `components/Home/Stories/` — the home stories bar, its paging, and the story
  viewer a shopper opens. `StoryViewer.tsx` holds the product button.
- `components/products/` and `components/Server/product/` — the product page's
  own story strip.
- `serverRequests/` — the server-side readers. `product.tsx` and `stories.ts`
  are the two that matter here, and they disagree (see the headline finding).
- `utils/qaStoryFilter.ts` — the QA mark and the filter, with its viewer
  allow-list.
- `tests/e2e/actions/` — one file per screen area. `story.ts` covers the
  **shopper** story flow; there is no seller-side file yet.
- `tests/e2e/harness/` — the QA seed, the saved sessions, the lane server.
- `tests/components/SellerDashboard/` and `tests/serverRequests/` — the unit
  suites for the two units this ticket touches. Both already have a file.

## Relevant config files

- `playwright.config.ts` — the `setup` → `live` dependency. `live` declares
  `dependencies: ["setup"]`, so **any `*.live.spec.ts` already runs after the QA
  seed**. The owner's "must run after the QA seed" needs no new mechanism.
- `tests/e2e/laneConfig.ts` — `ACCOUNT_LANE` / `SOLO_LANE`. A spec in neither
  lane stops the run with its own name, so the new file must be added here in
  the same change.
- `.claude/project-config.yaml` — the validation checks and profiles.
- `utils/qaStoryFilter.ts` — `NEXT_PUBLIC_QA_STORY_LINK_HOST` (which host marks
  a story as test data) and `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` (who still sees
  one).

## Possibly affected services

- **stories backend** (`STORIES_BACKEND_URL`) — carries all four calls this
  journey makes: `add-seller-story`, `seller-stories`, `users_stories` and
  `product_stories/{id}`. Every failure message must name it.
- **media server** — `uploadStoryToMediaServer` (`services/sellerDashboard/index.ts:329`)
  sends the file before the story row is saved. A story upload is therefore two
  backends, and a failure must say which one refused.
- **core backend** — the seller's permissions and the product picker's list.
- **search / Elasticsearch** — not touched. The journey reaches the product by
  slug, never by search.

## What already exists — the parts the ticket does not have to build

### The QA mark, and why the test can still see its own story

`utils/qaStoryFilter.ts` marks a story as test data by its **link host**. The
default is `qa-test.trydos.tech`, overridable with
`NEXT_PUBLIC_QA_STORY_LINK_HOST`. `dropQaStories` removes such a story from a
feed, and also drops an author left with no stories — an empty ring that opens
onto nothing.

The same file holds a viewer allow-list by phone number, and
`tests/e2e/harness/server.ts:87` fills `NEXT_PUBLIC_QA_STORY_VIEWER_PHONES` from
the two configured test phones **by itself**. So the test account sees its own
QA story and a customer does not, with **no new setting to configure**. This was
the one thing that could have blocked the ticket.

`tests/e2e/actions/story.ts:60` already builds the link:
`https://<qaStoryLinkHost()>/e2e/<run token>/<kind>`, and checks it with the
app's own `isQaStory()` before uploading anything.

### The dashboard Stories tab

`components/SellerDashboard/StoriesTab.tsx`:

- The tab id is `stories`, addressable as `?tab=stories`, gated by
  `READ_STORY`. Upload needs `CREATE_STORY` and delete needs `DELETE_STORY`
  (`…/sellerDashboard/[sellerId]/page.tsx:435-437`).
- The upload form has a file picker, a **Link** input, a **product picker**
  modal, and Share.
- `validateLink` (line 66) accepts any parseable URL with a dot in it, so the QA
  link passes. `normalizeLink` adds `https://` when missing.
- The save sends `link`, `product_id` **and** `product_slug` together
  (line 487-489), through `SellerDashboardService.saveSellerStory`.
- The list row and the delete confirmation are both in this file.
- **One screen is easy to miss:** a chosen **image** is sent to
  `ImageCropWidget` first (line 421), and only a cropped file reaches the
  preview. A **video** skips the crop entirely. That is a real difference for a
  test — see `OQ-4`.

### The home feed and the product button

- The bar reads `/api/v1/stories/users_stories?page=1`
  (`StoriesBarClient.tsx:15`), and later pages are fetched by
  `StoriesPaginationWrapper` when an `InView` marker scrolls into view. So
  "page 2 or 3" means scrolling the bar, not a page control.
- `StoryViewer.tsx:432-455` draws the product button — the label is
  "View Product" and it is a link to `/${lang}/products/${product_slug}`. It is
  drawn only when `product_slug` is set **and** the story is not paused.

### The product page story strip

- `ProductPageContent.tsx:187` renders `ProductStoriesWrapper`, which returns an
  empty fragment when there are no stories, and otherwise draws a "Product Story"
  heading with `data-pw="StoriesIcon"` on its icon.
- Each card carries `data-pw="Story"` and `data-id={story.id}`
  (`components/products/ProductStories.tsx:26-28`), so a case can name the exact
  story it is looking for.

### The seed already provides the product

`readQaSeedState()` (`tests/e2e/harness/qaSeedState.ts:92`) returns `sellerId`,
`shopSlug`, `boutiqueId`, `locationId`, `productId` and `productSlug`. The
owner's "we find a product to add it to the story" is answered by
`productId` / `productSlug` — no searching, no picking from a list of unknown
rows. `qaSellerSessionSaved()` and `qaSeedRan()` are the two guards a dashboard
case asks before it starts.

### The dashboard shell

`tests/e2e/actions/sellerDashboard.ts` is deliberately section-free: it owns the
door in and the moves between sections, and each section keeps its own file
(`shopLocations.ts`, `shopInfo.ts`, `sellerProducts.ts`, `sellerComments.ts`).
A new `sellerStories.ts` follows that pattern and touches none of them. The menu
item already has a hook: `data-pw="seller-dashboard-menu-stories"`.

## Test layout and naming convention

Recorded for `PL-14` — look for the test before writing one.

| | Unit suite | Browser suite |
|---|---|---|
| Root | `tests/` | `tests/e2e/` |
| Runner | Vitest (`pnpm test:run`) | Playwright (`pnpm test:e2e:live`) |
| Layout | mirrors the source path | one spec per journey, actions in `actions/` |
| File name | `<unit>.test.ts` / `.test.tsx` | `<journey>.live.spec.ts` / `.scripted.spec.ts` |
| Gates PRs? | **yes** | **no** — so a fix proved only in e2e is unguarded |

**Existing files this ticket must extend rather than duplicate:**

- `tests/serverRequests/product.test.ts:838` — already has a
  `describe("GetProductStoriesData")` block with five cases. The QA-filter case
  belongs **in that file**. A second file for the same unit is a defect.
- `tests/components/SellerDashboard/StoriesTab.test.tsx` — already exists. Any
  unit case about the tab goes here.
- `tests/utils/qaStoryFilter.test.ts` — covers the filter itself, including the
  viewer allow-list. The filter needs nothing new; the **caller** does.
- `tests/e2e/actions/story.ts` — the shopper-side story helpers. Reusable:
  `newRunToken`, `qaStoryLink`, `qaStoryLinkPrefix`, `storyPhoto`,
  `readStoryFeedPage`, `showingStoryId`, `openRing`, `advanceToStory`.

**Expected-failure marker:** none is in use in either suite today. The
repository's rule for a test that proves a backend wrong is to leave it red and
name the backend (`CLAUDE.md`, and the `backend-fault-stays-red` note).

## Test / validation commands available

From `.claude/project-config.yaml`. Not run during research.

- `pnpm lint` — ESLint, including the i18n rules. A missing translate key is an
  **error**, not a warning.
- `node_modules/.bin/tsc --noEmit --pretty false` — types. Needs `next typegen`
  first on a clean checkout.
- `pnpm lint:i18n-parity` — `ar` / `tr` / `ku` keys are in step.
- `pnpm test:run` — the Vitest suite.
- `pnpm build` — catches server/client boundary faults `tsc` misses.
- `pnpm e2e:health` — is staging answering, before blaming a test.
- `tsx tests/e2e/cli.ts run --lane=account --skip-build <file>` — one lane.

Profiles offered: `ui-change`, `logic-change`, `full`. `serverRequests/product.tsx`
is a server module in the client graph, so `full` is the profile that fits — but
choosing one is `plan`'s job, not this stage's.

## Risks and unknowns

- **A seller story may not reach the home feed at all.** The dashboard writes
  through `add-seller-story` and reads back through `seller-stories`; the home
  bar reads `users_stories`. Whether the stories backend puts one in the other
  is **backend behaviour this repository cannot answer by reading**. The save
  does send the seller's own `user_id`, which suggests the row is filed under
  that user and so would appear in `users_stories` under their group — but that
  is inference, not proof. The whole of steps 4 to 6 rests on it. *(OQ-1 — the
  highest risk in this ticket.)*
- **Walking the bar is slow and unbounded by nature.** Each extra page is a real
  request to the stories backend. A case that pages until it finds something has
  no upper bound and will one day time out instead of failing with a reason.
  *(OQ-2.)*
- **The account lane is already the suite's critical path** — 30.3 minutes of
  tests in CI run 35664329326, against 7 for the solo lane. This journey signs
  in, uploads real media and writes real rows, so it belongs in the account lane
  and lengthens the slowest one. The owner asked for "fast" explicitly. *(OQ-3.)*
- **An image upload has an extra screen.** `ImageCropWidget` stands between
  choosing a photo and previewing it; a video has no such step. Driving a crop
  widget is more to go wrong. *(OQ-4.)*
- **`StoriesTab.tsx` has zero `data-pw` attributes.** Every other dashboard spec
  drives its screen through them. Without them the case must match on translated
  text, which ties it to one language — the exact thing `playwright.config.ts`
  says these hooks exist to avoid. *(OQ-5.)*
- **The QA seller's permissions are unproven.** The tab needs `READ_STORY`,
  `CREATE_STORY` and `DELETE_STORY`. The seed approves a seller but nothing here
  shows which permissions that seller ends up with. *(OQ-6.)*
- **A leaked row.** `SD-06` already leaves an undeletable location behind on
  every run. A story **can** be deleted, so this journey should leave nothing —
  but only if the delete step runs even when an earlier step fails. *(OQ-7.)*
- **Fixing the product-page filter touches a shared reader.** `GetProductStoriesData`
  is called from a server component and from the client component's paging. A
  change there affects every product page, not only the QA case.

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does a story created through `add-seller-story` appear in the `users_stories` feed the home bar reads? | Steps 4–6 of the journey depend on it entirely. If the answer is no, the home-page half of this ticket is not buildable as described and the spec must change. This is a backend fact and must be measured, not assumed. |
| OQ-2 | How many pages of the home stories bar may the case walk before it fails? | "Keep paging until found" has no bound and turns a clear failure into a timeout. The owner said page 2 or 3; the spec needs one number and a reason for it. |
| OQ-3 | Which lane, and what time budget? | The account lane already sets the suite's 32-minute wall time and the owner asked for "fast". A budget written into the spec is what makes that checkable at `verify`. |
| OQ-4 | Photo or video for the uploaded story? | A photo goes through `ImageCropWidget`; a video does not. This decides how much screen the case has to drive, and so how stable it is. |
| OQ-5 | Does this ticket add `data-pw` hooks to `StoriesTab.tsx`, and which ones? | The owner has allowed application changes. Without hooks the case matches translated text and breaks in Arabic. The list of hooks must be in the plan, or `implement` cannot add them (IM-4). |
| OQ-6 | Does the QA seed's seller hold `READ_STORY`, `CREATE_STORY` and `DELETE_STORY`? | Without all three the journey cannot run, and the case must say that plainly rather than failing on a missing button. |
| OQ-7 | Is the QA filter fix for `GetProductStoriesData` inside this ticket, or a separate one? | The owner allowed application edits, so it may be in scope — but it is a change to a shared reader on every product page. Either way it needs a unit test in `tests/serverRequests/product.test.ts` that is **seen red** first. If it is out of scope it becomes `BUG-1` and its own ticket. |
| OQ-8 | What proves the story is gone after the delete? | "The row left the dashboard list" is a statement about a screen. The backend has to be asked, or the case reports a delete that never happened. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- No test was run.
- Evidence for every claim above is a file and line in this repository, except
  `OQ-1`, which is named as a backend fact that reading cannot settle.
