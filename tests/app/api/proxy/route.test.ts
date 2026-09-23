// @vitest-environment node
//
// Tests for the proxy — the single door every backend call goes through, and the
// only place that refuses a direct attempt at the code-sending path.
// AC-31 to AC-36.
//
// TWO THINGS TO KNOW BEFORE READING
//
// 1. The service name never crosses the wire in readable form. The browser sends
//    an opaque token and the proxy maps it back. A test that sent "market" would
//    land on the unknown-service refusal and pass for entirely the wrong reason,
//    so these tests use the same mapping the app uses.
//
// 2. The addresses below carry a path component on purpose. The path guard
//    compares the resolved address against the base address's own path; with a
//    bare origin that comparison collapses to "starts with a slash", which
//    everything does — and AC-33 would be unprovable.
//
// The secure-logging helper runs for real here. It reads the credential, prints
// a line, and on the failure path reports as well — so the console is silenced
// and both reports are accounted for.
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { toServiceToken } from "utils/serviceTokens";

import { makeErrorReporterMock } from "../../../mocks/authGraph";
import { makeMockFetch, jsonReply } from "../../../mocks/mockFetch";
import { makeNextHeadersMock } from "../../../mocks/nextHeaders";

const headers = makeNextHeadersMock();
vi.mock("next/headers", () => headers);
vi.mock("utils/serverErrorReporter", () => makeErrorReporterMock());

const ADDRESSES = {
  BACKEND_URL: "https://core.invalid/api/v1",
  GO_BACKEND_URL: "https://gateway.invalid/api/v1",
  NEXT_PUBLIC_CHAT_BACKEND_URL: "https://chat.invalid",
  STORIES_BACKEND_URL: "https://stories.invalid",
  COMMENT_BACKEND_URL: "https://comments.invalid",
  WALLET_BACKEND_URL: "https://wallet.invalid",
  ELASTIC_BACKEND_URL: "https://search.invalid",
  WALLET_PUBLIC_API_KEY: "test-wallet-api-key",
};

/** Long enough that masking is observable — a short value masks to stars. */
const MARKET_TOKEN = "test-market-token-1234567890";

const BACKEND_TECHNOLOGY =
  /\b(go|golang|gin|fiber|laravel|php|django|rails|symfony|nest|nestjs)\b/i;

let net: ReturnType<typeof makeMockFetch>;

const loadRoute = async () => {
  vi.resetModules();
  return import("app/api/proxy/route");
};

const makeRequest = (
  proxyHeaders: Record<string, string>,
  init: RequestInit = {},
) =>
  new NextRequest("https://trydos.test/api/proxy", {
    method: "POST",
    headers: proxyHeaders,
    ...init,
  });

/** A call the way the app really sends one: service as its opaque token. */
const call = (
  target: string,
  extras: Record<string, string> = {},
  service = "market",
) =>
  makeRequest({
    "x-proxy-server": toServiceToken(service),
    "x-proxy-url": target,
    "x-proxy-method": "GET",
    ...extras,
  });

const storedProfile = (profile: unknown) =>
  encodeURIComponent(JSON.stringify(profile));

/** A shopper the routing treats as verified: a real phone in the profile. */
const VERIFIED = {
  cookies: {
    [COOKIE_NAMES.USER_DATA]: storedProfile({ id: 3, phone: "963900000000" }),
    [COOKIE_NAMES.MARKET_TOKEN]: MARKET_TOKEN,
  },
};

