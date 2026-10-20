import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const getSellerCarts = vi.fn();
const getSellerCartDetails = vi.fn();
const getSellerProductCarts = vi.fn();
const getSellerOldCarts = vi.fn();
const getSellerOldCartDetails = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerCarts: (...a: unknown[]) => getSellerCarts(...a),
    getSellerCartDetails: (...a: unknown[]) => getSellerCartDetails(...a),
    getSellerProductCarts: (...a: unknown[]) => getSellerProductCarts(...a),
    getSellerOldCarts: (...a: unknown[]) => getSellerOldCarts(...a),
    getSellerOldCartDetails: (...a: unknown[]) => getSellerOldCartDetails(...a),
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : "/mock-img"} alt={alt || ""} {...props} />
  ),
}));

import CartsTab from "components/SellerDashboard/carts/CartsTab";

const SELLER_ID = "77";

const sampleActiveCart = {
  cart_group_id: "1542-aB3dE-1759310000",
  customer: {
    id: 1542,
    name: "Ahmad Saleh",
    phone: "+905551234567",
    email: "ahmad@example.com",
  },
  items_count: 3,
  total_quantity: 4,
  created_at: "2026-10-01T09:12:44.000000Z",
  updated_at: "2026-10-01T09:40:02.000000Z",
};

const sampleCartLine = {
  id: 88231,
  cart_group_id: "1542-aB3dE-1759310000",
  product_id: 2310,
  product_variation_id: "9f0c2a51-6f43-4f5e-9d0a-2b7f3c1e8a10",
  name: "Azure Silk Slip",
  cart_image: "https://storage.example.com/product/abc.webp",
  color: "Blue",
  size: "M",
  quantity: 2,
  available_stock: 7,
  unit_price: 25,
  offer_price: 20,
  offer_type: "discount",
  tax: 0,
  unit_price_in_currency: 25,
  offer_price_in_currency: 20,
  currency: { code: "USD", name: "US Dollar" },
  customer_currency: { code: "USD", exchange_rate: 1 },
  created_at: "2026-10-01T09:12:44.000000Z",
  updated_at: "2026-10-01T09:40:02.000000Z",
};

const sampleOldCart = {
  customer_id: 1542,
  customer: {
    id: 1542,
    name: "Ahmad Saleh",
    phone: "+905551234567",
    email: "ahmad@example.com",
  },
  items_count: 5,
  last_added_at: "2026-09-28 18:02:11",
};

