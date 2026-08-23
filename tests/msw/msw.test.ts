// Proves the fake network is wired up and behaves the way the comments above it
// claim — the same idea as tests/fixtures/fixtures.test.ts and
// tests/mocks/mocks.test.ts. If someone changes tests/setup.ts or the handlers
// and breaks a promise the later phases lean on, this is what says so.
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { proxyRoute } from "./handlers";
import { server } from "./server";

/**
 * The address the app is on inside a test — jsdom's default.
 *
 * Spelling it out is this file's own choice, to make the request it builds by
 * hand obvious. A relative address works just as well (the test below proves
 * it), which is what matters: the app's own code uses relative ones everywhere.
 */
const ORIGIN = "http://localhost:3000";

/** Send the exact request utils/fetchData.ts sends for an external call. */
function askThroughProxy(path: string, serviceToken = "vv7qsd") {
  return fetch(`${ORIGIN}/api/proxy`, {
    method: "POST",
    headers: {
      "x-proxy-server": serviceToken,
      "x-proxy-url": path,
      "x-proxy-method": "GET",
    },
  });
}

describe("the fake network", () => {
  it("answers a same-origin route the app asks for directly", async () => {
    const res = await fetch(
      `${ORIGIN}/api/products/searchInCatalog?search_text=shoe`,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.products).toHaveLength(1);
    expect(body.data.products[0].name).toBe("Test Product");
  });

  it("answers a backend path by reading the x-proxy-url header", async () => {
    const res = await askThroughProxy("/customer/info");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Test User");
  });

  it("ignores the query string when matching a backend path", async () => {
    const res = await askThroughProxy("/customer/order/list?offset=2&limit=8");
    const body = await res.json();

    expect(body.data.orders).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });

  it("hands the reply the decoded service name, not the wire token", async () => {
    let seen = "";
    server.use(
      proxyRoute("/cart/cart_overview", ({ server: name }) => {
        seen = name;
        return HttpResponse.json({ success: true, data: { cart: [] } });
      }),
    );

    await askThroughProxy("/cart/cart_overview");

    expect(seen).toBe("market");
  });

  it("lets one test override a reply without touching the others", async () => {
    server.use(
      proxyRoute("/cart/cart_shipping", () =>
        HttpResponse.json({ success: true, data: { cart: [] } }),
      ),
    );

    const overridden = await (await askThroughProxy("/cart/cart_shipping")).json();
    expect(overridden.data.cart).toHaveLength(0);

    // A path the override says nothing about still gets the starting reply.
    const untouched = await (await askThroughProxy("/customer/info")).json();
    expect(untouched.data.name).toBe("Test User");
  });

  it("has forgotten the override by the next test", async () => {
    const body = await (await askThroughProxy("/cart/cart_shipping")).json();

    expect(body.data.cart).toHaveLength(1);
  });

  it("answers a relative address, the way the app asks for one", async () => {
    // components/global/compare.tsx calls fetch("/api/products/searchInCatalog?…")
    // with no origin in front of it. This is the case the fake network exists
    // for, so it is worth proving rather than assuming.
    const res = await fetch("/api/products/searchInCatalog?search_text=shoe");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.products[0].slug).toBe("test-product");
  });

  it("refuses a backend path nobody wrote a reply for", async () => {
    const res = await askThroughProxy("/customer/not/a/real/path");
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.message).toContain("/customer/not/a/real/path");
  });
});
