// The product page pack label (components/Server/product/ProductPackInfoWrapper.tsx).
// It waits for the market qtyPriceDetails answer and shows the number of
// pieces and the sale unit, translated. It shows nothing when both are missing.
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import ProductPackInfoWrapper from "components/Server/product/ProductPackInfoWrapper";

async function renderWrapper(qty: any, language = "ar") {
  const ui = await ProductPackInfoWrapper({
    qtyPricePromise: Promise.resolve(qty),
    language,
    isRtl: language === "ar" || language === "ku",
  });
  return render(<>{ui}</>);
}

const marked = (name: string) => document.querySelector(`[data-pw="${name}"]`);

describe("the pack label on the product page", () => {
  it.each([
    ["ar", "pc", "مكون من 12 قطعة"],
    ["ar", "kg", "مكون من 12 كيلو"],
    ["tr", "gms", "İçerisinde: 12 Gram"],
    ["ku", "l", "پێکهاتووە لە 12 لیتر"],
    ["en", "kg", "Composed Of: 12 Kilo"],
  ])("in %s, 12 with the unit %s reads %s", async (language, unit, text) => {
    await renderWrapper({ count_of_pieces: 12, unit }, language);
    expect(
      marked("product-pack-info")?.textContent,
      `the ${language} label for 12 ${unit} from the market backend is wrong`,
    ).toBe(text);
  });

  it("shows the Arabic unit word alone when the count is missing", async () => {
    await renderWrapper({ count_of_pieces: null, unit: "l" }, "ar");
    expect(
      marked("product-pack-info")?.textContent,
      "a unit with no count must read 'الوحدة: لتر'",
    ).toBe("الوحدة: لتر");
  });

  it("shows nothing when the market backend sends neither field", async () => {
    const { container } = await renderWrapper({ id: 1, price: 10 });
    expect(container.innerHTML, "the page must show no pack label without the two fields").toBe("");
  });

  it("shows nothing when the qtyPriceDetails answer is missing", async () => {
    const { container } = await renderWrapper(undefined);
    expect(container.innerHTML, "a failed qtyPriceDetails load must show no pack label").toBe("");
  });
});
