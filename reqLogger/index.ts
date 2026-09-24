// reqLogger — one structured line per backend call, shaped for Vercel search.
//
// WHY THE SHAPE IS WHAT IT IS
// Vercel's Logs tab can only text-search the log *message* and the request
// path. It cannot see fields inside a JSON payload. So every value you want to
// search by has to sit in the message as plain text. That is why each line
// starts with short `key=value` tokens and only then carries the JSON detail:
//
//   [req] srv=market api=/product/list m=GET st=200 uid=422 ms=812 {"name":…}
//
// In the Vercel search box that gives you:
//   uid=422          every request one shopper made
//   st=500           every failure
//   api=/auth/login  one endpoint
//   srv=wallet       one backend
//   uid=422 st=500   that shopper's failures
//
// Anything with status >= 400 goes out through console.error, so Vercel marks
// the row red and the "Level: Error" filter finds it too.
//
// OFF BY DEFAULT
//   REQ_LOG=1       turn logging on
//   REQ_LOG_BODY=1  also log bodies on SUCCESS (bodies are always logged on a
//                   failure, whatever this is set to)
// With REQ_LOG unset, logRequest returns before it reads a cookie or builds a
// string, so the cost is zero.
//
// COOKIE READING
// This module is reached from serverRequests/ServerFetch.tsx, which sits in the
// client graph. Importing next/headers there fails the build — statically and
// dynamically. So the user lookup goes through the same bare-require hatch the
// server error reporter uses. See utils/cookies/server-cookie-fallback.

import { COOKIE_NAMES, deserialize } from "utils/cookies/cookie-manager";
import { readServerCookies } from "utils/cookies/server-cookie-fallback";

/** Keys whose value is a credential and must never reach a log.
 *
 *  Deliberately narrow, and it mirrors CREDENTIAL_FIELDS in utils/fetchData.ts:
 *  `code` is not here because it is a coupon or a country far more often than a
 *  one-time code, and over-redacting leaves a log nobody can act on. The
 *  one-time code's real key is `otp`. */
const CREDENTIAL_KEYS = new Set([
  "token",
  "id_token",
  "otp_id_token",
  "otp",
  "password",
  "access_token",
  "refresh_token",
  "auth_token",
  "authorization",
]);

const REDACTED = "[redacted]";
/** Cut for one body, in characters — not bytes. English costs 1 byte per
 *  character, Arabic 2 in UTF-8, so 10000 characters is about 10 KB, or 20 KB
 *  worst case. The whole detail part is capped again at BODY_LIMIT * 3 below.
 *  Vercel allows 256 KB per line and 1 MB per request, so even a login writing
 *  six of these lines stays well inside both. */
const BODY_LIMIT = 10000;
/** Stop walking a deeply nested body. Guards against a cyclic object too. */
const MAX_DEPTH = 6;

export const REQ_LOG_ON = process.env.REQ_LOG === "1";
const LOG_BODY_ON_SUCCESS = process.env.REQ_LOG_BODY === "1";

export interface ReqLogEntry {
  /** Service role name — market, chat, stories, comments, wallet, elastic.
   *  Never the backing technology (CLAUDE.md "Stack-agnostic naming"). */
  server: string;
  /** The target URL or path. The query string is stripped for the searchable
   *  `api=` token and kept in full in the JSON detail. */
  url: string;
  method?: string;
  status: number;
  durationMs?: number;
  requestBody?: unknown;
  responseBody?: unknown;
  /** Which market backend answered: "core" or "gateway". */
  backend?: string;
  error?: unknown;
  /** Pass these when the User-Data cookie is not written yet — the login route
   *  knows the shopper before the cookie exists. */
  userId?: string | number;
  userName?: string;
}

/** Start a stopwatch. Call the returned function to read whole milliseconds.
 *
 *  Reads no clock at all while logging is off, which is the default. That
 *  matters because callers start the stopwatch before they know whether the
 *  line will be written, and some of them run inside a `"use cache"` scope —
 *  see tests/cache/noRuntimeReadsInCachedTree.test.ts. */
export function startTimer(): () => number {
  if (!REQ_LOG_ON) return () => 0;
  const t0 = Date.now();
  return () => Date.now() - t0;
}

