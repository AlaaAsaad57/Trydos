---
ticket: e2e-product-comments-and-reactions
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-21
links:
  clickup:
  github:
---

# Review — e2e-product-comments-and-reactions

> Review gate — run by the ticket owner themselves (self-review). A comprehension
> check at the gate is the integrity control. Evaluates the spec and plan before
> any implementation.

## Review Scope

`spec.md` (AC-1..AC-26) and `plan.md` as they stand on disk, with `research.md`
as background. The plan had already been revised twice against informal panel
rounds before this gate; the panel below ran again on the current text.

Step 1 validation passed: the Integration surface is explicit (`PL-11`), no
`OQ-n` is left open (`PL-12`), every `AC-n` carries a Tests row and every test
file named there also appears under Files to change (`PL-13`), each row records
a search and one disposition with `extend` used on the existing file rather than
a parallel one (`PL-14`), and a validation profile is named.

No `comprehension.md` existed in the workspace, so nothing was retired and this
is `attempt: 1`.

## Plan Summary

Add one browser journey, `tests/e2e/comments.live.spec.ts`, in eight serial
cases (`CMT-01`..`CMT-08`) covering: the shopper likes the QA product and asks a
question from both places the page offers, edits and likes both, translates one;
the seller finds the product card by walking the grid and answers both
questions; the shopper returns, likes both answers, then removes every like,
deletes both questions and unlikes the product — with a bounded re-read after
each undo proving it survived.

Supporting it: `data-pw` hooks in six storefront and three dashboard files, a
pure page-walk helper with its own unit test, three new action files, and
entries in `selectors.ts`, `laneConfig.ts`, `liveSession.ts`, the scenario list
and the suite README. No product behaviour changes.

## Risks

- Every read in this flow is served by Elasticsearch, which is written
  asynchronously by the comments backend. The whole "survives a reload" half of
  the spec sits on that gap.
- The journey writes real data with two real accounts on a real environment, and
  three of the six `major` findings below concern what happens to that data when
  a step goes wrong.
- It joins a one-worker lane bounded at 85 minutes, and the cost estimate rests
  on one comparable rather than a measurement.

## Assumptions

- The QA seed has run, so the QA product and the seller's saved session exist.
- The QA seller holds `READ_COMMENTS` and `REPLY_COMMENT`.
- Nobody but this suite writes to the QA shop, which is why the comments list
  needs no paging.
- The comments backend stores the question text verbatim, which is what the
  run-token bind depends on.

## Open Questions

