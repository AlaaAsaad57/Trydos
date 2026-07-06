# QR Login — Frontend Design (mock API)

> **Scope:** front-end only. Ships a fully clickable UI wired to **dummy async
> functions** — no real authentication happens until the backend endpoints
> exist. When the backend is ready we swap the *bodies* of the mock service; the
> UI and its call sites do not change.
>
> Status: design / for review · Owner: ai_agent · Date: 2026-07-06

---

## 1. What we're building

A cross-device **QR login**: an unauthenticated device shows a QR code, and an
already-logged-in phone scans it and approves, which logs the first device in.
No mobile app needed — the "phone" is just the user's phone **browser** already
signed into Trydos.

Two surfaces, matching where you asked for them:

| Surface | Where | Role | Auth state |
|---|---|---|---|
| **QR display** | Login widget → **existing** "By Scan Qr From Trydos App" method (`LoginMethods.tsx`) | Shows the QR to be scanned | Signed **out** |
| **Scanner** | Settings → Profile Card, the tiny `qr.svg` icon | Scans the QR + approves | Signed **in** |

> **Both entry points already exist in the codebase — we enhance, not add.**
> The display side is `LoginMethods.tsx`'s `login-method-qr` row, which today
> renders a static `/icons/qrSample.svg` placeholder inside `.qr-image-container`
> (styles in `styles/methods.css`, expand class `qr-extend-comtainer`). We
> replace that static image with a live generated QR + status. The scanner side
> is the Profile Card's `qr.svg` icon, which today has no click handler.

The scanner is an **Apple-style camera overlay** (full-screen viewfinder,
rounded reticle with animated corner brackets, dimmed surround, sweeping scan
line, torch + close).

---

## 2. The flow (simple)

```
   DESKTOP (signed out)                         PHONE (signed in)
   Login widget ▸ "By Scan Qr"                  Settings ▸ Profile Card
   ────────────────────                         ────────────────────────
        │                                                │
        │ 1. expand existing QR method                   │
        │    createQrSession()                           │
        │◀── { requestId, qrPayload, expiresAt }         │
        │                                                │
        │ 2. render QR from qrPayload (replaces          │
        │    the qrSample.svg placeholder)               │
        │        ┌─────────┐                              │
        │        │ ▓▓░▓░▓▓ │                              │
        │        │ ░▓▓░▓░░ │   3. tap qr.svg icon ──────▶ │ opens Apple scanner
        │        │ ▓░░▓▓▓░ │                              │
        │        └─────────┘   4. camera decodes QR ◀─────┤
        │                         markScanned(requestId)  │
        │ 5. poll getQrStatus(requestId)                  │
        │◀── status: "scanned"  (show "Found on a device")│
        │    UI: "Approve on your phone…"                 │ 5. approval sheet:
        │                                                 │    "Log in on Chrome ·
        │                                                 │     Windows · Baghdad?"
        │                                                 │    [Deny]   [Approve]
        │                              approveQrLogin() ◀─┤ 6. tap Approve
        │ 7. poll getQrStatus(requestId)                  │
        │◀── status: "approved"                           │
        │    UI: ✓ "Approved (demo)"                       │
        │    → real build: set cookie + redirect          │
        ▼                                                 ▼
```

`denyQrLogin()` / expiry drive the unhappy paths (desktop shows "Declined" /
"Code expired — refresh").

---

## 3. Mock API contract (backend mirrors this later)

One client service, `services/qrLogin/index.ts`. Same `{ url, method, body }`
shape as `utils/fetchData.ts` so the swap is mechanical. Types below double as
the spec we hand the backend.

```ts
type QrStatus = "pending" | "scanned" | "approved" | "denied" | "expired";

type QrSession = {
  requestId: string;   // opaque; travels in the QR
  qrPayload: string;    // string we render as a QR (e.g. `trydos://qr/<requestId>`)
  expiresAt: number;    // epoch ms; ~60s TTL
};

type QrStatusResult = {
  status: QrStatus;
  // present only once approved — lets desktop greet the user in the demo
  user?: { name: string; image?: string };
  // present at "scanned"/"pending" so the phone can show context before approve
  context?: { browser: string; os: string; city?: string };
};

// DESKTOP (signed out)
createQrSession(): Promise<QrSession>;
getQrStatus(requestId: string): Promise<QrStatusResult>;   // polled ~1s

// PHONE (signed in)
markScanned(requestId: string): Promise<void>;             // right after decode
approveQrLogin(requestId: string, user: QrUser): Promise<{ ok: true }>;
denyQrLogin(requestId: string): Promise<{ ok: true }>;
```

> **Identity comes from the token, never from the client.** The mock's
> `approveQrLogin` takes a `user` argument **only** so the localStorage mock can
> populate `getQrStatus().user` for the desktop's demo greeting — the phone has
> no `MARKET-TOKEN` to read in a mock. The **real** `POST /api/qr-login/approve`
> MUST derive the approving user from the phone's `MARKET-TOKEN` cookie and
> ignore/omit any client-supplied identity, returning the resolved user to the
> desktop via `getQrStatus().user`. Do not let a client value stand in for
> identity server-side.

**Endpoint names for the backend** (documented now, unused until wired):
`GET /api/qr-login/create`, `GET /api/qr-login/status?req=`,
`POST /api/qr-login/scanned`, `POST /api/qr-login/approve`,
`POST /api/qr-login/deny`. Approve/deny read the phone's `MARKET-TOKEN`; the
real `create`→`approved` handoff ends by minting a `MARKET-TOKEN` for the
desktop (the one unavoidable Go touchpoint — out of scope for this frontend PR).

### Backend-swap checklist (carry these when replacing the mock bodies with `fetchData`)

- **Identity from `MARKET-TOKEN`**, not the `approveQrLogin` `user` arg (see box above).
- **Add `try { … } finally { setBusy(false) }`** around approve/deny in
  `QrApprovalSheet.tsx` — a real call *can* reject; without it, `busy` sticks and
  both buttons stay disabled forever.
- **Add the new copy keys** ("Approved (demo)", "Found on a device — approve on
  your phone", "Request declined", "Code expired — reopen to refresh",
  "Simulate scan (dev)", scanner strings) to the `ar`/`tr`/`ku` resources —
  today `translateFunction` falls back to the English key.
- **`parseQrPayload`**: the `?req=` fallback needs an absolute URL; harden if the
  real payload is ever a relative form (the `trydos://` scheme path is unaffected).
