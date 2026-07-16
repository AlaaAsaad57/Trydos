# QR Login Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fully clickable cross-device QR-login UI — desktop shows a live QR, a signed-in phone scans + approves — wired to a mock service so no real auth fires until the backend exists.

**Architecture:** Reuse the existing QR *display* panel in `LoginMethods.tsx` (swap its static placeholder for a generated QR + status polling). Add a new Apple-style camera *scanner* (`QrScannerModal` + `QrApprovalSheet`) opened from the Profile Card's existing `qr.svg` icon. A single client mock service (`services/qrLogin/index.ts`) backs both sides via `localStorage`, so the whole flow works across two tabs. Swapping the mock bodies for `fetchData` calls later leaves every call site unchanged.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Zustand store, `qrcode.react` (QR render), `jsqr` (QR decode), `navigator.mediaDevices.getUserMedia` (camera), `createPortal` (overlays), Tailwind + one CSS file for the scanner animation.

## Global Constraints

- **No test files.** Per `CLAUDE.md` this repo has no test suite; do not add one. Each task is verified by `pnpm build` (type-check) plus the scripted manual `pnpm dev` check in that task.
- **Package manager is `pnpm`.** Never `npm`/`yarn`.
- **Mock only — no real login.** On `approved`, the desktop shows a demo success state; it must **not** set any cookie, call the Go backend, or mint a `MARKET-TOKEN`.
- **Client components** touching browser APIs start with `"use client";`.
- **i18n:** all user-facing copy goes through `translateFunction(key, languageVariable)` from `utils/functions`. RTL honored via the existing `isRtl` prop.
- **The mock service's exported types are the backend contract** — do not rename them when wiring the real API; only replace function bodies.
- **Commit after every task** with a `feat(qr-login): …` / `chore(qr-login): …` message.

---

## File Structure

**Create**
- `services/qrLogin/index.ts` — mock service + exported types (the backend contract).
- `components/Login/QrScannerModal.tsx` — Apple-style full-screen camera scanner (portal).
- `components/Login/QrApprovalSheet.tsx` — bottom sheet showing device context + Approve/Deny.
- `public/styles/qrLogin.css` — reticle, corner brackets, scan-line keyframes, sheet slide-up.

**Modify**
- `components/Login/LoginMethods.tsx` — on expand, create a session; render a live `<QRCodeSVG>`; poll status; show waiting → scanned → approved/denied/expired; dev "Simulate scan" button.
- `components/setting/profile/index.tsx` — make the existing `qr.svg` icon open `QrScannerModal`.
- `package.json` — add `qrcode.react` + `jsqr` (via Task 2's `pnpm add`).

---

## Task 1: Mock service + contract types

**Files:**
- Create: `services/qrLogin/index.ts`

**Interfaces:**
- Produces:
  - `type QrStatus = "pending" | "scanned" | "approved" | "denied" | "expired"`
  - `type QrContext = { browser: string; os: string; city?: string }`
  - `type QrUser = { name: string; image?: string }`
  - `type QrSession = { requestId: string; qrPayload: string; expiresAt: number }`
  - `type QrStatusResult = { status: QrStatus; user?: QrUser; context?: QrContext }`
  - `createQrSession(): Promise<QrSession>`
  - `getQrStatus(requestId: string): Promise<QrStatusResult>`
  - `parseQrPayload(text: string): string | null`
  - `markScanned(requestId: string): Promise<void>`
  - `approveQrLogin(requestId: string, user: QrUser): Promise<{ ok: true }>`
  - `denyQrLogin(requestId: string): Promise<{ ok: true }>`

- [ ] **Step 1: Write the service**

Create `services/qrLogin/index.ts`:

```ts
"use client";

// MOCK QR-login service. Everything here is client-side and backed by
// localStorage so the UI is fully interactive without a backend. When the Go
// endpoints exist, replace each function BODY with a fetchData(...) call and
// delete the localStorage plumbing — the exported types and signatures below
// are the contract the backend must satisfy, so do NOT rename them.

export type QrStatus = "pending" | "scanned" | "approved" | "denied" | "expired";
export type QrContext = { browser: string; os: string; city?: string };
export type QrUser = { name: string; image?: string };
export type QrSession = { requestId: string; qrPayload: string; expiresAt: number };
export type QrStatusResult = { status: QrStatus; user?: QrUser; context?: QrContext };

type QrRecord = {
  status: QrStatus;
  context: QrContext;
  expiresAt: number;
  user?: QrUser;
};

const TTL_MS = 60_000;
const key = (id: string) => `qr:${id}`;

function readRecord(requestId: string): QrRecord | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(requestId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QrRecord;
  } catch {
    return null;
  }
}

function writeRecord(requestId: string, patch: Partial<QrRecord>): void {
  const current = readRecord(requestId);
  if (!current && !patch.status) return;
  const next = { ...(current || {}), ...patch } as QrRecord;
  window.localStorage.setItem(key(requestId), JSON.stringify(next));
}

function detectContext(): QrContext {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Device";
  // City is a backend/geo concern; the mock omits it.
  return { browser, os };
}

export async function createQrSession(): Promise<QrSession> {
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const expiresAt = Date.now() + TTL_MS;
  writeRecord(requestId, { status: "pending", context: detectContext(), expiresAt });
  return { requestId, qrPayload: `trydos://qr/${requestId}`, expiresAt };
}

