// The fallback that clears the navigation loader after the URL changes, in case
// the destination's own clearer never ran.
import { afterEach, describe, expect, it, vi } from "vitest";

import NavigationLoaderSafetyNet from "components/global/NavigationLoaderSafetyNet";

import { setRoute } from "../../mocks/nextNavigation";
import { act, renderWithProviders } from "../../render";

afterEach(() => {
  vi.useRealTimers();
});

describe("the navigation loader safety net", () => {
  it("does nothing while the URL has not changed", async () => {
    const { store } = await renderWithProviders(<NavigationLoaderSafetyNet />, {
      store: { isNavigating: true },
    });
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      store.getState().isNavigating,
      "the safety net must not clear the loader before the destination route commits",
    ).toBe(true);
  });

  it("clears the loader 800 ms after the URL changes, if nothing else did", async () => {
    const { store, rerender } = await renderWithProviders(<NavigationLoaderSafetyNet />, {
      store: { isNavigating: true },
    });
    vi.useFakeTimers();
    setRoute({ search: "sort=price" });
    rerender(<NavigationLoaderSafetyNet />);

    act(() => {
      vi.advanceTimersByTime(799);
    });
    expect(store.getState().isNavigating, "the loader must stay for the 800 ms grace time").toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      store.getState().isNavigating,
      "a query-only navigation whose own clearer never ran left the page hidden",
    ).toBe(null);
  });

  it("leaves the flag alone when the destination already cleared it", async () => {
    const { store, rerender } = await renderWithProviders(<NavigationLoaderSafetyNet />, {
      store: { isNavigating: false },
    });
    vi.useFakeTimers();
    setRoute({ pathname: "/gb-en/cart" });
    rerender(<NavigationLoaderSafetyNet />);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(store.getState().isNavigating, "an already-cleared flag must not be changed").toBe(false);
  });
});
