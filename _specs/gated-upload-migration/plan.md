---
ticket: gated-upload-migration
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-30
links:
  clickup:
  github:
---

# Plan — gated-upload-migration

> Decide the approach before changing code. Plan only — no implementation here.

## Approach

Add **one new upload service** that every screen calls, and **one small server
route of our own** that mints the ticket. The route reads the signed-in user's
token from its HttpOnly cookie and asks the media server for a ticket, so the
token never reaches page JavaScript (`OQ-3`). The file bytes still go straight from
the browser to the media server, carrying only the ticket — nothing large ever
passes through our own server, which is what keeps a 512 MB Excel file working
(`OQ-4`).

For the `401` behaviour we **reuse the app's existing recovery function instead of
writing a second one**. That function already lives in `utils/fetchData.ts` and is
what every market request uses; today it is private to that file, so the plan makes
it available to the upload service without changing what it does. This is the whole
reason to prefer it over the alternatives: uploads then behave the same as market
requests because they run *the same code*, not because two copies were kept in
step.

Two alternatives were rejected. **Minting through `/api/proxy`** (adding the media
server as another proxied service) would also give the `401` behaviour for free, but
`fetchData` hides the response status and shares one in-flight request between
identical calls — so we could not tell "not allowed to upload" from "service busy",
and two uploads starting together could be handed the same single-use ticket. **A
second copy of the recovery logic inside the upload service** was rejected because
it would drift from the original the first time either changes.

## Steps

1. Add the mint route. It reads the auth cookie, asks the media server for a ticket
   with the user's token, and answers the browser with the ticket plus its size
   limit. On failure it answers with the same status and a short reason code of our
   own — never the media server's own error text, and nothing that names the
   technology behind any service.
2. Add the upload service. It exposes one function per upload kind (single file,
   many images, Excel, chat attachment). Each one asks for a ticket at the moment
   it is called, then sends the bytes with the ticket header, then turns the
   response into either a result or one clear error.
3. Put the shared failure handling in that service, in one place: run the app's
   existing session recovery on a signed-out answer and then retry once; ask for a
   fresh ticket and retry once when a ticket is refused as spent or expired; never
   retry a file that is too large; treat a busy service as "try again".
4. Make the app's existing recovery function reachable from the upload service,
   without changing what it does.
5. Move the story uploads (user and seller) to the service. Keep the story flag for
   videos only, and keep reading the video length from the response.
6. Move the seller dashboard uploads to the service: product images and meta images
   (many at once), product video, shop logo and banner, boutique icons and banners.
   Make sure the declared file count is decided after any filtering, so it always
   matches what is sent, and show the user any file the server skipped.
7. Move the Excel upload to the service, and build the full file URL from the
   returned key before handing it to the import step.
8. Move the return-photo and rating-photo uploads (a protected file) to the
   service, keeping the value the backend receives unchanged.
9. Move the profile-picture upload (a protected file) to the service.
10. Move the chat attachment upload to the media server's gated chat route, and
    store the absolute URL it returns as the message's file path.
11. Bring the size checks on the upload screens in line with the new limits, and
    add the four new messages (session expired, not allowed to upload, file too
    large, service busy) with their Arabic, Turkish and Kurdish entries added first.
12. Remove the old shared key from every file and from both environment files, and
    delete the two dead paths (the seller-comments Excel upload and the unused
    "upload story" request type).
13. Run the validation profile and the manual upload run-through, then record the
    result per acceptance criterion.

## Files to change

**New**

- `app/api/media/ticket/route.ts` — the mint route: reads the auth cookie, asks the
  media server for a ticket, returns the ticket or a normalised failure.
- `services/upload.ts` — the one upload service: mint, send, retry once, map
  errors. Every screen calls this and nothing else.

**Changed**

- `utils/fetchData.ts` — make the existing 401 recovery function reachable from the
  upload service (no change to what it does); remove the unused `"upload story"`
  server type.
- `services/story.ts` — drop the local upload code, the base URL and the key; call
  the service.
- `services/sellerDashboard/index.ts` — drop four local upload functions' internals
  (story, many images, single image, Excel) and the shared key; call the service;
  build the Excel file URL from the returned key.
- `services/sellerDashboard/comments.ts` — delete the dead Excel upload and the key.
- `services/order.ts` — **protected path** (`OQ-11`): the return-photo and
  rating-photo uploads move to the service; the value handed to the backend stays
  the same.
- `services/auth.ts` — **protected path** (`OQ-11`): the profile-picture upload
  moves to the service.
- `components/Chat/chatsFunctions.tsx` — the attachment upload goes to the gated
  chat route through the service; the returned absolute URL becomes the message's
  file path.
- `components/SellerDashboard/ExcelUploadTab.tsx` — read the new response and show
  the new messages.
- `components/SellerDashboard/productEdit/ProductEditor.tsx` — size checks, skipped
  files, and the new messages.
- `components/SellerDashboard/boutiqueEdit/BoutiqueEditor.tsx` — same.
- `components/SellerDashboard/StoriesTab.tsx` — story size check and messages.
- `components/SellerDashboard/ShopInfo.tsx` — size check and messages.
- `components/Orders/UploadImageComponent.tsx` — size check and messages for the
  return and rating photos.
- `public/translations/translations.ar.js`, `public/translations/translations.tr.js`,
  `public/translations/translations.ku.js` — the new strings, added to all three in
  the same edit.
- `.env.development`, `.env.production` — remove the shared upload key line.
- `utils/Requests.ts` — only if the chat-upload request title is left unused by the
  move; remove it then so the unused-code check stays clean.