beforeEach(() => {
  headers.__reset();
  Object.entries(ADDRESSES).forEach(([key, value]) => vi.stubEnv(key, value));
  net = makeMockFetch();
  vi.stubGlobal("fetch", net.fetch);
  // The secure-logging helper prints the whole entry on every non-production
  // call. Silenced so ten files do not fill the run's output, and asserted
  // separately below so a future widening of that line is caught.
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("the addresses these tests use", () => {
  it("are all different, so no two services can be confused", () => {
    const hosts = Object.values(ADDRESSES);
    expect(new Set(hosts).size).toBe(hosts.length);
  });

  it("give the two storefront addresses a path, so the path guard is real", () => {
    expect(new URL(ADDRESSES.BACKEND_URL).pathname).not.toBe("/");
    expect(new URL(ADDRESSES.GO_BACKEND_URL).pathname).not.toBe("/");
  });
});

describe("refusing a direct attempt at the code-sending path (AC-31)", () => {
  it("refuses it outright, and never troubles the backend", async () => {
    const { POST } = await loadRoute();

    const response = await POST(call("/auth/phone/send_otp"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    // This block is the only thing stopping the proxy being used as an open
    // relay to the code-sending endpoint, past the rate limit.
    expect(net.callCount).toBe(0);
  });

  it("refuses it when the path is disguised by escaping", async () => {
    const { POST } = await loadRoute();

    // A backend router decodes before routing, so this would reach the real
    // endpoint while sailing past a plain text match.
    const response = await POST(call("/auth/phone/send%5Fotp"));

    expect(response.status).toBe(403);
    expect(net.callCount).toBe(0);
  });

  it("refuses it when it arrives through the decoding header", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      call("/auth/phone/send%5Fotp", { "x-need-decode": "true" }),
    );

    expect(response.status).toBe(403);
    expect(net.callCount).toBe(0);
  });

  it("is not cached, so a refusal cannot be replayed from a cache", async () => {
    const { POST } = await loadRoute();

    const response = await POST(call("/auth/phone/send_otp"));

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  // One decode pass used to be enough to sail past this: "%255F" comes back as
  // "%5F", not "_". The route now decodes until the string stops changing.
  it.each([
    ["escaped twice", "/auth/phone/send%255Fotp"],
    ["escaped three times", "/auth/phone/send%25255Fotp"],
    ["escaped twice, through the decoding header", "/auth/phone/send%255Fotp"],
  ])("refuses a path %s", async (label, target) => {
    const { POST } = await loadRoute();

    const response = await POST(
      call(target, label.includes("header") ? { "x-need-decode": "true" } : {}),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(net.callCount).toBe(0);
  });

  it("still forwards an ordinary path that merely carries an escape", async () => {
    net.queueReply(jsonReply({ ok: true }));
    const { POST } = await loadRoute();

    // Decoding is used to decide, never to forward: the escape survives into the
    // address the backend is called on. Without this, closing the bypass above
    // would have quietly broken every legitimate escaped value.
    const response = await POST(call("/customer/info?q=shoes%2Fboots"));

    expect(response.status).toBe(200);
    expect(net.calls[0].url).toBe(
      `${ADDRESSES.GO_BACKEND_URL}/customer/info?q=shoes%2Fboots`,
    );
  });
});

describe("refusing a target that could leave the host (AC-32)", () => {
  it.each([
    ["a protocol-relative address", "//evil.tld/x"],
    ["a slash and a backslash", "/\\evil.tld/x"],
    ["no leading slash at all", "@evil.tld/x"],
    ["a full address", "https://evil.tld/x"],
  ])("refuses %s before anything is sent", async (_label, target) => {
    const { POST } = await loadRoute();

    const response = await POST(call(target));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid target URL",
    });
    // Nothing is sent, so the injected credential cannot be carried off-site.
    expect(net.callCount).toBe(0);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  // The decoding header runs decodeURI, which leaves "%2F" escaped by design, so
  // these used to reach the guards still looking like a plain path. The guards
  // now also run against the fully decoded form.
  it.each([
    ["escaped once", "/%2F%2Fevil.tld/x"],
    ["escaped twice", "/%252F%252Fevil.tld/x"],
    ["an escaped backslash", "/%5Cevil.tld/x"],
  ])(
    "refuses a host-escape hidden by escaping (%s), with or without the decoding header",
    async (_label, target) => {
      const { POST } = await loadRoute();

      const plain = await POST(call(target));
      const decoded = await POST(call(target, { "x-need-decode": "true" }));

      for (const response of [plain, decoded]) {
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
          error: "Invalid target URL",
        });
      }
      expect(net.callCount).toBe(0);
    },
  );
});

describe("refusing a target that climbs out of the path (AC-33)", () => {
  it.each([
    ["climbing above the base path", "/../../secret"],
    ["climbing once", "/../secret"],
  ])("refuses %s before anything is sent", async (_label, target) => {
    const { POST } = await loadRoute();

    const response = await POST(call(target));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid target URL",
    });
    expect(net.callCount).toBe(0);
  });

  it("allows an ordinary path under the base", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(response.status).toBe(200);
    // A guest asking for an allow-listed path, so the gateway serves it — the
    // point here is only that the path is kept, under the base's own path.
    expect(net.calls[0].url).toBe(`${ADDRESSES.GO_BACKEND_URL}/customer/info`);
  });

  it("refuses a call that names no target", async () => {
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({ "x-proxy-server": toServiceToken("market") }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing target URL",
    });
    expect(net.callCount).toBe(0);
  });
});

