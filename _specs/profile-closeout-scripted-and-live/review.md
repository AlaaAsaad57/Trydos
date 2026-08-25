---
ticket: profile-closeout-scripted-and-live
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: developer
updated: 2026-08-25
links:
  clickup:
  github:
---

# Review — profile-closeout-scripted-and-live (round 5)

> Rounds 1-4 recorded `CHANGES_REQUESTED`. Their gate records are retired at
> `comprehension-review-1.md` … `-4.md`. New findings are `U1..U9` for the
> `major` ones, then `U10` onward.

## Review Scope

Revision 5 of `plan.md` against `spec.md` (C-8 narrowed this round) and against
round 4's seventeen follow-ups. Read alongside `tests/e2e/actions/mock.ts`,
`tests/e2e/harness/{profileWrites,guard,env,session}.ts`, `playwright.config.ts`,
`services/{auth,order,chat}.ts`, `utils/fetchData.ts`,
`utils/server/authRefresh.ts`, `app/api/auth/login/route.ts` and
`.github/workflows/test-e2e.yml`.

Structural validation passed (PL-1..PL-5, PL-11, PL-12). PL-10 is satisfied: the
ledger below records each round-4 follow-up.

## The mechanism is verified — that is this round's main result

Round 4's decisive finding is **fixed and independently confirmed**:

- `route.fallback()` behaves as revision 5 claims, against Playwright 1.62.
- `tests/e2e/actions/mock.ts` is the **only** file in `tests/e2e/` that registers
  any route handler, so `SCRIPT-01..05` have no lower handler and `fallback()` is
  behaviourally identical to `continue()` for them. The change is safe for the
  five green cases.

What round 5 finds is at the next level down: the guard now runs, and the
**policy it enforces** is wrong in two ways that would break the cases it protects.

## Round 4 follow-up ledger

| # | Follow-up | Verdict |
|---|---|---|
| 1 | `fallback()` as the mechanism, proved by one blocked call | **Closed**, and verified. |
| 2 | Verb rule, drop discovery | **Closed as written — but the rule itself is unsafe** (`U1`). |
| 3 | Fake all three legs in `SCRIPT-07/10/11` | **Wording only** — `SCRIPT-08` has the same shape and was missed (`U3`). |
| 4 | Fake `/api/auth/refresh` wherever a 401 can occur | **Wording only** — the table lists it for three rows; and the reason given is false (`U4`). |
| 5 | 60s on the file, 180s for `SCRIPT-06`/`-12` | **Closed** — but 60s is too tight (`U8`). |
| 6 | How the guard fails a case; allow `/api/auth/me` | **Closed** — though `/api/auth/update-user` needed the same treatment (`U2`). |
| 7 | Drop "may not share a page" | **Closed.** |
| 8 | Read both media values before Commit A | **Closed** — schemes as well as hosts (`U13`). |
| 9 | Scope C-8 to browser calls + match `next-action` | **Half.** Spec narrowed; the `next-action` match is absent, and the spec's new wording contains a false claim (`U11`). |
| 10 | Record the analytics decision | **Closed** — but the contents are understated (`U12`). |
| 11 | Guard scope + coalescing note | **Closed** — scope misses `/api/ticket` (`U5`). |
| 12 | Narrow C-6 or state the exception | **Closed.** |
| 13 | Restore `use.video === "on"` and the media prefix | **Closed in letter, harmful in effect** (`U6`). |
| 14 | `PROF-05..07` timeouts, `reset()` both stores, leg timeout | **Closed** (leg timeout carries no number). |
| 15 | `context.route`; `serviceWorkers: "block"` | **Closed** — but the latter is project-level (`U9`). |
| 16 | Pre-compute the raise rule | **Closed.** |
| 17 | Inline the document list; measurement window | **Closed.** |

## Risks

- The guard's policy would block writes the app makes on its own successful path,
  failing four cases for the wrong reason.
- A verb-based rule is unsafe in an app that mutates on GET.
- The correct policy is not knowable from reading alone.

## Assumptions

- The panel's file-level claims were verified against the working tree; `U1`,
  `U2`, `U7` and `U8` were additionally confirmed by hand.

