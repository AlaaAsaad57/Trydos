import * as Sentry from "@sentry/nextjs";

type ReportExtras = Record<string, unknown> | undefined | null;

const truncate = (val: unknown, max = 1000): unknown => {
  if (typeof val === "string")
    return val.length > max ? val.slice(0, max) : val;
  try {
    if (val && typeof val === "object") {
      const json = JSON.stringify(val);
      return json.length > max ? json.slice(0, max) : val;
    }
  } catch (_) {}
  return val;
};

const mergeExtras = (...extras: ReportExtras[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const e of extras) {
    if (!e || typeof e !== "object") continue;
    for (const [k, v] of Object.entries(e)) {
      if (v === undefined) continue;
      out[k] = truncate(v);
    }
  }
  return out;
};

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
    if (merged) scope.setTags(merged);

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
