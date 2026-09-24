// @vitest-environment node
//
// The mobile product price/quantity route: always a fresh backend read.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetProductPriceQtyDetails = vi.fn();
vi.mock("serverRequests/product", () => ({
  GetProductPriceQtyDetails: (...a: unknown[]) => GetProductPriceQtyDetails(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET, OPTIONS } from "app/api/mobile/product/qty/[slug]/route";

const call = (headers: Record<string, string> = {}) =>
  GET(new NextRequest("https://trydos.test/api/mobile/product/qty/shoe", { headers }), {
    params: Promise.resolve({ slug: "shoe" }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  GetProductPriceQtyDetails.mockResolvedValue({ price: 10, available_quantity: 3 });
});

describe("the mobile product quantity route", () => {
  it("answers a preflight with 204 and open CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status, "the preflight did not answer 204").toBe(204);
    expect(response.headers.get("access-control-allow-origin"), "the preflight is not open to every origin").toBe("*");
  });

  it("reads the price and quantity fresh, in the request's locale", async () => {
    const response = await call({ country: "iq", language: "ar" });

    expect(GetProductPriceQtyDetails, "the backend was not asked fresh in the request's locale").toHaveBeenCalledWith({
      country: "iq",
      language: "ar",
      slug: "shoe",
      noCache: true,
    });
    await expect(response.json(), "the price and quantity were not returned").resolves.toEqual({
      data: { price: 10, available_quantity: 3 },
      isSuccessful: true,
      code: 200,
    });
  });

  it("uses Syria and the lang header when language is missing", async () => {
    await call({ lang: "tr" });

    expect(GetProductPriceQtyDetails.mock.calls[0][0], "the fallbacks were not applied").toMatchObject({
      country: "sy",
      language: "tr",
    });
  });

  it("uses English when no language header is sent", async () => {
    await call();

    expect(GetProductPriceQtyDetails.mock.calls[0][0].language, "the default language is not English").toBe("en");
  });

  it("answers 500 and reports when the backend read throws", async () => {
    GetProductPriceQtyDetails.mockRejectedValue(new Error("down"));

    const response = await call();

    expect(response.status, "a backend failure did not become 500").toBe(500);
    expect(LogServerError, "the backend failure was not reported").toHaveBeenCalled();
  });
});
