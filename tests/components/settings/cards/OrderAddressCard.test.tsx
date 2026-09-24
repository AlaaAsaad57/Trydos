// The shipping address card on the order details page
// (components/settings/cards/OrderAddressCard.tsx).
import { describe, expect, it } from "vitest";

import OrderAddressCard from "components/settings/cards/OrderAddressCard";
import { buildAddress } from "../../../fixtures/address";
import { renderWithProviders, screen } from "../../../render";

describe("the shipping address card", () => {
  it("shows the address type, recipient and phone", async () => {
    await renderWithProviders(<OrderAddressCard address={buildAddress()} />);
    expect(screen.getByText("home"), "the address type is not shown").toBeInTheDocument();
    expect(screen.getByText("Test User"), "the recipient is not shown").toBeInTheDocument();
    expect(screen.getByText("+10000000000"), "the recipient phone is not shown").toBeInTheDocument();
  });

  it("aligns every line to the right in Arabic", async () => {
    await renderWithProviders(<OrderAddressCard address={buildAddress()} />, { language: "ar" });
    expect(screen.getByText("Test User").className, "the recipient is not right-aligned in Arabic").toContain("text-right");
  });
});
