import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import ImageAvatar from "components/ListingPage/ImageAvatar";

const props = { width: 50, height: 50, isActive: false, priority: false };

describe("the round colour avatar on a product card", () => {
  it("draws the picture with its alt text and a ring in the colour it is given", () => {
    const { container } = render(
      <ImageAvatar {...props} image="https://example.com/upload/a.png" alt="Red" name="#ff0000" />,
    );
    expect(container.querySelector('img[alt="Red"]'), "the avatar picture is missing").not.toBeNull();
    expect(container.querySelector("g")?.getAttribute("stroke"), "the ring should take the colour it is given").toBe(
      "#ff0000",
    );
  });

  it("falls back to a generic alt text", () => {
    const { container } = render(<ImageAvatar {...props} image="https://example.com/a.png" alt="" name="red" />);
    expect(container.querySelector('img[alt="alt"]'), "an avatar without alt text should still carry one").not.toBeNull();
  });
});
