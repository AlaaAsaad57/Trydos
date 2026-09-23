// One boutique on the home page: its banners link to the boutique listing, and
// the strip under them holds one tile per category — some tiles go to a
// product, others to the boutique's category listing.
import { beforeAll, describe, expect, it, vi } from "vitest";

import BoutiqueWrapper from "components/ServerWrapper/BoutiqueWrapper";

import { renderWithProviders } from "../../render";

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", NoopObserver);
  vi.stubGlobal("ResizeObserver", NoopObserver);
});

const boutique = {
  slug: "nike",
  name: "Nike",
  description: "Shoes",
  banners: [{ file_path: "/upload/banner.png" }],
  mainCategoriesForProductIds: [
    {
      slug: "red-shoe",
      is_product_url: true,
      most_views: true,
      most_viewed_product_name: "Red Shoe",
      most_viewed_product_thumbnail: "/upload/red.png",
    },
    { slug: "socks", is_product_url: false },
  ],
};

describe("a boutique on the home page", () => {
  it("links the banners to the boutique and each category tile to its own place", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueWrapper boutique={boutique} lang="sy-en" />,
    );
    expect(
      container.querySelector('[data-pw="boutique_link"]')?.getAttribute("href"),
      "the banners should link to the boutique listing",
    ).toBe("/sy-en/filters/boutiques/nike");
    expect(
      container.querySelectorAll('[data-pw="boutique-banner"]').length,
      "each banner should be drawn",
    ).toBe(1);
    expect(
      container.querySelector('[data-pw="boutique_product_link"]')?.getAttribute("href"),
      "a product tile should link to the product",
    ).toBe("/sy-en/products/red-shoe");
    expect(
      container.querySelector('[data-pw="boutique_category_link"]')?.getAttribute("href"),
      "a category tile should link to the boutique's category listing",
    ).toBe("/sy-en/filters/boutiques/nike/categories/socks");
    expect(
      container.querySelector('img[src="/icons/TrendingViews.svg"]'),
      "the most-viewed tile should carry the trending badge",
    ).not.toBeNull();
    expect(
      container.querySelector('img[alt="Red Shoe"]')?.getAttribute("src"),
      "the product thumbnail should be resized for the tile",
    ).toContain("/upload/h_200,w_200,c_fit");
  });

  it("marks the category strip RTL in Arabic", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueWrapper boutique={boutique} lang="sy-ar" />,
      { language: "ar" },
    );
    expect(
      container.querySelector('[id="boutique-nike-slider dir-rtl"]'),
      "the category strip should be marked RTL in Arabic",
    ).not.toBeNull();
  });
});
