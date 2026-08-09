# CO-09 — Mobile Confirmation (pre-order)

| | |
|---|---|
| **Feature ID** | CO-09 |
| **Domain** | B · Cart, Checkout & Orders |
| **Status** | 🟢 Live |
| **Last verified** | 2026-07-04 (against `develop`) |
| **Source of truth** | `components/Login/Enhanced/InlineVerifyPanel.tsx`, `components/Login/Enhanced/usePhoneVerifyFlow.ts`, `components/Cart/OrderButton.tsx`, `services/auth.ts`, `serverActions/sendOtp.ts` |

---

## What it is

A **phone-verification gate at checkout** — before a guest or unverified shopper can place an order,
they must confirm their mobile number with a one-time code (OTP). It reuses the login OTP building
blocks, so confirming here also **signs the shopper in**.

## Where it appears

In the checkout flow (the "Confirm Order" widget). If the shopper is a guest or their phone is
unverified, the confirmation UI opens before the order can proceed. The same component doubles as the
app-wide re-authentication popup.

## Who uses it

**Guests and phone-unverified users** at the point of ordering. Already-verified logged-in shoppers
skip it.

## How it works (verified behaviour)

- **When it triggers.** The checkout opens the confirmation when there's no logged-in user *or* the
  profile's `is_phone_verified === 0`. In addition, the place-order step re-checks phone verification
  and blocks with *"Please Verify Your Phone Number"* if still unverified.
- **Step machine.** Enter phone → choose delivery channel (**SMS or WhatsApp**) → enter the OTP. If
  the shopper already has a number on file, it pre-fills and jumps straight to the channel step.
- **Sending the code** goes through a Next.js **server action** that rate-limits first, then calls
  the backend; a resend cooldown (default ~120 s, server-driven) is enforced and mirrored on the
  client.
- **Verifying** hits the same endpoint as guest login and, on success, **fully logs the shopper in**
  (sets `is_phone_verified: 1` and a session) — this is not a lightweight one-off check. It then
  refreshes and continues to the order.
- **On failure** the pins clear and re-prompt after ~1 s.

## Data source

| Item | Value |
|------|-------|
| Send OTP | `POST /auth/phone/send_otp` via `sendOtpAction` (server action, rate-limited) → backend |
| Verify OTP | `GET /api/auth/login?verificationId=…&otp=…&name=…` (local Next.js route → backend) |
| Cooldown | Server returns `lockSeconds` (default ~120s); client `lockNumber` mirror |
| Backend | Send OTP → market backend; verify shares the **login** path (`VERIFY_OTP_FROM_GUEST`) |

## Technical reference

| Item | Value |
|------|-------|
| Confirmation UI | `components/Login/Enhanced/InlineVerifyPanel.tsx` — the verify flow compressed into the cart footer's expanded button; built from the Enhanced `ui/` primitives, with the send/verify/resend logic in the shared `components/Login/Enhanced/usePhoneVerifyFlow.ts` hook (also used by `VerifyPhoneFlow`, the fullscreen re-auth/session-expired/settings surfaces) |
| Checkout trigger | `components/Cart/OrderButton.tsx` (opens when guest / `is_phone_verified === 0`) |
| Hard gate | `components/Cart/PlaceOrderButtons.tsx`, `components/Cart/OrdersPage.tsx` (re-check before submit) |
| Re-auth reuse | `components/Login/ConfirmMobilePhoneWidget.tsx` (mounted from `NavbarClient.tsx`) |
| Service / action | `services/auth.ts` (`SendOtp`, `VerifyOtp`), `serverActions/sendOtp.ts` |

## Current status & maturity

**Live and stable.** The OTP confirmation blocks unverified checkout and integrates with the login
system. See AC-04 / AC-08 for the underlying OTP entry and resend/rate-limiting.

## Known gaps / notes

- **It's effectively a full login/registration, not a lightweight phone check** — verifying calls the
  login path and establishes a session with `is_phone_verified: 1`.

- **`send_otp` / `resend_otp` GA/PostHog events** fire from the shared `usePhoneVerifyFlow` hook (not this component directly) — see `docs/posthog-otp-abuse-insight.md`.

## Related features

CO-11 (Place order — gated by this) · AC-02 / AC-03 / AC-04 (Phone entry, SMS/WhatsApp choice, OTP
verify) · AC-08 (Resend & rate limiting) · AC-12 (Guest → verified upgrade).
