---
ticket: product-editor-backend-field-errors
stage: review
mode: standard
status: complete
owner: reviewer
updated: 2026-08-27
links:
  clickup:
  github:
---

# Review — product-editor-backend-field-errors

> Review gate, **round 2** — run by the ticket owner themselves (self-review). A
> comprehension check at the gate is the integrity control. Evaluates the spec and
> plan before any implementation.
>
> Round 1's record is at `comprehension-review-1.md`. Its decision was
> `CHANGES_REQUESTED`; its twelve follow-ups are answered in `plan.md > Follow-up
> → change map`, and all three lenses confirmed that against the source this
> round.

## Review Scope

`spec.md` revision 2 (20 functional requirements, 6 non-functional, 6 constraints,
15 edge cases, 30 acceptance criteria) and `plan.md` revision 4 (13 steps, 6 files,
a 30-row test table, the `full` validation profile). Read alongside them:
`research.md`, `intake.md`'s decision register `D-1` … `D-10`,
`comprehension-review-1.md`, and every source file the plan names.

**Step 1 — plan validation passed.** `PL-1` … `PL-5` (Approach, Steps, Files to
change, Validation strategy with Rollback, Out of scope), `PL-11` (an explicit
Integration surface with dependents, overlaps and failure modes), `PL-12` (no
`OQ-n` left open), `PL-13` (one Tests row per `AC-1` … `AC-30`; the named test file
is under Files to change; the `full` profile runs it) and `PL-14` (coverage
searched, one disposition per row, no second parallel file for a unit that already
has one). Plan ↔ REQ/AC traceability is present and complete.

## Plan Summary

Rewrite the one function that already receives a refused save so it stops replacing
the backend's message with a constant of ours and stops dropping any problem whose
field name it does not recognise. It returns three things: what it could put on a
field, what it could not, and how many entries it withheld under `FR-20`. A
31-name set of fields the form can display a message under replaces the 20 guessed
backend codes. Fourteen inputs gain the attributes they are missing, the page moves
to the topmost failing field, and changing a field clears the backend failure on it.
Backend failures live in their own state, so the form's own validation is never
written by this work.

## What changed since round 1

- The **deviation from `spec.md`** is gone. The owner sent the work item back to
  `/wf:spec`; revision 2 of the specification adopted the withhold rule as `FR-20`,
  reversed `E-4` to match, and fenced `FR-20` in `C-3` so it cannot grow into the
  content filter `C-3` forbids.
- `E-15` and `AC-30` are new: six price inputs are absent from the page when prices
  are locked, yet are still submitted.
- Nine factual corrections to the plan, listed in `plan.md > Revisions since the
  reviewed plan`.

## Risks

- Two of the three lenses independently found the **same** major: the summary line
  can now be a backend sentence, and the shared notification store silently drops
  any message containing "authorized". Verified in source at
  `store/notifications/reducer.ts:89-91`.
- The codeless image branch is the one route left by which a backend string with no
  field name can reach a field. The plan does not say whose text is written there.
- Four of the seven research questions are still closed by owner assertion rather
  than evidence (`spec.md > C-5`).
- Three hand-written lists must stay in step with the render sites, with no
  automatic guard: the 31 names, the six locked price names, and the four image
  phrases.

## Assumptions

- `D-4` / `C-3` — the backend sanitises its own responses, with the one exception
  now written into `C-3` and handled by `FR-20`.
- `D-6` — validation refusals arrive only as `422`. Dismissed in round 1; still an
  owner assertion. `SEN-16` adds that the status also depends on the proxy route
  mirroring it.
- `D-5` — backend messages arrive in the seller's language.
- `D-10` — messages are shown as text, never rendered as markup. The security lens
  confirmed this holds mechanically at all three sinks.

## Open Questions

None left open by this gate. The one question the panel raised — whether the
summary line may carry backend text at all, given `SEC-11` / `SEN-11` — was settled
by the owner at Step 4: **accepted, with no plan change**. It is recorded under
**Accepted exposures** below and carried into `/verify`.

## Panel Findings (advisory)

> Findings from the advisory review panel (senior / security / performance) —
> read-only lenses over `plan.md` + `spec.md` (ADR-010 / RP-1). Each lens verified
> the plan's line references against the real source; every reference checked out.
> **Advisory only:** these inform the owner; they never block the decision (RP-2).
> Dispositions are recorded at Step 4, after the comprehension gate.

