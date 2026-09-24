// The small loading placeholders. Each one stands in for a real widget while
// that widget's code downloads, so the only things that can go wrong are: it
// does not draw, or it draws the wrong shape for the props it was given.
import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import AddStorySkeleton from "components/skeleton/AddStorySkeleton";
import IconSkeleton from "components/skeleton/IconSkeleton";
import MobileNavigationSkeleton from "components/skeleton/MobileNavigation";
import OfferListSkeleton from "components/skeleton/OfferList";
import ShareSectionSkeleton from "components/skeleton/ShareSectionSkeleton";
import StoryViewerSkeleton from "components/skeleton/StoryViewerSkeleton";
import NotificationSkeleton from "components/skeleton/NotificationSkeleton";
import OrdersPageSkeleton from "components/skeleton/OrdersPageSkeleton";

describe("the small loading placeholders", () => {
  it("the add-story placeholder draws its full-screen frame", () => {
    const { container } = render(<AddStorySkeleton />);
    expect(
      container.querySelector('[data-pw="add-story-skeleton"]'),
      "the add-story placeholder did not draw its frame",
    ).not.toBeNull();
  });

  it("the icon placeholder takes the size it is given, and 24px when none is given", () => {
    const { container, rerender } = render(<IconSkeleton />);
    const icon = () => container.firstElementChild as HTMLElement;
    expect(icon().style.width, "the default icon size should be 24px").toBe("24px");
    rerender(<IconSkeleton size={40} />);
    expect(icon().style.height, "a 40px icon placeholder should be 40px tall").toBe("40px");
  });

  it("the category bar placeholder draws a row of category links", () => {
    const { container } = render(<MobileNavigationSkeleton />);
    expect(
      container.querySelectorAll('[data-pw="category-Link"]').length,
      "the category bar placeholder drew no category links",
    ).toBeGreaterThan(0);
  });

  it("the offer list placeholder draws inside the boutiques list", () => {
    const { container } = render(<OfferListSkeleton />);
    expect(
      container.querySelector('[data-pw="boutiques"]')?.children.length,
      "the offer list placeholder drew no offer cards",
    ).toBeGreaterThan(0);
  });

  it("the share placeholder draws share tiles", () => {
    const { container } = render(<ShareSectionSkeleton />);
    expect(
      container.querySelectorAll(".share-avatar").length,
      "the share placeholder drew no share tiles",
    ).toBeGreaterThan(0);
  });

  it("the story viewer placeholder draws its frame", () => {
    const { container } = render(<StoryViewerSkeleton />);
    expect(
      container.querySelector('[data-pw="story-viewer-skeleton"]'),
      "the story viewer placeholder did not draw",
    ).not.toBeNull();
  });

  it("the notification placeholder draws the notification panel", () => {
    const { container } = render(<NotificationSkeleton />);
    expect(
      container.querySelector('[data-pw="notification-container"]'),
      "the notification placeholder did not draw its panel",
    ).not.toBeNull();
  });

  it("the orders page placeholder shows the delivery address title", () => {
    const { getByText } = render(<OrdersPageSkeleton />);
    expect(
      getByText("Bag Shipping & Delivery Address"),
      "the orders page placeholder lost its title",
    ).toBeInTheDocument();
  });
});
