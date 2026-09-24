// The product name line: name | categories | chosen colour, under the brand logo.
import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import ProductNameAndBrand from "components/Server/product/ProductNameAndBrand";

const product = {
  name: "Shoe",
  categories: [{ name: "Men" }],
  brand: { icon: "b.png", name: "Nike", is_verified: 1 },
  sync_color_images: [{ color_option: "red", color_name: "Red" }],
};

describe("the product name and brand", () => {
  it("adds the chosen colour's name, shows the brand and its verified badge", async () => {
    const { container } = render(
      await ProductNameAndBrand({ globalPromise: Promise.resolve(product), isRtl: false, color: "red" }),
    );
    expect(
      container.querySelector('[data-pw="productName_productPage"]')?.textContent,
      "the line should read name | category | colour",
    ).toBe("Shoe | Men | Red");
    expect(container.querySelector('img[alt="Nike"]'), "the brand logo is missing").not.toBeNull();
    expect(container.querySelector('img[src="/icons/VerifiedIcon.svg"]'), "a verified brand should show its badge").not.toBeNull();
  });

  it("leaves out a colour it does not know, and draws RTL without brand extras", async () => {
    const { container } = render(
      await ProductNameAndBrand({ globalPromise: Promise.resolve({ ...product, brand: {} }), isRtl: true, color: "green" }),
    );
    const name = container.querySelector('[data-pw="productName_productPage"]');
    expect(name?.textContent, "an unknown colour must not be added").toBe("Shoe | Men");
    expect(name?.className, "the name should be marked RTL").toContain("dir-rtl");
    expect(container.querySelector("img"), "no brand icon or badge should show").toBeNull();
  });

  it("shows only the name and categories when no colour is chosen", async () => {
    const { container } = render(
      await ProductNameAndBrand({ globalPromise: Promise.resolve(product), isRtl: false, color: null }),
    );
    expect(container.textContent, "no colour should be added").toBe("Shoe | Men");
  });
});
