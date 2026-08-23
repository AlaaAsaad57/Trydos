---
ticket: auth-closeout-tests
stage: review
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # round 4 — findings written, gate passed, APPROVED
owner: developer
updated: 2026-08-23
links:
  clickup:
  github:
---

# Review — auth-closeout-tests (round 4)

> Findings first, decision after the gate (RP-4). Rounds 1-3 ended
> `CHANGES_REQUESTED`; their gate records are retired as
> `comprehension-review-1.md` (attempt 1) and `comprehension-review-2.md`
> (attempt 2), so this round is `attempt: 3`.

## Review scope

`spec.md` (AC-1..AC-13, AC-15) and `plan.md`, fourth revision. Test-only: no
application file, no shared helper, no existing spec file touched.

## Validation (Step 1, RV-8)

Passed. PL-1..PL-5, PL-11, PL-12; `OQ-4` answered by id; all 14 criteria have an
owning file.

## Panel Findings

Advisory (RP-2). **No `major` findings from any lens.** This is the first fully
clean round, and the count has fallen every time: seven majors in round 2, two in
round 3, none now.

Every round-3 fix was verified against the code rather than taken on trust:

- **Restated AC-12 is provable.** On a refused upload the image call returns
  `null`, reading the path then throws, so the profile save is never called and
  the log runs with no navigation — all three restated observables are real.
- **`AuthOverlay` is the correct seam.** It is the only module in either graph
  that imports the scaled canvas, so stubbing it keeps the resize listener, the
  debounce timer and the `:root` writes out of all four unit files.
- **AC-15's field list matches all three real callers**, and seeding different
  old values does make each fallback fail — with one exception, below.
- **The credential-poll opacity is real**: values are held privately with their
  serialisers overridden, and the comparison returns two booleans.
- **`buildUser()` is genuinely safe** — all-zero phone, `example.com` e-mail.
- **The integration surface holds**: the new file is picked up by pattern, so no
  protected runtime path is touched; the core-backend exchange does rotate both
  credentials, so AC-4 is not written to fail.

### `minor` findings — three are the same species and matter most

**1. AC-15's image check cannot fail.** The store write **merges** into the
seeded profile, so if `image` were dropped from the mirror the seeded old image
survives and a presence-only assertion still passes. Seeding a different old
value fixed the other seven fields but not this one.
*Fix:* seed a different old image and assert the stored value equals the
transform of what was sent — the transform is already pinned in that file.

**2. AC-12's stub must return a *valid base64* data URL.** The conversion runs
`atob()` on the tail and regex-matches the mime off the head, so a placeholder
string throws into the component's own `catch` and the refused case goes green
with no upload attempted — the exact silent pass round 3 rewrote OQ-4 to close,
recurring one layer deeper.
*Fix:* the stub returns a real `data:image/jpeg;base64,…` payload, **and** the
case asserts the image call happened with a `File` before asserting the three
refused-case outcomes. That makes the stub's correctness self-checking.

**3. The rotation poll must sit between AC-1 and AC-2**, or AC-5's protection is
lost. The plan lists the criteria in numeric order and says only that AC-1 and
AC-2 stay together.
*Fix:* state the order explicitly — spoil → cart answered (AC-1) → rotation poll
(AC-4/AC-5) → identity (AC-2) → no prompt (AC-3).

### `minor` — credential exposure in output

**4. The rethrow must construct a fresh error.** Playwright's reporter prints
`error.stack`, whose first line is the message captured when the error was
*built* — so mutating the message and rethrowing the same object republishes the
text just cleaned. `throw new Error(redact(error))`, no `cause`, no reattached
stack.

**5. `redact()` masks the phone as an exact literal only.** A number shown
reformatted — spaces, no `+`, a local `0`-prefix, split from its country code —
slips the mask. The wrap is worth keeping but is **not** the mechanical guarantee
the plan claims.
*Fix:* throw a fixed message naming the leg and the core backend, append the
redacted original after it, and say in the comment that the mask is exact-match
so the next reader does not treat the wrap as proof.

**6. AC-4's second half has no named mechanism.** "The storefront credential is
still unreadable to page scripts" — the obvious implementations print a live
token at the moment the assertion fails. There is an existing safe precedent:
`auth.live.spec.ts:193-202` finds the cookie in the jar and asserts the
`httpOnly` **boolean**, with the comment "the boolean, never the cookie record".
*Fix:* name that precedent in the plan.

**7. AC-15's failure diff is unredacted** — the unit suite has no redaction at
all, so a red assertion prints the whole seeded payload. Seed every value from
the safe fixtures, and make the token literal obviously fake and **not**
JWT-shaped, so it does not trip secret scanners either.

### `minor` — seams the plan does not name

**8. "Failure logged" has no seam.** The error reporter comes from
`utils/functions` and is only spyable via a module mock — and the existing
`makeFunctionsMock()` already provides one, plus an identity translate.

