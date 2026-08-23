# Closing the auth journey — implementation plan

Six work items. When they are done, Journey 2 ("sign in and stay signed in") is
closed at every layer, and the money path starts on a session we can trust.

This plan spans both roadmaps on purpose. `UNIT_TEST_ROADMAP.md` closed the auth
**logic**; the browser suite proved the **sign-in**. What is left is the part of
identity a shopper touches after they are in — their profile — and the part they
never see until it breaks — a credential refused mid-action.

Each item is one ticket. A ticket may cite this file as its source, so the
sections below say what is already on `develop` as well as what is still owed.

---

## Where this stands

| Item | What it delivers | State |
|---|---|---|
| A | `tests/e2e/profile.live.spec.ts` | **Done** — on `develop` |
| B | `tests/e2e/profile.scripted.spec.ts` | Not started |
| C | `tests/e2e/session-recovery.live.spec.ts` | Not started |
| D | unit `component-tests-profile` | Not started |
| E | unit guards for the two defects the live suite found | Not started |
| F | the profile picture and the address, live | Not started |

E and F were not in the first draft of this plan. E exists because the two app
fixes below are proved **only** by a browser test, and the browser suite never
gates a pull request — so nothing stops either one being broken again. F exists
because Item A's scope note put the picture and the address back into the live
suite, and Item A shipped without them.

---

## What Item A left behind, and what a later ticket can depend on

Items B, C and F should reuse this rather than write it again.

**Specs.** `tests/e2e/profile.live.spec.ts` — PROF-01 the settings screens
belong to the signed-in shopper; PROF-02 a name change reaches core, stories and
chat; PROF-03 gender, e-mail and alternative phone save together; PROF-04 the
size screen. All four green against staging.

**Page actions** — `tests/e2e/actions/profile.ts`:
`gotoSettings`, `gotoPersonalInfo`, `gotoSize`, `readProfileCard`,
`cardShowsAccountName`, `readName`, `nameFieldIs`, `typeName`,
`phoneFieldMatchesAccount`, `attemptSave` (`SaveOutcome`),
`visibleValidationMessage`, `hasGenderSet`, `readGender`, `chooseGender`,
`otherGenderThan`, `readEmail`, `typeEmail`, `readAlternativePhone`,
`typeAlternativePhone`, `alternativePhoneIs`, `readSize`, `typeSize`, `sizeIs`,
`attemptSizeSave`, `visibleSizeValidationMessage`.

**The fan-out watcher** — `tests/e2e/harness/profileWrites.ts`:
`recordProfileWrites`, `PROFILE_LEGS`, and the `ProfileLeg` / `LegWrite` /
`LegOutcome` types. It already tells a `401` retry apart from a rollback by
reading whether the outgoing body carried the new value, and it judges the
**settled** write rather than the first one. Item B needs exactly this.

**Session helpers** — `tests/e2e/harness/session.ts` (`snapshotCredentials`,
`credentialsChangedSince`, `credentialsHeld`, `spoilCredentials`,
`recordAuthCalls`, `recordSignInOutcome`) and `tests/e2e/actions/auth.ts`
(`attemptAuth`, `currentAuthScreen`, `signedInSession`, `whoAmI`,
`whoAmIWhenReady`). Item C needs no new harness at all — every piece exists.

**Selectors** — `selectors.ts` `profile.card` / `verifiedMark` /
`unverifiedMark` / `nameField`. `profile.card` matches the settings-profile
address with an **exact-end** match on purpose, so it does not pick up the
picture or size links. It finds the card by address and not by accessible name,
which is a workaround for the `NextLink` finding below.

**Not shared yet, and it should be.** `SIGNED_IN_STATE`, `forgetSavedSession`,
`newLiveContext` and `handOnSession` are `const`s inside
`profile.live.spec.ts:133–231`, not exports. `handOnSession` is the fix for a
real trap — see the stale-snapshot finding — so the first of B, C or F to need a
saved session should lift all four into `tests/e2e/harness/session.ts` and
repoint Item A at them. Copying them is not acceptable; two copies will drift.

**App fixes already on `develop`.** `cc8eee56` and `4b6090ad` — the profile
mirror. Item E is the guard for both.

---

## The rule that governs every item

**A red test is a question, not a verdict.** On every finding, in this order:

1. **Investigate.** Read the application code and say out loud what it does
   wrong, and where — file and line. A red test on its own proves nothing; it
   may look at the wrong moment or assert something the app never promised.
2. **Confirm it, then stop.** Report the finding and **wait for a decision**
   before touching application code. Until that decision, application code is
   off limits and any fix belongs in the test.
