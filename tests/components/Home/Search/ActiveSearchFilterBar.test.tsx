import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("components/global/HortiznalScrollBar", () => ({
  default: ({ children, className }: any) => (
    <div data-testid="bar" className={className}>
      {children}
    </div>
  ),
}));

import ActiveSearchFilterBar from "components/Home/Search/ActiveSearchFilterBar";

const none = { categories: [], brands: [], boutiques: [] };
const titles = () => Array.from(document.querySelectorAll(".filter-bar-main-title")).map((e) => e.textContent);
const iconSrcs = () => Array.from(document.querySelectorAll(".main-category-icon img")).map((e) => e.getAttribute("src"));

describe("ActiveSearchFilterBar", () => {
  it("draws nothing with no filter and no search word", () => {
    const { container } = render(<ActiveSearchFilterBar value="" appliedFilters={none} reset={() => {}} />);
    expect(container.innerHTML, "an empty filter bar was drawn").toBe("");
  });

  it("shows the search word and clears everything from the X", () => {
    const reset = vi.fn();
    render(<ActiveSearchFilterBar value="red shoe" appliedFilters={none} reset={reset} />);
    expect(titles(), "the search word is not shown").toEqual(["red shoe"]);
    fireEvent.click(document.querySelector('[data-pw="closeIcon"]')!);
    expect(reset, "the X did not clear the filters").toHaveBeenCalled();
  });

  it("shows each category with the best picture it has, and its sub-categories", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{
          ...none,
          categories: [
            { slug: "a", name: "Icon cat", icon: { file_path: "a.png" } },
            { slug: "b", name: "Thumb cat", most_viewed_product_thumbnail: "b.png" },
            {
              slug: "c",
              name: "Flat cat",
              flat_photo_path: { file_path: "c.png" },
              categories_sub: [
                { slug: "c1", name: "Sub one", icon: { file_path: "c1.png" } },
                { slug: "x", name: "" },
              ],
            },
            { slug: "x", name: "Sub by lookup", icon: { file_path: "x.png" } },
          ],
        }}
      />,
    );
    expect(titles(), "the category names are wrong").toEqual(["Icon cat", "Thumb cat", "Flat cat", "Sub one", "Sub by lookup", "Sub by lookup"]);
    const srcs = iconSrcs();
    expect(srcs[0], "the category icon was not used").toContain("a.png");
    expect(srcs[1], "the thumbnail was not used").toContain("b.png");
    expect(srcs[2], "the flat photo was not used").toContain("c.png");
    const subSrcs = Array.from(document.querySelectorAll(".sub-category-icon img")).map((e) => e.getAttribute("src"));
    expect(subSrcs[0], "the sub-category icon was not used").toContain("c1.png");
    expect(subSrcs[1], "a sub-category with no icon did not borrow the matching category's").toContain("x.png");
  });

  it("borrows a thumbnail from the category's child list when the category has no picture", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{
          ...none,
          categories: [{ slug: "p", name: "", childes: [{ slug: "p", name: "Child", most_viewed_product_thumbnail: "k.png" }] }],
        }}
      />,
    );
    expect(titles(), "a nameless category did not borrow its child's name").toEqual(["Child"]);
    expect(iconSrcs()[0], "a pictureless category did not borrow its child's thumbnail").toContain("k.png");
  });

  it("skips a category, a boutique and a brand that have no name anywhere", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{
          categories: [{ slug: "q" }],
          boutiques: [{ slug: "b" }],
          brands: [{ slug: "r" }],
        }}
      />,
    );
    expect(titles(), "a nameless chip was drawn").toEqual([]);
  });

  it("shows boutiques and brands, borrowing a brand's name and icon from its twin by slug", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{
          categories: [],
          boutiques: [{ slug: "m", name: "Mona", banner: { file_path: "m.png" } }],
          brands: [
            { slug: "n", name: "Nike", icon: { file_path: "n.png" } },
            { slug: "n2", name: "Adidas" },
          ],
        }}
      />,
    );
    expect(titles(), "the boutique and brand names are wrong").toEqual(["Mona", "Nike", "Adidas"]);
    expect(iconSrcs()[0], "the boutique banner was not used").toContain("m.png");
    expect(iconSrcs()[1], "the brand icon was not used").toContain("n.png");
  });

  it("names a duplicate brand chip after the first brand with the same slug", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{ categories: [], boutiques: [], brands: [{ slug: "z", name: "Zed" }, { slug: "z" }] }}
      />,
    );
    expect(titles(), "the nameless duplicate did not borrow the name").toEqual(["Zed", "Zed"]);
  });

  // BUG-home-2: ActiveSearchFilterBar.tsx:15-27 — `getCategory(slug)` walks
  // every child of every category and assigns each one to `variable`; the
  // `return sub` inside `.map` returns from the map callback, not from
  // getCategory. So it always hands back the LAST child it saw, whatever the
  // slug. A nameless chip then shows another category's name.
  it("BUG-home-2: a nameless category chip shows the name of its own sub-category", () => {
    render(
      <ActiveSearchFilterBar
        value=""
        reset={() => {}}
        appliedFilters={{
          ...none,
          categories: [
            { slug: "shoes", name: "Shoes", childes: [{ slug: "boots", name: "Boots" }, { slug: "sandals", name: "Sandals" }] },
            { slug: "boots" },
          ],
        }}
      />,
    );
    expect(titles(), "the chip for 'boots' must be named Boots, not the last child").toEqual(["Shoes", "Boots"]);
  });
});
