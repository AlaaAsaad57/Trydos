// The full-screen page loader is switched on by the link that starts a listing
// navigation, and switched off by the destination. The destination that switches
// it off is normally `ProductsInfiniteScroll`.
//
// A listing that finds nothing renders no infinite scroll at all, so nothing
// would ever switch the loader off and the shopper would sit under it. This
// component is what the empty state renders instead.
import { describe, expect, it } from "vitest";

import PageLoaderReset from "components/Listing/PageLoaderReset";
import { useAppStore } from "store";

import { renderWithProviders } from "../../render";

describe("the empty listing's page-loader reset", () => {
  it("switches the full-screen loader off when the empty state mounts", async () => {
    await renderWithProviders(<PageLoaderReset />, {
      store: { isNavigating: "filters" },
      path: "/filters/categories/shoes",
    });

    expect(
      useAppStore.getState().isNavigating,
      "a filter link that lands on zero results renders no infinite scroll, so this is the only thing left to clear the loader — leaving it set strands the shopper under a full-screen spinner",
    ).toBeNull();
  });

  it("puts nothing on the page", async () => {
    const { container } = await renderWithProviders(<PageLoaderReset />, {
      store: { isNavigating: "filters" },
    });

    expect(
      container.innerHTML,
      "the reset is an effect only — it must not add markup inside the empty state's own layout",
    ).toBe("");
  });
});
