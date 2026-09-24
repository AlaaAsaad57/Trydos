// The stacked colour swatches on a product card: the active colour sits in the
// middle at full size, the others fan out behind it, smaller.
import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import StackedSlider from "components/ServerWrapper/ProductWrapper/StackedColors";

const slidesOf = (container: HTMLElement) =>
  Array.from(container.firstElementChild!.children) as HTMLElement[];

describe("the stacked colour swatches", () => {
  it("draws the active swatch in front at full size and the others behind it", () => {
    const { container } = render(
      <StackedSlider initial_index={1} slide_width={30} child_data_cy="swatch">
        {[<span key="a">a</span>, <span key="b">b</span>, <span key="c">c</span>]}
      </StackedSlider>,
    );
    const [left, active, right] = slidesOf(container);
    expect(active.style.transform, "the active swatch should not move or shrink").toBe(
      "translateX(0px) scale(1)",
    );
    expect(
      Number(active.style.zIndex),
      "the active swatch should sit in front of its neighbours",
    ).toBeGreaterThan(Number(left.style.zIndex));
    expect(right.style.transform, "a swatch after the active one should sit to its right, smaller").toBe(
      "translateX(12px) scale(0.9)",
    );
    expect(active.getAttribute("data-pw"), "each swatch should carry the given test id").toBe("swatch");
    expect(active.className, "swatches stay clickable unless sliding is disabled").not.toContain(
      "pointer-events-none",
    );
  });

  it("uses the width as the height when the height is 0, and turns clicks off when disabled", () => {
    const { container } = render(
      <StackedSlider slide_width={40} slide_height={0} disableSlide className="extra">
        {[<span key="a">a</span>]}
      </StackedSlider>,
    );
    expect(container.firstElementChild!.className, "a zero height should fall back to the width").toContain(
      "h-[50px]",
    );
    expect(container.firstElementChild!.className, "the given class should be kept").toContain("extra");
    expect(slidesOf(container)[0].className, "a disabled slider must not take clicks").toContain(
      "pointer-events-none",
    );
  });
});
