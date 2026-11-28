import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignInSlides from "components/DemoApp1/screens/SignInSlides";
import { PREVIEW_SLIDES } from "NewLoginDesign/previewSlides";

// jsdom has no ResizeObserver; the card watches its own height with one.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ObserverStub);

// jsdom has no layout, so a real Embla finds no slides. The card only needs
// "which slide is on show" and the select event.
vi.mock("embla-carousel-react", () => ({
  default: () => [
    () => {},
    { selectedScrollSnap: () => 0, on() {}, off() {}, scrollTo() {} },
  ],
}));

// The card reads its words through the shell; the key is the English text.
vi.mock("components/DemoApp1/Demo1Shell", () => ({
  useDemoNav: () => ({ t: (key: string) => key }),
}));

/*
  The sign-in request's card (XD `Sign In request`): one bordered card per
  slide, the quick preview's slides.

  The bug (2026-11-19): at a browser zoom under 100 % (a device pixel ratio
  of 0.8) the bottom and right lines of the card were gone, and at 125 % they
  were faint. The line was a 0.5 px SVG stroke laid over the card and clipped
  to the card's edge; when 0.5 px is less than one screen pixel, the clip cut
  the whole line away. A CSS border is part of the box: the browser draws it
  at least one screen pixel wide, so no clip can remove it. Measured with
  C:/Users/DELL/xd-parity/slideedge.cjs.
*/

describe("Sign-in request card", () => {
  it("draws each slide's purple line as its own CSS border, which no clip can cut", () => {
    const { container } = render(<SignInSlides mt={0} />);
    const slides = container.querySelectorAll<HTMLElement>(
      "[data-pw=demo-sign-in-request-card] [data-pw=demo-sign-in-request-slide]",
    );

    PREVIEW_SLIDES.forEach((slide, i) => {
      const card = slides[i];
      expect(card, `slide "${slide.titleKey}" has no card`).toBeTruthy();
      expect(
        card.style.border,
        `slide "${slide.titleKey}" draws no 0.5 px purple border on its own box`,
      ).toBe("0.5px solid rgb(74, 49, 231)");
      expect(
        card.querySelector("svg[data-stroke]"),
        `slide "${slide.titleKey}" still lays an SVG line over its edge, which a zoom under 100 % clips away`,
      ).toBeNull();
    });
  });
});
