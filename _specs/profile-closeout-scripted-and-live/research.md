---
ticket: profile-closeout-scripted-and-live
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete
owner: ai_agent
updated: 2026-08-24
links:
  clickup:
  github:
---

# Research — profile-closeout-scripted-and-live

> Read-only phase. **No implementation is allowed in this command.**
>
> Nothing outside `_specs/<slug>/` was changed. Every claim below names the file
> and line it came from, read on `develop` at `c35f9c6e`.

## Goal

Write the six profile branches that cannot run against a healthy staging backend
(`tests/e2e/profile.scripted.spec.ts`), and the three live cases Item A named and
did not deliver — the picture and the address — so Journey 2 is closed at every
layer.

## Relevant directories

- `tests/e2e/` — both specs land here. `profile.scripted.spec.ts` is new;
  `profile.live.spec.ts` gains F-1..F-3.
- `tests/e2e/harness/` — `profileWrites.ts` (the fan-out watcher), `session.ts`
  (credential helpers), `guard.ts` (the target check), `env.ts` (identities and
  backend addresses), `redact.ts`.
- `tests/e2e/actions/` — `profile.ts` (25 page actions), `auth.ts`, `mock.ts`.
- `tests/e2e/scenarios/` — named sets of faked answers; new ones go here, not in
  the spec.
- `components/settings/` — `UploadProfilePhoto.tsx` (F-1, B-3),
  `PersonalInfoAddress.tsx` and `PersonalInfoAddressModal.tsx` (F-3).
