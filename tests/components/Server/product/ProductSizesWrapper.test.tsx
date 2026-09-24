// The sizes box on the product page. Products without sizes do not show it.
import { describe, expect, it, vi } from "vitest";

vi.mock("utils/server", () => ({ translateFunction: (key: string) => key }));

import ProductSizesWrapper from "components/Server/product/ProductSizesWrapper";

import { renderWithProviders, screen } from "../../../render";

describe("the product sizes box", () => {
  it("shows nothing for a product without sizes", async () => {
    const element = await ProductSizesWrapper({ language: "en", qtyPricePromise: Promise.resolve({}), isRtl: false, activeSize: null });
    const { container } = await renderWithProviders(element);
    expect(container.innerHTML, "no sizes should draw nothing").toBe("");
  });

  it("shows how many sizes there are and one button per size, right to left in Arabic", async () => {
    const element = await ProductSizesWrapper({
      language: "ar",
      qtyPricePromise: Promise.resolve({ sizes: ["s", "m"] }),
      isRtl: true,
      activeSize: "m",
    });
    const { container } = await renderWithProviders(element, { language: "ar" });
    expect(screen.getByText(/Sizes Available/).textContent, "the size count should be shown").toContain("2");
    expect(container.querySelectorAll("#sizes-new-bar > div").length, "each size should get its own button").toBe(2);
    expect(container.querySelector("#sizes-new-bar")?.className, "the sizes should run right to left in Arabic").toContain(
      "flex-row-reverse",
    );
  });

  it("lays the sizes out left to right in English", async () => {
    const element = await ProductSizesWrapper({ language: "en", qtyPricePromise: Promise.resolve({ sizes: ["s"] }), isRtl: false, activeSize: "s" });
    const { container } = await renderWithProviders(element);
    expect(container.querySelector("#sizes-new-bar")?.className, "the sizes should run left to right").not.toContain("flex-row-reverse");
  });
});
