# ST-02 — Post a Customer Story

| | |
|---|---|
| **Feature ID** | ST-02 |
| **Domain** | F · Stories |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-27 (against `develop`) |
| **Source of truth** | `components/Home/Stories/AddStoryWidget.tsx`, `components/Home/Stories/CameraStory.tsx`, `components/Home/AddStory.tsx`, `services/story.ts` |

---

## What it is

Lets a shopper create their own story — either by **uploading a photo/video from the gallery** or by
**capturing one with the live in-app camera** — and publish it to the stories bar.

## Where it appears

The "+" tile at the start of the homepage stories bar (`AddStory.tsx`, icon `chatplus.svg`). It is
shown only to users whose account carries `is_allowed_to_upload_story`.

## Who uses it

Signed-in shoppers. Tapping the tile requires a valid phone (else it opens login) and a real display
name (else it prompts for a name first); guests are routed through sign-in.

## How it works (verified behaviour)

- **Gallery upload.** "Upload Photo/Video" opens a file picker accepting
  `.jpg,.jpeg,.png,.gif,.mp4,.mov,.3gp,.avi`. SVGs are rejected. Photos pass through an image-crop
  step before preview; videos preview directly.
- **Live camera** (`CameraStory.tsx`, `react-webcam`). Has **Photo** and **Video** tabs; defaults to
  the **front** camera (`facingMode: "user"`) with a flip-to-rear button (disabled when only one
  camera exists). Photos are captured as WebP; videos are recorded via `MediaRecorder` (WebM), with
  audio only when microphone permission is granted.
- **Limits.** Max file size **10 MB**; video length capped at **~59 seconds / "1 minute"** (enforced
  on both the gallery and camera paths — camera recording auto-stops at the cap).
- **Optional link.** The only extra field is a free-form **URL** ("link"), validated and prefixed
  with `https://` if no protocol is given. There is **no caption field** and **no product-link
  picker** in the customer create flow.
- **Two-step publish.** The media is first uploaded to the media server, then a story record is
  created. On success the bar refetches, `router.refresh()` runs, a PostHog `STORY_UPLOADED` event
  fires (`{ media_type, has_link }`), and a "Story Uploaded" toast shows.

## Data source

| Item | Value |
|------|-------|
| Media upload | `POST {NEXT_PUBLIC_MEDIA_SERVER_BASE_URL}/upload` (images) / `/upload?story=true` (videos), header `x-api-key` (`services/story.ts` `uploadToMediaServer`) |
| Create story | `POST /api/v1/stories/add_story`, `server: "stories"`, body `{ file_path, video_duration_in_second, is_video, link }` (`services/story.ts` `upload`) |
| Refresh bar | `fetchStoriesForUser(language, country, 1)` server action + `router.refresh()` |
| Store slice | `store/homepage/reducer.ts` — `addStoryEnable`, `OpenCamera`, `storiesRefreshing`, `setStoryData`; camera permission via `cameraPermissions` in `store/index.ts` |

## Technical reference

| Item | Value |
|------|-------|
| Create modal | `components/Home/Stories/AddStoryWidget.tsx` (renders only when `addStoryEnable`), **lazy-loaded** via `AddStoryWidgetLazy.tsx` with a matching skeleton — the camera code is not downloaded until the shopper taps "+" |
| Trigger tile | `components/Home/AddStory.tsx` (`data-cy="Add-Story-Button"`, gated on `is_allowed_to_upload_story`) |
| Camera | `components/Home/Stories/CameraStory.tsx` (`NewStoryModal`) |
| Limits | `MAX_FILE_SIZE_MB = 10`; video cap at 59 s ("1 minutes video only") |
| Request codes | `UPLOAD_STORY` code 49 (`utils/Requests.ts`) |

## Current status & maturity

**Live.** Both upload and live-camera capture are genuinely implemented, with crop, size/duration
validation and an optional link.

## Known gaps / notes

No dedicated gaps found.

## Related features

ST-01 (View stories) · ST-05 (Delete own story) · ST-03 (Seller/admin stories — the dashboard-side
authoring) · SD-01 (Homepage feed).