- `components/setting/profile/` — `PersonalInfoForm.tsx` (B-4's overlay and
  `id_token`), `index.tsx` (F-2's card).
- `services/auth.ts` — `UpdateProfile` (B-1, B-2, B-5), `UpdateProfileImage` and
  `uploadToMediaServer` (B-3).

## Relevant config files

- `playwright.config.ts` — `retries: 0`, `workers: 1`, `testIdAttribute` pointed
  at `data-pw`; the `live` and `scripted` projects and their artifact split.
- `tests/e2e/harness/guard.ts:26-42` — `ALLOWED_HOSTS`, 9 entries.
- `tests/e2e/harness/env.ts:38-51` — `BACKEND_ADDRESS_KEYS`, the list the guard
  actually walks.
- `tests/e2e/harness/env.ts:135-141` — `hasShopperA()` / `hasShopperB()`, the
  skip gates.
- `.env.development` (untracked) — identities and backend addresses.
- `.github/workflows/test-e2e.yml` — push to `develop`/`main` and nightly. Never
  a pull-request gate.

## Possibly affected services

- **core** (`BACKEND_URL`) — `/customer/update-profile`, the market leg. Faked in
  B-1; real in F-1 and F-3.
- **stories** and **chat** — the other two legs of the `UpdateProfile` fan-out.
  B-1 makes one refuse; B-2 removes one's record.
- **media** — `uploadToMediaServer`. B-3 refuses it, F-1 really uses it. **See
  OQ-3: this backend is outside the target guard.**
- **wallet** — not touched. Its leg in `UpdateProfile` is commented out and
  `wallet_done` stays `false`, so the fan-out is three legs. `AUTH-01` is red for
  a wallet fault, and that is a backend finding, not this ticket's.

## Test / validation commands available

Listed, not run — this stage is read-only.

- `pnpm test:run` — the unit suite (Vitest). Gates pull requests.
- `pnpm test:e2e` — preflight, build, then every browser spec.
- `pnpm test:e2e:live` / `pnpm test:e2e:scripted` — one project only.
- `pnpm e2e:preflight` — "is this configured, and is it staging?"
- `pnpm e2e:health` — is staging answering. Run before blaming a test.
- `pnpm e2e:report` — open the last local HTML report.
- `pnpm lint`, `pnpm lint:i18n-parity`, `next typegen` + `tsc --noEmit`.
- Validation profile for this ticket will be `logic-change` (lint, typecheck,
  unit tests) — the browser suite is not a project validation check.

## Findings that change the shape of the work

**F-1. `mockBackend` already covers everything B-2, B-5 and B-6 need.**
`tests/e2e/actions/mock.ts:82-130` installs **two** routes: `**/api/proxy` (matched
by substring against the `x-proxy-url` header) and `**/api/auth/**` (matched
against the pathname). `/api/auth/me` and `/api/auth/refresh` both fall inside the
second. So:

- **B-2** — fake `/api/auth/me` with `chatUser: null`.
- **B-5** — refuse the write on `/api/proxy`, let `/api/auth/refresh` through.
- **B-6** — refuse the write *and* `/api/auth/refresh`.

No harness change. `mockBackendSequence` also exists when one endpoint must answer
differently on successive calls, which B-5 needs (401 then success).

**F-2. `mockBackend` does NOT cover the media upload — B-3 needs a third route.**
`services/auth.ts:943-965` calls the media server **directly**:
`fetch(\`${MEDIA_SERVER_BASE_URL}/gated/upload\`)`. It is a browser `fetch`, so
`page.route()` can see it, but neither of `mockBackend`'s two patterns matches it.
B-3 therefore needs either a new pattern in `mock.ts` or a direct `page.route()`
in the spec. This was not known at intake.

**F-3. B-2's fake must be installed before navigation.** `UpdateProfile` reads
`effectiveUserChat = userChat ?? chatUserFromCookies` (`services/auth.ts:678-680`),
and `userChat` comes from `useAppStore.getState()` (`:602-613`), hydrated at page
load from the same `/api/auth/me`. Faking only at save time leaves the store copy
populated and the leg still runs — the case would silently pass for the wrong
reason.

**F-4. The address screen is fully hooked; the picture screen is nearly so.**
`PersonalInfoAddress.tsx` carries `AddAddres` (`:344`), `Address` (`:184`),
`EditAddress` (`:187`), `DeleteAddress` (`:195`), `Delete-Address-Icon` (`:501`),
`Edit-Addres-Icon` (`:426`), `address-info-header` (`:77`).
`UploadProfilePhoto.tsx` carries `change-photo-menu` (`:246`),
`upload-local-photo` (`:416`), `remove-photo-button` (`:538`). None is in
`selectors.ts` yet. Note `AddAddres` and `Edit-Addres-Icon` are misspelled in the
app — match the app, do not "fix" it here (that is a source change, out of scope).

**F-5. `actions/profile.ts` has nothing for either screen.** Four incidental
mentions only. F-1 and F-3 need new actions, and by `tests/e2e/README.md` they
belong in `actions/`, never inline in a spec.

**F-6. The four session `const`s are still local.** `SIGNED_IN_STATE`,
`forgetSavedSession`, `newLiveContext`, `handOnSession` at
`profile.live.spec.ts:133-223`, not exported. This ticket is the first to need
them, so the lift into `harness/session.ts` is owed. Copying is explicitly not
acceptable — `handOnSession` guards a stale-`storageState` trap that silently
turns a signed-in case into a guest one.

**F-7. Both application defects that were in this ticket's path are already
fixed.** The refused-upload silence and the credential leak into error reports
were fixed on 2026-08-24 (`939a00a5`), each proved red-first in the unit suite.
B-3 now asserts the message **appears**; B-4 carries no security fix. **This
ticket currently carries no known application change.**

## Risks and unknowns

- **The media backend is not covered by the target guard — highest risk here.**
  `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` is set, and its host is **not** in
  `ALLOWED_HOSTS` (`guard.ts:26-42`) and **not** in `BACKEND_ADDRESS_KEYS`
  (`env.ts:38-51`), so preflight never looks at it. F-1 uploads a real picture, so
  the suite would write a file to whatever that address points at, unchecked. This
  is the same class of gap `env.ts:41-47` records for `ELASTICSEARCH_NODE` —
  "preflight reported 7 staging addresses checked while the one address that took
  the suite down was never looked at". See `OQ-3`.
- **B-4 fires one real one-time code per run.** The overlay triggers the send, and
  a send cannot be intercepted (`/api/proxy` blocks `send_otp`; it goes through the
  `"use server"` action). Allow-listed number, shared static code, so no SMS is
  read — but it counts against a real limit alongside the sign-in code.
- **B-1 can be misread as B-5.** A `401` retry also produces two writes to a leg.
  `recordProfileWrites` already separates them by whether the outgoing body carried
  the new value, and judges the settled write; a spec that re-counts writes itself
  will get this wrong.
- **F-1 and F-3 mutate the shared account.** Each must register its undo at the
  moment it creates something, not after the assertions.
- **F-2 will meet the open `NextLink` defect.** `ariaLabel` is declared and never
  rendered, so all 22 call sites produce unlabelled links. `selectors.ts:173-190`
  documents the `href` workaround. Not this ticket's to fix.
- **A green scripted case can be a false pass.** `mockBackend` passes through
  anything it does not name, so a key that matches nothing silently tests the real
  backend. Every scripted case must assert the faked call actually happened —
  the pattern `UploadProfilePhoto.test.tsx` already uses.
- **The suite is red today** for `AUTH-01` (wallet). It stays red; it is a backend
  finding and must not be worked around.

## Open questions

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | Does B-3's fake go in `mock.ts` as a third route pattern, or `page.route()` inline in the spec? | The media upload bypasses both existing patterns (F-2). Putting it in `mock.ts` serves every later media case; inline keeps the harness small. `tests/e2e/README.md` says a faked answer belongs in `scenarios/`, which argues for `mock.ts`. |
| OQ-2 | Do B-1..B-6 share one scripted sign-in, or does each get its own context? | The plan's rule is one login per identity per run. Six cases each signing in would be six real codes against a real limit. Item A's `handOnSession` exists for exactly this and is being lifted anyway (F-6). |
| OQ-3 | Should `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` be added to `BACKEND_ADDRESS_KEYS` and its host to `ALLOWED_HOSTS`, inside this ticket or as its own? | F-1 uploads to it and preflight never checks it. In scope = a small, correct harness change that makes F-1 safe. Out of scope = F-1 ships writing to an unguarded address. `spec` must answer, not defer. |
| OQ-4 | What does F-1 upload, and where does the fixture live? | The unit test uses an inline base64 one-pixel JPEG because `dataURLtoFile` runs `atob()`. A live upload needs a real file that is unmistakably a test artifact, and the case must remove it again. |
| OQ-5 | Does F-3 assert the address's **content** after a reload, or only that it is listed? | `CLAUDE.md` § Testing rule 6 forbids asserting a name is present and stopping. Listing an address that lost its fields is a partial success, which is a failure. |
| OQ-6 | Is B-2 written for the **chat** leg or the **stories** leg? | Only one is needed to prove "a missing record is skipped, not failed". Chat is the leg whose rollback carried the bug fixed in `6f08a4ee`, so it has the most history; stories is the leg that was always correct. Pick one and say why. |
| OQ-7 | Does B-4 assert the `id_token` **value**, or only that the field is present and non-empty? | The token is a credential. `tests/e2e/README.md` rule 4 and `CLAUDE.md` rule 7 forbid a credential reaching any assertion message or kept artifact — and scripted specs **do** keep traces on failure. Presence-and-non-empty is almost certainly the only legal form. |
| OQ-8 | Does the scripted spec need a real staging sign-in at all, or can the whole session be faked? | Scripted specs still need staging up because the code send is real. If a faked `/api/auth/me` plus injected cookies is enough to reach the profile screen, B-1..B-3 could avoid a real sign-in entirely and cost nothing. Unverified. |

## Notes

- No code was changed during research. The only files written are in
  `_specs/profile-closeout-scripted-and-live/`.
- No observability runtime configs were modified. This repository owns none
  (`.claude/project-config.yaml > features.observability: false`).
- No protected runtime path was read for modification. `proxy.ts`,
  `next.config.ts`, `instrumentation*`, `sentry.*.config.ts` and
  `.github/workflows/**` are untouched and out of scope for this ticket.
- The four questions raised at intake were answered there, before this stage, and
  are not repeated as `OQ-n`. `OQ-1`..`OQ-8` are new and all arise from evidence
  gathered here.
