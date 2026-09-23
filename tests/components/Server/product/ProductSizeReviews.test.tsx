// "Buyers Reviews On Product Sizing": how many buyers found the size true,
// small or large. Only products that come in sizes show it.
import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const { GetProductGeneralData } = vi.hoisted(() => ({ GetProductGeneralData: vi.fn() }));
vi.mock("serverRequests/product", () => ({
  GetProductGeneralData: (...a: any[]) => GetProductGeneralData(...a),
}));
vi.mock("utils/server", () => ({ translateFunction: (key: string) => key }));

import ProductSizeReviews from "components/Server/product/ProductSizeReviews";

describe("the size reviews", () => {
  it("shows nothing, and asks nothing, for a product without sizes", async () => {
    GetProductGeneralData.mockClear();
    const { container } = render(
      await ProductSizeReviews({ qtyPricePromise: Promise.resolve({ id: 1, sizes: [] }), language: "en", isRtl: false }),
    );
    expect(container.innerHTML, "no sizes should draw nothing").toBe("");
    expect(GetProductGeneralData, "no size analysis is needed without sizes").not.toHaveBeenCalled();
  });

  it("shows the three shares, right to left in Arabic, zero when the backend has none", async () => {
    GetProductGeneralData.mockResolvedValue({ size_analysis: { true_percentage: 70, small_percentage: 30 } });
    const { container } = render(
      await ProductSizeReviews({ qtyPricePromise: Promise.resolve({ id: 1, sizes: ["M"] }), language: "ar", isRtl: true }),
    );
    expect(GetProductGeneralData, "the analysis must be read for this product").toHaveBeenCalledWith({ id: 1 });
    expect(
      Array.from(container.querySelectorAll(".bold")).map((n) => n.textContent),
      "true, small and large shares should be shown, a missing one as 0",
    ).toEqual(["70 %", "30 %", "0 %"]);
    expect(
      (container.firstElementChild as HTMLElement).className,
      "the section should align right in Arabic",
    ).toContain("items-end");
  });
});
