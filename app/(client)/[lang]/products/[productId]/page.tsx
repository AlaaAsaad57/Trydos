import "styles/productDetails.css";
import ProductDetailsSlider from "components/products/ProductDetailsSlider";
import ProductFooterSection from "components/products/ProductFooterSection";
import CustomNavbarServer from "components/Server/ServerCustomNav";
import { Suspense } from "react";
import DetailsSekeleton from "components/skeleton/details";
import NavbarSkeleton from "components/skeleton/navbar";
let product = null;
function page({ params: { productId, lang } }) {
  let slug = productId;
  return (
    <>
      <Suspense fallback={<NavbarSkeleton noCategory={true} />}>
        <CustomNavbarServer lang={lang} />
      </Suspense>

      <div className="product-details-container">
        <Suspense fallback={<DetailsSekeleton />}>
          <ProductDetailsSlider slug={slug} product={product} />
          <ProductFooterSection slug={slug} product={product} />
        </Suspense>
      </div>
    </>
  );
}

export default page;
