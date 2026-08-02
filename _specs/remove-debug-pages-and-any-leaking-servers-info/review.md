---
ticket: remove-debug-pages-and-any-leaking-servers-info
stage: review
mode: standard          # single workflow form — no other modes (ADR-011)
status: complete
owner: reviewer
updated: 2026-07-19
links:
  clickup:
  github:
---

# Review — remove-debug-pages-and-any-leaking-servers-info

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control.

## Review Scope

Third review round, over `plan.md` revision 3 and `spec.md`. The advisory panel
re-ran scoped to the delta — verifying round 2's follow-ups (FU-12..FU-18) closed
and checking for regressions, without re-opening settled scope decisions.
Comprehension check passed 3/3.

## Plan Summary

Delete the two debug routes and the client-side request logger; move the
remaining client-reachable backend reads server-side; rename six base-URL
variables (chat excluded); make the wire service identifiers opaque via a
boundary mapping in a standalone client-safe module rather than rewriting 272
call sites. Existing browser-stored request-log data is left to expire on its own
schedule.

## Risks

- Phase C remains coupled to platform configuration; the owner updates it before
  publishing, which is procedural rather than enforced.
- Product comparison is the only place behaviour intentionally changes, and it
  newly routes through the shared fetch helper.
- Two stale clauses survived revision 3's edits; both are resolved authoritatively
  below rather than by a further revision.

## Assumptions

- The six renamed variables exist in production, preview and development before
  the branch is pushed.
- The chat variable stays public by design; the ticket hides six of seven hosts.

## Open Questions

- None.

## Panel Findings (advisory)

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| senior + security | major | "Protected paths touched" still authorises "deletion of dead exclusion entries", stale text from the cut step 6 — leaving standing permission for the unbounded `proxy.ts` edit the revision removed. | plan "Protected paths touched" | **Accept — resolved here.** See "Authoritative resolutions" below: `proxy.ts` is authorised for the Phase C rename **only**. Not worth a fourth revision cycle for one clause. |
| senior | major | Phase D file list still assigns the reverse lookup to `utils/server/tokenManager.ts`, contradicting step 14, which says that module only consumes readable names. | plan Files to change (Phase D) vs step 14 | **Accept — resolved here.** Step 14 governs; see below. |
| security | minor | The FU-18 runtime assertion catches URLs beginning with `undefined`, but an *empty* base URL yields origin-relative requests that pass it silently. | plan Validation strategy vs Rollback | **Accept.** Folded into the verification note below — assert the outgoing origin, not just the prefix. |
| security | minor | The product-detail cache is not stated to be invalidated across a guest→authenticated transition. | plan step 5 | **Mitigate at implementation.** The cached lookup is unauthenticated public product data, so cross-auth reuse is not a correctness or disclosure issue; no plan change. |
| security | info | Leaving the stale middleware exclusion entries means a future route at those paths would silently inherit the exclusion. | plan revision log FU-15 | **Accept.** Server-side only, not in the client bundle, so no AC-4 impact. Noted for the follow-up documentation ticket. |
| senior | minor | The revision-log table renders as two tables (blank line before the FU-12 row). | plan revision log | **Dismiss.** Cosmetic markdown only. |
| performance | info | FU-16 correctly resolved — mixing one cached and one uncached call in the same parallel pair is fine; independent promises, distinct cache keys. | plan step 5 | **Noted.** |
| performance | info | Removing the boot-time deletion and the exclusion tidy are both strictly less work. | plan revision log | **Noted.** |
| senior + performance | info | FU-12..FU-18 otherwise confirmed closed; no new blocking defects. | plan revision log | **Noted.** |

## Authoritative resolutions (supersede the stale plan text)

Recorded here so `/implement` has an unambiguous instruction without a further
plan revision. These override any conflicting wording in `plan.md`:

1. ~~**`proxy.ts` is authorised for the Phase C variable rename only.** The
   middleware exclusion list must **not** be edited — step 6 was cut (FU-15), and
   the surviving "deletion of dead exclusion entries" clause is void.~~

   **SUPERSEDED 2026-07-19 by verification evidence.** This resolution was wrong
   on the facts. `/verify` FAILED AC-1 and AC-2: `/api-test` and `/requests-log`
   return 200 with the storefront homepage, because leaving their names in the
   exclusion list makes them skip the locale redirect and fall through to the
   `[lang]` dynamic segment. The reasoning behind cutting step 6 — that no
   acceptance criterion required the edit — was mistaken; AC-1 and AC-2 depend on
   it.

   **Replacement resolution.** `proxy.ts` is authorised for the Phase C variable
   rename **and** for removing exactly two strings from the middleware exclusion
   list: `api-test` and `requests-log`. Nothing else in that list may be touched.
   The remaining entries include live paths — the analytics ingest proxy, the
   webview call routes, and public asset directories (`assets`, `fonts`,
   `icons`, `images`, `styles`, `translations`) — and removing any of them would
   push real traffic through locale-redirect and bot-detection logic. The other
   stale entries (`sentry-test`, `fcm-dashboard`, `testBoutique`,
   `backend-compare`, `noposter`, `selectCountry`) are deliberately left alone:
   they are out of scope and carry the same risk of misclassification.
2. **The proxy route handler performs the identifier reversal** (step 14).
   `utils/server/tokenManager.ts` consumes readable names and must **not** import
   or re-implement the mapping; its Phase D file-list annotation is void.
3. **Verification of the client-graph check** asserts that each outgoing request
   URL has the expected backend origin, not merely that it does not begin with
   `undefined` — an empty base URL produces origin-relative requests that the
   narrower check would miss.

## Decision

`APPROVED`

- Rationale: The approach is sound and now internally consistent on every point
  that governs implementation. Round 1's blocking defect (the mapping placed in a
  module importing `next/headers`) and round 2's (a step that reversed a settled
  owner decision and named no target file) are both properly resolved. The two
  remaining findings are stale sentences left by the revision's own edits, not
  design faults; both are resolved authoritatively above, which removes the
  ambiguity without a fourth cycle. Scope is tight, the file list is explicit
  enough for IM-2/IM-4, and the ticket states honestly what it does and does not
  achieve. Comprehension check passed 3/3 (CG-4).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer (self-review, ADR-011) — 2026-07-19

## ADR reference

- ADR: none

## Required Follow-up Actions

- None blocking implementation. The three authoritative resolutions above are
  binding on `/implement` and take precedence over the conflicting plan text.
