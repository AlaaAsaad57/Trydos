import { describe, expect, it } from "vitest";
import {
  LISTING_PRODUCTS,
  placeSwatches,
  type PlacedSwatch,
} from "components/DemoApp/demoStores";
import { darkDot } from "components/DemoApp1/screens/ListingParts";

/** The dot of colour `index`, or undefined when that colour has no dot. */
const dotOf = (dots: PlacedSwatch[], index: number) => dots.find((d) => d.index === index);

describe("store page — the colour dots (placeSwatches)", () => {
  it("draws the pajama's seven dots where `Home Page – 47` draws them", () => {
    const dots = placeSwatches(7, 3);
    const file = [
      { index: 0, d: 12, dx: -30 },
      { index: 1, d: 18, dx: -21 },
      { index: 2, d: 20, dx: -11 },
      { index: 3, d: 22, dx: 0 },
      { index: 4, d: 20, dx: 11 },
      { index: 5, d: 18, dx: 21 },
      { index: 6, d: 12, dx: 30 },
    ];
    for (const want of file) {
      const dot = dotOf(dots, want.index);
      expect(
        dot && { index: dot.index, d: dot.d, dx: dot.dx },
        `pajama colour ${want.index}: the file draws a ${want.d} px dot at ${want.dx} px from the card's middle`,
      ).toEqual(want);
    }
    expect(
      dotOf(dots, 3)?.on,
      "the pajama's middle colour (the one on show in the file) has no red line",
    ).toBe(true);
  });

  it("draws the shirt's two dots where `Home Page – 47` draws them", () => {
    const dots = placeSwatches(2, 0);
    expect(
      dotOf(dots, 0) && { d: dotOf(dots, 0)!.d, dx: dotOf(dots, 0)!.dx, on: dotOf(dots, 0)!.on },
      "the shirt's colour on show: the file draws a 22 px dot with the red line at -5 px",
    ).toEqual({ d: 22, dx: -5, on: true });
    expect(
      dotOf(dots, 1) && { d: dotOf(dots, 1)!.d, dx: dotOf(dots, 1)!.dx, on: dotOf(dots, 1)!.on },
      "the shirt's second colour: the file draws a 20 px dot at 6 px",
    ).toEqual({ d: 20, dx: 6, on: false });
  });

  it("draws the colour on show last, so it lies over its neighbours", () => {
    const dots = placeSwatches(7, 3);
    expect(dots.at(-1)?.index, "a dot is drawn over the colour on show").toBe(3);
    expect(
      dots.findIndex((d) => d.index === 2) > dots.findIndex((d) => d.index === 1),
      "the 20 px dot is drawn under the 18 px dot next to it (the file draws the nearer one on top)",
    ).toBe(true);
  });

  it("moves the big dot to the colour a swipe brings to the middle", () => {
    const dots = placeSwatches(7, 0);
    expect(dotOf(dots, 0)?.on, "colour 0 is on show but has no red line").toBe(true);
    expect(dotOf(dots, 0)?.d, "colour 0 is on show but its dot is not the 22 px one").toBe(22);
    expect(dotOf(dots, 3)?.d, "colour 3 is three away from the one on show but is not 12 px").toBe(12);
    expect(dotOf(dots, 4), "colour 4 is four away from the one on show but still has a dot").toBeUndefined();
  });
});

describe("store page — the dots under a colour's photos (darkDot)", () => {
  it("darkens the first dot for the first photo, as `Home Page – 54` draws it", () => {
    expect(darkDot(6, 0), "the first of six photos does not darken the first dot").toBe(0);
  });
  it("darkens the middle dot for a photo between the first and the last", () => {
    expect(darkDot(6, 3), "the 4th of six photos does not darken the middle dot").toBe(1);
  });
  it("darkens the last dot for the last photo", () => {
    expect(darkDot(6, 5), "the last of six photos does not darken the last dot").toBe(2);
  });
  it("gives each photo its own dot when there are three or fewer", () => {
    expect(darkDot(2, 1), "the 2nd of two photos does not darken the 2nd dot").toBe(1);
  });
});

describe("store page — the products' colours", () => {
  it("opens every card on the first photo of the colour on show", () => {
    for (const product of LISTING_PRODUCTS) {
      const color = product.colors[product.selected];
      expect(color, `${product.id}: the colour on show (${product.selected}) is not one of its colours`).toBeDefined();
      expect(
        product.image,
        `${product.id}: the card's photo is not the first photo of the colour on show`,
      ).toBe(color.images[0]);
    }
  });

  it("gives every colour a dot photo and at least one photo", () => {
    for (const product of LISTING_PRODUCTS) {
      for (const color of product.colors) {
        expect(color.swatch, `${product.id} ${color.name}: the colour has no dot photo`).toMatch(/\.webp$/);
        expect(color.images[0], `${product.id} ${color.name}: the colour has no photo`).toMatch(/\.webp$/);
      }
    }
  });

  it("keeps the file's shirt as `Home Page – 54` draws it: blue on show, then pink", () => {
    const shirt = LISTING_PRODUCTS.find((p) => p.id === "shirt-1");
    expect(shirt?.colors[0].name, "the file's shirt does not show blue first").toBe("blue");
    expect(shirt?.colors[1].name, "the file's shirt has no pink colour second").toBe("Pink");
    expect(shirt?.selected, "the file's shirt does not open on blue").toBe(0);
  });
});
