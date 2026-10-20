// The seller's view of one open cart: its lines and the cart total.
//
// A line has two sets of prices. `*_in_currency` is in the shop currency; when
// it is null the line falls back to `unit_price` / `offer_price`, which the
// backend always sends in USD (docs/shop-seller-carts-apis.md, "Cart line").
// So one cart can hold lines in two currencies, and the total must never add
// them together under one code.
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen, waitFor } from "../../../render";

const getSellerCartDetails = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerCartDetails: (...a: unknown[]) => getSellerCartDetails(...a),
  },
}));

import ActiveCartDetails from "components/SellerDashboard/carts/ActiveCartDetails";

const SELLER_ID = "77";
const GROUP_ID = "1542-aB3dE-1759310000";

const line = (overrides: Record<string, unknown>) => ({
  id: 1,
  cart_group_id: GROUP_ID,
  product_id: 2310,
  product_variation_id: null,
  name: "Azure Silk Slip",
  cart_image: "https://storage.example.com/product/abc.webp",
  color: null,
  size: null,
  quantity: 1,
  available_stock: null,
  unit_price: 25,
  offer_price: 0,
  unit_price_in_currency: null,
  offer_price_in_currency: null,
  currency: null,
  ...overrides,
});

function answerWith(items: unknown[]) {
  getSellerCartDetails.mockResolvedValue({
    success: true, isSuccessful: true,
    data: {
      cart_group_id: GROUP_ID,
      customer: { id: 1542, name: "Ahmad Saleh" },
      customer_orders_count: 0,
      items,
    },
  });
}

async function open(language: "en" | "ar" = "en") {
  await renderWithProviders(
    <ActiveCartDetails
      cartGroupId={GROUP_ID}
      sellerId={SELLER_ID}
      language={language}
      shopCurrency="TRY"
      onBack={vi.fn()}
    />,
    { language },
  );
}

/** The text of the summary row: the "Cart Total:" label and every amount after it. */
const cartTotal = () =>
  screen.queryByText(/Cart Total:/)?.parentElement?.textContent ?? "";

describe("Seller Dashboard ActiveCartDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows one total per currency when the cart mixes shop-currency and USD lines", async () => {
    answerWith([
      // 2 x 850 TRY (the offer price) = 1700 TRY
      line({
        id: 1,
        quantity: 2,
        unit_price_in_currency: 1062.5,
        offer_price_in_currency: 850,
        currency: { code: "TRY", name: "Turkish Lira" },
      }),
      // No shop-currency price: 3 x 10 USD = 30 USD
      line({ id: 2, quantity: 3, unit_price: 10 }),
    ]);
    await open();
    await waitFor(() => expect(cartTotal(), "the cart total never rendered").not.toBe(""));

    expect(
      cartTotal(),
      `the TRY lines were not totalled on their own (total shown: "${cartTotal()}")`,
    ).toContain("1700.00 TRY");
    expect(
      cartTotal(),
      `the USD line was not totalled on its own (total shown: "${cartTotal()}")`,
    ).toContain("30.00 USD");
    expect(
      cartTotal(),
      `the total added TRY and USD amounts into one number (total shown: "${cartTotal()}")`,
    ).not.toContain("1730.00");
  });

  it("labels a line with no shop-currency price as USD, even when the shop currency is known", async () => {
    // The shop currency object is there, but the price in it is not — so the
    // amount shown is the USD base price and must carry the USD code.
    answerWith([
      line({ quantity: 2, unit_price: 25, currency: { code: "TRY", name: "Turkish Lira" } }),
    ]);
    await open();
    await screen.findByText("Azure Silk Slip");

    expect(
      screen.queryAllByText("50.00 TRY"),
      "a line priced in USD was labelled with the shop currency TRY",
    ).toHaveLength(0);
    expect(
      screen.queryAllByText("50.00 USD").length,
      "the line total of a USD-priced line did not say USD",
    ).toBeGreaterThan(0);
    expect(cartTotal(), "the cart total of a USD-priced line did not say USD").toContain(
      "50.00 USD",
    );
  });

  it("shows the cart-details failure in the seller's language when the backend sends no message", async () => {
    getSellerCartDetails.mockResolvedValue({ isSuccessful: false });
    await open("ar");

    expect(
      await screen.findByText("فشل تحميل تفاصيل السلة"),
      "a refused cart-details answer showed raw English instead of the Arabic message",
    ).toBeInTheDocument();
  });

  it("gives a line with no name a translated alt text, and the decorative icons no English slug", async () => {
    answerWith([line({ name: null, color: "Blue", size: "M" })]);
    await open("ar");
    await screen.findByText("Blue");

    expect(
      document.querySelector('img[alt="منتج"]'),
      "the product image of an unnamed line did not use the Arabic alt text for 'Product'",
    ).not.toBeNull();
    expect(
      document.querySelector('img[alt="Product"]'),
      "the product image of an unnamed line kept the English alt text 'Product'",
    ).toBeNull();
    expect(
      document.querySelector('img[alt="cart-color"], img[alt="cart-size"]'),
      "the colour / size icons still read an English slug to screen readers",
    ).toBeNull();
  });
});
