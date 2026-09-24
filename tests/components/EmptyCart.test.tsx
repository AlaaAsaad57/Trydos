import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import EmptyCart from "components/Cart/EmptyCart";

describe("EmptyCart component", () => {
  it("renders empty cart illustration and text", () => {
    render(<EmptyCart />);
    expect(screen.getByText("Cart is Empty"), "Empty cart heading should render").toBeInTheDocument();
  });
});
