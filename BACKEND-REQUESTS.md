# Backend requests for the new UI

**Status:** draft. Nothing here has been sent to a backend team yet.
**Written:** 2026-10-28, from a read-only scan of the new screens (`components/DemoApp1`, `NewLoginDesign/`).
**Plan:** `UI-MIGRATION-PLAN.md`.

## How to read this file

- The new screens show these things, but no backend gives the data or the action today.
- Every part of the new design ships (rule A-7 in `UI-MIGRATION-PLAN.md`). Until its backend item is done,
  a screen shows real data where it exists, empty where not, and "Soon available" on the action (rule A-8).
- Some items still depend on an open decision (`D-n` in `UI-MIGRATION-PLAN.md`). The decision can change
  the shape of the request. Do not send those items before the decision.
- **Confirm** means the app does not read the field today. The backend may already have it. Please confirm
  before building anything new.
- Backends are named by role: **core**, **gateway**, **chat**, **wallet**, **media**, **search** (Elasticsearch).
- Each stage adds to this file when it finds a new gap.

## Summary

| Backend | Items | Blocks stage |
|---|---|---|
| core | C-1 .. C-10 | 2 (login, name check), 4 (profile) |
| gateway | G-1 | 2 (login, QR only) |
| wallet | W-1 .. W-9 | 5 (wallet) |
| chat | CH-1 .. CH-7 | 6 (chat) |
| search | S-1 .. S-2 | 4 (address), 7 (search) |

---

## Core backend

| # | Screen | What we need | Today | Depends on |
|---|---|---|---|---|
| C-1 | Profile → Body | A **foot size** field on the profile (read and update), next to `tall` and `weight`. | No field anywhere. | — |
| C-2 | Profile → Personal info | **E-mail verification:** send a code to the new e-mail, then verify it. | E-mail is saved with no check. | — |
| C-3 | Profile → Client info | **Delete my account request** endpoint. | No endpoint. | — |
| C-4 | Profile → Client info | **Change my phone number request** endpoint, as a request, not an instant change. | Phone changes at once with an OTP (`/auth/phone/verify_otp`). | D-26 |
| C-5 | Profile menu | **Login history** list: date, device, place. | Nothing exists. | D-23 |
| C-6 | Profile → Client info | Client **status** (for example Active), **type** (for example Personal), **client since** (date or days), and **verified** flag on `/customer/info`. | **Confirm.** The app reads none of them. | D-31 |
| C-7 | Profile → Client ID | The **client id format** shown as `1012-3456`. Is it a new field, or a format of the numeric `id`? | `UserData.id` is a number. | — |
| C-8 | Wallet → history | If history stays on core `/customer/wallet/list`: per row **status** (success / blocked / waiting), **due time**, **currency**, **kind** (deposit / withdrawal / order / refund / cash-in request) and **note** (for example the office name). | The list gives `credit`, `debit`, `transaction_type.name`, `reference`, `order_id`, `created_at`. | W-2, D-34 |
| C-10 | Login → Enter name (sign-up) | **Name must match the wallet (rdb) KYC name.** `/customer/update-name` must check the name against the KYC name and answer with a clear field error when it does not match. Please say what happens to a user who has no KYC yet. | `/customer/update-name` takes any string. | D-15 |
| C-9 | Profile → Address | The new place picker has 4 levels: Province → District → Town → Street. How do they map to `province`, `city`, `town`, `street`, `building`? Is there a list source for District and Town? | Only provinces come from a search source. | D-30, S-1 |

## Gateway

| # | Screen | What we need | Today | Depends on |
|---|---|---|---|---|
| G-1 | Login → QR sheet | QR login endpoints: create, status, scanned, approve, deny, and the full sign-in credential bundle. **Already written in full in `docs/qr-login-backend-requirements.md`.** Do not repeat it; send that file. | No endpoints. The app uses a localStorage mock. | D-16 |

## Wallet backend

The new wallet design has much more than the wallet backend gives today. Today the app reads one balance
(country currency) from the wallet backend, and the history from core. **The design is the contract:** the
wallet ships with every screen of the design, and the backend is asked to give what the design shows.

