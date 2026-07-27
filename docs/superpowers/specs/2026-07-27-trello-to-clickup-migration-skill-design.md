# Trello → ClickUp batch migration skill — design

Date: 2026-07-27
Status: awaiting review

## Goal

We are migrating the backlog from Trello to ClickUp. Build a skill that, per run,
takes **5 cards** from one named Trello column, checks whether the app actually
implements each one, files each as a ClickUp task in the Product Backlog List, and
then moves the source card to a "moved to ClickUp" column.

The skill is a migration tool, not a grooming tool. It records what was found; the
human tests each ticket afterwards and promotes it out of `draft` by hand.

## Background

Three relevant facts about the current repo:

- `scripts/clickup_intake.py` is the only ClickUp HTTP code and is **read-only by
  design** — validation rule CU-3 forbids it issuing any write verb. It is used by
  `/start-ticket` and must not be modified.
- The `write-task` skill produces a very detailed ticket (metadata table, User
  Story, grouped Acceptance Criteria, Test Cases, QA Test Path, quality checklist)
  as a markdown file for **manual paste** into ClickUp. It never calls the API.
- There is no Trello code, config, or credential anywhere in the repo.

The ClickUp target is already known: team **Ramaaz Co** `90182710436` → space
**TryDosProject** `901811062695` → folder **Backlog** `901814525511` → list
**Product Backlog List** `901818662901`. Backlog statuses are
`draft → refining → ready for sprint → blocked → complete`.

## Decisions

| Question | Decision |
| --- | --- |
| Where do tickets land? | Created directly in ClickUp via the API. |
| Which list? | **Product Backlog List `901818662901` for every card**, regardless of the card's subject. No per-module folder routing. |
| Status on creation | Always `draft`, whatever the verification found. |
| Failed verification | Does **not** change the outcome. Every card is migrated; the finding is recorded as one sentence in the description. |
| Title | Prefixed `Trello: ` followed by a Verb + Object title. |
| Custom fields | **None set.** Work Item Type, Actor, Priority, Risk Level, Environment and Time Estimate are all left empty for the human to fill on promotion. |
| Body sections | User Story → Acceptance Criteria → QA Test Path. Nothing else. |
| Verification depth | Targeted code read per card — no build, no running the app. |
| Source | Board **trydos** `67616df0fcf625b9da792c4d`, column **staging not urgent** `6a42c2252aef68d21ceaee5b`. |
| Card filter | **Only cards assigned to `alaaasaaddev` `676180a45294bb6e13395dd9`** — 60 of the column's 230 cards. |
| Destination | Column **Moved To ClickUp** `6a38d2608989da3b937acfc4`. Already exists; never created by the skill. |
| Arabic cards | Title and body written in English; the original Arabic text preserved verbatim beside the Trello link. |
| Batch size | A `--count` parameter defaulting to 5. 60 eligible cards is ~12 runs. |
| Bug-shaped cards | One template for everything. A bug card becomes a User Story about the corrected behaviour; no second format, and nothing is routed to the Bugs list. |
| Clarification gate | **Mandatory.** After the fetch, the skill asks the user one question per card and stops until answered. Nothing is created for an unanswered card. |
| Local ticket file | Every migrated card also writes `Tickets/Trello-<Verb-Object-Title>.md`, which doubles as the ClickUp description body. |

## Design

### Scripts

All HTTP lives in `scripts/`, per the ADR-005 pattern the repo already follows for
ClickUp and GitHub. The two **Trello** operations are split into a read file and a
write file so the write surface is greppable. On the **ClickUp** side the create
script also owns its own duplicate lookup (a GET), because that lookup exists only
to guard the create and separating them would let the two drift apart; the read-only
guarantee that matters — `clickup_intake.py` never issuing a write verb — is
unaffected.

| File | Verb | Responsibility |
| --- | --- | --- |
| `scripts/trello_fetch.py` | GET only | Resolve a board and a column by name, return the first N cards as JSON |
| `scripts/clickup_create_task.py` | POST | Create one task in a list; print the new task id and url |
| `scripts/trello_move_card.py` | PUT | Move one card to a destination column |

