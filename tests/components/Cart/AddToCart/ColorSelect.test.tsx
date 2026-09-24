// The color strip in the add-to-cart sheet: which color is picked, and the
// small label under each color ("Last 3", "Sale 20 %").
import { describe, expect, it, vi } from "vitest";

import ColorSelect from "components/Cart/AddToCart/ColorSelect";

import { renderWithProviders, screen, userEvent } from "../../../render";

const colors = [
  { color_name: "Blue", color_option: "blue", images: ["blue.png"] },
  { color_name: "Red", color_option: "red", images: ["red.png"] },
  { color_name: "Green", color_option: "green", images: [] },
  { color_name: "Black", color_option: "black", images: [] },
];

function labelUnder(colorName: string) {
  const image = screen.getByAltText(colorName);
  return image
    .closest('[data-pw="add-to-cart-color"]')
    ?.querySelector('[data-pw="selected-color-name"]')?.textContent;
}

describe("the color strip in the add-to-cart sheet", () => {
  it("labels each color: its name when picked, Last N when few are left, Sale when discounted", async () => {
    const isQtyIsLast = (color: any) =>
      color.color_option === "red" ? { qty: 3 } : { qty: 50 };
    const IsColorHasDiscount = (color: any) =>
      color.color_option === "green" ? 20 : 0;

    await renderWithProviders(
      <ColorSelect
        colors={colors}
        setSelectedColor={() => {}}
        selectedColor={colors[0]}
        isQtyIsLast={isQtyIsLast}
        IsColorHasDiscount={IsColorHasDiscount}
      />,
    );

    expect(labelUnder("Blue"), "the picked color must show its name").toBe(
      "Blue",
    );
    expect(
      labelUnder("Red"),
      "a color with 3 left must say how few are left",
    ).toBe("Last 3");
    expect(
      labelUnder("Green"),
      "a discounted color must show the sale percent",
    ).toBe("Sale 20 %");
    expect(
      labelUnder("Black"),
      "a plain color with stock must have no label",
    ).toBeUndefined();
    expect(
      document.querySelector('path[fill="#513AAF"]'),
      "the picked color must get the purple border",
    ).not.toBeNull();
  });

  it("picks the color the shopper taps", async () => {
    const setSelectedColor = vi.fn();
    await renderWithProviders(
      <ColorSelect
        colors={colors}
        setSelectedColor={setSelectedColor}
        selectedColor={null}
        isQtyIsLast={undefined}
        IsColorHasDiscount={() => 0}
      />,
      { language: "ar" },
    );

    await userEvent.click(screen.getByAltText("Red"));

    expect(
      setSelectedColor,
      "tapping Red did not pick Red",
    ).toHaveBeenCalledWith(colors[1]);
  });
});
