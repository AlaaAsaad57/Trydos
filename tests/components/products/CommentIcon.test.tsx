// The comment icon in the product footer.
import { describe, expect, it } from "vitest";

import CommentIcon from "components/products/CommentIcon";

import { render } from "../../render";

describe("CommentIcon", () => {
  it("shows the comment icon", () => {
    const { container } = render(<CommentIcon active />);
    expect(container.querySelector("img")!.getAttribute("src"), "the comment icon is wrong").toBe(
      "/icons/ActiveComment.svg",
    );
  });
});
