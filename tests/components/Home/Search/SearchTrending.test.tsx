import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import SearchTrending from "components/Home/Search/SearchTrending";

const trending = [
  { term: "shoes", count: 12 },
  { term: "bags", count: 3 },
];

describe("SearchTrending", () => {
  it("shows the popular words in a row and fills the search box on a tap", async () => {
    const setValue = vi.fn();
    const { container } = await renderWithProviders(
      <SearchTrending trending={trending} clearAll={() => {}} setValue={setValue} />,
    );
    expect(container.querySelector(".search-filter-options"), "the closed row of popular words is missing").not.toBeNull();
    fireEvent.click(screen.getByText("bags"));
    expect(setValue, "tapping a popular word did not fill the search box").toHaveBeenCalledWith("bags");
  });

  it("opens the full list with counts, fills on tap, and clears all", async () => {
    const setValue = vi.fn();
    const clearAll = vi.fn();
    const { container } = await renderWithProviders(
      <SearchTrending trending={trending} clearAll={clearAll} setValue={setValue} />,
      { language: "ar" },
    );
    expect(container.firstElementChild!.className, "an Arabic list must be reversed").toContain("flex-row-reverse");
    fireEvent.click(container.querySelector('img[src="/icons/SearchTrendingicon.svg"]')!);
    const menu = container.querySelector(".search-filter-menu")!;
    expect(menu, "opening did not show the full list").not.toBeNull();
    expect(menu.textContent, "the list does not show how often each word was searched").toContain("12");
    fireEvent.click(menu.querySelector('[data-pw="search-trending-option"]')!);
    expect(setValue, "tapping a word in the full list did not fill the search box").toHaveBeenCalledWith("shoes");
    fireEvent.click(container.querySelector(".clear-options-button")!);
    expect(clearAll, "Clear All did nothing").toHaveBeenCalled();
  });
});
