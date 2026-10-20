// The small pieces of the product page footer: the dimmed overlay that closes
// an open tab, the "more" button and the share button.
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render } from "@testing-library/react";

import ProductShareButton from "components/Server/product/ProductFooter.tsx/ProductShareButton";

const byPw = (pw: string) => document.querySelector(`[data-pw="${pw}"]`) as HTMLElement;

describe("the product footer's small pieces", () => {
  it("the share button shows the share count and opens its tab", () => {
    const setActive = vi.fn();
    render(<ProductShareButton Active total_shares={7} setActive={setActive} />);
    expect(byPw("CountOfShares").textContent, "the share count should be shown").toBe("7");
    expect(byPw("ShareIcon").className, "an open share tab should mark the button active").toContain("active-option");
    fireEvent.click(byPw("ShareIcon"));
    expect(setActive, "tapping share should open the share tab").toHaveBeenCalledTimes(1);
  });

  it("the share button shows no count when nothing was shared yet", () => {
    render(<ProductShareButton Active={false} total_shares={0} setActive={vi.fn()} />);
    expect(byPw("CountOfShares").textContent, "zero shares should show no number").toBe("");
  });

  it("the share button shows a big share count in short form", () => {
    render(<ProductShareButton Active={false} total_shares={1250000} setActive={vi.fn()} language="en" />);
    expect(byPw("CountOfShares").textContent, "1,250,000 shares should show as 1.2M").toBe("1.2M");
  });

  it("the share button uses the Arabic letter for a big count in Arabic", () => {
    render(<ProductShareButton Active={false} total_shares={1250} setActive={vi.fn()} language="ar" />);
    expect(byPw("CountOfShares").textContent, "1,250 shares in Arabic should show as 1.2أ").toBe("1.2أ");
  });
});
