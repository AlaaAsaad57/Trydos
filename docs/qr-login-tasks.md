# QR login: tasks for each developer

**Status:** proposal, nothing is built yet.

This file splits [qr-login-flows.md](qr-login-flows.md) into tasks for each developer. It
follows the recommendation in that file: **polling, both directions (A + B)**.

- **Direction A:** the signed-in app signs in the web.
- **Direction B:** the signed-in web signs in the app.

In both directions, the web shows the QR and the app scans it.

The paths below are a proposal. The market backend developer can rename them, but all
developers must agree on the final names on day 1.

The paths, fields and statuses follow the fake QR service that exists today
(`services/qrLogin/index.ts`), so the web change stays small.

## Shared rules

- **Statuses:** `pending`, `scanned` (A) or `claimed` (B), `approved`, `denied`, `expired`.
- **QR content:** `trydos://qr/<request_id>`. The QR holds only this ID, never a token.
- **Session life:** 60 seconds.
- **Errors, the same everywhere:**

| Code | When |
|---|---|
| 400 | A field is missing or wrong |
| 401 | The token is missing or expired |
| 403 | A guest tries to approve, or the secret is wrong, or the user doesn't own the session |
| 404 | No session has this ID |
| 409 | Someone else already scanned or claimed the QR, or the tokens were already collected |
| 410 | The session expired |
| 429 | Too many requests |

---

## 1. Market backend developer

*In `qr-login-flows.md`, this backend is called "Inventory". Estimate: 2–3.5 days.*

### Direction A: the app signs in the web

**`POST /qr-login/web/create`**

- **Caller:** the web server, with the browser's guest token.
- **Takes:** `secret_hash`, `browser`, `os`, `ip`. The backend finds the city from the IP.
- **Returns:** `request_id`, `qr_payload`, `expires_at`.

**`GET /qr-login/web/{request_id}/status`**

- **Caller:** the web server, every 2 seconds.
- **Takes:** `secret_hash`, so only the browser that made the QR can read the status.
- **Returns:** `status`. After approval, it also returns `user.name` and `user.image`
  for the welcome text.

**`POST /qr-login/web/{request_id}/scanned`**

- **Caller:** the app, with a verified user token.
- **Takes:** nothing in the body.
- **Returns:** `browser`, `os`, `city`, `expires_at`. The app shows these on the approve
  screen.
- **Rules:** the first scan wins, and a second device gets 409. A guest token gets 403.

**`POST /qr-login/web/{request_id}/approve`**

- **Caller:** the app, with a verified user token.
- **Takes:** nothing.
- **Returns:** `ok`.
- **Rules:**
  - The backend takes the account from the token, never from the body.
  - Only the user who scanned the QR can approve.
  - The backend creates no tokens at this step.

**`POST /qr-login/web/{request_id}/deny`**

- **Caller:** the app, with a verified user token.
- **Returns:** `ok`.

**`POST /qr-login/web/{request_id}/collect`**

- **Caller:** the web server.
- **Takes:** the raw `secret` and the browser's guest token.
- **Returns:** `access_token`, `refresh_token`, `id_token`, `user`.
- **Rules:**
  - The status must be `approved`.
  - The hash of `secret` must match `secret_hash`.
  - The endpoint works only once. A second call gets 409.
  - The backend creates new tokens for this browser only.
  - The backend merges the guest bag into the account.
  - The tokens include no wallet access.
  - The backend sends a "new sign-in" push to the user's other devices.

### Direction B: the web signs in the app

**`POST /qr-login/app/create`**

- **Caller:** the web server, with the signed-in user's token.
- **Takes:** nothing.
- **Returns:** `request_id`, `qr_payload`, `expires_at`.
- **Rule:** a guest gets 403.

**`POST /qr-login/app/{request_id}/claim`**

- **Caller:** the signed-out app, with its guest token.
- **Takes:** `secret_hash`, `device_name`, `platform` (iOS or Android).
- **Returns:** `expires_at`.
- **Rule:** the first claim wins, and a second device gets 409.

**`GET /qr-login/app/{request_id}/status`**

The web and the app both call this endpoint, every 2 seconds.

- **The web** sends the user's token. It gets back `status`, plus `device_name` and
  `platform` after a claim.
- **The app** sends its `secret_hash`. It gets back `status` only.

**`POST /qr-login/app/{request_id}/approve`** and **`POST /qr-login/app/{request_id}/deny`**

- **Caller:** the web server, with the user's token.
- **Returns:** `ok`.
- **Rules:** only the user who made the QR can call these. The backend creates no tokens
  at approval.

**`POST /qr-login/app/{request_id}/collect`**

