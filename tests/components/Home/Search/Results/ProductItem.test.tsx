import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../render";

const GAevent = vi.fn();
vi.mock("utils/gtag", () => ({ GAevent: (...a: any[]) => GAevent(...a) }));
vi.mock("services/auth", () => ({ default: { UserID: () => "u-1" } }));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => (
    <a href={href} data-pw="product-result-link">
      {children}
    </a>
  ),
}));

import ProductItem from "components/Home/Search/Results/ProductItem";

describe("ProductItem", () => {
  beforeEach(() => {
    GAevent.mockClear();
  });

  it("links to the product and reports the pick to analytics with the other results", async () => {
    const onClick = vi.fn();
    const product = {
      product_id: 1,
      name: "Red shoe",
      slug: "red-shoe",
      brand: { id: 3 },
      category: { id: 4 },
      sync_color_images: [{ images: [{ file_path: "c.png" }] }],
    };
    await renderWithProviders(
      <ProductItem
        product={product}
        onClick={onClick}
        index={2}
        searchValue="shoe"
        resultsProducts={[{ product_id: 1 }, { product_id: 7 }, { product_id: 8 }]}
      />,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href"), "the result links to the wrong page").toBe("/gb-en/products/red-shoe");
    fireEvent.click(link);
    expect(onClick, "the pick was not reported to the search box").toHaveBeenCalledWith("Red shoe");
    const params = GAevent.mock.calls[0][0].params;
    expect(params.search_keyword, "analytics got the wrong search word").toBe("shoe");
    expect(params.search_results_ids, "analytics must list the other results only").toBe("7,8");
    expect(JSON.parse(params.search_item_select).position, "analytics got the wrong position").toBe(2);
  });

  it("lays out right to left in Arabic and falls back to the product image", async () => {
    const { container } = await renderWithProviders(
      <ProductItem product={{ product_id: 2, slug: "s", images: [{ file_path: "p.png" }] }} onClick={() => {}} index={0} />,
      { language: "ar" },
    );
    expect(container.querySelector(".result-product")!.className, "an Arabic result must be reversed").toContain("flex-row-reverse");
    expect(screen.getByAltText("Image"), "a nameless product needs the fallback alt").toBeInTheDocument();
    fireEvent.click(screen.getByRole("link"));
    expect(GAevent.mock.calls[0][0].params.count_results_search, "no results should count as zero").toBe(0);
  });

  it("draws a product that has no pictures at all", async () => {
    const { container } = await renderWithProviders(
      <ProductItem product={{ product_id: 3, slug: "t", name: "Hat" }} onClick={() => {}} index={0} />,
    );
    expect(container.querySelector(".result-product-text")!.textContent, "the product name is missing").toBe("Hat");
  });
});
