// The order invoice card (components/settings/cards/OrderInvoiceCard.tsx).
//
// It shows the order total in the shop currency and a small icon for the
// payment method.
import { describe, expect, it } from "vitest";

import OrderInvoiceCard from "components/settings/cards/OrderInvoiceCard";
import { renderWithProviders } from "../../../render";

const amount = () => document.querySelector('[data-pw="order-amount"]')!.textContent;
const icon = () => document.querySelector(".absolute img")?.getAttribute("src") ?? null;

describe("the order invoice card", () => {
  it("shows the total with the currency symbol", async () => {
    await renderWithProviders(<OrderInvoiceCard amount={80} payments={null} />, {
      store: { currency: { symbol: "$", exchange_rate: 1 } },
    });
    expect(amount(), "the order total or its currency is not shown").toContain("$");
    expect(icon(), "an unknown payment method still showed an icon").toBeNull();
  });

  it.each([
    ["cash_on_delivery", "/icons/WalletIcon.svg"],
    ["trydos_wallet", "/icons/WalletIcon.svg"],
    ["rdb", "/icons/WalletIcon.svg"],
    ["crypto", "/icons/CryptoIcon.svg"],
  ])("shows the right icon for %s", async (value, src) => {
    await renderWithProviders(<OrderInvoiceCard amount={1} payments={{ value, label: value }} />);
    expect(icon(), `the ${value} payment did not show its icon`).toBe(src);
  });
});
