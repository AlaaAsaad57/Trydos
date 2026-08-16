---
ticket: unit-tests-auth-service
stage: verify           # the gate that last updated this record
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | complete
owner: developer        # the ticket owner (self-review)
updated: 2026-08-16
result: passed          # quiz outcome — were ALL answers correct? (CG-4)
score: 4/4              # correct / total — latest run (the verify gate)
decision: PASSED
missed:
links:
  clickup:
  github:
---

# Comprehension — unit-tests-auth-service

> Single-owner gate control (ADR-009 / ADR-012 / CG-1..CG-7). At each gate the
> owner answers multiple-choice questions (**≥4 options each**) generated **from
> the artifact under review**. One section per gate — never overwrite another
> gate's section. The gate records its decision **only if 100% of answers are
> correct** (CG-4). Each question's options are listed **alphabetically** — the
> correct answer's position carries no signal.
>
> **English only.** Questions, options and answers are written in English,
> whatever language the conversation used (CLAUDE.md).

## Review gate

> Questions derived from `plan.md` + `spec.md` (CG-2), incl. `plan.md >
> Integration surface` and the Step 1a panel findings. Answered before recording
> the `/review` decision. The gate ran twice — once on the first plan, once on
> the revision. Both runs passed; both recorded `CHANGES_REQUESTED`.

### First run — 2026-08-16, on the first plan (8/8, `CHANGES_REQUESTED`)

Floor of 3 (CG-1) + 1 mandatory integration question (CG-5) + 1 per `major`
panel finding (CG-6, five majors) = 8.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | How does the suite observe the state the sign-in service writes? | `plan.md > Approach` bullet 1 (OQ-1); AC-38 | approach | (a) By asserting each store action stand-in was called with the right arguments; **(b) By building a store from the real auth reducer plus stubs for three members from other slices, then reading the state** ✔; (c) By importing the combined store and seeding it before each test; (d) By rendering a component that reads the store and checking the screen | (b) | Yes |
| 2 | What order does the plan set for the two halves of the work, and why? | `plan.md > Approach` bullet 4 (OQ-8); C-9 | sequencing | (a) Removals and tests in one commit, so the branch reverts as a single unit; **(b) Removals first in their own commit, because nothing scheduled for removal may be given a test** ✔; (c) Tests first, then removals, so the tests prove the removals were safe; (d) Tests first, then removals, so the suite runtime is measured before the deletions | (b) | Yes |
| 3 | What is the concrete failure the removal risks, and what catches it? | `plan.md > Integration surface` | **integration (CG-5)** | (a) A missed call site of the changed verify signature would break sign-in silently; only a manual test would catch it; **(b) A missed caller of the two deleted service-login routines would break chat or stories sign-in silently; repo-wide search, the type check and the production build are the three layers against it** ✔; (c) Deleting the state type would change how the combined store behaves at runtime; the unit tests catch it; (d) Removing the two properties from the every-page-load session check would log shoppers out; the build catches it | (b) | Yes |
| 4 | What happens if fake timers stay a per-test choice instead of a file-level rule for the profile tests? | `panel:performance` (major); `plan.md > Steps` 8 | performance | **(a) About six success-path tests cost roughly nine seconds of wall clock, doubled by the repeat run** ✔; (b) Every test in the suite hangs until the five-second default timeout; (c) The profile rollback assertions become order-dependent; (d) The wait is skipped entirely, so the rollback path is never exercised | (a) | Yes |
| 5 | What did the performance lens ask for regarding the module-registry reset and the shared stand-in module? | `panel:performance` (major); `plan.md > Files to change` | performance | (a) Drop the shared stand-in module and register the stand-ins per file; **(b) Have the stand-in module cover the full list the existing suite registers, and reset modules only in the files that need singleton isolation** ✔; (c) Move the stand-ins into the shared setup file so every test file gets them; (d) Reset the module registry once per file rather than once per test, in all four files | (b) | Yes |
| 6 | What does the security lens say the removal does NOT fix? | `panel:security` (major); FR-13 / C-8 | security | **(a) Removing the write does not purge values already in returning shoppers' browser storage, so a device that ever verified a phone keeps a script-readable token** ✔; (b) The one-time token is still sent to the chat and stories backends by the server route; (c) The removal leaves the token in an HttpOnly cookie that is never cleared on logout; (d) The two deleted routines were the only place the token was ever cleared | (a) | Yes |
| 7 | Two lenses found the same gap in the removal list. What is it? | `panel:security` + `panel:senior` (major); `plan.md > Files to change`; C-8 | integration | **(a) The sign-in path still writes the unread token field into the store, so the chain is not removed whole** ✔; (b) The state slice still declares the token field in its initial state; (c) The two deleted routines are still exported from their modules' public interface; (d) The verify-changed-phone path still returns the one-time token to its caller | (a) | Yes |
| 8 | Why did the senior lens call the planned new fetch stand-in a problem? | `panel:senior` (major); `plan.md > Approach` bullet 2; C-2 | reuse | **(a) An existing shared stand-in already records every call, queues replies and raises when the queue runs out, so the suite would end with two stand-ins for one boundary** ✔; (b) It cannot record request headers, which two acceptance criteria need; (c) It would have to live inside the protected path to intercept the calls; (d) The fake network already answers those paths, so no stand-in is needed at all | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Second run — 2026-08-16, on the revised plan (6/6, `CHANGES_REQUESTED`)

