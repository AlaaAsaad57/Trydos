import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HTTP_BUCKETS,
  getMetricsRegistry,
  initMetrics,
  logHttpResponse,
  normalizeRoute,
  recordHttpMetric,
} from "utils/server/httpObservability.mjs";

describe("httpObservability route normalization (cardinality protection)", () => {
  it("excludes self-monitoring probes and static asset paths from HTTP metrics", () => {
    for (const excluded of [
      "/metrics",
      "/health",
      "/ready",
      "/live",
      "/robots.txt",
      "/favicon.ico",
      "/_next/static/chunks/main-123.js",
      "/icons/Logo.svg",
      "/images/banner.webp",
    ]) {
      expect(
        normalizeRoute(excluded, 200),
        `expected ${excluded} to be excluded from HTTP metrics`,
      ).toBeNull();
    }
  });

  it("collapses locale prefixes and dynamic slugs/ids into bounded templates", () => {
    expect(
      normalizeRoute("/sy-en", 200),
      "locale root should normalize to /:locale",
    ).toBe("/:locale");
    expect(
      normalizeRoute("/lb-ar/products/nike-air-9912?color=red", 200),
      "product page should normalize locale and productId and drop query string",
    ).toBe("/:locale/products/:productId");
    expect(
      normalizeRoute("/tr-tr/categories/women-shoes/", 200),
      "category page should normalize locale and slug",
    ).toBe("/:locale/categories/:slug");
    expect(
      normalizeRoute("/sy-en/filters/brand-a/size-42", 200),
      "filters catch-all should collapse to /:locale/filters/*",
    ).toBe("/:locale/filters/*");
    expect(
      normalizeRoute("/sy-en/settings/orders/55123", 200),
      "order detail page should collapse order id",
    ).toBe("/:locale/settings/orders/:id");
    expect(
      normalizeRoute(
        "/sy-en/sellerProfile/sellerDashboard/44/products/8891",
        200,
      ),
      "seller dashboard product route should normalize sellerId and productId",
    ).toBe("/:locale/sellerProfile/sellerDashboard/:sellerId/products/:productId");
  });

  it("normalizes dynamic API routes and buckets unknown 404 paths under __unmatched__", () => {
    expect(
      normalizeRoute("/api/mobile/product/details/summer-dress-12", 200),
      "mobile product details API should collapse slug",
    ).toBe("/api/mobile/product/details/:slug");
    expect(
      normalizeRoute("/api/related-products/99213", 200),
      "related-products API should collapse numeric id",
    ).toBe("/api/related-products/:id");
    expect(
      normalizeRoute("/api/proxy?s=mkt&u=/product/list", 200),
      "proxy API should drop query string",
    ).toBe("/api/proxy");
    expect(
      normalizeRoute("/wp-login.php", 404),
      "scanner/unknown path must collapse to __unmatched__",
    ).toBe("__unmatched__");
    expect(
      normalizeRoute("/api/does-not-exist/abc", 404),
      "unmatched API 404 must collapse to __unmatched__",
    ).toBe("__unmatched__");
  });
});

describe("httpObservability Prometheus metrics", () => {
  beforeEach(() => {
    initMetrics();
    getMetricsRegistry().resetMetrics();
  });

  it("exports standard HTTP metrics and Node runtime metrics in Prometheus text format", async () => {
    expect(
      DEFAULT_HTTP_BUCKETS,
      "HTTP histogram buckets must match the Application Metrics Standard",
    ).toEqual([0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);

    recordHttpMetric({
      method: "get",
      url: "/sy-en/products/demo-slug?ref=home",
      statusCode: 200,
      durationSeconds: 0.12,
    });
    recordHttpMetric({
      method: "GET",
      url: "/health",
      statusCode: 200,
      durationSeconds: 0.001,
    });

    const output = await getMetricsRegistry().metrics();

    expect(
      output,
      "http_requests_total should record normalized method/route/status labels",
    ).toContain(
      'http_requests_total{method="GET",route="/:locale/products/:productId",status="200"} 1',
    );
    expect(
      output,
      "http_request_duration_seconds should be exported",
    ).toContain("http_request_duration_seconds_bucket");
    expect(
      output,
      "/health probe must not appear in HTTP metrics",
    ).not.toContain('route="/health"');
    expect(
      output,
      "default Node.js runtime metric process_resident_memory_bytes must be present",
    ).toContain("process_resident_memory_bytes");
    expect(
      output,
      "default Node.js event loop lag metric must be present",
    ).toContain("nodejs_eventloop_lag_seconds");
  });
});

describe("httpObservability structured JSON access logging", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("writes one JSON line to stdout for 2xx/4xx and stderr for 5xx without query strings", () => {
    vi.stubEnv("LOG_LEVEL", "info");
    vi.stubEnv("APP_ENV", "staging");

    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    logHttpResponse({
      requestId: "req-abc-123",
      method: "GET",
      url: "/sy-en/products/item-1?token=secret123",
      route: "/:locale/products/:productId",
      statusCode: 200,
      durationMs: 42.345,
    });

    const stdoutLine = String(stdoutSpy.mock.calls[0]?.[0] ?? "");
    const parsedOk = JSON.parse(stdoutLine);
    expect(parsedOk.service, "service label should be trydos-storefront").toBe(
      "trydos-storefront",
    );
    expect(parsedOk.env, "env label should come from APP_ENV").toBe("staging");
    expect(parsedOk.level, "200 response should log at info level").toBe("info");
    expect(parsedOk.request_id, "request_id should be attached").toBe(
      "req-abc-123",
    );
    expect(parsedOk.path, "query string must be stripped from access log path").toBe(
      "/sy-en/products/item-1",
    );
    expect(stdoutLine, "sensitive query token must not appear in log line").not.toContain(
      "secret123",
    );

    logHttpResponse({
      requestId: "req-err-500",
      method: "POST",
      url: "/api/proxy",
      route: "/api/proxy",
      statusCode: 500,
      durationMs: 120,
    });

    const stderrLine = String(stderrSpy.mock.calls[0]?.[0] ?? "");
    const parsedErr = JSON.parse(stderrLine);
    expect(parsedErr.level, "500 response should log at error level on stderr").toBe(
      "error",
    );
    expect(parsedErr.status_code, "status_code should be 500").toBe(500);
  });

  it("suppresses /health probe logs at info level to avoid flooding Loki", () => {
    vi.stubEnv("LOG_LEVEL", "info");
    const stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const entry = logHttpResponse({
      requestId: "req-health",
      method: "GET",
      url: "/health",
      route: "/health",
      statusCode: 200,
      durationMs: 1.2,
    });

    expect(entry, "/health should be filtered out when LOG_LEVEL=info").toBeNull();
    expect(
      stdoutSpy.mock.calls.length,
      "/health should not write to stdout at info level",
    ).toBe(0);
  });
});
