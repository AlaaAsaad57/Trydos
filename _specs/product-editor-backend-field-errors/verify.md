---
ticket: product-editor-backend-field-errors
stage: verify
mode: standard
status: complete
owner: developer
updated: 2026-08-27
links:
  clickup:
  github:
---

# Verify — product-editor-backend-field-errors

> Every `AC-n` in `spec.md` checked at depth `all-ac`. No implementation file was
> edited here and no commit was created (`VF-7` / `VF-10`).

## Validation profile — `full`

Commands resolved from `.claude/project-config.yaml > validation_checks`. All are
read-only.

| Check | Command | Exit code | Summary |
|---|---|---|---|
| lint | `pnpm lint` | **0** | 0 errors, 62 warnings. Every warning is pre-existing and sits in a file this change does not touch (`services/*`, `utils/fetchData.ts`, `tests/mocks/*`, `utils/usePhoneInput.tsx`). The i18n rule, which errors on a translate key missing from any of the three files, passed. |
| typecheck | `node_modules/.bin/tsc --noEmit --pretty false` | **0** | No output at all. |
| unit-tests | `pnpm test:run` | **0** | 64 files, **1590 passed (1590)**. See "The one red run" below — it is recorded, not glossed. |
| build | `pnpm build` | **0** | Production build compiled successfully. |
| i18n-parity *(extra, for `AC-19`)* | `pnpm lint:i18n-parity` | **0** | `✓ i18n parity OK — 2163 keys present in all three files.` |

### The one red run

`pnpm test:run` was executed **four** times. Three exited `0`; one exited `1` with
a single failure in
`tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx` — the case
"says why a code was refused".

It is **not** this change, and the evidence is:

- **No import path exists.** A repository-wide search for `productEdit` under
  `components/Login/` and `tests/components/Login/` returns nothing. Nothing this
  change touched is reachable from that test.
- **It passes alone, repeatedly.** Run in isolation three times: 21 passed, 21
  passed, 21 passed.
- **The assertion is time-bound.** It types six characters with `user.type` and
  then awaits `findByRole("alert")`, whose default timeout is 1000 ms. The failing
  run took 176 s wall-clock with 383 s of environment time across workers — under
  that load a one-second window is easily missed.
- **The translation key it asserts is intact** in all three files, and the only
  translation change here is one added line per file.

Recorded as a finding below rather than swept up: it is a real flake, in a file
outside `plan.md > Files to change`.

## Acceptance criteria

Test cases live in `tests/components/SellerDashboard/productEdit/serverErrors.test.ts`
unless stated otherwise. Every row marked *test* ran under the `unit-tests` check
above, exit code `0`.

