# Login with a QR Code — Guide for the Web and App Teams

Ticket: [z8n6b62tw7](https://app.clickup.com/t/z8n6b62tw7) · Backend PR: [#690](https://github.com/jaffar-abbas-rammaz/trydos-inventory-backend/pull/690) · Date: 2026-11-14

This guide tells the web and app teams how to call the new QR login APIs. The backend part is done and waits for review.

---

## 1. The short version

There are two directions:

| Direction | Who shows the QR | Who scans | Who gets signed in |
|---|---|---|---|
| **A — the app signs in the web** | The browser (guest) | The signed-in app | The browser |
| **B — sign in a phone's app** | A signed-in device (web or app) | Another phone's app (guest) | That phone's app |

In both directions:

1. The **waiting side** (the side that will be signed in) makes a secret, then sends only its hash.
2. The **signed-in side** approves or denies.
3. The **waiting side** polls the status. When it is `approved`, it sends the secret **once** to `collect` and gets the tokens.

- A session lives **60 seconds**.
- After approval, the waiting side has **30 seconds** to call `collect`.

---

## 2. Common rules

### Base URL and headers
- All endpoints are under **`/api/v1/qr-login`**.
- Send the usual headers: `lang`, `country`, `Accept: application/json`.
- Send `Authorization: Bearer <token>` where the table says a token is needed.

### The secret (the waiting side makes it)
```js
// 32 random bytes -> base64url (43 characters)
const bytes  = crypto.getRandomValues(new Uint8Array(32));
const secret = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
// SHA-256 of the secret string, as 64 lowercase hex characters
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
const secretHash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
```
- `secret_hash` = SHA-256 hex (64 characters) of the **secret string**.
- Keep the secret only in memory. Do not log it, and do not put it in the QR code.
- `collect` accepts a secret of 32 to 128 characters.

### The QR content
- Use the `qr_payload` value from the create response as it is: `trydos://qr/web/<request_id>` or `trydos://qr/app/<request_id>`.
- It holds only the session id, never a token.

### Response format (the market API's usual format)
Success:
```json
{ "isSuccessful": true, "hasContent": true, "code": 200, "message": "ok", "detailed_error": null, "data": { } }
```
Error:
```json
{ "isSuccessful": false, "code": 409, "hasContent": false, "message": "Another user already scanned this code.", "detailed_error": [{ "message": "Another user already scanned this code." }], "data": null }
```
- **Use the HTTP status code to choose what to show. Do not show `message` to the user.**
- In the body, `code` is always `200` on success, even when the HTTP status is `201`. Read the HTTP status.

### HTTP codes

| Code | Meaning | What the client should do |
|---|---|---|
| 200 / 201 | OK | Continue |
| 401 | No token, or the token is wrong | Get a guest token or sign in again |
| 403 | Not allowed: a guest where a signed-in user is needed, not the owner, wrong secret or wrong secret hash | Show "not allowed" and stop |
| 404 | Unknown session | Make a new QR |
| 409 | Someone else was first, the session is already finished, or it was already collected | Show "used on another device" and stop |
| 410 | The session expired | Make a new QR |
| 422 | A field is missing or wrong. `detailed_error` is a list of `{code: <field>, message}` | Fix the request (a developer error) |
| 429 | Too many requests | Slow down |

### Statuses
`pending` → `scanned` (direction A) or `claimed` (direction B) → `approved` or `denied`. The status becomes `expired` after 60 seconds if it is not final.
- `approved`, `denied` and `expired` are final.
- Stop polling on a final status.

### Rate limit
- 60 requests per minute for each endpoint path and user (or IP).
- Polling every 2 seconds is 30 per minute, so it is safe.

---

## 3. Direction A — the app signs in the web

```
Browser (guest)                  Backend                          App (signed in)
  | web/create (secret_hash) ---->  |                                 |
  | <---- request_id, qr_payload    |                                 |
  | show QR, poll web/{id}/status   |  <---- web/{id}/scanned --------| (scan)
  |                                 |  ----> browser, os, city ...    |
  |                                 |  <---- web/{id}/approve --------| (user taps Approve)
  | status = approved               |                                 |
  | web/{id}/collect (secret) ----> |                                 |
  | <---- tokens of the app user    |                                 |
```

### 3.1 `POST /qr-login/web/create`
- **Caller:** the web server, with the browser's **guest token**.
- Read every value from the body. Do not read them from your own headers, because those headers describe the web server, not the browser. Every field except `secret_hash` can be `null`.

Request:
```json
{ "secret_hash": "9f2c…64 hex", "browser": "Chrome", "os": "Windows", "ip": "65.0.21.24", "country": "IN", "city": "Mumbai", "region": "Maharashtra" }
```

| Field | Rule |
|---|---|
| `secret_hash` | required, 64 hex characters |
| `browser`, `os`, `country`, `city`, `region` | optional, text, max 100 |
| `ip` | optional, a valid IPv4 or IPv6 |

Response **201**:
```json
{ "data": { "request_id": "3f1c2a7e-…", "qr_payload": "trydos://qr/web/3f1c2a7e-…", "expires_at": "2026-11-14T10:01:00Z" } }
```

### 3.2 `GET /qr-login/web/{request_id}/status`
- **Caller:** the web server, every 2 seconds.
- **No token is needed.** Send the header `X-QR-Secret-Hash: <secret_hash>`.

Response **200**: `{ "data": { "status": "pending" } }`. The status is `pending`, `scanned`, `approved`, `denied` or `expired`.
- A wrong or missing hash gives **403**.

### 3.3 `POST /qr-login/web/{request_id}/scanned`
- **Caller:** the app, with a **user token** (not a guest token).
- No body.
- Response **200**: the browser details to show on the "Approve this login?" screen.
```json
{ "data": { "browser": "Chrome", "os": "Windows", "city": "Mumbai", "region": "Maharashtra", "country": "IN", "expires_at": "2026-11-14T10:01:00Z" } }
```
- A guest gets **403**.
- The first user who scans owns the session. Another user gets **409**. If the same user scans again, they get 200.

### 3.4 `POST /qr-login/web/{request_id}/approve` and `/deny`
- **Caller:** the app, with the token of the **user who scanned**.
- No body.
- Response **200**: `{ "data": { "status": "approved" } }` (or `"denied"`).
- Another user gets **403**.
- Approving before the scan gives **403**.
- Approving after a decision gives **409**.

### 3.5 `POST /qr-login/web/{request_id}/collect`
- **Caller:** the web server, with the **same browser guest token** that created the session.
- Call it **once**, right after the status becomes `approved`, and within 30 seconds of the approval.

Request:
```json
{ "secret": "q1W…43 characters" }
```
Response **200**: the same `data` as `verify_otp_from_guest`, plus `qr_id_token`.
```json
{
  "data": {
    "already_exists": true,
    "Logged_in_from_another_device": false,
    "user_type": 1,
    "qr_id_token": "<qr id token>",
    "user": { "id": 1234, "name": "…", "phone": "+963…", "…": "the full user object" },
    "token": "<access token>",
    "expires_at": "14/11/2026 11:00:00",
    "refresh_token": "<refresh token>",
    "refresh_expires_at": "14/12/2026 10:00:00"
  }
}
```
- The tokens belong to the **app user**. Use them exactly like the OTP login answer.
- The guest's cart, addresses and saved items move into the account, as in the OTP login.
- Errors:
  - A different token than the creator's gives **403**.
  - A wrong secret gives **403**.
  - A second call gives **409**.
  - A session that is not approved gives **409**.
  - Calling too late gives **410**.

---

## 4. Direction B and app to app — sign in a phone's app

```
Signed-in device (web or app)     Backend                          Phone app (guest)
  | app/create ------------------>  |                                 |
  | <---- request_id, qr_payload    |                                 |
  | show QR, poll app/{id}/status   |  <---- app/{id}/claim ----------| (scan, secret_hash)
  | status = claimed + device_name  |                                 | poll app/{id}/status (X-QR-Secret-Hash)
  | app/{id}/approve -------------> |                                 |
  |                                 |                                 | status = approved
  |                                 |  <---- app/{id}/collect --------| (secret)
  |                                 |  ----> tokens of the signed-in user
```

The same endpoints serve the web server (direction B) and a signed-in app (app to app). The backend does not check which one is calling.

### 4.1 `POST /qr-login/app/create`
- **Caller:** the web server or a signed-in app, with a **user token**. A guest gets **403**.
- No body.
- Response **201**:
```json
{ "data": { "request_id": "7a9e4c21-…", "qr_payload": "trydos://qr/app/7a9e4c21-…", "expires_at": "2026-11-14T10:01:00Z" } }
```

### 4.2 `POST /qr-login/app/{request_id}/claim`
- **Caller:** the phone app, with its **guest token**.

Request:
```json
{ "secret_hash": "4b1d…64 hex", "device_name": "Alaa's iPhone", "platform": "ios" }
```

| Field | Rule |
|---|---|
| `secret_hash` | required, 64 hex characters |
| `device_name` | optional, max 100 |
| `platform` | optional, max 20 (for example `ios`, `android`) |

Response **200**: `{ "data": { "status": "claimed", "expires_at": "…" } }`
- The first claim wins. A second device gets **409**.

### 4.3 `GET /qr-login/app/{request_id}/status`
There are two callers:
- **The side that showed the QR** sends its **user token**. It gets:
  `{ "data": { "status": "claimed", "device_name": "Alaa's iPhone", "platform": "ios" } }`
- **The phone that claimed** sends `X-QR-Secret-Hash: <secret_hash>`. It gets: `{ "data": { "status": "approved" } }`
- Anyone else gets **403**.
- If the header is sent, the backend checks the hash first.

### 4.4 `POST /qr-login/app/{request_id}/approve` and `/deny`
- **Caller:** the side that showed the QR, with the token of the **user who created** the session.
- No body.
- Response **200**: `{ "data": { "status": "approved" } }` (or `"denied"`).
- Approving before a device has claimed gives **409**.
- Another user gets **403**.

### 4.5 `POST /qr-login/app/{request_id}/collect`
- **Caller:** the phone app, with the **same guest token** it used to claim.
- The request and the answer are the same as `web/collect`. The tokens belong to the user who created the session.

---

## 5. For the chat, stories and comments servers

### `POST /qr-login/verify-id-token`
- **Caller:** the chat, stories and comments **servers** only. Never a browser or the app.
- **Header:** `X-API-Key: <QR_LOGIN_SERVICE_KEY>`. DevOps gives you this key.

Request:
```json
{ "qr_id_token": "<qr id token>" }
```
Response **200**:
```json
{ "data": { "user_id": 1234, "phone": "+963900000000", "name": "Alaa" } }
```
Response **401**: `"Invalid or expired qr_id_token."` A wrong or missing `X-API-Key` also gives 401.

- The `qr_id_token` lives **60 seconds** from `collect`. It can be checked several times in that time, so the 3 service logins all work.
- It is **not** the OTP `id_token`. The OTP backend does not know it.

---

## 6. Checklist for the clients

- [ ] Make a new secret for every QR. Never reuse it.
- [ ] Refresh the QR (call create again) when you get **410**, or when `expires_at` has passed.
- [ ] Poll every 2 seconds. Stop on `approved`, `denied` or `expired`.
- [ ] Call `collect` only once, right after `approved`.
- [ ] On the approve screen, show the browser or device details, so the user can see where they are signing in.
- [ ] Use the HTTP status code to choose the message. Do not show `message`.
- [ ] Use the tokens from `collect` like the OTP login answer, including the refresh token.

## 7. Open points (to confirm with the PM)
1. After approval, the waiting side has **30 seconds** to collect. The ticket did not set this window.
2. The guest bag is merged only when the collecting side is a guest.
3. A `qr_id_token` can be checked several times within its 60 seconds.
