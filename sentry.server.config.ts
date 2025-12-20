import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
  tracesSampleRate: 1,
  enableLogs: true,
  debug: false,
});
