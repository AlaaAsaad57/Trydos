import { describe, expect, it, vi } from "vitest";

import nextConfig from "../next.config";

/**
 * Guards the response-header rules in next.config.ts.
 *
 * The bug this file was written for: the `/(.*)` block carried
 * `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. That source
 * matches every HTML document, so personal pages — settings/wallet,
 * settings/profile/info, settings/orders, sellerProfile — were served publicly
 * cacheable with no `Vary: Cookie`, while rendering per-visitor data through
 * AuthNavContainer. Measured on develop: every one answered with that header.
 *
 * A shared cache could therefore store one shopper's page and hand it to
 * another. Requests that skip the middleware (proxy.ts excludes RSC, prefetch
 * and Server Action requests) carried the same header with no `Set-Cookie` at
 * all, removing the one property that usually stops a shared cache storing a
 * response.
 */
const getRules = async () => {
  const rules = await (nextConfig as any).headers();
  expect(
    Array.isArray(rules),
    "next.config.ts headers() did not return an array of rules",
  ).toBe(true);
  return rules as Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

const cacheControlFor = (
  rules: Awaited<ReturnType<typeof getRules>>,
  source: string,
) =>
  rules
    .filter((rule) => rule.source === source)
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key.toLowerCase() === "cache-control")
    .map((header) => header.value);

describe("next.config.ts response headers", () => {
  it("never gives a catch-all source a public Cache-Control", async () => {
    const rules = await getRules();

    // Any rule whose source matches every path. A public value on one of these
    // reaches personal HTML documents, which is the bug.
    const catchAllSources = ["/(.*)", "/:path*"];
    const offenders = rules
      .filter((rule) => catchAllSources.includes(rule.source))
      .flatMap((rule) =>
        rule.headers
          .filter(
            (header) =>
              header.key.toLowerCase() === "cache-control" &&
              /public/i.test(header.value),
          )
          .map((header) => `${rule.source} -> ${header.value}`),
      );

    expect(
      offenders,
      `a catch-all header rule sets a public Cache-Control, so personal pages ` +
        `(settings/wallet, settings/profile/info, sellerProfile) are served ` +
        `publicly cacheable: ${offenders.join("; ")}`,
    ).toEqual([]);
  });

  it("still sends no-store for every API route", async () => {
    const rules = await getRules();
    const values = cacheControlFor(rules, "/api/:path*");

    expect(
      values.join(" "),
      "the /api/:path* rule no longer sends no-store, so API responses could be cached",
    ).toContain("no-store");
  });

  // The sitemap routes each set their own Cache-Control. A rule here matching
  // the same URL wins over the route, so app/sitemap-static.xml/route.ts asked
  // for max-age=43200 and the measured response said 3600 - the route's value
  // had never taken effect. The same override also put `application/xml` and an
  // hour of public caching on those routes' 500 responses, which are text/plain.
  it("leaves the sitemap Cache-Control to the route that owns it", async () => {
    const rules = await getRules();

    const offenders = rules
      .filter((rule) => rule.source.includes("sitemap"))
      .flatMap((rule) =>
        rule.headers
          .filter((header) => header.key.toLowerCase() === "cache-control")
          .map((header) => `${rule.source} -> ${header.value}`),
      );

    expect(
      offenders,
      `next.config.ts sets Cache-Control for a sitemap URL, which overrides the ` +
        `value the route handler sets and caches its error responses too: ` +
        `${offenders.join("; ")}`,
    ).toEqual([]);
  });

  it("still caches static assets immutably", async () => {
    const rules = await getRules();
    const assetRule = rules.find((rule) => rule.source.includes("woff2"));

    expect(
      assetRule,
      "the static-asset header rule is gone from next.config.ts",
    ).toBeDefined();
    expect(
      cacheControlFor(rules, assetRule!.source).join(" "),
      "static assets are no longer served immutable, so they would be refetched",
    ).toContain("immutable");
  });
});

/**
 * Guards the `homepage` cacheLife profile (D-3, D-4).
 *
 * `expire` is the subtle one. Next excludes any cached scope whose `expire` is
 * under five minutes from prerenders and resolves it per request instead
 * (cacheLife.md, "Prerendering behavior"). Measured on this repo: `expire: 120`
 * left the probe route dynamic and its text absent from the built HTML, while
 * `expire: 300` made it a partial prerender with the text present. On serverless
 * a dynamic hole also means no reuse between requests, so the low value would
 * have cost a fresh Elasticsearch query on every visit and saved nothing.
 */
const loadConfig = async () => {
  vi.resetModules();
  const loaded = await import("../next.config");
  return (loaded.default ?? loaded) as any;
};

describe("the homepage cache profile", () => {
  it("defines a profile named homepage", async () => {
    const config = await loadConfig();
    expect(
      config.cacheLife?.homepage,
      "next.config.ts defines no cacheLife profile called 'homepage', so every cacheLife('homepage') call in the home and category routes falls back to the 'default' profile (15 minute revalidate) and shoppers see stale prices",
    ).toBeDefined();
  });

  it("revalidates once a minute by default", async () => {
    const previous = process.env.HOMEPAGE_CACHE_SECONDS;
    delete process.env.HOMEPAGE_CACHE_SECONDS;
    try {
      const config = await loadConfig();
      expect(
        config.cacheLife?.homepage?.revalidate,
        "the homepage profile must refresh once a minute (D-4, fallback 60); a different value changes how stale a price can be",
      ).toBe(60);
    } finally {
      if (previous === undefined) delete process.env.HOMEPAGE_CACHE_SECONDS;
      else process.env.HOMEPAGE_CACHE_SECONDS = previous;
    }
  });

  it("expires no sooner than five minutes, so the segment is prerendered", async () => {
    const config = await loadConfig();
    const expire = config.cacheLife?.homepage?.expire;
    expect(
      expire,
      `the homepage profile expires after ${expire}s. Next excludes any scope with expire under 300s from prerenders (cacheLife.md, "Prerendering behavior"), which on serverless means the cached readers re-run on every request and the conversion saves nothing`,
    ).toBeGreaterThanOrEqual(300);
  });

  it("reads the window from HOMEPAGE_CACHE_SECONDS", async () => {
    const previous = process.env.HOMEPAGE_CACHE_SECONDS;
    process.env.HOMEPAGE_CACHE_SECONDS = "30";
    try {
      const config = await loadConfig();
      expect(
        config.cacheLife?.homepage?.revalidate,
        "HOMEPAGE_CACHE_SECONDS=30 did not reach the homepage profile, so the cache window cannot be tuned without a code change (D-4)",
      ).toBe(30);
    } finally {
      if (previous === undefined) delete process.env.HOMEPAGE_CACHE_SECONDS;
      else process.env.HOMEPAGE_CACHE_SECONDS = previous;
    }
  });
});
