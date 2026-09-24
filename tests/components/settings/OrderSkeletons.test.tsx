// The order list loading skeleton (components/settings/OrderSkeletons.tsx).
import { describe, expect, it } from "vitest";

import OrderSkeletons from "components/settings/OrderSkeletons";
import { renderWithProviders } from "../../render";

describe("the order list skeleton", () => {
  it("draws eight placeholder cards", async () => {
    const { container } = await renderWithProviders(<OrderSkeletons />);
    expect(
      container.querySelectorAll(".react-loading-skeleton").length,
      "the order list skeleton does not draw eight placeholder cards",
    ).toBe(8);
  });
});
