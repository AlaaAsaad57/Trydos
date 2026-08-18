// Calling a backend the way the app calls it.
//
// Every external request the storefront makes goes through `POST /api/proxy` with
// a set of `x-proxy-*` headers, and the token is injected server-side from an
// HttpOnly cookie. This helper builds exactly those headers, so a live test
// exercises the real routing decision, the real guard, and the real token
// injection rather than a hand-rolled approximation of them.
//
// The service name crosses the wire as an opaque token, and that mapping comes
// from the app's own `utils/serviceTokens` — never a copy. If the tokens are ever
// rotated, this helper follows automatically and no test has to be edited.
//
// A test that wants to drive the app's own service layer instead (the phases that
// assert on `services/cart.ts` and friends) does not use this: it installs a
// jar-bound global `fetch` and calls the service. This is for the phases that
// address an endpoint directly.

import { toServiceToken } from "utils/serviceTokens";

import { CookieJar, jarFetch } from "./cookieJar";

/** The services `/api/proxy` will accept. Mirrors the app's `ServerType`. */
export type ProxyService =
  | "market"
  | "market-dashboard"
  | "chat"
  | "stories"
  | "elastic"
  | "comments"
  | "wallet";

export type ProxyCall = {
  service: ProxyService;
  /** The path on the backend, e.g. `/customer/info`. */
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. Anything non-`FormData` is serialised, as the app does. */
  body?: unknown;
  /** Locale headers. The app derives these from the URL; a test states them. */
  country?: string;
  language?: string;
  sellerId?: string;
};

/** Make one proxied backend call with this identity's cookies. */
export const proxyRequest = async (
  jar: CookieJar,
  call: ProxyCall,
): Promise<Response> => {
  const {
    service,
    url,
    method = "GET",
    body,
    country = "gb",
    language = "en",
    sellerId,
  } = call;

  const headers: Record<string, string> = {
    "x-proxy-server": toServiceToken(service),
    // encodeURI, and `x-need-decode`, are what the client sends. The proxy's
    // host-escape guards are written against that exact pair, so a test that
    // sent the raw path would be testing a shape no browser produces.
    "x-proxy-url": encodeURI(url),
    "x-proxy-method": method,
    "x-country": country,
    "x-language": language,
    "x-need-decode": "true",
  };

  if (sellerId) headers["x-seller-id"] = sellerId;

  let payload: BodyInit | undefined;

  if (body !== undefined && method !== "GET") {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers["Content-Type"] = "application/json";
      payload = typeof body === "string" ? body : JSON.stringify(body);
    }
  }

  // Always POST to the proxy itself, whatever the method being proxied — the
  // real method travels in `x-proxy-method`.
  return jarFetch(jar)("/api/proxy", {
    method: "POST",
    headers,
    body: payload,
  });
};

/** The same call, with the JSON body already read.
 *
 *  Most assertions want the status and the body together, and reading a body
 *  twice throws. `body` is `null` when the response carried no JSON. */
export const proxyJson = async <T = unknown>(
  jar: CookieJar,
  call: ProxyCall,
): Promise<{ response: Response; status: number; body: T | null }> => {
  const response = await proxyRequest(jar, call);

  let body: T | null = null;
  try {
    body = (await response.json()) as T;
  } catch {
    // Not JSON, or empty (a 204). Both are legitimate answers.
  }

  return { response, status: response.status, body };
};
