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

export async function ReportError(error: any, ...extras: ReportExtras[]) {
  // Auto context (best-effort, safe in SSR)
  const auto: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    auto.url = window.location?.href;
    auto.userAgent = window.navigator?.userAgent;
  }

  const merged = mergeExtras(auto, ...(error ?? extras ?? {}));

  // Reserved optional fields
  const tags = (merged.tags as Record<string, string>) || undefined;
  const user = (merged.user as Record<string, unknown>) || undefined;
  const level = (merged.level as Sentry.SeverityLevel) || undefined;

  // Remove reserved keys from extras (so they don't duplicate under extras)
  delete (merged as any).tags;
  delete (merged as any).user;
  delete (merged as any).level;

  Sentry.withScope((scope) => {
    if (tags && typeof tags === "object") scope.setTags(tags);
    if (user && typeof user === "object") scope.setUser(user as any);
    if (level) scope.setLevel(level);

    if (Object.keys(merged).length > 0) scope.setExtras(merged);
    if ((merged as any).source)
      scope.setTag("source", String((merged as any).source));
    if ((merged as any).page)
      scope.setTag("page", String((merged as any).page));
    if ((merged as any).url) scope.setTag("url", String((merged as any).url));

    Sentry.captureException(error);
  });
}
