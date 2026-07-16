# SL-10 — Seller Stories

| | |
|---|---|
| **Feature ID** | SL-10 |
| **Domain** | H · Seller Dashboard |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-07 (against `develop`) |
| **Source of truth** | `components/SellerDashboard/StoriesTab.tsx`, `services/sellerDashboard/index.ts` |

---

## What it is

The **Stories** tab — where a seller creates, views and deletes their shop's Instagram-style
photo/video stories. A story can carry a link and can be made **shoppable** by attaching one of the
shop's products.

## Where it appears

- Inside the seller dashboard → **Stories** tab.
- The published stories are what shoppers see in the storefront (Domain F, ST-03 seller/admin
  stories).

## Who uses it

**Sellers / shop staff.** Viewing needs `READ_STORY`; creating needs `CREATE_STORY`; deleting needs
`DELETE_STORY`.

## How it works (verified behaviour)

- **View:** a grid of story cards (9:16 thumbnail, Photo/Video badge, viewer count, date, link,
  linked-product slug), with Prev/Next pagination. Tapping a card opens a full viewer that plays the
  video or shows the image.
- **Create** (with create permission): choose a photo or video **from the file picker** (no live
  camera in the seller flow); images pass through a crop widget, videos preview directly. Optionally
  add a validated **link**, and optionally attach a **product** (via a product picker) to make the
  story shoppable. On save the media is uploaded to the media server, then the story metadata is
  saved.
- **Media limits (enforced client-side):** max **10 MB** per file; video max **60 seconds**; SVG
  blocked; accepted types `jpg/jpeg/png/gif/mp4/mov/3gp/avi`.
- **Delete** (with delete permission): a confirmation modal, then the story is removed from the list.

## Data source

| Item | Value |
|------|-------|
| List | `getSellerStories` → **GET `/api/v1/stories/seller-stories`** (`stories` backend) |
| Create | `saveSellerStory` → **POST `/api/v1/stories/add-seller-story`** |
| Delete | `deleteSellerStory` → **POST `/api/v1/stories/delete-seller-story`** (POST, not DELETE) |
| Media upload | `uploadStoryToMediaServer` → **POST `{MEDIA_SERVER}/upload`** (`/upload?story=true` for video) |
| Product picker | `getSellerProducts` → **GET `/shop/products`** (`market-dashboard`) |

## Technical reference

| Item | Value |
|------|-------|
| Component | `components/SellerDashboard/StoriesTab.tsx` (`UploadStoryModal`, `ProductPickerModal`, `StoryViewerModal`) |
| Stories backend | `server: "stories"` (`NEXT_PUBLIC_STORIES_BACKEND_URL`) |
| Permission gates | `READ_ / CREATE_ / DELETE_STORY` (or `SUPER_ADMIN`) |
| State | Local `useState`; notifications via the store's notifications slice |

## Current status & maturity

Live and stable. Create (with crop, link, and shoppable product), paginated viewing, and delete all
work, each behind its own permission, with client-side media validation.

## Known gaps / notes

- All media validation (10 MB / 60 s / type) is **client-side only**; no server-side enforcement is
  visible in this codebase.
- The media API key is a public (`NEXT_PUBLIC_`) env var sent as `x-api-key` **from the browser** — a
  client-exposed media key.
- A couple of validation messages are built with interpolated strings (e.g. "File size should not
  exceed 10 MB"), which won't match a stable translation key and so likely won't translate.
- The seller create action emits no analytics event (unlike the customer story-upload flow).

## Related features

ST-03 (Seller / admin stories — the shopper-facing view) · ST-04 (Shoppable stories) · SL-03
(Product management, source of the linkable products).
