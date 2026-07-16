// PostHog reverse proxy (first-party `/ingest/*`).
//
// WHY this is a route handler and not a next.config rewrite:
// `/ingest` lives on our own domain, so the browser attaches EVERY first-party
// cookie (User-Data profile JSON, MARKET-TOKEN, DEVICE-TOKEN, CHAT/STORIES
// tokens, the 128-char USER_ID_HASH, locale cookies …) to every `/ingest/*`
// request. For a logged-in user that easily exceeds ~8 KB, and PostHog's
// upstream (eu-assets / eu.i) rejects oversized request headers with
// `400 Bad Request` — which broke both `recorder.js` and the session-replay
// ingestion calls. A plain rewrite forwards those cookies verbatim; this
// handler forwards everything EXCEPT the `Cookie` header, so the headers stay
// small while keeping the ad-blocker-resistant first-party path.
//
// Asset requests (`/ingest/static/*`) go to the assets host; everything else
// (capture `/e/`, replay `/s/`, flags, etc.) goes to the ingestion host. These
// mirror the previous next.config.ts rewrites.

export const runtime = "edge";

const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";
const POSTHOG_INGEST_HOST = "https://eu.i.posthog.com";

// Request headers we must NOT forward upstream. `cookie` is the whole point of
// this proxy; the rest are hop-by-hop / connection headers that fetch sets
// itself (forwarding them corrupts the upstream request).
const STRIP_REQUEST_HEADERS = new Set([
  "cookie",
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

// Response headers we must NOT forward back. The runtime already decodes the
// upstream body, so a lingering `content-encoding`/`content-length` would make
// the browser try to re-decode and fail. We also drop any upstream `set-cookie`
// so PostHog can't re-introduce cookies onto our domain.
const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "set-cookie",
]);

async function proxy(
  request: Request,
  segments: string[],
): Promise<Response> {
  const isAsset = segments[0] === "static";
  const base = isAsset ? POSTHOG_ASSETS_HOST : POSTHOG_INGEST_HOST;
  const search = new URL(request.url).search;
  const target = `${base}/${segments.join("/")}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    // Never let the proxy throw into the app — analytics must fail silently.
    return new Response(null, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase()))
      responseHeaders.set(key, value);
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function POST(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}

export async function OPTIONS(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
