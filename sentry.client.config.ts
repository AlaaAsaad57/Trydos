import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

export default Sentry;
