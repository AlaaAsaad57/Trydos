// The small pieces of the product page footer: the dimmed overlay that closes
// an open tab, the "more" button and the share button.
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/react";

import { OverlayForClose } from "components/Server/product/ProductFooter.tsx/OverlayForCLose";

const byPw = (pw: string) => document.querySelector(`[data-pw="${pw}"]`) as HTMLElement;

describe("the product footer's small pieces", () => {
  it("the overlay closes the open tab when tapped", () => {
    const close = vi.fn();
    render(<OverlayForClose close={close} />);
    fireEvent.click(byPw("close_extended_area"));
    expect(close, "tapping outside the open tab should close it").toHaveBeenCalledTimes(1);
  });
});
