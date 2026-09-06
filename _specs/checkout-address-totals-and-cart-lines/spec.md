---
ticket: checkout-address-totals-and-cart-lines
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-09-05
links:
  clickup:
  github:
---

# Spec — checkout-address-totals-and-cart-lines

## In plain words

- **Scope was reduced on 2026-09-05** to the unit half only; the ten live
  criteria moved to a follow-up work item. See the section below.
- **What must be true when this is done:** three money-path behaviours are under
  test. A shopper can pick between two saved addresses at checkout and edit one.
  The shipping cost and the order total on screen are the numbers the core
  backend sent. A shopper can change a line quantity or remove a line, and the
  shop re-prices the bag. Each check names the step that failed and the backend
  that refused.
- **Each criterion in one line:**
  - `AC-1` — tapping the second saved address makes the checkout show that
    address — it is **not** a check that the order was placed.
  - `AC-2` — the tap reached the core backend, proved by re-reading the address
    list — it is **not** the on-screen check, which is `AC-1`.
  - `AC-3` — an edit to the chosen address shows on the checkout screen — it is
    **not** a check that the edit reached the backend.
  - `AC-4` — the account is left as it was found — it is **not** about the bag,
    which is `AC-16`.
  - `AC-5` — the store keeps the four money numbers the backend sent — it is
    **not** about what is drawn on screen.
  - `AC-6` — the payable total on screen is the total the backend sent — it is
    **not** the "Normal Price" figure, which is `AC-7`.
  - `AC-7` — the "Normal Price" figure equals payable total plus discount minus
    shipping — it is **not** a check of the payable total itself.
  - `AC-8` — on real staging, the shipping shown **in the bag** is the shipping
    the backend sent.
  - `AC-9` — on real staging, the payable total shown **in the bag** is the total
    the backend sent — it is **not** the "Normal Price", which no live criterion
    covers.
  - `AC-10` — choosing another address makes the shop re-price the bag, and the
    re-priced numbers are what is then shown.
  - `AC-11` — removing a line clears it from both cart lists in the store.
  - `AC-12` — plus asks for one more, minus asks for one fewer.
  - `AC-13` — a line at quantity 1 offers delete and no minus; above 1 it offers
    both.
  - `AC-14` — on real staging, plus makes the line quantity 2 and the shop
    re-prices.
  - `AC-15` — on real staging, removing a line takes it out of the bag.
  - `AC-16` — the bag is left empty after the live cart-line check.
- **Out of scope, in one line each:**
  - The missing funnel event on the delete control above quantity 1.
  - The swallowed refusal when the backend rejects a default-address change.
  - Coupons, wallet, crypto and card payment.
  - Any change to application code.
- **Easy to confuse:**
  - `AC-1` is what the screen shows; `AC-2` is what the backend stored.
  - `AC-6` is the payable total; `AC-7` is the price before discount and shipping.
  - `AC-4` restores the **account**; `AC-16` empties the **bag**.
  - `AC-12` is which quantity is asked for; `AC-13` is which controls are drawn.

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

## Scope reduction — 2026-09-05, owner's decision

**This work item now covers the unit half only: `AC-5`, `AC-6`, `AC-7`, `AC-11`,
`AC-12`, `AC-13`.**

The ten live criteria — `AC-1` to `AC-4`, `AC-8` to `AC-10`, `AC-14` to `AC-16` —
are **deferred to a follow-up work item**. They are not withdrawn and not
weakened; they move unchanged.

**Why.** `implement` measured what the review gate made a precondition, and it
removed the plan's premise. GitHub Actions run `33951875379` is the most recent
run that actually executed the live suite:

```
Timed out waiting 1800s for the test suite to run
3 failed · 5 did not run · 69 passed (30.0m)
```

`1800 s` is exactly the `globalTimeout` in `playwright.config.ts:65`. The suite
already exhausts it and already drops five cases, before this work item adds
anything. The only fix — raising that timeout — needs a file
`plan.md > Files to change` does not list, which `IM-4` forbids. Staging login was
also reported broken the same day, and the three failing cases (`AUTH-01`,
`PROF-08`, `BUY-01`) are the three that sign in.

**What the follow-up inherits.** Everything already learned, so it does not start
cold: the timeout evidence above, the twelve `major` findings in
`review.md > Panel Findings` with their dispositions, the `x-proxy-url` fact
(`F-41`), the closed-context teardown (`review.md` `P-3` / `S-1`), the collapsed
totals row (`F-42`), the missing `swiperSlide-backIcon` locator, and the panel's
`P-4` suggestion to move the bag setup to `/cart/add` and `/cart/remove`.

## Feature Name

Money-path coverage: address choice at checkout, totals against shown prices, and
cart line changes.

## Business Goal

A shopper must be able to trust the order before placing it. Today nothing checks
that the address they picked is the address the order uses, and nothing checks
that the total they are shown is the total the shop charges. These are the two
places where a silent mistake costs money and trust. A third gap — changing a
line — is the most common action in the bag and is covered only in part.

## User Story

> As a shopper, I want the checkout to use the address I picked and to charge me
> the total I was shown, so that I can trust the order before I place it.

