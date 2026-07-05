# ST-03 — Seller / Admin Stories

| | |
|---|---|
| **Feature ID** | ST-03 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/StoriesTab.tsx`, `services/sellerDashboard/index.ts`, `app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` |

---

## What it is

The seller/admin side of stories: from the Seller Dashboard, a shop can **publish, view and delete
its own shop stories**, optionally linking each one to a product (making it shoppable — see ST-04).
This is the authoring surface catalogued as **SL-10** in the Seller Dashboard.

## Where it appears

The **Stories** tab of the Seller Dashboard
(`app/(client)/[lang]/sellerProfile/sellerDashboard/[sellerId]/page.tsx` → `StoriesTab`). Published
shop stories then appear in the same customer-facing viewers as any other story (ST-01).

## Who uses it

Shop staff and admins, **permission-gated**: `READ_STORY` to see the tab, `CREATE_STORY` to add,
`DELETE_STORY` to remove — with `SUPER_ADMIN` implicitly granted all three.

## How it works (verified behaviour)

- **Create.** "Add Story" opens an upload modal. Media is chosen through the **OS file picker**
  (`.jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi`) — there is **no in-app camera capture** on the
  dashboard side. SVGs are rejected, images pass through a crop step, size is capped at **10 MB**, and
  video length at **60 seconds**.
- **Link a product.** A product-picker lists the shop's products; picking one stores its `id` and
  `slug` on the story (this is what makes it shoppable, ST-04).
- **Two-step publish.** The raw file is uploaded to the media server, then the story is saved to the
  stories backend with the shop's `seller_id`, the author's `user_id`, and the optional
  `product_id`/`product_slug`.
- **View.** Each story card opens a simple in-dashboard image/video modal showing the link, the
  linked product slug, the **viewers count** and the date (distinct from the customer full-screen
  player).
- **Delete.** A per-card delete (shown only with `DELETE_STORY`) asks for confirmation, then removes
  the shop story.
- **Seller vs customer stories differ in code:** seller stories use the hyphenated
  `add-seller-story` / `delete-seller-story` / `seller-stories` endpoints and carry a `seller_id`
  (the shop) plus optional product link; customer stories use `add_story` / `delete_story` /
  `users_stories` and carry no shop id or product link.

## Data source

| Item | Value |
|------|-------|
| List shop stories | `GET /api/v1/stories/seller-stories?user_id=&seller_id=&page=&perPage=` (`perPage` 20) |
| Create shop story | `POST /api/v1/stories/add-seller-story`, body `{ user_id, seller_id, file_path, is_video, link, product_id, product_slug, video_duration_in_second, order_detail_id: null }` |
| Delete shop story | `POST /api/v1/stories/delete-seller-story`, body `{ user_id, seller_id, story_id }` |
| Media upload | `POST {MEDIA_SERVER_BASE_URL}/upload` (or `/upload?story=true` for video), header `x-api-key` |
| Product picker | `getSellerProducts(sellerId, page)` |
| Server | `server: "stories"` → `NEXT_PUBLIC_STORIES_BACKEND_URL` |

## Technical reference

| Item | Value |
|------|-------|
| Authoring UI | `components/SellerDashboard/StoriesTab.tsx` (`UploadStoryModal`, `ProductPickerModal`, `StoryViewerModal`, `DeleteConfirmModal`) |
| Services | `saveSellerStory` / `getSellerStories` / `deleteSellerStory` / `uploadStoryToMediaServer` (`services/sellerDashboard/index.ts`) |
| Permissions | `READ_STORY` / `CREATE_STORY` / `DELETE_STORY` (or `SUPER_ADMIN`) — `hasPermission(...)` in the dashboard page |
| Limits | `MAX_FILE_SIZE_MB = 10`, `MAX_VIDEO_DURATION_SECONDS = 60` |
| Request codes | `SAVE_SELLER_STORY` 168, `GET_SELLER_STORIES` 167, `DELETE_SELLER_STORY` 169 (`utils/Requests.ts`) |

## Current status & maturity

**Live.** Create, view, delete and product-linking all work and are permission-gated. The dashboard
authoring path is file-upload only (no camera), which is by design here.

## Known gaps / notes


- Several dashboard strings (e.g. "1 minutes video only", "Linked product") are flagged as missing
  `ar`/`tr`/`ku` translations.

## Related features

ST-04 (Shoppable stories — the product link this creates) · ST-01 (View stories) · ST-05 (customer
delete) · SL-10 (Seller Dashboard → Seller stories, same surface) · SL-01 (My shops).
