// The small blue labels on a product card. One label sits still; several
// scroll up one by one and loop (the first label is repeated at the end).
import { describe, expect, it } from "vitest";

import { ProductLabelsAnimated } from "components/products/ProductLabelsAnimated";

import { render } from "../../render";

describe("ProductLabelsAnimated", () => {
  it.each([[undefined], [[]]])("renders nothing for %j", (labels) => {
    const { container } = render(<ProductLabelsAnimated labels={labels} />);
    expect(container.innerHTML, "no labels still rendered markup").toBe("");
  });

  it("shows one label without animation", () => {
    const { container } = render(<ProductLabelsAnimated labels={["New"]} />);
    expect(container.textContent, "the one label is not shown").toBe("New");
    expect(container.querySelector("style"), "one label was animated").toBeNull();
  });

  it("scrolls several labels and repeats the first to loop", () => {
    const { container } = render(<ProductLabelsAnimated labels={["New", "Hot"]} />);
    const shown = Array.from(container.querySelectorAll(".animate-scroll-step span")).map((s) => s.textContent);
    expect(shown, "the labels and the loop copy are wrong").toEqual(["New", "Hot", "New"]);
    const css = container.querySelector("style")!.textContent!;
    expect(css, "the animation does not last 2 s per label").toContain("scrollStep 4s");
    expect(css, "the second label does not move up by one row").toContain("translateY(-14px)");
  });
});
