---
ticket: migrate-customer-api-to-go
stage: spec
mode: standard
status: complete
owner: ai_agent
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Spec — migrate-customer-api-to-go

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Customer profile operations served by the Go backend (Next.js consumer migration).

## Business Goal

The customer-profile capabilities in the storefront (view profile, update
profile, change display name, approve platform policies) currently rely on the
legacy Laravel "market" backend, which is being retired. Moving these four
operations to consume the new Go Store Gateway keeps them working after Laravel
is decommissioned, with **no visible change** to customers — protecting a core
account-management journey during the platform migration. The corresponding Go
endpoint contract is owned by the backend team in ClickUp task 86ey26atu, which
this spec treats as the authoritative request/response reference.

## User Story

> As a Trydos customer using the storefront, I want to read my profile, edit my
> profile details, change my display name, and approve the platform policies and
> have them keep working seamlessly, so that my account management is unaffected
> when the legacy backend is retired and the new Go backend takes over.

## Functional Requirements

- FR-1 — The "read my profile" operation is served by the Go backend and returns
  the authenticated customer's own profile for display, preserving the current
  profile-view behavior.
- FR-2 — The "update profile" operation is served by the Go backend, sending the
  same set of profile fields as today and consuming the updated-profile response.
- FR-3 — The "change display name" operation is served by the Go backend.
- FR-4 — The "approve policies" operation is served by the Go backend and is
  idempotent (re-approving leaves the customer approved).
- FR-5 — All four operations present the customer's existing authenticated
  session credential to the Go backend, with **no** additional login step or UX
  change for the customer.
- FR-6 — The responses (profile field set, success messages, and empty-data
  success responses) are consumed such that every downstream app behavior that
  depends on them is unchanged: profile display, stored user-data
  synchronization, checkout policy-consent state, and the existing
  chat/wallet/stories side-updates and their rollback.
- FR-7 — Error responses from the Go backend (authentication failure, validation
  errors, invalid phone token, missing name, and unexpected server error) surface
  through the app's existing error/notification handling exactly as the legacy
  responses do today.
- FR-8 — The four operations are rerouted to the Go backend together (all four
  are confirmed reachable). Reverting is done by undoing the routing entries —
  retained as a disabled/commented fallback in the request-routing layer — which
  requires no caller-code change and restores prior behavior. No separate
  per-endpoint rollback mechanism is built.

## Non-Functional Requirements

- NFR-1 (Usability) — Zero visible change to the customer experience for the four
  operations while Go responses match the contract; no new prompts, delays, or
  layout changes.
- NFR-2 (Reliability / Rollback) — Rollback is a fast, low-risk routing revert
  (undoing the routing entries, kept as a disabled/commented fallback) requiring
  no caller-code change; it is not a separately built feature.
- NFR-3 (Security) — The session credential presented to the Go backend remains
  server-side only (never exposed to client-side code); no customer PII beyond
  what is sent today is added to client logs.
- NFR-4 (Scope containment) — The change stays within non-protected runtime paths
  so the ticket remains `standard` mode; touching a protected runtime auth/session
  path would require re-scoping to `high_risk`.

## Constraints

- ClickUp task 86ey26atu is the **contract of record**: the Go responses are
  confirmed byte-compatible with the legacy responses (identical envelope shapes,
  message strings, and profile field set) for each operation. This parity is a
  standing precondition — if it ever breaks, the migration is not correct.
- The Go backend shares the **same authentication/session layer** as the legacy
  backend: it accepts the same session credential the app already holds, so no
  re-login or credential change is required.
- All four Go operations are confirmed **deployed and reachable** on the target
  environment(s); cutover moves all four together.
- Only the four named operations move. All other customer-area operations
  (address, order, wallet, loyalty, chat, support ticket, product comment,
  settings, firebase token, invited contacts) remain served by the legacy backend
  and are untouched.
- The migration must not require changes to protected runtime auth/session paths
  (doing so would escalate the ticket to `high_risk` mode).

## Edge Cases

- Guest placeholder names ("guest"/"verified_guest") returned by "read profile"
  continue to be treated as "no name" so the UI still prompts for a real name.
- On "update profile", explicit clearing of nullable fields (image, alternative
  phone, gender, tall, weight) is preserved — clearing must still clear.