export async function getQrStatus(requestId: string): Promise<QrStatusResult> {
  const rec = readRecord(requestId);
  if (!rec) return { status: "expired" };
  const settled = rec.status === "approved" || rec.status === "denied";
  if (!settled && Date.now() > rec.expiresAt) return { status: "expired" };
  return { status: rec.status, user: rec.user, context: rec.context };
}

export function parseQrPayload(text: string): string | null {
  const m = text.match(/trydos:\/\/qr\/([^\s/?#]+)/);
  if (m) return m[1];
  try {
    const url = new URL(text);
    return url.searchParams.get("req");
  } catch {
    return null;
  }
}

export async function markScanned(requestId: string): Promise<void> {
  const rec = readRecord(requestId);
  if (!rec || rec.status !== "pending") return;
  writeRecord(requestId, { status: "scanned" });
}

export async function approveQrLogin(
  requestId: string,
  user: QrUser,
): Promise<{ ok: true }> {
  writeRecord(requestId, { status: "approved", user });
  return { ok: true };
}

export async function denyQrLogin(requestId: string): Promise<{ ok: true }> {
  writeRecord(requestId, { status: "denied" });
  return { ok: true };
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: build completes with no TypeScript error referencing `services/qrLogin`.

- [ ] **Step 3: Manual sanity in the browser console**

Start `pnpm dev`, open any page, open DevTools console:

```js
const m = await import("/services/qrLogin/index.ts"); // or trigger via a component later
```

If direct import isn't convenient, skip — Task 3 exercises it in the UI. Verified when Task 3's flow works.

- [ ] **Step 4: Commit**

```bash
git add services/qrLogin/index.ts
git commit -m "feat(qr-login): mock qr-login service + backend contract types"
```

---

## Task 2: Add QR libraries

**Files:**
- Modify: `package.json` (+ `pnpm-lock.yaml`)

- [ ] **Step 1: Install**

Run:
```bash
pnpm add qrcode.react jsqr
```
Expected: both added to `dependencies`; lockfile updated.

- [ ] **Step 2: Verify types resolve**

`qrcode.react` ships its own types; `jsqr` ships types too. Confirm:

Run: `pnpm build`
Expected: no "Cannot find module 'qrcode.react'" or "'jsqr'" errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(qr-login): add qrcode.react + jsqr"
```

---

## Task 3: Live QR + status in the existing login method

**Files:**
- Modify: `components/Login/LoginMethods.tsx`

**Interfaces:**
- Consumes: `createQrSession`, `getQrStatus`, `approveQrLogin`, `QrSession`, `QrStatusResult` from `services/qrLogin`.

Replace the whole file with the version below. It keeps the existing structure/classes (`login-method-qr`, `qr-extend-comtainer`, `qr-image-container`, `Border`, `styles/methods.css`) and the phone-number method untouched; it only makes the QR section live.

- [ ] **Step 1: Rewrite `LoginMethods.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { translateFunction } from "utils/functions";

import Border from "./Border";
import "styles/methods.css";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
import { QRCodeSVG } from "qrcode.react";
import {
  createQrSession,
  getQrStatus,
  approveQrLogin,
  type QrSession,
  type QrStatus,
} from "services/qrLogin";

const LoginMethods = ({ confirm }) => {
  const { language } = useAppStore();

  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [showQr, setShowQr] = useState(false);
  const [session, setSession] = useState<QrSession | null>(null);
  const [status, setStatus] = useState<QrStatus>("pending");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let e = document.querySelector<HTMLDivElement>(".login-widget-container");
    if (e.classList.contains("qr-extend-comtainer")) {
      e.classList.remove("qr-extend-comtainer");
    } else {
      e.classList.add("qr-extend-comtainer");
    }
  }, [showQr]);

  // Create a session when the QR panel opens; poll its status while open.
  useEffect(() => {
    if (!showQr) return;
    let cancelled = false;
    (async () => {
      const s = await createQrSession();
      if (cancelled) return;
      setSession(s);
      setStatus("pending");
      pollRef.current = setInterval(async () => {
        const res = await getQrStatus(s.requestId);
        setStatus(res.status);
        if (res.status === "approved" || res.status === "denied") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 1200);
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showQr]);

  const statusText = () => {
    switch (status) {
      case "scanned":
        return translate("Found on a device — approve on your phone", language);
      case "approved":
        return translate("Approved (demo)", language);
      case "denied":
        return translate("Request declined", language);
      case "expired":
        return translate("Code expired — reopen to refresh", language);
      default:
        return translate("Scan This Qr Code From You Trydos App In Your Phone", language);
    }
  };

  return (
    <div data-cy="login-methods-container" className="login-method-container">
      <div
        data-testid="login-method-qr"
        className={`${showQr ? "qr-extended" : ""} login-method-qr`}
        onClick={(e) => {
          e.preventDefault();
          setShowQr(!showQr);
        }}
      >
        <Border className="border-button" />
        <div className="flex">
          <img src="/icons/qr.svg" />
          <span>{translate("By Scan Qr From Trydos App", language)}</span>
        </div>
        {showQr && (
          <>
            <div className="icon-detail">
              <svg
                id="Group_10725"
                data-name="Group 10725"
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 10 10"
              >
                <path
                  id="Subtraction_1"
                  data-name="Subtraction 1"
                  d="M.227,8.03a.229.229,0,0,1-.135-.045.236.236,0,0,1-.083-.252L.585,5.909A3.846,3.846,0,1,1,1.7,7.066L.355,7.991A.212.212,0,0,1,.227,8.03Zm3.6-2.212a.476.476,0,1,0,.487.476A.475.475,0,0,0,3.828,5.818Zm.1-3.792a.75.75,0,0,1,.827.734c0,.36-.159.583-.606.853a1.19,1.19,0,0,0-.708,1.073V4.77a.381.381,0,0,0,.387.431c.221,0,.349-.135.369-.391.018-.371.157-.557.619-.83a1.4,1.4,0,0,0,.775-1.254A1.454,1.454,0,0,0,3.961,1.348a1.569,1.569,0,0,0-1.523.819.956.956,0,0,0-.1.431.327.327,0,0,0,.358.361c.194,0,.3-.09.372-.31A.82.82,0,0,1,3.928,2.026Z"
                  transform="translate(0 1.97)"
                  fill="#8e8e8e"
                />
                <path
                  id="Path_21380"
                  data-name="Path 21380"
                  d="M9.672,8.064a.23.23,0,0,1-.136.045.211.211,0,0,1-.127-.039L8.066,7.146l-.015.009a4.28,4.28,0,0,0,.348-1.7A4.322,4.322,0,0,0,4.082,1.14a4.252,4.252,0,0,0-.948.106A3.82,3.82,0,0,1,5.9.079,3.865,3.865,0,0,1,9.178,5.988l.576,1.824a.234.234,0,0,1-.082.252Z"
                  transform="translate(-0.218 0.375)"
                  fill="#8e8e8e"
                />
                <rect
                  id="Rectangle_4714"
                  data-name="Rectangle 4714"
                  width="10"
                  height="10"
                  fill="none"
                />
              </svg>
              <span>{statusText()}</span>
            </div>
            <div
              className="qr-image-container"
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative" }}
            >
              {session ? (
                <QRCodeSVG value={session.qrPayload} size={160} level="M" />
              ) : (
                <img src="/icons/qrSample.svg" />
              )}
              {status === "approved" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(224,255,238,0.92)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    color: "#1b8f4d",
                  }}
                >
                  ✓ {translate("Approved (demo)", language)}
                </div>
              )}
            </div>
            {process.env.NODE_ENV !== "production" && session && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  approveQrLogin(session.requestId, {
                    name: "Demo User",
                    image: "",
                  });
                }}
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px dashed #aaa",
                  background: "#fff",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                Simulate scan (dev)
              </button>
            )}
          </>
        )}
      </div>
      {!showQr && (
        <div
          data-cy="login-method-phone"
          className="login-method-phone"
          onClick={() => {
            confirm();
          }}
        >
          <Border className="border-button" />
          <img src="/icons/loginCall.svg" />
          <span>{translate("By Mobile Phone Number", language)}</span>
        </div>
      )}
    </div>
  );
};

