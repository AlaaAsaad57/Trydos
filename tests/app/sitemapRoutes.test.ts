// The single-page sitemap routes (home, search, static, the index) and the
// per-locale sitemap under /[lang]/sitemap.xml. Each one asks the sitemap
// service for its XML and serves it, or answers 500 as plain text.
//
// The paged ones (products, boutiques) live in sitemapPagination.test.ts.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const service = {
  generateHomeSitemapXML: vi.fn(),
  generateSearchTermsSitemapXML: vi.fn(),
  generateStaticPagesSitemapXML: vi.fn(),
  generateLocaleSitemapIndexXML: vi.fn(),
  generateLocaleSpecificSitemapXML: vi.fn(),
};
vi.mock("services/elastic/sitemap.service", () => ({
  generateHomeSitemapXML: (...a: unknown[]) => service.generateHomeSitemapXML(...a),
  generateSearchTermsSitemapXML: (...a: unknown[]) => service.generateSearchTermsSitemapXML(...a),
  generateStaticPagesSitemapXML: (...a: unknown[]) => service.generateStaticPagesSitemapXML(...a),
  generateLocaleSitemapIndexXML: (...a: unknown[]) => service.generateLocaleSitemapIndexXML(...a),
  generateLocaleSpecificSitemapXML: (...a: unknown[]) => service.generateLocaleSpecificSitemapXML(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET as getLocale } from "app/(client)/[lang]/sitemap.xml/route";
import { GET as getHome } from "app/sitemap-home.xml/route";
import { GET as getSearch } from "app/sitemap-search.xml/route";
import { GET as getStatic } from "app/sitemap-static.xml/route";
import { GET as getIndex } from "app/sitemap.xml/route";

const request = (path: string) => new NextRequest(`http://localhost/${path}`);

beforeEach(() => {
  vi.clearAllMocks();
  Object.values(service).forEach((spy) => spy.mockResolvedValue("<urlset/>"));
});

describe.each([
  ["home", getHome, "generateHomeSitemapXML", "public, max-age=3600"],
  ["search terms", getSearch, "generateSearchTermsSitemapXML", "public, max-age=3600"],
  ["static pages", getStatic, "generateStaticPagesSitemapXML", "public, max-age=43200"],
  ["index", getIndex, "generateLocaleSitemapIndexXML", "public, max-age=3600"],
] as const)("the %s sitemap", (name, handler, generator, cache) => {
  it("serves the XML with a public cache", async () => {
    const response = await handler(request("sitemap.xml"));

    expect(response.status, `the ${name} sitemap did not answer 200`).toBe(200);
    expect(response.headers.get("content-type"), `the ${name} sitemap is not XML`).toBe("application/xml");
    expect(response.headers.get("cache-control"), `the ${name} sitemap has the wrong cache life`).toContain(cache);
    await expect(response.text(), `the ${name} sitemap body was not served`).resolves.toBe("<urlset/>");
  });

  it("answers 500 as plain text and reports when the build fails", async () => {
    service[generator].mockRejectedValueOnce(new Error("es down"));

    const response = await handler(request("sitemap.xml"));

    expect(response.status, `a failed ${name} sitemap did not answer 500`).toBe(500);
    expect(LogServerError, `the failed ${name} sitemap was not reported`).toHaveBeenCalled();
  });
});

describe("the per-locale sitemap", () => {
  const call = (lang: string) =>
    getLocale(request(`${lang}/sitemap.xml`), { params: Promise.resolve({ lang }) });

  it("serves the sitemap for a known country and language", async () => {
    const response = await call("iq-ar");

    expect(service.generateLocaleSpecificSitemapXML, "the sitemap was not built for iq / ar").toHaveBeenCalledWith(
      "iq",
      "ar",
    );
    expect(response.status, "a known locale did not answer 200").toBe(200);
  });

  it.each(["sy", "sy-en-x"])("refuses a locale that is not country-language: %s", async (lang) => {
    const response = await call(lang);

    await expect(response.text(), `the locale "${lang}" was not refused as badly formed`).resolves.toBe(
      "Invalid lang format",
    );
  });

  it.each(["fr-en", "sy-fr"])("refuses an unknown country or language: %s", async (lang) => {
    const response = await call(lang);

    expect(response.status, `the locale "${lang}" was accepted`).toBe(400);
    await expect(response.text(), `the locale "${lang}" was not refused as unknown`).resolves.toBe(
      "Invalid country or language",
    );
  });

  it("answers 500 when the build fails", async () => {
    service.generateLocaleSpecificSitemapXML.mockRejectedValueOnce(new Error("es down"));

    const response = await call("sy-en");

    expect(response.status, "a failed locale sitemap did not answer 500").toBe(500);
    expect(LogServerError, "the failed locale sitemap was not reported").toHaveBeenCalled();
  });
});
