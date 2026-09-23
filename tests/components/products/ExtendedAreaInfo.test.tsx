// The panel that slides open under the product footer: comments, share or
// more options. On close it waits 300 ms for the slide before it unmounts.
import { afterEach, describe, expect, it, vi } from "vitest";

import ExtendedAreaInfo from "components/products/ExtendedAreaInfo";

import { act, renderWithProviders, screen } from "../../render";

vi.mock("components/products/CommentSection", () => ({ default: () => <div>comments panel</div> }));
vi.mock("components/products/MoreOptionsSection", () => ({ default: () => <div>more panel</div> }));
vi.mock("components/products/ShareSection", () => ({ default: () => <div>share panel</div> }));

describe("ExtendedAreaInfo", () => {
  afterEach(() => vi.useRealTimers());

  it.each([
    ["Comment", "comments panel"],
    ["More", "more panel"],
    ["shares", "share panel"],
  ])("opens the %s panel", async (option, text) => {
    await renderWithProviders(<ExtendedAreaInfo option={option} active product_data={{ id: 1 }} />);
    expect(await screen.findByText(text), `the ${option} panel did not open`).toBeInTheDocument();
  });

  it("keeps the panel for 300 ms after closing, then removes it", async () => {
    vi.useFakeTimers();
    const { rerender } = await renderWithProviders(
      <ExtendedAreaInfo option="Comment" active product_data={{ id: 1 }} />,
    );
    rerender(<ExtendedAreaInfo option="Comment" active={false} product_data={{ id: 1 }} />);
    expect(screen.getByText("comments panel"), "the panel went before the slide ended").toBeInTheDocument();
    expect(document.querySelector(".max-h-0"), "the panel did not start to close").not.toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByText("comments panel"), "the panel stayed after the slide").not.toBeInTheDocument();
  });
});
