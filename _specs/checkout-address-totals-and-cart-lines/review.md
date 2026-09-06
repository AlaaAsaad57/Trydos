---
ticket: checkout-address-totals-and-cart-lines
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-05
links:
  clickup:
  github:
---

# Review — checkout-address-totals-and-cart-lines

## In plain words

> Findings first, decision after the gate — that order is the point. A question
> about a finding the owner has not been able to read tests guessing.

- **Decision: `APPROVED`.** The gate passed 4/4 and the owner approved the plan
  with all 12 majors open and recorded. They are carried into `implement.md` as
  binding follow-ups, not dismissed.

- **What the panel found:** 17 `major` across three lenses, about **12 distinct**
  once the same fault found by two lenses is counted once. Every one of them sits
  in the **live half**. The unit half drew one `minor` (a missing mock) and two
  `info`, and all three lenses say it can be carried out as written.
- **Each `major`, in one line:**
  - **P-1 — the caps do not fit the budget.** `BUY-01` is 900 s, so with
    `BUY-03` 795 s and `BUY-04` 585 s, one file caps at 39 min against a 30-min
    `globalTimeout`. A case that reaches its cap kills the run.
  - **P-2 — the teardown budget is not enforced.** `throughProxy` passes no
    `timeout`, so each call can take the 30 s default, not the 15 s the plan
    assumed. A teardown cut short can stop after set-default and before the
    delete, leaving the probe on the account.
  - **P-3 — the bag teardowns need a page that is already closed.** Round 3 fixed
    this for the address work and left the same fault in the bag work.
    `BUY-04`'s bag teardown names no channel at all.
  - **P-4 — a cheaper design exists.** Moving the bag setup to
    `/cart/add` and `/cart/remove` deletes about 900 s — 15 of the 24 minutes —
    and loses no criterion.
  - **S-1 / N-2 — `test.afterEach` is file-scoped.** `shopper.live.spec.ts` has no
    `test.describe`, so `BUY-03`'s teardown would also fire after `BUY-01` (which
    places a real order), after `BUY-02`, and after `BUY-04`.
  - **S-2 — the "no default" branch contradicts the rule beside it.** In that
    branch the probe **is** the current default, so "simply delete it" collides
    with "never delete the current default".
  - **S-3 / N-3 — the probe marker collides twice.** It is byte-identical to
    `PROF-07`'s, and the new `BUY-01` guard would refuse to order on the marker
    that `BUY-01` itself writes — permanently disabling the only real-order
    journey.
  - **S-4 — `NFR-3`'s mechanism does not cover framework text.** Playwright prints
    element content in its own errors, and the plan's rule only covers `expect`
    arguments and messages.
  - **S-5 — the teardown's session can be stale.** `handOnSession` writes only
    when a case ended verified, so in the exact failure path the teardown exists
    for, the restore could run as a guest.
  - **N-4 — the API create has no body.** The app posts 16 fields, including the
    country and the region values that decide whether shipping can be computed at
    all. Only `AC-3` has a stated fallback, so a failing create leaves four more
    criteria silently uncovered while the case still passes.
  - **N-5 — `AC-3` is ordered in the wrong place.** The edit needs the checkout
    address sheet, but it is listed after the return to the bag, and no second
    trip to the checkout is in the steps or the arithmetic.
  - **N-6 / P-5 — the deciding number is still deferred.** Expected duration of a
    healthy live run is unmeasured, and the plan defers it to `/verify`, after all
    the code is written.
- **One `major` was not reproduced, for the third time.** N-1 says five target
  files carry another session's work. Four direct `git status --porcelain` runs
  during this session say otherwise. What really happened is in Panel Findings.
- **How this compares with the plan check:** the plan check ran three rounds and
  found 41 majors without converging. These are **new** findings on top of that,
  because round 3's fixes reached the draft after the last check round and no
  checker had seen them. Two of them (`P-3`, `S-1`) are round-3 fixes that
  reintroduced the fault they were meant to remove.

## Review Scope