## Open Questions

- Can a plan contain the correct allow/deny policy at all, or must it declare the
  procedure and let `implement` produce the list as reviewable evidence? See the
  Decision.

## Panel Findings (advisory)

> Senior / security / performance, read-only over revision 5 (RP-1). Written
> before the comprehension gate runs (RP-4). **Advisory only** (RP-2).

| Lens | Severity | Finding | Ref | Owner's disposition |
|------|----------|---------|-----|---------------------|
| security | major | **U1 — This app mutates on GET, so the verb rule is unsafe.** `/api/auth/login?verificationId=…&otp=…` is a **GET** route handler that spends the one-time code and writes the whole cookie set (`app/api/auth/login/route.ts:67`). `/auth/phone/verify_otp?…&otp=…` is a **GET** through the proxy that spends a code (`services/auth.ts:281-289`). Also `/customer/order/return_requests/store`, `…/cancel`, `…/remove_image` (`services/order.ts:729,857,943`) and chat's `channels/{id}/received` (`services/chat.ts:55`), which mutates the shared account. "Allow GET" lets all of these through silently. | plan Approach ¶2, step 6; C-8 | **Mitigate.** The verb rule gains a named deny-list of mutating GETs — `/api/auth/login`, `/auth/phone/verify_otp`, the three order routes, chat `received`. A rule plus two short lists, not a rule alone. |
| security | major | **U2 — The guard would block the app's own success path and fail four cases for the wrong reason.** `updateSecureUserData` POSTs `/api/auth/update-user` after **every** leg and after **every rollback leg** (`services/auth.ts:710,743,791,819,898,927`). It sits inside `/api/auth/**`, it is a write, and only `/api/auth/me` is named as an exception — so `SCRIPT-07`, `SCRIPT-08`, `SCRIPT-10` and `SCRIPT-11` each end red naming a blocked `/api/auth/update-user` instead of the branch they test. | plan step 6; table rows 2, 3, 5, 6 | **Mitigate.** `/api/auth/update-user` joins `/api/auth/me` as a named exception, and every case whose save partly succeeds fakes it. Without this the guard would fail four cases naming itself. |
| senior + security | major | **U3 — `SCRIPT-08` still writes two real legs.** Its fakes are `/api/auth/me` only, but `AC-2` requires the save to **succeed**, so stories and core are real writes to the shared account with no undo — or, under the guard, they are aborted and `AC-2` cannot pass at all. The row is not buildable as tabled. It has exactly the shape `T5` closed for the other three and was missed from that list. | plan table row 3; C-3, `AC-2` | **Mitigate.** `SCRIPT-08` now fakes all three legs plus refresh and update-user, like the other three. It was missed from `T5`'s list; the omission is the finding. |
| security | major | **U4 — "Only the core leg reaches the refresh path" is false.** `handleUnauthorized` calls `RefreshSession` on the first 401 for **chat** (`utils/fetchData.ts:353-361`) and for **stories** (`:369-377`), and the exchange rotates the pair named in the body — single-use (`utils/server/authRefresh.ts:83-98`). So a chat or stories 401 burns the **chat/stories** refresh token in the file `SCRIPT-06` wrote, not only the market one. The note carried under the case table is wrong and has been since round 3. | plan notes under the table; C-9 | **Mitigate.** The claim is deleted. All three legs are treated as refresh-capable, and `/api/auth/refresh` is faked in every case that induces a 401. It had been wrong since round 3 and survived two reviews. |
| senior | major | **U5 — `/api/ticket` is outside the guard's scope.** It is a same-origin write the plan itself fakes in `SCRIPT-09` (`utils/fetchData.ts:80` lists it under `LOCAL_AUTEHD_ROUTES`), and it matches neither `/api/proxy` nor `/api/auth/**` — so an unfaked ticket mint reaches the real backend unnoticed. | plan step 6 scope vs step 7; C-8 | **Mitigate.** `**/api/ticket` joins the guard's scope. The three same-origin writes left outside it are now listed by name with the reason, so the scope is a decision rather than an omission. |
| performance + senior | major | **U6 — The new spec would keep no artifact at all on a red case.** `trace: "off"` plus the restored `use.video === "on"` means the scripted project's `"retain-on-failure"` no longer enables `recordVideo` on hand-built contexts, and Playwright's failure screenshot only covers fixture-created pages. So a failing scripted case costs a full re-run **plus another real one-time code** to diagnose — while C-6 says "a video is kept". | plan steps 2, 12; `C-6` | **Mitigate.** `recordVideo` is passed explicitly for the scripted hand-built contexts. Trace-off plus the `use.video === "on"` fix would have left a red case with nothing to look at, and a re-run costs another real code. |
| performance | major | **U7 — The wall-clock ceiling is 20 minutes, not 16.** 2 × 180 + 5 × 60 + 3 × 180 = 1200s. That is two-thirds of the 30-minute `globalTimeout` consumed by ten new cases, and it is the number the "does the suite still fit" decision rests on. | plan Wall-clock | **Mitigate — and corrected twice.** The panel said 20 minutes against my 16; recomputing from the actual per-case values gives **22.5** (5 × 180s + 5 × 90s). The usable budget is ~27 minutes, since `globalTimeout` also covers the 3-minute server start. |
| performance | major | **U8 — 60s is too tight, and the failure would not name the step.** Each faked case does two real SSR navigations, and the inherited ceilings are `navigationTimeout: 45_000`, `actionTimeout: 20_000`, `expect: 15_000` — so one cold staging route consumes the case and the failure reads "Test timeout of 60000ms exceeded" rather than naming the step, which NFR-1 and `AC-13` forbid. | plan step 12; `playwright.config.ts:56,91-92` | **Mitigate.** 90s, not 60s, on the spec file. One cold navigation alone can take 45s, and a case killed by its own timeout reports "Test timeout exceeded" instead of naming the step — which NFR-1 and `AC-13` forbid. |
| senior | major | **U9 — `serviceWorkers: "block"` is project-level**, so it changes the runtime of `SCRIPT-01..05` too. The Integration surface says those five are touched only by `fallback()` and the recorder. | plan Integration surface vs step 12 | **Mitigate.** `serviceWorkers: "block"` is listed in the Integration surface as a third thing touching `SCRIPT-01..05`, and those five must be confirmed at their current result in the same run that proves the guard. |
| security | minor | **U10 — The refresh claim and the actual mechanism differ.** Only rows 2, 5, 6 fake `/api/auth/refresh`; what prevents a real rotation in the others is the guard's default block. That is a different mechanism and it is not written down. | plan Approach ¶4 vs the table | |
| senior + security | minor | **U11 — The `next-action` match was dropped, and the spec's new wording is factually wrong.** C-8's note says a Server Action is "an action the browser triggers without making its own request" — it **does** make a browser request, just to the page URL rather than `/api/**`. So the limit is a choice, not an impossibility, and should say so. | plan step 6; `spec.md` C-8 note | |
| security | minor | **U12 — Sentry receives the phone number and e-mail, not merely "profile context".** `scrubRequestBody` redacts `id_token`, `otp` and tokens (`utils/fetchData.ts:33-64`) but **not** `phone`, `alternative_phone` or `email`, and the failed save's body carries all three. NFR-2 names phone and e-mail explicitly, so the accepted decision must record precisely what goes. | plan analytics section; NFR-2 | |
| security + senior | minor | **U13 — Media gaps.** `PROF-05` reads the picture back through `NEXT_PUBLIC_BASE_MEDIA_URL`, which `hasMedia()` does not check, so a half-configured environment fails `AC-7` rather than skipping; `PROF-05` also has no `hasMedia()` skip at all while `SCRIPT-09` does. Step 1 must read the **schemes** as well as the hosts — `guard.ts:72-78` hard-stops on a value that is `http:` or scheme-less. | plan steps 1, 11; `AC-15`, NFR-3 | |
| senior | minor | **U14 — `SCRIPT-10`'s composition order is unstated, and the exhausted sequence escapes.** Both helpers register `**/api/proxy`; the core leg lands on the sequence only because the map holds no key that substring-matches it. Once the two responses are consumed, `fallback()` drops to the map and then to the network — a third core write escapes "all three legs are faked" and is caught only by the guard, failing the case with a guard message rather than its own. | plan step 5, table row 5 | |
| senior | minor | **U15 — "Fake all three legs" is not expressible in `mockBackend` as it stands.** It matches `x-proxy-url` by substring, while stories and chat share `/api/v1/users/` and are told apart by the service token and the verb. A chat key of `/api/v1/users/` also fakes every chat **read** on that path. | plan step 7, table rows 2, 5, 6 | |
| senior | minor | **U16 — The lifted `openSignedInSession` would name the wrong case.** The two copies differ precisely in whom they blame (`PROF-01` vs `AUTH-01`), and the scripted openers must name `SCRIPT-06`. Taking only the state path as a parameter loses that. | plan step 2; NFR-1, `AC-13` | |
| senior | minor | **U17 — The guard's verb source can fail open.** For a proxied call the verb comes from `x-proxy-method`; the plan does not say what an absent or unreadable verb does. | plan step 6 | |
| performance | minor | **U18 — Dead wall-clock on the failure path.** `waitForWrite` resolves off the response-fed store, and a route the guard **aborts** produces no response — so a blocked leg burns the full leg timeout inside a 60s case before the end-of-case assertion is reached. The scripted leg timeout needs an explicit small number. | plan steps 6, 8, 12 | |
| performance | minor | **U19 — The worst-case code figure is understated.** `attemptAuth` calls `sendOtpWithRetry` with the **default** `maxAttempts = 5` (`actions/auth.ts:399,523`), so the eight existing sends have a ceiling of 40, not 16-20; "bounded by the case timeout" holds only if the cooldown is long, which nobody has measured. | plan Run cost; NFR-4 | |
| performance | minor | **U20 — The usable budget is ~27 minutes, not 30.** `globalTimeout` also covers `globalSetup`, which starts the server with a 3-minute budget. | plan Wall-clock | |
| performance | minor | **U21 — Step 4's measurement is the most expensive way to get the numbers.** Whole-job-minus-journeys and the browser-cache hit are already readable from any recent nightly's step timings; the workflow comment already quotes a run that way. A fresh manual run holds the concurrency group for 30-45 minutes and spends about 8 real codes. | plan step 4 | |
| all three | info | **U22 — The precedence reasoning is wrong though the outcome is right.** A `page.route` always outranks a `context.route` regardless of registration order, so "the guard is registered first" is not what makes the fakes win — using `context.route` is. The design depends on `fallback()` crossing from a page handler down to a context handler, which is the single behaviour `T1`'s fix rests on and should be proved once in Commit C. | plan Approach ¶3, step 6 | |
| senior | info | **U23 — Step 12 appears twice in the traceability table**; Steps and Rollback are each exact. | plan traceability | |
| security | info | **U24 — Same-origin writes knowingly outside the guard should be listed:** `/api/ticket`, `/api/fcm/settings`, `/api/subscribe`, `/api/seller/comments*`. None is high-harm on the profile screens; listing them makes the scope a decision rather than an omission. | plan step 6 | |
| security | info | **U25 — The C-6 exception is right on credentials, incomplete on phone numbers.** `SCRIPT-01..05` mint no real token, so the reason holds; their retained traces do still carry the test phone typed into the form, and what covers that is the encrypted pack, not the exception. | plan Files to change | |
| senior | info | **U26 — A stale comment.** `PROF-04` handing the session on means `profile.live.spec.ts:75-76` ("removed once the last case that needs it has run") becomes untrue and is not in the plan's file list. | plan step 3 | |
| security | info | **U27 — Session-file lifetime grows but stays contained.** `tests/e2e/.auth/` is gitignored and outside `outputDir`, so a killed run leaves it on the runner only, never in an artifact. | plan step 3 | |
| security | info | **U28 — No protected runtime path is touched**, and `playwright.config.ts` is correctly identified as unprotected. | plan Files to change; C-7 | |

