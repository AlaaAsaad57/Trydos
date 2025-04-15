import React from "react";
import "styles/product-body.css";
import ProductDetailsText from "./ProductDetailsText";
import ProductProperties from "./ProductProperties";
import ProductDescriptors from "./ProductDescriptors";
import ProductColors from "./ProductColors";
import ProductSizes from "./ProductSizes";
// import CameraShots from "./CameraShots";
import ProductStories from "./ProductStories";

const ProductShippingOption = dynamic(() => import("./ProductShippingOption"), {
  ssr: false,
});
import FreeReturnOption from "./FreeReturnOption";
import FreeShippingOption from "./FreeShippingOption";

import CameraShots from "./CameraShots";
import ProductViews from "./ProductViews";
import dynamic from "node_modules/next/dynamic";

function ProuctDetailsBody({ product, lang }) {
  return (
    <div className="product-details-body flex-row relative">
      <ProductViews
        product={{
          name: product.name,
          id: product.id,
          categories: product.categories,
        }}
      />

      <div className="product-info-section flex-col align-start">
        <div className="product-brand-logo">
          {product?.brand?.icon && (
            <img
              width={"auto"}
              height={18}
              src={product.brand.icon}
              alt={product.brand.name}
            />
          )}
        </div>
        <div className="product-text-section flex-row align-center">
          <div className="product-name" data-cy="productName_productPage">
            {product.name}
          </div>
          <div className="product-category">
            {product?.category?.icon && (
              <img
                width={15}
                height={15}
                src={product.category.icon}
                alt={product.category.name}
              />
            )}
          </div>
          <span className="separtor">|</span>

          <div className="product-category-name">{product.category?.name}</div>
        </div>

        <ProductDetailsText product={product} details={product.details} />
        <ProductProperties lang={lang} />
        <ProductDescriptors descriptors={product.descriptors} />
        <ProductColors
          colors={product.sync_color_images || []}
          ProductColorsArray={product.colors}
        />
        <CameraShots images={product?.images || []} />
        <ProductStories />
        <ProductSizes
          sizes={
            product?.choice_options?.filter((s) => s.title == "Size")[0]
              ?.options || []
          }
        />
        <ProductShippingOption />
        {product.shipping_cost === 0 && <FreeShippingOption lang={lang} />}
        <FreeReturnOption lang={lang} />
      </div>
    </div>
  );
}

export default ProuctDetailsBody;
