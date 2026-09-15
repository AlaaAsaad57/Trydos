// A single chip in the filter window: a brand, a colour or a size.
//
// The chip itself does not handle taps — the row above it does, by reading the
// value off the element. So the value the chip writes into its own markup is the
// whole contract between the two. A chip whose value is wrong looks perfectly
// normal and filters by the wrong thing.
import { describe, expect, it } from "vitest";

import ImageCircel from "components/ListingPage/filterComponents/FiltersWindow/ImageCircel";

import { renderWithProviders, screen } from "../../../../render";

const theChip = () => document.querySelector("[data-filter-value]");
const chipValue = () => theChip()?.getAttribute("data-filter-value");
const isMarkedChosen = () =>
  Boolean(document.querySelector('img[src="/icons/ActiveCategoryIcon.svg"]'));

describe("a chip in the filter window", () => {
  describe("the value it hands the row above it", () => {
    it("carries the brand's slug", async () => {
      await renderWithProviders(
        <ImageCircel
          term="Category"
          name="Nike"
          value="nike"
          image="nike.png"
          isActive={false}
        />,
        { path: "/filters" },
      );

      expect(
        chipValue(),
        "the row reads this attribute to know what was tapped; a chip that carries the wrong value filters by something the shopper did not choose",
      ).toBe("nike");
    });

    it("carries a colour without its hash", async () => {
      await renderWithProviders(
        <ImageCircel
          term="Color"
          name="#ff0000"
          value="#ff0000"
          color="#ff0000"
          isActive={false}
        />,
        { path: "/filters" },
      );

      expect(
        chipValue(),
        "colours are stored with a hash and travel in the path without one; the chip has to hand over the path form, or the same colour is held twice in two spellings",
      ).toBe("ff0000");
    });
  });

  describe("what the shopper sees", () => {
    it("names a brand under its logo", async () => {
      await renderWithProviders(
        <ImageCircel
          term="Category"
          name="Nike"
          value="nike"
          image="nike.png"
          isActive={false}
        />,
        { path: "/filters" },
      );

      expect(
        screen.getByText("Nike"),
        "a logo alone is not always recognisable, and a chip that cannot be identified cannot be chosen on purpose",
      ).toBeInTheDocument();
    });

    it("writes a size inside the circle, since there is no picture of one", async () => {
      await renderWithProviders(
        <ImageCircel term="Size" name="XL" value="XL" isActive={false} />,
        { path: "/filters" },
      );

      expect(
        screen.getAllByText("XL").length,
        "a size has neither an image nor a colour to fill the circle, so without the text the circle is blank",
      ).toBeGreaterThan(1);
    });

    it("fills a colour chip with the colour rather than its name", async () => {
      await renderWithProviders(
        <ImageCircel
          term="Color"
          name="#ff0000"
          value="#ff0000"
          color="#ff0000"
          isActive={false}
        />,
        { path: "/filters" },
      );

      expect(
        (theChip() as HTMLElement)?.style.backgroundColor,
        "a hex code is not something a shopper picks a colour by — the filled circle is the only usable label a colour chip has",
      ).toBe("rgb(255, 0, 0)");
    });
  });

  describe("showing that it is chosen", () => {
    it("marks a chip that is part of the staged selection", async () => {
      await renderWithProviders(
        <ImageCircel term="Category" name="Nike" value="nike" image="nike.png" isActive />,
        { path: "/filters" },
      );

      expect(
        isMarkedChosen(),
        "the staged selection exists only in the window; the tick is the shopper's only way to see what they have already tapped",
      ).toBe(true);
    });

    it("leaves an unchosen chip unmarked", async () => {
      await renderWithProviders(
        <ImageCircel
          term="Category"
          name="Nike"
          value="nike"
          image="nike.png"
          isActive={false}
        />,
        { path: "/filters" },
      );

      expect(
        isMarkedChosen(),
        "a tick on an unchosen chip would have the shopper press Search expecting a filter they never staged",
      ).toBe(false);
    });
  });
});
