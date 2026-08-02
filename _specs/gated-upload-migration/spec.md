---
ticket: gated-upload-migration
stage: spec
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-30
links:
  clickup:
  github:
---

# Spec — gated-upload-migration

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Gated uploads behind one upload service

## Business Goal

Every upload today is authorised by one shared key that ships inside the browser
bundle. Anyone who reads the bundle can upload anything, anywhere, as nobody. The
media server now offers a gated API where each upload is authorised by the person
making it: the app asks for a short-lived, single-use permission (a "ticket") with
the user's own access token, then spends that ticket on the upload.

Moving to it gives us three things: an upload is tied to a real account, the shared
key stops being a live credential in the app, and all the upload rules live in one
place instead of six copies — so the next change to those rules is made once.

## User Story

> As a **signed-in shopper or seller**, I want my photos, videos and spreadsheets
> to upload with my own permission instead of a key that ships in the browser, so
> that my uploads are tied to my account and a stranger cannot upload in my place.

> As a **developer of this app**, I want one upload service that every screen
> calls, so that a change to the upload rules is made once instead of in six
> copies, and no screen is left behind on the old route.

> As a **user whose session has expired mid-upload**, I want the app to react the
> way it does everywhere else it hits a signed-out response, so that I get the
> normal sign-in flow instead of a dead upload button.

## Functional Requirements

- **FR-1 — One upload service.** Every upload in the app goes through a single
  shared upload service. No screen and no other service keeps its own upload code,
  its own media base URL, or its own upload error handling.
- **FR-2 — Two steps, in the right order.** An upload asks for a ticket first and
  then sends the file. The ticket is asked for at the moment the file is sent, never
  earlier (not on page load, not when the file picker opens). One request uses one
  ticket: a bulk upload of many files is one request and needs one ticket, while two
  single uploads need two tickets.
- **FR-3 — The user's own identity, never exposed to the browser.** The ticket is
  minted with the signed-in user's access token. That token is never readable by
  page JavaScript and never leaves our own server, so the minting step happens
  server-side on our side.
- **FR-4 — Every upload uses its matching gated route.** Single uploads, bulk image
  uploads, Excel uploads and chat attachments each use the gated route for that
  job. No upload sends the shared key any more, and no upload sends `folder`,
  `count` or the story flag with the file — those now belong to the ticket request.
- **FR-5 — Each upload keeps landing where it lands today.** Every upload keeps the
  same storage folder it uses now (user and seller stories, product images, product
  meta images, product videos, shop logo and banner, boutique icons and banners,
  Excel files, return photos, rating photos, profile pictures). The story flag is
  used only where it is used today — story **videos** — and not for story images.
- **FR-6 — A `401` behaves exactly like a `401` from any other market server API.**
  An expired session during an upload runs the app's existing recovery (refresh the
  session, then the existing "please log in again" / verify prompt) and the upload
  continues by itself once the session is back. Uploads must not invent their own
  sign-in error.
- **FR-7 — A refused identity asks the user to sign in.** If minting is refused
  because the identity is not allowed to upload, and the app cannot recover the
  session by itself, the user sees the app's normal sign-in prompt and the upload
  resumes after they sign in. The app never silently continues as a guest and never
  leaves the upload button dead with no explanation.
- **FR-8 — The four failure kinds are told apart.** Session expired, not allowed to
  upload, file too large, and service busy each produce their own clear message.
  "File too large" is never retried; "service busy" may be retried.
- **FR-9 — One silent retry for a spent or expired ticket.** A ticket is single use
  and a failed upload uses it up, so a retry always starts again from the ticket
  request. The app retries this way at most once without telling the user; a second
  failure produces a message.
- **FR-10 — Bulk uploads are images only, and the count matches.** Videos never go
  into a bulk upload; they go one at a time through the single upload. The number of
  files declared when asking for the ticket is exactly the number of files sent. If
  the server reports files it skipped, the user is told which ones did not upload.
