import { NextRequest, NextResponse } from "next/server";
import { isAllowedServer, getServerBaseUrl, buildProxyHeaders, logSecureRequest, getTokenForServer } from "utils/server/tokenManager";
import { SEND_OTP } from "utils/endpointConfig";
import { fromServiceToken } from "utils/serviceTokens";
import { LogServerError } from "utils/serverErrorReporter";

/** The proxy's single failure answer.
 *
 *  An unrecognised service identifier and a recognised one whose upstream call
 *  fails must be indistinguishable, or the pair becomes a way of discovering
 *  which service names are real. Both cases return this exact response, built
 *  here and nowhere else, so status, body and headers cannot drift apart again.
 *
 *  Residual: the unrecognised case answers before any upstream call, so it comes
 *  back sooner. That timing difference is not closed here — doing so would mean
 *  delaying a real failure on purpose. */
const proxyFailure = () =>
  NextResponse.json(
    { message: "Proxy request failed" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );

/** Decode percent-escapes until the string stops changing.
 *
 *  One pass is not enough for either guard below: "%252F" survives a single pass
 *  as "%2F", and "send%255Fotp" survives as "send%5Fotp" — both still reach a
 *  backend router that decodes again. The loop is bounded so a deeply nested
 *  input cannot spin, and a malformed escape returns what we have rather than
 *  throwing, which keeps the guards failing closed. */
const fullyDecode = (value: string) => {
  let current = value;
  for (let pass = 0; pass < 5; pass += 1) {
    let next: string;
    try {
      next = decodeURIComponent(current);
    } catch {
      return current;
    }
    if (next === current) return current;
    current = next;
  }
  return current;
};

/** Does this target rewrite the host instead of naming a path on it?
 *
 *  The upstream URL is built by concatenation (getServerBaseUrl + targetUrl),
 *  and several base URLs (wallet, stories, elastic, chat, comments) are bare
 *  hosts with no path component. A target that does not begin with a single "/"
 *  can therefore rewrite the host rather than the path — e.g. "@evil.tld/x"
 *  yields "https://<wallet-host>@evil.tld/x", which resolves to evil.tld and
 *  would carry the injected Bearer token off-site. "//" is protocol-relative and
 *  "/\" is normalized to "//" by some URL parsers; both escape the host the same
 *  way. */
const escapesHost = (target: string) =>
  !target.startsWith("/") ||
  target.startsWith("//") ||
  target.startsWith("/\\");

export async function POST(request: NextRequest) {
  try {
    // 1. Read proxy metadata from headers
    // The wire value is an opaque token; map it back to the internal service
    // name before any validation runs, so the allowlist, token lookup and
    // logging below all continue to work with readable names.
    const server = fromServiceToken(
      request.headers.get("x-proxy-server") || "",
    );
    let targetUrl = request.headers.get("x-proxy-url") || "";
    let need_decode = request.headers.get("x-need-decode") || "";
    const method = request.headers.get("x-proxy-method") || "GET";
    const country = request.headers.get("x-country") || "sy";
    const language = request.headers.get("x-language") || "en";
    const sellerId = request.headers.get("x-seller-id") || undefined;

    // 2. Validate server type (prevent arbitrary URL access)
    if (!isAllowedServer(server)) {
      // Same answer as the generic failure below, from the same place, so the
      // mapping cannot be recovered by probing. See proxyFailure().
      return proxyFailure();
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing target URL" },
        { status: 400 },
      );
    }

    // 3. Build the full URL and headers (token injected from HttpOnly cookie)

    if(need_decode==="true"){
      targetUrl = decodeURI(targetUrl);
    }

    // Require an on-host absolute path — see escapesHost() for why, and for what
    // each of the three shapes does.
    //
    // The check runs against the escaped form AND the fully decoded one. The
    // decoding header above uses decodeURI, which leaves "%2F" escaped by
    // design, so "/%2F%2Fevil.tld/x" reaches here still looking like a plain
    // path while decoding to a protocol-relative address further down the line.
    // Decoding is used only to decide, never to forward.
    const decodedTarget = fullyDecode(targetUrl);
    if (escapesHost(targetUrl) || escapesHost(decodedTarget)) {
      return NextResponse.json(
        { error: "Invalid target URL" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // The string checks above stop the host from being rewritten, but they say
    // nothing about the *path*: "/../.." is a single leading slash, yet the URL
    // parser resolves it upwards, escaping the base path. The market bases carry
    // an "/api/v1" prefix, so "/../../x" would reach https://<host>/x — still on
    // the backend host, but outside the API surface, carrying the injected
    // Bearer token. Parse the URL the same way fetch() will, then require it to
    // stay on the base's origin AND under the base's path.
    const baseUrlString = await getServerBaseUrl(server, targetUrl);
    if (!baseUrlString) {
      // Missing env var — fail as a proxy error, as it did before this check.
      throw new Error(`Missing base URL for server: ${server}`);
    }

    let resolvedUrl: URL;
    let baseUrl: URL;
    try {
      resolvedUrl = new URL(baseUrlString + targetUrl);
      baseUrl = new URL(baseUrlString);
    } catch {
      return NextResponse.json(
        { error: "Invalid target URL" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const basePathPrefix = baseUrl.pathname.replace(/\/+$/, "") + "/";
    if (
      resolvedUrl.origin !== baseUrl.origin ||
      !resolvedUrl.pathname.startsWith(basePathPrefix)
    ) {
      return NextResponse.json(
        { error: "Invalid target URL" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // OTP send must NEVER go through the generic proxy. It runs exclusively via
    // the sendOtpAction Server Action, which enforces the Redis rate limit
    // (per-session / per-IP / per-number cooldown) before the backend is ever
    // called. Blocking it here stops anyone using the proxy as an open relay to
    // reach the OTP endpoint directly and bypass that limiter.
    //
    // Match on the *fully decoded* resolved path, not the raw header: a backend
    // router decodes percent-escapes before routing, so "/auth/phone/send%5Fotp"
    // reaches send_otp while sailing past a raw substring match — and
    // "send%255Fotp" sails past a single decode pass too. Decoding here fails
    // closed: an over-broad match only blocks a request that must not be proxied
    // anyway.
    const decodedPath = fullyDecode(resolvedUrl.pathname);

    if (
      targetUrl.includes(SEND_OTP) ||
      decodedTarget.includes(SEND_OTP) ||
      decodedPath.includes(SEND_OTP)
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Use the parsed URL rather than re-concatenating: forwarding the exact
    // string we validated removes any chance of a parser differential between
    // this check and fetch().
    let fullUrl = resolvedUrl.href;
    const headers = await buildProxyHeaders(
      server,
      country,
      language,
      sellerId,
    );

    // 4. Read the body (supports JSON and FormData)
    let body: BodyInit | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (method !== "GET" && method !== "HEAD") {
      if (contentType.includes("multipart/form-data")) {
        body = await request.formData();
      } else if (contentType.includes("application/json")) {
        const rawBody = await request.text();
        if (rawBody) {
          // Special case: inject auth_token for Firebase device token registration
          if (targetUrl === "/firebase_device_tokens" && server === "market") {
            try {
              const bodyData = JSON.parse(rawBody);
              const authToken = await getTokenForServer(server);

              if (authToken) {
                bodyData.auth_token = authToken;
              }

              body = JSON.stringify(bodyData);
            } catch (e) {
              // If parsing fails, use raw body
              body = rawBody;
            }
          } else {
            body = rawBody;
          }
          headers["Content-Type"] = "application/json";
        }
      } else {
        const rawBody = await request.text();
        if (rawBody) body = rawBody;
      }
    }

    // 5. Forward the request to the actual backend
    const backendResponse = await fetch(fullUrl, {
      method,
      headers,
      body,
      credentials: "omit",
      next: {
        revalidate: 0,
      },
      cache: "no-cache",
      // server-to-server, no cookies forwarded
    });

    // 6. Log securely (tokens masked)
    await logSecureRequest({
      server,
      url: targetUrl,
      method,
      status: backendResponse.status,
    });

    // 6b. Which of the two market backends answered, so the routing decision can
    // be read straight off the response instead of from a server log. Role names
    // only, never the backing technology (CLAUDE.md "Stack-agnostic naming").
    // Storefront traffic only — the seller dashboard routes by endpoint alone,
    // with no user-type branch to observe.
    const marketBackendHeader: Record<string, string> = {};
    if (server === "market") {
      if (baseUrlString === process.env.GO_BACKEND_URL)
        marketBackendHeader["x-market-backend"] = "gateway";
      else if (baseUrlString === process.env.BACKEND_URL)
        marketBackendHeader["x-market-backend"] = "core";
    }

    // 7. Forward the response back to the client
    const responseContentType =
      backendResponse.headers.get("content-type") || "";

    if (backendResponse.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Cache-Control": "no-store",
          ...marketBackendHeader,
        },
      });
    }

    if (responseContentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, {
        status: backendResponse.status,
        headers: {
          "Cache-Control": "no-store",
          ...marketBackendHeader,
        },
      });
    }

    // Non-JSON responses (binary, text, etc.)
    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type": responseContentType,
        "Cache-Control": "no-store",
        ...marketBackendHeader,
      },
    });
  } catch (error) {
    const server =
      fromServiceToken(request.headers.get("x-proxy-server") || "") ||
      "unknown";
    const targetUrl = request.headers.get("x-proxy-url") || "unknown";

    await logSecureRequest({
      server,
      url: targetUrl,
      method: request.headers.get("x-proxy-method") || "GET",
      status: 503,
      error,
    });

    LogServerError({
      error,
      type: "proxy route error",
      server,
      url: targetUrl,
    });

    return proxyFailure();
  }
}