> **Disposition of `U10`..`U28`:** all **accepted** and folded into revision 6,
> except `U22`, `U25`, `U27` and `U28`, which are confirmations. None is dismissed.
> `U11`'s second half — matching a `next-action` POST so a Server Action is named —
> is **declined**: the guard's scope is a decision about where it looks, and the
> spec now says so plainly instead of claiming an impossibility.

## Decision

`APPROVED` — against `plan.md` **revision 6**, written after this round's findings
and after the spike.

- **Rationale.** Two things changed since the findings above were written, and
  both are recorded rather than assumed.

  **First, the mechanism was measured.** The work item was blocked
  (`BLK-RUNTIME-FACTS-01`) and a throwaway spike was run —
  `spike-runtime-facts.md`. It settled offline, in minutes and without spending a
  one-time code, what four review rounds had argued about on paper: the two faking
  helpers **do** compose on one page, and `route.fallback()` **does** cross from a
  page route down to the context guard. Three plan revisions had asserted that
  without anyone running it. The spike also corrected the *reason* for precedence
  (a page route outranks a context route by level, not by registration order) and
  surfaced a trap no review had found — `mockBackend` matches by substring, so a
  map key that is a substring of another silently claims its traffic. That came
  out of a bug in the spike itself.

  **Second, all nine `major` findings are mitigated in revision 6**, each recorded
  in the table above. The two that mattered were policy, not mechanism: this app
  mutates on GET (`U1`), and it POSTs `/api/auth/update-user` on its own success
  path (`U2`) — so a plain read-versus-write rule would have been both unsafe and
  self-defeating. The rule now carries two short named lists.

  **Why approve now rather than review a sixth time.** The panel is advisory and
  cannot block (RP-2); a `major` may be accepted once understood, and these are
  understood. Five rounds have shown the remaining class of finding — *what else
  does the app call* — is not answerable by reading, which is why revision 6 hands
  it to `implement` as a **report-only pass whose output lands in `implement.md`
  as evidence** before the branch cases are trusted. That converts the last
  unknown from a guess in a document into a measured artifact that can be checked.
  Continuing to revise would keep producing findings of that same class
  indefinitely, at a cost the ticket has already paid four times over.

  **What is knowingly accepted, not solved:**
  - The shopper's **phone number and e-mail reach Sentry** on the deliberate
    failure cases (`U12`). NFR-2 names both explicitly, so this is the one place
    the ticket does not meet its own spec — by the owner's decision, with the
    alternative being an edit to a protected runtime path.
  - The new cases' timeout ceiling is **22.5 minutes** against roughly 27 usable,
    and the existing 54 share that budget. The plan relies on step 4's measurement,
    and states in advance that no `globalTimeout` raise is likely to be available.
  - `AC-10` is met for the new cases only; `SCRIPT-01..05` are not retrofitted.

