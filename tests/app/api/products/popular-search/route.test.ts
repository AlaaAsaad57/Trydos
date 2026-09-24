// @vitest-environment node
//
// The popular-search route: the ten most searched terms.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPopularSearchTerms = vi.fn();
vi.mock("services/elastic/helpers", () => ({
  getPopularSearchTerms: (...a: unknown[]) => getPopularSearchTerms(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/popular-search/route";

const request = () => new NextRequest("https://trydos.test/api/products/popular-search");

beforeEach(() => vi.clearAllMocks());

describe("the popular-search route", () => {
  it("returns the ten most searched terms, never cached", async () => {
    getPopularSearchTerms.mockResolvedValue(["shoes", "bags"]);

    const response = await GET(request());

    expect(getPopularSearchTerms, "the route did not ask for ten terms").toHaveBeenCalledWith(10);
    expect(response.headers.get("cache-control"), "the terms may be cached").toBe("no-store");
    await expect(response.json(), "the terms were not returned").resolves.toEqual({
      popular_search_terms: ["shoes", "bags"],
    });
  });

  it("answers 500 with an empty list when Elasticsearch throws", async () => {
    getPopularSearchTerms.mockRejectedValue(new Error("es down"));

    const response = await GET(request());

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    await expect(response.json(), "the 500 did not carry an empty list").resolves.toEqual({
      message: "Failed to fetch popular search terms",
      popular_search_terms: [],
    });
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });
});
