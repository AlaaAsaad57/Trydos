// The two color-aware wrappers on the product page. They read the live
// color param (query-only navigations keep the stale server render) and
// mount the slide set for that color, falling back to the first set.
import { describe, expect, it, vi } from "vitest";

import ActiveColorDetailsSlider from "components/products/ActiveColorDetailsSlider";
import ActiveColorSlider from "components/products/ActiveColorSlider";

import { renderWithProviders, screen } from "../../render";

vi.mock("components/products/ProductImageSlider", () => ({
  default: ({ children }: any) => <div data-testid="main">{children}</div>,
}));
vi.mock("components/products/ProductDetailsSlider", () => ({
  default: ({ images }: any) => <div data-testid="zoom">{(images ?? []).join(",")}</div>,
}));

const SLIDES = [
  { keys: ["red"], slides: <span>red slides</span> },
  { keys: ["blue", "navy"], slides: <span>blue slides</span> },
];
const IMAGES = [
  { keys: ["red"], images: ["r1"] },
  { keys: ["blue"], images: ["b1"] },
];

describe("ActiveColorSlider and ActiveColorDetailsSlider", () => {
  it("mount the set for the live color param", async () => {
    await renderWithProviders(
      <>
        <ActiveColorSlider slidesByColor={SLIDES} serverColor="red" language="en" productGA={{}} />
        <ActiveColorDetailsSlider imagesByColor={IMAGES} serverColor="red" productGA={{}} />
      </>,
      { search: "color=blue" },
    );
    expect(screen.getByTestId("main").textContent, "the main slider ignored the live color").toBe(
      "blue slides",
    );
    expect(screen.getByTestId("zoom").textContent, "the zoom ignored the live color").toBe("b1");
  });

  it("fall back to the server color, then to the first set", async () => {
    await renderWithProviders(
      <>
        <ActiveColorSlider slidesByColor={SLIDES} serverColor="navy" language="en" productGA={{}} />
        <ActiveColorDetailsSlider imagesByColor={IMAGES} serverColor="green" productGA={{}} />
      </>,
    );
    expect(screen.getByTestId("main").textContent, "the server color was not used").toBe(
      "blue slides",
    );
    expect(
      screen.getByTestId("zoom").textContent,
      "an unknown color did not fall back to the first set",
    ).toBe("r1");
  });

  it("render empty sets when there are none", async () => {
    await renderWithProviders(
      <>
        <ActiveColorSlider slidesByColor={undefined} serverColor={undefined} language="en" productGA={{}} />
        <ActiveColorDetailsSlider imagesByColor={undefined} serverColor={undefined} productGA={{}} />
      </>,
    );
    expect(screen.getByTestId("zoom").textContent, "no sets did not give an empty zoom").toBe("");
  });
});
