---
ticket: product-editor-backend-field-errors
stage: spec
mode: standard
status: complete
owner: developer
updated: 2026-08-27
links:
  clickup:
  github:
---

# Spec — product-editor-backend-field-errors

> Define *what* must be true when done. **No implementation details, no file
> names, no code.**

> **Revision note.** This specification has been revised twice.
>
> **Revision 1** was made at the owner's request before `plan` began. `AC-1` …
> `AC-21` kept their original meaning and their ids; `AC-22` … `AC-29` were added,
> four of them by splitting one criterion that covered three failures at once.
>
> **Revision 2** is this one. The work item was sent back here from `review` by
> owner direction, because `plan.md` recorded a deviation from `E-4` and the owner
> chose to correct the specification rather than accept the deviation. Two things
> changed and nothing else: **a refusal entry that names no field is no longer
> shown to the seller** (`FR-6`, new `FR-20`, `C-3`, `C-4`, `E-4`, `AC-4`,
> `AC-12`, `AC-21`), and **an input that is not shown to this seller at all is now
> covered** (new `E-15`, new `AC-30`). Every existing id keeps its meaning and its
> number.

## Feature Name

Backend validation errors shown on the product form's own fields.

## Business Goal

The backend runs validation rules the product form does not have and cannot
have — a barcode already used by another product, a seller product id already
taken, and rules that may be added later without telling us.

Today, when one of those rules refuses a save, the seller is told only that the
save failed. No field is marked and the backend's own explanation is thrown away.
The seller has forty inputs and no clue which one is wrong. The usual result is a
support message or an abandoned product.

When this is done, a backend refusal reads exactly like the form's own
validation: the field is marked, it carries the backend's own sentence, and the
page moves to it. A seller can fix the problem alone, the first time.

## User Story

> As a seller adding or editing a product, I want a refused save to mark the
> field the backend refused and show me what the backend said, so that I can fix
> the real problem instead of guessing which of forty inputs is wrong.

## Functional Requirements

**Showing a field error**

- **FR-1** — When a save is refused for a validation reason and the refusal names
  a field the form has an input for, that field is marked as failing.
- **FR-2** — The text shown on that field is the backend's own message for that
  field, not a message of ours.
- **FR-3** — The backend's message is presented exactly as it arrives. It is not
  re-translated, re-worded, shortened or capitalised by us.
- **FR-4** — **No refusal is ever discarded because the field it names was not
  anticipated.** Every problem that **names a field** reaches the seller: on that
  field when the form can show it there, as text when it cannot. Today a
  separately kept list of 20 field names decides what may be shown and silently
  drops everything else — which is exactly why a refused barcode shows nothing.
  The backend's rules are not knowable ahead of time, so nothing written ahead of
  time may decide whether the seller hears about one.
- **FR-5** — A refusal that names an item inside a field holding a list of values
  marks that field. Naming the first category marks the category field.

**Showing what cannot be put on a field**

- **FR-6** — A refusal that **names** something the form has no input for is
  attached to no field. Its message is shown to the seller as part of the failure.
- **FR-7** — Every message shown is readable text. No output of this work ever
  appears as raw structured data, as `[object Object]`, or as anything a seller
  cannot read as a sentence.
- **FR-8** — When one refusal carries several problems, all of them are shown at
  once — the ones that belong to a field on their field, the rest as text.
- **FR-9** — A backend message is displayed as **text, never as HTML** (`D-10`).
  It is never handed to anything that renders markup. If a message contains
  characters that could be read as markup, the seller sees those characters.
- **FR-20** — A refusal entry that **names nothing at all**, and is not one of the
  four known image cases, is **not shown** to the seller. The seller is still told
  the save failed, and the entry is recorded off-screen with the rest of the
  refusal, so it is not lost. `C-3` says why this one class is withheld while
  every named problem is shown.

**Moving the seller to the problem**

- **FR-10** — After a refused save, the page moves to a marked field without the
  seller scrolling.
- **FR-11** — When more than one field is marked, the page moves to the one the
  seller reaches first reading the form from the top. Not the first in the order
  the backend happened to list them.
