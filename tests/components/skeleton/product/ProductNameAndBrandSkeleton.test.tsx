import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import ProductNameAndBrandSkeleton from "components/skeleton/product/ProductNameAndBrandSkeleton";

describe("the product name and brand placeholder", () => {
  it("lays out left to right in a left-to-right language", () => {
    const { container } = render(<ProductNameAndBrandSkeleton isRtl={false} />);
    expect(
      container.querySelector(".product-brand-logo")?.className,
      "the brand row should run left to right when the page is not RTL",
    ).toContain("flex-row");
    expect(
      container.querySelector(".product-brand-logo")?.className,
      "the brand row must not be reversed when the page is not RTL",
    ).not.toContain("flex-row-reverse");
  });

  it("reverses the rows and marks the name RTL in a right-to-left language", () => {
    const { container } = render(<ProductNameAndBrandSkeleton isRtl />);
    expect(
      container.querySelector(".product-text-section")?.className,
      "the name row should be reversed on an RTL page",
    ).toContain("flex-row-reverse");
    expect(
      container.querySelector('[data-pw="productName_productPage"]')?.className,
      "the product name should carry the RTL class on an RTL page",
    ).toContain("dir-rtl");
  });
});
