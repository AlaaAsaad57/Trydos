// The try-on chain on the product footer: VirtualTryOn (the small badge on a
// product photo) puts the product into `isModalOpen`; VirtualTryOnWrapper shows
// TryOnWidget -> TryOnModal while that key is set, and closing clears it.
import { describe, expect, it, vi } from "vitest";

import VirtualTryOn from "components/products/VirtualTryOn";
import VirtualTryOnWrapper from "components/products/VirtualTryOnWrapper";
import { useAppStore } from "store";

import { fireEvent, renderWithProviders, screen } from "../../render";

vi.mock("components/products/TryOnModal", () => ({
  default: ({ isOpen, onClose }: any) => (
    <button data-testid="try-on-modal" data-open={String(!!isOpen)} onClick={onClose}>
      close
    </button>
  ),
}));

const PRODUCT = { id: 1, images: ["/a.jpg"] };

describe("VirtualTryOn and VirtualTryOnWrapper", () => {
  it("the badge opens the modal for its product (left side in English)", async () => {
    const { container } = await renderWithProviders(<VirtualTryOn language="en" product={PRODUCT} />);
    const badge = container.querySelector(".malican-span") as HTMLElement;
    expect(badge.className, "the English badge is not on the left").toContain("left-0");
    fireEvent.click(badge);
    expect(useAppStore.getState().isModalOpen, "the badge did not store its product").toEqual(PRODUCT);
  });

  it("the badge sits on the right in Arabic", async () => {
    const { container } = await renderWithProviders(<VirtualTryOn language="ar" product={PRODUCT} />, {
      language: "ar",
    });
    expect((container.querySelector(".malican-span") as HTMLElement).className, "the Arabic badge is not on the right").toContain(
      "right-0",
    );
  });

  it("the wrapper shows nothing until a product is chosen", async () => {
    await renderWithProviders(<VirtualTryOnWrapper language="en" />, { store: { isModalOpen: false } });
    expect(screen.queryByTestId("try-on-modal"), "the modal showed with no product").not.toBeInTheDocument();
  });

  it("the wrapper opens the modal and closing it clears the product", async () => {
    await renderWithProviders(<VirtualTryOnWrapper language="en" />, { store: { isModalOpen: PRODUCT } });
    const modal = screen.getByTestId("try-on-modal");
    expect(modal.dataset.open, "the modal is not open").toBe("true");
    fireEvent.click(modal);
    expect(useAppStore.getState().isModalOpen, "closing did not clear the product").toBe(false);
    expect(screen.queryByTestId("try-on-modal"), "the modal stayed after closing").not.toBeInTheDocument();
  });
});