| AC | Result | Evidence |
|------|--------|----------|
| AC-1 | **pass** | *test* — "a barcode already in use marks the barcode field". A coded refusal on a field the form shows now marks it. |
| AC-2 | **pass** | *test* — "the field carries the backend's own sentence, character for character". Asserts identity with the backend string, so any re-wording or re-casing fails. |
| AC-3 | **pass** | *test* — the reported case. `{ code: "barcode", message: "This barcode already exists" }` marks the barcode input with that exact sentence. This is the bug the ticket exists for. |
| AC-4 | **pass** | *test* — "a field name nothing in the code has ever mentioned still reaches the seller". `a_rule_added_next_year` is shown as text rather than dropped. |
| AC-5 | **pass** | *test* — "a code naming an item inside a list marks that list's own field". Both `category_id.0` and `labels[1]` bind. |
| AC-6 | **pass** | *test* — a colour/size row code and a translation row code both reach the message list, and `barcode_Black-M` does **not** reach flat `barcode`. |
| AC-7 | **pass** | *test* — `Object.getPrototypeOf(result.fields)` is `null`; `__proto__` and `a"]` produce no keys and are shown as text. |
| AC-8 | **pass** | *test* — a field problem and a non-field problem in one refusal both survive. |
| AC-9 | **pass** | *test* — "scrolls the failing field into view". `scrollIntoView` is stubbed on the prototype and the 100 ms timer is driven; the assertion checks **which element** it was called on, not merely that it was called. |
| AC-10 | **pass** | *test* (mapper half) — 31 parameterised cases, one per name, each asserting that a refusal naming it binds to that field; plus `similar_words` binding to nothing. **Render half, walked one input at a time:** each of the 14 now has both a message and an anchor — `count_of_pieces` (`:465`), `origin_country_iso` (`:868`), `labels` (`:796`), `images` (`:1078`), `colorImages` (`:1411`), `barcode` (`:412`), `luck_price` (`:452`), `model_number` (`:417`), `report_ref_number` (`:418`), `shipping_cost` (`:467`), `shipping_days` (`:469`), `max_allowed_qty` (`:464`), `meta_title` (`:942`), `meta_description` (`:943`), all in `sections.tsx`. |
| AC-11 | **pass** | *test* — a `500` carrying the same body yields `{ fields: {}, messages: [], withheld: 0 }`. |
| AC-12 | **pass** | *test* — the three outputs account for all three entries; the codeless raw-server-text entry is counted, not shown, and not lost. |
| AC-13 | **pass** | *test* — clearing removes only the changed field, leaves the others, and never touches the record the form's own validation writes. |
| AC-14 | **pass** | *test* — the two codeless image asserts still mark `images` and `colorImages`, and the case asserts the text is **not** the backend's own sentence. A codeless entry matching none of the four phrases marks no field. Source confirms our two constants at `helpers.ts:1230-1231`. **This is the `SEC-10` accepted exposure, and it holds.** |
| AC-15 | **pass** | `validate.weight.test.ts` is present and unedited, and passed in the suite. `validate()` is absent from the diff. `handleSaveRejection` no longer calls `setErrors` at all — confirmed from the diff — so this work never writes the form's own record. |
| AC-16 | **pass, by inspection — the test case does not prove it** | *test* — "the same refusal produces the same outputs for an add and for an edit" passes, but as `SEN-14` said it would, the mapper has no add/edit input, so that case is a tautology and proves nothing. **The real evidence is the source:** both paths call the same `handleSaveRejection`, at `ProductEditor.tsx:565` (create) and `:588` (update), with only their fallback wording differing. Recorded this way deliberately rather than letting a green tick stand in for a check it cannot perform. |
| AC-17 | **pass** | *test* — two problems naming the same field leave one readable message. |
| AC-18 | **pass** | The diff contains six files plus one new test file. `utils/fetchData.ts`, `services/sellerDashboard/index.ts`, `components/SellerDashboard/ui/index.tsx` and `store/notifications/reducer.ts` are all **absent** from it. Nothing was added to the request. |
| AC-19 | **pass** | One key added per file, `"More problems were reported"`. `pnpm lint:i18n-parity` exit `0`, 2163 keys in all three. `pnpm lint` exit `0`, and its i18n rule errors on a key missing from any file. No backend message was added to any translation file. |
| AC-20 | **pass** | The four profile checks plus parity, all exit `0`, in the table above. |
| AC-21 | **pass** | `helpers.ts:1173-1185` — the replaced docblock states the reversal is deliberate, names the decision that makes it safe (the backend sanitises its own responses), keeps the `"Undefined array key"` counter-example, names the withheld class, and adds the fence "it is not a content filter and must not become one". `ProductEditor.tsx` carries the matching comment on `handleSaveRejection`. Both copies were replaced, which answers `SEN-15`. |
| AC-22 | **pass** | *test* — an entry naming a field with a blank message marks nothing. |
| AC-23 | **pass** | *test* — a validation refusal carrying no detail yields empty outputs, so the caller falls back. |
| AC-24 | **pass** | No `dangerouslySetInnerHTML` exists anywhere under `components/SellerDashboard/productEdit/`. Every message is a text child: the banner renders each in its own `<span>`, and `DashField` renders the field message as a text child of a `<p>`. The render-level check stays declined (`SEC-3`); `AC-2`'s case guards the adjacent risk by pinning the string is returned unaltered. |
| AC-25 | **pass** | *test* — three cases: claims highlighted fields only when one was marked; otherwise gives the first unplaceable message; otherwise the caller's fallback. |
| AC-26 | **pass** | *test* — with `name` first in the record and last on the page, the picker returns `barcode`. One pass, document order. |
| AC-27 | **pass** | *test* — a dropped request (`httpStatus: 0`, no `detailed_error`) yields empty outputs and is not treated as a validation refusal. |
| AC-28 | **pass** | The change is one working-tree set over the six planned files plus one new test file, on `ticket/product-editor-backend-field-errors` off `develop`. The one translation key is removed by the same revert. No configuration, schema, flag or backend state is involved. |
| AC-29 | **pass** | *test* — "returns the very same object when nothing was cleared" (`toBe`, referential). As `PERF-3` noted and the plan recorded, this proves the mechanism `NFR-6` relies on, **not** a render count. `NFR-6` is therefore recorded as **proved by inspection of the updater plus this identity case — not measured.** |
| AC-30 | **pass** | *test* — with prices locked a refusal naming `unit_price` goes to the message list and marks nothing; with prices unlocked the same refusal marks that input. Both directions, so a mapper that never binds those six would fail. |

