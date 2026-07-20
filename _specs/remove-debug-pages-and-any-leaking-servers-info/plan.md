---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: plan
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Plan — remove-debug-pages-and-any-leaking-servers-info

> Decide the approach before changing code. Plan only — no implementation here.
>
> **Revision 3** — addresses FU-12..FU-18 from review round 2, on top of
> FU-1..FU-11 from round 1. See "Revision log".

## Approach

Four changes, phased: delete the two debug routes and the client-side request
logger; move the remaining client-reachable backend reads server-side; rename six
backend base-URL variables to drop their public prefix (chat excluded); and make
the service identifiers on the wire opaque.

**The identifier change translates at the boundary rather than rewriting call
sites.** Rewriting every `server: "market"` literal would mean 272 call sites
across 51 files, four of which the type system cannot check. Instead, internal
code keeps its readable names everywhere, and a mapping is applied at the two
points the identifier is written to the wire and reversed at the one point it is
read. This reduces the identifier change to 5 files, keeps logs and stack traces
readable, and removes the silent-failure risks research identified.

**The mapping lives in a new standalone, dependency-free module**
(`utils/serviceTokens.ts`). It **must not** import `next/headers` or anything
that transitively does. The previous revision placed it in
`utils/server/tokenManager.ts`, which imports `next/headers` at line 1 — that
would have passed type checking and then failed the production build — the known
server-only-import trap in this repo. Both directions live in the one module:
the forward map necessarily ships to the client anyway (the browser must know
which token to send), so splitting it would add duplication without hiding
anything. Verified there is no `utils/` barrel file that could drag server code
in transitively.

**Ordering.** Phase A must precede Phase C: the API-test page reads two of the
six variables client-side, and leaving it in place would keep AC-4 failing. Phase
B must precede Phase C: the remaining client-reachable reads must move server-side
before their variables are renamed, or the rename inlines `undefined`. Phase D is
independent of A — under boundary mapping it touches no call sites and no union,
so the earlier A→D coupling no longer exists.

## Steps

### Phase 0 — Preserve work already in the tree
1. Re-run `git status` and reconcile against the Phase 0 file list below — the
   set has drifted between runs, so the list is a checkpoint, not a source of
   truth. Stash **by explicit path**, not a bare stash, so unrelated edits cannot
   be swept up or lost. Create the ticket branch from a clean `develop` (IM-8),
   then restore the stash onto it and re-verify each file is present and intact.

### Phase A — Remove debug surfaces and the request logger (AC-1, AC-2, AC-3, AC-6, AC-14)
2. Delete the API-test route directory and the request-log route directory in
   full. Leave the user-simulation route untouched (AC-3).
3. Delete the request-logger module.
4. Remove the logger import and its three call sites from the client fetch
   helper, and the `getLastRequest` import and usage from the shared utility
   module. Error reporting itself must keep working (AC-15).
   Request-log data already in users' browsers is **not** touched — it expires on
   its own 3-day schedule (spec C-5).

### Phase B — Move the client-reachable backend reads server-side (AC-4)
5. Route the product-comparison lookups through the shared client fetch helper
   with the `market` server, so they resolve to the Go gateway and no longer name
   a host in client code. Enable caching on the **product-detail lookup only** —
   the quantity/price lookup returns live price and stock and must stay uncached,
   since the in-memory cache has no TTL and would serve stale prices for the whole
   session. Review the response handling, not just the two call sites — the
   effective upstream changes (EC-6, AC-11).
6. Move the server-side branch of the error-logging helper into the existing
   server error-reporter module, so the Go gateway address is no longer inlined
   into the client bundle. The browser branch already posts to an internal route
   and is unaffected.
7. No action for the profile-image fix — already applied in the working tree.

### Phase C — Rename the six configuration variables (AC-4, AC-5)
8. Rename the market, Go gateway, elastic, stories, comments, and wallet
   base-URL variables to drop their public prefix, across every remaining
   reader. Leave the chat variable exactly as it is (AC-5, C-2).
9. Update both local environment files: apply the six renames and delete the
   unused OTP backend entry.
