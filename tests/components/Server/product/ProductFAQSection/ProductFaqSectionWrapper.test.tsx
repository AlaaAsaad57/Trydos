// The FAQ section on a product page (server side): it reads the first five
// questions for the product, for the signed-in shopper if there is one.
import { describe, expect, it, vi } from "vitest";

const getCookieServer = vi.fn();
const GetFQACommentsForProduct = vi.fn();
const list = vi.fn();

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...a: any[]) => getCookieServer(...a),
}));
vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  GetFQACommentsForProduct: (...a: any[]) => GetFQACommentsForProduct(...a),
}));
vi.mock("utils/server", () => ({ translateFunction: (k: string) => k }));
vi.mock("components/Server/product/ProductFAQSection/FaqQuestionsList", () => ({
  default: (p: any) => {
    list(p);
    return null;
  },
}));
vi.mock("components/Server/product/ProductFAQSection/FaqSectionTopBar", () => ({
  default: ({ children, isRtl }: any) => (
    <div data-rtl={String(isRtl)}>{children}</div>
  ),
}));

import ProductFaqSectionWrapper from "components/Server/product/ProductFAQSection/ProductFaqSectionWrapper";

import { render, screen } from "../../../../render";

describe("the product FAQ section", () => {
  it("reads five questions for the signed-in shopper and hands them to the list", async () => {
    getCookieServer.mockResolvedValue({ id: "9" });
    GetFQACommentsForProduct.mockResolvedValue({
      fqa_comments: [{ id: 1 }],
      filters_key: ["k"],
      searchAfter: [3],
    });
    render(
      await ProductFaqSectionWrapper({
        language: "ar",
        color: "red",
        size: "M",
        qtyPricePromise: Promise.resolve({
          id: 5,
          owner_id: 7,
          owner_type: "shop",
        }),
      }),
    );
    expect(
      GetFQACommentsForProduct,
      "the questions must be read for this product and shopper",
    ).toHaveBeenCalledWith({
      product_id: 5,
      language: "ar",
      user_id: "9",
      pageSize: 5,
    });
    expect(
      list.mock.calls[0][0],
      "the list should get the questions, the owner and the page marker",
    ).toEqual(
      expect.objectContaining({
        comments: [{ id: 1 }],
        owner_id: 7,
        owner_type: "shop",
        offset: [3],
        productId: 5,
      }),
    );
    expect(
      screen
        .getByText("FAQ Buyer & Seller")
        .closest("[data-rtl]")
        ?.getAttribute("data-rtl"),
      "Arabic should be marked RTL",
    ).toBe("true");
  });

  it("works for a guest with no product data", async () => {
    getCookieServer.mockResolvedValue(null);
    GetFQACommentsForProduct.mockResolvedValue({ fqa_comments: [] });
    render(
      await ProductFaqSectionWrapper({
        language: "en",
        color: null,
        size: null,
        qtyPricePromise: Promise.resolve(null),
      }),
    );
    expect(
      GetFQACommentsForProduct.mock.calls.at(-1)[0].user_id,
      "a guest should be asked for without a user id",
    ).toBeUndefined();
  });
});