export default LoginMethods;
```

- [ ] **Step 2: Type-check**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 3: Manual check (desktop QR + dev simulate)**

Run `pnpm dev`, open the site on a **wide screen (>912px)**, open the login widget → click **"I have Already Account"** → the methods appear → click **"By Scan Qr From Trydos App"**.
Expected:
1. A real (non-placeholder) QR renders in place of `qrSample.svg`.
2. Helper text reads "Scan This Qr Code…".
3. Click **"Simulate scan (dev)"** → within ~1.2s the QR area shows the green "✓ Approved (demo)" overlay and the helper text becomes "Approved (demo)".

- [ ] **Step 4: Manual check (two-tab round-trip)**

Open the login QR panel in Tab A. In DevTools console of the same browser, read the latest `qr:*` key to get the `requestId`, then in **Tab B** console run `localStorage.setItem('qr:<id>', JSON.stringify({...JSON.parse(localStorage.getItem('qr:<id>')), status:'scanned'}))`.
Expected: Tab A's helper text flips to "Found on a device — approve on your phone" on the next poll. (This proves cross-tab polling; the scanner in Task 5 replaces the manual console step.)

- [ ] **Step 5: Commit**

```bash
git add components/Login/LoginMethods.tsx
git commit -m "feat(qr-login): live generated QR + status polling in login method"
```

---

## Task 4: Apple-style scanner overlay (camera + decode)

**Files:**
- Create: `components/Login/QrScannerModal.tsx`
- Create: `public/styles/qrLogin.css`

**Interfaces:**
- Consumes: `parseQrPayload` from `services/qrLogin`.
- Produces:
  - `QrScannerModal` default export, props:
    `{ isRtl: boolean; language: string; onDetected: (requestId: string) => void; onClose: () => void }`

- [ ] **Step 1: Write the scanner styles**

Create `public/styles/qrLogin.css`:

```css
.qr-scanner-root {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: #000;
  overflow: hidden;
}
.qr-scanner-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Dim everything outside the reticle with one big translucent shadow. */
.qr-reticle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 68vw;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  border-radius: 28px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.55);
  transition: transform 0.18s ease;
}
.qr-reticle.qr-hit {
  transform: translate(-50%, -50%) scale(1.04);
}
.qr-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 3px solid #fff;
}
.qr-corner.tl { top: -2px; left: -2px; border-right: 0; border-bottom: 0; border-top-left-radius: 12px; }
.qr-corner.tr { top: -2px; right: -2px; border-left: 0; border-bottom: 0; border-top-right-radius: 12px; }
.qr-corner.bl { bottom: -2px; left: -2px; border-right: 0; border-top: 0; border-bottom-left-radius: 12px; }
.qr-corner.br { bottom: -2px; right: -2px; border-left: 0; border-top: 0; border-bottom-right-radius: 12px; }
.qr-scanline {
  position: absolute;
  left: 8%;
  right: 8%;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #fff, transparent);
  box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.7);
  animation: qr-sweep 2.2s ease-in-out infinite;
}
@keyframes qr-sweep {
  0% { top: 10%; opacity: 0.2; }
  50% { top: 88%; opacity: 1; }
  100% { top: 10%; opacity: 0.2; }
}
.qr-scanner-title {
  position: absolute;
  top: 12%;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff;
  padding: 0 24px;
}
.qr-scanner-title h3 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.qr-scanner-title p { font-size: 13px; opacity: 0.8; }
.qr-scanner-close {
  position: absolute;
  top: 20px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 0;
  font-size: 20px;
  line-height: 38px;
  cursor: pointer;
}
```

- [ ] **Step 2: Write `QrScannerModal.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsQR from "jsqr";
import { translateFunction } from "utils/functions";
import { parseQrPayload } from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  isRtl: boolean;
  language: string;
  onDetected: (requestId: string) => void;
  onClose: () => void;
};

