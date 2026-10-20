import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../render";
import CommentProductInfo, {
  resolveProductVariantDetails,
} from "components/SellerDashboard/CommentProductInfo";

describe("resolveProductVariantDetails", () => {
  const sampleProduct = {
    id: 101,
    name: "Classic Silk Shirt",
    slug: "classic-silk-shirt",
    thumbnail: "/uploads/shirt-thumb.jpg",
    images: ["/uploads/shirt-main.jpg"],
    colors: [
      { name: "Crimson Red", code: "#DC143C", option: "Crimson Red" },
      { name: "Navy Blue", code: "#000080", option: "Navy Blue" },
    ],
    sizes: ["S", "M", "L", "XL"],
    sync_color_images: [
      {
        color_name: "Crimson Red",
        color_option: "Crimson Red",
        color_code: "#DC143C",
        images: ["/uploads/crimson-shirt.jpg"],
      },
      {
        color_name: "Navy Blue",
        color_option: "Navy Blue",
        color_code: "#000080",
        images: ["/uploads/navy-shirt.jpg"],
      },
    ],
    variations: [
      {
        id: "v1",
        size: "M",
        color: { name: "Crimson Red", code: "#DC143C" },
        type: "Crimson Red-M",
        sku: "SHIRT-RED-M",
      },
      {
        id: "v2",
        size: "XL",
        color: { name: "Navy Blue", code: "#000080" },
        type: "Navy Blue-XL",
        sku: "SHIRT-BLUE-XL",
      },
    ],
  };

  it("resolves exact variation match by type and returns color image, color, and size", () => {
    const res = resolveProductVariantDetails({
      product: sampleProduct,
      variantString: "Crimson Red-M",
      productId: "101",
      language: "en",
    });

    expect(res.productName).toBe("Classic Silk Shirt");
    expect(res.colorName).toBe("Crimson Red");
    expect(res.colorCode).toBe("#DC143C");
    expect(res.sizeName).toBe("M");
    expect(res.imageUrl).toContain("crimson-shirt.jpg");
    expect(res.hasVariant).toBe(true);
    expect(res.productSlug).toBe("classic-silk-shirt");
  });

  it("matches color from sync_color_images and size from sizes when variation type is not exact", () => {
    const res = resolveProductVariantDetails({
      product: sampleProduct,
      variantString: "Navy Blue / XL",
      productId: "101",
      language: "en",
    });

    expect(res.colorName).toBe("Navy Blue");
    expect(res.colorCode).toBe("#000080");
    expect(res.sizeName).toBe("XL");
    expect(res.imageUrl).toContain("navy-shirt.jpg");
  });

  it("falls back to product thumbnail when variant color has no image", () => {
    const productWithoutColorImages = {
      ...sampleProduct,
      sync_color_images: [],
    };
    const res = resolveProductVariantDetails({
      product: productWithoutColorImages,
      variantString: "Crimson Red-M",
      productId: "101",
      language: "en",
    });

    expect(res.imageUrl).toContain("shirt-thumb.jpg");
  });

  it("falls back to first product image when thumbnail is missing", () => {
    const productWithoutThumb = {
      ...sampleProduct,
      thumbnail: null,
      sync_color_images: [],
    };
    const res = resolveProductVariantDetails({
      product: productWithoutThumb,
      variantString: "Crimson Red-M",
      productId: "101",
      language: "en",
    });

    expect(res.imageUrl).toContain("shirt-main.jpg");
  });

  it("handles comments with no variant gracefully with fallbacks", () => {
    const res = resolveProductVariantDetails({
      product: sampleProduct,
      variantString: "",
      productId: "101",
      language: "en",
    });

    expect(res.hasVariant).toBe(false);
    expect(res.displayVariant).toBe("Standard");
    expect(res.colorName).toBeNull();
    expect(res.sizeName).toBeNull();
    // Uses fallback thumbnail
    expect(res.imageUrl).toContain("shirt-thumb.jpg");
  });

  it("handles missing/null product data gracefully", () => {
    const res = resolveProductVariantDetails({
      product: null,
      variantString: "Red-L",
      productId: "999",
      language: "en",
    });

    expect(res.productName).toBe("Product #999");
    expect(res.displayVariant).toBe("Red-L");
    expect(res.hasVariant).toBe(true);
    expect(res.imageUrl).toBeNull();
  });
});

describe("CommentProductInfo component", () => {
  const mockProduct = {
    id: 42,
    name: "Running Sneakers",
    slug: "running-sneakers",
    thumbnail: "/uploads/sneakers.jpg",
    colors: [{ name: "Red", code: "#FF0000" }],
    sizes: ["42"],
    sync_color_images: [
      {
        color_name: "Red",
        color_code: "#FF0000",
        images: ["/uploads/sneakers-red.jpg"],
      },
    ],
  };

  it("renders a skeleton loader when loading", () => {
    const { container } = render(
      <CommentProductInfo
        productId="42"
        loading={true}
        language="en"
      />,
    );

    expect(
      container.querySelector('[data-pw="comment-product-skeleton"]'),
    ).toBeTruthy();
  });

  it("renders product name, color badge with swatch, and size badge", () => {
    render(
      <CommentProductInfo
        productId="42"
        variant="Red - 42"
        product={mockProduct}
        language="en"
      />,
    );

    expect(screen.getByText("Running Sneakers")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("sneakers-red.jpg"));
  });

  it("renders external product link when product slug is present", () => {
    render(
      <CommentProductInfo
        productId="42"
        variant="Red - 42"
        product={mockProduct}
        language="en"
      />,
    );

    // The link has no locale on purpose: the proxy adds the shopper's locale
    // (sy-en, iq-ar, …) on the way in. The route is /products, not /product.
    const link = screen.getByRole("link", { name: "Running Sneakers" });
    expect(link, "the product link does not point at the products route").toHaveAttribute(
      "href",
      "/products/running-sneakers",
    );
  });

  it("shows the no-variant pill and the link title in Arabic", async () => {
    // translateFunction reads the language from the URL. The other cases here
    // render at "/", so the Arabic URL is put back when this case ends.
    try {
      const { container } = await renderWithProviders(
        <CommentProductInfo productId="42" variant="" product={mockProduct} language="ar" />,
        { language: "ar" },
      );

      expect(screen.queryByText("قياسي"), "the 'Standard' pill was not translated to Arabic").toBeInTheDocument();
      expect(
        container.querySelector('[data-pw="comment-product-link"]')?.getAttribute("title"),
        "the 'View product' link title was not translated to Arabic",
      ).toBe("عرض المنتج");
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("renders fallback pill when comment has no variant", () => {
    render(
      <CommentProductInfo
        productId="42"
        variant=""
        product={mockProduct}
        language="en"
      />,
    );

    expect(screen.getByText("Running Sneakers")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("switches to fallback icon when image triggers onError", () => {
    const { container } = render(
      <CommentProductInfo
        productId="42"
        variant="Red"
        product={mockProduct}
        language="en"
      />,
    );

    const img = screen.getByRole("img");
    fireEvent.error(img);

    expect(container.querySelector('[data-pw="comment-product-fallback-icon"]')).toBeTruthy();
  });
});
