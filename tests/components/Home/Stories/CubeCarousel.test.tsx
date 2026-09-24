import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-cube-navigation", () => ({
  default: (props: any) => (
    <div
      data-testid="cube"
      data-lock={String(props.lockScrolling)}
      data-gestures={String(props.enableGestures)}
    >
      {props.renderItem(props.index, true)}
    </div>
  ),
}));

import CubeCarousel from "components/Home/Stories/CubeCarousel";

describe("CubeCarousel", () => {
  it("locks scrolling and allows gestures by default, and renders the active slide", () => {
    render(
      <CubeCarousel
        index={2}
        onChange={() => {}}
        width={100}
        height={200}
        renderItem={(i: number) => <span>slide {i}</span>}
      />,
    );
    const cube = screen.getByTestId("cube");
    expect(cube.dataset.lock, "scrolling should lock by default").toBe("true");
    expect(cube.dataset.gestures, "gestures should be on by default").toBe("true");
    expect(screen.getByText("slide 2"), "the active slide was not rendered").toBeInTheDocument();
  });

  it("passes the caller's choices through", () => {
    render(
      <CubeCarousel
        lockScrolling={false}
        enableGestures={false}
        index={0}
        onChange={() => {}}
        width={1}
        height={1}
        renderItem={() => null}
      />,
    );
    const cube = screen.getByTestId("cube");
    expect(cube.dataset.lock, "lockScrolling=false was not passed on").toBe("false");
    expect(cube.dataset.gestures, "enableGestures=false was not passed on").toBe("false");
  });
});
