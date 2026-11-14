"use client";

// QR login, the browser side. Every call goes to our own routes under
// /api/qr-login, never to the market backend. Tokens and the secret stay in
// HttpOnly cookies, so nothing here ever holds one.
//
// The contract is in docs/qr-login-tasks.md, section 3.
// - Direction A: this signed-out browser shows a QR, and the signed-in app
//   approves it.
// - Direction B: this signed-in browser shows a QR, a phone's app claims it,
//   and the user approves the phone here.

/** Direction A statuses. `approved`, `denied` and `expired` are final. */
export type QrStatus = "pending" | "scanned" | "approved" | "denied" | "expired";
/** Direction B statuses. `approved`, `denied` and `expired` are final. */
export type QrDeviceStatus = "pending" | "claimed" | "approved" | "denied" | "expired";

export type QrSession = { requestId: string; qrPayload: string; expiresAt: number };
export type QrStatusResult = { status: QrStatus };
export type QrDeviceStatusResult = {
  status: QrDeviceStatus;
  deviceName: string | null;
  platform: string | null;
};

/**
 * True when the QR login buttons may show. The core backend has no QR login
 * yet (docs/qr-login-tasks.md, section 1), so the buttons stay hidden until
 * NEXT_PUBLIC_QR_LOGIN_ENABLED is "true".
 */
export const isQrLoginEnabled = () => process.env.NEXT_PUBLIC_QR_LOGIN_ENABLED === "true";

/** The waiting side asks for the status this often. */
export const QR_POLL_MS = 2000;
/** After this many codes in a row, the screen stops and shows "Show a new code". */
export const MAX_QR_CODES = 3;

/** A route refused. `code` is the route's error word, such as `expired` or `conflict`. */
export class QrLoginError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(`QR login failed: ${code} (${status})`);
    this.name = "QrLoginError";
    this.status = status;
    this.code = code;
  }
}

async function send(url: string, method: "GET" | "POST", body?: unknown) {
  try {
    return await fetch(url, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new QrLoginError(0, "network");
  }
}

async function call<T>(url: string, method: "GET" | "POST", body?: unknown): Promise<T> {
  const sentAt = Date.now();
  let response = await send(url, method, body);

  // The market access token lives 60 seconds, and the refresh token is
  // single-use. The routes never refresh it, so the browser is its only owner.
  // A 401 here gets the same treatment as in utils/fetchData.ts: one shared
  // refresh, then one retry. A 401 means the backend did nothing, so a retry is
  // safe, even for collect.
  if (response.status === 401) {
    const { default: AuthService } = await import("services/auth");
    const refresh = await AuthService.RefreshSession(url, "market", sentAt);
    if (refresh.refreshed || refresh.eligible) {
      response = await send(url, method, body);
    }
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new QrLoginError(response.status, json?.error || "server_error");
  }
  return json as T;
}

/** The session ended on the backend: it timed out, or it no longer exists. */
const isGone = (e: unknown) =>
  e instanceof QrLoginError && (e.status === 410 || e.status === 404);

// ── Direction A: the signed-out browser ────────────────────────────────────

export function createQrSession(): Promise<QrSession> {
  return call<QrSession>("/api/qr-login/create", "POST");
}

export async function getQrStatus(requestId: string): Promise<QrStatusResult> {
  try {
    return await call<QrStatusResult>(
      `/api/qr-login/status?id=${encodeURIComponent(requestId)}`,
      "GET",
    );
  } catch (e) {
    if (isGone(e)) return { status: "expired" };
    throw e;
  }
}

/**
 * Collects this browser's tokens after the app approved, and signs in. The
 * answer is the same as `/api/auth/login` and holds no token. Use
 * `AuthService.CompleteQrLogin`, which also updates the store.
 */
export function completeQrLogin(requestId: string): Promise<any> {
  return call<any>("/api/qr-login/complete", "POST", { requestId });
}

// ── Direction B: the signed-in browser ─────────────────────────────────────

export function createDeviceQrSession(): Promise<QrSession> {
  return call<QrSession>("/api/qr-login/device/create", "POST");
}

export async function getDeviceQrStatus(requestId: string): Promise<QrDeviceStatusResult> {
  try {
    return await call<QrDeviceStatusResult>(
      `/api/qr-login/device/status?id=${encodeURIComponent(requestId)}`,
      "GET",
    );
  } catch (e) {
    if (isGone(e)) return { status: "expired", deviceName: null, platform: null };
    throw e;
  }
}

export function approveDevice(requestId: string): Promise<{ status: QrDeviceStatus }> {
  return call("/api/qr-login/device/approve", "POST", { requestId });
}

export function denyDevice(requestId: string): Promise<{ status: QrDeviceStatus }> {
  return call("/api/qr-login/device/deny", "POST", { requestId });
}

// ── "Open in app" ──────────────────────────────────────────────────────────

/**
 * True on a phone or tablet. There the camera can't scan its own screen, so
 * the QR gets an "Open in app" button that opens the same link.
 */
export function isTouchPhone(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
