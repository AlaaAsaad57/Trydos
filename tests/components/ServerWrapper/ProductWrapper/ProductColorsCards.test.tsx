// The "all colours" grid of a product: one card per colour, each linking to
// that colour's page, each with its own Buy button that puts THAT colour first.
import { describe, expect, it, vi } from "vitest";

import ProductColorsCards from "components/ServerWrapper/ProductWrapper/ProductColorsCards";

import { renderWithProviders, userEvent } from "../../../render";

const currency = { exchange_rate: 1, decimal_digits: 2, symbol: "$" };

const product = (over: Record<string, any> = {}) => ({
  id: 11,
  name: "Shoe",
  price: 20,
  offer_price: 10,
  categories: [{ name: "Men" }, { name: null }],
  brand: { icon: "brand.png", name: "Nike", is_verified: 1 },
  label_names: ["New"],
  sync_color_images: [
    { color_name: "red", images: ["/upload/red.png"] },
    { color_name: "blue", images: ["/upload/blue.png"] },
  ],
  ...over,
});

describe("the product colours grid", () => {
  it("draws one card per colour with the brand, the name and categories", async () => {
    const { container } = await renderWithProviders(
      <ProductColorsCards
        InitialProductData={product()}
        language="en"
        country="gb"
        slug="shoe"
        currency={currency}
        shouldShowOrangeBorder={() => true}
      />,
    );
    const links = container.querySelectorAll('[data-pw="product_link"]');
    expect(links.length, "each colour should get its own card").toBe(2);
    expect(
      links[0].getAttribute("href"),
      "the red card should link to the red colour",
    ).toContain("red");
    expect(
      container.querySelector('img[alt="Nike"]'),
      "the brand logo is missing",
    ).not.toBeNull();
    expect(
      container.querySelector('img[src="/icons/VerifiedIcon.svg"]'),
      "a verified brand should show its badge",
    ).not.toBeNull();
    expect(
      container.querySelector('[data-pw="product-name"]')?.textContent,
      "the name line should list the product and its named categories",
    ).toBe("Shoe | Men");
    expect(
      (container.querySelector('img[alt="Shoe"]') as HTMLElement).style.border,
      "the orange border should show when asked for",
    ).toContain("rgb(255, 98, 0)");
  });

  it("in Arabic, with no brand icon and no offer, draws the placeholder logo", async () => {
    const { container } = await renderWithProviders(
      <ProductColorsCards
        InitialProductData={product({
          brand: {},
          offer_price: 20,
          is_luck: 1,
          label_names: [],
        })}
        language="ar"
        country="gb"
        slug="shoe"
        currency={currency}
        shouldShowOrangeBorder={() => false}
      />,
      { language: "ar" },
    );
    expect(
      container.querySelector(".bg-gray-200.rounded-sm"),
      "a brand with no icon should get a placeholder",
    ).not.toBeNull();
    expect(
      (container.querySelector('img[alt="Shoe"]') as HTMLElement).style.border,
      "the plain grey border should show when orange is not asked for",
    ).toContain("rgb(211, 211, 211)");
    expect(
      container.querySelector('[data-pw="product-name"]')?.className,
      "the name should be marked RTL in Arabic",
    ).toContain("dir-rtl");
  });

  it("the Buy button of a colour puts that colour first", async () => {
    const setSelectedProductForCart = vi.fn();
    const { container } = await renderWithProviders(
      <ProductColorsCards
        InitialProductData={product({
          sync_color_images: [
            { images: ["/upload/x.png"] },
            { color_name: "blue", images: ["/upload/blue.png"] },
          ],
        })}
        language="en"
        country="gb"
        slug="shoe"
        currency={currency}
        shouldShowOrangeBorder={() => false}
      />,
      { store: { setSelectedProductForCart } },
    );
    await userEvent.click(
      container.querySelectorAll('[data-pw="buy-button"]')[1] as HTMLElement,
    );
    expect(
      setSelectedProductForCart.mock.calls[0][0].sync_color_images[0]
        .color_name,
      "the blue card's Buy should put blue first",
    ).toBe("blue");
  });
});
