---
ticket: e2e-product-comments-and-reactions
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-21
links:
  clickup:
  github:
---

# Spec — e2e-product-comments-and-reactions

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser journey for product comments, replies and reactions.

## Business Goal

Asking a question about a product, getting the seller's answer, and reacting to
either is a shopper-facing loop that nothing tests today. The dashboard half has
unit tests; the storefront half has none, in either suite. A break in it is
silent until a shopper meets it.

This work item adds one browser journey that plays the whole loop with two real
accounts on the real staging environment, and proves that every action, and
every undo, is still there after the page is reloaded.

## User Story

> As the team that ships the storefront, I want a browser journey that asks,
> edits, answers, likes, unlikes and deletes a product question with two real
> accounts, so that a break in that loop is found before a shopper finds it.

## Functional Requirements

The journey plays one story in a fixed order. It uses the QA-marked product, so
nothing it writes can reach a shopper.

**The shopper (user 1)**

- FR-1 — The shopper signs in and opens the QA product.
- FR-2 — The shopper likes the product.
- FR-3 — The shopper asks a question from the FAQ section inside the page.
- FR-4 — The shopper asks a second question from the extended comment area the
  footer opens.
- FR-5 — The shopper edits each of the two questions, from the place it was
  asked, and the new text is what the page shows.
- FR-6 — The shopper likes each of the two questions.
- FR-7 — The shopper asks the app to translate a question, and the journey
  judges only what the comments backend answered.

**The seller (user 2)**

- FR-8 — The seller opens their own dashboard product list without signing in
  again.
- FR-9 — The seller finds the QA product card by walking the list page by page.
  The card is never assumed to be on the first page.
- FR-10 — The product card shows the shopper's product like in its reaction
  count, and "the count is not there yet" is reported as a different thing from
  "the like is missing".
- FR-11 — The seller answers both questions from the dashboard.

**The shopper returns**

- FR-12 — Both seller answers are on the product page.
- FR-13 — The shopper likes each of the two answers.
- FR-14 — After a reload, the two questions, their edited text, the two answers,
  the two question likes and the two answer likes are all still there.
- FR-15 — The shopper removes the like from each question and each answer.
- FR-16 — After a reload, all four removals are still in force.
- FR-17 — The shopper deletes both questions and removes the like from the
  product.
- FR-18 — After a reload, both questions are gone and the product is not liked.

**Everything the journey creates, it removes**

- FR-19 — The two questions, the two answers and the product like are registered
  for removal at the moment each is created, so a failure part-way through still
  clears them.

## Non-Functional Requirements

- NFR-1 — **A failure names the step.** Every step that can break on its own
  carries its own check and its own message, written for somebody who did not
  write the journey.
- NFR-2 — **A failure that crossed a backend names the backend.** This loop
  touches the comments backend (every write the shopper makes), Elasticsearch
  (every read, and the seller's answer) and the core backend (the seller's shop
  permissions). "The comment was not saved" is not a finding; "the comments
  backend refused the create" is.
- NFR-3 — **Every "it survived the reload" check waits, and the wait is
  bounded.** The bound is **60 seconds**, and when it runs out the message says
  the value was not readable within 60 seconds — never "the like was lost".
- NFR-4 — The journey's own time budget must be large enough for at least one
  bounded wait to run out without the case being killed first.
- NFR-5 — No token, one-time code or phone number appears in any message,
  screenshot or kept artifact.
- NFR-6 — The journey signs in **once** per identity, and the seller signs in
  not at all: it opens the session the QA seed saved.
- NFR-7 — No step retries a write.

## Constraints

- C-1 — **The product must be the QA-marked product.** The seller half only
  works because that product belongs to the QA shop the second account owns.
- C-2 — **When the QA seed did not run, the whole journey skips**, with the
  shared reason the suite already uses. It must never fall back to a real
  seller's product.
- C-3 — **A question can only be edited while it has no answer.** The app
  removes the Edit control once the seller answers. So the edits happen before
  the seller replies, and the order of this journey is not free to change.
- C-4 — **The journey runs in the lane that owns the shared accounts**, never
  beside a second copy of itself.
- C-5 — **Locators come from the app's own test hooks.** Matching on visible
  text is not allowed: every string in this app is translated.
- C-6 — A step that is red because a backend is wrong **stays red** and names
  that backend. It is not skipped, loosened or retried.
- C-7 — The journey writes only to the QA product. It changes nothing else on
  the environment.

## Edge Cases

- E-1 — The seller's account may lack the permission to read or answer comments.
  The journey then says the permission is missing, not that the screen failed to
  load.
- E-2 — The product card's counts arrive after the card does. The journey tells
  "not answered yet" apart from "zero".
- E-3 — The reaction count on the product card is the **product** like, not a
  question like. The journey must not confuse the two.
- E-4 — Translation may not be configured on the environment at all. The journey
  reports what the comments backend answered and stays red if it refused.
- E-5 — The same question is drawn by three different widgets on the page. A
  check must say which widget it read.
