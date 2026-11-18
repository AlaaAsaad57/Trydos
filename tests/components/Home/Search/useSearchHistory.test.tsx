import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const io = vi.hoisted(() => ({
  getSearchHistory: vi.fn(),
  removeSearchHistory: vi.fn(),
  showErrorNotification: vi.fn(),
  state: { userProfile: { id: 7 } as { id: number } | undefined, user: undefined },
}));
vi.mock("store", () => ({ useAppStore: (pick: (s: unknown) => unknown) => pick(io.state) }));
vi.mock("services/search", () => ({
  default: {
    getSearchHistory: io.getSearchHistory,
    removeSearchHistory: io.removeSearchHistory,
  },
}));
vi.mock("store/notifications/reducer", () => ({ showErrorNotification: io.showErrorNotification }));
vi.mock("utils/functions", () => ({ translateFunction: (key: string) => key }));

import { useSearchHistory } from "components/Home/Search/useSearchHistory";

const openHook = async () => {
  const view = renderHook(() => useSearchHistory(true));
  await waitFor(() =>
    expect(view.result.current.searchHistory, "the words from the server were not shown").toEqual(["shoes", "bags"]),
  );
  return view;
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  io.state.userProfile = { id: 7 };
  io.getSearchHistory.mockResolvedValue(["shoes", "bags"]);
  io.removeSearchHistory.mockResolvedValue(true);
});

describe("useSearchHistory", () => {
  it("reads nothing while the search is closed, and reads the server when it opens", async () => {
    const view = renderHook(({ enabled }) => useSearchHistory(enabled), { initialProps: { enabled: false } });
    expect(io.getSearchHistory, "the history was read while the search was closed").not.toHaveBeenCalled();

    view.rerender({ enabled: true });

    await waitFor(() =>
      expect(view.result.current.searchHistory, "opening the search did not show the server's words").toEqual([
        "shoes",
        "bags",
      ]),
    );
  });

  it("asks nothing until the visitor has a user, so a first visit never meets a 401", async () => {
    io.state.userProfile = undefined;
    const view = renderHook(() => useSearchHistory(true));
    expect(io.getSearchHistory, "the history was read before the guest existed").not.toHaveBeenCalled();

    io.state.userProfile = { id: 7 };
    view.rerender();

    await waitFor(() =>
      expect(view.result.current.searchHistory, "the history was not read once the guest existed").toEqual([
        "shoes",
        "bags",
      ]),
    );
  });

  it("reads again when another user signs in, so nobody sees the last user's words", async () => {
    const view = await openHook();
    io.getSearchHistory.mockResolvedValue(["watches"]);

    io.state.userProfile = { id: 8 };
    view.rerender();

    await waitFor(() =>
      expect(view.result.current.searchHistory, "the words of the last user stayed on screen").toEqual(["watches"]),
    );
  });

  it("shows a logged word at the top at once, without closing the search", async () => {
    const { result } = await openHook();

    act(() => result.current.addHistoryWord("  Watches "));

    expect(result.current.searchHistory, "the logged word did not show on top, in the server's form").toEqual([
      "watches",
      "shoes",
      "bags",
    ]);
  });

  it("moves a word already in the list to the top instead of showing it twice", async () => {
    const { result } = await openHook();

    act(() => result.current.addHistoryWord("Bags"));

    expect(result.current.searchHistory, "a word searched again was not moved to the top once").toEqual([
      "bags",
      "shoes",
    ]);
  });

  it("keeps nothing in localStorage", async () => {
    const { result } = await openHook();

    await act(() => result.current.removeHistoryWord("shoes"));

    expect(localStorage.getItem("search-history"), "the history was written to localStorage").toBeNull();
  });

  it("removes a word from the screen and asks the server to remove it", async () => {
    const { result } = await openHook();

    await act(() => result.current.removeHistoryWord("shoes"));

    expect(result.current.searchHistory, "the removed word stayed on screen").toEqual(["bags"]);
    expect(io.removeSearchHistory, "the server was not told to remove the word").toHaveBeenCalledWith({
      term: "shoes",
    });
  });

  it("clears the screen with one call to the server", async () => {
    const { result } = await openHook();

    await act(() => result.current.clearHistory());

    expect(result.current.searchHistory, "Clear All left words on screen").toEqual([]);
    expect(io.removeSearchHistory, "Clear All was not one call for everything").toHaveBeenCalledWith({ all: true });
    expect(io.removeSearchHistory, "Clear All sent one call per word").toHaveBeenCalledOnce();
  });

  it("tells the shopper and shows the real list when the server refuses a removal", async () => {
    const { result } = await openHook();
    io.removeSearchHistory.mockResolvedValue(false);

    await act(() => result.current.removeHistoryWord("shoes"));

    expect(io.showErrorNotification, "the failed removal was hidden from the shopper").toHaveBeenCalledWith(
      "Something went wrong",
    );
    expect(result.current.searchHistory, "the word the server kept did not come back").toEqual(["shoes", "bags"]);
  });

  it("keeps the words on screen when a read fails", async () => {
    const { result } = await openHook();
    io.removeSearchHistory.mockResolvedValue(false);
    io.getSearchHistory.mockResolvedValue(null);

    await act(() => result.current.removeHistoryWord("shoes"));

    expect(result.current.searchHistory, "a failed read emptied the list").toEqual(["bags"]);
  });
});
