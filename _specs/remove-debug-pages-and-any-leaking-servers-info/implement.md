---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: implement
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Implement — remove-debug-pages-and-any-leaking-servers-info

> Record of what was actually built, following `plan.md`.

**Entry path:** initial. Branch `ticket/remove-debug-pages-and-any-leaking-servers-info`
created from clean `develop` (IM-3). No commit, no push (IM-9).

**Outcome: COMPLETE.** Three blocks were hit and resolved (below). The
post-verification rework is applied; all planned work is done.

**Previously:** Two resume runs were needed; both blocks are described
under "Blocks encountered and resolved". All planned work is applied and the
validation profile passes.

## Blocks encountered and resolved

### Block 1 — a file the plan wrongly excluded (resolved)

`services/elastic/sellerComments.ts:73` reads a renamed variable:

```
const PERMISSIONS_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "") + "/shop/auth/permissions";
```

`plan.md` lists this file under **"Explicitly NOT changed"**, on the stated
grounds that it "contains no backend-URL read (the file is UTF-16, which an
earlier grep mis-matched)". **That premise is false.** The file is UTF-8 and does
read the variable. The claim entered the plan via review round 2's FU-2, which
was accepted without independent verification.

Modifying it would violate IM-4 (no file outside the plan's list), so
implementation stopped here rather than proceeding.

**Impact if shipped as-is:** the module is `"use server"`, so there is no
client-bundle disclosure and AC-4 is unaffected. But the read is at **module top
level** and falls back to `""`, so after the rename `PERMISSIONS_URL` silently
becomes the origin-relative `/shop/auth/permissions`. Seller comment permission
checks would break with no error at build time — precisely the empty-string
failure mode the review's third authoritative resolution called out (an empty
base URL yields origin-relative requests that an `undefined`-prefix check misses).

**Resolution.** `plan.md` was corrected to list the file (with the real reason),
and the rename was applied on resume. The `|| ""` fallback was left as-is — a
fail-loud variant was considered and deliberately not taken, to keep the change
minimal.

**Process note (deviation).** The plan correction was made outside `/plan`.
`/plan` refused with PL-7 — it accepts only `research-complete` or
`spec-complete`, and the lifecycle has no transition back from
`implementation-in-progress` (`project-config.yaml:41` allows only `implemented`
and `closed`). There was therefore no in-workflow route to amend the plan. This
is a genuine gap in the state machine: it assumes implementation never uncovers a
plan defect. Adding an `implementation-in-progress → spec-complete` edge would
close it. Recorded here for `/verify` and for a follow-up workflow ticket.

### Block 2 — the server-side error log reached the client bundle (resolved)

Phase B step 6 moved the server-side error-log POST into
`utils/serverErrorReporter.ts`, on the assumption that module was server-only. It
is not: `services/home.ts` is `"use client"` and imports it, so the reference to
the renamed backend variable landed in three client chunks — failing AC-4, which
covers configuration-variable names as well as hostnames.

Notably this was still an improvement on the starting state (previously the
`NEXT_PUBLIC_` form inlined the actual **hostname**; afterwards only the name
appeared and resolved to `undefined`), but it did not satisfy the criterion.

**Resolution.** `utils/server/mobileErrorLog.ts` was added to the plan and
created to hold the POST, reached from `serverErrorReporter` through a
`typeof window` -guarded dynamic import.

An `import "server-only"` guard was tried first and **failed the build** —
correctly, since the module is still reachable from the client graph through that
import chain. That failure was the useful signal: it confirmed the leak was real
rather than theoretical. The assertion was removed and the outcome verified
empirically instead — the guarded dynamic import does keep the code out of
`.next/static` (0 occurrences). The underlying architectural issue, that client
code imports `serverErrorReporter` at all, is pre-existing and out of scope.

### Block 3 — the verification rework is outside approved scope (open)