- **FR-12** — Every field the editor submits and shows an input for is able to
  display a failure message and is able to be reached by that movement. A field
  that can be refused but cannot show it is not finished.

**Telling the seller the truth**

- **FR-13** — The summary message shown alongside a refusal describes what the
  seller can actually see. It may say that fields are marked only when at least
  one field is actually marked. Today it makes that claim whenever the form
  believes it attributed something, including for fields that cannot display it.
- **FR-14** — The backend's message is used only when the refusal is a validation
  refusal. Any other kind of failure keeps the general message the form shows
  today, and shows no backend text.
- **FR-15** — Nothing is silently dropped. A refusal that names nothing the form
  can use still tells the seller that the save failed and why, as far as is
  known.

**Keeping the seller's fixes honest**

- **FR-16** — Changing a field clears the backend failure sitting on that field.
  Failures on other fields are left alone. A message saying "this barcode already
  exists" must not still be on screen under a barcode the seller has since
  changed.

**Not breaking what works**

- **FR-17** — The image and colour-image failures the backend reports without
  naming a field keep marking the image and colour-image inputs, exactly as they
  do today.
- **FR-18** — The form's own validation is unchanged: same rules, same messages,
  same moment they appear, same fields they appear on.
- **FR-19** — Adding a product and editing a product show the same field marks,
  the same messages and the same page movement for the same refusal.

## Non-Functional Requirements

- **NFR-1** — No other screen changes behaviour. Nothing shared with other
  screens is altered to serve this form. The request layer already provides
  everything this work reads.
- **NFR-2** — What the form sends to the backend does not change. This work reads
  the refusal; it does not change the request.
- **NFR-3** — Any new wording of ours exists in all three non-source translation
  files, and the key-parity check passes. Backend messages are not ours and are
  never added to those files.
- **NFR-4** — Type checking, linting, translation parity and the unit suite all
  pass.
- **NFR-5** — The change is revertable as one unit. Undoing it restores today's
  general-message behaviour and leaves nothing behind.
- **NFR-6** — Clearing a field's failure as the seller types must not make typing
  slower than it is today. This form has around forty inputs, so a clearing rule
  that re-renders the whole form on every keystroke is not acceptable.

## Constraints

- **C-1** — The form's own validation must not be touched. No rule added,
  removed, relaxed, reordered or reworded. This is the owner's hard boundary.
- **C-2** — No backend change is requested or required.
- **C-3 — the backend sanitises its own responses, with one known exception.**
  The backend does not return sensitive data or database statements in any
  message it sends. That is the backend's contract, stated by the owner (`D-4`,
  2026-08-26). So **information leaking through a displayed message is not a risk
  this ticket carries.** No filter, no content check and no redaction is built,
  and none is needed.

  **The known exception.** This repository records a case where the same refusal
  carries raw server text that names the backend technology, and that text arrives
  **naming no field**. Naming the backend technology to the browser is treated as
  a security matter by this repository's own rules. `FR-20` therefore withholds
  that one class.

  **`FR-20` is not a content check and must not become one.** It turns on a single
  structural fact — whether the entry names a field — and never on the words in
  the message. Every entry that names a field is shown in full, whatever it says.

- **C-4 — the earlier "no backend text" criterion is reversed on purpose.** An
  earlier shipped work item required that no backend text be shown as the primary
  failure message. Its only reason was the concern `C-3` settles. With that reason
  gone, the criterion is reversed deliberately **for every entry that names a
  field**. `AC-21` requires the reversal, its reason, and the one class still
  withheld to be recorded in the change itself, so a later reader does not read it
  as an accident and does not remove the exception.
- **C-5** — The backend's written body contract is not available to this work
  (`D-1`). Four of the seven research questions — `OQ-3`, `OQ-4`, `OQ-5`, `OQ-6` —
  are closed by the owner's assertion rather than by evidence. The other three are
  built so that the unknown cannot change the outcome. The record must keep saying
  which is which.
- **C-6** — Smallest change that meets these criteria. No new shared abstraction,
  no new configuration, no sweep through sibling screens, no refactor of code this
  work merely reads.

## Edge Cases

