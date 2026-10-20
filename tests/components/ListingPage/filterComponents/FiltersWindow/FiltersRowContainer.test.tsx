// One row of chips in the filter window, and the thing that turns a tap anywhere
// inside it into a change to the staged selection.
//
// The row listens once, at the top, and works out what was tapped from
// attributes on the element — rather than each chip carrying its own handler.
// That is why a chip can be nested several elements deep and still register, and
// it is why this logic is here and not in the chip.
//
// The rule that is easy to miss is the one about parents. Choosing a
// sub-category has to take the parent category off, because asking for both
// widens the set instead of narrowing it. Which values count as parents is
// written on the chip's own container, so the row reads it from there.
import { describe, expect, it, vi } from "vitest";

import FiltersRowContainer from "components/ListingPage/filterComponents/FiltersWindow/FiltersRowContainer";

import { renderWithProviders, screen, userEvent } from "../../../../render";

/** A chip, drawn the way the real ones are: the value on a nested element. */
function Chip({
  value,
  parents,
  label,
}: {
  value: string;
  parents?: string;
  label: string;
}) {
  return (
    <div data-filter="Category" data-filter-value={value} data-filter-parents={parents}>
      <span data-filter="Category" data-filter-value={value}>
        {label}
      </span>
    </div>
  );
}

async function renderRow({
  values = [] as string[],
  children,
}: {
  values?: string[];
  children: React.ReactNode;
}) {
  const setValues = vi.fn();
  await renderWithProviders(
    <FiltersRowContainer
      values={values}
      setValues={setValues}
      term="categories"
      loading={false}
    >
      {children}
    </FiltersRowContainer>,
    { path: "/filters" },
  );
  return { setValues };
}

describe("a row of filter chips", () => {
  it("stages a chip that was not chosen", async () => {
    const { setValues } = await renderRow({
      children: <Chip value="shoes" label="Shoes" />,
    });

    await userEvent.click(screen.getByText("Shoes"));

    expect(
      setValues,
      "tapping an unchosen chip is how a filter is added; there is nothing else in the window that adds one",
    ).toHaveBeenCalledWith(["shoes"]);
  });

  it("takes a chosen chip off again", async () => {
    const { setValues } = await renderRow({
      values: ["shoes", "boots"],
      children: <Chip value="shoes" label="Shoes" />,
    });

    await userEvent.click(screen.getByText("Shoes"));

    expect(
      setValues,
      "a chip is a toggle — without this the only way to drop one filter would be to reset all of them",
    ).toHaveBeenCalledWith(["boots"]);
  });

  it("registers a tap on the label inside a chip, not only on the chip itself", async () => {
    const { setValues } = await renderRow({
      children: <Chip value="shoes" label="Shoes" />,
    });

    await userEvent.click(screen.getByText("Shoes"));

    expect(
      setValues,
      "a chip is several elements deep and the shopper's finger lands on whichever is on top; a tap that only counts on the outer element misses most of them",
    ).toHaveBeenCalled();
  });

  it("ignores a tap that missed every chip", async () => {
    const { setValues } = await renderRow({
      children: (
        <>
          <span>a gap between the chips</span>
          <Chip value="shoes" label="Shoes" />
        </>
      ),
    });

    await userEvent.click(screen.getByText("a gap between the chips"));

    expect(
      setValues,
      "the row listens across its whole width, so the space between chips is inside the listening area — a tap there must change nothing",
    ).not.toHaveBeenCalled();
  });

  it("takes the parent category off when a sub-category is chosen", async () => {
    const { setValues } = await renderRow({
      values: ["shoes"],
      children: <Chip value="trainers" parents="shoes" label="Trainers" />,
    });

    await userEvent.click(screen.getByText("Trainers"));

    expect(
      setValues,
      "asking for shoes AND trainers widens the set back to all shoes, which is the opposite of what tapping a sub-category means",
    ).toHaveBeenCalledWith(["trainers"]);
  });

  it("takes both levels of parent off when a grandchild is chosen", async () => {
    const { setValues } = await renderRow({
      values: ["shoes", "trainers", "nike"],
      children: (
        <Chip value="running" parents="shoes,trainers" label="Running" />
      ),
    });

    await userEvent.click(screen.getByText("Running"));

    expect(
      setValues,
      "a chip three levels down has two parents above it, and leaving either one applied widens the set the shopper just narrowed",
    ).toHaveBeenCalledWith(["running", "nike"]);
  });

  it("leaves filters that are not its parents alone", async () => {
    const { setValues } = await renderRow({
      values: ["shoes", "boots"],
      children: <Chip value="trainers" parents="shoes" label="Trainers" />,
    });

    await userEvent.click(screen.getByText("Trainers"));

    expect(
      setValues,
      "only the values named as parents may be removed — dropping a sibling category the shopper also chose would undo a choice they never touched",
    ).toHaveBeenCalledWith(["trainers", "boots"]);
  });

  it("says which kind of filter the row is for", async () => {
    await renderRow({ children: <Chip value="shoes" label="Shoes" /> });

    expect(
      screen.getByText("Filter By Categories"),
      "the chips carry no clue about which kind of filter they are; the heading is the only thing that says it",
    ).toBeInTheDocument();
  });
});
