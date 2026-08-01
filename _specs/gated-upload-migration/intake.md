---
ticket: gated-upload-migration
stage: intake
mode: standard          # single workflow form — no other modes (ADR-011)
status: in_progress     # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-30
links:
  clickup:
  github:
---

# Intake — gated-upload-migration

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- id / slug: `gated-upload-migration`
- Source: **`GATED_UPLOAD_MIGRATION.md`** (repo root) — the media server's own
  migration guide for its new gated upload API. This is the authoritative
  contract for this ticket.
- Related background: `docs/superpowers/specs/2026-07-29-media-upload-authorization-design.md`
  — the design that led to the media-server work. It is **background only**. Where
  it disagrees with `GATED_UPLOAD_MIGRATION.md`, the migration guide wins, because
  the guide describes what is actually deployed.
- ClickUp: —
- GitHub: —

## Ticket Summary

The media server now has a gated upload API and it is **live in production**. An
upload is now two calls: first ask for a short-lived permission (a "ticket") using
the signed-in user's access token, then spend that ticket on the upload. The
shared `X-API-Key` that every upload used to send is gone from the new routes.

This ticket moves the whole app onto that API. Three things are asked for:

1. **Migrate every upload** to the gated routes — single upload, bulk upload,
   Excel import, and the new chat-attachment route — following the rules in
   `GATED_UPLOAD_MIGRATION.md` (mint right before uploading, one ticket per
   request, a fresh ticket for every retry).
2. **Put all uploads behind one new upload service.** Today the same upload code
   is copy-pasted across several service files, each with its own base URL and API
   key. One service should own minting, uploading, and the error handling, and
   every caller should go through it.
3. **Handle a `401` from an upload the same way the app handles a `401` from any
   other market server API.** An upload must not invent its own sign-in error
   path; it should reuse the app's existing one.

The legacy routes still work, so this is a move at our own pace, not a flag day.
A later ticket removes them.

## Ticket Metadata

- id / slug: gated-upload-migration
- title: Move every upload to the gated upload API, behind one upload service
- owner: developer
- created: 2026-07-30
- links: —

## User Story

> As a **signed-in shopper or seller**, I want my photos, videos, and spreadsheets
> to upload with my own permission instead of a key that ships in the browser, so
> that my uploads are tied to my account and a stranger cannot upload in my place.

> As a **developer of this app**, I want one upload service that every screen
> calls, so that a change to the upload rules is made once instead of in five
> copies, and no screen is left behind on the old route.

> As a **user whose session has expired mid-upload**, I want the app to react the
> way it does everywhere else it hits a signed-out response, so that I get the
> normal sign-in flow instead of a dead upload button.

## Acceptance Criteria Presence Check

- Present? **no** (derivable — not a blocker)
- Notes: `GATED_UPLOAD_MIGRATION.md` gives the full contract — both routes, the
  request headers, the mint body fields, the response shapes, the meaning of every
  status code, the per-route changes (size caps, images-only bulk, `key` instead of
  `url` for Excel, the 25 MB chat cap), and a checklist. It states all of this as
  prose and tables with no stable `AC-n` ids. `/spec` writes the acceptance
  criteria from it. The one requirement **not** in the guide is item 3 above (`401`
  handling matching the rest of the app) — that comes from the owner and this
  intake is its source.

## Test Cases Presence Check

- Present? **no** (expected)
- Notes: this repo deliberately has no test suite. Verification is manual, recorded
  per acceptance criterion at `/verify`. Test cases are written at `/spec`, not
  supplied by intake.

## Missing Information

Nothing blocking. The items below are for `/research` to settle against the code
and the live media server; none of them stops the ticket from moving.

- **What "the same as other market server APIs" means for `401` — needs naming, not
  deciding.** The app already has an established `401` behaviour on the market
  server calls (the server-side path in `serverRequests/HandleAuthedFetch.ts`
  re-registers a guest token and retries; the client path in `utils/fetchData.ts`
  has its own handling). The owner's requirement is that uploads reuse that same
  behaviour rather than a bespoke upload error. `/research` must read what that
  behaviour actually is today, in both paths, and write it down — the requirement
  is to match it, so it cannot be specified until it is described.
- **Can a guest account mint a ticket at all?** The migration guide gives `403`
  the meaning "this account may not upload — surface it, don't retry". If the media
  server refuses guests, then the app's usual "get a guest token and retry" answer
  to a `401` cannot rescue an upload, and the two requirements above pull in
  opposite directions. `/research` must confirm the live behaviour for a guest
  token before `/spec` fixes the rule. This is the one genuine unknown.
- **Which uploads today are made by a not-signed-in user?** The old API key worked
  for anyone. If any current upload screen is reachable without signing in, the
  gated API changes who can use it. `/research` lists the call sites and who can
  reach each one.
- **How the token reaches the mint call.** `MARKET-TOKEN` is HttpOnly by design, so
  browser JavaScript cannot read it and cannot send it as a bearer token
  cross-origin. `/research` records this constraint; `/plan` decides the approach.
- **Bulk uploads must be images only.** `/research` checks whether any current
  bulk-upload screen can be handed a video, since the gated bulk route rejects them
  and returns them in a `skipped` array.
- **Excel: `url` is gone from the response.** `/research` finds every reader of the
  Excel upload response so `/spec` can require the switch to `key`.
- **Chat attachments are a new route.** `/gated/chat/upload_file` did not exist
  before. `/research` checks how chat attachments are uploaded today and whether
  that call site belongs in this ticket's scope.
- **New user-visible text.** `401` / `403` / `413` / `503` are to be told apart, so
  new messages are likely. Any new string needs an `ar`, `tr`, `ku` entry in all
  three translation files before it is used (CLAUDE.md).

## Readiness Status

`READY`

- Justification: the request is qualified and the contract behind it is deployed
  and documented. `GATED_UPLOAD_MIGRATION.md` specifies the new API completely —
  the two calls, the headers, the body fields, the response shapes, the status
  codes and what to do about each, and the per-route differences from the legacy
  routes. The three asks are clear and bounded: migrate the call sites, put them
  behind one service, and match the app's existing `401` behaviour. The legacy
  routes still work, so there is no coordination deadline and no shipped-mobile
  flag day in this ticket. Every open item above is a "read the code and confirm"
  job that belongs to `/research`, not a question the owner has to answer first —
  including the one real unknown (whether a guest may mint a ticket), which
  `/research` can settle against the live server.

  **Note for `/spec`:** two sources feed this ticket and they do not fully agree.
  `GATED_UPLOAD_MIGRATION.md` describes what is deployed and is authoritative — for
  example the client sends `folder` in the mint body, and the legacy routes still
  work. The older design doc proposed a server-derived `purpose` instead of a
  client `folder`, and the removal of the API key altogether. Do not carry the
  design doc's proposals into the spec.
