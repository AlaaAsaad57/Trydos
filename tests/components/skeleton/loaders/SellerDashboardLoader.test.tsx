// The seller-dashboard placeholders (AC-8, AC-17, AC-18).
//
// Three properties, and each is one a reviewer would otherwise have to take on
// trust by reading the JSX:
//
//   AC-8   every section shape draws placeholder blocks, and none of them falls
//          back to the old spinner;
//   AC-17  the shapes are hidden from assistive technology, and the region they
//          sit in reports that it is busy — replacing the "Loading products..."
//          labels must not silently drop the announcement;
//   AC-18  every shape is built from the ONE shared block, so the dashboard
//          cannot drift into several near-identical greys.
import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import SellerDashboardLoader, {
  BoutiqueGridSkeleton,
  DashSkeletonBlock,
  FormSkeleton,
  InlineSkeleton,
  ListRowsSkeleton,
  ProductGridSkeleton,
  TileGridSkeleton,
} from "components/skeleton/loaders/SellerDashboardLoader";

/** Every shape the dashboard can show, by the name it is known by in the plan. */
const SHAPES = [
  ["the products grid", <ProductGridSkeleton key="p" />, "dash-skeleton-product-grid"],
  ["the boutiques grid", <BoutiqueGridSkeleton key="b" />, "dash-skeleton-boutique-grid"],
  ["a list of rows", <ListRowsSkeleton key="l" />, "dash-skeleton-list-rows"],
  ["a grid of tiles", <TileGridSkeleton key="t" />, "dash-skeleton-tile-grid"],
  ["a form", <FormSkeleton key="f" />, "dash-skeleton-form"],
  ["the inline wait", <InlineSkeleton key="i" />, "dash-skeleton-inline"],
] as const;

const blocks = (root: HTMLElement) =>
  root.querySelectorAll('[data-pw="dash-skeleton-block"]');

describe("the seller-dashboard placeholder shapes", () => {
  describe.each(SHAPES)("%s", (name, element, testId) => {
    it("draws placeholder blocks and no spinner (AC-8)", () => {
      const { container } = render(element);

      expect(
        blocks(container).length,
        `${name} drew no placeholder blocks, so the section would show an empty area while it loads`,
      ).toBeGreaterThan(0);

      expect(
        container.querySelectorAll(".spin-cont").length,
        `${name} still renders the old spinner; the whole point of this change is that the dashboard shows the shape of the content instead`,
      ).toBe(0);
    });

    it("is hidden from assistive technology, inside a region that reports busy (AC-17)", () => {
      const { container } = render(element);

      const region = container.querySelector(`[data-pw="${testId}"]`);
      expect(
        region,
        `${name} did not render its region, so there is nothing for a screen reader to be told about`,
      ).not.toBeNull();

      expect(
        region?.getAttribute("aria-busy"),
        `${name} does not report aria-busy, so removing the "Loading..." label leaves a screen-reader user with no sign that anything is happening`,
      ).toBe("true");

      const hidden = container.querySelector('[aria-hidden="true"]');
      expect(
        hidden,
        `${name} does not hide its shapes with aria-hidden, so a screen reader would read the placeholder out as if it were content`,
      ).not.toBeNull();

      expect(
        hidden?.contains(blocks(container)[0] as Node),
        `${name} has an aria-hidden element, but the placeholder blocks are not inside it`,
      ).toBe(true);
    });

    it("is built from the one shared placeholder block (AC-18)", () => {
      const { container: shared } = render(<DashSkeletonBlock />);
      const sharedClasses = (shared.firstElementChild?.className ?? "")
        .split(/\s+/)
        .filter(Boolean);

      const { container } = render(element);
      const first = blocks(container)[0] as HTMLElement | undefined;

      expect(
        first,
        `${name} has no block carrying the shared block's marker, so it was built from its own private div and the dashboard will drift into two greys`,
      ).not.toBeUndefined();

      for (const className of sharedClasses) {
        expect(
          first?.classList.contains(className),
          `${name}'s placeholder is missing "${className}" from the shared block, so it will not pulse the same way as the rest of the dashboard`,
        ).toBe(true);
      }
    });
  });

  it("the whole-dashboard shape keeps the page tall (AC-8)", () => {
    render(<SellerDashboardLoader />);

    const region = document.querySelector('[data-pw="seller-dashboard-loader"]');

    expect(
      region,
      "the in-flow dashboard loader did not render, so the back journey would fall through to the generic spinner",
    ).not.toBeNull();

    expect(
      region?.querySelector('[data-pw="dash-skeleton-product-grid"]'),
      "the in-flow dashboard loader does not include the product grid, so the document collapses to about half a screen while the real page is hidden — which is what loses the scroll position",
    ).not.toBeNull();
  });
});