`spec.md` (16 acceptance criteria) and `plan.md` (9 files, 13 steps, three
recorded plan-check rounds). Read-only. No branch, no implementation.

## Plan Summary

Add tests only, in the two suites that already exist. Six unit cases prove the
money numbers and the line controls; two live scenarios prove the address choice
and the real figures on staging. Setup and cleanup go through the backend API;
only `AC-3`'s edit goes through the screen. Validation profile `logic-change`
runs the unit rows; the live rows are run by hand at `/verify`.

## Risks

- The live half has produced every `major` in the last two checks and in this
  panel. Its fault rate is not falling: 15, 13, 13, then 12 distinct here.
- 24 minutes of new ceiling against a 30-minute `globalTimeout`, with the
  observed runtime still unmeasured. If it does not fit, `staticPages.live.spec.ts`
  is silently dropped from every run — a regression in a file this ticket does
  not own.
- Three "records itself as not covered" escapes can all fire in one run and still
  leave a green exit code. That is the false green this work item exists to stop.

## Assumptions

- The staging shopper account and both backends are reachable when `/verify`
  runs. Not tested in this session.
- No other session is editing the target files at implement time. True as of
  13:07 today; it was **not** true between roughly 10:43 and 13:00.

## Open Questions

- None carried from `spec.md`. `OQ-6` is answered in
  `plan.md > Answers to deferred questions`.

## Panel Findings (advisory)

**Totals: 17 `major` (12 distinct), 13 `minor`, 6 `info`.** Advisory only — the
panel informs the decision, it never makes it (`RP-2`).