3. **Fix the smallest thing** that removes the fault.
4. **Prove it.** A test that was **red before the fix and green after**. Say
   which test, and that it was seen red. If it passes both before and after, it
   never covered the bug — go back to step 1.

If step 1 says the app is fine, the test was wrong. Fix the test and write down
what it was really doing, so the next reader does not chase the same ghost.

Every assertion carries a message, every step that crosses a backend names that
backend, and a partial success is a failure. See `CLAUDE.md` → Testing.

### A backend fault stays red

Step 1 has three possible answers, not two. The app is at fault, the test is at
fault — or **a backend is at fault**. That third answer is a finding this suite
exists to produce, and the test that found it **stays red**.

Red is the signal. Turning it green removes the only thing telling us the
product is broken for real shoppers right now.

So, when a step fails because a backend answered wrongly, refused, or lost a
write:

- **Do not** skip it, mark it `fixme`, wrap it in a `try`, loosen the assertion,
  retry it, or narrow it to the part that still passes.
- **Do not** change application code to accommodate the backend, unless the
  decision in step 2 was explicitly that the app should handle that answer.
- **Do** make the failure name the backend and quote what it actually said, so
  the red line is a bug report the backend team can act on without re-running
  anything.
- **Do** record the finding and raise it. It stays red until the backend is
  fixed.

**The one thing that is not this.** A test that cannot run at all is not a
backend fault: an unconfigured `TEST_ACCOUNT_PHONE` skips, and staging being
entirely down is what `pnpm e2e:health` is for. "The backend is unreachable" and
"the backend is wrong" are different findings and must not be reported as the
same one. Never widen a skip until it swallows a real failure — a skip may only
cover a missing setting, never a bad answer.

This is also why the browser suite never gates a pull request: a red that means
"staging is broken" must be free to stay red without blocking unrelated work.

---

## Which suite gets which case

One rule, so no case is written twice:

| The case needs… | Suite | File |
|---|---|---|
| a real account and a real backend answering normally | **live** | `*.live.spec.ts` |
| a backend to fail, to answer partially, or an account state we cannot create | **scripted** | `*.scripted.spec.ts` |
| no backend at all — validation, gating, rendering, a hook | **unit** | `tests/**/*.test.tsx` |

Three limits that decide where a case can go. They are not preferences:

- **`page.route()` only sees the browser's own calls.** Anything rendered by
  `serverRequests/HandleAuthedFetch.ts` happened in Node before the HTML
  arrived. A scripted spec can change what happens **after a click**, never what
  the page was rendered with.
- **Sending a code cannot be faked.** `/api/proxy` blocks
  `/auth/phone/send_otp`, so the app sends it through the `"use server"` action
  `serverActions/sendOtp.ts`, which the browser never sees. Scripted auth specs
  let the real send happen and fake the verify.
- **Live specs mutate a shared account.** `workers: 1`, `retries: 0`, and every
  write restores itself.

---

## Item A — `tests/e2e/profile.live.spec.ts` — **done**

**What it proves:** a shopper changes their own details and the change is really
there, on every backend that keeps a copy, after a reload.

`AuthService.UpdateProfile` fans out the same way sign-in does. Sign-in's
fan-out was already proven live; the **write** side was proven nowhere except
against mocks.

The wallet leg of `UpdateProfile` is commented out (`services/auth.ts`, the
block above the stories call) and `wallet_done` stays `false`, so its rollback
is inert. The spec asserts **three** legs — core, stories, chat — and says in a
comment that wallet is deliberately off. A test asserting four legs would be red
for a reason that is not a bug.

Delivered, each step its own `test.step()`:

1. PROF-01 — sign in, open the settings profile screen: the card shows the
   account's own name, marks it **Verified**, and does not offer **Verify Now**.
   The personal-info form is filled from the account, asserted by value and not
   by presence.
2. PROF-02 — change the name to a marked value, save, and prove the write
   reached core, stories and chat by name; reload and read it back; restore the
   original name in a `finally`.
3. PROF-03 — gender, e-mail and alternative phone, the same shape. This is the
   case that found the mirror defect.
4. PROF-04 — the size screen, height and weight. It doubles as the control that
   ruled the test out as the cause of the mirror defect.

**Two things it did not deliver**, both moved to Item F rather than left
implied: the profile picture, and the address. Both were named in the scope note
and neither is written.

**One assertion is written but unproven.** PROF-02 asserts that no leg was
rolled back, and no run has seen it go red — staging accepted all three legs
every time. Item B is what makes a leg fail on purpose.

**Never printed:** the account's phone, its name, any token. Use the existing
`redact()` helper.