- **FR-11 — The Excel import keeps working.** The gated Excel response no longer
  carries a ready-made URL, so the app builds the full file URL from the returned
  key and passes that to the Excel import, which keeps receiving the same shape of
  value it receives today.
- **FR-12 — Chat attachments move to the gated chat upload.** Chat attachments are
  uploaded through the gated chat route instead of the chat backend. Files already
  attached to older messages keep opening and downloading as they do today.
- **FR-13 — The shared key is gone from the app.** No code path sends the shared
  upload key, and the key is removed from the app's configuration. The dead
  seller-comments Excel upload and the unused "upload story" request type are
  removed with it.
- **FR-14 — Client-side file checks match the new limits.** Where a screen checks a
  file's size before uploading, that check matches the new server limits: 100 MB for
  a normal upload, 10 MB for a story upload, 25 MB for a chat attachment, 512 MB for
  an Excel file.
- **FR-15 — Every new message is translated.** Any new user-visible text has an
  Arabic, Turkish and Kurdish entry in the translation files before the code uses
  it.

## Non-Functional Requirements

- **NFR-1 — File bytes never pass through our own server.** Only the small ticket
  request does. A 512 MB Excel file and a 100 MB video must still upload.
- **NFR-2 — No credential reaches page JavaScript.** Neither the user's access
  token nor a long-lived upload credential is readable by the browser. A ticket is
  short-lived and single-use, so it is the only upload credential the browser holds.
- **NFR-3 — Nothing tells the browser what the backend is built with.** No message,
  response field, log line or identifier that can reach the client names the
  technology behind any service.
- **NFR-4 — No new upload failures for a working session.** A signed-in user who
  can upload today can upload every one of the same file kinds afterwards, with no
  extra prompt and no extra step they have to take.
- **NFR-5 — Delivery is untouched.** The URLs that display and download already
  uploaded files do not change, and existing files keep working.
- **NFR-6 — The repository checks stay clean.** Type checking, linting, the
  translation-parity check, the production build and the unused-code check all pass.

## Constraints

- The old upload routes still work on the media server, so this is a gradual move
  and not a flag day. Removing them is a later ticket.
- A ticket lives 120 seconds, is single use, and covers one request.
- Size limits are fixed by the server: 100 MB for a normal upload, 10 MB for a
  story upload, 25 MB for a chat attachment, 512 MB for an Excel file.
- The storage folder must be `/`-separated segments of letters, digits, dots,
  underscores and hyphens — no `.` or `..` segments, no leading or trailing `/`.
  A bad folder is refused when the ticket is requested, before any bytes are sent.
- The server decides the stored file name and the file type from the file's own
  bytes. The app's file name and content type are ignored, so the app cannot rely on
  either to control what is stored.
- The user's access token lives in a browser cookie that page JavaScript cannot
  read and that the browser will not attach to another site's request.
- Nothing is rejected for its file type. An unrecognised file uploads fine; it just
  downloads instead of displaying.
- The change depends on the media server accepting the browser's permission check
  for the new upload header from our domains. If it does not, that is a media-server
  fix and this ticket cannot finish without it.

## Edge Cases

- The session expires **between** asking for the ticket and sending the file.
- The user picks a file, leaves the tab for several minutes, then presses upload —
  the ticket must be asked for at that moment, not earlier.
- Two uploads run at the same time on one screen; each needs its own ticket.
- The upload fails halfway, so the ticket is used up and a retry must start again
  from the ticket request.
- A guest, or an account that is not allowed to upload, reaches an upload screen.
- A user picks a file that is larger than the limit for that upload kind.
- A user drops a video into a bulk image upload.
- The number of files changes after the ticket was asked for (a file is removed
  from the selection before sending).
- The media server is busy or briefly unavailable.
- A story video upload, where the app also needs the video length from the
  response.
- An Excel file is uploaded and then handed to the import step.
- A chat attachment on an older message is opened after the move.
- A file whose type the server does not recognise — it uploads and downloads
  rather than displays.

