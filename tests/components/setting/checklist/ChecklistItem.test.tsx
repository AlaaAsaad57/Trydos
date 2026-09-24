// One checklist row (components/setting/checklist/ChecklistItem.tsx).
//
// The remove button works by click and by Enter or Space, and never lets the
// tap reach the product link under it.
import { describe, expect, it, vi } from "vitest";

import ChecklistItem from "components/setting/checklist/ChecklistItem";
import { fireEvent, renderWithProviders } from "../../../render";

const ITEM = { id: 5, name: "Saved product", slug: "saved-product", image: "" } as any;
const removeButton = () =>
  document.querySelector('[data-pw="checklist-item-delete"]') as HTMLElement;

describe("a checklist row", () => {
  it.each(["Enter", " "])("removes the product with the %j key", async (key) => {
    const onRemove = vi.fn();
    await renderWithProviders(
      <ChecklistItem item={ITEM} local="sy-en" language="en" isRtl isRemoving={false} onRemove={onRemove} />,
    );
    fireEvent.keyDown(removeButton(), { key });
    expect(onRemove, `the ${JSON.stringify(key)} key did not remove the product`).toHaveBeenCalledWith("5");
  });

  it("ignores other keys, and dims the row while it is being removed", async () => {
    const onRemove = vi.fn();
    await renderWithProviders(
      <ChecklistItem item={ITEM} local="sy-en" language="en" isRtl={false} isRemoving onRemove={onRemove} />,
    );
    fireEvent.keyDown(removeButton(), { key: "a" });
    expect(onRemove, "another key removed the product").not.toHaveBeenCalled();
    expect(
      (document.querySelector('[data-pw="checklist-item"]') as HTMLElement).className,
      "the row is not dimmed while it is being removed",
    ).toContain("opacity-50");
  });
});
