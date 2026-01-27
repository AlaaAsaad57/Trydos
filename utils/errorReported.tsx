import * as Sentry from "@sentry/nextjs";

export async function ReportError(error: any) {
  // Auto context (best-effort, safe in SSR)
  const auto: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    auto.url = window.location?.href;
    auto.userAgent = window.navigator?.userAgent;
  }
  const merged = {
    ...auto,
    ...error,
  };

  Sentry.withScope((scope) => {
    if ((merged as any).source)
      scope.setTag(
        "source",
        String(
          (merged as any)?.source ??
            (merged as any)?.scenario ??
            (merged as any)?.type,
        ),
      );

    if (Object.keys(merged).length > 0) scope.setExtras(merged);
    if ((merged as any).source)
      scope.setTag(
        "source",
        String(
          (merged as any)?.source ??
            (merged as any)?.scenario ??
            (merged as any)?.type,
        ),
      );
    Sentry.captureException(error);
  });
}