describe("an unrecognised service name (AC-34)", () => {
  it("is refused without a call and without a report", async () => {
    const { LogServerError } = await import("utils/serverErrorReporter");
    const { POST } = await loadRoute();

    const response = await POST(
      makeRequest({
        "x-proxy-server": "not-a-real-token",
        "x-proxy-url": "/customer/info",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Proxy request failed",
    });
    expect(net.callCount).toBe(0);
    // Only this side of the comparison can assert this: the ordinary failure
    // below legitimately reports.
    expect(LogServerError).not.toHaveBeenCalled();
  });

  // The whole point of AC-34: if the two answers differ in any way at all, the
  // pair becomes a way of discovering which service names are real. They used to
  // differ by one cache header. Headers are compared in full, not just the one
  // that was wrong, so the next thing added to either answer has to be added to
  // both.
  it("cannot be told apart from an ordinary failure, down to the headers", async () => {
    const { POST } = await loadRoute();

    const refusal = await POST(
      makeRequest({
        "x-proxy-server": "not-a-real-token",
        "x-proxy-url": "/customer/info",
      }),
    );
    // An ordinary failure: a recognised service whose call breaks.
    const failure = await POST(call("/customer/info"));

    expect(refusal.status).toBe(failure.status);
    await expect(refusal.json()).resolves.toEqual(await failure.json());

    const headersOf = (response: Response) =>
      [...response.headers.entries()].sort();
    expect(headersOf(refusal)).toEqual(headersOf(failure));
    expect(refusal.headers.get("cache-control")).toBe("no-store");
  });

  it("reports an ordinary failure twice — the log entry and the error", async () => {
    const { LogServerError } = await import("utils/serverErrorReporter");
    const { POST } = await loadRoute();

    await POST(call("/customer/info"));

    // The secure log reports once, the route reports once. A branch swap here
    // would change this count.
    expect(LogServerError).toHaveBeenCalledTimes(2);
  });

  it("keeps the whole credential out of everything it reports", async () => {
    headers.__reset(VERIFIED);
    const { LogServerError } = await import("utils/serverErrorReporter");
    const { POST } = await loadRoute();

    await POST(call("/customer/info"));

    const recorded = JSON.stringify(
      (LogServerError as any).mock.calls.map((c: unknown[]) => c[0]),
    );
    expect(recorded).not.toContain(MARKET_TOKEN);
    // Only the four-and-four hint may appear.
    expect(recorded).toContain("test...7890");
  });
});

describe("saying which backend served the call (AC-35)", () => {
  it("answers gateway for a guest asking for an allow-listed path", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    // A guest: no verified profile stored. And a path on the allow-list.
    const response = await POST(call("/cart/add"));

    expect(response.headers.get("x-market-backend")).toBe("gateway");
    expect(net.calls[0].url).toBe(`${ADDRESSES.GO_BACKEND_URL}/cart/add`);
  });

  it("answers core for a verified shopper asking for the same path", async () => {
    headers.__reset(VERIFIED);
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/cart/add"));

    expect(response.headers.get("x-market-backend")).toBe("core");
    expect(net.calls[0].url).toBe(`${ADDRESSES.BACKEND_URL}/cart/add`);
  });

  it("answers core for a guest asking for a path that is not allow-listed", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/order/list"));

    expect(response.headers.get("x-market-backend")).toBe("core");
  });

  it("says nothing about backends for another service", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/api/v1/users/me", {}, "chat"));

    expect(response.headers.get("x-market-backend")).toBeNull();
  });

  it("names a role, never a host or an address", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/cart/add"));
    const label = response.headers.get("x-market-backend");

    expect(["gateway", "core"]).toContain(label);
    expect(label).not.toMatch(/invalid|https?:/);
  });
});

