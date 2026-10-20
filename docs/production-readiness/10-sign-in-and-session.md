# Sign-in and session — Production readiness

**Status:** 🟡 Ready with conditions
**In one line:** Phone sign-in, token renewal, expiry and sign-out work end to end, but 4 items must be fixed first: a fake QR login, unreadable terms, a credential in the sign-in reply, and the wallet sign-in.
**Checked:** branch `development`, commit `6a0265a1`, 2026-10-20 — from the code only.

## What this section is
A shopper signs in or signs up with a phone number and a one-time code (OTP) sent by SMS or WhatsApp.
The overlay opens from any gated action (settings profile card, like, story, chat, wallet or orders card) through `components/Home/AuthSections.tsx` → `components/Login/Enhanced/FullEnhancedLoginWidget.tsx`.
Behind it, the app keeps one token pair per backend (market, chat, stories, comments) plus a wallet token. It renews them on a 401 and falls back to a guest when renewal is refused.
Sign-out is the "Logout" item in the avatar menu (`components/Home/Menu.tsx`).

## ✅ Working cases
| # | Case (user action → result) | Backend | Proof in code | Test |
|---|---|---|---|---|
| W-1 | First visit with no cookies → a guest account is made, and the shopper can act at once | gateway `/auth/register-guest` | `services/home.ts` `checkLogin` → `RegisterDevice` → `app/api/auth/register-device/route.ts` | `tests/app/api/auth/register-device/route.test.ts`, `tests/services/home.checkLogin.test.ts`; e2e `session.live.spec.ts` "a first visit registers the guest" |
| W-2 | A gated action opens the sign-in overlay; browser Back closes it (`?login=true` history entry) | none | `components/Home/AuthSections.tsx`, `FullEnhancedLoginWidget.tsx` | `tests/components/Home/AuthSections.test.tsx`, `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx` |
| W-3 | "I already have an account" → phone screen (sign-in path) | none | `FullEnhancedLoginWidget.tsx` `onExistingAccount` | `FullEnhancedLoginWidget.test.tsx` |
| W-4 | "Create new account" → Terms → "Agree & Continue" → phone screen | none | `FullEnhancedLoginWidget.tsx`, `screens/TermsScreen.tsx` | `FullEnhancedLoginWidget.test.tsx` |
| W-5 | "Later, take a look" closes the overlay and sends a GA event | none | `FullEnhancedLoginWidget.tsx` `handleLater` | `FullEnhancedLoginWidget.test.tsx` |
| W-6 | Choose SMS or WhatsApp → the code is sent → the PIN screen opens | core `/auth/phone/send_otp` | `services/auth.ts` `SendOtp` → `serverActions/sendOtp.ts` (6–15 digit check, limiter) → `serverRequests/HandleAuthedFetch.ts` | `tests/serverActions/sendOtp.test.ts`, `tests/services/auth.otp.test.ts`, `tests/components/Login/Enhanced/screens/SelectMethodScreen.test.tsx`; e2e AUTH-01 |
| W-7 | Too many sends → the send is refused, and the screen shows a live countdown | none (Redis) | `serverRequests/radis/index.ts` `otpRateLimit` (60 s per IP, 2 numbers per session per hour, 4 sends per IP per hour); client copy in `utils/otpLocks.ts` | `tests/serverRequests/radis/index.test.ts`, `tests/utils/otpLocks.test.ts`, `tests/serverActions/sendOtp.test.ts` |
| W-8 | A script that posts `send_otp` through `/api/proxy` is refused. Only the server action can send. | none | `app/api/proxy/route.ts` lines 292–307 | e2e AUTH-04 (`session.live.spec.ts`) |
| W-9 | "Resend code" after the countdown → a new code is sent, and the wrong-code counter resets | core `/auth/phone/send_otp` | `FullEnhancedLoginWidget.tsx` `handleResendOtp` | `FullEnhancedLoginWidget.test.tsx`, `tests/components/Login/Enhanced/screens/EnterPinScreen.test.tsx` |
| W-10 | Correct code → the shopper is signed in. All tokens go into HttpOnly cookies. The page and the story rail refresh. | core `verify_otp`, then chat, stories, comments, wallet sign-in in parallel (10 s cap each) | `services/auth.ts` `VerifyOtp` → `app/api/auth/login/route.ts` | `tests/app/api/auth/login/route.test.ts`, `tests/services/auth.otp.test.ts`; e2e AUTH-01 (red on purpose, see M-5) |
| W-11 | Wrong code → "Tries left: N". After 3 wrong codes → "Too many wrong codes. Ask for a new code." A server or network error does not spend a try. | core | `FullEnhancedLoginWidget.tsx` `handleVerifyPin`, `services/auth.ts` `VerifyOtp` (5xx check first) | `FullEnhancedLoginWidget.test.tsx`, `auth.otp.test.ts`; e2e `auth.scripted.spec.ts` "verify errors are surfaced", "the code boxes stop taking a fourth code" |
| W-12 | Sign-up with a number that already has a named account → "Already registered" screen → "Log in" → success | core | `FullEnhancedLoginWidget.tsx` (`hasRealName`), `screens/AlreadyExistScreen.tsx` | e2e `auth.scripted.spec.ts` "Signing up with a registered number" |
| W-13 | Sign-in with an unknown number → "Not found" screen → "Create account" → name screen | core | `FullEnhancedLoginWidget.tsx`, `screens/NotFoundScreen.tsx` | e2e `auth.scripted.spec.ts` "logging in with an unregistered number" |
| W-14 | New account → name screen → the name is saved → the overlay closes | core `/customer/update-name`, chat `PUT /api/v1/users/{id}`, stories `/api/v1/users/update` | `FullEnhancedLoginWidget.tsx` `handleNameSubmit` → `services/auth.ts` `UpdateName` | e2e `auth.scripted.spec.ts` "a new phone is taken through signup to the name screen" |
| W-15 | Existing account with a name → success screen → the overlay closes | core | `FullEnhancedLoginWidget.tsx` `handleAfterSuccess` | e2e `auth.scripted.spec.ts` "an existing account logs in" |
| W-16 | A signed-in shopper reloads the page → still signed in | none (cookies) | `services/home.ts` `checkLogin` | e2e AUTH-02 |
| W-17 | Market token expired (60 s on staging) → one renewal → the same call is sent again and succeeds. Parallel 401s share one renewal. A call sent before the last renewal just retries. | core (verified) or gateway (guest) refresh | `utils/fetchData.ts` 401 handler → `services/auth.ts` `RefreshSession` → `app/api/auth/refresh/route.ts` → `utils/server/authRefresh.ts` | `tests/services/authRefreshSession.test.ts`, `tests/utils/fetchData.test.ts`, `tests/app/api/auth/refresh/route.test.ts`, `tests/utils/server/authRefresh.test.ts`; e2e `session.live.spec.ts` "a refused credential is exchanged", RECOV-01, SCRIPT-10 |
| W-18 | Chat, stories or comments token expired → that service's own pair is renewed, wait 2 s, retry | chat, stories, comments refresh | `utils/fetchData.ts`, `utils/server/authRefresh.ts` | `fetchData.test.ts`, `authRefresh.test.ts` |
| W-19 | A server-rendered call gets a market 401 → renewal and retry. No refresh cookie and not verified → a guest is made. | core / gateway | `serverRequests/HandleAuthedFetch.ts` | `tests/serverRequests/HandleAuthedFetch.test.ts` |
| W-20 | A guest's renewal is refused → one last renewal try → else every token is deleted and a new guest is made, with no prompt | gateway `/auth/register-guest` | `services/auth.ts` `ExpiredUser` → `app/api/auth/expire/route.ts` | `tests/app/api/auth/expire/route.test.ts`, `tests/services/auth.session.test.ts`; e2e `session.live.spec.ts` "a refused pair issues a new guest" |
| W-21 | A verified shopper's renewal is refused → new guest + "Session expired" prompt. "Login" opens the verify widget with the old phone filled and locked → code → back in the account. "Continue as guest" reloads (seller pages go home). | core, gateway | `components/Login/SessionExpiredWidget.tsx`, `components/Login/ConfirmMobilePhoneWidget.tsx`, `components/Home/NavbarClient.tsx` lines 43–49 | `tests/components/Login/SessionExpiredWidget.test.tsx`, `tests/components/Login/ConfirmMobilePhoneWidget.test.tsx`, `tests/components/Home/NavbarClient.test.tsx`; e2e RECOV-02, SCRIPT-11 |
| W-22 | Chat, stories or comments renewal refused → only that service's tokens are cleared → phone re-verify widget → code → the waiting call is retried | chat / stories / comments | `utils/fetchData.ts` lines 395–460, `app/api/auth/clear-tokens/route.ts` | `tests/app/api/auth/clear-tokens/route.test.ts`, `ConfirmMobilePhoneWidget.test.tsx`; e2e SCRIPT-29, SCRIPT-35 |
| W-23 | The seller dashboard session dies → prompt. "Continue as guest" sends the seller to the store home. | core | `utils/fetchData.ts` (`isSeller` branch), `SessionExpiredWidget.tsx` | `fetchData.test.ts`, `SessionExpiredWidget.test.tsx` |
| W-24 | "Logout" in the avatar menu → in-flight calls stop → every secure cookie is deleted → the push token is detached from the account after the reply → local data and the PostHog identity are cleared → reload (home from `/seller` or `/settings`) | chat (FCM detach, after the reply) | `components/Home/Menu.tsx` `handleLogout` → `utils/tinyUtils.tsx` `clearAllUserData` → `app/api/auth/logout/route.ts` | `tests/app/api/auth/logout/route.test.ts`, `tests/components/Home/Menu.test.tsx`; e2e AUTH-03 |
| W-25 | A late 401 during sign-out cannot bring the session back (30 s logout guard cookie) | none | guard checks in the `refresh`, `expire`, `register-device` routes and in `authRefresh.ts` | the three route tests above |
| W-26 | "Logout" shows only for a shopper with a phone, and it appears as soon as the profile loads | none | `Menu.tsx` `shouldShowLogout` (reads the `user` prop) | `Menu.test.tsx`; e2e AUTH-03, PROF-08 |
| W-27 | The app reads the signed-in profile, and no token reaches page scripts | none | `app/api/auth/me/route.ts` → `utils/server/tokenManager.ts` `getCurrentUser` (sanitised) | `tests/app/api/auth/me/route.test.ts`, `tests/utils/authMe.test.ts` |
| W-28 | Profile changes are copied into the HttpOnly profile cookies. A re-auth payload also refreshes the chat and stories token cookies. | none | `app/api/auth/update-user/route.ts` | `tests/app/api/auth/update-user/route.test.ts` |