function QrScannerModal({ isRtl, language, onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [hit, setHit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => translateFunction(key, language);

  useEffect(() => {
    let mounted = true;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
      const requestId = code ? parseQrPayload(code.data) : null;
      if (requestId && !doneRef.current) {
        doneRef.current = true;
        setHit(true);
        stop();
        setTimeout(() => onDetected(requestId), 180);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError(t("Camera unavailable — allow camera access to scan"));
      }
    })();

    return () => {
      mounted = false;
      stop();
    };
  }, [onDetected, language]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-scanner-root" dir={isRtl ? "rtl" : "ltr"}>
      <video ref={videoRef} className="qr-scanner-video" playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="qr-scanner-title">
        <h3>{t("Scan to sign in")}</h3>
        <p>{t("Point at the QR on your other screen")}</p>
      </div>

      <button
        className="qr-scanner-close"
        style={isRtl ? { left: 20 } : { right: 20 }}
        onClick={onClose}
        aria-label={t("Close")}
      >
        ✕
      </button>

      <div className={`qr-reticle ${hit ? "qr-hit" : ""}`}>
        <span className="qr-corner tl" />
        <span className="qr-corner tr" />
        <span className="qr-corner bl" />
        <span className="qr-corner br" />
        {!hit && <div className="qr-scanline" />}
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: 24,
            right: 24,
            textAlign: "center",
            color: "#fff",
            fontSize: 13,
            background: "rgba(0,0,0,0.5)",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>,
    document.body,
  );
}

