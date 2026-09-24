import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import PlaceOrderWidget from "components/Cart/PlaceOrderWidget";
import { renderWithProviders } from "../../render";

// OrderSuccess has its own test file; here it only has to show up.
vi.mock("components/Cart/OrderSuccess", () => ({
  default: () => <div data-testid="order-success" />,
}));

const address = {
  id: 1,
  is_default: 1,
  address: "Main Street",
  region_details: {
    province: "Damascus",
    city: "Mazzeh",
    town: "null",
    street: "Straight St",
    building: "B5",
  },
  contact_info: { phone: "+000", contact_person_name: "Sami" },
};

const cartRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  image: "shoe.jpg",
  quantity: 2,
  variations: { Size: "M", color: "Red" },
  ...overrides,
});

const baseStore = {
  cart: [cartRow()],
  addressLists: [address],
  orderData: { success: false, data: null, payment: [] },
  currency: { symbol: "$" },
  total_cash: 0,
  cod_cost: 0,
  coupon_discount: 0,
};

const render = (store: Record<string, unknown> = {}, language: "en" | "ar" = "en") =>
  renderWithProviders(<PlaceOrderWidget />, {
    store: { ...baseStore, ...store },
    language,
    country: "sy",
  });

const quantityLabels = () =>
  [...document.querySelectorAll('[data-pw="order-item-quantity-label"]')].map((el) => el.textContent);

describe("PlaceOrderWidget", () => {
  it("lists the bag items with their quantity, size and colour, and the default address", async () => {
    await render();

    expect(quantityLabels(), "each bag item must show its quantity").toEqual(["2"]);
    expect(screen.getByText("M"), "the size must be shown").toBeInTheDocument();
    expect(screen.getByText("Red"), "the colour must be shown").toBeInTheDocument();
    expect(
      screen.getByText("Damascus | Mazzeh | Straight St | B5"),
      "the region line must skip the 'null' town",
    ).toBeInTheDocument();
    expect(screen.getByText("Sami"), "the contact name must be shown").toBeInTheDocument();
    expect(screen.queryByTestId("order-success"), "no success block before the order is placed").toBeNull();
  });

  it("falls back to the contact's name field and shows a town-only region", async () => {
    await render({
      addressLists: [{ ...address, region_details: { town: "Villat" }, contact_info: { name: "Lina" } }],
    });
    expect(screen.getByText("Lina"), "the contact's name field is the fallback").toBeInTheDocument();
    expect(screen.getByText("| Villat"), "a town-only region must still show the town").toBeInTheDocument();
  });

  it("shows the placed orders' items instead of the bag once the order succeeded", async () => {
    await render({
      orderData: {
        success: true,
        payment: [],
        data: [
          { details: [cartRow({ quantity: undefined, qty: 4, variations: {} })] },
          { details: [cartRow({ quantity: 1 })] },
        ],
      },
    });
    expect(screen.getByTestId("order-success"), "the success block must show").toBeInTheDocument();
    expect(
      quantityLabels(),
      "the items come from the placed orders, reading qty when quantity is missing",
    ).toEqual(["4", "1"]);
  });

  it("shows the delivery cost on the cash on delivery row before the order", async () => {
    await render({ orderData: { success: false, data: null, payment: [{ id: 0 }] }, cod_cost: 7, total_cash: 90 });
    const cod = document.querySelector('[data-pw="cachondelivry-cartpage"]')!;
    expect(cod.textContent, "before the order, cash on delivery shows the delivery cost").toContain("7");
  });

  it("shows the cash total on the cash on delivery row once the order succeeded", async () => {
    await render({
      orderData: { success: true, data: [], payment: [{ id: 0 }] },
      cod_cost: 7,
      total_cash: 90,
    });
    const cod = document.querySelector('[data-pw="cachondelivry-cartpage"]')!;
    expect(cod.textContent, "after the order, cash on delivery shows the cash total").toContain("90");
  });

  it("shows the RDB wallet, card and crypto rows and the coupon discount", async () => {
    await render({
      orderData: {
        success: false,
        data: null,
        payment: [{ id: 1, balance: 33 }, { id: 2, balance: 10 }, { id: 3, balance: 11 }],
      },
      coupon_discount: 5,
    });
    expect(screen.getByText("RDB Wallet"), "the RDB wallet row must show").toBeInTheDocument();
    expect(screen.getByText("33 $"), "the RDB wallet row shows its balance").toBeInTheDocument();
    expect(screen.getByText("Credit Cards"), "the card row must show").toBeInTheDocument();
    expect(screen.getByText("Crypto"), "the crypto row must show").toBeInTheDocument();
    expect(screen.getByText("Discount Coupon"), "the coupon block must show").toBeInTheDocument();
    expect(screen.getByText("- 5 $"), "the coupon discount must be shown").toBeInTheDocument();
  });

  it("lays the rows out right to left in Arabic", async () => {
    await render(
      {
        orderData: {
          success: false,
          data: null,
          payment: [{ id: 0 }, { id: 1, balance: 1 }, { id: 2, balance: 1 }, { id: 3, balance: 1 }],
        },
      },
      "ar",
    );
    const cod = document.querySelector('[data-pw="cachondelivry-cartpage"]')!;
    expect(cod.className, "the cash on delivery row must be mirrored").toContain("flex-row-reverse");
    expect(
      document.querySelector('[data-pw="Payment-Container-Cart-Page"]')!.className,
      "the payment box must align to the right",
    ).toContain("items-end");
  });

  it(
    "BUG-cart-402: an item whose size is stored as variations.size_options shows its size",
    async () => {
      await render({ cart: [cartRow({ variations: { size_options: "XL", color: "Red" } })] });
      expect(
        screen.queryByText("XL"),
        "the size from variations.size_options must be shown like variations.Size",
      ).not.toBeNull();
    },
  );
});
