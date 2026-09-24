// A horizontal row that can be dragged with the mouse.
import { describe, expect, it, vi } from "vitest";

import HortiznalScrollBar from "components/global/HortiznalScrollBar";

import { fireEvent, renderWithProviders, screen } from "../../render";

// jsdom leaves pageX at 0 whatever the event is given, so it is set by hand.
const mouse = (target: Element, type: string, pageX = 0) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pageX", { value: pageX });
  target.dispatchEvent(event);
};

describe("the horizontal scroll bar", () => {
  it("scrolls when dragged with the mouse, and stops when the mouse is let go or leaves", async () => {
    await renderWithProviders(
      <HortiznalScrollBar id="row" dataCy="the-row">
        <span>item</span>
      </HortiznalScrollBar>,
    );
    const row = document.getElementById("row") as HTMLDivElement;

    mouse(row, "mousemove", 50);
    expect(row.scrollLeft, "moving the mouse without a press must not scroll").toBe(0);

    row.scrollLeft = 100;
    mouse(row, "mousedown", 50);
    expect(row, "a pressed row must be marked active").toHaveClass("active");

    mouse(row, "mousemove", 40);
    expect(row.scrollLeft, "dragging 10px left must scroll 30px right (three times faster)").toBe(130);

    mouse(row, "mouseup");
    expect(row, "letting go of the mouse must end the drag").not.toHaveClass("active");

    mouse(row, "mousedown", 50);
    mouse(row, "mouseleave");
    expect(row, "leaving the row must end the drag").not.toHaveClass("active");
    expect(screen.getByText("item"), "the row lost its children").toBeInTheDocument();
  });

  it("passes a click on to the caller", async () => {
    const onClick = vi.fn();
    await renderWithProviders(
      <HortiznalScrollBar id="row2" onClick={onClick}>
        <span>tap me</span>
      </HortiznalScrollBar>,
    );
    fireEvent.click(screen.getByText("tap me"));
    expect(onClick, "a click on the row must reach the caller").toHaveBeenCalled();
  });

  it("ignores a click when the caller gave no handler", async () => {
    await renderWithProviders(
      <HortiznalScrollBar id="row3" onClick={null}>
        <span>no handler</span>
      </HortiznalScrollBar>,
    );
    expect(() => fireEvent.click(screen.getByText("no handler")), "a click with no handler must not throw").not.toThrow();
  });
});