## ⚠️ Works, with limits
- **L-1 A partial sign-in looks like a full success.** `/api/auth/login` answers 200 when the chat, stories, comments or wallet sign-in fails. The failure goes to Sentry under `is_failed`. The client still marks every service as signed in (`need_auth: false` in `services/auth.ts` `VerifyOtp`). The shopper meets a prompt later, when that service is first used.
- **L-2 Send errors are not translated.** `serverActions/sendOtp.ts` returns "Invalid Phone Number" (line 96) and "Failed to send verification code" (lines 205, 211) in English. `SelectMethodScreen.tsx` line 233 shows them as they are, also to ar / tr / ku shoppers.
- **L-3 The OTP limiter fails open.** With no Redis, or on a Redis error, every send is allowed (`serverRequests/radis/index.ts` lines 221, 270). Then only the backend's own per-number throttle protects us.
- **L-4 The 3-wrong-codes cap lives in the browser only** (`MAX_VERIFY_ATTEMPTS = 3` in `usePhoneVerifyFlow.ts`). A script can call `/api/auth/login` again and again. The backend must limit tries (see the questions below).
- **L-5 The code travels in the address.** `GET /api/auth/login?verificationId=…&otp=…` puts the one-time code into request logs. The code is single-use, so the risk is small.
- **L-6 Renewal races.** The server shares one renewal per refresh token, but only inside one server instance (in-memory map in `authRefresh.ts`). Two instances can both spend the same single-use token. The last-chance renewal in `/api/auth/expire` saves most of these cases; the rest become a guest. A tab that closes or navigates during renewal also loses the new pair (known; see `tests/e2e/harness/renewalGate.ts`).
- **L-7 Sign-out does not tell the backends.** `/api/auth/logout` deletes cookies only. The refresh tokens stay valid on the servers until they expire.
- **L-8 Closing the re-verify widget always clears `STORIES-TOKEN`,** even when chat or comments opened it (`ConfirmMobilePhoneWidget.tsx` line 76).
- **L-9 The name save at sign-up can split.** `UpdateName` writes core first, then chat, then stories (`services/auth.ts` lines 382–440). If chat or stories refuses, the app puts the old name back on screen and says "Failed to update name". Core keeps the new name. Wallet and comments never get the name.
- **L-10 Sign-in with an unknown number already makes the account.** The code is accepted first. "Cancel" on the "Not found" screen leaves the shopper signed in to a new account with no name.
- **L-11 No time limit on guest creation.** `/api/auth/expire` and `/api/auth/register-device` call the gateway with no timeout. A gateway that never answers holds the function open.
- **L-12 Phone numbers reach Sentry.** The sub-service failure log in `login/route.ts` (the `failures` array) carries the shopper's phone.
- **L-13 Cookie lifetimes are longer than the tokens:** token cookie 48 h, refresh cookie 30 days, profile cookies 1 year (`utils/server/tokenManager.ts`). Staging refresh tokens live 2 days. A stale cookie only costs one refused renewal.
- **L-14 Dead and untranslated bits.** The Splash step is never reached: the widget starts at `get-started`, and nothing sets `'splash'`. Image `alt` texts on the login screens are English only ("close", "sim", "shield", "RDB Logo").
- **L-15 The avatar menu has no "Login" item for a guest.** A guest signs in from the settings profile card or from a gated action.
- **L-16 `GO_BACKEND_URL`** still names the technology. It is server-only, and the rename is pending under the naming rule.
- **L-17 The wallet token is handed to page scripts on purpose** by `/api/auth/wallet-token`. This is a documented exception for the wallet widget; the wallet file covers it.