## Research Questions Resolved

> Required (SP-9). One row per `OQ-n` in `research.md` — none may be skipped.
> **Answered:** write the answer and where it lands (a requirement, an `AC-n`, a
> constraint, or Out of Scope). **Deferred:** the answer needs the approach, so
> `/plan` answers it (PL-12) — repeat it under Open Questions with the same ID.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Uploading needs a signed-in identity, so the app must never treat "become a guest and carry on" as a successful recovery for an upload. Whether the live server refuses a guest with `403` or the identity flag is finished does not change what the app must do: if it cannot get an identity that may upload, it asks the user to sign in and resumes the upload afterwards. This is specified so it is correct either way. | FR-7, AC-8, AC-9 |
| OQ-2 | "The same as any other market server `401`" means the app's existing recovery runs unchanged — refresh the session first, then the existing "please log in again" / verify prompt — and the upload continues by itself once the session is back. Owner decision: if that recovery ends on an identity the media server will not let upload, the user is shown the normal sign-in prompt (not a bare "not allowed" message) and the upload resumes after they sign in. | FR-6, FR-7, AC-7, AC-8, AC-9 |
| OQ-3 | Yes — in scope. The app must mint using the signed-in user's identity **without** the access token ever reaching page JavaScript, which means the minting step happens on our own server. How that is arranged is `/plan`'s decision. | FR-3, NFR-2, AC-3 |
| OQ-4 | Yes — the file bytes keep going straight from the browser to the media server. Only the small ticket request passes through our server. This is required, not preferred: a 512 MB Excel file cannot be relayed. | NFR-1, AC-4 |
| OQ-5 | Every upload keeps the folder it uses today, unchanged. The story flag stays exactly where it is used today — story **videos** only — so story images are not put behind the smaller story limit. This is the smallest change that preserves current behaviour. | FR-5, AC-5, AC-6 |
| OQ-6 | Owner decision: the app builds the **full file URL from the returned key** and passes that to the Excel import, so the import keeps receiving the same shape of value it receives today. | FR-11, AC-13 |
| OQ-7 | Owner decision: **in scope.** Chat attachments move to the gated chat upload on the media server. Files already attached to older messages must keep opening and downloading. | FR-12, AC-14, AC-15 |
| OQ-8 | Owner decision: **in scope.** The shared upload key is removed from the app's code and its configuration, and the two dead paths (the seller-comments Excel upload and the unused "upload story" request type) are deleted. Rotating the leaked key itself, and removing the old routes from the media server, stay out of scope. | FR-13, AC-16, AC-17, Out of Scope |
| OQ-9 | Ask for the ticket at the moment of sending. A failed upload uses the ticket up, so a retry always starts again from the ticket request. Retry that way **at most once** without telling the user; a second failure shows a message. Never retry a "file too large". | FR-2, FR-8, FR-9, AC-10, AC-11 |
| OQ-10 | Yes — four distinct messages are needed: session expired, not allowed to upload, file too large, service busy. Each new string gets its Arabic, Turkish and Kurdish entry before the code uses it. | FR-8, FR-15, AC-12, AC-19 |
| OQ-11 | **In scope.** The profile-picture upload and the return / rating photo uploads are migrated like every other upload, so the protected files that hold them do change in this ticket. `/plan` must list them under "Files to change" for `/implement` to be allowed to touch them. | FR-1, FR-4, AC-1, AC-2 |
| OQ-12 | Bulk uploads carry images only, and the declared count is exactly the number of files sent — so any filtering of the selection happens **before** the ticket is asked for. A video goes through the single upload instead. If the server reports skipped files, the user is told which ones did not upload. | FR-10, AC-18, AC-19 |
| OQ-13 | The browser's permission check for the new upload header is treated as a requirement to prove, not an assumption: verification must include a real browser upload, not just a command-line call. If the media server refuses it, this ticket is blocked on a media-server fix — recorded as a constraint, not silently absorbed. Client-side size checks are brought in line with the new limits. | Constraints, FR-14, AC-4 |

