---
ticket: profile-closeout-scripted-and-live
stage: verify
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: developer
updated: 2026-08-25
links:
  clickup:
  github:
---

# Verify — profile-closeout-scripted-and-live

Read-only validation of the implementation against `spec.md`. No implementation
file was edited by this stage, and no commit exists.

## Validation profile — `logic-change`

| Check | Result |
|---|---|
| `tsc --noEmit` | **0 errors** |
| `pnpm lint` | **0 errors** (62 warnings, all pre-existing, none in changed files) |
| `pnpm test:run` | **1512 passed** |
| `pnpm e2e:preflight` | **passes, 12 staging addresses** (was 10) |

None of these runs a browser. The browser evidence is below.

## Browser evidence

**Scripted — `pnpm test:e2e:scripted`: 11 passed, 0 failed, exit 0.**
`SCRIPT-01..05` untouched and green (the running proof that the
`route.fallback()` change is safe for them), `SCRIPT-07..12` all pass.

**Live — `pnpm test:e2e:live`: `PROF-05`, `PROF-06`, `PROF-07` all pass**, with
`PROF-01..04` still green.

**Two red cases, both in `auth.live.spec.ts`, neither caused by this change:**

- `AUTH-01` — the wallet backend. Known, pre-existing; the plan states it stays
  red and that turning it green is not a success here.
- `AUTH-03` — intermittent, and pre-existing. `auth.live.spec.ts` never hands its
  session on: `AUTH-01` saves one snapshot and `AUTH-02`/`AUTH-03` open that same
  ageing copy. `AUTH-02` opens the cart, which can make the app exchange the
  credential and rotate the pair server-side. That is precisely the failure
  `handOnSession` exists to prevent and which `profile.live.spec.ts` documents at
  length; that file never adopted it, before or after this change. Not fixed
  here — it is a sibling fault outside this plan, and this repository requires a
  bug to be confirmed by its own test before it is fixed. The remedy is now one
  line, since `handOnSession` is exported from `harness/liveSession.ts`.

## Acceptance criteria

| AC | Verdict | Evidence |
|---|---|---|
| AC-1 | **Met** | `SCRIPT-07`: all three legs asked, the save not reported successful, and the **peak** number of messages on screen is 1 — told once, not once per backend. |
| AC-2 | **Met** | `SCRIPT-08`: `/api/auth/me` answered with the account's own values, only `chatUser` nulled. The core write is recorded, so chat's turn has provably passed, and chat was never asked. The save still completes. |
| AC-3 | **Met** | `SCRIPT-09`: the ticket succeeds and only the upload refuses, the shopper is shown the failure, and no leg is written. |
| AC-4 | **Met** | `SCRIPT-12`: no leg written before confirmation; the confirmation screen is reached and the code submitted; the save that follows carries the confirmation, proved by a boolean — the value is never read into a message. |
| AC-5 | **Met** | `SCRIPT-10`: the core leg answers 401 then 200, the save completes, and the settled write is shown to carry the **new** value — a retry, not a rollback. |
| AC-6 | **Partly met — stated, not glossed** | `SCRIPT-11` proves the app arms the session-expired prompt after a failed renewal, which is `FR-6`'s "asks the shopper to sign in again". **What is not proved is that the number they were working with is kept.** `SessionExpiredWidget` carries no marker for the preserved phone, and asserting it would need a change to application markup, which this ticket forbids. Recorded rather than claimed. |
| AC-7 | **Met** | `PROF-05`: a chosen picture survives a full reload, removing it takes it off after another reload, and the account is left as found. |
| AC-8 | **Met** | `PROF-06`: the card's link reaches the picture screen. Found by address, not accessible name — the links carry none, which is out of scope and stated. |
| AC-9 | **Met** | `PROF-07`: an address is created through the region picker, listed **with the detail that was entered**, and removed again. |
| AC-10 | **Met, narrowed and stated** | Every new scripted case asserts its own fake was used. `SCRIPT-01..05` are **not** retrofitted; the narrowing is recorded in `plan.md` and here. |
| AC-11 | **Met** | Five helpers live once in `harness/liveSession.ts`; both live specs import them. No second copy remains — the `auth.live.spec.ts` duplicates were removed in the same change. |
| AC-12 | **Met** | Both media keys are in `BACKEND_ADDRESS_KEYS` with `https:` required; preflight reports **12** addresses (was 10) and stops the run before the build on an unknown host. |
| AC-13 | **Met** | Every new assertion carries a message naming the step, and per-backend messages name the backend. `SCRIPT-12` is split into `test.step()`s. |
| AC-14 | **Met** | `E2E_SCENARIOS.md` at **63** cases with the new section and a corrected `SCRIPT-` summary row; `README.md` records **15** sends per full run, why six sign-ins, and the alternation. |
| AC-15 | **Met** | `hasShopperA()` gates the scripted spec, `hasShopperB()` the second identity, `hasMedia()` the picture cases. A wrong answer from a backend does **not** skip. |

**Fourteen met; one (`AC-6`) partly met and stated.**

## Non-functional

- **NFR-1** — met; failures name the step and the backend.
- **NFR-2** — met **except by one accepted decision**: analytics and error
  reporting are allowed to escape, so the deliberate 500s and 401s reach Sentry
  carrying the shopper's phone and e-mail. The owner decided this; the
  alternative was editing a protected runtime path. Recorded in `plan.md` and
  `README.md`.
- **NFR-3** — met; unconfigured settings skip.
- **NFR-4** — met; 15 sends recorded with the reason and the cooldown caveat.

## Scope

Every file changed is in `plan.md > Files to change`. **No application file was
changed**, and no protected runtime path was touched — `proxy.ts`,
`next.config.ts`, `instrumentation*`, `sentry.*` and `.github/workflows/**` are
all untouched.

## Follow-ups this work produced

1. **`AUTH-03`'s session staleness** — a one-line `handOnSession` in
   `auth.live.spec.ts`, needing its own confirming test.
2. **`AC-6`'s preserved number** — needs a marker on `SessionExpiredWidget`.
3. **`currentAuthScreen` cannot identify a locked method screen** — a gap in a
   shared helper; widening it affects other specs.
4. **Three dead `data-pw` props in `AddAddressForm.tsx`** —
   `add-address-buttons` and `select-region` are passed to components that never
   spread them, so they exist in source and never in the DOM.
5. **Item E's second unit guard** — still open; `AUTH_CLOSEOUT_PLAN.md` records
   Item B as "browser half delivered".
