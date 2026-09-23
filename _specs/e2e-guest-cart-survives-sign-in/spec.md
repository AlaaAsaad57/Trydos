---
ticket: e2e-guest-cart-survives-sign-in
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-23
links:
  clickup:
  github:
---

# Spec — e2e-guest-cart-survives-sign-in

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

Browser journey `BUY-05` — a guest's bag survives sign-in.

## Business Goal

A shopper often fills the bag as a guest and signs in only at checkout. If
sign-in drops the guest's bag, the shopper loses the items and often the sale.
The core backend merges the guest's bag into the account at sign-in. Today no
test watches that merge. This journey catches a break in it before a shopper
does, and it names the backend that broke.

## User Story

> As the team that ships the storefront, I want a browser journey where a guest
> adds the QA product and then signs in, so that a sign-in that loses the
> guest's bag is caught before a shopper finds it.

## Functional Requirements

- **FR-1 — Clean start.** Before the guest part, the journey signs in as the
  shared shopper, empties the account's bag, and signs out. After sign-out the
  app treats the visitor as a guest, not as the account.
- **FR-2 — Guest add.** As that guest, the journey puts the QA product in the
  bag. The gateway takes the add. The journey records the product's name and
  the quantity the bag shows.
- **FR-3 — Sign-in.** The guest signs in as the shared shopper through the
  navigation login widget. The app then reports the shared shopper, not a
  guest.
- **FR-4 — Bag read as the account.** After sign-in, the core backend answers
  the bag read.
- **FR-5 — Survival.** After sign-in, the bag holds the QA product line, by
  name, with the same quantity the guest's bag showed. The bag holds no other
  line.
- **FR-6 — Removal.** The journey removes the QA product line, and core accepts
  the removal (the removal is not refused and put back).
- **FR-7 — Removal sticks.** After one reload, the bag still holds no QA product
  line.
- **FR-8 — Clean-up on failure.** If the case fails after the product entered
  the bag and before the removal, the case handles the line when it ends. When
  the page is signed in as the shared shopper, it takes the QA product out of
  the account's bag. When the page is not signed in, the line is in a throwaway
  guest's bag (or the sign-in was refused and nothing merged), and the case
  records that in the report instead of spending another code. A clean-up that
  fails is reported, and is never hidden.
- **FR-9 — Failures say what broke.** Each step that can fail on its own has its
  own named step and its own check. A failure names the step and, where the step
  calls a backend, which backend (gateway or core).
- **FR-10 — Listed.** `BUY-05` appears in the suite's scenario list, with what it
  proves.

## Non-Functional Requirements

- **One-time codes:** the case spends exactly **2** real one-time codes per run
  (the clean-start sign-in and the guest's sign-in). No more.
- **Wait by signal, not by time:** every wait ends on an answer the app shows or
  a backend sends. No fixed sleeps.
- **No secrets in output:** no phone number, one-time code or token appears in a
  message, a log or a kept artifact.
- **Reliable:** the case gives the same result whether it runs alone or after
  the other money-path cases.

## Constraints

- A browser (live staging) test only. The merge happens inside the core backend,
  so the unit suite cannot reproduce it.
- **No application code changes.** If the journey shows the app is wrong, that
  is a finding with its own ticket, not a fix here.
- Uses the suite's own QA product only, never a real seller's product.
- Shops in one country for the whole journey (the one the QA product opens in),
  because the bag reads the country cookie.
- Runs with the other money-path cases in the account lane (one worker), because
  it signs in as the shared account and writes to its bag.
- Must not break or weaken `BUY-01`..`BUY-04`, or the sessions they hand on.
- A backend fault stays red and names the backend. It is never skipped, loosened
  or retried away.

## Edge Cases

- **The account's bag is not empty at the start** (an earlier run left lines,
  or a refused removal put one back). The clean-start step must end with a bag
  proven empty, or fail and say so.
- **The sign-out does not return a guest.** The case must fail at the sign-out
  step, not later at the survival check.
- **One sign-in leg fails** (e.g. wallet `502`, see `AUTH-01`). The market
  sign-in is what this case needs. A failed chat / stories / comments / wallet
  leg must not fail it; `AUTH-01` judges those.
- **The access token expires mid-journey** (60 s on staging). A first `401` is
  normal. The case judges the first answer that is not a `401`, and never
  navigates while a token exchange is in flight.