## Open Questions

- None. Every `OQ-n` from `research.md` is answered above.

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | Every upload in the app runs through one shared upload service; no screen or other service holds its own upload code, media base URL, or upload error handling. | FR-1 |
| AC-2 | All nine upload places work end to end after the change: user story, seller story, product images (bulk), product meta image, product video, shop logo and banner, boutique icon and banner, Excel file, return photo, rating photo, profile picture, and chat attachment. | FR-1, FR-4, NFR-4 |
| AC-3 | The ticket request carries the signed-in user's identity, and no access token or long-lived upload credential is readable by page JavaScript. | FR-3, NFR-2 |
| AC-4 | The file bytes go straight from the browser to the media server — a 512 MB Excel file and a 100 MB video both upload — and the upload works from a real browser, not only from a command-line call. | NFR-1, FR-14 |
| AC-5 | Every upload lands in the same storage folder it used before the change. | FR-5 |
| AC-6 | The story flag is sent only for story videos; a story image is not held to the smaller story limit, and a story video still returns its length. | FR-5 |
| AC-7 | An upload that meets a `401` runs the app's existing session recovery and then finishes by itself, with no extra step for the user, exactly as any other market server request does. | FR-6 |
| AC-8 | When the app cannot recover an identity that is allowed to upload, the user sees the app's normal sign-in prompt — not a dead button and not a bare "not allowed" message. | FR-7 |
| AC-9 | After the user signs in from that prompt, the upload they started completes; the app never silently continues the upload as a guest. | FR-7 |
| AC-10 | The ticket is asked for at the moment the file is sent: picking a file, waiting several minutes, then pressing upload still works. | FR-2 |
| AC-11 | A spent or expired ticket is recovered by asking for a new one and retrying once, silently; a second failure shows a message, and a "file too large" is never retried. | FR-9, FR-8 |
| AC-12 | Session expired, not allowed to upload, file too large, and service busy each show their own distinct message. | FR-8 |
| AC-13 | An Excel file uploads and the import step still processes it, receiving the full file URL built from the returned key. | FR-11 |
| AC-14 | A chat attachment uploads through the gated chat route and can be sent, received and opened in a chat message. | FR-12 |
| AC-15 | Attachments on chat messages sent before this change still open and download. | FR-12 |
| AC-16 | No code path sends the shared upload key, and the key is gone from the app's configuration. | FR-13 |
| AC-17 | The dead seller-comments Excel upload and the unused "upload story" request type no longer exist. | FR-13 |
| AC-18 | Bulk uploads accept images only; a video is uploaded one at a time through the single upload instead. | FR-10 |
| AC-19 | The declared file count always matches the files actually sent, and any file the server skips is reported to the user. | FR-10 |
| AC-20 | Every new user-visible string has an Arabic, Turkish and Kurdish entry, and the translation-parity check passes. | FR-15 |
| AC-21 | Type checking, linting, the production build and the unused-code check all pass. | NFR-6 |
| AC-22 | No message, response field or identifier that can reach the browser names the technology behind any service. | NFR-3 |
| AC-23 | The URLs that display and download already uploaded files are unchanged, and existing files still load. | NFR-5 |

## Out of Scope

- Removing the old upload routes from the media server — a later cutover ticket.
- Rotating or retiring the leaked shared key on the media server side. Taking the
  key out of the app does not un-leak it; it is in the repository's history and the
  old routes still accept it.
- The mobile app's move to the gated API, and any release coordination for it.
- Any work on the gateway identity endpoint or the "allowed to upload" flag itself.
- Per-user upload quotas, byte accounting, and upload rate limits.
- Changing how uploaded files are served or how their URLs are built.
- New upload screens, new upload kinds, or changes to what any screen lets a user
  upload — beyond bringing the size checks in line with the new limits.
- Reworking the app's shared session-recovery behaviour. Uploads reuse it as it is;
  changing it for everyone is not part of this ticket.
