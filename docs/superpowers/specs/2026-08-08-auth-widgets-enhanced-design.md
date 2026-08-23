# Auth widgets on the Enhanced components — design

The Enhanced (rdb) auth UI ships only in the main login widget. Three other
surfaces still run the old UI, and they all share the same three legacy
components. This design moves every surface onto the Enhanced components and
deletes what that leaves dead.

## What is on the old UI today

Four call sites, not three. The fourth is the one that changes the shape of the
work.

| # | Surface | Host | Trigger |
|---|---------|------|---------|
| 1 | Cart "Confirm & Continue" | `components/Cart/OrderButton.tsx:632` — inline 200px panel inside the cart footer | `option` state, set when the shopper is unverified |
| 2 | Re-auth / unauthorized | `components/Login/ConfirmMobilePhoneWidget.tsx` — centred card portaled to `<body>` | `shouldAuthinticated` truthy |
| 3 | Session expired | `components/Login/SessionExpiredWidget.tsx` — centred card portaled to `<body>` | `shouldAuthinticated === "expired"` |
| 4 | Change / verify phone | `components/settings/ConfirmMobileChange.tsx`, hosted by **two** near-duplicate `ConfirmationModal`s | settings save with a new phone, or "Verify Now" |

All four end up in `PhoneInput` → `SendMethod` → `LogInPins`.

The two hosts for #4 are `components/settings/PersonalInfo.tsx` (used by
`setting/profile/VerifyUser.tsx`) and a second copy inlined at the bottom of
`components/setting/profile/PersonalInfoForm.tsx`. They differ only in the close
icon.

### Rules each surface carries

These must survive the port.

- **#1 cart** — no signup path. Phone step is skipped when the account already
  has a number. Success calls `GoToOrders(true)`.
- **#2 re-auth** — `shouldAuthinticated` doubles as the marker value:
  `"open Story"` / `"open chat"` fire their action on success, `"seller"` and
  `"expired-login"` change the dismiss behaviour, `"expired-login"` also preloads
  `expiredSessionPhone` (the fresh guest profile has no phone). Dismissing
  without verifying clears `STORIES-TOKEN` via `/api/auth/clear-tokens`
  (`keepalive`), then reloads — or redirects home on seller routes. The verify
  flow reports `VERIFY_FLOW_OPENED` and, from checkout,
  `VERIFY_COMPLETED_RETURNED_TO_CHECKOUT`.
- **#3 expired** — Login re-arms the marker as `"expired-login"` (or `"seller"`);
  Continue as Guest sets `reAuthResult: "cancelled"` and reloads.
- **#4 change phone** — two modes. `forVerify: true` verifies the number already
  on record via `AuthService.VerifyOtp`. `forVerify: false` verifies a *new*
  number via `AuthService.VerifyOtpForUpdatePhone`, which returns the `id_token`
  that the profile save then sends as `id_token`.

## Why the Enhanced screens need the scaled canvas

`EnterPhoneScreen`, `SelectMethodScreen` and `EnterPinScreen` are canvas-native.
They lay out as `w-full h-full` over the 430×932 artboard, and their vertical
rhythm comes from `FlexibleSpace`, whose `size` is **raw px** tuned to that
artboard. `xd-*` utilities scale outside the canvas (`:root` carries a
`clamp()` fallback for `--xd-unit`); `FlexibleSpace` does not.

So a screen dropped into a short card keeps artboard-sized gaps and overflows.
Reusing the screens means `Page variant="scaled"`, which is fullscreen by
construction.

That works for #2, #3 and #4. It cannot work for #1, which must stay inside a
200px footer panel.

## Design

### Shared flow — `components/Login/Enhanced/VerifyPhoneFlow.tsx` (new)

The phone → method → OTP sequence, rendering the three existing screens
unchanged.

```
initialPhone   string
phoneLocked    boolean   // skip the phone step, hide Edit
verify         (code, verificationId) => Promise<T>
onSuccess      (result: T) => void
onClose        () => void
```

