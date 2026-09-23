import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NavigationDemo from "components/NavigationDemo/NavigationDemo";

describe("NavigationDemo", () => {
  it("draws the twelve demo posts, the bar, and a panel that restyles the bar", () => {
    const { container } = render(<NavigationDemo />);
    expect(screen.getAllByText("seller_12").length > 0, "the last demo post is missing").toBe(true);
    const bar = container.querySelector("nav > div") as HTMLElement;
    expect(bar.style.background, "the bar did not start with the measured colour").toBe("rgba(246, 246, 246, 0.84)");
    fireEvent.click(screen.getByRole("button", { name: "Style" }));
    fireEvent.change(screen.getByLabelText("Bar colour as a hex value"), { target: { value: "#000000" } });
    expect(bar.style.background, "the panel and the bar do not share one theme").toBe("rgba(0, 0, 0, 0.84)");
  });
});
