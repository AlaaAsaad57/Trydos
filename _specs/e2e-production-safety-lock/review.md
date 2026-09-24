---
ticket: e2e-production-safety-lock
stage: review
mode: standard
status: complete
owner: developer
updated: 2026-09-19
links:
  clickup:
  github:
---

# Review — e2e-production-safety-lock

## In plain words

> Findings first, decision last (RP-4). The findings were written before the
> gate; the decision was added after it.

- **The seed's last step cannot succeed (S-1).** The plan ends the seed by
  polling the search index until the QA boutique appears. Step 5 puts the QA
  filter into the reader's `buildBaseConditions` **unconditionally**, and both
  boutique readers go through it — so the poll asks a query built to hide what
  it waits for. The setup project also has no QA mode, because step 23 attaches
  the header only in the `live` project. The first run would wait 600 s and fail.
- **The lane guard reads a variable that does not exist (S-2).** Step 12c says
  the seed no-ops unless the lane is `account`. There is no lane variable in
  `cli.ts`, step 15 never adds one, and `pnpm test:e2e:live` passes no lane — so
  the seed would no-op in exactly the manual run meant to build the QA shop.
- **`AC-23` is written two opposite ways in one document (S-3, Sec-5).** Its
  Tests row asserts the grep "fails closed"; step 10 says it fails **open** and
  is "unproven by design". Production safety therefore has no mechanism: one
  hand-edited allow-list is all that separates the suite from a production host.
- **`AC-22`'s test cannot be written (S-4).** It needs a changed `guard.ts`,
  which the plan lists under *Not changed* **and** *Out of scope*.
- **`QA-10` would go red while the data is merely syncing (S-5).** Its wait is
  180 s against the owner's stated 5–10 minute sync, and the seed polls for the
  **boutique** while `AC-19` needs the **product**.
- **The admin row is reached positionally (Sec-1).** `.first()` after a URL
  filter nobody here has read. If the filter is wrong or ignored, `.first()` is
  a real seller's pending request.
- **`AC-15` cannot see the two most dangerous calls (Sec-2).** The admin writes
  are page-driven and recorded as method and URL only, while the audit rule is
  about slugs — an approve URL carries a numeric id, so it passes by being
  invisible.
- **The seed names no session file (Sec-3).** `handOnSession` overwrites
  whichever of four shared paths it is given; writing `shopper` would hand the
  seller's cookie jar to `BUY-01..04`.
- **A protected runtime path changes with no test (Sec-4).** Step 6 edits
  `sentry.server.config.ts`, and `AC-24`'s only case tests `redact()`. A
  `beforeSend` that returns `null` or throws on a missing `request` would blind
  Sentry for the whole application, unverified.
- **`globalTimeout` bounds the manual run too (P-1).** Playwright reads it on
  every run, so the plan's "the manual first run is not bounded by the lane job"
  is wrong, and the ≈89-minute at-cap case would be killed mid-suite.
- **The sync ceiling has no margin (P-2).** 600 s is exactly the top of the
  stated 5–10 minute range.
- **A query-cost regression would have no legal fix (P-3).** The clause lands on
  the per-keystroke suggestion query, and the plan's remedy for that path is
  forbidden by `TR-2`. A cheaper design exists that the plan never considers.
- **Decision: `APPROVED`.** All thirteen majors were understood at the gate and
  are dispositioned below — twelve to mitigate at `/implement`, one accepted
  with a correction. **Several mitigations need the plan to say something it
  does not say today**, so `/implement` is expected to stop and come back rather
  than improvise (see "A condition the implementer must read first").

## Review scope

`plan.md` and `spec.md`, with `research.md` and `plan.md > Plan check` read so
the panel did not repeat what seven plan-check rounds already answered.

## Plan summary

Mark QA data in the data itself (`trydos-qa-` shop slug, a QA story link host);
filter it out of four of the six catalogue base queries; add a QA-mode header so
the tests can see it; build the QA seller, shop, location and product from a
Playwright setup project; and move the four BUY cases off an arbitrary real
product onto the QA one. 36 paths, 24 criteria, 15 live cases.

