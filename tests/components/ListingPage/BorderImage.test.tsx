import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import BorderImage from "components/ListingPage/BorderImage";

describe("the white frame drawn over a banner", () => {
  it("fills the banner, and pulls the inner line in by half a pixel on a big banner", () => {
    const { container, rerender } = render(<BorderImage />);
    const inner = () => container.querySelectorAll("rect")[1];
    expect(inner().getAttribute("width"), "a normal banner's frame should fill it").toBe("100%");
    rerender(<BorderImage isBig />);
    expect(inner().getAttribute("width"), "a big banner's frame line should sit half a pixel inside").toBe(
      "calc(100% - 0.5px)",
    );
  });
});