**Status on 2026-10-28: no wallet backend works yet.** On staging the wallet backend answers `502` on
sign-in (AUTH-01). So the app's wallet keeps its mock data and its design for now (A-17 in
`UI-MIGRATION-PLAN.md`), and the app reads no wallet data. Each item below replaces part of that mock once
the wallet backend works. Until then, the balances, the history and the results of every wallet action that
shoppers see are mock values.

| # | Screen | What we need | Today | Depends on |
|---|---|---|---|---|
| W-1 | Wallet | **All balances at once**, one per currency (the design shows USD and SYP cards). | One balance, for the country currency only (`/wallets/my/balances/{currencyId}`). | D-32 |
| W-2 | Wallet → history | **Transaction list** from the wallet backend with: amount, currency, kind, status (success / blocked / waiting), due time, note, date, reference, paging. | The wallet transactions call is not used (parked in `services/wallet/index.ts`). | D-32, D-34 |
| W-3 | Wallet → receipt | **Receipt** for one transaction: receipt number, date, reference, amount, type, status, sender, receiver. | No endpoint. | D-32 |
| W-4 | Cash in → rdb | **Cash deposit code / QR** for a client, and its expiry. | No endpoint. | D-32 |
| W-5 | Cash in → "From my rdb" | **Request money from my rdb account** ("Connect & request"). | No endpoint. | D-32 |
| W-6 | Cash in → crypto | **Crypto top-up:** deposit address, network (USDT TRC 20, ETH), fee, minimum, expiry. | No endpoint. The demo fee of 10 % is invented. | D-32 |
| W-7 | Cash in / cash out | **Sham Cash, Syriatel Cash, Irsal** as cash-in and cash-out methods. | No endpoint. | D-32 |
| W-8 | Cash out | **Withdrawal:** cash withdrawal, withdrawal request with a WhatsApp OTP, authorized recipient (phone + full name), reference, "withdraw to my rdb", list of branches. Each submit must take an **idempotency key**. | No endpoint. | D-32 |
| W-9 | Wallet info | **Client wallet QR** content and the "request" action. | No endpoint. | D-32 |

Please also answer, once the wallet backend works: which balance is the truth, the wallet backend balance
or `wallet_balance` from core `/customer/wallet/list`? (D-34, parked until then)

## Chat backend

The chat backend already has edit, tags, reminders, archive, unread, forward, search and calls
(see `CHAT_API_CHANGES.md`). These are the new items only.

| # | Screen | What we need | Today | Depends on |
|---|---|---|---|---|
| CH-1 | Conversation | **Reactions:** add / remove one emoji on a message, a reactions field in `messages_of_channel`, and an FCM event when someone reacts. | Nothing exists. | — |
| CH-2 | Conversation | **Location message:** a new `message_type` with latitude, longitude and an optional label. | Types are text, image, video, voice, file, share product and calls. | — |
| CH-3 | Conversation → category | **Accept the 5 design labels** in `POST /api/v1/messages/{messageId}/tags`: `orders`, `payment`, `shipping`, `question`, `important`. The app keeps one label per message itself. Please confirm whether the current endpoint already accepts any string. `CHAT_API_CHANGES.md` says it accepts only the fixed list `urgent`, `important`, `todo`, `done`. | 4 fixed tags. | D-37 (decided: design labels) |
| CH-4 | Contact page | **Disable calls** from one contact (a per-contact setting). | No field or endpoint. | D-38 |
| CH-5 | Contact page | **Notification setting per contact** (design shows "ALWAYS"). Is this the same as mute? | **Confirm.** Mute exists per channel. | D-38 |
| CH-6 | Call screen | **Add a person to a live call.** | No endpoint. | D-39 |
| CH-7 | Chat list | **Typing / online status** on list rows: which source gives it? The app writes typing status to Firebase RTDB, but no reader was found. | **Confirm.** | — |

Known chat backend limits that the new search UI will show to users (already accepted, listed so nobody
reports them as new): `channelSearch` matches whole words of 3+ letters only, Arabic never matches, and a
new message is not found for more than 20 minutes.

## Search (Elasticsearch)

| # | Screen | What we need | Today | Depends on |
|---|---|---|---|---|
| S-1 | Profile → Address | **District and Town lists** under a province, and a street search, for the 4-level place picker. | Provinces only (`/api/addresses/get-provinces-by-iso`). | D-30, C-9 |
| S-2 | Search | **"For you" chips:** a personalised list of search chips for a user. | No source. | D-44 |
