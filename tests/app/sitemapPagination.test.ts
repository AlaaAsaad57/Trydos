// The paged sitemap routes, and what an out-of-range ?page= costs.
//
// The bug this file was written for: /sitemap-products.xml?page= and
// /sitemap-boutiques.xml?page= clamped the value at the bottom only —
// `Math.max(0, parseInt(...))`. There was no top. And the generator builds every
// url first and slices afterwards, so ?page=999999 did the whole job, sliced an
// empty window out of it, and answered 200 with an empty sitemap.
//
// So every value cost the same as a real page: the full Elasticsearch scroll
// over the catalog. Anyone could ask for as many of them as they liked, and each
// answer was cached publicly for an hour under its own url.
//
// A page that does not exist is a 404, and it must cost nothing.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const generateProductSitemapXML = vi.fn();
const generateBoutiqueSitemapXML = vi.fn();
const getProductSitemapPageCount = vi.fn();
const getBoutiqueSitemapPageCount = vi.fn();

vi.mock("services/elastic/sitemap.service", () => ({
  generateProductSitemapXML: (...a: unknown[]) => generateProductSitemapXML(...a),
  generateBoutiqueSitemapXML: (...a: unknown[]) => generateBoutiqueSitemapXML(...a),
  getProductSitemapPageCount: (...a: unknown[]) => getProductSitemapPageCount(...a),
  getBoutiqueSitemapPageCount: (...a: unknown[]) => getBoutiqueSitemapPageCount(...a),
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: vi.fn() }));

import { GET as getProducts } from "app/sitemap-products.xml/route";
import { GET as getBoutiques } from "app/sitemap-boutiques.xml/route";

const request = (url: string) => new NextRequest(new Request(url));

beforeEach(() => {
  vi.clearAllMocks();
  generateProductSitemapXML.mockResolvedValue("<urlset></urlset>");
  generateBoutiqueSitemapXML.mockResolvedValue("<urlset></urlset>");
  // Three pages exist, so the legal values are 0, 1 and 2.
  getProductSitemapPageCount.mockResolvedValue(3);
  getBoutiqueSitemapPageCount.mockResolvedValue(3);
});

describe.each([
  ["products", () => getProducts, () => generateProductSitemapXML, "sitemap-products.xml"],
  ["boutiques", () => getBoutiques, () => generateBoutiqueSitemapXML, "sitemap-boutiques.xml"],
])("the %s sitemap ?page=", (_name, handler, generator, path) => {
  it("answers 404 for a page past the last one", async () => {
    const response = await handler()(request(`http://localhost/${path}?page=999999`));

    expect(
      response.status,
      `?page=999999 answered ${response.status}; a page that does not exist is ` +
        `a 404, and answering 200 lets it be cached publicly for an hour`,
    ).toBe(404);
  });

  it("does not build a single url for a page past the last one", async () => {
    await handler()(request(`http://localhost/${path}?page=999999`));

    expect(
      generator().mock.calls.length,
      `a page that does not exist still ran the full sitemap build, which is a ` +
        `complete Elasticsearch scroll over the catalog`,
    ).toBe(0);
  });

  it("still serves the first page when no ?page= is given", async () => {
    const response = await handler()(request(`http://localhost/${path}`));

    expect(
      response.status,
      "the plain sitemap url stopped working",
    ).toBe(200);
    expect(
      generator().mock.calls[0]?.[0],
      "the plain sitemap url no longer builds page 0",
    ).toBe(0);
  });

  it("still serves the last page that exists", async () => {
    const response = await handler()(request(`http://localhost/${path}?page=2`));

    expect(
      response.status,
      "page 2 of 3 was refused, so the last page of the sitemap is unreachable",
    ).toBe(200);
    expect(
      generator().mock.calls[0]?.[0],
      "page 2 was requested and a different page was built",
    ).toBe(2);
  });

  it("answers 404 for a negative page", async () => {
    const response = await handler()(request(`http://localhost/${path}?page=-5`));

    expect(
      response.status,
      `?page=-5 answered ${response.status} instead of 404`,
    ).toBe(404);
  });

  it("answers 404 for a page that is not a number", async () => {
    const response = await handler()(request(`http://localhost/${path}?page=abc`));

    expect(
      response.status,
      `?page=abc answered ${response.status} instead of 404`,
    ).toBe(404);
  });
});
