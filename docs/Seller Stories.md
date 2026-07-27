## Seller Stories

Per-shop stories (image or short video, video ≤ 60 s / ≤ 10 MB), optionally with an
outbound link and/or linked to a product.

> Uses `{STORIES_API}` and the **STORIES token** — not the market token — and **no**
> `X-Seller-ID` (the shop is the `seller_id` field in the query/body).

| Action | Method | Path | Permission |
|--------|--------|------|------------|
| List | GET | `{STORIES_API}/api/v1/stories/seller-stories?user_id=&seller_id=&page=&perPage=` | `READ_STORY` |
| Add | POST | `{STORIES_API}/api/v1/stories/add-seller-story` | `CREATE_STORY` |
| Delete | POST | `{STORIES_API}/api/v1/stories/delete-seller-story` | `DELETE_STORY` |

- Upload the media to `{MEDIA}` first (folder `stories`; video uses
  `?story=true`), then send `file_path` = `{MEDIA}` + the returned URL.
- **Add body** (note singular `video_duration_in_second`):
  ```jsonc
  {
    "user_id": <the logged-in user id>,   // NOT the shop id
    "seller_id": <shop id>,
    "file_path": "<full media URL>",
    "is_video": 0 | 1,
    "link": "<https url>" | null,
    "product_id": <id> | null,
    "product_slug": "<slug>" | null,
    "video_duration_in_second": <int>,
    "order_detail_id": null
  }
  ```
- **Delete body:** `{ user_id, seller_id, story_id }`.
- **List** may return the array at `data.data` / `data.stories` / `data`, flat or
  grouped (each group has a nested `stories[]`); `perPage` defaults to 20.

**Gotcha:** `user_id` (the logged-in user) and `seller_id` (the shop) are two
different ids — both required.

---