## Panel Findings

| # | Lens | Severity | Finding | Reference |
|---|------|----------|---------|-----------|
| S-1 | senior | **major** | The seed's final leg polls the search index for the QA boutique, but step 5 pushes the QA clause unconditionally into the reader's `buildBaseConditions`, which both boutique readers use. The setup project has no QA mode either. The poll can never succeed. | `plan.md` step 5, step 12 last leg, step 23; `elasticsearch-reader.service.ts:196`, `:1026`, `:630` |
| S-2 | senior | **major** | Step 12c's lane guard has nothing to read: no lane variable exists in `cli.ts`, step 15 does not add one, and `pnpm test:e2e:live` passes no lane. | `plan.md` steps 12c, 15; `tests/e2e/cli.ts:583-599`; `package.json:20` |
| S-3 | senior | **major** | `AC-23` is declared two incompatible ways: the Tests row asserts "fails closed", step 10 says it fails open and is unproven. `/implement` may not invent a declared test's mechanism (`IM-4`). | `plan.md` Tests `AC-23` vs step 10 |
| S-4 | senior | **major** | `AC-22`'s declared test passes a host as an argument, but `assertStagingTarget()` takes none and calls `loadLiveEnv()` itself — and `guard.ts` is listed Not changed and Out of scope. | `plan.md` Tests `AC-22`; `tests/e2e/harness/guard.ts:87-88` |
| S-5 | senior | **major** | `QA-10` waits 180 s against a stated 5–10 minute sync, and the seed polls the boutique while `AC-19` needs the product. A false red on the first run. | `plan.md` `QA-10`, Numbers sync row, step 12 |
| Sec-1 | security | **major** | The admin row is reached by `.first()` after a URL filter nobody in this repository has read. A wrong or ignored filter makes `.first()` a real seller's request. | `plan.md` step 14; `research.md` `OQ-1` |
| Sec-2 | security | **major** | `AC-15`'s audit records method and URL only and judges by slug; an admin approve URL carries a numeric id, so the page-driven writes pass the audit by being invisible to it. | `plan.md` `AC-15`, step 13(e); `spec.md` `AC-15` |
| Sec-3 | security | **major** | The seed signs in as Shopper B but no session file is named. `handOnSession` overwrites whichever shared path it is given; writing `shopper` hands the seller's jar to `BUY-01..04`. | `plan.md` step 12; `tests/e2e/harness/liveSession.ts:48-56`; trap S-5 |
| Sec-4 | security | **major** | Step 6 edits a protected runtime path with no declared test. A `beforeSend` returning `null` or throwing on a missing `request` would blind Sentry application-wide. | `plan.md` step 6, `AC-24` row |
| Sec-5 | security | **major** | `AC-23` ships with no mechanism, so a single hand-edited allow-list is all that stands between the suite and a production host — and the plan says it fails open. | `plan.md` step 10; `spec.md` `TR-9`; `guard.ts:125-136` |
| P-1 | performance | **major** | `globalTimeout` is unconditional, so it bounds the owner's manual first run as well. The plan's "not bounded by the lane job" is wrong, and the ≈89-minute case would be killed mid-suite. | `plan.md` Numbers; `playwright.config.ts:77` |
| P-2 | performance | **major** | The 600 s index-sync ceiling is exactly the top of the owner's own 5–10 minute estimate, leaving no margin on the one run the seed exists for. | `plan.md` Numbers seed row, step 13(f) |
| P-3 | performance | **major** | The nested clause lands on `GetSearchSuggestion`, which runs per keystroke, and the plan's remedy for that path is forbidden by `TR-2`. A >20 % result at `/verify` has no legal fix. A cheaper option is unlisted: resolve the QA boutique ids once from the prefix and filter the top-level `boutique_id`, which keeps the mark content-derived and drops the nested join. | `plan.md` step 4, Numbers query-cost row; `services/elastic/helpers.ts:437` |

