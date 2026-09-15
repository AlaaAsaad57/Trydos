// The category chip in the filter window. Unlike the other chips, a category can
// have children and grandchildren, and it carries them.
//
// Sub-categories are normally stacked behind the parent as a peeking cascade, to
// keep the row short. They fan out when the shopper is somewhere inside that
// branch — and "somewhere inside" means the parent OR any child OR any
// grandchild. Getting that test wrong hides the sub-category the shopper has
// actually applied behind the parent circle.
//
// The chip also has to tell the row above it which values are its parents, so the
// row can take the parent off when a child is tapped. That attribute is written
// here and read there.
import { describe, expect, it } from "vitest";

import CategoryImageCircel from "components/ListingPage/filterComponents/FiltersWindow/CategoryImageCircel";

import { renderWithProviders, screen } from "../../../../render";

const shoes = {
  slug: "shoes",
  name: "Shoes",
  childes: [
    {
      slug: "trainers",
      name: "Trainers",
      childes: [{ slug: "running", name: "Running", childes: [] }],
    },
    { slug: "boots", name: "Boots", childes: [] },
  ],
};

async function renderCategory({
  isActive = false,
  values = [] as string[],
  item = shoes,
}: Record<string, any> = {}) {
  return renderWithProviders(
    <CategoryImageCircel
      term="Category"
      name={item.name}
      value={item.slug}
      image="shoes.png"
      childes={item.childes}
      values={values}
      isActive={isActive}
    />,
    { path: "/filters" },
  );
}

/** Whether the sub-categories are fanned out rather than stacked behind. */
const subCategoriesAreFannedOut = () =>
  document
    .querySelector(".categories-sub-circles")
    ?.className.includes("no-transform") ?? false;

const chipFor = (slug: string) =>
  document.querySelector(`[data-filter-value="${slug}"]`);

describe("a category chip in the filter window", () => {
  describe("what it hands the row above it", () => {
    it("names itself as the parent of its children", async () => {
      await renderCategory();

      expect(
        chipFor("trainers")?.getAttribute("data-filter-parents"),
        "the row takes the parent off when a child is tapped, and this attribute is the only place it learns which value the parent is",
      ).toBe("shoes");
    });

    it("names both levels above a grandchild", async () => {
      await renderCategory({ values: ["trainers"] });

      expect(
        chipFor("running")?.getAttribute("data-filter-parents"),
        "a grandchild has two categories above it, and leaving either applied widens the set the shopper just narrowed",
      ).toBe("shoes,trainers");
    });
  });

  describe("when the sub-categories fan out", () => {
    it("stays stacked while the shopper is nowhere inside this branch", async () => {
      await renderCategory({ values: ["hats"] });

      expect(
        subCategoriesAreFannedOut(),
        "fanning every branch out at once makes a row too long to scroll; stacked is the resting state",
      ).toBe(false);
    });

    it("fans out when the category itself is chosen", async () => {
      await renderCategory({ isActive: true, values: ["shoes"] });

      expect(
        subCategoriesAreFannedOut(),
        "a shopper who has chosen shoes is deciding which kind of shoes next, so the choices have to be reachable",
      ).toBe(true);
    });

    it("fans out when one of its children is chosen", async () => {
      await renderCategory({ values: ["boots"] });

      expect(
        subCategoriesAreFannedOut(),
        "the applied filter is a child of this chip; leaving the branch stacked hides the very sub-category the listing is narrowed to behind the parent circle",
      ).toBe(true);
    });

    it("fans out when one of its grandchildren is chosen", async () => {
      await renderCategory({ values: ["running"] });

      expect(
        subCategoriesAreFannedOut(),
        "the check has to reach two levels down — a branch that only looks at its direct children hides an applied grandchild completely",
      ).toBe(true);
    });
  });

  describe("what the shopper sees", () => {
    it("names the category", async () => {
      await renderCategory();

      expect(
        screen.getByText("Shoes"),
        "the picture on a category circle is a product photo, not a label — the name is what identifies it",
      ).toBeInTheDocument();
    });

    it("draws a category with no children without a cascade", async () => {
      await renderCategory({
        item: { slug: "hats", name: "Hats", childes: [] },
      });

      expect(
        document.querySelector(".categories-sub-circles"),
        "an empty cascade still reserves width next to the circle, which leaves a gap in the row for a category that has nothing under it",
      ).not.toBeInTheDocument();
    });
  });
});
