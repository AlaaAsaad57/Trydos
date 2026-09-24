// Decides whether an intercepted route (/products, /filters) is drawn as an
// overlay over the page the shopper came from.
import { describe, expect, it, vi } from "vitest";

const scroll = vi.hoisted(() => ({
  enter: vi.fn(),
  shown: vi.fn(),
  leave: vi.fn(),
}));
vi.mock("components/ModalRoute/overlayScroll", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  enterOverlay: scroll.enter,
  markOverlayShown: scroll.shown,
  leaveOverlay: scroll.leave,
}));

import ModalSlot from "components/ModalRoute/ModalSlot";

import { setRoute } from "../../mocks/nextNavigation";
import { renderWithProviders, screen } from "../../render";

describe("the modal slot", () => {
  it("draws no overlay when the shopper landed straight on the product page", async () => {
    await renderWithProviders(
      <ModalSlot>
        <span>product overlay</span>
      </ModalSlot>,
      { path: "/products/shoe" },
    );

    expect(
      screen.queryByText("product overlay"),
      "a hard-loaded product page already sits in the page slot; an overlay copy on top can be empty and blank the page",
    ).not.toBeInTheDocument();
    expect(scroll.leave, "with no overlay the slot must hand the path to leaveOverlay").toHaveBeenCalledWith(
      "/gb-en/products/shoe",
    );
  });

  it("draws the overlay over a different base page, and removes it on the way back", async () => {
    const { rerender } = await renderWithProviders(
      <ModalSlot>
        <span>product overlay</span>
      </ModalSlot>,
      { path: "/" },
    );
    expect(screen.queryByText("product overlay"), "the home page must not show an overlay").not.toBeInTheDocument();

    setRoute({ pathname: "/gb-en/products/shoe" });
    rerender(
      <ModalSlot>
        <span>product overlay</span>
      </ModalSlot>,
    );
    expect(
      screen.getByText("product overlay"),
      "a product opened from the home page must draw as an overlay",
    ).toBeInTheDocument();
    expect(scroll.enter, "entering the overlay must save the scroll of the home page").toHaveBeenCalledWith("/gb-en");
    expect(scroll.shown, "the slot must record that a real overlay was shown").toHaveBeenCalled();

    setRoute({ pathname: "/gb-en" });
    rerender(
      <ModalSlot>
        <span>product overlay</span>
      </ModalSlot>,
    );
    expect(screen.queryByText("product overlay"), "going back home must remove the overlay").not.toBeInTheDocument();
    expect(scroll.leave, "going back must hand the home path to leaveOverlay").toHaveBeenLastCalledWith("/gb-en");
  });

  it("draws nothing when the intercept slot is empty", async () => {
    const { container, rerender } = await renderWithProviders(<ModalSlot>{null}</ModalSlot>, { path: "/" });
    setRoute({ pathname: "/gb-en/products/shoe" });
    rerender(<ModalSlot>{null}</ModalSlot>);

    expect(container.innerHTML, "an empty intercept slot must never draw an overlay").toBe("");
  });
});
