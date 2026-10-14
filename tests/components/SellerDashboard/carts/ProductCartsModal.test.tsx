import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const getSellerProductCarts = vi.fn();
const getSellerOldCarts = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerProductCarts: (...a: unknown[]) => getSellerProductCarts(...a),
    getSellerOldCarts: (...a: unknown[]) => getSellerOldCarts(...a),
  },
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : "/mock-img"} alt={alt || ""} {...props} />
  ),
}));

import ProductCartsModal from "components/SellerDashboard/carts/ProductCartsModal";

const SELLER_ID = "77";
const PRODUCT_ID = 2310;

const sampleProductCartLine = {
  id: 88231,
  cart_group_id: "1542-aB3dE-1759310000",
  product_id: PRODUCT_ID,
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
  customer: {
    id: 1542,
    name: "Ahmad Saleh",
    phone: "+905551234567",
    email: "ahmad@example.com",
  },
  created_at: "2026-10-01T09:12:44.000000Z",
  updated_at: "2026-10-01T09:40:02.000000Z",
};

const sampleOldCartSummary = {
  customer_id: 1542,
  customer: {
    id: 1542,
    name: "Ahmad Saleh",
  },
  items_count: 3,
  last_added_at: "2026-09-28 18:02:11",
};

describe("Seller Dashboard ProductCartsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getSellerProductCarts.mockResolvedValue({
      isSuccessful: true,
      data: {
        items: [sampleProductCartLine],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 25 },
      },
    });

    getSellerOldCarts.mockResolvedValue({
      isSuccessful: true,
      data: {
        old_carts: [sampleOldCartSummary],
        meta: { total: 1, current_page: 1, last_page: 1, per_page: 25 },
      },
    });
  });

  it("fetches active carts on mount and displays masked customer name", async () => {
    const handleClose = vi.fn();
    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        productImage="https://storage.example.com/product/abc.webp"
        sellerId={SELLER_ID}
        language="en"
        onClose={handleClose}
      />,
    );

    await waitFor(() => {
      expect(getSellerProductCarts).toHaveBeenCalledWith(SELLER_ID, PRODUCT_ID, 1);
    });

    // Lazy load: old carts should NOT have been fetched on mount
    expect(getSellerOldCarts).not.toHaveBeenCalled();

    // Check title & product id
    expect(screen.getAllByText("Azure Silk Slip").length).toBeGreaterThan(0);
    expect(screen.getByText(/2310/)).toBeInTheDocument();

    // Active carts item rendered with masked customer name
    expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    expect(screen.queryByText("Ahmad Saleh")).not.toBeInTheDocument();
  });

  it("lazy loads old carts when switching to Old Carts sub-tab", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        sellerId={SELLER_ID}
        language="en"
        onClose={handleClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Old Carts/i)).toBeInTheDocument();
    });

    // Click Old Carts tab
    const oldTab = screen.getByRole("tab", { name: /Old Carts/i });
    await user.click(oldTab);

    await waitFor(() => {
      expect(getSellerOldCarts).toHaveBeenCalledWith(SELLER_ID, {
        search: PRODUCT_ID,
        page: 1,
      });
    });

    // Masked customer name and last added timestamp
    expect(screen.getByText("Axxxx Sxxxx")).toBeInTheDocument();
    expect(screen.getByText(/(2026-09-28|9\/28\/2026|Sep 28, 2026)/)).toBeInTheDocument();
    expect(screen.getByText(/3 Items/i)).toBeInTheDocument();
  });

  it("calls onClose when Close button or top-right close icon is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        sellerId={SELLER_ID}
        language="en"
        onClose={handleClose}
      />,
    );

    const closeButtons = screen.getAllByRole("button", { name: /Close/i });
    expect(closeButtons.length).toBe(2); // Top-right icon button and footer button
    await user.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the backdrop overlay", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        sellerId={SELLER_ID}
        language="en"
        onClose={handleClose}
      />,
    );

    const dialog = screen.getByRole("dialog");
    await user.click(dialog);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when pressing Escape key", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        sellerId={SELLER_ID}
        language="en"
        onClose={handleClose}
      />,
    );

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when product has no active carts", async () => {
    getSellerProductCarts.mockResolvedValueOnce({
      isSuccessful: true,
      data: { items: [], meta: { total: 0, current_page: 1, last_page: 1 } },
    });

    await renderWithProviders(
      <ProductCartsModal
        productId={PRODUCT_ID}
        productName="Azure Silk Slip"
        sellerId={SELLER_ID}
        language="en"
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/No active carts found/i)).toBeInTheDocument();
    });
  });
});
