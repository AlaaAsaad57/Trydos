// The sliding step container used by the cart and orders flows (SlideWidget).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SlideWidget } from "components/global/SlideNavigation";

import { act, renderWithProviders, screen } from "../../render";

const steps = [<span key="a">step zero</span>, <span key="b">step one</span>, <span key="c">step two</span>];

const box = (text: string) => screen.getByText(text).parentElement as HTMLElement;
// While a slide runs there are two layers: the leaving one (z-10) and the
// entering one (z-20).
const leaving = () => document.querySelector(".z-10") as HTMLElement;
const entering = () => document.querySelector(".z-20") as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("the slide widget", () => {
  it("shows the current step at rest", async () => {
    await renderWithProviders(<SlideWidget step={0}>{steps}</SlideWidget>);
    expect(box("step zero"), "a step at rest must sit in place").toHaveClass("translate-x-0");
    expect(screen.queryByText("step one"), "only the current step must be drawn at rest").not.toBeInTheDocument();
  });

  it("slides forward to a higher step, then settles on it", async () => {
    const onScreen = await renderWithProviders(<SlideWidget step={0} duration={400}>{steps}</SlideWidget>);
    onScreen.rerender(<SlideWidget step={1} duration={400}>{steps}</SlideWidget>);

    expect(leaving(), "while moving forward the old step must slide out to the right").toHaveClass("translate-x-full");
    expect(leaving(), "the leaving layer must hold the old step").toHaveTextContent("step zero");
    expect(entering(), "while moving forward the entering layer must start off to the left").toHaveClass(
      "-translate-x-full",
    );
    expect(leaving().style.transitionDuration, "the slide must take the given duration").toBe("400ms");

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(box("step one"), "after the slide the new step must sit in place").toHaveClass("translate-x-0");
    expect(screen.queryByText("step zero"), "after the slide the old step must be gone").not.toBeInTheDocument();
  });

  it("slides back to a lower step in the other direction", async () => {
    const onScreen = await renderWithProviders(<SlideWidget step={1}>{steps}</SlideWidget>);
    onScreen.rerender(<SlideWidget step={0}>{steps}</SlideWidget>);

    expect(leaving(), "while moving back the old step must slide out to the left").toHaveClass("-translate-x-full");
    expect(entering(), "while moving back the entering layer must start off to the right").toHaveClass(
      "translate-x-full",
    );
    act(() => {
      vi.advanceTimersByTime(400);
    });

    onScreen.rerender(<SlideWidget step={2}>{steps}</SlideWidget>);
    expect(leaving(), "a second slide must start from the settled step").toHaveTextContent("step zero");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByText("step two"), "the second slide must end on the new step").toBeInTheDocument();
  });

  it(
    "BUG-global-2: during a slide the entering layer shows the new step",
    async () => {
      const onScreen = await renderWithProviders(<SlideWidget step={0}>{steps}</SlideWidget>);
      onScreen.rerender(<SlideWidget step={1}>{steps}</SlideWidget>);

      expect(entering(), "the layer that slides in must hold the step the caller asked for").toHaveTextContent(
        "step one",
      );
    },
  );

  it(
    "BUG-global-1: a step change that arrives during a slide runs after it, so the widget ends on the asked step",
    async () => {
      const onScreen = await renderWithProviders(<SlideWidget step={0}>{steps}</SlideWidget>);
      onScreen.rerender(<SlideWidget step={1}>{steps}</SlideWidget>);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      onScreen.rerender(<SlideWidget step={2}>{steps}</SlideWidget>);
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        screen.queryByText("step two"),
        "the caller asked for step 2, so step 2 must be on screen once the slides are done",
      ).toBeInTheDocument();
    },
  );
});