| Lens | Severity | Finding | Reference |
|------|----------|---------|-----------|
| performance | **major** (P-1) | `BUY-01` is already 900 s, so `shopper.live.spec.ts` would cap at 900 + 795 + 585 = 2340 s = 39 min against a 30-min `globalTimeout`. A case that reaches its cap aborts the run, and the tail is silently absent, not red. | `plan.md:509-512`, `:518-519`; `tests/e2e/shopper.live.spec.ts:140`; `playwright.config.ts:65` |
| performance | **major** (P-2) | `throughProxy` passes no `timeout` to `request.post`, so each call can wait the 30 s Playwright default, not the 15 s the teardown row assumes. Four calls can need 120 s; a teardown cut at 60 s can stop after set-default and before the delete. | `tests/e2e/harness/orderCleanup.ts:97-104` vs `plan.md:504`, `:511` |
| performance, senior | **major** (P-3 / N-2b) | The bag teardowns need a page, and every live case closes its context in its own `finally`. Round 3 fixed exactly this for the address teardown and left it in the bag teardowns. `BUY-04`'s names no channel at all, and has no Numbers row. | `plan.md:576`, `:291-295`, `:512`; `tests/e2e/shopper.live.spec.ts:357-359`, `:409-411` |
| performance | **major** (P-4) | Cheaper coverage: the same API move fits the bag — `/cart/add` and `/cart/remove` — deleting the 270 s and 180 s setup rows from both cases, about 900 s of the 1440 s, and removing the un-budgeted 6-product walk. No criterion is lost. | `plan.md:500-501`, `:509-510`; `services/cart.ts:34`, `:114` |
| security, senior | **major** (S-1 / N-2a) | `test.afterEach` is file- or describe-scoped, and `shopper.live.spec.ts` has no `test.describe`. `BUY-03`'s address teardown would also fire after `BUY-01` (real order), `BUY-02` (guest context), `BUY-04`, and any case skipped by `hasShopperA()`. | `plan.md:271`, `:102`, `:576`; `tests/e2e/shopper.live.spec.ts:126`, `:133`, `:371` |
| security | **major** (S-2) | The "the account had no default" branch says the probe "is simply deleted", but in that branch the probe **is** the current default. That contradicts "never delete the current default" in the same row and re-opens the `address_id=undefined` hazard. | `plan.md:564` vs `:283-284`; `services/order.ts:74`, `:81` |
| security, senior | **major** (S-3 / N-3) | The probe title and detail are byte-identical to `PROF-07`'s, on the same account, and `profile.live` sorts first — so the row locator can be ambiguous and the strict-mode error prints both addresses to the public log. Worse, `BUY-01` writes its own `Trydos E2E Buy Probe` when the account has no address, so the new guard would permanently block the only real-order journey. | `plan.md:302-307`, `:605-609`; `tests/e2e/profile.live.spec.ts:218-219`; `tests/e2e/shopper.live.spec.ts:110-115`, `:224` |
| security | **major** (S-4) | `NFR-3`'s stated mechanism covers `expect` arguments and messages only. Playwright's own errors print element content — "locator resolved to `<div>…`", strict-mode match lists — into the world-readable job log and into `e2e-results.json`, and `redact()` has no rule for a street or a name. | `plan.md:543-546`; `spec.md:118-121`; `.github/workflows/test-e2e.yml:222` |
| security | **major** (S-5) | The teardown builds its request context "from the saved session", but `handOnSession` writes only when the case ended verified. In the exact failure path the teardown exists for, the file can still hold `BUY-01`'s superseded jar and the restore runs as a guest. | `plan.md:286-288`; `tests/e2e/harness/liveSession.ts:106-118`; the working pattern is `tests/e2e/fixtures.ts:74`, `:88-91` |
| senior | **major** (N-4) | The API create names an endpoint but no body. `AddAddressList` posts 16 fields, including `country`, `iso`, coordinates and five region values that the UI path gets from the picker — the very values that decide whether the probe is in `CASH_ON_DELIVERY_COUNTRY` and whether shipping can be computed. Only `AC-3` has a stated fallback, so a create that fails leaves `AC-1`, `AC-2`, `AC-4` and `AC-10` silently uncovered while the case still passes. | `plan.md:246-253`, `:504`; `services/order.ts:251-280` |
| senior | **major** (N-5) | `AC-3`'s edit is ordered after the return to the bag, but editing needs the checkout address sheet and asserting needs the checkout screen. No second trip to the checkout is in the steps, and no second `CHECKOUT_MS` is in the 795 s. | `plan.md:240-266` (items 6 and 7), `:503`, `:509` |
| senior, performance | **major** (N-6 / P-5) | 24 minutes of new ceiling is accepted against a 30-minute `globalTimeout`, and the number that decides it — observed duration of a healthy run — is deferred to `/verify`, after all the code is written. `playwright.config.ts` is not in Files to change and `.github/workflows/**` is a protected runtime path, so the plan has no in-scope way to act on the answer. | `plan.md:518-519`, `:618-624`, `:314-338`; `playwright.config.ts:65` |
| senior | **major** (N-1) | **NOT REPRODUCED.** Claims five target files are modified plus two untracked. Four direct `git status --porcelain` runs in this session say otherwise, and this is the third time a lens has raised it from the same stale snapshot. What is true: the tree was clean at intake; between about 10:43 and 13:00 another session held `tests/e2e/selectors.ts` and `components/skeleton/loaders/FeaturedProductsSkeleton.tsx` modified, and the claim checker watched a line move mid-search; that session landed the work as `73432af6`, and at 13:07 the tree is clean but for this work item's own `_specs/`. `tests/e2e/checkout.scripted.spec.ts` is **tracked**, from `79a0d8fb`. The risk was real while it lasted and is resolved; the finding as written is not. | `plan.md:440-449`, `:636-641`, `:753`; commits `79a0d8fb`, `73432af6` |
| senior | minor (N-7) | Step 6 deletes `cart.total` as dead code, then adds `cart.normalPrice`, which **no** criterion reads — `spec.md` puts the live "Normal Price" out of scope and `AC-7` is a unit test. | `plan.md:196-199`; `spec.md:209-210` |
| senior | minor (N-8) | Three "records itself as not covered rather than going red" escapes can all fire in one run and still leave a green exit code. | `plan.md:253`, `:569`, `:570` |
| senior | minor (N-9) | Step 3 does not mock `utils/orderFunnel`, but `OrderButton`'s mount effect fires `trackOrder` whenever `total_discount > 0`, and the fixture sets 20. The sibling test already mocks it. | `plan.md:161-170`; `components/Cart/OrderButton.tsx:46-57`; `tests/components/Cart/QuantutyInput.test.tsx:29-32` |
| senior | minor (N-10) | The "overwrites the country with the URL's" evidence points at a test file; the real source is the store action. | `plan.md:243-245` cites `tests/store/cartReducer.test.ts:337`; actual `store/Cart/reducer.ts:243-256` |
| senior | minor (N-11) | The unit half is fully carry-out ready and every open hole is in the live half; landing the unit half now and re-planning the live half is still the cheapest path. | `plan.md:783-790` |
| security | minor (S-6) | The create body is unspecified and nothing checks whether the backend auto-defaults a newly added address — if it does, `AC-1` and `AC-10` have no default left to move. | `plan.md:250-253`; `services/order.ts:254-270` |
| security | minor (S-7) | If the create succeeds but the answer carries no id, the teardown has no id to delete by and the plan has no branch for it. | `plan.md:280-281`; `services/order.ts:287` |
| security | minor (S-8) | Plan and spec disagree on cash on delivery: the plan bars it for `BUY-03`, the spec says the live checks use it only. | `plan.md:263-266` vs `spec.md:208` |
| security | minor (S-9) | `throughProxy` only `encodeURI`s the target, leaving `&`, `=` and `#` unescaped, and the plan interpolates a backend value into `?address_id=`. | `plan.md:562`; `tests/e2e/harness/orderCleanup.ts:90` |
| performance | minor (P-6) | The 180 s "add a product" row budgets one attempt, but the helper walks up to six products. | `tests/e2e/actions/cart.ts:326-346`; `plan.md:501` |
| performance | minor (P-7) | The 270 s "empty the bag" row is right for exactly one leftover line; the helper costs 225 s fixed plus 45 s per line. | `tests/e2e/actions/cart.ts:72-145`; `plan.md:500` |
| performance | minor (P-8) | The ceiling row contradicts itself: the Value cell says ≈142 min, its own arithmetic says 8310 s ≈ 138 min. | `plan.md:517` vs `:84` |
| performance | minor (P-9) | The artifact footprint is stated as "2 files" but never sized, and these would be the longest videos the suite has produced. | `plan.md:520`; `playwright.config.ts:113` |
| senior | info | `OrderButton` renders only when `cart_loading` is false **and** `cartShippingSuccess === null`, so a shipping error hides the whole totals row that `AC-8` and `AC-9` read. | `components/Cart/index.tsx:446-448` |
| senior, security, performance | info | No protected runtime path is touched, no `observability/` directory exists here, the session file stays outside the archived artifact tree, and the video decision matches the owner's narrowed `NFR-3`. | `plan.md:314-338`; `.github/workflows/test-e2e.yml:300` |
| senior, performance | info | The unit half carries no measurable cost and every citation the lenses re-opened in it holds. | `plan.md:396-401` |

