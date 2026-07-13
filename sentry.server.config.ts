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

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  });
}
