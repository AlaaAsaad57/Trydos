import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CategoryItem from "components/Home/Search/Results/CategoryItem";

const ACTIVE_MARK = 'img[src="/icons/ActiveCategoryIcon.svg"]';

const parent = {
  name: "Shoes",
  slug: "shoes",
  flat_photo_path: { file_path: "s.png" },
  childes: [
    { name: "Boots", slug: "boots", most_viewed_product_thumbnail: "b.png" },
    { name: "", slug: "sandals", icon: "i.png" },
  ],
};

describe("CategoryItem", () => {
  it("expands and marks a selected child, and a child tap sends only the child", () => {
    const onClick = vi.fn();
    const { container } = render(
      <CategoryItem
        category={parent}
        onClick={onClick}
        isActive={false}
        applied_filter={{ categories: [{ slug: "boots" }] }}
      />,
    );
    const sub = container.querySelector(".categories-sub-circles")!;
    expect(sub.className, "a selected child did not expand the row").toContain("min-w-max");
    expect(sub.querySelectorAll(ACTIVE_MARK).length, "only the selected child should carry the mark").toBe(1);
    fireEvent.click(screen.getByText("Boots"));
    expect(onClick, "a child tap should send the child only").toHaveBeenCalledTimes(1);
    expect(onClick, "a child tap sent the wrong category").toHaveBeenCalledWith(parent.childes[0]);
    expect(screen.getByAltText("Image"), "a child with no name needs the fallback alt").toBeInTheDocument();
  });

  it("marks an active parent and sends it on tap", () => {
    const onClick = vi.fn();
    const { container } = render(
      <CategoryItem category={parent} onClick={onClick} isActive applied_filter={{ categories: [] }} relatedCategories={[{ slug: "x" }]} />,
    );
    expect(container.querySelector(".active-border"), "the active parent has no border").not.toBeNull();
    fireEvent.click(screen.getByText("Shoes"));
    expect(onClick, "a parent tap sent the wrong category").toHaveBeenCalledWith(parent);
  });

  it("draws a plain chip for a category with no children and no name", () => {
    const { container } = render(
      <CategoryItem category={{ slug: "x" }} onClick={() => {}} isActive={false} applied_filter={{ categories: [] }} />,
    );
    expect(container.querySelector(".categories-sub-circles"), "a childless category drew a sub-row").toBeNull();
    expect(screen.getByAltText("Image"), "a nameless category needs the fallback alt").toBeInTheDocument();
  });
});