## ❌ Missing, broken or not built
| # | Problem | What the user sees | Where (file:line) | Owner | Blocks launch? |
|---|---|---|---|---|---|
| M-1 | **Fixed 2026-10-20.** `GET /api/clearRedis` had no auth and deleted every OTP limiter key. The route and its test were deleted; no app code called it. | — | — | Frontend | No — closed |
| M-2 | QR login is a `localStorage` mock with no backend. "Scan QR Code" is on the first login screen, and a QR icon is on the settings profile card (mobile). Scanning from another phone does nothing. "Approve" closes as if it worked. The desktop QR renews every 60 s for ever. A GA "login success" event fires with no session. | A login method that never logs in | `services/qrLogin/index.ts:3`; `screens/GetStartedScreen.tsx:27`; `FullEnhancedLoginWidget.tsx:511`; `components/setting/profile/index.tsx:73-86` | Backend (endpoints) + Frontend (hide) | Yes — hide both entry points until the backend exists |
| M-3 | **Fixed 2026-10-20.** "Terms Of Services" on the Terms screen and on the cart's inline panel now opens `/[locale]/terms-of-service` in a new tab. | — | `screens/TermsScreen.tsx`, `InlineVerifyPanel.tsx` | Frontend | No — `tests/components/Login/Enhanced` green. Product still replaces the page text (file 18 M-1) |
| M-4 | `/api/auth/login` strips `token` and `refresh_token` from its reply, but not `data.id_token`. That credential signs in to chat, stories, comments and wallet, and it reaches page scripts. `getCurrentUser` already strips `id_token`, so the rule exists. | Nothing visible | `app/api/auth/login/route.ts:459-466` | Frontend | Yes — breaks the "tokens never reach page scripts" rule; one-line fix |
| M-5 | Wallet sign-in answers 502 on staging. e2e AUTH-01 stays red on purpose. | The shopper is signed in; the wallet asks again later | backend | Backend | Yes, if the wallet ships at launch |
| M-6 | The wallet sign-in body is built wrongly. `String(InventoryUser.email) ?? ""` sends the text "undefined" or "null" when there is no e-mail. `lastName` takes only the second word of the name. | Possibly the wallet 502 in M-5 | `app/api/auth/login/route.ts:283-285` | Frontend | No — but check it before the backend team works on M-5 |
| M-7 | `/api/auth/update-user` accepts any field for the 4 profile cookies. Page code can set `phone` or `is_phone_verified` in `User-Data`. That cookie decides whether market calls go to core or to gateway. The backends still check the token. | Nothing | `app/api/auth/update-user/route.ts:48-66` | Frontend | No — limit it to the fields the app writes |

