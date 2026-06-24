import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedServer,
  getServerBaseUrl,
  buildProxyHeaders,
  logSecureRequest,
  getTokenForServer,
  isFromGoApi,
} from "utils/server/tokenManager";
import { SEND_OTP } from "utils/endpointConfig";
import { LogServerError } from "utils/serverErrorReporter";

export async function POST(request: NextRequest) {
  try {
    // 1. Read proxy metadata from headers
    const server = request.headers.get("x-proxy-server") || "";
    let targetUrl = request.headers.get("x-proxy-url") || "";
    let need_decode = request.headers.get("x-need-decode") || "";
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

    if(need_decode==="true"){
      targetUrl = decodeURI(targetUrl);
    }

    // OTP send must NEVER go through the generic proxy. It runs exclusively via
    // the sendOtpAction Server Action, which enforces the Redis rate limit
    // (per-session / per-IP / per-number cooldown) before the backend is ever
    // called. Blocking it here stops anyone using the proxy as an open relay to
    // reach the OTP endpoint directly and bypass that limiter.
    if (targetUrl.includes(SEND_OTP)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    let fullUrl = getServerBaseUrl(server, targetUrl) + targetUrl;
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

    // 7. Forward the response back to the client
    const responseContentType =
      backendResponse.headers.get("content-type") || "";

    if (responseContentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, {
        status: backendResponse.status,
        headers: {
          "Cache-Control": "no-store",
           "IS-FROM-GO":`${isFromGoApi(targetUrl)}`
        },
      });
    }

    // Non-JSON responses (binary, text, etc.)
    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type": responseContentType,
        "IS-FROM-GO":`${isFromGoApi(targetUrl)}`,
        "fullUrl":''
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
