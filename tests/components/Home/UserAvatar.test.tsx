import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserAvatar from "components/Home/UserAvatar";

const DOT = "span.animate-pulse";

describe("UserAvatar", () => {
  it("shows the user's picture with the red dot and reports a tap", () => {
    const onClick = vi.fn();
    const { container } = render(<UserAvatar avatar="me.png" onClick={onClick} showIndicator />);
    expect(screen.getByAltText("user-img"), "the user's picture is missing").toBeInTheDocument();
    expect(container.querySelector(DOT), "the red dot is missing").not.toBeNull();
    fireEvent.click(container.querySelector('[data-pw="avatar-options"]')!);
    expect(onClick, "tapping the avatar did nothing").toHaveBeenCalled();
  });

  it("shows the picture without the red dot when nothing is waiting", () => {
    const { container } = render(<UserAvatar avatar="me.png" showIndicator={false} />);
    expect(container.querySelector(DOT), "the red dot shows with nothing waiting").toBeNull();
  });

  it("shows the default user icon, with the dot, when there is no picture", () => {
    const { container } = render(<UserAvatar avatar={null} showIndicator />);
    expect(container.querySelector('img[src="/icons/userIcon.svg"]'), "the default icon is missing").not.toBeNull();
    expect(container.querySelector(DOT), "the red dot is missing on the default icon").not.toBeNull();
  });

  it("shows the default user icon without the dot", () => {
    const { container } = render(<UserAvatar avatar="" showIndicator={false} />);
    expect(container.querySelector(DOT), "the red dot shows with nothing waiting").toBeNull();
  });
});
