// Three scroll rows on a product page — colours (ProductColors), descriptors
// (ProductDescriptors) and features (ProductFeatures). Each shows its children
// in a row that flips for right-to-left languages.
import { describe, expect, it } from "vitest";

import ProductColors from "components/products/ProductColors";
import ProductDescriptors from "components/products/ProductDescriptors";
import ProductFeatures from "components/products/ProductFeatures";

import { render, screen } from "../../render";

const ROWS = [
  ["ProductColors", ProductColors],
  ["ProductDescriptors", ProductDescriptors],
  ["ProductFeatures", ProductFeatures],
] as const;

describe("product scroll rows", () => {
  it.each(ROWS)("%s shows its children, flipped in RTL", (_name, Row: any) => {
    const { rerender } = render(
      <Row isRtl>
        <span>child</span>
      </Row>,
    );
    expect(screen.getByText("child").parentElement!.className, "the RTL row is not flipped").toContain(
      "flex-row-reverse",
    );
    rerender(
      <Row isRtl={false}>
        <span>child</span>
      </Row>,
    );
    expect(screen.getByText("child").parentElement!.className, "the LTR row is flipped").not.toContain(
      "flex-row-reverse",
    );
  });
});
