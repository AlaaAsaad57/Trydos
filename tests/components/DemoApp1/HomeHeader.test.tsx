import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeHeader } from "components/DemoApp1/screens/HomeHeader";

const chips = [
  { key: "men", label: "Men", picked: false, href: "/sy-en/categories/men" },
  { key: "women", label: "Women", picked: true, href: "/sy-en/categories/women" },
];

describe("HomeHeader (XD Home Page)", () => {
  it("links the search mark to the search page when it has an address", () => {
    render(<HomeHeader searchLabel="Search" searchHref="/sy-en/search" chips={[]} />);
    expect(
      screen.getByRole("link", { name: "Search" }).getAttribute("href"),
      "the search mark must open /sy-en/search",
    ).toBe("/sy-en/search");
  });

  it("calls its action from the search mark when it has no address (/demo)", () => {
    const onSearch = vi.fn();
    render(<HomeHeader searchLabel="Search" onSearch={onSearch} chips={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch, "a tap on the search mark did nothing").toHaveBeenCalled();
  });

  it("links each chip to its category's page (S7-4)", () => {
    render(<HomeHeader searchLabel="Search" searchHref="/s" chips={chips} />);
    expect(
      screen.getByRole("link", { name: "Men" }).getAttribute("href"),
      "the Men chip must open /sy-en/categories/men",
    ).toBe("/sy-en/categories/men");
  });

  it("marks the picked chip as the current page", () => {
    render(<HomeHeader searchLabel="Search" searchHref="/s" chips={chips} />);
    expect(
      screen.getByRole("link", { name: "Women" }).getAttribute("aria-current"),
      "the picked chip must say it is the current page",
    ).toBe("page");
  });

  it("does not mark a chip that is not picked", () => {
    render(<HomeHeader searchLabel="Search" searchHref="/s" chips={chips} />);
    expect(
      screen.getByRole("link", { name: "Men" }).getAttribute("aria-current"),
      "a chip that is not picked must not say it is the current page",
    ).toBeNull();
  });

  it("tells its owner which chip was tapped when the chips are buttons (/demo)", () => {
    const onPick = vi.fn();
    render(
      <HomeHeader
        searchLabel="Search"
        onSearch={() => {}}
        chips={[{ key: "Man", label: "Man", picked: true }]}
        onPick={onPick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Man" }));
    expect(onPick, "a tap on the Man chip did not report its key").toHaveBeenCalledWith("Man");
  });

  it("places the mark and the chip row from the start edge, so Arabic mirrors them (A-13)", () => {
    render(<HomeHeader searchLabel="Search" searchHref="/s" chips={chips} />);
    const mark = screen.getByRole("link", { name: "Search" });
    const row = document.querySelector('[data-pw="demo-home-chips"]') as HTMLElement;
    expect(
      [mark.style.marginLeft, mark.style.marginInlineStart, row.style.marginLeft],
      "the mark and the chip row must use start-edge margins, not left margins",
    ).toEqual(["", "7.5px", ""]);
  });
});
