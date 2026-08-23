---
ticket: unit-tests-auth-service
stage: research
mode: standard          # single workflow form — no other modes (ADR-009)
status: complete        # not_started | in_progress | blocked | complete
owner: ai_agent
updated: 2026-08-16
links:
  clickup:
  github:
---

# Research — unit-tests-auth-service

> Read-only phase. **No implementation is allowed in this command.**

## Goal

Cover the client auth service and the auth store slice with unit tests — the OTP
send and verify calls, the session refresh and expire cycles, the profile and
name updates, and the state each of them writes — without any real I/O, and
without changing behaviour. Code that nothing uses is **not** tested; it is
listed for removal (see "Dead code").

## Modules under test — what each one actually does

Both files were read in full during this stage.

### 1. `services/auth.ts` (1096) — client, 🔒 protected glob

The module exports `new AuthService()` — a **singleton built at import time** —
plus the `ExpireOutcome` type. Three pieces of state live at module scope, not on
the instance:

- `_expirePromise` — the in-flight expire cycle (one at a time, any caller).
- `_refreshPromises: Map<string, Promise<RefreshResult>>` — one in-flight refresh
  **per service key**. `refreshKeyFor` maps `chat`/`stories` to themselves and
  **everything else to `"market"`**, which is why `market` and
  `market-dashboard` share one exchange.
- `normalizePhone` — declared with `let`, strips `+`, and is **never called**.

`updateSecureUserData(updates)` (line 27) is a module-level helper: a
fire-and-forget `POST /api/auth/update-user` whose failure is swallowed on
purpose ("store state is the source of truth for client"). It is **not awaited**
by any caller.

Method by method:

| Line | Method | What it does that is worth pinning |
|---|---|---|
| 81 | `SendOtp(phone, is_via_whatsapp, errorCallback)` | Calls `sendOtpAction` (a Server Action). On success: `setVerificationId`, `lockNumber(phone, lockSeconds \|\| 120)`, `recordSessionNumber`, returns the id. On a refusal that carries `lockSeconds`, it still locks, then `setWrongNumber(msg)` and throws. The `catch` runs for **both** paths: `LogServerError`, `errorCallback()`, then `setWrongNumber(msg)` — which **overwrites** the message with `""` when the action threw before `msg` was assigned. |
| 126 | `VerifyOtp(code, verificationID, Username, EditPhoneFunc)` | The centre of the journey. `GET /api/auth/login?verificationId&otp[&name]` through `fetchData` with `server: "local"`. Four rejection branches (`code === 501`, `"user not found"`, `isSuccessful === false`, `is_failed` → `LogError` only). On success: `checkWallet`, a GA user-mapping event **only when the guest id differs from the new user id**, `localStorage.removeItem("FBID")`, `SetGAUser`, `setTempUser`, `localStorage LAST-VERIFY`, then `loginSuccess` + `loginSuccessChat` + `loginSuccessStories` + `loginSuccessWallet` each forced to `is_verified: 1, is_phone_verified: 1`, then `setReAuthResult("success")` and `setShouldAuthinticated(false)`, then `posthogIdentify`. Returns `[already_exists, user.name]`. The `catch` splits on `"user not found"` (→ `setWrongNumber`) versus everything else (→ `loginFailed()`), then always `trackOrder(VERIFY_OTP_FAILED, …)` and rethrows. `EditPhoneFunc` is **never used**, and every call site passes `() => {}` — see "Dead code". |
| 279 | `VerifyOtpForUpdatePhone(code, verificationID)` | `fetchData` to `/auth/phone/verify_otp` on `market`; writes `localStorage["ID-TOKEN"]` (dead — see below); `updateUserIsVerified({is_phone_verified: 1})`; mirrors it into the `User-Data` cookie; **returns** the `id_token`, which is the value the caller actually uses. |
| 312 | `UpdateName(name)` | Optimistic: dispatches `updateName` and writes three cookies **before** any request. Then market → chat → `home.getCustomerInfo()` → stories → `StoryService.getStories()`. Every failure lands in one `catch` that only logs — there is **no rollback**, so a backend refusal leaves the store and the cookies renamed. |
| 366 | `cancelAuth(isForExpired?)` | `home.registerForExpire()` when there is no `userProfile`, then the store's own `cancelAuth`. |
| 375 | `NotifyForProducts({id, variant})` | Subscribes to `product_availability_<id>`, with the variant only when it is set and does not contain `"N/A"`. |
| 387/409/414 | `getUser` / `UserID` / `User` | `UserID` and `User` fall back `userProfile` → `user`; `getUser` reads `userProfile` only. |
| 390 | `validateFCMToken()` | Returns early with no request when `localStorage["FBID"]` is absent; otherwise posts `parseInt(FBID)`. Swallows errors into `console.log`. |
| 417 | `ConfigurePhoto(imageVar, serverVar)` | Pure string mapping, both directions. `market` strips `/customers/profile/` when the value contains `customers`; anything else adds the prefix when it is missing, and returns `null` for a falsy input. Cheapest high-value target in the file. |
| 442 | `RefreshSession(url?, server?)` | Returns `{refreshed:false, eligible:false}` while `LoggingOut`. Otherwise single-flight per key, `POST /api/auth/refresh` with body `{url, server}` — or `{}` when **both** arguments are undefined. Result mapping: `repo.eligible === false` → not eligible; else `refreshed = response.ok && repo.refreshed === true`; a thrown fetch → `{refreshed:false, eligible:true}`. The key is always released in `finally`. |
| 477 | `ExpiredUser(noReq = false)` | `LoggingOut` guard, then dedup through `_expirePromise`, cleared in `finally`. |
| 493 | `_doExpire(noReq)` | `setIsRegisteringReady(false)` … `(true)` in `finally`. When `noReq` is false: `POST /api/auth/expire` with `x-country` / `x-language` from `_getLocale()`. `repo.renewed === true` → `setReAuthResult("success")` **only when no re-auth is already armed**, and returns early without cancelling. Otherwise it captures `userProfile.phone` **before** `cancelAuth(true)`, and then, when `wasVerified && !armedFlow()`, sets `expiredSessionPhone` (only when the phone is truthy and not `"0"`), `setReAuthResult("pending")` and `setShouldAuthinticated("expired")`; when `!wasVerified`, `setReAuthResult("cancelled")`. `armedFlow()` is a **function read at the point of use**, on purpose — a concurrent 401 can arm a flow while the request is in flight. |
| 571 | `_getLocale()` | Splits `window.location.pathname.split("/")[1]` on `-`; falls back to `sy` / `en`. |
| 577 | `UpdateProfile(userObj, previousUserObj)` | The longest method. Reads the chat and stories users from `fetchAuthMe()` when the store has none, then updates **stories → chat → market**, each one dispatching into the store and mirroring to a cookie, tracked by `stories_done` / `chat_done` / `market_done`. The `catch` rolls each completed leg back in reverse and shows one error toast. Two things to know: the wallet leg is **commented out**, so `wallet_done` is always false and its rollback block is unreachable; and the method ends with a hardcoded `await new Promise(r => setTimeout(r, 1500))`. |
| 887 | `getImageForCookie(image)` | Adds `/customers/profile/` when the value is non-empty and does not already contain `customers`. |
| 895 | `uploadToMediaServer(file)` | Throws `"Media server upload is not configured"` when either `NEXT_PUBLIC_MEDIA_SERVER_BASE_URL` or `NEXT_PUBLIC_MEDIA_API_KEY` is empty. Otherwise `GetTicket`, a `FormData` POST to `<base>/gated/upload` with `x-api-key` and `X-Upload-Ticket`. |
| 935 | `UpdateProfileImage(image)` | Wraps the upload, returns `{sub_path: url}` or `null` after logging. |
| 954–1094 | `CheckUserName` | Fully commented out. Not code; nothing to test. |