| Lens | Severity | Finding | Ref (AC-n / step / file) | Owner's disposition |
|------|----------|---------|--------------------------|---------------------|
| security | **major** | `SEC-10` — The four codeless image matches are the one route by which a backend string carrying no field name can still reach a field, and step 2 never says whose text is written there. Today the code writes two translated constants of ours. If `/implement` applies `FR-2`/`AC-2` ("the backend's own message") to that branch, the exact class `FR-20` withholds lands on screen through the one door left open. | plan step 2; `helpers.ts:1144-1152`; spec `FR-2`, `FR-17`, `FR-20`, `AC-14` | **accept** — no plan change. `AC-14` already binds that branch to behave "exactly as before this work", which is the two constants of ours; `/implement` reads `FR-20` and `AC-14` together. |
| security | **major** | `SEC-11` — The summary line may now be a backend sentence, and `showErrorNotification` returns early, silently, for any message containing "authorized". A refusal whose first unbindable message carries that word tells the seller nothing at all, and no field is marked to compensate. | plan step 5; `ProductEditor.tsx:536-538` → `components/global/AddToCartMessage.tsx:246-250` → `store/notifications/reducer.ts:89-91` | **accept** — no plan change. The exposure is recorded below and carried into `/verify`. |
| senior | **major** | `SEN-11` — The same fault, found independently: the summary reaches the seller through the shared global notification store, which drops "authorized" messages. `.message-add-to-cart` is rendered nowhere in the repository, so `showErrorMessage` always takes the notification path. Breaks `FR-15` / `AC-12` / `AC-23`. The Integration surface says "Components / shared config touched: none", which is now wrong: this change feeds backend text into that shared store for the first time. | plan step 5 and Integration surface; `store/notifications/reducer.ts:89-91`; `AddToCartMessage.tsx:246-250` | **accept** — no plan change. Same fault as `SEC-11`, same disposition. |
| senior | minor | `SEN-12` — The mapper's third output, the withheld count, has no consumer: the banner never shows it, the summary chooser does not read it, and Out of scope keeps it out of the log payload. It exists only for its own test. | plan steps 2 and 5, Out of scope, Tests row `AC-12` | no action |
| senior | minor | `SEN-13` — Step 2 has no empty-message guard. An entry naming a field with a blank message would still count as "a field was marked", so the summary would claim highlighted fields and the picker would scroll to a field showing nothing. | plan step 2; spec `AC-22`, `AC-25` | no action |
| senior | minor | `SEN-14` — `AC-16`'s declared case cannot fail. The mapper takes only the response and `pricesLocked`; it has no add/edit input, so the case asserts a tautology. The real add/edit difference is in the DOM the picker walks — create omits two sections and renders a different `translations` block. | plan Tests row `AC-16`; `ProductEditor.tsx:1002`, `:1008`; `sections.tsx:1578` vs `:1630` | no action |
| senior | minor | `SEN-15` — The second copy of the counter-example lives in the docblock on `mapServerErrors` itself, which also states "no backend text is ever surfaced". Step 12 names only `ProductEditor.tsx:518-522`, so the rewritten function would keep a comment saying the opposite of what it does. | `helpers.ts:1119-1125`; plan step 12, `AC-21` | no action |
| senior | minor | `SEN-16` — The `422` gate depends on the proxy route mirroring the upstream status, not on `utils/fetchData.ts` alone. The claim holds today, but the Integration surface does not name that route, so a status change in a route shared by every client fetch would turn this feature off with no test failing. | plan step 4 and Integration surface; `utils/fetchData.ts:573-610`; `app/api/proxy/route.ts:270-271`, `:281-282` | no action |
| senior | minor | `SEN-17` — `SeoSection` does not receive `errors` at all, so the two SEO call sites need the section signature changed as well. "Eleven call sites taking one or two extra attributes" is wrong for those two. Same file, so `IM-4` is not at risk; only the description of the work is wrong. | `sections.tsx:931`; plan step 7 and the `meta_title` / `meta_description` bullets | no action |
| senior | minor | `SEN-18` — `AC-10`'s render half is declared as proved at `/verify` "by walking the 14 one at a time against a refusal naming each", but nothing in the repository can produce a per-field backend refusal at `/verify`: the `full` profile is lint, typecheck, unit and build, and the plan itself says no component test exists for this form. | plan Tests row `AC-10`; Validation strategy | no action |
| performance | minor | `PERF-7` — The three-record display merge is described with no shape. An unconditional spread in the render body would hand a new errors object to every section on every render, throwing away the identity the current code deliberately keeps. | plan step 8; `ProductEditor.tsx:790-795` | no action |
| performance | minor | `PERF-8` — The mapper's messages array is unbounded — a 10-colour × 6-size product under `E-12`/`AC-6` can produce roughly 360 entries — and that whole array goes into React state. Step 9 dedupes and caps only before rendering, so a set over hundreds of strings reruns on every keystroke while the banner is on screen. | plan step 9; spec `E-12`, `AC-6` | no action |
| performance | minor | `PERF-9` — The plan calls `FR-20`'s "recorded off-screen" free, but the same refusal body is already sent to error reporting twice, and a large variant refusal can exceed the event size limit. The off-screen record is best-effort, not guaranteed. | plan Out of scope, last bullet; `utils/fetchData.ts:749-753`; `ProductEditor.tsx:530-535` | no action |
| security | minor | `SEC-12` — Step 6 does not say whether the topmost-field picker returns the element or the key. If it returns the key and `scrollToFirstError` re-queries with an interpolated `[data-field="…"]`, the selector interpolation `SEC-5` was mitigating is back in the code. | plan step 6; `helpers.ts:1318-1329` | no action |
| security | minor | `SEC-13` — Per-field backend messages have no length bound and no dedupe. `SEC-6`'s decline reasoned only about the banner, so the on-field sink was never weighed. Bounding the rendered box rather than the string keeps `AC-2` exact and leaves `C-3` untouched. | plan Out of scope (`SEC-6` decline), step 9; `sections.tsx:131`, `:796`, `:1078`, `:1411` | no action |
| security | minor | `SEC-14` — Backend text sits verbatim beside our own translated wording inside one alert element, in a UI that runs right-to-left. A bidi override or an embedded newline can visually reorder or hide our own capped-banner line. | plan step 9; `ui/index.tsx:376-381`; spec `E-13`, `AC-24` | no action |
| security | minor | `SEC-15` — `FR-20`'s promise that a withheld entry is "recorded off-screen, so it is not lost" rests entirely on two error-reporting calls the plan lists as out of scope and declares untested. Those same calls still send the raw framework text out of the browser, so `FR-20` removes it from the screen only. | plan Out of scope, last bullet; spec `FR-20`, `C-3` | no action |
| senior | info | `SEN-19` — Step 3 introduces a second hand-written list, the six locked price names, duplicating the six render guards in `sections.tsx`. The risk register records the drift risk only for the 31-name set. | plan step 3, "What breaks if this is wrong"; `sections.tsx:444`, `:447`, `:451`, `:466`, `:474`, `:485` | no action |
| security | info | `SEC-16` — The `SEC-5` mitigation works, but the load-bearing part is the set check, not the prefix rule: cutting at the first `.` or `[` still leaves an attacker-controlled string, and only membership in the 31 literal names stops it becoming a key. The plan's ordering is the correct and sufficient control. | plan step 2; Tests row `AC-7` | no action |
| security | info | `SEC-17` — Blast radius is small and reversible: three source files, three translation files with one key each, one test file, one commit, two routes. No endpoint, port, permission, environment variable, cookie or config is touched. This repository owns no observability runtime files, so that hard stop does not apply. | plan Files to change, Integration surface, Rollback | no action |
| performance | info | `PERF-10` — The claim that the same-object bail-out "keeps that free" is right about the outcome and wrong about the mechanism. The update function already returns a new form object per keystroke, so the render happens anyway; the bail-out prevents a second state change, not a render. | plan step 11 and Integration surface | no action |
| performance | info | `PERF-11` — Step 11 adds a second state write to every patch, including keystrokes inside the rich text editors and the variant grid, even when no refusal is pending. An early return before scanning the patched keys removes it. | plan step 11; `sections.tsx:1607`, `:1642` | no action |
| performance | info | `PERF-12` — The largest per-keystroke cost on this form is pre-existing: the seller-product-id check re-filters the shop's whole id list on every render, and step 8 makes that derived value a permanent leg of the display merge. | `ProductEditor.tsx:488-494`; plan step 8 | no action |