- **Caller:** the app.
- **Takes:** the raw `secret` and the app's guest token.
- **Returns:** `access_token`, `refresh_token`, `id_token`, `user`.
- **Rules:** the same as collect in Direction A. That means one use only, new tokens,
  guest bag merge, no wallet, and a "new sign-in" push.

### Rate limits

- **Create:** at most 10 for each IP or user per minute.
- **Status:** at most 1 for each session per second.
- **Scanned, claim, approve and deny:** at most 10 for each user or device per minute.

---

## 2. Stories, chat and comments developers

*Estimate: 0.5–1 day each.*

The work is the same for each service. **Build no new API.** Test the existing sign-in
endpoint that takes `id_token`.

1. Sign in with an `id_token` from a QR login. The endpoint must return a token pair.
2. Sign in to the same account from a second device. The first device must stay signed
   in, and its refresh must still work.
3. Change code only if test 1 or test 2 fails.

---

## 3. Web developer

*Estimate: 2–3.5 days.*

Build these routes on the web server. The browser calls only these routes, never the
market backend.

### Direction A: the signed-out web

**`POST /api/qr-login/create`**

- The route makes a random secret and saves it in an HttpOnly cookie that lives
  60 seconds.
- The route calls `web/create` with the hash of the secret.
- **Returns to the browser:** `request_id`, `qr_payload`, `expires_at`.

**`GET /api/qr-login/status?id=...`**

- The route calls `web/status` and passes on `status` and `user`.

**`POST /api/qr-login/complete`**

- The browser calls this route when the status is `approved`.
- The route calls `web/collect` with the secret from the cookie.
- The route signs in to chat, stories and comments with `id_token`.
- The route saves every token in HttpOnly cookies, the same way OTP login does.
- The route deletes the secret cookie.
- **Returns to the browser:** `user` only, never a token.

**Screen work**

- Show the real QR on the login screen.
- Make a new code when the old one expires. After 3 codes, show "Show a new code".

### Direction B: the signed-in web

- **`POST /api/qr-login/device/create`:** calls `app/create` with the user's token.
- **`GET /api/qr-login/device/status?id=...`:** calls `app/status` and passes on
  `status`, `device_name` and `platform`.
- **`POST /api/qr-login/device/approve`** and **`POST /api/qr-login/device/deny`:** call
  the market backend with the user's token.

**Screen work**

- In Settings, the QR icon opens the QR. Show the icon on computers too.
- After a claim, show the approve sheet with the device name.

### General

- OTP login and QR login use the same sign-in steps.
- Remove the web camera scanner.
- Add all new text in `ar`, `tr` and `ku`.
- Add tests.

---

## 4. App developer

*Estimate: 2–3.5 days. This estimate is the least certain, because nobody read the app
code.*

**Build the same screens the web has today, and make them look and work the same way.**

| Web screen | File | What the app copies |
|---|---|---|
| QR scanner | `components/Login/QrScannerModal.tsx` | The camera screen, its frame and its error text |
| Approve sheet | `components/Login/QrApprovalSheet.tsx` | Browser, system, city, Approve and Deny |
| QR login screen | `components/Login/Enhanced/screens/QrLoginScreen.tsx` | The waiting state and the expired and denied messages |

### Direction A: the signed-in app

1. Add a "Switch web" button that opens the scanner.
2. Read the QR and take the `request_id` from `trydos://qr/<request_id>`.
3. Call `web/scanned`, then show the approve sheet with `browser`, `os` and `city`.
4. Show a 60-second countdown. When the time ends, close the sheet with an "expired"
   message.
5. Approve calls `web/approve`. Deny calls `web/deny`.
6. Show a "done" message. The app stays signed in.

### Direction B: the signed-out app

1. Add "Sign in with QR" on the login screen. The button opens the scanner.
2. Make a random secret and keep it in memory only.
3. Call `app/claim` with the hash of the secret, `device_name` and `platform`.
4. Show a waiting screen with the text "Approve on the web", and call `app/status` every
   2 seconds.
5. When the status is `approved`, call `app/collect` with the secret and the guest token.
6. Save the tokens the same way OTP login saves them. Then sign in to chat, stories and
   comments with `id_token`.
7. Handle each error with its own message:
   - `denied`
   - `expired`
   - 409: "someone else already scanned this code"

---

## 5. QA

- Test both directions on two real devices.
- Check that deny, expiry and "a second device scans the same QR" each show the right
  message.
- Check that the guest bag merges into the account.
- Check that the first device stays signed in.
- Check all 3 languages.

---

## Order of work

1. **Day 1:** the market backend, web and app developers agree on the paths and fields.
   The stories, chat and comments developers run their checks.
2. **Days 2–4:** the market backend, web and app developers build at the same time.
3. **Last days:** everyone tests on two real devices and fixes problems. Both directions
   ship in one app release.
