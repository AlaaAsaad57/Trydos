// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
  // Logs disabled to trim always-on client work; error/perf reporting unaffected.
  enableLogs: false,

  // Off, so no cookie and no IP address rides along with a browser event
  // (readiness A1-10).
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  // Keeps staging and production events apart. The browser only sees
  // NEXT_PUBLIC_ values, so the public copy of the setting is read here.
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