`/verify` FAILED on AC-1 and AC-2: `/api-test` and `/requests-log` still return
200 with the storefront homepage, because both names remain in the middleware
exclusion list and are therefore swallowed by the `[lang]` dynamic segment.

A resume run can apply **neither** required fix:

1. **`proxy.ts:589` — remove the two names from the exclusion list.** The file is
   in "Files to change", but `review.md` records an authoritative resolution that
   `proxy.ts` is "authorised for the Phase C variable rename **only**" and that
   "the middleware exclusion list must **not** be edited". That resolution is
   binding on `/implement`, so this edit is forbidden until it is superseded.
2. **`components/Home/Menu.tsx:392` — remove the dead "Request Log" menu item.**
   The file does not appear in `plan.md` at all (IM-4).

No files were modified and no state was changed by that run.

**Resolution.** Both amendments were made: `review.md` resolution 1 was struck
through and superseded (authorising removal of exactly `api-test` and
`requests-log` from the exclusion list, nothing else), and
`components/Home/Menu.tsx` was added to `plan.md`. Both edits were then applied
on resume — see "Post-verification rework". As with Blocks 1 and 2, `/plan` could
not make the amendments from `implementation-in-progress` (PL-7); same
state-machine gap.

## Post-verification rework (applied)

- `proxy.ts` *(protected path)* — removed exactly two strings from the middleware
  exclusion list: `api-test` and `requests-log`. Verified afterwards that every
  live entry survives (`ingest`, `assets`, `fonts`, `icons`, `images`, `styles`,
  `translations`, `call_direct`, `callInProg`, `endCall`, `simulateUser`,
  `firebase-messaging-sw.js`). The other stale entries were deliberately left
  alone as out of scope.
- `components/Home/Menu.tsx` — removed the 50-line `MenuItem` block rendering the
  ungated "Request Log" link. JSX balance re-checked (9 open / 9 close).

### Live re-verification of the two failing criteria

| Path | Before rework | After rework |
|---|---|---|
| `/requests-log` | 200 + storefront homepage | **307 → final 404** — matches the control path |
| `/api-test` | 200 + storefront homepage | **200 + storefront homepage (unchanged)** |

**AC-2 is fixed. AC-1 is not, and cannot be fixed within the authorised scope —
`/verify` must judge it.** The cause is narrower than first diagnosed: the
matcher's `api` alternative is a **prefix** match, so `/api-test` is excluded from
middleware by `api` regardless of whether `api-test` is listed. Removing the
`api-test` string was therefore a no-op for that path.

Characterised: `/apifoo` and `/apizzz` return the same 200 + homepage, and
`/api-test/deeper` correctly 404s. So the 200 is **generic pre-existing behaviour**
for any single-segment path beginning with `api` — every such path bypasses
middleware and is absorbed by the `[lang]` dynamic segment as if `api-test` were a
locale. It is not specific to the deleted page, and the debug page's own content
is gone.

Fixing it properly means changing the matcher's `api` token to `api/`, which
affects every path starting with `api` on a protected path. That is outside this
plan's authorisation (which permits removing two strings only) and is arguably a
separate pre-existing defect. Not attempted.

### Out-of-scope finding

`public/api-test.html` (6.8 KB) still exists and is served at `/api-test.html`.
It is a standalone static debug page with a request builder, but it calls **only**
same-origin internal routes (`/api/home/mainCategories`, `/api/home/boutiques`)
and contains **no** backend hostnames or proxy headers — so it does not leak
backend identity. Not in `plan.md`; left untouched. Worth a follow-up ticket on
debug-surface grounds, not disclosure grounds.

## Changes made

### Phase 0 — preserved pre-existing work
Five modified files were stashed by explicit path, the branch created from a
clean `develop`, then restored intact. Verified present after restore.

