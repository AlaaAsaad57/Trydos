import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CartPriceChangeTooltip from "components/Cart/CartPriceChangeTooltip";

describe("CartPriceChangeTooltip", () => {
  it("renders with formatted prices and message in English", () => {
    render(
      <CartPriceChangeTooltip
        fromPrice="$10.00"
        toPrice="$15.00"
        language="en"
        isRtl={false}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Price changed from $10.00 to $15.00");
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <CartPriceChangeTooltip
        fromPrice="$10.00"
        toPrice="$15.00"
        language="en"
        isRtl={false}
        onClose={handleClose}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("applies RTL layout classes when isRtl is true", () => {
    const { container } = render(
      <CartPriceChangeTooltip
        fromPrice="100 ل.س"
        toPrice="150 ل.س"
        language="ar"
        isRtl={true}
      />,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("dir", "rtl");
    expect(tooltip.className).toContain("left-0");
  });
});
