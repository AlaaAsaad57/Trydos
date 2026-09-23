import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import ProductRating from "components/Server/product/ProductRating";

const fills = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("path")).map((p) => p.getAttribute("fill"));

describe("the star rating", () => {
  it("fills the whole stars and the part-star, and leaves the rest empty", () => {
    const { container } = render(<ProductRating rating={2.5} color="#000" />);
    expect(fills(container), "2.5 should fill three stars and leave two empty").toEqual([
      "#000", "#000", "#000", "transparent", "transparent",
    ]);
  });

  it("leaves every star empty for no rating", () => {
    const { container } = render(<ProductRating rating={0} />);
    expect(fills(container).every((f) => f === "transparent"), "a zero rating should fill no star").toBe(true);
  });
});