### Minor and informational

| # | Lens | Severity | Finding |
|---|------|----------|---------|
| m-1 | senior | minor | Step 16a's reason is wrong: `dependencies` orders setup → live specs, not `qaLock` before `shopper`. Case order is still file order. |
| m-2 | senior | minor | The "first run ≈67 min" is the account lane's arithmetic, but `pnpm test:e2e:live` runs every `.live.spec.ts`, which is longer. |
| m-3 | senior | minor | The story-host env override has one value and a hardcoded fallback, making `spec.md`'s "host not configured" edge case unreachable. |
| m-4 | senior | minor | The new nested clause sets no `ignore_unmapped`; the reader already does (`elasticsearch-reader.service.ts:651`). An unmapped path throws a 500 for every shopper. |
| m-5 | senior | minor | Step 16b changes `globalTimeout` but leaves the stale comment above it (45-min cap, 38-min timeout). |
| m-6 | performance | minor | The seed writes no `storageState`, so `QA-07` and `QA-11` sign in again — two extra real one-time codes per run. Storing the session is the native reason a setup project exists. |
| m-7 | performance | minor | The seed's `test.setTimeout()` and its internal 1500 s deadline are not separated, so an anonymous "test timeout exceeded" can beat the named step failure. |
| m-8 | performance | minor | The 64 s/case density comes from short read cases; on a first run `QA-10` and `QA-09c` really poll, so "expected 16 min" sits much nearer its 31-min ceiling. |
| m-9 | security | minor | The setup project's artifact settings are unstated; copying `live`'s would record video of the admin dashboard — real sellers' names and phones — into the uploaded archive. |
| m-10 | security | minor | The super-admin credential is typed into a browser on every CI run, because the gate is on the whole seed rather than on the approve branch. |
| m-11 | security | minor | The two parked leaks have no ticket ids, so both leave with this ticket. |
| m-12 | security | minor | Residual risk 5 records only the slug half of the self-serve mark; the story-host half is missing. |
| m-13 | both | minor | The QA story's uploaded image is never removed — roughly 700 orphans a year. |
| i-1 | performance | info | The arithmetic checks out: 1830 s ceiling over 15 cases, 960 s expected, 1080 s first-run seed, 100 s steady, 51 / 67 / 89 min. The two-path split is sound. |
| i-2 | performance | info | The pre-suite share is not unmeasured: `playwright.config.ts:66-71` records ≈2 minutes; only the surrounding text is stale. |
| i-3 | security | info | `QA_VIEW_SECRET` must never be set in the deployed staging environment, or the header becomes an internet-reachable bypass. |
| i-4 | senior | info | Size is recorded, not resolved: 36 paths, 24 criteria, ~127 majors over seven plan-check rounds, and three lenses recommending a split declined three times. |

### How this compares with the plan check

Seven plan-check rounds ran before this gate and are recorded in
`plan.md > Plan check`. The panel was asked not to repeat what they answered.
**It did not:** S-1, S-2, Sec-1, Sec-2, Sec-3, Sec-4, P-1, P-2 and P-3 are all
new. S-3/Sec-5 and S-4 are the plan's own unresolved contradictions, written
into the document rather than hidden. Two findings point at the last round's
fixes creating the next round's problems — S-1 repeats the shape of the
round-6 circular readback in a new place, and S-2 is a guard added in round 7
whose input was never built.

## Risks and assumptions

- The admin screens remain `UNVERIFIED` from this repository (`OQ-1`). The
  owner's direction is that exploration happens at `/implement`.
- `OQ-2` and `OQ-3` are open by decision; each surfaces as a named seed failure.
- The per-request query cost is unmeasured and deferred to `/verify`.

## Decision

**`APPROVED`** — recorded by the owner on 2026-09-19, after the comprehension
gate passed 4/4 (`comprehension.md`, attempt 1, administered short under
`CG-8`).

