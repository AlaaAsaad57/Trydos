import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { logRequest, startTimer } from "reqLogger";

// Server helpers for the QR login routes under app/api/qr-login. The contract
// with the market backend is in docs/qr-login-tasks.md, section 1. The routes
// for the browser are in section 3.

/**
 * Proves that the browser that collects the tokens is the browser that made
 * the QR. HttpOnly, so page scripts can never read it. The value is
 * `<request_id>.<secret>`, so a status call for another QR is refused here,
 * before it reaches the backend.
 */
export const QR_SECRET_COOKIE = "QR-LOGIN-SECRET";
/** A session lives 60 seconds. The cookie lives a little longer, for clock drift. */
const QR_SECRET_MAX_AGE = 90;
const QR_TIMEOUT_MS = 10_000;

/** A request ID from the backend: letters, digits and dashes (a UUID). */
const REQUEST_ID = /^[A-Za-z0-9-]{1,100}$/;
export const isRequestId = (value: unknown): value is string =>
  typeof value === "string" && REQUEST_ID.test(value);

export function makeSecret() {
  // 32 random bytes. base64url has no "." so the cookie value splits safely.
  const secret = randomBytes(32).toString("base64url");
  return { secret, secretHash: hashSecret(secret) };
}

export const hashSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");

export async function saveSecret(requestId: string, secret: string) {
  const store = await cookies();
  store.set({
    name: QR_SECRET_COOKIE,
    value: `${requestId}.${secret}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // Only the QR routes need it, so other requests never carry it.
    path: "/api/qr-login",
    maxAge: QR_SECRET_MAX_AGE,
  });
}

/** The secret for this request ID, or null when the cookie is missing or for another QR. */
export async function readSecret(requestId: string): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(QR_SECRET_COOKIE)?.value || "";
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  if (raw.slice(0, dot) !== requestId) return null;
  return raw.slice(dot + 1) || null;
}

export async function deleteSecret() {
  const store = await cookies();
  store.set({
    name: QR_SECRET_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/qr-login",
    maxAge: 0,
  });
}

/**
 * The browser's device and location, for the approve screen in the app.
 *
 * Cloudflare sits in front of Vercel, so the `x-vercel-ip-*` headers describe a
 * Cloudflare server, never the shopper. Only the `cf-*` headers are used. A
 * live check on 2026-11-14 confirmed that they arrive.
 */
export function readClientContext(request: NextRequest) {
  const header = (name: string) => request.headers.get(name)?.trim() || null;
  const country = header("cf-ipcountry");
  const ua = userAgent(request);
  return {
    browser: ua.browser.name || null,
    os: ua.os.name || null,
    ip: header("cf-connecting-ip"),
    // XX = unknown, T1 = Tor. Neither is a country.
    country: country && country !== "XX" && country !== "T1" ? country : null,
    city: header("cf-ipcity"),
    region: header("cf-region"),
  };
}

type InventoryCall = {
  path: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** The request from the browser, for its country and language headers. */
  request: NextRequest;
};

export type InventoryResult = {
  /** The HTTP code of the market backend, or 502 / 504 when it did not answer. */
  status: number;
  /** The `data` of the answer, when the call succeeded. */
  data: any;
};

/**
 * Calls the market backend with the shopper's MARKET-TOKEN (guest or signed
 * in). A 401 is normal, because an access token lives 60 seconds.
 *
 * This route never refreshes the token. The refresh token is single-use, and
 * the browser (services/qrLogin) already refreshes it on a 401 and sends the
 * call again. If the route spent it too, and its answer was lost (a reload, a
 * closed tab), the shopper would lose the session. Same rule as
 * /api/search/history.
 */
export async function callInventory(call: InventoryCall): Promise<InventoryResult> {
  const store = await cookies();
  const token = store.get(COOKIE_NAMES.MARKET_TOKEN)?.value || "";
  return send(call, token);
}

async function send(call: InventoryCall, token: string): Promise<InventoryResult> {
  const url = `${process.env.BACKEND_URL}${call.path}`;
  const country = call.request.headers.get("country")?.trim() || "sy";
  const language =
    call.request.headers.get("language")?.trim() ||
    call.request.headers.get("lang")?.trim() ||
    "en";
  const elapsed = startTimer();
  try {
    const response = await fetch(url, {
      method: call.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        country,
        language,
        Lang: language,
        Country: country,
        ...(call.headers || {}),
      },
      ...(call.body ? { body: JSON.stringify(call.body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(QR_TIMEOUT_MS),
    });
    const json = await response.json().catch(() => null);
    await logRequest({
      server: "market",
      url: call.path,
      method: call.method,
      status: response.status,
      durationMs: elapsed(),
      backend: "core",
      requestBody: call.body,
      responseBody: json,
    });
    // The market backend can also refuse with a 200 and `isSuccessful: false`.
    if (response.ok && json?.isSuccessful === false) {
      return { status: 400, data: null };
    }
    return { status: response.status, data: response.ok ? json?.data : null };
  } catch (error) {
    const timedOut = (error as any)?.name === "TimeoutError";
    await logRequest({
      server: "market",
      url: call.path,
      method: call.method,
      status: timedOut ? 504 : 0,
      durationMs: elapsed(),
      backend: "core",
      requestBody: call.body,
      error,
    });
    return { status: timedOut ? 504 : 502, data: null };
  }
}

/** The error words the browser gets, one for each HTTP code. Never the backend's message. */
const ERROR_WORDS: Record<number, string> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  410: "expired",
  429: "too_many_requests",
  504: "timeout",
};

/** `{ "error": "expired" }` with the same HTTP code the market backend returned. */
export function errorReply(status: number) {
  const code = status >= 400 && status < 600 ? status : 502;
  return NextResponse.json(
    { error: ERROR_WORDS[code] || "server_error" },
    { status: code },
  );
}

/** Turns the backend's `expires_at` (ISO date) into epoch milliseconds. */
export function toEpochMs(expiresAt: unknown): number {
  const ms = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  // Fall back to the agreed 60 seconds, so the screen still makes a new code in time.
  return Number.isFinite(ms) ? ms : Date.now() + 60_000;
}

/** Reads `requestId` from a JSON body. */
export async function readRequestId(request: NextRequest): Promise<string | null> {
  const body = await request.json().catch(() => null);
  return isRequestId(body?.requestId) ? body.requestId : null;
}