- None left by the plan. `OQ-3` and `OQ-8` were both answered there.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1).
>
> **Advisory only:** these inform the owner; they never block the decision
> (RP-2).

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| senior | major | The teardown cannot delete the seller reply at all: `handleDeleteReply` returns early on a `window.confirm`, which Playwright dismisses by default, and the Delete Reply button carries no hook and is in no hook list — so `afterAll` would report success while the reply stays on the QA product. | AC-23; plan "Teardown"; `components/SellerDashboard/CommentsTab.tsx:198-207, 379-390` | |
| security | major | The teardown's reply delete carries no ownership proof: the two-part check is written only for the reply *write*, while `afterAll` deletes from a remembered id and the server scopes the delete by shop alone — a drifted id would strip a real customer's answer. | AC-23; plan "Teardown" vs "Safety"; `services/elastic/sellerComments.ts:617-646` | |
| security | major | A mis-bound reply is unrecoverable: `upsertReply` is create-OR-edit, so writing to a card that already holds a genuine answer overwrites that text with no copy kept. | plan "Safety: the reply is bound by a mark in the data"; `services/elastic/sellerComments.ts:545-583` | |
| senior | major | The Integration surface misses two files the journey must drive: the extended area's ask box is `components/products/CommentBar.tsx`, not `FaqAskInput.tsx`, and the product heart is `ProductFooter.tsx/ProductLikeButton.tsx`. Neither is named anywhere in the plan, yet `AC-2`, `AC-4`, `AC-21` and `AC-22` all read them. | AC-2 / AC-4 / AC-21 / AC-22; plan "Files to change", "Integration surface" | |
| performance | major | The checkpoint reloads the whole product page up to six times per checkpoint, but `/api/products/comments/fqa_comments` already returns every value it re-reads — the liked state and the text, per comment, for a given user. | plan "The checkpoint re-read"; `app/api/products/comments/fqa_comments/route.ts` | |
| performance | major | `CMT-03` and `CMT-04` each hold a bounded dashboard re-read worth about 105 seconds, yet the budget table gives them 180 seconds — the plan's own rule that a 60-second bound does not fit a short case is not applied to its own dashboard checkpoint. | AC-12 / AC-13; plan "Time budgets, written down" | |
| senior | minor | `E-6` and the out-of-scope bug are written too broadly: `ProductLikeButton` does check `res.success`, roll the heart back and show an error. Only the **comment** like ignores its answer. | spec E-6, spec "Out of Scope"; `ProductFooter.tsx/ProductLikeButton.tsx:53,90,120-131` | |
| senior | minor | Mechanic 1 promises to tell a proxy refusal from a backend answer, but `/api/proxy` passes the upstream status through unchanged and adds no marker for the comments service, so the two look alike unless the body is read — which the same section bans. | plan "Reading what a backend answered"; `app/api/proxy/route.ts:421-427` | |
| senior | minor | `afterAll` still runs when both skip guards skip every case, so the teardown would open sessions a skipped run never created. | AC-25; plan step 8 | |
| senior | minor | The `AC-24` unit case names this one file, but `laneSpecs()` already throws for **any** spec in no lane — one generic case would guard every spec, now and later. | AC-24; plan "Files to change" → `tests/harness/qaHarness.test.ts` | |
| senior | minor | The 85-minute lane `globalTimeout` and the 100-minute CI cap are not in the Integration surface, although 31 minutes of new budget could push the lane over and turn every other account-lane spec red. | plan "Time budgets", "Integration surface" | |
| senior | minor | Smallest-change note: `gridWalk.ts` and its test exist only to prove a walk the one-product QA shop can never run in the browser; the smaller option is to drop `FR-9` / `AC-11` until a second product exists. | FR-9 / AC-11; plan "The page walk is built now, and proven now" | |
| security | minor | The dashboard comments list renders real customers' names, avatars and question text, and the live project records `video: "on"` for **every** case, so third-party data reaches an artifact on green runs too. | plan "Integration surface > Kept artifacts"; `playwright.config.ts:146-166` | |
| security | minor | The plan leans on `redact()` for the no-PII rule, but that helper masks configured secrets and token shapes only — it cannot mask a customer's name or question text. | plan "Reading what a backend answered"; `tests/e2e/harness/redact.ts` | |
| security | minor | The run-token bind assumes the backend stores and the dashboard renders the question text verbatim; any trim or normalisation makes every reply refuse, and the seller half fails closed looking like a backend fault. | plan "Safety"; compare `sanitizeReply`, `services/elastic/sellerComments.ts:535-543` | |
| security | minor | "On a product no shopper sees" is not accurate: the QA product opens by address for anyone, including a guest, so the questions and the test identity's display name are publicly readable at that URL until teardown. | plan "Teardown", "Rollback"; `tests/e2e/actions/qaProduct.ts:28-32` | |
| performance | minor | The read-limiter cost model is wrong: `GetProductsSocial` sends **one** batched request for all missing ids, so a grid page costs one read token, not one per product. | plan "The dashboard is not re-read the same way", Integration surface | |
| performance | minor | The checkpoint opens the extended area on every iteration, but the in-page strip renders both questions too, so up to 24 extra comment-list fetches may be avoidable. | plan "The checkpoint re-read" step 2; `FaqQuestionsList.tsx:71-76` | |
| performance | minor | Eight top-level cases mean eight contexts and eight loads of the heaviest page in the app, while `test.step()` already names the failing step and serial mode already stops the rest. | plan Approach; the `CMT-01`..`CMT-08` rows | |
| performance | minor | `video: "on"` applies to every context, so this journey adds about ten recordings — including the two `afterAll` contexts, which carry no assertion to debug. | `playwright.config.ts:163`; `harness/liveSession.ts:88` | |

