import { describe, expect, it } from "vitest";

import { render } from "@testing-library/react";

import { Skeleton } from "components/Server/Skeleton";

describe("the shared shimmer block", () => {
  it("fills its parent by default", () => {
    const { container } = render(<Skeleton />);
    const block = container.firstElementChild as HTMLElement;
    expect(block.style.width, "the default width should fill the parent").toBe("100%");
    expect(block.querySelector(".shimmer-wrapper"), "the shimmer layer is missing").not.toBeNull();
  });

  it("takes the size, corner and class it is given", () => {
    const { container } = render(
      <Skeleton width={20} height="4px" borderRadius="50%" className="rounded-full" />,
    );
    const block = container.firstElementChild as HTMLElement;
    expect(block.style.height, "the block ignored the height it was given").toBe("4px");
    expect(block.style.borderRadius, "the block ignored the corner it was given").toBe("50%");
    expect(block.className, "the block dropped the custom class").toContain("rounded-full");
  });
});
