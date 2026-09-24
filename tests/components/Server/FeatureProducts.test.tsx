// The two product rows on the home page — featured and flash deals — and the
// boutique offers list under them. The rows draw nothing when empty, and add a
// "Show More" tile only when there are more than eight products.
import { describe, expect, it, vi } from "vitest";

const productCard = vi.fn();
const boutiqueWrapper = vi.fn();
const infiniteScroll = vi.fn();

vi.mock("components/products/ProductCard", () => ({
  default: (props: any) => {
    productCard(props);
    return <div data-pw="card" />;
  },
}));
vi.mock("components/ServerWrapper/BoutiqueWrapper", () => ({
  default: (props: any) => {
    boutiqueWrapper(props);
    return <div data-pw="boutique">{props.boutique.slug}</div>;
  },
}));
vi.mock("components/global/InfinteScroll", () => ({
  default: (props: any) => {
    infiniteScroll(props);
    return null;
  },
}));
vi.mock("utils/server", () => ({ translateFunction: (key: string) => key }));

import FeatureProducts from "components/Server/FeatureProducts";

import { renderWithProviders, screen } from "../../render";

const products = (n: number) =>
  Array.from({ length: n }, (_, i) => (i % 2 ? { id: i } : { product_id: i }));

describe("the featured row", () => {
  it("draws nothing when there are no featured products", async () => {
    const { container } = await renderWithProviders(
      <FeatureProducts lang="sy-en" currencyData={null} fetauredProductsData={{ data: { products: [] } }} />,
    );
    expect(container.innerHTML, "an empty featured row should draw nothing").toBe("");
  });

  it("draws the cards and a Show More tile when there are more than eight, right to left in Arabic", async () => {
    const { container } = await renderWithProviders(
      <FeatureProducts lang="sy-ar" currencyData={{ symbol: "$" }} fetauredProductsData={{ data: { products: products(9) } }} />,
      { language: "ar" },
    );
    expect(screen.getByText("Featured Products"), "the row title is missing").toBeInTheDocument();
    expect(screen.getByText("Show More"), "more than eight products should add a Show More tile").toBeInTheDocument();
    expect(
      (container.firstElementChild as HTMLElement).style.direction,
      "the row should run right to left in Arabic",
    ).toBe("rtl");
  });

  it("has no Show More tile with eight products or fewer, left to right in English", async () => {
    const { container } = await renderWithProviders(
      <FeatureProducts lang="sy-en" currencyData={null} fetauredProductsData={{ data: { products: products(2) } }} />,
    );
    expect(screen.queryByText("Show More"), "a short row must not offer Show More").toBeNull();
    expect((container.firstElementChild as HTMLElement).style.direction, "the row should run left to right in English").toBe("ltr");
  });
});
