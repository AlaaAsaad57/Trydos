// The five rating stars (components/settings/cards/RatingStars.tsx).
//
// A tap on a star sets the rating to that star and reports it, unless the
// stars are read-only. The stars are meant to show the rating: filled up to
// it, empty after it.
import { afterEach, describe, expect, it, vi } from "vitest";

import RatingStars from "components/settings/cards/RatingStars";
import { renderWithProviders, userEvent } from "../../../render";

afterEach(() => vi.clearAllMocks());

const starFills = () =>
  [...document.querySelectorAll("svg path")].map((p) => p.getAttribute("fill"));
const stars = () => document.querySelectorAll<HTMLElement>(".cursor-pointer.relative");

describe("the rating stars", () => {
  it("reports the tapped star as the new rating", async () => {
    const onRatingChange = vi.fn();
    await renderWithProviders(<RatingStars onRatingChange={onRatingChange} />);
    await userEvent.setup().click(stars()[2]);
    expect(onRatingChange, "tapping the third star did not report a rating of 3").toHaveBeenCalledWith(3);
  });

  it("ignores taps when read-only, and works with no change handler", async () => {
    const onRatingChange = vi.fn();
    const { unmount } = await renderWithProviders(
      <RatingStars readOnly initialRating={2} onRatingChange={onRatingChange} />,
    );
    await userEvent.setup().click(stars()[4]);
    expect(onRatingChange, "a read-only star reported a rating").not.toHaveBeenCalled();
    unmount();

    await renderWithProviders(<RatingStars color="#000" size={20} />);
    await userEvent.setup().click(stars()[0]);
    expect(stars().length, "the stars broke on a tap with no change handler").toBe(5);
  });

  it("fills the stars up to the rating, a half rating fills the next star, and 0 fills none", async () => {
    const three = await renderWithProviders(<RatingStars readOnly initialRating={3} />);
    expect(starFills(), "a rating of 3 does not fill exactly three stars").toEqual([
      "#402CDD", "#402CDD", "#402CDD", "transparent", "transparent",
    ]);
    three.unmount();
    const half = await renderWithProviders(<RatingStars readOnly initialRating={2.5} />);
    expect(starFills(), "a rating of 2.5 does not fill three stars").toEqual([
      "#402CDD", "#402CDD", "#402CDD", "transparent", "transparent",
    ]);
    half.unmount();
    await renderWithProviders(<RatingStars readOnly />);
    expect(starFills().every((f) => f === "transparent"), "a rating of 0 filled a star").toBe(true);
  });
});