New questions, same axes (CG-7). Floor of 3 + one per surviving `major` panel
finding (three) = 6.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Which stand-in does the outbound global-fetch boundary use, and why that one? | `plan.md > Approach` bullet 2 (OQ-2); AC-37 | reuse | (a) A new recording stub written for this ticket, because no existing helper records request headers; **(b) The existing shared stand-in from Phase 2, because it already records every call and raises when its queue runs out** ✔; (c) The fake network's handlers, because they match on path and survive a module reset; (d) The shared request-helper stand-in, because every outbound call in the service goes through it | (b) | Yes |
| 2 | What did the plan say happens to values already stored on returning shoppers' devices, and what did the panel find wrong with it? | `plan.md > Files to change` → "Not removed, and why"; `panel:security`, `panel:senior` | risk | (a) A one-time removeItem runs on app boot; the panel found it adds behaviour to a hot path; (b) Nothing clears them; the panel found the token is still readable by the two deleted routines; **(c) The existing version-driven clear handles it; the panel found that clear also signs the shopper out and detaches push, so it is far heavier than the residue it removes** ✔; (d) The logout cleanup list handles it; the panel found that list never runs for guests | (c) | Yes |
| 3 | Which dependency reaches outside the branch entirely, and why does that matter for rollback? | `plan.md > Integration surface`; `plan.md > Rollback` | **integration (CG-5)** | (a) The four sign-in screens, because their argument change ships in a different deployment from the service; **(b) The release process, because the residue mitigation only fires when an environment variable changes in the hosting platform — and reverting the merge cannot undo what it already did** ✔; (c) The server login route, because it must be redeployed in lockstep with the deleted client routines; (d) The shared test runner config, because every existing suite resolves through it | (b) | Yes |
| 4 | Why can the session tests not work as the plan describes them? | `panel:performance` + `panel:senior` (major); `plan.md > Timer and teardown policy`; AC-22 | correctness | **(a) The existing stand-in has an ordered queue with only a real timeout delay — no reply a test can hold and release — and the plan forbids extending it** ✔; (b) The single-flight state is cleared between tests by the module reset, so concurrent callers never meet; (c) The stand-in cannot record request bodies, so the per-service key cannot be asserted; (d) Two concurrent calls exhaust the queue, and the stand-in raises before the second one resolves | (a) | Yes |
| 5 | What does deleting the browser-storage write do to the changed-phone path when the reply carries no data? | `panel:security` (major); `plan.md > Steps` 3; AC-12, NFR-2 | security | **(a) It removes the line that throws first, so the phone is marked verified in the store and the profile cookie before the failure surfaces** ✔; (b) It returns undefined instead of throwing, so the caller saves a profile with no token; (c) Nothing changes; the surrounding try/catch already rejects a reply with no data; (d) The secure cookie mirror is skipped, so the store and the cookie disagree | (a) | Yes |
| 6 | What is the agreed fix for the residue, now that the version-driven clear turns out to sign shoppers out? | `panel:security` + `panel:senior` (major); `plan.md > Files to change` → "Not removed, and why" | risk | (a) Add a one-time removeItem on app boot and drop the version dependency; **(b) Drop the release-bump requirement and state in writing that the residue is acceptable — single-use, nothing reads it, cleared whenever a routine version bump next happens** ✔; (c) Keep the version-bump requirement but document the side effects so nobody is surprised; (d) Move the cleanup into the logout cookie list so it runs on every sign-out | (b) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Third run — 2026-08-16, on the second revision (5/5, `CHANGES_REQUESTED`)

