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
  it("shows the discount already on the cart and opens itself", async () => {
    const setActive = vi.fn();
    await renderWithProviders(
      <CouponElement active={false} setActive={setActive} close={vi.fn()} />,
      { store: { coupon_discount: 15, currency: { symbol: "$", exchange_rate: 1 } } },
    );
    expect(setActive, "a cart with a discount should open the coupon box").toHaveBeenCalledWith(true);
  });

  it("does nothing when Apply is pressed with no code typed", async () => {
    await renderWithProviders(
      <CouponElement active={true} setActive={vi.fn()} close={vi.fn()} />,
      { store: { orderData: { coupon_number: "" } } },
    );
    fireEvent.click(screen.getByText("Apply"));
    expect(fetchData, "an empty code must not be sent to the core backend").not.toHaveBeenCalled();
  });

  it("does not send the code again once a discount is applied", async () => {
    const Harness = () => {
      const [active, setActive] = React.useState(false);
      return <CouponElement active={active} setActive={setActive} close={vi.fn()} />;
    };
    await renderWithProviders(
      <Harness />,
      {
        store: {
          coupon_discount: 10,
          orderData: { coupon_number: "SAVE10" },
          currency: { symbol: "$", exchange_rate: 1 },
        },
      },
    );
    await waitFor(() => {
      expect(document.querySelector(".apply-button"), "the box should open itself").not.toBeNull();
    });
    fireEvent.click(document.querySelector(".apply-button")!);
    expect(fetchData, "an applied coupon must not be applied a second time").not.toHaveBeenCalled();
  });

  it("re-applies a code saved in the browser, and clears it when the core backend says it is not valid", async () => {
    localStorage.setItem("coupon-number", "OLD5");
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      message: "Coupon expired",
      data: { status: 0 },
    });
    const setActive = vi.fn();
    await renderWithProviders(
      <CouponElement active={true} setActive={setActive} close={vi.fn()} />,
    );
    await waitFor(() => {
      expect(screen.getByText("Coupon expired"), "the core backend reason should be shown").toBeInTheDocument();
    });
    expect(fetchData, "the saved code should be sent").toHaveBeenCalledWith(
      expect.objectContaining({ url: "/coupon/apply?code=OLD5" }),
    );
    expect(setActive, "a saved code should open the coupon box").toHaveBeenCalledWith(true);
    expect(localStorage.getItem("coupon-number"), "an invalid saved code must be forgotten").toBeNull();
  });

  it("reloads the cart after a good code and starts an empty cart when the reload has none", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({ success: true, data: { status: 1, discount: 5 } });
    vi.mocked(getCart).mockImplementationOnce(async ({ callback }: any) => callback([undefined]));
    const initCart = vi.fn();
    await renderWithProviders(
      <CouponElement active={true} setActive={vi.fn()} close={vi.fn()} />,
      {
        store: {
          initCart,
          orderData: { coupon_number: "GOOD5" },
          currency: { symbol: "$", exchange_rate: 1 },
        },
      },
    );
    fireEvent.click(screen.getByText("Apply"));
    await waitFor(() => {
      expect(initCart, "an empty cart reload should start an empty cart").toHaveBeenCalledWith({ cart: [] });
    });
  });
});