## Item B — `tests/e2e/profile.scripted.spec.ts`

**What it proves:** the branches staging will not perform on request. This is
where the honest failures live.

| Case | Why it cannot be live |
|---|---|
| A leg refuses (stories answers 500) → the completed legs are **put back**, and the shopper is told **once** | staging will not fail on request |
| A leg the shopper has no record for is skipped, and skipping is not treated as a failure | needs an account with a missing service record |
| The media upload is refused → **no** profile write follows | staging accepts uploads |
| Saving with a changed number → the change-number overlay appears, and the save that follows carries the `id_token` from `VerifyOtpForUpdatePhone` | needs a second real number and a real code |
| The credential is refused mid-save → the exchange runs and the save completes | timing cannot be arranged live |
| The exchange itself is refused → the log-in-again prompt is armed, with the phone kept | staging will not refuse on request |

The rollback case is the important one and the reason this item exists:
`UpdateProfile` can answer with two of three legs done. There is no error for a
test to notice — only the state each backend was left in.

**This item carries an app fix.** The rollback mirror defect below is real,
confirmed, and deliberately not fixed yet because no test exercises the path. It
is fixed here, under the four-step rule: the rollback case is written first,
seen red, then `services/auth.ts` is changed, then the case is seen green. A fix
landed without a red run does not count.

Reuse `recordProfileWrites` — it already separates a `401` retry from a rollback
and will report the rollback bodies without more work.

## Item C — `tests/e2e/session-recovery.live.spec.ts`

**What it proves:** a **signed-in** shopper whose credential is refused
mid-action is not thrown out.

`session.live.spec.ts` covers this for a guest only. The signed-in case is the
failure mode the roadmap names as "everybody gets logged out mid-action", and it
has no live proof at all.

1. Sign in, act, note the user id.
2. Spoil the stored credential (`spoilCredentials`), then act again.
3. The exchange runs, the action **completes**, and `whoAmI` reports the **same
   user id** — not a new guest, and no bounce to the sign-in screen.
4. The stored pair changed (`credentialsChangedSince`), and the storefront token
   is still `HttpOnly`.

The "the exchange is itself refused" half belongs to item B — staging cannot be
asked to refuse.

No new harness is needed. Every helper this item names already exists.

## Item D — unit `component-tests-profile`

**What it proves:** everything the profile screens decide **without** a backend.
Cheap, deterministic, and it keeps items A and B free of cases that need no
network.

Targets, all currently at zero coverage:

- `components/setting/profile/PersonalInfoForm.tsx` (650) — validation (name
  required and at least 8 characters, phone required and valid, email optional
  but valid when given, gender required); a validation message clears when the
  field is corrected; a guest tapping the form opens the login surface instead
  of saving; a changed phone opens the re-verify overlay **instead of** saving,
  and an unchanged phone saves directly.
- `components/setting/profile/VerifyUser.tsx` (104) — an account with a valid
  phone reads **Verified** and opens nothing; one without reads **Verify Now**;
  the overlay stands down while a global auth surface is up, and does **not**
  pop back when that surface clears.
- `components/settings/UploadProfilePhoto.tsx` (572) — choosing a picture,
  removing one, and what the screen says when the upload is refused.
- `components/setting/profile/index.tsx` (182) — the card for a signed-in
  shopper, for a guest, and for the guest placeholder names the app treats as
  "no picture".

Use `tests/mocks/device.ts` and `tests/mocks/location.ts` from phase 11. Assert
against roles and visible text, not class names.

**Scope change, by the owner's decision.** Sizes and addresses were cut from
this plan as money-path work (unit phases 15 and 20). They are back in, live,
along with gender, e-mail, alternative phone and the profile picture. A phone
**change** stays out of the live suite and moves to Item B, because it needs a
second real number and a real code.

Still out: bank cards and the wallet screens under the settings profile routes.

## Item E — unit guards for the two defects the live suite found

**What it proves:** the two mirror defects in `services/auth.ts` cannot come
back without a pull request going red.

This item is here because of a gap the Item A findings recorded and then
declined to close. `tests/services/auth.profile.test.ts` has **16** tests over
`UpdateProfile`. The strings `gender`, `email` and `alternative_phone` appear in
**none** of them, and its two rollback tests (`auth.profile.test.ts:217–230`)
assert that the rollback **calls** were made — never what was written into the
stored copy afterwards. That is exactly why both defects survived a suite that
looked like it covered the function.

PROF-03 proves the first fix, and Item B will prove the second. Neither runs on
a pull request: the browser suite is deliberately kept out of the gate so a
broken staging cannot block unrelated work. So today both fixes are unguarded by
CI, and a later refactor of `UpdateProfile` would put them back silently.

