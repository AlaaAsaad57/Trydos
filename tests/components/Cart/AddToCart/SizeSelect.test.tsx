// The size strip in the add-to-cart sheet: picking a size, the bell on sizes
// the shopper waits for, and the line under the strip about stock.
import { describe, expect, it, vi } from "vitest";

import SizeSelect from "components/Cart/AddToCart/SizeSelect";

import { renderWithProviders, screen, userEvent } from "../../../render";

const sizes = [
  { option: "s", name: "Small" },
  { option: "m", name: "Medium" },
];

type Props = Partial<Parameters<typeof SizeSelect>[0]>;

function renderSizes(props: Props = {}, language: any = "en") {
  return renderWithProviders(
    <SizeSelect
      sizes={sizes}
      selectedSize={null}
      setSelectedSize={() => {}}
      qty={5}
      isSizeNotified={() => false}
      sizeQty={() => 5}
      isCollectAfterOrder={false}
      {...props}
    />,
    { language },
  );
}

function sizeBox(name: string) {
  return screen
    .getByText(name, { exact: false })
    .closest('[data-pw="add-to-cart-size"]') as HTMLElement;
}

describe("the size strip in the add-to-cart sheet", () => {
  it("picks the size the shopper taps", async () => {
    const setSelectedSize = vi.fn();
    await renderSizes({ setSelectedSize });

    await userEvent.click(sizeBox("Medium"));

    expect(setSelectedSize, "tapping Medium did not pick m").toHaveBeenCalledWith(
      "m",
    );
  });

  it("marks a sold-out size red and a waited-for size with a bell", async () => {
    await renderSizes(
      {
        sizeQty: (option: string) => (option === "s" ? 0 : 5),
        isSizeNotified: (option: string) => option === "m",
        selectedSize: "m",
      },
      "ar",
    );

    expect(
      sizeBox("Small").className,
      "a size with 0 left must have the red background",
    ).toContain("bg-[#FFF2F2]");
    expect(
      sizeBox("Medium").className,
      "the picked size must have the grey background",
    ).toContain("bg-[#F4F4F4]");
    expect(
      sizeBox("Medium").querySelector('[data-pw="is-size-notified"]'),
      "the size the shopper waits for must show the bell",
    ).not.toBeNull();
    expect(
      sizeBox("Medium").querySelector('rect[stroke="#513aaf"]'),
      "the picked size must get the purple frame",
    ).not.toBeNull();
  });

  it("says Last N under the strip when 10 or fewer of the picked size are left", async () => {
    await renderSizes({ selectedSize: "m", qty: 4 });

    expect(
      screen.getByText("Last 4"),
      "4 left and the shopper was not told",
    ).toBeInTheDocument();
  });

  it("does not say Last N when the product is packed after ordering", async () => {
    await renderSizes({ selectedSize: "m", qty: 0, isCollectAfterOrder: true });

    expect(
      screen.queryByText(/Last/),
      "an item packed after ordering has no stock limit to warn about",
    ).toBeNull();
    expect(
      screen.getByText("Recommended"),
      "the recommended size line is missing",
    ).toBeInTheDocument();
  });

  it("says the picked size is sold out when none are left", async () => {
    await renderSizes({ selectedSize: { name: "XL" }, qty: 0 });

    expect(
      screen.getByText("XL | XL"),
      "the sold-out line must name the size",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Not Available Now, Stock Is Sold Out"),
      "a sold-out size must say it is sold out",
    ).toBeInTheDocument();
  });
});
