// Prometheus metrics and structured JSON HTTP logging for the Trydos storefront
// when running in Docker (`node server.mjs`).
//
// Implements the company Application Metrics Standard and Production Logging
// Guide with parity to MediaServing:
//   - GET /metrics in Prometheus text exposition format
//   - http_requests_total (Counter) and http_request_duration_seconds (Histogram)
//   - Node.js runtime metrics via prom-client collectDefaultMetrics()
//   - Strict route-template normalization to prevent high cardinality
//   - One structured JSON log line per completed HTTP request on stdout/stderr

import client from "prom-client";

export const DEFAULT_HTTP_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

const EXCLUDED_EXACT_PATHS = new Set([
  "/metrics",
  "/health",
  "/ready",
  "/live",
  "/robots.txt",
  "/robots",
  "/favicon.ico",
  "/manifest.json",
  "/firebase-messaging-sw.js",
]);

const EXCLUDED_PREFIXES = [
  "/_next/static/",
  "/assets/",
  "/icons/",
  "/fonts/",
  "/images/",
  "/styles/",
  "/translations/",
  "/static/",
];

const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const PROBE_PATHS = new Set(["/health", "/ready", "/live", "/metrics"]);

const LOCALE_SEGMENT_RE = /^[a-z]{2}-[a-z]{2}$/i;
const DYNAMIC_ID_RE = /^(?:\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const STATIC_LOCALE_PAGES = new Set([
  "about",
  "compare",
  "contact",
  "loginDemo",
  "privacy-policy",
  "sellerProfile",
  "sitemap.xml",
  "terms-of-service",
  "timeline",
]);

const STATIC_SETTINGS_SUBPAGES = new Set([
  "checklist",
  "countries",
  "languages",
  "orders",
  "prefferences",
  "profile",
  "wallet",
]);

const STATIC_PROFILE_SUBPAGES = new Set([
  "address",
  "Bank-Cards",
  "info",
  "picture",
  "size",
]);

const STATIC_SPECIAL_PATHS = new Set([
  "/callInProg",
  "/call_direct",
  "/endCall",
  "/navigation",
  "/loginDemo",
  "/simulateUser",
  "/sitemap.xml",
  "/sitemap-home.xml",
  "/sitemap-products.xml",
  "/sitemap-boutiques.xml",
  "/sitemap-search.xml",
  "/sitemap-static.xml",
]);

function getOrCreateMetrics() {
  const g = globalThis;
  if (g.__trydosPromMetrics) return g.__trydosPromMetrics;

  const register = client.register;

  const httpRequestsTotal =
    register.getSingleMetric("http_requests_total") ||
    new client.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests.",
      labelNames: ["method", "route", "status"],
      registers: [register],
    });

  const httpRequestDuration =
    register.getSingleMetric("http_request_duration_seconds") ||
    new client.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds.",
      labelNames: ["method", "route", "status"],
      buckets: DEFAULT_HTTP_BUCKETS,
      registers: [register],
    });

  g.__trydosPromMetrics = {
    register,
    httpRequestsTotal,
    httpRequestDuration,
    defaultsRegistered: false,
  };

  return g.__trydosPromMetrics;
}

/**
 * Initialize default Node.js runtime metrics once per process.
 */
export function initMetrics() {
  const state = getOrCreateMetrics();
  if (!state.defaultsRegistered) {
    client.collectDefaultMetrics({ register: state.register });
    state.defaultsRegistered = true;
  }
  return state;
}

export function getMetricsRegistry() {
  return getOrCreateMetrics().register;
}

function stripQueryAndTrailingSlash(rawUrl) {
  const pathOnly = String(rawUrl || "/").split("?")[0] || "/";
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
    return pathOnly.replace(/\/+$/, "") || "/";
  }
  return pathOnly;
}

/**
 * Resolve a raw URL into a low-cardinality route template per Application
 * Metrics Standard §2-§3. Returns null for self-monitoring probes and static
 * asset paths that must be excluded from HTTP metrics.
 */