Two tests, in the existing file, in the existing style:

- **Field parity on the forward mirror.** Every field the request body carried
  reaches the stored copy. Assert the fields by name, and drive it from what was
  sent rather than from a written-down list, so a field added later is covered
  the day it is added. Read `marketUpdate` — the object that dropped `gender`,
  `email` and `alternative_phone`.
- **The rollback mirror writes the OLD value.** After a partial failure the
  stored copy holds what the shopper had before the save, not what they typed.
  Assert the value, not that a write happened — the existing tests already do
  the latter and it is what let this through.

Sequencing: the second test can only be written after Item B has fixed
`services/auth.ts`, because until then it would be red for a defect that is
knowingly open. Write the first test at any time — it should be green from the
day it is written, because `cc8eee56` already fixed what it guards, and that is
correct for a regression guard. The four-step rule is about a test that claims
to prove a fix; this one claims to hold a fix that is already proved.

**Do not assert on a count** of fields or of calls. Assert the fields by name.

## Item F — the profile picture and the address, live

**What it proves:** the two parts of the profile that Item A's scope named and
Item A did not write.

- **The picture.** Choose one, save, reload, and it is the one that was chosen —
  then remove it and reload again, so the case restores what it found. This is
  the live half of `components/settings/UploadProfilePhoto.tsx`; Item D covers
  the same screen with no network, and Item B covers the refused upload.
- **The card links to the picture page.** `selectors.ts` `profile.card` matches
  the info link only, on purpose. This item adds the second link, and is the
  right place to point both back at an accessible name if the `NextLink` finding
  below is ever decided.
- **The address.** `components/settings/PersonalInfoAddress.tsx` and
  `PersonalInfoAddressModal.tsx` — add an address, see it listed, and remove it.

**Decide the boundary before writing the address case.**
`LIVE_TEST_ROADMAP.md` phase 15 (`live-addresses`) owns the customer address
endpoints at the request level. The case here is the shopper's screen, not the
endpoint list. If phase 15 is being written at the same time, one of the two
gives up the ground — do not write the same journey twice in two suites.

---

## Order

**C → D → E → B → F.**

C first: it closes the failure mode the roadmap names as the worst one, and
every helper it needs already exists, so it is the shortest path to a real
answer. D next, because it is broad, has no dependencies, and unblocks nothing —
which makes it safe to run alongside anything. E's first test can go in with D.
B after those two: it is the largest item, it carries an application change, and
E's second test depends on that change. F last — it is additive and blocks
nothing.

The original order was A → B → C → D, and A is done. B is no longer first
because it is now the only item with an app fix in it, and because C and D both
return a result sooner.

**How they are ticketed.** C, D and E run together as one work item,
`auth-closeout-tests`: all three are test-only, they share one outcome — the auth
journey is proved at unit and browser level — and none of them touches
application code, so the whole thing reverts with no runtime risk. B is its own
ticket because it carries the rollback-mirror fix, and E's second guard goes with
it. F is its own ticket because it is additive live surface.

Within that, each item is still its own commit set, so any one of them can be
reverted alone.

## Done means

- Every case above is written, and each was seen **red first** for the right
  reason. Green where the product works; **left red, and reported, where a
  backend is at fault** — a case turned green to finish the item is not done, it
  is hidden.
- Every finding has a line saying what was investigated, what was concluded, and
  — where application code changed — which test proved it.
- No credential, phone number, code or token appears in any assertion message,
  failure diff or kept artifact.
- Live specs leave the shared staging account as they found it.

The one allowed exception to "red first" is Item E's field-parity test, and only
that one: it guards a fix that is already proved by PROF-03, so it is expected
to be green from the moment it is written. Say so in the ticket. Every other
test in this plan owes a red run.

---

## Findings

One line per finding, as **Done means** requires. A finding is recorded whether
it turned out to be the app, the test, or a backend.

### Item A

**App — `NextLink` renders no `aria-label`. Open; awaiting a decision.**
`components/global/NextLink.tsx` declares `ariaLabel` in its props and
destructures it, then never puts it on the `<Link>`; the only attribute it
forwards is `data-pw`. So all **22** call sites that pass `ariaLabel` get an
unlabelled link. `components/setting/profile/index.tsx:56` passes it as
`aria-label`, which is not in the prop type either and is dropped the same way —
and that link wraps no text, so it ends with no accessible name from any source.
Accessibility only: every one of those links still navigates. **No application
code was changed.** `selectors.ts` finds the card by its `href` instead, with a
comment saying it is a workaround and to point it back at the accessible name
once `NextLink` renders one.