`scripts/clickup_intake.py` is **not touched**. Its read-only guarantee stays intact.

Each script follows the existing `clickup_intake.py` conventions: standard-library
only (`urllib`), credentials from the environment, JSON on stdout on success, a
coded error on stderr and a non-zero exit on failure.

**`trello_fetch.py <board> <column> [--member <id>] [--count 5]`**
Auth is `key` + `token` query parameters read from `TRELLO_API_KEY` and
`TRELLO_TOKEN`. It calls `GET /1/boards/{board}/lists` to resolve the column name to
a list id (exact match, case-insensitive; an ambiguous or missing name is an error,
never a guess), then `GET /1/lists/{listId}/cards` requesting `idMembers`. When
`--member` is given it returns only cards whose `idMembers` contains that id, then
truncates to `--count`. Filtering happens **before** truncation, or a batch of 5
would mostly be other people's cards. It emits `id`, `name`, `desc`, `shortUrl` and
`idList` per card.

The member filter is not a convenience — it is what keeps verification meaningful.
The board mixes frontend, Laravel admin dashboard, backend and mobile-app work, and
checking an admin-dashboard card against this repo would report "not done" about
work that was finished in another codebase. Restricting to the owner's own cards
keeps every migrated card inside the repo being read.

**`clickup_create_task.py --list <id> --name <title> --description <file> [--status draft]`**
Auth is the `Authorization` header from `CLICKUP_API_TOKEN`. It POSTs to
`/api/v2/list/{list_id}/task` with `name`, `description` and `status`. The
description is passed as a **file path** rather than an argument, because the body is
multi-line markdown and Windows shell quoting makes that fragile. It supports a
`--find-by-name` mode that GETs `/api/v2/list/{list_id}/task` and reports whether a
task with an exact given name already exists — this is what makes the run idempotent.
That endpoint pages at 100 tasks, so the lookup pages through results until it finds
a match or exhausts the list; it must never report "not found" from a partial read,
because that would create a duplicate.

**`trello_move_card.py <card_id> --to-list <id>`**
`PUT /1/cards/{card_id}` with `idList`. Nothing else about the card changes.

### The skill

`.claude/skills/migrate-trello-batch/SKILL.md` orchestrates the scripts and does the
one thing they cannot: read the codebase and judge. Per run:

1. Call `trello_fetch.py` for 5 cards from the source column.
2. For each card, call `clickup_create_task.py --find-by-name "Trello: <title>"`.
   If a task already exists, do not create a second one — but **do** still move the
   card. A found duplicate means an earlier run created the task and then failed
   before the move, so completing the move is exactly the repair needed.
3. **Clarification gate.** Ask the user one question per card and stop until they
   answer. This is not optional: 36 of the 60 eligible cards have no description, so
   a title like "design Profile pages" cannot yield testable criteria on its own, and
   guessing produces a confident wrong ticket. The questions are multiple-choice so
   they are fast to answer. `AskUserQuestion` caps at 4 questions per call, so a batch
   of 5 takes two calls — the fifth card's question is never dropped to fit.

   The gate runs **before** the codebase search, because the answer tells you what to
   search for. Verifying blind and re-checking afterwards costs more and is less
   accurate.
4. **Verify.** Search the repo for the routes, components and services the card
   describes; read the files that matter; conclude **done**, **partially done**,
   **not done** or **not verifiable** with a one-sentence reason. This is a static
   read — it does not run the app, which is why every ticket carries a QA Test Path
   for the human to execute.

   For a cross-cutting card, search each surface separately. A single pass is not
   enough: the first pass on the pricing card concluded this repo never computes
   prices, and a second found two independent price paths — the very divergence the
   card was about.
5. Write `Tickets/Trello-<Verb-Object-Title>.md` from the user's answer plus the code.
   The filename uses a hyphen, never a colon: Windows forbids `:` in filenames, and
   Git Bash silently substitutes `U+F03A`, producing a name that only looks right.
   The ClickUp task title keeps the real colon.