### What the panel confirmed rather than found

Recorded so the next reader does not re-open a settled item:

- **Round 1's twelve follow-ups are genuinely answered**, checked against source by
  all three lenses, not taken from the plan's own account of itself.
- `SEN-4` is correct for a reason the plan only asserted: `confirmSave` is reachable
  **only** through `setConfirm(diff)` at `ProductEditor.tsx:516`, so clearing at the
  top of `startSave` really does cover both paths.
- `SEN-2` holds: `setErrors` appears only at `:502`, `:525`, `:613`, `:630`, and
  `startSave` already writes `{}` at `:502` before a save can proceed, so dropping
  `:525` leaves no stale form message.
- `PERF-4`'s cost is now measured, not estimated: about 22 anchors today and about
  36 after step 7, none inside a variant, translation or per-country loop, so the
  count cannot grow with product data. One pass is right.
- `FR-9` / `AC-24` holds mechanically at all three text sinks — the alert renders a
  text child, the toast sets text content, the notification renders a text child.
- All 31 names really are keys of the form's own shape, and every line reference in
  the plan checked out.

## Decision

`APPROVED`

- The comprehension gate passed at **3/3** — the full minimum set, not a degraded
  gate. See `comprehension.md` (attempt 2).
- Step 1 validation passed: `PL-1` … `PL-5`, `PL-11`, `PL-12`, `PL-13`, `PL-14`
  and plan ↔ REQ/AC traceability all hold, which is what `RV-3` requires before
  `APPROVED`.