- **E-1** — One refusal carries several problems: some naming fields, some not.
  Both kinds are handled in the same refusal, not one instead of the other.
- **E-2** — A refusal names a field the form submits but shows no input for. It
  cannot be marked, so it must appear as text rather than vanish.
- **E-3** — A refusal entry names a field but carries an empty message. The field
  must not be marked with a blank message.
- **E-4** — A refusal entry carries a message but names no field, and is not one
  of the four known image cases. Its message is **not** shown to the seller. The
  seller is still told the save failed, and the entry is recorded off-screen with
  the rest of the refusal (`FR-20`, `C-3`).
- **E-5** — A validation refusal arrives carrying no per-problem detail at all.
  The seller is still told the save failed.
- **E-6** — A refusal that is not a validation refusal — the general message is
  shown, no field is marked, no backend text appears.
- **E-7** — The request fails before any refusal is returned, for example the
  network drops. Behaviour is exactly as it is today.
- **E-8** — Two problems name the same field in one refusal. The field shows one
  readable message; not two overlapping ones and not an empty one.
- **E-9** — The seller fixes one of three failing fields and saves again. The
  fixed field is clear; the other two behave as the new refusal says.
- **E-10** — The seller's language is not English. The message shown is whatever
  the backend returned for that language (`D-5`), with no attempt by us to
  translate it.
- **E-11** — A refusal names an item inside a list — for example the second label
  or the third image — using a form of the name the form has never seen. It still
  marks that list's field (`D-9`).
- **E-12** — A refusal names a single row of the product's colour/size table, or a
  single translation row. It is not put on a field; its message shows as text
  (`D-3`).
- **E-13** — A backend message contains characters that look like markup. They are
  shown as characters (`FR-9`).
- **E-14** — Several fields are marked at once and the topmost one is far above
  the save button. The page moves to that topmost one (`FR-11`).
- **E-15** — This seller's prices are locked, so several price inputs are not
  shown on the page at all — yet the form still submits them, so the backend can
  still refuse one. Such a refusal must not be marked on an input the seller
  cannot see: a mark nobody can see is the same as no mark, and the summary would
  then claim a highlighted field that does not exist. The message is shown as text
  instead.

## Research Questions Resolved

Every `OQ-n` from `research.md` is answered here. None is deferred.

Each answer is an **owner decision**, not repository evidence — the body contract
that could have answered them is not available (`C-5`). Three of the seven are
built so the unknown cannot hurt: `OQ-1` and `OQ-2` are made irrelevant by `D-3`,
and `OQ-7` is made independent of the backend's wording by `D-9`. The remaining
four rest on the owner being right, and say so.

| OQ | Answer | Lands in |
|------|--------|----------|
| OQ-1 | The exact wording the backend uses to name an item inside a colour/size row or a translation row does not matter. Such a refusal is never put on a field (`D-3`), so there is nothing to recognise. Either wording produces the same result for the seller. **Rests on no assumption.** | FR-6, FR-7, E-12, AC-6 |
| OQ-2 | Whether a colour/size row failure is reported per row or once for the whole table does not matter. A whole-table refusal names a field the form owns and is marked (`FR-1`); a per-row refusal names something the form has no input for and shows as text (`FR-6`). Both are handled. **Rests on no assumption.** | FR-1, FR-6, E-12, AC-6 |
| OQ-3 | The backend returns its messages in the seller's language (`D-5`, owner assertion). We show them as they arrive and never translate them. **Accepted limit:** if some message is not translated, that seller sees it in English. `D-4` says the content is safe either way, so the worst case is the wrong language, not a leak. No workaround is built. | FR-3, NFR-3, E-10, AC-2 |
| OQ-4 | Validation refusals arrive as one specific kind of refusal and no other (`D-6`, owner assertion). Restricting backend text to that kind therefore hides nothing. | FR-14, E-6, AC-11 |
| OQ-5 | **Yes.** Changing a field clears the backend failure on it (`D-7`). Without this, showing the real message makes the form worse than today: a stale, specific, wrong sentence misleads more than a stale generic one. | FR-16, E-9, AC-13 |
| OQ-6 | **Yes, unchanged.** The four image and colour-image failures the backend reports without naming a field keep marking those inputs (`D-8`). They are the one named exception to `FR-20`: they name no field and are still shown, because the form already knows which input each of them belongs to. `D-3` governs a refusal that names a field, not one that names nothing. Their known limit — they are recognised by English wording only — is **not** fixed here and is listed Out of Scope. | FR-17, FR-20, AC-14, Out of Scope |
| OQ-7 | A refusal naming an item inside a list marks that list's field (`D-9`). The decision holds whichever wording the backend uses, so no unverified assumption about that wording is made anywhere. Rows of the colour/size table and of the translation list are **not** lists in this sense — they stay under `D-3` and show as text. **Rests on no assumption.** | FR-5, E-11, E-12, AC-5 |

