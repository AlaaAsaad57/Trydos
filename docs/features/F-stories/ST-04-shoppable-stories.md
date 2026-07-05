# ST-04 — Shoppable Stories

| | |
|---|---|
| **Feature ID** | ST-04 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Home/Stories/StoryViewer.tsx`, `components/products/ProductStories.tsx`, `components/Server/product/ProductStoriesWrapper.tsx`, `services/story.ts` |

---

## What it is

A story can be **linked to a product**, so while watching it the shopper sees a **"View Product"**
button that taps straight through to that product's page. This is what turns a shop story into a
sellable moment.

## Where it appears

- **Inside the story viewer (ST-01)** — when the current story item carries a product, a
  "View Product" call-to-action is overlaid.
- **On the product page** — a dedicated "Product Story" bar (`ProductStoriesWrapper` →
  `ProductStories`) shows that product's stories and opens them in the same viewer.

## Who uses it

Shoppers viewing shop/customer stories that have a product attached. The link is set at authoring
time by sellers/admins (ST-03).

## How it works (verified behaviour)

- **Linking.** When a story is authored, a picked product's `id` and `slug` are stored on the story
  (`product_id`, `product_slug`) — see ST-03. `configureStory` copies these onto each normalized
  story item so the viewer can read them.
- **The CTA.** In the viewer, when the current item has a `product_slug` (and playback isn't paused),
  a **"View Product"** link renders. Tapping it:
  - navigates to the product detail page **`/{lang}/products/{product_slug}`**,
  - closes the viewer,
  - fires a PostHog `story_product_clicked` event (`{ story_id, product_slug, story_type }`).
- **Product-page story bar.** `ProductStoriesWrapper` fetches that product's stories server-side and
  only renders when there are any; `ProductStories` shows a horizontal row of thumbnail cards (a
  `#513aaf` ring when unseen), with infinite scroll (page size 10). Tapping a card opens the
  full-screen viewer for that product's stories.
- **Two link types.** A story may also carry a plain external `link`, which renders a separate
  "View More" CTA (`story_link_clicked`). The **product** CTA specifically builds the internal PDP
  URL from `product_slug`.

## Data source

| Item | Value |
|------|-------|
| Product link fields | `product_id`, `product_slug` on the story (set by `saveSellerStory`, ST-03) |
| Product stories (server initial) | `GET {NEXT_PUBLIC_STORIES_BACKEND_URL}/api/v1/stories/product_stories/{productId}?page=` (`GetProductStoriesData`, sends `USER-STORIES` cookie as bearer) |
| Product stories (client paging) | `GET /api/v1/stories/product_stories/{id}?page=` (`services/story.ts` `getStoriesForProducts`, page size 10) |
| CTA target | `NextLink` → `/{lang}/products/{product_slug}` |
| Analytics | PostHog `story_product_clicked` (product) / `story_link_clicked` (external link) |

## Technical reference

| Item | Value |
|------|-------|
| CTA render | `components/Home/Stories/StoryViewer.tsx` (`product_slug` → "View Product" `NextLink`) |
| Product story bar | `components/Server/product/ProductStoriesWrapper.tsx` → `components/products/ProductStories.tsx` |
| Mounted on PDP | `components/Product/ProductPageContent.tsx` (inside `Suspense`) |
| Normalization | `configureStory` copies `product_id`/`product_slug` (`services/story.ts`) |
| Events | `STORY_PRODUCT_CLICKED = "story_product_clicked"` (`utils/posthogEvents.ts`) |

## Current status & maturity

**Live.** Linking a product at authoring time and the "View Product" tap-through to the PDP both work,
and product stories have their own bar on the product page.

## Known gaps / notes


No dedicated gaps found.

## Related features

ST-03 (Seller/admin stories — sets the product link) · ST-01 (View stories — where the CTA renders) ·
SD-19 (Product page) · SD-28 (Share product).
