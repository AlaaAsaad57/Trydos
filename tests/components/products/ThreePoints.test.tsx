// The "more" dots in the product footer: a filled icon while its panel is open.
import { describe, expect, it } from "vitest";

import ThreePoints from "components/products/ThreePoints";

import { render } from "../../render";

describe("ThreePoints", () => {
  it("shows the active icon while open and the plain one otherwise", () => {
    const { container, rerender } = render(<ThreePoints active />);
    expect(container.querySelector("img")!.getAttribute("src"), "the open icon is wrong").toBe(
      "/icons/activethreepoints.svg",
    );
    rerender(<ThreePoints active={false} />);
    expect(container.querySelector("img")!.getAttribute("src"), "the closed icon is wrong").toBe(
      "/icons/threepoints.svg",
    );
  });
});
