import { describe, expect, it, vi } from "vitest";

import CartSkeleton from "components/skeleton/CartSkeleton";

import { renderWithProviders, userEvent } from "../../render";

describe("the bag loader", () => {
  it("shows the item count when the bag has items, in the right direction for Arabic", async () => {
    await renderWithProviders(<CartSkeleton />, {
      language: "ar",
      store: { cart: [{ id: 1 }, { id: 2 }] },
    });
    expect(
      document.querySelector('[data-pw="length-ofItems"]')?.textContent,
      "the bag loader should say how many items are in the bag",
    ).toContain("2");
    expect(
      document.querySelector('[data-pw="textContainer-textOnHeader"]')?.className,
      "the title should be right-aligned in Arabic",
    ).toContain("text-right");
  });

  it("shows no item count for an empty bag, and closes the bag on back", async () => {
    const enableCart = vi.fn();
    await renderWithProviders(<CartSkeleton />, { store: { cart: [], enableCart } });
    expect(
      document.querySelector('[data-pw="length-ofItems"]'),
      "an empty bag must not show an item count",
    ).toBeNull();
    await userEvent.click(document.querySelector('[data-pw="CartBackIcon"]') as HTMLElement);
    expect(enableCart, "pressing back should close the bag").toHaveBeenCalledWith(false);
    expect(document.documentElement.style.overflow, "pressing back should let the page scroll again").toBe("initial");
  });
});
