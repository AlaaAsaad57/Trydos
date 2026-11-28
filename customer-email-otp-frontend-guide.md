# Verify a Customer Email with a Code — API Contract for the Web and App Teams

ClickUp: [z8n6b62d9f](https://app.clickup.com/t/z8n6b62d9f) · Backend PRs: #697 (merged into `develop`), #698 (`is_email_verified` in the customer object) · 2026-11-18

## 1. The short version

A signed-in customer can add or change their email by proving they own it:

1. The app sends the email to **`POST /api/v1/customer/email/send-otp`**.
2. The backend emails a **6-digit code** to that address. The code works for **10 minutes**.
3. The customer types the code. The app sends the email and the code to **`POST /api/v1/customer/email/verify-otp`**.
4. With the right code, the email is saved on the account as verified, and the response holds the updated customer.

The email on the account changes **only** at step 4. Until then, the old email stays.

```
Enter email ──► send-otp ──► (email with code) ──► enter code ──► verify-otp ──► done
                   │                                                   │
                   └─ 409 / 429 / 403                                  └─ 422 wrong code (try again)
                                                                          410 expired / 404 no code → ask for a new code
```

---

## 2. Common rules

### Base URL and headers
- Both endpoints are under **`/api/v1/customer/email`**.
- Both need the customer's token: `Authorization: Bearer <access_token>`.
- Send the usual headers: `lang`, `country`, `Accept: application/json`, `Content-Type: application/json`.

### Response format (the market API's usual format)
Success:
```json
{ "isSuccessful": true, "hasContent": true, "code": 200, "message": "ok", "detailed_error": null, "data": { } }
```
Error:
```json
{ "isSuccessful": false, "code": 409, "hasContent": false, "message": "This email is used by another account.", "detailed_error": [{ "message": "This email is used by another account." }], "data": null }
```
- **Use the HTTP status code to choose what to show. Do not show `message` to the user**; it is English and only for developers.
- Some errors put extra values in `data` (see each endpoint).

### HTTP codes

| Code | Endpoint | Meaning | What the app should do |
|---|---|---|---|
| 200 | both | OK | Continue |
| 401 | both | No token, or the token is wrong | Sign in again |
| 403 | both | The account is a guest | Ask the customer to sign in with their phone first |
| 404 | verify-otp | No code is waiting for this email (never sent, already used, replaced by a newer code, or killed after 5 wrong codes) | Show "ask for a new code" |
| 409 | both | The email belongs to another account, or it is already this account's verified email | Show "this email is already in use" / "already verified" |
| 410 | verify-otp | The code expired (10 minutes) | Show "the code expired, ask for a new one" |
| 422 | verify-otp | Wrong code. `data.attempts_left` says how many tries are left | Show "wrong code" and the tries left |
| 422 | both | A field is missing or invalid. `detailed_error` is a list of `{code: <field>, message}` | Fix the request (a developer error) |
| 429 | send-otp | A new code was asked too soon. `data.retry_after_seconds` | Disable "resend" for that many seconds |
| 429 | both | Rate limit: more than 10 calls a minute (see below) | Wait and try again |

### Rate limits
- **Resend wait:** a new code can be asked only `resend_after_seconds` after the last one (120 seconds today; it comes from a backend setting, so read the value from the response, do not hard-code it). Earlier asks return **429 in the usual format**, with `data.retry_after_seconds`.
- **Request limit:** both endpoints together allow **10 calls a minute per customer**. Over that, the server returns **429 in Laravel's own format, not the usual one**: `{ "message": "Too Many Attempts." }`, with a `Retry-After` header (seconds). Handle 429 by the HTTP status and do not expect `isSuccessful` in that case.

### Who counts as a guest
Both endpoints refuse a guest with 403. An account counts as a guest only when **both** are true: it is marked as a guest, and it has **no** verified phone in the `+` form (for example `+963900000000`). A customer who verified their phone is never refused.

### The email
- The backend trims spaces and saves the email in **lowercase**. `data.email` and `data.user.email` show the saved form.
- Max length: 191 characters.

---

## 3. `POST /api/v1/customer/email/send-otp`

Sends a new code to the email. Only the **newest** code works: asking again makes the previous code useless.

### Request
```json
{ "email": "new.address@example.com" }
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | A valid email, max 191 characters |

### 200 — the code was sent
```json
{
  "isSuccessful": true, "hasContent": true, "code": 200, "message": "ok", "detailed_error": null,
  "data": {
    "email": "new.address@example.com",
    "expires_at": "2026-11-18T14:31:14Z",
    "resend_after_seconds": 120
  }
}
```

| Field | Meaning |
|---|---|
| `email` | The address the code was sent to (trimmed, lowercase) |
| `expires_at` | When the code stops working, UTC ISO 8601 (10 minutes after sending) |
| `resend_after_seconds` | How long to wait before "resend" is allowed |

### Errors

**409 — email used by another account**
```json
{ "isSuccessful": false, "code": 409, "hasContent": false, "message": "This email is used by another account.", "detailed_error": [{ "message": "This email is used by another account." }], "data": null }
```

**409 — already verified on this account**
```json
{ "isSuccessful": false, "code": 409, "hasContent": false, "message": "This email is already verified on your account.", "detailed_error": [{ "message": "This email is already verified on your account." }], "data": null }
```

**429 — too soon**
```json
{ "isSuccessful": false, "code": 429, "hasContent": false, "message": "Wait before asking for a new code.", "detailed_error": [{ "message": "Wait before asking for a new code." }], "data": { "retry_after_seconds": 87 } }
```

**403 — guest**
```json
{ "isSuccessful": false, "code": 403, "hasContent": false, "message": "A guest account cannot verify an email.", "detailed_error": [{ "message": "A guest account cannot verify an email." }], "data": null }
```

**422 — invalid email**
```json
{ "isSuccessful": false, "code": 422, "hasContent": false, "message": "The email field must be a valid email address.", "detailed_error": [{ "code": "email", "message": "The email field must be a valid email address." }], "data": null }
```

**401 — no token**
```json
{ "isSuccessful": false, "code": 401, "hasContent": false, "message": "Unauthorized.", "detailed_error": [{ "code": "auth-001", "message": "Unauthorized." }], "data": null }
```

---

## 4. `POST /api/v1/customer/email/verify-otp`

Checks the code. With the right code, the email is saved on the account with `is_email_verified = 1`.

### Request
```json
{ "email": "new.address@example.com", "code": "048213" }
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | The same email that was sent to `send-otp` |
| `code` | string | yes | Exactly 6 digits. **Send it as a string**, so a leading `0` is kept |

### 200 — the email is verified and saved
```json
{
  "isSuccessful": true, "hasContent": true, "code": 200, "message": "ok", "detailed_error": null,
  "data": {
    "user": {
      "id": 1234,
      "name": "Sara Ali",
      "phone": "+963900000000",
      "alternative_phone": null,
      "email": "new.address@example.com",
      "gender": { "value": 2, "name": "Female" },
      "tall": null,
      "weight": null,
      "foot_size": null,
      "image": null,
      "is_phone_verified": 1,
      "is_email_verified": 1,
      "is_allowed_to_upload_story": 0,
      "is_approve_policies": 1,
      "last_otp_id_token": "…",
      "created_at": "2026-01-10T09:12:00.000000Z"
    }
  }
}
```
`data.user` is the same customer object as `data.customer_info` from `GET /api/v1/customer/info`. Replace the stored customer with it.

`is_email_verified` (0 or 1) is new in the customer object (PR #698). It shows in every response that returns the customer: login, QR login, customer info and verify-otp. Use it to show a "verified" badge or a "verify your email" prompt.

### Errors

**422 — wrong code**
```json
{ "isSuccessful": false, "code": 422, "hasContent": false, "message": "The code is not correct.", "detailed_error": [{ "message": "The code is not correct." }], "data": { "attempts_left": 4 } }
```
- Each code allows **5 tries**. When `attempts_left` is `0`, the code is dead: the next try returns 404, even with the right code. Ask for a new code.
- Tell a wrong-code 422 from a validation 422 by `data.attempts_left` (only the wrong-code error has it).

**410 — expired**
```json
{ "isSuccessful": false, "code": 410, "hasContent": false, "message": "The code expired. Ask for a new code.", "detailed_error": [{ "message": "The code expired. Ask for a new code." }], "data": null }
```

**404 — no code waiting**
```json
{ "isSuccessful": false, "code": 404, "hasContent": false, "message": "No code is waiting for this email. Ask for a new code.", "detailed_error": [{ "message": "No code is waiting for this email. Ask for a new code." }], "data": null }
```

**409 — the email was taken by another account after the code was sent**
Same body as the 409 of `send-otp`. The account email does not change.

**422 — invalid input**
```json
{ "isSuccessful": false, "code": 422, "hasContent": false, "message": "The code field must be 6 digits.", "detailed_error": [{ "code": "code", "message": "The code field must be 6 digits." }], "data": null }
```

**403 / 401:** same as `send-otp`.

---

## 5. The email the customer receives
- Subject: **"Email Verification"**.
- The body says "Verify your email." and shows the code as **"Token : 048213"**.
- It is sent from the server's mail queue, so it can take a few seconds. If it does not arrive, the customer can resend after `resend_after_seconds`.

---

## 6. Checklist for the apps
- [ ] Send `code` as a **string** of 6 digits.
- [ ] Use `resend_after_seconds` from the response for the resend timer; on a 429, use `data.retry_after_seconds` (usual format) or the `Retry-After` header (rate limit).
- [ ] Show `attempts_left` after a wrong code; after it reaches 0, send the customer back to "send code".
- [ ] On 404 or 410, offer "send a new code".
- [ ] On 403, ask the customer to sign in with their phone first.
- [ ] After 200, replace the stored customer with `data.user`.
- [ ] Choose messages by HTTP status, not by `message`.

---

## 7. Coming next
1. **The profile update no longer changes the email** (PR #699, ticket [z8n6b6343k](https://app.clickup.com/t/z8n6b6343k)). `POST /api/v1/customer/update-profile` with an email **different** from the current one returns **400**, `detailed_error.email[0]` = "Verify the new email with a code to change your email.", and **nothing** in that request is saved (not the other fields either). Sending the same email (any case), no email, null or empty works as before. Move any "edit email" screen to this flow, and do not send `email` from the profile form.

