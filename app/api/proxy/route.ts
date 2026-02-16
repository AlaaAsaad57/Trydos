import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedServer,
  getServerBaseUrl,
  buildProxyHeaders,
  logSecureRequest,
} from "utils/server/tokenManager";
import { LogServerError } from "utils/serverErrorReporter";

export async function POST(request: NextRequest) {
  try {
    // 1. Read proxy metadata from headers
    const server = request.headers.get("x-proxy-server") || "";
    const targetUrl = request.headers.get("x-proxy-url") || "";
    const method = request.headers.get("x-proxy-method") || "GET";
    const country = request.headers.get("x-country") || "sy";
    const language = request.headers.get("x-language") || "en";
    const sellerId = request.headers.get("x-seller-id") || undefined;

    // 2. Validate server type (prevent arbitrary URL access)
    if (!isAllowedServer(server)) {
      return NextResponse.json(
        { error: "Invalid server type" },
        { status: 400 },
      );
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing target URL" },
        { status: 400 },
      );
    }

    // 3. Build the full URL and headers (token injected from HttpOnly cookie)
    const fullUrl = getServerBaseUrl(server) + targetUrl;
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
          body = rawBody;
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
      credentials: "omit", // server-to-server, no cookies forwarded
    });

    // 6. Log securely (tokens masked)
    await logSecureRequest({
      server,
      url: targetUrl,
      method,
      status: backendResponse.status,
    });

    // 7. Forward the response back to the client
    const responseContentType =
      backendResponse.headers.get("content-type") || "";

    if (responseContentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Non-JSON responses (binary, text, etc.)
    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type": responseContentType,
      },
    });
  } catch (error) {
    const server = request.headers.get("x-proxy-server") || "unknown";
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

    return NextResponse.json(
      { message: "Proxy request failed" },
      { status: 503 },
    );
  }
}
