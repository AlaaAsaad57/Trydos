// The feature tape in the add-to-cart sheet ("Fast Packing", "Best Price", …).
// It slides left and right when it is wider than its box, and stands still
// when it fits.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PropertiesFeaturesInAddToCart from "components/Cart/AddToCart/ProductFeatures";

import { renderWithProviders, screen } from "../../../render";

let frames: FrameRequestCallback[] = [];
const cancel = vi.fn();

/** Run the next queued animation frame. */
function nextFrame() {
  const frame = frames.shift();
  frame?.(0);
}

function tape() {
  return screen.getByText("Fast Packing").closest('div[style*="absolute"]') as HTMLElement;
}

function setWidths(content: number, box: number) {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.style.position === "absolute" ? content : box;
    },
  );
}

describe("the feature tape in the add-to-cart sheet", () => {
  beforeEach(() => {
    frames = [];
    cancel.mockClear();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", cancel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stands still with a small left gap when the tape fits its box", async () => {
    setWidths(100, 400);
    await renderWithProviders(<PropertiesFeaturesInAddToCart />);

    nextFrame();

    expect(tape().style.transform, "a tape that fits must not slide").toBe(
      "translateX(20px)",
    );
    expect(frames[0], "a tape that fits must stop asking for frames").toBeUndefined();
  });

  it("slides left to the end, turns, slides back right, and turns again", async () => {
    // Tape 30px wider than the box: it may go 30 + 50 = 80px left.
    setWidths(430, 400);
    await renderWithProviders(<PropertiesFeaturesInAddToCart />);

    nextFrame();
    expect(tape().style.transform, "the first frame must move left").toBe(
      "translateX(-0.8px)",
    );

    // 0.8px per frame: 100 frames reach -80px, where it turns right.
    for (let i = 0; i < 100; i++) nextFrame();
    const leftMost = parseFloat(tape().style.transform.slice(11));
    expect(leftMost <= -79.9, `the tape did not reach the left end (${leftMost})`).toBe(true);

    nextFrame();
    const afterTurn = parseFloat(tape().style.transform.slice(11));
    expect(afterTurn > leftMost, "at the left end the tape did not turn right").toBe(true);

    // Back up to +20px, where it turns left again.
    for (let i = 0; i < 130; i++) nextFrame();
    nextFrame();
    const a = parseFloat(tape().style.transform.slice(11));
    nextFrame();
    const b = parseFloat(tape().style.transform.slice(11));
    expect(b < a, "at the right end the tape did not turn left again").toBe(true);
  });

  it("stops the animation when the tape leaves the page", async () => {
    setWidths(430, 400);
    const { unmount } = await renderWithProviders(
      <PropertiesFeaturesInAddToCart />,
    );

    unmount();
    nextFrame();

    expect(cancel, "leaving the page did not stop the animation").toHaveBeenCalled();
    expect(frames[0], "a frame that runs after the tape left must not ask for more").toBeUndefined();
  });
});
