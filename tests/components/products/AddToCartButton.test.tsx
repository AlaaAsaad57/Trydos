// The "Buy" tab on a product. Pressing it opens the add-to-cart sheet for this
// product (setSelectedProductForCart), with the redeem price for a luck product
// the shopper has not redeemed yet.
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddToCartButton from "components/products/AddToCartButton";

import { fireEvent, renderWithProviders, screen } from "../../render";

const { isRedeemed } = vi.hoisted(() => ({ isRedeemed: vi.fn() }));
vi.mock("utils/luck", async (importOriginal) => ({ ...(await importOriginal<any>()), isRedeemed }));

const COLORS = [
  { color_name: "Green", color_option: "green" },
  { color_name: "Red", color_option: "red" },
  { color_name: "Blue", color_option: "blue" },
];

describe("AddToCartButton", () => {
  beforeEach(() => {
    isRedeemed.mockReset();
    document.documentElement.style.overflow = "";
  });

  it("opens the cart sheet for the product and locks the page", async () => {
    const { store } = await renderWithProviders(
      <AddToCartButton product={{ product_id: 5, sync_color_images: COLORS }} />,
      { search: "color=blue" },
    );
    fireEvent.click(screen.getByText("Buy"));
    const selected = store.getState().selected_product_for_add_to_cart;
    expect(selected, "the cart sheet was not opened for this product").toEqual(
      expect.objectContaining({ product_id: 5, fromProductPage: true, showRedeemPrice: false, seconds: 0 }),
    );
    expect(
      selected.sync_color_images.map((c: any) => c.color_name).sort(),
      "the colours were lost on the way to the sheet",
    ).toEqual(["Blue", "Green", "Red"]);
    expect(document.documentElement.style.overflow, "the page was not locked").toBe("hidden");
  });

  it("offers the redeem price for a luck product not yet redeemed, and not after", async () => {
    isRedeemed.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { store } = await renderWithProviders(<AddToCartButton product={{ product_id: 5, is_luck: true }} />, {
      language: "ar",
      country: "sy",
    });
    fireEvent.click(screen.getByText("شراء").closest("[data-pw]") as HTMLElement);
    expect(store.getState().selected_product_for_add_to_cart.showRedeemPrice, "an unredeemed luck product has no redeem price").toBe(
      true,
    );
    fireEvent.click(screen.getByText("شراء").closest("[data-pw]") as HTMLElement);
    expect(store.getState().selected_product_for_add_to_cart.showRedeemPrice, "a redeemed luck product still offers it").toBe(false);
    expect(screen.getByText("شراء").parentElement!.className, "the Arabic tab is not flipped").toContain(
      "flex-row-reverse",
    );
  });

  it("does nothing without a product", async () => {
    const { store } = await renderWithProviders(<AddToCartButton product={null} />);
    fireEvent.click(screen.getByText("Buy"));
    expect(store.getState().selected_product_for_add_to_cart, "a sheet opened with no product").toBeFalsy();
  });
});
