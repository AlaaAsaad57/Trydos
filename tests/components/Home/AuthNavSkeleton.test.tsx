import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthNavSkeleton from "components/Home/AuthNavSkeleton";

describe("AuthNavSkeleton", () => {
  it("draws a hidden placeholder in the real navigation container", () => {
    const { container } = render(<AuthNavSkeleton />);
    const root = container.querySelector('[data-pw="auth-nav-skeleton"]');
    expect(root, "the skeleton container is missing").not.toBeNull();
    expect(root!.className, "the skeleton must reuse the real container class").toContain("user-nav-container");
    expect(root!.getAttribute("aria-hidden"), "the skeleton must be hidden from screen readers").toBe("true");
    expect(root!.querySelector(".animate-pulse"), "the skeleton has no pulsing blocks").not.toBeNull();
  });
});