## 🔒 Must do before launch
- [x] `/api/clearRedis` removed (M-1, done 2026-10-20).
- [ ] Hide the QR entry points on the login start screen and on the profile card until real endpoints exist (M-2).
- [x] Make "Terms Of Services" on the Terms screen open `/[lang]/terms-of-service` (M-3). (done 2026-10-20)
- [ ] Strip `id_token` from the `/api/auth/login` reply (M-4).
- [ ] Wallet sign-in works on the production wallet backend, or the wallet is held back (M-5; check M-6 first).
- [ ] Production env: `OTP_TEST_PHONES` empty. `REDIS_URL`, `REDIS_USERNAME`, `REDIS_PASS` set (the limiter fails open without them). `OTP_COOLDOWN_SECONDS`, `OTP_SESSION_MAX`, `OTP_IP_MAX`, `OTP_WINDOW_SECONDS` set to agreed values (code defaults 60 / 2 / 4 / 3600). Every backend URL and `WALLET_PUBLIC_API_KEY` point to production hosts, not staging.
- [ ] Remove or gate before production: `app/api/auth/simulate`, `app/simulateUser`, and the two helpers that serve it on every page (`SessionChecker`, `SessionTimer` in `components/global/DeferredLayoutClients.tsx`).

## ❓ Needs confirmation from the backend team
- Core: does `verify_otp` limit wrong codes per `verificationId`? Our 3-try cap is client-side only.
- Core: how long does the `id_token` from `verify_otp` live, and can it be used more than once?
- Core: does `send_otp` keep its own per-number throttle, and does it block premium-rate numbers? Our limiter fails open without Redis.
- Core and gateway: what are the production lifetimes of the access token and the refresh token? (Staging: 60 s and 2 days.)
- All services: is there a logout / revoke endpoint for refresh tokens? Sign-out does not call one today.
- Wallet: why does sign-in answer 502? Does it refuse the e-mail value "undefined" (M-6)?
- Comments and wallet: how do they learn the new name after sign-up? The app does not send it to them.