**Confirmed by the panel, no action:** every comment write really is a `POST` to
`/api/proxy` carrying `x-proxy-url`; `request.headers()` excludes cookies;
`realId` strips the `-seller_reply` suffix; the live project records no trace and
the lane encrypts artifacts with three-day retention; `.auth` and `.artifacts`
are gitignored; the unit project really does exclude `tests/e2e/**`; and no
protected runtime path appears in Files to change.

## Decision

`APPROVED`

- Rationale: The owner accepted the plan as written, with the six `major`
  findings dispositioned below. The comprehension gate passed 4/4 at
  `attempt: 1`, in degraded form — `4 of 5 administered`, two questions cleared
  the falsifier outright and two were admitted on its miss. The plan was **not**
  edited at this gate (`RV-11`).
- Consequence, stated plainly: four of the six majors are mitigated inside files
  the plan already lists, so `/implement` may carry them out. **Two are not.**
  Finding 5 (the checkpoint could poll a cheap route instead of reloading) and
  finding 6 (`CMT-03` / `CMT-04` budgets) would change decisions the approved
  plan states in words. Finding 5 is accepted as-is and carried to a follow-up
  ticket; finding 6 is a one-number correction that `/implement` applies and
  **records in `implement.md` as a deviation from the plan's table**. Nothing
  else departs from the approved text.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — self-approved at the comprehension gate,
  `comprehension.md` `attempt: 1`, `result: passed`, `score: 4/4`.

## Major finding dispositions

| # | Finding | Disposition |
|---|---------|-------------|
| 1 | The teardown cannot delete the reply (`window.confirm`, no hook) | **Mitigate.** `CommentsTab.tsx` is already under Files to change, so `/implement` adds a hook to the Delete Reply control and the spec accepts the dialog rather than letting Playwright dismiss it. |
| 2 | The teardown's delete carries no ownership proof | **Mitigate.** The teardown lives in the new spec file. The same two-part check runs before the delete, and a card it cannot prove is its own is **skipped, not failed** — a teardown that throws would replace the failure the run was reporting. |
| 3 | A mis-bound reply overwrites a real answer with no copy kept | **Mitigate.** A third condition: refuse any card that already shows an answer. Every card this journey owns is unanswered at the moment it replies, so the condition costs nothing and closes the unrecoverable case. |
| 4 | `CommentBar.tsx` and `ProductLikeButton.tsx` are absent from the file list | **Accept.** Both already carry the hooks the journey needs, so no application edit follows. `/implement` records them in `implement.md` as read-only surfaces it drove, which is what the Integration surface should have said. |
| 5 | The checkpoint reloads the whole page when one route returns the same values | **Accept as planned, improve later.** The reload count is capped at six per checkpoint and the cost is known and bounded. Swapping the mechanic is a plan-level decision, not an implementation detail — it goes to a follow-up ticket rather than being changed under an approved plan. |
| 6 | `CMT-03` and `CMT-04` hold a ~105 s re-read but sit in the 180 s row | **Mitigate.** `/implement` budgets both at 240 s, consistent with the plan's own rule, and records the deviation from the budget table in `implement.md`. |

## ADR reference

- ADR: none

## Required Follow-up Actions

Binding on `/implement`:

1. Add a hook to the Delete Reply control in `CommentsTab.tsx` and accept its
   confirm dialog, so `AC-23`'s seller half really removes the reply.
2. Run the id-plus-run-token check before the teardown's delete, and skip
   quietly when it cannot be proved.
3. Refuse to answer any dashboard card that already shows an answer.
4. Budget `CMT-03` and `CMT-04` at 240 s, and record that deviation.
5. Record `CommentBar.tsx` and `ProductLikeButton.tsx` in `implement.md` as
   surfaces the journey drives without editing.
6. Correct nothing in `spec.md`: `E-6` is too broad (only the **comment** like
   ignores its answer), so `/implement` records that as a `BUG-n`-style finding
   rather than silently narrowing an approved criterion.

Separate tickets, not this work item:

7. The comment `LikeButton` ignores the result of its like and unlike calls, so
   a refused like is never rolled back. `ProductLikeButton` does **not** have
   this defect.
8. Poll `/api/products/comments/fqa_comments` instead of reloading the product
   page in the checkpoint.
9. The dashboard comments list renders real customers' names and question text
   into a `video: "on"` recording on every run, green ones included.
