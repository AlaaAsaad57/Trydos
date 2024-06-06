import ProductDetails from "components/products/ProductDetails";
import "styles/productDetails.css";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
let product = null;
function page({ params: { productId, lang } }) {
  let slug = productId;
  return (
    <div className="product-details-container">
      <ProductDetailsSlider slug={slug} product={product} />
      <ProductFooterSection slug={slug} product={product} />
    </div>
  );
}

export default page;