**Behaviour that reads like a defect.** Recorded here; the tests pin what the
code does today, and no behaviour is changed by this ticket:

- `uploadToMediaServer` returns `{ error: data.error }` on a failed upload, but
  `data` is `null` when the body will not parse — that line **throws** instead of
  returning.
- `new Error("Wrong Code", response?.message)` (lines 159, 165, 295) passes a
  string where `Error`'s second argument is an options object, so the detail is
  silently dropped.
- `UpdateProfile`'s market rollback sends `body: userProfile` — an object, where
  every other call sends `JSON.stringify(...)`.
- `SendOtp`'s fallback text `"Failed to send verification code"` is a plain
  English literal written into store state that the sign-in UI reads.
- `UpdateName` has no rollback, so a rejected rename stays in the store and in
  three cookies.
- Comments at lines 435–438 and 599 name the backend technology, against the
  stack-agnostic naming rule.

### 2. `store/auth/reducer.tsx` (224) — client

`useAuthStore(set, get)` returns one flat object of state + actions, spread into
`store/index.ts` alongside eight other slices. Worth testing (everything else is
a plain setter, which the conventions exclude):

- `cancelAuth(isForzexpired?)` — the branchy one. With the flag it **keeps**
  `user` / `userProfile` / `userChat` / `userStories` / `userWallet` and only
  stamps `is_verified: 0` / `is_phone_verified: 0` (plus `need_auth: true` on the
  three service users); without it, all five become `null`. Both branches reset
  `failedLogin`, `attempts: 4`, `wrongNumber: ""`. Each `&&` guard means a null
  user stays null rather than becoming an object.
- `loginSuccess` — merges into `user`, sets `Tempuser` from the **previous**
  `user` merged with the payload, merges `userProfile`, clears `failedLogin`.
- `loginSuccessChat` / `Stories` / `Wallet` — merge when the slot is set, replace
  when it is null.
- `loginFailed` — `failedLogin: true` and `attempts - 1`, with **no floor**, so
  repeated failures go negative.
- `updateName(name)` — writes `user` and `Tempuser` only. It does **not** touch
  `userProfile`, so `getUser()` still returns the old name.
- `editUserInfo` / `updateUserInfo` / `updateUserIsVerified` — three different
  merge shapes over `userProfile` and `user`.
- `enableNotification` / `disableNotification` — add/remove a topic in
  `firebaseSettings.subscribed_topics`.

**The service needs three members that are not in this slice.** `LoggingOut`
comes from `store/Cart/reducer.ts`, `setIsRegisteringReady` and `language` from
`store/homepage/reducer.ts`. Any "auth slice in isolation" store must supply
them, or `_doExpire` throws on `setIsRegisteringReady(false)`.

## Dead code — nothing unused gets a test

**Owner's standing rule for this ticket: code that nothing uses is not tested; it
is considered for removal during `/implement`.** That is a deliberate exception
to roadmap rule 4 / `UNIT_TESTING.md` ("tests never change the code under test"),
which reads on a *working* module that resists testing. Deleting a path with no
caller is not a refactor of behaviour — there is no behaviour. The exception
applies only to code proven to have no caller and no reader, and every item still
has to be listed in `plan.md > Files to change`.

### The `ID-TOKEN` chain — traced end to end, and it is dead

The write at `services/auth.ts:297`
(`localStorage.setItem("ID-TOKEN", response.data.id_token)`) is the **only**
writer in the repository. It has three readers, and not one of them is live:

| Reader | Status |
|---|---|
| `services/chat.ts:84` — `loginChat()` sends it as `otp_id_token` | **`loginChat` is never called.** Its only occurrences are its own definition and its own error string. |
| `services/story.ts:62` — `loginStories()` sends it as `otp_id_token` | **`loginStories` is never called.** Same: definition and error string only. |
| `services/home.ts:379` and `:396` — `loginSuccess({ idToken: localStorage.getItem("ID-TOKEN") })` | Live code, but it writes a store field **nothing ever reads**. A repo-wide search for `.idToken` finds only these two writes and `services/auth.ts:211`. |

