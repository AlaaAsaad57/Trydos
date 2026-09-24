import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "app/api/products/comments/order_rating/route";
import { GetRatingCommentsFromElastic } from "utils/pagesDataRequests/ProductPageData";
import { LogServerError } from "utils/serverErrorReporter";

vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  GetRatingCommentsFromElastic: vi.fn(),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: vi.fn(),
}));

describe("POST /api/products/comments/order_rating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns status 204 for OPTIONS method", async () => {
    const req = new NextRequest("https://example.com/api/products/comments/order_rating", {
      method: "OPTIONS",
    });

    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("returns status 400 when order_detail_ids is missing", async () => {
    const req = new NextRequest("https://example.com/api/products/comments/order_rating", {
      method: "POST",
      body: JSON.stringify({ user_id: "user-1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing required fields");
  });

  it("returns status 400 when user_id is missing", async () => {
    const req = new NextRequest("https://example.com/api/products/comments/order_rating", {
      method: "POST",
      body: JSON.stringify({ order_detail_ids: [101] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing required fields");
  });

  it("calls GetRatingCommentsFromElastic and returns 200 with comments data", async () => {
    const mockComments = [{ id: "c1", comment: "Excellent" }];
    vi.mocked(GetRatingCommentsFromElastic).mockResolvedValueOnce(mockComments as any);

    const req = new NextRequest("https://example.com/api/products/comments/order_rating", {
      method: "POST",
      body: JSON.stringify({
        order_detail_ids: [101, 102],
        user_id: "user-99",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe(200);
    expect(json.data).toEqual(mockComments);
    expect(GetRatingCommentsFromElastic).toHaveBeenCalledWith({
      order_ids: [101, 102],
      user_id: "user-99",
      pageSize: 10,
    });
  });

  it("logs server error and returns 500 when GetRatingCommentsFromElastic throws", async () => {
    vi.mocked(GetRatingCommentsFromElastic).mockRejectedValueOnce(
      new Error("Elastic connection failure"),
    );

    const req = new NextRequest("https://example.com/api/products/comments/order_rating", {
      method: "POST",
      headers: { referer: "/settings/orders/123" },
      body: JSON.stringify({
        order_detail_ids: [101],
        user_id: "user-99",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe(500);
    expect(json.message).toContain("Elastic connection failure");
    expect(LogServerError).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "get rating comment for order server api",
        userId: "user-99",
        page: "/settings/orders/123",
      }),
    );
  });
});