New questions, same axes (CG-7). Floor of 3 + one per surviving `major` panel
finding (two) = 5.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Why is the changed-phone path reordered rather than simply having its storage write deleted? | `plan.md > Approach` decision 5; Steps 3; AC-12, NFR-2 | correctness | (a) Because reading the token last lets the profile save receive it even when the reply is incomplete; **(b) Because the deleted line is what throws first on a data-less reply, so without the reorder the phone would be marked verified before the failure surfaces** ✔; (c) Because the store and the profile cookie must be written in the opposite order from today; (d) Because the verified writes must happen before the return so the caller sees fresh state | (b) | Yes |
| 2 | What does the plan now say about values already stored on shoppers' devices? | `plan.md > Files to change` → "Not removed, and why" | risk | (a) A one-time cleanup runs where the old write was, kept for one release; **(b) Nothing is done, and the ticket takes no dependency on the release process; what the version check really does is recorded only so nobody triggers it as a cleanup** ✔; (c) The release must bump the app version so the version check clears them; (d) The values are added to the logout cookie cleanup list | (b) | Yes |
| 3 | Which ordering rule inside the plan protects a shared behaviour that other flows depend on? | `plan.md > Integration surface` (Ordering); Steps 4; AC-18, AC-19, AC-21 | **integration (CG-5)** | (a) The build check runs before the removals, so a stale import is caught before anything is deleted; (b) The four sign-in screens are updated before the service, so no call site is ever out of step; **(c) The reducer's two explanatory comment blocks move onto the state fields before the type carrying them is deleted — they are the only written description of the markers the expiry cycle and the concurrent 401 handlers share** ✔; (d) The tests are written before the removals, so the removals are proved safe by a passing suite | (c) | Yes |
| 4 | What goes wrong in the OTP and profile files now that they no longer reset the module registry per test? | `panel:senior` + `panel:performance` (major); `plan.md` timer table rows 1 and 3; AC-9, AC-32, AC-39 | correctness | **(a) One real-slice store instance lives for the whole file, so the attempt counter and the user records carry over — AC-9 and AC-32 would read a leaked counter and the suite becomes order-dependent** ✔; (b) The service singleton keeps an in-flight expire promise, so the second test in each file waits on the first test's cycle; (c) The stand-in factories are never registered, so the real import graph loads and reaches the network; (d) The store is rebuilt per test but the reducer keeps its own closure state, so merges accumulate | (a) | Yes |
| 5 | Why is `vi.clearAllMocks()` not enough in those two files? | `panel:performance` (major); `plan.md` timer table rows 1 and 3; AC-1..AC-4 | correctness | (a) It does not apply to spies created inside a `vi.mock` factory, only to those created in the test file; **(b) It clears call logs but not queued implementations, so a one-off reply set in one test survives into the next — the shared send-code spy is exactly this case, since the shared teardown only clears it** ✔; (c) It restores the original implementation, which undoes the stand-in entirely; (d) It runs after the shared setup's teardown, so anything the shared teardown registers is cleared too late | (b) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

### Fourth run — 2026-08-16, on the third revision (4/4, `APPROVED`)

New questions, same axes (CG-7). Floor of 3 + one per surviving `major` panel
finding (one) = 4. The `major` was **dismissed** at the gate after Q1 was
answered correctly — which is what CG-6 allows: understand it first, then decide.

