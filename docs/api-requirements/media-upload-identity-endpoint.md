# API Requirement — Upload Identity & Permission Lookup

**Requested by:** Media server (`MediaServing`) — upload authorization rework
**Backend:** **Gateway** service — the one the frontend reaches via
`GO_BACKEND_URL` (rename pending, see CLAUDE.md "Stack-agnostic naming"). Same
service that owns `/auth/register-guest`.
**Auth:** the caller's market access token (`MARKET-TOKEN`), forwarded as a
bearer token.
**Design doc:** `docs/superpowers/specs/2026-07-29-media-upload-authorization-design.md`

## Why

Uploads to the media server are currently authorized by a single static API key
that is public (it ships in the browser bundle and is committed in a doc). It is
being removed entirely. In its place, the media server issues a short-lived,
single-use upload ticket, and it can only do that if it can answer one question:

> **Given this market access token — who is this, and are they allowed to upload
> files?**

The media server has no user database. It needs the gateway to answer.

## 1. New endpoint

`GET /me` *(name is the gateway team's choice — the contract below is what matters)*

### Request

```http
GET /me
Authorization: Bearer <market access token>
```

No body, no query parameters, no additional headers required.

### Success response (200)

```json
{
  "id": 12345,
  "user_type": "customer",
  "is_allowed_to_upload_files": true,
  "phone": "+9647701234567",
  "email": "seller@example.com"
}
```

| Field | Type | Contract |
|---|---|---|
| `id` | integer or string | **Required, never null.** Stable per user — the media server uses it as the rate-limit key, writes it to the upload logs, and stores it permanently on the uploaded object as the record of who uploaded it (§4). |
| `user_type` | string | **Required.** Must include a distinct value for guest tokens (e.g. `"guest"`). Please send the full list of possible values. |
| `is_allowed_to_upload_files` | boolean | **Required, always present, never null.** See §3. |
| `phone` | string or null | **Required field, value may be null.** The uploader's current phone. Recorded against the upload so support can reach whoever uploaded a file — see §4. |
| `email` | string or null | **Required field, value may be null.** Same purpose as `phone`. |

`phone` and `email` may be `null` (a user may genuinely have neither), but the
keys must always be present so the media server can tell "no value" from "field
not implemented".

The media server treats a **missing or null** `is_allowed_to_upload_files` as
`false` (fail closed), so the field must always be sent explicitly.

### Error responses

| Status | When | Media server behaviour |
|---|---|---|
| 401 | Token missing, invalid, expired, or revoked | Ticket request fails 401 |
| 403 | Token valid but the caller may not use this endpoint | Ticket request fails 403 |
| 5xx / timeout | Gateway unavailable | Ticket request fails 503 — **never** falls back to allowing the upload |

The error body is not parsed and is never forwarded to the end client — the
media server substitutes its own message. Please do not return framework or
stack details in it either way (security rule: nothing reaching a client may
name the backend technology).

## 2. Behavioural requirements

These matter as much as the shape:

1. **Read-only, no side effects.** This is a pure lookup. It must **not**
   auto-register a guest on an invalid token, rotate/refresh the token, or
   change any state. An invalid token must return **401**, not a freshly-minted
   guest identity. *(The core backend's authed-fetch path does auto-register a
   guest on 401 — this endpoint must not.)*
2. **Guests return 200, not an error.** A guest token is a valid token; return
   `200` with `user_type: "guest"`. The media server decides the 403, not the
   gateway. This keeps "who are you" and "may you upload" separable.
3. **On the hot path.** This is called once per upload ticket, i.e. once per
   file the user uploads. Target **p95 ≤ 200 ms**.
4. **Not rate-limited against the media server.** All calls arrive from the
   media server's IP(s) and will look like a single very busy client. Please
   allowlist those IPs, or key any limit on the bearer token rather than the
   source IP. A 429 here blocks a real user's upload.
5. **Reachable from the media server's network** (it is a separate deployment
   from the storefront).

## 3. The permission flag — needs a decision

`is_allowed_to_upload_files` is new. Before this can be built we need from the
gateway/product side:

- **Default per `user_type`** — our assumption is guests `false`, verified
  sellers `true`. Please confirm the full matrix.
- **Who sets it** — automatic from account state (verified / has a shop / not
  banned), or an explicit admin-controlled field?
- **What revokes it**, and how quickly a revocation must take effect. This
  determines whether the media server may cache the lookup (we would like a
  ~30 s cache to absorb bulk uploads; that means a revoked user keeps uploading
  for up to 30 s).

If the flag cannot be delivered in the first pass, the media server can ship
against `user_type` alone (block guests) — but the flag is the control we
actually need, since a verified customer is not automatically someone who should
be able to write to our storage.

## 4. What the media server does with phone and email

Every upload must be attributable to a person. That attribution is recorded in
two places, and the split is deliberate:

| Where | What is written | Why there |
|---|---|---|
| **The upload log line** | `user_id`, `user_type`, `phone`, `email`, `ticket_jti` | A log entry is a *point-in-time* record. "At 10:22 on 29 Jul the uploader's phone was X" stays a true statement forever, even after the user changes it. This is where a contact snapshot belongs, and it means investigating a recent upload needs no lookup at all. |
| **The S3 object metadata** | `user-id`, `user-type`, `ticket-jti`, `uploaded-at` — **identifiers only** | S3 object metadata **cannot be edited in place**; changing one value means copying the whole object over itself. `user_id` never changes, so it is correct for the life of the file. A phone/email snapshot there would go stale on the next profile edit, could point at a different person once a number is recycled, and would turn an erasure request into a rewrite of every object that user ever uploaded. |

So: the gateway sends the contact details, the media server records them where a
snapshot is meaningful, and the permanent record on the file stays an
identifier that can never become wrong.

Nothing else is done with `phone`/`email` — they are not stored in a database,
not returned to any client, and not used for any lookup.

### 4a. Separate, non-blocking: an admin lookup by user id

For a file older than the log retention window, investigation ends at a
`user_id` and needs one more step: **id → current phone/email**, for an
admin/support user.

- If the existing admin panel already answers that, nothing is needed — just
  confirm and we will point the runbook at it.
- If not, we would like a small admin-only lookup endpoint.

This is **not** on the upload path and must not block §1.

## 5. How it is used (for context)

```
1. User presses Upload in the storefront or the mobile app.
2. Caller asks the media server for a ticket, sending the market access token.
3. Media server calls THIS endpoint with that token.
   - 401/403/5xx      → ticket refused, upload never starts
   - user_type=guest  → 403
   - is_allowed_to_upload_files=false → 403
   - otherwise        → a 120-second, single-use ticket scoped to one file
4. Caller uploads the file with that ticket. The gateway is not involved again.
5. The upload is logged with id / user_type / phone / email / jti, and the
   stored object is stamped with user-id / user-type / ticket-jti /
   uploaded-at, so the uploader is identifiable for the life of the file.
```

The gateway is called **once per upload**, before any bytes move — never during
the transfer. Step 5 uses only what step 3 already returned; it makes no further
call.
