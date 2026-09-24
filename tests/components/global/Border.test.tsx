// The dashed rounded border drawn around an input (NameModal, product colours, prices).
import { describe, expect, it } from "vitest";

import Border from "components/global/Border";

import { renderWithProviders } from "../../render";

describe("the dashed border", () => {
  it("uses the width, height and colour it was given", async () => {
    const { container } = await renderWithProviders(
      <Border height={50} width="200px" color="#ff0000" />,
    );
    const first = container.querySelector("#firstRect");
    const second = container.querySelector("#secondRect");

    expect(first?.getAttribute("width"), "the outer rectangle must take the given width").toBe("200px");
    expect(first?.getAttribute("stroke"), "the outer rectangle must take the given colour").toBe("#ff0000");
    expect(
      second?.getAttribute("width"),
      "the inner rectangle must be half a pixel narrower than the given width",
    ).toBe("calc(200px - 0.5px)");
    expect(second?.getAttribute("height"), "the inner rectangle must be half a pixel shorter").toBe("49.5");
  });

  it("falls back to 390 wide and grey when no width or colour is given", async () => {
    const { container } = await renderWithProviders(<Border height={40} width={0} color="" />);

    expect(container.querySelector("#firstRect")?.getAttribute("width"), "the default width must be 390").toBe("390");
    expect(
      container.querySelector("#firstRect")?.getAttribute("stroke"),
      "the default colour must be #707070",
    ).toBe("#707070");
    expect(
      container.querySelector("#secondRect")?.getAttribute("width"),
      "the inner default width must be 389.5",
    ).toBe("389.5");
  });
});