export function normalizeRoute(rawUrl, statusCode) {
  const pathname = stripQueryAndTrailingSlash(rawUrl);

  if (EXCLUDED_EXACT_PATHS.has(pathname)) return null;
  for (const prefix of EXCLUDED_PREFIXES) {
    if (pathname.startsWith(prefix)) return null;
  }

  if (pathname === "/") return "/";
  if (pathname === "/_next/image") return "/_next/image";
  if (pathname.startsWith("/_next/data/")) return "/_next/data/*";
  if (pathname === "/ingest" || pathname.startsWith("/ingest/")) {
    return "/ingest/*";
  }

  if (STATIC_SPECIAL_PATHS.has(pathname)) return pathname;

  // API routes
  if (pathname.startsWith("/api/")) {
    if (statusCode === 404) return "__unmatched__";
    if (pathname.startsWith("/api/mobile/product/details/")) {
      return "/api/mobile/product/details/:slug";
    }
    if (pathname.startsWith("/api/mobile/product/qty/")) {
      return "/api/mobile/product/qty/:slug";
    }
    if (pathname.startsWith("/api/related-products/")) {
      return "/api/related-products/:id";
    }
    const apiParts = pathname.split("/").filter(Boolean);
    const normalizedApi = apiParts.map((seg) =>
      DYNAMIC_ID_RE.test(seg) ? ":id" : seg,
    );
    return "/" + normalizedApi.join("/");
  }

  // Locale-prefixed storefront pages (e.g. /sy-en/products/abc -> /:locale/products/:productId)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 1 && LOCALE_SEGMENT_RE.test(segments[0])) {
    if (segments.length === 1) return "/:locale";

    const section = segments[1];
    if (section === "products" && segments.length >= 3) {
      return "/:locale/products/:productId";
    }
    if (section === "categories" && segments.length >= 3) {
      return "/:locale/categories/:slug";
    }
    if (section === "filters") {
      return segments.length === 2 ? "/:locale/filters" : "/:locale/filters/*";
    }
    if (section === "featured") {
      return segments.length === 2 ? "/:locale/featured" : "/:locale/featured/*";
    }
    if (section === "flashDeals") {
      return segments.length === 2
        ? "/:locale/flashDeals"
        : "/:locale/flashDeals/*";
    }
    if (section === "settings") {
      if (segments.length === 2) return "/:locale/settings";
      if (segments[2] === "orders" && segments.length >= 4) {
        return "/:locale/settings/orders/:id";
      }
      if (segments[2] === "profile" && segments.length >= 4) {
        return STATIC_PROFILE_SUBPAGES.has(segments[3])
          ? `/:locale/settings/profile/${segments[3]}`
          : "__unmatched__";
      }
      return STATIC_SETTINGS_SUBPAGES.has(segments[2])
        ? `/:locale/settings/${segments[2]}`
        : "__unmatched__";
    }
    if (section === "sellerProfile") {
      if (segments.length === 2) return "/:locale/sellerProfile";
      if (segments[2] === "sellerDashboard" && segments.length >= 4) {
        if (segments.length === 4) {
          return "/:locale/sellerProfile/sellerDashboard/:sellerId";
        }
        if (segments[4] === "boutiques" && segments.length >= 6) {
          return segments[5] === "new"
            ? "/:locale/sellerProfile/sellerDashboard/:sellerId/boutiques/new"
            : "/:locale/sellerProfile/sellerDashboard/:sellerId/boutiques/:boutiqueId";
        }
        if (segments[4] === "products" && segments.length >= 6) {
          return segments[5] === "new"
            ? "/:locale/sellerProfile/sellerDashboard/:sellerId/products/new"
            : "/:locale/sellerProfile/sellerDashboard/:sellerId/products/:productId";
        }
      }
      return "__unmatched__";
    }
    if (section === "demo") {
      if (segments.length === 2) return "/:locale/demo";
      if (segments[2] === "store" && segments.length >= 4) {
        return segments.length >= 5
          ? "/:locale/demo/store/:store/:product"
          : "/:locale/demo/store/:store";
      }
      if (segments[2] === "settings" && segments[3] === "orders" && segments.length >= 5) {
        return "/:locale/demo/settings/orders/:id";
      }
      return "/:locale/demo/*";
    }
    if (segments.length === 2 && STATIC_LOCALE_PAGES.has(section)) {
      return `/:locale/${section}`;
    }
    return "__unmatched__";
  }

  return "__unmatched__";
}

/**
 * Record an HTTP request in Prometheus metrics if the route is not excluded.
 */
export function recordHttpMetric({ method, url, statusCode, durationSeconds }) {
  const route = normalizeRoute(url, statusCode);
  if (route === null) return null;

  const { httpRequestsTotal, httpRequestDuration } = getOrCreateMetrics();
  const labels = {
    method: String(method || "GET").toUpperCase(),
    route,
    status: String(statusCode),
  };

  httpRequestDuration.observe(labels, Math.max(0, durationSeconds));
  httpRequestsTotal.inc(labels);
  return route;
}

function resolveEnvLabel() {
  return (
    process.env.APP_ENV ||
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development"
  );
}

function getConfiguredLogLevel() {
  const defaultLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
  const name = String(process.env.LOG_LEVEL || defaultLevel).toLowerCase();
  return LOG_LEVELS[name] ?? LOG_LEVELS.info;
}

/**
 * Emit a structured JSON log line for an HTTP request (or server lifecycle
 * event) matching PRODUCTION_LOGGING_GUIDE_AR.md.
 */
export function writeStructuredLog(level, message, fields = {}) {
  const levelNum = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  if (levelNum < getConfiguredLogLevel()) return null;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    env: resolveEnvLabel(),
    service: "trydos-storefront",
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (levelNum >= LOG_LEVELS.error) {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
  return entry;
}

/**
 * Log a completed HTTP request. Health/metrics probes are logged at debug to
 * avoid flooding Loki in production.
 */
export function logHttpResponse({
  requestId,
  method,
  url,
  route,
  statusCode,
  durationMs,
  userAgent = undefined,
}) {
  const path = stripQueryAndTrailingSlash(url);

  // Skip static bundle assets from info-level access logs to keep log volume sane.
  for (const prefix of EXCLUDED_PREFIXES) {
    if (path.startsWith(prefix)) return null;
  }

  let level;
  if (PROBE_PATHS.has(path) && statusCode < 400) {
    level = "debug";
  } else if (statusCode >= 500) {
    level = "error";
  } else if (statusCode >= 400) {
    level = "warn";
  } else {
    level = "info";
  }

  return writeStructuredLog(level, "request completed", {
    component: "HttpServer",
    request_id: requestId,
    http_method: String(method || "GET").toUpperCase(),
    path,
    route: route || path,
    status_code: statusCode,
    duration_ms: Math.round(durationMs * 100) / 100,
    ...(userAgent ? { user_agent: String(userAgent).slice(0, 200) } : {}),
  });
}