describe("what the proxy says about the stack (AC-36)", () => {
  it("names no backend technology in any refusal it composes", async () => {
    const { POST } = await loadRoute();

    const responses = await Promise.all([
      POST(call("/auth/phone/send_otp")),
      POST(call("//evil.tld/x")),
      POST(call("/../../secret")),
      POST(
        makeRequest({
          "x-proxy-server": "not-a-real-token",
          "x-proxy-url": "/x",
        }),
      ),
    ]);

    for (const response of responses) {
      const raw = JSON.stringify(await response.json());
      expect(raw).not.toMatch(BACKEND_TECHNOLOGY);
    }
  });

  it("names no backend technology in its headers", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/cart/add"));

    response.headers.forEach((value, name) => {
      expect(name).not.toMatch(/x-powered-by|^server$/i);
      expect(`${name}: ${value}`).not.toMatch(BACKEND_TECHNOLOGY);
    });
  });

  it("keeps the routing label to role words only", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/cart/add"));

    // The label is a product role, not the technology serving it.
    expect(response.headers.get("x-market-backend")).not.toMatch(
      BACKEND_TECHNOLOGY,
    );
  });

  it("prints no credential in the line it logs", async () => {
    headers.__reset(VERIFIED);
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(call("/cart/add"));

    const printed = (console.log as any).mock.calls.flat().join(" ");
    expect(printed).not.toContain(MARKET_TOKEN);
    expect(printed).toContain("test...7890");
  });
});

describe("passing a real answer back", () => {
  it("forwards the body and the status", async () => {
    net.queueReply(jsonReply({ success: true, data: { id: 1 } }, 201));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  it("forwards an empty answer without a body", async () => {
    net.queueReply(jsonReply(null, 204));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("never lets an answer be cached", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("carries the credential to the backend, and no cookies", async () => {
    headers.__reset(VERIFIED);
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(call("/customer/info"));

    expect(net.calls[0].headers.authorization).toBe(`Bearer ${MARKET_TOKEN}`);
    expect(net.calls[0].headers.cookie).toBeUndefined();
  });
});

describe("the query-string (GET) contract", () => {
  const getCall = (query: Record<string, string>, requestHeaders: Record<string, string> = {}) =>
    new NextRequest(`https://trydos.test/api/proxy?${new URLSearchParams(query)}`, {
      method: "GET",
      headers: requestHeaders,
    });

  it("forwards a same-origin GET with the locale and seller from the query", async () => {
    headers.__reset(VERIFIED);
    net.queueReply(jsonReply({ success: true }));
    const { GET } = await loadRoute();

    const response = await GET(
      getCall(
        { s: toServiceToken("market"), u: "/customer/info", c: "iq", l: "ar", d: "true", sid: "12" },
        { "sec-fetch-site": "same-origin", origin: "https://trydos.test" },
      ),
    );

    expect(response.status, "a same-origin GET was not forwarded").toBe(200);
    expect(net.calls[0].method, "the GET contract did not force the GET method").toBe("GET");
    expect(net.calls[0].headers, "the locale from the query was not sent to the backend").toMatchObject({
      country: "iq",
    });
  });

  it("uses the default locale when the query carries none", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { GET } = await loadRoute();

    const response = await GET(getCall({ s: toServiceToken("market"), u: "/customer/info" }));

    expect(response.status, "a GET with no locale was not forwarded").toBe(200);
  });

  it("refuses a GET without a service or a target the same way as any failure", async () => {
    const { GET } = await loadRoute();

    const response = await GET(getCall({}));

    expect(response.status, "a GET with no service was not refused like a failure").toBe(503);
    expect(net.callCount, "a GET with no service reached a backend").toBe(0);
  });

  it.each([
    ["another site", { "sec-fetch-site": "cross-site" }],
    ["a foreign origin", { origin: "https://evil.test" }],
  ])("refuses a GET from %s without calling any backend", async (label, requestHeaders) => {
    const { GET } = await loadRoute();

    const response = await GET(getCall({ s: toServiceToken("market"), u: "/customer/info" }, requestHeaders));

    expect(response.status, `a GET from ${label} was not refused`).toBe(503);
    expect(net.callCount, `a GET from ${label} reached a backend`).toBe(0);
  });
});

describe("targets that are hard to decode", () => {
  // fullyDecode() returns the raw string on the first malformed escape, so the
  // decoded guard sees no "//" and a target it refuses without the bad escape
  // ("/%2F%2Fevil.tld/x", refused in AC-32) is forwarded with the credential
  // once "%E0%A4%A" is added. See C:/tmp/cov-bugs/app.md.
  it("BUG-app-1: a malformed escape is refused, not waved past the decoded host guard", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    const response = await POST(call("/%2F%2Fevil.tld/%E0%A4%A"));

    expect(response.status, "a malformed escaped target was not refused").toBe(400);
    expect(net.callCount, "a malformed escaped target reached a backend").toBe(0);
  });

  it("stops decoding after five passes and still keeps a deeply nested escape away from the backend", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    // Seven levels of escaping around "//": five passes are not enough to reach it.
    const response = await POST(call("/%252525252525252F%252525252525252Fevil.tld/x"));

    expect(
      net.calls.every((c) => new URL(c.url).host === "core.invalid" || new URL(c.url).host === "gateway.invalid"),
      "a deeply nested escape made the proxy call another host",
    ).toBe(true);
    expect(response.status, "the proxy broke on a deeply nested escape").toBeLessThan(500);
  });
});

describe("a service whose address is missing or broken", () => {
  it("fails like any failure when the service has no address", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_BACKEND_URL", "");
    const { POST } = await loadRoute();

    const response = await POST(call("/x", {}, "chat"));

    expect(response.status, "a service with no address did not fail as a proxy error").toBe(503);
  });

  it("refuses the target when the service address cannot be parsed", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_BACKEND_URL", "not a url");
    const { POST } = await loadRoute();

    const response = await POST(call("/x", {}, "chat"));

    expect(response.status, "a broken service address was not refused").toBe(400);
    expect(net.callCount, "a broken service address reached a backend").toBe(0);
  });
});

