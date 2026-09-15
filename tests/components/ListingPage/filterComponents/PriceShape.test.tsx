// The small curve drawn behind the price slider. It shows how many products fall
// in each price band, so the shopper can see where the prices actually sit before
// they drag the handles.
//
// It is drawn from bands the backend counted, and every one of its inputs can be
// missing or degenerate: no bands at all, one band, every band with the same
// count. The maths divides by the spread of the bands and by the tallest count,
// so each of those is a division by zero waiting to happen — and a broken `d`
// attribute does not throw, it just draws nothing or draws nonsense across the
// slider.
import { afterEach, describe, expect, it } from "vitest";

import SmoothPolygon from "components/ListingPage/filterComponents/PriceShape";

import { renderWithProviders } from "../../../render";

/**
 * Give the container a width.
 *
 * jsdom lays nothing out, so `clientWidth` is 0 everywhere and the component
 * takes its own "I have no room" path. A test that wants to see the curve has to
 * say how wide the box is.
 */
function giveTheBoxAWidth(width: number) {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => width,
  });
}

function forgetTheWidth() {
  delete (HTMLElement.prototype as any).clientWidth;
}

const theCurve = () => document.querySelector("svg path");

describe("the price curve behind the slider", () => {
  afterEach(() => {
    forgetTheWidth();
  });

  it("draws a curve from the bands it was given", async () => {
    giveTheBoxAWidth(400);
    await renderWithProviders(
      <SmoothPolygon
        data={[
          { mon: 0, max: 10, count: 2 },
          { mon: 10, max: 20, count: 9 },
          { mon: 20, max: 30, count: 4 },
        ]}
      />,
      { path: "/filters" },
    );

    expect(
      theCurve()?.getAttribute("d"),
      "the curve is the whole component — without a path there is an empty strip above the slider and no sign of where the prices are",
    ).toMatch(/^M/);
  });

  it("closes the curve so it can be filled", async () => {
    giveTheBoxAWidth(400);
    await renderWithProviders(
      <SmoothPolygon
        data={[
          { mon: 0, max: 10, count: 2 },
          { mon: 10, max: 20, count: 9 },
        ]}
      />,
      { path: "/filters" },
    );

    expect(
      theCurve()?.getAttribute("d"),
      "an open path fills as a thin sliver instead of a solid shape under the line, so the counts read as almost nothing",
    ).toMatch(/Z$/);
  });

  it("puts the tallest band at the top of the strip", async () => {
    giveTheBoxAWidth(400);
    await renderWithProviders(
      <SmoothPolygon
        data={[
          { mon: 0, max: 10, count: 1 },
          { mon: 10, max: 20, count: 10 },
        ]}
      />,
      { path: "/filters" },
    );

    const path = theCurve()?.getAttribute("d") ?? "";
    // The first point is written straight after the M, as "M<x>,<y>".
    const firstY = Number(path.slice(1).split(" ")[0].split(",")[1]);

    expect(
      firstY,
      "the strip is 50px tall and heights are measured down from the top, so the shortest band must sit near the bottom — a band of 1 drawn as tall as a band of 10 tells the shopper the prices are spread evenly when they are not",
    ).toBeGreaterThan(25);
  });

  it("draws nothing at all when there are no bands", async () => {
    giveTheBoxAWidth(400);
    await renderWithProviders(<SmoothPolygon data={[]} />, {
      path: "/filters",
    });

    expect(
      theCurve(),
      "with no bands there is nothing to say about the prices; the maths would divide by the spread of an empty list and write a path of NaNs across the slider",
    ).toBeNull();
  });

  it("keeps its space in the layout when it draws nothing", async () => {
    giveTheBoxAWidth(400);
    const { container } = await renderWithProviders(
      <SmoothPolygon data={[]} />,
      { path: "/filters" },
    );

    expect(
      container.querySelector("div"),
      "the slider is positioned against this strip, so collapsing to nothing would move the slider up over the filters above it",
    ).toBeInTheDocument();
  });

  it("draws nothing before the browser has measured the box", async () => {
    // jsdom reports 0, exactly as a real browser does on the very first paint.
    await renderWithProviders(
      <SmoothPolygon
        data={[
          { mon: 0, max: 10, count: 2 },
          { mon: 10, max: 20, count: 9 },
        ]}
      />,
      { path: "/filters" },
    );

    expect(
      theCurve(),
      "with no width every point lands on the same x, which draws a vertical spike rather than a curve — waiting for a real measurement is the only honest answer",
    ).toBeNull();
  });
});
