import ProductFeatures from "components/products/ProductFeatures";

async function ProductFeaturesWrapper({ globalPromise, isRtl }) {
  let product = await globalPromise;
  function getRandomString() {
    const strings = ["#388CFF", "#FF641A", "#388CFF"]; // your array of 3 strings
    const randomIndex = Math.floor(Math.random() * strings.length);
    return strings[randomIndex];
  }
  let labels = product?.label_names ? JSON.parse(product?.label_names) : [];
  return (
    <ProductFeatures isRtl={isRtl}>
      {labels?.map((label) => (
        <div
          className={`${isRtl ? "flex-row-reverse" : "flex-row"} gap-[2px]`}
          key={label}
        >
          <div
            className={`${
              isRtl && "dir-rtl"
            } text-[${getRandomString()}] text-[11px] gap-[3px] flex`}
          >
            <span>{label}</span>
          </div>
        </div>
      ))}
    </ProductFeatures>
  );
}

export default ProductFeaturesWrapper;
