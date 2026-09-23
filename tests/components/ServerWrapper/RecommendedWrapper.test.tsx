// The recommendations row on the home page. It is rendered per request because
// it reads the shopper's own id from the User-Data cookie.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const getCookieServer = vi.fn();
const GetRecommedndedProducts = vi.fn();
const productCard = vi.fn();
const moreProducts = vi.fn();

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...args: any[]) => getCookieServer(...args),
}));
vi.mock("serverRequests/home", () => ({
  GetRecommedndedProducts: (...args: any[]) => GetRecommedndedProducts(...args),
}));
vi.mock("components/products/ProductCard", () => ({
  default: (props: any) => {
    productCard(props);
    return <div data-pw="card">{props.product.id}</div>;
  },
}));
vi.mock("components/Server/RecomendedProducts", () => ({
  default: (props: any) => {
    moreProducts(props);
    return null;
  },
}));
vi.mock("utils/server", () => ({
  translateFunction: (key: string) => key,
}));

import RecommendedWrapper from "components/ServerWrapper/RecommendedWrapper";

describe("the recommendations row", () => {
  beforeEach(() => {
    getCookieServer.mockReset();
    GetRecommedndedProducts.mockReset();
    productCard.mockClear();
    moreProducts.mockClear();
  });

  it("draws nothing when there is nothing to recommend", async () => {
    getCookieServer.mockResolvedValue(null);
    GetRecommedndedProducts.mockResolvedValue({ items: [], offset: 0 });
    const element = await RecommendedWrapper({ lang: "sy-en", currency: null });
    const { container } = render(element);
    expect(container.innerHTML, "an empty recommendation list should draw nothing").toBe("");
    expect(GetRecommedndedProducts, "a guest should be asked for with no user id").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
      limit: 7,
      userId: undefined,
    });
  });

  it("draws one card per product for the signed-in shopper, and keeps loading after them", async () => {
    getCookieServer.mockResolvedValue({ id: 42 });
    GetRecommedndedProducts.mockResolvedValue({
      items: [{ product_id: 1 }, { id: 2 }],
      offset: 7,
    });
    const element = await RecommendedWrapper({
      lang: "sy-ar",
      currency: Promise.resolve({ symbol: "$" }),
    });
    const { container, getByText } = render(element);
    expect(getByText("Recommended Products"), "the row title is missing").toBeInTheDocument();
    expect(
      container.querySelector('[data-pw="recommended-products"] > div')?.className,
      "the title bar should be reversed in Arabic",
    ).toContain("flex-row-reverse");
    expect(
      productCard.mock.calls.map(([p]) => p.fromRecomended),
      "each card should carry the shopper's id and its own product id for tracking",
    ).toEqual([
      { user_id_custom: 42, select_item_recommended: 1 },
      { user_id_custom: 42, select_item_recommended: 2 },
    ]);
    expect(moreProducts, "the next page should start where the first one ended").toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, InitialOffset: 7, lang: "sy-ar", currency: { symbol: "$" } }),
    );
  });

  it("keeps the title bar left to right in English", async () => {
    getCookieServer.mockResolvedValue({ id: 1 });
    GetRecommedndedProducts.mockResolvedValue({ items: [{ id: 3 }], offset: 1 });
    const { container } = render(await RecommendedWrapper({ lang: "sy-en", currency: null }));
    expect(
      container.querySelector('[data-pw="recommended-products"] > div')?.className,
      "the title bar must not be reversed in English",
    ).not.toContain("flex-row-reverse");
  });
});
