// @vitest-environment node
//
// The mobile seller-comments list route, and the shared helpers in _utils.ts
// that every seller-comments route uses (token reading, status mapping, CORS).
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSellerComments = vi.fn();
vi.mock("services/elastic/sellerComments", () => ({
  getSellerComments: (...a: unknown[]) => getSellerComments(...a),
}));

import { GET, OPTIONS } from "app/api/seller/comments/route";

const request = (query = "", headers: Record<string, string> = { authorization: "Bearer tok" }) =>
  new NextRequest(`https://trydos.test/api/seller/comments${query}`, { headers });

beforeEach(() => {
  vi.clearAllMocks();
  getSellerComments.mockResolvedValue({ success: true, data: { comments: [] } });
});

describe("the seller-comments list route", () => {
  it("answers a preflight with 204 and the CORS headers", () => {
    const response = OPTIONS();

    expect(response.status, "the preflight did not answer 204").toBe(204);
    expect(
      response.headers.get("access-control-allow-headers"),
      "the preflight does not allow the seller headers",
    ).toContain("x-market-token");
  });

  it("refuses a call with no market token with a 401", async () => {
    const response = await GET(request("", {}));

    expect(response.status, "a call with no token was not refused").toBe(401);
    expect(getSellerComments, "the comments were read without a token").not.toHaveBeenCalled();
  });

  it("reads FAQ questions, page 1, by default, with the bearer token", async () => {
    const response = await GET(request("?seller_id= 12 "));

    expect(getSellerComments, "the defaults were not applied").toHaveBeenCalledWith({
      sellerId: "12",
      isReview: false,
      page: 1,
      pageSize: undefined,
      authToken: "tok",
    });
    await expect(response.json(), "the comments were not returned").resolves.toEqual({
      success: true,
      data: { comments: [] },
    });
  });

  it.each(["review", "REVIEWS"])("reads reviews for type=%s, with the x-market-token header", async (type) => {
    await GET(request(`?type=${type}&page=3&page_size=20`, { "x-market-token": " alt " }));

    expect(getSellerComments.mock.calls[0][0], `type=${type} did not ask for reviews`).toEqual({
      sellerId: "",
      isReview: true,
      page: 3,
      pageSize: 20,
      authToken: "alt",
    });
  });

  it.each([
    ["Too many requests, slow down", 429],
    ["You do not have permission", 403],
    ["User not authorized for this shop", 403],
    ["Unable to verify the seller", 401],
    ["Comment not found", 404],
    ["Bad seller id", 400],
  ])("maps the failure message %s to %s", async (message, status) => {
    getSellerComments.mockResolvedValue({ success: false, message });

    const response = await GET(request());

    expect(response.status, `"${message}" did not map to ${status}`).toBe(status);
    await expect(response.json(), "the failure message was not passed on").resolves.toEqual({
      success: false,
      message,
    });
  });

  it("uses a fallback message and 400 when the failure says nothing", async () => {
    getSellerComments.mockResolvedValue(undefined);

    const response = await GET(request());

    expect(response.status, "a silent failure did not map to 400").toBe(400);
    await expect(response.json(), "a silent failure did not get the fallback text").resolves.toEqual({
      success: false,
      message: "Request failed.",
    });
  });
});