| # | Question (from the artifact) | Source (plan §/AC-n/panel:lens) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|---------------------------------|------|---------------------------------|----------------|----------|
| 1 | Why is "import the service after the reset" not enough in the session file? | `panel:senior` + `panel:performance` (major); `plan.md` isolation table row 2; AC-19..AC-22 | correctness | (a) The reset clears the module cache after the imports resolve, so the service is always one generation behind; (b) The reset does not apply to relative module ids, so the sibling services keep their old instances; **(c) The reset re-runs the mock factories, so the store and the spies are new instances too — a top-of-file store handle belongs to a dead generation the service never writes to, and a reply queued on a detached spy never releases** ✔; (d) The service must be imported before the reset so its singletons are registered | (c) | Yes |
| 2 | What does the plan do about the storage write on the changed-phone path, and why? | `plan.md > Approach` decision 5; Steps 3; AC-12, NFR-2 | correctness | (a) Deletes it and accepts that a data-less reply now marks the phone verified, recorded as a regression; (b) Deletes it and adds an explicit check with a new error message before the verified writes; (c) Keeps it until a later ticket can remove the readers safely; **(d) Removes it and reorders so the token is read into a local value before the verified writes — same read, same position, same error — with one stated exception where blocked storage can no longer abort the method** ✔ | (d) | Yes |
| 3 | Which shared file outside the four test files does this ticket edit, and why is it safe? | `plan.md > Integration surface`; Files to change; AC-40 | **integration (CG-5)** | **(a) The shared auth stand-in, because the variable being removed is unread — it is listed in the integration surface and covered by the pinned refresh suite still passing** ✔; (b) The shared network stand-in, because a per-path queue is added backwards-compatibly; (c) The shared setup file, because the new files need their stand-ins registered globally; (d) The shared store stand-in, because the auth actions it lacks are added for these tests | (a) | Yes |
| 4 | What was wrong with the plan's reason for resetting spies one by one instead of using a blanket reset? | `panel:senior` + `panel:performance`; `plan.md` "Three points behind the table", bullet 2 | correctness | (a) A blanket reset does not reach spies created inside a mock factory, so it would have missed the ones that matter; **(b) On this runner a blanket reset restores the implementation each stand-in was built with, and the navigation hooks are closures rather than spies — so it would have restored the defaults, not stripped them** ✔; (c) The enumeration is unnecessary because the shared teardown already resets every spy between tests; (d) The stand-ins are frozen objects, so neither reset form can change them | (b) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a

## Verify gate

> Questions derived from `implement.md` + `spec.md` (CG-2), incl. whether the
> plan's declared Integration surface held. Answered before recording PASSED. No
> panel here (ADR-010) — CG-6 does not apply. Floor of 3 + the mandatory
> integration question, asked as 4.

**Result: passed — 4/4, 2026-08-16.**

| # | Question (from the artifact) | Source (implement.md/AC-n/plan §) | Axis | Options (correct + distractors) | Owner's answer | Correct? |
|---|------------------------------|-----------------------------------|------|---------------------------------|----------------|----------|
| 1 | What did `/implement` do about the plan's two-commit split, and why? | `implement.md > Deviations` 1; `plan.md > Rollback` | rollback | (a) It created both commits, so each can be reverted independently; **(b) It created neither commit — /implement may not commit at all; /publish-pr owns the single publishable commit, so the split is its to arrange** ✔; (c) It created one commit containing everything, because the type check couples them; (d) It pushed the removal commit and left the tests uncommitted | (b) | Yes |
| 2 | Did the plan's declared Integration surface hold, and what did the removals touch beyond the named files? | `implement.md > Changes prepared` + `Deviations` 2; `plan.md > Integration surface` | **integration (CG-5)** | **(a) It held: nothing outside the ten named files changed; the only additions were imports left unused inside two files already on the list** ✔; (b) It missed the shared network stand-in, which had to gain a per-path queue; (c) It missed the shared setup file, which needed a new global registration; (d) It missed the store index, which had to be edited to expose the auth slice | (a) | Yes |
| 3 | What does the AC-12 test about a reply carrying no data actually protect? | AC-12; `implement.md > Findings` F-2 | correctness | **(a) That a data-less reply still fails AND leaves the phone unverified — it would fail if someone deleted the storage write without reordering** ✔; (b) That the error message shown to the shopper is translated before it reaches the screen; (c) That the one-time token is still written to browser storage for the profile save; (d) That the profile save receives the token even when the reply is incomplete | (a) | Yes |
| 4 | Which required follow-up from the review is NOT done, and why? | `implement.md > Outstanding`; `review.md` follow-up 11 | completeness | **(a) Filing the encoding fix as a tracked ticket — it is an outward-facing action on a system outside the repo and no id was given** ✔; (b) Recording the per-file runtime baseline — there is no CI to measure it; (c) The order-independence run — vitest cannot shuffle tests within a file; (d) The same-generation loader in the session file — the shared stand-in made it unnecessary | (a) | Yes |

- Score (optional, only if `comprehension_gates.ai_graded`): n/a
