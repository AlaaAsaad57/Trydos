import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_DSN_SENTRY,
  environment: process.env.NODE_ENV,

  // --- Performance ---
  // Free tier: keep sample rates low to stay within quota
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // --- Logs ---
  enableLogs: true,

  // --- Filtering ---
  beforeSend(event) {
    const msg = event.exception?.values?.[0]?.value ?? "";

    // Drop noisy/non-actionable errors
    const ignored = [
      "signal is aborted without reason",
      "Fetch is aborted",
      "Load failed",
      "Failed to fetch",
      "NetworkError",
      "AbortError",
      "ResizeObserver loop",
      "Script error.",
      "Non-Error promise rejection captured",
    ];
    if (ignored.some((i) => msg.includes(i))) return null;

    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Drop noisy console.log breadcrumbs but keep warn/error
    if (
      breadcrumb.category === "console" &&
      breadcrumb.level !== "warning" &&
      breadcrumb.level !== "error"
    ) {
      return null;
    }
    return breadcrumb;
  },

  debug: process.env.NODE_ENV !== "production",
});

export default Sentry;
