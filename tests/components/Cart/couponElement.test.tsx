import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import CouponElement from "components/Cart/couponElement";
import { renderWithProviders } from "../../render";
import { fetchData } from "utils/fetchData";
import { getCart, LogError } from "utils/functions";
import { trackOrder, ORDER_EVENTS } from "utils/orderFunnel";
import { useAppStore } from "store";

vi.mock("utils/fetchData", () => ({
  fetchData: vi.fn(),
}));

vi.mock("utils/functions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("utils/functions")>();
  return {
    ...actual,
    getCart: vi.fn(),
    LogError: vi.fn(),
  };
});

vi.mock("utils/orderFunnel", () => ({
  ORDER_EVENTS: {
    COUPON_APPLY_ATTEMPT: "coupon_apply_attempt",
    COUPON_APPLY_SUCCEEDED: "coupon_apply_succeeded",
    COUPON_APPLY_FAILED: "coupon_apply_failed",
  },
  trackOrder: vi.fn(),
}));

describe("CouponElement component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders collapsed inactive state and triggers setActive when clicked", async () => {
    const setActive = vi.fn();
    await renderWithProviders(
      <CouponElement
        active={false}
        setActive={setActive}
        close={vi.fn()}
      />,
    );

    const container = screen.getByText("I Have a Discount Coupon");
    expect(container).toBeInTheDocument();

    fireEvent.click(container);
    expect(setActive).toHaveBeenCalled();
  });

  it("renders input field and Apply button when active is true", async () => {
    await renderWithProviders(
      <CouponElement
        active={true}
        setActive={vi.fn()}
        close={vi.fn()}
      />,
    );

    expect(screen.getByText("Please Enter Coupon Information")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Coupon No")).toBeInTheDocument();
    expect(screen.getByText("Apply")).toBeInTheDocument();
  });

  it("updates store coupon_number when user types in coupon input", async () => {
    await renderWithProviders(
      <CouponElement
        active={true}
        setActive={vi.fn()}
        close={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Coupon No");
    fireEvent.change(input, { target: { value: "DISCOUNT50" } });

    expect(useAppStore.getState().orderData.coupon_number).toBe("DISCOUNT50");
  });

  it("calls close callback when input is blurred while empty", async () => {
    const close = vi.fn();
    await renderWithProviders(
      <CouponElement
        active={true}
        setActive={vi.fn()}
        close={close}
      />,
    );

    const input = screen.getByPlaceholderText("Coupon No");
    fireEvent.blur(input, { target: { value: "" } });

    expect(close).toHaveBeenCalled();
  });

  it("applies coupon successfully and updates UI and analytics", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      data: { status: 1, discount: 20 },
    });

    vi.mocked(getCart).mockResolvedValueOnce({ cart: [] } as any);

    await renderWithProviders(
      <CouponElement
        active={true}
        setActive={vi.fn()}
        close={vi.fn()}
      />,
      {
        store: {
          currency: { symbol: "$", exchange_rate: 1 },
        },
      },
    );

    const input = screen.getByPlaceholderText("Coupon No");
    fireEvent.change(input, { target: { value: "SAVE20" } });

    const applyButton = screen.getByText("Apply");
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/coupon/apply?code=SAVE20",
          method: "GET",
          server: "market",
        }),
      );
    });

    expect(trackOrder).toHaveBeenCalledWith(
      ORDER_EVENTS.COUPON_APPLY_ATTEMPT,
      { coupon_code: "SAVE20" },
    );
    expect(trackOrder).toHaveBeenCalledWith(
      ORDER_EVENTS.COUPON_APPLY_SUCCEEDED,
      { coupon_code: "SAVE20", discount_value: 20 },
    );
    expect(getCart).toHaveBeenCalled();
  });

  it("shows error and tracks failure when coupon API returns success false", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      message: "Expired coupon code",
    });

    await renderWithProviders(
      <CouponElement
        active={true}
        setActive={vi.fn()}
        close={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Coupon No");
    fireEvent.change(input, { target: { value: "INVALID" } });

    const applyButton = screen.getByText("Apply");
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText("Expired coupon code")).toBeInTheDocument();
    });

    expect(trackOrder).toHaveBeenCalledWith(
      ORDER_EVENTS.COUPON_APPLY_FAILED,
      expect.objectContaining({
        coupon_code: "INVALID",
        reason: "Expired coupon code",
      }),
    );
    expect(LogError).toHaveBeenCalled();
  });
});
