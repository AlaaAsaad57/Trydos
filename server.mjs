// Custom HTTP entry point for running the Trydos storefront in Docker.
//
// Wraps Next.js (`next start`) in a standard Node HTTP server so the server
// deployment gets the exact same observability surface as MediaServing without
// modifying protected Next.js runtime files (`proxy.ts`, `next.config.ts`,
// `instrumentation.ts`) or affecting Vercel deployments:
//   - GET /health  -> 200 {"status":"ok"} (fast liveness probe)
//   - GET /metrics -> Prometheus text exposition format (HTTP + Node runtime)
//   - X-Request-ID propagation via AsyncLocalStorage -> reqLogger & ServerFetch
//   - One structured JSON log line per completed request on stdout/stderr

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import http from "node:http";
import next from "next";
import {
  getMetricsRegistry,
  initMetrics,
  logHttpResponse,
  recordHttpMetric,
  writeStructuredLog,
} from "./utils/server/httpObservability.mjs";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10) || 3000;

// Shared per-request context read by reqLogger/index.ts and outbound fetchers
// via globalThis without importing node:async_hooks into the Next client graph.
const requestContext = new AsyncLocalStorage();
globalThis.__trydosRequestContext = requestContext;

initMetrics();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function readRequestId(req) {
  const header =
    req.headers["x-request-id"] || req.headers["x-correlation-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim().slice(0, 128);
  }
  return randomUUID();
}

await app.prepare();

const server = http.createServer(async (req, res) => {
  const startNs = process.hrtime.bigint();
  const requestId = readRequestId(req);
  const method = req.method || "GET";
  const url = req.url || "/";
  const pathOnly = url.split("?")[0];

  res.setHeader("X-Request-ID", requestId);

  // Fast liveness probe — bypasses proxy.ts locale routing.
  if (method === "GET" && pathOnly === "/health") {
    const body = JSON.stringify({ status: "ok" });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(body);
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    logHttpResponse({
      requestId,
      method,
      url,
      route: "/health",
      statusCode: 200,
      durationMs,
      userAgent: req.headers["user-agent"],
    });
    return;
  }

  // Prometheus scrape endpoint — bypasses proxy.ts and cacheComponents.
  // Protected from public internet access by Nginx (`location = /metrics { deny all; }`).
  if (method === "GET" && pathOnly === "/metrics") {
    try {
      const register = getMetricsRegistry();
      const body = await register.metrics();
      res.writeHead(200, {
        "Content-Type": register.contentType,
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch (err) {
      writeStructuredLog("error", "Failed to serialize Prometheus metrics", {
        component: "MetricsEndpoint",
        request_id: requestId,
        error_message: err instanceof Error ? err.message : String(err),
      });
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
    }
    return;
  }

  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - startNs;
    const durationSeconds = Number(durationNs) / 1e9;
    const durationMs = Number(durationNs) / 1e6;
    const statusCode = res.statusCode;

    const route = recordHttpMetric({
      method,
      url,
      statusCode,
      durationSeconds,
    });

    logHttpResponse({
      requestId,
      method,
      url,
      route,
      statusCode,
      durationMs,
      userAgent: req.headers["user-agent"],
    });
  });

  requestContext.run({ requestId }, () => {
    handle(req, res).catch((err) => {
      writeStructuredLog("error", "Unhandled request error", {
        component: "HttpServer",
        request_id: requestId,
        http_method: method,
        path: pathOnly,
        status_code: 500,
        exception: err?.constructor?.name || "Error",
        error_message: err instanceof Error ? err.message : String(err),
      });
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Internal server error");
      }
    });
  });
});

server.listen(port, hostname, () => {
  writeStructuredLog("info", "Storefront server listening", {
    component: "HttpServer",
    hostname,
    port,
  });
});

function shutdown(signal) {
  writeStructuredLog("info", "Storefront server shutting down", {
    component: "HttpServer",
    signal,
  });
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 15_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