## Approvals

> Single self-approval by the ticket owner (no distinct reviewer, no second approver).

- Approver (owner): developer — comprehension gate passed 5/5 at 100%
  (`comprehension.md`, `stage: review`, `attempt: 5`; rounds 1-4 retired), decision
  recorded after reading the panel findings and the spike evidence.

## ADR reference

- ADR: worth writing during `implement` — **the scripted profile spec runs closed
  while `auth.scripted.spec.ts` runs open**. That split (one mutates a shared
  signed-in account, the other does not) is a deliberate design decision that a
  third scripted spec would need to know about.

## Required Follow-up Actions

None blocking. Carried into `implement` as obligations rather than fixes:

1. **The report-only pass is the first thing `implement` runs** (step 10). Its
   output — the full call set the profile save makes — goes into `implement.md`.
   Any route it names that the policy does not cover is added there, with the
   reason.
2. **Prove the guard with one case whose unfaked write is seen blocked**, naming
   the route. Without that, round 4's `T1` could recur silently.
3. **Confirm `SCRIPT-01..05` at their current result** in the same run — they are
   touched by three things: `fallback()`, the recorder, and the project-level
   `serviceWorkers: "block"`.
4. **Take the wall-clock numbers from a recent nightly's step timings first**
   (step 4); run a fresh `workflow_dispatch` only if Commit B is expected to move
   journey minutes.
5. **Record the measured OTP cooldown** in `README.md` and derive the worst-case
   code count from it, rather than restating a guessed number (`U19`).
