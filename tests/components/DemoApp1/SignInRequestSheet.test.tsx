import React from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignInRequestSheet from "components/DemoApp1/screens/SignInRequestSheet";
import { textBottom } from "components/DemoApp1/demo1Layout";

// jsdom has no ResizeObserver; the card watches its own height with one.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ObserverStub);

// jsdom has no layout, so a real Embla finds no slides.
vi.mock("embla-carousel-react", () => ({
  default: () => [
    () => {},
    { selectedScrollSnap: () => 0, on() {}, off() {}, scrollTo() {} },
  ],
}));

// The sheet reads its words through the shell; the key is the English text.
vi.mock("components/DemoApp1/Demo1Shell", () => ({
  useDemoNav: () => ({ t: (key: string) => key }),
}));

/*
  The demo's sign-in request (XD `Sign In request`). The file keeps 35 px of
  white under "Later, take a look at the app", to the SCREEN's end, where the
  file has the home bar.

  The bug (2026-11-19, the client's iPhone video): in iPhone Safari 26 the
  window ends above Safari's floating bar, and the bar and the room under it
  already take about 98 px. The file's 35 px stood on top of that, so about
  130 px of white lay under "Later", and the sheet sat about 74 px higher than the
  file (its top at y 211, not 285). The fix: in iPhone Safari 26 the white
  under "Later" goes, as in the address and delivery sheets; everywhere else
  the file's 35 px stay.
*/

const SAFARI_26 =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";

/** The file's white under "Later": from the line's box to the artboard's end. */
const FILE_GAP = 932 - textBottom(893, 14);

const agent =
  Object.getOwnPropertyDescriptor(navigator, "userAgent") ??
  Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");

afterEach(() => {
  if (agent) Object.defineProperty(navigator, "userAgent", agent);
  else delete (navigator as unknown as Record<string, unknown>).userAgent;
});

const openSheet = () =>
  render(<SignInRequestSheet open onClose={() => {}} onStart={() => {}} />);

const whiteUnderLater = () => {
  const end = document.body.querySelector<HTMLElement>('[data-pw="demo-sign-in-request-end"]');
  expect(end, 'the white block under "Later" is missing from the sign-in request').not.toBeNull();
  return end!.style;
};

describe("Demo sign-in request: the white under \"Later\"", () => {
  it("keeps the file's white under \"Later\" outside iPhone Safari", () => {
    const { unmount } = openSheet();
    const end = whiteUnderLater();
    expect(
      end.flexBasis,
      `outside iPhone Safari the sign-in request does not keep the file's ${FILE_GAP} px under "Later"`,
    ).toBe(`${FILE_GAP}px`);
    unmount();
  });

  it("drops the white under \"Later\" in iPhone Safari 26, where Safari's bar already takes that room", () => {
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: SAFARI_26 });
    const { unmount } = openSheet();
    const end = whiteUnderLater();
    expect(
      end.flexBasis,
      `in iPhone Safari 26 the sign-in request still keeps white under "Later" (flex-basis ${end.flexBasis}), so the sheet sits higher than the file`,
    ).toBe("0px");
    expect(
      end.minHeight,
      `in iPhone Safari 26 the sign-in request keeps a least white under "Later" (min-height ${end.minHeight}), so the sheet sits higher than the file`,
    ).toBe("0px");
    unmount();
  });
});
