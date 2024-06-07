import ProductDetails from "components/products/ProductDetails";
import "styles/productDetails.css";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
import CustomNavbarServer from "components/Server/ServerCustomNav";
let product = null;
function page({ params: { productId, lang } }) {
  let slug = productId;
  return (
    <>
      <CustomNavbarServer lang={lang} />
      <div className="product-details-container">
        <ProductDetailsSlider slug={slug} product={product} />
        <ProductFooterSection slug={slug} product={product} />
      </div>
    </>
  );
}

export default page;