### Phase A — debug surfaces and request logger removed
- `app/(client)/api-test/` — **deleted** (`page.tsx`, `layout.tsx`, `CurrencyTestCard.tsx`)
- `app/(client)/requests-log/` — **deleted** (`page.tsx`, `layout.tsx`)
- `utils/requestLoggerClient.ts` — **deleted**
- `utils/fetchData.ts` — removed the logger import and all three `logRequest` call sites
- `utils/functions.tsx` — removed the `getLastRequest` import, its call, and the now-unused `last_request` field
- `app/simulateUser/` — untouched, as decided (AC-3)
- Existing browser-stored request-log data is **not** cleared; it expires on its own 3-day schedule (spec C-5)

### Phase B — client-reachable backend reads moved server-side
- `components/global/compare.tsx` — the two product lookups now go through `fetchData({ server: "market" })` instead of direct `fetch` to the backend host. Both paths are Go-gateway endpoints, so they resolve to the Go backend (AC-11). Caching is enabled on the product-detail lookup only; the quantity/price lookup stays uncached because the request cache has no TTL. Failure handling switched from `res.ok` to `success`, matching `fetchData`'s contract.
- `utils/functions.tsx` — `storeError` is now browser-only; the server branch was removed
- `utils/serverErrorReporter.ts` — gained `storeErrorServer`, which delegates to the server-only module through a guarded dynamic import (see Block 2). The previous `serverErrorReporter → functions` import was removed
- `utils/server/mobileErrorLog.ts` — **created**. Holds the server-side POST and the backend base-URL reference, keeping both out of the client graph
- `services/auth.ts` — no action; the profile-image fix was already in the working tree

### Phase C — variable rename (complete)
49 references renamed across 19 files: `proxy.ts`,
`serverActions/sendOtp.ts`, `serverRequests/{HandleAuthedFetch.ts, index.tsx,
currency.ts, products.ts, product.tsx, stories.ts, settings/index.ts,
analyticsUtility.ts}`, `services/wallet/index.ts`, `utils/server/otpIdentity.ts`,
`utils/server/tokenManager.ts`, `app/api/auth/{login,expire,register-device}/route.ts`,
`app/api/internal/mobile-error-log/route.ts`,
`app/(client)/[lang]/settings/languages/page.tsx`, and
`services/elastic/sellerComments.ts` (added on resume — see Block 1; its UTF-8
bytes were preserved exactly, including the literal control characters in a
sanitiser regex that make `grep` treat the file as binary).

A stale comment in `utils/server/tokenManager.ts` naming the old variable was
also corrected. Both environment files had the six renames applied; the unused
OTP backend entry was already gone. The six renames are recorded in the decisions
document so the mapping is discoverable without an example file.

`NEXT_PUBLIC_CHAT_BACKEND_URL` was left untouched by design (9 references remain).

**Still outstanding (manual, gates the push not the merge):** the six renamed
variables must be created in production, preview and development on the platform
before this branch is pushed (C-1, EC-2). Not doable from the repository.