10. Record the six renames in the decisions document so the mapping is
    discoverable from the repository — the environment files are untracked and
    there is no example file, so without this a fresh clone gives no signal.
11. **Before publishing:** the six renamed variables must exist in production,
    preview, and development on the platform (C-1, EC-2). Manual step; gates the
    push, not the merge.

### Phase D — Opaque service identifiers (AC-8, AC-9)
12. Create the standalone mapping module described in Approach, exporting both
    directions as frozen module-scope object literals. No hashing, regex, or
    encoding at request time — two constant-time lookups. **This module owns the
    mapping in both directions; no other module defines one.**
13. Apply the forward mapping where the identifier header is set: in the shared
    client fetch helper and in the seller-dashboard binary download, which builds
    its request by hand.
14. **The proxy route handler performs the reversal**, calling the mapping
    module's reverse lookup at the point it reads the header, before the existing
    service-allowlist validation runs — so downstream logic and logging see
    readable names (NFR-4). Cover the error path, which re-reads the header
    separately. The server token module only *consumes* readable names; it does
    not perform or re-implement the reversal.
15. Ensure the proxy's rejection response is identical for an unrecognised
    identifier and for a recognised one whose upstream call fails: same status,
    same body, echoing neither the submitted value nor the internal name. Cheap
    hygiene; **not** load-bearing for security — see "Spec gaps" below.
16. Keep the two market identifiers distinct so the seller-id behaviour is
    preserved (AC-9, C-4).

### Phase E — Finish the header cleanup
17. Add the missing no-store cache directive to the proxy's non-JSON response
    path — the one part of the earlier header work not applied.

### Phase F — Documentation
18. The decisions document has already been corrected and additionally receives
    the variable-rename record from step 10.

## Files to change

**Phase 0 — already modified in the working tree (preserve, do not revert):**
- `app/api/proxy/route.ts` — header cleanup done; also receives steps 14, 15, 17
- `app/api/auth/register-device/route.ts` — header cleanup done; also step 8
- `app/api/internal/mobile-error-log/route.ts` — header cleanup done; also step 8
- `utils/server/tokenManager.ts` — stray log removed; also step 8; consumes readable names only (step 14)
- `services/auth.ts` — profile-image URL moved to the media host. **Phase 0 only** — it has no in-scope variable left and is *not* part of the Phase C rename
- `docs/security/backend-disclosure-decisions.md` — corrected decisions record; also step 10

**Create:**
- `utils/serviceTokens.ts` — the standalone, dependency-free identifier mapping (both directions). Must not import `next/headers` or any module that transitively does
- `utils/server/mobileErrorLog.ts` — the server-side error-log POST. **Correction to step 6:** the plan originally placed this in `utils/serverErrorReporter.ts`, assuming that module was server-only. It is not — `services/home.ts` (`"use client"`) imports it, which pulled the backend variable reference into the client bundle and failed AC-4. The POST therefore needs its own genuinely server-only module, reached by a guarded dynamic import so it never enters the client graph

**Delete (Phase A):**
- `app/(client)/api-test/page.tsx`
- `app/(client)/api-test/layout.tsx`
- `app/(client)/api-test/CurrencyTestCard.tsx`
- `app/(client)/requests-log/page.tsx`
- `app/(client)/requests-log/layout.tsx`
- `utils/requestLoggerClient.ts`

**Modify — Phase A:**
- `utils/fetchData.ts` — remove logger import and its three call sites
- `utils/functions.tsx` — remove the `getLastRequest` import and usage
- `components/Home/Menu.tsx` — remove the "Request Log" menu item, an ungated user-visible link to the deleted `/requests-log` page. **Added post-verification:** `/verify` found the debug page was reachable from the main menu, not only by direct URL, so deleting the route alone leaves a dead entry (NFR-1)
- `proxy.ts` *(protected path)* — remove exactly the strings `api-test` and `requests-log` from the middleware exclusion list, and nothing else. **Added post-verification:** leaving them there makes both paths skip the locale redirect and resolve to the storefront homepage instead of not-found, which is why AC-1 and AC-2 failed. See the superseding resolution in `review.md`; the list's remaining entries are live and must stay

