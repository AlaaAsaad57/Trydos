// The small pieces of the product page footer: the dimmed overlay that closes
// an open tab, the "more" button and the share button.
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/react";

import ProductMoreButton from "components/Server/product/ProductFooter.tsx/ProductMoreButton";

const byPw = (pw: string) => document.querySelector(`[data-pw="${pw}"]`) as HTMLElement;

describe("the product footer's small pieces", () => {
  it("the more button opens its tab when tapped", () => {
    const setActive = vi.fn();
    render(<ProductMoreButton Active={false} setActive={setActive} />);
    fireEvent.click(byPw("ThreePointsIcon"));
    expect(setActive, "tapping more should open the more tab").toHaveBeenCalledTimes(1);
  });
});
