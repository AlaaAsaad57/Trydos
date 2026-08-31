import { describe, expect, it } from "vitest";

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