`verify` is injected because #4's non-verify mode calls
`VerifyOtpForUpdatePhone` and needs its return value, while #1–#3 call
`AuthService.VerifyOtp`. Everything else — `AuthService.SendOtp`, the
`utils/otpLocks` cooldown and session cap, resend, the double-submit guard, the
error-text fallback — is identical across all four and lives here once.

`FullEnhancedLoginWidget` is **not** refactored to consume this. It carries
splash, get-started, terms, QR, name and success on top of these three steps,
and it is the one auth path that currently works in production. Rewiring it
serves nothing this change asks for. The screens are shared; the send/verify
plumbing stays duplicated between it and `VerifyPhoneFlow`. Deliberate trade,
recorded here so it is not mistaken for an oversight.

### Overlay host — `components/Login/Enhanced/AuthOverlay.tsx` (new)

The rdb gate treatment, taken from `PasscodeGate` / `ResetPasscodeOverlay` /
`SessionTakeoverOverlay` in the rdb app.

```jsx
<>
  <div className="fixed inset-0 z-[…] bg-[#0000004d]" />
  <div className="fixed inset-0 z-[…] h-dvh">
    <Page variant="scaled" outerBg="overlay">{children}</Page>
  </div>
</>
```

Two constraints drive that shape:

1. **The backdrop sits outside `<Page>`.** `rdb-auth.css` gives
   `#master-canvas` `contain: strict; isolation: isolate`, which seals the canvas
   off from the page behind it. A backdrop inside the canvas dims nothing.
2. **`#app-outer` must go transparent.** `rdb-auth.css` paints it `#ffffff`.
   `outerBg="overlay"` adds a `'transparent'` entry to `OUTER_BG` in
   `scaling/scale.config.ts`; `AppScaler` already injects
   `#app-outer:has(.outer-bg-overlay) { background: transparent }` from that map,
   so no new global CSS.

rdb blurs its backdrop (`backdrop-blur-sm bg-white/20`). We use a plain tinted
element instead — the blur is not needed here and `backdrop-filter` would be
blocked by the containment above.

### `components/Login/Enhanced/screens/SessionExpiredScreen.tsx` (new)

The two-button prompt in the rdb visual language: logo, title, body, two
`xd-dashed-border` buttons, matching `GetStartedScreen`. Reuses the four
translation keys `SessionExpiredWidget` already resolves — "Your session has
expired", "Please login again to get back to your account, or continue browsing
as a guest.", "Login", "Continue as Guest" — so no new copy is needed for it.

### `components/Login/Enhanced/InlineVerifyPanel.tsx` (new)

The cart's 200px panel. Built from the `Enhanced/ui/` primitives —
`RdbPhoneInput`, `RdbPinInputs`, and a compact two-button method row lifted from
`SelectMethodScreen` — not from the screens, for the layout reason above.
`NumericKeypad` already portals to `<body>` as `position: fixed`, so it behaves
identically inline and inside the canvas.

### Mutual exclusion

`AppScaler` hardcodes `id="app-outer"` and `id="master-canvas"`, writes
`--app-scale` and `--xd-flex-deficit` on `:root`, and resets `body.overflow` on
unmount with no refcount. Two mounted at once and they fight: duplicate ids,
`UnscaledPortal` resolving to the wrong node, and the first unmount releasing the
scroll lock the second still needs.

Today `loginOpen` (`AuthSections`) and `shouldAuthinticated` (`NavbarClient`) are
gated independently, so a 401 arriving while login is open mounts two.
`NavbarClient` will render the overlay surfaces only when `loginOpen` is false —
login takes precedence.

Safe because `AuthService.VerifyOtp` already clears `shouldAuthinticated` and
sets `reAuthResult: "success"` (`services/auth.ts:225-229`), so a parked 401
resolves through the login widget too.

