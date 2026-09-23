// The product description. The backend sends HTML; it is cleaned before it is
// put on the page.
import { describe, expect, it } from "vitest";

import ProductDetailsText from "components/products/ProductDetailsText";

import { render } from "../../render";

describe("ProductDetailsText", () => {
  it("shows the cleaned description, right-to-left in Arabic", () => {
    const { container } = render(
      <ProductDetailsText details={'<b>Soft</b><img src=x onerror="alert(1)">'} isRtl />,
    );
    expect(container.querySelector("b")?.textContent, "the description text is missing").toBe("Soft");
    expect(container.innerHTML, "the unsafe handler was not removed").not.toContain("onerror");
    expect(container.firstElementChild!.className, "the Arabic text is not right-to-left").toContain("dir-rtl");
  });

  it("is left-to-right otherwise", () => {
    const { container } = render(<ProductDetailsText details="Soft" isRtl={false} />);
    expect(container.firstElementChild!.className, "the text is right-to-left in English").not.toContain("dir-rtl");
  });
});
