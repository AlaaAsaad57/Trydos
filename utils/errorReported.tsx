import * as Sentry from "@sentry/nextjs";

/**
 * Report an enriched error object to Sentry.
 *
 * IMPORTANT: This is the single gateway to Sentry.captureException.
 * It converts the payload into a real Error instance so Sentry groups
 * issues by `scenario` (or `source` / `type`) instead of dumping
 * "Non-Error exception captured with keys: …".
 *
 * Context fields (userData, last_paths, etc.) are attached as extras
 * so they appear in the Sentry issue sidebar.
 */
export async function ReportError(error: any) {
  // --- 1. Build a real Error for proper grouping ---
  try {
    const scenario =
      error?.scenario ?? error?.source ?? error?.type ?? "unknown";
    let message = error?.message ?? error?.error;
    if (typeof message !== "string") {
      if (message === undefined || message === null) {
        message = "Unknown error";
      } else {
        try {
          message = JSON.stringify(message);
        } catch {
          message = String(message);
        }
      }
    }

    const sentryError = new Error(`[${scenario}] ${message}`);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(sentryError, ReportError);
    }
    if (error?.stack) sentryError.stack = error.stack;

    // --- 2. Set user context (so you can search by user in Sentry) ---
    const userId =
      error?.userData?.id ?? error?.user_id ?? error?.userId ?? undefined;
    if (userId) {
      Sentry.setUser({
        id: String(userId),
        username: error?.userData?.name ?? undefined,
        ip_address: error?.userIP ?? undefined,
      });
    }

    // --- 3. Capture with structured scope ---
    Sentry.withScope((scope) => {
      // Tags: indexed, searchable in Sentry UI
      scope.setTag("scenario", String(scenario));
      if (error?.country) scope.setTag("country", String(error.country));
      if (error?.language) scope.setTag("language", String(error.language));
      if (error?.request_server)
        scope.setTag("server", String(error.request_server));
      if (error?.url || error?.current_url || error?.page)
        scope.setTag(
          "page_url",
          String(error.url ?? error.current_url ?? error.page),
        );

      // Fingerprint: group errors by scenario so same scenario = same issue
      scope.setFingerprint([
        scenario,
        typeof message === "string"
          ? message.substring(0, 100)
          : String(message),
      ]);

      // Extras: full context visible in the issue detail
      const extras: Record<string, unknown> = {};
      const extraKeys = [
        "last_paths",
        "last_request",
        "request_url",
        "request_method",
        "request_body",
        "request_server",
        "lastJson",
        "userChat",
        "userData",
        "userStories",
        "country",
        "language",
        "userIP",
        "url",
        "current_url",
        "page",
        "user_agent",
        "timestamp",
        "sessionId",
      ];
      for (const key of extraKeys) {
        if (error?.[key] !== undefined) extras[key] = error[key];
      }
      if (Object.keys(extras).length > 0) scope.setExtras(extras);

      // Breadcrumb: add a custom breadcrumb with the scenario
      scope.addBreadcrumb({
        category: "error-report",
        message: `${scenario}: ${typeof message === "string" ? message.substring(0, 200) : String(message)}`,
        level: "error",
        data: {
          country: error?.country,
          language: error?.language,
          page: error?.url ?? error?.current_url ?? error?.page,
        },
      });

      Sentry.captureException(sentryError);
    });
  } catch (error) {
    console.error("Error in ReportError:", error);
  }
}
