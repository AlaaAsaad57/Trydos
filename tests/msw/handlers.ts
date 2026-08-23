// The starter fake replies for the fake network.
//
// WHY A FAKE NETWORK WHEN WE ALREADY HAVE STAND-INS
// tests/mocks/fetchData.ts swaps out the client fetch helper, and
// tests/mocks/mockFetch.ts swaps out the global `fetch`. Both work by replacing
// a module, so the code you replaced stops running. That is the cheap choice
// and it stays the right one for most tests.
//
// This file is for the case they cannot cover: a component that calls `fetch`
// itself, where you still want the real code path to run.
// components/global/compare.tsx does exactly that — it asks
// `/api/products/searchInCatalog` directly, with no helper in between. msw
// answers the request at the network layer, so nothing in the component or the
// helper has to be replaced.
//
// THE ONE THING TO KNOW ABOUT THIS APP
// The browser never asks a backend directly. utils/fetchData.ts sends every
// external call to `POST /api/proxy` and puts the real path in the
// `x-proxy-url` header, because the token is added server-side. So a plain
// handler for "/customer/info" would never match a thing — that address is
// never requested. Use `proxyRoute()` below: it reads the header for you.
//
// Same-origin routes under /api/... are the exception. The app really does ask
// for those addresses, so a plain `http.get("*/api/...")` handler works.
//
// WHAT IS HERE IS A STARTING POINT, NOT A CATALOGUE
// Below are a few worked examples built on the Phase 2 builders. Copy the shape
// for whatever your own test needs. A test that wants a different reply should
// override it for that test with `server.use(...)` rather than edit this file
// (see tests/msw/server.ts).
import { http, HttpResponse } from "msw";

import { fromServiceToken } from "utils/serviceTokens";

import { buildCart } from "../fixtures/cart";
import { buildOrder } from "../fixtures/order";
import { buildListingProduct } from "../fixtures/product";
import { buildUser } from "../fixtures/user";

/** Matches /api/proxy whatever address the test runner thinks it is on. */
const PROXY_PATH = "*/api/proxy";

/** What a proxy reply gets told about the call it is answering. */
export type ProxyContext = {
  request: Request;
  /** The backend path the app asked for, with the query string removed. */
  path: string;
  /** The service name, already decoded: "market", "chat", "elastic", … */
  server: string;
  /** The query string as asked for, "" when there was none. */
  query: string;
};

/**
 * A reply for one backend path. Return a response, or return `undefined` to say
 * "not mine" and let the next handler try.
 */
export type ProxyResolver = (
  context: ProxyContext,
) => Response | Promise<Response> | undefined;

/** Pull the real target out of the proxy headers. */
function readProxyTarget(request: Request): Omit<ProxyContext, "request"> {
  const asked = request.headers.get("x-proxy-url") ?? "";
  const [path, query = ""] = asked.split("?");

  return {
    path,
    query,
    // The header carries an opaque token, never the readable name — see
    // utils/serviceTokens.ts. Decode it so a test can read it.
    server: fromServiceToken(request.headers.get("x-proxy-server") ?? ""),
  };
}

/**
 * Answer one backend path that the app reaches through /api/proxy.
 *
 * Use it for anything the app asks for with `server: "market"`, `"chat"`,
 * `"elastic"` and friends — that is, anything that is not a same-origin
 * /api/... route.
 *
 *   server.use(
 *     proxyRoute("/customer/info", () =>
 *       HttpResponse.json({ success: true, data: buildUser({ name: "Sara" }) }),
 *     ),
 *   );
 *
 * The path is matched without its query string, so one route answers
 * "/customer/order/list?offset=1" and "/customer/order/list?offset=2" alike. Read
 * `query` in the reply when the two should differ.
 */
export function proxyRoute(path: string, resolve: ProxyResolver) {
  return http.post(PROXY_PATH, ({ request }) => {
    const target = readProxyTarget(request);
    // Every proxy handler is registered on the same address, so each one has to
    // check whether the call is its own and step aside when it is not.
    if (target.path !== path) return undefined;
    return resolve({ request, ...target });
  });
}

/**
 * The backend replies every test starts with.
 *
 * The envelope is the backend's own — `{ success, data }`. It is written out in
 * full on purpose: utils/fetchData.ts really runs in an msw test, so it is the
 * one that turns this into whatever the app reads (`isSuccessful` and the rest).
 * Returning the app-facing shape here would skip the very code being tested.
 */
export const PROXY_ROUTES: Record<string, ProxyResolver> = {
  // services/home.ts -> getCustomerInfo()
  "/customer/info": () =>
    HttpResponse.json({ success: true, data: buildUser() }),

  // utils/functions.tsx -> getCart()
  "/cart/cart_shipping": () =>
    HttpResponse.json({ success: true, data: buildCart() }),

  // utils/functions.tsx -> GetCartOreview()
  "/cart/cart_overview": () =>
    HttpResponse.json({ success: true, data: buildCart() }),

  // services/orders.ts -> fetchOrders()
  "/customer/order/list": () =>
    HttpResponse.json({
      success: true,
      data: { orders: [buildOrder()], total: 1 },
    }),
};

/** One handler per entry in the table above. */
const proxyHandlers = Object.entries(PROXY_ROUTES).map(([path, resolve]) =>
  proxyRoute(path, resolve),
);

/**
 * Last in the queue for /api/proxy: nothing above claimed this call.
 *
 * It answers 501 with the path in the message. The alternative — letting it
 * fall through — would hand the call to the real network, which is the one
 * thing a unit test must never do. `onUnhandledRequest: "error"` cannot catch
 * this for us, because /api/proxy *is* handled; only the path inside it is
 * unknown.
 */
const unknownProxyRoute = http.post(PROXY_PATH, ({ request }) => {
  const { path, server } = readProxyTarget(request);

  return HttpResponse.json(
    {
      success: false,
      message:
        `No fake reply for "${path}" (service: "${server || "unknown"}"). ` +
        `Add one for this test with server.use(proxyRoute("${path}", …)), ` +
        `or add it to PROXY_ROUTES in tests/msw/handlers.ts when every test wants it.`,
    },
    { status: 501 },
  );
});

/** Same-origin routes the app asks for by their real address. */
const localHandlers = [
  // components/global/compare.tsx -> searchFunction()
  http.get("*/api/products/searchInCatalog", () =>
    HttpResponse.json({ data: { products: [buildListingProduct()] } }),
  ),
];

/**
 * Everything the fake network answers by default.
 *
 * Order matters: the unknown-path reply has to come last, or it would answer
 * calls the real routes above it were waiting for.
 */
export const handlers = [...localHandlers, ...proxyHandlers, unknownProxyRoute];
