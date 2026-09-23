// The page body hides while an intercepted-route overlay shows, and comes back after.
import { describe, expect, it, vi } from "vitest";

const scroll = vi.hoisted(() => ({ restore: vi.fn() }));
vi.mock("components/ModalRoute/overlayScroll", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  restoreBaseScroll: scroll.restore,
}));

import { MainContent, useOverlayVisibility } from "components/ModalRoute/OverlayVisibility";

import { act, renderWithProviders, screen } from "../../render";

let setActive: (value: boolean) => void = () => {};
function Switch() {
  setActive = useOverlayVisibility().setOverlayActive;
  return null;
}

describe("the page body under an overlay", () => {
  it("is shown with no overlay, hidden while one shows, and puts the scroll back after", async () => {
    await renderWithProviders(
      <>
        <Switch />
        <MainContent>
          <span>page body</span>
        </MainContent>
      </>,
    );
    const body = () => screen.getByText("page body").parentElement as HTMLElement;

    expect(body().style.display, "with no overlay the page body must be shown").toBe("flex");
    expect(scroll.restore, "the base scroll must be restored while no overlay shows").toHaveBeenCalled();

    scroll.restore.mockClear();
    act(() => setActive(true));
    expect(body().style.display, "while an overlay shows the page body must be hidden").toBe("none");
    expect(scroll.restore, "the scroll must not be restored while the page is still hidden").not.toHaveBeenCalled();

    act(() => setActive(false));
    expect(body().style.display, "after the overlay goes the page body must come back").toBe("flex");
    expect(scroll.restore, "after the overlay goes the base scroll must be restored").toHaveBeenCalled();
  });
});