- E-6 — A like that the backend refuses still turns the heart on, because the
  app never reads the answer. Only the reload check can see it. The reload
  message must therefore be readable as "the backend never stored it".

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Keep the requested order: both edits happen before the seller answers. Add one criterion that the Edit control is gone once a question has an answer. | C-3, AC-16 |
| OQ-2 | Dropped, as the request asked. The dashboard cannot like a comment — its heart is display-only — so there is nothing to drive. No check is added for it; adding one would be work the request did not ask for. | Out of Scope |
| OQ-3 | Deferred. Which hooks are added, and where, is the approach. | Open Questions |
| OQ-4 | Every "survived" check polls, bounded at 60 seconds, and says so when it runs out. | NFR-3, NFR-4 |
| OQ-5 | The journey asserts the liked state by name. It also asserts the count **moved in the right direction** against the number read immediately before the action — never an absolute number. | AC-6, AC-13, AC-18 |
| OQ-6 | The two questions, the two answers and the product like are all registered for removal at the moment they are created. | FR-19, AC-23 |
| OQ-7 | "Succeeded" means the comments backend answered the translate call with success. The text on screen is not the signal — an echo of the input would satisfy it. | FR-7, AC-8 |
| OQ-8 | Deferred. The file, the case-id prefix and the lane entry are the approach. | Open Questions |
| OQ-9 | The journey checks the seller is offered the comments section, and names the missing permission when they are not. | E-1, AC-10 |
| OQ-10 | Out of scope as a fix. The app never reads the answer to a like call, so a refused like is never rolled back. It is recorded as a finding with its own ticket, and E-6 makes sure the journey's message does not hide it. | Out of Scope |
| OQ-11 | Yes. A row per case is recorded in the suite's own scenario list, which is the rule the suite README states. That the last two journeys did not is a gap, not a precedent. | AC-24 |

## Open Questions

- **OQ-3** — Which test hooks are added, and to which components? Deferred to
  `/plan`, which names every file it changes.
- **OQ-8** — Which spec file, which case-id prefix, and which lane entry?
  Deferred to `/plan`.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | The shopper signs in once and the QA product page opens and shows the product's name. | FR-1, NFR-6, C-1 |
| AC-2 | Liking the product is accepted by the comments backend and the product heart reads liked. | FR-2 |
| AC-3 | A question asked from the FAQ section inside the page is accepted, and that section then shows it. | FR-3 |
| AC-4 | A question asked from the extended comment area is accepted, and that area then shows it. | FR-4 |
| AC-5 | Each question, edited from the place it was asked, shows its new text — and the two are checked separately. | FR-5 |
| AC-6 | Liking each of the two questions leaves that question reading liked, with its count one higher than the number read just before. | FR-6 |
| AC-7 | A reload after the edits shows both questions with their edited text. | FR-5, NFR-3 |
| AC-8 | Asking for a translation returns success from the comments backend. | FR-7 |
| AC-9 | The seller reaches their own dashboard product list using the saved session, without any sign-in. | FR-8, NFR-6 |
| AC-10 | The seller is offered the comments section; when they are not, the failure names the missing permission. | FR-11, E-1 |
| AC-11 | The QA product card is found by walking the list page by page, and a failure says how many pages were walked. | FR-9 |
| AC-12 | The product card's reaction count reflects the shopper's product like, and "the counts have not answered" is reported separately. | FR-10, E-2, E-3 |
| AC-13 | Each question is answered from the dashboard, and the dashboard then shows that answer against that question — the two are checked separately. | FR-11 |
| AC-14 | Both answers are visible to the shopper on the product page. | FR-12 |
| AC-15 | Liking each of the two answers leaves that answer reading liked, with its count one higher than the number read just before. | FR-13 |
| AC-16 | A question that has an answer no longer offers the shopper an Edit control. | C-3 |
| AC-17 | After a reload, both questions, both edited texts, both answers, both question likes and both answer likes are all still there — each checked by name. | FR-14, NFR-3 |
| AC-18 | Removing the like from each question and each answer leaves each reading not liked, with its count one lower than the number read just before. | FR-15 |
| AC-19 | After a reload, all four removals are still in force — each checked by name. | FR-16, NFR-3 |
| AC-20 | Deleting each question removes it from the page, and the two are checked separately. | FR-17 |
| AC-21 | Removing the like from the product leaves the product heart reading not liked. | FR-17 |
| AC-22 | After a reload, neither question is on the page and the product is not liked. | FR-18, NFR-3 |
| AC-23 | The journey removes everything it created, and a failure part-way through still removes what had been created by then. | FR-19 |
| AC-24 | The journey is recorded in the suite's scenario list, one row per case, and it runs inside the lane that owns the shared accounts. | C-4, OQ-11 |
| AC-25 | With no QA seed on the environment, the journey skips with the suite's shared reason and writes nothing. | C-2 |
| AC-26 | Every check in the journey carries a message that names the step, and every check that crossed a backend names that backend. | NFR-1, NFR-2 |

## Out of Scope

- **Liking a comment as the seller.** The dashboard's heart is display-only, so
  there is nothing to drive. The request said to ignore it if the code says no,
  and the code says no.
- **Fixing the unchecked like answer.** The app throws away the result of a like
  or unlike call, so a refusal is never rolled back. This is recorded as a
  finding with its own ticket; no application behaviour is changed here.
- **Buyer reviews (the star-rated comments).** A different section, a different
  endpoint, and not part of the requested flow.
- **Editing or deleting a seller answer**, and translating a seller answer. The
  dashboard offers the first two and the page offers the third; none is in the
  requested flow.
- **The FAQ bottom sheet as a third place to ask.** It cannot ask — it only
  lists, edits and deletes.
- **Any change to how comments, likes or replies behave.** This work item adds a
  test and the hooks it needs to drive one. It changes no product behaviour.
