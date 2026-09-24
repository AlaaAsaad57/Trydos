// The product like button in the footer. It likes or unlikes the product on
// the comments backend, counts the like only after the backend agrees, sends
// an analytics event, and puts the old state back when the backend refuses.
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchData = vi.fn();
const GAevent = vi.fn();
const showErrorNotification = vi.fn();
const LogError = vi.fn();

vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
  abortInFlightForLogout: vi.fn(),
}));
vi.mock("services/auth", () => ({ default: { UserID: () => 5 } }));
vi.mock("utils/gtag", () => ({ GAevent: (...args: any[]) => GAevent(...args), pageview: vi.fn() }));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

import ProductLikeButton from "components/Server/product/ProductFooter.tsx/ProductLikeButton";

import { renderWithProviders, userEvent, waitFor } from "../../../../render";

const button = () => document.querySelector('[data-pw="LoveSymbol"]') as HTMLElement;
const count = () => document.querySelector('[data-pw="CountOfLoves"]')?.textContent;
const filled = () => Boolean(document.querySelector('[data-pw="LoveClickOnLast"]'));

const renderLike = (props: Record<string, any> = {}) =>
  renderWithProviders(
    <ProductLikeButton
      total_likes={2}
      isLiked={false}
      productId={9}
      name="Shoe"
      category="Men"
      brand="Nike"
      price={10}
      brand_id={1}
      category_id={2}
      {...props}
    />,
  );

describe("the product like button", () => {
  beforeEach(() => {
    fetchData.mockReset();
    GAevent.mockReset();
    showErrorNotification.mockReset();
    LogError.mockReset();
  });

  it("likes the product on the comments backend and counts it", async () => {
    fetchData.mockResolvedValue({ success: true });
    await renderLike();
    await userEvent.click(button());
    await waitFor(() => expect(count(), "the like should be counted once the backend agrees").toBe("3"));
    expect(filled(), "the heart should be filled").toBe(true);
    expect(fetchData.mock.calls[0][0], "the like must go to the comments backend").toEqual(
      expect.objectContaining({ url: "/products/like", method: "POST", server: "comments" }),
    );
    expect(JSON.parse(fetchData.mock.calls[0][0].body), "the like must name the product and the user").toEqual({
      product_id: "9",
      user_id: "5",
    });
    expect(GAevent.mock.calls[0][0].params.action, "a like should be reported to analytics").toBe("like");
  });

  it("unlikes a liked product and counts it down", async () => {
    fetchData.mockResolvedValue({ success: true });
    await renderLike({ isLiked: true, total_likes: 1 });
    await userEvent.click(button());
    await waitFor(() => expect(count(), "no likes left should show no number").toBe(""));
    expect(filled(), "the heart should be empty").toBe(false);
    expect(fetchData.mock.calls[0][0].url, "the unlike must go to the unlike address").toBe("/products/unlike");
    expect(GAevent.mock.calls[0][0].params.action, "an unlike should be reported to analytics").toBe("dislike");
  });

  it("puts the old state back and tells the shopper when a like is refused", async () => {
    fetchData.mockResolvedValue({ success: false, message: "no" });
    await renderLike();
    await userEvent.click(button());
    await waitFor(() => expect(showErrorNotification, "the shopper should be told the like failed").toHaveBeenCalled());
    expect(filled(), "a refused like must not stay filled").toBe(false);
    expect(count(), "a refused like must not be counted").toBe("2");
    expect(LogError, "the refusal should be reported").toHaveBeenCalled();
  });

  it("puts the like back when an unlike is refused", async () => {
    fetchData.mockResolvedValue({ success: false, message: "no" });
    await renderLike({ isLiked: true });
    await userEvent.click(button());
    await waitFor(() => expect(showErrorNotification, "the shopper should be told the unlike failed").toHaveBeenCalled());
    expect(filled(), "a refused unlike must leave the heart filled").toBe(true);
  });

  it("sends one request when tapped twice during a request", async () => {
    let finish: (v: any) => void = () => {};
    fetchData.mockReturnValue(new Promise((r) => (finish = r)));
    await renderLike();
    await userEvent.click(button());
    await userEvent.click(button());
    expect(fetchData, "a second tap during a request must not send another").toHaveBeenCalledTimes(1);
    finish({ success: true });
    await waitFor(() => expect(count(), "the first like should still land").toBe("3"));
  });
});