6. Create the task at `draft`, passing that file as the description.
7. **Only after ClickUp returns a task id**, move the Trello card.

Ordering is load-bearing. Creating first means a ClickUp failure leaves the Trello
card untouched and the whole run repeatable. A failure in the other order would move
a card that was never migrated, silently losing it. The residual risk — a task
created but the card not moved — is caught by the step-2 existence check on the next
run, which skips the card and moves it.

A `--dry-run` flag performs steps 1–4 and prints what would be created and moved,
without issuing either write.

### Ticket format

Title: `Trello: <Verb Object>` — for example `Trello: Add Comment Section`. The verb
form comes from the `write-task` standard; a vague noun title is rewritten.

Body, in this exact order and nothing else:

```
**Implementation status:** partially done — <one sentence naming what exists and what is missing>

## User Story
As **a [actor]**,
I want to be able to **[capability]**,
so that **[benefit]**.

## Acceptance Criteria
1. …    (about six atomic, testable statements, written from the code)

# QA Test Path (non-technical)
1. …    (numbered click-by-click steps, each with an **Expect:**, ending in a
         pass/fail criterion — no file paths, code, or API names)

---
Migrated from Trello: <card shortUrl>
```

No metadata table, no Test Cases section, no quality checklist.

### Error handling

- Any missing credential, unresolvable board, or unresolvable column name aborts
  the run **before** the first card is touched.
- A per-card failure aborts that card only; the run continues with the remaining
  cards and the summary names every card that failed and why.
- A card that fails verification is not an error — it migrates like any other.
- The run ends with a summary table: card, verification result, ClickUp url or the
  reason it was skipped, and whether the Trello card moved.

## Build order

1. ~~Trello credentials~~ — done and verified live.
2. `CLICKUP_API_TOKEN` verified to reach Product Backlog List `901818662901` as user
   Alaa Asaad `113547927`, and `draft` confirmed as a live status on that list. It
   is a personal token, so it carries that user's own permissions; the write path
   itself is proven at step 4 by the throwaway task, not assumed here.
3. `trello_fetch.py`, tested against board `trydos` with the member filter — the
   expected result is 60 eligible cards.
4. `clickup_create_task.py`, tested by creating one throwaway task and deleting it.
5. `trello_move_card.py`, tested on a single card that is then moved back by hand.
6. The skill.
7. One `--dry-run` batch, then one real batch of 5.

Nothing external now blocks the build.

## Resolved inputs

`TRELLO_API_KEY` and `TRELLO_TOKEN` are stored in the gitignored `.env.development`
(confirmed untracked, matched by `.gitignore:74`). Both were verified live against
the API. Board, columns and member id are recorded in the Decisions table above.

Because the credentials were pasted into a chat transcript, treat them as
lower-trust than credentials that never left the machine; rotating the token at
trello.com/power-ups/admin once the migration finishes costs nothing and closes
that exposure.

## What the real data changed

Sampling the board before writing any code moved three things:

- **Descriptions are mostly empty.** 36 of the 60 eligible cards have no
  description at all, and across the board's "tested" columns the median
  description is 0 characters. The card title is the entire input. Acceptance
  criteria therefore come from the code, never from the Trello text — which was
  already the plan, but is now a requirement rather than a preference.
- **A vague title is a weak target.** Cards like "design Profile pages" give the
  verification step little to aim at. When a title is too vague to verify, the
  status line says so plainly rather than guessing a result.
- **The board is multi-codebase**, which is what motivated the member filter above.

## Out of scope

- Migrating attachments, comments, checklists, labels, members or due dates from
  Trello. Only title, description and the card link cross over.
- Any change to `clickup_intake.py`, `write-task`, or the Engineering Workflow v1
  commands.
- Setting ClickUp custom fields, or moving tasks out of `draft`. Both are the
  owner's manual step after testing.
- Two-way sync. The migration is one-way and one-shot per card.
