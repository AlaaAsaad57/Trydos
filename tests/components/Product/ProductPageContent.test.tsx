// The product page body. It starts the product, price, setting and currency
// reads once, and hands the same promises to every streamed section, so a
// product page makes each request one time only.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetGlobalProduct = vi.fn();
const GetProductPriceQtyDetails = vi.fn();
const GetStarttingSetting = vi.fn();
const getCurrency = vi.fn();

vi.mock("serverRequests/product", () => ({
  GetGlobalProduct: (...args: any[]) => GetGlobalProduct(...args),
  GetProductPriceQtyDetails: (...args: any[]) => GetProductPriceQtyDetails(...args),
}));
vi.mock("serverRequests", () => ({
  GetStarttingSetting: (...args: any[]) => GetStarttingSetting(...args),
  getCurrency: (...args: any[]) => getCurrency(...args),
}));

// Every section is its own unit with its own test; here they only receive props.
vi.mock("components/products/ProductBackButton", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductPhotoSliderWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductExtendedSliderWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductNameAndBrand", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductDetailsTextWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductGeneralPropertiesWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductFeaturesWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductDescriptorsWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductColorsWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductExpectedDeleiveryWrapper", () => ({ default: () => null }));
vi.mock("components/products/FreeShippingOption", () => ({ default: () => null }));
vi.mock("components/products/FreeReturnBadge", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductStoriesWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductBuyersComment/ProductBuyersCommentsWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductSizesWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductSizeReviews", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductFAQSection/ProductFaqSectionWrapper", () => ({ default: () => null }));
vi.mock("components/Product/ProductFooter", () => ({ default: () => null }));
vi.mock("components/Server/product/RelatedProductsSection", () => ({ default: () => null }));

import ProductPageContent from "components/Product/ProductPageContent";

/** The first value of a prop with this name anywhere in the returned tree. */
function findProp(node: any, name: string): any {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findProp(child, name);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!node.props) return undefined;
  if (name in node.props) return node.props[name];
  return findProp(Object.values(node.props), name);
}

describe("the product page body", () => {
  beforeEach(() => {
    GetGlobalProduct.mockReset().mockReturnValue("global");
    GetProductPriceQtyDetails.mockReset().mockReturnValue("prices");
    GetStarttingSetting.mockReset().mockReturnValue("setting");
    getCurrency.mockReset().mockReturnValue("currency");
  });

  it("starts each read once for the product and locale, and hands the colour and size on", async () => {
    const tree = await ProductPageContent({
      params: { lang: "sy-ar", productId: "red-shoe" },
      searchParams: { color: "red", size: "M" },
    });
    expect(GetGlobalProduct, "the product must be read once for its slug and locale").toHaveBeenCalledWith({
      slug: "red-shoe",
      language: "ar",
      country: "sy",
    });
    expect(GetProductPriceQtyDetails, "the prices must be read once").toHaveBeenCalledTimes(1);
    expect(GetStarttingSetting, "the setting must be read for the locale").toHaveBeenCalledWith({ language: "ar", country: "sy" });
    expect(getCurrency, "the currency must be read for the locale").toHaveBeenCalledWith("sy", "ar");
    expect(findProp(tree, "globalPromise"), "sections should share the one product read").toBe("global");
    expect(findProp(tree, "color"), "the chosen colour should reach the sections").toBe("red");
    expect(findProp(tree, "activeSize"), "the chosen size should reach the sizes section").toBe("M");
  });

  it("works without any query values", async () => {
    const tree = await ProductPageContent({
      params: { lang: "sy-en", productId: "shoe" },
      searchParams: undefined as any,
    });
    expect(findProp(tree, "color"), "no colour should be passed when none was chosen").toBeUndefined();
  });
});