export default QrScannerModal;
```

- [ ] **Step 3: Type-check**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/Login/QrScannerModal.tsx public/styles/qrLogin.css
git commit -m "feat(qr-login): apple-style camera scanner overlay"
```

---

## Task 5: Approval sheet + scanner→approve wiring

**Files:**
- Create: `components/Login/QrApprovalSheet.tsx`
- Modify: `public/styles/qrLogin.css` (append sheet styles)

**Interfaces:**
- Consumes: `getQrStatus`, `markScanned`, `approveQrLogin`, `denyQrLogin`, `QrContext`, `QrUser` from `services/qrLogin`.
- Produces:
  - `QrApprovalSheet` default export, props:
    `{ requestId: string; user: QrUser; isRtl: boolean; language: string; onDone: (result: "approved" | "denied") => void }`

- [ ] **Step 1: Append sheet styles to `public/styles/qrLogin.css`**

```css
.qr-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.qr-sheet {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 22px 20px calc(22px + env(safe-area-inset-bottom));
  animation: qr-sheet-up 0.26s ease;
}
@keyframes qr-sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.qr-sheet h3 { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 6px; color: #1d1d1d; }
.qr-sheet .qr-sheet-ctx { text-align: center; font-size: 13px; color: #8d8d8d; margin-bottom: 18px; }
.qr-sheet-actions { display: flex; gap: 10px; }
.qr-sheet-actions button { flex: 1; padding: 13px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: 0; }
.qr-sheet-deny { background: #f1efef; color: #1d1d1d; }
.qr-sheet-approve { background: #1b8f4d; color: #fff; }
.qr-sheet-approve:disabled { opacity: 0.6; cursor: default; }
```