No other file is touched. `proxy.ts`, `next.config.ts`, `serverRequests/**`,
`utils/cookies/**` and `app/api/auth/**` are **not** changed by this ticket — the
mint route is new and does the token reading itself, so the existing auth routes
need no edit.

## Integration surface

> Required (PL-11, ADR-014). What this change touches **beyond its own files** —
> the source of the mandatory integration question at `/review` (CG-5).
> `none — self-contained` is valid only with the reason stated.

- **Components / shared config touched:**
  - The app's **shared 401 recovery** in `utils/fetchData.ts`. It is used by every
    market, dashboard, chat, stories, comments and wallet request in the app. This
    ticket only makes it reachable from one more caller; it must not change what it
    does.
  - **The media server**, which is external and already live. The old routes still
    work, so both the old and the new way function during the change.
  - `NEXT_PUBLIC_MEDIA_API_KEY` in **both environment files** — read today by five
    files. It stops being read and is removed.
  - `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` — **kept**. It is also used to build public
    image URLs (`utils/tinyUtils.tsx`, `utils/functions.tsx`,
    `utils/server/helpers.ts`) and for a network hint in `proxy.ts`. Removing or
    renaming it would break images across the whole storefront.
  - The **three translation files**, which must stay key-for-key identical.
- **Who else depends on them:**
  - **The stories backend** receives a story file path built from the upload
    response; both the shopper story flow and the seller story tab build it.
  - **The market backends** receive bare file names for product images, meta
    images, product videos, boutique icons and banners — the backend adds the
    folder back itself. They receive a short sub-path for return and rating photos,
    and a file URL for the Excel import.
  - **The chat message renderers** (image, video, audio, file, reply, chat info)
    use the stored file path **directly** as the image source or download link.
    They are plain image and link tags, so no image-host allowlist is involved —
    but the stored value must be a complete, working URL.
  - **The seller Excel import** reads the value the upload produced. It is the one
    place where the response shape genuinely changed (no more ready-made URL).
- **Overlapping flows:**
  - The story upload code exists **twice** — once for shopper stories and once for
    the seller dashboard. One shared service now serves both, so a mistake shows up
    in two different places at once.
  - The single-file upload is also used for a **video** (the product video) and for
    **profile pictures**, not only images. It must not become image-only.
  - Return photos, rating photos and profile pictures all live in files that also
    hold checkout, order and session logic. Only the upload parts change.
  - The `401` path is shared with checkout, the seller dashboard and chat: the same
    recovery can be triggered by a sibling request at the same moment as an upload.
    It already handles that (it waits for a recovery that is already running), which
    is another reason to reuse it rather than copy it.
- **Ordering / lockstep dependencies:**
  - Removing the key from the environment files must land **in the same change** as
    the last code that reads it. Removing it earlier breaks every upload.
  - The chat move and storing the absolute URL are **one change**: a new upload with
    an old path, or an old upload with a new path, produces broken attachments.
  - New strings go into all three translation files **before** the code uses them,
    or linting fails.
  - Nothing has to wait for the media server — it is already live.
  - The upload service and the mint route must land together; neither is useful
    alone.
- **What breaks if this is wrong:**
  - Touch the shared recovery and you can break sign-in, checkout and the seller
    dashboard, not just uploads. It would look like users being logged out or
    bounced.
  - Get the chat path wrong and every newly sent attachment is a broken image or a
    dead link, while older messages look fine — an easy thing to miss.
  - Send the Excel key where a URL is expected and the import silently does nothing.
  - Mint the ticket too early, reuse one ticket for two requests, or declare a file
    count that does not match what is sent, and uploads fail now and then with no
    obvious cause — the worst kind of bug to chase later.
  - Route the bytes through our own server and large Excel files stop uploading.
  - Forget that the single upload also carries videos and profile pictures and you
    break two flows while the images you tested keep working.

## Validation strategy

- Validation profile: `full-build`
- Chosen because two protected paths change and the work touches the shared session
  recovery, so type checking and linting alone are not enough — the production build
  must pass too.
- On top of the profile: the translation-parity script already defined in
  `package.json`, and the unused-code check, since this change deliberately deletes
  dead paths.
- Manual run-through, each as a signed-in user, and each recorded against its
  acceptance criterion: shopper story image, shopper story video, seller story,
  product images (several at once), product meta image, product video, shop logo,
  shop banner, boutique icon, boutique banner, Excel file (large), return photo,
  rating photo, profile picture, chat attachment (new message), and an attachment on
  an older chat message.
- Deliberate failure checks: upload with an expired session; upload a file over the
  limit; drop a video into a many-images upload; pick a file, wait longer than two
  minutes, then press upload.
- The browser permission check for the new upload header is proved by doing these
  from a real browser, not from a command line (`AC-4`).

## Rollback

- Everything happens on the ticket branch as one commit, so reverting that commit
  restores the previous behaviour completely.
- Nothing has to be undone on the server: the old upload routes still work and still
  accept the old key, so the reverted code uploads exactly as it does today.
- The one thing to remember: the revert must also restore the removed key line in
  both environment files, because the old code reads it. If the key has already been
  rotated by then, the reverted build cannot upload — so the rotation stays out of
  this ticket on purpose.
- No database change, no stored data change, and no change to how existing files are
  served, so nothing already uploaded is affected either way.

## Out of scope

- Removing the old upload routes from the media server (a later cutover ticket).
- Rotating or retiring the leaked key on the server side.
- The mobile app's move to the gated API.
- Any change to the gateway identity endpoint or the "allowed to upload" flag.
- Per-user upload quotas, byte accounting or upload rate limits.
- Changing how uploaded files are served or how their URLs are built.
- Changing the shared session recovery itself. It is reused as it is; making it
  reachable is not the same as changing it.
- New upload screens or new upload kinds.
