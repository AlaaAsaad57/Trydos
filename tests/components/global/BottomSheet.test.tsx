// The sheet that slides up from the bottom of the screen. It can be closed by
// the backdrop, by Escape, or by dragging it down far enough.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({ disable: vi.fn(), enable: vi.fn() }));
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DisableScroll: spies.disable,
  EnableScroll: spies.enable,
}));
vi.mock("components/products/AddToCartButton", () => ({
  default: () => <button>add to cart</button>,
}));

import BottomSheet from "components/global/BottomSheet";

import { act, fireEvent, renderWithProviders, screen } from "../../render";

// jsdom's window is 768px tall, so the sheet is pushed 80% of that when hidden.
const MAX_DRAG = window.innerHeight * 0.8;

const sheet = () => screen.getByText("sheet body").parentElement as HTMLElement;
const handle = () => sheet().firstElementChild as HTMLElement;
const button = () => document.getElementById("bottom-sheet-button") as HTMLElement;

beforeEach(() => {
  spies.disable.mockClear();
  spies.enable.mockClear();
  // The sheet moves inside animation frames; run them at once so a test can
  // read the result.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const open = async (props: Record<string, any> = {}) => {
  const onClose = vi.fn();
  const result = await renderWithProviders(
    <BottomSheet isOpen onClose={onClose} {...props}>
      <span>sheet body</span>
    </BottomSheet>,
  );
  return { onClose, ...result };
};

describe("the bottom sheet", () => {
  it("slides into view when open, locks the page scroll, and unlocks it when removed", async () => {
    const { unmount } = await open();

    expect(sheet().style.transform, "an open sheet must slide to the top of its path").toBe("translateY(0)");
    expect(button().style.transform, "the button bar must slide in with the sheet").toBe("translateY(0)");
    expect(spies.disable, "the page behind an open sheet must not scroll").toHaveBeenCalledWith(true);

    unmount();
    expect(spies.enable, "the page scroll must come back when the sheet goes").toHaveBeenCalled();
  });

  it("stays pushed down when closed", async () => {
    await renderWithProviders(
      <BottomSheet isOpen={false} onClose={vi.fn()} noPadding noScroll height={40}>
        <span>sheet body</span>
      </BottomSheet>,
    );

    expect(sheet().style.transform, "a closed sheet must sit below the screen").toBe(`translateY(${MAX_DRAG}px)`);
    expect(sheet().style.maxHeight, "the sheet must take the height it was given").toBe("40dvh");
    expect(sheet(), "a no-scroll sheet must hide its overflow").toHaveClass("overflow-y-hidden");
  });

  it("shows the add-to-cart button on the product page", async () => {
    await open({ fromProductPage: true });
    expect(screen.getByText("add to cart"), "the product page sheet must carry the add-to-cart button").toBeInTheDocument();
  });

  it("closes 400 ms after Escape, and ignores other keys", async () => {
    const { onClose } = await open();

    fireEvent.keyDown(window, { key: "Enter" });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "a key other than Escape must not close the sheet").not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(sheet().style.transform, "Escape must slide the sheet off the screen").toBe("translateY(100vh)");
    expect(button().style.transform, "Escape must slide the button bar down too").toBe("translateY(calc(100vh - 63px))");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "the sheet must report it closed once the slide ends").toHaveBeenCalledTimes(1);
  });

  it("closes on a click on the backdrop or the empty area, but not on its content", async () => {
    const { onClose } = await open();

    fireEvent.click(screen.getByText("sheet body"));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "a click inside the sheet must not close it").not.toHaveBeenCalled();

    fireEvent.click(document.querySelector(".bg-black\\/50") as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "a click on the dark backdrop must close the sheet").toHaveBeenCalledTimes(1);

    fireEvent.click(button().parentElement as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "a click on the empty area above the sheet must close it").toHaveBeenCalledTimes(2);
  });

  it("closes when dragged down with the mouse past 80px", async () => {
    const { onClose } = await open();

    fireEvent.mouseDown(handle(), { clientY: 100 });
    expect(sheet().style.transition, "the sheet must follow the finger with no delay while dragged").toBe("none");
    expect(handle(), "the handle must show the grabbing cursor while dragged").toHaveClass("cursor-grabbing");

    fireEvent.mouseMove(document, { clientY: 300 });
    expect(sheet().style.transform, "the sheet must move with the mouse").toBe("translateY(200px)");
    expect(button().style.transform, "the button bar must move with the sheet").toBe("translateY(200px)");

    fireEvent.mouseUp(document);
    expect(sheet().style.transform, "a long drag must push the sheet off the screen").toBe(`translateY(${MAX_DRAG}px)`);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onClose, "a long drag must close the sheet").toHaveBeenCalledTimes(1);
  });

  it("springs back when dragged down by touch less than 80px", async () => {
    const { onClose } = await open();

    fireEvent.touchStart(handle(), { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(document, { touches: [{ clientY: 130 }] });
    expect(sheet().style.transform, "the sheet must follow the finger").toBe("translateY(30px)");

    fireEvent.touchEnd(document);
    expect(sheet().style.transform, "a short drag must put the sheet back").toBe("translateY(0)");
    expect(button().style.transform, "a short drag must put the button bar back").toBe("translateY(0px)");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onClose, "a short drag must not close the sheet").not.toHaveBeenCalled();
  });

  it("never moves further than 80% of the screen, nor above its start", async () => {
    await open();

    fireEvent.mouseDown(handle(), { clientY: 500 });
    fireEvent.mouseMove(document, { clientY: 100 });
    expect(sheet().style.transform, "dragging up must not lift the sheet above its start").toBe("translateY(0px)");

    fireEvent.mouseMove(document, { clientY: 5000 });
    expect(sheet().style.transform, "dragging far down must stop at 80% of the screen").toBe(`translateY(${MAX_DRAG}px)`);
  });
});
