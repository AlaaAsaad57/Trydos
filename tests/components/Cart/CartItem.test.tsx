// One product row in the order summary: picture, name, color / size / pieces,
// shipping days and the reason a row cannot be bought.
import { describe, expect, it, vi } from "vitest";

import CartItem from "components/Cart/CartItem";

import { renderWithProviders, screen } from "../../render";

// jsdom has no IntersectionObserver; the flash deal banner asks for one.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const baseProduct = {
  id: 1,
  name: "Blue shirt",
  image: "shirt.png",
  brand: { icon: { file_path: "brand.png" } },
  count_of_pieces: 2,
  shipping_days: 3,
  check_availability: true,
  is_active: true,
  variations: [{ color: "Blue", Size: "M" }],
};

function marked(name: string) {
  return document.querySelector(`[data-pw="${name}"]`);
}

describe("a row in the order summary", () => {
  it("shows the product name, color, size, pieces and shipping days", async () => {
    await renderWithProviders(<CartItem product={baseProduct} index={0} />, {
      store: {
        settings: { starting_setting: { shipping_duration_days: 2 } },
      },
    });

    expect(
      marked("productNameInCart")?.textContent,
      "the row did not show the product name",
    ).toBe("Blue shirt");
    expect(marked("color-name")?.textContent, "the color is missing").toBe(
      "Blue",
    );
    expect(
      marked("size-container-size")?.textContent,
      "the size is missing",
    ).toBe("M");
    expect(
      marked("days-number")?.textContent,
      "shipping days must add the product's days and the shop's start days (3 + 2)",
    ).toContain("5 Days");
    expect(
      (marked("card-numbering-value") as HTMLInputElement).value,
      "the row number must be the index plus one",
    ).toBe("1");
    expect(
      screen.queryByText("Out Of Stock"),
      "an available product must not say out of stock",
    ).toBeNull();
  });

  it("cuts a long name and reads variations given as one object with option keys", async () => {
    await renderWithProviders(
      <CartItem
        product={{
          ...baseProduct,
          name: "x".repeat(60),
          shipping_days: 0,
          variations: { color_options: "Red", size_options: "L" },
          flash_deal_details: { end_date: "2999-01-01" },
        }}
        index={2}
      />,
      { language: "ar" },
    );

    expect(
      marked("productNameInCart")?.textContent,
      "a name over 50 letters must be cut to 50 and end with ...",
    ).toBe(`${"x".repeat(50)}...`);
    expect(marked("color-name")?.textContent, "color_options was not read").toBe(
      "Red",
    );
    expect(
      marked("size-container-size")?.textContent,
      "size_options was not read",
    ).toBe("L");
    expect(
      marked("sshipping-container"),
      "with zero shipping days the shipping line must be hidden",
    ).toBeNull();
    expect(
      marked("container-image-onCard")?.className,
      "an Arabic row must be drawn right to left",
    ).toContain("flex-row-reverse");
  });

  it("shows no color and no size when the row has no variation", async () => {
    await renderWithProviders(
      <CartItem product={{ ...baseProduct, variations: null }} index={0} />,
      { language: "ku" },
    );

    expect(marked("color-div2"), "a row with no color showed one").toBeNull();
    expect(marked("size-container"), "a row with no size showed one").toBeNull();
  });

  it("an empty variations list shows no color", async () => {
    await renderWithProviders(
      <CartItem product={{ ...baseProduct, variations: [] }} index={0} />,
    );

    expect(marked("color-div2"), "an empty list showed a color").toBeNull();
  });

  it.each([
    [
      "restricted in the country",
      { is_country_restricted: true },
      "Not Available In Your Country",
    ],
    ["no longer active", { is_active: false }, "Not Available Now"],
    ["out of stock", { check_availability: false }, "Out Of Stock"],
  ])("says why a row that is %s cannot be bought", async (_, extra, text) => {
    await renderWithProviders(
      <CartItem product={{ ...baseProduct, ...extra }} index={0} />,
    );

    expect(
      screen.queryByText(text),
      `the row must say "${text}"`,
    ).not.toBeNull();
  });
});