describe("Seller Dashboard Carts Section — CartsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getSellerCarts.mockResolvedValue({
      success: true, isSuccessful: true,
      data: {
        carts: [sampleActiveCart],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 25 },
      },
    });

    getSellerCartDetails.mockResolvedValue({
      success: true, isSuccessful: true,
      data: {
        cart_group_id: "1542-aB3dE-1759310000",
        customer: {
          id: 1542,
          name: "Ahmad Saleh",
          phone: "+905551234567",
          email: "ahmad@example.com",
        },
        customer_orders_count: 2,
        items: [sampleCartLine],
      },
    });

    getSellerOldCarts.mockResolvedValue({
      success: true, isSuccessful: true,
      data: {
        old_carts: [sampleOldCart],
        meta: { total: 5, current_page: 1, last_page: 1, per_page: 25 },
      },
    });

    getSellerOldCartDetails.mockResolvedValue({
      success: true, isSuccessful: true,
      data: {
        customer: {
          id: 1542,
          name: "Ahmad Saleh",
        },
        items: [sampleCartLine],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 25 },
      },
    });

    getSellerProductCarts.mockResolvedValue({
      success: true, isSuccessful: true,
      data: {
        items: [
          {
            ...sampleCartLine,
            customer: { id: 1542, name: "Ahmad Saleh" },
          },
        ],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 25 },
      },
    });
  });

  it("renders AccessDenied when canRead is false and does not fetch carts", async () => {
    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={false} language="en" />,
    );

    expect(
      screen.getByText(/You do not have permission to view carts/i),
    ).toBeInTheDocument();
    expect(getSellerCarts).not.toHaveBeenCalled();
    expect(getSellerOldCarts).not.toHaveBeenCalled();
  });

  it("always fetches BOTH active and old carts on mount so totals are immediately accurate in tabs", async () => {
    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    // Eagerly called on mount for accurate tab counts
    await waitFor(() => {
      expect(getSellerCarts).toHaveBeenCalledWith(SELLER_ID, 1);
      expect(getSellerOldCarts).toHaveBeenCalledWith(SELLER_ID, { page: 1 });
    });

    // Both tabs immediately show real totals without waiting for user to click
    expect(
      screen.getByRole("tab", { name: /Active Carts \(1\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Old Carts \(5\)/i }),
    ).toBeInTheDocument();

    // Customer name "Ahmad Saleh" should be masked to "Axxxx Sxxxx"
    expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    // Raw name, phone, and email should NOT appear
    expect(screen.queryByText("Ahmad Saleh")).not.toBeInTheDocument();
    expect(screen.queryByText("+905551234567")).not.toBeInTheDocument();
    expect(screen.queryByText("ahmad@example.com")).not.toBeInTheDocument();

    // Group ID & badges
    expect(screen.getByText("1542-aB3dE-1759310000")).toBeInTheDocument();
    expect(screen.getByText(/3 Items/i)).toBeInTheDocument();
    expect(screen.getByText(/4 Pieces/i)).toBeInTheDocument();
  });

  it("paginates active carts correctly across multiple pages", async () => {
    const user = userEvent.setup();
    getSellerCarts.mockResolvedValueOnce({
      success: true, isSuccessful: true,
      data: {
        carts: [sampleActiveCart],
        meta: { total: 50, current_page: 1, last_page: 2, per_page: 25 },
      },
    });
    getSellerCarts.mockResolvedValueOnce({
      success: true, isSuccessful: true,
      data: {
        carts: [{ ...sampleActiveCart, cart_group_id: "page-2-group-id" }],
        meta: { total: 50, current_page: 2, last_page: 2, per_page: 25 },
      },
    });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Page 1 \/ 2/i)).toBeInTheDocument();
    });

    // Click Next
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(getSellerCarts).toHaveBeenCalledWith(SELLER_ID, 2);
    });
  });

  it("paginates old carts correctly across multiple pages", async () => {
    const user = userEvent.setup();
    getSellerOldCarts.mockResolvedValueOnce({
      success: true, isSuccessful: true,
      data: {
        old_carts: [sampleOldCart],
        meta: { total: 40, current_page: 1, last_page: 2, per_page: 25 },
      },
    });
    getSellerOldCarts.mockResolvedValueOnce({
      success: true, isSuccessful: true,
      data: {
        old_carts: [{ ...sampleOldCart, customer_id: 9999 }],
        meta: { total: 40, current_page: 2, last_page: 2, per_page: 25 },
      },
    });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Old Carts/i })).toBeInTheDocument();
    });

    // Switch to Old Carts tab
    const oldCartsTabBtn = screen.getByRole("tab", { name: /Old Carts/i });
    await user.click(oldCartsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 \/ 2/i)).toBeInTheDocument();
    });

    // Click Next
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(getSellerOldCarts).toHaveBeenCalledWith(SELLER_ID, { page: 2 });
    });
  });

  it("renders empty state when there are no active carts", async () => {
    getSellerCarts.mockResolvedValueOnce({
      success: true, isSuccessful: true,
      data: { carts: [], meta: { total: 0, current_page: 1, last_page: 1 } },
    });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/No active carts found/i)).toBeInTheDocument();
    });
  });

  it("drills down into Active Cart Details and navigates back", async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    });

    // Click View Details button
    const viewBtn = screen.getByRole("button", { name: /View Details/i });
    await user.click(viewBtn);

    await waitFor(() => {
      expect(getSellerCartDetails).toHaveBeenCalledWith(
        SELLER_ID,
        "1542-aB3dE-1759310000",
      );
    });

    // Check Cart Details Header: customer orders count with seller
    expect(screen.getByText(/Orders with your shop/i)).toBeInTheDocument();
    expect(screen.getByText(/Orders with your shop/i)).toHaveTextContent("2");

    // Check Product Cart line item UI (CartItem parity)
    expect(screen.getByText("Azure Silk Slip")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText(/7 in stock/i)).toBeInTheDocument();
    expect(screen.getAllByText(/40\.00\s*USD/).length).toBeGreaterThan(0);

    // Click Back to Carts button
    const backBtn = screen.getByRole("button", { name: /Back to Carts/i });
    await user.click(backBtn);

    // Returned to carts list
    expect(screen.getByText(/3 Items/i)).toBeInTheDocument();
  });

  it("switches to Old Carts sub-tab and drills down into Old Cart Details", async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Old Carts/i)).toBeInTheDocument();
    });

    // Click Old Carts tab
    const oldCartsTabBtn = screen.getByRole("tab", { name: /Old Carts/i });
    await user.click(oldCartsTabBtn);

    // Old carts list rendered with masked name & item count
    expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    expect(screen.getByText(/5 Items/i)).toBeInTheDocument();
    expect(
      screen.getByText(/(2026-09-28|9\/28\/2026|Sep 28, 2026)/),
    ).toBeInTheDocument();

    // Click View Details
    const viewOldBtn = screen.getByRole("button", { name: /View Details/i });
    await user.click(viewOldBtn);

    await waitFor(() => {
      expect(getSellerOldCartDetails).toHaveBeenCalledWith(SELLER_ID, 1542, 1);
    });

    // Check Out Of Bag banner
    expect(screen.getAllByText(/Out Of Bag!/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Azure Silk Slip")).toBeInTheDocument();
  });

  it("opens Product Carts modal and closes it", async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    });

    // Drill down to cart details
    const viewBtn = screen.getByRole("button", { name: /View Details/i });
    await user.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText("Azure Silk Slip")).toBeInTheDocument();
    });

    // Click View Carts on the product line
    const viewProductCartsBtn = screen.getByRole("button", {
      name: /View Carts/i,
    });
    await user.click(viewProductCartsBtn);

    await waitFor(() => {
      expect(getSellerProductCarts).toHaveBeenCalledWith(SELLER_ID, 2310, 1);
      expect(getSellerOldCarts).toHaveBeenCalledWith(SELLER_ID, {
        search: 2310,
        page: 1,
      });
    });

    // Modal dialog is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close the modal
    const closeButtons = screen.getAllByRole("button", { name: /Close/i });
    await user.click(closeButtons[0]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles error state with retry", async () => {
    const user = userEvent.setup();
    getSellerCarts.mockRejectedValueOnce(new Error("Network connection error"));

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="en" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Network connection error")).toBeInTheDocument();
    });

    // Retry
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(getSellerCarts).toHaveBeenCalledTimes(2);
    });
  });

  it("shows the active-carts failure in Arabic when the backend refuses with no message", async () => {
    getSellerCarts.mockResolvedValue({ isSuccessful: false });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="ar" />,
      { language: "ar" },
    );

    expect(
      await screen.findByText("فشل تحميل السلات"),
      "a refused active-carts list showed raw English instead of the Arabic message",
    ).toBeInTheDocument();
  });

  it("shows the old-carts failure in Arabic when the backend refuses with no message", async () => {
    const user = userEvent.setup();
    getSellerOldCarts.mockResolvedValue({ isSuccessful: false });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="ar" />,
      { language: "ar" },
    );
    await user.click(await screen.findByRole("tab", { name: /السلات السابقة/ }));

    expect(
      await screen.findByText("فشل تحميل السلات السابقة"),
      "a refused old-carts list showed raw English instead of the Arabic message",
    ).toBeInTheDocument();
  });

  it("shows the old-cart-details failure in Arabic, and no English slug on the old-cart icon", async () => {
    const user = userEvent.setup();
    getSellerOldCartDetails.mockResolvedValue({ isSuccessful: false });

    await renderWithProviders(
      <CartsTab sellerId={SELLER_ID} canRead={true} language="ar" />,
      { language: "ar" },
    );
    await user.click(await screen.findByRole("tab", { name: /السلات السابقة/ }));
    await screen.findByText("Axxxx Sxxxx");

    expect(
      document.querySelector('img[alt="old-cart"]'),
      "the old-cart row icon still reads the English slug 'old-cart' to screen readers",
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /عرض التفاصيل/ }));

    expect(
      await screen.findByText("فشل تحميل تفاصيل السلة السابقة"),
      "a refused old-cart-details answer showed raw English instead of the Arabic message",
    ).toBeInTheDocument();
  });

  it("calls onActiveCountChange with active carts total count on load", async () => {
    const onActiveCountChange = vi.fn();
    await renderWithProviders(
      <CartsTab
        sellerId={SELLER_ID}
        canRead={true}
        language="en"
        onActiveCountChange={onActiveCountChange}
      />,
    );

    await waitFor(() => {
      expect(onActiveCountChange).toHaveBeenCalledWith(1);
    });
  });
});
