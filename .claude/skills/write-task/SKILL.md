---
name: write-task
description: Write a TryDos backlog ticket (User Story / Work Item) that fully respects the TryDos Backlog Ticket Standard. Use whenever the user says "write-task", "write a task", "write a ticket", "create a backlog ticket", or asks for a ClickUp/User-Story work item for a TryDos feature.
---

# write-task — TryDos Backlog Ticket writer

Produce a backlog ticket that fully complies with the **TryDos Backlog Ticket Standard**
(`Ticket-Guide/Backlog Ticket Standard-*.md`). Any ticket that does not follow this
standard is rejected and sent back, so respect the format exactly.

## How to use

1. Take the feature the user describes (e.g. "add a comment section for seller dashboard").
2. Fill in **every required metadata field** at the top.
3. Write the body with **exactly the 3 sections, in this order**: User Story →
   Acceptance Criteria → Test Cases.
4. End with the **Ticket Quality Checklist**, with every box ticked `[x]` only if the
   ticket genuinely satisfies it.
5. Output the whole ticket in one markdown block the user can paste straight into ClickUp.

If a required metadata value is genuinely unknowable (Assignee, exact Sprint, Time
Estimate), put a sensible placeholder/estimate and flag it with `⚠️` so the user fills it,
rather than leaving it blank — a blank required field fails the standard.

## Required metadata (top of ticket — all required fields MUST be filled)

| Property | Required | Notes |
| --- | --- | --- |
| Title | ✔️ | Short, action-oriented: **Verb + Object** (e.g. "Create User", "Add Comment Section"). Never a vague noun ("Comments", "Users"). |
| Status | ✔️ | Start at `Backlog`. Workflow: `Backlog → Planned → TODO → In progress → Ready For Developer Review → Ready For EM Review → EM Testing (DEV ENV) → Ready For Release → In Release (STAGING) → Released To PROD` |
| Backbone | ✔️ | The module (e.g. Seller Dashboard, Admin Dashboard, RDP…) |
| Actor | ✔️ | One/more of: System Admin, Account Admin, Normal User, System (pick the real actor — e.g. Seller / Account Admin) |
| Assignee | ✔️ | Person responsible (placeholder + ⚠️ if unknown) |
| Time Estimate (h) | ✔️ | Hours (give a real estimate, flag ⚠️ if guessed) |
| Sprint | ⬜ | Optional relation |
| User Story Relation | ⬜ | Link to Epic by ID |

## Body — exactly 3 sections, in order

### 1) User Story
```
## User Story
As **a [Actor / role]**,
I want to be able to **[action / capability]**,
so that **[business value / benefit]**.

[One short paragraph: scope, key constraints, what is in/out of scope,
references to related stories by ID.]
```
Rules: must use **As / I want / so that**; `so that` must state a real benefit, not
repeat the action. The summary paragraph must state scope + constraints + in/out of scope.

### 2) Acceptance Criteria
Grouped into **named sub-sections**, each a **numbered list** of atomic, testable (yes/no)
statements. Use these sub-sections (drop any that truly don't apply, but cover the safety
ones):
- `## Scope & Tenant Safety` — tenant isolation explicitly addressed
- `## Authorization` — who may act; unauthorized → 403 (API) / control hidden (UI)
- `## General Behavior`
- `## Form Fields` → `### Required Fields`, `### Optional Fields`, plus `Rules:`
- `## Behavior After Saving`
- `## Validation & Constraints`
- `## UI & API Consistency` — UI and API enforce identical rules; structured errors
- `## Audit & Logging` — what is logged on success and on failure

### 3) Test Cases
At minimum these three, all in **Given / When / Then** format:
- `## Happy Path — [scenario name]`
- `## Validation Error — [scenario name]`
- `## Authorization Failure — [scenario name]`

## Hard rules (auto-reject if violated)
- Title is Verb + Object, not a vague noun.
- All required metadata filled.
- Body has all 3 sections in order, nothing else inserted between them.
- AC is grouped, numbered, atomic, testable — never one long paragraph.
- Tenant safety + Authorization + Validation explicitly covered.
- Test cases cover Happy Path, Validation Error, Authorization Failure in Given/When/Then.
- **No ambiguous words**: "maybe", "etc.", "should probably", "TBD" (unless an explicit ⚠️ placeholder).
- Related tickets referenced by ID when applicable.

## Finish with the checklist
Append this and tick honestly:
```
Ticket Quality Checklist
- [ ] Title is short and action-oriented (verb + object)
- [ ] Status, Backbone, Actor, Assignee, Time Estimate are filled
- [ ] Body contains all 3 sections: User Story, Acceptance Criteria, Test Cases
- [ ] User Story uses As / I want / so that format with a real benefit
- [ ] Summary paragraph includes scope, constraints, in/out of scope
- [ ] Acceptance Criteria are grouped into named sub-sections
- [ ] Every criterion is atomic and testable (yes/no)
- [ ] Tenant safety is explicitly addressed
- [ ] Authorization rules are clearly defined
- [ ] Validation rules are clearly defined
- [ ] Behavior After Saving is defined
- [ ] UI & API consistency is defined
- [ ] Audit & Logging rules are included
- [ ] Test Cases cover: Happy Path, Validation Error, Authorization Failure
- [ ] No ambiguous words ("maybe", "etc.", "should probably")
- [ ] Related tickets referenced by ID (if applicable)
```