- The deviation that returned this work item to `plan` in round 1 no longer
  exists. `spec.md` revision 2 carries the withhold rule as `FR-20`, so every step
  in the plan traces to a criterion.
- The panel raised three `major` rows covering two distinct faults. **The owner
  accepted both**, with no plan change. The panel is advisory (`RP-2`); the
  decision is the owner's, and it is recorded as given.
- The fourteen `minor` and six `info` findings are recorded as read, with **no
  action**.

## Accepted exposures

Recorded because "accept" is a decision, not an oversight. `/implement` and
`/verify` both read this section.

- **`SEC-11` / `SEN-11` — a summary line containing "authorized" reaches nobody.**
  `store/notifications/reducer.ts:89-91` returns early, without rendering, for any
  message whose text contains that word, and `showErrorMessage` always takes that
  path because `.message-add-to-cart` is rendered nowhere in this repository. Step
  5 permits the summary to be a backend sentence, so a refusal whose first
  unbindable message carries the word shows the seller no summary at all. The
  banner still carries that same sentence, so the seller is not left with a blank
  screen — but `FR-15` / `AC-12` / `AC-23` are met by the banner, not by the
  summary. **`/verify` records this as a known limit against those three rows**
  rather than treating it as a pass by silence.
- **`SEC-10` — the codeless image branch's text is not stated in step 2.**
  Accepted on the ground that `AC-14` binds that branch to behave "exactly as
  before this work", which is the two translated constants of ours at
  `helpers.ts:1144-1152`. **`/implement` must keep those two constants**; writing
  the backend's own sentence there would satisfy `FR-2` while breaking `AC-14` and
  `FR-20` together. `/verify` confirms it from the diff.
- **The Integration surface's "Components / shared config touched: none" is now
  known to be incomplete.** This change feeds backend text into the shared
  notification store for the first time. The store is not edited, so the sentence
  is true about *files changed* and wrong about *flows fed*. Recorded here rather
  than corrected in the plan, because a gate does not edit what it reviews
  (`RV-11`).

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second
> approver).

- Approver (owner): developer — 2026-08-27. Decision recorded after the
  comprehension gate passed, and after the panel findings were written to this
  file and read (`RP-4`).

## ADR reference

- ADR: none

## Required Follow-up Actions

**None.** The decision is `APPROVED` and every finding was dispositioned `accept`
or `no action`, so nothing returns to `/wf:plan`.

Two items are carried forward to `/verify` instead, from **Accepted exposures**
above:

1. Record the "authorized" limit against `FR-15` / `AC-12` / `AC-23` — a known
   limit, stated, not a silent pass.
2. Confirm from the diff that the codeless image branch still writes the two
   existing constants of ours (`AC-14`).
