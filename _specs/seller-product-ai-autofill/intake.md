---
ticket: seller-product-ai-autofill
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-10-19
links:
  clickup:
  github:
---

# Intake — seller-product-ai-autofill

> First stage. Qualify the request only. **No technical planning allowed.**

## Ticket Reference

`seller-product-ai-autofill` — no ClickUp task. The request came from the owner
in chat on 2026-10-19. Source guide: `product-image-ai-autofill-frontend-guide.md`
in the repository root.

## Ticket Summary

Add an **"Add with AI"** button to the seller dashboard Products page. The seller
uploads a product photo. An AI model reads the photo and suggests the product
name, description, brand and the three category levels. Then the normal product
form opens with those values filled in. The seller checks them, edits them if
needed, and saves as usual.

## Ticket Metadata

- id / slug: `seller-product-ai-autofill`
- title: Seller dashboard: add a product with AI from a photo
- owner: developer
- created: 2026-10-19
- links: none (no ClickUp task yet)

## User Story

> As a seller, I want to upload a product photo and get the product form filled
> in for me, so that I can add a product faster and only correct what is wrong.

## Request details (as given by the owner)

- A new button **"Add with AI"** in the seller dashboard, Products section.
- Flow: the seller uploads an image → the AI analyses it → the product form opens
  pre-filled.
- Model: Google Gemini (`gemini-2.5-flash`, per the guide). The owner supplied an
  API key. On 2026-10-19 the key was checked against the Gemini API
  (`generativelanguage.googleapis.com`): a text call and an image-by-link call
  with a JSON response schema both answered HTTP 200. The key must live in a
  server-only environment variable and must never be committed.
- The brand and category lists come from **our existing lookups API**.
- A new **internal API route** calls the AI. Only the signed-in seller may call
  it — the same kind of protection the seller comments flow uses.
- The guide describes a backend-side version (admin / seller web panels). Here
  the work is in this Next.js app: our own route plays the backend role from the
  guide (Steps 4–8), and the dashboard plays the page role (Steps 1–3, 9–10).

## Acceptance Criteria Presence Check

- Present? **no** (not as numbered criteria)
- Notes: the guide describes the expected behaviour step by step (Steps 1–10,
  the error table, the limits). The `spec` stage turns that into `AC-n`.

## Test Cases Presence Check

- Present? **no**
- Notes: the `spec` stage defines them; the `plan` stage maps each `AC-n` to a
  test.

## Workflow Type Check

- Is the goal to *understand* something that already exists? **no**
- Is the goal to *choose between options*? **no** — the provider (Gemini) and
  the model are already chosen by the owner.
- Does a command reproduce behaviour contradicting a *sourced* expectation? **no**
  — this is a new feature, not a fault.
- Is the change to make already known, leaving only building it? **yes**

**How the type was resolved** (CU-7):

| | |
|---|---|
| Resolved type | `development` |
| Source | `argument` |
| ClickUp field said | — |
| Argument said | `development` |

## Missing Information

These are questions for `research`, not blockers for intake:

- Where the seller dashboard Products page and the product form live, and how
  the form receives starting values.
- Which lookups endpoint returns brands and the three category levels, and what
  auth it needs.
- How the seller comments route checks that the caller is the signed-in seller.
- How product images are uploaded to the media server, and what public link
  Gemini can fetch.
- Whether the guide's limit (10 AI calls per minute per user) is needed here,
  and with what tool.

## Readiness Status

`READY`

- Justification: the owner asked on 2026-10-19 to start this work item and run
  research, spec and plan. The feature, the provider and the access rule are
  known. The open points above are repository facts for `research` to find.