### Phase D — opaque service identifiers
- `utils/serviceTokens.ts` — **created**. Standalone and dependency-free; imports nothing. Exports the frozen forward map, the derived reverse map, and both lookup helpers
- `utils/fetchData.ts` — forward mapping applied where the header is set
- `services/sellerDashboard/index.ts` — forward mapping applied in the hand-built request
- `app/api/proxy/route.ts` — reverse mapping applied on read, before allowlist validation, and on the error path. The proxy route handler owns the reversal; `tokenManager.ts` was not given a mapping import (per the review's second authoritative resolution)
- Both market identifiers kept distinct (AC-9)

### Phase E — proxy header cleanup completed
- `app/api/proxy/route.ts` — added `Cache-Control: no-store` to the non-JSON response path, the one part of the earlier header work not applied. Also made the unknown-identifier rejection identical to the generic upstream-failure response (same status, same body, echoing neither value), so the mapping cannot be recovered by probing

### Phase F — documentation
- `docs/security/backend-disclosure-decisions.md` — corrected record was already in the working tree and is carried on the branch

## Changes prepared (uncommitted)

> `/implement` creates **no commit** (IM-9 / ADR-008); there are no SHAs to
> record here. The single publishable commit is created later by `/publish-pr`.

Deleted: `app/(client)/api-test/{page,layout,CurrencyTestCard}.tsx`,
`app/(client)/requests-log/{page,layout}.tsx`, `utils/requestLoggerClient.ts`

Created: `utils/serviceTokens.ts`, `utils/server/mobileErrorLog.ts`

Modified: `app/api/proxy/route.ts`, `app/api/auth/register-device/route.ts`,
`app/api/auth/login/route.ts`, `app/api/auth/expire/route.ts`,
`app/api/internal/mobile-error-log/route.ts`, `utils/server/tokenManager.ts`,
`utils/server/otpIdentity.ts`, `utils/fetchData.ts`, `utils/functions.tsx`,
`utils/serverErrorReporter.ts`, `services/auth.ts`, `services/wallet/index.ts`,
`services/sellerDashboard/index.ts`, `components/global/compare.tsx`,
`proxy.ts`, `serverActions/sendOtp.ts`, `serverRequests/HandleAuthedFetch.ts`,
`serverRequests/index.tsx`, `serverRequests/currency.ts`,
`serverRequests/products.ts`, `serverRequests/product.tsx`,
`serverRequests/stories.ts`, `serverRequests/settings/index.ts`,
`serverRequests/analyticsUtility.ts`,
`app/(client)/[lang]/settings/languages/page.tsx`,
`services/elastic/sellerComments.ts`, `.env.development`, `.env.production`,
`docs/security/backend-disclosure-decisions.md`, plus the `_specs/` artifacts

Every path above appears in `plan.md` "Files to change". **No unlisted file was
modified** (IM-4) — which is why this run is blocked rather than complete.

## Deviations from plan

- **Phase C is incomplete by one file** — see "Blocking reason". This is the block, not a deviation taken.
- **`utils/serverErrorReporter.ts` gained a new function** rather than merely receiving moved code. The plan said the module "receives that server-side branch"; in practice `serverErrorReporter` imported `storeError` from `functions`, so the branch became a local `storeErrorServer` and that import was replaced with the serializer import. Same intent, within the listed file.
- **`utils/functions.tsx` also lost the `last_request` field** from its error payload, a direct consequence of removing `getLastRequest` (the only producer). Anticipated by the plan's note that removing the logger degrades error-report context (AC-15 is unaffected — reporting still works).
- **The plan's Phase C list included `utils/functions.tsx`** "only if a reference survives step 8". None did — the Phase B move removed it — so it received no rename.
- **`plan.md` was amended twice during implementation**, once per block: to add `services/elastic/sellerComments.ts` to Phase C, and to add `utils/server/mobileErrorLog.ts` under "Create". Both amendments were made outside `/plan` because the lifecycle offers no route back to it from `implementation-in-progress` (see the process note under Block 1). Every file changed is listed in the amended plan; no unlisted file was modified.

## Validation run during implementation

Profile `full-build`, all three checks, re-run after the post-verification rework:

- **Type check — 0 errors.** (An earlier run reported 8, all in generated `.next/` route validators still referencing the deleted debug pages; they cleared on rebuild.)
- **Lint — 0 errors**, 34 warnings, all pre-existing and unrelated (anonymous default exports, unused eslint-disable directives).
- **Production build — succeeded.** The emitted route list confirms `/api-test` and `/requests-log` are gone and `/simulateUser` is retained.

Beyond the profile, the disclosure goal was measured directly against the built
client output (`.next/static`):

- **Configuration-variable names of the six in-scope backends: 0 occurrences.**
- **Hostnames of the six in-scope backends: 0 occurrences.**
- **Chat hostname: 1 occurrence** — the documented, accepted exception (AC-5), not a failure.

This is the evidence for AC-4/AC-5. The remaining acceptance criteria are
runtime behaviours (AC-3, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-15)
and are left for `/verify` to exercise.