The panel is advisory (`RP-2`) and does not block. Thirteen `major` findings
were raised, understood at the gate, and dispositioned below. The work item
moves to `implement`.

## Approvals

| Role | Who | Outcome | Date |
|---|---|---|---|
| Owner (self-review, ADR-009) | developer | `APPROVED` | 2026-09-19 |

## Disposition of every major finding

| # | Disposition | One line |
|---|---|---|
| S-1 | **mitigate** | The seed's final poll must use a path the filter leaves open, or the setup project must carry QA mode. Resolved at `/implement` against live code. |
| S-2 | **mitigate** | `cli.ts` must export the lane name, and the no-lane default must be **run**, not no-op, so the manual first run is covered. |
| S-3 / Sec-5 | **mitigate** | `AC-23` must be settled one way: add the explicit opt-in `TR-9` asks for, or change its Tests row to `none — <reason>`. It cannot stay both. |
| S-4 | **mitigate** | Either `guard.ts` joins Files to change with a pure host check, or `AC-22`'s test is restated against what `guard.ts` exposes today. |
| S-5 | **mitigate** | `QA-10`'s wait must exceed the sync ceiling, and the poll must end on the **product**, not the boutique. |
| Sec-1 | **mitigate** | Reach the admin row **because it matched** — filter by the known QA identity, fail on zero or more than one match, never `.first()` positionally. |
| Sec-2 | **mitigate** | Record the matched row id and assert every admin write URL carries it, so the page-driven legs are inside `AC-15`'s audit. |
| Sec-3 | **mitigate** | Add a fifth `SESSION_STATE` key for the seed; it never writes `auth`, `profile`, `profileScripted` or `shopper`. |
| Sec-4 | **mitigate** | Put the Sentry scrubber in a plain module as a pure function and add a unit row: strips the header case-insensitively, never returns `null`, tolerates a missing `request`. |
| P-1 | **accept, with a correction** | `globalTimeout` does bound the manual run. Drop the wrong sentence and give the value an env override so a seeding run can raise it. |
| P-2 | **mitigate** | Raise the sync ceiling above the observed range (≈900 s), re-derive the deadline, and record the measured sync at `/verify`. |
| P-3 | **mitigate** | Evaluate the panel's cheaper design — resolve the QA boutique ids once from the prefix, filter the top-level `boutique_id` — which keeps `TR-1` and drops the nested join. |

Minor findings `m-1` to `m-13` are accepted as implementation notes and carried
into the follow-ups below. Informational items need no action.

## A condition the implementer must read first

**Several mitigations above require the plan to say something it does not say
today**, and `IM-4` forbids `/implement` from making a change `plan.md` does not
declare. S-1, S-2, S-4, S-5 and P-3 are in that class: each needs a step, a
file, or a number that is not currently in the plan.

So `/implement` is expected to hit `CLAUDE.md`'s hard-stop — *"a test is needed
that the approved plan does not declare"* / *"scope grows beyond what the
approved plan describes"* — and return here rather than improvise. That is the
correct behaviour, not a failure. The owner approved with this condition
recorded and understood.

## Follow-up actions

1. Settle `AC-23` before any of its code is written (S-3 / Sec-5).
2. Add the lane export and define the no-lane default (S-2).
3. Decide the seed's index-poll path and the readback channel (S-1, S-5).
4. Add `guard.ts` to scope or restate `AC-22` (S-4).
5. Harden both admin legs: identity-matched row, recorded row id, refuse on
   ambiguity (Sec-1, Sec-2).
6. Name the seed's session key (Sec-3).
7. Extract the Sentry scrubber and test it (Sec-4).
8. Re-derive the sync ceiling, the deadline and the `globalTimeout` override
   (P-1, P-2).
9. Price the `boutique_id` alternative before writing the nested clause (P-3).
10. Open the two parked leak tickets and write their ids into Out of scope
    (m-11).
11. Set the setup project's artifact policy explicitly, so the admin screens are
    never recorded (m-9).
