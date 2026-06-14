# Add Comments Tab

## User Story
As **a Seller (Account Admin) or a Seller Employee with comment permissions**,
I want to be able to **view my shop's FAQ questions and product reviews, and reply to / edit / delete my own reply on FAQ comments, from a Comments tab in the Seller Dashboard**,
so that **I can answer buyer questions in one place without leaving the dashboard and improve product conversion**.

This story adds a "Comments" tab in the Seller Dashboard with two sub-tabs: **FAQ** and **Reviews**. FAQ comments support a single seller reply (create / edit / delete); Reviews are display-only. Reaction (heart) counts on the customer comment and the seller reply are shown read-only. In scope: viewing the list, pagination (load-more), reply create/edit/delete on FAQ, permission-gated controls, and rate limiting. Out of scope (NOT built): replying to reviews, hiding/reporting/pinning comments, bulk moderation, search/filter, seller reacting from the dashboard, and a per-action audit trail. Related: storefront customer-comment Epic — link by ID.

---

# Acceptance Criteria

## Scope & Tenant Safety
1. A seller can only see and act on comments belonging to a shop they own.
2. Another shop's comments are never returned, even if a different shop id is supplied in the request.
3. The acting shop is determined from the seller's authenticated session, not from values sent by the client.

## Authorization
1. The Comments tab is visible only to a user with the `READ_COMMENTS` permission (or Super Admin).
2. Replying requires `REPLY_COMMENT`, editing requires `EDIT_REPLY`, deleting requires `DELETE_REPLY`; Super Admin bypasses these.
3. Permissions are re-checked on the server for every action; hiding a button in the UI is not the only protection.
4. A seller can edit or delete only their own reply; they can never change a customer's original comment text.
5. An action attempted without the required permission is rejected on the server.

## General Behavior
1. The Comments tab has two sub-tabs: **FAQ** and **Reviews**.
2. Comments are listed newest-first.
3. Each customer comment shows: avatar, user name, text, date, rating (Reviews only), and a read-only heart count.
4. On FAQ, a comment with no reply shows a "Waiting Seller Reply…" state plus a Reply button (when permitted); a comment with a reply shows the reply (shop avatar, reply text, date, heart count) with Edit and Delete buttons (when permitted).
5. Reviews are display-only — no reply, edit, or delete controls are shown.
6. The list is paginated with a "Load more" button shown while more comments exist.

## Form Fields

### Required Fields
1. **Reply Text** — the seller's reply (FAQ only).

### Optional Fields
1. None.

Rules:
1. Reply Text is required; empty or whitespace-only input is rejected and not submitted.
2. Reply Text is capped at 1000 characters.
3. HTML/markup and control characters are stripped before saving; if nothing remains, the reply is rejected.

## Behavior After Saving
1. After a successful reply, the reply appears under the comment without a full page reload and the comment is marked as having a reply.
2. After editing, the updated reply text is shown.
3. After deleting (with a confirmation prompt), the reply is removed and the comment returns to the "Waiting Seller Reply…" state.

## Validation & Constraints
1. Reply length (1–1000 characters) and the non-empty check are enforced on the server, not only in the UI.
2. Page size defaults to 10 and is capped at 50.
3. Rate limiting applies per shop and session: reads 60 per 60s, writes (reply/edit/delete) 20 per 60s.

## UI & API Consistency
1. The server enforces the authoritative rules (length, sanitization, ownership, permission); the UI mirrors the empty/whitespace check before submit.
2. Actions return a consistent success/failure result.
3. The UI shows the failure message to the seller without exposing internal details.

## Audit & Logging
1. Server-side failures are reported to the error tracker.
2. Client-side reply/edit/delete failures are reported to the error tracker with a scenario label.
3. A per-action audit trail is intentionally not recorded.

---

# Test Cases

## Happy Path — Seller replies to an FAQ comment
**Given** an authenticated user with `READ_COMMENTS` + `REPLY_COMMENT`, on the FAQ sub-tab
**And** an FAQ comment that has no seller reply yet
**When** they open the reply modal, enter valid text (1–1000 chars), and submit
**Then**
- The reply is saved successfully
- The comment is marked as having a reply and the reply renders under the comment without a full reload
- The "Waiting Seller Reply…" state is replaced by the reply

---

## Validation Error — Seller submits an empty reply
**Given** an authenticated, permitted seller on an FAQ comment
**When** they submit a reply that is empty or whitespace-only (or empty after sanitization)
**Then**
- Submission is blocked and the modal stays open
- No reply is saved and the comment stays without a reply

---

## Authorization Failure — User without permission attempts to reply
**Given** an authenticated user who has `READ_COMMENTS` but lacks `REPLY_COMMENT` (and is not Super Admin)
**When** they attempt to create, edit, or delete a reply (including bypassing the hidden UI control)
**Then**
- The UI does not show the Reply/Edit/Delete controls
- The server rejects the action
- No comment data is changed

---

Ticket Quality Checklist
- [x] Title is short and action-oriented (verb + object)
- [x] Status, Backbone, Actor, Assignee, Time Estimate are filled
- [x] Body contains all 3 sections: User Story, Acceptance Criteria, Test Cases
- [x] User Story uses As / I want / so that format with a real benefit
- [x] Summary paragraph includes scope, constraints, in/out of scope
- [x] Acceptance Criteria are grouped into named sub-sections
- [x] Every criterion is atomic and testable (yes/no)
- [x] Tenant safety is explicitly addressed
- [x] Authorization rules are clearly defined
- [x] Validation rules are clearly defined
- [x] Behavior After Saving is defined
- [x] UI & API consistency is defined
- [x] Audit & Logging rules are included
- [x] Test Cases cover: Happy Path, Validation Error, Authorization Failure
- [x] No ambiguous words ("maybe", "etc.", "should probably")
- [ ] Related tickets referenced by ID (if applicable)