**Test — four of my own, all found by the first two runs and all fixed.**

| What was wrong | Why it looked like an app fault |
|---|---|
| `getByLabel` was used for a link | It only finds **input** elements, so it matched nothing — and "no card" is exactly what a signed-out visitor looks like |
| The **first** write to a leg was judged | `fetchData` recovers from a `401` by exchanging the credential and resending, so a leg's first answer is legitimately `401`. It now judges the settled write and reports the retry count as context |
| Two writes to a leg was read as a rollback | A `401` retry produces two writes as well. It now tells them apart by whether the outgoing body carried the new name |
| `success` was read out of the response body | No backend sends it — `utils/fetchData.ts` (~line 650) stamps it on client-side from the HTTP status. Body reading is gone entirely, which also removes a body carrying the account's name, phone and e-mail from reach of a public log |

**App — a profile save did not mirror gender, e-mail or alternative phone
into the app's own copy. FIXED, and proved by PROF-03.**
`services/auth.ts` sends every changed field to all three backends, and each
accepts it — PROF-03 proves that much. It then writes back only five fields:

```js
const marketUpdate = { weight, tall, name, phone, image };
```

`gender`, `email` and `alternative_phone` are missing, so the stored profile
keeps the old values, and every settings screen renders from that copy. A
shopper changes their gender, comes back, and is shown the old one — the change
saved, and the app says it did not. **PROF-04 is the control:** it changes
`tall` and `weight`, which *are* mirrored, and its identical reload check
passes. Same code path, same fan-out, different outcome — which is what rules
out the test.

Fixed on the owner's decision by adding the three fields to `marketUpdate`.
**PROF-03 was seen red before the fix and green after** — the whole file is
4/4 green now, and the 1432 unit tests still pass. Nothing else reads those
three fields off the stored profile: `gender`, `email` and `alternative_phone`
are read only by `PersonalInfoForm`, and it already tolerates both shapes the
backend uses for gender (`user?.gender?.value || user?.gender`).

**App — the rollback path writes the NEW value after reverting to the old one.
Open; NOT fixed, and deliberately so.** In the same function, both rollback
mirrors do the inverse of the bug above:

```js
const revertMarket = { name: userObj?.name ?? userProfile?.name, ... };  // NEW name
const revertChat   = { name: userObj?.name ?? userProfile?.name, ... };  // NEW name
```

The request body sent to each backend is the **old** profile, but the stored
copy is written with `userObj` — the value that was just rolled back. So after a
partial failure the app would show the change it had just undone. Left alone on
purpose: no test exercises the rollback path yet, and a fix has to be proved by
a test that was red first. **Item B is the ticket that exercises it**, and is
where this gets fixed. **Item E is where it stays fixed.**

**Test coverage gap — now Item E, no longer just a note.**
`tests/services/auth.profile.test.ts` has 16 tests over `UpdateProfile` and
**none** of them caught the mirror bug — they assert that the shared state and
each service copy are written, not which fields land in them. The live spec
caught it because it read the value back off the screen after a reload. This was
first recorded as "a cheaper guard, not added here, because PROF-03 already
proves the fix and the smallest change is the target". That reasoning covers
*proving* the fix and not *keeping* it: PROF-03 lives in the browser suite,
which never gates a pull request, so today nothing red-flags a refactor that
drops those three fields again. It is now **Item E**.

**Test — the saved session was handed on as a stale snapshot.** Every case
opened the same `storageState` file. The first case to do authenticated work
made the app exchange a refused credential, so the pair on the backend moved on
while the file still held the old one; the next case opened a session whose
credential had been superseded, the app recovered it as a **guest**, and the
account's own details were simply not there. It reported "this account has no
gender set" — which was true of the guest it had become, and nothing to do with
the account. Proved by running PROF-03 without PROF-02, where the same check
passed. Each case now writes its session back as it is at the end, and only when
it is still the signed-in account. That is `handOnSession`, and it is the reason
the four session `const`s must be lifted and shared rather than copied.

**Two account facts, neither a defect.** The test account carries no e-mail, and
carried no height or weight. The e-mail case now sets one and clears it again —
the same reversible pair as adding and removing a picture. A size **cannot** be
cleared once set, because the form makes both fields required, so PROF-04 leaves
what it creates and records that in a run annotation rather than refusing to
run. The drift is one-time; later runs restore what they find.

**Not yet exercised, and not claimed.** PROF-02 asserts that no leg was rolled
back, and no run has yet seen that assertion go red — staging accepted all three
legs every time. Item B is what makes a leg fail on purpose and proves the
rollback branch is really watched. Until then, treat that one assertion as
written but unproven.
