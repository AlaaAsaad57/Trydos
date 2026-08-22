# Closing the auth journey — implementation plan

Four work items. When they are done, Journey 2 ("sign in and stay signed in") is
closed at every layer, and the money path starts on a session we can trust.

This plan spans both roadmaps on purpose. `UNIT_TEST_ROADMAP.md` closed the auth
**logic**; the browser suite proved the **sign-in**. What is left is the part of
identity a shopper touches after they are in — their profile — and the part they
never see until it breaks — a credential refused mid-action.

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

## Item A — `tests/e2e/profile.live.spec.ts`

**What it proves:** a shopper changes their own details and the change is really
there, on every backend that keeps a copy, after a reload.

`AuthService.UpdateProfile` fans out the same way sign-in does. Sign-in's
fan-out is already proven live; the **write** side is not proven anywhere except
against mocks.

**Read this before writing it.** The wallet leg of `UpdateProfile` is commented
out (`services/auth.ts`, the block above the stories call) and `wallet_done`
stays `false`, so its rollback is inert. The live spec asserts **three** legs —
core, stories, chat — and says in a comment that wallet is deliberately off. A
test asserting four legs would be red for a reason that is not a bug.

Steps, each its own `test.step()` so the report names what failed:

1. Sign in as shopper A (`signedInSession`), open `/settings/profile` — the card
   shows the account's own name and phone, not a guest placeholder.
2. Open `/settings/profile/info` — the form is filled from the account, not
   empty. Assert a field **has the account's value**, never merely that it
   exists.
3. Change the name to a marked value, save.
4. Prove the write reached **each** backend, by name: core, stories, chat. Where
   the app labels its own failures, **quote what the app said** rather than
   inferring from what is missing.
5. Reload. The new name is still there — in the form and in the profile card.
6. `finally`: put the original name back. A crash mid-test must leave an obvious
   marker, not silent drift on the shared account.

Also here, because they need a real session and no failure: the profile card
links to the picture page and the info page; an account with a valid phone shows
**Verified** and not **Verify Now**.

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
- `utils/sessionManager.ts` (70) + `components/SessionChecker.tsx` (26) — runs
  on every page load and every five minutes, and is untested.

Use `tests/mocks/device.ts` and `tests/mocks/location.ts` from phase 11. Assert
against roles and visible text, not class names.

**Out of scope, and not by accident:** addresses, sizes, bank cards and the
wallet screens under `/settings/profile/*`. They are the money path (unit phases
15 and 20), not identity.

---

## Order

**A → B → C → D.** A first because it is the only item that can find a backend
bug, and because B reuses the page helpers A writes. C and D do not depend on
the others and can move earlier if A is blocked by staging.

Each item is one branch off `develop` and one commit set, so any one of them can
be reverted alone.

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

**Not yet exercised, and not claimed.** PROF-02 asserts that no leg was rolled
back, and no run has yet seen that assertion go red — staging accepted all three
legs every time. Item B is what makes a leg fail on purpose and proves the
rollback branch is really watched. Until then, treat that one assertion as
written but unproven.