> As the team, we want a failure in this area to name the step and the backend,
> so that we do not bisect a twelve-step flow by hand.

## Functional Requirements

- **FR-1** — A shopper with two saved addresses can choose either one at
  checkout, and the checkout then shows the chosen one.
- **FR-2** — The choice is stored by the core backend, not only on screen.
- **FR-3** — A shopper can edit a saved address from the checkout address list,
  and the checkout shows the edited text.
- **FR-4** — The shipping cost shown **in the bag** is the shipping cost the core
  backend sent for this bag. Corrected at `/plan` round 2: the totals row is
  drawn in the cart drawer, not on the checkout screen.
- **FR-5** — The payable total shown **in the bag** is the total the core backend
  sent for this bag. Corrected at `/plan` round 2, same reason as `FR-4`.
- **FR-6** — The "Normal Price" figure shown beside the total is the payable
  total plus the discount minus the shipping.
- **FR-7** — Changing the delivery address makes the shop re-price the bag, and
  the numbers then shown come from that re-price.
- **FR-8** — A shopper can raise or lower a line quantity, and the bag then shows
  the quantity the core backend confirmed.
- **FR-9** — A shopper can remove a line, and the bag no longer holds it.
- **FR-10** — A line at quantity 1 offers a delete control instead of a minus
  control.

## Non-Functional Requirements

- **NFR-1** — Every check carries a message that names the step that failed, in
  plain words, from the point of view of somebody who did not write it.
- **NFR-2** — Every check whose step crossed a backend names that backend in its
  message. In this area that backend is always the core backend.
- **NFR-3** — No **text** output — a message, a log, a report — contains a token,
  a one-time code, a phone number or any other personal detail. Narrowed by the
  owner on 2026-09-05: the live project records video, the checkout draws the
  delivery address's contact phone, and the project already accepts that for the
  login screen. Video and screenshots are out of this rule; the CI archive is
  encrypted before upload.
- **NFR-4** — No check asserts on a count. A check names the thing it means.
- **NFR-5** — A live check that writes to staging leaves staging as it found it.

## Constraints

- **C-1** — No application code changes. This work item adds and extends tests
  only.
- **C-2** — A live check must not depend on how many addresses the staging
  account happens to have. It guarantees the state it needs and undoes it.
- **C-3** — A criterion about a money figure must not be satisfiable by the
  number `0` or by an empty string. `0` is both a real free-shipping answer and
  what a failed read gives, so a criterion compares the figure against the value
  the backend sent, never against a literal.
- **C-4** — The live cart-line work is its own scenario, not extra steps inside
  the existing buy-and-cancel journey. A cart-line failure must not also hide the
  order coverage, and the buy journey is already long.
- **C-5** — The number "two addresses" comes from the request itself: the ask is
  "choosing between two addresses at checkout".
- **C-6** — The quantity `2` in `AC-14` is "one more than 1", the result of one
  press of plus on a line that starts at quantity 1.
- **C-7** — Nothing in this work item may change the runtime paths this
  repository protects.

## Edge Cases

- The staging account has fewer than two addresses when the check starts.
- The shop charges no shipping, so the shipping figure is a real `0`.
- Both addresses produce the same shipping cost, so the re-priced numbers do not
  move.
- The core backend confirms a different quantity from the one asked for.
- The core backend refuses a line removal after the screen has already taken the
  row away.
- A large money figure is drawn shortened, for example as `12K`, while the total
  beside it is drawn in full.
- Staging is down, so a live check is red for a reason that is not the code.

## Research Questions Resolved

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | **Answered.** The check must not depend on the account's current address count. It guarantees two addresses exist, and removes anything it created. | `C-2`, `AC-4` |
| OQ-2 | **Answered in principle; the value is confirmed at `/plan`.** Whether staging charges shipping is unknown and needs a live run. The criterion is written so a `0` cannot satisfy it by accident: the figure on screen is compared against the number the backend sent, not against a literal. If staging sends `0` for both addresses, `AC-10` is recorded as not covered rather than faked. | `C-3`, `AC-8`, `AC-10` |
| OQ-3 | **Answered: both, as separate criteria.** One criterion checks the payable total against the backend value; a second checks the "Normal Price" identity, because that arithmetic is something the app really does and a wrong formula would otherwise pass. | `AC-6`, `AC-7` |
| OQ-4 | **Answered: yes, corrected.** A live criterion reads the payable total. Reading it through a name that returns the pre-discount figure is exactly the false green this work item exists to stop, so the name must say what it returns. | `FR-5`, `AC-9` |
| OQ-5 | **Answered: its own scenario.** One step per thing that can fail on its own, and the buy-and-cancel journey is already twelve steps. | `C-4` |
| OQ-6 | **Deferred to `/plan`.** Which existing test file each unit criterion extends is a coverage-and-approach question. `PL-14` decides it. | Open Questions |
| OQ-7 | **Answered: out of scope.** No source in this repository states what the delete control above quantity 1 should report, and it sits in a file this work item does not change. It becomes a separate work item. | Out of Scope |
| OQ-8 | **Answered: out of scope.** Same reason, plus covering it needs a faked backend refusal, and this work item uses no faked-backend browser scenario. It becomes a separate work item. | Out of Scope |

