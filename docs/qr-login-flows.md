# QR login: flows and estimate

**Status:** proposal, nothing is built yet.

In both directions, **the web shows the QR and the app scans it**.

- **Direction A:** the signed-in app signs in the web.
- **Direction B:** the signed-in web signs in the app.

## 1. Direction A: sign in to the web from the app

1. The signed-out web shows a QR on the login screen.
2. In the signed-in app, the user taps "Switch web" and scans the QR.
3. The app shows the browser, system and city, with Approve and Deny.
4. The user taps Approve in the app.
5. The Next.js server collects new tokens from inventory.
6. The Next.js server signs in to chat, stories and comments with `id_token`.
7. The Next.js server sets the tokens as HttpOnly cookies. The web is now signed in.

The guest bag on the web merges into the account. The app stays signed in.

```mermaid
sequenceDiagram
    participant W as Web (signed out)
    participant N as Next.js server
    participant I as Inventory
    participant A as App (signed in)

    W->>N: Create QR
    N->>I: Create session
    I-->>W: requestId (shown as a QR)
    A->>I: Scanned
    A->>I: Approve
    W->>N: Status is approved, complete the login
    N->>I: Collect (secret, guest token)
    I-->>N: New tokens
    N->>N: Sign in to chat, stories, comments
    N-->>W: HttpOnly cookies
```

## 2. Direction B: sign in to the app from the web

1. The signed-in web user opens Settings and taps the QR icon. The web shows a QR.
2. The signed-out app scans the QR.
3. The web shows the device name, with Approve and Deny.
4. The user taps Approve on the web.
5. The app collects new tokens directly from inventory.
6. The app signs in to chat, stories and comments with `id_token`. The app is now signed in.

The web stays signed in.

```mermaid
sequenceDiagram
    participant W as Web (signed in)
    participant N as Next.js server
    participant I as Inventory
    participant A as App (signed out)

    W->>N: Tap the QR icon in Settings
    N->>I: Create session
    I-->>W: requestId (shown as a QR)
    A->>I: Claim (secret hash, device name)
    W->>N: Approve
    N->>I: Approve
    A->>I: Collect (secret, guest token)
    I-->>A: New tokens
    A->>A: Sign in to chat, stories, comments
```

## 3. How the waiting side learns the result

In both directions, one side must wait for the other. There are two ways to do this.

### Flow 1: polling

The waiting side asks for the status every 2 seconds.

- **Delay:** up to 2 seconds.
- **Works on:** every browser, with no permission.
- **Direction A calls:** 30 for each QR, and 90 at most because the QR stops after 3 codes.

### Flow 2: FCM notification

Inventory sends a push when the status changes. The waiting side then asks for the status.

- **The push is only a signal.** It holds the `requestId`, with no tokens and no status.
- **Polling stays as a backup,** every 10 seconds, because a push can be late or lost.
- **The web needs notification permission to get an FCM token.** Without it, the web
  polls every 2 seconds, exactly as in Flow 1.
- **Do not ask for the permission on the login screen.** It adds a step that sign-in
  doesn't need.

### Comparison

| | Flow 1: polling | Flow 2: FCM |
|---|---|---|
| Delay when FCM is available | Up to 2 s | Usually shorter, not guaranteed |
| Delay when FCM isn't available | Up to 2 s | Up to 2 s |
| Delay if a push is lost | Not relevant | Up to 10 s |
| Calls for each QR | 30 | 6 with FCM, 30 without |
| Paths to test | 1 | 2 |
| Automatic testing | Full | Real push must be tested by hand |
| Extra work | None | About 3 person-days |

## 4. Rules for both directions

**Session**

- A session lasts 60 seconds, and inventory enforces the limit.
- The QR holds only a random `requestId`, never a token.
- The first scan wins. A second device gets an error.
- Approved, denied and expired are final.
- The QR stops after 3 codes, and the user then taps "Show a new code".

**Tokens**

- Each device gets its own new tokens. Refresh tokens are single-use, so two devices
  can't share a pair.
