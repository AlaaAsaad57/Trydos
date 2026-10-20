// The product orders modal in the seller dashboard: from a product card, the
// seller sees the orders that hold that product
// (GET /shop/products/{id}/orders, shop-seller-orders-apis.md §4.1).
// Each order uses the shopper's order card shape.

import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const getSellerProductOrders = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerProductOrders: (...a: unknown[]) => getSellerProductOrders(...a),
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={typeof src === "string" ? src : "/mock-img"} alt={alt || ""} {...props} />
  ),
}));

import ProductOrdersModal from "components/SellerDashboard/productOrders/ProductOrdersModal";

const SELLER_ID = "77";
const PRODUCT_ID = 2310;

const sampleOrder = {
  id: 50211,
  order_status: "Waiting Confirm",
  available_order_status_change: ["processing", "canceled"],
  order_amount: 45,
  order_amount_in_currency: 1912.5,
  currency: { code: "TRY", name: "Turkish Lira" },
  created_at: { date: "Today ", time: "10:42:05" },
  items: 3,
  remaining_in_minutes: 95,
  details: [
    {
      id: 90871,
      order_id: 50211,
      cart_image: "product/2025-10-01-abc.webp",
      qty: 2,
      unit_price: 25,
      offer_price: 20,
      unit_price_in_currency: 1062.5,
      offer_price_in_currency: 850,
      currency: { code: "TRY", name: "Turkish Lira" },
      is_confirm: false,
      is_packed: false,
      is_collected: false,
      product_name: "Azure Silk Slip",
      color: "Blue",
      size: "M",
    },
  ],
  customer: { id: 1542, name: "Ahmad Saleh" },
};

const page = (orders: unknown[], meta: Record<string, number> = {}) => ({
  isSuccessful: true,
  data: {
    orders,
    meta: { total: orders.length, current_page: 1, last_page: 1, per_page: 25, ...meta },
  },
});

const renderModal = (props: Partial<React.ComponentProps<typeof ProductOrdersModal>> = {}, language: "en" | "ar" = "en") =>
  renderWithProviders(
    <ProductOrdersModal
      productId={PRODUCT_ID}
      productName="Azure Silk Slip"
      sellerId={SELLER_ID}
      language={language}
      onClose={vi.fn()}
      {...props}
    />,
    { language },
  );

