// Remembers the last paths the shopper visited (utils/history.ts).
import { describe, expect, it, vi } from "vitest";

const history = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock("@/utils/history", () => ({ storeLastPaths: history.store }));

import PathTracker from "components/PathTracker";

import { setRoute } from "../mocks/nextNavigation";
import { renderWithProviders } from "../render";

describe("the path tracker", () => {
  it("stores the path with its query string", async () => {
    await renderWithProviders(<PathTracker />, { path: "/cart", search: "step=2" });
    expect(history.store, "the query string was lost from the stored path").toHaveBeenCalledWith("/gb-en/cart?step=2");
  });

  it("stores the bare path when there is no query string", async () => {
    await renderWithProviders(<PathTracker />, { path: "/cart" });
    expect(history.store, "a path with no query must be stored without a trailing '?'").toHaveBeenCalledWith(
      "/gb-en/cart",
    );
  });

  it("stores nothing when there is no path yet", async () => {
    const { rerender } = await renderWithProviders(<PathTracker />);
    history.store.mockClear();
    setRoute({ pathname: "" });
    rerender(<PathTracker />);
    expect(history.store, "an empty path must not be stored").not.toHaveBeenCalled();
  });
});
