// @vitest-environment node
//
// The related-products JSON route (mobile): related products with the flash
// deal flag worked out on the real clock.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getRelatedProducts = vi.fn();
vi.mock("services/elastic/elasticSearch", () => ({
  getRelatedProducts: (...a: unknown[]) => getRelatedProducts(...a),
}));
const computeFlashActive = vi.fn((product: any, _now?: Date) => product.id === 1);
vi.mock("services/elastic/helpers", () => ({
  computeFlashActive: (...a: [any, Date]) => computeFlashActive(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET, OPTIONS } from "app/api/related-products/[id]/route";

const call = (id: string, query = "", headers: Record<string, string> = {}) =>
  GET(new NextRequest(`https://trydos.test/api/related-products/${id}${query}`, { headers }), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getRelatedProducts.mockResolvedValue({ products: [{ id: 1 }, { id: 2 }], offset: [9], total_size: 2 });
});

describe("the related-products route", () => {
  it("answers a preflight with 204 and open CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status, "the preflight did not answer 204").toBe(204);
    expect(response.headers.get("access-control-allow-origin"), "the preflight is not open to every origin").toBe("*");
  });

  it("refuses a product id that is not a number", async () => {
    const response = await call("abc");

    expect(response.status, "a product id that is not a number was accepted").toBe(400);
    expect(getRelatedProducts, "Elasticsearch was asked for a bad id").not.toHaveBeenCalled();
  });

  it("returns related products with the flash flag set per product", async () => {
    const response = await call("5", `?limit=4&offset=${encodeURIComponent("[3,x]")}`, { country: "iq", lang: "ar" });

    expect(getRelatedProducts, "the related products were not asked for what the request said").toHaveBeenCalledWith({
      productId: 5,
      limit: 4,
      search_after: [3],
      language_code: "ar",
      country: "iq",
      fullSource: true,
    });
    await expect(response.json(), "the products did not carry their own flash flag").resolves.toEqual({
      data: {
        products: [
          { id: 1, is_flash_deal_active: true },
          { id: 2, is_flash_deal_active: false },
        ],
        offset: [9],
        total_size: 2,
      },
      isSuccessful: true,
      code: 200,
    });
  });

  it("uses the defaults and an empty list when Elasticsearch has no products", async () => {
    getRelatedProducts.mockResolvedValue({ offset: null, total_size: 0 });

    const response = await call("5");

    expect(getRelatedProducts.mock.calls[0][0], "the defaults were not applied").toMatchObject({
      limit: 10,
      search_after: [],
      language_code: "en",
      country: "sy",
    });
    expect((await response.json()).data.products, "no products did not become an empty list").toEqual([]);
  });

  it("keeps an offset that cannot be decoded as it came", async () => {
    await call("5", `?offset=${encodeURIComponent("%E0%A4%A")}`);

    expect(getRelatedProducts.mock.calls[0][0].search_after, "an undecodable offset was not dropped to no numbers").toEqual([]);
  });

  it("answers 500 with the error text, or the thrown value", async () => {
    getRelatedProducts.mockRejectedValueOnce(new Error("es down"));
    const failed = await call("5");
    expect(failed.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect((await failed.json()).error, "the error text was not used").toBe("es down");

    getRelatedProducts.mockRejectedValueOnce("plain");
    expect((await (await call("5")).json()).error, "a thrown string was not used").toBe("plain");
    expect(LogServerError, "the failures were not reported").toHaveBeenCalled();
  });
});