## Files

**New**
- `components/Login/Enhanced/VerifyPhoneFlow.tsx`
- `components/Login/Enhanced/AuthOverlay.tsx`
- `components/Login/Enhanced/InlineVerifyPanel.tsx`
- `components/Login/Enhanced/screens/SessionExpiredScreen.tsx`

**Changed**
- `scaling/scale.config.ts` — add `overlay: 'transparent'` to `OUTER_BG`
- `components/Login/ConfirmMobilePhoneWidget.tsx` — `AuthOverlay` + `VerifyPhoneFlow`, all rules above preserved
- `components/Login/SessionExpiredWidget.tsx` — `AuthOverlay` + `SessionExpiredScreen`
- `components/setting/profile/PersonalInfoForm.tsx` — drops its inlined `ConfirmationModal`, uses `AuthOverlay` + `VerifyPhoneFlow` directly
- `components/setting/profile/VerifyUser.tsx` — same, replacing the imported `ConfirmationModal`
- `components/Cart/OrderButton.tsx` — `ConfirmMobile` → `InlineVerifyPanel`
- `components/Home/AuthSections.tsx` — drop `AUTH_WIDGET_MODE` and the legacy import
- `components/Home/NavbarClient.tsx` — mutual exclusion

**Deleted**

`components/Login/`: `NewLoginWidget.tsx`, `PhoneInput.tsx`, `SendMethod.tsx`,
`LogInPins.tsx`, `SignSteps.tsx`, `AccountNotFound.tsx`, `AlreadyRegistered.tsx`,
`InputName.tsx`, `LoginMethods.tsx`, `PrivacyConfirm.tsx`, `WelcomeSignup.tsx`,
`WelcomingWidget.tsx`, `PhoneNumberError.tsx`, `Border.tsx`.
Also `components/Cart/ConfirmMobile.tsx`,
`components/settings/ConfirmMobileChange.tsx`,
`components/settings/PersonalInfo.tsx`,
`public/styles/newLogin.css`, `public/styles/login.css`.

**Kept — these look dead and are not**
- `components/Login/Timer.tsx` → `Cart/CartItem.tsx`, `Orders/OrderRetailsReturnInfo.tsx`
- `components/Login/SessionTimer.tsx` → `app/simulateUser/page.tsx`, `global/DeferredLayoutClients.tsx`
- `components/Login/QrScannerModal.tsx`, `QrApprovalSheet.tsx` → `setting/profile/index.tsx`
- `components/global/Border.tsx` is a different file from `components/Login/Border.tsx`

The delete list is re-confirmed with `pnpm knip` after the edits, not trusted
from this pass alone.

## Out of scope

- Refactoring `FullEnhancedLoginWidget` (see above).
- Any change to `AuthService`, the OTP rate limiter, or the auth cookie model.
- A `floated` card layout for the three screens. `variant?: 'floated' |
  'fullscreen'` stays declared-but-unused; nothing here needs it once the cart
  panel composes from `ui/` primitives.
- Refcounting `AppScaler`'s global side effects. Mutual exclusion removes the
  need; a second scaled surface would bring it back.

## Validation

No test suite in this repo — `pnpm lint` (which now errors on translate keys
missing from ar/tr/ku), `pnpm build`, `pnpm knip`, then a manual pass over the
four surfaces:

1. Cart → unverified shopper → Confirm & Continue → panel expands inline, OTP
   completes, order proceeds.
2. Trigger a 401 → overlay appears over a dimmed page → verify → parked request
   retries.
3. Expire a session → prompt → Login → OTP → back in; and → Continue as Guest →
   page reloads as guest.
4. Settings → change phone → OTP → profile saves with `id_token`; and
   "Verify Now" on an unverified number.
5. Open login, then trigger a 401 — only the login widget renders.

Any string added for the inline panel goes into all three
`public/translations/translations.{ar,tr,ku}.js` files before it is used.