## Open Questions

None. Every `OQ-n` from `research.md` is answered above, and no new question is
deferred to `/plan`.

## Acceptance Criteria Mapping

| ID | Acceptance criterion | Maps to requirement |
|------|----------------------|---------------------|
| AC-1 | A save refused for a validation reason on a field the form shows marks that field as failing. | FR-1 |
| AC-2 | The text on that field is the backend's own message for it, shown exactly as received — not a message of ours and not re-translated. | FR-2, FR-3 |
| AC-3 | The reported case works: saving a product whose barcode is already used marks the barcode input with the backend's own sentence about the barcode. | FR-1, FR-2 |
| AC-4 | No refusal **that names a field** is discarded because that field name was not anticipated. For any field name the backend sends — including one nothing in the code has ever mentioned — the seller sees the message: on the field where the form can show it there, as text where it cannot. | FR-4 |
| AC-5 | A refusal naming an item inside a field that holds a list of values marks that field. | FR-5, E-11 |
| AC-6 | A refusal naming a single colour/size row, or a single translation row, is attached to no field and its message is shown as text. | FR-6, E-12 |
| AC-7 | No message this work shows ever appears as raw structured data or as `[object Object]`. Every message reaching the seller is a readable sentence. | FR-7 |
| AC-8 | A refusal carrying both a field problem and a non-field problem shows both at once. | FR-8, E-1 |
| AC-9 | After a refused save the page moves to a marked field with no scrolling by the seller. | FR-10 |
| AC-10 | Each of the **14** single-value inputs listed below can both show a failure and be reached by that movement, checked one by one. **Five that show a failure but cannot be reached:** pieces per unit, country of origin, labels, images, colour images. **Nine that cannot show one:** barcode, luck price, model number, report reference number, shipping cost, shipping days, max allowed quantity, meta title, meta description. The 17 inputs that already do both are re-checked and none is changed. Each is checked while it is on the page; when an input is not on the page, `AC-30` applies instead. | FR-12 |
| AC-11 | A refusal that is not a validation refusal shows the general message, marks no field, and shows no backend text. | FR-14, E-6 |
| AC-12 | A refusal that names nothing the form can use still tells the seller the save failed. Nothing is silently dropped: what cannot go on a field is shown as text when the entry names something, and — for an entry that names nothing at all — is kept off the screen and recorded with the rest of the refusal. | FR-15, FR-20, E-4 |
| AC-13 | Changing a field clears the backend failure on that field and leaves the failures on other fields in place. | FR-16, E-9 |
| AC-14 | The four image and colour-image failures the backend reports without naming a field still mark the image and colour-image inputs, exactly as before this work. | FR-17, FR-20, OQ-6 |
| AC-15 | The form's own validation is unchanged — the same rules fire, on the same fields, with the same messages, at the same moment. Proved, not asserted. | FR-18, C-1 |
| AC-16 | For the same refusal, adding a product and editing a product mark the same field, show the same message, and move the page the same way. | FR-19 |
| AC-17 | Two problems naming the same field produce one readable message on it, never an empty or overlapping one. | FR-8, E-8 |
| AC-18 | What the form sends to the backend is unchanged by this work, and no screen other than the product form changes behaviour. | NFR-1, NFR-2 |
| AC-19 | Any new wording of ours exists in all three non-source translation files and the parity check passes. Backend messages are not added to those files. | NFR-3 |
| AC-20 | Type checking, linting, translation parity and the unit suite all pass. | NFR-4 |
| AC-21 | The reversal of the earlier "no backend text" criterion is recorded in the change itself as deliberate, naming the decision that makes it safe **and the one class of message still withheld, with its reason**, so a later reader does not read the reversal as an accident and does not remove the exception. | C-4, C-3 |
| AC-22 | A refusal entry that names a field but carries an empty message does not mark that field with a blank message. | FR-15, E-3 |
| AC-23 | A validation refusal carrying no per-problem detail at all still tells the seller the save failed. | FR-15, E-5 |
| AC-24 | Every backend message reaches the screen as text, never as HTML. A message containing markup characters shows those characters to the seller. | FR-9, E-13 |
| AC-25 | The summary message never claims fields are marked when no field is marked. When nothing could be put on a field, the summary says what actually happened instead. | FR-13 |
| AC-26 | When several fields are marked, the page moves to the one highest up the form, not to whichever the backend listed first. | FR-11, E-14 |
| AC-27 | A failure that returns no refusal at all — for example the network dropping mid-save — behaves exactly as it does today. | E-7 |
| AC-28 | Undoing this work as one unit restores the previous behaviour and leaves nothing behind. | NFR-5 |
| AC-29 | Typing in a field that carries a backend failure is no slower than typing in it is today. | NFR-6 |
| AC-30 | A refusal naming a price input that is not shown to this seller — because prices are locked — is not marked on that hidden input. Its message is shown as text, and the summary does not claim a highlighted field. | FR-13, FR-15, E-15 |

