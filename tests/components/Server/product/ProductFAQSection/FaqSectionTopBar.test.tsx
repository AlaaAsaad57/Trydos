import { describe, expect, it, vi } from "vitest";

import FaqSectionTopBar from "components/Server/product/ProductFAQSection/FaqSectionTopBar";

import { renderWithProviders, screen, userEvent } from "../../../../render";

describe("the FAQ section heading", () => {
  it("opens the FAQ sheet when tapped", async () => {
    const setColorBottomSheet = vi.fn();
    await renderWithProviders(
      <FaqSectionTopBar isRtl>
        <span>FAQ</span>
      </FaqSectionTopBar>,
      { store: { setColorBottomSheet } },
    );
    await userEvent.click(screen.getByText("FAQ"));
    expect(
      setColorBottomSheet,
      "tapping the heading should open the FAQ sheet",
    ).toHaveBeenCalledWith({ is_for_faq: true });
    expect(
      screen.getByText("FAQ").parentElement?.className,
      "the heading should align right in RTL",
    ).toContain("items-end");
  });
});
