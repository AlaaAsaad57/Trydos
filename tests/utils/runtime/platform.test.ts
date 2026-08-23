// @vitest-environment node
//
// How the app works out who is calling and from where, on any host.
//
// WHY THIS MATTERS MORE THAN IT LOOKS
// `proxy.ts` runs on every request and decides the locale from the country
// these helpers return. Get the country wrong and every shopper lands in the
// wrong storefront — a total outage that returns HTTP 200 the whole time. The
// old code read one Vercel-specific header, so on any other host the country
// silently became undefined and every visitor fell back to the default.
//
// The order matters as much as the reading: with a CDN in front of the host,
// several of these headers are present at once and they must be preferred in a
// fixed, deliberate order.
import { describe, expect, it } from "vitest";

import {
  getClientIp,
  getGeoCountry,
  isWorkerRuntime,
} from "utils/runtime/platform";

/** The header-bearing shape both helpers accept. */
function request(headers: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
  };
}

describe("the caller's country", () => {
  it("reads the country the Vercel edge resolved", () => {
    expect(
      getGeoCountry(request({ "x-vercel-ip-country": "TR" })),
      "the country header set by the Vercel edge was not read, so every visitor would fall back to the default storefront",
    ).toBe("tr");
  });

  it("reads the country the Cloudflare edge resolved", () => {
    expect(
      getGeoCountry(request({ "cf-ipcountry": "IQ" })),
      "the country header set by the Cloudflare edge was not read, so every visitor on Workers would fall back to the default storefront",
    ).toBe("iq");
  });

  it("lower-cases the code, because every caller compares against lowercase slugs", () => {
    expect(
      getGeoCountry(request({ "cf-ipcountry": "GB" })),
      "the country was returned in upper case; the locale segment in the URL is lowercase, so the comparison in proxy.ts would never match",
    ).toBe("gb");
  });

  it("says nothing rather than guessing when no edge resolved a country", () => {
    expect(
      getGeoCountry(request({})),
      "a request with no geo header produced a country anyway, which would send shoppers to a storefront the platform never chose",
    ).toBeUndefined();
  });
});

describe("the caller's IP", () => {
  it("prefers the Cloudflare-connecting IP when a Cloudflare edge is in front", () => {
    const ip = getClientIp(
      request({
        "cf-connecting-ip": "203.0.113.7",
        "x-real-ip": "10.0.0.1",
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      }),
    );
    expect(
      ip,
      `read ${ip} instead of the Cloudflare-connecting IP; with a Cloudflare edge in front the other headers hold the proxy, not the shopper`,
    ).toBe("203.0.113.7");
  });

  it("falls back to the real-IP header the Vercel edge sets", () => {
    expect(
      getClientIp(request({ "x-real-ip": "198.51.100.4" })),
      "the real-IP header was ignored, so OTP rate limiting would treat every caller as the same unknown address",
    ).toBe("198.51.100.4");
  });

  it("takes only the first entry of the forwarded chain", () => {
    expect(
      getClientIp(request({ "x-forwarded-for": "198.51.100.4, 10.0.0.9" })),
      "the whole forwarded chain was returned instead of the client; the later entries are proxies, and using them would rate-limit every shopper as one address",
    ).toBe("198.51.100.4");
  });

  it("says nothing rather than inventing an address", () => {
    expect(
      getClientIp(request({})),
      "an IP was produced for a request that carried none, which would silently group unrelated callers under one rate-limit bucket",
    ).toBeUndefined();
  });
});

describe("runtime detection", () => {
  it("does not claim to be a Worker when running under Node", () => {
    expect(
      isWorkerRuntime(),
      "the Node test runner was detected as the Cloudflare Workers runtime; that would switch Redis to the REST driver on Vercel",
    ).toBe(false);
  });
});