**Why `AC-10` covers these 14 and stops there.** The premise of this work is that
the backend's rules are not knowable in advance, so leaving an input unable to
show a refusal recreates the reported bug on that input. The 14 are every input
that holds **one value** and can carry a message under itself.

Two of them — shipping cost and shipping days — are already broken today, without
this ticket. Several of the 14 are also hidden when prices are locked. That is a
different failure with its own criterion, `AC-30`, and it does not take them out
of `AC-10`, which checks each input while it is on the page.

The form's other controls hold a **set** of values rather than one: the colour,
size, tag, restricted-country and label pickers, the per-country extra-price
rows, the category sub-lists, and the video upload. There is no single input to
put a message under, and inventing one for each is a larger change than this
ticket needs (`C-6`). A refusal naming one of those is **not dropped** — it
reaches the seller as text under `FR-4` and `AC-4`. That is the deliberate line:
every refusal that names something is shown, and the 14 single-value inputs are
the ones shown *on the field*.

## Out of Scope

- **The form's own validation.** Untouched, by the owner's boundary (`C-1`).
- **Judging what a backend message contains.** The backend sanitises its own
  responses (`C-3`). Filtering, hiding, redacting or rewriting a message because
  of **what it says** is out of scope, and no such guard is built. `FR-20` is not
  that guard — it turns on whether the entry names a field, never on the words in
  the message — and neither is `AC-24`, which is about how text is displayed.
- **The English-only recognition of the four codeless image failures.** They are
  matched by English wording while the backend returns a translated message, so
  they do not fire for a seller in another language. This is a real pre-existing
  defect. It is recorded, not fixed here — fixing it needs a way to recognise a
  translated message, which does not exist today. For those four, a seller in
  another language falls under `FR-20`: they are told the save failed without
  seeing which image rule broke, exactly as today.
- **Unlocking the price inputs.** `AC-30` stops a hidden input being marked. It
  does not make the input visible; the lock is a separate rule with its own
  reason.
- **The sibling boutique editor**, which has the same defect on a different
  screen. Its own work item.
- **The separate attribute-saving step** that runs after a product edit. It has
  its own endpoint, its own message and its own undo behaviour.
- **The enable-for-purchase step**, which already lists backend messages and is
  not a form-validation flow.
- **Anything shared with other screens.** The request layer already provides
  everything this work needs, so nothing shared is changed (`NFR-1`, `AC-18`).
- **Any backend change** (`C-2`).
- **Excel bulk upload and the media gallery**, which are different save paths.