/** Replace credential values, cut long strings, and stop at MAX_DEPTH. */
function scrub(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[deep]";

  if (typeof value === "string") {
    // A body often arrives as a JSON string. Parse it so the keys inside can be
    // redacted; if it is not JSON, treat it as plain text.
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return scrub(JSON.parse(trimmed), depth);
      } catch {
        // not JSON after all — fall through to the plain-text cut
      }
    }
    return value.length > BODY_LIMIT ? value.slice(0, BODY_LIMIT) + "…" : value;
  }

  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));

  // FormData and streams carry no useful text and can be huge — name the kind
  // instead of trying to read it.
  if (typeof (value as any)?.getAll === "function") return "[form-data]";

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = CREDENTIAL_KEYS.has(key.toLowerCase()) ? REDACTED : scrub(v, depth + 1);
  }
  return out;
}

/** Turn any thrown value into something short and readable. */
function describeError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(scrub(error));
  } catch {
    return String(error);
  }
}

/** Read the shopper out of the User-Data cookie. Best effort: a missing or
 *  unreadable cookie yields a guest, never an exception. */
async function readUser(): Promise<{ id: string; name: string }> {
  try {
    const [raw] = await readServerCookies([COOKIE_NAMES.USER_DATA]);
    if (!raw) return { id: "-", name: "" };
    const user = deserialize<any>(decodeURIComponent(raw));
    return {
      id: user?.id != null ? String(user.id) : "-",
      name: typeof user?.name === "string" ? user.name : "",
    };
  } catch {
    return { id: "-", name: "" };
  }
}

/** Split a target into the searchable path and the host it went to.
 *
 *  Call sites do not agree on the shape they hold: the proxy has a path
 *  ("/product/list"), the server fetch has a whole URL. Both must produce the
 *  same `api=` token, or one search cannot find both. The host is not thrown
 *  away — it moves into the JSON detail, where it names which machine answered.
 */
function splitUrl(url: string): { api: string; host: string } {
  const noQuery = url.split("?")[0];
  if (!/^https?:\/\//i.test(noQuery)) return { api: noQuery, host: "" };
  try {
    const parsed = new URL(noQuery);
    return { api: parsed.pathname, host: parsed.host };
  } catch {
    return { api: noQuery, host: "" };
  }
}

/**
 * Write one line for one backend call.
 *
 * Never throws and never blocks the request it describes: a logging failure
 * must not become a shopper-visible failure.
 */
export async function logRequest(entry: ReqLogEntry): Promise<void> {
  if (!REQ_LOG_ON) return;

  try {
    const {
      server,
      url,
      method = "GET",
      status,
      durationMs,
      requestBody,
      responseBody,
      backend,
      error,
      userId,
      userName,
    } = entry;

    // status 0 is "the call never landed" (network error, abort, timeout).
    const failed = status === 0 || status >= 400 || Boolean(error);
    const withBodies = failed || LOG_BODY_ON_SUCCESS;

    let id = userId != null ? String(userId) : "";
    let name = userName ?? "";
    if (!id || !name) {
      const fromCookie = await readUser();
      id = id || fromCookie.id;
      name = name || fromCookie.name;
    }

    // The searchable half. Short keys, no spaces inside a value, so a search
    // for "uid=422" matches this line and nothing near it.
    const { api, host } = splitUrl(String(url));
    const head =
      `[req] srv=${server} api=${api} m=${method} st=${status} uid=${id}` +
      (durationMs != null ? ` ms=${durationMs}` : "");

    // The detail half.
    const detail: Record<string, unknown> = {};
    if (name) detail.name = name;
    if (host) detail.host = host;
    if (backend) detail.backend = backend;
    if (url !== api) detail.url = url;
    const errText = describeError(error);
    if (errText) detail.err = errText;
    if (withBodies) {
      if (requestBody !== undefined) detail.req = scrub(requestBody);
      if (responseBody !== undefined) detail.res = scrub(responseBody);
    }

    let tail = "";
    try {
      tail = " " + JSON.stringify(detail);
    } catch {
      // A cyclic object survived the walk — keep the searchable half, drop the
      // detail rather than losing the whole line.
      tail = ' {"detail":"[unserializable]"}';
    }
    if (tail.length > BODY_LIMIT * 3) tail = tail.slice(0, BODY_LIMIT * 3) + "…}";

    const line = head + tail;
    if (failed) console.error(line);
    else console.log(line);
  } catch {
    // Logging is best-effort and must never break a request.
  }
}