- The phone-verified state is treated as verified only when both a phone and its
  verification token are supplied, matching current behavior.
- Because responses are byte-compatible (same shape, same image URL host), the
  profile image continues to render with no image-host allow-list change — so no
  protected runtime path is touched on this account.
- A token that is expired/invalid at the Go backend triggers the app's existing
  re-authentication handling rather than a hard failure.
- Endpoint routing must target only the four intended operations and must not
  misroute any other path that happens to share a similar suffix.

## Open Questions

None remaining — all resolved by the ticket owner (2026-07-11) and captured as
decisions above:

- **Reachability:** all four Go customer operations are deployed and reachable on
  the target environment(s); cutover moves all four together.
- **Auth layer:** the Go backend shares the same authentication/session layer as
  the legacy backend and accepts the app's existing session credential — no
  re-login is forced.
- **Response parity:** every Go response is byte-compatible with the legacy shape
  (envelope keys, message strings, profile field set, and image URL host).
- **Image host:** unchanged (parity), so no image-host allow-list change and no
  protected runtime path is touched.
- **Rollback:** no separate rollback feature; reverting is done by undoing the
  routing entries (kept as a disabled/commented fallback in the request-routing
  layer).

## Acceptance Criteria Mapping

> Give each criterion a stable ID (AC-1, AC-2, …); `verify.md` references these.

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | When an authenticated customer opens their profile, the displayed data is retrieved from the Go backend and shows the same fields as before (name, phone, email, gender, tall, weight, image, policy-approval flag). | FR-1, FR-6 |
| AC-2  | Saving profile edits sends the same field set to the Go backend and, on success, the app reflects the updated values in the profile view and stored user data exactly as today. | FR-2, FR-6 |
| AC-3  | Changing the display name is sent to the Go backend and, on success, the new name appears everywhere in the app it does today. | FR-3, FR-6 |
| AC-4  | Approving policies is sent to the Go backend and, on success, the checkout policy-consent state reflects "approved"; re-approving remains "approved" (idempotent). | FR-4, FR-6 |
| AC-5  | All four operations present the current authenticated session credential to the Go backend with no additional login prompt or UX change. | FR-5, NFR-1 |
| AC-6  | A success message or empty-data success response from the Go backend is handled identically to today — no spurious error and the correct suppression of informational messages (e.g. "Data Got!", "policies approved!"). | FR-6, FR-7 |
| AC-7  | An authentication failure (missing/expired/invalid credential) from the Go backend triggers the app's existing re-authentication handling, with no credential or PII leaked to the client. | FR-7, NFR-3 |
| AC-8  | Validation/business errors from the Go backend (invalid phone token, uniqueness conflict on phone/email/alternative phone, missing name, out-of-range height/weight, invalid email) surface through the app's existing error handling with the corresponding message. | FR-7 |
| AC-9  | An unexpected Go backend failure surfaces as a generic error through existing handling, without exposing internal details. | FR-7, NFR-3 |
| AC-10 | All other customer-area operations remain served by the legacy backend and are unchanged. | Constraint (scope) |
| AC-11 | Rollback is available by undoing the routing entries (a disabled/commented fallback in the request-routing layer) with no caller-code change, and doing so returns the operations to the legacy backend and restores prior behavior. | FR-8, NFR-2 |
| AC-12 | With Go responses matching the contract, there is no visible change to the customer experience for the four operations. | NFR-1 |
| AC-13 | The change is confined to non-protected runtime paths; the ticket remains `standard` mode (or is explicitly re-scoped to `high_risk` if a protected path must change). | NFR-4, Constraint (mode) |

## Out of Scope

- Implementing or modifying any Go backend endpoint or its business logic (owned
  by the backend team; ClickUp 86ey26atu).
- The other customer-area operations (address, order, wallet, loyalty, chat,
  support ticket, product comment, settings/`mySettings`, firebase token,
  invited contacts).
- Any change to the OTP-sending pipeline or real image upload/storage behavior.
- Redesign of the profile, name-edit, or checkout consent UI — behavior parity
  only, no UX changes.
- Retiring/decommissioning the legacy Laravel service itself (a separate epic
  concern).
