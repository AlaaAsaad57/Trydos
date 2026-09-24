// The buyers comments section on a product page (server side). It is left
// out when the product has no comments.
import { describe, expect, it, vi } from "vitest";

const getCookieServer = vi.fn();
const GetRatingCommentsForProduct = vi.fn();
const GetRecommendationCountForProduct = vi.fn();
const list = vi.fn();

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...a: any[]) => getCookieServer(...a),
}));
vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  GetRatingCommentsForProduct: (...a: any[]) =>
    GetRatingCommentsForProduct(...a),
}));
vi.mock("serverRequests/product", () => ({
  GetRecommendationCountForProduct: (...a: any[]) =>
    GetRecommendationCountForProduct(...a),
}));
vi.mock("utils/server", () => ({ translateFunction: (k: string) => k }));
vi.mock(
  "components/Server/product/ProductBuyersComment/ProductBuyersCommentList",
  () => ({
    default: (p: any) => {
      list(p);
      return null;
    },
  }),
);
vi.mock(
  "components/Server/product/ProductBuyersComment/BuyersCommentTopBar",
  () => ({ default: ({ children }: any) => <div>{children}</div> }),
);

import ProductBuyersCommentsWrapper from "components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper";

import { render, screen } from "../../../../render";

describe("the buyers comments section", () => {
  it("draws nothing when the product has no comments", async () => {
    getCookieServer.mockResolvedValue(null);
    GetRatingCommentsForProduct.mockResolvedValue({ buyers_comments: [] });
    GetRecommendationCountForProduct.mockResolvedValue({ stats: {} });
    const { container } = render(
      await ProductBuyersCommentsWrapper({
        globalPromise: Promise.resolve({ id: 1 }),
        language: "en",
      }),
    );
    expect(container.innerHTML, "no comments should mean no section").toBe("");
  });

  it("hands the first comments and the recommendation stats to the list", async () => {
    getCookieServer.mockResolvedValue({ id: "4" });
    GetRatingCommentsForProduct.mockResolvedValue({
      buyers_comments: [{ id: 2 }],
      filters_key: [],
      searchAfter: [1],
    });
    GetRecommendationCountForProduct.mockResolvedValue({ stats: { yes: 3 } });
    render(
      await ProductBuyersCommentsWrapper({
        globalPromise: Promise.resolve({ id: 1 }),
        language: "ku",
      }),
    );
    expect(
      GetRatingCommentsForProduct,
      "comments must be read for this product and shopper",
    ).toHaveBeenCalledWith({
      product_id: 1,
      user_id: "4",
      language: "ku",
      pageSize: 5,
    });
    expect(
      list.mock.calls[0][0],
      "the list should get the comments, the stats and the page marker",
    ).toEqual(
      expect.objectContaining({
        comments: [{ id: 2 }],
        recommendation_stats: { yes: 3 },
        offset: [1],
      }),
    );
    expect(
      screen.getByText("Buyers Comment").parentElement?.className,
      "the title row should be reversed in Kurdish",
    ).toContain("flex-row-reverse");
  });

  it("keeps the title row left to right in English", async () => {
    getCookieServer.mockResolvedValue(null);
    GetRatingCommentsForProduct.mockResolvedValue({
      buyers_comments: [{ id: 2 }],
    });
    GetRecommendationCountForProduct.mockResolvedValue({ stats: {} });
    render(
      await ProductBuyersCommentsWrapper({
        globalPromise: Promise.resolve(null),
        language: "en",
      }),
    );
    expect(
      screen.getByText("Buyers Comment").parentElement?.className,
      "English should stay left to right",
    ).not.toContain("flex-row-reverse");
  });
});
