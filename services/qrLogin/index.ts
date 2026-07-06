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