**Modify — Phase B:**
- `components/global/compare.tsx` — route product lookups through the shared fetch helper; caching on the product-detail lookup only, never the price/quantity one; review response handling
- `utils/functions.tsx` — move the server-side error-logging branch out
- `utils/serverErrorReporter.ts` — receives that server-side branch

**Modify — Phase C (variable rename; the six in-scope variables only):**
- `proxy.ts` *(protected path)*
- `serverActions/sendOtp.ts`
- `serverRequests/HandleAuthedFetch.ts` *(protected path)*
- `serverRequests/index.tsx` *(protected path)*
- `serverRequests/currency.ts` *(protected path)*
- `serverRequests/products.ts` *(protected path)*
- `serverRequests/product.tsx` *(protected path)*
- `serverRequests/stories.ts` *(protected path)*
- `serverRequests/settings/index.ts` *(protected path)*
- `serverRequests/analyticsUtility.ts` *(protected path)*
- `services/wallet/index.ts`
- `services/elastic/sellerComments.ts` — reads the market base URL at module top level with a `|| ""` fallback, so the rename must reach it or it silently resolves origin-relative
- `utils/server/otpIdentity.ts`
- `utils/server/tokenManager.ts`
- `utils/functions.tsx` — only if a reference survives step 8
- `app/api/auth/login/route.ts` *(protected path)*
- `app/api/auth/expire/route.ts` *(protected path)*
- `app/api/auth/register-device/route.ts` *(protected path)*
- `app/api/internal/mobile-error-log/route.ts`
- `app/(client)/[lang]/settings/languages/page.tsx`
- `.env.development`, `.env.production` — **not git-tracked**; local only, listed for completeness

**Modify — Phase D (5 files, not 51):**
- `utils/serviceTokens.ts` — created above
- `utils/server/tokenManager.ts` — import the reverse lookup beside the allowlist
- `utils/fetchData.ts` — apply the forward mapping where the header is set
- `services/sellerDashboard/index.ts` — apply it in the hand-built request
- `app/api/proxy/route.ts` — reverse on read, including the error path; uniform rejection response

**Explicitly NOT changed:**
- `services/auth.ts` beyond Phase 0 — no in-scope variable remains
- `app/simulateUser/**` — retained (AC-3)
- `components/global/WebViewActions.tsx`, `components/global/WebviewCall.tsx` — out of scope
- `next.config.ts`, `services/order.ts`, `services/cart.ts`, `services/orders.ts` — untouched, a consequence of the boundary-mapping approach
- The 272 `server:` call sites across 51 files — untouched by design

### Protected paths touched

`proxy.ts`, `serverRequests/**`, `app/api/auth/**`, and `services/auth.ts`
(Phase 0 only). All listed above, modified only for the variable rename, the
header cleanup, or deletion of dead exclusion entries (GU-2, IM-5).
`services/order.ts`, `services/cart.ts`, `services/orders.ts` and
`next.config.ts` are **not** touched.

## Validation strategy

