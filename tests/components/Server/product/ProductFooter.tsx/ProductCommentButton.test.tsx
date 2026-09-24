// The comment button in the product footer. It shows how many comments the
// product has, opens the comment tab, and re-reads the count after the store
// says a comment was added.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetProductCommentsCount = vi.fn();
const LogError = vi.fn();

vi.mock("serverRequests/product", () => ({
  GetProductCommentsCount: (...args: any[]) => GetProductCommentsCount(...args),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

import ProductCommentButton from "components/Server/product/ProductFooter.tsx/ProductCommentButton";

import { fireEvent, renderWithProviders, waitFor } from "../../../../render";

const count = () => document.querySelector('[data-pw="CountOfComment"]')?.textContent;

describe("the product footer comment button", () => {
  beforeEach(() => {
    GetProductCommentsCount.mockReset();
    LogError.mockReset();
  });

  it("shows the count and opens the comment tab when tapped", async () => {
    const setActive = vi.fn();
    await renderWithProviders(
      <ProductCommentButton isActive={false} setActive={setActive} total_comments={3} productId={9} />,
    );
    expect(count(), "the comment count should be shown").toBe("3");
    fireEvent.click(document.querySelector('[data-pw="CommentIcon"]') as HTMLElement);
    expect(setActive, "tapping should open the comment tab").toHaveBeenCalledWith("Comment");
  });

  it("shows no number when there are no comments", async () => {
    await renderWithProviders(
      <ProductCommentButton isActive setActive={vi.fn()} total_comments={0} productId={9} />,
    );
    expect(count(), "zero comments should show no number").toBe("");
  });

  it("re-reads the count after a comment was added, and clears the flag", async () => {
    GetProductCommentsCount.mockResolvedValue({ total: 4 });
    const setShouldUpdateCommentsCount = vi.fn();
    await renderWithProviders(
      <ProductCommentButton isActive={false} setActive={vi.fn()} total_comments={3} productId={9} />,
      { store: { shouldUpdateCommentsCount: true, setShouldUpdateCommentsCount } },
    );
    await waitFor(() => expect(count(), "the new count should be shown").toBe("4"), { timeout: 4000 });
    expect(GetProductCommentsCount, "the count must be read for this product").toHaveBeenCalledWith({ productId: 9 });
    expect(setShouldUpdateCommentsCount, "the update flag should be cleared").toHaveBeenCalledWith(false);
  });

  it("reports a failed re-read and keeps the old count", async () => {
    GetProductCommentsCount.mockRejectedValue(new Error("down"));
    await renderWithProviders(
      <ProductCommentButton isActive={false} setActive={vi.fn()} total_comments={3} productId={9} />,
      { store: { shouldUpdateCommentsCount: true, setShouldUpdateCommentsCount: vi.fn() } },
    );
    await waitFor(() => expect(LogError, "a failed re-read should be reported").toHaveBeenCalled(), { timeout: 4000 });
    expect(count(), "the old count should stay").toBe("3");
  });
});
