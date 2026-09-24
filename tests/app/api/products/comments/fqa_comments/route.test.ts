// @vitest-environment node
//
// The product questions (FAQ) page route: one page of a product's questions
// from Elasticsearch.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetFQACommentsForProduct = vi.fn();
vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  GetFQACommentsForProduct: (...a: unknown[]) => GetFQACommentsForProduct(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET } from "app/api/products/comments/fqa_comments/route";

const request = (query: string, init: { method?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://trydos.test/api/products/comments/fqa_comments${query}`, init);

beforeEach(() => {
  vi.clearAllMocks();
  GetFQACommentsForProduct.mockResolvedValue({
    fqa_comments: [{ id: 1 }],
    searchAfter: [9],
    total: 4,
    filters_key: [],
  });
});

describe("the product questions page route", () => {
  it("answers a preflight with 204", async () => {
    const response = await GET(request("", { method: "OPTIONS" }));

    expect(response.status, "the preflight did not answer 204").toBe(204);
  });

  it("refuses a call with no product id", async () => {
    const response = await GET(request(""));

    expect(response.status, "a call with no product id was accepted").toBe(400);
  });

  it("reads one page of questions with the decoded offset and language", async () => {
    const offset = encodeURIComponent(encodeURIComponent("[3]"));
    const response = await GET(
      request(`?product_id=5&user_id=7&filter=x&offset=${offset}`, { headers: { language: "tr" } }),
    );

    expect(GetFQACommentsForProduct, "the questions were not asked for what the request said").toHaveBeenCalledWith({
      product_id: "5",
      searchAfter: "[3]",
      pageSize: 10,
      filter: "x",
      user_id: "7",
      language: "tr",
    });
    await expect(response.json(), "the questions page was not returned").resolves.toEqual({
      data: { fqa_comments: [{ id: 1 }], offset: [9], total: 4, searchAfter: [9], filters_key: [] },
      code: 200,
    });
  });

  it("uses English when no language header is sent", async () => {
    await GET(request("?product_id=5"));

    expect(GetFQACommentsForProduct.mock.calls[0][0].language, "the default language is not English").toBe("en");
  });

  it("answers 500 with the error text, the thrown value, or a fallback", async () => {
    GetFQACommentsForProduct.mockRejectedValueOnce(new Error("es down"));
    const withMessage = await GET(request("?product_id=5"));
    expect(withMessage.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect((await withMessage.json()).message, "the error text was not used").toBe("es down");

    GetFQACommentsForProduct.mockRejectedValueOnce("plain failure");
    expect((await (await GET(request("?product_id=5"))).json()).message, "a thrown string was not used").toBe(
      "plain failure",
    );

    GetFQACommentsForProduct.mockRejectedValueOnce(0);
    expect((await (await GET(request("?product_id=5"))).json()).message, "the fallback text was not used").toBe(
      "error getting product faq data from elastic",
    );
    expect(LogServerError, "the failures were not reported").toHaveBeenCalled();
  });
});