- Inventory returns the tokens only to the side that proves the secret, and only once.
- Inventory creates the tokens at collect, not at approve.
- Collect must return `refresh_token`. Access tokens live 60 seconds, so without it the
  session ends after about 1 minute.
- Tokens never reach browser JavaScript.

**Accounts**

- Only verified users can approve. Guests also have a token, so inventory must refuse them.
- Inventory takes the account from the token, never from the request body.
- Collect takes the guest token, so the guest bag can merge.
- A QR login doesn't sign in to the wallet, because a scan shouldn't reach money.
- Each sign-in sends a "new sign-in" push to the user's other devices.

## 5. What each developer builds

**Inventory**

- Session storage and rate limits.
- Direction A endpoints: create, status, scanned, approve, deny, collect.
- Direction B endpoints: create for a signed-in user, claim, status, approve, deny, collect.
- Token creation and guest bag merge.
- Flow 2 only: send the pushes.

**Web**

- Replace the fake QR service with real Next.js routes.
- Add a secret in an HttpOnly cookie to prove which browser made the QR.
- Share the login steps between OTP login and QR login.
- Change the Settings QR icon so it opens a QR, and show it on computers too.
- Reuse the existing QR and approve components, and remove the web camera scanner.
- Add text in `ar`, `tr` and `ku`, then add tests.
- Flow 2 only: send the FCM token and handle the push.

**Flutter**

- Direction A: "Switch web" button, camera, approve screen.
- Direction B: scan from the login screen, claim, wait, collect, sign in to the services.
- Flow 2 only: handle the push.

**Chat, stories and comments**

- Check that `id_token` from a QR login works.
- Check that a new login doesn't end the session on the other device.
- Change code only if a check fails.

**QA**

- Test two devices, deny, expiry, guest bag and 3 languages.
- Flow 2 only: test each permission state and hidden tabs.

## 6. Estimate

This estimate assumes that **every developer uses a Claude agent**. That includes the
chat, stories and comments developers, and QA. The agent writes the code, the tests and
the translations, and reads the logs to find bugs.
These numbers are judgment, not measurement, because we have no timing from a similar
feature. Confirm them after the first few days of work.

**Assumptions**

- One developer for each role, with no other work.
- Every developer uses a Claude agent, working on one task at a time.
- A developer reads and approves every change before it merges.
- Inventory can issue `id_token` without an OTP.
- The wallet is left out.
- The agent has access to each repo. The Flutter numbers are the least certain, because
  we didn't read that code.

### Person-days

| Who | Polling, A only | Polling, A + B | FCM, A + B |
|---|---|---|---|
| Inventory | 1.5–2.5 | 2–3.5 | 2.5–4 |
| Web | 1.5–2.5 | 2–3.5 | 3–4.5 |
| Flutter | 1–2 | 2–3.5 | 2.5–4 |
| Chat | 0.5–1 | 0.5–1 | 0.5–1 |
| Stories | 0.5–1 | 0.5–1 | 0.5–1 |
| Comments | 0.5–1 | 0.5–1 | 0.5–1 |
| QA | 1–2 | 1.5–2.5 | 2.5–3.5 |
| **Total** | **6.5–12** | **9–16** | **12–19** |

### Working days

Inventory, web and Flutter work at the same time, so the build phase is as long as the
busiest developer's work.

| Phase | Polling, A only | Polling, A + B | FCM, A + B |
|---|---|---|---|
| Agree the API, check `id_token` | 0.5–1.5 | 0.5–1.5 | 0.5–1.5 |
| Build | 1.5–2.5 | 2–3.5 | 3–4.5 |
| Test together and fix | 1.5–2 | 2–3 | 3–4 |
| **Total** | **3.5–6** | **4.5–8** | **6.5–10** |
| **In weeks** | 1 | 1–1.5 | 1.5–2 |

App store review is extra. Both directions need app screens, so ship them in one release.

## 7. Recommendation

**Build polling for both directions.**

- FCM still needs polling, so it adds work and replaces nothing.
- FCM saves at most about 2 seconds, and only where it is available.
- FCM can be added later if real data shows that polling is a problem.
