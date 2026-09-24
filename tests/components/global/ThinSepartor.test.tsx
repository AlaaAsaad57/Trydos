// The thin grey line used between rows of the expected-delivery modal.
import { describe, expect, it } from "vitest";

import ThinSepartor from "components/global/ThinSepartor";

import { renderWithProviders } from "../../render";

describe("the thin separator", () => {
  it("draws a full-width grey line with the class and style it was given", async () => {
    const { container } = await renderWithProviders(
      <ThinSepartor className="my-line" style={{ marginTop: "4px" }} />,
    );
    const svg = container.querySelector("svg");

    expect(svg, "the separator did not draw its svg").toBeInTheDocument();
    expect(svg, "the caller's class was not passed to the separator").toHaveClass("my-line");
    expect(svg?.style.marginTop, "the caller's style was not passed to the separator").toBe("4px");
    expect(
      container.querySelector("line")?.getAttribute("stroke"),
      "the separator line must be the light grey #d3d3d3",
    ).toBe("#d3d3d3");
  });

  it("works with no props", async () => {
    const { container } = await renderWithProviders(<ThinSepartor />);
    expect(
      container.querySelector("svg")?.getAttribute("width"),
      "the separator must span the full width",
    ).toBe("100%");
  });
});
