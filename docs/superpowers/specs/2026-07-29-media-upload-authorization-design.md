# Media Upload Authorization — Design

**Status:** decisions agreed, not implemented
**Repos touched:** `MediaServing` (most of the work), `trydos` (client + mint route), gateway backend (one new endpoint — see `docs/api-requirements/media-upload-identity-endpoint.md`)

## 1. Problem

Every upload to the media server is authorized by a single static `API_KEY`
(`MediaServing/src/middleware/auth.js:20-23`). That key is public in three
independent ways:

| Leak | Where |
|---|---|
| Shipped in the browser bundle | `NEXT_PUBLIC_MEDIA_API_KEY` — `services/story.ts:15`, `services/sellerDashboard/index.ts:7`, `services/sellerDashboard/comments.ts:19`, `services/order.ts:33`, `services/auth.ts:881` |
| Injected into public, unauthenticated HTML | `MediaServing/src/app.js:255-256` (`/test`), `:267-268` (`/compare`), `src/api/stats.js:107-108` (`/stats`) — all allowlisted at `auth.js:6-11` and rate-limit exempt |
| Committed in plaintext | `docs/mobile-seller-dashboard-api-guide.md:19`, in git history since `d4caa03c` |

Anyone can therefore upload anything, into any folder, at any size, anonymously.
Three further defects compound it:

- **No content validation on media.** `upload.js` trusts the client filename and
  mimetype (`resolveExtension`, `upload.js:36-43`). Bytes named `x.html` with
  `Content-Type: text/html` are stored, then replayed by `sendOriginal`
  (`transform.js:861-874`) as `text/html` with `Content-Disposition: inline` —
  stored XSS on the media origin. `nosniff` does not help when the declared type
  *is* `text/html`. The `f_svg` passthrough (`transform.js:400-402`) is the same
  hole.
- **No folder validation.** `saveUploadedImage` (`upload.js:54-56`) interpolates
  the client's `folder` field straight into the S3 key, with no `sanitizeFolder`
  (unlike `files.js:133-142`). Any caller can write into `customers/profile` —
  special-cased at `upload.js:70-72` to return a bare URL — or into `../..`.
- **Rate limiting is keyed on the shared key** (`app.js:162-165`), so the whole
  platform shares one bucket of 20 uploads/min.

## 2. Approach

Replace the static key with a **two-stage upload**: the caller first proves who
it is and gets a short-lived, single-use, tightly-scoped **ticket**; the upload
itself is authorized only by that ticket.

```
                    ┌─ web ─────────────────────────────────────────┐
browser ── POST /api/media/ticket ──► Trydos route (reads HttpOnly
                                       MARKET-TOKEN cookie)
                                             │
                    └─────────────────────────┼─────────────────────┘
                                              │  Authorization: Bearer <market token>
mobile app ───────────────────────────────────┤
                                              ▼
                                   media server  POST /ticket
                                              │
                                              ▼  identity + permission
                                        gateway  GET /me
                                              │
                                   { ticket, expires_in }
                                              │
caller ── POST /upload  (X-Upload-Ticket: …) ─┘
```

The ticket is minted for **one specific upload** and the upload is checked
against what the ticket says.

## 3. Decisions

### Authorization

| # | Decision | Rationale |
|---|---|---|
| D1 | **`API_KEY` is removed entirely** from the media server. `x-api-key` is not accepted on any route, not even as a fallback. | A retained fallback is a retained bypass — everything below would be one curl away. |
| D2 | **All debug pages are removed**: `/test`, `/test.html`, `/compare`, `/compare.html`, `/stats`, `/stats.html`, and the Loki LogQL proxy behind stats. | Each injects the key into public HTML; stats additionally proxies arbitrary LogQL unauthenticated. |
| D3 | Upload authorization is a **two-stage ticket flow** (`POST /ticket` → `POST /upload`). | Per-user, per-upload, short-lived capability instead of one shared forever-secret. |
| D4 | Identity is resolved by calling the **gateway** with the caller's market access token. `user_type: guest` **or** `is_allowed_to_upload_files: false` → **403**. | The media server holds no user database; the gateway is the authority. |
| D5 | **The web client mints through a Trydos API route** (`POST /api/media/ticket`) which reads the HttpOnly `MARKET-TOKEN` cookie server-side. The mobile app calls `POST /ticket` directly with its own token. | `MARKET-TOKEN` is HttpOnly by design — the browser *cannot* attach it cross-origin, and exposing it to JS would be a regression. One code path on the media server, two callers. |
| D6 | When the gateway call fails, **the ticket request fails with the same status** (401 / 403 / 5xx). Fail closed — never "allow on error". | An identity service outage must not become an open upload endpoint. |
| D6a | The gateway's **raw error body is never forwarded** to the caller; the media server maps it to its own message. | CLAUDE.md stack-agnostic rule: nothing reaching the client may name the backend technology. |