- [ ] **Step 2: Write `QrApprovalSheet.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { translateFunction } from "utils/functions";
import {
  getQrStatus,
  markScanned,
  approveQrLogin,
  denyQrLogin,
  type QrContext,
  type QrUser,
} from "services/qrLogin";
import "public/styles/qrLogin.css";

type Props = {
  requestId: string;
  user: QrUser;
  isRtl: boolean;
  language: string;
  onDone: (result: "approved" | "denied") => void;
};

function QrApprovalSheet({ requestId, user, isRtl, language, onDone }: Props) {
  const [ctx, setCtx] = useState<QrContext | null>(null);
  const [busy, setBusy] = useState(false);
  const t = (key: string) => translateFunction(key, language);

  // Mark the desktop session as scanned, then read its context to show here.
  useEffect(() => {
    (async () => {
      await markScanned(requestId);
      const res = await getQrStatus(requestId);
      setCtx(res.context || null);
    })();
  }, [requestId]);

  const deviceLine = ctx
    ? [ctx.browser, ctx.os, ctx.city].filter(Boolean).join(" · ")
    : t("a device");

  const approve = async () => {
    setBusy(true);
    await approveQrLogin(requestId, user);
    onDone("approved");
  };
  const deny = async () => {
    setBusy(true);
    await denyQrLogin(requestId);
    onDone("denied");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-sheet-backdrop" dir={isRtl ? "rtl" : "ltr"} onClick={deny}>
      <div className="qr-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{t("Log in on this device?")}</h3>
        <div className="qr-sheet-ctx">{deviceLine}</div>
        <div className="qr-sheet-actions">
          <button className="qr-sheet-deny" onClick={deny} disabled={busy}>
            {t("Deny")}
          </button>
          <button className="qr-sheet-approve" onClick={approve} disabled={busy}>
            {t("Approve")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default QrApprovalSheet;
```

- [ ] **Step 3: Type-check**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/Login/QrApprovalSheet.tsx public/styles/qrLogin.css
git commit -m "feat(qr-login): approval bottom sheet + scanned/approve/deny wiring"
```

---

## Task 6: Open the scanner from the Profile Card

**Files:**
- Modify: `components/setting/profile/index.tsx`

**Interfaces:**
- Consumes: `QrScannerModal` (Task 4), `QrApprovalSheet` (Task 5), `GetImageUrl` (existing, `utils/tinyUtils`).

The card currently renders the `qr.svg` icon with no handler inside a `pointer-events-none` block (line ~69). Make it a button that opens the scanner; on decode show the approval sheet; use the logged-in `user` as the approver identity.

- [ ] **Step 1: Add imports + state**

At the top of `components/setting/profile/index.tsx`, alongside the existing imports, add:

```tsx
import { useState } from "react";
import QrScannerModal from "components/Login/QrScannerModal";
import QrApprovalSheet from "components/Login/QrApprovalSheet";
```

Inside `function Profile({ isRtl, language, local, SafeUserProfile })`, after `const user = clientUser || SafeUserProfile;`, add:

```tsx
  const [scannerOpen, setScannerOpen] = useState(false);
  const [approveReq, setApproveReq] = useState<string | null>(null);
```

- [ ] **Step 2: Make the qr icon open the scanner**

Replace this exact line:

```tsx
        {!isNotLoggedIn && <img className="w-[15px] h-[15px]" src="/icons/qr.svg" alt="qr" />
        }
