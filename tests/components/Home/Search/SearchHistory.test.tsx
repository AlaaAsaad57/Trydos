import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

import SearchHistory from "components/Home/Search/SearchHistory";

/** The parent the way the search wires it: the list lives in state,
 *  deleteOption removes one entry and clearOptions removes them all. */
function Owner({ initial, setOptions }: { initial: string[]; setOptions: (s: string) => void }) {
  const [items, setItems] = useState(initial);
  return (
    <SearchHistory
      options={items}
      setOptions={setOptions}
      deleteOption={(e: string) => setItems((list) => list.filter((s) => s !== e))}
      clearOptions={() => setItems([])}
    />
  );
}

/** A mouse event at a page x position. jsdom does not take pageX as an option. */
const mouse = (el: Element, type: string, pageX = 0) => {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "pageX", { value: pageX });
  el.dispatchEvent(ev);
};

const openMenu = () => fireEvent.click(document.querySelector('[data-pw="SearchHistoryIcon"]')!);

describe("SearchHistory", () => {
  it("searches a past word from the row, skipping empty entries", async () => {
    const setOptions = vi.fn();
    const { container } = await renderWithProviders(
      <SearchHistory options={["shoes", "", "bags"]} setOptions={setOptions} deleteOption={() => {}} clearOptions={() => {}} />,
    );
    expect(container.querySelectorAll('[data-pw="search-history-option"]').length, "an empty entry was drawn").toBe(2);
    fireEvent.click(screen.getByText("bags"));
    expect(setOptions, "tapping a past word did not search it").toHaveBeenCalledWith("bags");
  });

  it("asks to remove a word from the row without searching it", async () => {
    const setOptions = vi.fn();
    const deleteOption = vi.fn();
    const { container } = await renderWithProviders(
      <SearchHistory options={["shoes", "bags"]} setOptions={setOptions} deleteOption={deleteOption} clearOptions={() => {}} />,
    );
    const close = container.querySelector('[data-pw="search-history-option"] .close-icon-container img')!;
    fireEvent.click(close);
    expect(deleteOption, "the row was not told to drop the word").toHaveBeenCalledWith("shoes");
    expect(setOptions, "removing a word also searched it").not.toHaveBeenCalled();
  });

  it("drags the row sideways with the mouse", async () => {
    const { container } = await renderWithProviders(
      <SearchHistory options={["shoes"]} setOptions={() => {}} deleteOption={() => {}} clearOptions={() => {}} />,
    );
    const slider = container.querySelector(".search-filter-options.s1") as HTMLDivElement;
    slider.scrollLeft = 100;
    mouse(slider, "mousemove", 10);
    expect(slider.scrollLeft, "the row moved without the button down").toBe(100);
    mouse(slider, "mousedown", 50);
    expect(slider.classList.contains("active"), "the row is not marked while dragging").toBe(true);
    mouse(slider, "mousemove", 40);
    expect(slider.scrollLeft, "dragging left did not scroll the row right (3x speed)").toBe(130);
    mouse(slider, "mouseup");
    expect(slider.classList.contains("active"), "releasing did not end the drag").toBe(false);
    mouse(slider, "mousedown", 50);
    mouse(slider, "mouseleave");
    expect(slider.classList.contains("active"), "leaving the row did not end the drag").toBe(false);
  });

  it("opens the full list, where a tap searches and starts the loaders", async () => {
    const setOptions = vi.fn();
    const setSearchPartialLoading = vi.fn();
    const setSearchLoading = vi.fn();
    await renderWithProviders(<SearchHistory options={["shoes", "bags"]} setOptions={setOptions} deleteOption={() => {}} clearOptions={() => {}} />, {
      store: { setSearchPartialLoading, setSearchLoading },
    });
    openMenu();
    expect(screen.getByText("Search History"), "the full list did not open").toBeInTheDocument();
    fireEvent.click(screen.getByText("shoes"));
    expect(setOptions, "a tap in the full list did not search").toHaveBeenCalledWith("shoes");
    expect(setSearchLoading, "the search loader did not start").toHaveBeenCalledWith(true);
    expect(setSearchPartialLoading, "the partial loader did not start").toHaveBeenCalledWith(true);
  });

  it("asks to remove a word in the full list without searching it", async () => {
    const setOptions = vi.fn();
    const deleteOption = vi.fn();
    const { container } = await renderWithProviders(
      <SearchHistory options={["shoes", "bags"]} setOptions={setOptions} deleteOption={deleteOption} clearOptions={() => {}} />,
    );
    openMenu();
    fireEvent.click(container.querySelector(".search-filter-menu .close-icon-container img")!);
    expect(deleteOption, "the full list did not ask to drop the word").toHaveBeenCalledWith("shoes");
    expect(setOptions, "removing a word also searched it").not.toHaveBeenCalled();
  });

  it("asks to clear everything once with Clear All, not once per word", async () => {
    const clearOptions = vi.fn();
    const deleteOption = vi.fn();
    await renderWithProviders(
      <SearchHistory
        options={["shoes", "bags"]}
        setOptions={() => {}}
        deleteOption={deleteOption}
        clearOptions={clearOptions}
      />,
    );
    openMenu();
    fireEvent.click(document.querySelector('[data-pw="clearAll"]')!);
    expect(clearOptions, "Clear All did not ask to clear the history").toHaveBeenCalled();
    expect(deleteOption, "Clear All removed the words one by one").not.toHaveBeenCalled();
  });

  // BUG-home-3: the X in the open list must reach the parent. `options` is a
  // prop, so a word the parent still holds stays on screen.
  it("BUG-home-3: removing a word in the open history list takes it off the screen", async () => {
    const { container } = await renderWithProviders(<Owner initial={["shoes", "bags"]} setOptions={() => {}} />);
    openMenu();
    fireEvent.click(container.querySelector(".search-filter-menu .close-icon-container img")!);
    expect(screen.queryByText("shoes"), "the removed word is still shown in the open list").toBeNull();
  });

  // BUG-home-4: Clear All must reach the parent, or every word stays on screen.
  it("BUG-home-4: Clear All takes every word off the screen", async () => {
    await renderWithProviders(<Owner initial={["shoes", "bags"]} setOptions={() => {}} />);
    openMenu();
    fireEvent.click(document.querySelector('[data-pw="clearAll"]')!);
    expect(screen.queryByText("shoes"), "a cleared word is still shown").toBeNull();
  });
});
