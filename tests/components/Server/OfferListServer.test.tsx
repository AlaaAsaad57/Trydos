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

import OfferListServer from "components/Server/OfferListServer";

import { renderWithProviders, screen } from "../../render";


describe("the boutique offers list", () => {
  it("draws each boutique, puts the recommendations after the second one, and pages on from searchAfter", async () => {
    await renderWithProviders(
      <OfferListServer
        boutiquesData={{ boutiques: [{ slug: "a" }, { slug: "b" }, { slug: "c" }], searchAfter: [9] }}
        params={{ lang: "sy-en" }}
        mainCategory="men"
      >
        <div>recommended</div>
      </OfferListServer>,
    );
    const texts = Array.from(document.querySelector('[data-pw="boutiques"]')!.children).map((n) => n.textContent);
    expect(texts, "the recommendations should sit right after the second boutique").toEqual(["a", "b", "recommended", "c"]);
    expect(infiniteScroll, "the next page should start from searchAfter, in the same category").toHaveBeenCalledWith(
      expect.objectContaining({ offsetVariable: [9], mainCategory: "men" }),
    );
  });
});