```

with:

```tsx
        {!isNotLoggedIn && (
          <button
            type="button"
            className="pointer-events-auto cursor-pointer border-0 bg-transparent p-0"
            aria-label={translateFunction("Scan QR to sign in", language)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setScannerOpen(true);
            }}
          >
            <img className="w-[15px] h-[15px]" src="/icons/qr.svg" alt="qr" />
          </button>
        )}
```

- [ ] **Step 3: Render the scanner + sheet**

Immediately before the final closing `</div>` of the returned card (after the profile-image block, still inside the outer card `<div>`), add:

```tsx
      {scannerOpen && (
        <QrScannerModal
          isRtl={isRtl}
          language={language}
          onDetected={(requestId) => {
            setScannerOpen(false);
            setApproveReq(requestId);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
      {approveReq && (
        <QrApprovalSheet
          requestId={approveReq}
          isRtl={isRtl}
          language={language}
          user={{ name: user?.name || "", image: user?.image || "" }}
          onDone={() => setApproveReq(null)}
        />
      )}
```

- [ ] **Step 4: Type-check**

Run: `pnpm build`
Expected: no TypeScript errors.

- [ ] **Step 5: Manual end-to-end (single browser, two tabs)**

Run `pnpm dev` on `https` or `localhost` (getUserMedia needs a secure context; `localhost` counts).
1. **Tab A (desktop, signed out):** open login widget → "I have Already Account" → "By Scan Qr From Trydos App". A live QR shows.
2. Display Tab A's QR on screen. On a **phone on the same network** (or a second device) open the site **signed in**, go to Settings, tap the QR icon on the Profile Card → the Apple-style scanner opens → point at Tab A's QR.
   - If you only have one machine: use Task 3's **"Simulate scan (dev)"** button instead to drive `approved` without a camera.
3. On scan, the scanner closes and the approval sheet slides up showing "Log in on this device? · Chrome · Windows".
4. Tap **Approve** → sheet closes.
5. Back on Tab A: within ~1.2s the QR shows "✓ Approved (demo)".
6. Repeat and tap **Deny** → Tab A shows "Request declined".

Expected: all six behaviors as described; no real login/cookie occurs (verify no new `MARKET-TOKEN` cookie appears).

- [ ] **Step 6: Commit**

```bash
git add components/setting/profile/index.tsx
git commit -m "feat(qr-login): open apple scanner + approval sheet from profile card"
```

---

## Self-Review

**Spec coverage**
- Desktop QR display (signed out) → Task 3 (enhances existing `LoginMethods.tsx`). ✅
- Scanner in Settings Profile Card `qr.svg` icon (signed in) → Tasks 4–6. ✅
- Apple-style scanner → Task 4 (reticle, corners, scan line, torch omitted as optional — see note). ✅
- Dummy API, no real login → Task 1 mock; approval sets no cookie (Global Constraints, Task 6 Step 5 verifies). ✅
- Interactive across tabs → Task 1 `localStorage` + Task 3 polling; Task 3 Step 4 & Task 6 Step 5 exercise it. ✅
- Add `qrcode.react` + `jsqr` → Task 2. ✅
- Backend contract documented → Task 1 exported types + design §3. ✅

**Deferred from design (intentional, non-blocking):** the torch toggle (design §6) is omitted — `MediaStreamTrack` torch support is narrow and it isn't needed to demo the flow; add later if wanted. Copy currently keeps the existing "Trydos App" strings (design §9 open question); change is cosmetic and can be a one-line follow-up.

**Placeholder scan:** no TBD/TODO; every code step is complete and runnable.

**Type consistency:** `QrSession`, `QrStatus`, `QrStatusResult`, `QrContext`, `QrUser`, and the five functions are defined in Task 1 and consumed with identical names/signatures in Tasks 3, 4, 5, 6. `parseQrPayload` (Task 1) → used in Task 4. `onDetected(requestId)` (Task 4) → feeds `QrApprovalSheet.requestId` (Task 5) via Task 6. Consistent.
```