Why the two service logins died: `app/api/auth/login/route.ts` (lines 169–205)
already logs the shopper into chat, stories, comments and wallet **server-side**,
passing `otp_id_token: idToken` from the OTP response. The client-side copies
were left behind.

And the value the phone-update flow actually needs never goes through
`localStorage` at all: `VerifyOtpForUpdatePhone` **returns** the `id_token`, and
`components/setting/profile/PersonalInfoForm.tsx:265` takes it straight from
`onSuccess(idToken)` into `updateUserProfile({ …, id_token })`, which
`buildChangedFields` puts in the profile-save payload (line 116).

**So is it necessary to read it from the store or from `localStorage`? Neither.**
Nothing reads the store field, and every `localStorage` read belongs to a dead
function or feeds that unread field. Removing the write, the store field and the
two dead methods changes no behaviour, and it closes the security finding — this
repository's rule is that tokens live only in HttpOnly cookies — without needing
a separate ticket.

Blast radius: `services/auth.ts` (in scope), plus `services/chat.ts`,
`services/story.ts` and `services/home.ts` — not in the intake's scope, and not
protected globs. `OQ-5` settles how far the removal goes.

### Everything else with no caller

| Item | Evidence |
|---|---|
| `normalizePhone` — `services/auth.ts:69` | Declared with `let`, never referenced. |
| `EditPhoneFunc` — the 4th parameter of `VerifyOtp` | Never used in the body, and **all four** call sites pass `() => {}` (`ConfirmMobilePhoneWidget:120`, `FullEnhancedLoginWidget:305`, `InlineVerifyPanel:55`, `VerifyUser:93`). |
| The `&name=` branch of the `Username` parameter | Not unused code, but unreachable in practice: all four call sites pass `''`. Removing it would change a request the login route still accepts, so it is a **finding**, not a deletion. |
| `CheckUserName` — `services/auth.ts:954–1094` | Commented out in full. |
| The wallet leg of `UpdateProfile` — the comment block at 600–648, and the `wallet_done` rollback at 780–831 | `wallet_done` can never become true, so the rollback is unreachable. The comment says the leg is disabled "under development", so deleting it throws away written work — `OQ-5`. |
| `AuthState` — `store/auth/reducer.tsx:16–65` | Never applied to `useAuthStore` (which is untyped `(set, get)`), never imported, and drifted: it is missing `userChat`, `userStories`, `userWallet`, `NotificationsType`, `setShouldAuthinticated`, `updateUserIsVerified` and `loginSuccessChat/Stories/Wallet`, and types `cancelAuth` as taking no argument. |
| `_refreshPromise` — `tests/mocks/auth.ts:1–4` | A module variable in a stand-in file that nothing reads. |

## Relevant directories

- `services/` — `auth.ts` (**protected glob**, so the test goes in the
  `tests/services/` mirror), and the neighbours it pulls in: `home.ts`,
  `story.ts`, `wallet/index.ts`, `chat.ts`.
- `store/auth/` — the slice under test. `store/index.ts` is a **protected glob**
  and must not be touched; the slice is imported directly instead.
- `store/Cart/`, `store/homepage/`, `store/notifications/` — the sources of
  `LoggingOut`, `setIsRegisteringReady` / `language`, and
  `showErrorNotification`. The notifications store is a separate `create()` and
  is **not** part of the combined store.
- `tests/services/` — the target folder. Holds `authRefreshSession.test.ts`, the
  closest worked example and the file this ticket must not duplicate.
