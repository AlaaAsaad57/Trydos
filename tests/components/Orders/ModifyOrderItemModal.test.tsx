// The colour list inside "change one order line" (ChangeOrderItem covers the
// normal path). This file covers the list on its own when no new colour has
// been chosen yet: the ordered colour is the one marked.
import { describe, expect, it, vi } from "vitest";

import { ColorList } from "components/Orders/ModifyOrderItemModal";

import { renderWithProviders, screen } from "../../render";

describe("ColorList", () => {
  it("marks the current colour when no new colour is chosen", async () => {
    await renderWithProviders(
      <ColorList
        colors={[
          { color_name: "Red", color_option: "Red", images: ["/r.jpg"] },
          { color_name: "Blue", color_option: "Blue", images: ["/b.jpg"] },
        ]}
        setColor={vi.fn()}
        currentColor="red"
        newColor={undefined}
        sizes={[]}
        current_size={undefined}
        item={{ qty: 1 }}
        variations={[]}
      />,
    );
    expect(screen.getByText("Red").className, "the current colour is not marked").toContain("text-[#402CDD]");
    expect(screen.getByText("Blue").className, "another colour is marked").toContain("text-[#5D5C5D]");
  });
});