describe("forwarding a request body", () => {
  const withBody = (target: string, body: BodyInit, contentType?: string) =>
    new NextRequest("https://trydos.test/api/proxy", {
      method: "POST",
      headers: {
        "x-proxy-server": toServiceToken("market"),
        "x-proxy-url": target,
        "x-proxy-method": "POST",
        ...(contentType ? { "content-type": contentType } : {}),
      },
      body,
    });

  it("forwards a JSON body as JSON", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(withBody("/customer/info", JSON.stringify({ a: 1 }), "application/json"));

    expect(net.calls[0].body, "the JSON body was not forwarded").toEqual({ a: 1 });
    expect(net.calls[0].headers["content-type"], "the JSON body lost its type").toBe("application/json");
  });

  it("adds the shopper credential to a device-token registration", async () => {
    headers.__reset(VERIFIED);
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(withBody("/firebase_device_tokens", JSON.stringify({ token: "d1" }), "application/json"));

    expect(net.calls[0].body, "the device registration did not carry the shopper credential").toEqual({
      token: "d1",
      auth_token: MARKET_TOKEN,
    });
  });

  it("forwards a device-token registration without a credential when there is none", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(withBody("/firebase_device_tokens", JSON.stringify({ token: "d1" }), "application/json"));

    expect(net.calls[0].body, "a credential was invented for a shopper who has none").toEqual({ token: "d1" });
  });

  it("forwards a device-token registration that is not valid JSON as it came", async () => {
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(withBody("/firebase_device_tokens", "{broken", "application/json"));

    expect(net.calls[0].body, "the unreadable body was not forwarded as it came").toBe("{broken");
  });

  it("forwards form data as form data", async () => {
    net.queueReply(jsonReply({ success: true }));
    const form = new FormData();
    form.append("name", "Sara");
    const { POST } = await loadRoute();

    await POST(withBody("/customer/info", form));

    expect(net.calls[0].body, "the form data was not forwarded as form data").toBeInstanceOf(FormData);
    expect((net.calls[0].body as FormData).get("name"), "a form field was lost").toBe("Sara");
  });

  it("forwards a plain text body, and nothing for an empty one", async () => {
    net.queueReply(jsonReply({ success: true }));
    net.queueReply(jsonReply({ success: true }));
    net.queueReply(jsonReply({ success: true }));
    const { POST } = await loadRoute();

    await POST(withBody("/customer/info", "hello", "text/plain"));
    await POST(withBody("/customer/info", "", "text/plain"));
    await POST(withBody("/customer/info", "", "application/json"));

    expect(net.calls[0].body, "the text body was not forwarded").toBe("hello");
    expect(net.calls[1].body, "an empty text body was forwarded").toBeNull();
    expect(net.calls[2].body, "an empty JSON body was forwarded").toBeNull();
  });
});

describe("passing a non-JSON answer back", () => {
  it("forwards the bytes with their type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("plain answer", { status: 200, headers: { "content-type": "text/plain" } })),
    );
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(response.headers.get("content-type"), "the answer lost its type").toBe("text/plain");
    await expect(response.text(), "the answer bytes were not forwarded").resolves.toBe("plain answer");
  });

  it("forwards an answer with no type as binary", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2]), { status: 200 })));
    const { POST } = await loadRoute();

    const response = await POST(call("/customer/info"));

    expect(
      new Uint8Array(await response.arrayBuffer()),
      "the binary answer bytes were not forwarded",
    ).toEqual(new Uint8Array([1, 2]));
  });
});
