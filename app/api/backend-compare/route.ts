import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for the /backend-compare tool.
 *
 * The browser cannot call the Laravel / Go backends directly because they don't
 * send CORS headers for arbitrary origins (the Go service in particular rejects
 * the pre-flight). Routing the call through this route handler turns it into a
 * server-to-server request, where CORS does not apply at all.
 *
 * Latency is measured around the upstream fetch on the server, so the number we
 * return is the pure backend round-trip (it excludes the browser → Next hop,
 * which is identical for both backends anyway).
 *
 * SSRF guard: only the two configured backend origins are reachable. The path
 * is free-form, but the host must match NEXT_PUBLIC_BACKEND_URL or
 * NEXT_PUBLIC_GO_BACKEND_URL.
 */

export const dynamic = "force-dynamic";

const allowedHosts = (() => {
  const hosts = new Set<string>();
  for (const raw of [
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_GO_BACKEND_URL,
  ]) {
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).host);
    } catch {
      /* ignore malformed env */
    }
  }
  return hosts;
})();

interface ProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function POST(request: NextRequest) {
  let payload: ProxyRequest;
  try {
    payload = (await request.json()) as ProxyRequest;
  } catch {
    return NextResponse.json(
      { ok: false, status: 0, time: 0, error: "Invalid JSON envelope" },
      { status: 400 },
    );
  }

  const { url, method = "GET", headers = {}, body } = payload;

  if (!url) {
    return NextResponse.json(
      { ok: false, status: 0, time: 0, error: "Missing target URL" },
      { status: 400 },
    );
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json(
      { ok: false, status: 0, time: 0, error: "Malformed target URL" },
      { status: 400 },
    );
  }

  // SSRF guard — only the configured backends are reachable.
  if (allowedHosts.size > 0 && !allowedHosts.has(target.host)) {
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        time: 0,
        error: `Host "${target.host}" is not an allowed backend. Allowed: ${[...allowedHosts].join(", ")}`,
      },
      { status: 403 },
    );
  }

  const upstreamHeaders: Record<string, string> = { ...headers };
  const hasBody =
    body != null &&
    body !== "" &&
    !["GET", "HEAD"].includes(method.toUpperCase());
  if (hasBody && !upstreamHeaders["Content-Type"]) {
    upstreamHeaders["Content-Type"] = "application/json";
  }

  const start = performance.now();
  try {
    const res = await fetch(target.toString(), {
      method,
      headers: upstreamHeaders,
      body: hasBody ? body : undefined,
      credentials: "omit",
      cache: "no-store",
    });
    const time = performance.now() - start;

    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore body read errors */
    }

    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        time,
        body: bodyText.slice(0, 2000),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const time = performance.now() - start;
    return NextResponse.json(
      {
        ok: false,
        status: 0,
        time,
        error: err instanceof Error ? err.message : "Upstream fetch failed",
        body: "",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
