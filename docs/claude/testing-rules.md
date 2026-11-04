# Testing — MANDATORY: a failure must say exactly what broke

Moved out of `CLAUDE.md`. Read this before you write or change any test, or fix
any bug. The short version stays in `CLAUDE.md`.

**A test exists to tell you *what* is broken, not *that* something is broken.**
Read the failure alone, with no code open and no re-run: it must name the step
that failed, and — when that step called a backend — which backend. If it does
not, the test is not finished, however green it is today.

This is the single most valuable property a test here can have, because these
flows are long. Placing an order is a dozen steps across several backends. So
is signing in. `expect(result).toBeTruthy()` in the middle of one of those turns
a five-second answer into an afternoon of bisecting by hand.

## The rules

1. **Every assertion carries a message.** Both suites support it — Vitest and
   Playwright take a message as the second argument to `expect`. The message
   says what was supposed to be true, in plain words, from the point of view of
   somebody who did not write the test.

   ```ts
   ✗ expect(order).toBeTruthy()
   ✗ expect(res.status).toBe(200)
   ✓ expect(order.id, "placing the order returned no order id").toBeTruthy()
   ✓ expect(res.status, `the payment backend refused the charge (${res.status})`).toBe(200)
   ```

2. **One assertion per step, and one step per thing that can fail
   independently.** If a flow has ten steps that can each break on their own, it
   needs ten checks. Never collapse them into one assertion at the end — that
   assertion can only ever say "the flow did not work".

3. **Name the backend whenever a step crosses one.** This app talks to several:
   the storefront core, the gateway, chat, stories, comments, wallet, media,
   search. "Sign-in failed" is not a finding; "the wallet sign-in did not land"
   is. Where the app already labels the failure itself — the sign-in route
   collects per-service failures under an `endpoint` label (`CHAT`, `STORIES`,
   `COMMENTS`, `WALLET`) and returns them as `is_failed` — **quote what the app
   said** rather than inferring it from what is missing, so the test, the log
   and Sentry all name the same thing.

4. **A partial success is a failure.** Several of these flows answer `200` with
   part of the work done, on purpose — a dead wallet must not stop a shopper
   browsing. That is correct product behaviour and it is exactly why the test
   has to look at each part: there is no error for it to notice.

5. **Never assert on a count.** `toHaveLength(13)` tells you a number changed,
   not which one is missing, and it breaks the day a step is added. Assert the
   thing you mean, by name.

6. **Check the content, not only that something is there.** A cookie, a record
   or a response that exists but carries no usable payload is a failure. Never
   assert a name is present and stop.

7. **Put the actual value in the message when it helps.** A status code, an id,
   the backend's own error string. Never put a token, a one-time code, a phone
   number or any other credential in it — those must not reach output or any
   kept artifact.

8. **Long browser flows use `test.step()`** so the report names the step that
   failed rather than a line number. `tests/e2e/profile.live.spec.ts` is the
   model — including the nested per-backend form, `` await test.step(`the
   ${leg} backend took the change`, …) ``, which is what makes a fan-out failure
   name the backend that refused. Copy that file.

9. **Adding a step or a backend to a flow means adding its own check** in the
   same change.

## A red test is not a bug report — confirm, fix, then prove

**MANDATORY on every test ticket.** A test going red means *something* is wrong.
It does not tell you *what*, and it does not tell you the app is at fault. Most
red tests are wrong tests. So never change application code because a test asked
you to. Follow these four steps in order, every time:

1. **Confirm it is a real bug.** Read the application code and prove the fault is
   there. A red test on its own is not proof — the test may look at the wrong
   moment, read the wrong value, or assert something the app was never meant to
   do. Say out loud what the app does wrong and where.
2. **Only then may you touch application code.** Before step 1 is done,
   application code is off limits and the fix is in the test. This is the gate:
   confirmation first, code second, never the other way round.
3. **Fix the smallest thing** that removes the fault.
4. **Prove it with a test that failed before the fix and passes after.** If the
   test passes both before and after, it never covered the bug — go back to
   step 1. Say which test, and that you saw it red first.

If step 1 says the app is fine, the test was wrong. Fix the test and record what
it was actually doing, so the next reader does not chase the same ghost.

**A test that cannot prove what it claims is not finished.** Never ship a check
that reports "pass" for a case it cannot see, and never park one as "known
weak" — that is the silent pass this whole section exists to prevent. If the
right signal is hard to find, keep looking, or say plainly that the criterion is
not covered yet. Do not let a green tick stand in for it.

## Every bug is confirmed by a test before it is fixed — no exceptions

**MANDATORY, repository-wide.** The four steps above are written for a test that
went red. They apply to a bug found **any** other way too: while reading code,
from a Sentry report, from a shopper's complaint, from a review comment, or
because you noticed it in passing. How the bug was found changes nothing.

So, for every fix to application code:

1. **Write a test that fails because of the bug**, before the fix. The test must
   go red for the bug itself — not for a missing mock, a wrong URL or a typo in
   the test. Run it and **see it red**.
2. **Then fix the smallest thing** that removes the fault.
3. **Run the same test again and see it green.** If it was green before the fix,
   it never covered the bug: it is the wrong test, and the bug is not confirmed.
   Go back to step 1.
4. **Say all three out loud** in the commit, the ticket and the reply: which
   test, that it was seen red, and that it is green after. "It should be fixed"
   is not a result.

**Keep the test.** The red-first run confirms the bug; the test that stays in
the suite is what stops it coming back. If the confirming test is throwaway —
a script, a one-off `console.log`, a temporary route — then the fix is not
proved yet, and a real test in `tests/` still has to be written and has to fail
against the old code. Prove that by reverting the fix, running it, and putting
the fix back.

**Which suite.** Put the test where the bug lives: the unit suite (`tests/`) for
anything that can be reproduced without a backend, and the browser suite
(`tests/e2e/`) only when it genuinely cannot. Prefer the unit suite — it runs in about
five minutes with no backend, so a fix proved there is checked on every run;
the browser suite needs staging up, so a fix proved only there goes unchecked
whenever staging is down.

**The two allowed exceptions, both narrow.**

- **A backend is at fault.** Then there is nothing in this repository to fix.
  The test stays red and names the backend — see the rule above.
- **A regression guard for a fix that is already proved.** Adding a cheaper test
  for a bug some other test already proved is welcome, and it is expected to be
  green from the moment it is written. Say which test did the proving.

Anything else — a fix with no test, a test written after the fix and never seen
red, a "too hard to reproduce" — is an unconfirmed fix. Report it as one.

## Scope

Applies to **both** suites — unit (`tests/`, Vitest) and browser (`tests/e2e/`,
Playwright) — and to every multi-step flow: order placing, checkout and payment,
sign-in and sign-out, cart changes, media upload, seller dashboard actions.

It binds **every test you write or change from now on**. Existing tests are
brought up to it as they are touched — there is no sweep, and a bare assertion
you happen to read is not a ticket. Most unit-suite assertions still carry no
message; that is the gap this rule closes over time.

One allowance, not a loophole: in a small unit test whose **name already says
precisely what failed**, the name is the message and a second one adds nothing.
The requirement is that *the failure identifies the step* — not that the words
sit in any particular place. The moment a test covers more than one step or more
than one backend, that allowance is gone.

For the browser suite, also read `docs/claude/e2e-known-causes.md`.