- Validation profile: `full-build`
- The profile cannot prove the ticket's goal, so the following are also required:
  - **Client-graph check (FU-3 / FU-18).** Confirm no client-reachable module
    reads any of the six renamed variables. A survivor inlines `undefined`, passes
    typecheck/lint/build silently, and fails only at runtime — and the bundle grep
    below **cannot** catch it, because the survivor's value is absent from the
    bundle by definition. "Server-only" means: the module is reachable only from
    `app/api/`, `serverRequests/`, `serverActions/`, or a module that imports
    `next/headers` or `server-only`. Every occurrence of the new names must sit in
    such a module. Additionally, exercise the seven services and assert no
    outgoing request URL begins with `undefined`.
  - **Bundle check (AC-4).** Grep the built client output for the six hostnames
    and variable names — expect zero matches. Extend beyond static chunks to
    rendered HTML and RSC payloads for representative routes, since a server
    component can pass a value into a client component.
  - **Chat exception (AC-5).** The chat host is expected to still be present;
    record it as the known exception, not a failure.
  - Request the two deleted routes — expect not-found (AC-1, AC-2). Request the
    retained simulation route — expect success (AC-3).
  - Inspect proxy responses for any header naming the serving backend (AC-7).
  - Exercise each of the seven services for a guest and an authenticated session
    (AC-10), including the seller-dashboard binary download (AC-12).
  - **Compare (AC-11)** must be checked in a logged-out or expired-token session
    specifically, not only when signed in — the new path is exposed to the
    re-authentication flow that the previous direct calls could not trigger.
  - Confirm no request-log entries are written and that error reporting still
    functions (AC-6, AC-15). Pre-existing entries are expected to remain and
    expire on their own 3-day schedule (spec C-5) — their presence is not a
    failure.
  - Inspect identifiers on the wire: non-descriptive, no shared decodable
    pattern, two market identifiers still distinct (AC-8, AC-9).
  - **Probe the proxy** with an unrecognised identifier and with a recognised one
    whose upstream fails; the two responses must be indistinguishable. Covered by
    step 15; not mapped to an acceptance criterion (see "Spec gaps").
  - Confirm no file outside this plan's list is modified (AC-16).
- **Not applicable:** spec EC-4 (telemetry tag split) cannot occur under the
  boundary-mapping approach — internal names still tag error reports. `/verify`
  should record it N/A with that reason rather than testing for it.
- **Do not claim a bundle-size win.** The deleted routes are separately chunked
  and the logger is ~2 KB; the real gain is removing a database open and a
  full-store purge scan from every request.

## Rollback

**The unit of rollback is the whole ticket** — it ships as a single commit, so
reverting that commit restores everything. The phases are not independently
revertible in delivery; the notes below describe consequences, not separate
revert paths.

- **Phases A, B, D, E** — code-only, no external state. Reverting the commit
  suffices.
- **Phase C is the one phase coupled to external state.** If the platform
  variables are renamed and the commit is later reverted, the old code looks for
  the old names and fails. Mitigation: keep the old platform entries in place
  alongside the new ones until the release is confirmed healthy, then remove
  them — this keeps the revert code-only for the whole window.
- **A missed environment fails silently, not loudly.** An unset variable yields
  an empty base URL and origin-relative requests rather than an error, so
  preview and development must be checked explicitly, not assumed.
- **Phase D must ship whole** — a partially applied mapping causes every proxied
  request to be rejected as an unknown service (C-3). Because the mapping is one
  module with two call sites, reverting it is small and contained.
- **Highest-risk item after release:** product comparison (AC-11) — the only
  place behaviour intentionally changes, and now also the only path newly
  exposed to the re-authentication flow.
- **Fully reversible on the client.** No browser-stored data is deleted, so a
  revert leaves returning users exactly as they were.

## Out of scope

- The webview calling functionality and the chat backend address — deferred; the
  reason the chat variable is excluded (AC-5).
- Bearer tokens carried in webview URLs — a more severe pre-existing defect,
  recorded in the spec, needing its own ticket.
- **`/simulateUser`'s access posture.** It is retained by decision and is
  unauthenticated; the middleware exclusion list is not an access gate. Recorded
  as a known, accepted gap for a follow-up ticket (FU-6).
- The media host address and its embedded API key.
- The image-host allowlist naming the media, staging, and storage hosts.
- Cross-site request forgery protection and upstream path restriction on the
  proxy — the two controls that would actually constrain proxy abuse. Opaque
  identifiers are not a substitute.
- Sanitizing error responses across the wider API surface.
- **Stale documentation.** `CLAUDE.md`, `docs/market-api-inventory.md`,
  `test-new-flow-for-otp.md` and several files under `docs/features/**` name the
  old variables and the readable service identifiers verbatim. They will read
  stale after this ticket. Deliberately not updated here to keep the change set
  reviewable; a follow-up documentation ticket should sweep them.

## Revision log — how each follow-up was addressed

