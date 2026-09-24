// @vitest-environment node
//
// The mobile seller social-counters route.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSellerProductsSocial = vi.fn();
vi.mock("services/elastic/sellerComments", () => ({
  getSellerProductsSocial: (...a: unknown[]) => getSellerProductsSocial(...a),
}));

import { OPTIONS, POST } from "app/api/seller/comments/social/route";

const request = (body: string, headers: Record<string, string> = { authorization: "Bearer tok" }) =>
  new NextRequest("https://trydos.test/api/seller/comments/social", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });

beforeEach(() => {
  vi.clearAllMocks();
  getSellerProductsSocial.mockResolvedValue({ success: true, data: { "1": { total_reactions: 2 } } });
});

describe("the seller social-counters route", () => {
  it("answers a preflight with 204", () => {
    expect(OPTIONS().status, "the preflight did not answer 204").toBe(204);
  });

  it("refuses a call with no market token", async () => {
    const response = await POST(request("{}", {}));

    expect(response.status, "a call without a token was not refused").toBe(401);
  });

  it("reads the counters for the given products", async () => {
    const response = await POST(request(JSON.stringify({ seller_id: 12, product_ids: [1, 2] })));

    expect(getSellerProductsSocial, "the counters were not asked for the given products").toHaveBeenCalledWith({
      sellerId: "12",
      productIds: [1, 2],
      authToken: "tok",
    });
    await expect(response.json(), "the counters were not returned").resolves.toEqual({
      success: true,
      data: { "1": { total_reactions: 2 } },
    });
  });

  it("sends no products when product_ids is not a list", async () => {
    await POST(request(JSON.stringify({ product_ids: "1,2" })));

    expect(getSellerProductsSocial.mock.calls[0][0], "a product_ids that is not a list was not dropped").toMatchObject({
      sellerId: "",
      productIds: [],
    });
  });
});