- `tests/mocks/` — `store.ts` (`makeStoreMock`), `auth.ts`
  (`makeMockAuthModule`, used by other suites to stand this service in),
  `fetchData.ts`, `serverActions.ts`, `nextNavigation.ts`, `posthog.ts`,
  `sentry.ts`, `ToastMock.ts`.
- `tests/msw/` — network-level answers, for the four relative `fetch` calls this
  service makes.
- `utils/` — `fetchData.ts`, `authMe.ts`, `otpLocks.ts`, `orderFunnel.ts`,
  `gtag.ts`, `posthog.ts`, `serverErrorReporter.ts`, `UploadUtils.ts`,
  `functions.tsx`, `cookies/cookie-manager.ts` (`COOKIE_NAMES` only — the
  client-safe half). All are boundaries this ticket stands in, not targets.
- `serverActions/`, `app/api/auth/` — the other end of the calls. **Phase 10**,
  not here.
- `components/Login/Enhanced/`, `components/setting/profile/` — the callers.
  **Phase 11**, not here; read only to prove which arguments they pass.

## Relevant config files

- `vitest.config.mts` — `jsdom`, `globals: true`, `setupFiles: ./tests/setup.ts`,
  the `server-only` alias, folder-wide `coverage.include` (so this phase appends
  nothing), and a fake `test.env`. Two of those env values decide a branch in
  this ticket: `NEXT_PUBLIC_MEDIA_API_KEY` and `NEXT_PUBLIC_POSTHOG_KEY` are
  **empty strings**.
- `tests/setup.ts` — global stand-ins for `next/navigation`,
  `serverActions/sendOtp` and `serverRequests/radis`; msw with
  `onUnhandledRequest: "error"`. The `sendOtpAction` stand-in is already global,
  so `SendOtp` has its boundary for free.
- `docs/testing/UNIT_TESTING.md` — the conventions: mirror path, `vi.mock` +
  `vi.resetModules()` loader, no real I/O, no plain-setter tests, pin anything
  ambient.
- `docs/testing/UNIT_TEST_ROADMAP.md` — Phase 9. Its row is stale in three ways
  (line count, "login, logout, guest", and status markers for phases 4–8); the
  intake settled the scope.
- `.claude/project-config.yaml` — the checks and the three profiles
  (`ui-change`, `logic-change`, `full`).
- `package.json` — `test`, `test:run`, `test:coverage`.

## Possibly affected services

Nothing ships to a user unless the dead-code removal is approved; otherwise this
ticket adds test files only. What can be disturbed is what the tests *load*,
inside the test process:

- **Sign in / OTP** (`serverActions/sendOtp`, `app/api/auth/login`) — `SendOtp`
  and `VerifyOtp` are the client half. The action is already stood in globally;
  the login call goes through `fetchData`, which has its own stand-in.
- **Session refresh** (`app/api/auth/refresh`) — `RefreshSession` is partly
  covered already. The new work must keep the existing dedup file passing.
- **Expire** (`app/api/auth/expire`) — `_doExpire` is the only client caller.
  Phase 10 owns the route; this ticket must not pre-empt it.
- **Secure cookie mirror** (`app/api/auth/update-user`) — hit by four methods,
  fire-and-forget, never awaited.
- **`/api/auth/me`** (`utils/authMe.ts`) — reached from `UpdateProfile` through
  `getServiceUsersFromCookies`. It has its **own module-level in-flight dedup**,
  which leaks between tests unless the module is reset or stood in.
- **Media upload** (`uploadToMediaServer` → `<media>/gated/upload`) — the only
  outbound call to a non-`/api` address in the file.
- **Chat / stories / wallet profile sync** (`services/home`, `services/story`,
  `services/wallet`) — called on the success paths of `UpdateName` and
  `UpdateProfile`. `services/home.ts` imports `./auth`, and
  `utils/orderFunnel.ts` imports `services/auth`: both are **circular** with the
  module under test. If the `ID-TOKEN` removal is approved, `services/chat.ts`
  and `services/story.ts` change too — neither is a protected glob, and the
  methods removed have no callers.
