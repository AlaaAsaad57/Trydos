import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BoutiqueItem from "components/Home/Search/Results/BoutiqueItem";

const ACTIVE_MARK = 'img[src="/icons/ActiveCategoryIcon.svg"]';

describe("BoutiqueItem", () => {
  it("marks the active boutique and reports a tap", () => {
    const onClick = vi.fn();
    const { container } = render(
      <BoutiqueItem boutique={{ banner: { file_path: "x.png" } }} onClick={onClick} isActive />,
    );
    expect(container.querySelector(ACTIVE_MARK), "the active mark is missing").not.toBeNull();
    fireEvent.click(container.querySelector('[data-pw="boutique-result"]')!);
    expect(onClick, "tapping the boutique did nothing").toHaveBeenCalled();
  });

  it("shows only the banner for an inactive boutique", () => {
    const { container } = render(<BoutiqueItem boutique={{}} onClick={() => {}} isActive={false} />);
    expect(container.querySelector(ACTIVE_MARK), "an inactive boutique shows the active mark").toBeNull();
  });
});
