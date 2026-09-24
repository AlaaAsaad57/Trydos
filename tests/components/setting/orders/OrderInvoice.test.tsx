// The items-and-total line of an order card (components/setting/orders/OrderInvoice.tsx).
import { describe, expect, it } from "vitest";

import OrderInvoice from "components/setting/orders/OrderInvoice";
import { renderWithProviders, screen } from "../../../render";

describe("the order invoice line", () => {
  it("shows the item count, the total and the currency", async () => {
    const { container } = await renderWithProviders(
      <OrderInvoice isRtl={false} invoice={{ items: 3, total: 80 }} />,
      { store: { currency: { symbol: "$" } } },
    );
    expect(screen.getByText("3"), "the item count is not shown").toBeInTheDocument();
    expect(screen.getByText("$"), "the currency is not shown").toBeInTheDocument();
    expect((container.firstChild as HTMLElement).className, "the line is reversed in English").toContain("flex-row");
  });

  it("reverses the line right-to-left", async () => {
    const { container } = await renderWithProviders(<OrderInvoice isRtl invoice={{ items: 1, total: 1 }} />);
    expect((container.firstChild as HTMLElement).className, "the line is not reversed right-to-left").toContain(
      "flex-row-reverse",
    );
  });
});