- **Analytics** (`utils/gtag`, `utils/posthog`, `utils/orderFunnel`) — five
  events fire across the success and failure paths. Out of scope as behaviour,
  but they must not reach a real service.

## Test / validation commands available

Listed, not run.

- `pnpm test:run` — the whole vitest suite once, exits. The `unit-tests` check.
- `pnpm test` — watch mode. Never in a gate; it does not exit.
- `pnpm test:coverage` — one run with coverage; writes `coverage/index.html`.
- `node_modules/.bin/tsc --noEmit --pretty false` — the `typecheck` check.
- `pnpm lint` — ESLint. The i18n rules are off for `*.test.*`, so a test file
  needs no `eslint-disable`.
- `pnpm lint:i18n-parity` — not relevant; this ticket adds no user-visible
  string.
- `pnpm build` — needed only if a server/client boundary moves. Worth naming if
  the dead-code removal touches three more service files (`OQ-6`).

Matching profile: `logic-change` (lint + typecheck + unit-tests). The roadmap
still says every phase names `tests-and-types`, and no profile with that id
exists in `.claude/project-config.yaml` — see `OQ-6`.

## Risks and unknowns

| ID | Risk | Impact / likelihood |
|---|---|---|
| R-1 | **The singleton carries state between tests.** `_expirePromise` and `_refreshPromises` live at module scope, and the default export is constructed at import. A test that leaves an expire in flight poisons the next one. Every test must import through a `vi.resetModules()` loader — the existing `loadAuth` helper already does exactly this. | High / certain. Symptom is an order-dependent failure, the hardest kind to read. |
| R-2 | **The import graph is circular and heavy.** `services/home.ts` imports `./auth`; `utils/orderFunnel.ts` imports `services/auth`. Loading the real graph also drags in `utils/functions.tsx` (the translations module), `services/story`, `services/chat` and the analytics helpers. `authRefreshSession.test.ts` needs **20 `vi.mock` calls** to load this one module. | High / certain. Either the suite repeats that wall in every file, or it needs one shared loader — a decision for `/plan`, not a discovery for each test. |
| R-3 | **`makeStoreMock` has no auth actions.** `DEFAULT_STORE_STATE` carries `user`, `userChat`, `userStories`, `LoggingOut`, `language`, `isRegisteringReady` and exactly two spies (`setShouldAuthinticated`, `setReAuthResult`). Every other action the service destructures — `setVerificationId`, `setWrongNumber`, `loginSuccess`, `loginFailed`, `setTempUser`, `editUserInfo`, `updateName`, `updateUserIsVerified`, `cancelAuth`, `setExpiredSessionPhone`, `setIsRegisteringReady`, `setTotalOrders` — is `undefined`, and calling it throws. | High / certain. The roadmap's own requirement ("assert the dispatch") is unreachable through the current stand-in without a decision — `OQ-1`. |
| R-4 | **Four relative `fetch` calls, all with swallowing callers.** `/api/auth/update-user`, `/api/auth/refresh`, `/api/auth/expire` and `/api/auth/me` are called with the global `fetch`. msw's `onUnhandledRequest: "error"` makes an unhandled one fail — but `updateSecureUserData` and `RefreshSession` both catch and continue, so the test would pass while the call quietly failed. | High / likely. Same failure mode Phase 8 recorded twice: a test that cannot fail. |
| R-5 | **The media upload branch is gated by an empty env value.** `vitest.config.mts` sets `NEXT_PUBLIC_MEDIA_API_KEY: ''`, so `uploadToMediaServer` throws `"Media server upload is not configured"` **every time** unless the test stubs the env. A test written without noticing asserts the guard and believes it covered the upload. | Medium / likely. Cheap to prevent with `vi.stubEnv`, expensive to spot. |
| R-6 | **`UpdateProfile` sleeps 1500 ms on the success path.** Vitest's default per-test timeout is 5 s. Without fake timers each success-path test costs 1.5 s of wall clock, and any test that also stubs timers has to advance them past the sleep or it hangs to the timeout. | Medium / certain. Predictable once known; a silent 20-second suite otherwise. |
| R-7 | **Ambient browser state persists inside a test file.** `localStorage` (`FBID`, `LAST-VERIFY`, `ID-TOKEN`), `sessionStorage` (the real `utils/otpLocks` guard), and `window.location.pathname` (which `_getLocale` reads, defaulting to `/` → `sy`/`en` in jsdom) all survive between tests in the same jsdom environment. | Medium / likely. `otpLocks` in particular will make a second `SendOtp` test behave differently from the first. |
| R-8 | **`fetchAuthMe` has its own module-level in-flight promise.** One `UpdateProfile` test leaves it set for the next unless the module is reset or stood in. | Medium / possible. Same class as R-1, one layer out. |
| R-9 | **Over-mocking makes a green suite meaningless.** With `store`, `utils/functions`, `utils/fetchData`, both analytics helpers and three sibling services stood in, a careless test asserts only that mocks were called. The roadmap's rule 1 (a phase covers a journey slice) is the guard, and `/spec` has to name user-facing behaviour, not method calls. | Medium / likely. This is the main way this ticket fails while passing. |
| R-10 | **The removal widens the ticket beyond its two files.** Taking the `ID-TOKEN` chain out touches `services/chat.ts`, `services/story.ts` and `services/home.ts` as well. All three are unprotected and the removed methods have no callers, but the ticket stops being "tests only" and `plan.md` must list every file. | Medium / certain if `OQ-5` says remove. Guard: nothing that still has a caller gets touched. |
| R-11 | **Duplicating the existing dedup file.** `tests/services/authRefreshSession.test.ts` owns `RefreshSession`'s single-flight. Its **result mapping** (`eligible: false`, `response.ok`, the thrown-fetch fallback, the `{}` body when both arguments are undefined) is *not* covered and is fair game. Telling the two apart is a `/spec` job. | Medium / possible. Named in the intake for exactly this reason. |
| R-12 | **Size.** Eighteen live methods plus a store slice, in one ticket by the owner's decision. Without a written case list and a written exclusion list, the ticket sprawls and `/verify` cannot say whether it is done. | Medium / likely. `/spec` fixes this by enumerating; it does not need a re-cut. |
| R-13 | **🔒 obligations.** `services/auth.ts` is a protected glob. The tests go in `tests/services/`, `plan.md` must state the mirror, and `verify.md` must carry the protected-path statement (TR-3). `store/index.ts` must not change. | Low / certain. Purely procedural, and easy to forget at `/plan`. |
| R-14 | **A test that pins a defect can look like an endorsement.** Five behaviours read as defects and stay as they are. A test named "returns the error" for a line that actually throws would be wrong; the test has to describe what happens, and the ticket has to record why it was not fixed. | Low / possible. Cheap to get right if `/spec` writes the case names. |

