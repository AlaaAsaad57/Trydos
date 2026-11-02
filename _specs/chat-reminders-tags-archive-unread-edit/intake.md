---
ticket: chat-reminders-tags-archive-unread-edit
stage: intake
mode: standard
status: complete
owner: developer
updated: 2026-09-27
links:
  clickup:
  github:
---

# Intake — chat-reminders-tags-archive-unread-edit

> First stage. Qualify the request only. **No technical planning allowed.**
>
> **Retroactive.** The feature is already in the code (`0b6ed034`, `7d2a11c6`).
> This file records the request as it stood, so the spec and plan have a source.

## Ticket Reference

- Slug: `chat-reminders-tags-archive-unread-edit`
- Source request: `Tickets/Add-Chat-Reminders-Tags-Archive-Unread-And-Message-Edit.md`
  (local draft; `Tickets/` is not committed).
- Backend contract: `CHAT_API_CHANGES.md` (repo root).

## Ticket Summary

The web chat had five controls that did nothing: **Edit** message, the
**category** (tag) icon and **Reminder** in the message menu, and **Archive** and
**Unread** in the chat row options (`docs/features/README.md`, Domain E note;
`tester guide/chat.md` section 9). The chat backend now supports all five. The
request is to make them work.

## Ticket Metadata

- id / slug: `chat-reminders-tags-archive-unread-edit`
- title: Chat - message edit, tags and reminders; chat archive and unread
- owner: developer
- created: 2026-09-27 (record); code dated 2026-09-26 and 2026-09-27
- links: none

## User Story

> As a chat user (shopper or seller), I want to edit my own text messages, tag a
> message, set a reminder on a message, archive a chat, and mark a chat as
> unread, so that I can fix my mistakes, find important messages again, and keep
> my chat list clean.

## Acceptance Criteria Presence Check

- Present? yes
- Notes: the source ticket has grouped, numbered criteria. `spec.md` restates
  them as `AC-n` and corrects the ones the code does not match (for example, the
  folder rows always show; the draft said "only when not empty").

## Test Cases Presence Check

- Present? yes
- Notes: Given/When/Then cases and a 16-step QA path in the source ticket.

## Workflow Type Check

- Is the goal to *understand* something that already exists? No — the goal was
  to build the five actions.
- Is the goal to *choose between options*? No.
- Does a command reproduce behaviour contradicting a *sourced* expectation? No.
- Is the change to make already known, leaving only building it? Yes.

| | |
|---|---|
| Resolved type | `development` |
| Source | `asked` |
| ClickUp field said | — |
| Argument said | — |

## Missing Information

- Whether the chat backend refuses an edit of another user's message, and with
  which status. Carried to research as OQ-1.
- Whether a new message un-archives a chat on the chat backend. Carried to
  research as OQ-2.

## Readiness Status

`READY`

- Justification: the request, its criteria and the backend contract all exist.
  The two open points do not block the web work; they are recorded as questions.
