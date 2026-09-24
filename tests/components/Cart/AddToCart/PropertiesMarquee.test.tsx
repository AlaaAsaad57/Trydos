// The sliding tape next to the product price: "All Inclusive", "Free
// Shipping", "Free Return N Days" and the delivery date.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PropertiesMarquee from "components/Cart/AddToCart/PropertiesMarquee";

import { renderWithProviders, screen } from "../../../render";

let frames: FrameRequestCallback[] = [];
const cancel = vi.fn();

function nextFrame() {
  frames.shift()?.(0);
}

function tape() {
  return document.querySelector(
    'div[style*="absolute"]',
  ) as HTMLElement;
}

function position() {
  return parseFloat(tape().style.transform.slice("translateX(".length));
}

function setWidths(content: number, box: number) {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.style.position === "absolute" ? content : box;
    },
  );
}

describe("the tape next to the product price", () => {
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

  it("shows free shipping, free return days and a delivery date", async () => {
    await renderWithProviders(
      <PropertiesMarquee
        shipping_cost={0}
        languageVariable="en"
        shippingDays={2}
        allowReturnInDays={14}
      />,
      { store: { settings: { starting_setting: { shipping_duration_days: 1 } } } },
    );

    expect(
      screen.getByText("Free Shipping"),
      "shipping costs 0 and the tape did not say Free Shipping",
    ).toBeInTheDocument();
    expect(
      screen.getByText("14"),
      "the return days are missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ship To You Accepted/).textContent,
      "with 3 days to ship the tape must give a date, not Soon",
    ).not.toContain("Soon");
  });

  it("hides free shipping and returns, and says Soon when there are no shipping days", async () => {
    await renderWithProviders(
      <PropertiesMarquee
        shipping_cost={5}
        languageVariable="en"
        shippingDays={0}
      />,
    );

    expect(
      screen.queryByText("Free Shipping"),
      "shipping costs money and the tape said Free Shipping",
    ).toBeNull();
    expect(
      screen.queryByText(/Free Return/),
      "returns are 0 days and the tape offered a free return",
    ).toBeNull();
    expect(
      screen.getByText(/Ship To You Accepted/).textContent,
      "with no shipping days the tape must say Soon",
    ).toContain("Soon");
  });

  it("uses the country's shipping days when the shop setting is missing", async () => {
    await renderWithProviders(
      <PropertiesMarquee
        shipping_cost={5}
        languageVariable="en"
        shippingDays={undefined}
        country_shipping_days={4}
      />,
    );

    expect(
      screen.getByText(/Ship To You Accepted/).textContent,
      "the country's 4 days must give a date, not Soon",
    ).not.toContain("Soon");
  });

  it("stands still when the tape fits (right to left)", async () => {
    setWidths(100, 400);
    await renderWithProviders(
      <PropertiesMarquee shipping_cost={5} languageVariable="ar" shippingDays={0} />,
    );

    nextFrame();

    expect(tape().style.transform, "a right-to-left tape that fits must sit 50px in").toBe(
      "translateX(50px)",
    );
    expect(frames[0], "a tape that fits must stop asking for frames").toBeUndefined();
  });

  it("slides to the left end, turns, and turns again at the right end", async () => {
    // 30px wider than the box: it may go 30 + 50 = 80px left, and 20px right.
    setWidths(430, 400);
    await renderWithProviders(
      <PropertiesMarquee shipping_cost={5} languageVariable="en" shippingDays={0} />,
    );

    for (let i = 0; i < 101; i++) nextFrame();
    const leftMost = position();
    expect(leftMost <= -79.9, `the tape did not reach the left end (${leftMost})`).toBe(true);

    nextFrame();
    expect(position() > leftMost, "at the left end the tape did not turn right").toBe(true);

    for (let i = 0; i < 130; i++) nextFrame();
    const a = position();
    nextFrame();
    expect(position() < a, "at the right end the tape did not turn left").toBe(true);
  });

  it("stops the animation when it leaves the page", async () => {
    setWidths(430, 400);
    const { unmount } = await renderWithProviders(
      <PropertiesMarquee shipping_cost={5} languageVariable="en" shippingDays={0} />,
    );

    unmount();
    nextFrame();

    expect(cancel, "leaving the page did not stop the animation").toHaveBeenCalled();
    expect(frames[0], "a frame after the tape left must not ask for more").toBeUndefined();
  });
});
