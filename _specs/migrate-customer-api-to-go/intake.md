---
ticket: migrate-customer-api-to-go
stage: intake
mode: standard
status: in_progress
owner: ai_agent
updated: 2026-07-11
links:
  clickup: https://app.clickup.com/t/86ey26atu
  github:
---

# Intake — migrate-customer-api-to-go

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

- Slug: `migrate-customer-api-to-go`
- ClickUp task: [86ey26atu — Customer Profile Endpoints to Go](https://app.clickup.com/t/86ey26atu)
  — **written for the Go backend team**; for this ticket it is the **API contract /
  reference**, not the work to be done here.

## Ticket Summary

**This ticket is scoped to the Trydos Next.js app** (this repo). The Go backend is
(separately) porting four `customer/` endpoints from Laravel into the Go Store
Gateway; our job is to **migrate this app's client-side customer API calls to
consume the new Go endpoints** — `GET customer/info`,
`POST customer/update-profile`, `POST customer/update-name`, and
`GET customer/approve-policies` — served under `NEXT_PUBLIC_GO_BACKEND_URL`.

The ClickUp task (link above) is the **source of truth for the endpoint contract**:
request bodies, validation rules, response envelopes/messages, and the User-resource
response shape. We use it as reference to point our fetch layer at the Go endpoints
and align to their request/response parity — we do **not** implement the Go
handlers here.

In scope (Next.js): repointing the customer profile / update-profile / update-name /
approve-policies calls to the Go endpoints, aligning request payloads and
response-shape handling (User-resource fields, message strings, `{ customer_info }`
vs bare-resource vs empty-string `data`), and mapping the structured Go error
envelope (401 / 400 / 403 / 500) into the app's existing error handling. Out of
scope: implementing/altering any Go handler, and the other `customer/` areas
(`address|order|wallet|loyalty|chat|support-ticket|product_comment`,
`mySettings`, `updateCmFirebaseToken`, `saveInvitedContacts`).

> The contract's full acceptance criteria and test cases live in the ClickUp task
> (link above). In `spec.md` they will be adapted into acceptance criteria for the
> **Next.js consumer** (correct endpoint, request parity, response/error handling),
> and given stable `AC-n` IDs.

## Ticket Metadata

- id / slug: `migrate-customer-api-to-go`
- title: Customer Profile Endpoints to Go
- owner: ai_agent
- created: 2026-07-11
- links: ClickUp https://app.clickup.com/t/86ey26atu

## User Story

> As a Trydos customer using the Next.js app, I want my profile view/edit, display-name
> change, and policy-approval actions to work seamlessly against the new Go backend,
> so that these features keep behaving exactly as before once the Laravel customer
> endpoints are retired — without any visible change to me.

> (Underlying business story, per the Go contract: an authenticated customer wants to
> read/update their own profile, change their name, and approve policies through the
> Go Store Gateway. Our work makes the app consume that new backend.)

## Acceptance Criteria Presence Check

- Present? yes
- Notes: The ClickUp task carries a full, grouped acceptance-criteria set for the
  **backend contract** (Scope & Tenant Safety, Authorization, General Behavior,
  Form Fields, Behavior After Saving, Validation & Constraints, UI & API
  Consistency, Audit & Logging). In `spec.md` these will be adapted into
  Next.js-consumer criteria — correct endpoint targeting, request-payload parity,
  and correct handling of the Go response/error shapes — with stable `AC-n` IDs.
  Tenant-safety / audit-logging criteria are the backend's responsibility and are
  out of scope for our client changes.

## Test Cases Presence Check

- Present? yes
- Notes: The ClickUp task lists backend test cases (read profile, update with
  verified phone, approve policies, missing-name, mismatched phone token,
  duplicate email, auth failure, cross-tenant isolation). For our app these
  translate to consumer-side checks: the app calls the correct Go endpoint with
  the right payload, renders the returned User resource correctly, and surfaces
  the 401 / 400 / 403 / 500 error envelopes through existing UX.

## Missing Information

- **Endpoint availability / base path:** confirm the four Go endpoints are live
  (or staged) under `NEXT_PUBLIC_GO_BACKEND_URL` and their exact paths, so the
  fetch layer can be repointed. To confirm at `/research`.
- **Current call sites:** the existing customer-profile fetch/service code in this
  repo (likely `services/auth.ts` + `utils/endpointConfig.tsx` + related
  server/action code) must be located during `/research` to scope the migration.
- The Laravel→Go migration epic ID and the Phone OTP guest-verification module
  reference are noted in ClickUp as "⚠️ to be linked by ID" — not blocking intake.

## Readiness Status

`READY`

- Justification: Scope is clear — a **Next.js consumer migration** to the new Go
  customer endpoints, with the ClickUp task as the API contract (not work we
  implement). It has a user story, adaptable acceptance criteria, and test cases.
  Reviewer signed off on 2026-07-11 to proceed to `/research`.
