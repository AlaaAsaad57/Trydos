import ProductFeatures from "components/products/ProductFeatures";

// Cycled deterministically by label index. Applied via inline `style` (not a
// Tailwind `text-[...]` class) so the colours actually render — Tailwind's
// compiler can't see runtime-interpolated arbitrary values.
const LABEL_COLORS = ["#388CFF", "#FF641A"];

async function ProductFeaturesWrapper({ globalPromise, isRtl }) {
  let product = await globalPromise;
  let labels = product?.label_names ? JSON.parse(product?.label_names) : [];
  return (
    <ProductFeatures isRtl={isRtl}>
      {labels?.map((label, index) => (
        <div
          className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}
          key={label}
        >
          <div
            className={`${
              isRtl && "dir-rtl"
            } text-[11px] gap-[3px] flex`}
            style={{ color: LABEL_COLORS[index % LABEL_COLORS.length] }}
          >
            <span>{label}</span>
          </div>
        </div>
      ))}
    </ProductFeatures>
  );
}

export default ProductFeaturesWrapper;