## Open questions

> Give each question a stable ID (`OQ-1`, `OQ-2`, …). `spec.md` must record an
> answer for every one of them (SP-9) — an answer given only in chat does not
> count.

| ID | Question | Why it matters |
|------|----------|----------------|
| OQ-1 | How does the suite observe the dispatch (R-3): build the **real** auth slice in isolation (`create((set, get) => ({...useAuthStore(set, get), ...cross-slice members}))`) and assert the resulting state, or keep `makeStoreMock` and pass `vi.fn()` for every action and assert the calls? | This is the roadmap's stated requirement for the phase. The real slice proves the state a user ends up in and covers `store/auth/reducer.tsx` at the same time; spies prove only that the service called something. The choice also decides whether `tests/mocks/store.ts` needs a shared auth preset. |
| OQ-2 | How is the outbound `fetch` boundary handled (R-4) — `vi.stubGlobal("fetch", …)` as `authRefreshSession.test.ts` does, or msw handlers for the four `/api/auth/*` paths? | The repo currently does both. Mixing them per file is how a suite stops being readable; and only an explicit choice closes the "test that cannot fail" hole. |
| OQ-3 | Is `store/auth/reducer.tsx` driven **directly** (import the slice, assert `cancelAuth`, `loginSuccess`, `loginFailed`, `updateName`, the three merge shapes, the notification topics), or only indirectly through the service? | The roadmap names it as a target. Driving it directly is cheap and is the only way to pin the branchy `cancelAuth(isForExpired)`; doing it only through the service leaves half the branches unreachable. Plain setters are excluded either way. |
| OQ-4 | Is `uploadToMediaServer` in scope given the empty-env gate (R-5), and does the suite pin the `data.error` crash on an unparseable error body? | It is the only outbound non-`/api` call in the file, and the crash line is the sharpest defect found. Including it means `vi.stubEnv` plus a `FormData`/`File` fixture in jsdom; excluding it leaves `UpdateProfileImage` half-covered. |
| OQ-5 | **How far does the dead-code removal go?** Minimum: `services/auth.ts` only — the `ID-TOKEN` write, `normalizePhone`, `EditPhoneFunc`, the `CheckUserName` block. Full: also `loginChat` (`services/chat.ts`), `loginStories` (`services/story.ts`), the two `idToken` reads in `services/home.ts`, `AuthState` in the store slice, and the disabled wallet leg of `UpdateProfile`. | The `ID-TOKEN` write cannot be removed on its own claim of safety unless its three readers go too — leaving `loginChat` reading a key nobody writes is worse than either end state. The wallet leg is the one item that is disabled rather than dead ("under development"), so it is a judgement call, not a fact. |
| OQ-6 | Which validation profile does `plan.md` name — `logic-change` (lint + typecheck + unit-tests), or `full` (adds `pnpm build`) if the removal touches four service files? | `/verify` runs the profile named in the plan. `tests-and-types`, which the roadmap tells every phase to name, does not exist in `.claude/project-config.yaml`; naming it means the gate silently checks nothing. Deleting exports across service files is exactly the class of change `full` exists for. |
| OQ-7 | One test file or several? If several, what is the cut (e.g. `auth.otp.test.ts`, `auth.session.test.ts`, `auth.profile.test.ts`) and does `authRefreshSession.test.ts` keep its name, or does it become one of them? | Eighteen methods in one file is unreadable, and R-2's mock wall repeated three times is worse. The naming decision also settles whether `/verify` can point at one file per AC. |
| OQ-8 | Does the removal happen **before** the tests are written or after, inside the same implement stage? | Writing tests for `EditPhoneFunc` call sites and then deleting the parameter wastes the work; deleting first means the tests are written against the code that ships. It also decides whether the branch has one commit or two, which matters for the revert story. |
| OQ-9 | Are the five defect candidates recorded as **findings in this ticket** (each with the test that pins current behaviour), or listed once in `verify.md` with no test attached? | A finding with a test behind it survives; a finding in prose does not. This also settles whether the stack-agnostic naming violations in the comments get recorded at all — they are comments, not shipped strings, and fixing them is out of scope either way. |

## Notes

- No code was changed during research.
- No observability runtime configs were modified.
- Both target files were read in full, along with `vitest.config.mts`,
  `tests/setup.ts`, `tests/mocks/store.ts`, `tests/mocks/auth.ts`,
  `tests/services/authRefreshSession.test.ts`, `docs/testing/UNIT_TESTING.md`,
  `store/index.ts` and `.claude/project-config.yaml`. The cross-slice owners of
  `LoggingOut`, `setIsRegisteringReady` and `language` were confirmed by reading
  the slices, not assumed.
- The `ID-TOKEN` chain and every "no caller" claim above were checked by
  repo-wide search across `.ts`/`.tsx`, and each call site was opened and read —
  not inferred from a name.