- **Re-gate** the scanner/sheet on `!isNotLoggedIn` in `profile/index.tsx` if
  session invalidation mid-flow becomes possible.
- Consider adding an explicit `"use client";` to `LoginMethods.tsx` now that it
  imports a client-only lib (`qrcode.react`).

---

## 4. Mock implementation (so the demo is actually interactive)

The mock is **not** a bag of `setTimeout`s that only work in one tab. It's
backed by `localStorage` keyed on `requestId`. Because `localStorage` is shared
across tabs of the same origin and the desktop side **polls**, you can open
**two browser tabs in the same browser** and watch a real approve/deny
round-trip. (True cross-*device* mirroring needs shared server state — that's
the backend's job, out of scope here.)

- `createQrSession` → writes `{ status:"pending", context, expiresAt }` to
  `localStorage["qr:<id>"]`, returns the session.
- `getQrStatus` → reads that key; auto-returns `"expired"` past `expiresAt`.
- `markScanned` / `approveQrLogin` / `denyQrLogin` → mutate the key; the polling
  desktop picks the change up on its next tick.
- A tiny **"Simulate scan"** dev button on the QR panel (behind
  `process.env.NODE_ENV !== "production"`) approves the current session so you
  can demo the whole flow in a single tab without a second device or camera.

When the backend lands, each function's body becomes a `fetchData(...)` call and
the `localStorage`/channel plumbing is deleted. Call sites are untouched.

---

## 5. Components & files

**New**

| File | Purpose |
|---|---|
| `services/qrLogin/index.ts` | The mock service above (typed contract). |
| `components/Login/QrScannerModal.tsx` | Apple-style camera scanner (portal). |
| `components/Login/QrApprovalSheet.tsx` | Bottom sheet: context + Approve/Deny. |
| `public/styles/qrLogin.css` | Scanner/reticle/scan-line animation + sheet styles. |

> No `QrSignInPanel` — the display UI already exists in `LoginMethods.tsx`.

**Edited**

| File | Change |
|---|---|
| `components/setting/profile/index.tsx` | Give the existing `qr.svg` icon an `onClick` → open `QrScannerModal`; wrap it `pointer-events-auto`. |
| `components/Login/LoginMethods.tsx` | On expand, call `createQrSession()`; replace the static `qrSample.svg` with `<QRCodeSVG value={qrPayload} />`; poll `getQrStatus` and drive the waiting → scanned → approved/denied/expired copy + a refresh-on-expiry. |

**Libraries** — approved to add now:

- **QR decode (scanner):** native `BarcodeDetector` when available (Android
  Chrome), fallback to `jsQR` over a `<canvas>` frame (iOS Safari has no
  `BarcodeDetector`). Camera via `navigator.mediaDevices.getUserMedia`.
- **QR render (display):** `qrcode.react` (`<QRCodeSVG value={qrPayload} />`).

---

## 6. Apple-style scanner — visual spec

- **Full-screen** portal (mirror `AiRateLimitsModal`'s `createPortal` + max
  z-index), black backdrop, live `<video>` filling the screen.
- **Reticle:** centered rounded square (~68vw, `border-radius: 28px`), the area
  *outside* it dimmed with a large translucent box-shadow (the classic iOS
  cut-out). Four **animated corner brackets** in white.
- **Scan line:** a soft gradient bar sweeping top→bottom inside the reticle
  (CSS keyframes), pausing/pulsing on detect.
- **Chrome:** title "Scan to sign in", subtitle "Point at the QR on your other
  screen", a **torch** toggle (if `MediaStreamTrack` supports it) and a **close**
  ✕. RTL-aware via the existing `isRtl` prop; copy through `translateFunction`.
- **On decode:** haptic-style scale bounce of the reticle, then slide up
  `QrApprovalSheet`.

---

## 7. Explicitly NOT in this PR

- No real session/cookie is set. On `approved`, desktop shows a demo success
  state only.
- No Go backend work; no `MARKET-TOKEN` minting.
- No mobile-app integration (the same mock service will serve it later).

---

## 8. Resolved decisions

1. **Login-widget entry** — reuse the **existing** "By Scan Qr From Trydos App"
   method in `LoginMethods.tsx`; no new entry point or slide step.
2. **QR display** — enhance the existing expand panel in place (swap the
   `qrSample.svg` placeholder for a live QR + status).
3. **Libraries** — add `qrcode.react` + `jsQR` now (real render + decode from
   the first build).

## 9. Remaining open question

- **Copy vs. mechanism:** the existing strings say "…From **Trydos App** in your
  phone," but this flow works from the phone **browser** (no app required). Keep
  the app-centric copy for now, or soften to "your phone"? (Cosmetic — does not
  block implementation.)
```
