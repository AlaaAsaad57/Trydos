// The whole-page loaders shown while a route streams in, and the smaller
// section loaders they are built from.
import { describe, expect, it } from "vitest";

import ChangeOrderItemSkeleton from "components/skeleton/loaders/ChangeOrderItemSkeleton";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import OrderDetailsSkeleton from "components/skeleton/loaders/OrderDetailsSkeleton";

import { renderWithProviders } from "../../../render";

describe("the page loaders", () => {
  it("the full home loader draws the new home's header (Stage 7)", async () => {
    const { container } = await renderWithProviders(<FullHomeLoader />);
    expect(
      container.querySelector('[data-pw="home-loader-header"]'),
      "the full home loader lost the new home's header placeholder",
    ).not.toBeNull();
  });

  it("the full home loader draws the stories row as four 121 x 170 cards", async () => {
    const { container } = await renderWithProviders(<FullHomeLoader />);
    const card = container.querySelector('[data-pw="home-loader-stories"] .skeleton-base') as HTMLElement;
    expect(
      [card?.style.width, card?.style.height],
      "the stories placeholder is not the new home's 121 x 170 story card",
    ).toEqual(["121px", "170px"]);
  });

  it("the full home loader draws the Brand Stores cards, 140 px tall", async () => {
    const { container } = await renderWithProviders(<FullHomeLoader />);
    const card = container.querySelector('[data-pw="home-loader-cards"] .skeleton-base') as HTMLElement;
    expect(card?.style.height, "the brand card placeholder is not 140 px tall").toBe("140px");
  });

  it("the listing loader draws for a boutique and for a search", async () => {
    const { container } = await renderWithProviders(
      <FilterLoader boutique={{ name: "Search" }} isForSearch />,
    );
    expect(container.firstElementChild, "the listing loader drew nothing for a search").not.toBeNull();
    const second = await renderWithProviders(<FilterLoader boutique={{ name: "Nike" }} />);
    expect(second.container.firstElementChild, "the listing loader drew nothing for a boutique").not.toBeNull();
  });

  it("the featured products loader draws product cards", async () => {
    const { container } = await renderWithProviders(<FeaturedProductsSkeleton />);
    expect(container.innerHTML, "the featured products loader drew nothing").not.toBe("");
  });

  it("the compare loader draws", async () => {
    const { container } = await renderWithProviders(<CompareSkeleton />);
    expect(container.innerHTML, "the compare loader drew nothing").not.toBe("");
  });

  it("the order details loader draws", async () => {
    const { container } = await renderWithProviders(<OrderDetailsSkeleton />);
    expect(container.innerHTML, "the order details loader drew nothing").not.toBe("");
  });

  it("the change-order-item loader draws", async () => {
    const { container } = await renderWithProviders(<ChangeOrderItemSkeleton />);
    expect(container.innerHTML, "the change-order-item loader drew nothing").not.toBe("");
  });
});