- **The QA product cannot be added** (stock ran down, product inactive). The
  case fails at the add step and says it is the suite's own product.
- **The merge keeps the line but changes the quantity.** This is a failure of
  FR-5, and the message states both quantities.
- **The merge adds an unexpected line.** This is a failure of FR-5, and the
  message names the extra line.
- **The removal is refused and restored by the app.** This is a failure of FR-6,
  and the message quotes what core said.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | Sign in as the shared shopper first, empty the bag, sign out, then start as a guest. Chosen by the owner, 2026-09-23. Costs 2 one-time codes per run. | FR-1, AC-1, AC-2, NFR "One-time codes" |
| OQ-2 | "Survives" = the QA product line is present **by name** with the **same quantity** the guest's bag showed. The colour / size is **not** checked. Chosen by the owner, 2026-09-23. | FR-5, AC-6; variant check in Out of Scope |
| OQ-3 | The navigation login widget. Chosen by the owner, 2026-09-23. | FR-3, AC-4; verify panel in Out of Scope |
| OQ-4 | Yes. The guest's add must be answered by the **gateway**, and the bag read after sign-in by **core**, each read from the backend's own label, never guessed. | FR-2, FR-4, AC-3, AC-5 |
| OQ-5 | Yes. One reload after the removal, and the bag must still hold no QA product line. | FR-7, AC-8 |
| OQ-6 | A new case in the existing money-path journey file (the shopper spec), not a new file. Chosen by the owner, 2026-09-23. | Constraint "account lane"; placement is for `/plan` |
| OQ-7 | Yes. If the case fails between the add and the removal, it still removes the QA product from the account's bag when it ends, and reports a failed clean-up. | FR-8, AC-9 |
| OQ-8 | `BUY-05`, because the case joins the `BUY-01`..`BUY-04` money-path cases (follows from OQ-6). | Feature Name, FR-10, AC-11 |

## Open Questions

- None.

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | After the clean-start sign-in and the emptying, the shared account's bag is proven to hold no line, judged after core re-priced it. A failure names any line left and quotes core. | FR-1 |
| AC-2  | After the sign-out, the app reports a guest, not the shared shopper. A failure says the sign-out did not return a guest. | FR-1 |
| AC-3  | As the guest, the QA product is added. The add is answered by the **gateway** (read from the backend's own label), and the guest's bag shows the QA product line by name with a quantity the case records. | FR-2 |
| AC-4  | The guest signs in through the navigation login widget, and the app then reports the shared shopper. A failure quotes the backend label the app itself reported for the failed leg. | FR-3 |
| AC-5  | The first bag read after sign-in that is not a `401` is answered by **core** (read from the backend's own label). | FR-4 |
| AC-6  | After sign-in, the bag holds the QA product line by the same name, with the same quantity recorded in AC-3. A failure states the expected and the actual quantity, or says the line is missing. | FR-5 |
| AC-7  | After sign-in, the bag holds no line other than the QA product. A failure names each extra line. | FR-5 |
| AC-8  | The QA product line is removed, core accepts the removal (it is not put back after the re-price), and after one reload the bag holds no QA product line. A failure quotes core. | FR-6, FR-7 |
| AC-9  | When the case fails after AC-3 and before AC-8: if the page is signed in as the shared shopper, the QA product is removed from the account's bag when the case ends; if it is not, the report records that the line was left in a guest's bag or never merged. A failed clean-up is reported, not hidden. | FR-8 |
| AC-10 | Each step in AC-1..AC-8 is its own named step with its own message. No assertion is on a bare count, and none carries a credential. | FR-9, NFR "No secrets in output" |
| AC-11 | The scenario list has a `BUY-05` row that says what the case proves and where it lives. | FR-10 |

## Out of Scope

- Signing in through the verify panel inside the bag (GV-1 / GV-2).
- Merging two non-empty bags — account bag + guest bag (manual case GV-4).
- Checking the colour / size of the line after sign-in.
- A product that is in both bags at once, and how core combines it.
- Placing an order, choosing an address or a payment method.
- The "Out of Bag" (old cart) list that a removed item may join.
- Judging the chat / stories / comments / wallet sign-in legs (`AUTH-01` owns
  them).
- Any change to application code.