**9. Two jsdom gaps block AC-12 as written.** `URL.createObjectURL` is not
implemented and is what the file input calls — it is the only way to enable Save
with a stubbed editor — and assigning `window.location.href` is a no-op, so "not
navigated away" needs a seam. The existing location mock covers the second;
**also cover the navigating path in the same file**, so the negative can fail.

### `info`

- The image-upload stub should **resolve `null`**, not reject: the service
  swallows the failure and returns null, so a rejecting stub exercises a path the
  app never takes.
- "Sorting last is what makes it absorb its own risk" is inaccurate — the file
  sorts before two others — but it *is* last among the specs that send a real
  code, which is the property that matters. Reword or leave.
- AC-15's cost is driven by which legs the store carries, not by payload size:
  three seeded replies with all legs, one with the core leg only. A missing field
  fails as a missing field, never as a timeout.
- `spec.md`'s cleanup lost nothing security-relevant — the "no credential in any
  message, output or artifact" requirement and the skip constraint are intact.
- The plan narrows that requirement to *text* output; that is consistent with the
  standing control, but it should cite the encrypted-artifact step as the reason.
- The whole job runs well inside its cap, and the measure-then-drop lever is the
  only one that needs no protected-path edit.

## Risks

Three of the nine minors are the same species this work item keeps producing: a
check that reports "pass" for a case it cannot see. Two of them are in code paths
the plan already rewrote once for that exact reason. None changes the approach,
the files, or any criterion — they are all detail *inside* the agreed shape.

## Assumptions

- The live suite continues not to gate pull requests.

## Decision

**APPROVED.** Comprehension gate passed 4/4 (`comprehension.md`, attempt 3).

**No `major` findings from any lens** — the first fully clean round, after seven
majors in round 2 and two in round 3. The plan satisfies RV-3, and every round-3
fix was verified against the code rather than taken on trust.

The nine `minor`s are approved as **required follow-up actions** below, not
waved through. That is a different judgement from rounds 2 and 3, and the reason
is specific: those rounds were refused because `implement` reads **Files to
change** as its instruction and that list was wrong (round 2), and because a
criterion in `spec.md` could not be proved as written (round 3). Neither is true
now. Every remaining finding is detail *inside* an agreed shape — no criterion,
no file, and no approach changes. Sending the plan back to restate stub contents
and assertion seams would be process for its own sake.

**Three of the nine are silent-pass risks**, and they carry the same weight as a
major at `verify`: a criterion whose check cannot fail has not been met, however
green it is.

## Approvals

Owner: **approved**, with the findings understood — 4/4, including all three
silent-pass risks and the redaction question.

## Major dispositions (RP-2)

None. No lens returned a `major`.

## Follow-up actions — required, and checked at `verify`

**Silent-pass risks. A green check that cannot fail does not satisfy its `AC-n`:**

1. **AC-15 `image`:** seed a *different* old image and assert the stored value
   equals the transform of what was sent. Presence alone cannot fail, because the
   store write merges into the seeded profile.
2. **AC-12 stub:** it returns a real `data:image/jpeg;base64,…` payload, and the
   case asserts the image call happened with a `File` **before** asserting the
   three refused-case outcomes — so the stub's own correctness is checked.
3. **Step order:** spoil → cart answered (AC-1) → rotation poll (AC-4/AC-5) →
   identity (AC-2) → no prompt (AC-3). The poll sits *between* AC-1 and AC-2 or
   AC-5's protection is lost.

**Credential exposure:**

4. Throw a **fresh** error — `new Error(redact(error))` — with no `cause` and no
   reattached stack. Mutating and rethrowing republishes the original message
   through `error.stack`.
5. Throw a fixed message naming the leg and the **core** backend, then append the
   redacted original. Note in the comment that the mask is **exact-match**, so no
   later reader treats the wrap as proof.
6. **AC-4's second half** uses the existing precedent at
   `auth.live.spec.ts:193-202` — find the cookie in the jar and assert the
   `httpOnly` **boolean**. Never pass a cookie record to `expect`.
7. **AC-15's payload** takes every value from the safe fixtures, and the token
   literal is obviously fake and **not** JWT-shaped.

**Seams the plan does not name:**

8. Stub `utils/functions` in the picture file so the error reporter is spyable —
   `makeFunctionsMock()` already provides it plus an identity translate.
9. Stub `URL.createObjectURL` (the only way to enable Save with a stubbed
   editor), and use the existing location mock for "not navigated away" —
   **covering the navigating path in the same file**, so the negative can fail.

**Two `info`s worth applying while there:** the image-upload stub **resolves
`null`** rather than rejecting, because that is what the service actually does;
and the "sorting last" sentence is reworded — the file sorts before two others,
but it *is* last among the specs that send a real code, which is the property
that matters.

## Notes for `implement`

- This is the first stage that cuts a branch: `ticket/auth-closeout-tests` off a
  clean **`develop`** (this repository overrides the plugin's `main` default).
- No application file is touched. If the work turns up a defect, it is recorded
  in `docs/testing/AUTH_CLOSEOUT_PLAN.md > Findings` and raised separately — it
  is **not** fixed here. Five findings are already listed there.
