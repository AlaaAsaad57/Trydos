import { describe, expect, it } from "vitest";
import { buildSearchRedirectTarget } from "utils/listing/searchPathRedirect";

describe("buildSearchRedirectTarget utility", () => {
  it("returns null when no search segment is in path parameters", () => {
    const target = buildSearchRedirectTarget("en", "filters", ["category", "shoes"], {});
    expect(target, "should return null when 'search' segment is missing").toBeNull();
  });

  it("returns null when 'search' segment is the last segment without a value", () => {
    const target = buildSearchRedirectTarget("en", "filters", ["search"], {});
    expect(target, "should return null when 'search' has no following value").toBeNull();
  });

  it("migrates legacy search path pair to ?search= query parameter", () => {
    const target = buildSearchRedirectTarget(
      "en",
      "filters",
      ["category", "shoes", "search", "nike"],
      { page: "2" },
    );
    expect(target, "should strip search pair from path and append to query string").toBe(
      "/en/filters/category/shoes?page=2&search=nike",
    );
  });

  it("handles URL encoded search values", () => {
    const target = buildSearchRedirectTarget(
      "ar",
      "featured",
      ["search", "%D8%AD%D8%B0%D8%A7%D8%A1"],
      {},
    );
    expect(target, "should decode URI components correctly").toBe("/ar/featured?search=%D8%AD%D8%B0%D8%A7%D8%A1");
  });

  it("overwrites existing search query param with the path search value", () => {
    const target = buildSearchRedirectTarget(
      "en",
      "flashDeals",
      ["search", "new-search"],
      { search: "old-search", sort: "price_asc" },
    );
    expect(target, "should replace old search query param with new decoded path search value").toBe(
      "/en/flashDeals?sort=price_asc&search=new-search",
    );
  });
});

describe("a search value that will not decode", () => {
  it("is moved to ?search= as it was written", () => {
    const target = buildSearchRedirectTarget("sy-en", "filters", ["search", "a%E0%A4%A"], {});
    expect(new URL(`https://x${target}`).searchParams.get("search"), "the raw search value was lost").toBe("a%E0%A4%A");
  });
});

describe("an existing query parameter given as a list", () => {
  it("keeps its first value", () => {
    const target = buildSearchRedirectTarget("sy-en", "filters", ["search", "shoes"], { sort: ["price", "name"], empty: [] });
    const params = new URL(`https://x${target}`).searchParams;
    expect([params.get("sort"), params.has("empty"), params.get("search")], "the query parameters were not carried over").toEqual([
      "price",
      false,
      "shoes",
    ]);
  });
});