**30 of 30 satisfied.** Two are recorded with an explicit limit rather than a bare
pass: `AC-16` (proved by inspection, not by its own case) and `AC-29` (identity,
not render count).

## Integration surface — did it hold?

| Claim in `plan.md` | Held? |
|---|---|
| Only the six planned files change | **Yes.** The diff is exactly those six plus the one declared test file. |
| The shared dashboard primitives are used, not changed | **Yes.** `components/SellerDashboard/ui/index.tsx` is absent from the diff; the banner uses `InlineAlert`'s existing default `error` tone. |
| `utils/fetchData.ts` and the service file are read-only | **Yes.** Both absent from the diff. |
| `GalleryPickerModal.tsx` is unaffected | **Yes.** It imports only `fileName`, which is untouched. |
| The form's own validation path also moves to the topmost field | **Yes, as accepted (`SEN-8`).** `scrollToFirstError` is shared, and its red-element fallback is kept, so nothing that scrolled before stops scrolling. |
| "Components / shared config touched: none" | **No — and this was already known.** The change feeds backend text into the shared notification store for the first time. The store is not edited, so the claim is true about *files* and wrong about *flows*. Recorded at the review gate under **Accepted exposures**; repeated here so it is not lost. |

## Findings

Carried from `implement.md`, plus what this run found. **No `BUG-n`:** no test
written for this ticket proved existing behaviour wrong.

- **`FIND-1` — ~~a flaky test outside this change~~. CORRECTED: a real bug in the
  sign-in panel. Fixed on this branch after verification closed, at the owner's
  direction.**

  **What this section first said, and why it was wrong.**
  `tests/components/Login/Enhanced/InlineVerifyPanel.test.tsx`, case "says why a
  code was refused", failed once in four full-suite runs and passed in isolation.
  It was recorded here as a timing flake against `findByRole`'s 1000 ms default.
  **That diagnosis was wrong.** Setting the window to 1 ms still passed, which
  falsified it: the alert was already in the DOM when the wait began, so the
  timeout was never the deciding factor.

  **The real cause.** `InlineVerifyPanel.tsx` gated the verify error on `blocked`
  (`lockRemaining > 0 || capReached`). A **successful** send arms the same
  120-second per-number cooldown a refused one does — the component says so in its
  own comment — and the panel re-reads that guard once a second. So about a second
  after the code arrives, `blocked` is `true` for every shopper, and a wrong code
  showed red boxes and **no words** for the next two minutes. The old test only
  passed because it ran inside the gap before the first tick; a loaded run lost
  that race, which is what made it look flaky.

  **Confirmed, fixed, proved.** A new case,
  "still says why a code was refused once the resend cooldown is running", waits
  for the cooldown to reach the panel before typing a wrong code. It was run and
  **seen red** — `TestingLibraryElementError: Unable to find role="alert"` —
  deterministically, not intermittently. The fix removes the `!blocked &&` guard
  from that one paragraph; the countdown and the refusal are separate facts, and
  the red "Wait Ns" line cannot collide with it because that line only shows for a
  **refused** send, which never reaches the code step. The same case is green
  after: 127 passed across the seven sign-in files, and two full-suite runs at
  1591 passed, exit `0`.

  **This does not change the verification above.** The fault was in
  `components/Login/Enhanced/InlineVerifyPanel.tsx`, outside
  `plan.md > Files to change`, so `passed` was correctly permitted under `VF-12` at
  the time. The fix landed afterwards as separate work on the same branch, on the
  owner's instruction, and no acceptance criterion of this ticket depends on it.
  The state-history note in `ticket.md` still calls it a flaky test; history
  entries are never edited, so this is where the correction lives.

- **`FIND-2` — the "authorized" exposure is live, as accepted.**
  `store/notifications/reducer.ts:89-91` returns without rendering for any message
  containing that word, and `showErrorMessage` always takes that path because
  `.message-add-to-cart` is rendered nowhere. A summary line that is a backend
  sentence containing "authorized" therefore reaches nobody. **`FR-15`, `AC-12`
  and `AC-23` are met by the banner, which still shows that same sentence — not by
  the summary.** Accepted at the review gate with no plan change; recorded here so
  the green tick on those three rows is not read as covering it.

## Outcome

`passed`

- All 30 acceptance criteria are satisfied, each with named evidence.
- Every check in the `full` profile exited `0`, plus the parity check.
- Every `new` row in `plan.md > Tests` was written and ran; the one `existing` row
  was confirmed present and unedited; the six `none` rows were each proved by the
  reading or command their reason named.
- Two findings are open. Both lie outside `plan.md > Files to change`, which is
  what permits `passed` (`VF-12`), and neither was fixed here.
