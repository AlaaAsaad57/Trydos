// The order date card (components/settings/cards/OrderDateCard.tsx).
import { describe, expect, it } from "vitest";

import OrderDateCard from "components/settings/cards/OrderDateCard";
import { renderWithProviders, screen } from "../../../render";

describe("the order date card", () => {
  it("shows the date as day/month/year | hh:mm:ss in local time", async () => {
    await renderWithProviders(<OrderDateCard time="2030-03-04T05:06:07" />);
    expect(
      screen.getByText("04/03/2030 | 05:06:07"),
      "the order date is not shown as day/month/year | hh:mm:ss",
    ).toBeInTheDocument();
  });
});