describe("Seller Dashboard ProductOrdersModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSellerProductOrders.mockResolvedValue(page([sampleOrder]));
  });

  it("asks for page 1 of all orders of this product on open", async () => {
    await renderModal();

    await waitFor(() =>
      expect(
        getSellerProductOrders,
        "opening the modal did not ask the shop backend for page 1 of all this product's orders",
      ).toHaveBeenCalledWith(SELLER_ID, PRODUCT_ID, 1, "all"),
    );
  });

  it("shows each order in the shopper's order card shape", async () => {
    await renderModal();

    const card = await screen.findByText("50211");
    expect(
      card.getAttribute("data-pw"),
      "the order id is not shown by the shopper card's order-id part",
    ).toBe("order-group-id");
    expect(
      screen.getByText("Waiting Confirm").getAttribute("data-status"),
      "the status part did not get the 'pending' value its icons need",
    ).toBe("pending");
    expect(
      screen.getByText("Today | 10:42:05"),
      "the backend's { date, time } was not shown as the card's time",
    ).toBeInTheDocument();
  });

  it("shows the whole order total in the shop currency, not converted by the shopper currency", async () => {
    await renderModal();

    expect(
      await screen.findByText("1912.50 TRY"),
      "the order total did not use order_amount_in_currency with the shop currency code",
    ).toBeInTheDocument();
    expect(
      screen.getByText("3"),
      "the item count did not use `items` (lines in the whole order)",
    ).toBeInTheDocument();
  });

  it("falls back to the USD amount when the shop currency is not resolved", async () => {
    getSellerProductOrders.mockResolvedValue(
      page([{ ...sampleOrder, order_amount_in_currency: null, currency: null }]),
    );
    await renderModal();

    expect(
      await screen.findByText("45.00 USD"),
      "with no shop-currency amount, the total must be the USD order_amount labelled USD",
    ).toBeInTheDocument();
  });

  it("shows one image per line of this product", async () => {
    getSellerProductOrders.mockResolvedValue(
      page([
        {
          ...sampleOrder,
          details: [
            sampleOrder.details[0],
            { ...sampleOrder.details[0], id: 90872, cart_image: "product/red.webp" },
          ],
        },
      ]),
    );
    await renderModal();
    await screen.findByText("50211");

    const images = Array.from(
      document.querySelectorAll('[data-pw="seller-product-order-card"] img[alt="OrderImage"]'),
    ).map((img) => img.getAttribute("src") || "");
    expect(
      images.some((src) => src.includes("abc.webp")) && images.some((src) => src.includes("red.webp")),
      `the card did not show both ordered variations of the product (got ${images.join(", ")})`,
    ).toBe(true);
  });

  it("asks for the chosen status from page 1 when the filter changes", async () => {
    const user = userEvent.setup();
    await renderModal();
    await screen.findByText("50211");

    await user.click(screen.getByRole("tab", { name: "In Progress" }));

    await waitFor(() =>
      expect(
        getSellerProductOrders,
        "choosing In Progress did not ask for status in_progress from page 1",
      ).toHaveBeenLastCalledWith(SELLER_ID, PRODUCT_ID, 1, "in_progress"),
    );
  });

  it("keeps the newest filter's answer when an older answer arrives late", async () => {
    const user = userEvent.setup();
    let answerAll: (v: unknown) => void = () => {};
    getSellerProductOrders.mockImplementationOnce(
      () => new Promise((resolve) => (answerAll = resolve)),
    );
    getSellerProductOrders.mockResolvedValueOnce(
      page([{ ...sampleOrder, id: 60001, order_status: "Packed" }]),
    );
    await renderModal();

    await user.click(screen.getByRole("tab", { name: "In Progress" }));
    await screen.findByText("60001");
    answerAll(page([sampleOrder]));

    await waitFor(() =>
      expect(
        screen.queryByText("50211"),
        "a late answer for 'All' replaced the In Progress list",
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("60001"),
      "the In Progress list was lost after the late 'All' answer",
    ).toBeInTheDocument();
  });

  it("asks for the next page with the same status", async () => {
    const user = userEvent.setup();
    getSellerProductOrders.mockResolvedValue(
      page([sampleOrder], { total: 31, last_page: 2 }),
    );
    await renderModal();
    await screen.findByText(/Page 1 \/ 2/i);

    await user.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() =>
      expect(
        getSellerProductOrders,
        "Next did not ask for page 2 of all orders",
      ).toHaveBeenLastCalledWith(SELLER_ID, PRODUCT_ID, 2, "all"),
    );
  });

  it("says no customer ordered the product when the list is empty", async () => {
    getSellerProductOrders.mockResolvedValue(page([]));
    await renderModal();

    expect(
      await screen.findByText("No Customer Has Ordered This Product Yet."),
      "an empty product orders list did not show its empty message",
    ).toBeInTheDocument();
  });

  it("shows the product-orders failure in Arabic when the backend refuses with no message", async () => {
    getSellerProductOrders.mockResolvedValue({ isSuccessful: false });
    await renderModal({}, "ar");

    expect(
      await screen.findByText("فشل تحميل طلبات المنتج"),
      "a refused product orders list showed raw English instead of the Arabic message",
    ).toBeInTheDocument();
  });

  it("closes on Escape, on the backdrop and on the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    await renderModal({ onClose });

    await user.keyboard("{Escape}");
    expect(onClose, "Escape did not close the modal").toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("dialog"));
    expect(onClose, "a click on the backdrop did not close the modal").toHaveBeenCalledTimes(2);

    await user.click(screen.getAllByRole("button", { name: /Close/i })[0]);
    expect(onClose, "the close icon did not close the modal").toHaveBeenCalledTimes(3);
  });
});
