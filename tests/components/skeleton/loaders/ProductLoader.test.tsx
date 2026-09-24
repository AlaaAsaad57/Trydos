// The product page loader. It shows the product the shopper tapped (name,
// brand, first photo) while the real page streams in, so the first photo must
// be the same one the gallery will show.
import { describe, expect, it } from "vitest";

import ProductLoader from "components/skeleton/loaders/ProductLoader";

import { renderWithProviders } from "../../../render";

describe("the product page loader", () => {
  it("shows the first colour photo, the brand logo and the name, left to right", async () => {
    const { container } = await renderWithProviders(
      <ProductLoader
        product={{
          name: "Red Shoe",
          brand: { icon: "brand.png", name: "Nike" },
          sync_color_images: [{ images: ["/upload/red.png"] }],
          images: ["/upload/other.png"],
        }}
      />,
    );
    const photo = container.querySelector('img[alt="Red Shoe"]');
    expect(photo, "the loader did not show the product's first photo").not.toBeNull();
    expect(
      decodeURIComponent(photo?.getAttribute("src") ?? ""),
      "the loader must show the first colour photo, the same one the gallery shows first",
    ).toContain("red.png");
    expect(container.querySelector('img[alt="Nike"]'), "the brand logo is missing").not.toBeNull();
    expect(
      container.querySelector('[data-pw="productName_productPage"]')?.textContent,
      "the product name is missing",
    ).toBe("Red Shoe");
    expect(
      container.querySelector(".product-info-section")?.className,
      "an English page should pad the info from the left",
    ).toContain("pl-[10px]");
  });

  it("draws a photo placeholder when the product has no photo, right to left in Arabic", async () => {
    const { container } = await renderWithProviders(
      <ProductLoader product={{ name: "Shoe" }} />,
      { language: "ar" },
    );
    expect(
      container.querySelector('img[alt="Shoe"]'),
      "a product with no photo must not show a broken image",
    ).toBeNull();
    expect(
      container.querySelector('[data-pw="productName_productPage"]')?.className,
      "the name should be marked RTL in Arabic",
    ).toContain("dir-rtl");
  });
});
