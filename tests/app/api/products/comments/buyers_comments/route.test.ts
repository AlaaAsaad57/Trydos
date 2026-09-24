// @vitest-environment node
//
// The buyers-reviews page route: one page of a product's reviews from
// Elasticsearch.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetRatingCommentsForProduct = vi.fn();
vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  GetRatingCommentsForProduct: (...a: unknown[]) => GetRatingCommentsForProduct(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/comments/buyers_comments/route";

const request = (query: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://trydos.test/api/products/comments/buyers_comments${query}`, init);

beforeEach(() => {
  vi.clearAllMocks();
  GetRatingCommentsForProduct.mockResolvedValue({
    buyers_comments: [{ id: 1 }],
    searchAfter: [9],
    total: 4,
    filters_key: ["5"],
  });
});

describe("the buyers-reviews page route", () => {
  it("answers a preflight with 204", async () => {
    const response = await GET(request("", { method: "OPTIONS" }));

    expect(response.status, "the preflight did not answer 204").toBe(204);
  });

  it("refuses a call with no product id", async () => {
    const response = await GET(request(""));

    expect(response.status, "a call with no product id was accepted").toBe(400);
    expect(GetRatingCommentsForProduct, "Elasticsearch was asked for no product").not.toHaveBeenCalled();
  });

  it("reads one page of reviews with the decoded offset, filter and language", async () => {
    const offset = encodeURIComponent(encodeURIComponent("[3]"));
    const response = await GET(
      request(`?product_id=5&user_id=7&filter=5&offset=${offset}`, { headers: { language: "ar" } }),
    );

    expect(GetRatingCommentsForProduct, "the reviews were not asked for what the request said").toHaveBeenCalledWith({
      product_id: "5",
      searchAfter: "[3]",
      pageSize: 10,
      user_id: "7",
      filter: "5",
      language: "ar",
    });
    await expect(response.json(), "the reviews page was not returned").resolves.toEqual({
      data: { buyers_comments: [{ id: 1 }], offset: [9], total: 4, filters_key: ["5"], searchAfter: [9] },
      code: 200,
    });
  });

  it("uses English and no offset when the request says nothing", async () => {
    await GET(request("?product_id=5"));

    expect(GetRatingCommentsForProduct.mock.calls[0][0], "the defaults were not applied").toMatchObject({
      searchAfter: null,
      language: "en",
    });
  });

  it("answers 500 with the error text when Elasticsearch throws", async () => {
    GetRatingCommentsForProduct.mockRejectedValue(new Error("es down"));

    const response = await GET(request("?product_id=5"));

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    await expect(response.json(), "the 500 did not carry the error text").resolves.toEqual({
      message: "es down",
      data: null,
      code: 500,
    });
    expect(LogServerError, "the failure was not reported").toHaveBeenCalled();
  });

  it("uses the thrown value, or a fallback, when the error has no message", async () => {
    GetRatingCommentsForProduct.mockRejectedValueOnce("plain failure");
    const plain = await (await GET(request("?product_id=5"))).json();
    expect(plain.message, "a thrown string was not used as the message").toBe("plain failure");

    GetRatingCommentsForProduct.mockRejectedValueOnce(0);
    const empty = await (await GET(request("?product_id=5"))).json();
    expect(empty.message, "an empty failure did not get the fallback text").toBe(
      "error getting product rating data from elestic",
    );
  });
});