| FU | Resolution |
|----|-----------|
| FU-1 (blocking) | Mapping moved to a new standalone `utils/serviceTokens.ts`, explicitly forbidden from importing `next/headers`; listed under "Create". Verified no `utils/` barrel exists that could pull server code in transitively. |
| FU-2 | `services/auth.ts` removed from the Phase C rename (no in-scope variable remains). **Correction:** FU-2 also removed `services/elastic/sellerComments.ts` on the claim that it "contains no backend-URL read (UTF-16, grep mis-matched)" — that claim was **false** and was accepted without verification. The file is UTF-8 and reads the market base URL at `:73`. It has been restored to the Phase C list; `/implement` blocked on this before the correction. Ordering restated as A→C and B→C; the stale A→D claim is gone. |
| FU-3 | Added as the first item of the validation strategy — a client-graph check for surviving reads, with the silent `undefined` failure mode stated. |
| FU-4 | Compare re-routing now specifies the caching flag; the behavioural effects are named in Rollback and Risks, and AC-11 verification requires a logged-out / expired-token session. |
| FU-5 | New step 15 covers it, and it is in the validation strategy. The acceptance criterion FU-5 asked for **cannot be added by `/plan`** (SP-4 / GU-3 — `spec.md` is not this command's to write); logged under "Spec gaps". |
| FU-6 | `/simulateUser`'s unauthenticated posture recorded explicitly under Out of scope as a known accepted gap. |
| FU-7 | **Rejected — not adopted.** The owner settled this at research (S15) and `spec.md` C-5 records it: existing request-log data is left to its 3-day purge. Revision 2 wrongly reopened it; that step has been removed. |
| FU-8 | EC-4 marked not-applicable in the validation strategy with its reason. FR-7 is **unchanged and still open** — `/plan` cannot write `spec.md`; see "Spec gaps". |
| FU-9 | New step 10 records the six renames in the decisions document; stale docs added to Out of scope rather than left silent. |
| FU-10 | Bundle check extended to rendered HTML and RSC payloads. |
| FU-11 | Phase 0 now requires stashing by explicit path and re-verifying `git status`, since the working-tree set has drifted. |

| FU-12 (blocking) | **Step 5 deleted.** The browser-database cleanup is gone, along with its file-list entry and Rollback caveat. It reversed the owner's research decision (S15) recorded in spec C-5; it should never have been added. This also removes the unnamed-file and "one-time" problems. |
| FU-13 (blocking) | Closed by FU-12 — the step that contradicted C-5 no longer exists. Phase A now states explicitly that existing data is left to its 3-day purge. |
| FU-14 | Revision-log row for FU-8 corrected: FR-7 is unchanged and still open. |
| FU-15 | **Step 6 cut.** Tidying the middleware exclusion list was an unbounded edit on a protected path that no acceptance criterion required. `proxy.ts` is still touched, but only for the Phase C rename. |
| FU-16 | Caching now applies to the product-detail lookup only; the price/quantity lookup stays uncached to avoid session-long stale prices. |
| FU-17 | Step 14 states the proxy route handler owns the reversal; the server token module only consumes readable names. Step 12 states the mapping module is the sole definition of both directions. |
| FU-18 | Client-graph check now defines "server-only" mechanically and adds a runtime assertion that no outgoing request URL begins with `undefined`. |

## Spec gaps — one item `/plan` cannot close

`spec.md` FR-7 reads "resolvable only on the server". That is unachievable as
written: the forward mapping necessarily ships to the browser, because the client
has to know which token to send. `/plan` cannot edit `spec.md` (GU-3), so the
wording stays open.

This plan does **not** rely on the overstated claim. It treats the mapping as
public throughout, and the security value comes from the tokens not naming the
services — not from the mapping being secret.

**Not a blocker.** Round 2's security lens confirmed the related concern is void:
since the map is readable in the bundle anyway, probing the proxy recovers
nothing an attacker could not already read. Step 15 stays as cheap hygiene, and
its lack of an acceptance criterion is a traceability gap rather than an
unverified security behaviour. Nothing here changes what gets built.
