import { describe, expect, it, vi } from "vitest";

import BuyersCommentTopBar from "components/Server/product/ProductBuyersComment/BuyersCommentTopBar";

import { renderWithProviders, screen, userEvent } from "../../../../render";

describe("the buyers comments heading", () => {
  it("opens the buyers comments sheet when tapped", async () => {
    const setColorBottomSheet = vi.fn();
    await renderWithProviders(
      <BuyersCommentTopBar isRtl={false}>
        <span>Comments</span>
      </BuyersCommentTopBar>,
      { store: { setColorBottomSheet } },
    );
    await userEvent.click(screen.getByText("Comments"));
    expect(
      setColorBottomSheet,
      "tapping the heading should open the buyers comments sheet",
    ).toHaveBeenCalledWith({ is_buyers_comments: true });
  });
});