### Ticket contents

| # | Decision | Rationale |
|---|---|---|
| D7 | The ticket binds **`user_id`, `folder`, `resource_type`, `max_bytes`, `count` (default 1), `jti`**. The upload validates every one of them and returns **403** on any mismatch. | A ticket that says only "may upload a file" is redeemable for a 512 MB spreadsheet in someone else's folder, 200 times. |
| D8 | The client sends a **`purpose`** (`product_image`, `story`, `profile`, `shop_banner`, `excel_import`, …); the **server** derives folder, allowed types and size limit from it. The client's `folder` form field is ignored entirely. | The browser can never invent a folder name; adding an upload location is one server-side table entry. |
| D9 | Size is checked **twice** — at mint against the declared `size`, and during receive against the real byte count. | The declared size is a client claim; the mint-time check just avoids moving bytes that will be rejected. |
| D10 | The ticket is an **opaque random token stored in Redis**, not a JWT. | Redis is already wired (`services/lockService.js`); it gives expiry, single-use and revocation for free, with no signing key to manage. A JWT can be neither used-up nor cancelled. |
| D11 | **Single use.** The ticket is deleted **when the upload request starts**, atomically (`GETDEL`, or `DEL` checking it returned 1). | Deleting at the end lets two concurrent requests both pass the opening check. |

### Ticket transport and lifetime

| # | Decision | Rationale |
|---|---|---|
| D12 | Sent as the **`X-Upload-Ticket` header**. No cookies, no `credentials: "include"`. | A cross-origin cookie needs `SameSite=None` (blocked/evicted by Safari — silent, user-specific breakage) and is attached automatically by the browser, which is CSRF. A header is attached deliberately, on one request, and behaves identically in every browser and in the mobile app. |
| D13 | **TTL 120 s**, and it is a **start** deadline, not a completion deadline: the ticket is validated once when the request arrives, before reading the body, and never looked at again while bytes stream. | A completion deadline fails a slow 10 MB mobile upload at 100 % progress — the worst possible moment. Once the ticket is single-use and scoped, a tighter TTL buys nothing; 120 s absorbs the extra Trydos hop. |
| D14 | The ticket is minted **at the moment the user presses Upload**, never on page load or file-picker open. The client **silently re-mints once and retries** on expired/invalid; the user never sees that error. | The TTL is only sufficient if nothing sits between minting and sending. |

### Validation and abuse control

