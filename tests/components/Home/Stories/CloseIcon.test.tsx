import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CloseIcon from "components/Home/Stories/CloseIcon";

describe("CloseIcon", () => {
  it("calls close when tapped", () => {
    const close = vi.fn();
    const { container } = render(<CloseIcon close={close} />);
    fireEvent.click(container.querySelector('[data-pw="close_stories_icon"]')!);
    expect(close, "tapping the icon did not close the stories").toHaveBeenCalledTimes(1);
  });
});
