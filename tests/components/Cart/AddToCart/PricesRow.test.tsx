import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PricesRow from "components/Cart/AddToCart/PricesRow";
import { isRedeemed } from "utils/luck";

vi.mock("utils/luck", () => ({
  isRedeemed: vi.fn(),
}));

vi.mock("components/Cart/AddToCart/PropertiesMarquee", () => ({
  default: ({ shipping_cost, allowReturnInDays }: any) => (
    <div data-testid="properties-marquee">
      Marquee: ship-{shipping_cost}, return-{allowReturnInDays}
    </div>
  ),
}));

describe("PricesRow component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRedeemed).mockReturnValue(false);
  });

  const baseCurrency = {
    symbol: "$",
    sumbol: "$",
    exchange_rate: 1,
  };

  const defaultProps = {
    shipping_cost: 0,
    shipping_days: 0,
    luck_price: 0,
    is_luck: false,
    currency: baseCurrency,
    language: "en",
  };

  it("renders standard single price when price equals offer_price and no luck price", () => {
    render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
      />,
    );

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("Line_1104")).toBeNull();
  });

  it("renders struck-through original price and bold offer_price when discounted", () => {
    const { container } = render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={150}
        offer_price={120}
      />,
    );

    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(container.querySelector('[data-pw="product_addtocart_svg"]')).toBeInTheDocument();
  });

  it("renders luck price with struck-through offer_price when price equals offer_price and luck applies", () => {
    vi.mocked(isRedeemed).mockReturnValue(false);

    render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
        luck_price={40}
        is_luck={true}
      />,
    );

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("renders both struck-through price and offer_price plus luck_price when price differs from offer_price", () => {
    vi.mocked(isRedeemed).mockReturnValue(false);

    render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={200}
        offer_price={160}
        luck_price={80}
        is_luck={true}
      />,
    );

    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("hides luck price when isRedeemed returns true", () => {
    vi.mocked(isRedeemed).mockReturnValue(true);

    render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
        luck_price={40}
        is_luck={true}
      />,
    );

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.queryByText("40")).toBeNull();
  });

  it("applies RTL class when language is ar", () => {
    const { container } = render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
        language="ar"
      />,
    );

    expect(container.firstChild).toHaveClass("flex-row-reverse");
  });

  it("renders PropertiesMarquee with provided return days and shipping info", () => {
    render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
        shipping_cost={10}
        shipping_days={3}
        allow_return_in_days={14}
      />,
    );

    expect(screen.getByTestId("properties-marquee")).toHaveTextContent(
      "Marquee: ship-10, return-14",
    );
  });

  it("hides bottom border svg when noBorder is true", () => {
    const { container } = render(
      <PricesRow
        {...defaultProps}
        id={101}
        price={100}
        offer_price={100}
        noBorder={true}
      />,
    );

    expect(container.querySelector("#Line_878")).toBeNull();
  });
});
