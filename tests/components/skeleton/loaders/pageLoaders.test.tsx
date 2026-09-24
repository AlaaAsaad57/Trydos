// The whole-page loaders shown while a route streams in, and the smaller
// section loaders they are built from.
import { describe, expect, it } from "vitest";

import BoutiqueSlidersSkeleton from "components/skeleton/loaders/BoutiqueSlidersSkeleton";
import ChangeOrderItemSkeleton from "components/skeleton/loaders/ChangeOrderItemSkeleton";
import CompareSkeleton from "components/skeleton/loaders/CompareSkeleton";
import FeaturedProductsSkeleton from "components/skeleton/loaders/FeaturedProductsSkeleton";
import FilterLoader from "components/skeleton/loaders/FilterLoader";
import FullHomeLoader from "components/skeleton/loaders/FullHomeLoader";
import HomeLoader from "components/skeleton/loaders/HomeLoader";
import OrderDetailsSkeleton from "components/skeleton/loaders/OrderDetailsSkeleton";

import { renderWithProviders } from "../../../render";

describe("the page loaders", () => {
  it("the home loader draws the featured rows and the offer list", async () => {
    const { container } = await renderWithProviders(<HomeLoader />);
    expect(
      container.querySelector('[data-pw="boutiques"]'),
      "the home loader lost its offer list placeholder",
    ).not.toBeNull();
  });

  it("the full home loader also draws the category bar", async () => {
    const { container } = await renderWithProviders(<FullHomeLoader />);
    expect(
      container.querySelector('[data-pw="categoryNavBar"]'),
      "the full home loader lost its category bar placeholder",
    ).not.toBeNull();
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

describe("the boutique banner loader", () => {
  it("shows the boutique's logo and one slide per banner when it has them", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueSlidersSkeleton
        boutique={{ name: "Nike", icon: "nike.png", banners: ["a.png", "b.png"] }}
      />,
    );
    expect(
      container.querySelector('img[alt="Nike"]'),
      "the boutique logo was not shown although the boutique has one",
    ).not.toBeNull();
    expect(
      container.querySelectorAll('[data-pw="image_offer_image"] img').length,
      "each banner should get its own slide",
    ).toBe(2);
    expect(
      container.querySelector('[data-pw="banners_length-1"]')?.className,
      "more than one banner should line the slides up from the start",
    ).toContain("justify-start");
  });

  it("shows a placeholder logo and one placeholder slide when the boutique has no banners", async () => {
    const { container } = await renderWithProviders(
      <BoutiqueSlidersSkeleton boutique={{ name: "Nike", banners: [] }} />,
    );
    expect(
      container.querySelector('img[alt="Nike"]'),
      "a boutique with no icon must not show a logo image",
    ).toBeNull();
    expect(
      container.querySelector(".image-offer.w-full"),
      "a boutique with no banners should show one placeholder slide",
    ).not.toBeNull();
  });
});
