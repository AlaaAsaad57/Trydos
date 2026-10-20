// One rule for "this product has sizes". The size chips, the size reviews and
// the general properties sheet all use it, so they always agree.
// This file has no imports, so server and client code can both use it.
//
// A product has sizes when:
// - no `has_sizes` / `hasSizes` flag says false, and
// - its `sizes` list holds at least one real size (a blank string does not count).
export const productHasSizes = (productData): boolean => {
  const sizes = productData?.sizes;
  return (
    productData?.has_sizes !== false &&
    productData?.hasSizes !== false &&
    Array.isArray(sizes) &&
    sizes.some((s) => (typeof s === "string" ? s.trim().length > 0 : Boolean(s)))
  );
};
