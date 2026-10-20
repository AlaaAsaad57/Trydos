// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Skip Sentry (and its OpenTelemetry auto-instrumentation) on the local dev
// server to avoid the instrumentation overhead. Production/preview builds
// (NODE_ENV=production) always init unchanged; a dev can opt back in with
// ENABLE_SENTRY=true.
const sentryEnabled =
  process.env.NODE_ENV !== "development" ||
  process.env.ENABLE_SENTRY === "true";

/** The QA-mode header. Written out rather than imported, because this file runs
 *  before the app and must not pull the app's module graph in behind it. */
const QA_VIEW_HEADER = "x-qa-view";

/** Take the QA-mode header out of anything on its way to Sentry.
 *
 *  Request headers ride along with server errors and transactions even with
 *  `sendDefaultPii` off (that setting drops cookies and the IP address, not the
 *  other headers). The QA header carries `QA_VIEW_SECRET` — the one
 *  value that can unfilter the catalogue — so it must not be stored anywhere
 *  outside the request that sent it.
 *
 *  Matched case-insensitively: a `Headers` object is case-insensitive on read,
 *  but by the time Sentry has it, it is a plain object with whatever casing the
 *  sender used.
 *
 *  **This is the whole of the QA-header fix.** The six route handlers that pass
 *  `headers: request.headers` into an error report reach nothing — the report
 *  builder copies an allow-list with no `headers` key, and the serializer walks
 *  `Object.keys()`, which a `Headers` instance has none of.
 *
 *  **Read the limit honestly:** this removes one header. The session cookies
 *  stopped reaching Sentry on 2026-10-20, when `sendDefaultPii` went off. */
const stripQaHeader = <T extends { request?: { headers?: unknown } }>(
  event: T,
): T => {
  const headers = event.request?.headers;
  if (!headers || typeof headers !== "object") return event;

  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === QA_VIEW_HEADER) {
      delete (headers as Record<string, unknown>)[name];
    }
  }

  return event;
};

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,

    // Enable logs to be sent to Sentry
    //
    // NOTE: logs bypass `beforeSend`. If anything ever logs a whole request
    // through `Sentry.logger`, the scrub below will not cover it.
    enableLogs: true,

    // Off, so no cookie and no IP address rides along with an event. Every
    // session token lives in an HttpOnly cookie, and with this on they all
    // reached Sentry (readiness A1-10).
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false,

    // Keeps staging and production events apart. Set SENTRY_ENVIRONMENT in
    // Vercel; without it the Vercel deployment type is used.
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV,

    // Both hooks, because an error event and a transaction are separate
    // payloads and each carries its own copy of the request.
    beforeSend: stripQaHeader,
    beforeSendTransaction: stripQaHeader,
  });
}

// `sentry.edge.config.ts` has no equivalent and does not need one today: there
// is no edge route in this app (`instrumentation.ts` registers the Node config
// only). Add the same two hooks there on the day one appears.