| # | Decision | Rationale |
|---|---|---|
| D15 | **Folder validation**: folder comes from the ticket (D8); the request field is dropped. | Closes `upload.js:54-56`. |
| D16 | **File validation**: extension + mimetype allowlist per `resource_type`; the stored extension is derived from **sniffed magic bytes**, not the client filename; images are rejected if Sharp cannot decode them; SVG is **never served inline** (the `f_svg` passthrough goes); anything not a known-safe image/video is served `Content-Disposition: attachment`. | Closes the stored-XSS path (`upload.js:36-43` → `transform.js:861-874`, `:400-402`). Mirrors the magic-byte check `files.js:74-101` already does for Excel. |
| D17 | **Per-user rate limit**, keyed by `user_id` from the ticket. `POST /ticket` itself is keyed by IP (no identity is known yet). | Replaces `app.js:162-165`, where one shared bucket means one abuser throttles everyone. |
| D18 | **Every stored object carries durable attribution in its S3 object metadata**: `user-id`, `user-type`, `ticket-jti`, `uploaded-at`. | Today no upload is attributable to a person. Logs alone are not enough — Loki retention expires, the objects do not; the answer to "who uploaded this file" must live on the file. |
| D18a | **Only identifiers go on the object — never phone or email.** | **S3 object metadata cannot be edited in place** — changing one value means copying the whole object over itself. `user_id` never changes, so it is correct forever; a phone/email snapshot goes stale the moment the user edits their profile, can point at a different real person once a number is recycled, and turns an erasure request into a copy-rewrite of every object that user ever uploaded. Keeping PII off the object also means a future direct-to-S3 CDN origin cannot leak `x-amz-meta-*` to viewers (today's CloudFront fronts the app, not S3 — `CLOUDFRONT_CDN_ROLLOUT.md` §2 — so this is a guard against a later change, not a current hole). |
| D18b | **The contact snapshot goes in the upload log line instead**: `user_id`, `user_type`, `phone`, `email`, `ticket_jti` in `request._logExtra`. The gateway returns `phone`/`email` for this purpose (`docs/api-requirements/media-upload-identity-endpoint.md` §4). | A log entry is inherently point-in-time — "at 10:22 the uploader's phone was X" stays true forever, so a snapshot is *correct* there in a way it is not on an immutable object. It also means investigating a recent upload needs no lookup at all; §6.6a is then only needed for files older than log retention. |
| D18c | `phone`/`email` are used for **nothing else** — not stored in any database, never returned to a client, never used as a lookup key. | Their only job is the log snapshot in D18b. |
| D19 | **No byte quota** — accepted risk. | Deliberate simplicity trade. See §6. |

### Migration

| # | Decision | Rationale |
|---|---|---|
| D20 | **All five Trydos call sites migrate** to the ticket flow: `services/story.ts`, `services/sellerDashboard/index.ts`, `services/sellerDashboard/comments.ts`, `services/order.ts:33`, `services/auth.ts:881-895`. | They are the only in-app senders of `x-api-key`. |
| D21 | `NEXT_PUBLIC_MEDIA_API_KEY` is deleted from the env, the bundle and `docs/mobile-seller-dashboard-api-guide.md:19`. The key value is **rotated/retired** regardless, since it is in git history. | Removing the reference does not un-leak a committed secret. |
| D22 | **`src/scripts/fetch-and-upload.js` is removed** (`:43`, `:348` — its only credential was `API_KEY`). | Operator tooling that needs to write goes directly to S3 with real S3 credentials, not through a public HTTP endpoint. |
| D23 | The **mobile app must cut over** — it authenticates with the same key today (`docs/mobile-seller-dashboard-api-guide.md:32,303`). Removing the key is a **breaking change for shipped builds**. | No deprecation window is planned, because a window means the key survives and the bypass with it. Release coordination is required — see §6. |

## 4. Rejected alternatives

| Rejected | Why |
|---|---|
| Keep `x-api-key` as a fallback for mobile/scripts during a transition | Any accepted fallback is the bypass; the ticket work becomes decorative. |
| JWT ticket signed with a media-server secret | Cannot be single-use or revoked, and adds key management for no gain over Redis, which is already running. |
| Ticket in a cookie | `SameSite=None` cross-origin breakage plus CSRF, for zero benefit over a header. |
| 60 s TTL meaning "upload must finish" | Fails slow large uploads at 100 % progress. |
| Re-sending the market access token on the upload call alongside the ticket | Redundant — the ticket already carries the verified identity — and it spreads the real credential to a second origin and a second log stream. |
| Storing the uploader's phone/email in the object metadata | The attribution requirement is real and accepted (D18/D18b); the object is the wrong carrier for a PII snapshot. S3 metadata is immutable in place, so it cannot be corrected or erased without rewriting every object — and it is wrong as soon as the user edits their profile. The snapshot goes in the log line, where point-in-time is the correct semantic. |
| Byte quota / per-upload accounting table | Deliberately dropped (D19). Note this also rules out the side-record variant of D18a — attribution lives on the object only. |

## 5. Scope of work

**MediaServing**
- `src/middleware/auth.js` — delete the `API_KEY` check; delivery GETs stay public; upload routes require a ticket. (`/health` and `/metrics` stay open — see §6.)
- `src/app.js` — remove `/test*`, `/compare*` and their key injection (`:252-300`); remove `serveTestPage`/`serveComparePage`; re-key the rate limiter (`:162-165`).
- `src/api/stats.js` — removed with the route registration in `app.js:305`.
- **New** `src/api/ticket.js` — `POST /ticket`, gateway call, purpose→policy table, Redis write.
- **New** `src/services/ticketService.js` — mint / redeem (`GETDEL`) / validate.
- `src/storage/s3Client.js` — `putObject` (`:70-75`) and `uploadStream` (`:97`) take an optional `metadata` argument; today neither writes any.
- `src/api/upload.js` — ticket redemption at request start; folder from the ticket; per-type allowlist + magic-byte sniffing; attribution metadata on the object (D18) and in `_logExtra`.
- `src/api/files.js` — same redemption and same attribution metadata for `/upload/excel`.
- `src/api/transform.js` — drop the `f_svg` inline passthrough (`:400-402`); safe `Content-Disposition` in `sendOriginal` (`:861-874`).
- `src/scripts/fetch-and-upload.js` — deleted.
- `.env.*` — `API_KEY` out; gateway base URL + timeout in.

**trydos**
- **New** `app/api/media/ticket/route.ts` — reads `MARKET-TOKEN`, calls the media server, returns only `{ ticket, expires_in }`.
- The five call sites in D20 — mint, then upload with `X-Upload-Ticket`, with one silent re-mint on 401/403-expired.
- `docs/mobile-seller-dashboard-api-guide.md` — key removed, flow rewritten.
- Env: `NEXT_PUBLIC_MEDIA_API_KEY` deleted. `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` stays (it builds public image `src` URLs).

**Gateway** — one new endpoint. Full contract in
`docs/api-requirements/media-upload-identity-endpoint.md`.

## 6. Open questions

1. **Does `is_allowed_to_upload_files` exist yet?** Who sets it, what is the
   default per `user_type`, and what revokes it. Blocks the gateway work.
2. **Gateway `/me` caching.** A 50-file bulk session would call the gateway once
   per ticket. A short cache (~30 s, keyed by token hash) would absorb that, at
   the cost of revocation lag. Undecided — depends on the latency the gateway
   can commit to.
3. **The `purpose` table.** The list in D8 is provisional; it must be enumerated
   against every real upload site before implementation, with each entry's
   folder, allowed types, `max_bytes` and `count`.
4. **Mobile cutover coordination** (D23) — this is a hard flag day for shipped
   builds. Needs a release plan agreed with the mobile team before the key is
   removed in production.
5. **`/metrics` and `/health`** stay unauthenticated after D1, since there is no
   longer a key to protect them with. `/metrics` exposes operational data and
   probably wants network-level restriction instead.
6. **Existing objects.** Everything already uploaded has no owner recorded, so
   the D18 attribution starts from zero. No backfill is possible — the
   information does not exist anywhere.
6a. **The investigation lookup path** (D18a). For a file **older than the log
   retention window**, answering "who is `x-amz-meta-user-id: 12345`" needs
   someone able to resolve an id to a person; within retention, D18b already
   answers it. If the existing admin panel does this lookup, nothing more is
   needed; if not, the gateway owes us a small admin-only endpoint. Not on the
   upload hot path — it must not block the rest of this work.
6b. **PII now enters the logs** (D18b). Two consequences to settle with whoever
   owns observability: Loki/Grafana access must be restricted to people allowed
   to see customer contact details (today `GRAFANA_TOKEN`/`GRAFANA_URL` are just
   env values, and the stats proxy that exposed them is being deleted under D2),
   and the log retention window becomes the de-facto retention period for that
   snapshot. `app.js:90-93` already redacts `x-api-key`/`authorization` — these
   fields are deliberately *not* redacted, which is the point, so the control
   has to be access, not redaction.
7. **No byte quota (D19)** means a permitted account can sustain roughly
   20 × 10 MB/min indefinitely, and a farm of accounts multiplies it. The control
   we would reach for later is per-upload accounting (`user_id`, `key`, `size`,
   timestamp) — cheap to add now, painful to backfill later. Recorded as an
   accepted risk, not an oversight.

## 7. Sequencing

1. Rotate/retire the key; remove `/test*`, `/compare*`, `/stats*`; purge the doc leak. *(Standalone — exploitable today, no dependency on the ticket work.)*
2. File + folder validation, SVG passthrough removal, safe content disposition. *(Also standalone.)*
3. Gateway endpoint delivered (§6.1 must be answered first).
4. `POST /ticket` + Redis ticket service + upload redemption.
5. Trydos mint route + five call sites; mobile cutover.
6. `API_KEY` deleted from the media server; per-user rate limit; `user_id` in logs.

Steps 1–2 ship independently and should not wait for the gateway.
