import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BrandItem from "components/Home/Search/Results/BrandItem";

describe("BrandItem", () => {
  it("marks the active brand and reports a tap", () => {
    const onClick = vi.fn();
    const { container } = render(<BrandItem brand={{ icon: "b.png" }} onClick={onClick} isActive />);
    expect(container.querySelector('[data-pw="IsActive"]'), "the active mark is missing").not.toBeNull();
    fireEvent.click(container.querySelector('[data-pw="brand-result"]')!);
    expect(onClick, "tapping the brand did nothing").toHaveBeenCalled();
  });

  it("shows no active mark for an inactive brand", () => {
    const { container } = render(<BrandItem brand={{ icon: "b.png" }} onClick={() => {}} isActive={false} />);
    expect(container.querySelector('[data-pw="IsActive"]'), "an inactive brand shows the active mark").toBeNull();
  });
});
