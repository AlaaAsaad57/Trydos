// The two-handle price slider in the filter window.
//
// It is two range inputs stacked on one track, which is the standard way to build
// one and the reason it needs a test: nothing stops two separate inputs from
// passing through each other. A minimum dragged above the maximum gives the
// backend a range with no width, and the listing goes empty for a reason the
// shopper cannot see.
//
// The other rule worth pinning is when it reports. Each pixel of a drag fires a
// change event; reporting every one of them would fire a facet re-fetch per pixel.
// It reports when the handle is let go.
import { describe, expect, it, vi } from "vitest";

import { PriceSliderComponent } from "components/ListingPage/filterComponents/FiltersWindow/PriceSliderComponent";

import { fireEvent, renderWithProviders } from "../../../../render";

/** The two handles, in the order the component draws them. */
const handles = () =>
  Array.from(document.querySelectorAll('input[type="range"]'));
const minHandle = () => handles()[0] as HTMLInputElement;
const maxHandle = () => handles()[1] as HTMLInputElement;

async function renderSlider({
  min = 0,
  max = 100,
  initialMin = 0,
  initialMax = 100,
  points = 2,
  onChange = vi.fn(),
}: Record<string, any> = {}) {
  const result = await renderWithProviders(
    <PriceSliderComponent
      min={min}
      max={max}
      initialMin={initialMin}
      initialMax={initialMax}
      points={points}
      symbol="$"
      roundPrice={(value: number) => value}
      onChange={onChange}
    />,
    { path: "/filters" },
  );
  return { ...result, onChange };
}

/** Drag a handle to a value and let go of it. */
function dragTo(handle: HTMLInputElement, value: number) {
  fireEvent.mouseDown(handle);
  fireEvent.change(handle, { target: { value: String(value) } });
  fireEvent.mouseUp(handle);
}

describe("the price slider in the filter window", () => {
  describe("the range it can cover", () => {
    it("spans the whole range the listing's prices cover", async () => {
      await renderSlider({ min: 5, max: 250 });

      expect(
        minHandle().min,
        "the track has to reach the cheapest product, or the shopper cannot widen the range back down to it once they have narrowed it",
      ).toBe("5");
      expect(
        maxHandle().max,
        "and it has to reach the dearest one",
      ).toBe("250");
    });

    it("starts at the band the listing is already narrowed to", async () => {
      await renderSlider({ min: 0, max: 100, initialMin: 20, initialMax: 60 });

      expect(
        minHandle().value,
        "the handles have to show the band that is applied, not the full range — starting wide open says the listing is showing everything when it is not",
      ).toBe("20");
      expect(maxHandle().value, "and the same for the upper handle").toBe("60");
    });

    it("follows the applied band when the listing is re-filtered under it", async () => {
      const { rerender } = await renderSlider({
        min: 0,
        max: 100,
        initialMin: 20,
        initialMax: 60,
      });

      // Choosing a category re-scopes the facet, so a new range arrives.
      rerender(
        <PriceSliderComponent
          min={0}
          max={100}
          initialMin={30}
          initialMax={80}
          points={2}
          symbol="$"
          roundPrice={(value: number) => value}
          onChange={vi.fn()}
        />,
      );

      expect(
        minHandle().value,
        "the handles are the only picture of the applied band; leaving them where they were shows a band the listing is not using",
      ).toBe("30");
    });
  });

  describe("the handles cannot pass through each other", () => {
    it("stops the lower handle just below the upper one", async () => {
      await renderSlider({ min: 0, max: 100, initialMin: 10, initialMax: 50 });

      dragTo(minHandle(), 80);

      expect(
        Number(minHandle().value),
        "two stacked inputs do not know about each other, so nothing but this stops the lower handle going above the upper one and sending the backend a band with no width",
      ).toBeLessThan(50);
    });

    it("stops the upper handle just above the lower one", async () => {
      await renderSlider({ min: 0, max: 100, initialMin: 40, initialMax: 90 });

      dragTo(maxHandle(), 10);

      expect(
        Number(maxHandle().value),
        "the same guard has to hold from the other side, or dragging the upper handle down past the lower one inverts the band",
      ).toBeGreaterThan(40);
    });

    it("leaves a gap the size of one step, so the band is never empty", async () => {
      await renderSlider({
        min: 0,
        max: 100,
        initialMin: 10,
        initialMax: 50,
        points: 2,
      });

      dragTo(minHandle(), 80);

      expect(
        Number(minHandle().value),
        "the gap is one step of the currency's own precision — with two decimal places that is 0.01, which is the smallest band that still means something",
      ).toBeCloseTo(49.99, 2);
    });

    it("uses a whole unit as the gap for a currency with no decimals", async () => {
      await renderSlider({
        min: 0,
        max: 1000,
        initialMin: 100,
        initialMax: 500,
        points: 0,
      });

      dragTo(minHandle(), 800);

      expect(
        Number(minHandle().value),
        "a currency with no minor unit has no 0.01 to step by; keeping a fixed 0.01 gap here would hand the backend a fractional bound it cannot match",
      ).toBe(499);
    });
  });

  describe("when it reports the chosen band", () => {
    it("says nothing while the handle is still moving", async () => {
      const { onChange } = await renderSlider();

      fireEvent.mouseDown(minHandle());
      fireEvent.change(minHandle(), { target: { value: "20" } });
      fireEvent.change(minHandle(), { target: { value: "30" } });

      expect(
        onChange,
        "a drag fires a change per pixel, and each one would start a facet re-fetch — the window would spend a whole drag fetching bands the shopper is dragging past",
      ).not.toHaveBeenCalled();
    });

    it("reports once the handle is let go", async () => {
      const { onChange } = await renderSlider({ min: 0, max: 100 });

      dragTo(minHandle(), 30);

      expect(
        onChange,
        "letting go is the shopper saying they have chosen; without a report here the drag changes the picture and nothing else",
      ).toHaveBeenCalledWith(30, 100);
    });

    it("reports both bounds, not only the one that moved", async () => {
      const { onChange } = await renderSlider({
        min: 0,
        max: 100,
        initialMin: 10,
        initialMax: 90,
      });

      dragTo(maxHandle(), 60);

      expect(
        onChange,
        "the band is one filter with two bounds; reporting only the handle that moved would leave the other one at whatever the caller last knew",
      ).toHaveBeenCalledWith(10, 60);
    });

    it("reports a drag that ends with a touch too", async () => {
      const { onChange } = await renderSlider({ min: 0, max: 100 });

      fireEvent.touchStart(minHandle());
      fireEvent.change(minHandle(), { target: { value: "30" } });
      fireEvent.touchEnd(minHandle());

      expect(
        onChange,
        "most shoppers here are on a phone, where a drag never produces a mouse-up — listening only for the mouse would mean the slider never reports on a phone at all",
      ).toHaveBeenCalledWith(30, 100);
    });
  });

  describe("a listing whose products are all one price", () => {
    it("draws without dividing by an empty range", async () => {
      await renderSlider({ min: 40, max: 40, initialMin: 40, initialMax: 40 });

      expect(
        minHandle(),
        "the position of a handle is worked out as a share of the range, and a range of zero makes that a division by zero — the slider has to survive it rather than draw a NaN width",
      ).toBeInTheDocument();
    });
  });
});