## Decision

**`APPROVED`** — recorded by the owner on 2026-09-05, after the comprehension gate
passed 4/4.

**Rationale, stated plainly.** The panel raised 12 distinct `major` findings and
none of them was dismissed. The owner was offered the split (land the clean unit
half, re-plan the live half) at the end of the plan stage and chose to carry the
whole work item forward; this decision is consistent with that. The findings
become binding follow-ups at `implement` rather than a reason to send the plan
round a fourth time.

**What this approval does not claim.** It does not claim the live half is ready
to type out. Four of the majors say parts of it cannot be carried out as written
— the file-scoped teardown, the guard that collides with `BUY-01`'s own probe,
the API create with no body, and `AC-3` ordered before the checkout trip it
needs. `/implement` must resolve each one against the follow-ups below, and
`IM-8` says to block rather than improvise if a resolution would grow the change.

## Approvals

| Role | Who | Decision | Date |
|------|-----|----------|------|
| Owner (self-review, ADR-009) | developer | `APPROVED` | 2026-09-05 |

Gate: `comprehension.md`, `result: passed`, `score: 4/4`, `threshold: 1.0`, not
degraded.

## Approvals

<!-- Written at Step 4. -->

## ADR reference

- ADR-009 (single owner, self-review), ADR-010 (advisory panel), ADR-012 and
  ADR-022 (question count), ADR-025 and ADR-028 (question quality, degraded
  gate), ADR-029 (the decision is the owner's).

## Required Follow-up Actions

Every `major` is dispositioned. **Accept** means the plan already handles it or
the owner takes the risk knowingly; **mitigate** means `/implement` must change
something before the code is written; **dismiss** means the finding does not hold.

| # | Disposition | What `/implement` must do |
|---|-------------|---------------------------|
| P-1 | **mitigate** | Re-size the per-case caps so `BUY-01` 900 s + `BUY-03` + `BUY-04` fits inside the 30-minute `globalTimeout`, or record in `implement.md` which coverage is knowingly dropped when the run overruns. A cap that aborts the run is worse than a cap that fails red. |
| P-2 | **mitigate** | Pass an explicit `timeout` on every new `throughProxy` call, or raise the teardown allowance to the real default. A budget the code does not enforce is not a budget. |
| P-3 | **mitigate** | Give both bag teardowns a channel that works after the case closes its context — the same API route the address teardown uses. `BUY-04`'s teardown has none at all today. |
| P-4 | **accept, with a decision to record** | Cost the `/cart/add` and `/cart/remove` option before writing the setup. If it is taken, the 270 s and 180 s rows go and the caps drop with them; if it is not, say why in `implement.md`. |
| S-1 / N-2 | **mitigate** | Wrap each new case in its own `test.describe`, or make every teardown a no-op unless its own case created the state it restores. As written, `BUY-03`'s teardown fires after `BUY-01`, which places a real order. |
| S-2 | **mitigate** | Fix the contradiction: in the "account had no default" branch the probe **is** the default, so it must not be deleted. Keep it, annotate, fail loudly. |
| S-3 / N-3 | **mitigate** | Give the probe a run-unique marker, and scope the `BUY-01` guard to that marker only. As written the guard would refuse on the marker `BUY-01` itself writes, permanently disabling the only real-order journey. |
| S-4 | **accept, and state the limit** | The ids-and-booleans rule stands, but framework-generated text is best-effort: never wait on, click, or resolve an element whose text is a real address. Say so in `implement.md`. |
| S-5 | **mitigate** | Capture `context.storageState()` in memory at case start and build the teardown's request context from that object. `handOnSession` writes only when a case ended verified, which is not the path the teardown exists for. |
| N-4 | **mitigate** | Write the exact create body, including country, iso and the region values, and state what happens to `AC-1`, `AC-2`, `AC-4` and `AC-10` when the create fails. Today only `AC-3` has a fallback, so four criteria could go silently uncovered while the case passes. |
| N-5 | **mitigate** | Reorder `BUY-03` so the edit and its assertion happen while the case is still on the checkout, or add the second checkout trip to the steps **and** to the arithmetic. |
| N-6 / P-5 | **mitigate** | Read the elapsed time of the last green live run from CI **before** writing code. It costs minutes and no code, and it is the number the 30-minute question turns on. Deferring it to `/verify` makes the decision unreversible by the time it is taken. |
| N-1 | **dismiss** | Not reproduced, on four direct `git status --porcelain` runs. The concurrent-session risk was real between about 10:43 and 13:00 and is resolved: that session landed its work as `73432af6` and the tree is clean. Step 13 still re-reads every citation. |

Minors, all **accepted** and folded into the actions above or into `/implement`'s
own judgement: N-7 (drop the unread `cart.normalPrice`), N-8 (make the three
"not covered" escapes visible to `/verify` with an annotation), N-9 (mock
`utils/orderFunnel` in the new unit file), N-10 (fix the country citation), N-11
(the split remains available), S-6 to S-9, P-6 to P-9.

**One standing instruction for `/implement`.** `IM-8` applies: if resolving any
mitigation would require touching a file `plan.md > Files to change` does not
list, block and come back — do not improvise the scope.
