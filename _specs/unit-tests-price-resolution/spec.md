---
ticket: unit-tests-price-resolution
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-08-26
links:
  clickup:
  github:
---

# Spec — unit-tests-price-resolution

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Feature Name

The price a shopper sees on a product card, pinned by tests.

## Business Goal

A shopper must be able to trust the number on a card: it must be the price that
really applies to the product they are looking at, drawn in their own currency.
Two steps decide that number: choosing which price applies while a flash deal
runs, and drawing it. The drawing step is already checked — the card calls the
copy that has its own test file. **The choosing step is checked by nothing at
all**, so a later change can break it and every test still passes. This work item
makes the choosing step provable on every pull request.

**One difference is accepted, on purpose.** The card shows the **product-level**
offer price. When the shopper opens the product and chooses a colour or a size,
the price can change, because a variant carries its own price and the platform has
rules about it. That is how the product is meant to work — it is **not** a defect,
and nothing in this work item treats it as one. This work item pins the price on
the card only. Which price a chosen variant carries at add-to-cart is a separate
rule, checked by its own later work item.

## User Story

> As a shopper, I want the price on a product card to be the product's own price
> right now — deal price while a deal runs — so that I can trust what I see before
> I open the product.

## Functional Requirements

- **FR-1** — While a flash deal is running, the card shows the deal price. When no
  deal is running, it shows the ordinary price.
- **FR-2** — While a deal is running, the card also reports how much time is left,
  and marks the product as a deal. When the deal has ended, it reports neither.
- **FR-3** — The answer depends only on the product and on a moment that is given
  to the choice. The same product at the same moment always gives the same answer.
- **FR-4** — *Withdrawn 2026-08-26.* A price is drawn using the shopper's own
  exchange rate and number of decimal digits. The card uses the drawing step that
  already has its own checks, so there is nothing here to add. The id is kept so
  no reference dangles.
- **FR-5** — *Withdrawn 2026-08-26.* A price that cannot be read is drawn as zero.
  Same reason as FR-4, and the guard for it was proved and shipped separately on
  2026-08-26.
- **FR-6** — Nothing a shopper sees changes because of this work. The same price,
  the same countdown and the same deal marking as before.
- **FR-7** — The testing roadmap names the code that really decides the displayed
  price, and records which part of it is already covered elsewhere.

## Non-Functional Requirements

- The new checks run in the suite that gates every pull request.
- The checks are deterministic: no dependence on the day they run, on a timezone,
  or on a real currency fetched from a backend.
- Every assertion says, in plain words, what was supposed to be true — a failure
  must name the step without the reader opening the code.
- No new dependency, and no meaningful increase in how long the suite takes.

## Constraints

- **The application change must not change behaviour.** It is a move, not a
  rewrite. Anything a shopper could notice makes it wrong.
- **The application change must be revertable on its own**, separately from the
  checks that cover it.
- Where a check already exists for a rule, it is reused, not written a second time.
- No protected runtime path is touched.
- The known defect where a list sorts on one price while a card shows another is
  recorded and left alone. It is a backend gap with no fix in this repository.
- **A variant's price may differ from the card's price, and that is accepted.**
  The card states the product-level price; choosing a colour or a size can change
  it. No criterion here may be written so that this difference reads as a fault.

## Edge Cases

- A deal is running but carries no deal price → the ordinary price is shown.
- A deal price exists but the deal has already ended → the ordinary price is shown.
- The deal ends today → it counts as running until the very end of that day.
- No deal date at all → the ordinary price is shown, and no time left is reported.
- A product carries an offer price of zero → zero is a real price and is used as
  one; it is not treated as missing.
- The shopper's exchange rate or decimal digits are not yet known, or the price
  cannot be read → covered by the drawing step's own checks, not here.
- The shopper opens the product and picks a colour or a size that carries its own
  price → the price changes from the one on the card. Accepted, and out of scope
  here.

## Research Questions Resolved

| OQ   | Answer | Lands in |
|------|--------|----------|
| OQ-1 | The field-mapping step holds no rule, so nothing is written for it. | Out of Scope |
| OQ-2 | The listing filter store is not about pricing and is dropped. The roadmap row that named it is corrected in this work item. | Out of Scope, and FR-7 / AC-10 |
| OQ-3 | The flash-deal choice is moved out of the screen into a plain piece of logic, then checked directly. The move must keep both the price and the time left, because both are used on screen. | FR-1, FR-2, FR-3, FR-6 / AC-1..AC-6, AC-9 |
| OQ-4 | The per-country price rule is already checked elsewhere and is recorded as existing coverage. Nothing new is written for it. | Constraints, Out of Scope |
| OQ-5 | The rule that a chosen colour and size changes the price stays with its own later work item. | Out of Scope |
| OQ-6 | **Revised 2026-08-26.** The premise was wrong: the card does not use the untested copy of the drawing step, it uses the one that already has checks. So nothing is written for it here. The untested copy belongs to the cart and checkout screens and gets its own work item. | Out of Scope |

## Open Questions

None. Every `OQ-n` from `research.md` is answered above, and no new question is
open.

## Acceptance Criteria Mapping

| ID    | Acceptance criterion | Maps to requirement |
|-------|----------------------|---------------------|
| AC-1  | While a deal is running and a deal price exists, the card's price is the deal price. | FR-1 |
| AC-2  | While a deal is running but no deal price exists, the card's price is the ordinary one — the offer price when there is one, otherwise the plain price. | FR-1 |
| AC-3  | A deal that ends today is still running until the very end of that day; from the next moment on, the card's price is the ordinary one. | FR-1 |
| AC-4  | With no deal date, the card's price is the offer price when there is one, otherwise the plain price, and no deal is reported. | FR-1 |
| AC-5  | While a deal is running, the time left is reported as days, hours, minutes and seconds; once it has ended, no time left is reported. | FR-2 |
| AC-6  | The same product judged at the same moment always gives the same price and the same time left, whatever day the check runs on. | FR-3 |
| AC-7  | *Withdrawn 2026-08-26 — see FR-4.* Already proven by the drawing step's own checks. | FR-4 |
| AC-8  | *Withdrawn 2026-08-26 — see FR-5.* Already proven, and its guard shipped separately the same day. | FR-5 |
| AC-9  | For every case above, what the card shows is the same before and after the application change — price, time left and deal marking. | FR-6 |
| AC-10 | The testing roadmap's row for this phase names the code that decides the displayed price, and says which part is already covered elsewhere. | FR-7 |

## Out of Scope

- The step that copies product fields onto the card. It decides nothing.
- The listing filter store, including price bands and the price slider.
- The per-country price override. It already has its own checks.
- The rule that a chosen colour and size changes the price. It belongs to the
  later work item for the add-to-cart screens. The difference between the card
  price and a variant's price is accepted behaviour, not a defect to be closed.
- The defect where a list is sorted on one price while the card shows another.
- The drawing step. The one the card uses is already checked; the other copy,
  used by 30 cart, checkout and order screens, is untested and gets its own work
  item.
- The browser suite. Nothing here needs a real browser or a real backend.
- Any change to what a shopper sees. This work item adds checks and moves one
  piece of logic; it fixes nothing.
