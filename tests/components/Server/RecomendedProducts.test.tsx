// "Show More" at the end of the home recommendations row. Each tap loads the
// next seven products for the shopper; an empty page means the end, and the
// button goes away.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetNextRecommendations = vi.fn();
const showErrorMessage = vi.fn();
const LogError = vi.fn();

// The action reads the shopper from the session cookie on the server, so the
// row sends no user id (A1-8).
vi.mock("serverRequests/recommendations", () => ({
  GetNextRecommendations: (...args: any[]) => GetNextRecommendations(...args),
}));
vi.mock("components/global/AddToCartMessage", () => ({
  showErrorMessage: (...args: any[]) => showErrorMessage(...args),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));
vi.mock("components/products/ProductCard", () => ({
  default: ({ product }: any) => <div data-pw="card">{product.name}</div>,
}));

import RecomendedProducts from "components/Server/RecomendedProducts";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const renderRow = (store: Record<string, any> = { user: { id: 7 } }) =>
  renderWithProviders(
    <RecomendedProducts lang="sy-en" InitialOffset={[3]} userId={7} currency={null} />,
    { store },
  );

describe("Show More on the recommendations row", () => {
  beforeEach(() => {
    GetNextRecommendations.mockReset();
    showErrorMessage.mockReset();
    LogError.mockReset();
  });

  it("loads the next page from where the server stopped, with no user id in the call", async () => {
    GetNextRecommendations.mockResolvedValue({ items: [{ id: 1, name: "Shoe" }], offset: [10] });
    await renderRow();
    await userEvent.click(screen.getByText("Show More"));
    expect(await screen.findByText("Shoe"), "the next product should be added to the row").toBeInTheDocument();
    expect(GetNextRecommendations, "the next page must start at the server's offset, and carry no user id").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
      limit: 7,
      offset: "[3]",
    });
    expect(screen.getByText("Show More"), "more pages may follow, so the button stays").toBeInTheDocument();
  });

  it("hides the button when a page comes back empty", async () => {
    GetNextRecommendations.mockResolvedValue({ items: [], offset: [] });
    await renderRow({ user: { id: 99 } });
    await userEvent.click(screen.getByText("Show More"));
    await waitFor(() =>
      expect(screen.queryByText("Show More"), "an empty page means the end, so the button should go").toBeNull(),
    );
    expect(GetNextRecommendations.mock.calls[0][0].offset, "a different shopper should start from the first page").toBe("[]");
  });

  it("does not start a second load while one is running", async () => {
    let finish: (v: any) => void = () => {};
    GetNextRecommendations.mockReturnValue(new Promise((r) => (finish = r)));
    const { container } = await renderRow();
    const button = container.querySelector(".product-container") as HTMLElement;
    await userEvent.click(button);
    await userEvent.click(button);
    expect(GetNextRecommendations, "a second tap during a load must not load again").toHaveBeenCalledTimes(1);
    finish({ items: [], offset: [] });
  });

  it("reports a failed load to the shopper and to Sentry", async () => {
    GetNextRecommendations.mockRejectedValue(new Error("down"));
    await renderRow();
    await userEvent.click(screen.getByText("Show More"));
    await waitFor(() => expect(showErrorMessage, "the shopper should be told the load failed").toHaveBeenCalled());
    expect(LogError, "the failure should be reported").toHaveBeenCalledWith(
      expect.objectContaining({ scenario: "Error In loadMore Recomended in RecommendedProducts" }),
    );
  });

  it("BUG-server-1: after a failed load the Show More button comes back instead of spinning forever", async () => {
    GetNextRecommendations.mockRejectedValue(new Error("down"));
    await renderRow();
    await userEvent.click(screen.getByText("Show More"));
    await waitFor(() => expect(showErrorMessage).toHaveBeenCalled());
    // The message promises a retry; at the very least the shopper must be able
    // to tap again. Today `loadingMore` stays true, so the spinner never goes.
    await waitFor(
      () => expect(screen.getByText("Show More"), "the button should be usable again after a failure").toBeInTheDocument(),
      { timeout: 4000 },
    );
  });
});
