import * as Sentry from "@sentry/node";

if (!Sentry.isInitialized()) {
  Sentry.init({
    dsn: process.env.DSN_SENTRY,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}

export default Sentry;