## Open Questions

- **OQ-6** — Which existing unit test file each of `AC-5`, `AC-6`, `AC-7`,
  `AC-11`, `AC-12` and `AC-13` extends, and whether any of them needs a new file.
  Deferred to `/plan` under `PL-14`.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement | Could pass wrongly if |
|------|----------------------|---------------------|-----------------------|
| AC-1 | With two saved addresses, tapping the second one in the checkout address list makes the checkout show that address as the delivery address. | FR-1 | The second address was already the delivery address before the tap, so the screen would show it either way. The check must read which address is shown **before** the tap and require it to be the other one. |
| AC-2 | After that tap, re-reading the saved addresses from the core backend shows the tapped address as the account's default. | FR-2 | The check reads the copy the app already holds instead of asking the backend again, so a change that never left the browser still passes. |
| AC-3 | Editing the chosen address's detail text from the checkout address list makes the checkout show the new text. | FR-3 | The new text is the same as the old text, so the screen looks correct without anything being saved. The check must write a value that is not already there. |
| AC-4 | After the address checks, the account holds no address they created, and the address that was the default before is the default again. | NFR-5, C-2 | The check asserts only that the count went back down, which passes while the wrong address is default. It must name the address that should be default. |
| AC-5 | Given a cart-overview answer from the core backend, the store holds exactly the total, sub-total, shipping cost and discount that answer carried. | FR-4, FR-5 | The assertion compares against a value the check itself computed the same way the code does, so both are wrong together. The expected numbers must be written as plain literals in the check. |
| AC-6 | The payable total drawn on the cart is the total the core backend sent, formatted for the currency. | FR-5 | The check asserts the element exists, or asserts a number that is also what an empty store would draw. It must assert the exact figure, and prove it moves when only the backend number moves. |
| AC-7 | The "Normal Price" figure drawn beside the total equals the payable total plus the discount minus the shipping. | FR-6 | The discount and the shipping are both `0` in the test data, so every wrong formula gives the same answer. The data must use a discount and a shipping cost that are different from each other and from zero. |
| AC-8 | On real staging, the shipping cost drawn in the bag is the shipping cost the core backend sent for this bag. | FR-4, NFR-2 | Staging sends `0` and the check compares against `0`, so a failed read also passes. The check compares the drawn figure against the value the backend sent in this run, per `C-3`. |
| AC-9 | On real staging, the payable total drawn in the bag is the total the core backend sent for this bag. | FR-5, NFR-2 | The check reads the "Normal Price" figure instead, which carries a different number and would disagree only when there is a discount or a shipping cost. |
| AC-10 | On real staging, choosing the other address makes the shop re-price the bag, and the figures then drawn come from that re-price. | FR-7 | Both addresses give the same numbers, so nothing moves and the check passes without any re-price. The check must observe the re-price happening, not only compare figures. |
| AC-11 | Removing a line clears it from both cart lists the store keeps. | FR-9 | The check looks at one list only, so a row left behind in the other one passes. It must assert on both. |
| AC-12 | Pressing plus on a line asks the core backend for one more than the line's current quantity; pressing minus asks for one fewer. | FR-8 | The check asserts that the backend was called, not what it was asked for, so an off-by-one passes. It must assert the quantity in the request. |
| AC-13 | A line at quantity 1 draws a delete control and no minus control; a line above quantity 1 draws both. | FR-10 | The check looks for any element carrying the delete marker without checking the quantity it belongs to, so both branches look the same. |
| AC-14 | On real staging, pressing plus on a line at quantity 1 makes that line show quantity 2, and the shop re-prices the bag. | FR-8, NFR-2 | The check reads the quantity before the shop answers, so the optimistic value passes while the backend refused. It must read the value after the bag is re-read. |
| AC-15 | On real staging, removing a line means the bag no longer holds that product. | FR-9, NFR-2, NFR-4 | The check counts lines instead of naming the product, so removing the wrong line passes. It must name the product. |
| AC-16 | After the live cart-line checks, the bag is empty. | NFR-5 | The check empties the bag without confirming it, so a refused removal leaves rows behind for the next scenario. |

## Out of Scope

- **The missing funnel event on the delete control above quantity 1.** No source
  in this repository says what it should report. It is recorded as a follow-up
  work item, not covered here.
- **The swallowed refusal when the core backend rejects a default-address
  change.** Same reason, and covering it needs a faked backend refusal, which
  this work item does not use. Recorded as a follow-up work item.
- **Any change to application code.** `C-1`.
- **Coupons, the wallet, crypto and card payment.** The live checks use cash on
  delivery only, as the existing money-path scenario does.
- **The "Normal Price" figure on real staging.** The identity is covered in the
  fast suite by `AC-7`; repeating it live adds cost and no new signal.
- **The out-of-bag ("Out-Of-Bag") move.** Already covered.
- **Placing a real order.** These checks stop at the checkout screen. The
  existing money-path scenario owns order placing.
