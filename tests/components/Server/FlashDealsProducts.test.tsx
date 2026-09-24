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

import FlashDealsProducts from "components/Server/FlashDealsProducts";

import { renderWithProviders, screen } from "../../render";

const products = (n: number) =>
  Array.from({ length: n }, (_, i) => (i % 2 ? { id: i } : { product_id: i }));

describe("the flash-deals row", () => {
  it("draws nothing when there are no deals", async () => {
    const { container } = await renderWithProviders(
      <FlashDealsProducts lang="sy-en" currencyData={null} flashDealsProducts={{ data: { products: [] } }} />,
    );
    expect(container.innerHTML, "an empty flash-deals row should draw nothing").toBe("");
  });

  it("draws the cards and a Show More tile when there are more than eight, right to left in Kurdish", async () => {
    const { container } = await renderWithProviders(
      <FlashDealsProducts lang="sy-ku" currencyData={null} flashDealsProducts={{ data: { products: products(9) } }} />,
    );
    expect(screen.getByText("Flash Deals"), "the row title is missing").toBeInTheDocument();
    expect(screen.getByText("Show More"), "more than eight deals should add a Show More tile").toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).style.direction, "the row should run right to left in Kurdish").toBe("rtl");
  });

  it("has no Show More tile with eight deals or fewer", async () => {
    await renderWithProviders(
      <FlashDealsProducts lang="sy-en" currencyData={null} flashDealsProducts={{ data: { products: products(1) } }} />,
    );
    expect(screen.queryByText("Show More"), "a short row must not offer Show More").toBeNull();
  });
});
