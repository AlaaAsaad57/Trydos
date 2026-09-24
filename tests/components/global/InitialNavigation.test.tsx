// The page-ready signal: once a destination mounts, the navigation loader goes away.
import { describe, expect, it } from "vitest";

import InitialNavigation from "components/global/InitialNavigation";

import { renderWithProviders } from "../../render";

describe("the initial navigation clearer", () => {
  it("clears the in-flow loader once it mounts", async () => {
    const { store } = await renderWithProviders(<InitialNavigation />, {
      store: { isNavigating: true },
    });
    expect(
      store.getState().isNavigating,
      "the loader flag stayed on after the destination page mounted, so the page stays hidden",
    ).toBe(false);
  });
});