## 🧪 Tests that cover this section
- **Unit — routes:** `tests/app/api/auth/{login,refresh,expire,register-device,logout,clear-tokens,update-user,me,wallet-token}/route.test.ts`, `tests/app/api/proxy/`.
- **Unit — services and helpers:** `tests/services/auth.otp.test.ts`, `auth.session.test.ts`, `authRefreshSession.test.ts`, `home.checkLogin.test.ts`, `walletReauthFlag.test.ts`; `tests/utils/fetchData.test.ts`, `otpLocks.test.ts`, `authMe.test.ts`; `tests/utils/server/authRefresh.test.ts`, `tokenManager.test.ts`, `otpAllowlist.test.ts`, `otpIdentity.test.ts`, `otpTelemetry.test.ts`; `tests/serverActions/sendOtp.test.ts`; `tests/serverRequests/radis/index.test.ts`, `HandleAuthedFetch.test.ts`.
- **Unit — screens:** `tests/components/Login/Enhanced/FullEnhancedLoginWidget.test.tsx`, `usePhoneVerifyFlow.test.tsx`, `VerifyPhoneFlow.test.tsx`, `screens/EnterPinScreen.test.tsx`, `screens/SelectMethodScreen.test.tsx`; `tests/components/Login/SessionExpiredWidget.test.tsx`, `ConfirmMobilePhoneWidget.test.tsx`; `tests/components/Home/AuthSections.test.tsx`, `NavbarClient.test.tsx`, `Menu.test.tsx`.
- **Unit — QR (mock only):** `tests/services/qrLogin/index.test.ts`, `tests/components/Login/QrApprovalSheet.test.tsx`, `QrScannerModal.test.tsx`, `screens/QrLoginScreen.test.tsx`. They prove the mock, not a real login.
- **Unit — simulate tools only:** `tests/components/SessionChecker.test.tsx`, `tests/components/Login/SessionTimer.test.tsx`, `tests/utils/sessionManager.test.ts`, `tests/app/api/auth/simulate/route.test.ts`.
- **E2E:** `tests/e2e/auth.live.spec.ts` AUTH-01, AUTH-02, AUTH-03; `session.live.spec.ts` (guest first visit, guest renewal, guest re-made, AUTH-04); `session-recovery.live.spec.ts` RECOV-01, RECOV-02; `auth.scripted.spec.ts` (6 cases); `profile.scripted.spec.ts` SCRIPT-10, SCRIPT-11; `chat.scripted.spec.ts` SCRIPT-29, SCRIPT-35.
- **Expected failures:** AUTH-01 is red on purpose (the wallet backend answers 502). There are no `it.fails` / `test.fail` / `BUG-n` markers in this section. `session-recovery.live.spec.ts` skips every case when `TEST_ACCOUNT_PHONE` / `TEST_ACCOUNT_OTP` are not set.
- **No test today:** `id_token` left out of the login reply; the wallet sign-in body (e-mail and last name); WhatsApp as the send method end to end; sign-out calling a backend revoke.
